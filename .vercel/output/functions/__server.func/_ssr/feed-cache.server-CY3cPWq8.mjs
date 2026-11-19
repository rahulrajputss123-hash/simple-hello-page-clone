import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
import { normalizeCountry } from "./geo.server-BPDqDCBk.mjs";
import { n as getAdapter, t as computeUserReward } from "./provider-types-CWlnFcSy.mjs";
import { getFeedSettingsImpl, readNetworkFeedConfig } from "./feed-settings.server-782fwX6y.mjs";
import { createHash } from "crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/feed-cache.server-CY3cPWq8.js
init_client_server();
/**
* Materialises base64 `data:` image URIs from a provider feed into Supabase
* Storage, so `offers.image_url` only ever holds a URL.
*
* Affike sends ~11% of its catalogue with artwork inline as a data URI rather
* than a link. Those used to be dropped, leaving those offers on the generic
* fallback icon. Storing the base64 in the table instead was not an option — it
* would bloat every feed query that selects the column.
*
* Runs at most once per offer: an offer that already has a non-null image_url is
* skipped, so a re-sync does no upload work. The object path is content-hashed,
* so even if an upload does repeat it overwrites in place rather than
* accumulating duplicates.
*/
var BUCKET = "offer-images";
/** Guard against a pathological payload; Affike's are a few KB. */
var MAX_DECODED_BYTES = 2097152;
var EXT_BY_MIME = {
	"image/png": "png",
	"image/jpeg": "jpg",
	"image/jpg": "jpg",
	"image/webp": "webp",
	"image/gif": "gif",
	"image/svg+xml": "svg"
};
/**
* Parses a `data:image/...;base64,....` URI. Returns null for anything else,
* including plain URLs and non-image or non-base64 data URIs.
*/
function decodeDataUriImage(value) {
	if (typeof value !== "string") return null;
	const match = /^data:([a-z0-9.+/-]+);base64,(.+)$/i.exec(value.trim());
	if (!match) return null;
	const contentType = (match[1] ?? "").toLowerCase();
	const ext = EXT_BY_MIME[contentType];
	if (!ext) return null;
	try {
		const bytes = Buffer.from(match[2] ?? "", "base64");
		if (bytes.length === 0 || bytes.length > MAX_DECODED_BYTES) return null;
		return {
			bytes,
			contentType,
			ext
		};
	} catch {
		return null;
	}
}
/** Stable, collision-resistant object path. Same bytes -> same path. */
function objectPath(providerSlug, externalOfferId, image) {
	const hash = createHash("sha256").update(image.bytes).digest("hex").slice(0, 16);
	return `${providerSlug}/${externalOfferId.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 80)}-${hash}.${image.ext}`;
}
/**
* image_url already stored for these offers, keyed by externalOfferId.
*
* Serves two purposes: offers listed here need no upload, and the URL is handed
* back to the caller so a sync that has no image for an offer can re-write the
* existing value instead of nulling it out. The bulk upsert writes image_url for
* every row, so without that a later sync would wipe an uploaded image.
*/
async function existingOfferImageUrls(providerId, externalOfferIds) {
	const found = /* @__PURE__ */ new Map();
	if (!externalOfferIds.length) return found;
	const { data, error } = await supabaseAdmin.from("offers").select("external_offer_id, image_url").eq("provider_id", providerId).in("external_offer_id", externalOfferIds);
	if (error || !data) return found;
	for (const row of data) {
		const url = row.image_url;
		const id = row.external_offer_id;
		if (id && typeof url === "string" && url.trim().length > 0) found.set(id, url.trim());
	}
	return found;
}
/**
* Uploads any inline images that aren't stored yet.
*
* @returns externalOfferId -> public URL, for the offers uploaded in THIS call.
*          Offers that were skipped or failed are absent, so callers fall back to
*          whatever they would otherwise have used.
*/
async function materializeInlineOfferImages(provider, offers, alreadyStored) {
	const result = /* @__PURE__ */ new Map();
	const candidates = offers.map((offer) => ({
		offer,
		image: decodeDataUriImage(offer.imageDataUri)
	})).filter((c) => c.image !== null);
	if (!candidates.length) return result;
	for (const { offer, image } of candidates) {
		if (alreadyStored.has(offer.externalOfferId)) continue;
		const path = objectPath(provider.slug, offer.externalOfferId, image);
		try {
			const storage = supabaseAdmin.storage.from(BUCKET);
			const { error } = await storage.upload(path, image.bytes, {
				contentType: image.contentType,
				cacheControl: "31536000",
				upsert: true
			});
			if (error) continue;
			const { data } = storage.getPublicUrl(path);
			const publicUrl = data?.publicUrl;
			if (publicUrl) result.set(offer.externalOfferId, publicUrl);
		} catch {
			continue;
		}
	}
	return result;
}
init_client_server();
var _assembledCache = /* @__PURE__ */ new Map();
var ASSEMBLED_CACHE_TTL_MS = 6e4;
var _assembleInFlight = /* @__PURE__ */ new Map();
var _refreshInFlight = /* @__PURE__ */ new Map();
/**
* Clear the in-memory assembled cache (for debugging/admin use)
*/
function clearAssembledCache() {
	_assembledCache.clear();
	console.log("[feed-cache] Cleared assembled cache");
}
var _enabledProvidersCache = null;
var PROVIDERS_CACHE_TTL_MS = 6e4;
function imageUrlFromIcon(icon) {
	return typeof icon === "string" && /^https?:\/\//i.test(icon.trim()) ? icon.trim() : null;
}
/**
* Simple hash function for seeded shuffling.
* Takes a string seed and returns a number between 0 and 1.
*/
function simpleHash(str) {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash) / 2147483647;
}
/**
* Seeded shuffle using Fisher-Yates algorithm.
* Seed format: userId (or IP) + ISO date string (YYYY-MM-DD).
*/
function seededShuffle(array, seed) {
	const arr = [...array];
	const random = (max) => {
		seed = String(simpleHash(seed) * 9999999);
		return Math.floor(simpleHash(seed) * max);
	};
	for (let i = arr.length - 1; i > 0; i--) {
		const j = random(i + 1);
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}
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
var _offersHasImageUrl = null;
async function offersHasImageUrl() {
	if (_offersHasImageUrl !== null) return _offersHasImageUrl;
	const { error } = await supabaseAdmin.from("offers").select("image_url").limit(1);
	_offersHasImageUrl = !error;
	return _offersHasImageUrl;
}
var imageCol = (has) => has ? ", image_url" : "";
function pickImageUrl(o) {
	return imageUrlFromIcon(o.image_url) ?? imageUrlFromIcon(o.icon);
}
/**
* Check if an offer has a valid reward amount (> 0).
* Zero-reward offers should be excluded from user feeds.
*/
function hasValidReward(rewardAmount) {
	return !isNaN(rewardAmount) && rewardAmount > 0;
}
/**
* Check if an offer has a valid image URL.
* Offers without images should be moved to the bottom of the feed.
*/
function hasValidImage(imageUrl) {
	if (!imageUrl) return false;
	const trimmed = imageUrl.trim();
	return trimmed.length > 0 && /^https?:\/\//i.test(trimmed);
}
/**
* Strip HTML tags and decode entities from text.
* Converts <br> and <br /> to newlines, decodes common entities, removes other tags.
*/
function stripHtml(text) {
	if (!text) return "";
	return text.replace(/<br\s*\/?>/gi, "\n").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/<[^>]*>/g, "").trim();
}
/**
* Decode HTML entities in text (for Torox eventName and similar fields).
*/
function decodeHtmlEntities(text) {
	return text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#039;/g, "'").replace(/&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/&ndash;/g, "–").replace(/&mdash;/g, "—").replace(/&uuml;/g, "ü").replace(/&egrave;/g, "è").replace(/&eacute;/g, "é").replace(/&agrave;/g, "à").replace(/&aacute;/g, "á").replace(/&#(\d+);/g, (_match, num) => String.fromCharCode(parseInt(num, 10))).replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) => String.fromCharCode(parseInt(hex, 16)));
}
/**
* Extract step-by-step breakdown from raw_payload for affike, revtoo, torox, and gemiad.
* Returns null if steps should not be shown (no valid steps, single generic step, etc).
*/
function extractStepsFromRawPayload(providerSlug, rawPayload, offerRewardAmount, revenueShare, defaultRevenueShare) {
	if (!rawPayload || typeof rawPayload !== "object") return null;
	const payload = rawPayload;
	const share = revenueShare ?? defaultRevenueShare;
	if (providerSlug === "torox" && Array.isArray(payload.events)) {
		const events = payload.events;
		if (events.length === 0) return null;
		const sorted = [...events].sort((a, b) => (a.orderId ?? 0) - (b.orderId ?? 0));
		const steps = [];
		for (const event of sorted) {
			const label = decodeHtmlEntities(stripHtml(event.eventName || "")).trim();
			const payout = Number(event.payout) || 0;
			if (!label || payout <= 0) continue;
			const usd = payout * share;
			steps.push({
				label,
				usd
			});
		}
		return steps.length > 0 ? steps : null;
	}
	if (providerSlug === "gemiad" && Array.isArray(payload.events)) {
		const events = payload.events;
		if (events.length === 0) return null;
		const steps = [];
		for (const event of events) {
			const label = stripHtml(event.action?.en || "").trim();
			const payout = Number(event.payout) || 0;
			if (!label || payout <= 0) continue;
			const usd = payout * share;
			steps.push({
				label,
				usd
			});
		}
		if (steps.length === 1 && steps[0].label.toLowerCase() === "complete the offer") return null;
		return steps.length > 0 ? steps : null;
	}
	if (providerSlug === "affike" && Array.isArray(payload.conversionEvents)) {
		const events = payload.conversionEvents;
		const totalPoints = events.reduce((sum, e) => sum + (Number(e.points) || 0), 0);
		if (totalPoints === 0) return null;
		const steps = [];
		for (const event of events) {
			const label = (event.action || "").trim();
			const points = Number(event.points) || 0;
			if (!label || points <= 0) continue;
			const usd = offerRewardAmount * points / totalPoints;
			steps.push({
				label: stripHtml(label),
				usd
			});
		}
		if (steps.length === 1 && steps[0].label.toLowerCase() === "complete the offer") return null;
		return steps.length > 0 ? steps : null;
	}
	if (providerSlug === "revtoo" && Array.isArray(payload.events)) {
		const events = payload.events;
		const steps = [];
		for (const event of events) {
			const label = (event.event_title || "").trim();
			const payout = Number(event.event_payout) || 0;
			if (!label || payout <= 0) continue;
			const usd = payout * share;
			steps.push({
				label: stripHtml(label),
				usd
			});
		}
		if (steps.length === 1 && steps[0].label.toLowerCase() === "complete the offer") return null;
		return steps.length > 0 ? steps : null;
	}
	return null;
}
var OFFER_CATEGORIES = [
	"App Install",
	"Trial",
	"Deals",
	"Survey",
	"Games",
	"Link Locker",
	"Shortlink"
];
function offerRowFromNormalized(provider, offer, seenAt) {
	const share = offer.revenueShare ?? provider.default_revenue_share;
	const category = offer.category && OFFER_CATEGORIES.includes(offer.category) ? offer.category : null;
	return {
		source: "network",
		provider_id: provider.id,
		external_offer_id: offer.externalOfferId,
		title: offer.title,
		description: offer.description ?? "",
		requirements: offer.requirements ?? "",
		not_allowed: offer.notAllowed ?? "",
		icon: offer.icon ?? "gift",
		click_url: offer.clickUrl,
		network_payout: offer.networkPayout,
		revenue_share: share,
		reward_amount: computeUserReward(offer.networkPayout, share),
		devices: offer.devices ?? [],
		category,
		is_active: true,
		last_seen_at: seenAt,
		raw_payload: offer.raw ?? null
	};
}
async function readCacheRow(providerId, country) {
	const { data } = await supabaseAdmin.from("offer_feed_cache").select("offers, expires_at").eq("provider_id", providerId).eq("country", country).maybeSingle();
	return data;
}
/**
* Update offer_country_availability table after successful feed refresh.
* Records which offers are available in which countries based on per-offer country data.
* 
* Country data sources:
* - Revtoo: item.countries[] from API
* - Torox: geos field from API  
* - OGAds: country field from API
* - GemiAd: country[] field from API
* - Affike: countries[] field from API
* - AdSwedMedia: countries[] field from API
* - AdBlueMedia: NO country field in API - uses requested country as fallback assumption
*/
async function updateOfferCountryAvailability(providerId, providerSlug, requestedCountry, normalizedOffers, upsertedDbOffers) {
	if (!upsertedDbOffers.length) {
		await supabaseAdmin.from("offer_country_availability").delete().eq("provider_id", providerId).eq("country", requestedCountry);
		return;
	}
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const rows = [];
	const externalIdToDbId = /* @__PURE__ */ new Map();
	for (const dbOffer of upsertedDbOffers) if (dbOffer.external_offer_id) externalIdToDbId.set(dbOffer.external_offer_id, dbOffer.id);
	for (const normalizedOffer of normalizedOffers) {
		const dbId = externalIdToDbId.get(normalizedOffer.externalOfferId);
		if (!dbId) continue;
		const countries = normalizedOffer.countries ?? [];
		if (countries.length > 0) for (const countryCode of countries) {
			if (countryCode.toLowerCase() === "all") continue;
			rows.push({
				offer_id: dbId,
				country: countryCode.toUpperCase(),
				provider_id: providerId,
				last_seen_at: now
			});
		}
		else if (providerSlug === "adbluemedia") rows.push({
			offer_id: dbId,
			country: requestedCountry.toUpperCase(),
			provider_id: providerId,
			last_seen_at: now
		});
	}
	if (rows.length > 0) {
		const { error: upsertError } = await supabaseAdmin.from("offer_country_availability").upsert(rows, { onConflict: "offer_id,country" });
		if (upsertError) console.error("[feed-cache] Failed to update offer_country_availability:", upsertError);
	}
	const offerIds = upsertedDbOffers.map((o) => o.id);
	if (offerIds.length > 0) {
		const { error: deleteError } = await supabaseAdmin.from("offer_country_availability").delete().eq("provider_id", providerId).eq("country", requestedCountry).not("offer_id", "in", `(${offerIds.join(",")})`);
		if (deleteError) console.error("[feed-cache] Failed to clean up stale availability:", deleteError);
	}
}
/**
* Fetch this provider's feed for `country`, upsert into `offers`, and write the country cache row.
* Bounded by the network's configured max offers. Throws on adapter/config failure.
*/
async function refreshProviderCountry(provider, country, settings, ip) {
	const dedupeKey = `${provider.id}:${country}`;
	const inFlight = _refreshInFlight.get(dedupeKey);
	if (inFlight) {
		await inFlight;
		const { data } = await supabaseAdmin.from("offer_feed_cache").select("offers").eq("provider_id", provider.id).eq("country", country).maybeSingle();
		return data?.offers ?? [];
	}
	const refreshPromise = (async () => {
		try {
			const adapter = getAdapter(provider.slug);
			if (!adapter) throw new Error(`No adapter registered for "${provider.slug}"`);
			const configError = adapter.validateConfig?.(provider.sync_config ?? {});
			if (configError) throw new Error(configError);
			const { maxOffers } = readNetworkFeedConfig(provider.slug, provider.sync_config);
			const seenAt = (/* @__PURE__ */ new Date()).toISOString();
			const limited = (await adapter.fetchOffers(provider, {
				country,
				ip: ip ?? void 0
			})).slice(0, maxOffers);
			let cached = [];
			if (limited.length) {
				const hasImageUrl = await offersHasImageUrl();
				/**
				* Some providers send artwork inline as a base64 data URI. Those are uploaded
				* to Storage here and only the resulting URL is persisted, so the offers table
				* never holds an inline blob. Skips offers that already have an image_url, so
				* a re-sync does no upload work.
				*/
				const storedImages = hasImageUrl ? await existingOfferImageUrls(provider.id, limited.map((o) => o.externalOfferId)) : /* @__PURE__ */ new Map();
				const uploadedImages = hasImageUrl ? await materializeInlineOfferImages(provider, limited, storedImages) : /* @__PURE__ */ new Map();
				const manualFlags = /* @__PURE__ */ new Map();
				const PAGE_SIZE = 1e3;
				for (let from = 0;; from += PAGE_SIZE) {
					const { data: page, error: pageError } = await supabaseAdmin.from("offers").select("external_offer_id, category_manual, tags_manual").eq("provider_id", provider.id).range(from, from + PAGE_SIZE - 1);
					if (pageError) throw pageError;
					const rows = page ?? [];
					for (const row of rows) {
						if (!row.external_offer_id) continue;
						manualFlags.set(row.external_offer_id, {
							categoryManual: Boolean(row.category_manual),
							tagsManual: Boolean(row.tags_manual)
						});
					}
					if (rows.length < PAGE_SIZE) break;
				}
				const rows = limited.map((o) => {
					const row = offerRowFromNormalized(provider, o, seenAt);
					if (hasImageUrl) row.image_url = imageUrlFromIcon(o.icon) ?? uploadedImages.get(o.externalOfferId) ?? storedImages.get(o.externalOfferId) ?? null;
					const flags = manualFlags.get(o.externalOfferId);
					if (flags?.categoryManual) delete row["category"];
					if (flags?.tagsManual) delete row["tags"];
					return row;
				});
				const { data: upserted, error } = await supabaseAdmin.from("offers").upsert(rows, { onConflict: "provider_id,external_offer_id" }).select("id, external_offer_id, title, reward_amount, network_payout");
				if (error) throw error;
				cached = (upserted ?? []).map((r) => ({
					id: r.id,
					externalOfferId: r.external_offer_id,
					title: r.title,
					rewardAmount: Number(r.reward_amount),
					networkPayout: r.network_payout == null ? null : Number(r.network_payout)
				}));
				await updateOfferCountryAvailability(provider.id, provider.slug, country, limited, upserted);
			} else await updateOfferCountryAvailability(provider.id, provider.slug, country, [], []);
			const expiresAt = new Date(Date.now() + Math.max(1, settings.refreshIntervalHours) * 60 * 60 * 1e3).toISOString();
			const { error: cacheError } = await supabaseAdmin.from("offer_feed_cache").upsert({
				provider_id: provider.id,
				country,
				offers: cached,
				offer_count: cached.length,
				last_synced_at: seenAt,
				expires_at: expiresAt,
				sync_error: null
			}, { onConflict: "provider_id,country" });
			if (cacheError) throw cacheError;
			return cached;
		} finally {
			_refreshInFlight.delete(dedupeKey);
		}
	})();
	_refreshInFlight.set(dedupeKey, refreshPromise);
	await refreshPromise;
	const { data } = await supabaseAdmin.from("offer_feed_cache").select("offers").eq("provider_id", provider.id).eq("country", country).maybeSingle();
	return data?.offers ?? [];
}
/** Serve fresh cache if valid; otherwise refresh synchronously. Falls back to stale on error. */
async function getOrRefreshProviderCountry(provider, country, settings, ip) {
	const existing = await readCacheRow(provider.id, country);
	if (existing && new Date(existing.expires_at).getTime() > Date.now()) return existing.offers ?? [];
	if (existing?.offers) {
		const staleOffers = existing.offers ?? [];
		refreshProviderCountry(provider, country, settings, ip).catch((err) => {
			const message = err instanceof Error ? err.message : "feed refresh failed";
			supabaseAdmin.from("offer_feed_cache").update({ sync_error: message }).eq("provider_id", provider.id).eq("country", country).then(() => {});
		});
		return staleOffers;
	}
	try {
		return await refreshProviderCountry(provider, country, settings, ip);
	} catch (err) {
		const message = err instanceof Error ? err.message : "feed refresh failed";
		await supabaseAdmin.from("offer_feed_cache").update({ sync_error: message }).eq("provider_id", provider.id).eq("country", country);
		return [];
	}
}
async function enabledProviders() {
	if (_enabledProvidersCache && _enabledProvidersCache.expires > Date.now()) return _enabledProvidersCache.data;
	const { data, error } = await supabaseAdmin.from("offer_providers").select("*").eq("enabled", true);
	if (error) throw error;
	const providers = data ?? [];
	_enabledProvidersCache = {
		data: providers,
		expires: Date.now() + PROVIDERS_CACHE_TTL_MS
	};
	return providers;
}
/** Assemble the geo-targeted, ranked Featured Offers list for a given country. */
async function assembleFeaturedImpl(requestedCountry, scope, presetSettings, ip, userId) {
	const settings = presetSettings ?? await getFeedSettingsImpl();
	const country = normalizeCountry(requestedCountry) ?? settings.defaultCountry;
	const cacheKey = `${country}:${scope}`;
	const cached = _assembledCache.get(cacheKey);
	if (cached && cached.expires > Date.now()) {
		const visible = userId ? await filterUserHiddenOffers(cached.offers, userId) : cached.offers;
		if (scope === "home") return visible.slice(0, settings.featuredSlots);
		return visible;
	}
	const inFlight = _assembleInFlight.get(cacheKey);
	if (inFlight) {
		const result = await inFlight;
		const visible = userId ? await filterUserHiddenOffers(result, userId) : result;
		if (scope === "home") return visible.slice(0, settings.featuredSlots);
		return visible;
	}
	const buildPromise = (async () => {
		const [providers, hasImageUrl] = await Promise.all([enabledProviders(), offersHasImageUrl()]);
		const weightByProviderId = new Map(providers.map((p) => [p.id, readNetworkFeedConfig(p.slug, p.sync_config).weight]));
		const slugByProviderId = new Map(providers.map((p) => [p.id, p.slug]));
		const collected = /* @__PURE__ */ new Map();
		const providerResults = await Promise.all(providers.map(async (provider) => {
			return {
				provider,
				list: await getOrRefreshProviderCountry(provider, country, settings, ip)
			};
		}));
		for (const { provider, list } of providerResults) {
			const weight = weightByProviderId.get(provider.id) ?? 1;
			for (const item of list) collected.set(item.id, Math.max(collected.get(item.id) ?? 0, weight));
		}
		const [networkOffersData, manualRowsData, countryAvailability] = await Promise.all([
			collected.size > 0 ? supabaseAdmin.from("offers").select("id, title, description, requirements, not_allowed, icon, reward_amount, click_url, source, provider_id, external_offer_id, is_active, expires_at, is_limited_deal, deal_group_id, actual_cost, payout_percentage, max_payout_cap, display_price, display_percent, payout_mode, category, category_manual, tags, tags_manual, push_to_bottom, devices, offer_providers!inner(name)" + imageCol(hasImageUrl)).in("id", [...collected.keys()]).eq("is_active", true) : Promise.resolve({ data: [] }),
			supabaseAdmin.from("offers").select("id, title, description, requirements, not_allowed, icon, reward_amount, click_url, source, provider_id, external_offer_id, countries, admin_priority, sort_order, is_active, is_featured, expires_at, is_limited_deal, deal_group_id, actual_cost, payout_percentage, max_payout_cap, display_price, display_percent, payout_mode, category, category_manual, tags, tags_manual, devices, offer_providers(name)" + imageCol(hasImageUrl)).eq("source", "manual").eq("is_featured", true).eq("is_active", true).order("admin_priority", { ascending: false }).order("sort_order", { ascending: true }),
			collected.size > 0 ? supabaseAdmin.from("offer_country_availability").select("offer_id").eq("country", country).in("offer_id", [...collected.keys()]) : Promise.resolve({ data: [] })
		]);
		const availableInCountry = new Set((countryAvailability.data ?? []).map((row) => row.offer_id));
		const offersWithNoAvailability = collected.size > 0 ? await supabaseAdmin.from("offers").select("id").in("id", [...collected.keys()]).not("id", "in", `(SELECT DISTINCT offer_id FROM offer_country_availability)`) : { data: [] };
		const globalOfferIds = new Set((offersWithNoAvailability.data ?? []).map((row) => row.id));
		const now = Date.now();
		const networkOffers = (networkOffersData.data ?? []).filter((o) => !o.expires_at || new Date(o.expires_at).getTime() > now).filter((o) => hasValidReward(Number(o.reward_amount))).filter((o) => {
			return availableInCountry.has(o.id) || globalOfferIds.has(o.id);
		}).map((o) => ({
			id: o.id,
			external_offer_id: o.external_offer_id ?? null,
			title: o.title,
			description: o.description,
			requirements: o.requirements,
			not_allowed: o.not_allowed ?? "",
			icon: o.icon,
			image_url: pickImageUrl(o),
			reward_amount: Number(o.reward_amount),
			display_price: o.display_price ?? null,
			display_percent: o.display_percent != null ? Number(o.display_percent) : null,
			click_url: o.click_url,
			source: o.source,
			provider_id: o.provider_id,
			provider_slug: o.provider_id ? slugByProviderId.get(o.provider_id) ?? null : null,
			provider_name: o.offer_providers?.name ?? null,
			devices: Array.isArray(o.devices) ? o.devices : [],
			is_limited_deal: Boolean(o.is_limited_deal),
			deal_group_id: o.deal_group_id ?? null,
			actual_cost: o.actual_cost ?? null,
			payout_percentage: Number(o.payout_percentage ?? 110),
			max_payout_cap: o.max_payout_cap ?? null,
			payout_mode: o.payout_mode ?? "manual",
			category: o.category ?? null,
			tags: normalizeStoredTags(o.tags),
			_tagsManual: Boolean(o.tags_manual),
			_pushToBottom: o.push_to_bottom ?? null
		}));
		const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
		const shuffled = seededShuffle(networkOffers, (userId || ip || "anonymous") + ":" + today);
		const regularWithImage = [];
		const bottomWithImage = [];
		const noImageOffers = [];
		for (const offer of shuffled) {
			const pushToBottom = offer._pushToBottom;
			const shouldPushToBottom = pushToBottom === true || pushToBottom === null && isCasinoOffer(offer.title, offer.description);
			if (!hasValidImage(offer.image_url)) noImageOffers.push(offer);
			else if (shouldPushToBottom) bottomWithImage.push(offer);
			else regularWithImage.push(offer);
		}
		const sortedNetworkOffers = [
			...regularWithImage,
			...bottomWithImage,
			...noImageOffers
		];
		const combined = [...(manualRowsData.data ?? []).filter((o) => !o.expires_at || new Date(o.expires_at).getTime() > now).filter((o) => {
			const countries = o.countries ?? [];
			return countries.length === 0 || countries.includes(country);
		}).filter((o) => hasValidReward(Number(o.reward_amount))).map((o) => ({
			id: o.id,
			external_offer_id: o.external_offer_id ?? null,
			title: o.title,
			description: o.description,
			requirements: o.requirements,
			not_allowed: o.not_allowed ?? "",
			icon: o.icon,
			image_url: pickImageUrl(o),
			reward_amount: Number(o.reward_amount),
			display_price: o.display_price ?? null,
			display_percent: o.display_percent != null ? Number(o.display_percent) : null,
			click_url: o.click_url,
			source: o.source,
			provider_id: o.provider_id,
			provider_slug: null,
			provider_name: o.offer_providers?.name ?? null,
			devices: Array.isArray(o.devices) ? o.devices : [],
			is_limited_deal: Boolean(o.is_limited_deal),
			deal_group_id: o.deal_group_id ?? null,
			actual_cost: o.actual_cost ?? null,
			payout_percentage: Number(o.payout_percentage ?? 110),
			max_payout_cap: o.max_payout_cap ?? null,
			payout_mode: o.payout_mode ?? "manual",
			category: o.category ?? null,
			tags: normalizeStoredTags(o.tags),
			_tagsManual: Boolean(o.tags_manual)
		})), ...sortedNetworkOffers];
		await applyAutoTags(combined);
		_assembledCache.set(cacheKey, {
			offers: combined,
			expires: Date.now() + ASSEMBLED_CACHE_TTL_MS
		});
		return combined;
	})();
	_assembleInFlight.set(cacheKey, buildPromise);
	try {
		const result = await buildPromise;
		const visible = userId ? await filterUserHiddenOffers(result, userId) : result;
		if (scope === "home") return visible.slice(0, settings.featuredSlots);
		return visible;
	} finally {
		_assembleInFlight.delete(cacheKey);
	}
}
/**
* Remove offers the user should no longer see:
*  1. Offers they have an 'approved' claim for (completed).
*  2. Limited-deal siblings: once the user holds a non-rejected claim on ANY offer
*     in a deal_group, the OTHER offers in that group disappear (the claimed offer
*     itself stays until it is approved, per rule 1).
*/
async function filterUserHiddenOffers(offers, userId) {
	if (!offers.length) return offers;
	const { data: claims } = await supabaseAdmin.from("offer_claims").select("offer_id, status, offers:offer_id(deal_group_id)").eq("user_id", userId).neq("status", "rejected");
	const approved = /* @__PURE__ */ new Set();
	const claimedIdsByGroup = /* @__PURE__ */ new Map();
	for (const c of claims ?? []) {
		if (c.status === "approved") approved.add(c.offer_id);
		const group = c.offers?.deal_group_id ?? null;
		if (group) {
			if (!claimedIdsByGroup.has(group)) claimedIdsByGroup.set(group, /* @__PURE__ */ new Set());
			claimedIdsByGroup.get(group).add(c.offer_id);
		}
	}
	if (!approved.size && !claimedIdsByGroup.size) return offers;
	return offers.filter((o) => {
		if (approved.has(o.id)) return false;
		if (o.deal_group_id) {
			const claimedInGroup = claimedIdsByGroup.get(o.deal_group_id);
			if (claimedInGroup && [...claimedInGroup].some((id) => id !== o.id)) return false;
		}
		return true;
	});
}
var KNOWN_TAGS = [
	"Hot",
	"Trending",
	"Easy",
	"Popular"
];
function normalizeStoredTags(raw) {
	if (!Array.isArray(raw)) return [];
	const out = [];
	for (const t of raw) {
		const s = String(t);
		if (KNOWN_TAGS.includes(s)) out.push(s);
	}
	return out;
}
async function applyAutoTags(offers) {
	const eligible = offers.filter((o) => !o._tagsManual);
	if (!eligible.length) {
		for (const o of offers) {
			delete o._tagsManual;
			delete o._pushToBottom;
		}
		return;
	}
	const { computeAutoTags, isCasinoOffer: isCasino } = await import("./tags.server-D4OttxCH.mjs");
	const map = await computeAutoTags(eligible.map((o) => ({
		id: o.id,
		reward_amount: Number(o.reward_amount),
		requirements: o.requirements ?? null,
		category: o.category ?? null,
		title: o.title,
		description: o.description,
		push_to_bottom: o._pushToBottom ?? null
	})));
	for (const o of offers) {
		if (!o._tagsManual) {
			const auto = map[o.id];
			if (auto?.length) o.tags = auto;
		}
		delete o._tagsManual;
		delete o._pushToBottom;
	}
}
/**
* Enrich offers with user's claim status (if userId provided).
* Adds claim_status and claim_reject_reason to each offer.
* 
* When multiple claims exist for one offer, picks by priority:
* 1. approved > pending > started > rejected
* 2. Within same status, picks newest (MAX created_at)
*/
async function enrichOffersWithClaimStatus(offers, userId) {
	if (!userId || offers.length === 0) return offers;
	const offerIds = offers.map((o) => o.id);
	const { data: claims } = await supabaseAdmin.from("offer_claims").select("offer_id, status, reject_reason, created_at").eq("user_id", userId).in("offer_id", offerIds).order("created_at", { ascending: false });
	const statusPriority = {
		approved: 4,
		pending: 3,
		started: 2,
		rejected: 1
	};
	const claimsByOfferId = /* @__PURE__ */ new Map();
	for (const claim of claims ?? []) {
		const existing = claimsByOfferId.get(claim.offer_id);
		if ((statusPriority[claim.status] ?? 0) > (existing ? statusPriority[existing.status] ?? 0 : -1)) claimsByOfferId.set(claim.offer_id, {
			status: claim.status,
			reject_reason: claim.reject_reason
		});
	}
	return offers.map((offer) => {
		const claim = claimsByOfferId.get(offer.id);
		return {
			...offer,
			claim_status: claim?.status ?? null,
			claim_reject_reason: claim?.reject_reason ?? null
		};
	});
}
async function getFeaturedFeedImpl(requestedCountry, scope, ip, userId, userPlatform) {
	const settings = await getFeedSettingsImpl();
	const country = normalizeCountry(requestedCountry) ?? settings.defaultCountry;
	let offers = await assembleFeaturedImpl(requestedCountry, scope, settings, ip, userId);
	offers.length;
	offers.filter((o) => o.category === "Games").length;
	if (userPlatform && userPlatform !== "web") {
		const { filterOffersByPlatform } = await import("./platform.server-bwRAE082.mjs");
		offers = filterOffersByPlatform(offers, userPlatform);
		offers.length;
		offers.filter((o) => o.category === "Games").length;
	} else if (userPlatform === "web") {
		offers.length;
		offers = offers.filter((o) => !o.devices || o.devices.length === 0 || o.devices.includes("web"));
		offers.length;
		offers.filter((o) => o.category === "Games").length;
	}
	offers = await enrichOffersWithClaimStatus(offers, userId);
	return {
		country,
		offers
	};
}
/**
* Get a single offer by ID with user's claim status.
* Returns the same shape as a feed item.
*/
async function getOfferByIdImpl(offerId, userId) {
	const hasImageUrl = await offersHasImageUrl();
	const { data: offer, error } = await supabaseAdmin.from("offers").select("*, offer_providers(slug, name, default_revenue_share)").eq("id", offerId).eq("is_active", true).maybeSingle();
	if (error) {
		console.error("[getOfferByIdImpl] error:", error.message);
		return null;
	}
	if (!offer) return null;
	const providerData = offer.offer_providers;
	const providerSlug = providerData?.slug ?? null;
	const providerName = providerData?.name ?? null;
	const defaultRevenueShare = Number(providerData?.default_revenue_share ?? .6);
	const strippedDescription = stripHtml(offer.description ?? "");
	const strippedRequirements = stripHtml(offer.requirements ?? "");
	const strippedNotAllowed = stripHtml(offer.not_allowed ?? "");
	const steps = extractStepsFromRawPayload(providerSlug, offer.raw_payload, Number(offer.reward_amount), offer.revenue_share ? Number(offer.revenue_share) : null, defaultRevenueShare);
	if (steps && steps.length > 0) {}
	let difficulty;
	if (providerSlug === "adswedmedia" && offer.raw_payload && typeof offer.raw_payload === "object") {
		const payload = offer.raw_payload;
		if (typeof payload.level === "string" && payload.level.trim()) difficulty = payload.level.trim();
	}
	return (await enrichOffersWithClaimStatus([{
		id: offer.id,
		external_offer_id: offer.external_offer_id,
		title: offer.title,
		description: strippedDescription,
		requirements: strippedRequirements,
		not_allowed: strippedNotAllowed,
		icon: offer.icon ?? "",
		image_url: hasImageUrl ? imageUrlFromIcon(offer.image_url) : imageUrlFromIcon(offer.icon),
		reward_amount: Number(offer.reward_amount),
		display_price: offer.display_price,
		display_percent: offer.display_percent,
		click_url: offer.click_url,
		source: "manual",
		provider_id: offer.provider_id,
		provider_slug: providerSlug,
		provider_name: providerName,
		devices: Array.isArray(offer.devices) ? offer.devices : [],
		is_limited_deal: offer.is_limited_deal ?? false,
		deal_group_id: offer.deal_group_id,
		actual_cost: offer.actual_cost ? Number(offer.actual_cost) : null,
		payout_percentage: Number(offer.payout_percentage ?? 110),
		max_payout_cap: offer.max_payout_cap ? Number(offer.max_payout_cap) : null,
		payout_mode: offer.payout_mode ?? "manual",
		category: offer.category,
		tags: [],
		steps: steps ?? void 0,
		difficulty,
		raw_payload: offer.raw_payload
	}], userId))[0] ?? null;
}
/**
* Background refresh entrypoint (called by the scheduled cron route).
* Refreshes every enabled network for every country that has been requested at least once
* (i.e. already present in offer_feed_cache) plus the configured default country.
* `force` ignores the expiry window.
*/
async function refreshAllFeedsImpl(force = false) {
	const settings = await getFeedSettingsImpl();
	const providers = await enabledProviders();
	const summary = {
		refreshed: [],
		errors: []
	};
	if (!providers.length) return summary;
	const { data: cacheRows } = await supabaseAdmin.from("offer_feed_cache").select("country, expires_at");
	const countries = /* @__PURE__ */ new Set([
		settings.defaultCountry,
		"IN",
		"BD",
		"PK",
		"MA",
		"US"
	]);
	for (const row of cacheRows ?? []) {
		const c = normalizeCountry(row.country);
		if (c) countries.add(c);
	}
	let gemiAdRequests = 0;
	const gemiAdDelay = 12e3;
	let lastGemiAdRequest = 0;
	for (const provider of providers) {
		const isGemiAd = provider.slug === "gemiad";
		for (const country of countries) try {
			if (!force) {
				const existing = await readCacheRow(provider.id, country);
				if (existing && new Date(existing.expires_at).getTime() > Date.now()) continue;
			}
			if (isGemiAd) {
				const timeSinceLastRequest = Date.now() - lastGemiAdRequest;
				if (timeSinceLastRequest < gemiAdDelay && gemiAdRequests > 0) {
					const waitTime = gemiAdDelay - timeSinceLastRequest;
					await new Promise((resolve) => setTimeout(resolve, waitTime));
				}
				lastGemiAdRequest = Date.now();
				gemiAdRequests++;
			}
			const list = await refreshProviderCountry(provider, country, settings);
			summary.refreshed.push({
				provider: provider.slug,
				country,
				count: list.length
			});
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "refresh failed";
			if (!await readCacheRow(provider.id, country)) {
				const expiresAt = new Date(Date.now() + Math.max(1, settings.refreshIntervalHours) * 60 * 60 * 1e3).toISOString();
				await supabaseAdmin.from("offer_feed_cache").insert({
					provider_id: provider.id,
					country,
					offers: [],
					offer_count: 0,
					last_synced_at: (/* @__PURE__ */ new Date()).toISOString(),
					expires_at: expiresAt,
					sync_error: errorMessage
				});
			} else await supabaseAdmin.from("offer_feed_cache").update({ sync_error: errorMessage }).eq("provider_id", provider.id).eq("country", country);
			summary.errors.push({
				provider: provider.slug,
				country,
				message: errorMessage
			});
		}
	}
	return summary;
}
/** Admin manual trigger: refresh one provider for one country (defaults to the default country). */
async function adminRefreshProviderImpl(providerId, country) {
	const settings = await getFeedSettingsImpl();
	const { data: provider, error } = await supabaseAdmin.from("offer_providers").select("*").eq("id", providerId).maybeSingle();
	if (error) throw error;
	if (!provider) throw new Error("Provider not found.");
	if (!provider.enabled) throw new Error("Provider is disabled.");
	const target = normalizeCountry(country) ?? settings.defaultCountry;
	const list = await refreshProviderCountry(provider, target, settings);
	clearAssembledCache();
	return {
		provider: provider.slug,
		country: target,
		count: list.length
	};
}
/** Admin read: settings + per-network automation config + cache freshness snapshot. */
async function getFeedAutomationImpl() {
	const [settings, providersRes, cacheRes] = await Promise.all([
		getFeedSettingsImpl(),
		supabaseAdmin.from("offer_providers").select("id, name, slug, enabled, sync_status, sync_error, last_synced_at, sync_config").order("name"),
		supabaseAdmin.from("offer_feed_cache").select("provider_id, country, offer_count, last_synced_at, expires_at, sync_error").order("last_synced_at", { ascending: false })
	]);
	if (providersRes.error) throw providersRes.error;
	return {
		settings,
		providers: (providersRes.data ?? []).map((p) => {
			const cfg = readNetworkFeedConfig(p.slug, p.sync_config);
			const hasAdapter = Boolean(getAdapter(p.slug));
			return {
				id: p.id,
				name: p.name,
				slug: p.slug,
				enabled: p.enabled,
				syncStatus: p.sync_status,
				syncError: p.sync_error,
				lastSyncedAt: p.last_synced_at,
				maxOffers: cfg.maxOffers,
				weight: cfg.weight,
				hasAdapter
			};
		}),
		cache: (cacheRes.data ?? []).map((c) => ({
			providerId: c.provider_id,
			country: c.country,
			offerCount: c.offer_count,
			lastSyncedAt: c.last_synced_at,
			expiresAt: c.expires_at,
			syncError: c.sync_error
		}))
	};
}
//#endregion
export { adminRefreshProviderImpl, clearAssembledCache, getFeaturedFeedImpl, getFeedAutomationImpl, getOfferByIdImpl, refreshAllFeedsImpl };
