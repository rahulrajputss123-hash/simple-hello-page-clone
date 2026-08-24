import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Global + per-network configuration for offer-feed automation. */

export type FallbackBehavior = "none" | "default_country";

export type FeedSettings = {
  refreshIntervalHours: number;
  defaultCountry: string;
  fallbackBehavior: FallbackBehavior;
  featuredSlots: number;
};

const DEFAULTS: FeedSettings = {
  refreshIntervalHours: 5,
  defaultCountry: "US",
  fallbackBehavior: "default_country",
  featuredSlots: 3,
};

export async function getFeedSettingsImpl(): Promise<FeedSettings> {
  const { data, error } = await supabaseAdmin
    .from("offer_feed_settings")
    .select("refresh_interval_hours, default_country, fallback_behavior, featured_slots")
    .eq("id", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { ...DEFAULTS };
  return {
    refreshIntervalHours: Number(data.refresh_interval_hours) || DEFAULTS.refreshIntervalHours,
    defaultCountry: (data.default_country || DEFAULTS.defaultCountry).toUpperCase(),
    fallbackBehavior: (data.fallback_behavior as FallbackBehavior) ?? DEFAULTS.fallbackBehavior,
    featuredSlots: Number(data.featured_slots) || DEFAULTS.featuredSlots,
  };
}

export async function updateFeedSettingsImpl(input: {
  refreshIntervalHours: number;
  defaultCountry: string;
  fallbackBehavior: FallbackBehavior;
  featuredSlots: number;
}): Promise<FeedSettings> {
  const row = {
    id: true,
    refresh_interval_hours: input.refreshIntervalHours,
    default_country: input.defaultCountry.trim().toUpperCase(),
    fallback_behavior: input.fallbackBehavior,
    featured_slots: input.featuredSlots,
  };
  const { error } = await supabaseAdmin
    .from("offer_feed_settings")
    .upsert(row as never, { onConflict: "id" });
  if (error) throw error;
  return getFeedSettingsImpl();
}

/** Per-network automation knobs live inside offer_providers.sync_config (jsonb). */
export type NetworkFeedConfig = {
  /** Max offers to pull from this network (also bounded by the network's own API cap). */
  maxOffers: number;
  /** Ranking weight — score = weight * reward_amount. */
  weight: number;
};

// AdBlueMedia's multi-offer feed maxes at 10; keep a safe hard cap per network here.
const NETWORK_HARD_CAP: Record<string, number> = { adbluemedia: 10 };
const GLOBAL_HARD_CAP = 50;

export function readNetworkFeedConfig(
  slug: string,
  syncConfig: Record<string, unknown> | null | undefined,
): NetworkFeedConfig {
  const cfg = (syncConfig ?? {}) as Record<string, unknown>;
  const hardCap = NETWORK_HARD_CAP[slug] ?? GLOBAL_HARD_CAP;
  const rawMax = Number(cfg["max_offers"]);
  const maxOffers = Number.isFinite(rawMax) && rawMax > 0 ? Math.min(Math.floor(rawMax), hardCap) : hardCap;
  const rawWeight = Number(cfg["weight"]);
  const weight = Number.isFinite(rawWeight) && rawWeight > 0 ? rawWeight : 1;
  return { maxOffers, weight };
}

export function networkHardCap(slug: string): number {
  return NETWORK_HARD_CAP[slug] ?? GLOBAL_HARD_CAP;
}

/** Merge automation knobs into an existing provider's sync_config without clobbering other keys. */
export async function updateNetworkFeedSettingsImpl(input: {
  providerId: string;
  enabled: boolean;
  maxOffers: number;
  weight: number;
}) {
  const { data: provider, error } = await supabaseAdmin
    .from("offer_providers")
    .select("id, slug, sync_config")
    .eq("id", input.providerId)
    .maybeSingle();
  if (error) throw error;
  if (!provider) throw new Error("Provider not found.");

  const hardCap = networkHardCap(provider.slug);
  const maxOffers = Math.min(Math.max(1, Math.floor(input.maxOffers)), hardCap);
  const weight = input.weight > 0 ? input.weight : 1;

  const nextConfig = {
    ...((provider.sync_config ?? {}) as Record<string, unknown>),
    max_offers: maxOffers,
    weight,
  };

  const { error: updateError } = await supabaseAdmin
    .from("offer_providers")
    .update({ enabled: input.enabled, sync_config: nextConfig as never })
    .eq("id", input.providerId);
  if (updateError) throw updateError;
  return { ok: true, maxOffers, weight, enabled: input.enabled };
}
