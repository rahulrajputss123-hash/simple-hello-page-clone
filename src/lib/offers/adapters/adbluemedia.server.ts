import type {
  NormalizedOffer,
  OfferProvider,
  OfferProviderAdapter,
  OfferCategory,
} from "../provider-types";
import { normalizeDevices } from "../normalize-devices";

/**
 * AdBlueMedia multi-offer feed adapter.
 * Endpoint returns a JSON array of offers; field mapping below matches the live response:
 * { id, name, anchor, conversion, epc, category_id, url_domain, user_payout, payout, network_icon, url }
 */
const DEFAULT_FEED_URL = "https://de6jvomfbm0af.cloudfront.net/public/offers/feed.php";

type FeedOffer = {
  id?: string | number;
  name?: string;
  anchor?: string;
  conversion?: string;
  epc?: string;
  category_id?: string;
  url_domain?: string;
  user_payout?: string | number;
  payout?: string | number;
  network_icon?: string;
  url?: string;
};

function num(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function config(provider: OfferProvider) {
  const cfg = (provider.sync_config ?? {}) as Record<string, unknown>;
  return {
    feedUrl:
      typeof cfg["feed_url"] === "string" && cfg["feed_url"] ? cfg["feed_url"] : DEFAULT_FEED_URL,
    userId: String(cfg["user_id"] ?? "788820"),
    s1: typeof cfg["s1"] === "string" ? cfg["s1"] : "",
    s2: typeof cfg["s2"] === "string" ? cfg["s2"] : "",
  };
}

export const adblueMediaAdapter: OfferProviderAdapter = {
  slug: "adbluemedia",
  providerType: "cpa",

  validateConfig(config) {
    if (!process.env["ADBLUEMEDIA_API_KEY"]) {
      return "ADBLUEMEDIA_API_KEY is not configured on the server.";
    }
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
    if (!response.ok) {
      throw new Error(`AdBlueMedia feed error (${response.status}): ${text.slice(0, 200)}`);
    }

    let parsed: unknown;
    try {
      // Tolerate a JSONP wrapper if the endpoint ever returns one.
      const jsonp = text.match(/^[^(]*\((.*)\);?\s*$/s);
      parsed = JSON.parse(jsonp?.[1] ?? text);
    } catch {
      throw new Error(`AdBlueMedia feed returned non-JSON: ${text.slice(0, 200)}`);
    }

    const list: FeedOffer[] = Array.isArray(parsed)
      ? (parsed as FeedOffer[])
      : Array.isArray((parsed as { offers?: FeedOffer[] })?.offers)
        ? (parsed as { offers: FeedOffer[] }).offers
        : [];

    if (!list.length) throw new Error("AdBlueMedia feed returned no offers.");

    const seen = new Set<string>();
    const offers: NormalizedOffer[] = [];

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
        networkPayout: num(item.payout ?? item.user_payout),
        // AdBlueMedia feed does not provide device/platform information
        devices: [],
        category: categoryFromAdblueId(item.category_id ?? null),
        raw: item,
      });
    }

    return offers;
  },
};

/**
 * AdBlueMedia's `category_id` is a 24-character hex ID (not 1-9 as initially thought).
 * Map actual hex IDs from their API to our internal categories.
 * 
 * TODO: Confirm category names from AdBlueMedia dashboard for unknown IDs.
 * Unknown ids → null (offer stays uncategorized).
 */
const ADBLUEMEDIA_CATEGORY_MAP: Record<string, OfferCategory | undefined> = {
  // TODO: Replace with actual 24-char hex IDs from database query
  // Run: psql $DATABASE_URL -f scripts/check-adbluemedia-categories.sql
  // Then map each hex ID to its category name
  
  // Example format (replace with real IDs):
  // "66f5d8e5a1b2c3d4e5f60001": "App Install",
  // "66f5d911a1b2c3d4e5f60002": "Survey",
  // "66f5d926a1b2c3d4e5f60003": "Trial",
  // "66f5d962a1b2c3d4e5f60004": "Games",
  
  // Legacy numeric IDs (kept for backward compatibility, but likely not used):
  "1": "App Install",
  "2": "Survey",
  "3": "Trial",
  "4": "Trial",
  "5": "Deals",
  "6": "Games",
  "7": "Link Locker",
  "8": "Shortlink",
  "9": "Deals",
};

// Track unmapped category IDs for debugging
const unmappedCategoryIds = new Set<string>();

function categoryFromAdblueId(raw: string | null): OfferCategory | null {
  if (!raw) return null;
  
  const trimmed = String(raw).trim();
  const category = ADBLUEMEDIA_CATEGORY_MAP[trimmed];
  
  // Log unmapped IDs (only once per ID)
  if (!category && !unmappedCategoryIds.has(trimmed)) {
    unmappedCategoryIds.add(trimmed);
    console.warn(`[AdBlueMedia] Unmapped category_id: ${trimmed} (add to ADBLUEMEDIA_CATEGORY_MAP)`);
  }
  
  return category ?? null;
}
