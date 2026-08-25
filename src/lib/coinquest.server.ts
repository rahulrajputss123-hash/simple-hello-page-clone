import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  MAX_ADS_PER_HOUR,
  MIN_SECONDS_PER_AD,
  MIN_WITHDRAWAL,
  REFERRAL_MILESTONE_BONUS,
  REFERRAL_WINDOW_DAYS,
  STREAK_BONUS,
  STREAK_GOAL,
} from "./coinquest";

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
    await notify(referrerId, "New referral joined", "A friend signed up with your code.", "referral");
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
 * Credits one $1 referral milestone. Idempotent: the milestone timestamp column
 * acts as the guard so the same milestone can never pay twice.
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
  if (referral.data[column]) return; // already credited

  const bonus = REFERRAL_MILESTONE_BONUS;
  const referrer = await supabaseAdmin
    .from("profiles")
    .select("wallet_balance, lifetime_earned")
    .eq("id", referral.data.referrer_id)
    .single();
  if (referrer.error) return;

  const patch: {
    bonus_amount: number;
    status: string;
    signup_credited_at?: string;
    earning_credited_at?: string;
    withdrawal_credited_at?: string;
  } = {
    bonus_amount: Number(referral.data.bonus_amount ?? 0) + bonus,
    status: milestone === "withdrawal" ? "completed" : "credited",
  };
  patch[column] = new Date().toISOString();

  const claimed = await supabaseAdmin
    .from("referrals")
    .update(patch)
    .eq("id", referralId)
    .is(column, null)
    .select("id");
  if (!claimed.data?.length) return; // another run already credited it

  await supabaseAdmin
    .from("profiles")
    .update({
      wallet_balance: Number(referrer.data.wallet_balance) + bonus,
      lifetime_earned: Number(referrer.data.lifetime_earned) + bonus,
    })
    .eq("id", referral.data.referrer_id);
  await supabaseAdmin.from("wallet_transactions").insert({
    user_id: referral.data.referrer_id,
    source: "referral",
    description,
    amount: bonus,
    kind: "bonus",
    status: "completed",
  });
  await notify(
    referral.data.referrer_id,
    "Referral bonus earned",
    `${description} — $${bonus.toFixed(2)} added.`,
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

  const expired =
    Date.now() - new Date(referral.data.created_at).getTime() >
    REFERRAL_WINDOW_DAYS * 86_400_000;

  // Past the 1-year window the referral pays nothing and already-credited
  // milestones are reversed from the referrer's balance.
  if (expired) {
    if (milestone !== "withdrawal") return;
    const credited = Number(referral.data.bonus_amount ?? 0);
    if (credited <= 0) return;
    const referrer = await supabaseAdmin
      .from("profiles")
      .select("wallet_balance, lifetime_earned")
      .eq("id", referral.data.referrer_id)
      .single();
    if (referrer.error) return;
    await supabaseAdmin
      .from("profiles")
      .update({
        wallet_balance: Number(referrer.data.wallet_balance) - credited,
        lifetime_earned: Math.max(0, Number(referrer.data.lifetime_earned) - credited),
      })
      .eq("id", referral.data.referrer_id);
    await supabaseAdmin.from("wallet_transactions").insert({
      user_id: referral.data.referrer_id,
      source: "referral",
      description: "Referral rewards reversed (1-year limit)",
      amount: -credited,
      kind: "adjustment",
      status: "completed",
    });
    await supabaseAdmin
      .from("referrals")
      .update({ bonus_amount: 0, status: "expired" })
      .eq("id", referral.data.id);
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

export async function creditWallet(
  userId: string,
  amount: number,
  source: string,
  description: string,
  kind = "earned",
) {
  const profile = await supabaseAdmin
    .from("profiles")
    .select("wallet_balance, lifetime_earned")
    .eq("id", userId)
    .single();
  if (profile.error) throw new Error("Wallet unavailable.");
  const firstEarning = Number(profile.data.lifetime_earned) === 0;
  await supabaseAdmin
    .from("profiles")
    .update({
      wallet_balance: Number(profile.data.wallet_balance) + amount,
      lifetime_earned: Number(profile.data.lifetime_earned) + amount,
    })
    .eq("id", userId);
  await supabaseAdmin.from("wallet_transactions").insert({
    user_id: userId,
    source,
    description,
    amount,
    kind,
    status: "completed",
  });
  if (firstEarning && ["quest", "task", "offer"].includes(source)) {
    await payReferralMilestone(userId, "earning", "Referral: friend's first earning");
  }
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

  await supabaseAdmin
    .from("profiles")
    .update({ streak_count: streak, streak_date: day })
    .eq("id", userId);

  if (streak > 0 && streak % STREAK_GOAL === 0) {
    await creditWallet(userId, STREAK_BONUS, "streak", `${STREAK_GOAL}-day streak bonus`, "bonus");
    await notify(userId, "Streak bonus", `You earned $${STREAK_BONUS.toFixed(2)} for your streak.`, "bonus");
    return { streak, credited: true };
  }
  return { streak, credited: false };
}

export async function startQuestImpl(userId: string, questKey: string) {
  const { getQuestByKey } = await import("./quests.server");
  const quest = await getQuestByKey(questKey);

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
  const updated = await supabaseAdmin
    .from("quest_sessions")
    .update({
      ads_watched: nextCount,
      status: done ? "verified" : "started",
      verified_at: done ? new Date().toISOString() : null,
    })
    .eq("id", sessionId)
    .select("*")
    .single();
  if (updated.error) throw new Error("Could not record that ad.");

  await touchStreakImpl(userId);

  {
    const { recordTaskEvent } = await import("./tasks/engine.server");
    await recordTaskEvent({
      userId,
      eventType: "ad_watch",
      eventKey: `${sessionId}:${nextCount}`,
    });
  }

  if (done) {
    const reward = Number(session.data.reward_amount);
    await creditWallet(
      userId,
      reward,
      "quest",
      `Starter quest — ${session.data.ads_required} ads`,
    );
    await supabaseAdmin
      .from("quest_sessions")
      .update({ status: "credited", credited_at: new Date().toISOString() })
      .eq("id", sessionId);
    await notify(userId, "Quest completed", `You earned $${reward.toFixed(2)}.`, "quest");
    return { ...updated.data, status: "credited", credited: true };
  }

  return { ...updated.data, credited: false };
}

export async function completeTaskImpl(userId: string, taskId: string) {
  const task = await supabaseAdmin.from("tasks").select("*").eq("id", taskId).single();
  if (task.error || !task.data?.is_active) throw new Error("Task unavailable.");
  if ((task.data as { task_type?: string }).task_type !== "manual") {
    throw new Error("This task completes automatically from your activity.");
  }

  const existing = await supabaseAdmin
    .from("user_tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("task_id", taskId)
    .eq("period_key", "lifetime")
    .maybeSingle();
  if (existing.data?.status === "completed") throw new Error("Task already completed.");

  const progress = Math.min((existing.data?.progress ?? 0) + 1, task.data.steps_total);
  const completed = progress >= task.data.steps_total;

  await supabaseAdmin.from("user_tasks").upsert(
    {
      user_id: userId,
      task_id: taskId,
      period_key: "lifetime",
      target: task.data.steps_total,
      progress,
      status: completed ? "completed" : "active",
      completed_at: completed ? new Date().toISOString() : null,
      reward_status: completed ? "paid" : "pending",
      rewarded_at: completed ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,task_id,period_key" },
  );

  await touchStreakImpl(userId);

  if (completed) {
    const reward = Number(task.data.reward);
    await creditWallet(userId, reward, "task", task.data.title);
    await notify(userId, "Task completed", `${task.data.title} — $${reward.toFixed(2)} added.`, "task");
  }
  return { progress, completed };
}

export async function claimOfferImpl(userId: string, offerId: string) {
  const offer = await supabaseAdmin.from("offers").select("*").eq("id", offerId).single();
  if (offer.error || !offer.data.is_active) throw new Error("Offer unavailable.");

  const existing = await supabaseAdmin
    .from("offer_claims")
    .select("*")
    .eq("user_id", userId)
    .eq("offer_id", offerId)
    .maybeSingle();
  if (existing.data) throw new Error("You already submitted this offer for review.");

  const created = await supabaseAdmin
    .from("offer_claims")
    .insert({ user_id: userId, offer_id: offerId, reward_amount: offer.data.reward_amount })
    .select("*")
    .single();
  if (created.error) throw new Error("Could not submit that offer.");

  await notify(
    userId,
    "Offer submitted",
    `${offer.data.title} is pending review. We'll credit it once approved.`,
    "offer",
  );
  return created.data;
}

export async function createWithdrawalImpl(
  userId: string,
  amount: number,
  payoutMethodId: string,
) {
  if (!Number.isFinite(amount) || amount < MIN_WITHDRAWAL) {
    throw new Error(`Minimum withdrawal is $${MIN_WITHDRAWAL.toFixed(2)}.`);
  }
  const profile = await supabaseAdmin
    .from("profiles")
    .select("wallet_balance, held_balance, is_flagged")
    .eq("id", userId)
    .single();
  if (profile.error) throw new Error("Wallet unavailable.");

  const available = Number(profile.data.wallet_balance) - Number(profile.data.held_balance);
  if (amount > available) throw new Error("That's more than your available balance.");

  const method = await supabaseAdmin
    .from("payout_methods")
    .select("id")
    .eq("id", payoutMethodId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!method.data) throw new Error("Choose a valid payout method.");

  const openRequest = await supabaseAdmin
    .from("withdrawal_requests")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "pending")
    .maybeSingle();
  if (openRequest.data) throw new Error("You already have a withdrawal awaiting review.");

  const created = await supabaseAdmin
    .from("withdrawal_requests")
    .insert({ user_id: userId, amount, payout_method_id: payoutMethodId })
    .select("*")
    .single();
  if (created.error) throw new Error("Could not submit that withdrawal.");

  await supabaseAdmin
    .from("profiles")
    .update({ held_balance: Number(profile.data.held_balance) + amount })
    .eq("id", userId);

  await supabaseAdmin.from("wallet_transactions").insert({
    user_id: userId,
    source: "withdrawal",
    description: "Withdrawal request",
    amount: -amount,
    kind: "withdrawn",
    status: "pending",
    reference_id: created.data.id,
  });

  await notify(userId, "Withdrawal submitted", `$${amount.toFixed(2)} is pending review.`, "wallet");
  return created.data;
}

export async function cancelWithdrawalImpl(userId: string, id: string) {
  const req = await supabaseAdmin
    .from("withdrawal_requests")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (req.error || req.data.status !== "pending") throw new Error("This request can't be cancelled.");

  await supabaseAdmin.from("withdrawal_requests").update({ status: "cancelled" }).eq("id", id);
  const profile = await supabaseAdmin
    .from("profiles")
    .select("held_balance")
    .eq("id", userId)
    .single();
  await supabaseAdmin
    .from("profiles")
    .update({
      held_balance: Math.max(0, Number(profile.data?.held_balance ?? 0) - Number(req.data.amount)),
    })
    .eq("id", userId);
  await supabaseAdmin
    .from("wallet_transactions")
    .update({ status: "failed", description: "Withdrawal cancelled" })
    .eq("reference_id", id);
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

export async function adminUpdateWithdrawalImpl(id: string, status: string, note: string | null) {
  const req = await supabaseAdmin.from("withdrawal_requests").select("*").eq("id", id).single();
  if (req.error) throw new Error("Request not found.");
  if (req.data.status !== "pending" && req.data.status !== "approved") {
    throw new Error("This request has already been settled.");
  }
  await supabaseAdmin
    .from("withdrawal_requests")
    .update({ status, admin_note: note })
    .eq("id", id);

  const profile = await supabaseAdmin
    .from("profiles")
    .select("wallet_balance, held_balance, lifetime_withdrawn")
    .eq("id", req.data.user_id)
    .single();
  const amount = Number(req.data.amount);

  if (status === "approved") {
    await supabaseAdmin
      .from("profiles")
      .update({
        wallet_balance: Number(profile.data?.wallet_balance ?? 0) - amount,
        held_balance: Math.max(0, Number(profile.data?.held_balance ?? 0) - amount),
        lifetime_withdrawn: Number(profile.data?.lifetime_withdrawn ?? 0) + amount,
      })
      .eq("id", req.data.user_id);
    await supabaseAdmin
      .from("wallet_transactions")
      .update({ status: "completed", description: "Withdrawal paid" })
      .eq("reference_id", id);
    await notify(
      req.data.user_id,
      "Withdrawal approved",
      note ?? `$${amount.toFixed(2)} has been sent to your payout method.`,
      "wallet",
    );
    await payReferralMilestone(
      req.data.user_id,
      "withdrawal",
      "Referral: friend's first withdrawal",
    );
  } else if (status === "rejected") {
    await supabaseAdmin
      .from("profiles")
      .update({ held_balance: Math.max(0, Number(profile.data?.held_balance ?? 0) - amount) })
      .eq("id", req.data.user_id);
    await supabaseAdmin
      .from("wallet_transactions")
      .update({ status: "failed", description: "Withdrawal rejected" })
      .eq("reference_id", id);
    await notify(
      req.data.user_id,
      "Withdrawal rejected",
      note ?? "Please contact support for details.",
      "wallet",
    );
  }
  return { ok: true };
}

export async function adminUpdateOfferClaimImpl(id: string, status: string, note: string | null) {
  const claim = await supabaseAdmin.from("offer_claims").select("*").eq("id", id).single();
  if (claim.error) throw new Error("Claim not found.");
  // Idempotent: a repeat submit (double click / retry) is a no-op, not an error.
  if (claim.data.status !== "pending") return { ok: true, alreadyReviewed: true };

  await supabaseAdmin.from("offer_claims").update({ status, admin_note: note }).eq("id", id);

  if (status === "approved") {
    const reward = Number(claim.data.reward_amount);
    await creditWallet(claim.data.user_id, reward, "offer", "Offer reward");
    const { recordTaskEvent } = await import("./tasks/engine.server");
    await recordTaskEvent({
      userId: claim.data.user_id,
      eventType: "offer_completion",
      eventKey: claim.data.id,
    });
    await notify(
      claim.data.user_id,
      "Offer approved",
      `$${reward.toFixed(2)} was added to your wallet.`,
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
  const profile = await supabaseAdmin
    .from("profiles")
    .select("wallet_balance, lifetime_earned")
    .eq("id", userId)
    .single();
  if (profile.error) throw new Error("User not found.");
  const next = Number(profile.data.wallet_balance) + amount;
  if (next < 0) throw new Error("That adjustment would make the balance negative.");
  await supabaseAdmin
    .from("profiles")
    .update({
      wallet_balance: next,
      lifetime_earned:
        amount > 0 ? Number(profile.data.lifetime_earned) + amount : profile.data.lifetime_earned,
    })
    .eq("id", userId);
  await supabaseAdmin.from("wallet_transactions").insert({
    user_id: userId,
    source: "adjustment",
    description: reason,
    amount,
    kind: amount >= 0 ? "bonus" : "adjustment",
    status: "completed",
  });
  await notify(userId, "Wallet adjusted", `${reason} (${amount >= 0 ? "+" : "−"}$${Math.abs(amount).toFixed(2)})`, "wallet");
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
      .select("*, offers:offer_id(title)")
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
    supabaseAdmin
      .from("wallet_transactions")
      .select("amount, kind")
      .limit(2000),
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
