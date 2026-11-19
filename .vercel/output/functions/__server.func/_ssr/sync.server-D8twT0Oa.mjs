import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
import { n as getAdapter, t as computeUserReward } from "./provider-types-CWlnFcSy.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sync.server-D8twT0Oa.js
init_client_server();
var OFFER_CATEGORIES = [
	"App Install",
	"Trial",
	"Deals",
	"Survey",
	"Games",
	"Link Locker",
	"Shortlink"
];
function toRow(provider, offer, seenAt) {
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
		countries: offer.countries ?? [],
		devices: offer.devices ?? [],
		expires_at: offer.expiresAt ?? null,
		is_featured: offer.isFeatured ?? false,
		is_active: true,
		sort_order: offer.sortOrder ?? 0,
		last_seen_at: seenAt,
		category,
		raw_payload: offer.raw ?? null
	};
}
/**
* Generic sync engine — provider-agnostic. Fetches through the registered adapter,
* upserts on (provider_id, external_offer_id) and deactivates offers that
* disappeared from the feed. Does nothing unless an adapter exists and is enabled.
*/
async function syncProviderImpl(providerId) {
	const { data: provider, error } = await supabaseAdmin.from("offer_providers").select("*").eq("id", providerId).maybeSingle();
	if (error) throw error;
	if (!provider) throw new Error("Provider not found");
	if (!provider.enabled) throw new Error("Provider is disabled");
	const adapter = getAdapter(provider.slug);
	if (!adapter) throw new Error(`No adapter registered for provider "${provider.slug}"`);
	const configError = adapter.validateConfig?.(provider.sync_config ?? {});
	if (configError) throw new Error(configError);
	await supabaseAdmin.from("offer_providers").update({
		sync_status: "syncing",
		sync_error: null
	}).eq("id", provider.id);
	const seenAt = (/* @__PURE__ */ new Date()).toISOString();
	try {
		const offers = await adapter.fetchOffers(provider);
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
		const rows = offers.map((o) => {
			const row = toRow(provider, o, seenAt);
			const flags = manualFlags.get(o.externalOfferId);
			if (flags?.categoryManual) delete row["category"];
			if (flags?.tagsManual) delete row["tags"];
			return row;
		});
		if (rows.length) {
			const { error: upsertError } = await supabaseAdmin.from("offers").upsert(rows, { onConflict: "provider_id,external_offer_id" });
			if (upsertError) throw upsertError;
		}
		const { data: stale, error: staleError } = await supabaseAdmin.from("offers").update({ is_active: false }).eq("provider_id", provider.id).eq("source", "network").eq("is_active", true).or(`last_seen_at.is.null,last_seen_at.lt.${seenAt}`).select("id");
		if (staleError) throw staleError;
		await supabaseAdmin.from("offer_providers").update({
			sync_status: "ok",
			sync_error: null,
			last_synced_at: seenAt
		}).eq("id", provider.id);
		return {
			provider: provider.slug,
			fetched: offers.length,
			upserted: rows.length,
			deactivated: stale?.length ?? 0
		};
	} catch (err) {
		let message = "Sync failed";
		if (err instanceof Error) message = err.message;
		else if (err && typeof err === "object") {
			const obj = err;
			const parts = [];
			if (obj.message) parts.push(String(obj.message));
			if (obj.details) parts.push(`Details: ${String(obj.details)}`);
			if (obj.hint) parts.push(`Hint: ${String(obj.hint)}`);
			if (obj.code) parts.push(`Code: ${String(obj.code)}`);
			if (parts.length) message = parts.join(". ");
		}
		await supabaseAdmin.from("offer_providers").update({
			sync_status: "error",
			sync_error: message
		}).eq("id", provider.id);
		throw new Error(message);
	}
}
async function listProvidersImpl() {
	const { data, error } = await supabaseAdmin.from("offer_providers").select("*").order("name");
	if (error) throw error;
	return data;
}
async function upsertProviderImpl(input) {
	const row = {
		name: input.name,
		slug: input.slug,
		provider_type: input.providerType,
		enabled: input.enabled,
		sync_config: input.syncConfig,
		default_revenue_share: input.defaultRevenueShare
	};
	const { data, error } = await (input.id ? supabaseAdmin.from("offer_providers").update(row).eq("id", input.id).select("*").single() : supabaseAdmin.from("offer_providers").insert(row).select("*").single());
	if (error) throw error;
	return data;
}
//#endregion
export { listProvidersImpl, syncProviderImpl, upsertProviderImpl };
