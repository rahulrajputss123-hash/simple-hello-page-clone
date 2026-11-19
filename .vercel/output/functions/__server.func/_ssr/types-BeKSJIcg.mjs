//#region node_modules/.nitro/vite/services/ssr/assets/types-BeKSJIcg.js
/** Shared (client-safe) task automation vocabulary. */
var TASK_TYPES = [
	"manual",
	"referral_count",
	"referral_window",
	"referral_daily",
	"offer_completion",
	"ad_watch",
	"shortlink",
	"content_locker",
	"offerwall_earning",
	"quest_count"
];
var TASK_TYPE_LABELS = {
	manual: "Manual (step based)",
	referral_count: "Referral count",
	referral_window: "Referral count in period",
	referral_daily: "Daily referral target",
	offer_completion: "Offer completion",
	ad_watch: "Ads watched",
	shortlink: "Shortlink completion",
	content_locker: "Content locker completion",
	offerwall_earning: "SDK Offerwall earning target",
	quest_count: "Quests completed"
};
/**
* Availability locks, mirroring quests (src/lib/lock-state.ts).
*
* Tasks deliberately omit the quests' 'earning' variant — only date and
* first-withdrawal locks were needed, and leaving it out keeps the
* tasks_lock_type_check constraint honest.
*
* A lock is NOT the same as is_active: is_active hides a task completely, while a
* lock keeps it listed in a locked state and blocks progress/crediting.
*/
var TASK_LOCK_TYPES = [
	"none",
	"time",
	"first_withdrawal"
];
var TASK_LOCK_TYPE_LABELS = {
	none: "No lock",
	time: "Until date",
	first_withdrawal: "Until first withdrawal"
};
var TASK_FREQUENCIES = [
	"daily",
	"weekly",
	"one_time",
	"lifetime"
];
var TASK_FREQUENCY_LABELS = {
	daily: "Daily",
	weekly: "Weekly",
	one_time: "One time",
	lifetime: "Lifetime"
};
/** Which activity stream drives each automated task type. */
var TASK_TYPE_EVENT = {
	manual: null,
	referral_count: "referral",
	referral_window: "referral",
	referral_daily: "referral",
	offer_completion: "offer_completion",
	ad_watch: "ad_watch",
	shortlink: "shortlink",
	content_locker: "content_locker",
	offerwall_earning: "offerwall_earning",
	quest_count: "quest_completed"
};
/** Bucket a moment in time into the reset period of a task. */
function periodKey(frequency, at = /* @__PURE__ */ new Date()) {
	if (frequency === "daily") return at.toISOString().slice(0, 10);
	if (frequency === "weekly") {
		const d = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
		const day = d.getUTCDay() || 7;
		d.setUTCDate(d.getUTCDate() - (day - 1));
		return `w${d.toISOString().slice(0, 10)}`;
	}
	return "lifetime";
}
/** Inclusive lower bound of the window progress is counted over. */
function periodStart(input, at = /* @__PURE__ */ new Date()) {
	if (input.task_type === "referral_daily") return /* @__PURE__ */ new Date(`${at.toISOString().slice(0, 10)}T00:00:00.000Z`);
	if (input.task_type === "referral_window" && input.window_days) return /* @__PURE__ */ new Date(at.getTime() - input.window_days * 864e5);
	if (input.frequency === "daily") return /* @__PURE__ */ new Date(`${at.toISOString().slice(0, 10)}T00:00:00.000Z`);
	if (input.frequency === "weekly") return /* @__PURE__ */ new Date(`${periodKey("weekly", at).slice(1)}T00:00:00.000Z`);
	return input.starts_at ? new Date(input.starts_at) : /* @__PURE__ */ new Date(0);
}
//#endregion
export { TASK_TYPES as a, periodKey as c, TASK_LOCK_TYPE_LABELS as i, periodStart as l, TASK_FREQUENCY_LABELS as n, TASK_TYPE_EVENT as o, TASK_LOCK_TYPES as r, TASK_TYPE_LABELS as s, TASK_FREQUENCIES as t };
