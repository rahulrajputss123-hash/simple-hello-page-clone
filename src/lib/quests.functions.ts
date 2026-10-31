import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LOCKER_MAX_URLS, SHORTLINK_MAX_STEPS } from "./coinquest";

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
  icon: z.string().trim().max(2000).default("gift"),
  questType: z.enum(["ads", "shortlink", "locker", "checkin"]).default("ads"),
  adsRequired: z.number().int().min(0).max(500).default(0),
  rewardAmount: z.number().min(0).max(10000).default(0),
  // Step rewards: immediate credit per step (shortlink/locker/checkin only)
  stepReward: z.number().min(0).max(10000).default(0),
  // Optional per-step overrides: stepRewards[i-1] = reward for step i
  stepRewards: z.array(z.number().min(0).max(10000)).optional().nullable(),
  // Up to 10 steps. No lower bound: an incomplete quest is saveable as a draft,
  // and upsertQuestImpl forces is_active = false until it has enough links, so a
  // half-built quest can never be shown to users.
  shortlinkSteps: z.array(shortlinkStepSchema).max(SHORTLINK_MAX_STEPS).optional(),
  minSecondsPerStep: z.number().int().min(1).max(600).default(15),
  // Up to 3 ordered lockers, completed sequentially. Same draft rule as above.
  lockerUrls: z.array(z.string().trim().url().max(2000)).max(LOCKER_MAX_URLS).optional(),
  // Check-in quest fields
  totalDays: z.number().int().min(1).max(365).default(3),
  requiredActiveSeconds: z.number().int().min(0).max(86400).default(300),
  streakMode: z.enum(["consecutive", "total"]).default("consecutive"),
  graceDays: z.number().int().min(0).max(30).default(0),
  day1AutoComplete: z.boolean().default(true),
  repeatable: z.boolean().default(false),
  defaultTimezone: z.string().trim().min(1).max(100).default("Asia/Kolkata"),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  // 'first_withdrawal' needs no extra field — it reads profiles.lifetime_withdrawn.
  lockType: z.enum(["none", "time", "earning", "first_withdrawal"]).default("none"),
  unlockAt: z.string().datetime({ offset: true }).nullable().optional(),
  requiredLifetimeEarned: z.number().min(0).max(100_000).nullable().optional(),
  appOnly: z.boolean().default(false),
});

/** Public (authenticated): active quests for the starter row + featured page.
 *  Passes the requesting userId so lock state is computed per-user server-side.
 *  isNative flag filters app-only quests on web (can be spoofed — best effort).
 */
export const listActiveQuests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ isNative: z.boolean().optional().default(false) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { listActiveQuestsImpl } = await import("./quests.server");
    return listActiveQuestsImpl(context.userId, data.isNative);
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
        step: z.number().int().min(1).max(SHORTLINK_MAX_STEPS),
        isNative: z.boolean().optional().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { startShortlinkStepImpl } = await import("./quests.server");
    return startShortlinkStepImpl(context.userId, data.questKey, data.step, data.isNative);
  });

/** User: called by the /go/$key/$step return page. Validates time-check + advances / credits. */
export const completeShortlinkStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        questKey: z.string().min(1).max(40),
        step: z.number().int().min(1).max(SHORTLINK_MAX_STEPS),
        isNative: z.boolean().optional().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { completeShortlinkStepImpl } = await import("./quests.server");
    return completeShortlinkStepImpl(context.userId, data.questKey, data.step, data.isNative);
  });

/** User: start a locker quest — creates a session and returns the locker URL to open. */
export const startLockerQuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        questKey: z.string().min(1).max(40),
        isNative: z.boolean().optional().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { startLockerQuestImpl } = await import("./quests.server");
    return startLockerQuestImpl(context.userId, data.questKey, data.isNative);
  });

/**
 * User: called by /go/locker/return after AdBlueMedia redirects back.
 * Credits the most recent 'started' locker session for the given questKey.
 */
export const completeLockerQuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        questKey: z.string().min(1).max(40),
        isNative: z.boolean().optional().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { completeLockerQuestImpl } = await import("./quests.server");
    return completeLockerQuestImpl(context.userId, data.questKey, data.isNative);
  });

/**
 * User: ping active time for check-in quest.
 * Called by client every 30s while document is visible and focused.
 * Server tracks active seconds and completes day when threshold reached.
 */
export const pingActiveTime = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        questKey: z.string().min(1).max(40),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { pingActiveTimeImpl } = await import("./quests.server");
    return pingActiveTimeImpl(context.userId, data.questKey);
  });

/**
 * User: check in today (tap-only mode).
 * Completes today's day immediately if required_active_seconds = 0.
 */
export const checkInToday = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        questKey: z.string().min(1).max(40),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { checkInTodayImpl } = await import("./quests.server");
    return checkInTodayImpl(context.userId, data.questKey);
  });
