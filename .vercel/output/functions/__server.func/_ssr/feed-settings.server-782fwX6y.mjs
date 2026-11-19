import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/feed-settings.server-782fwX6y.js
init_client_server();
/** Global + per-network configuration for offer-feed automation. */
var _feedSettingsCache = null;
var SETTINGS_CACHE_TTL_MS = 6e4;
var DEFAULTS = {
	refreshIntervalHours: 5,
	defaultCountry: "US",
	fallbackBehavior: "default_country",
	featuredSlots: 3
};
async function getFeedSettingsImpl() {
	if (_feedSettingsCache && _feedSettingsCache.expires > Date.now()) return _feedSettingsCache.data;
	const { data, error } = await supabaseAdmin.from("offer_feed_settings").select("refresh_interval_hours, default_country, fallback_behavior, featured_slots").eq("id", true).maybeSingle();
	if (error) throw error;
	const settings = !data ? { ...DEFAULTS } : {
		refreshIntervalHours: Number(data.refresh_interval_hours) || DEFAULTS.refreshIntervalHours,
		defaultCountry: (data.default_country || DEFAULTS.defaultCountry).toUpperCase(),
		fallbackBehavior: data.fallback_behavior ?? DEFAULTS.fallbackBehavior,
		featuredSlots: Number(data.featured_slots) || DEFAULTS.featuredSlots
	};
	_feedSettingsCache = {
		data: settings,
		expires: Date.now() + SETTINGS_CACHE_TTL_MS
	};
	return settings;
}
async function updateFeedSettingsImpl(input) {
	const row = {
		id: true,
		refresh_interval_hours: input.refreshIntervalHours,
		default_country: input.defaultCountry.trim().toUpperCase(),
		fallback_behavior: input.fallbackBehavior,
		featured_slots: input.featuredSlots
	};
	const { error } = await supabaseAdmin.from("offer_feed_settings").upsert(row, { onConflict: "id" });
	if (error) throw error;
	_feedSettingsCache = null;
	return getFeedSettingsImpl();
}
var NETWORK_HARD_CAP = { adbluemedia: 10 };
var GLOBAL_HARD_CAP = 50;
function readNetworkFeedConfig(slug, syncConfig) {
	const cfg = syncConfig ?? {};
	const hardCap = NETWORK_HARD_CAP[slug] ?? GLOBAL_HARD_CAP;
	const rawMax = Number(cfg["max_offers"]);
	const maxOffers = Number.isFinite(rawMax) && rawMax > 0 ? Math.min(Math.floor(rawMax), hardCap) : hardCap;
	const rawWeight = Number(cfg["weight"]);
	return {
		maxOffers,
		weight: Number.isFinite(rawWeight) && rawWeight > 0 ? rawWeight : 1
	};
}
function networkHardCap(slug) {
	return NETWORK_HARD_CAP[slug] ?? GLOBAL_HARD_CAP;
}
/** Merge automation knobs into an existing provider's sync_config without clobbering other keys. */
async function updateNetworkFeedSettingsImpl(input) {
	const { data: provider, error } = await supabaseAdmin.from("offer_providers").select("id, slug, sync_config").eq("id", input.providerId).maybeSingle();
	if (error) throw error;
	if (!provider) throw new Error("Provider not found.");
	const hardCap = networkHardCap(provider.slug);
	const maxOffers = Math.min(Math.max(1, Math.floor(input.maxOffers)), hardCap);
	const weight = input.weight > 0 ? input.weight : 1;
	const nextConfig = {
		...provider.sync_config ?? {},
		max_offers: maxOffers,
		weight
	};
	const { error: updateError } = await supabaseAdmin.from("offer_providers").update({
		enabled: input.enabled,
		sync_config: nextConfig
	}).eq("id", input.providerId);
	if (updateError) throw updateError;
	const feedCacheModule = await import("./feed-cache.server-CY3cPWq8.mjs");
	feedCacheModule._enabledProvidersCache = null;
	return {
		ok: true,
		maxOffers,
		weight,
		enabled: input.enabled
	};
}
//#endregion
export { getFeedSettingsImpl, readNetworkFeedConfig, updateFeedSettingsImpl, updateNetworkFeedSettingsImpl };
