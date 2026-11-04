/**
 * Active Time Quest - Server-authoritative time tracking
 * 
 * Rules:
 * - Client pings every ~30s with interaction proof
 * - Server credits min(ping_gap, 35s) to prevent clock manipulation
 * - Ignore pings <20s apart (too frequent)
 * - One-time tokens prevent replay attacks
 * - Grace periods for offer clicks (count background time up to 10min)
 * - Daily cap on counted seconds (default 2h)
 * - Atomic reward payout via Postgres function
 */

import { createHash, randomBytes } from "crypto";
import type { DbClient } from "../quests.server";

const MIN_PING_INTERVAL_SEC = 20;
const MAX_CREDIT_PER_PING_SEC = 35;
const MAX_GRACE_WINDOWS_PER_HOUR = 3;
const GRACE_OFFER_COOLDOWN_HOURS = 24;

type PingResult = {
  success: boolean;
  reason?: string;
  nextToken: string | null;
  totalSeconds: number;
  todaySeconds: number;
  targetSeconds: number;
  progressPercent: number;
  canClaim: boolean;
};

type GraceResult = {
  success: boolean;
  reason?: string;
  graceUntil: string | null;
};

/**
 * Generate a cryptographically secure one-time ping token
 */
function generatePingToken(): string {
  return randomBytes(24).toString("base64url");
}

/**
 * Process an active time ping from the client
 * 
 * @param db - Supabase client (service role)
 * @param userId - Authenticated user ID
 * @param questKey - Quest key
 * @param lastToken - Token from previous ping (required after first ping)
 * @param interactionProof - Client-side interaction hash (unused, for future verification)
 * @returns Ping result with next token and progress
 */
export async function processActiveTimePing(
  db: DbClient,
  userId: string,
  questKey: string,
  lastToken: string | null,
  interactionProof?: string,
): Promise<PingResult> {
  const now = new Date();

  // Get quest configuration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: quest, error: questError } = await (db as any)
    .from("quests")
    .select("target_minutes, daily_cap_minutes, grace_minutes, is_active")
    .eq("key", questKey)
    .eq("quest_type", "active_time")
    .maybeSingle();

  if (questError || !quest) {
    return {
      success: false,
      reason: "quest_not_found",
      nextToken: null,
      totalSeconds: 0,
      todaySeconds: 0,
      targetSeconds: 0,
      progressPercent: 0,
      canClaim: false,
    };
  }

  if (!quest.is_active) {
    return {
      success: false,
      reason: "quest_inactive",
      nextToken: null,
      totalSeconds: 0,
      todaySeconds: 0,
      targetSeconds: 0,
      progressPercent: 0,
      canClaim: false,
    };
  }

  const targetSeconds = (quest.target_minutes || 60) * 60;
  const dailyCapSeconds = (quest.daily_cap_minutes || 120) * 60;

  // Get or create progress record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let { data: progress, error: progressError } = await (db as any)
    .from("quest_active_time_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("quest_key", questKey)
    .maybeSingle();

  if (progressError) {
    return {
      success: false,
      reason: "database_error",
      nextToken: null,
      totalSeconds: 0,
      todaySeconds: 0,
      targetSeconds,
      progressPercent: 0,
      canClaim: false,
    };
  }

  // Initialize progress if first ping
  if (!progress) {
    const newToken = generatePingToken();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: created } = await (db as any)
      .from("quest_active_time_progress")
      .insert({
        user_id: userId,
        quest_key: questKey,
        total_seconds: 0,
        today_seconds: 0,
        today_date: now.toISOString().split("T")[0],
        last_ping_at: now.toISOString(),
        last_ping_token: newToken,
      })
      .select()
      .single();

    return {
      success: true,
      nextToken: newToken,
      totalSeconds: 0,
      todaySeconds: 0,
      targetSeconds,
      progressPercent: 0,
      canClaim: false,
    };
  }

  // Check if already claimed
  if (progress.credited_at) {
    return {
      success: false,
      reason: "already_claimed",
      nextToken: null,
      totalSeconds: progress.total_seconds,
      todaySeconds: progress.today_seconds,
      targetSeconds,
      progressPercent: Math.min(100, (progress.total_seconds / targetSeconds) * 100),
      canClaim: false,
    };
  }

  // Verify token (required after first ping)
  if (progress.last_ping_token && lastToken !== progress.last_ping_token) {
    return {
      success: false,
      reason: "invalid_token",
      nextToken: null,
      totalSeconds: progress.total_seconds,
      todaySeconds: progress.today_seconds,
      targetSeconds,
      progressPercent: Math.min(100, (progress.total_seconds / targetSeconds) * 100),
      canClaim: progress.total_seconds >= targetSeconds,
    };
  }

  // Check ping interval (prevent too-frequent pings)
  const lastPingAt = progress.last_ping_at ? new Date(progress.last_ping_at) : null;
  if (lastPingAt) {
    const secondsSinceLastPing = (now.getTime() - lastPingAt.getTime()) / 1000;
    if (secondsSinceLastPing < MIN_PING_INTERVAL_SEC) {
      // Too soon, return current state without updating
      return {
        success: false,
        reason: "ping_too_frequent",
        nextToken: progress.last_ping_token,
        totalSeconds: progress.total_seconds,
        todaySeconds: progress.today_seconds,
        targetSeconds,
        progressPercent: Math.min(100, (progress.total_seconds / targetSeconds) * 100),
        canClaim: progress.total_seconds >= targetSeconds,
      };
    }
  }

  // Calculate seconds to credit
  let secondsToCredit = 0;
  if (lastPingAt) {
    const gapSeconds = (now.getTime() - lastPingAt.getTime()) / 1000;
    
    // Check if in grace period (can credit background time)
    const graceUntil = progress.grace_until ? new Date(progress.grace_until) : null;
    if (graceUntil && now <= graceUntil && gapSeconds > MAX_CREDIT_PER_PING_SEC) {
      // In grace: credit up to grace_until
      const graceRemaining = (graceUntil.getTime() - lastPingAt.getTime()) / 1000;
      secondsToCredit = Math.floor(Math.min(gapSeconds, graceRemaining));
    } else {
      // Normal mode: credit min(gap, 35s)
      secondsToCredit = Math.floor(Math.min(gapSeconds, MAX_CREDIT_PER_PING_SEC));
    }
  }

  // Reset daily counter if new day
  const todayDate = now.toISOString().split("T")[0];
  let todaySeconds = progress.today_seconds;
  if (progress.today_date !== todayDate) {
    todaySeconds = 0;
  }

  // Apply daily cap
  if (todaySeconds + secondsToCredit > dailyCapSeconds) {
    secondsToCredit = Math.max(0, dailyCapSeconds - todaySeconds);
  }

  // Update progress
  const newTotalSeconds = progress.total_seconds + secondsToCredit;
  const newTodaySeconds = todaySeconds + secondsToCredit;
  const newToken = generatePingToken();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (db as any)
    .from("quest_active_time_progress")
    .update({
      total_seconds: newTotalSeconds,
      today_seconds: newTodaySeconds,
      today_date: todayDate,
      last_ping_at: now.toISOString(),
      last_ping_token: newToken,
      updated_at: now.toISOString(),
    })
    .eq("user_id", userId)
    .eq("quest_key", questKey);

  if (updateError) {
    return {
      success: false,
      reason: "update_failed",
      nextToken: progress.last_ping_token,
      totalSeconds: progress.total_seconds,
      todaySeconds: progress.today_seconds,
      targetSeconds,
      progressPercent: Math.min(100, (progress.total_seconds / targetSeconds) * 100),
      canClaim: progress.total_seconds >= targetSeconds,
    };
  }

  return {
    success: true,
    nextToken: newToken,
    totalSeconds: newTotalSeconds,
    todaySeconds: newTodaySeconds,
    targetSeconds,
    progressPercent: Math.min(100, (newTotalSeconds / targetSeconds) * 100),
    canClaim: newTotalSeconds >= targetSeconds,
  };
}

/**
 * Start a grace period when user clicks an offer/survey
 * Allows counting background time while completing offer
 * 
 * @param db - Supabase client (service role)
 * @param userId - Authenticated user ID
 * @param questKey - Quest key
 * @param offerId - Offer/provider identifier
 * @returns Grace result with expiry time
 */
export async function startActiveTimeGrace(
  db: DbClient,
  userId: string,
  questKey: string,
  offerId: string,
): Promise<GraceResult> {
  const now = new Date();

  // Get quest configuration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: quest } = await (db as any)
    .from("quests")
    .select("grace_minutes, is_active")
    .eq("key", questKey)
    .eq("quest_type", "active_time")
    .maybeSingle();

  if (!quest || !quest.is_active) {
    return { success: false, reason: "quest_not_found", graceUntil: null };
  }

  const graceMinutes = quest.grace_minutes || 10;
  const graceUntil = new Date(now.getTime() + graceMinutes * 60 * 1000);

  // Get progress record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: progress } = await (db as any)
    .from("quest_active_time_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("quest_key", questKey)
    .maybeSingle();

  if (!progress) {
    return { success: false, reason: "progress_not_found", graceUntil: null };
  }

  if (progress.credited_at) {
    return { success: false, reason: "already_claimed", graceUntil: null };
  }

  // Check hourly rate limit (max 3 grace windows per hour)
  const hourStart = new Date(now.getTime() - 60 * 60 * 1000);
  const graceHourStart = progress.grace_hour_start ? new Date(progress.grace_hour_start) : null;
  
  let graceCount = progress.grace_count_hour || 0;
  if (!graceHourStart || graceHourStart < hourStart) {
    // Reset counter (new hour)
    graceCount = 0;
  }

  if (graceCount >= MAX_GRACE_WINDOWS_PER_HOUR) {
    return { success: false, reason: "grace_limit_reached", graceUntil: null };
  }

  // Check per-offer cooldown (same offer gets no grace for 24h)
  const cooldownStart = new Date(now.getTime() - GRACE_OFFER_COOLDOWN_HOURS * 60 * 60 * 1000);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: recentGrace } = await (db as any)
    .from("quest_active_time_grace_history")
    .select("id")
    .eq("user_id", userId)
    .eq("quest_key", questKey)
    .eq("offer_id", offerId)
    .gte("started_at", cooldownStart.toISOString())
    .limit(1)
    .maybeSingle();

  if (recentGrace) {
    return { success: false, reason: "offer_cooldown", graceUntil: null };
  }

  // Start grace period
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any)
    .from("quest_active_time_progress")
    .update({
      grace_until: graceUntil.toISOString(),
      grace_offer_id: offerId,
      grace_count_hour: graceCount + 1,
      grace_hour_start: graceHourStart && graceHourStart >= hourStart 
        ? graceHourStart.toISOString()
        : now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("user_id", userId)
    .eq("quest_key", questKey);

  // Record grace start
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any)
    .from("quest_active_time_grace_history")
    .insert({
      user_id: userId,
      quest_key: questKey,
      offer_id: offerId,
      started_at: now.toISOString(),
    });

  return {
    success: true,
    graceUntil: graceUntil.toISOString(),
  };
}

/**
 * End grace period early (when offer postback arrives)
 * 
 * @param db - Supabase client (service role)
 * @param userId - Authenticated user ID
 * @param questKey - Quest key
 * @param offerId - Offer/provider identifier that completed
 */
export async function endActiveTimeGrace(
  db: DbClient,
  userId: string,
  questKey: string,
  offerId: string,
): Promise<void> {
  const now = new Date();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: progress } = await (db as any)
    .from("quest_active_time_progress")
    .select("grace_offer_id, grace_until")
    .eq("user_id", userId)
    .eq("quest_key", questKey)
    .maybeSingle();

  if (!progress || progress.grace_offer_id !== offerId) {
    return; // No active grace for this offer
  }

  // Clear grace period
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any)
    .from("quest_active_time_progress")
    .update({
      grace_until: null,
      grace_offer_id: null,
      updated_at: now.toISOString(),
    })
    .eq("user_id", userId)
    .eq("quest_key", questKey);

  // Update grace history
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any)
    .from("quest_active_time_grace_history")
    .update({
      ended_at: now.toISOString(),
    })
    .eq("user_id", userId)
    .eq("quest_key", questKey)
    .eq("offer_id", offerId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1);
}

/**
 * Claim active time quest reward (atomic, pays exactly once)
 * 
 * @param db - Supabase client (service role)
 * @param userId - Authenticated user ID
 * @param questKey - Quest key
 * @returns Claim result
 */
export async function claimActiveTimeReward(
  db: DbClient,
  userId: string,
  questKey: string,
): Promise<{ success: boolean; reason: string; totalSeconds?: number }> {
  // Call atomic Postgres function (only marks as claimed, doesn't credit wallet)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any).rpc("claim_active_time_quest_reward", {
    p_user_id: userId,
    p_quest_key: questKey,
  });

  if (error || !data || data.length === 0) {
    console.error("[active-time] RPC claim failed:", error);
    return { success: false, reason: "claim_failed" };
  }

  const result = data[0];
  
  if (!result.out_success) {
    return {
      success: false,
      reason: result.out_reason,
      totalSeconds: result.out_total_seconds,
    };
  }

  // Success! Now credit wallet via the existing helper
  try {
    const { creditWallet } = await import("../coinquest.server");
    const rewardAmount = Number(result.out_reward_amount);
    
    // Get quest label for description
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: quest } = await (db as any)
      .from("quests")
      .select("label")
      .eq("key", questKey)
      .maybeSingle();
    
    const questLabel = quest?.label || questKey;
    
    // Find or create quest session
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let { data: session } = await (db as any)
      .from("quest_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("quest_key", questKey)
      .in("status", ["started", "verified"])
      .order("started_at", { ascending: false })
      .maybeSingle();
    
    // Create session if none exists
    if (!session) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newSession, error: sessionError } = await (db as any)
        .from("quest_sessions")
        .insert({
          user_id: userId,
          quest_key: questKey,
          quest_type: "active_time",
          status: "started",
          reward_amount: rewardAmount,
        })
        .select("id")
        .single();
      
      if (sessionError) {
        console.error("[active-time] Failed to create session:", sessionError);
        // Rollback credited_at flag
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (db as any)
          .from("quest_active_time_progress")
          .update({ credited_at: null })
          .eq("user_id", userId)
          .eq("quest_key", questKey);
        return { success: false, reason: "session_creation_failed" };
      }
      
      session = newSession;
    }
    
    const sessionId = session.id as string;
    
    // Credit wallet using the standard helper
    await creditWallet(
      userId,
      rewardAmount,
      "quest",
      `Active time — ${questLabel}`,
      "earned",
      sessionId, // reference_id = session_id for idempotency
    );
    
    // Mark session as credited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any)
      .from("quest_sessions")
      .update({ status: "credited", credited_at: new Date().toISOString() })
      .eq("id", sessionId);
    
    // Send notification
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any)
      .from("notifications")
      .insert({
        user_id: userId,
        title: "Quest completed",
        body: `You earned $${rewardAmount.toFixed(2)} for "${questLabel}".`,
        kind: "quest",
      });
    
    return {
      success: true,
      reason: "claimed",
      totalSeconds: result.out_total_seconds,
    };
  } catch (creditError) {
    console.error("[active-time] Wallet credit failed:", creditError);
    
    // Rollback credited_at flag so user can retry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any)
      .from("quest_active_time_progress")
      .update({ credited_at: null })
      .eq("user_id", userId)
      .eq("quest_key", questKey);
    
    return { success: false, reason: "wallet_credit_failed" };
  }
}
