import { n as __exportAll } from "../_runtime.mjs";
import { l as __exportAll$1 } from "./server-CpGMOUrW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/lock-state-BmOk6qOC.js
var lock_state_BmOk6qOC_exports = /* @__PURE__ */ __exportAll({
	i: () => lock_state_exports,
	n: () => computeLockState,
	r: () => formatLockReason,
	t: () => assertNotLocked
});
var lock_state_exports = /* @__PURE__ */ __exportAll$1({
	assertNotLocked: () => assertNotLocked,
	computeLockState: () => computeLockState,
	formatEarningLockReason: () => formatEarningLockReason,
	formatFirstWithdrawalLockReason: () => formatFirstWithdrawalLockReason,
	formatLockReason: () => formatLockReason,
	formatTimeLockReason: () => formatTimeLockReason
});
/**
* Compute whether an item is locked for a given user.
*
* @param lockType              'none' | 'time' | 'earning' | 'first_withdrawal'
* @param unlockAt              ISO-8601 UTC string (used when lockType === 'time')
* @param requiredLifetimeEarned  USD amount (used when lockType === 'earning')
* @param lifetimeEarned        User's current lifetime_earned from profiles table
* @param lifetimeWithdrawn     User's current lifetime_withdrawn from profiles table.
*                              Only read when lockType === 'first_withdrawal'; it is
*                              incremented exactly once per approved withdrawal, so
*                              `> 0` is the same signal the referral milestone uses.
* @param nowIso                Override "now" for testing; defaults to new Date()
*/
function computeLockState(lockType, unlockAt, requiredLifetimeEarned, lifetimeEarned, lifetimeWithdrawn = 0, nowIso) {
	const now = nowIso ? new Date(nowIso) : /* @__PURE__ */ new Date();
	if (lockType === "first_withdrawal" && Number(lifetimeWithdrawn) <= 0) return {
		is_locked: true,
		unlock_reason: { type: "first_withdrawal" }
	};
	if (lockType === "time" && unlockAt) {
		if (now < new Date(unlockAt)) return {
			is_locked: true,
			unlock_reason: {
				type: "time",
				unlocksAt: unlockAt
			}
		};
	}
	if (lockType === "earning" && requiredLifetimeEarned != null) {
		if (lifetimeEarned < requiredLifetimeEarned) return {
			is_locked: true,
			unlock_reason: {
				type: "earning",
				required: requiredLifetimeEarned,
				current: lifetimeEarned
			}
		};
	}
	return {
		is_locked: false,
		unlock_reason: null
	};
}
/**
* Server-side enforcement: throws a user-readable Error if the item is locked.
* Call this before allowing any progress or crediting any reward.
*/
function assertNotLocked(lockState, label) {
	if (!lockState.is_locked) return;
	const r = lockState.unlock_reason;
	if (r?.type === "time") throw new Error(`"${label}" is locked until ${new Date(r.unlocksAt).toUTCString()}.`);
	if (r?.type === "earning") {
		const needed = (r.required - r.current).toFixed(2);
		throw new Error(`"${label}" requires $${r.required.toFixed(2)} lifetime earned. You need $${needed} more.`);
	}
	if (r?.type === "first_withdrawal") throw new Error(`"${label}" unlocks after your first withdrawal is approved.`);
	throw new Error(`"${label}" is currently locked.`);
}
/**
* Client helper: format a time-lock reason into a human-readable countdown.
* e.g. "Unlocks in 2h 15m" or "Unlocks in 3d 4h"
*/
function formatTimeLockReason(unlocksAt) {
	const ms = new Date(unlocksAt).getTime() - Date.now();
	if (ms <= 0) return "Unlocking…";
	const totalMinutes = Math.ceil(ms / 6e4);
	const days = Math.floor(totalMinutes / 1440);
	const hours = Math.floor(totalMinutes % 1440 / 60);
	const minutes = totalMinutes % 60;
	if (days > 0) return `Unlocks in ${days}d ${hours}h`;
	if (hours > 0) return `Unlocks in ${hours}h ${minutes}m`;
	return `Unlocks in ${minutes}m`;
}
/**
* Client helper: format an earning-lock reason.
* e.g. "Earn $3.50 more to unlock"
*/
function formatEarningLockReason(required, current) {
	return `Earn $${Math.max(0, required - current).toFixed(2)} more to unlock`;
}
/** Client helper: label for a first-withdrawal lock. */
function formatFirstWithdrawalLockReason() {
	return "Unlocks after your first withdrawal";
}
/**
* Client helper: turn any lock reason into a short label.
* Keeps the Quest card and the Task list wording identical.
*/
function formatLockReason(reason) {
	if (!reason) return "Locked";
	if (reason.type === "time") return formatTimeLockReason(reason.unlocksAt);
	if (reason.type === "earning") return formatEarningLockReason(reason.required, reason.current);
	if (reason.type === "first_withdrawal") return formatFirstWithdrawalLockReason();
	return "Locked";
}
//#endregion
export { lock_state_BmOk6qOC_exports as i, computeLockState as n, formatLockReason as r, assertNotLocked as t };
