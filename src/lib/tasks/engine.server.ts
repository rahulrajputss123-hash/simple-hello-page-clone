import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { creditWallet } from "../coinquest.server";
import { assertNotLocked, computeLockState, type LockState } from "../lock-state";
import {
  periodKey,
  periodStart,
  TASK_TYPE_EVENT,
  type TaskEventType,
  type TaskFrequency,
  type TaskLockType,
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
  lock_type: TaskLockType | null;
  unlock_at: string | null;
};

/**
 * Lock state for a task. Tasks have no 'earning' lock, so lifetime_earned is
 * passed as 0 — it is never read for the 'time' or 'first_withdrawal' branches.
 */
export function computeTaskLockState(
  task: Pick<TaskRow, "lock_type" | "unlock_at">,
  lifetimeWithdrawn: number,
  nowIso?: string,
): LockState {
  return computeLockState(
    task.lock_type ?? "none",
    task.unlock_at,
    null,
    0,
    lifetimeWithdrawn,
    nowIso,
  );
}

async function fetchLifetimeWithdrawn(userId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("lifetime_withdrawn")
    .eq("id", userId)
    .maybeSingle();
  return Number(data?.lifetime_withdrawn ?? 0);
}

/**
 * Server-side lock enforcement for tasks — the task counterpart of
 * assertQuestNotLocked. Call before recording progress or crediting a reward.
 */
export async function assertTaskNotLocked(
  userId: string,
  task: { title: string; lock_type?: string | null; unlock_at?: string | null },
): Promise<void> {
  const lockType = task.lock_type ?? "none";
  if (lockType === "none") return;
  const lifetimeWithdrawn = await fetchLifetimeWithdrawn(userId);
  const state = computeTaskLockState(
    { lock_type: lockType as TaskLockType, unlock_at: task.unlock_at ?? null },
    lifetimeWithdrawn,
  );
  assertNotLocked(state, task.title);
}

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
  console.log("[tasks] countProgress START", { 
    userId, 
    taskId: task.id,
    taskType: task.task_type, 
    eventType,
    fromDate: from.toISOString(),
    earningProviderId: task.earning_provider_id
  });
  
  if (!eventType) {
    console.log("[tasks] countProgress - no event type mapping");
    return 0;
  }

  if (eventType === "referral") {
    // Reuses the existing referral records — no second counting system.
    const res = await supabaseAdmin
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", userId)
      .gte("created_at", from.toISOString());
    console.log("[tasks] countProgress - referral count", { count: res.count });
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
      console.log("[tasks] countProgress - filtering by provider_id", { providerId: task.earning_provider_id });
      q = q.eq("provider_id", task.earning_provider_id);
    } else {
      console.log("[tasks] countProgress - counting ALL providers (earning_provider_id is NULL)");
    }
    const res = await q;
    const total = (res.data ?? []).reduce((sum, row) => sum + Number(row.quantity), 0);
    // Round to 4 decimals to avoid float drift (e.g., 0.0999999)
    const rounded = Math.round(total * 10000) / 10000;
    console.log("[tasks] countProgress - offerwall_earning sum", { 
      eventCount: res.data?.length ?? 0,
      total: rounded,
      events: res.data?.map(e => ({ quantity: e.quantity }))
    });
    return rounded;
  }

  const res = await supabaseAdmin
    .from("task_events")
    .select("quantity")
    .eq("user_id", userId)
    .eq("event_type", eventType)
    .gte("occurred_at", from.toISOString());
  const total = (res.data ?? []).reduce((sum, row) => sum + Number(row.quantity), 0);
  // Round to 4 decimals to avoid float drift
  const rounded = Math.round(total * 10000) / 10000;
  console.log("[tasks] countProgress - generic event count", { 
    eventType,
    eventCount: res.data?.length ?? 0,
    total: rounded
  });
  return rounded;
}

/** Recomputes automated task progress for one user and pays finished tasks once. */
export async function syncUserTasks(userId: string, eventType?: TaskEventType) {
  console.log("[tasks] syncUserTasks START", { userId, eventType });
  const now = new Date();
  const tasks = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("is_active", true)
    .neq("task_type", "manual");
  if (tasks.error || !tasks.data) {
    console.log("[tasks] syncUserTasks - failed to fetch tasks", { error: tasks.error });
    return { updated: 0 };
  }
  console.log("[tasks] syncUserTasks - fetched tasks", { 
    count: tasks.data.length,
    taskTypes: tasks.data.map((t: any) => ({ id: t.id, type: t.task_type, title: t.title }))
  });

  // Only fetched when some task actually carries a lock, so the unlocked case
  // costs no extra query.
  const anyLocked = (tasks.data as unknown as TaskRow[]).some(
    (t) => (t.lock_type ?? "none") !== "none",
  );
  const lifetimeWithdrawn = anyLocked ? await fetchLifetimeWithdrawn(userId) : 0;

  let updated = 0;
  for (const raw of tasks.data as unknown as TaskRow[]) {
    const taskEventType = TASK_TYPE_EVENT[raw.task_type];
    console.log("[tasks] evaluating task", { 
      taskId: raw.id, 
      title: raw.title, 
      taskType: raw.task_type,
      taskEventType,
      filterEventType: eventType,
      frequency: raw.frequency,
      earningTarget: raw.earning_target,
      earningProviderId: raw.earning_provider_id
    });
    
    if (eventType && taskEventType !== eventType) {
      console.log("[tasks] SKIP - event type mismatch", { taskEventType, filterEventType: eventType });
      continue;
    }
    if (raw.starts_at && new Date(raw.starts_at) > now) {
      console.log("[tasks] SKIP - task hasn't started yet", { startsAt: raw.starts_at });
      continue;
    }
    if (raw.ends_at && new Date(raw.ends_at) < now) {
      console.log("[tasks] SKIP - task already ended", { endsAt: raw.ends_at });
      continue;
    }
    // Locked tasks accrue no progress and are never credited. Skipping (rather
    // than throwing) is right here: this runs as a batch sync over every task,
    // so one locked task must not abort the rest.
    const lockState = computeTaskLockState(raw, lifetimeWithdrawn, now.toISOString());
    if (lockState.is_locked) {
      console.log("[tasks] SKIP - task is locked", { lockType: raw.lock_type, unlockAt: raw.unlock_at });
      continue;
    }

    const key = periodKey(raw.frequency, now);
    // offerwall_earning tasks compare dollar progress against earning_target;
    // all other task types use the integer target / steps_total as before.
    const target =
      raw.task_type === "offerwall_earning" && raw.earning_target != null
        ? Number(raw.earning_target)
        : Math.max(1, Number(raw.target || raw.steps_total || 1));
    const periodStartDate = periodStart(raw, now);
    const progress = Math.min(await countProgress(userId, raw, periodStartDate), target);
    const completed = progress >= target;

    console.log("[tasks] computed progress", {
      taskId: raw.id,
      title: raw.title,
      periodKey: key,
      periodStartDate: periodStartDate.toISOString(),
      target,
      progress,
      completed,
      earningProviderId: raw.earning_provider_id
    });

    const existing = await supabaseAdmin
      .from("user_tasks")
      .select("id, reward_status, progress")
      .eq("user_id", userId)
      .eq("task_id", raw.id)
      .eq("period_key", key)
      .maybeSingle();

    console.log("[tasks] existing user_task", { 
      exists: Boolean(existing.data), 
      userTaskId: existing.data?.id,
      oldProgress: existing.data?.progress,
      rewardStatus: existing.data?.reward_status
    });

    let userTaskId: string | null = existing.data?.id ?? null;
    let rewardStatus: string = existing.data?.reward_status ?? "pending";
    if (!existing.data) {
      const inserted = await supabaseAdmin
        .from("user_tasks")
        .insert({
          user_id: userId,
          task_id: raw.id,
          period_key: key,
          progress,
          target,
          status: completed ? "completed" : "active",
          completed_at: completed ? now.toISOString() : null,
        })
        .select("id, reward_status")
        .maybeSingle();
      userTaskId = inserted.data?.id ?? null;
      rewardStatus = inserted.data?.reward_status ?? "pending";
      console.log("[tasks] INSERTED user_task", { 
        userTaskId, 
        progress, 
        target, 
        status: completed ? "completed" : "active",
        error: inserted.error 
      });
    } else {
      const updated = await supabaseAdmin
        .from("user_tasks")
        .update({
          progress,
          target,
          status: completed ? "completed" : "active",
          completed_at: completed ? (now.toISOString() as string) : null,
        })
        .eq("id", existing.data.id);
      console.log("[tasks] UPDATED user_task", { 
        userTaskId: existing.data.id, 
        newProgress: progress, 
        newStatus: completed ? "completed" : "active",
        error: updated.error
      });
    }
    updated += 1;

    if (!completed) continue;
    if (rewardStatus === "paid" || !userTaskId) continue;

    // Exactly-once payout: credit FIRST, keyed on the user_tasks row id
    // (idempotent), then flip pending -> paid. Overlapping syncs can both get
    // here, but only one credit lands; and if the credit fails the row stays
    // 'pending', so the next sync retries it instead of losing the reward.
    const reward = Number(raw.reward);
    if (reward > 0) {
      let credit: Awaited<ReturnType<typeof creditWallet>>;
      try {
        credit = await creditWallet(userId, reward, "task", raw.title, "earned", userTaskId);
      } catch (error) {
        console.error("[tasks] reward credit failed; will retry on next sync", {
          userId,
          taskId: raw.id,
          error,
        });
        continue;
      }
      if (!credit.duplicate) {
        await supabaseAdmin.from("notifications").insert({
          user_id: userId,
          title: "Task completed",
          body: `${raw.title} — $${reward.toFixed(2)} added to your wallet.`,
          kind: "task",
        });
      }
    }
    await supabaseAdmin
      .from("user_tasks")
      .update({ reward_status: "paid", rewarded_at: now.toISOString() })
      .eq("id", userTaskId)
      .eq("reward_status", "pending");
  }
  console.log("[tasks] syncUserTasks COMPLETE", { userId, eventType, updated });
  return { updated };
}
