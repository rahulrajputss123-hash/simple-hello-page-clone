import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { TaskFrequency, TaskType } from "./types";

export type AdminTaskInput = {
  id?: string | undefined;
  title: string;
  description: string;
  icon: string;
  imageUrl?: string | null | undefined;
  reward: number;
  taskType: TaskType;
  target: number;
  frequency: TaskFrequency;
  windowDays?: number | null | undefined;
  startsAt?: string | null | undefined;
  endsAt?: string | null | undefined;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  /** Only used when taskType === 'offerwall_earning'. */
  earningTarget?: number | null | undefined;
  /** Only used when taskType === 'offerwall_earning'. null = all providers. */
  earningProviderId?: string | null | undefined;
};

export async function listAdminTasksImpl(filters: {
  status?: "all" | "active" | "inactive";
  taskType?: string;
}) {
  let query = supabaseAdmin.from("tasks").select("*").order("sort_order").order("created_at");
  if (filters.status === "active") query = query.eq("is_active", true);
  if (filters.status === "inactive") query = query.eq("is_active", false);
  if (filters.taskType && filters.taskType !== "all") query = query.eq("task_type", filters.taskType);

  const tasks = await query;
  if (tasks.error) throw new Error("Could not load tasks.");

  const stats = await supabaseAdmin.from("user_tasks").select("task_id, status, reward_status");
  const byTask = new Map<string, { participants: number; completed: number; paid: number }>();
  for (const row of stats.data ?? []) {
    const entry = byTask.get(row.task_id) ?? { participants: 0, completed: 0, paid: 0 };
    entry.participants += 1;
    if (row.status === "completed") entry.completed += 1;
    if ((row as { reward_status?: string }).reward_status === "paid") entry.paid += 1;
    byTask.set(row.task_id, entry);
  }

  return (tasks.data ?? []).map((task) => ({
    ...task,
    stats: byTask.get(task.id) ?? { participants: 0, completed: 0, paid: 0 },
  }));
}

export async function upsertAdminTaskImpl(input: AdminTaskInput) {
  const row = {
    title: input.title,
    description: input.description,
    icon: input.icon,
    image_url: input.imageUrl ?? null,
    reward: input.reward,
    task_type: input.taskType,
    target: input.target,
    steps_total: Math.max(1, input.target),
    frequency: input.frequency,
    window_days: input.windowDays ?? null,
    starts_at: input.startsAt || null,
    ends_at: input.endsAt || null,
    sort_order: input.sortOrder,
    is_active: input.isActive,
    is_featured: input.isFeatured,
    // offerwall_earning-specific fields; null for all other task types.
    earning_target:
      input.taskType === "offerwall_earning" ? (input.earningTarget ?? null) : null,
    earning_provider_id:
      input.taskType === "offerwall_earning" ? (input.earningProviderId ?? null) : null,
  };

  const result = input.id
    ? await supabaseAdmin.from("tasks").update(row).eq("id", input.id).select("*").single()
    : await supabaseAdmin.from("tasks").insert(row).select("*").single();
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function setAdminTaskActiveImpl(id: string, isActive: boolean) {
  const res = await supabaseAdmin.from("tasks").update({ is_active: isActive }).eq("id", id);
  if (res.error) throw new Error("Could not update that task.");
  return { ok: true };
}

export async function deleteAdminTaskImpl(id: string) {
  const paid = await supabaseAdmin
    .from("user_tasks")
    .select("id", { count: "exact", head: true })
    .eq("task_id", id)
    .eq("reward_status", "paid");
  if ((paid.count ?? 0) > 0) {
    // Keep the reward audit trail intact; retire the task instead.
    await supabaseAdmin.from("tasks").update({ is_active: false }).eq("id", id);
    return { ok: true, deactivatedInstead: true };
  }
  const res = await supabaseAdmin.from("tasks").delete().eq("id", id);
  if (res.error) throw new Error("Could not delete that task.");
  return { ok: true, deactivatedInstead: false };
}
