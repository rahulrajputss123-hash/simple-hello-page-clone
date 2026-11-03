/**
 * Timed PTC quest server functions
 * Reuses the shortlink step system (issued_step, step_issued_at) with timed checkpoints
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  getQuestByKey,
  assertQuestPlatform,
  assertQuestNotLocked,
  creditStepReward,
  finishQuestSession,
} from "../quests.server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as unknown as { from: (t: string) => any };

export async function startTimedPtcStepImpl(
  userId: string,
  questKey: string,
  step: number,
  isNative: boolean,
) {
  // Web only — reject native
  if (isNative) {
    throw new Error("Timed PTC quests are only available on web.");
  }

  const quest = await getQuestByKey(questKey);
  if (quest.quest_type !== "timed_ptc") {
    throw new Error("This quest is not a timed PTC quest.");
  }
  assertQuestPlatform(quest, isNative);

  // Soft path: no steps configured yet is expected, not an error
  if (!quest.timed_steps || !quest.timed_steps.length) {
    return { unavailable: true as const };
  }

  await assertQuestNotLocked(userId, quest);

  const session = await db
    .from("quest_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("quest_key", questKey)
    .eq("status", "started")
    .maybeSingle();

  if (!session.data) {
    throw new Error("Start the quest first.");
  }

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

  const stepConfig = quest.timed_steps[step - 1] ?? null;
  const adNetwork = stepConfig?.ad_network ?? null;
  const pushNetwork = stepConfig?.push_network ?? null;

  return {
    sessionId: session.data.id as string,
    step,
    adNetwork,
    pushNetwork,
    timedStepSeconds: quest.timed_step_seconds ?? 60,
    timedCheckpointSeconds: quest.timed_checkpoint_seconds ?? 10,
    timedMaxFailedTaps: quest.timed_max_failed_taps ?? 2,
  };
}

export async function completeTimedPtcStepImpl(
  userId: string,
  questKey: string,
  step: number,
  checkpointsDone: number,
  isNative: boolean,
) {
  // Web only — reject native
  if (isNative) {
    throw new Error("Timed PTC quests are only available on web.");
  }

  const quest = await getQuestByKey(questKey);
  if (quest.quest_type !== "timed_ptc") {
    throw new Error("This quest is not a timed PTC quest.");
  }
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

  if (!session.data) {
    throw new Error("No active session for this quest.");
  }

  if (session.data.status === "verified") {
    const reward = Number(quest.reward_amount);
    await finishQuestSession(
      userId,
      session.data.id as string,
      reward,
      `Timed PTC quest — ${quest.label}`,
    );
    // Step count is whatever the admin configured (1-10) — no fixed assumption.
    const total = Math.max(1, quest.timed_steps?.length ?? 1);
    return {
      completed: true,
      credited: true,
      reward,
      nextStep: null,
      nextAdNetwork: null,
      nextPushNetwork: null,
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

  const timedStepSeconds = quest.timed_step_seconds ?? 60;
  const timedCheckpointSeconds = quest.timed_checkpoint_seconds ?? 10;

  // Validate elapsed time
  if (!issuedAt || elapsed < timedStepSeconds) {
    throw new Error(
      `Step opened too quickly. Please spend at least ${timedStepSeconds} seconds on this step.`,
    );
  }

  // Validate checkpoint count
  const requiredCheckpoints = Math.floor(timedStepSeconds / timedCheckpointSeconds) - 1;
  if (checkpointsDone < requiredCheckpoints) {
    throw new Error(
      `Not enough checkpoints completed. Required: ${requiredCheckpoints}, completed: ${checkpointsDone}.`,
    );
  }

  // Step count is whatever the admin configured (1-10) — no fixed assumption.
  const total = Math.max(1, quest.timed_steps?.length ?? 1);
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

  // Record task event for this completed timed PTC step
  await db.from("task_events").insert({
    user_id: userId,
    category: "quest",
    event_key: `timed_ptc_step_${questKey}_${step}`,
    metadata: {
      quest_session_id: session.data.id,
      quest_key: questKey,
      step,
      checkpoints_done: checkpointsDone,
    },
  });

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

    const reward = Number(quest.reward_amount);
    await finishQuestSession(
      userId,
      session.data.id as string,
      reward,
      `Timed PTC quest — ${quest.label}`,
    );

    return {
      completed: true,
      credited: true,
      reward,
      nextStep: null,
      nextAdNetwork: null,
      nextPushNetwork: null,
      step,
      total,
    };
  }

  // Advance to next step
  await db
    .from("quest_sessions")
    .update({
      current_step: step,
      issued_step: 0,
      step_issued_at: null,
    })
    .eq("id", session.data.id);

  const nextStep = step + 1;
  const nextStepConfig = quest.timed_steps?.[nextStep - 1] ?? null;
  const nextAdNetwork = nextStepConfig?.ad_network ?? null;
  const nextPushNetwork = nextStepConfig?.push_network ?? null;

  return {
    completed: false,
    credited: stepRewardCredited,
    reward: stepRewardCredited ? stepReward : 0,
    nextStep,
    nextAdNetwork,
    nextPushNetwork,
    step,
    total,
  };
}
