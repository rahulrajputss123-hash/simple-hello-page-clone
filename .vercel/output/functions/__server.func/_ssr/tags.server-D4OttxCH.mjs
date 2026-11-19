import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tags.server-D4OttxCH.js
init_client_server();
/**
* Server-side auto-tag computation for network / non-manual offers.
* Uses ONLY real data already in the DB — never guesses.
*
* Rules (per spec):
*   Hot       → offer's reward_amount is in the top ~15% of active offers.
*   Popular   → highest click activity in the last 7 days (top ~15%) using
*               offer_click_events; falls back to offer_claims count when
*               no click events exist yet.
*   Trending  → 7-day activity is >= 1.5× the prior 7-day activity and
*               has at least a small minimum sample size (>=3 clicks/claims)
*               to avoid noisy tags on brand-new offers.
*   Easy      → short requirements text (<=60 chars) OR category is
*               "Sign Up"-like (Trial). No signal → leave untagged.
*
* When an admin sets `tags_manual=true`, the stored `tags` array is used
* as-is and this function is not consulted.
*/
/**
* Casino/betting keyword detection.
* Returns true if offer matches casino/betting keywords (unless excluded like Hulu).
*/
function isCasinoOffer(title, description) {
	const text = `${title} ${description}`.toLowerCase();
	for (const excluded of ["hulu"]) if (text.includes(excluded)) return false;
	return new RegExp(`\\b(${[
		"casino",
		"bet",
		"betting",
		"sportsbook",
		"poker",
		"slots",
		"gambl",
		"wager",
		"roulette",
		"blackjack",
		"jackpot",
		"bingo",
		"lottery",
		"spin",
		"stake",
		"sweeps",
		"bitsler",
		"cases\\.gg",
		"whale\\.io",
		"originals\\.io",
		"tooniebet"
	].join("|")})`, "i").test(text);
}
var MIN_SAMPLE_FOR_TRENDING = 3;
var TOP_TIER_FRACTION = .15;
async function fetch7dActivity(offerIds) {
	const recent = /* @__PURE__ */ new Map();
	const prior = /* @__PURE__ */ new Map();
	if (!offerIds.length) return {
		recent,
		prior
	};
	const now = Date.now();
	const start14 = (/* @__PURE__ */ new Date(now - 12096e5)).toISOString();
	const boundary = (/* @__PURE__ */ new Date(now - 6048e5)).toISOString();
	const clickRows = (await supabaseAdmin.from("offer_click_events").select("offer_id, created_at").in("offer_id", offerIds).gte("created_at", start14)).data ?? [];
	if (clickRows.length > 0) {
		for (const row of clickRows) {
			const bucket = row.created_at >= boundary ? recent : prior;
			bucket.set(row.offer_id, (bucket.get(row.offer_id) ?? 0) + 1);
		}
		return {
			recent,
			prior
		};
	}
	const claims = await supabaseAdmin.from("offer_claims").select("offer_id, created_at").in("offer_id", offerIds).gte("created_at", start14);
	for (const row of claims.data ?? []) {
		const bucket = row.created_at >= boundary ? recent : prior;
		bucket.set(row.offer_id, (bucket.get(row.offer_id) ?? 0) + 1);
	}
	return {
		recent,
		prior
	};
}
function topTierThreshold(values) {
	if (!values.length) return Number.POSITIVE_INFINITY;
	const sorted = [...values].sort((a, b) => b - a);
	return sorted[Math.max(0, Math.floor(sorted.length * TOP_TIER_FRACTION) - 1)] ?? sorted[0];
}
/** Compute Hot/Popular/Trending/Easy for the given offers. */
async function computeAutoTags(offers) {
	const map = {};
	if (!offers.length) return map;
	const ids = offers.map((o) => o.id);
	const rewardThreshold = topTierThreshold(offers.filter((o) => {
		return !(o.push_to_bottom === true || o.push_to_bottom === null && isCasinoOffer(o.title, o.description));
	}).map((o) => Number(o.reward_amount ?? 0)));
	const { recent, prior } = await fetch7dActivity(ids);
	const popularThreshold = topTierThreshold(Array.from(recent.values()));
	for (const offer of offers) {
		const tags = [];
		const reward = Number(offer.reward_amount ?? 0);
		if (!(offer.push_to_bottom === true || offer.push_to_bottom === null && isCasinoOffer(offer.title, offer.description)) && reward > 0 && reward >= rewardThreshold) tags.push("Hot");
		const recentCount = recent.get(offer.id) ?? 0;
		const priorCount = prior.get(offer.id) ?? 0;
		if (recentCount >= popularThreshold && recentCount > 0) tags.push("Popular");
		if (recentCount >= MIN_SAMPLE_FOR_TRENDING && (priorCount === 0 ? recentCount >= MIN_SAMPLE_FOR_TRENDING : recentCount / priorCount >= 1.5)) tags.push("Trending");
		const reqLen = (offer.requirements ?? "").trim().length;
		if (reqLen > 0 && reqLen <= 60 || offer.category === "Trial") tags.push("Easy");
		if (tags.length) map[offer.id] = tags;
	}
	return map;
}
/** Insert a click event — called from the pre-redirect popup Continue button. */
async function recordOfferClickImpl(offerId, userId = null, country = null) {
	await supabaseAdmin.from("offer_click_events").insert({
		offer_id: offerId,
		user_id: userId,
		country
	});
	return { ok: true };
}
//#endregion
export { computeAutoTags, recordOfferClickImpl };
