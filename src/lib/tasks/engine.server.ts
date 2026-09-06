import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { creditWallet } from "../coinquest.server";
import {
  periodKey,
  periodStart,
  TASK_TYPE_EVENT,
  type TaskEventType,
  type TaskFrequency,
  type TaskType,
} from "./types";

type TaskRow = {
  id: string;
  title: string;
  reward: number;
  target: number;
  steps_total: number;
  task_type: TaskType;
  frequency: TaskFrequency;
  window_days: number | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  /** Dollar amount target — only set for offerwall_earning tasks. */
  earning_target: number | null;
  /** Scope to one SDK offerwall provider; null = combined across all. */
  earning_provider_id: string | null;
};

/**
 * Appends a real activity event. Duplicate (user, type, key) tuples are ignored,
 * which is what keeps reward crediting exactly-once when a webhook or callback
 * is replayed.
 */
export async function recordTaskEvent(input: {
  userId: string;
  eventType: TaskEventType;
  eventKey: string;
  quantity?: number;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
  /** Optional: set for offerwall_earning events to enable per-provider scoping. */
  providerId?: string;
}) {
  const insert = await supabaseAdmin
    .from("task_events")
    .upsert(
      {
        user_id: input.userId,
        event_type: input.eventType,
        event_key: input.eventKey,
        quantity: input.quantity ?? 1,
        metadata: (input.metadata ?? {}) as never,
        ...(input.occurredAt ? { occurred_at: input.occurredAt } : {}),
        // Only written for offerwall_earning events; null for all other types.
        ...(input.providerId ? { provider_id: input.providerId } : {}),
      },
      { onConflict: "user_id,event_type,event_key", ignoreDuplicates: true },
    )
    .select("id");
  // No new row => already processed; still safe to re-sync (award is guarded).
  await syncUserTasks(input.userId, input.eventType);
  return { recorded: Boolean(insert.data?.length) };
}

async function countProgress(userId: string, task: TaskRow, from: Date): Promise<number> {
  const eventType = TASK_TYPE_EVENT[task.task_type];
  if (!eventType) return 0;

  if (eventType === "referral") {
    // Reuses the existing referral records — no second counting system.
    const res = await supabaseAdmin
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", userId)
      .gte("created_at", from.toISOString());
    return res.count ?? 0;
  }

  if (eventType === "offerwall_earning") {
    // Sum the dollar quantity of offerwall_earning events within the period.
    // When the task is scoped to a specific provider, filter by provider_id;
    // when earning_provider_id is null, sum across all SDK offerwall providers.
    let q = supabaseAdmin
      .from("task_events")
      .select("quantity")
      .eq("user_id", userId)
      .eq("event_type", "offerwall_earning")
      .gte("occurred_at", from.toISOString());
    if (task.earning_provider_id) {
      q = q.eq("provider_id", task.earning_provider_id);
    }
    const res = await q;
    return (res.data ?? []).reduce((sum, row) => sum + Number(row.quantity), 0);
  }

  const res = await supabaseAdmin
    .from("task_events")
    .select("quantity")
    .eq("user_id", userId)
    .eq("event_type", eventType)
    .gte("occurred_at", from.toISOString());
  return (res.data ?? []).reduce((sum, row) => sum + Number(row.quantity), 0);
}

/** Recomputes automated task progress for one user and pays finished tasks once. */
export async function syncUserTasks(userId: string, eventType?: TaskEventType) {
  const now = new Date();
  const tasks = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("is_active", true)
    .neq("task_type", "manual");
  if (tasks.error || !tasks.data) return { updated: 0 };

  let updated = 0;
  for (const raw of tasks.data as unknown as TaskRow[]) {
    if (eventType && TASK_TYPE_EVENT[raw.task_type] !== eventType) continue;
    if (raw.starts_at && new Date(raw.starts_at) > now) continue;
    if (raw.ends_at && new Date(raw.ends_at) < now) continue;

    const key = periodKey(raw.frequency, now);
    // offerwall_earning tasks compare dollar progress against earning_target;
    // all other task types use the integer target / steps_total as before.
    const target =
      raw.task_type === "offerwall_earning" && raw.earning_target != null
        ? Number(raw.earning_target)
        : Math.max(1, Number(raw.target || raw.steps_total || 1));
    const progress = Math.min(await countProgress(userId, raw, periodStart(raw, now)), target);
    const completed = progress >= target;

    const existing = await supabaseAdmin
      .from("user_tasks")
      .select("id, reward_status, progress")
      .eq("user_id", userId)
      .eq("task_id", raw.id)
      .eq("period_key", key)
      .maybeSingle();

    if (!existing.data) {
      await supabaseAdmin.from("user_tasks").insert({
        user_id: userId,
        task_id: raw.id,
        period_key: key,
        progress,
        target,
        status: completed ? "completed" : "active",
        completed_at: completed ? now.toISOString() : null,
      });
    } else {
      await supabaseAdmin
        .from("user_tasks")
        .update({
          progress,
          target,
          status: completed ? "completed" : "active",
          completed_at: completed ? (now.toISOString() as string) : null,
        })
        .eq("id", existing.data.id);
    }
    updated += 1;

    if (!completed) continue;

    // Exactly-once payout: only the update that flips pending -> paid credits.
    const claimed = await supabaseAdmin
      .from("user_tasks")
      .update({ reward_status: "paid", rewarded_at: now.toISOString() })
      .eq("user_id", userId)
      .eq("task_id", raw.id)
      .eq("period_key", key)
      .eq("reward_status", "pending")
      .select("id");
    if (!claimed.data?.length) continue;

    const reward = Number(raw.reward);
    if (reward > 0) {
      await creditWallet(userId, reward, "task", raw.title);
      await supabaseAdmin.from("notifications").insert({
        user_id: userId,
        title: "Task completed",
        body: `${raw.title} — $${reward.toFixed(2)} added to your wallet.`,
        kind: "task",
      });
    }
  }
  return { updated };
}
