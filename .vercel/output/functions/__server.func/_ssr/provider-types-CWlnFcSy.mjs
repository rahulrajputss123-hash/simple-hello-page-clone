import { t as normalizeDevices } from "./normalize-devices-B-CDoU_V.mjs";
import { n as TOROX_CLICK_URL_SENTINEL, t as REVTOO_USER_ID_PLACEHOLDER } from "./constants-r2wn2lLZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/provider-types-CWlnFcSy.js
/**
* AdBlueMedia multi-offer feed adapter.
* Endpoint returns a JSON array of offers; field mapping below matches the live response:
* { id, name, anchor, conversion, epc, category_id, url_domain, user_payout, payout, network_icon, url }
*/
var DEFAULT_FEED_URL$1 = "https://de6jvomfbm0af.cloudfront.net/public/offers/feed.php";
function num$1(value) {
	const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
	return Number.isFinite(parsed) ? parsed : 0;
}
function config(provider) {
	const cfg = provider.sync_config ?? {};
	return {
		feedUrl: typeof cfg["feed_url"] === "string" && cfg["feed_url"] ? cfg["feed_url"] : DEFAULT_FEED_URL$1,
		userId: String(cfg["user_id"] ?? "788820"),
		s1: typeof cfg["s1"] === "string" ? cfg["s1"] : "",
		s2: typeof cfg["s2"] === "string" ? cfg["s2"] : ""
	};
}
var adblueMediaAdapter = {
	slug: "adbluemedia",
	providerType: "cpa",
	validateConfig(config) {
		if (!process.env["ADBLUEMEDIA_API_KEY"]) return "ADBLUEMEDIA_API_KEY is not configured on the server.";
		return null;
	},
	async fetchOffers(provider, options) {
		const apiKey = process.env["ADBLUEMEDIA_API_KEY"];
		if (!apiKey) throw new Error("ADBLUEMEDIA_API_KEY is not configured on the server.");
		const { feedUrl, userId, s1, s2 } = config(provider);
		const url = new URL(feedUrl);
		url.searchParams.set("user_id", userId);
		url.searchParams.set("api_key", apiKey);
		if (s1) url.searchParams.set("s1", s1);
		if (s2) url.searchParams.set("s2", s2);
		if (options?.ip) url.searchParams.set("ip", options.ip);
		const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
		const text = await response.text();
		if (!response.ok) throw new Error(`AdBlueMedia feed error (${response.status}): ${text.slice(0, 200)}`);
		let parsed;
		try {
			const jsonp = text.match(/^[^(]*\((.*)\);?\s*$/s);
			parsed = JSON.parse(jsonp?.[1] ?? text);
		} catch {
			throw new Error(`AdBlueMedia feed returned non-JSON: ${text.slice(0, 200)}`);
		}
		const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.offers) ? parsed.offers : [];
		if (!list.length) throw new Error("AdBlueMedia feed returned no offers.");
		const seen = /* @__PURE__ */ new Set();
		const offers = [];
		for (const item of list) {
			const externalOfferId = String(item.id ?? "").trim();
			const clickUrl = String(item.url ?? "").trim();
			const title = String(item.name ?? "").trim();
			if (!externalOfferId || !clickUrl || !title) continue;
			if (seen.has(externalOfferId)) continue;
			seen.add(externalOfferId);
			offers.push({
				externalOfferId,
				title,
				description: String(item.anchor ?? "").trim(),
				requirements: String(item.conversion ?? "").trim(),
				icon: String(item.network_icon ?? "").trim() || "gift",
				clickUrl,
				networkPayout: num$1(item.payout ?? item.user_payout),
				devices: [],
				category: categoryFromAdblueId(item.category_id ?? null),
				raw: item
			});
		}
		return offers;
	}
};
/**
* AdBlueMedia's `category_id` is a 24-character hex ID (not 1-9 as initially thought).
* Map actual hex IDs from their API to our internal categories.
* 
* TODO: Confirm category names from AdBlueMedia dashboard for unknown IDs.
* Unknown ids → null (offer stays uncategorized).
*/
var ADBLUEMEDIA_CATEGORY_MAP = {
	"1": "App Install",
	"2": "Survey",
	"3": "Trial",
	"4": "Trial",
	"5": "Deals",
	"6": "Games",
	"7": "Link Locker",
	"8": "Shortlink",
	"9": "Deals"
};
var unmappedCategoryIds = /* @__PURE__ */ new Set();
function categoryFromAdblueId(raw) {
	if (!raw) return null;
	const trimmed = String(raw).trim();
	const category = ADBLUEMEDIA_CATEGORY_MAP[trimmed];
	if (!category && !unmappedCategoryIds.has(trimmed)) {
		unmappedCategoryIds.add(trimmed);
		console.warn(`[AdBlueMedia] Unmapped category_id: ${trimmed} (add to ADBLUEMEDIA_CATEGORY_MAP)`);
	}
	return category ?? null;
}
/**
* AdswedMedia multi-offer feed adapter.
* Endpoint: https://adswedmedia.com/api/v1/offers?site_key={site_key}&site_secret={site_secret}
* (site_key / site_secret are server-side env vars).
*
* Response shape:
*   { success, offers: { data: [{ id, title, description, image, payout,
*                                 categories, countries, devices, url, events }] } }
*
* Rate limit: max 20 requests per 60 minutes — enforced by an in-process
* sliding-window guard below so the sync/cron cannot exceed it.
*
* NOTE on per-user tracking: the `url` contains the literal placeholder
* "USER_ID_HERE" (and the site's PUBLIC-KEY is already filled in). The internal
* user id is substituted at click time in the UI (click-url.ts) — NOT here.
*/
var FEED_URL$1 = "https://adswedmedia.com/api/v1/offers";
var IMAGE_PREFIX = "https://adswedmedia.com/asset/images/offers/";
var RATE_LIMIT = 20;
var RATE_WINDOW_MS = 36e5;
var callTimestamps = [];
/** Sliding-window guard: throws before exceeding 20 calls / 60 minutes. */
function enforceRateLimit() {
	const now = Date.now();
	while (callTimestamps.length && now - callTimestamps[0] > RATE_WINDOW_MS) callTimestamps.shift();
	if (callTimestamps.length >= RATE_LIMIT) throw new Error("AdswedMedia rate limit reached (max 20 requests per 60 minutes).");
	callTimestamps.push(now);
}
/** "All" → ["all"]; a real array is passed through; anything else → []. */
function normalizeList(value) {
	if (typeof value === "string") return value.trim().toLowerCase() === "all" ? ["all"] : [];
	return Array.isArray(value) ? value : [];
}
/**
* Map AdswedMedia country names to ISO 3166-1 alpha-2 codes.
* AdswedMedia uses full country names (lowercase) like "united states", "canada".
*/
function mapCountryNameToIso(countryName) {
	return {
		"united states": "US",
		"canada": "CA",
		"united kingdom": "GB",
		"australia": "AU",
		"germany": "DE",
		"france": "FR",
		"spain": "ES",
		"italy": "IT",
		"netherlands": "NL",
		"the netherlands": "NL",
		"belgium": "BE",
		"switzerland": "CH",
		"austria": "AT",
		"sweden": "SE",
		"norway": "NO",
		"denmark": "DK",
		"finland": "FI",
		"poland": "PL",
		"czech republic": "CZ",
		"portugal": "PT",
		"greece": "GR",
		"ireland": "IE",
		"new zealand": "NZ",
		"india": "IN",
		"brazil": "BR",
		"mexico": "MX",
		"japan": "JP",
		"south korea": "KR",
		"china": "CN",
		"singapore": "SG",
		"hong kong": "HK",
		"philippines": "PH",
		"thailand": "TH",
		"vietnam": "VN",
		"indonesia": "ID",
		"malaysia": "MY",
		"bangladesh": "BD",
		"pakistan": "PK",
		"south africa": "ZA",
		"egypt": "EG",
		"nigeria": "NG",
		"kenya": "KE",
		"argentina": "AR",
		"chile": "CL",
		"colombia": "CO",
		"peru": "PE",
		"venezuela": "VE",
		"turkey": "TR",
		"israel": "IL",
		"saudi arabia": "SA",
		"uae": "AE",
		"united arab emirates": "AE",
		"qatar": "QA",
		"kuwait": "KW",
		"romania": "RO",
		"hungary": "HU",
		"bulgaria": "BG",
		"croatia": "HR",
		"slovakia": "SK",
		"slovenia": "SI",
		"lithuania": "LT",
		"latvia": "LV",
		"estonia": "EE",
		"russia": "RU",
		"uzbekistan": "UZ",
		"tajikistan": "TJ",
		"cameroon": "CM",
		"mongolia": "MN",
		"luxembourg": "LU"
	}[countryName.toLowerCase().trim()] ?? null;
}
/**
* Normalize AdswedMedia countries array: convert country names to ISO codes.
* Returns ["all"] for "all", empty array for unknowns, or ISO codes array.
*/
function normalizeCountries$1(value) {
	const list = normalizeList(value);
	if (list.length === 0) return [];
	if (list[0] === "all") return ["all"];
	const isoCodes = [];
	for (const countryName of list) {
		const iso = mapCountryNameToIso(countryName);
		if (iso) isoCodes.push(iso);
		else console.warn(`[AdswedMedia] Unknown country name: "${countryName}"`);
	}
	return isoCodes;
}
/**
* Part 2 C8: AdswedMedia category mapping
* Validate and map AdswedMedia category to valid OfferCategory.
* Only returns categories that are in OFFER_CATEGORIES, otherwise null.
*/
function mapCategory$4(raw) {
	if (!raw) return null;
	if ([
		"App Install",
		"Trial",
		"Deals",
		"Survey",
		"Games",
		"Link Locker",
		"Shortlink"
	].includes(raw)) return raw;
	return null;
}
var adswedMediaAdapter = {
	slug: "adswedmedia",
	providerType: "cpa",
	validateConfig(config) {
		if (!process.env["ADSWEDMEDIA_SITE_KEY"] || !process.env["ADSWEDMEDIA_SITE_SECRET"]) return "ADSWEDMEDIA_SITE_KEY and ADSWEDMEDIA_SITE_SECRET must be configured on the server.";
		return null;
	},
	async fetchOffers(_provider, context) {
		const siteKey = process.env["ADSWEDMEDIA_SITE_KEY"];
		const siteSecret = process.env["ADSWEDMEDIA_SITE_SECRET"];
		if (!siteKey || !siteSecret) throw new Error("ADSWEDMEDIA_SITE_KEY and ADSWEDMEDIA_SITE_SECRET must be configured on the server.");
		enforceRateLimit();
		const url = new URL(FEED_URL$1);
		url.searchParams.set("site_key", siteKey);
		url.searchParams.set("site_secret", siteSecret);
		const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
		const text = await response.text();
		if (!response.ok) throw new Error(`AdswedMedia feed error (${response.status}): ${text.slice(0, 200)}`);
		let parsed;
		try {
			parsed = JSON.parse(text);
		} catch {
			throw new Error(`AdswedMedia feed returned non-JSON: ${text.slice(0, 200)}`);
		}
		if (parsed.success === false) throw new Error("AdswedMedia feed returned success=false.");
		const off = parsed.offers;
		const list = Array.isArray(off) ? off : Array.isArray(off?.data) ? off.data : [];
		if (!list.length) throw new Error("AdswedMedia feed returned no offers.");
		const seen = /* @__PURE__ */ new Set();
		const offers = [];
		for (const item of list) {
			const externalOfferId = String(item.id ?? "").trim();
			const title = String(item.title ?? "").trim();
			const clickUrl = String(item.url ?? "").trim();
			if (!externalOfferId || !title || !clickUrl) continue;
			if (seen.has(externalOfferId)) continue;
			seen.add(externalOfferId);
			const categories = Array.isArray(item.categories) ? item.categories : [];
			offers.push({
				externalOfferId,
				title,
				description: String(item.description ?? "").trim(),
				icon: item.image ? `${IMAGE_PREFIX}${item.image}` : "gift",
				clickUrl: clickUrl.split("PUBLIC-KEY").join(siteKey),
				networkPayout: typeof item.payout === "number" ? item.payout : Number.parseFloat(String(item.payout ?? "")) || 0,
				countries: normalizeCountries$1(item.countries),
				devices: normalizeDevices(normalizeList(item.devices)),
				category: mapCategory$4(categories[0]),
				raw: item
			});
		}
		if (context?.country) {
			const target = context.country.toUpperCase();
			return offers.filter((o) => {
				const c = o.countries ?? [];
				return c.length === 0 || c.some((code) => code.toUpperCase() === "ALL") || c.some((code) => code.toUpperCase() === target);
			});
		}
		return offers;
	}
};
/**
* Affike offerwall feed adapter.
* Endpoint: https://affike.com/api/offerwall/offers?api_key={api_key}
* Response shape:
*   { offers: [{ id, name, description, image, category, payoutAmount,
*                publisherCutPercent, countries, devices, epc, popularity,
*                conversionEvents }] }
*
* Affike does NOT return a direct click URL — the per-user redirect is built at
* click time in src/lib/offers/click-url.ts, so clickUrl is left empty here.
*/
var FEED_URL = "https://affike.com/api/offerwall/offers";
function num(value) {
	const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
	return Number.isFinite(parsed) ? parsed : 0;
}
/** null / any-null countries → ["all"]; otherwise pass the array through. */
function normalizeCountries(raw) {
	if (!Array.isArray(raw) || raw.length === 0) return ["all"];
	if (raw.some((c) => c == null)) return ["all"];
	return raw;
}
/**
* Part 2 C8: Affike category mapping
* Validate and map Affike category to valid OfferCategory.
* Only returns categories that are in OFFER_CATEGORIES, otherwise null.
*/
function mapCategory$3(raw) {
	if (!raw) return null;
	if ([
		"App Install",
		"Trial",
		"Deals",
		"Survey",
		"Games",
		"Link Locker",
		"Shortlink"
	].includes(raw)) return raw;
	return null;
}
/**
* Only http(s) URLs go in `icon` — that value is written straight to the offers
* table, so an inline base64 blob must never land there.
*/
function iconFromImage(image) {
	return typeof image === "string" && image.startsWith("http") ? image : void 0;
}
/**
* Affike sends roughly 11% of its catalogue with the artwork inline as a base64
* data URI rather than a URL. Those used to be discarded, so those offers fell
* back to the generic icon.
*
* They are now surfaced separately and uploaded to Storage by the sync layer
* (materializeInlineOfferImages), which stores only the resulting public URL.
*/
function inlineImageFrom(image) {
	return typeof image === "string" && /^data:image\//i.test(image.trim()) ? image.trim() : void 0;
}
var affikeAdapter = {
	slug: "affike",
	providerType: "cpa",
	validateConfig(config) {
		const apiKey = config?.["api_key"];
		if (!apiKey || typeof apiKey !== "string") return "Affike sync_config.api_key is not configured.";
		return null;
	},
	async fetchOffers(provider, context) {
		const cfg = provider.sync_config ?? {};
		const apiKey = typeof cfg["api_key"] === "string" ? cfg["api_key"] : "";
		if (!apiKey) throw new Error("Affike sync_config.api_key is not configured.");
		const url = new URL(FEED_URL);
		url.searchParams.set("api_key", apiKey);
		const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
		const text = await response.text();
		if (!response.ok) throw new Error(`Affike feed error (${response.status}): ${text.slice(0, 200)}`);
		let parsed;
		try {
			parsed = JSON.parse(text);
		} catch {
			throw new Error(`Affike feed returned non-JSON: ${text.slice(0, 200)}`);
		}
		const list = Array.isArray(parsed?.offers) ? parsed.offers : [];
		if (!list.length) throw new Error("Affike feed returned no offers.");
		const seen = /* @__PURE__ */ new Set();
		const offers = [];
		for (const item of list) {
			const externalOfferId = String(item.id ?? "").trim();
			const title = String(item.name ?? "").trim();
			if (!externalOfferId || !title) continue;
			if (seen.has(externalOfferId)) continue;
			seen.add(externalOfferId);
			const icon = iconFromImage(item.image);
			const imageDataUri = inlineImageFrom(item.image);
			offers.push({
				externalOfferId,
				title,
				description: String(item.description ?? "").trim(),
				...icon ? { icon } : {},
				...imageDataUri ? { imageDataUri } : {},
				clickUrl: "",
				networkPayout: num(item.payoutAmount),
				countries: normalizeCountries(item.countries),
				devices: normalizeDevices(Array.isArray(item.devices) ? item.devices : []),
				category: mapCategory$3(item.category),
				raw: item
			});
		}
		if (context?.country) {
			const target = context.country.toUpperCase();
			return offers.filter((o) => {
				const c = o.countries ?? [];
				return c.length === 0 || c.some((code) => code.toUpperCase() === "ALL") || c.some((code) => code.toUpperCase() === target);
			});
		}
		return offers;
	}
};
/**
* GemiAd Offer Feed adapter (CPA network).
* 
* API: GET http://api.gemiwall.com/api/offers/static?placementId=...&apiKey=...
* Rate limit: 5 requests/min per placement (returns 429 if exceeded)
* 
* Offer fields:
* - id, name, description{en}, payout (USD total)
* - events[{action{en}, payout}] (step-by-step breakdown)
* - multiEvent, multiComplete, trackingType
* - previewUrl, video, banner, icon
* - category (app|web|survey|click|game)
* - country[], device[] (android|ios|desktop)
* - url (contains [USER_ID] placeholder to replace at click time)
* - dailyCap, epc, cvr
* 
* Cache strategy: API limited to 5 req/min, so this adapter relies on
* offer_feed_cache with TTL >= 5 minutes. The feed refresh cron must not
* run more than once per minute for this provider.
* 
* User placeholder: url contains [USER_ID] — left as-is for per-user replacement
* at click time (same pattern as other feed adapters).
*/
var API_BASE = "http://api.gemiwall.com/api/offers/static";
function stripHtml$1(value) {
	return value.replace(/<[^>]*>/g, "").trim();
}
/**
* Map GemiAd category to OfferCategory.
* Per Part 2 C7: app -> App Install, web -> Trial, survey -> Survey, game -> Games, click -> null
*/
function mapCategory$2(gemiCategory) {
	switch ((gemiCategory ?? "").toLowerCase()) {
		case "app": return "App Install";
		case "web": return "Trial";
		case "survey": return "Survey";
		case "game": return "Games";
		case "click": return null;
		default: return null;
	}
}
function extractRequirements(offer) {
	const events = offer.events ?? [];
	if (!events.length) return "";
	const steps = events.map((evt) => evt.action?.en ?? "").filter((action) => action.length > 0).map(stripHtml$1).filter((action) => action.length > 0);
	if (!steps.length) return "";
	if (steps.length === 1 && steps[0] === "Complete the offer") return "";
	return steps.join(" → ");
}
var gemiAdAdapter = {
	slug: "gemiad",
	providerType: "cpa",
	validateConfig(config) {
		const placementId = String(config["placement_id"] ?? "").trim();
		const apiKey = String(config["api_key"] ?? "").trim();
		if (!placementId) return "GemiAd placement_id is not configured in sync_config.";
		if (!apiKey) return "GemiAd api_key is not configured in sync_config.";
		return null;
	},
	async fetchOffers(provider, context) {
		const cfg = provider.sync_config ?? {};
		const placementId = String(cfg["placement_id"] ?? "").trim();
		const apiKey = String(cfg["api_key"] ?? "").trim();
		if (!placementId || !apiKey) throw new Error("GemiAd placement_id or api_key not configured in sync_config.");
		const url = new URL(API_BASE);
		url.searchParams.set("placementId", placementId);
		url.searchParams.set("apiKey", apiKey);
		let response;
		try {
			response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
		} catch (err) {
			throw new Error(`GemiAd fetch failed: ${err instanceof Error ? err.message : "network error"}`);
		}
		if (response.status === 429) throw new Error("GemiAd rate limit exceeded (5 req/min). Serving cached feed if available.");
		if (response.status === 401) throw new Error("GemiAd authentication failed. Check api_key in sync_config.");
		if (response.status === 404) throw new Error("GemiAd placement not found. Check placement_id in sync_config.");
		const text = await response.text();
		if (!response.ok) throw new Error(`GemiAd API error (${response.status}): ${text.slice(0, 200)}`);
		let parsed;
		try {
			parsed = JSON.parse(text);
		} catch {
			throw new Error(`GemiAd returned non-JSON: ${text.slice(0, 200)}`);
		}
		if (parsed.success === false) throw new Error(`GemiAd API error: ${parsed.error ?? "unknown error"}`);
		const list = Array.isArray(parsed.offers) ? parsed.offers : [];
		if (!list.length) throw new Error("GemiAd API returned no offers.");
		const seen = /* @__PURE__ */ new Set();
		const offers = [];
		for (const item of list) {
			const externalOfferId = String(item.id ?? "").trim();
			const clickUrl = String(item.url ?? "").trim();
			const title = String(item.name ?? "").trim();
			const payout = Number.parseFloat(String(item.payout ?? "")) || 0;
			if (!externalOfferId || !clickUrl || !title || payout <= 0) continue;
			if (seen.has(externalOfferId)) continue;
			seen.add(externalOfferId);
			const countries = (item.country ?? []).map((c) => c.toUpperCase());
			const devices = normalizeDevices(item.device ?? []);
			const requirements = extractRequirements(item);
			let stepRewards = [];
			if (item.events && item.events.length > 0) stepRewards = item.events.map((evt) => ({
				step: stripHtml$1(evt.action?.en ?? ""),
				reward: Number.parseFloat(String(evt.payout ?? "")) || 0
			})).filter((sr) => sr.step && sr.reward > 0);
			const icon = String(item.icon ?? item.banner ?? "").trim();
			const description = String(item.description?.en ?? "").trim();
			offers.push({
				externalOfferId,
				title,
				description,
				requirements,
				icon,
				clickUrl,
				networkPayout: payout,
				countries,
				devices,
				category: mapCategory$2(item.category),
				stepRewards: stepRewards.length > 0 ? stepRewards : void 0,
				raw: item
			});
		}
		if (context?.country) {
			const target = context.country.toUpperCase();
			return offers.filter((o) => {
				const c = o.countries ?? [];
				return c.length === 0 || c.includes(target);
			});
		}
		return offers;
	}
};
/**
* OGAds (lockerpreview) multi-offer feed adapter.
* Endpoint returns { success, error, offers: [...] }; field mapping below matches
* the live response:
* { offerid, name, name_short, description, adcopy, picture, payout, country, device, link, epc }
*
* NOTE on per-user tracking: OGAds click links (`link`) do NOT carry a per-user
* subid. Because NormalizedOffer.clickUrl is cached and shared across all users,
* the internal user id must be appended as `&aff_sub4={userId}` at click time in
* the UI — NOT here in the adapter.
*/
var DEFAULT_FEED_URL = "https://lockerpreview.com/api/v2";
var DEFAULT_IP = "8.8.8.8";
var DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
function stripHtml(value) {
	return value.replace(/<[^>]*>/g, "").trim();
}
function splitList(value) {
	return String(value ?? "").split(",").map((entry) => entry.trim()).filter(Boolean);
}
var ogAdsAdapter = {
	slug: "ogads",
	providerType: "cpa",
	validateConfig(config) {
		if (!process.env["OGADS_API_KEY"]) return "OGADS_API_KEY is not configured on the server.";
		return null;
	},
	async fetchOffers(_provider, context) {
		const apiKey = process.env["OGADS_API_KEY"];
		if (!apiKey) throw new Error("OGADS_API_KEY is not configured on the server.");
		const url = new URL(DEFAULT_FEED_URL);
		url.searchParams.set("ip", context?.ip ?? DEFAULT_IP);
		url.searchParams.set("user_agent", DEFAULT_USER_AGENT);
		url.searchParams.set("ctype", "3");
		url.searchParams.set("max", "100");
		const response = await fetch(url.toString(), { headers: {
			Authorization: `Bearer ${apiKey}`,
			Accept: "application/json"
		} });
		const text = await response.text();
		if (!response.ok) throw new Error(`OGAds feed error (${response.status}): ${text.slice(0, 200)}`);
		let parsed;
		try {
			parsed = JSON.parse(text);
		} catch {
			throw new Error(`OGAds feed returned non-JSON: ${text.slice(0, 200)}`);
		}
		if (parsed.success === false) throw new Error(`OGAds feed error: ${parsed.error ?? "unknown error"}`);
		const list = Array.isArray(parsed.offers) ? parsed.offers : [];
		if (!list.length) throw new Error("OGAds feed returned no offers.");
		const seen = /* @__PURE__ */ new Set();
		const offers = [];
		for (const item of list) {
			const externalOfferId = String(item.offerid ?? "").trim();
			const clickUrl = String(item.link ?? "").trim();
			const title = String(item.name_short ?? "").trim();
			if (!externalOfferId || !clickUrl || !title) continue;
			if (seen.has(externalOfferId)) continue;
			seen.add(externalOfferId);
			offers.push({
				externalOfferId,
				title,
				description: String(item.adcopy ?? "").trim(),
				requirements: stripHtml(String(item.description ?? "")),
				icon: String(item.picture ?? "").trim(),
				clickUrl,
				networkPayout: Number.parseFloat(String(item.payout ?? "")) || 0,
				countries: splitList(item.country),
				devices: normalizeDevices(splitList(item.device)),
				category: null,
				raw: item
			});
		}
		return offers;
	}
};
/**
* Revtoo CPA offer feed adapter.
* Endpoint: GET https://revtoo.com/api/offers/
* Params: api_key, countries, user_id, limit, page
*
* Response shape:
*   { success, status, reward_value, reward_name, reward_round, total_offers,
*     shown_offers, offers: [...], pagination }
*
* NOTE on per-user tracking:
* Revtoo embeds whatever string you pass as `user_id` verbatim into every
* offer's `url` field in the response. Because fetchOffers runs once per
* country and the resulting clickUrl is cached and shared across all users
* (see feed-cache.server.ts), we CANNOT pass a real user id here.
*
* Instead we embed REVTOO_USER_ID_PLACEHOLDER as the user_id param. The
* placeholder is then replaced with the real user id at click time in
* click-url.ts — the same pattern used by the "adswedmedia" adapter.
*/
var REVTOO_API_URL = "https://revtoo.com/api/offers/";
/**
* Parse payout/reward into a number.
* Returns null when the value is the literal "*" (variable payout).
*/
function parsePayout(value) {
	if (value === "*") return null;
	const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
	return Number.isFinite(n) ? n : 0;
}
/**
* Map Revtoo's category string to our internal OfferCategory enum.
* Only "survey" has a confirmed mapping; all other strings map to null
* (uncategorised) rather than guessing. Verify against a real API response.
*/
function mapCategory$1(raw) {
	if (!raw) return null;
	switch (raw.toLowerCase()) {
		case "survey": return "Survey";
		default: return null;
	}
}
var revtooAdapter = {
	slug: "revtoo",
	providerType: "cpa",
	validateConfig(config) {
		if (!process.env["REVTOO_API_KEY"]) return "REVTOO_API_KEY is not configured on the server.";
		return null;
	},
	async fetchOffers(_provider, context) {
		const apiKey = process.env["REVTOO_API_KEY"];
		if (!apiKey) throw new Error("REVTOO_API_KEY is not configured on the server.");
		const url = new URL(REVTOO_API_URL);
		url.searchParams.set("api_key", apiKey);
		url.searchParams.set("user_id", REVTOO_USER_ID_PLACEHOLDER);
		if (context?.country) url.searchParams.set("countries", context.country);
		const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
		const text = await response.text();
		if (!response.ok) throw new Error(`Revtoo feed error (${response.status}): ${text.slice(0, 200)}`);
		let parsed;
		try {
			parsed = JSON.parse(text);
		} catch {
			throw new Error(`Revtoo feed returned non-JSON: ${text.slice(0, 200)}`);
		}
		const list = Array.isArray(parsed.offers) ? parsed.offers : [];
		if (!list.length) throw new Error("Revtoo feed returned no offers.");
		const seen = /* @__PURE__ */ new Set();
		const offers = [];
		for (const item of list) {
			const externalOfferId = String(item.id ?? "").trim();
			const clickUrl = String(item.url ?? "").trim();
			const title = String(item.title ?? "").trim();
			if (!externalOfferId || !clickUrl || !title) continue;
			if (seen.has(externalOfferId)) continue;
			seen.add(externalOfferId);
			const payoutValue = parsePayout(item.payout ?? item.reward);
			const isVariable = payoutValue === null;
			offers.push({
				externalOfferId,
				title,
				description: String(item.description ?? "").trim() || void 0,
				requirements: isVariable ? "Variable payout" : void 0,
				icon: String(item.image ?? "").trim() || void 0,
				clickUrl,
				networkPayout: isVariable ? 0 : payoutValue,
				countries: Array.isArray(item.countries) ? item.countries.map((c) => String(c).toUpperCase()) : void 0,
				devices: Array.isArray(item.os) ? normalizeDevices(item.os.map((o) => String(o))) : void 0,
				isFeatured: item.featured === true,
				category: mapCategory$1(item.category),
				raw: item
			});
		}
		return offers;
	}
};
/**
* Torox Offer Feed adapter (Partner API - CPA network).
* 
* API: GET {TOROX_API_BASE}/partner/campaigns?source_id={ID}&token={TOKEN}&goals=all
* Default base: https://api.wall.torox.io
* 
* Response: Bare JSON array (also tolerates {offers:[...]} / {data:[...]})
* Shape: { offerId, name, description, payout (USD), geos, os, image, verticalNames, events, ... }
* 
* Security:
* - source_id and token required on every request
* - Token is server-only (never exposed to client)
* 
* Click URLs:
* - Must be generated per-user at click time via /partner/user/click API
* - Cannot be cached or reused across users/sessions
* - Stored as sentinel `torox://campaign/{offerId}` in cached offers
* - Real URL fetched at click time by getToroxClickUrl server function
* 
* Gambling Exclusion:
* - sync_config.exclude_real_money_gambling (default true)
* - Skips offers with "casino", "gambling", "betting", or "poker" in verticalNames
*/
var DEFAULT_API_BASE = "https://api.wall.torox.io";
/**
* Decode HTML entities and strip tags.
* Handles common entities: &amp; &lt; &gt; &quot; &#039; &uuml; &ndash; &egrave; etc.
*/
function decodeAndStrip(value) {
	let decoded = value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#039;/g, "'").replace(/&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/&ndash;/g, "–").replace(/&mdash;/g, "—").replace(/&uuml;/g, "ü").replace(/&egrave;/g, "è").replace(/&eacute;/g, "é").replace(/&agrave;/g, "à").replace(/&aacute;/g, "á").replace(/&#(\d+);/g, (_match, num) => String.fromCharCode(parseInt(num, 10))).replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) => String.fromCharCode(parseInt(hex, 16)));
	decoded = decoded.replace(/<[^>]*>/g, "");
	return decoded.trim();
}
/**
* Parse Torox geos field: single country or comma-separated list.
* Empty or "ALL" = everywhere.
*/
function parseGeos(geos) {
	if (!geos) return [];
	const str = geos.trim().toUpperCase();
	if (!str || str === "ALL") return [];
	return str.split(",").map((c) => c.trim()).filter((c) => c.length > 0);
}
/**
* Map Torox verticalNames to OfferCategory.
* Rules per Part 2 C6:
* - Gaming/Strategy -> Games
* - Survey verticals -> Survey
* - OS (ios/android) + packageId -> App Install
* - Real Money Casino -> null (excluded by default)
*/
function mapCategory(verticalNames, os, packageId) {
	if (!verticalNames) {
		if (packageId && os) {
			const lower = os.toLowerCase();
			if (lower === "ios" || lower === "android") return "App Install";
		}
		return null;
	}
	const lower = verticalNames.toLowerCase();
	if (lower.includes("casino") || lower.includes("gambling") || lower.includes("betting") || lower.includes("poker")) return null;
	if (lower.includes("survey")) return "Survey";
	if (lower.includes("gaming") || lower.includes("strategy") || lower.includes("game")) return "Games";
	if (packageId && os) {
		const osLower = os.toLowerCase();
		if (osLower === "ios" || osLower === "android") return "App Install";
	}
	return null;
}
/**
* Check if offer should be excluded due to gambling content.
*/
function isGamblingOffer(verticalNames) {
	if (!verticalNames) return false;
	const lower = verticalNames.toLowerCase();
	return lower.includes("casino") || lower.includes("gambling") || lower.includes("betting") || lower.includes("poker");
}
var toroxAdapter = {
	slug: "torox",
	providerType: "cpa",
	validateConfig(config) {
		const sourceId = (process.env["TOROX_FEED_SOURCE_ID"] ?? "").trim();
		const token = (process.env["TOROX_FEED_TOKEN"] ?? "").trim();
		if (!sourceId) return "TOROX_FEED_SOURCE_ID environment variable is not configured.";
		if (!token) return "TOROX_FEED_TOKEN environment variable is not configured.";
		return null;
	},
	async fetchOffers(provider, context) {
		const sourceId = (process.env["TOROX_FEED_SOURCE_ID"] ?? "").trim();
		const token = (process.env["TOROX_FEED_TOKEN"] ?? "").trim();
		const apiBase = (process.env["TOROX_API_BASE"] ?? DEFAULT_API_BASE).trim();
		if (!sourceId || !token) throw new Error("TOROX_FEED_SOURCE_ID or TOROX_FEED_TOKEN not configured.");
		const excludeGambling = provider.sync_config?.exclude_real_money_gambling ?? true;
		const url = new URL(`${apiBase}/partner/campaigns`);
		url.searchParams.set("source_id", sourceId);
		url.searchParams.set("token", token);
		url.searchParams.set("goals", "all");
		let response;
		let attempt = 0;
		const maxAttempts = 2;
		const timeout = 3e4;
		while (attempt < maxAttempts) {
			attempt++;
			try {
				response = await fetch(url.toString(), {
					headers: { Accept: "application/json" },
					signal: AbortSignal.timeout(timeout)
				});
				break;
			} catch (err) {
				const isTimeout = err instanceof Error && (err.name === "TimeoutError" || err.message.includes("timeout"));
				if (isTimeout && attempt < maxAttempts) {
					console.log(`[Torox] Timeout on attempt ${attempt}, retrying...`);
					continue;
				}
				throw new Error(`Torox fetch failed (${isTimeout ? "timeout" : "network error"}): ${err instanceof Error ? err.message : "unknown"}`);
			}
		}
		if (!response) throw new Error("Torox fetch failed: no response after retries");
		if (response.status === 401 || response.status === 403) throw new Error("Torox authentication failed. Check TOROX_FEED_SOURCE_ID and TOROX_FEED_TOKEN.");
		if (response.status === 404) throw new Error("Torox endpoint not found. Check TOROX_API_BASE configuration.");
		const text = await response.text();
		if (!response.ok) throw new Error(`Torox API error (${response.status}): ${text.slice(0, 300)}`);
		let parsed;
		try {
			parsed = JSON.parse(text);
		} catch {
			throw new Error(`Torox returned non-JSON: ${text.slice(0, 300)}`);
		}
		let rawOffers = [];
		if (Array.isArray(parsed)) rawOffers = parsed;
		else if (parsed && typeof parsed === "object") {
			if ("offers" in parsed && Array.isArray(parsed.offers)) rawOffers = parsed.offers;
			else if ("data" in parsed && Array.isArray(parsed.data)) rawOffers = parsed.data;
			else if ("campaigns" in parsed && Array.isArray(parsed.campaigns)) rawOffers = parsed.campaigns;
		}
		if (rawOffers.length === 0) {
			const keys = parsed && typeof parsed === "object" ? Object.keys(parsed).join(", ") : "none";
			throw new Error(`Torox API returned no offers. Top-level keys: ${keys}. First 300 chars: ${text.slice(0, 300)}`);
		}
		const skipReasons = {
			missingId: 0,
			missingName: 0,
			invalidPayout: 0,
			gamblingExcluded: 0,
			geoExcluded: 0
		};
		const seen = /* @__PURE__ */ new Set();
		const offers = [];
		const userCountry = context?.country?.toUpperCase() ?? null;
		for (const item of rawOffers) {
			if (!item.offerId) {
				skipReasons.missingId++;
				continue;
			}
			const externalOfferId = String(item.offerId);
			if (!item.name || !item.name.trim()) {
				skipReasons.missingName++;
				continue;
			}
			const payout = Number(item.payout);
			if (!payout || payout <= 0) {
				skipReasons.invalidPayout++;
				continue;
			}
			if (seen.has(externalOfferId)) continue;
			seen.add(externalOfferId);
			if (excludeGambling && isGamblingOffer(item.verticalNames)) {
				skipReasons.gamblingExcluded++;
				continue;
			}
			const countries = parseGeos(item.geos);
			if (userCountry && countries.length > 0) {
				if (!countries.includes(userCountry)) {
					skipReasons.geoExcluded++;
					continue;
				}
			}
			const description = decodeAndStrip(item.description || "");
			const requirements = item.callToAction ? decodeAndStrip(item.callToAction) : "";
			const notAllowed = item.disclaimer ? decodeAndStrip(item.disclaimer) : "";
			let stepRewards = [];
			if (item.events && item.events.length > 0) stepRewards = [...item.events].sort((a, b) => a.orderId - b.orderId).map((evt) => ({
				step: decodeAndStrip(evt.eventName),
				reward: Number(evt.payout) || 0
			})).filter((sr) => sr.step && sr.reward > 0);
			let icon = "";
			if (item.image && item.image.startsWith("https://")) icon = item.image;
			else if (item.coverImage && item.coverImage.startsWith("https://")) icon = item.coverImage;
			const devices = normalizeDevices(item.os ? [item.os] : []);
			const category = mapCategory(item.verticalNames, item.os, item.packageId);
			const isFeatured = item.promoted || item.pinned || false;
			const clickUrl = `${TOROX_CLICK_URL_SENTINEL}${externalOfferId}`;
			offers.push({
				externalOfferId,
				title: decodeAndStrip(item.name.trim()),
				description,
				requirements,
				notAllowed,
				icon,
				clickUrl,
				networkPayout: payout,
				countries,
				devices,
				category,
				isFeatured,
				stepRewards: stepRewards.length > 0 ? stepRewards : void 0,
				raw: item
			});
		}
		if (offers.length === 0) {
			const reasons = Object.entries(skipReasons).filter(([_, count]) => count > 0).map(([reason, count]) => `${reason}: ${count}`).join(", ");
			const firstItemKeys = rawOffers.length > 0 && typeof rawOffers[0] === "object" ? Object.keys(rawOffers[0]).join(", ") : "none";
			throw new Error(`Torox API returned ${rawOffers.length} offers but none passed filtering. Skip reasons: ${reasons || "none"}. First item keys: ${firstItemKeys}. Config: excludeGambling=${excludeGambling}, userCountry=${userCountry ?? "none"}`);
		}
		return offers;
	}
};
/**
* Registry of provider adapters. Intentionally EMPTY — no network is integrated yet.
* A future adapter registers itself here:
*   registerAdapter(myAdapter)
*/
var adapters = /* @__PURE__ */ new Map();
function registerAdapter(adapter) {
	adapters.set(adapter.slug, adapter);
}
function getAdapter(slug) {
	return adapters.get(slug) ?? null;
}
registerAdapter(adblueMediaAdapter);
registerAdapter(ogAdsAdapter);
registerAdapter(affikeAdapter);
registerAdapter(adswedMediaAdapter);
registerAdapter(revtooAdapter);
registerAdapter(gemiAdAdapter);
registerAdapter(toroxAdapter);
/** User reward = network payout * revenue share, rounded to cents. */
function computeUserReward(networkPayout, revenueShare) {
	return Math.max(0, Math.round(networkPayout * revenueShare * 100) / 100);
}
//#endregion
export { getAdapter as n, computeUserReward as t };
