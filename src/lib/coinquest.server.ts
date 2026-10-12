import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  formatMoney,
  MAX_ADS_PER_HOUR,
  MIN_SECONDS_PER_AD,
  MIN_WITHDRAWAL,
  REFERRAL_MAX_BONUS,
  REFERRAL_WINDOW_DAYS,
  STREAK_BONUS,
  STREAK_GOAL,
} from "./coinquest";
import type { Json, Tables } from "@/integrations/supabase/types";
import { buildPayoutSnapshot, payoutMethodSpec } from "./payout-methods";
import { deriveReferralProgress, REFERRAL_MILESTONE_COUNT } from "./referral-progress";
import {
  cancelWithdrawalRpc,
  releaseReferralRewardRpc,
  requestWithdrawalRpc,
  reverseExpiredReferralRpc,
  settleOfferClaimRpc,
  settleWithdrawalRpc,
  walletApply,
  WalletRpcError,
  deterministicReferenceId,
  type WalletApplyResult,
} from "./wallet/rpc.server";

/** True when a wallet RPC failed with the given machine-readable code. */
function isWalletError(error: unknown, code: string): boolean {
  return error instanceof WalletRpcError && error.code === code;
}

function code(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 7; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return `CQ${out}`;
}

async function notify(userId: string, title: string, body: string, kind = "info") {
  await supabaseAdmin.from("notifications").insert({ user_id: userId, title, body, kind });
}

export async function ensureProfileImpl(input: {
  userId: string;
  email: string | null;
  name?: string | undefined;
  phone?: string | undefined;
  referralCode?: string | undefined;
  deviceId?: string | undefined;
}) {
  const existing = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", input.userId)
    .maybeSingle();

  if (existing.data) {
    const patch: { name?: string; phone?: string; device_id?: string; email?: string } = {};
    if (input.name && !existing.data.name) patch.name = input.name;
    if (input.phone && !existing.data.phone) patch.phone = input.phone;
    if (input.deviceId && !existing.data.device_id) patch.device_id = input.deviceId;
    if (input.email && !existing.data.email) patch.email = input.email;
    if (Object.keys(patch).length) {
      await supabaseAdmin.from("profiles").update(patch).eq("id", input.userId);
    }
    return { ...existing.data, ...patch };
  }

  // one-account-per-device: flag rather than block, admins review
  let flagged = false;
  if (input.deviceId && input.deviceId !== "server") {
    const dupes = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("device_id", input.deviceId)
      .limit(1);
    flagged = Boolean(dupes.data?.length);
  }

  let referralCode = code();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const clash = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("referral_code", referralCode)
      .maybeSingle();
    if (!clash.data) break;
    referralCode = code();
  }

  let referrerId: string | null = null;
  const referredBy = input.referralCode?.trim().toUpperCase() || null;
  if (referredBy) {
    const ref = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("referral_code", referredBy)
      .maybeSingle();
    referrerId = ref.data?.id ?? null;
  }

  const inserted = await supabaseAdmin
    .from("profiles")
    .insert({
      id: input.userId,
      name: input.name ?? "",
      email: input.email,
      phone: input.phone ?? null,
      referral_code: referralCode,
      referred_by: referrerId ? referredBy : null,
      device_id: input.deviceId ?? null,
      is_flagged: flagged,
    })
    .select("*")
    .single();

  if (inserted.error) throw new Error("Could not create your profile. Please try again.");

  if (referrerId) {
    const referral = await supabaseAdmin
      .from("referrals")
      .insert({
        referrer_id: referrerId,
        referred_id: input.userId,
        code: referredBy!,
        bonus_amount: 0,
        status: "pending",
      })
      .select("*")
      .single();
    await notify(
      referrerId,
      "New referral joined",
      "A friend signed up with your code.",
      "referral",
    );
    if (referral.data) {
      await creditReferralMilestone(referral.data.id, "signup", "Referral: friend signed up");
      const { recordTaskEvent } = await import("./tasks/engine.server");
      await recordTaskEvent({
        userId: referrerId,
        eventType: "referral",
        eventKey: referral.data.id,
      });
    }
  }

  await notify(
    input.userId,
    "Welcome to CashGPT",
    "Complete your first starter quest to earn your first $1.00.",
    "welcome",
  );

  return inserted.data;
}

export async function completeOnboardingImpl(
  userId: string,
  values: { name: string; phone?: string | undefined; deviceId?: string | undefined },
) {
  const patch: { name: string; onboarded: boolean; phone?: string; device_id?: string } = {
    name: values.name,
    onboarded: true,
  };
  if (values.phone) patch.phone = values.phone;
  if (values.deviceId) patch.device_id = values.deviceId;
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw new Error("Could not save your details.");
  return data;
}

type ReferralMilestone = "signup" | "earning" | "withdrawal";

const MILESTONE_COLUMN = {
  signup: "signup_credited_at",
  earning: "earning_credited_at",
  withdrawal: "withdrawal_credited_at",
} as const;

/**
 * Records one referral milestone.
 *
 * Deliberately pays nothing: milestones are tracked individually but the reward
 * stays PENDING/LOCKED until all three are complete, at which point
 * releaseReferralReward pays the full REFERRAL_MAX_BONUS once. Idempotent — the
 * milestone timestamp column is claimed with a conditional update, so the same
 * milestone can never be recorded (or notified) twice.
 */
async function creditReferralMilestone(
  referralId: string,
  milestone: ReferralMilestone,
  description: string,
) {
  const column = MILESTONE_COLUMN[milestone];
  const referral = await supabaseAdmin
    .from("referrals")
    .select("*")
    .eq("id", referralId)
    .maybeSingle();
  if (!referral.data) return;

  if (!referral.data[column]) {
    const patch: {
      signup_credited_at?: string;
      earning_credited_at?: string;
      withdrawal_credited_at?: string;
    } = {};
    patch[column] = new Date().toISOString();

    const claimed = await supabaseAdmin
      .from("referrals")
      .update(patch)
      .eq("id", referralId)
      .is(column, null)
      .select("*");
    if (!claimed.data?.length) return; // another run already recorded it

    const progress = deriveReferralProgress(claimed.data[0]!);
    if (!progress.allComplete) {
      await notify(
        referral.data.referrer_id,
        "Referral milestone reached",
        `${description} — ${formatMoney(progress.pendingAmount)} pending, unlocks at ${progress.total}/${progress.total}.`,
        "referral",
      );
    }
  }

  // Re-checked on every call: an earlier run may have recorded the final
  // milestone but failed before the payout, so this is the retry path too.
  await releaseReferralReward(referralId);
}

/**
 * Releases the full referral reward into the referrer's MAIN wallet, once, after
 * all three milestones are complete and inside the 365-day window.
 *
 * The release claim (`reward_released_at`) and the referrer credit commit in a
 * single transaction (referral_release_reward), which re-checks milestones and
 * the window under a row lock. Duplicate events, retries and concurrent callers
 * can only ever produce a single credit, and a failed credit no longer burns
 * the claim. Legacy rows that already hold part of the reward are only topped
 * up to the maximum.
 */
async function releaseReferralReward(referralId: string) {
  const referral = await supabaseAdmin
    .from("referrals")
    .select("*")
    .eq("id", referralId)
    .maybeSingle();
  if (!referral.data) return;
  if (referral.data.reward_released_at) return; // already released

  // Cheap pre-checks; the RPC re-checks both under the lock.
  const progress = deriveReferralProgress(referral.data);
  if (!progress.allComplete) return; // still pending
  if (progress.expired) return; // outside the window — nothing is released

  let result: Awaited<ReturnType<typeof releaseReferralRewardRpc>>;
  try {
    result = await releaseReferralRewardRpc({
      referralId,
      maxBonus: REFERRAL_MAX_BONUS,
      windowDays: REFERRAL_WINDOW_DAYS,
      description: `Referral reward — friend completed all ${REFERRAL_MILESTONE_COUNT} milestones`,
    });
  } catch (error) {
    // Nothing committed. Every later milestone event re-runs this release, so
    // it is retried rather than lost; never fail the caller's own credit.
    console.error("[referral] release failed", { referralId, error });
    return;
  }
  if (!result.released || result.payout <= 0) return;

  await notify(
    referral.data.referrer_id,
    "Referral reward unlocked",
    `${formatMoney(result.payout)} has been added to your wallet.`,
    "referral",
  );
}

/** Looks up the referral row for a referred user and credits a milestone once. */
export async function payReferralMilestone(
  referredUserId: string,
  milestone: ReferralMilestone,
  description: string,
) {
  const referral = await supabaseAdmin
    .from("referrals")
    .select("*")
    .eq("referred_id", referredUserId)
    .maybeSingle();
  if (!referral.data) return;

  // Already settled in full — nothing further to record or pay.
  if (referral.data.reward_released_at) return;

  const expired =
    Date.now() - new Date(referral.data.created_at).getTime() > REFERRAL_WINDOW_DAYS * 86_400_000;

  // Past the 1-year window the referral pays nothing and already-credited
  // milestones are reversed from the referrer's balance.
  if (expired) {
    // Mark the state so the Referral screen can show it, whichever event fired.
    if (referral.data.status !== "expired") {
      await supabaseAdmin
        .from("referrals")
        .update({ status: "expired" })
        .eq("id", referral.data.id);
    }
    if (milestone !== "withdrawal") return;
    if (Number(referral.data.bonus_amount ?? 0) <= 0) return;
    // Debit, ledger row and bonus_amount reset commit together, exactly once.
    try {
      const reversal = await reverseExpiredReferralRpc(
        referral.data.id,
        "Referral rewards reversed (1-year limit)",
      );
      if (!reversal.reversed) return;
    } catch (error) {
      console.error("[referral] expiry reversal failed", { referralId: referral.data.id, error });
      return;
    }
    await notify(
      referral.data.referrer_id,
      "Referral rewards reversed",
      "A referral did not complete all milestones within 1 year.",
      "referral",
    );
    return;
  }

  await creditReferralMilestone(referral.data.id, milestone, description);
}

/**
 * Credits a publisher wallet. Atomic (wallet_apply): the balance increment and
 * its wallet_transactions row commit together under a row lock, so concurrent
 * credits can no longer overwrite each other. Throws "Wallet unavailable." if
 * nothing was credited.
 *
 * `referenceId` (optional) links the ledger row to its source record.
 */
export async function creditWallet(
  userId: string,
  amount: number,
  source: string,
  description: string,
  kind = "earned",
  referenceId: string | null = null,
): Promise<WalletApplyResult> {
  let result: WalletApplyResult;
  try {
    result = await walletApply({ userId, amount, source, kind, description, referenceId });
  } catch (error) {
    console.error("[wallet] credit failed", { userId, source, error });
    throw new Error("Wallet unavailable.");
  }
  // Same rule as before: lifetime_earned was 0 before this credit.
  const firstEarning = !result.duplicate && result.previousLifetimeEarned === 0;
  if (firstEarning && ["quest", "task", "offer"].includes(source)) {
    try {
      await payReferralMilestone(userId, "earning", "Referral: friend's first earning");
    } catch (error) {
      // The credit has committed; referral automation must never fail it.
      console.error("[referral] earning milestone failed", { userId, error });
    }
  }
  return result;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Bumps the daily streak; credits a bonus every STREAK_GOAL consecutive days. */
export async function touchStreakImpl(userId: string) {
  const profile = await supabaseAdmin
    .from("profiles")
    .select("streak_count, streak_date")
    .eq("id", userId)
    .maybeSingle();
  if (!profile.data) return { streak: 0, credited: false };

  const day = today();
  if (profile.data.streak_date === day) {
    return { streak: profile.data.streak_count, credited: false };
  }

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const streak = profile.data.streak_date === yesterday ? profile.data.streak_count + 1 : 1;

  // Claim today's bump only if nobody else did since we read it, so two
  // overlapping requests can't both count the day (or both pay the bonus).
  const bump = supabaseAdmin
    .from("profiles")
    .update({ streak_count: streak, streak_date: day })
    .eq("id", userId);
  const claimed = await (
    profile.data.streak_date
      ? bump.eq("streak_date", profile.data.streak_date)
      : bump.is("streak_date", null)
  ).select("id");
  if (!claimed.data?.length) return { streak: profile.data.streak_count, credited: false };

  if (streak > 0 && streak % STREAK_GOAL === 0) {
    try {
      // One bonus per user per day, enforced by the idempotent ledger reference.
      const credit = await creditWallet(
        userId,
        STREAK_BONUS,
        "streak",
        `${STREAK_GOAL}-day streak bonus`,
        "bonus",
        deterministicReferenceId("streak", userId, day),
      );
      if (!credit.duplicate) {
        await notify(
          userId,
          "Streak bonus",
          `You earned $${STREAK_BONUS.toFixed(2)} for your streak.`,
          "bonus",
        );
      }
      return { streak, credited: !credit.duplicate };
    } catch (error) {
      // The streak bump runs inside quest/task flows; a failed bonus must not
      // fail the earning that triggered it.
      console.error("[wallet] streak bonus failed", { userId, day, error });
      return { streak, credited: false };
    }
  }
  return { streak, credited: false };
}

export async function startQuestImpl(userId: string, questKey: string) {
  const { getQuestByKey, assertQuestNotLocked } = await import("./quests.server");
  const quest = await getQuestByKey(questKey);

  // Enforce lock server-side before allowing any quest progress.
  await assertQuestNotLocked(userId, quest);

  const open = await supabaseAdmin
    .from("quest_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("quest_key", questKey)
    .eq("status", "started")
    .maybeSingle();
  if (open.data) return open.data;

  const created = await supabaseAdmin
    .from("quest_sessions")
    .insert({
      user_id: userId,
      quest_key: quest.key,
      ads_required: quest.ads_required,
      reward_amount: quest.reward_amount,
      quest_type: quest.quest_type,
      current_step: 0,
    } as never)
    .select("*")
    .single();
  if (created.error) throw new Error("Could not start this quest.");
  return created.data;
}

export async function reportAdImpl(userId: string, sessionId: string) {
  const session = await supabaseAdmin
    .from("quest_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();
  if (session.error || !session.data) throw new Error("Quest session not found.");
  // 'verified' = the final ad was counted but crediting didn't finish (e.g. a
  // transient wallet error). Finish it instead of refusing; the credit is
  // idempotent per session, so this can never pay twice.
  if (session.data.status === "verified") return finishAdQuest(userId, session.data);
  if (session.data.status !== "started") throw new Error("This quest is already finished.");

  const nextCount = session.data.ads_watched + 1;

  // Server-side timing check: the elapsed wall clock must plausibly fit the ads.
  const elapsedSeconds = (Date.now() - new Date(session.data.started_at).getTime()) / 1000;
  if (elapsedSeconds < nextCount * MIN_SECONDS_PER_AD) {
    throw new Error("Ad was not watched long enough to count.");
  }

  // Rolling-hour rate limit across all sessions.
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const recent = await supabaseAdmin
    .from("quest_sessions")
    .select("ads_watched")
    .eq("user_id", userId)
    .gte("started_at", hourAgo);
  const recentAds = (recent.data ?? []).reduce((sum, r) => sum + r.ads_watched, 0);
  if (recentAds >= MAX_ADS_PER_HOUR) {
    throw new Error("You've hit the hourly limit. Try again a little later.");
  }

  const done = nextCount >= session.data.ads_required;
  // Conditional on the count we read: two overlapping reports of the same ad
  // can't both count it (or both reach the credit below).
  const updated = await supabaseAdmin
    .from("quest_sessions")
    .update({
      ads_watched: nextCount,
      status: done ? "verified" : "started",
      verified_at: done ? new Date().toISOString() : null,
    })
    .eq("id", sessionId)
    .eq("status", "started")
    .eq("ads_watched", session.data.ads_watched)
    .select("*")
    .maybeSingle();
  if (updated.error) throw new Error("Could not record that ad.");
  if (!updated.data) throw new Error("That ad was already counted. Please try again.");

  await touchStreakImpl(userId);

  {
    const { recordTaskEvent } = await import("./tasks/engine.server");
    await recordTaskEvent({
      userId,
      eventType: "ad_watch",
      eventKey: `${sessionId}:${nextCount}`,
    });
  }

  if (done) return finishAdQuest(userId, updated.data);

  return { ...updated.data, credited: false };
}

/**
 * Pays a 'verified' ads quest session and marks it credited. Safe to call more
 * than once: the credit is keyed on the session id, so only the first call pays
 * (and notifies).
 */
async function finishAdQuest(userId: string, session: Tables<"quest_sessions">) {
  const reward = Number(session.reward_amount);
  const credit = await creditWallet(
    userId,
    reward,
    "quest",
    `Starter quest — ${session.ads_required} ads`,
    "earned",
    session.id,
  );
  await supabaseAdmin
    .from("quest_sessions")
    .update({ status: "credited", credited_at: new Date().toISOString() })
    .eq("id", session.id)
    .eq("status", "verified");
  if (!credit.duplicate) {
    await notify(userId, "Quest completed", `You earned $${reward.toFixed(2)}.`, "quest");
  }
  // Drives the quest_count task type. Keyed on the session id so one completed
  // quest counts once, however many times this path is retried.
  {
    const { recordTaskEvent } = await import("./tasks/engine.server");
    await recordTaskEvent({ userId, eventType: "quest_completed", eventKey: session.id });
  }
  return { ...session, status: "credited", credited: true };
}

export async function completeTaskImpl(userId: string, taskId: string) {
  const task = await supabaseAdmin.from("tasks").select("*").eq("id", taskId).single();
  if (task.error || !task.data?.is_active) throw new Error("Task unavailable.");
  if ((task.data as { task_type?: string }).task_type !== "manual") {
    throw new Error("This task completes automatically from your activity.");
  }
  // Lock gate for manual tasks. Automated tasks are gated inside syncUserTasks;
  // this is the only path by which a user can advance a task by hand.
  {
    const { assertTaskNotLocked } = await import("./tasks/engine.server");
    await assertTaskNotLocked(
      userId,
      task.data as unknown as {
        title: string;
        lock_type?: string | null;
        unlock_at?: string | null;
      },
    );
  }

  const existing = await supabaseAdmin
    .from("user_tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("task_id", taskId)
    .eq("period_key", "lifetime")
    .maybeSingle();
  if (existing.data?.status === "completed") {
    // Completed but never paid (the credit failed after the row was saved):
    // finish paying instead of refusing. Idempotent per user_tasks row.
    if (existing.data.reward_status !== "paid") {
      await payManualTask(userId, existing.data.id, task.data.title, Number(task.data.reward));
      return { progress: existing.data.progress, completed: true };
    }
    throw new Error("Task already completed.");
  }

  const progress = Math.min((existing.data?.progress ?? 0) + 1, task.data.steps_total);
  const completed = progress >= task.data.steps_total;

  // reward_status stays 'pending' until the credit has committed, so a failed
  // credit is retried by the next tap instead of being lost.
  const saved = await supabaseAdmin
    .from("user_tasks")
    .upsert(
      {
        user_id: userId,
        task_id: taskId,
        period_key: "lifetime",
        target: task.data.steps_total,
        progress,
        status: completed ? "completed" : "active",
        completed_at: completed ? new Date().toISOString() : null,
        reward_status: "pending",
        rewarded_at: null,
      },
      { onConflict: "user_id,task_id,period_key" },
    )
    .select("id")
    .single();
  if (saved.error || !saved.data) throw new Error("Couldn't update that task.");

  await touchStreakImpl(userId);

  if (completed) {
    await payManualTask(userId, saved.data.id, task.data.title, Number(task.data.reward));
  }
  return { progress, completed };
}

/**
 * Pays a completed manual task once. Two overlapping final taps both reach
 * here; the credit is keyed on the user_tasks row id, so only one pays (and
 * notifies), and both then mark the row paid.
 */
async function payManualTask(userId: string, userTaskId: string, title: string, reward: number) {
  const credit = await creditWallet(userId, reward, "task", title, "earned", userTaskId);
  await supabaseAdmin
    .from("user_tasks")
    .update({ reward_status: "paid", rewarded_at: new Date().toISOString() })
    .eq("id", userTaskId)
    .eq("reward_status", "pending");
  if (!credit.duplicate) {
    await notify(userId, "Task completed", `${title} — $${reward.toFixed(2)} added.`, "task");
  }
}

export async function claimOfferImpl(userId: string, offerId: string, proofUrl: string | null) {
  const offer = await supabaseAdmin.from("offers").select("*").eq("id", offerId).single();
  if (offer.error || !offer.data.is_active) throw new Error("Offer unavailable.");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o = offer.data as any;

  // Auto-postback offers are credited by the network's postback — never the in-app button.
  if (o.payout_mode === "auto_postback") {
    throw new Error("This offer is credited automatically once you complete it.");
  }

  // Proof required for limited-deal offers AND for offers on 'manual_proof' mode.
  const proofRequired = Boolean(o.is_limited_deal) || o.payout_mode === "manual_proof";
  if (proofRequired && !proofUrl) {
    throw new Error("Please upload proof of completion before submitting.");
  }

  // Deal-group lock: mirror the RLS filter server-side so the API is not
  // fooled by a client that skipped the client-side check.
  if (o.deal_group_id) {
    const sibling = await supabaseAdmin
      .from("offer_claims")
      .select("id, offers:offer_id(deal_group_id)")
      .eq("user_id", userId)
      .neq("status", "rejected");
    const locked = (sibling.data ?? []).some(
      (c) =>
        (c.offers as unknown as { deal_group_id?: string | null } | null)?.deal_group_id ===
        o.deal_group_id,
    );
    if (locked) {
      throw new Error("You already have a claim in this deal group — only one is allowed.");
    }
  }

  const existing = await supabaseAdmin
    .from("offer_claims")
    .select("*")
    .eq("user_id", userId)
    .eq("offer_id", offerId)
    .maybeSingle();
  if (existing.data) throw new Error("You already submitted this offer for review.");

  const created = await supabaseAdmin
    .from("offer_claims")
    .insert({
      user_id: userId,
      offer_id: offerId,
      reward_amount: o.reward_amount,
      proof_url: proofUrl,
    } as never)
    .select("*")
    .single();
  if (created.error) throw new Error("Could not submit that offer.");

  await notify(
    userId,
    "Offer submitted",
    `${o.title} is pending review. We'll credit it once approved.`,
    "offer",
  );
  return created.data;
}

export async function createWithdrawalImpl(userId: string, amount: number, payoutMethodId: string) {
  if (!Number.isFinite(amount) || amount < MIN_WITHDRAWAL) {
    throw new Error(`Minimum withdrawal is $${MIN_WITHDRAWAL.toFixed(2)}.`);
  }

  // Selected with "*" so the method can be snapshotted onto the request below.
  const method = await supabaseAdmin
    .from("payout_methods")
    .select("*")
    .eq("id", payoutMethodId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!method.data) throw new Error("Choose a valid payout method.");

  const methodSpec = payoutMethodSpec(method.data.method_type);
  if (!methodSpec?.available) {
    throw new Error(`${methodSpec?.label ?? "That payout method"} is not available yet.`);
  }

  // Balance check, one-pending rule, hold and ledger row run in one locked
  // transaction (withdrawal_request), so two simultaneous requests can no
  // longer both pass. method_type and the masked snapshot are captured so the
  // request stays auditable even if the payout method is later edited/deleted.
  let created: Awaited<ReturnType<typeof requestWithdrawalRpc>>;
  try {
    created = await requestWithdrawalRpc({
      userId,
      amount,
      payoutMethodId,
      methodType: method.data.method_type,
      snapshot: buildPayoutSnapshot(method.data) as Json,
    });
  } catch (error) {
    if (isWalletError(error, "WITHDRAWAL_INSUFFICIENT")) {
      throw new Error("That's more than your available balance.");
    }
    if (isWalletError(error, "WITHDRAWAL_ALREADY_PENDING")) {
      throw new Error("You already have a withdrawal awaiting review.");
    }
    if (isWalletError(error, "WALLET_NOT_FOUND")) throw new Error("Wallet unavailable.");
    console.error("[wallet] withdrawal request failed", { userId, error });
    throw new Error("Could not submit that withdrawal.");
  }

  await notify(
    userId,
    "Withdrawal submitted",
    `$${amount.toFixed(2)} is pending review.`,
    "wallet",
  );
  return created;
}

export async function cancelWithdrawalImpl(userId: string, id: string) {
  // Status change, hold release and ledger update commit together; only the
  // owner's pending request can be cancelled.
  try {
    await cancelWithdrawalRpc(userId, id);
  } catch (error) {
    if (isWalletError(error, "WITHDRAWAL_NOT_CANCELLABLE")) {
      throw new Error("This request can't be cancelled.");
    }
    console.error("[wallet] withdrawal cancel failed", { userId, id, error });
    throw new Error("Couldn't cancel that request.");
  }
  return { ok: true };
}

type RoleRpcClient = {
  rpc: (
    fn: "has_role",
    args: { _user_id: string; _role: "admin" },
  ) => PromiseLike<{ data: unknown }>;
};

export async function assertAdmin(supabase: RoleRpcClient, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (data !== true) throw new Error("Forbidden");
}

export async function adminUpdateWithdrawalImpl(
  id: string,
  status: string,
  note: string | null,
  referenceId: string | null = null,
) {
  if (status !== "approved" && status !== "rejected") throw new Error("Unsupported status.");

  // Money moves only on the transition out of 'pending', under a row lock
  // (withdrawal_settle). Re-approving an approved request only updates the
  // fulfilment reference / note — it used to deduct the balance again.
  let result: Awaited<ReturnType<typeof settleWithdrawalRpc>>;
  try {
    result = await settleWithdrawalRpc({
      requestId: id,
      decision: status,
      note,
      reference: referenceId,
    });
  } catch (error) {
    if (isWalletError(error, "WITHDRAWAL_NOT_FOUND")) throw new Error("Request not found.");
    if (isWalletError(error, "WITHDRAWAL_ALREADY_SETTLED")) {
      throw new Error("This request has already been settled.");
    }
    console.error("[wallet] withdrawal settle failed", { id, status, error });
    throw new Error("Could not update that withdrawal.");
  }
  if (!result.settled) return { ok: true, alreadySettled: true };

  const amount = result.amount;
  if (result.status === "approved") {
    await notify(
      result.userId,
      "Withdrawal approved",
      note ?? `$${amount.toFixed(2)} has been sent to your payout method.`,
      "wallet",
    );
    try {
      await payReferralMilestone(
        result.userId,
        "withdrawal",
        "Referral: friend's first withdrawal",
      );
    } catch (error) {
      console.error("[referral] withdrawal milestone failed", { userId: result.userId, error });
    }
  } else {
    await notify(
      result.userId,
      "Withdrawal rejected",
      note ?? "Please contact support for details.",
      "wallet",
    );
  }
  return { ok: true };
}

export async function adminUpdateOfferClaimImpl(id: string, status: string, note: string | null) {
  if (status !== "approved" && status !== "rejected") throw new Error("Unsupported status.");
  const claim = await supabaseAdmin.from("offer_claims").select("*").eq("id", id).single();
  if (claim.error) throw new Error("Claim not found.");
  // Idempotent: a repeat submit (double click / retry) is a no-op, not an error.
  // Fast path only — offer_claim_settle re-checks under a row lock, which is
  // what stops two concurrent approvals from both paying.
  if (claim.data.status !== "pending") return { ok: true, alreadyReviewed: true };

  // For limited-deal offers, always recompute the reward at approval time from
  // the offer's CURRENT config — never trust the snapshot captured at claim
  // submission (the offer's actual_cost / percentage / cap may have changed).
  // null = pay the claim's snapshot.
  let rewardOverride: number | null = null;
  if (status === "approved") {
    const offer = await supabaseAdmin
      .from("offers")
      .select("*")
      .eq("id", claim.data.offer_id)
      .maybeSingle();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o = offer.data as any;
    if (o?.is_limited_deal) {
      const { computeLimitedDealReward } = await import("./offers/proof.server");
      rewardOverride = computeLimitedDealReward({
        actual_cost: o.actual_cost,
        payout_percentage: o.payout_percentage,
        max_payout_cap: o.max_payout_cap,
      });
    }
  }

  // Status change, stored reward and wallet credit commit together, exactly
  // once: an approved claim can no longer end up unpaid, and a concurrent
  // second approval is a no-op.
  let result: Awaited<ReturnType<typeof settleOfferClaimRpc>>;
  try {
    result = await settleOfferClaimRpc({
      claimId: id,
      decision: status,
      note,
      reward: rewardOverride,
    });
  } catch (error) {
    if (isWalletError(error, "CLAIM_NOT_FOUND")) throw new Error("Claim not found.");
    console.error("[wallet] offer claim settle failed", { id, status, error });
    throw new Error("Could not update that claim.");
  }
  if (!result.settled) return { ok: true, alreadyReviewed: true };

  if (result.status === "approved") {
    // creditWallet used to fire this for source "offer"; the RPC credits directly.
    if (result.previousLifetimeEarned === 0) {
      try {
        await payReferralMilestone(result.userId, "earning", "Referral: friend's first earning");
      } catch (error) {
        console.error("[referral] earning milestone failed", { userId: result.userId, error });
      }
    }
    const { recordTaskEvent } = await import("./tasks/engine.server");
    await recordTaskEvent({
      userId: result.userId,
      eventType: "offer_completion",
      eventKey: claim.data.id,
    });
    await notify(
      result.userId,
      "Offer approved",
      `$${result.reward.toFixed(2)} was added to your wallet.`,
      "offer",
    );
  } else {
    await notify(
      claim.data.user_id,
      "Offer rejected",
      note ?? "That offer couldn't be verified.",
      "offer",
    );
  }
  return { ok: true };
}

export async function adminRespondTicketImpl(id: string, response: string, status: string) {
  const ticket = await supabaseAdmin.from("support_tickets").select("*").eq("id", id).single();
  if (ticket.error) throw new Error("Ticket not found.");
  await supabaseAdmin
    .from("support_tickets")
    .update({ admin_response: response, status })
    .eq("id", id);
  await notify(ticket.data.user_id, "Support replied", response, "support");
  return { ok: true };
}

export async function adminSetFlagImpl(userId: string, flagged: boolean) {
  await supabaseAdmin.from("profiles").update({ is_flagged: flagged }).eq("id", userId);
  return { ok: true };
}

export async function adminAdjustWalletImpl(userId: string, amount: number, reason: string) {
  // Atomic delta; refuses to take the balance below zero (checked under the lock).
  // Positive adjustments count toward lifetime_earned, negative ones don't.
  try {
    await walletApply({
      userId,
      amount,
      source: "adjustment",
      kind: amount >= 0 ? "bonus" : "adjustment",
      description: reason,
      lifetimeEarnedDelta: amount > 0 ? amount : 0,
    });
  } catch (error) {
    if (isWalletError(error, "WALLET_NOT_FOUND")) throw new Error("User not found.");
    if (isWalletError(error, "WALLET_NEGATIVE")) {
      // Checked against the available balance (wallet − funds held for a
      // pending withdrawal).
      throw new Error("That adjustment would make the available balance negative.");
    }
    console.error("[wallet] admin adjustment failed", { userId, error });
    throw new Error("Could not adjust that wallet.");
  }
  await notify(
    userId,
    "Wallet adjusted",
    `${reason} (${amount >= 0 ? "+" : "−"}$${Math.abs(amount).toFixed(2)})`,
    "wallet",
  );
  return { ok: true };
}

export async function adminOverviewImpl() {
  const [withdrawals, claims, tickets, users, transactions] = await Promise.all([
    supabaseAdmin
      .from("withdrawal_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200),
    supabaseAdmin
      .from("offer_claims")
      .select("*, offers:offer_id(title, is_limited_deal, deal_group_id, payout_mode)")
      .order("created_at", { ascending: false })
      .limit(200),
    supabaseAdmin
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200),
    supabaseAdmin
      .from("profiles")
      .select(
        "id, name, email, phone, device_id, is_flagged, wallet_balance, held_balance, lifetime_earned, lifetime_withdrawn, referral_code, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200),
    supabaseAdmin.from("wallet_transactions").select("amount, kind").limit(2000),
  ]);

  const profiles = users.data ?? [];
  const byId = new Map(profiles.map((p) => [p.id, p]));

  const totals = {
    users: profiles.length,
    flagged: profiles.filter((p) => p.is_flagged).length,
    earned: profiles.reduce((sum, p) => sum + Number(p.lifetime_earned), 0),
    withdrawn: profiles.reduce((sum, p) => sum + Number(p.lifetime_withdrawn), 0),
    liability: profiles.reduce((sum, p) => sum + Number(p.wallet_balance), 0),
    transactions: (transactions.data ?? []).length,
  };

  return {
    withdrawals: (withdrawals.data ?? []).map((w) => ({
      ...w,
      user: byId.get(w.user_id) ?? null,
    })),
    claims: (claims.data ?? []).map((c) => ({ ...c, user: byId.get(c.user_id) ?? null })),
    tickets: (tickets.data ?? []).map((t) => ({ ...t, user: byId.get(t.user_id) ?? null })),
    users: profiles,
    totals,
  };
}
