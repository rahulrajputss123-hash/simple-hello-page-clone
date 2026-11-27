/**
 * Sponsor PTC quest server functions
 * 
 * Multi-step PTC quests where each step is on its own sub-domain.
 * Uses handoff tokens for secure cross-domain transfer and session tokens
 * for visit tracking with server-side time validation.
 */

import crypto from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  getQuestByKey,
  assertQuestPlatform,
  assertQuestNotLocked,
  creditStepReward,
  finishQuestSession,
  type QuestRow,
} from "../quests.server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as unknown as { from: (t: string) => any };

type SponsorStep = {
  host: string;
  content_key: "special_missions" | "marketplace" | "surveys_offers";
  smartlink_url: string;
  push_network: "none" | "propush" | "evadav" | "rollerads";
};

type Visit = {
  seconds_done: number;
  open_started_at: string | null;
  done: boolean;
};

/**
 * Generate a random token and return both the token and its SHA-256 hash.
 * Store only the hash in the database.
 */
function generateToken(): { token: string; hash: string } {
  const bytes = crypto.randomBytes(32);
  const token = bytes.toString("base64url");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hash };
}

/**
 * Hash a token using SHA-256 for database lookup.
 */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Issue a handoff URL for a sponsor PTC step.
 * Web only (rejects native). Enforces strict step order.
 * Returns URL: https://{step.host}/ptc?t={token}
 */
export async function issueSponsorHandoffImpl(
  userId: string,
  questKey: string,
  stepIndex: number,
  isNative: boolean,
): Promise<{ url: string }> {
  // Web only — reject native
  if (isNative) {
    throw new Error("Sponsor PTC quests are only available on web.");
  }

  const quest = await getQuestByKey(questKey);
  if (quest.quest_type !== "sponsor_ptc") {
    throw new Error("This quest is not a sponsor PTC quest.");
  }
  assertQuestPlatform(quest, isNative);
  await assertQuestNotLocked(userId, quest);

  const sponsorSteps = (quest.sponsor_steps as SponsorStep[]) || [];
  if (stepIndex < 1 || stepIndex > sponsorSteps.length) {
    throw new Error("Invalid step index.");
  }

  const step = sponsorSteps[stepIndex - 1];

  // Get or create quest session
  const { data: existingSession } = await db
    .from("quest_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("quest_key", questKey)
    .in("status", ["started", "verified"])
    .order("started_at", { ascending: false })
    .maybeSingle();

  let sessionId: string;
  if (existingSession) {
    sessionId = existingSession.id as string;
  } else {
    // Create new quest session
    const { data: newSession, error } = await db
      .from("quest_sessions")
      .insert({
        user_id: userId,
        quest_key: questKey,
        quest_type: "sponsor_ptc",
        status: "started",
        current_step: 0,
        reward_amount: Number(quest.reward_amount),
      })
      .select("id")
      .single();

    if (error) throw error;
    sessionId = newSession.id as string;
  }

  // Enforce strict step order using quest_sessions.current_step
  const currentStep = Number(existingSession?.current_step ?? 0);
  if (stepIndex !== currentStep + 1) {
    throw new Error("Complete the previous step first.");
  }

  // Check if sponsor_ptc_session already exists for this step
  const { data: existingPtcSession } = await db
    .from("sponsor_ptc_sessions")
    .select("*")
    .eq("quest_session_id", sessionId)
    .eq("step_index", stepIndex)
    .maybeSingle();

  let ptcSessionId: string;
  if (existingPtcSession) {
    // Reuse existing session
    ptcSessionId = existingPtcSession.id as string;

    // If already completed, don't allow re-issue
    if (existingPtcSession.completed_at) {
      throw new Error("This step is already completed.");
    }
  } else {
    // Create new sponsor_ptc_session
    const visits: Visit[] = Array.from({ length: quest.sponsor_visits }, () => ({
      seconds_done: 0,
      open_started_at: null,
      done: false,
    }));

    const { data: newPtcSession, error } = await db
      .from("sponsor_ptc_sessions")
      .insert({
        user_id: userId,
        quest_id: quest.id,
        quest_session_id: sessionId,
        step_index: stepIndex,
        host: step.host,
        visits,
      })
      .select("id")
      .single();

    if (error) throw error;
    ptcSessionId = newPtcSession.id as string;
  }

  // Generate handoff token (expires in 10 minutes)
  const { token, hash } = generateToken();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db
    .from("sponsor_ptc_sessions")
    .update({
      handoff_hash: hash,
      handoff_used_at: null, // Reset if re-issuing
    })
    .eq("id", ptcSessionId);

  // Return handoff URL
  const url = `https://${step.host}/ptc?t=${token}`;
  return { url };
}

/**
 * Redeem a handoff token and create a session token.
 * Public, no auth required. Validates host, expiry, and single-use.
 */
export async function redeemSponsorHandoffImpl(
  token: string,
  requestHost: string,
): Promise<{ sessionToken: string; state: any }> {
  const hash = hashToken(token);

  // Find the sponsor_ptc_session by handoff_hash
  const { data: ptcSession } = await db
    .from("sponsor_ptc_sessions")
    .select("*")
    .eq("handoff_hash", hash)
    .maybeSingle();

  if (!ptcSession) {
    throw new Error("Invalid or expired handoff token.");
  }

  // Validate host
  if (ptcSession.host !== requestHost) {
    throw new Error("Invalid host for this handoff token.");
  }

  // Check if already used
  if (ptcSession.handoff_used_at) {
    throw new Error("Handoff token already used.");
  }

  // Check expiry (10 minutes from created_at)
  const createdAt = new Date(ptcSession.created_at as string).getTime();
  const now = Date.now();
  if (now - createdAt > 10 * 60 * 1000) {
    throw new Error("Handoff token expired.");
  }

  // Mark handoff as used and create session token (expires in 45 minutes)
  const { token: sessionToken, hash: sessionHash } = generateToken();
  const sessionExpiresAt = new Date(now + 45 * 60 * 1000);

  await db
    .from("sponsor_ptc_sessions")
    .update({
      handoff_used_at: new Date(now).toISOString(),
      session_hash: sessionHash,
      session_expires_at: sessionExpiresAt.toISOString(),
    })
    .eq("id", ptcSession.id);

  // Get quest details for state
  const { data: quest } = await db
    .from("quests")
    .select("*")
    .eq("id", ptcSession.quest_id)
    .single();

  const sponsorSteps = (quest.sponsor_steps as SponsorStep[]) || [];
  const step = sponsorSteps[ptcSession.step_index - 1];

  const visits = ptcSession.visits as Visit[];
  const currentVisitIndex = visits.findIndex((v) => !v.done);

  const state = {
    content_key: step.content_key,
    smartlink_url: step.smartlink_url,
    push_network: step.push_network,
    visits: visits.length,
    visit_seconds: quest.sponsor_visit_seconds,
    visit_states: visits,
    current_visit_index: currentVisitIndex,
    step_index: ptcSession.step_index,
    total_steps: sponsorSteps.length,
    step_reward: quest.step_rewards?.[ptcSession.step_index - 1] ?? quest.step_reward,
    completion_bonus: quest.reward_amount,
  };

  return { sessionToken, state };
}

/**
 * Get current state for a sponsor PTC session.
 * Requires valid session token.
 */
export async function getSponsorStateImpl(
  sessionToken: string,
): Promise<any> {
  const hash = hashToken(sessionToken);

  // Find the sponsor_ptc_session by session_hash
  const { data: ptcSession } = await db
    .from("sponsor_ptc_sessions")
    .select("*")
    .eq("session_hash", hash)
    .maybeSingle();

  if (!ptcSession) {
    throw new Error("Invalid or expired session token.");
  }

  // Check expiry
  if (ptcSession.session_expires_at) {
    const expiresAt = new Date(ptcSession.session_expires_at as string).getTime();
    if (Date.now() > expiresAt) {
      throw new Error("Session token expired.");
    }
  }

  // Get quest details
  const { data: quest } = await db
    .from("quests")
    .select("*")
    .eq("id", ptcSession.quest_id)
    .single();

  const sponsorSteps = (quest.sponsor_steps as SponsorStep[]) || [];
  const step = sponsorSteps[ptcSession.step_index - 1];

  const visits = ptcSession.visits as Visit[];
  const currentVisitIndex = visits.findIndex((v) => !v.done);

  return {
    content_key: step.content_key,
    smartlink_url: step.smartlink_url,
    push_network: step.push_network,
    visits: visits.length,
    visit_seconds: quest.sponsor_visit_seconds,
    visit_states: visits,
    current_visit_index: currentVisitIndex,
    step_index: ptcSession.step_index,
    total_steps: sponsorSteps.length,
    step_reward: quest.step_rewards?.[ptcSession.step_index - 1] ?? quest.step_reward,
    completion_bonus: quest.reward_amount,
    completed: !!ptcSession.completed_at,
  };
}

/**
 * Start a sponsor PTC visit.
 * Sets open_started_at for the current (first not-done) visit.
 */
export async function startSponsorVisitImpl(
  sessionToken: string,
): Promise<{ success: boolean; visit_index: number }> {
  const hash = hashToken(sessionToken);

  const { data: ptcSession } = await db
    .from("sponsor_ptc_sessions")
    .select("*")
    .eq("session_hash", hash)
    .maybeSingle();

  if (!ptcSession) {
    throw new Error("Invalid or expired session token.");
  }

  // Check expiry
  if (ptcSession.session_expires_at) {
    const expiresAt = new Date(ptcSession.session_expires_at as string).getTime();
    if (Date.now() > expiresAt) {
      throw new Error("Session token expired.");
    }
  }

  const visits = ptcSession.visits as Visit[];
  const currentVisitIndex = visits.findIndex((v) => !v.done);

  if (currentVisitIndex === -1) {
    throw new Error("All visits are already completed.");
  }

  // Set open_started_at for current visit
  visits[currentVisitIndex].open_started_at = new Date().toISOString();

  await db
    .from("sponsor_ptc_sessions")
    .update({ visits })
    .eq("id", ptcSession.id);

  return { success: true, visit_index: currentVisitIndex };
}

/**
 * Return from a sponsor PTC visit.
 * Calculates time spent based on wasHidden flag and updates seconds_done.
 * Marks visit as done when seconds_done >= visit_seconds.
 */
export async function returnSponsorVisitImpl(
  sessionToken: string,
  wasHidden: boolean,
): Promise<any> {
  const hash = hashToken(sessionToken);

  const { data: ptcSession } = await db
    .from("sponsor_ptc_sessions")
    .select("*")
    .eq("session_hash", hash)
    .maybeSingle();

  if (!ptcSession) {
    throw new Error("Invalid or expired session token.");
  }

  // Check expiry
  if (ptcSession.session_expires_at) {
    const expiresAt = new Date(ptcSession.session_expires_at as string).getTime();
    if (Date.now() > expiresAt) {
      throw new Error("Session token expired.");
    }
  }

  const { data: quest } = await db
    .from("quests")
    .select("sponsor_visit_seconds")
    .eq("id", ptcSession.quest_id)
    .single();

  const visitSeconds = quest.sponsor_visit_seconds;
  const visits = ptcSession.visits as Visit[];
  const currentVisitIndex = visits.findIndex((v) => !v.done);

  if (currentVisitIndex === -1) {
    throw new Error("All visits are already completed.");
  }

  const visit = visits[currentVisitIndex];

  // Calculate time spent if wasHidden is true and open_started_at is set
  if (wasHidden && visit.open_started_at) {
    const openStartedAt = new Date(visit.open_started_at).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - openStartedAt) / 1000);
    
    // Cap at 600 seconds (10 minutes) to prevent abuse
    const creditable = Math.min(elapsed, 600);
    visit.seconds_done = Math.min(visit.seconds_done + creditable, visitSeconds);
    visit.open_started_at = null;

    // Mark as done if threshold reached
    if (visit.seconds_done >= visitSeconds) {
      visit.done = true;
    }
  } else if (!wasHidden) {
    // User closed the page without hiding - no time credited
    visit.open_started_at = null;
  }

  await db
    .from("sponsor_ptc_sessions")
    .update({ visits })
    .eq("id", ptcSession.id);

  const newCurrentVisitIndex = visits.findIndex((v) => !v.done);

  return {
    success: true,
    visit_states: visits,
    current_visit_index: newCurrentVisitIndex,
    all_done: newCurrentVisitIndex === -1,
  };
}

/**
 * Complete a sponsor PTC step.
 * Requires all visits done AND elapsed time >= visits * visit_seconds.
 * Credits step reward idempotently and returns next handoff URL or final URL.
 * Derives userId, questKey, and stepIndex from the session token.
 */
export async function completeSponsorStepImpl(
  sessionToken: string,
): Promise<{ nextUrl?: string; finalUrl?: string }> {
  const hash = hashToken(sessionToken);

  const { data: ptcSession } = await db
    .from("sponsor_ptc_sessions")
    .select("*")
    .eq("session_hash", hash)
    .maybeSingle();

  if (!ptcSession) {
    throw new Error("Invalid or expired session token.");
  }

  // Check expiry
  if (ptcSession.session_expires_at) {
    const expiresAt = new Date(ptcSession.session_expires_at as string).getTime();
    if (Date.now() > expiresAt) {
      throw new Error("Session token expired.");
    }
  }

  // Check if already completed (idempotent - return same result)
  if (ptcSession.completed_at) {
    const { data: quest } = await db
      .from("quests")
      .select("key, sponsor_steps")
      .eq("id", ptcSession.quest_id)
      .single();

    const sponsorSteps = (quest.sponsor_steps as SponsorStep[]) || [];
    const isFinal = ptcSession.step_index >= sponsorSteps.length;

    if (isFinal) {
      return { finalUrl: "https://cashgpt.in/" };
    }

    // Re-issue next step handoff
    const nextStepIndex = ptcSession.step_index + 1;
    const userId = ptcSession.user_id as string;
    const nextResult = await issueSponsorHandoffImpl(userId, quest.key, nextStepIndex, false);
    return { nextUrl: nextResult.url };
  }

  // Derive userId and questKey from session
  const userId = ptcSession.user_id as string;

  const { data: quest } = await db
    .from("quests")
    .select("*")
    .eq("id", ptcSession.quest_id)
    .single();

  const questKey = quest.key;

  const visits = ptcSession.visits as Visit[];
  const allDone = visits.every((v) => v.done);

  if (!allDone) {
    throw new Error("Not all visits are completed.");
  }

  // Check total elapsed time
  const createdAt = new Date(ptcSession.created_at as string).getTime();
  const now = Date.now();
  const elapsedSeconds = (now - createdAt) / 1000;
  const requiredSeconds = visits.length * quest.sponsor_visit_seconds;

  if (elapsedSeconds < requiredSeconds) {
    throw new Error(
      `Minimum time not met. Required: ${requiredSeconds}s, elapsed: ${Math.floor(elapsedSeconds)}s.`,
    );
  }

  // Credit step reward (idempotent via quest_step_credits unique constraint)
  const stepIndex = ptcSession.step_index;
  const stepReward = quest.step_rewards?.[stepIndex - 1] ?? quest.step_reward;

  await creditStepReward(
    userId,
    ptcSession.quest_session_id as string,
    questKey,
    quest.label,
    stepIndex,
    stepReward,
  );

  // Mark step completed
  await db
    .from("sponsor_ptc_sessions")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", ptcSession.id)
    .is("completed_at", null); // Only update if not already completed

  // Update quest_sessions.current_step
  await db
    .from("quest_sessions")
    .update({ current_step: stepIndex })
    .eq("id", ptcSession.quest_session_id);

  const sponsorSteps = (quest.sponsor_steps as SponsorStep[]) || [];
  const isFinal = stepIndex >= sponsorSteps.length;

  if (isFinal) {
    // Finish quest session and credit completion bonus
    await db
      .from("quest_sessions")
      .update({
        status: "verified",
        verified_at: new Date().toISOString(),
      })
      .eq("id", ptcSession.quest_session_id)
      .eq("status", "started");

    const reward = Number(quest.reward_amount);
    await finishQuestSession(
      userId,
      ptcSession.quest_session_id as string,
      reward,
      `Sponsor PTC quest — ${quest.label}`,
    );

    return { finalUrl: "https://cashgpt.in/" };
  }

  // Issue next step handoff
  const nextStepIndex = stepIndex + 1;
  const nextResult = await issueSponsorHandoffImpl(userId, questKey, nextStepIndex, false);

  return { nextUrl: nextResult.url };
}
