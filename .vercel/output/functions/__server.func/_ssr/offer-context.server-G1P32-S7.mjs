import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/offer-context.server-G1P32-S7.js
init_client_server();
function text(value) {
	const trimmed = (value ?? "").trim();
	return trimmed.length ? trimmed : null;
}
function list(value) {
	const items = (value ?? []).map((v) => v.trim()).filter(Boolean);
	return items.length ? items.join(", ") : null;
}
function money(value) {
	const n = Number(value ?? 0);
	return `$${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
}
/**
* Proof is required when the offer is explicitly manual_proof, or when it is a
* limited deal — this mirrors OfferDetailsDialog's own `proofRequired` rule so
* the assistant and the UI can never describe different flows.
*/
function conversionMode(offer) {
	if (offer.payout_mode === "auto_postback") return "auto_postback";
	if (offer.payout_mode === "manual_proof" || offer.is_limited_deal) return "manual_proof";
	return "manual";
}
function claimState(claim) {
	if (!claim) return "not_submitted";
	if (claim.status === "approved") return "approved";
	if (claim.status === "rejected") return "rejected";
	return "pending";
}
/** Describes the conversion flow using only what this offer's config supports. */
function describeFlow(mode, isLimitedDeal) {
	if (mode === "auto_postback") return [
		"CREDITING: automatic (auto_postback).",
		"- The user opens the offer from the app and completes it on the partner's site.",
		"- The partner network reports the conversion back to CashGPT via postback.",
		"- The reward is credited automatically when that postback is received and validated.",
		"- There is NO proof upload and NO manual admin review step in this flow. Do not mention either."
	].join("\n");
	if (mode === "manual_proof") return [
		`CREDITING: manual with proof required${isLimitedDeal ? " (limited deal)" : ""}.`,
		"- The user opens the offer from the app and completes it on the partner's site.",
		"- The user must upload proof (screenshot or receipt, max 5 MB) in the offer dialog before continuing.",
		"- The claim is then submitted with status 'pending' and an admin reviews it.",
		"- The reward is credited only after the admin approves the claim. If rejected, no reward is paid."
	].join("\n");
	return [
		"CREDITING: manual submission (no proof upload required by this offer's configuration).",
		"- The user opens the offer from the app and completes it on the partner's site.",
		"- A claim is submitted with status 'pending' and an admin reviews it.",
		"- The reward is credited only after the admin approves the claim. If rejected, no reward is paid.",
		"- This offer does not require a proof upload. Do not tell the user to upload proof."
	].join("\n");
}
/** Describes exactly where this user stands, using only real claim fields. */
function describeClaim(state, claim) {
	switch (state) {
		case "not_submitted": return "THIS USER'S STATUS: no claim row exists for this offer yet — they have not started or submitted it. Nothing is pending and no reward is owed yet.";
		case "pending": return [
			"THIS USER'S STATUS: a claim exists with status 'pending' — it has been submitted and is awaiting admin review.",
			claim?.proof_url ? "Proof was uploaded." : "No proof file is attached.",
			"The reward is not credited while the claim is pending. Do not promise a review time — that is not stored anywhere."
		].join(" ");
		case "approved": return [
			"THIS USER'S STATUS: the claim is 'approved' and the reward has been credited to their wallet",
			claim ? ` (${money(claim.reward_amount)})` : "",
			". If they cannot see it, tell them to check Wallet > Transactions, and to open a support ticket if it is genuinely missing."
		].join("");
		case "rejected": return [
			"THIS USER'S STATUS: the claim is 'rejected' — no reward was paid.",
			claim?.admin_note ? ` The admin note on the rejection is: "${claim.admin_note}".` : "",
			" If they disagree, tell them to open a support ticket from the Support tab."
		].join("");
	}
}
/**
* Title words too common to identify an offer on their own — matching on these
* would attach the wrong offer's data to an unrelated question.
*/
var GENERIC_TITLE_WORDS = /* @__PURE__ */ new Set([
	"offer",
	"offers",
	"cash",
	"cashback",
	"money",
	"reward",
	"rewards",
	"bonus",
	"free",
	"play",
	"game",
	"games",
	"gaming",
	"mobile",
	"desktop",
	"android",
	"iphone",
	"geos",
	"survey",
	"surveys",
	"install",
	"signup",
	"register",
	"download",
	"video",
	"editor",
	"browser",
	"prizes",
	"prize",
	"deal",
	"deals",
	"trial",
	"with",
	"your",
	"from",
	"only",
	"best",
	"life",
	"all",
	"get",
	"and",
	"the",
	"for",
	"web",
	"wallet",
	"complete",
	"completed",
	"completion",
	"detail",
	"details",
	"payout",
	"payouts",
	"withdraw",
	"withdrawal",
	"minimum",
	"account",
	"support",
	"explain",
	"requirement",
	"requirements",
	"proof",
	"about",
	"tell",
	"please",
	"should",
	"would",
	"there",
	"status",
	"pending",
	"approved"
]);
/**
* A title word distinctive enough to identify an offer on its own. Either a
* long-ish non-generic word ("hostingtom", "capcut", "hosting"), or a short
* alphanumeric brand token like "g2g" / "web3" — those are below the length
* threshold but are unmistakably brand names. Pure numbers ("110", "750") are
* excluded because they appear in payout amounts and would match loosely.
*/
function isDistinctiveTitleWord(word) {
	if (GENERIC_TITLE_WORDS.has(word)) return false;
	if (word.length >= 6) return true;
	const hasDigit = /\d/.test(word);
	const hasLetter = /[a-z]/.test(word);
	return word.length >= 3 && hasDigit && hasLetter;
}
/**
* Resolves an offer from a plain chat message that names it, e.g. "how does
* HostingTom work?". Runs on EVERY message: a name typed in the message takes
* priority over the offer in context, because a user naming a different offer is
* asking about that one.
*
* Deliberately conservative: it needs a distinctive title word (see
* isDistinctiveTitleWord), ignores words that describe the question rather than
* the offer, and refuses to guess when two different offers tie. Attaching the
* wrong offer's data would be worse than answering generically.
*/
async function resolveOfferIdFromMessage(message) {
	const haystack = ` ${message.toLowerCase().replace(/[^a-z0-9]+/g, " ")} `;
	const result = await supabaseAdmin.from("offers").select("id, title").eq("is_active", true);
	if (!result.data?.length) return null;
	let bestId = null;
	let bestScore = 0;
	let ambiguous = false;
	for (const row of result.data) {
		const words = new Set(row.title.toLowerCase().match(/[a-z0-9]+/g) ?? []);
		let hasDistinctiveMatch = false;
		let score = 0;
		for (const word of words) {
			const distinctive = isDistinctiveTitleWord(word);
			if (word.length < 4 && !distinctive) continue;
			if (!haystack.includes(` ${word} `)) continue;
			score += word.length;
			if (distinctive) hasDistinctiveMatch = true;
		}
		if (!hasDistinctiveMatch) continue;
		if (score > bestScore) {
			bestScore = score;
			bestId = row.id;
			ambiguous = false;
		} else if (score === bestScore && row.id !== bestId) ambiguous = true;
	}
	if (ambiguous || !bestId) return null;
	return bestId;
}
/**
* Loads the real data for one offer plus this user's own claim, and formats it
* for the assistant's system instruction. Returns null when the offer does not
* exist, so the assistant simply behaves as the normal FAQ helper.
*/
async function buildOfferAssistantContext(offerId, userId) {
	const offerResult = await supabaseAdmin.from("offers").select("id, title, description, requirements, not_allowed, reward_amount, payout_mode, is_limited_deal, is_active, source, provider_id, click_url, expires_at, countries, devices, category, tags").eq("id", offerId).maybeSingle();
	if (!offerResult.data) return null;
	const offer = offerResult.data;
	let providerName = null;
	if (offer.provider_id) providerName = text((await supabaseAdmin.from("offer_providers").select("name").eq("id", offer.provider_id).maybeSingle()).data?.name);
	const claim = (await supabaseAdmin.from("offer_claims").select("status, proof_url, postback_txn_id, reward_amount, admin_note, created_at, updated_at").eq("offer_id", offerId).eq("user_id", userId).maybeSingle()).data ?? null;
	const mode = conversionMode(offer);
	const state = claimState(claim);
	const facts = [`Title: ${offer.title}`];
	if (providerName) facts.push(`Partner network: ${providerName}`);
	facts.push(`Reward: ${money(offer.reward_amount)}`);
	facts.push(`payout_mode: ${offer.payout_mode}`);
	facts.push(`Limited deal: ${offer.is_limited_deal ? "yes" : "no"}`);
	if (offer.is_limited_deal) facts.push("Note: for limited deals the final reward is recalculated from the offer's current configuration at approval time, so it may differ from the amount listed.");
	if (!offer.is_active) facts.push("This offer is currently INACTIVE / no longer available.");
	const NOT_ON_FILE = "NOT ON FILE — say plainly that this is not listed for this offer.";
	facts.push(`Description: ${text(offer.description) ?? NOT_ON_FILE}`);
	facts.push(`Requirements (how to complete): ${text(offer.requirements) ?? NOT_ON_FILE}`);
	facts.push(`Prohibited actions (not_allowed): ${text(offer.not_allowed) ?? NOT_ON_FILE}`);
	facts.push(`Available countries: ${list(offer.countries) ?? "not restricted by country on file (no list stored)"}`);
	facts.push(`Supported devices: ${list(offer.devices) ?? "no device restriction stored for this offer"}`);
	facts.push(`Expires at: ${offer.expires_at ?? "no expiry date on file"}`);
	const category = text(offer.category);
	if (category) facts.push(`Category: ${category}`);
	const tags = list(offer.tags);
	if (tags) facts.push(`Tags: ${tags}`);
	facts.push(offer.click_url ? "Offer link: configured. The user MUST open it using the app's own button in the offer dialog so their conversion is tracked. Never output a raw URL." : "Offer link: not configured — the user cannot start this offer right now.");
	const promptBlock = [
		"## CURRENT OFFER IN VIEW — REAL STORED DATA",
		"The user is currently viewing this offer. Use ONLY the facts below when answering questions about it.",
		"",
		facts.join("\n"),
		"",
		describeFlow(mode, offer.is_limited_deal),
		"",
		describeClaim(state, claim)
	].join("\n");
	return {
		offerId: offer.id,
		title: offer.title,
		conversionMode: mode,
		promptBlock
	};
}
//#endregion
export { buildOfferAssistantContext, resolveOfferIdFromMessage };
