//#region node_modules/.nitro/vite/services/ssr/assets/coinquest-DxYLM4ih.js
/**
* Format a wallet balance or withdrawal amount for display.
* Shows exactly 2 decimal places with $ prefix.
* Use this for wallet balances and withdrawal amounts.
* For reward/earning amounts, use formatReward() from format-reward.ts instead.
* 
* @deprecated Use formatBalance() from format-reward.ts for new code
*/
function formatMoney(value) {
	const n = typeof value === "string" ? Number(value) : value ?? 0;
	return `$${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
}
function formatDate(value) {
	if (!value) return "—";
	return new Date(value).toLocaleDateString(void 0, {
		day: "numeric",
		month: "short",
		year: "numeric"
	});
}
function formatDateTime(value) {
	if (!value) return "—";
	return new Date(value).toLocaleString(void 0, {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit"
	});
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/referral-progress-DmJLJmiB.js
/**
* Referral milestone progress, shared by the server (to decide when to release
* the reward) and the Referral screen (to display pending vs credited), so the
* two can never disagree about how much a referral is worth.
*
* The three milestones are tracked individually but pay nothing on their own —
* the full REFERRAL_MAX_BONUS is released to the main wallet only at 3/3.
*/
var REFERRAL_MILESTONE_KEYS = [
	"signup_credited_at",
	"earning_credited_at",
	"withdrawal_credited_at"
];
var REFERRAL_MILESTONE_COUNT = REFERRAL_MILESTONE_KEYS.length;
var DAY_MS = 864e5;
function deriveReferralProgress(referral, now = Date.now()) {
	const completed = REFERRAL_MILESTONE_KEYS.filter((key) => Boolean(referral[key])).length;
	const allComplete = completed === REFERRAL_MILESTONE_COUNT;
	const creditedAmount = Math.max(0, Number(referral.bonus_amount ?? 0));
	const released = Boolean(referral.reward_released_at) || creditedAmount >= 3;
	const ageMs = now - new Date(referral.created_at).getTime();
	const windowMs = 365 * DAY_MS;
	const expired = !released && (referral.status === "expired" || ageMs > windowMs);
	const earnedByMilestones = completed * 1;
	const pendingAmount = released || expired ? 0 : Math.max(0, earnedByMilestones - creditedAmount);
	const state = released ? "credited" : expired ? "expired" : allComplete ? "unlocked" : "in_progress";
	return {
		completed,
		total: REFERRAL_MILESTONE_COUNT,
		allComplete,
		pendingAmount,
		creditedAmount,
		maxAmount: 3,
		released,
		expired,
		daysRemaining: Math.max(0, Math.ceil((windowMs - ageMs) / DAY_MS)),
		state,
		nextMilestone: REFERRAL_MILESTONE_KEYS.find((key) => !referral[key]) ?? null
	};
}
function sumReferralTotals(referrals, now = Date.now()) {
	return referrals.reduce((totals, referral) => {
		const progress = deriveReferralProgress(referral, now);
		totals.pending += progress.pendingAmount;
		totals.credited += progress.creditedAmount;
		totals.total = totals.pending + totals.credited;
		if (progress.state === "credited") totals.completed += 1;
		else if (progress.state === "expired") totals.expired += 1;
		else totals.inProgress += 1;
		return totals;
	}, {
		pending: 0,
		credited: 0,
		total: 0,
		inProgress: 0,
		completed: 0,
		expired: 0
	});
}
//#endregion
export { formatDateTime as a, formatDate as i, deriveReferralProgress as n, formatMoney as o, sumReferralTotals as r, REFERRAL_MILESTONE_COUNT as t };
