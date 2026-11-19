import { n as __exportAll } from "../_runtime.mjs";
import { l as __exportAll$1 } from "./server-CpGMOUrW.mjs";
import { createHash, createHmac, timingSafeEqual } from "crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/registry.server-BSxUB5IY.js
var registry_server_BSxUB5IY_exports = /* @__PURE__ */ __exportAll({
	n: () => bitcotasks_server_exports,
	t: () => getSdkAdapter
});
/**
* Resolves the provider's signing secret from the environment.
* Returns "" when the ref is unset or the env var is missing, which callers
* must treat as "cannot verify" — never as "verified".
*/
function providerSecret(provider) {
	const ref = provider.postback_signature_secret_ref;
	if (!ref) return "";
	return process.env[ref] ?? "";
}
function md5Hex(input) {
	return createHash("md5").update(input).digest("hex");
}
/**
* Plain (non-HMAC) SHA-256. Used by networks that concatenate the secret into
* the signed string rather than keying an HMAC with it — e.g. TimeWall's
* sha256(userID + revenue + secretKey).
*/
function sha256Hex(input) {
	return createHash("sha256").update(input).digest("hex");
}
/**
* Constant-time hex digest comparison. Compares case-insensitively because
* networks differ on digest casing, and bails out on length mismatch before
* timingSafeEqual (which throws on unequal lengths).
*/
function secureEquals(expected, provided) {
	if (!expected || !provided) return false;
	const a = Buffer.from(expected.toLowerCase(), "utf8");
	const b = Buffer.from(provided.toLowerCase(), "utf8");
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}
/** Reads a payload field as a trimmed string ("" when absent). */
function field(payload, key) {
	const value = payload[key];
	if (value === null || value === void 0) return "";
	return String(value).trim();
}
/** Parses a payload field as a finite number (0 when absent/invalid). */
function numericField(payload, key) {
	const parsed = Number.parseFloat(field(payload, key));
	return Number.isFinite(parsed) ? parsed : 0;
}
var affikeSdkAdapter = {
	slug: "affike",
	integrationType: "web_sdk",
	parsePostback: (_provider, payload) => {
		const confirmed = field(payload, "status") === "confirmed";
		return {
			providerTransactionId: field(payload, "txn_id"),
			providerUserRef: field(payload, "user_id"),
			providerOfferId: field(payload, "offer_id") || void 0,
			currencyAmount: confirmed ? numericField(payload, "payout") : 0,
			raw: payload
		};
	}
};
var bitcotasks_server_exports = /* @__PURE__ */ __exportAll$1({
	FEED_KIND_OFFER_TYPES: () => FEED_KIND_OFFER_TYPES,
	bitcotasksSdkAdapter: () => bitcotasksSdkAdapter,
	default: () => bitcotasksSdkAdapter
});
/**
* Mapping of feed quest kinds to BitcoTasks offer_type values.
* TODO: Verify 'article' offer_type with a real postback - may be 'task' instead.
*/
var FEED_KIND_OFFER_TYPES = {
	ptc: ["ptc"],
	shortlink: ["shortlink"],
	article: ["article", "task"]
};
var bitcotasksSdkAdapter = {
	slug: "bitcotasks",
	integrationType: "api",
	parsePostback: (provider, payload) => {
		const secret = providerSecret(provider);
		const subId = field(payload, "subId");
		const transId = field(payload, "transId");
		const reward = field(payload, "reward");
		const providedSig = field(payload, "signature");
		const status = field(payload, "status");
		const debug = field(payload, "debug");
		const offerName = field(payload, "offer_name");
		field(payload, "offer_type");
		const rewardValue = numericField(payload, "reward_value");
		const validSignature = secret ? secureEquals(md5Hex(`${subId}${transId}${reward}${secret}`), providedSig) : false;
		if (validSignature && rewardValue > 0 && provider.currency_per_usd > 0) {
			if (Math.abs(rewardValue - provider.currency_per_usd) > .01) console.warn(`[BitcoTasks] Postback reward_value (${rewardValue}) differs from provider currency_per_usd (${provider.currency_per_usd})`);
		}
		return {
			providerTransactionId: validSignature ? transId : "",
			providerUserRef: subId,
			providerOfferId: offerName || void 0,
			currencyAmount: validSignature && status === "1" && debug !== "1" ? numericField(payload, "reward") : 0,
			raw: payload
		};
	}
};
var cpxResearchSdkAdapter = {
	slug: "cpxresearch",
	integrationType: "web_sdk",
	parsePostback: (provider, payload) => {
		const secret = providerSecret(provider);
		const transId = field(payload, "trans_id");
		const providedHash = field(payload, "secure_hash");
		const validSignature = secureEquals(md5Hex(`${transId}-${secret}`), providedHash);
		const credited = validSignature && field(payload, "status") === "1";
		const offerId = field(payload, "offer_id");
		return {
			providerTransactionId: validSignature ? transId : "",
			providerUserRef: field(payload, "user_id"),
			providerOfferId: offerId || void 0,
			currencyAmount: credited ? numericField(payload, "amount_usd") : 0,
			raw: payload
		};
	}
};
/** Postback status that must NOT move money. Only "completed" (or empty) credits. */
var NON_CREDIT_STATUSES = /* @__PURE__ */ new Set(["rejected"]);
/**
* Case-insensitive field lookup (GemiAd macros may vary in casing).
*/
function fieldCaseInsensitive(payload, key) {
	const exactValue = payload[key];
	if (exactValue !== null && exactValue !== void 0) return String(exactValue).trim();
	const lowerKey = key.toLowerCase();
	for (const [k, v] of Object.entries(payload)) if (k.toLowerCase() === lowerKey && v !== null && v !== void 0) return String(v).trim();
	return "";
}
/**
* Case-insensitive numeric field lookup.
*/
function numericFieldCaseInsensitive(payload, key) {
	const parsed = Number.parseFloat(fieldCaseInsensitive(payload, key));
	return Number.isFinite(parsed) ? parsed : 0;
}
var gemiAdSdkAdapter = {
	slug: "gemiad",
	integrationType: "web_sdk",
	parsePostback: (provider, payload) => {
		const secret = providerSecret(provider);
		const userId = fieldCaseInsensitive(payload, "userId");
		const offerId = fieldCaseInsensitive(payload, "offerId");
		const txid = fieldCaseInsensitive(payload, "txid");
		const providedHash = fieldCaseInsensitive(payload, "hash");
		const status = (fieldCaseInsensitive(payload, "status") || "completed").toLowerCase();
		fieldCaseInsensitive(payload, "payout");
		const payout = numericFieldCaseInsensitive(payload, "payout");
		const validSignature = secret.length > 0 && secureEquals(sha256Hex(`${userId}${offerId}${txid}${secret}`), providedHash);
		const isReversal = NON_CREDIT_STATUSES.has(status) || payout < 0;
		return {
			providerTransactionId: validSignature ? txid : "",
			providerUserRef: userId,
			providerOfferId: offerId || void 0,
			currencyAmount: validSignature && !isReversal && payout > 0 ? payout : 0,
			raw: payload
		};
	}
};
var mooffersSdkAdapter = {
	slug: "mooffers",
	integrationType: "web_sdk",
	parsePostback: (_provider, payload) => {
		const approved = field(payload, "status") === "approved";
		return {
			providerTransactionId: field(payload, "conversion_no"),
			providerUserRef: field(payload, "uid"),
			providerOfferId: field(payload, "offer_id") || void 0,
			currencyAmount: approved ? numericField(payload, "payout") : 0,
			raw: payload
		};
	}
};
var offerwallMeSdkAdapter = {
	slug: "offerwallme",
	integrationType: "web_sdk",
	parsePostback: (provider, payload) => {
		const secret = providerSecret(provider);
		const subId = field(payload, "subId");
		const transId = field(payload, "transId");
		const reward = field(payload, "reward");
		const providedSig = field(payload, "signature");
		const validSignature = secureEquals(md5Hex(`${subId}${transId}${reward}${secret}`), providedSig);
		const credited = validSignature && field(payload, "status") === "1";
		const offerName = field(payload, "offer_name");
		return {
			providerTransactionId: validSignature ? transId : "",
			providerUserRef: subId,
			providerOfferId: offerName || void 0,
			currencyAmount: credited ? numericField(payload, "reward") : 0,
			raw: payload
		};
	}
};
var revtooSdkAdapter = {
	slug: "revtoo",
	integrationType: "web_sdk",
	parsePostback: (provider, payload) => {
		const secret = providerSecret(provider);
		const subId = field(payload, "subId");
		const transId = field(payload, "transId");
		const reward = field(payload, "reward");
		const providedSig = field(payload, "signature");
		const validSignature = secureEquals(md5Hex(`${subId}${transId}${reward}${secret}`), providedSig);
		const credited = validSignature && field(payload, "status") === "1";
		const offerId = field(payload, "offer_id");
		return {
			providerTransactionId: validSignature ? transId : "",
			providerUserRef: subId,
			providerOfferId: offerId || void 0,
			currencyAmount: credited ? numericField(payload, "reward") : 0,
			raw: payload
		};
	}
};
var theoremreachSdkAdapter = {
	slug: "theoremreach",
	integrationType: "web_sdk",
	parsePostback: (provider, payload, context) => {
		const secret = providerSecret(provider);
		const userId = field(payload, "user_id");
		const txId = field(payload, "tx_id");
		const currencyUsd = field(payload, "currency");
		const providedHash = field(payload, "hash");
		const reversal = field(payload, "reversal") === "true";
		const debug = field(payload, "debug") === "true";
		const screenout = field(payload, "screenout") === "true";
		const publicBaseUrl = process.env.PUBLIC_BASE_URL || "https://cashgpt.in";
		const path = "/api/public/offerwall/theoremreach";
		const params = new URLSearchParams();
		for (const [key, value] of Object.entries(payload)) if (key !== "hash" && key !== "src") params.append(key, String(value));
		const urlToVerify = `${publicBaseUrl}${path}?${params.toString()}`;
		if (!secureEquals(createHmac("sha1", secret).update(urlToVerify).digest().toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, ""), providedHash)) return {
			providerTransactionId: "",
			providerUserRef: userId,
			providerOfferId: field(payload, "offer_id") || void 0,
			currencyAmount: 0,
			raw: payload
		};
		if (debug) return {
			providerTransactionId: txId,
			providerUserRef: userId,
			providerOfferId: field(payload, "offer_id") || void 0,
			currencyAmount: 0,
			testOnly: true,
			raw: payload
		};
		if (screenout) return {
			providerTransactionId: "",
			providerUserRef: userId,
			providerOfferId: field(payload, "offer_id") || void 0,
			currencyAmount: 0,
			raw: payload
		};
		if (reversal) return {
			providerTransactionId: "",
			providerUserRef: userId,
			providerOfferId: field(payload, "offer_id") || void 0,
			currencyAmount: 0,
			raw: payload
		};
		return {
			providerTransactionId: txId,
			providerUserRef: userId,
			providerOfferId: field(payload, "offer_id") || void 0,
			currencyAmount: Number(currencyUsd || 0),
			raw: payload
		};
	}
};
/** Postback types that must NOT move money. Only "credit" (or empty) credits. */
var NON_CREDIT_TYPES = /* @__PURE__ */ new Set([
	"chargeback",
	"hold",
	"hold_cancelled"
]);
var timewallSdkAdapter = {
	slug: "timewall",
	integrationType: "web_sdk",
	parsePostback: (provider, payload) => {
		const secret = providerSecret(provider);
		const userId = field(payload, "userid");
		const txid = field(payload, "txid");
		const revenue = field(payload, "revenue");
		const providedHash = field(payload, "hash");
		const type = (field(payload, "type") || "credit").toLowerCase();
		const validSignature = secret.length > 0 && secureEquals(sha256Hex(`${userId}${revenue}${secret}`), providedHash);
		const credited = validSignature && !NON_CREDIT_TYPES.has(type);
		return {
			providerTransactionId: validSignature ? txid : "",
			providerUserRef: userId,
			providerOfferId: field(payload, "offername") || void 0,
			currencyAmount: credited ? numericField(payload, "revenue") : 0,
			raw: payload
		};
	}
};
var toroxSdkAdapter = {
	slug: "torox",
	integrationType: "web_sdk",
	parsePostback: (provider, payload) => {
		const secret = providerSecret(provider);
		const id = field(payload, "id");
		const oid = field(payload, "oid");
		const userId = field(payload, "user_id");
		const payout = numericField(payload, "payout");
		const providedSig = field(payload, "sig");
		const validSignature = secret ? secureEquals(md5Hex(`${oid}-${userId}-${secret}`), providedSig) : false;
		return {
			providerTransactionId: validSignature ? id : "",
			providerUserRef: userId,
			providerOfferId: oid || void 0,
			currencyAmount: validSignature && payout > 0 ? payout : 0,
			raw: payload
		};
	}
};
/**
* SDK adapters register here (one file per network under ./adapters).
* A provider row without an adapter renders as a configured-but-not-integrated
* placeholder and falls back to the generic postback pipeline.
*/
var adapters = /* @__PURE__ */ new Map();
function registerSdkAdapter(adapter) {
	adapters.set(adapter.slug, adapter);
}
function getSdkAdapter(slug) {
	return adapters.get(slug);
}
registerSdkAdapter(cpxResearchSdkAdapter);
registerSdkAdapter(bitcotasksSdkAdapter);
registerSdkAdapter(offerwallMeSdkAdapter);
registerSdkAdapter(revtooSdkAdapter);
registerSdkAdapter(affikeSdkAdapter);
registerSdkAdapter(mooffersSdkAdapter);
registerSdkAdapter(timewallSdkAdapter);
registerSdkAdapter(theoremreachSdkAdapter);
registerSdkAdapter(gemiAdSdkAdapter);
registerSdkAdapter(toroxSdkAdapter);
//#endregion
export { registry_server_BSxUB5IY_exports as n, getSdkAdapter as t };
