import { n as __exportAll } from "../_runtime.mjs";
import { n as deriveReferralProgress, o as formatMoney, t as REFERRAL_MILESTONE_COUNT } from "./referral-progress-DmJLJmiB.mjs";
import { l as __exportAll$1 } from "./server-CpGMOUrW.mjs";
import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
import { t as logAutomation } from "./logs.server-DbNT75_y.mjs";
import { n as buildPayoutSnapshot, s as payoutMethodSpec } from "./payout-methods-axzHBpbm.mjs";
import { createHash } from "crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/coinquest.server-CBcexWIA.js
var coinquest_server_CBcexWIA_exports = /* @__PURE__ */ __exportAll({
	a: () => settleOfferClaimRpc,
	i: () => creditSdkConversionRpc,
	n: () => creditWallet,
	r: () => payReferralMilestone,
	t: () => coinquest_server_exports
});
init_client_server();
/** Machine-readable error raised by a wallet function (e.g. WALLET_NEGATIVE). */
var WalletRpcError = class extends Error {
	code;
	constructor(code, message) {
		super(message);
		this.name = "WalletRpcError";
		this.code = code;
	}
};
var ERROR_CODE = /\b(?:WALLET|WITHDRAWAL|CLAIM|CONVERSION)_[A-Z_]+\b/;
async function callWalletRpc(name, args) {
	const { data, error } = await supabaseAdmin.rpc(name, args);
	if (error) throw new WalletRpcError(error.message?.match(ERROR_CODE)?.[0] ?? "RPC_FAILED", `${name}: ${error.message}`);
	if (!data || typeof data !== "object" || Array.isArray(data)) throw new WalletRpcError("RPC_BAD_RESPONSE", `${name}: unexpected response`);
	return data;
}
/**
* Stable uuid-shaped reference for credits that have no row of their own
* (e.g. one streak bonus per user per day), for walletApply's idempotency.
*/
function deterministicReferenceId(...parts) {
	const h = createHash("md5").update(parts.join(":")).digest("hex");
	return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}
var num = (value) => Number(value ?? 0);
var str = (value) => typeof value === "string" ? value : value == null ? null : String(value);
/**
* Credits (positive amount) or debits (negative amount) a publisher wallet and
* writes the matching completed wallet_transactions row.
*
* referenceId makes the call idempotent: the same (user, source, kind,
* referenceId) is applied at most once, and a repeat returns duplicate = true.
* Pass the id of the thing being paid for (quest session, task row, claim…).
*
* lifetimeEarnedDelta: omit for the default (credits count toward
* lifetime_earned, debits don't). Debits that would take the AVAILABLE balance
* (wallet − held) below zero throw WALLET_NEGATIVE unless allowNegative is set.
*/
async function walletApply(input) {
	const data = await callWalletRpc("wallet_apply", {
		p_user_id: input.userId,
		p_amount: input.amount,
		p_source: input.source,
		p_kind: input.kind,
		p_description: input.description,
		p_reference_id: input.referenceId ?? null,
		p_lifetime_earned_delta: input.lifetimeEarnedDelta ?? null,
		p_allow_negative: input.allowNegative ?? false
	});
	return {
		duplicate: data.duplicate === true,
		transactionId: str(data.transaction_id) ?? "",
		amount: num(data.amount),
		walletBalance: num(data.wallet_balance),
		heldBalance: num(data.held_balance),
		previousLifetimeEarned: num(data.previous_lifetime_earned)
	};
}
/**
* Creates a pending withdrawal and holds the funds. Throws WITHDRAWAL_INSUFFICIENT
* or WITHDRAWAL_ALREADY_PENDING. Returns the inserted withdrawal_requests row.
*/
async function requestWithdrawalRpc(input) {
	return callWalletRpc("withdrawal_request", {
		p_user_id: input.userId,
		p_amount: input.amount,
		p_payout_method_id: input.payoutMethodId,
		p_method_type: input.methodType,
		p_snapshot: input.snapshot,
		p_network_fee: input.networkFee ?? null
	});
}
/** Cancels the user's own pending withdrawal. Throws WITHDRAWAL_NOT_CANCELLABLE. */
async function cancelWithdrawalRpc(userId, requestId) {
	await callWalletRpc("withdrawal_cancel", {
		p_user_id: userId,
		p_request_id: requestId
	});
}
/**
* Admin approve/reject. Money moves only on the transition out of 'pending';
* re-approving an approved request only updates the reference/note/transaction_hash.
* Throws WITHDRAWAL_ALREADY_SETTLED for any other change to a settled request.
*/
async function settleWithdrawalRpc(input) {
	const data = await callWalletRpc("withdrawal_settle", {
		p_request_id: input.requestId,
		p_decision: input.decision,
		p_note: input.note,
		p_reference: input.reference,
		p_transaction_hash: input.transactionHash ?? null
	});
	return {
		settled: data.settled === true,
		alreadySettled: data.already_settled === true,
		status: str(data.status) ?? "",
		userId: str(data.user_id) ?? "",
		amount: num(data.amount)
	};
}
/**
* Approves (and pays) or rejects a pending offer claim exactly once. `reward`
* overrides the claim's snapshot (used for limited deals); null keeps it.
*/
async function settleOfferClaimRpc(input) {
	const data = await callWalletRpc("offer_claim_settle", {
		p_claim_id: input.claimId,
		p_decision: input.decision,
		p_note: input.note,
		p_reward: input.reward
	});
	return {
		settled: data.settled === true,
		alreadyReviewed: data.already_reviewed === true,
		status: str(data.status) ?? "",
		userId: str(data.user_id) ?? "",
		reward: num(data.reward),
		previousLifetimeEarned: data.previous_lifetime_earned == null ? null : num(data.previous_lifetime_earned)
	};
}
/**
* Credits an SDK offerwall conversion exactly once and marks it credited in the
* same transaction. allowRetry also accepts conversions in 'rejected' status.
*/
async function creditSdkConversionRpc(input) {
	const data = await callWalletRpc("sdk_conversion_credit", {
		p_conversion_id: input.conversionId,
		p_reward: input.reward,
		p_description: input.description,
		p_allow_retry: input.allowRetry
	});
	return {
		credited: data.credited === true,
		reason: str(data.reason),
		reward: num(data.reward),
		transactionId: str(data.transaction_id)
	};
}
/**
* Releases a referral reward once (3/3 milestones, inside the window). The
* release claim and the referrer credit commit together.
*/
async function releaseReferralRewardRpc(input) {
	const data = await callWalletRpc("referral_release_reward", {
		p_referral_id: input.referralId,
		p_max_bonus: input.maxBonus,
		p_window_days: input.windowDays,
		p_description: input.description
	});
	return {
		released: data.released === true,
		reason: str(data.reason),
		payout: num(data.payout),
		referrerId: str(data.referrer_id)
	};
}
/** Claws back a legacy per-milestone bonus from an expired referral, once. */
async function reverseExpiredReferralRpc(referralId, description) {
	const data = await callWalletRpc("referral_reverse_expired", {
		p_referral_id: referralId,
		p_description: description
	});
	return {
		reversed: data.reversed === true,
		amount: num(data.amount),
		referrerId: str(data.referrer_id)
	};
}
var coinquest_server_exports = /* @__PURE__ */ __exportAll$1({
	adminAdjustWalletImpl: () => adminAdjustWalletImpl,
	adminListAuditLogsImpl: () => adminListAuditLogsImpl,
	adminListClaimsImpl: () => adminListClaimsImpl,
	adminListTicketsImpl: () => adminListTicketsImpl,
	adminListUsersImpl: () => adminListUsersImpl,
	adminListWithdrawalsImpl: () => adminListWithdrawalsImpl,
	adminOverviewImpl: () => adminOverviewImpl,
	adminRespondTicketImpl: () => adminRespondTicketImpl,
	adminSetFlagImpl: () => adminSetFlagImpl,
	adminUpdateOfferClaimImpl: () => adminUpdateOfferClaimImpl,
	adminUpdateWithdrawalImpl: () => adminUpdateWithdrawalImpl,
	approveAdjustmentRequestImpl: () => approveAdjustmentRequestImpl,
	areAdsEnabledImpl: () => areAdsEnabledImpl,
	assertAdmin: () => assertAdmin,
	assignRoleImpl: () => assignRoleImpl,
	cancelWithdrawalImpl: () => cancelWithdrawalImpl,
	checkMaintenanceStatusImpl: () => checkMaintenanceStatusImpl,
	claimOfferImpl: () => claimOfferImpl,
	completeOnboardingImpl: () => completeOnboardingImpl,
	completeTaskImpl: () => completeTaskImpl,
	createAdjustmentRequestImpl: () => createAdjustmentRequestImpl,
	createQuickReplyImpl: () => createQuickReplyImpl,
	createWithdrawalImpl: () => createWithdrawalImpl,
	creditWallet: () => creditWallet,
	deleteQuickReplyImpl: () => deleteQuickReplyImpl,
	ensureProfileImpl: () => ensureProfileImpl,
	exportPayoutsCsvImpl: () => exportPayoutsCsvImpl,
	exportTransactionsCsvImpl: () => exportTransactionsCsvImpl,
	exportUsersCsvImpl: () => exportUsersCsvImpl,
	getDashboardActiveUsersImpl: () => getDashboardActiveUsersImpl,
	getDashboardRevenuePayoutImpl: () => getDashboardRevenuePayoutImpl,
	getDashboardSignupsImpl: () => getDashboardSignupsImpl,
	getDashboardTopOffersImpl: () => getDashboardTopOffersImpl,
	getMaintenanceStatusImpl: () => getMaintenanceStatusImpl,
	getUserAuditLogImpl: () => getUserAuditLogImpl,
	getUserDetailImpl: () => getUserDetailImpl,
	getUsersWithSameDeviceImpl: () => getUsersWithSameDeviceImpl,
	getWithdrawalFraudSignalsImpl: () => getWithdrawalFraudSignalsImpl,
	listAdjustmentRequestsImpl: () => listAdjustmentRequestsImpl,
	listQuickRepliesImpl: () => listQuickRepliesImpl,
	listStaffImpl: () => listStaffImpl,
	payReferralMilestone: () => payReferralMilestone,
	rejectAdjustmentRequestImpl: () => rejectAdjustmentRequestImpl,
	removeRoleImpl: () => removeRoleImpl,
	reportAdImpl: () => reportAdImpl,
	savePayoutMethodImpl: () => savePayoutMethodImpl,
	sendBroadcastNotificationImpl: () => sendBroadcastNotificationImpl,
	setMaintenanceModeImpl: () => setMaintenanceModeImpl,
	startOfferClaimImpl: () => startOfferClaimImpl,
	startQuestImpl: () => startQuestImpl,
	submitOfferProofImpl: () => submitOfferProofImpl,
	touchStreakImpl: () => touchStreakImpl,
	transferEarningsToAdvertiserImpl: () => transferEarningsToAdvertiserImpl,
	updateQuickReplyImpl: () => updateQuickReplyImpl
});
init_client_server();
/** True when a wallet RPC failed with the given machine-readable code. */
function isWalletError(error, code) {
	return error instanceof WalletRpcError && error.code === code;
}
function code() {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let out = "";
	for (let i = 0; i < 7; i += 1) out += chars[Math.floor(Math.random() * 32)];
	return `CQ${out}`;
}
async function notify(userId, title, body, kind = "info") {
	await supabaseAdmin.from("notifications").insert({
		user_id: userId,
		title,
		body,
		kind
	});
}
async function ensureProfileImpl(input) {
	const existing = await supabaseAdmin.from("profiles").select("*").eq("id", input.userId).maybeSingle();
	if (existing.data) {
		const patch = {};
		if (input.name && !existing.data.name) patch.name = input.name;
		if (input.phone && !existing.data.phone) patch.phone = input.phone;
		if (input.deviceId && !existing.data.device_id) patch.device_id = input.deviceId;
		if (input.email && !existing.data.email) patch.email = input.email;
		if (Object.keys(patch).length) await supabaseAdmin.from("profiles").update(patch).eq("id", input.userId);
		return {
			...existing.data,
			...patch
		};
	}
	let flagged = false;
	if (input.deviceId && input.deviceId !== "server") {
		const dupes = await supabaseAdmin.from("profiles").select("id").eq("device_id", input.deviceId).limit(1);
		flagged = Boolean(dupes.data?.length);
	}
	let referralCode = code();
	for (let attempt = 0; attempt < 5; attempt += 1) {
		if (!(await supabaseAdmin.from("profiles").select("id").eq("referral_code", referralCode).maybeSingle()).data) break;
		referralCode = code();
	}
	let referrerId = null;
	const referredBy = input.referralCode?.trim().toUpperCase() || null;
	if (referredBy) referrerId = (await supabaseAdmin.from("profiles").select("id").eq("referral_code", referredBy).maybeSingle()).data?.id ?? null;
	const inserted = await supabaseAdmin.from("profiles").insert({
		id: input.userId,
		name: input.name ?? "",
		email: input.email,
		phone: input.phone ?? null,
		referral_code: referralCode,
		referred_by: referrerId ? referredBy : null,
		device_id: input.deviceId ?? null,
		is_flagged: flagged
	}).select("*").single();
	if (inserted.error) throw new Error("Could not create your profile. Please try again.");
	if (referrerId) {
		const referral = await supabaseAdmin.from("referrals").insert({
			referrer_id: referrerId,
			referred_id: input.userId,
			code: referredBy,
			bonus_amount: 0,
			status: "pending"
		}).select("*").single();
		await notify(referrerId, "New referral joined", "A friend signed up with your code.", "referral");
		if (referral.data) {
			await creditReferralMilestone(referral.data.id, "signup", "Referral: friend signed up");
			const { recordTaskEvent } = await import("./engine.server-C6tIpR1m.mjs");
			await recordTaskEvent({
				userId: referrerId,
				eventType: "referral",
				eventKey: referral.data.id
			});
		}
	}
	await notify(input.userId, "Welcome to CashGPT", "Complete your first starter quest to earn your first $1.00.", "welcome");
	return inserted.data;
}
async function completeOnboardingImpl(userId, values) {
	const patch = {
		name: values.name,
		onboarded: true
	};
	if (values.phone) patch.phone = values.phone;
	if (values.deviceId) patch.device_id = values.deviceId;
	const { data, error } = await supabaseAdmin.from("profiles").update(patch).eq("id", userId).select("*").single();
	if (error) throw new Error("Could not save your details.");
	return data;
}
var MILESTONE_COLUMN = {
	signup: "signup_credited_at",
	earning: "earning_credited_at",
	withdrawal: "withdrawal_credited_at"
};
/**
* Records one referral milestone.
*
* Deliberately pays nothing: milestones are tracked individually but the reward
* stays PENDING/LOCKED until all three are complete, at which point
* releaseReferralReward pays the full REFERRAL_MAX_BONUS once. Idempotent — the
* milestone timestamp column is claimed with a conditional update, so the same
* milestone can never be recorded (or notified) twice.
*/
async function creditReferralMilestone(referralId, milestone, description) {
	const column = MILESTONE_COLUMN[milestone];
	const referral = await supabaseAdmin.from("referrals").select("*").eq("id", referralId).maybeSingle();
	if (!referral.data) return;
	if (!referral.data[column]) {
		const patch = {};
		patch[column] = (/* @__PURE__ */ new Date()).toISOString();
		const claimed = await supabaseAdmin.from("referrals").update(patch).eq("id", referralId).is(column, null).select("*");
		if (!claimed.data?.length) return;
		const progress = deriveReferralProgress(claimed.data[0]);
		if (!progress.allComplete) await notify(referral.data.referrer_id, "Referral milestone reached", `${description} — ${formatMoney(progress.pendingAmount)} pending, unlocks at ${progress.total}/${progress.total}.`, "referral");
	}
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
async function releaseReferralReward(referralId) {
	const referral = await supabaseAdmin.from("referrals").select("*").eq("id", referralId).maybeSingle();
	if (!referral.data) return;
	if (referral.data.reward_released_at) return;
	const progress = deriveReferralProgress(referral.data);
	if (!progress.allComplete) return;
	if (progress.expired) return;
	let result;
	try {
		result = await releaseReferralRewardRpc({
			referralId,
			maxBonus: 3,
			windowDays: 365,
			description: `Referral reward — friend completed all ${REFERRAL_MILESTONE_COUNT} milestones`
		});
	} catch (error) {
		console.error("[referral] release failed", {
			referralId,
			error
		});
		return;
	}
	if (!result.released || result.payout <= 0) return;
	await notify(referral.data.referrer_id, "Referral reward unlocked", `${formatMoney(result.payout)} has been added to your wallet.`, "referral");
}
/** Looks up the referral row for a referred user and credits a milestone once. */
async function payReferralMilestone(referredUserId, milestone, description) {
	const referral = await supabaseAdmin.from("referrals").select("*").eq("referred_id", referredUserId).maybeSingle();
	if (!referral.data) return;
	if (referral.data.reward_released_at) return;
	if (Date.now() - new Date(referral.data.created_at).getTime() > 31536e6) {
		if (referral.data.status !== "expired") await supabaseAdmin.from("referrals").update({ status: "expired" }).eq("id", referral.data.id);
		if (milestone !== "withdrawal") return;
		if (Number(referral.data.bonus_amount ?? 0) <= 0) return;
		try {
			if (!(await reverseExpiredReferralRpc(referral.data.id, "Referral rewards reversed (1-year limit)")).reversed) return;
		} catch (error) {
			console.error("[referral] expiry reversal failed", {
				referralId: referral.data.id,
				error
			});
			return;
		}
		await notify(referral.data.referrer_id, "Referral rewards reversed", "A referral did not complete all milestones within 1 year.", "referral");
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
async function creditWallet(userId, amount, source, description, kind = "earned", referenceId = null) {
	let result;
	try {
		result = await walletApply({
			userId,
			amount,
			source,
			kind,
			description,
			referenceId
		});
	} catch (error) {
		console.error("[wallet] credit failed", {
			userId,
			source,
			error
		});
		throw new Error("Wallet unavailable.");
	}
	if (!result.duplicate && result.previousLifetimeEarned === 0 && [
		"quest",
		"task",
		"offer"
	].includes(source)) try {
		await payReferralMilestone(userId, "earning", "Referral: friend's first earning");
	} catch (error) {
		console.error("[referral] earning milestone failed", {
			userId,
			error
		});
	}
	return result;
}
function today() {
	return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
/** Bumps the daily streak; credits a bonus every STREAK_GOAL consecutive days. */
async function touchStreakImpl(userId) {
	const profile = await supabaseAdmin.from("profiles").select("streak_count, streak_date").eq("id", userId).maybeSingle();
	if (!profile.data) return {
		streak: 0,
		credited: false
	};
	const day = today();
	if (profile.data.streak_date === day) return {
		streak: profile.data.streak_count,
		credited: false
	};
	const yesterday = (/* @__PURE__ */ new Date(Date.now() - 864e5)).toISOString().slice(0, 10);
	const streak = profile.data.streak_date === yesterday ? profile.data.streak_count + 1 : 1;
	const bump = supabaseAdmin.from("profiles").update({
		streak_count: streak,
		streak_date: day
	}).eq("id", userId);
	if (!(await (profile.data.streak_date ? bump.eq("streak_date", profile.data.streak_date) : bump.is("streak_date", null)).select("id")).data?.length) return {
		streak: profile.data.streak_count,
		credited: false
	};
	if (streak > 0 && streak % 7 === 0) try {
		const credit = await creditWallet(userId, 1, "streak", `7-day streak bonus`, "bonus", deterministicReferenceId("streak", userId, day));
		if (!credit.duplicate) await notify(userId, "Streak bonus", `You earned $${1 .toFixed(2)} for your streak.`, "bonus");
		return {
			streak,
			credited: !credit.duplicate
		};
	} catch (error) {
		console.error("[wallet] streak bonus failed", {
			userId,
			day,
			error
		});
		return {
			streak,
			credited: false
		};
	}
	return {
		streak,
		credited: false
	};
}
async function startQuestImpl(userId, questKey) {
	const { getQuestByKey, assertQuestNotLocked } = await import("./quests.server-C-e2yiq_.mjs");
	const quest = await getQuestByKey(questKey);
	if (quest.quest_type === "ads") {
		if (!await areAdsEnabledImpl()) throw new Error("Ad not available right now.");
	}
	await assertQuestNotLocked(userId, quest);
	const open = await supabaseAdmin.from("quest_sessions").select("*").eq("user_id", userId).eq("quest_key", questKey).eq("status", "started").maybeSingle();
	if (open.data) return open.data;
	const created = await supabaseAdmin.from("quest_sessions").insert({
		user_id: userId,
		quest_key: quest.key,
		ads_required: quest.ads_required,
		reward_amount: quest.reward_amount,
		quest_type: quest.quest_type,
		current_step: 0
	}).select("*").single();
	if (created.error) throw new Error("Could not start this quest.");
	return created.data;
}
async function reportAdImpl(userId, sessionId, provider) {
	if (!await areAdsEnabledImpl()) throw new Error("Ad not available right now.");
	if (!provider || provider === "placeholder" || provider === "none") throw new Error("Ad not available right now.");
	const session = await supabaseAdmin.from("quest_sessions").select("*").eq("id", sessionId).eq("user_id", userId).single();
	if (session.error || !session.data) throw new Error("Quest session not found.");
	if (session.data.status === "verified") return finishAdQuest(userId, session.data);
	if (session.data.status !== "started") throw new Error("This quest is already finished.");
	const nextCount = session.data.ads_watched + 1;
	if ((Date.now() - new Date(session.data.started_at).getTime()) / 1e3 < nextCount * 5) throw new Error("Ad was not watched long enough to count.");
	const hourAgo = (/* @__PURE__ */ new Date(Date.now() - 36e5)).toISOString();
	if (((await supabaseAdmin.from("quest_sessions").select("ads_watched").eq("user_id", userId).gte("started_at", hourAgo)).data ?? []).reduce((sum, r) => sum + r.ads_watched, 0) >= 80) throw new Error("You've hit the hourly limit. Try again a little later.");
	const done = nextCount >= session.data.ads_required;
	const updated = await supabaseAdmin.from("quest_sessions").update({
		ads_watched: nextCount,
		status: done ? "verified" : "started",
		verified_at: done ? (/* @__PURE__ */ new Date()).toISOString() : null
	}).eq("id", sessionId).eq("status", "started").eq("ads_watched", session.data.ads_watched).select("*").maybeSingle();
	if (updated.error) throw new Error("Could not record that ad.");
	if (!updated.data) throw new Error("That ad was already counted. Please try again.");
	await touchStreakImpl(userId);
	{
		const { recordTaskEvent } = await import("./engine.server-C6tIpR1m.mjs");
		await recordTaskEvent({
			userId,
			eventType: "ad_watch",
			eventKey: `${sessionId}:${nextCount}`
		});
	}
	if (done) return finishAdQuest(userId, updated.data);
	return {
		...updated.data,
		credited: false
	};
}
/**
* Pays a 'verified' ads quest session and marks it credited. Safe to call more
* than once: the credit is keyed on the session id, so only the first call pays
* (and notifies).
*/
async function finishAdQuest(userId, session) {
	const reward = Number(session.reward_amount);
	const credit = await creditWallet(userId, reward, "quest", `Starter quest — ${session.ads_required} ads`, "earned", session.id);
	await supabaseAdmin.from("quest_sessions").update({
		status: "credited",
		credited_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", session.id).eq("status", "verified");
	if (!credit.duplicate) await notify(userId, "Quest completed", `You earned $${reward.toFixed(2)}.`, "quest");
	{
		const { recordTaskEvent } = await import("./engine.server-C6tIpR1m.mjs");
		await recordTaskEvent({
			userId,
			eventType: "quest_completed",
			eventKey: session.id
		});
	}
	return {
		...session,
		status: "credited",
		credited: true
	};
}
async function completeTaskImpl(userId, taskId) {
	const task = await supabaseAdmin.from("tasks").select("*").eq("id", taskId).single();
	if (task.error || !task.data?.is_active) throw new Error("Task unavailable.");
	if (task.data.task_type !== "manual") throw new Error("This task completes automatically from your activity.");
	{
		const { assertTaskNotLocked } = await import("./engine.server-C6tIpR1m.mjs");
		await assertTaskNotLocked(userId, task.data);
	}
	const existing = await supabaseAdmin.from("user_tasks").select("*").eq("user_id", userId).eq("task_id", taskId).eq("period_key", "lifetime").maybeSingle();
	if (existing.data?.status === "completed") {
		if (existing.data.reward_status !== "paid") {
			await payManualTask(userId, existing.data.id, task.data.title, Number(task.data.reward));
			return {
				progress: existing.data.progress,
				completed: true
			};
		}
		throw new Error("Task already completed.");
	}
	const progress = Math.min((existing.data?.progress ?? 0) + 1, task.data.steps_total);
	const completed = progress >= task.data.steps_total;
	const saved = await supabaseAdmin.from("user_tasks").upsert({
		user_id: userId,
		task_id: taskId,
		period_key: "lifetime",
		target: task.data.steps_total,
		progress,
		status: completed ? "completed" : "active",
		completed_at: completed ? (/* @__PURE__ */ new Date()).toISOString() : null,
		reward_status: "pending",
		rewarded_at: null
	}, { onConflict: "user_id,task_id,period_key" }).select("id").single();
	if (saved.error || !saved.data) throw new Error("Couldn't update that task.");
	await touchStreakImpl(userId);
	if (completed) await payManualTask(userId, saved.data.id, task.data.title, Number(task.data.reward));
	return {
		progress,
		completed
	};
}
/**
* Pays a completed manual task once. Two overlapping final taps both reach
* here; the credit is keyed on the user_tasks row id, so only one pays (and
* notifies), and both then mark the row paid.
*/
async function payManualTask(userId, userTaskId, title, reward) {
	const credit = await creditWallet(userId, reward, "task", title, "earned", userTaskId);
	await supabaseAdmin.from("user_tasks").update({
		reward_status: "paid",
		rewarded_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", userTaskId).eq("reward_status", "pending");
	if (!credit.duplicate) await notify(userId, "Task completed", `${title} — $${reward.toFixed(2)} added.`, "task");
}
async function claimOfferImpl(userId, offerId, proofUrl, country = null) {
	try {
		if ((await supabaseAdmin.rpc("get_maintenance_status")).data?.enabled) {
			const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
			if (!roles) throw new Error("The app is currently under maintenance. Please try again later.");
		}
	} catch (error) {
		if (error.message.includes("maintenance")) throw error;
	}
	const offer = await supabaseAdmin.from("offers").select("*").eq("id", offerId).single();
	if (offer.error || !offer.data.is_active) throw new Error("Offer unavailable.");
	const o = offer.data;
	if (o.source === "network" && country) {
		const { data: availability } = await supabaseAdmin.from("offer_country_availability").select("offer_id").eq("offer_id", offerId).eq("country", country).maybeSingle();
		const { data: hasAnyAvailability } = await supabaseAdmin.from("offer_country_availability").select("offer_id").eq("offer_id", offerId).limit(1).maybeSingle();
		if (hasAnyAvailability && !availability) {
			await logAutomation({
				eventType: "offer_claim",
				status: "error",
				source: "claim_country_blocked",
				userId,
				referenceId: offerId,
				message: "Blocked claim for offer not available in user country",
				context: {
					offerTitle: o.title,
					providerSlug: o.provider_slug,
					userCountry: country,
					offerSource: o.source
				}
			});
			throw new Error("This offer is not available in your region.");
		}
	}
	if (o.payout_mode === "auto_postback") {
		await logAutomation({
			eventType: "offer_claim",
			status: "error",
			source: "claim_offer_blocked",
			userId,
			referenceId: offerId,
			message: "Blocked manual claim for auto_postback offer",
			context: {
				offerTitle: o.title,
				providerSlug: o.provider_slug,
				payoutMode: o.payout_mode
			}
		});
		throw new Error("This offer is credited automatically once you complete it.");
	}
	const hasClickUrl = Boolean(o.click_url?.trim());
	if (!hasClickUrl && !proofUrl) throw new Error("Proof is required for this task.");
	if ((Boolean(o.is_limited_deal) || o.payout_mode === "manual_proof") && hasClickUrl && !proofUrl) throw new Error("Please upload proof of completion before submitting.");
	if (o.deal_group_id) {
		if (((await supabaseAdmin.from("offer_claims").select("id, offers:offer_id(deal_group_id)").eq("user_id", userId).neq("status", "rejected")).data ?? []).some((c) => c.offers?.deal_group_id === o.deal_group_id)) throw new Error("You already have a claim in this deal group — only one is allowed.");
	}
	const existing = await supabaseAdmin.from("offer_claims").select("*").eq("user_id", userId).eq("offer_id", offerId).in("status", [
		"started",
		"pending",
		"approved"
	]).maybeSingle();
	if (existing.data) {
		if (existing.data.status === "started") throw new Error("You already started this offer. Upload your proof to complete it.");
		throw new Error("You already submitted this offer for review.");
	}
	const created = await supabaseAdmin.from("offer_claims").insert({
		user_id: userId,
		offer_id: offerId,
		reward_amount: o.reward_amount,
		proof_url: proofUrl,
		status: "pending",
		country
	}).select("*").single();
	if (created.error) throw new Error("Could not submit that offer.");
	await notify(userId, "Offer submitted", `${o.title} is pending review. We'll credit it once approved.`, "offer");
	return created.data;
}
/** Start an offer claim for URL+proof workflow (Type 2) */
async function startOfferClaimImpl(userId, offerId, country = null) {
	const offer = await supabaseAdmin.from("offers").select("*").eq("id", offerId).single();
	if (offer.error || !offer.data.is_active) throw new Error("Offer unavailable.");
	const o = offer.data;
	if (o.source === "network" && country) {
		const { data: availability } = await supabaseAdmin.from("offer_country_availability").select("offer_id").eq("offer_id", offerId).eq("country", country).maybeSingle();
		const { data: hasAnyAvailability } = await supabaseAdmin.from("offer_country_availability").select("offer_id").eq("offer_id", offerId).limit(1).maybeSingle();
		if (hasAnyAvailability && !availability) {
			await logAutomation({
				eventType: "offer_claim",
				status: "error",
				source: "start_claim_country_blocked",
				userId,
				referenceId: offerId,
				message: "Blocked start claim for offer not available in user country",
				context: {
					offerTitle: o.title,
					providerSlug: o.provider_slug,
					userCountry: country,
					offerSource: o.source
				}
			});
			throw new Error("This offer is not available in your region.");
		}
	}
	if (o.payout_mode !== "manual_proof" || !o.click_url?.trim()) throw new Error("This offer doesn't support the start workflow.");
	if (o.deal_group_id) {
		if (((await supabaseAdmin.from("offer_claims").select("id, offers:offer_id(deal_group_id)").eq("user_id", userId).neq("status", "rejected")).data ?? []).some((c) => c.offers?.deal_group_id === o.deal_group_id)) throw new Error("You already have a claim in this deal group — only one is allowed.");
	}
	const existing = await supabaseAdmin.from("offer_claims").select("*").eq("user_id", userId).eq("offer_id", offerId).in("status", [
		"started",
		"pending",
		"approved"
	]).maybeSingle();
	if (existing.data) {
		if (existing.data.status === "started") return existing.data;
		throw new Error("You already submitted this offer.");
	}
	const created = await supabaseAdmin.from("offer_claims").insert({
		user_id: userId,
		offer_id: offerId,
		reward_amount: o.reward_amount,
		status: "started",
		country
	}).select("*").single();
	if (created.error) throw new Error("Could not start this offer.");
	return created.data;
}
/** Submit proof for a started claim */
async function submitOfferProofImpl(userId, offerId, proofPath) {
	if (!proofPath.startsWith(`offer-proof/${userId}/`)) throw new Error("Invalid proof path.");
	const claim = await supabaseAdmin.from("offer_claims").select("*, offers:offer_id(*)").eq("user_id", userId).eq("offer_id", offerId).eq("status", "started").maybeSingle();
	if (!claim.data) throw new Error("No started claim found. Start the offer first.");
	if (claim.data.proof_url) {
		if (claim.data.status === "started") await supabaseAdmin.from("offer_claims").update({
			status: "pending",
			proof_url: proofPath
		}).eq("id", claim.data.id);
		return claim.data;
	}
	const updated = await supabaseAdmin.from("offer_claims").update({
		status: "pending",
		proof_url: proofPath
	}).eq("id", claim.data.id).select("*").single();
	if (updated.error) throw new Error("Could not submit proof.");
	const offer = claim.data.offers;
	await notify(userId, "Proof submitted", `${offer.title} is pending review. We'll credit it once approved.`, "offer");
	return updated.data;
}
async function savePayoutMethodImpl(userId, input) {
	const methodSpec = payoutMethodSpec(input.methodType);
	if (!methodSpec?.available) throw new Error(`${methodSpec?.label ?? "That payout method"} is not available yet.`);
	if (input.walletAddress) {
		const { validateCryptoAddress } = await import("./payout-methods-axzHBpbm.mjs").then((n) => n.c).then((n) => n.c);
		const validation = validateCryptoAddress(input.methodType, input.walletAddress);
		if (!validation.valid) throw new Error(validation.error || "Invalid wallet address");
	}
	if (input.binancePayId) {
		const { validateBinancePayId } = await import("./payout-methods-axzHBpbm.mjs").then((n) => n.c).then((n) => n.c);
		const validation = validateBinancePayId(input.binancePayId);
		if (!validation.valid) throw new Error(validation.error || "Invalid Binance Pay ID or email");
	}
	const { data, error } = await supabaseAdmin.from("payout_methods").insert({
		user_id: userId,
		method_type: input.methodType,
		label: input.label || methodSpec.label,
		holder_name: input.holderName?.trim() || null,
		upi_id: input.upiId?.trim() || null,
		paypal_email: input.paypalEmail?.trim() || null,
		account_number: input.accountNumber?.trim() || null,
		country_bank_code: input.countryBankCode?.trim() || null,
		bank_name: input.bankName?.trim() || null,
		country: input.country?.trim() || null,
		gift_card_recipient_email: input.giftCardRecipientEmail?.trim() || null,
		wallet_address: input.walletAddress?.trim() || null,
		binance_pay_id: input.binancePayId?.trim() || null
	}).select("*").single();
	if (error) {
		console.error("[payout-method] save failed", {
			userId,
			error
		});
		throw new Error("Could not save that payout method.");
	}
	return data;
}
async function createWithdrawalImpl(userId, amount, payoutMethodId) {
	try {
		if ((await supabaseAdmin.rpc("get_maintenance_status")).data?.enabled) {
			const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
			if (!roles) throw new Error("The app is currently under maintenance. Please try again later.");
		}
	} catch (error) {
		if (error.message.includes("maintenance")) throw error;
	}
	if (!Number.isFinite(amount) || amount < 5) throw new Error(`Minimum withdrawal is $${5 .toFixed(2)}.`);
	const method = await supabaseAdmin.from("payout_methods").select("*").eq("id", payoutMethodId).eq("user_id", userId).maybeSingle();
	if (!method.data) throw new Error("Choose a valid payout method.");
	const methodSpec = payoutMethodSpec(method.data.method_type);
	if (!methodSpec?.available) throw new Error(`${methodSpec?.label ?? "That payout method"} is not available yet.`);
	const methodMin = methodSpec.minWithdrawalUsd ?? 5;
	if (amount < methodMin) throw new Error(`Minimum withdrawal for ${methodSpec.label} is $${methodMin.toFixed(2)}.`);
	const networkFee = methodSpec.networkFeeUsd ?? 0;
	if (networkFee > 0 && amount <= networkFee) throw new Error(`Withdrawal amount must be greater than the network fee of $${networkFee.toFixed(2)}.`);
	let created;
	try {
		created = await requestWithdrawalRpc({
			userId,
			amount,
			payoutMethodId,
			methodType: method.data.method_type,
			snapshot: buildPayoutSnapshot(method.data),
			networkFee: networkFee > 0 ? networkFee : null
		});
	} catch (error) {
		if (isWalletError(error, "WITHDRAWAL_INSUFFICIENT")) throw new Error("That's more than your available balance.");
		if (isWalletError(error, "WITHDRAWAL_ALREADY_PENDING")) throw new Error("You already have a withdrawal awaiting review.");
		if (isWalletError(error, "WALLET_NOT_FOUND")) throw new Error("Wallet unavailable.");
		console.error("[wallet] withdrawal request failed", {
			userId,
			error
		});
		throw new Error("Could not submit that withdrawal.");
	}
	const netAmount = amount - networkFee;
	const feeNotice = networkFee > 0 ? ` (you receive $${netAmount.toFixed(2)} after a $${networkFee.toFixed(2)} network fee)` : "";
	await notify(userId, "Withdrawal submitted", `$${amount.toFixed(2)} is pending review${feeNotice}.`, "wallet");
	return created;
}
async function cancelWithdrawalImpl(userId, id) {
	try {
		await cancelWithdrawalRpc(userId, id);
	} catch (error) {
		if (isWalletError(error, "WITHDRAWAL_NOT_CANCELLABLE")) throw new Error("This request can't be cancelled.");
		console.error("[wallet] withdrawal cancel failed", {
			userId,
			id,
			error
		});
		throw new Error("Couldn't cancel that request.");
	}
	return { ok: true };
}
async function assertAdmin(supabase, userId) {
	const { data } = await supabase.rpc("has_role", {
		_user_id: userId,
		_role: "admin"
	});
	if (data !== true) throw new Error("Forbidden");
}
async function adminUpdateWithdrawalImpl(adminId, id, status, note, referenceId = null, transactionHash = null) {
	if (status !== "approved" && status !== "rejected") throw new Error("Unsupported status.");
	const withdrawal = await supabaseAdmin.from("withdrawal_requests").select("method_type, status, amount, user_id").eq("id", id).maybeSingle();
	if (!withdrawal.data) throw new Error("Request not found.");
	const { isCryptoMethod } = await import("./payout-methods-axzHBpbm.mjs").then((n) => n.c).then((n) => n.c);
	if (status === "approved" && isCryptoMethod(withdrawal.data.method_type) && !transactionHash?.trim()) throw new Error("Transaction hash is required for crypto withdrawals.");
	if (status === "approved" && withdrawal.data.method_type === "binance_pay" && !transactionHash?.trim()) throw new Error("Binance Pay order ID is required.");
	const statusBefore = withdrawal.data.status;
	let result;
	try {
		result = await settleWithdrawalRpc({
			requestId: id,
			decision: status,
			note,
			reference: referenceId,
			transactionHash
		});
	} catch (error) {
		if (isWalletError(error, "WITHDRAWAL_NOT_FOUND")) throw new Error("Request not found.");
		if (isWalletError(error, "WITHDRAWAL_ALREADY_SETTLED")) throw new Error("This request has already been settled.");
		console.error("[wallet] withdrawal settle failed", {
			id,
			status,
			error
		});
		throw new Error("Could not update that withdrawal.");
	}
	if (!result.settled) return {
		ok: true,
		alreadySettled: true
	};
	const amount = result.amount;
	if (result.status === "approved") {
		await notify(result.userId, "Withdrawal approved", note ?? `$${amount.toFixed(2)} has been sent to your payout method.`, "wallet");
		try {
			await payReferralMilestone(result.userId, "withdrawal", "Referral: friend's first withdrawal");
		} catch (error) {
			console.error("[referral] withdrawal milestone failed", {
				userId: result.userId,
				error
			});
		}
	} else await notify(result.userId, "Withdrawal rejected", note ?? "Please contact support for details.", "wallet");
	const { logAdminAction } = await import("./admin-audit.server-KG3-2V08.mjs");
	await logAdminAction({
		adminId,
		action: status === "approved" ? "withdrawal_approve" : "withdrawal_reject",
		targetType: "withdrawal",
		targetId: id,
		before: {
			status: statusBefore,
			amount: withdrawal.data.amount
		},
		after: {
			status,
			amount: withdrawal.data.amount
		},
		note: note || void 0
	});
	return { ok: true };
}
async function adminUpdateOfferClaimImpl(adminId, id, status, note) {
	if (status !== "approved" && status !== "rejected") throw new Error("Unsupported status.");
	const claim = await supabaseAdmin.from("offer_claims").select("*").eq("id", id).single();
	if (claim.error) throw new Error("Claim not found.");
	if (claim.data.status !== "pending") return {
		ok: true,
		alreadyReviewed: true
	};
	const statusBefore = claim.data.status;
	const rewardBefore = claim.data.reward_amount;
	let rewardOverride = null;
	if (status === "approved") {
		const o = (await supabaseAdmin.from("offers").select("*").eq("id", claim.data.offer_id).maybeSingle()).data;
		if (o?.is_limited_deal) {
			const { computeLimitedDealReward } = await import("./proof.server-DMSAyAXD.mjs");
			rewardOverride = computeLimitedDealReward({
				actual_cost: o.actual_cost,
				payout_percentage: o.payout_percentage,
				max_payout_cap: o.max_payout_cap
			});
		}
	}
	let result;
	try {
		result = await settleOfferClaimRpc({
			claimId: id,
			decision: status,
			note,
			reward: rewardOverride
		});
	} catch (error) {
		if (isWalletError(error, "CLAIM_NOT_FOUND")) throw new Error("Claim not found.");
		console.error("[wallet] offer claim settle failed", {
			id,
			status,
			error
		});
		throw new Error("Could not update that claim.");
	}
	if (!result.settled) return {
		ok: true,
		alreadyReviewed: true
	};
	if (result.status === "approved") {
		if (result.previousLifetimeEarned === 0) try {
			await payReferralMilestone(result.userId, "earning", "Referral: friend's first earning");
		} catch (error) {
			console.error("[referral] earning milestone failed", {
				userId: result.userId,
				error
			});
		}
		const { recordTaskEvent } = await import("./engine.server-C6tIpR1m.mjs");
		await recordTaskEvent({
			userId: result.userId,
			eventType: "offer_completion",
			eventKey: claim.data.id
		});
		await notify(result.userId, "Offer approved", `$${result.reward.toFixed(2)} was added to your wallet.`, "offer");
	} else await notify(claim.data.user_id, "Offer rejected", note ?? "That offer couldn't be verified.", "offer");
	const { logAdminAction } = await import("./admin-audit.server-KG3-2V08.mjs");
	await logAdminAction({
		adminId,
		action: status === "approved" ? "claim_approve" : "claim_reject",
		targetType: "offer_claim",
		targetId: id,
		before: {
			status: statusBefore,
			reward_amount: rewardBefore
		},
		after: {
			status,
			reward_amount: result.reward
		},
		note: note || void 0
	});
	return { ok: true };
}
async function adminRespondTicketImpl(adminId, id, response, status) {
	const ticket = await supabaseAdmin.from("support_tickets").select("*").eq("id", id).single();
	if (ticket.error) throw new Error("Ticket not found.");
	const statusBefore = ticket.data.status;
	await supabaseAdmin.from("support_tickets").update({
		admin_response: response,
		status
	}).eq("id", id);
	await notify(ticket.data.user_id, "Support replied", response, "support");
	const { logAdminAction } = await import("./admin-audit.server-KG3-2V08.mjs");
	await logAdminAction({
		adminId,
		action: "ticket_respond",
		targetType: "support_ticket",
		targetId: id,
		before: { status: statusBefore },
		after: { status },
		note: response.substring(0, 200)
	});
	return { ok: true };
}
async function adminSetFlagImpl(adminId, userId, flagged) {
	const before = await supabaseAdmin.from("profiles").select("is_flagged, email, name").eq("id", userId).single();
	await supabaseAdmin.from("profiles").update({ is_flagged: flagged }).eq("id", userId);
	const { logAdminAction } = await import("./admin-audit.server-KG3-2V08.mjs");
	await logAdminAction({
		adminId,
		action: flagged ? "user_flag" : "user_unflag",
		targetType: "user",
		targetId: userId,
		before: { is_flagged: before.data?.is_flagged },
		after: { is_flagged: flagged },
		note: `${before.data?.email || before.data?.name || userId}`
	});
	return { ok: true };
}
async function adminAdjustWalletImpl(adminId, userId, amount, reason) {
	const userBefore = await supabaseAdmin.from("profiles").select("wallet_balance, lifetime_earned").eq("id", userId).single();
	try {
		await walletApply({
			userId,
			amount,
			source: "adjustment",
			kind: amount >= 0 ? "bonus" : "adjustment",
			description: reason,
			lifetimeEarnedDelta: amount > 0 ? amount : 0
		});
	} catch (error) {
		if (isWalletError(error, "WALLET_NOT_FOUND")) throw new Error("User not found.");
		if (isWalletError(error, "WALLET_NEGATIVE")) throw new Error("That adjustment would make the available balance negative.");
		console.error("[wallet] admin adjustment failed", {
			userId,
			error
		});
		throw new Error("Could not adjust that wallet.");
	}
	const userAfter = await supabaseAdmin.from("profiles").select("wallet_balance, lifetime_earned").eq("id", userId).single();
	await notify(userId, "Wallet adjusted", `${reason} (${amount >= 0 ? "+" : "−"}$${Math.abs(amount).toFixed(2)})`, "wallet");
	const { logAdminAction } = await import("./admin-audit.server-KG3-2V08.mjs");
	await logAdminAction({
		adminId,
		action: "wallet_adjust",
		targetType: "user",
		targetId: userId,
		before: {
			wallet_balance: userBefore.data?.wallet_balance,
			lifetime_earned: userBefore.data?.lifetime_earned
		},
		after: {
			wallet_balance: userAfter.data?.wallet_balance,
			lifetime_earned: userAfter.data?.lifetime_earned
		},
		note: `${amount >= 0 ? "+" : ""}${amount}: ${reason}`
	});
	return { ok: true };
}
async function adminOverviewImpl() {
	const totalsRow = (await supabaseAdmin.rpc("admin_compute_totals")).data?.[0];
	const totals = {
		users: Number(totalsRow?.total_users ?? 0),
		flagged: Number(totalsRow?.flagged_users ?? 0),
		earned: Number(totalsRow?.total_lifetime_earned ?? 0),
		withdrawn: Number(totalsRow?.total_lifetime_withdrawn ?? 0),
		liability: Number(totalsRow?.total_wallet_liability ?? 0)
	};
	const payoutMethods = await supabaseAdmin.from("payout_methods").select("id, user_id, binance_pay_id").eq("method_type", "binance_pay").not("binance_pay_id", "is", null);
	const binancePayIdCounts = /* @__PURE__ */ new Map();
	for (const method of payoutMethods.data ?? []) {
		const normalized = method.binance_pay_id?.trim().toLowerCase();
		if (normalized) binancePayIdCounts.set(normalized, (binancePayIdCounts.get(normalized) ?? 0) + 1);
	}
	const duplicateBinancePayMethodIds = /* @__PURE__ */ new Set();
	for (const method of payoutMethods.data ?? []) {
		const normalized = method.binance_pay_id?.trim().toLowerCase();
		if (normalized && (binancePayIdCounts.get(normalized) ?? 0) > 1) duplicateBinancePayMethodIds.add(method.id);
	}
	return {
		totals,
		duplicateBinancePayMethodIds
	};
}
async function adminListUsersImpl(input) {
	const page = Math.max(1, input.page ?? 1);
	const pageSize = 25;
	const offset = (page - 1) * pageSize;
	if (input.suspiciousOnly) {
		const threeDaysAgo = /* @__PURE__ */ new Date();
		threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
		let query = supabaseAdmin.from("profiles").select("id, name, email, phone, device_id, is_flagged, wallet_balance, held_balance, lifetime_earned, lifetime_withdrawn, referral_code, created_at").order("created_at", { ascending: false });
		if (input.search && input.search.trim()) {
			const term = `%${input.search.trim()}%`;
			query = query.or(`email.ilike.${term},name.ilike.${term},referral_code.ilike.${term},device_id.ilike.${term}`);
		}
		const allUsers = (await query).data ?? [];
		const deviceIdCounts = /* @__PURE__ */ new Map();
		for (const user of allUsers) if (user.device_id && user.device_id !== "" && user.device_id !== "server") deviceIdCounts.set(user.device_id, (deviceIdCounts.get(user.device_id) || 0) + 1);
		const suspicious = allUsers.filter((user) => {
			if (user.is_flagged) return true;
			if (user.device_id && user.device_id !== "" && user.device_id !== "server") {
				if ((deviceIdCounts.get(user.device_id) || 0) > 1) return true;
			}
			if (new Date(user.created_at) >= threeDaysAgo && user.lifetime_earned > 0) return true;
			return false;
		});
		const total = suspicious.length;
		return {
			users: suspicious.slice(offset, offset + pageSize),
			total,
			page,
			pageSize,
			totalPages: Math.ceil(total / pageSize)
		};
	}
	let query = supabaseAdmin.from("profiles").select("id, name, email, phone, device_id, is_flagged, wallet_balance, held_balance, lifetime_earned, lifetime_withdrawn, referral_code, created_at", { count: "exact" });
	if (input.flaggedOnly) query = query.eq("is_flagged", true);
	if (input.search && input.search.trim()) {
		const term = `%${input.search.trim()}%`;
		query = query.or(`email.ilike.${term},name.ilike.${term},referral_code.ilike.${term},device_id.ilike.${term}`);
	}
	query = query.order("created_at", { ascending: false }).range(offset, offset + pageSize - 1);
	const result = await query;
	return {
		users: result.data ?? [],
		total: result.count ?? 0,
		page,
		pageSize,
		totalPages: Math.ceil((result.count ?? 0) / pageSize)
	};
}
async function adminListWithdrawalsImpl(input) {
	const page = Math.max(1, input.page ?? 1);
	const pageSize = 25;
	const offset = (page - 1) * pageSize;
	let query = supabaseAdmin.from("withdrawal_requests").select("*", { count: "exact" });
	if (input.status && input.status !== "all") query = query.eq("status", input.status);
	query = query.order("status", { ascending: true }).order("created_at", { ascending: false }).range(offset, offset + pageSize - 1);
	const result = await query;
	const userIds = [...new Set((result.data ?? []).map((w) => w.user_id))];
	const profiles = await supabaseAdmin.from("profiles").select("id, name, email").in("id", userIds);
	const byId = new Map((profiles.data ?? []).map((p) => [p.id, p]));
	const payoutMethodIds = (result.data ?? []).filter((w) => w.payout_method_id).map((w) => w.payout_method_id);
	const payoutMethods = await supabaseAdmin.from("payout_methods").select("id, binance_pay_id").eq("method_type", "binance_pay").in("id", payoutMethodIds);
	const binancePayIdCounts = /* @__PURE__ */ new Map();
	const allBinanceMethods = await supabaseAdmin.from("payout_methods").select("id, binance_pay_id").eq("method_type", "binance_pay").not("binance_pay_id", "is", null);
	for (const method of allBinanceMethods.data ?? []) {
		const normalized = method.binance_pay_id?.trim().toLowerCase();
		if (normalized) binancePayIdCounts.set(normalized, (binancePayIdCounts.get(normalized) ?? 0) + 1);
	}
	const duplicateBinancePayMethodIds = /* @__PURE__ */ new Set();
	for (const method of payoutMethods.data ?? []) {
		const normalized = method.binance_pay_id?.trim().toLowerCase();
		if (normalized && (binancePayIdCounts.get(normalized) ?? 0) > 1) duplicateBinancePayMethodIds.add(method.id);
	}
	const pendingCount = await supabaseAdmin.from("withdrawal_requests").select("id", {
		count: "exact",
		head: true
	}).eq("status", "pending");
	return {
		withdrawals: (result.data ?? []).map((w) => ({
			...w,
			user: byId.get(w.user_id) ?? null,
			hasDuplicateBinancePay: w.method_type === "binance_pay" && w.payout_method_id && duplicateBinancePayMethodIds.has(w.payout_method_id)
		})),
		total: result.count ?? 0,
		page,
		pageSize,
		totalPages: Math.ceil((result.count ?? 0) / pageSize),
		pendingCount: pendingCount.count ?? 0
	};
}
async function adminListClaimsImpl(input) {
	const page = Math.max(1, input.page ?? 1);
	const pageSize = 25;
	const offset = (page - 1) * pageSize;
	let query = supabaseAdmin.from("offer_claims").select("*, offers:offer_id(title, is_limited_deal, deal_group_id, payout_mode)", { count: "exact" });
	query = query.not("proof_url", "is", null);
	if (input.status && input.status !== "all") query = query.eq("status", input.status);
	query = query.order("status", { ascending: true }).order("created_at", { ascending: false }).range(offset, offset + pageSize - 1);
	const result = await query;
	const userIds = [...new Set((result.data ?? []).map((c) => c.user_id))];
	const profiles = await supabaseAdmin.from("profiles").select("id, name, email").in("id", userIds);
	const byId = new Map((profiles.data ?? []).map((p) => [p.id, p]));
	const pendingCount = await supabaseAdmin.from("offer_claims").select("id", {
		count: "exact",
		head: true
	}).eq("status", "pending").not("proof_url", "is", null);
	return {
		claims: (result.data ?? []).map((c) => ({
			...c,
			user: byId.get(c.user_id) ?? null
		})),
		total: result.count ?? 0,
		page,
		pageSize,
		totalPages: Math.ceil((result.count ?? 0) / pageSize),
		pendingCount: pendingCount.count ?? 0
	};
}
async function adminListTicketsImpl(input) {
	const page = Math.max(1, input.page ?? 1);
	const pageSize = 25;
	const offset = (page - 1) * pageSize;
	let query = supabaseAdmin.from("support_tickets").select("*", { count: "exact" });
	if (input.status === "open") query = query.neq("status", "resolved");
	else if (input.status === "resolved") query = query.eq("status", "resolved");
	query = query.order("status", { ascending: true }).order("created_at", { ascending: false }).range(offset, offset + pageSize - 1);
	const result = await query;
	const userIds = [...new Set((result.data ?? []).map((t) => t.user_id))];
	const profiles = await supabaseAdmin.from("profiles").select("id, name, email").in("id", userIds);
	const byId = new Map((profiles.data ?? []).map((p) => [p.id, p]));
	const openCount = await supabaseAdmin.from("support_tickets").select("id", {
		count: "exact",
		head: true
	}).neq("status", "resolved");
	return {
		tickets: (result.data ?? []).map((t) => ({
			...t,
			user: byId.get(t.user_id) ?? null
		})),
		total: result.count ?? 0,
		page,
		pageSize,
		totalPages: Math.ceil((result.count ?? 0) / pageSize),
		openCount: openCount.count ?? 0
	};
}
/**
* Transfer earnings from wallet to Campaign Balance (one-way).
* Uses the authenticated user ID from context (never from request body).
* Generates idempotency key per form submit to prevent double debits.
*/
async function transferEarningsToAdvertiserImpl(userId, amount, idempotencyKey) {
	try {
		const { data, error } = await supabaseAdmin.rpc("earner_to_advertiser_transfer", {
			p_user_id: userId,
			p_amount: amount,
			p_idempotency_key: idempotencyKey
		});
		if (error) {
			const code = error.code || error.message;
			if (code.includes("TRANSFER_BELOW_MINIMUM")) throw new Error("Minimum transfer amount is $5.00");
			if (code.includes("TRANSFER_INVALID_AMOUNT")) throw new Error("Amount must have at most two decimal places");
			if (code.includes("TRANSFER_INSUFFICIENT_BALANCE")) {
				const match = (error.details || "").match(/Available: ([\d.]+)/);
				const available = match ? match[1] : "0";
				throw new Error(`Insufficient balance. Available: $${available}`);
			}
			if (code.includes("TRANSFER_NO_ADVERTISER_ACCOUNT") || code.includes("TRANSFER_ADVERTISER_NOT_ACTIVE")) throw new Error("You need an active advertiser account. Please complete advertiser onboarding first.");
			if (code.includes("TRANSFER_LEDGER_CONFLICT")) throw new Error("Transfer conflict. Please try again.");
			console.error("[transfer] Unexpected error:", error);
			throw new Error("Transfer failed. Please try again later.");
		}
		if (!data) throw new Error("Transfer failed: no response from database");
		return {
			walletBalance: Number(data.wallet_balance ?? 0),
			depositBalance: Number(data.deposit_balance ?? 0),
			transferred: Boolean(data.transferred)
		};
	} catch (err) {
		if (err instanceof Error) throw err;
		throw new Error("Transfer failed");
	}
}
async function createAdjustmentRequestImpl(adminId, userId, amount, reason) {
	if (Math.abs(amount) <= 100) throw new Error("Amounts up to $100 are applied immediately. Use adminAdjustWallet instead.");
	const { data, error } = await supabaseAdmin.from("adjustment_requests").insert({
		user_id: userId,
		amount,
		reason,
		requested_by: adminId,
		status: "pending"
	}).select("*").single();
	if (error) throw new Error("Could not create adjustment request.");
	const { logAdminAction } = await import("./admin-audit.server-KG3-2V08.mjs");
	await logAdminAction({
		adminId,
		action: "adjustment_request_create",
		targetType: "adjustment_request",
		targetId: data.id,
		after: {
			user_id: userId,
			amount,
			reason,
			status: "pending"
		},
		note: reason
	});
	return data;
}
async function listAdjustmentRequestsImpl(status) {
	let query = supabaseAdmin.from("adjustment_requests").select(`
      *,
      user:profiles!adjustment_requests_user_id_fkey(id, name, email, wallet_balance),
      requester:profiles!adjustment_requests_requested_by_fkey(id, name, email),
      approver:profiles!adjustment_requests_approved_by_fkey(id, name, email)
    `).order("created_at", { ascending: false });
	if (status) query = query.eq("status", status);
	const { data, error } = await query;
	if (error) {
		console.error("[adjustment-requests] Error fetching:", error);
		throw new Error("Could not fetch adjustment requests.");
	}
	return {
		requests: data ?? [],
		page: 1,
		totalPages: 1,
		total: (data ?? []).length
	};
}
async function approveAdjustmentRequestImpl(approverId, requestId, note) {
	const request = await supabaseAdmin.from("adjustment_requests").select("*").eq("id", requestId).single();
	if (request.error || !request.data) throw new Error("Request not found.");
	if (request.data.status !== "pending") throw new Error("Request already processed.");
	if (request.data.requested_by === approverId) throw new Error("You cannot approve your own adjustment request.");
	await adminAdjustWalletImpl(approverId, request.data.user_id, Number(request.data.amount), request.data.reason);
	await supabaseAdmin.from("adjustment_requests").update({
		status: "approved",
		approved_by: approverId,
		approval_note: note ?? null,
		decided_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", requestId);
	const { logAdminAction } = await import("./admin-audit.server-KG3-2V08.mjs");
	await logAdminAction({
		adminId: approverId,
		action: "adjustment_request_approve",
		targetType: "adjustment_request",
		targetId: requestId,
		before: { status: "pending" },
		after: {
			status: "approved",
			amount: request.data.amount
		},
		note: note || void 0
	});
	return { ok: true };
}
async function rejectAdjustmentRequestImpl(approverId, requestId, note) {
	const request = await supabaseAdmin.from("adjustment_requests").select("*").eq("id", requestId).single();
	if (request.error || !request.data) throw new Error("Request not found.");
	if (request.data.status !== "pending") throw new Error("Request already processed.");
	if (request.data.requested_by === approverId) throw new Error("You cannot reject your own adjustment request.");
	await supabaseAdmin.from("adjustment_requests").update({
		status: "rejected",
		approved_by: approverId,
		approval_note: note,
		decided_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", requestId);
	const { logAdminAction } = await import("./admin-audit.server-KG3-2V08.mjs");
	await logAdminAction({
		adminId: approverId,
		action: "adjustment_request_reject",
		targetType: "adjustment_request",
		targetId: requestId,
		before: { status: "pending" },
		after: { status: "rejected" },
		note
	});
	return { ok: true };
}
async function adminListAuditLogsImpl(params) {
	const { data, error } = await supabaseAdmin.rpc("admin_list_audit_logs", {
		p_admin_id: params.adminId ?? null,
		p_action: params.action ?? null,
		p_date_from: params.dateFrom ?? null,
		p_date_to: params.dateTo ?? null,
		p_page: params.page ?? 1,
		p_page_size: 25
	});
	if (error) {
		console.error("[audit] Failed to list audit logs", error);
		throw new Error("Could not fetch audit logs.");
	}
	const logs = data ?? [];
	const totalCount = logs[0]?.total_count ?? 0;
	const page = params.page ?? 1;
	const pageSize = 25;
	return {
		logs: logs.map((log) => ({
			id: log.id,
			adminId: log.admin_id,
			adminEmail: log.admin_email,
			action: log.action,
			targetType: log.target_type,
			targetId: log.target_id,
			before: log.before,
			after: log.after,
			note: log.note,
			createdAt: log.created_at
		})),
		total: totalCount,
		page,
		pageSize,
		totalPages: Math.ceil(totalCount / pageSize)
	};
}
async function getWithdrawalFraudSignalsImpl(withdrawalId) {
	const withdrawal = await supabaseAdmin.from("withdrawal_requests").select("*, profiles!inner(id, created_at, lifetime_earned, is_flagged, device_id)").eq("id", withdrawalId).single();
	if (withdrawal.error || !withdrawal.data) return null;
	const user = withdrawal.data.profiles;
	const accountAgeDays = await supabaseAdmin.rpc("account_age_days", { p_user_id: user.id });
	const approvedWithdrawals = await supabaseAdmin.rpc("count_approved_withdrawals", { p_user_id: user.id });
	let deviceDuplicates = 0;
	if (user.device_id && user.device_id !== "" && user.device_id !== "server") {
		const deviceDuplicatesResult = await supabaseAdmin.rpc("count_device_duplicates", { p_device_id: user.device_id });
		deviceDuplicates = Number(deviceDuplicatesResult.data) ?? 0;
	}
	const accountAge = Number(accountAgeDays.data) ?? 0;
	const approvedCount = Number(approvedWithdrawals.data) ?? 0;
	let riskLevel = "low";
	if (accountAge < 3 && approvedCount === 0 || deviceDuplicates >= 2 || user.is_flagged) riskLevel = "high";
	else if (accountAge < 7) riskLevel = "medium";
	return {
		accountAgeDays: accountAge,
		lifetimeEarned: Number(user.lifetime_earned),
		approvedWithdrawalsCount: approvedCount,
		isFlagged: user.is_flagged,
		deviceDuplicatesCount: deviceDuplicates,
		riskLevel
	};
}
async function getUsersWithSameDeviceImpl(deviceId) {
	if (!deviceId || deviceId === "" || deviceId === "server") return [];
	const { data, error } = await supabaseAdmin.from("profiles").select("id, name, email, wallet_balance, is_flagged, created_at").eq("device_id", deviceId).order("created_at", { ascending: false });
	if (error) {
		console.error("[users] Failed to fetch users with same device", error);
		throw new Error("Could not fetch users with same device.");
	}
	return data ?? [];
}
async function assignRoleImpl(adminId, userEmail, role) {
	const user = await supabaseAdmin.from("profiles").select("id").eq("email", userEmail).maybeSingle();
	if (!user.data) throw new Error(`User not found: ${userEmail}`);
	if ((await supabaseAdmin.from("user_roles").select("*").eq("user_id", user.data.id).eq("role", role).maybeSingle()).data) throw new Error("User already has this role.");
	await supabaseAdmin.from("user_roles").insert({
		user_id: user.data.id,
		role
	});
	const { logAdminAction } = await import("./admin-audit.server-KG3-2V08.mjs");
	await logAdminAction({
		adminId,
		action: "role_assign",
		targetType: "user",
		targetId: user.data.id,
		after: {
			email: userEmail,
			role
		},
		note: `Assigned ${role} to ${userEmail}`
	});
	return { ok: true };
}
async function removeRoleImpl(adminId, targetUserId, role) {
	if (targetUserId === adminId && role === "admin") throw new Error("You cannot remove your own admin role.");
	const user = await supabaseAdmin.from("profiles").select("email").eq("id", targetUserId).maybeSingle();
	const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", targetUserId).eq("role", role);
	if (error) throw new Error("Could not remove role.");
	const { logAdminAction } = await import("./admin-audit.server-KG3-2V08.mjs");
	await logAdminAction({
		adminId,
		action: "role_remove",
		targetType: "user",
		targetId: targetUserId,
		before: {
			email: user.data?.email,
			role
		},
		note: `Removed ${role} from ${user.data?.email || targetUserId}`
	});
	return { ok: true };
}
async function listStaffImpl() {
	const { data, error } = await supabaseAdmin.from("user_roles").select(`
      *,
      profiles!inner(id, email, name)
    `).order("created_at", { ascending: false });
	if (error) {
		console.error("[staff] Failed to list staff", error);
		throw new Error("Could not fetch staff list.");
	}
	const staffMap = /* @__PURE__ */ new Map();
	for (const row of data ?? []) {
		const profile = row.profiles;
		if (!staffMap.has(profile.id)) staffMap.set(profile.id, {
			userId: profile.id,
			email: profile.email,
			name: profile.name,
			roles: []
		});
		staffMap.get(profile.id).roles.push({
			role: row.role,
			assignedAt: row.created_at
		});
	}
	return { staff: Array.from(staffMap.values()) };
}
async function listQuickRepliesImpl(adminId) {
	const { data, error } = await supabaseAdmin.from("admin_quick_replies").select("*").order("created_at", { ascending: false });
	if (error) {
		console.error("[quick-replies] Failed to list", error);
		throw new Error("Could not fetch quick replies.");
	}
	return data ?? [];
}
async function createQuickReplyImpl(adminId, title, content) {
	const { data, error } = await supabaseAdmin.from("admin_quick_replies").insert({
		title,
		content,
		created_by: adminId
	}).select().single();
	if (error) {
		console.error("[quick-replies] Failed to create", error);
		throw new Error("Could not create quick reply.");
	}
	const { logAdminAction } = await import("./admin-audit.server-KG3-2V08.mjs");
	await logAdminAction({
		adminId,
		action: "quick_reply_create",
		targetType: "quick_reply",
		targetId: data.id,
		after: {
			title,
			content
		},
		note: `Created quick reply: ${title}`
	});
	return data;
}
async function updateQuickReplyImpl(adminId, replyId, title, content) {
	const oldReply = await supabaseAdmin.from("admin_quick_replies").select("*").eq("id", replyId).single();
	if (oldReply.error || !oldReply.data) {
		console.error("[quick-replies] Reply not found", oldReply.error);
		throw new Error("Quick reply not found.");
	}
	if (oldReply.data.created_by !== adminId) throw new Error("You can only edit your own quick replies.");
	const { data, error } = await supabaseAdmin.from("admin_quick_replies").update({
		title,
		content,
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", replyId).select().single();
	if (error) {
		console.error("[quick-replies] Failed to update", error);
		throw new Error("Could not update quick reply.");
	}
	const { logAdminAction } = await import("./admin-audit.server-KG3-2V08.mjs");
	await logAdminAction({
		adminId,
		action: "quick_reply_update",
		targetType: "quick_reply",
		targetId: replyId,
		before: {
			title: oldReply.data.title,
			content: oldReply.data.content
		},
		after: {
			title,
			content
		},
		note: `Updated quick reply: ${title}`
	});
	return data;
}
async function deleteQuickReplyImpl(adminId, replyId) {
	const oldReply = await supabaseAdmin.from("admin_quick_replies").select("*").eq("id", replyId).single();
	if (oldReply.error || !oldReply.data) {
		console.error("[quick-replies] Reply not found", oldReply.error);
		throw new Error("Quick reply not found.");
	}
	const { getUserRoles } = await import("./admin-audit.server-KG3-2V08.mjs");
	if (!(await getUserRoles(adminId)).includes("admin") && oldReply.data.created_by !== adminId) throw new Error("You can only delete your own quick replies. Admins can delete any.");
	const { error } = await supabaseAdmin.from("admin_quick_replies").delete().eq("id", replyId);
	if (error) {
		console.error("[quick-replies] Failed to delete", error);
		throw new Error("Could not delete quick reply.");
	}
	const { logAdminAction } = await import("./admin-audit.server-KG3-2V08.mjs");
	await logAdminAction({
		adminId,
		action: "quick_reply_delete",
		targetType: "quick_reply",
		targetId: replyId,
		before: {
			title: oldReply.data.title,
			content: oldReply.data.content
		},
		note: `Deleted quick reply: ${oldReply.data.title}`
	});
	return { ok: true };
}
async function getDashboardSignupsImpl(days) {
	const { data, error } = await supabaseAdmin.rpc("admin_daily_signups", { p_days: days });
	if (error) {
		console.error("[dashboard] Failed to fetch signups", error);
		throw new Error("Could not fetch signup data.");
	}
	return data ?? [];
}
async function getDashboardActiveUsersImpl(days) {
	const { data, error } = await supabaseAdmin.rpc("admin_daily_active_users", { p_days: days });
	if (error) {
		console.error("[dashboard] Failed to fetch active users", error);
		throw new Error("Could not fetch active users data.");
	}
	return data ?? [];
}
async function getDashboardRevenuePayoutImpl(days) {
	const { data, error } = await supabaseAdmin.rpc("admin_daily_revenue_payout", { p_days: days });
	if (error) {
		console.error("[dashboard] Failed to fetch revenue/payout", error);
		throw new Error("Could not fetch revenue/payout data.");
	}
	return data ?? [];
}
async function getDashboardTopOffersImpl(days) {
	const { data, error } = await supabaseAdmin.rpc("admin_top_offers_by_completions", {
		p_days: days,
		p_limit: 10
	});
	if (error) {
		console.error("[dashboard] Failed to fetch top offers", error);
		throw new Error("Could not fetch top offers data.");
	}
	return data ?? [];
}
async function getUserDetailImpl(userId) {
	const { data, error } = await supabaseAdmin.rpc("admin_user_detail", { p_user_id: userId });
	if (error) {
		console.error("[user-detail] Failed to fetch user detail", error);
		throw new Error("Could not fetch user detail.");
	}
	return data;
}
async function getUserAuditLogImpl(userId) {
	const { data, error } = await supabaseAdmin.rpc("admin_user_audit_log", {
		p_user_id: userId,
		p_limit: 50
	});
	if (error) {
		console.error("[user-audit] Failed to fetch user audit log", error);
		throw new Error("Could not fetch user audit log.");
	}
	return data ?? [];
}
async function sendBroadcastNotificationImpl(ctx, data) {
	const supabase = await authServiceClient(ctx);
	const user = await requireUser(supabase);
	await requireRole(user, ["admin"]);
	const { data: result, error } = await supabase.rpc("admin_send_broadcast", {
		p_admin_id: user.id,
		p_title: data.title,
		p_message: data.message,
		p_active_only: data.activeOnly
	});
	if (error) throw new Error(error.message);
	return result;
}
async function setMaintenanceModeImpl(ctx, data) {
	const supabase = await authServiceClient(ctx);
	const user = await requireUser(supabase);
	await requireRole(user, ["admin"]);
	const { data: result, error } = await supabase.rpc("admin_set_maintenance_mode", {
		p_admin_id: user.id,
		p_enabled: data.enabled,
		p_message: data.message || null
	});
	if (error) throw new Error(error.message);
	return result;
}
async function getMaintenanceStatusImpl(ctx) {
	const { data: result, error } = await (await authServiceClient(ctx)).rpc("get_maintenance_status");
	if (error) throw new Error(error.message);
	return result;
}
async function checkMaintenanceStatusImpl(ctx) {
	try {
		const { supabaseAdmin } = await import("./client.server-gEMheit0.mjs").then((n) => n.t).then((n) => (n.n(), n.t));
		const { data: result } = await supabaseAdmin.rpc("get_maintenance_status");
		return result || {
			enabled: false,
			message: ""
		};
	} catch (error) {
		console.error("Maintenance status check failed:", error);
		return {
			enabled: false,
			message: ""
		};
	}
}
async function areAdsEnabledImpl() {
	try {
		const { data } = await supabaseAdmin.from("app_settings").select("value").eq("key", "ads_enabled").maybeSingle();
		return (data?.value)?.enabled ?? false;
	} catch (error) {
		console.error("Ads enabled check failed:", error);
		return false;
	}
}
async function exportUsersCsvImpl(ctx, data) {
	const supabase = await authServiceClient(ctx);
	const user = await requireUser(supabase);
	await requireRole(user, ["admin"]);
	const { data: result, error } = await supabase.rpc("admin_export_users_csv", {
		p_admin_id: user.id,
		p_flagged_only: data.flaggedOnly || false,
		p_active_only: data.activeOnly || false
	});
	if (error) throw new Error(error.message);
	return result;
}
async function exportTransactionsCsvImpl(ctx, data) {
	const supabase = await authServiceClient(ctx);
	const user = await requireUser(supabase);
	await requireRole(user, ["admin"]);
	const { data: result, error } = await supabase.rpc("admin_export_transactions_csv", {
		p_admin_id: user.id,
		p_user_id: data.userId || null,
		p_days: data.days || 30
	});
	if (error) throw new Error(error.message);
	return result;
}
async function exportPayoutsCsvImpl(ctx, data) {
	const supabase = await authServiceClient(ctx);
	const user = await requireUser(supabase);
	await requireRole(user, ["admin", "finance"]);
	const { data: result, error } = await supabase.rpc("admin_export_payouts_csv", {
		p_admin_id: user.id,
		p_status: data.status || null,
		p_days: data.days || 30
	});
	if (error) throw new Error(error.message);
	return result;
}
//#endregion
export { settleOfferClaimRpc as a, payReferralMilestone as i, creditSdkConversionRpc as n, creditWallet as r, coinquest_server_CBcexWIA_exports as t };
