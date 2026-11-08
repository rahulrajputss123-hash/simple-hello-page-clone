/**
 * Active Time Quest - Server-authoritative time tracking
 * 
 * Now uses atomic Postgres function ping_active_time() for:
 * - INSERT-or-UPDATE with SELECT FOR UPDATE lock
 * - Token chain validation
 * - Credit calculation (min(gap, 35s) or grace)
 * - Daily cap enforcement
 * 
 * This eliminates race conditions and simplifies the code.
 */

import type { DbClient } from "../quests.server";

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
 * Process an active time ping - calls atomic Postgres function
 * 
 * @param db - Supabase client (service role)
 * @param userId - Authenticated user ID
 * @param questKey - Quest key
 * @param lastToken - Token from previous ping
 * @param interactionProof - Unused (for future)
 * @returns Ping result with next token and progress
 */
export async function processActiveTimePing(
  db: DbClient,
  userId: string,
  questKey: string,
  lastToken: string | null,
  interactionProof?: string,
): Promise<PingResult> {
  const userShort = userId.slice(0, 8);
  const tokenShort = lastToken?.slice(0, 8) || 'none';
  
  console.log(`[active-time] PING user=${userShort} quest=${questKey} token=${tokenShort}`);

  try {
    // Call atomic Postgres function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (db as any).rpc("ping_active_time", {
      p_user_id: userId,
      p_quest_key: questKey,
      p_ping_token: lastToken || "00000000-0000-0000-0000-000000000000",
      p_is_active: true,
    });

    if (error) {
      console.error(`[active-time] RPC ERROR user=${userShort}:`, error);
      throw new Error(`Ping RPC failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.error(`[active-time] RPC returned no data for user=${userShort}`);
      throw new Error("Ping returned no data");
    }

    const result = data[0];
    
    console.log(`[active-time] RESULT user=${userShort} success=${result.success} total=${result.total_seconds}s reason=${result.reason}`);

    return {
      success: result.success,
      reason: result.reason,
      nextToken: result.next_token,
      totalSeconds: result.total_seconds,
      todaySeconds: result.today_seconds,
      targetSeconds: result.target_seconds,
      progressPercent: Math.min(100, (result.total_seconds / result.target_seconds) * 100),
      canClaim: result.can_claim,
    };
  } catch (error) {
    console.error(`[active-time] EXCEPTION user=${userShort}:`, error);
    throw error;
  }
}

/**
 * Start a grace period when user clicks an offer/survey
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
    graceCount = 0;
  }

  if (graceCount >= 3) {
    return { success: false, reason: "grace_limit_reached", graceUntil: null };
  }

  // Check per-offer cooldown (24h)
  const cooldownStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
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
 * End grace period early
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
    return;
  }

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
 * Claim active time quest reward
 */
export async function claimActiveTimeReward(
  db: DbClient,
  userId: string,
  questKey: string,
): Promise<{ success: boolean; reason: string; totalSeconds?: number }> {
  // Call atomic Postgres function
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

  // Credit wallet
  try {
    const { creditWallet } = await import("../coinquest.server");
    const rewardAmount = Number(result.out_reward_amount);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: quest } = await (db as any)
      .from("quests")
      .select("label")
      .eq("key", questKey)
      .maybeSingle();
    
    const questLabel = quest?.label || questKey;
    
    // Find or create session
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let { data: session } = await (db as any)
      .from("quest_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("quest_key", questKey)
      .in("status", ["started", "verified"])
      .order("started_at", { ascending: false })
      .maybeSingle();
    
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
        console.error("[active-time] Session create failed:", sessionError);
        // Rollback
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
    
    await creditWallet(
      userId,
      rewardAmount,
      "quest",
      `Active time — ${questLabel}`,
      "earned",
      sessionId,
    );
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any)
      .from("quest_sessions")
      .update({ status: "credited", credited_at: new Date().toISOString() })
      .eq("id", sessionId);
    
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
    
    // Rollback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any)
      .from("quest_active_time_progress")
      .update({ credited_at: null })
      .eq("user_id", userId)
      .eq("quest_key", questKey);
    
    return { success: false, reason: "wallet_credit_failed" };
  }
}
