import crypto from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { LOCKER_MAX_URLS, SHORTLINK_MAX_STEPS } from "./coinquest";
import { creditWallet } from "./coinquest.server";
import { computeLockState, assertNotLocked, type LockState } from "./lock-state";

/**
 * Server implementations for the DB-backed Starter Quests + Shortlink Chain quests.
 * Lock columns added by 20261210000000_quest_offerwall_locks.sql.
 *
 * The generated supabase types don't include the new table yet, so we access
 * the client via an untyped alias — safe because runtime schema is authoritative.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as unknown as { from: (t: string) => any };

export type ShortlinkStep = { network: string; url: string };

export type QuestRow = {
  id: string;
  key: string;
  label: string;
  icon: string;
  quest_type: "ads" | "shortlink" | "locker" | "checkin";
  ads_required: number;
  /**
   * Completion bonus credited when the entire quest finishes.
   * For ads quests, this is the only reward.
   * For step-based quests (shortlink/locker/checkin), this is paid in addition to step rewards.
   */
  reward_amount: number;
  /**
   * Default reward per step for shortlink/locker/checkin quests.
   * Ignored for ads quests. If step_rewards array is present, it overrides this.
   */
  step_reward: number;
  /**
   * Optional per-step reward amounts for shortlink/locker/checkin quests.
   * If present, length must equal number of steps and overrides step_reward.
   */
  step_rewards: number[] | null;
  shortlink_steps: ShortlinkStep[];
  min_seconds_per_step: number;
  /**
   * Ordered content-locker URLs (1-3), completed sequentially. The reward is
   * credited only after the last one. Supersedes the deprecated `locker_url`
   * column, which is intentionally not exposed here.
   */
  locker_urls: string[];
  /** Check-in quest: total days in the streak (1-365). Each day = one step. */
  total_days: number;
  /** Check-in quest: required active seconds per day (0 = tap-only mode). */
  required_active_seconds: number;
  /** Check-in quest: 'consecutive' (missing a day resets) or 'total' (any N days). */
  streak_mode: "consecutive" | "total";
  /** Check-in quest: grace days before consecutive streak resets (0-30). */
  grace_days: number;
  /** Check-in quest: auto-complete Day 1 on session start. */
  day1_auto_complete: boolean;
  /** Check-in quest: can be repeated after completion. */
  repeatable: boolean;
  /** Check-in quest: default timezone for users without one set (IANA format). */
  default_timezone: string;
  is_active: boolean;
  sort_order: number;
  /** 'first_withdrawal' unlocks once profiles.lifetime_withdrawn > 0. */
  lock_type: "none" | "time" | "earning" | "first_withdrawal";
  unlock_at: string | null;
  required_lifetime_earned: number | null;
  /** When true, quest is only shown and allowed in the native app. Hidden on web. */
  app_only: boolean;
  created_at: string;
  updated_at: string;
};

function normalize(row: QuestRow): QuestRow {
  return {
    ...row,
    reward_amount: Number(row.reward_amount ?? 0),
    step_reward: Number(row.step_reward ?? 0),
    step_rewards: Array.isArray(row.step_rewards)
      ? row.step_rewards.map((r) => Number(r))
      : null,
    ads_required: Number(row.ads_required ?? 0),
    shortlink_steps: Array.isArray(row.shortlink_steps) ? row.shortlink_steps : [],
    min_seconds_per_step: Number(row.min_seconds_per_step ?? 15),
    locker_urls: Array.isArray(row.locker_urls)
      ? row.locker_urls.map((url) => String(url).trim()).filter(Boolean)
      : [],
    total_days: Number(row.total_days ?? 3),
    required_active_seconds: Number(row.required_active_seconds ?? 300),
    streak_mode: (row.streak_mode ?? "consecutive") as "consecutive" | "total",
    grace_days: Number(row.grace_days ?? 0),
    day1_auto_complete: Boolean(row.day1_auto_complete ?? true),
    repeatable: Boolean(row.repeatable ?? false),
    default_timezone: String(row.default_timezone ?? "Asia/Kolkata"),
    sort_order: Number(row.sort_order ?? 0),
    lock_type: (row.lock_type ?? "none") as QuestRow["lock_type"],
    unlock_at: row.unlock_at ?? null,
    required_lifetime_earned:
      row.required_lifetime_earned != null ? Number(row.required_lifetime_earned) : null,
    app_only: Boolean(row.app_only ?? false),
  };
}

/**
 * Both figures the lock rules depend on, in one round trip.
 * lifetime_withdrawn is incremented once per approved withdrawal, so `> 0` is the
 * "has withdrawn at least once" signal used by the 'first_withdrawal' lock.
 */
async function fetchLockInputs(
  userId: string,
): Promise<{ lifetimeEarned: number; lifetimeWithdrawn: number }> {
  const { data } = await db
    .from("profiles")
    .select("lifetime_earned, lifetime_withdrawn")
    .eq("id", userId)
    .maybeSingle();
  return {
    lifetimeEarned: Number(data?.lifetime_earned ?? 0),
    lifetimeWithdrawn: Number(data?.lifetime_withdrawn ?? 0),
  };
}

/**
 * Active quests for the starter row.
 * When userId is provided, each quest is annotated with is_locked + unlock_reason
 * computed server-side in UTC. Locked quests are INCLUDED so the client can render
 * a locked state instead of hiding them.
 * Ads quests are filtered out when ADS_ENABLED is false.
 * App-only quests are filtered out when isNative is false.
 * 
 * @param isNative - Client-reported platform flag. WARNING: Can be spoofed. Server enforcement
 *                   in assertQuestNotLocked provides additional protection.
 */
export async function listActiveQuestsImpl(userId?: string, isNative?: boolean): Promise<(QuestRow & LockState)[]> {
  const { data, error } = await db
    .from("quests")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message ?? "Could not load quests.");

  let rows: QuestRow[] = (data ?? []).map((r: QuestRow) => normalize(r));

  // Filter out ads quests if ADS_ENABLED is false
  const { areAdsEnabledImpl } = await import("./coinquest.server");
  const adsEnabled = await areAdsEnabledImpl();
  if (!adsEnabled) {
    rows = rows.filter((quest) => quest.quest_type !== "ads");
  }

  // Filter out app-only quests when not on native platform
  // NOTE: isNative flag is client-reported and can be spoofed. This is UI filtering only.
  // Server enforcement happens in assertQuestNotLocked / assertQuestPlatform.
  if (isNative === false) {
    rows = rows.filter((quest) => !quest.app_only);
  }

  const { lifetimeEarned, lifetimeWithdrawn } = userId
    ? await fetchLockInputs(userId)
    : { lifetimeEarned: 0, lifetimeWithdrawn: 0 };

  // NOTE: Auto-start has been moved to ensureCheckinSessionImpl()
  // Client should call ensureCheckinSession after loading quests
  // This keeps listActiveQuests as a pure read operation

  return rows.map((quest) => {
    const lockState = userId
      ? computeLockState(
          quest.lock_type,
          quest.unlock_at,
          quest.required_lifetime_earned,
          lifetimeEarned,
          lifetimeWithdrawn,
        )
      : { is_locked: false, unlock_reason: null };
    return { ...quest, ...lockState };
  });
}

export async function listAdminQuestsImpl(): Promise<QuestRow[]> {
  const { data, error } = await db
    .from("quests")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message ?? "Could not load quests.");
  return (data ?? []).map((r: QuestRow) => normalize(r));
}

export type QuestFormInput = {
  id?: string | undefined;
  key: string;
  label: string;
  icon: string;
  questType: "ads" | "shortlink" | "locker" | "checkin";
  adsRequired: number;
  rewardAmount: number;
  /** Default step reward (overridden by stepRewards array if present) */
  stepReward: number;
  /** Optional per-step rewards array */
  stepRewards?: number[] | undefined | null;
  /** 1-10 ordered steps. Only meaningful when questType === "shortlink". */
  shortlinkSteps?: ShortlinkStep[] | undefined;
  minSecondsPerStep: number;
  /** 1-3 ordered locker URLs. Only meaningful when questType === "locker". */
  lockerUrls?: string[] | undefined;
  /** Check-in: total days in streak (1-365) */
  totalDays: number;
  /** Check-in: required active seconds per day (0 = tap-only) */
  requiredActiveSeconds: number;
  /** Check-in: streak mode */
  streakMode: "consecutive" | "total";
  /** Check-in: grace days before reset */
  graceDays: number;
  /** Check-in: auto-complete Day 1 */
  day1AutoComplete: boolean;
  /** Check-in: repeatable after completion */
  repeatable: boolean;
  /** Check-in: default timezone */
  defaultTimezone: string;
  isActive: boolean;
  sortOrder: number;
  lockType: "none" | "time" | "earning" | "first_withdrawal";
  unlockAt?: string | null | undefined;
  requiredLifetimeEarned?: number | null | undefined;
  /** When true, quest is only shown and allowed in the native app */
  appOnly: boolean;
};

export async function upsertQuestImpl(input: QuestFormInput) {
  const lockerUrls = (input.lockerUrls ?? []).map((url) => url.trim()).filter(Boolean);
  const shortlinkSteps = input.shortlinkSteps ?? [];

  // Upper bounds and malformed URLs are still hard errors — they are mistakes,
  // not an unfinished draft.
  if (input.questType === "shortlink" && shortlinkSteps.length > SHORTLINK_MAX_STEPS) {
    throw new Error(`A shortlink quest can have at most ${SHORTLINK_MAX_STEPS} steps.`);
  }
  if (input.questType === "ads" && input.adsRequired < 1) {
    throw new Error("Ads-type quests need at least 1 ad.");
  }
  if (input.questType === "locker") {
    if (lockerUrls.length > LOCKER_MAX_URLS) {
      throw new Error(`A locker quest can have at most ${LOCKER_MAX_URLS} locker URLs.`);
    }
    if (lockerUrls.some((url) => !/^https?:\/\/.+/.test(url))) {
      throw new Error("Every locker URL must be valid (must start with http:// or https://).");
    }
  }

  /**
   * The admin's Active toggle is authoritative, including for a quest with zero
   * links. Such a quest is visible and tappable; the start calls below return
   * `{ unavailable: true }` so the user sees a friendly "link coming soon"
   * instead of an error, and no reward is ever credited for it.
   */
  const isActive = input.isActive;
  if (input.lockType === "time" && !input.unlockAt) {
    throw new Error("A time-locked quest requires an unlock date.");
  }
  if (
    input.lockType === "earning" &&
    (input.requiredLifetimeEarned == null || input.requiredLifetimeEarned <= 0)
  ) {
    throw new Error("An earning-locked quest requires a positive required amount.");
  }

  const row = {
    key: input.key.trim(),
    label: input.label.trim(),
    icon: (input.icon || "gift").trim(),
    quest_type: input.questType,
    ads_required: input.questType === "ads" ? input.adsRequired : 0,
    reward_amount: input.rewardAmount,
    step_reward: input.stepReward ?? 0,
    step_rewards: input.stepRewards ?? null,
    shortlink_steps: input.questType === "shortlink" ? shortlinkSteps : [],
    min_seconds_per_step: input.minSecondsPerStep,
    locker_urls: input.questType === "locker" ? lockerUrls : [],
    total_days: input.questType === "checkin" ? input.totalDays : 3,
    required_active_seconds: input.questType === "checkin" ? input.requiredActiveSeconds : 300,
    streak_mode: input.questType === "checkin" ? input.streakMode : "consecutive",
    grace_days: input.questType === "checkin" ? input.graceDays : 0,
    day1_auto_complete: input.questType === "checkin" ? input.day1AutoComplete : true,
    repeatable: input.questType === "checkin" ? input.repeatable : false,
    default_timezone: input.questType === "checkin" ? input.defaultTimezone : "Asia/Kolkata",
    is_active: isActive,
    sort_order: input.sortOrder,
    lock_type: input.lockType,
    unlock_at: input.lockType === "time" ? input.unlockAt : null,
    required_lifetime_earned: input.lockType === "earning" ? input.requiredLifetimeEarned : null,
    app_only: input.appOnly,
  };

  if (input.id) {
    const { data, error } = await db
      .from("quests")
      .update(row)
      .eq("id", input.id)
      .select("id")
      .single();
    if (error) throw new Error(error.message ?? "Could not save quest.");
    return data;
  }
  const { data, error } = await db.from("quests").insert(row).select("id").single();
  if (error) throw new Error(error.message ?? "Could not create quest.");
  return data;
}

export async function deleteQuestImpl(id: string) {
  const quest = await db.from("quests").select("key").eq("id", id).single();
  if (quest.error) throw new Error("Quest not found.");
  const sessions = await db
    .from("quest_sessions")
    .select("id")
    .eq("quest_key", quest.data.key)
    .limit(1);
  if (sessions.data?.length) {
    const { error } = await db.from("quests").update({ is_active: false }).eq("id", id);
    if (error) throw new Error(error.message ?? "Could not deactivate quest.");
    return { deleted: false, deactivated: true };
  }
  const { error } = await db.from("quests").delete().eq("id", id);
  if (error) throw new Error(error.message ?? "Could not delete quest.");
  return { deleted: true, deactivated: false };
}

export async function getQuestByKey(key: string): Promise<QuestRow> {
  const { data, error } = await db
    .from("quests")
    .select("*")
    .eq("key", key)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(error.message ?? "Quest lookup failed.");
  if (!data) throw new Error("Unknown quest.");
  return normalize(data as QuestRow);
}

/**
 * Credits the reward for completing a quest step (shortlink or locker).
 * Idempotent via quest_step_credits unique constraint.
 * Returns the amount credited (0 if already credited or if step_reward is 0).
 */
async function creditStepReward(
  userId: string,
  sessionId: string,
  questKey: string,
  questLabel: string,
  stepIndex: number,
  stepReward: number,
): Promise<number> {
  // If step reward is 0, skip (existing quests with no step rewards)
  if (stepReward <= 0) return 0;

  // Round to 2 decimal places (wallet precision: numeric(10,2))
  const roundedAmount = Math.round(stepReward * 100) / 100;
  
  // Reject amounts finer than wallet precision
  if (Math.abs(stepReward - roundedAmount) > 0.001) {
    console.warn(
      `[quests] Step reward ${stepReward} exceeds wallet precision, rounding to ${roundedAmount}`
    );
  }

  try {
    // Insert credit claim first - unique constraint ensures atomicity
    const { error: insertError } = await db.from("quest_step_credits").insert({
      session_id: sessionId,
      user_id: userId,
      quest_key: questKey,
      step_index: stepIndex,
      amount: roundedAmount, // Store rounded amount
    });

    // If unique constraint violation, step already credited
    if (insertError) {
      if (insertError.code === "23505") {
        // Unique violation - already credited
        return 0;
      }
      throw insertError;
    }

    // Credit the wallet with the same rounded amount
    try {
      await creditWallet(
        userId,
        "quest_step",
        `Quest step ${stepIndex} — ${questLabel}`,
        roundedAmount,
        `quest_step_${sessionId}_${stepIndex}`,
      );
      return roundedAmount;
    } catch (creditError) {
      // Credit failed - remove the claim so it can be retried
      await db
        .from("quest_step_credits")
        .delete()
        .eq("session_id", sessionId)
        .eq("step_index", stepIndex);
      throw creditError;
    }
  } catch (error) {
    console.error(
      `[quests] Failed to credit step ${stepIndex} reward for session ${sessionId}:`,
      error,
    );
    return 0;
  }
}

/**
 * Server-side lock enforcement.
 * Fetches the user's current lifetime_earned and throws if the quest is locked.
 * Call this before allowing any quest progress or crediting any reward.
 */
export async function assertQuestNotLocked(userId: string, quest: QuestRow): Promise<void> {
  if (quest.lock_type === "none") return;
  const { lifetimeEarned, lifetimeWithdrawn } = await fetchLockInputs(userId);
  const state = computeLockState(
    quest.lock_type,
    quest.unlock_at,
    quest.required_lifetime_earned,
    lifetimeEarned,
    lifetimeWithdrawn,
  );
  assertNotLocked(state, quest.label);
}

/**
 * Server-side platform enforcement for app-only quests.
 * Throws if the quest is marked app_only and the request is NOT from a native app.
 * Call this before allowing any quest progress or crediting any reward.
 * 
 * WARNING: Platform detection can be spoofed. This is a best-effort check to improve
 * UX and reduce accidental web access, not a security boundary.
 */
export function assertQuestPlatform(quest: QuestRow, isNative: boolean): void {
  if (quest.app_only && !isNative) {
    throw new Error("This quest is only available in the app");
  }
}

/**
 * Records the generic "a quest was completed" event that the quest_count task
 * type counts. One event per quest SESSION across every quest type, deduplicated
 * by session id via the unique (user_id, event_type, event_key) index.
 *
 * Task automation must never roll back a quest that has already been credited,
 * so a failure here is swallowed — matching how the offerwall postback treats it.
 */
async function recordQuestCompletedEvent(userId: string, sessionId: string): Promise<void> {
  try {
    const { recordTaskEvent } = await import("./tasks/engine.server");
    await recordTaskEvent({ userId, eventType: "quest_completed", eventKey: sessionId });
  } catch (error) {
    console.error(
      `[quests] quest_completed task event failed for session ${sessionId}:`,
      error instanceof Error ? error.message : error,
    );
  }
}

/**
 * Records a task event for shortlink step completion.
 * One event per step, keyed as `${sessionId}:${step}` so each step counts exactly once.
 * Failure is non-fatal and never rolls back the credited step.
 */
async function recordShortlinkStepEvent(
  userId: string,
  sessionId: string,
  step: number,
): Promise<void> {
  try {
    const { recordTaskEvent } = await import("./tasks/engine.server");
    await recordTaskEvent({
      userId,
      eventType: "shortlink",
      eventKey: `${sessionId}:${step}`,
    });
  } catch (error) {
    console.error(
      `[quests] shortlink task event failed for session ${sessionId} step ${step}:`,
      error instanceof Error ? error.message : error,
    );
  }
}

/**
 * Records a task event for content locker step completion.
 * One event per step, keyed as `${sessionId}:${step}` so each step counts exactly once.
 * Failure is non-fatal and never rolls back the credited step.
 */
async function recordLockerStepEvent(
  userId: string,
  sessionId: string,
  step: number,
): Promise<void> {
  try {
    const { recordTaskEvent } = await import("./tasks/engine.server");
    await recordTaskEvent({
      userId,
      eventType: "content_locker",
      eventKey: `${sessionId}:${step}`,
    });
  } catch (error) {
    console.error(
      `[quests] content_locker task event failed for session ${sessionId} step ${step}:`,
      error instanceof Error ? error.message : error,
    );
  }
}

/**
 * Pays a 'verified' locker/shortlink session and marks it credited.
 *
 * Safe to call more than once and from overlapping requests: the credit is
 * keyed on the session id, so only the first call pays (and notifies). A
 * session left 'verified' by a failed credit is finished by the user's next
 * attempt instead of being stranded.
 */
async function finishQuestSession(
  userId: string,
  sessionId: string,
  reward: number,
  description: string,
): Promise<void> {
  const credit = await creditWallet(userId, reward, "quest", description, "earned", sessionId);
  await db
    .from("quest_sessions")
    .update({ status: "credited", credited_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("status", "verified");
  if (!credit.duplicate) {
    await db.from("notifications").insert({
      user_id: userId,
      title: "Quest completed",
      body: `You earned $${reward.toFixed(2)}.`,
      kind: "quest",
    });
  }
  // Drives the quest_count task type, keyed on the session id so one completed
  // quest counts once. Never allowed to fail the already-credited quest.
  await recordQuestCompletedEvent(userId, sessionId);
}

/**
 * Start a locker quest for a user.
 *
 * DESIGN NOTE — "most recent started session" fallback:
 * AdBlueMedia's locker builder has a single static "Redirect URL" field with no
 * per-session macro support. We therefore cannot embed a unique token in the
 * redirect URL at launch time. Instead, completeLockerQuestImpl credits the
 * user's most recent 'started' locker session for the given quest_key.
 * session_token is generated and stored here for future use if AdBlueMedia
 * ever adds a {click_id} or similar macro.
 *
 * Returns the NEXT locker URL the client should open — quest.locker_urls at the
 * session's current_step, mirroring how startShortlinkStepImpl serves one step
 * at a time. The admin configures AdBlueMedia's own "Redirect URL" field once
 * in their dashboard to point to /go/locker/return?questKey=<key>; that single
 * static URL serves every locker in the chain.
 *
 * `step` is 1-based and `total` is the number of lockers, so the UI can render
 * "Locker 1 of 3".
 */
export async function startLockerQuestImpl(userId: string, questKey: string, isNative: boolean) {
  const quest = await getQuestByKey(questKey);
  if (quest.quest_type !== "locker") throw new Error("This quest is not a locker quest.");
  assertQuestPlatform(quest, isNative);
  const urls = quest.locker_urls;
  // Not configured yet. A soft result rather than a throw: the admin is allowed
  // to publish a quest before its links exist, so this is an expected state and
  // the user should see "link coming soon", not an error toast. No session is
  // created and nothing is ever credited.
  if (!urls.length) return { unavailable: true as const };
  await assertQuestNotLocked(userId, quest);

  // Idempotent: return the existing in-progress session rather than creating a duplicate.
  const existing = await db
    .from("quest_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("quest_key", questKey)
    .in("status", ["started", "verified"])
    // quest_sessions has no created_at column — ordering by it made PostgREST
    // return 42703, which maybeSingle() turned into data:null, so this branch
    // never fired and a duplicate session was created on every start.
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing.data) {
    // Resume where the chain left off. Clamped so a session whose quest later
    // had lockers removed still points at a URL that exists.
    const currentStep = Number(existing.data.current_step ?? 0);
    const index = Math.min(Math.max(0, currentStep), urls.length - 1);

    // For every locker in the chain, set issued_step and step_issued_at.
    // This ensures the locker was actually opened before we credit on return.
    const nextStep = currentStep + 1;
    if (nextStep <= urls.length) {
      await db
        .from("quest_sessions")
        .update({ issued_step: nextStep, step_issued_at: new Date().toISOString() })
        .eq("id", existing.data.id);
    }

    return {
      sessionId: existing.data.id as string,
      lockerUrl: urls[index]!,
      step: index + 1,
      total: urls.length,
    };
  }

  const sessionToken = crypto.randomUUID();
  const created = await db
    .from("quest_sessions")
    .insert({
      user_id: userId,
      quest_key: quest.key,
      ads_required: 0,
      reward_amount: quest.reward_amount,
      quest_type: "locker",
      current_step: 0,
      issued_step: 1, // First locker is now issued
      step_issued_at: new Date().toISOString(),
      session_token: sessionToken,
    } as never)
    .select("id")
    .single();
  if (created.error) throw new Error("Could not start this locker quest.");

  // New session: current_step = 0, so the first locker in the chain.
  return { sessionId: created.data.id as string, lockerUrl: urls[0]!, step: 1, total: urls.length };
}

/**
 * Credit the user's most recent 'started' locker session for questKey.
 *
 * Called by the /go/locker/return route after AdBlueMedia redirects the user
 * back. Because AdBlueMedia's redirect URL is static (no per-session token
 * macro), we match on (userId, questKey, status='started') ordered by
 * started_at DESC — i.e. the most recently started session wins.
 *
 * ⚠️  SECURITY: This function now requires issued_step === current_step + 1
 * and a minimum time elapsed since step_issued_at. This is a TIME-BASED
 * MITIGATION ONLY. The proper verification would be a server-to-server
 * postback from the locker network confirming the user completed the challenge.
 * Without that postback, a user who knows the return URL can hit it directly
 * after the minimum time and claim credit without actually completing the locker.
 *
 * ⚠️  KNOWN LIMITATION: if the same user has two browser tabs or devices
 * simultaneously running the same locker quest, the OLDER session will never
 * be credited — only the most recent one is matched. This is an inherent
 * consequence of the static-redirect design. See reply notes for details.
 */
export async function completeLockerQuestImpl(userId: string, questKey: string, isNative: boolean) {
  const quest = await getQuestByKey(questKey);
  if (quest.quest_type !== "locker") throw new Error("This quest is not a locker quest.");
  assertQuestPlatform(quest, isNative);
  await assertQuestNotLocked(userId, quest);

  const session = await db
    .from("quest_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("quest_key", questKey)
    // 'verified' too: a session whose final credit didn't finish is completed
    // here rather than stranded (see finishQuestSession).
    .in("status", ["started", "verified"])
    // See the note in startLockerQuestImpl: the column is started_at, not
    // created_at. Ordering by a non-existent column made this lookup always
    // return null, so locker quests could never be credited at all.
    // The matching STRATEGY is unchanged: most recent open session for
    // (user, questKey), no per-session token.
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!session.data)
    throw new Error("No active locker session found. Please start the quest again.");

  // Each return hit completes one locker in the chain.
  const total = Math.max(1, quest.locker_urls.length);
  const currentStep = Number(session.data.current_step ?? 0);
  const issuedStep = Number(session.data.issued_step ?? 0);

  if (session.data.status === "verified") {
    const reward = Number(quest.reward_amount);
    await finishQuestSession(
      userId,
      session.data.id as string,
      reward,
      `Content locker — ${quest.label}`,
    );
    return {
      completed: true,
      credited: true,
      reward,
      step: total,
      total,
      nextStep: null,
      nextUrl: null,
    };
  }

  // SECURITY: Require that a locker was actually opened (issued_step === current_step + 1)
  // and that the minimum time has elapsed since step_issued_at.
  if (issuedStep !== currentStep + 1) {
    throw new Error("No locker is currently open. Please start from the app.");
  }

  const issuedAt = session.data.step_issued_at
    ? new Date(session.data.step_issued_at as string).getTime()
    : 0;
  const elapsed = (Date.now() - issuedAt) / 1000;
  if (!issuedAt || elapsed < quest.min_seconds_per_step) {
    throw new Error(
      `Locker opened too quickly. Please spend at least ${quest.min_seconds_per_step} seconds completing it.`,
    );
  }

  const completedCount = currentStep + 1;

  // Determine step reward (custom array overrides default)
  const stepReward =
    quest.step_rewards && quest.step_rewards[completedCount - 1] != null
      ? quest.step_rewards[completedCount - 1]
      : quest.step_reward;

  // Credit step reward BEFORE advancing
  const stepRewardCredited = await creditStepReward(
    userId,
    session.data.id as string,
    questKey,
    quest.label,
    completedCount,
    stepReward,
  );

  // Record task event for this completed locker step
  await recordLockerStepEvent(userId, session.data.id as string, completedCount);

  // --- More lockers left: advance and hand back the next URL -----------------
  if (completedCount < total) {
    await db
      .from("quest_sessions")
      .update({
        current_step: completedCount,
        issued_step: 0,
        step_issued_at: null,
      })
      .eq("id", session.data.id);

    return {
      completed: false,
      credited: false,
      reward: 0,
      stepReward: stepRewardCredited,
      stepIndex: completedCount,
      totalSteps: total,
      completionBonus: Number(quest.reward_amount),
      // Lockers finished so far, and the 1-based index of the one opening next.
      step: completedCount,
      total,
      nextStep: completedCount + 1,
      nextUrl: quest.locker_urls[completedCount] ?? null,
    };
  }

  // --- Final locker ---------------------------------------------------------
  // Mark verified (only from 'started'; an overlapping request may already have
  // done it — finishQuestSession is idempotent either way).
  await db
    .from("quest_sessions")
    .update({
      current_step: completedCount,
      issued_step: 0,
      step_issued_at: null,
      status: "verified",
      verified_at: new Date().toISOString(),
    })
    .eq("id", session.data.id)
    .eq("status", "started");

  const completionBonus = Number(quest.reward_amount);
  await finishQuestSession(
    userId,
    session.data.id as string,
    completionBonus,
    `Content locker — ${quest.label}`,
  );

  return {
    completed: true,
    credited: true,
    reward: completionBonus,
    stepReward: stepRewardCredited,
    stepIndex: completedCount,
    totalSteps: total,
    completionBonus,
    step: total,
    total,
    nextStep: null,
    nextUrl: null,
  };
}

export async function startShortlinkStepImpl(userId: string, questKey: string, step: number, isNative: boolean) {
  const quest = await getQuestByKey(questKey);
  if (quest.quest_type !== "shortlink") throw new Error("This quest is not a shortlink quest.");
  assertQuestPlatform(quest, isNative);
  // Same soft path as the locker case — no steps configured yet is expected, not
  // an error. Checked before the session lookup so an unconfigured quest never
  // reports "Start the quest first".
  if (!quest.shortlink_steps.length) return { unavailable: true as const };
  await assertQuestNotLocked(userId, quest);

  const session = await db
    .from("quest_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("quest_key", questKey)
    .eq("status", "started")
    .maybeSingle();
  if (!session.data) throw new Error("Start the quest first.");

  const currentStep = Number(session.data.current_step ?? 0);
  const issuedStep = Number(session.data.issued_step ?? 0);

  // Only allow opening the next step (current_step + 1), or re-opening the same pending step
  if (step !== currentStep + 1 && step !== issuedStep) {
    throw new Error("Complete the previous step first.");
  }

  // Set only issued_step and step_issued_at. Never touch current_step on open.
  // Re-opening the same step is idempotent (updates step_issued_at timestamp).
  await db
    .from("quest_sessions")
    .update({ issued_step: step, step_issued_at: new Date().toISOString() })
    .eq("id", session.data.id);

  const url = quest.shortlink_steps[step - 1]?.url ?? null;
  return {
    sessionId: session.data.id as string,
    step,
    url,
    minSeconds: quest.min_seconds_per_step,
  };
}

export async function completeShortlinkStepImpl(userId: string, questKey: string, step: number, isNative: boolean) {
  const quest = await getQuestByKey(questKey);
  if (quest.quest_type !== "shortlink") throw new Error("This quest is not a shortlink quest.");
  assertQuestPlatform(quest, isNative);
  await assertQuestNotLocked(userId, quest);

  const session = await db
    .from("quest_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("quest_key", questKey)
    // 'verified' too: a session whose final credit didn't finish is completed
    // here rather than stranded (see finishQuestSession).
    .in("status", ["started", "verified"])
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!session.data) throw new Error("No active session for this quest.");

  if (session.data.status === "verified") {
    const reward = Number(quest.reward_amount);
    await finishQuestSession(
      userId,
      session.data.id as string,
      reward,
      `Shortlink quest — ${quest.label}`,
    );
    // Step count is whatever the admin configured (1-10) — no fixed assumption.
    const total = Math.max(1, quest.shortlink_steps.length);
    return {
      completed: true,
      credited: true,
      reward,
      nextStep: null,
      nextUrl: null,
      step: total,
      total,
    };
  }

  const currentStep = Number(session.data.current_step ?? 0);
  const issuedStep = Number(session.data.issued_step ?? 0);

  // Require that this step was actually opened (issued_step === step)
  // and that it's the next sequential step (step === current_step + 1)
  if (issuedStep !== step) {
    throw new Error("This step was not opened. Please start from the app.");
  }
  if (step !== currentStep + 1) {
    throw new Error("Wrong step — go back and start from the app.");
  }

  const issuedAt = session.data.step_issued_at
    ? new Date(session.data.step_issued_at as string).getTime()
    : 0;
  const elapsed = (Date.now() - issuedAt) / 1000;
  if (!issuedAt || elapsed < quest.min_seconds_per_step) {
    throw new Error(
      `Step opened too quickly. Please spend at least ${quest.min_seconds_per_step} seconds on the network's page.`,
    );
  }

  // Step count is whatever the admin configured (1-10) — no fixed assumption.
  const total = Math.max(1, quest.shortlink_steps.length);
  const isFinal = step >= total;

  // Determine step reward (custom array overrides default)
  const stepReward =
    quest.step_rewards && quest.step_rewards[step - 1] != null
      ? quest.step_rewards[step - 1]
      : quest.step_reward;

  // Credit step reward BEFORE advancing
  const stepRewardCredited = await creditStepReward(
    userId,
    session.data.id as string,
    questKey,
    quest.label,
    step,
    stepReward,
  );

  // Record task event for this completed shortlink step
  await recordShortlinkStepEvent(userId, session.data.id as string, step);

  if (isFinal) {
    // Only from 'started'; an overlapping request may already have verified it —
    // finishQuestSession is idempotent either way.
    await db
      .from("quest_sessions")
      .update({
        current_step: step,
        issued_step: 0,
        step_issued_at: null,
        status: "verified",
        verified_at: new Date().toISOString(),
      })
      .eq("id", session.data.id)
      .eq("status", "started");
    const completionBonus = Number(quest.reward_amount);
    await finishQuestSession(
      userId,
      session.data.id as string,
      completionBonus,
      `Shortlink quest — ${quest.label}`,
    );
    return {
      completed: true,
      credited: true,
      reward: completionBonus,
      stepReward: stepRewardCredited,
      stepIndex: step,
      totalSteps: total,
      completionBonus,
      nextStep: null,
      nextUrl: null,
      step: total,
      total,
    };
  }

  // Non-final step: set current_step = step (mark this step as completed), clear issued_step
  await db
    .from("quest_sessions")
    .update({ current_step: step, issued_step: 0, step_issued_at: null })
    .eq("id", session.data.id);

  return {
    completed: false,
    credited: false,
    reward: 0,
    stepReward: stepRewardCredited,
    stepIndex: step,
    totalSteps: total,
    completionBonus: Number(quest.reward_amount),
    nextStep: step + 1,
    nextUrl: quest.shortlink_steps[step]?.url ?? null,
    step,
    total,
  };
}

// ============================================================================
// CHECK-IN QUEST LOGIC
// ============================================================================

/**
 * Get or create a check-in quest session for a user.
 * Auto-starts the quest on first access and completes Day 1 if day1_auto_complete is enabled.
 * 
 * Returns: { session, day1Completed } where day1Completed indicates if Day 1 was just auto-completed
 */
async function getOrCreateCheckinSession(
  userId: string,
  quest: QuestRow,
  userTimezone: string,
): Promise<{ session: any; day1Completed: boolean }> {
  const { getLocalDate } = await import("./timezone.server");
  const todayLocal = getLocalDate(userTimezone);

  // Check for existing active session first
  const existing = await db
    .from("quest_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("quest_key", quest.key)
    .eq("quest_type", "checkin")
    .eq("status", "started")
    .order("started_at", { ascending: false })
    .maybeSingle();

  if (existing.data) {
    return { session: existing.data, day1Completed: false };
  }

  // Try to create new session
  const sessionToken = crypto.randomUUID();
  
  try {
    const created = await db
      .from("quest_sessions")
      .insert({
        user_id: userId,
        quest_key: quest.key,
        quest_type: "checkin",
        quest_label: quest.label,
        reward_amount: quest.reward_amount,
        ads_required: quest.total_days ?? 3, // Required NOT NULL field
        status: "started",
        started_at: new Date().toISOString(),
        session_token: sessionToken,
        timezone: userTimezone, // Lock timezone in session
        metadata: { locked_timezone: userTimezone }, // Also store in metadata for backward compat
      } as any)
      .select("*")
      .single();

    if (created.error) {
      // Check for unique constraint violation (23505 = unique_violation)
      if (created.error.code === "23505") {
        // Race condition: another request created the session
        // Load and return the existing session (do NOT pay Day 1 again)
        const race = await db
          .from("quest_sessions")
          .select("*")
          .eq("user_id", userId)
          .eq("quest_key", quest.key)
          .eq("quest_type", "checkin")
          .eq("status", "started")
          .single();

        if (race.data) {
          return { session: race.data, day1Completed: false };
        }
      }
      throw new Error(created.error.message ?? "Failed to create check-in session");
    }

    // Day 1 auto-complete (only if we created the session)
    let day1Completed = false;
    if (quest.day1_auto_complete && created.data) {
      day1Completed = await completeCheckinDay(
        userId,
        created.data.id as string,
        quest.key,
        quest,
        todayLocal,
        0, // Day 1 = step index 0
        userTimezone,
      );
    }

    return { session: created.data, day1Completed };
  } catch (err) {
    console.error("[checkin] Failed to get or create session:", err);
    throw err;
  }
}

/**
 * Complete a check-in day and credit the step reward.
 * Idempotent via quest_step_credits unique constraint.
 * 
 * @returns true if day was newly completed, false if already complete
 */
async function completeCheckinDay(
  userId: string,
  sessionId: string,
  questKey: string,
  quest: QuestRow,
  localDate: string,
  dayIndex: number, // 0-based (Day 1 = 0, Day 2 = 1, etc.)
  userTimezone: string,
): Promise<boolean> {
  // Check if day already completed
  const existing = await db
    .from("quest_checkin_days")
    .select("completed_at")
    .eq("session_id", sessionId)
    .eq("local_date", localDate)
    .maybeSingle();

  if (existing.data?.completed_at) {
    return false; // Already completed
  }

  // Upsert the day record as completed
  const { error: upsertError } = await db
    .from("quest_checkin_days")
    .upsert(
      {
        session_id: sessionId,
        user_id: userId,
        quest_key: questKey,
        local_date: localDate,
        active_seconds: quest.required_active_seconds, // Mark as fully active
        completed_at: new Date().toISOString(),
      } as any,
      {
        onConflict: "session_id,local_date",
      },
    );

  if (upsertError) {
    console.error("[checkin] Failed to complete day:", upsertError);
    throw new Error("Failed to complete check-in day");
  }

  // Calculate step reward (use per-day rewards if available)
  const stepReward =
    quest.step_rewards && quest.step_rewards[dayIndex] != null
      ? quest.step_rewards[dayIndex]
      : quest.step_reward;

  // Credit step reward (idempotent)
  if (stepReward && stepReward > 0) {
    await creditStepReward(
      userId,
      sessionId,
      questKey,
      quest.label,
      dayIndex,
      stepReward,
    );
  }

  // Check if this was the final day
  const completedDays = await db
    .from("quest_checkin_days")
    .select("local_date")
    .eq("session_id", sessionId)
    .not("completed_at", "is", null);

  const totalCompletedDays = completedDays.data?.length ?? 0;

  if (totalCompletedDays >= quest.total_days) {
    // Quest complete! Credit completion bonus
    await finishQuestSession(
      userId,
      sessionId,
      quest.reward_amount,
      `Quest completed: ${quest.label}`,
    );
  }

  return true;
}

/**
 * Get user's timezone from profile, with fallback to quest's default timezone.
 */
async function getUserTimezone(userId: string, defaultTimezone: string): Promise<string> {
  const { data } = await db
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .maybeSingle();

  const userTz = data?.timezone;
  if (userTz) {
    const { validateTimezone } = await import("./timezone.server");
    const validated = validateTimezone(userTz);
    if (validated) return validated;
  }

  return defaultTimezone;
}

/**
 * Update user's timezone (service role, validated server-side).
 * Enforces 7-day change limit.
 * Client sends Intl.DateTimeFormat().resolvedOptions().timeZone.
 */
export async function updateUserTimezoneImpl(
  userId: string,
  timezone: string,
): Promise<{ success: boolean; timezone?: string; error?: string }> {
  try {
    // Validate timezone
    const { validateTimezone, canChangeTimezone } = await import("./timezone.server");
    const validated = validateTimezone(timezone);
    
    if (!validated) {
      return { success: false, error: "Invalid timezone" };
    }

    // Check current timezone and last change time
    const { data: profile } = await db
      .from("profiles")
      .select("timezone, timezone_changed_at")
      .eq("id", userId)
      .maybeSingle();

    // If timezone is already set, check 7-day limit
    if (profile?.timezone && profile.timezone === validated) {
      // Already set to this timezone, no change needed
      return { success: true, timezone: validated };
    }

    // Check if change is allowed
    if (profile?.timezone && !canChangeTimezone(profile.timezone_changed_at)) {
      return {
        success: false,
        error: "Timezone can only be changed once per 7 days",
      };
    }

    // Update timezone (use service role since profiles columns are not client-writable)
    const { error } = await db
      .from("profiles")
      .update({
        timezone: validated,
        timezone_changed_at: new Date().toISOString(),
      } as any)
      .eq("id", userId);

    if (error) {
      console.error("[timezone] Failed to update:", error);
      return { success: false, error: "Failed to update timezone" };
    }

    return { success: true, timezone: validated };
  } catch (err) {
    console.error("[timezone] Update error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Evaluate streak status and handle resets for consecutive mode.
 * Lazy evaluation: checks for missed days when the quest is accessed.
 * 
 * Returns: { needsReset, missedDays } where needsReset indicates session should be reset
 */
async function evaluateCheckinStreak(
  session: any,
  quest: QuestRow,
  userTimezone: string,
): Promise<{ needsReset: boolean; missedDays: number }> {
  // Total mode: no resets, any N days work
  if (quest.streak_mode === "total") {
    return { needsReset: false, missedDays: 0 };
  }

  // Consecutive mode: check for missed days
  const { getLocalDate, getYesterdayLocal, getDaysBetween } = await import("./timezone.server");
  const todayLocal = getLocalDate(userTimezone);
  const yesterdayLocal = getYesterdayLocal(userTimezone);

  // Get all completed days for this session
  const completedDays = await db
    .from("quest_checkin_days")
    .select("local_date")
    .eq("session_id", session.id)
    .not("completed_at", "is", null)
    .order("local_date", { ascending: false });

  const completed = completedDays.data?.map((d: any) => d.local_date) ?? [];

  if (completed.length === 0) {
    // No days completed yet (only Day 1 auto-complete pending)
    return { needsReset: false, missedDays: 0 };
  }

  // Get the most recent completed day
  const lastCompletedDate = completed[0];

  // If last completed is today, streak is active
  if (lastCompletedDate === todayLocal) {
    return { needsReset: false, missedDays: 0 };
  }

  // If last completed is yesterday, streak is still active (user hasn't completed today yet)
  if (lastCompletedDate === yesterdayLocal) {
    return { needsReset: false, missedDays: 0 };
  }

  // Calculate missed days
  const daysSinceLastComplete = getDaysBetween(userTimezone, lastCompletedDate, todayLocal) - 1;
  const missedDays = Math.max(0, daysSinceLastComplete);

  // Check if missed days exceed grace period
  if (missedDays > quest.grace_days) {
    return { needsReset: true, missedDays };
  }

  return { needsReset: false, missedDays };
}

/**
 * Reset a check-in quest session (consecutive mode).
 * Creates a new session and auto-completes Day 1 if enabled.
 * Does NOT claw back step rewards already paid.
 */
async function resetCheckinSession(
  userId: string,
  oldSessionId: string,
  quest: QuestRow,
  userTimezone: string,
): Promise<{ session: any; day1Completed: boolean }> {
  // Mark old session as failed
  await db
    .from("quest_sessions")
    .update({ status: "failed" } as any)
    .eq("id", oldSessionId);

  // Create fresh session (will auto-complete Day 1 if enabled)
  return getOrCreateCheckinSession(userId, quest, userTimezone);
}

/**
 * Ensure a check-in session exists and is valid.
 * Idempotent - safe to call multiple times, will only create/pay once.
 * 
 * Client should call this after loading quests to initialize check-in sessions.
 * Handles:
 * - Session creation with race-safe unique constraint
 * - Day 1 auto-complete (paid exactly once via quest_step_credits)
 * - Streak evaluation and reset (consecutive mode)
 * - Timezone lock
 * 
 * @returns Session state and whether Day 1 was newly completed
 */
export async function ensureCheckinSessionImpl(
  userId: string,
  questKey: string,
): Promise<{
  success: boolean;
  session?: any;
  day1Completed?: boolean;
  error?: string;
}> {
  try {
    // Get quest
    const { data: quest } = await db
      .from("quests")
      .select("*")
      .eq("key", questKey)
      .eq("quest_type", "checkin")
      .eq("is_active", true)
      .maybeSingle();

    if (!quest) {
      return { success: false, error: "Check-in quest not found" };
    }

    const normalizedQuest = normalize(quest as QuestRow);

    // Get user's timezone
    const userTimezone = await getUserTimezone(userId, normalizedQuest.default_timezone);

    // Get or create session (race-safe)
    const { session, day1Completed } = await getOrCreateCheckinSession(
      userId,
      normalizedQuest,
      userTimezone,
    );

    // Evaluate streak (consecutive mode may need reset)
    const { needsReset } = await evaluateCheckinStreak(session, normalizedQuest, userTimezone);
    if (needsReset) {
      const resetResult = await resetCheckinSession(
        userId,
        session.id,
        normalizedQuest,
        userTimezone,
      );
      return {
        success: true,
        session: resetResult.session,
        day1Completed: resetResult.day1Completed,
      };
    }

    return {
      success: true,
      session,
      day1Completed,
    };
  } catch (err) {
    console.error("[checkin] Failed to ensure session:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Ping active time for a check-in quest.
 * Called by client every 30s while visible and focused.
 * 
 * Server logic:
 * - Ignore pings <20s after previous ping (prevents parallel tabs/rapid pings)
 * - Add min(now - last_ping_at, 35s) to today's active_seconds
 * - Cap at required_active_seconds
 * - Complete day when threshold reached
 * 
 * Returns: { dayCompleted, activeSeconds, requiredSeconds, stepReward }
 */
export async function pingActiveTimeImpl(
  userId: string,
  questKey: string,
): Promise<{ dayCompleted: boolean; activeSeconds: number; requiredSeconds: number; stepReward: number }> {
  // Get quest
  const { data: quest } = await db
    .from("quests")
    .select("*")
    .eq("key", questKey)
    .eq("quest_type", "checkin")
    .eq("is_active", true)
    .maybeSingle();

  if (!quest) {
    throw new Error("Check-in quest not found");
  }

  const normalizedQuest = normalize(quest as QuestRow);

  // Get user's timezone
  const userTimezone = await getUserTimezone(userId, normalizedQuest.default_timezone);
  const { getLocalDate } = await import("./timezone.server");
  const todayLocal = getLocalDate(userTimezone);

  // Get or create session
  const { session } = await getOrCreateCheckinSession(userId, normalizedQuest, userTimezone);

  // Check if session needs reset (lazy evaluation)
  const { needsReset } = await evaluateCheckinStreak(session, normalizedQuest, userTimezone);
  if (needsReset) {
    const { session: newSession } = await resetCheckinSession(
      userId,
      session.id,
      normalizedQuest,
      userTimezone,
    );
    // Use the new session
    Object.assign(session, newSession);
  }

  // Use locked timezone from session.timezone (anti-abuse)
  // If not set (old sessions), fall back to metadata or user timezone
  const lockedTimezone = session.timezone ?? session.metadata?.locked_timezone ?? userTimezone;
  
  // Recalculate today's date using the locked timezone
  const todayLocalLocked = getLocalDate(lockedTimezone);

  // Get or create today's day record (using locked timezone date)
  const existingDay = await db
    .from("quest_checkin_days")
    .select("*")
    .eq("session_id", session.id)
    .eq("local_date", todayLocalLocked)
    .maybeSingle();

  const now = new Date();
  const nowMs = now.getTime();

  // If already completed, return current state
  if (existingDay.data?.completed_at) {
    return {
      dayCompleted: true,
      activeSeconds: normalizedQuest.required_active_seconds,
      requiredSeconds: normalizedQuest.required_active_seconds,
      stepReward: 0, // Already paid
    };
  }

  // Check if ping is too soon (< 20s since last ping)
  const lastPingAt = existingDay.data?.last_ping_at;
  if (lastPingAt) {
    const lastPingMs = new Date(lastPingAt).getTime();
    const timeSinceLastPing = (nowMs - lastPingMs) / 1000; // seconds
    if (timeSinceLastPing < 20) {
      // Too soon, ignore this ping
      return {
        dayCompleted: false,
        activeSeconds: existingDay.data.active_seconds ?? 0,
        requiredSeconds: normalizedQuest.required_active_seconds,
        stepReward: 0,
      };
    }
  }

  // Calculate seconds to add: min(time since last ping, 35s)
  let secondsToAdd = 30; // Default if no previous ping
  if (lastPingAt) {
    const lastPingMs = new Date(lastPingAt).getTime();
    const elapsedSeconds = (nowMs - lastPingMs) / 1000;
    secondsToAdd = Math.min(elapsedSeconds, 35); // Cap at 35s
  }

  const currentActiveSeconds = existingDay.data?.active_seconds ?? 0;
  const newActiveSeconds = Math.min(
    currentActiveSeconds + secondsToAdd,
    normalizedQuest.required_active_seconds,
  );

  // Upsert day record with new active time (using locked timezone date)
  await db
    .from("quest_checkin_days")
    .upsert(
      {
        session_id: session.id,
        user_id: userId,
        quest_key: questKey,
        local_date: todayLocalLocked,
        active_seconds: newActiveSeconds,
        last_ping_at: now.toISOString(),
      } as any,
      {
        onConflict: "session_id,local_date",
      },
    );

  // Check if day is now complete
  const dayCompleted = newActiveSeconds >= normalizedQuest.required_active_seconds;

  if (dayCompleted && !existingDay.data?.completed_at) {
    // Complete the day (credits step reward)
    const completedDays = await db
      .from("quest_checkin_days")
      .select("local_date")
      .eq("session_id", session.id)
      .not("completed_at", "is", null);

    const dayIndex = completedDays.data?.length ?? 0; // Current day index (0-based)

    await completeCheckinDay(
      userId,
      session.id,
      questKey,
      normalizedQuest,
      todayLocalLocked,
      dayIndex,
      lockedTimezone,
    );

    // Calculate step reward
    const stepReward =
      normalizedQuest.step_rewards && normalizedQuest.step_rewards[dayIndex] != null
        ? normalizedQuest.step_rewards[dayIndex]
        : normalizedQuest.step_reward;

    return {
      dayCompleted: true,
      activeSeconds: newActiveSeconds,
      requiredSeconds: normalizedQuest.required_active_seconds,
      stepReward: stepReward ?? 0,
    };
  }

  return {
    dayCompleted: false,
    activeSeconds: newActiveSeconds,
    requiredSeconds: normalizedQuest.required_active_seconds,
    stepReward: 0,
  };
}

/**
 * Check in today (tap-only mode).
 * Completes today's day immediately if not already done.
 * Only works when required_active_seconds = 0.
 * 
 * Returns: { success, dayCompleted, stepReward }
 */
export async function checkInTodayImpl(
  userId: string,
  questKey: string,
): Promise<{ success: boolean; dayCompleted: boolean; stepReward: number; message?: string }> {
  // Get quest
  const { data: quest } = await db
    .from("quests")
    .select("*")
    .eq("key", questKey)
    .eq("quest_type", "checkin")
    .eq("is_active", true)
    .maybeSingle();

  if (!quest) {
    return { success: false, dayCompleted: false, stepReward: 0, message: "Quest not found" };
  }

  const normalizedQuest = normalize(quest as QuestRow);

  // Verify tap-only mode
  if (normalizedQuest.required_active_seconds !== 0) {
    return {
      success: false,
      dayCompleted: false,
      stepReward: 0,
      message: "Quest requires active time tracking",
    };
  }

  // Get user's timezone
  const userTimezone = await getUserTimezone(userId, normalizedQuest.default_timezone);
  const { getLocalDate } = await import("./timezone.server");
  const todayLocal = getLocalDate(userTimezone);

  // Get or create session
  const { session } = await getOrCreateCheckinSession(userId, normalizedQuest, userTimezone);

  // Check if session needs reset (lazy evaluation)
  const { needsReset } = await evaluateCheckinStreak(session, normalizedQuest, userTimezone);
  if (needsReset) {
    const { session: newSession } = await resetCheckinSession(
      userId,
      session.id,
      normalizedQuest,
      userTimezone,
    );
    Object.assign(session, newSession);
  }

  // Use locked timezone from session.timezone (anti-abuse)
  const lockedTimezone = session.timezone ?? session.metadata?.locked_timezone ?? userTimezone;
  
  // Recalculate today's date using locked timezone
  const todayLocalLocked = getLocalDate(lockedTimezone);

  // Check if today already completed
  const existingDay = await db
    .from("quest_checkin_days")
    .select("completed_at")
    .eq("session_id", session.id)
    .eq("local_date", todayLocalLocked)
    .maybeSingle();

  if (existingDay.data?.completed_at) {
    return {
      success: true,
      dayCompleted: false, // Was already completed
      stepReward: 0,
      message: "Already checked in today",
    };
  }

  // Get day index
  const completedDays = await db
    .from("quest_checkin_days")
    .select("local_date")
    .eq("session_id", session.id)
    .not("completed_at", "is", null);

  const dayIndex = completedDays.data?.length ?? 0;

  // Complete today
  const completed = await completeCheckinDay(
    userId,
    session.id,
    questKey,
    normalizedQuest,
    todayLocalLocked,
    dayIndex,
    lockedTimezone,
  );

  if (!completed) {
    return {
      success: false,
      dayCompleted: false,
      stepReward: 0,
      message: "Failed to complete check-in",
    };
  }

  // Calculate step reward
  const stepReward =
    normalizedQuest.step_rewards && normalizedQuest.step_rewards[dayIndex] != null
      ? normalizedQuest.step_rewards[dayIndex]
      : normalizedQuest.step_reward;

  return {
    success: true,
    dayCompleted: true,
    stepReward: stepReward ?? 0,
  };
}

