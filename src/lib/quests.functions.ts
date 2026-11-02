import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { LOCKER_MAX_URLS, SHORTLINK_MAX_STEPS } from "./coinquest";

const shortlinkStepSchema = z.object({
  network: z.string().trim().min(1).max(60),
  url: z.string().trim().url().max(2000),
});

const questFormSchema = z
  .object({
    id: z.string().uuid().optional(),
    key: z
      .string()
      .trim()
      .min(2)
      .max(40)
      .regex(/^[a-z0-9_-]+$/i, "Key must be alphanumeric / _ / -"),
    label: z.string().trim().min(1).max(60),
    icon: z.string().trim().max(2000).default("gift"),
    questType: z
      .enum([
        "ads",
        "shortlink",
        "locker",
        "checkin",
        "network",
        "survey",
        "feed_ptc",
        "feed_shortlink",
        "feed_article",
        "timed_ptc",
      ])
      .default("ads"),
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
    // Survey quest fields
    requiredSurveys: z.number().int().min(1).max(10).default(5),
    allowedNetworks: z
      .array(z.enum(["cpxresearch", "theoremreach", "timewall"]))
      .min(1)
      .default(["cpxresearch", "theoremreach", "timewall"]),
    minPayoutUsd: z.number().min(0).max(100).default(0.5),
    maxLoi: z.number().int().min(1).max(120).nullable().optional(),
    // Feed quest fields (Top PTC, Top Shortlinks, Top Articles)
    feedKind: z.enum(["ptc", "shortlink", "article"]).nullable().optional(),
    stepsCount: z.number().int().min(1).max(20).default(10),
    backupCount: z.number().int().min(0).max(10).default(4),
    feedProviderIds: z.array(z.string().uuid()).max(10).default([]),
    minRewardUsd: z.number().min(0).max(100).default(0.1),
    minCompletionRate: z.number().int().min(0).max(100).default(50),
    maxPerNetwork: z.number().int().min(1).max(20).nullable().optional(),
    blockedDomains: z.array(z.string().trim().max(200)).max(100).default([]),
    // Timed PTC quest fields
    timedSteps: z
      .array(
        z.object({
          ad_network: z.string().trim().min(1).max(60),
          push_network: z.string().trim().min(1).max(60),
        }),
      )
      .max(10)
      .optional(),
    timedStepSeconds: z.number().int().min(10).max(600).default(60),
    timedCheckpointSeconds: z.number().int().min(5).max(120).default(10),
    timedMaxFailedTaps: z.number().int().min(1).max(5).default(2),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().min(0).max(9999).default(0),
    // 'first_withdrawal' needs no extra field — it reads profiles.lifetime_withdrawn.
    lockType: z.enum(["none", "time", "earning", "first_withdrawal"]).default("none"),
    unlockAt: z.string().datetime({ offset: true }).nullable().optional(),
    requiredLifetimeEarned: z.number().min(0).max(100_000).nullable().optional(),
    appOnly: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // Network quest: required_count must be <= pool size
      if (data.questType === "network") {
        return data.requiredCount <= data.networkProviderIds.length;
      }
      // Survey quest: must have at least one allowed network
      if (data.questType === "survey") {
        return data.allowedNetworks && data.allowedNetworks.length > 0;
      }
      return true;
    },
    {
      message:
        "Network quest: required count must be <= pool size. Survey quest: at least one network must be selected.",
      path: ["requiredCount", "allowedNetworks"],
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

/** User: begin a timed PTC step — sets issued_step + step_issued_at on the active session. */
export const startTimedPtcStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        questKey: z.string().min(1).max(40),
        step: z.number().int().min(1).max(10),
        isNative: z.boolean().optional().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { startTimedPtcStepImpl } = await import("./quests/timed-ptc.server");
    return startTimedPtcStepImpl(context.userId, data.questKey, data.step, data.isNative);
  });

/** User: complete a timed PTC step. Validates elapsed time, checkpoints, advances / credits. */
export const completeTimedPtcStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        questKey: z.string().min(1).max(40),
        step: z.number().int().min(1).max(10),
        checkpointsDone: z.number().int().min(0).max(100),
        isNative: z.boolean().optional().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { completeTimedPtcStepImpl } = await import("./quests/timed-ptc.server");
    return completeTimedPtcStepImpl(
      context.userId,
      data.questKey,
      data.step,
      data.checkpointsDone,
      data.isNative,
    );
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
  .inputValidator((input: unknown) => z.object({ questKey: z.string() }).parse(input))
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
      throw new Error(
        result.reason === "unavailable"
          ? "Not enough campaigns available"
          : "Failed to start quest",
      );
    }

    return { sessionId: result.sessionId };
  });

/**
 * Open a specific feed quest step.
 */
export const openFeedQuestStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ questKey: z.string(), step: z.number().int().min(1) }).parse(input),
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

    const result = await openFeedQuestStepImpl(
      db,
      context.user.id,
      questKey,
      step,
      quest,
      request$,
    );

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
  .inputValidator((input: unknown) => z.object({ questKey: z.string() }).parse(input))
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

    const snapshot = session.feed_snapshot as {
      source: string;
      title: string;
      rewardUsd: number;
      backup: boolean;
    }[];
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

/**
 * User: fetch survey feed for a survey quest.
 * Returns mixed list of surveys from allowed networks (CPX, TheoremReach, Timewall).
 * Requires Request context for IP and User-Agent headers.
 */
export const fetchSurveyFeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        questKey: z.string().min(1).max(40),
        sessionId: z.string().uuid(),
      })
      .parse(input),
  )
  .handler(async ({ data, context, request$ }) => {
    const { getActiveQuestByKey } = await import("./quests.server");
    const { fetchSurveyFeed: fetchSurveyFeedImpl } = await import("./surveys/survey-feed.server");

    // Get quest configuration
    const quest = await getActiveQuestByKey(context.userId, data.questKey);
    if (!quest) {
      throw new Error("Quest not found or not unlocked");
    }

    if (quest.quest_type !== "survey") {
      throw new Error("Not a survey quest");
    }

    // Extract IP and User-Agent from request
    const headers = await request$.headers;
    const ip =
      headers.get("cf-connecting-ip") ||
      headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headers.get("x-real-ip") ||
      "0.0.0.0";
    const userAgent = headers.get("user-agent") || "Mozilla/5.0";

    // Get country code from Cloudflare header or default
    const countryCode = headers.get("cf-ipcountry") || "US";

    // Fetch surveys from allowed networks
    const surveys = await fetchSurveyFeedImpl({
      userId: context.userId,
      sessionId: data.sessionId,
      ip,
      countryCode,
      userAgent,
      allowedNetworks: quest.allowed_networks as ("cpxresearch" | "theoremreach" | "timewall")[],
      minPayoutUsd: quest.min_payout_usd || undefined,
      maxLoi: quest.max_loi || undefined,
    });

    return { surveys };
  });

/**
 * User: start a survey quest session.
 * Creates a new session and returns the session ID.
 */
export const startSurveyQuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        questKey: z.string().min(1).max(40),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { getActiveQuestByKey } = await import("./quests.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const quest = await getActiveQuestByKey(context.userId, data.questKey);
    if (!quest) {
      throw new Error("Quest not found or not unlocked");
    }

    if (quest.quest_type !== "survey") {
      throw new Error("Not a survey quest");
    }

    // Check if there's already an active session
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabaseAdmin as unknown as { from: (t: string) => any };
    const { data: existingSession } = await db
      .from("quest_sessions")
      .select("id")
      .eq("user_id", context.userId)
      .eq("quest_key", data.questKey)
      .eq("status", "started")
      .maybeSingle();

    if (existingSession) {
      return { sessionId: existingSession.id };
    }

    // Create new session
    const { data: newSession, error } = await db
      .from("quest_sessions")
      .insert({
        user_id: context.userId,
        quest_key: data.questKey,
        quest_type: "survey",
        status: "started",
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(`Failed to create survey quest session: ${error.message}`);
    }

    return { sessionId: newSession.id };
  });

/**
 * User: get survey quest progress.
 * Returns completed survey count and required count.
 */
export const getSurveyQuestProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        questKey: z.string().min(1).max(40),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { getActiveQuestByKey } = await import("./quests.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const quest = await getActiveQuestByKey(context.userId, data.questKey);
    if (!quest) {
      throw new Error("Quest not found or not unlocked");
    }

    if (quest.quest_type !== "survey") {
      throw new Error("Not a survey quest");
    }

    // Get active session
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabaseAdmin as unknown as { from: (t: string) => any };
    const { data: session } = await db
      .from("quest_sessions")
      .select("id, status")
      .eq("user_id", context.userId)
      .eq("quest_key", data.questKey)
      .in("status", ["started", "verified"])
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (!session) {
      return {
        completed: 0,
        required: quest.required_surveys,
        isComplete: false,
      };
    }

    // Count completed surveys from quest_step_credits
    const { data: credits } = await db
      .from("quest_step_credits")
      .select("step_index")
      .eq("session_id", session.id);

    const completedCount = (credits || []).length;

    return {
      completed: completedCount,
      required: quest.required_surveys,
      isComplete: session.status === "verified",
    };
  });

/** Admin: list enabled SDK offerwall providers for quest configuration. */
export const listSdkProvidersForQuests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);

    const { data, error } = await supabaseAdmin
      .from("sdk_offerwall_providers")
      .select("id, name, slug, enabled, status")
      .eq("enabled", true)
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  });
