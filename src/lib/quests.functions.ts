import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const shortlinkStepSchema = z.object({
  network: z.string().trim().min(1).max(60),
  url: z.string().trim().url().max(2000),
});

const questFormSchema = z.object({
  id: z.string().uuid().optional(),
  key: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9_-]+$/i, "Key must be alphanumeric / _ / -"),
  label: z.string().trim().min(1).max(60),
  icon: z.string().trim().max(60).default("gift"),
  questType: z.enum(["ads", "shortlink"]).default("ads"),
  adsRequired: z.number().int().min(0).max(500).default(0),
  rewardAmount: z.number().min(0).max(10000).default(0),
  shortlinkSteps: z.array(shortlinkStepSchema).max(3).default([]),
  minSecondsPerStep: z.number().int().min(1).max(600).default(15),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(9999).default(0),
});

/** Public (authenticated): active quests for the starter row + featured page. */
export const listActiveQuests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { listActiveQuestsImpl } = await import("./quests.server");
    return listActiveQuestsImpl();
  });

/** Admin: full list including inactive quests. */
export const listAdminQuests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { listAdminQuestsImpl } = await import("./quests.server");
    return listAdminQuestsImpl();
  });

/** Admin: create or update a quest definition. */
export const saveQuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => questFormSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { upsertQuestImpl } = await import("./quests.server");
    return upsertQuestImpl(data);
  });

/** Admin: delete a quest definition (deactivates if it already has sessions). */
export const deleteQuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { deleteQuestImpl } = await import("./quests.server");
    return deleteQuestImpl(data.id);
  });

/** User: begin a shortlink step — sets current_step + step_issued_at on the active session. */
export const startShortlinkStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        questKey: z.string().min(1).max(40),
        step: z.number().int().min(1).max(3),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { startShortlinkStepImpl } = await import("./quests.server");
    return startShortlinkStepImpl(context.userId, data.questKey, data.step);
  });

/** User: called by the /go/$key/$step return page. Validates time-check + advances / credits. */
export const completeShortlinkStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        questKey: z.string().min(1).max(40),
        step: z.number().int().min(1).max(3),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { completeShortlinkStepImpl } = await import("./quests.server");
    return completeShortlinkStepImpl(context.userId, data.questKey, data.step);
  });
