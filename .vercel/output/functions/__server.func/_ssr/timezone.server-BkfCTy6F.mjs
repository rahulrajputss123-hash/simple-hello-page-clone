//#region node_modules/.nitro/vite/services/ssr/assets/timezone.server-BkfCTy6F.js
/**
* Server-side timezone utilities for check-in quests.
* 
* Supports ALL valid IANA timezone names with proper handling of:
* - Half-hour offsets (Asia/Kolkata +5:30, Asia/Tehran +3:30)
* - Quarter-hour offsets (Asia/Kathmandu +5:45, Australia/Eucla +8:45)
* - DST transitions
* 
* Never trusts client-provided dates or times. All calculations done server-side.
*/
/**
* Validate IANA timezone name using Intl.DateTimeFormat.
* Returns the validated timezone or null if invalid.
* 
* Accepts ANY valid IANA timezone, including:
* - Asia/Kathmandu (+5:45 quarter-hour offset)
* - Asia/Kolkata, Asia/Dhaka, Asia/Karachi, Asia/Colombo
* - Indian/Maldives, Indian/Cocos, Indian/Christmas
* - Asia/Thimphu, Asia/Yangon, Asia/Tehran
* - All other standard IANA zones
*/
function validateTimezone(timezone) {
	if (!timezone) return null;
	const normalized = timezone.trim();
	if (!normalized) return null;
	try {
		new Intl.DateTimeFormat("en-US", { timeZone: normalized });
		return normalized;
	} catch (err) {
		if (err instanceof RangeError) return null;
		console.error("[timezone] Unexpected error validating timezone:", err);
		return null;
	}
}
/**
* Get the local date in the user's timezone.
* Uses server time (now) and converts to local date using IANA timezone.
* 
* @param timezone - IANA timezone name (e.g. "Asia/Kolkata")
* @param now - Current server time (defaults to Date.now())
* @returns Local date string in YYYY-MM-DD format
*/
function getLocalDate(timezone, now = Date.now()) {
	try {
		return new Intl.DateTimeFormat("en-CA", {
			timeZone: timezone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit"
		}).format(new Date(now));
	} catch (err) {
		console.error(`[timezone] Invalid timezone "${timezone}", falling back to UTC:`, err);
		return new Date(now).toISOString().split("T")[0] ?? "";
	}
}
/**
* Check if a timezone change is allowed for a user.
* Rules:
* - First-time set: always allowed
* - Subsequent changes: only once per 7 days
* 
* @param lastChangedAt - Last timezone change timestamp (null if never changed)
* @returns true if change is allowed
*/
function canChangeTimezone(lastChangedAt) {
	if (!lastChangedAt) return true;
	const lastChanged = new Date(lastChangedAt).getTime();
	return Date.now() - lastChanged >= 6048e5;
}
/**
* Get the number of local days between two dates in a timezone.
* 
* @param timezone - IANA timezone name
* @param fromDate - Start date (YYYY-MM-DD)
* @param toDate - End date (YYYY-MM-DD)
* @returns Number of days (inclusive, so same day = 1)
*/
function getDaysBetween(timezone, fromDate, toDate) {
	try {
		const from = /* @__PURE__ */ new Date(fromDate + "T00:00:00Z");
		const to = /* @__PURE__ */ new Date(toDate + "T00:00:00Z");
		if (isNaN(from.getTime()) || isNaN(to.getTime())) return 0;
		const diffMs = to.getTime() - from.getTime();
		const diffDays = Math.floor(diffMs / 864e5);
		return Math.abs(diffDays) + 1;
	} catch {
		return 0;
	}
}
/**
* Get yesterday's local date in the user's timezone.
*/
function getYesterdayLocal(timezone, now = Date.now()) {
	return getLocalDate(timezone, now - 864e5);
}
//#endregion
export { canChangeTimezone, getDaysBetween, getLocalDate, getYesterdayLocal, validateTimezone };
