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
  questType: z.enum(["ads", "shortlink", "locker", "checkin", "network"]).default("ads"),
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
  // Network quest fields
  networkProviderIds: z.array(z.string().uuid()).max(10).default([]),
  requiredCount: z.number().int().min(1).max(10).default(3),
  minQualifyingUsd: z.number().min(0).max(100).default(0.01),
  tokenTtlHours: z.number().int().min(1).max(720).default(24),
  rewardHoldHours: z.number().int().min(0).max(720).default(0),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  // 'first_withdrawal' needs no extra field — it reads profiles.lifetime_withdrawn.
  lockType: z.enum(["none", "time", "earning", "first_withdrawal"]).default("none"),
  unlockAt: z.string().datetime({ offset: true }).nullable().optional(),
  requiredLifetimeEarned: z.number().min(0).max(100_000).nullable().optional(),
  appOnly: z.boolean().default(false),
}).refine(
  (data) => {
    // Network quest: required_count must be <= pool size
    if (data.questType === "network") {
      return data.requiredCount <= data.networkProviderIds.length;
    }
    return true;
  },
  {
    message: "Required count must be less than or equal to pool size",
    path: ["requiredCount"],
  },
);

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
 * User: ensure check-in session exists and is valid.
 * Idempotent - client should call after loading quests.
 * Handles session creation, Day 1 auto-complete, and streak evaluation.
 */
export const ensureCheckinSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        questKey: z.string().min(1).max(40),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { ensureCheckinSessionImpl } = await import("./quests.server");
    return ensureCheckinSessionImpl(context.userId, data.questKey);
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

/**
 * User: update user's timezone (client-detected via Intl API).
 * Validates timezone server-side and enforces 7-day change limit.
 * Uses service role to write profiles.timezone (not client-writable).
 */
export const updateUserTimezone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        timezone: z.string().trim().min(1).max(100),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { updateUserTimezoneImpl } = await import("./quests.server");
    return updateUserTimezoneImpl(context.userId, data.timezone);
  });

/**
 * User: open a network quest provider.
 * Generates a quest token and returns the offerwall URL.
 * Rate-limited per user.
 */
export const openQuestNetwork = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        questKey: z.string().min(1).max(40),
        providerId: z.string().uuid(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { openQuestNetworkImpl } = await import("./quests.server");
    return openQuestNetworkImpl(context.userId, data.questKey, data.providerId);
  });

/**
 * User: get network quest progress.
 * Returns provider pool with completion status.
 */
export const getNetworkQuestProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        questKey: z.string().min(1).max(40),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { getNetworkQuestProgressImpl } = await import("./quests.server");
    return getNetworkQuestProgressImpl(context.userId, data.questKey);
  });

/**
 * Start a feed quest: fetch and snapshot campaigns.
 */
export const startFeedQuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ questKey: z.string() }).parse(input)
  )
  .handler(async ({ context, data: { questKey }, request$ }) => {
    const { getActiveQuestByKey, startFeedQuestImpl } = await import("./quests.server");
    const db = supabaseAdmin as never;
    
    const quest = await getActiveQuestByKey(context.user.id, questKey);
    if (!quest) {
      throw new Error("Quest not found or not unlocked");
    }

    if (!quest.feed_kind) {
      throw new Error("Not a feed quest");
    }

    const result = await startFeedQuestImpl(db, context.user.id, questKey, quest, request$);
    
    if (!result.success) {
      throw new Error(result.reason === "unavailable" ? "Not enough campaigns available" : "Failed to start quest");
    }

    return { sessionId: result.sessionId };
  });

/**
 * Open a specific feed quest step.
 */
export const openFeedQuestStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ questKey: z.string(), step: z.number().int().min(1) }).parse(input)
  )
  .handler(async ({ context, data: { questKey, step }, request$ }) => {
    const { getActiveQuestByKey, openFeedQuestStepImpl } = await import("./quests.server");
    const db = supabaseAdmin as never;
    
    const quest = await getActiveQuestByKey(context.user.id, questKey);
    if (!quest) {
      throw new Error("Quest not found or not unlocked");
    }

    if (!quest.feed_kind) {
      throw new Error("Not a feed quest");
    }

    const result = await openFeedQuestStepImpl(db, context.user.id, questKey, step, quest, request$);
    
    if (result.error) {
      throw new Error(result.error);
    }

    return { url: result.url };
  });

/**
 * Get feed quest progress (completed steps).
 */
export const getFeedQuestProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ questKey: z.string() }).parse(input)
  )
  .handler(async ({ context, data: { questKey } }) => {
    const db = supabaseAdmin as never;
    
    // Get active session
    const { data: session } = await db
      .from("quest_sessions")
      .select("id, feed_snapshot, status")
      .eq("user_id", context.user.id)
      .eq("quest_key", questKey)
      .eq("status", "started")
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (!session) {
      return { steps: [], completed: [] };
    }

    const snapshot = session.feed_snapshot as { source: string; title: string; rewardUsd: number; backup: boolean }[];
    const mainSteps = (snapshot || []).filter((s) => !s.backup);

    // Get completions
    const { data: completions } = await db
      .from("quest_network_completions")
      .select("step_index")
      .eq("session_id", session.id)
      .eq("kind", "feed");

    const completedStepIndexes = new Set((completions || []).map((c: never) => c.step_index));

    return {
      steps: mainSteps.map((s, idx) => ({
        step: idx + 1,
        source: s.source,
        title: s.title,
        rewardUsd: s.rewardUsd,
        completed: completedStepIndexes.has(idx + 1),
      })),
      completed: Array.from(completedStepIndexes),
    };
  });
