// Provider-agnostic types shared by client and server.
// No real network provider is implemented — this is the contract adapters must satisfy.

export type OfferSource = "manual" | "network";

export type ProviderType = "offerwall" | "cpa" | "cpi" | "survey" | "other";

export type ProviderSyncStatus = "idle" | "syncing" | "ok" | "error";

export type OfferProvider = {
  id: string;
  name: string;
  slug: string;
  provider_type: ProviderType | string;
  enabled: boolean;
  sync_config: Record<string, unknown>;
  sync_status: string;
  sync_error: string | null;
  default_revenue_share: number;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OfferCategory =
  | "App Install"
  | "Trial"
  | "Deals"
  | "Survey"
  | "Games"
  | "Link Locker"
  | "Shortlink";

export const OFFER_CATEGORIES: OfferCategory[] = [
  "App Install",
  "Trial",
  "Deals",
  "Survey",
  "Games",
  "Link Locker",
  "Shortlink",
];

/** A single offer after an adapter has normalized it into our common shape. */
export type NormalizedOffer = {
  /** Provider's own offer id — used with provider_id for idempotent upserts. */
  externalOfferId: string;
  title: string;
  description?: string;
  requirements?: string;
  icon?: string;
  clickUrl: string;
  /** What the network pays us, in USD. */
  networkPayout: number;
  /** Optional per-offer override; falls back to the provider default. */
  revenueShare?: number;
  countries?: string[];
  devices?: string[];
  expiresAt?: string | null;
  isFeatured?: boolean;
  sortOrder?: number;
  /** Adapter-derived category (null when we couldn't map the provider's own id). */
  category?: OfferCategory | null;
  /** Untouched provider payload, stored for debugging / future mapping. */
  raw?: unknown;
};

/**
 * Contract for a future provider adapter. Implement one file per network later;
 * the sync engine handles upserting, deactivation and raw-data preservation.
 */
/** Optional per-request context passed to adapters (e.g. detected GEO for geo-aware feeds). */
export type OfferFetchContext = {
  /** ISO-3166 alpha-2 country code of the requesting user, when known. */
  country?: string;
};

export type OfferProviderAdapter = {
  slug: string;
  providerType: ProviderType;
  /** Fetch + normalize the provider's current catalogue. */
  fetchOffers: (provider: OfferProvider, context?: OfferFetchContext) => Promise<NormalizedOffer[]>;
  /** Optional validation of sync_config before enabling/syncing. */
  validateConfig?: (config: Record<string, unknown>) => string | null;
};

/** User reward = network payout * revenue share, rounded to cents. */
export function computeUserReward(networkPayout: number, revenueShare: number): number {
  return Math.max(0, Math.round(networkPayout * revenueShare * 100) / 100);
}

/**
 * Deterministic Featured Offers ranking. Payout alone never decides order:
 * pinned/admin priority wins, then curated sort_order, then manual over network,
 * then reward, then a stable id tiebreak.
 */
export type RankableOffer = {
  id: string;
  admin_priority?: number | null;
  sort_order?: number | null;
  source?: string | null;
  reward_amount?: number | null;
};

export function compareOffers(a: RankableOffer, b: RankableOffer): number {
  const prio = (b.admin_priority ?? 0) - (a.admin_priority ?? 0);
  if (prio !== 0) return prio;
  const sort = (a.sort_order ?? 0) - (b.sort_order ?? 0);
  if (sort !== 0) return sort;
  const src = (a.source === "manual" ? 0 : 1) - (b.source === "manual" ? 0 : 1);
  if (src !== 0) return src;
  const reward = (b.reward_amount ?? 0) - (a.reward_amount ?? 0);
  if (reward !== 0) return reward;
  return a.id.localeCompare(b.id);
}
