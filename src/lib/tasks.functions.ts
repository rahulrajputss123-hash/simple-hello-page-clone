import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TASK_FREQUENCIES, TASK_TYPES } from "./tasks/types";

const taskInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(""),
  icon: z.string().trim().max(40).default("target"),
  imageUrl: z.string().trim().max(500).nullable().optional(),
  reward: z.number().min(0).max(10000),
  taskType: z.enum(TASK_TYPES),
  target: z.number().int().min(1).max(100000),
  frequency: z.enum(TASK_FREQUENCIES),
  windowDays: z.number().int().min(1).max(365).nullable().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  sortOrder: z.number().int().min(-1000).max(1000).default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  // offerwall_earning-specific fields; ignored for all other task types.
  earningTarget: z.number().min(0.01).max(100_000).nullable().optional(),
  earningProviderId: z.string().uuid().nullable().optional(),
});

export const listAdminTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        status: z.enum(["all", "active", "inactive"]).default("all"),
        taskType: z.string().max(40).default("all"),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { listAdminTasksImpl } = await import("./tasks/admin.server");
    return listAdminTasksImpl(data);
  });

export const saveAdminTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => taskInput.parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { upsertAdminTaskImpl } = await import("./tasks/admin.server");
    return upsertAdminTaskImpl(data);
  });

export const setAdminTaskActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), isActive: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { setAdminTaskActiveImpl } = await import("./tasks/admin.server");
    return setAdminTaskActiveImpl(data.id, data.isActive);
  });

export const deleteAdminTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { deleteAdminTaskImpl } = await import("./tasks/admin.server");
    return deleteAdminTaskImpl(data.id);
  });

/** Refreshes the signed-in user's automated task progress from real activity. */
export const refreshMyTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { syncUserTasks } = await import("./tasks/engine.server");
    return syncUserTasks(context.userId);
  });
