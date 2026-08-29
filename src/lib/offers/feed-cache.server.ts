import { supabaseAdmin } from "@/integrations/supabase/client.server";

import { getAdapter } from "./registry.server";
import { computeUserReward, type NormalizedOffer, type OfferProvider } from "./provider-types";
import {
  getFeedSettingsImpl,
  readNetworkFeedConfig,
  type FeedSettings,
} from "./feed-settings.server";
import { normalizeCountry } from "./geo.server";

/**
 * Geo-targeted network offer cache + Featured Offers assembly.
 *
 * Design:
 *  - Network offers are upserted into `offers` (country-agnostic) so the existing claim flow
 *    keeps working unchanged (claims reference offers.id).
 *  - `offer_feed_cache` records which offer ids are fresh for each (network, country) plus a
 *    last_synced_at / expires_at window so refresh cadence is controlled per country.
 *  - Featured assembly is per user-country: admin-featured manual offers first, then network
 *    offers ranked by (network weight * reward_amount).
 */

type CachedOffer = {
  id: string;
  externalOfferId: string | null;
  title: string;
  rewardAmount: number;
  networkPayout: number | null;
};

export type FeaturedOffer = {
  id: string;
  title: string;
  description: string;
  requirements: string;
  not_allowed: string;
  icon: string;
  reward_amount: number;
  click_url: string | null;
  source: string;
  provider_id: string | null;
  is_limited_deal: boolean;
  deal_group_id: string | null;
  actual_cost: number | null;
  payout_percentage: number;
  max_payout_cap: number | null;
  payout_mode: "manual" | "manual_proof" | "auto_postback";
  category: string | null;
  tags: ("Hot" | "Trending" | "Easy" | "Popular")[];
};

function offerRowFromNormalized(provider: OfferProvider, offer: NormalizedOffer, seenAt: string) {
  const share = offer.revenueShare ?? provider.default_revenue_share;
  // NOTE: countries/devices/is_featured/sort_order/expires_at are intentionally omitted so an
  // existing offer row (possibly curated by an admin) is not clobbered on conflict update.
  return {
    source: "network",
    provider_id: provider.id,
    external_offer_id: offer.externalOfferId,
    title: offer.title,
    description: offer.description ?? "",
    requirements: offer.requirements ?? "",
    icon: offer.icon ?? "gift",
    click_url: offer.clickUrl,
    network_payout: offer.networkPayout,
    revenue_share: share,
    reward_amount: computeUserReward(offer.networkPayout, share),
    is_active: true,
    last_seen_at: seenAt,
    raw_payload: (offer.raw ?? null) as never,
  };
}

async function readCacheRow(providerId: string, country: string) {
  const { data } = await supabaseAdmin
    .from("offer_feed_cache")
    .select("offers, expires_at")
    .eq("provider_id", providerId)
    .eq("country", country)
    .maybeSingle();
  return data;
}

/**
 * Fetch this provider's feed for `country`, upsert into `offers`, and write the country cache row.
 * Bounded by the network's configured max offers. Throws on adapter/config failure.
 */
async function refreshProviderCountry(
  provider: OfferProvider,
  country: string,
  settings: FeedSettings,
): Promise<CachedOffer[]> {
  const adapter = getAdapter(provider.slug);
  if (!adapter) throw new Error(`No adapter registered for "${provider.slug}"`);

  const configError = adapter.validateConfig?.(
    (provider.sync_config ?? {}) as Record<string, unknown>,
  );
  if (configError) throw new Error(configError);

  const { maxOffers } = readNetworkFeedConfig(provider.slug, provider.sync_config);
  const seenAt = new Date().toISOString();

  // The detected country is passed through to the adapter (adapters that support a GEO param can
  // use it; AdBlueMedia's feed endpoint has no country param, so its request stays unchanged).
  const fetched = await adapter.fetchOffers(provider, { country });
  const limited = fetched.slice(0, maxOffers);

  let cached: CachedOffer[] = [];
  if (limited.length) {
    const rows = limited.map((o) => offerRowFromNormalized(provider, o, seenAt));
    const { data: upserted, error } = await supabaseAdmin
      .from("offers")
      .upsert(rows as never, { onConflict: "provider_id,external_offer_id" })
      .select("id, external_offer_id, title, reward_amount, network_payout");
    if (error) throw error;
    cached = (upserted ?? []).map((r) => ({
      id: r.id,
      externalOfferId: r.external_offer_id,
      title: r.title,
      rewardAmount: Number(r.reward_amount),
      networkPayout: r.network_payout == null ? null : Number(r.network_payout),
    }));
  }

  const expiresAt = new Date(
    Date.now() + Math.max(1, settings.refreshIntervalHours) * 60 * 60 * 1000,
  ).toISOString();

  const { error: cacheError } = await supabaseAdmin.from("offer_feed_cache").upsert(
    {
      provider_id: provider.id,
      country,
      offers: cached as never,
      offer_count: cached.length,
      last_synced_at: seenAt,
      expires_at: expiresAt,
      sync_error: null,
    } as never,
    { onConflict: "provider_id,country" },
  );
  if (cacheError) throw cacheError;

  return cached;
}

/** Serve fresh cache if valid; otherwise refresh synchronously. Falls back to stale on error. */
async function getOrRefreshProviderCountry(
  provider: OfferProvider,
  country: string,
  settings: FeedSettings,
): Promise<CachedOffer[]> {
  const existing = await readCacheRow(provider.id, country);
  const fresh = existing && new Date(existing.expires_at).getTime() > Date.now();
  if (fresh) return (existing.offers as unknown as CachedOffer[]) ?? [];

  try {
    return await refreshProviderCountry(provider, country, settings);
  } catch (err) {
    const message = err instanceof Error ? err.message : "feed refresh failed";
    // Record the error but keep serving stale offers when we have them.
    await supabaseAdmin
      .from("offer_feed_cache")
      .update({ sync_error: message } as never)
      .eq("provider_id", provider.id)
      .eq("country", country);
    if (existing?.offers) return (existing.offers as unknown as CachedOffer[]) ?? [];
    return [];
  }
}

async function enabledProviders(): Promise<OfferProvider[]> {
  const { data, error } = await supabaseAdmin
    .from("offer_providers")
    .select("*")
    .eq("enabled", true);
  if (error) throw error;
  return (data ?? []) as unknown as OfferProvider[];
}

/** Assemble the geo-targeted, ranked Featured Offers list for a given country. */
export async function assembleFeaturedImpl(
  requestedCountry: string | null,
  scope: "home" | "all",
  presetSettings?: FeedSettings,
): Promise<FeaturedOffer[]> {
  const settings = presetSettings ?? (await getFeedSettingsImpl());
  const country = normalizeCountry(requestedCountry) ?? settings.defaultCountry;

  const providers = await enabledProviders();
  const weightByProviderId = new Map(providers.map((p) => [p.id, readNetworkFeedConfig(p.slug, p.sync_config).weight]));

  // Gather network offer ids per provider for this country (refresh on miss/expiry).
  const collected = new Map<string, number>(); // offerId -> highest provider weight
  for (const provider of providers) {
    let list = await getOrRefreshProviderCountry(provider, country, settings);
    if (list.length === 0 && settings.fallbackBehavior === "default_country" && country !== settings.defaultCountry) {
      list = await getOrRefreshProviderCountry(provider, settings.defaultCountry, settings);
    }
    const weight = weightByProviderId.get(provider.id) ?? 1;
    for (const item of list) {
      collected.set(item.id, Math.max(collected.get(item.id) ?? 0, weight));
    }
  }

  // Load live offer rows (respects admin edits / active state).
  let networkOffers: FeaturedOffer[] = [];
  if (collected.size) {
    const { data } = await supabaseAdmin
      .from("offers")
      .select(
        "id, title, description, requirements, not_allowed, icon, reward_amount, click_url, source, provider_id, is_active, expires_at, is_limited_deal, deal_group_id, actual_cost, payout_percentage, max_payout_cap, payout_mode, category, category_manual, tags, tags_manual",
      )
      .in("id", [...collected.keys()])
      .eq("is_active", true);
    const now = Date.now();
    networkOffers = (data ?? [])
      .filter((o) => !o.expires_at || new Date(o.expires_at).getTime() > now)
      .map((o) => ({
        id: o.id,
        title: o.title,
        description: o.description,
        requirements: o.requirements,
        not_allowed: (o as { not_allowed?: string }).not_allowed ?? "",
        icon: o.icon,
        reward_amount: Number(o.reward_amount),
        click_url: o.click_url,
        source: o.source,
        provider_id: o.provider_id,
        is_limited_deal: Boolean((o as { is_limited_deal?: boolean }).is_limited_deal),
        deal_group_id: (o as { deal_group_id?: string | null }).deal_group_id ?? null,
        actual_cost: (o as { actual_cost?: number | null }).actual_cost ?? null,
        payout_percentage: Number((o as { payout_percentage?: number }).payout_percentage ?? 110),
        max_payout_cap: (o as { max_payout_cap?: number | null }).max_payout_cap ?? null,
        payout_mode: ((o as { payout_mode?: string }).payout_mode ?? "manual") as FeaturedOffer["payout_mode"],
        category: (o as { category?: string | null }).category ?? null,
        tags: normalizeStoredTags((o as { tags?: string[] }).tags),
        _tagsManual: Boolean((o as { tags_manual?: boolean }).tags_manual),
      }))
      .sort((a, b) => {
        const wa = collected.get(a.id) ?? 1;
        const wb = collected.get(b.id) ?? 1;
        const score = wb * b.reward_amount - wa * a.reward_amount;
        if (score !== 0) return score;
        return a.id.localeCompare(b.id);
      });
  }

  // Manual admin-"Featured" offers always rank first, filtered by country.
  const { data: manualRows } = await supabaseAdmin
    .from("offers")
    .select(
      "id, title, description, requirements, not_allowed, icon, reward_amount, click_url, source, provider_id, countries, admin_priority, sort_order, is_active, is_featured, expires_at, is_limited_deal, deal_group_id, actual_cost, payout_percentage, max_payout_cap, payout_mode, category, category_manual, tags, tags_manual",
    )
    .eq("source", "manual")
    .eq("is_featured", true)
    .eq("is_active", true)
    .order("admin_priority", { ascending: false })
    .order("sort_order", { ascending: true });

  const now = Date.now();
  const manualOffers: FeaturedOffer[] = (manualRows ?? [])
    .filter((o) => !o.expires_at || new Date(o.expires_at).getTime() > now)
    .filter((o) => {
      const countries = (o.countries ?? []) as string[];
      return countries.length === 0 || countries.includes(country);
    })
    .map((o) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      requirements: o.requirements,
      not_allowed: (o as { not_allowed?: string }).not_allowed ?? "",
      icon: o.icon,
      reward_amount: Number(o.reward_amount),
      click_url: o.click_url,
      source: o.source,
      provider_id: o.provider_id,
      is_limited_deal: Boolean((o as { is_limited_deal?: boolean }).is_limited_deal),
      deal_group_id: (o as { deal_group_id?: string | null }).deal_group_id ?? null,
      actual_cost: (o as { actual_cost?: number | null }).actual_cost ?? null,
      payout_percentage: Number((o as { payout_percentage?: number }).payout_percentage ?? 110),
      max_payout_cap: (o as { max_payout_cap?: number | null }).max_payout_cap ?? null,
      payout_mode: ((o as { payout_mode?: string }).payout_mode ?? "manual") as FeaturedOffer["payout_mode"],
      category: (o as { category?: string | null }).category ?? null,
      tags: normalizeStoredTags((o as { tags?: string[] }).tags),
      _tagsManual: Boolean((o as { tags_manual?: boolean }).tags_manual),
    }));

  const combined = [...manualOffers, ...networkOffers];
  // Overlay auto-tags for offers that don't have admin-locked tags.
  await applyAutoTags(combined);
  if (scope === "home") return combined.slice(0, settings.featuredSlots);
  return combined;
}

const KNOWN_TAGS: FeaturedOffer["tags"][number][] = ["Hot", "Trending", "Easy", "Popular"];
function normalizeStoredTags(raw: string[] | undefined | null): FeaturedOffer["tags"] {
  if (!Array.isArray(raw)) return [];
  const out: FeaturedOffer["tags"] = [];
  for (const t of raw) {
    const s = String(t);
    if ((KNOWN_TAGS as readonly string[]).includes(s)) out.push(s as FeaturedOffer["tags"][number]);
  }
  return out;
}

async function applyAutoTags(offers: (FeaturedOffer & { _tagsManual?: boolean })[]) {
  const eligible = offers.filter((o) => !o._tagsManual);
  if (!eligible.length) {
    for (const o of offers) delete o._tagsManual;
    return;
  }
  const { computeAutoTags } = await import("./tags.server");
  const map = await computeAutoTags(
    eligible.map((o) => ({
      id: o.id,
      reward_amount: Number(o.reward_amount),
      requirements: o.requirements ?? null,
      category: o.category ?? null,
    })),
  );
  for (const o of offers) {
    if (!o._tagsManual) {
      const auto = map[o.id];
      if (auto?.length) o.tags = auto;
    }
    delete o._tagsManual;
  }
}

export type FeaturedFeedResult = {
  country: string;
  offers: FeaturedOffer[];
};

export async function getFeaturedFeedImpl(
  requestedCountry: string | null,
  scope: "home" | "all",
): Promise<FeaturedFeedResult> {
  const settings = await getFeedSettingsImpl();
  const country = normalizeCountry(requestedCountry) ?? settings.defaultCountry;
  const offers = await assembleFeaturedImpl(requestedCountry, scope, settings);
  return { country, offers };
}

export type FeedRefreshSummary = {
  refreshed: { provider: string; country: string; count: number }[];
  errors: { provider: string; country: string; message: string }[];
};

/**
 * Background refresh entrypoint (called by the scheduled cron route).
 * Refreshes every enabled network for every country that has been requested at least once
 * (i.e. already present in offer_feed_cache) plus the configured default country.
 * `force` ignores the expiry window.
 */
export async function refreshAllFeedsImpl(force = false): Promise<FeedRefreshSummary> {
  const settings = await getFeedSettingsImpl();
  const providers = await enabledProviders();
  const summary: FeedRefreshSummary = { refreshed: [], errors: [] };
  if (!providers.length) return summary;

  const { data: cacheRows } = await supabaseAdmin
    .from("offer_feed_cache")
    .select("country, expires_at");
  const countries = new Set<string>([settings.defaultCountry]);
  for (const row of cacheRows ?? []) {
    const c = normalizeCountry(row.country);
    if (c) countries.add(c);
  }

  for (const provider of providers) {
    for (const country of countries) {
      try {
        if (!force) {
          const existing = await readCacheRow(provider.id, country);
          if (existing && new Date(existing.expires_at).getTime() > Date.now()) continue;
        }
        const list = await refreshProviderCountry(provider, country, settings);
        summary.refreshed.push({ provider: provider.slug, country, count: list.length });
      } catch (err) {
        summary.errors.push({
          provider: provider.slug,
          country,
          message: err instanceof Error ? err.message : "refresh failed",
        });
      }
    }
  }
  return summary;
}

/** Admin manual trigger: refresh one provider for one country (defaults to the default country). */
export async function adminRefreshProviderImpl(providerId: string, country?: string) {
  const settings = await getFeedSettingsImpl();
  const { data: provider, error } = await supabaseAdmin
    .from("offer_providers")
    .select("*")
    .eq("id", providerId)
    .maybeSingle();
  if (error) throw error;
  if (!provider) throw new Error("Provider not found.");
  if (!provider.enabled) throw new Error("Provider is disabled.");
  const target = normalizeCountry(country) ?? settings.defaultCountry;
  const list = await refreshProviderCountry(provider as unknown as OfferProvider, target, settings);
  return { provider: provider.slug, country: target, count: list.length };
}

/** Admin read: settings + per-network automation config + cache freshness snapshot. */
export async function getFeedAutomationImpl() {
  const [settings, providersRes, cacheRes] = await Promise.all([
    getFeedSettingsImpl(),
    supabaseAdmin
      .from("offer_providers")
      .select("id, name, slug, enabled, sync_status, sync_error, last_synced_at, sync_config")
      .order("name"),
    supabaseAdmin
      .from("offer_feed_cache")
      .select("provider_id, country, offer_count, last_synced_at, expires_at, sync_error")
      .order("last_synced_at", { ascending: false }),
  ]);
  if (providersRes.error) throw providersRes.error;

  const providers = (providersRes.data ?? []).map((p) => {
    const cfg = readNetworkFeedConfig(p.slug, p.sync_config as Record<string, unknown>);
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
      hasAdapter,
    };
  });

  const cache = (cacheRes.data ?? []).map((c) => ({
    providerId: c.provider_id,
    country: c.country,
    offerCount: c.offer_count,
    lastSyncedAt: c.last_synced_at,
    expiresAt: c.expires_at,
    syncError: c.sync_error,
  }));

  return { settings, providers, cache };
}
