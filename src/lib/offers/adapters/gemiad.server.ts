import type { NormalizedOffer, OfferCategory, OfferProviderAdapter } from "../provider-types";

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

const API_BASE = "http://api.gemiwall.com/api/offers/static";

type GemiAdOffer = {
  id?: string | number;
  name?: string;
  description?: { en?: string };
  payout?: string | number;
  events?: Array<{ action?: { en?: string }; payout?: string | number }>;
  multiEvent?: boolean;
  multiComplete?: boolean;
  trackingType?: string;
  previewUrl?: string;
  video?: string;
  banner?: string;
  icon?: string;
  category?: string;
  country?: string[];
  device?: string[];
  url?: string;
  dailyCap?: number;
  epc?: string | number;
  cvr?: string | number;
};

type GemiAdResponse = {
  success?: boolean;
  error?: string;
  offers?: GemiAdOffer[];
};

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}

function mapCategory(gemiCategory: string | undefined): OfferCategory | null {
  const cat = (gemiCategory ?? "").toLowerCase();
  switch (cat) {
    case "app":
      return "app_install";
    case "web":
      return "signup";
    case "survey":
      return "survey";
    case "click":
      return "click";
    case "game":
      return "game";
    default:
      return null;
  }
}

function mapDevice(gemiDevice: string): string {
  const dev = gemiDevice.toLowerCase();
  if (dev === "desktop") return "web";
  return dev; // android, ios pass through
}

function extractRequirements(offer: GemiAdOffer): string {
  // Build requirements from events actions
  const events = offer.events ?? [];
  if (!events.length) return "";
  
  const steps = events
    .map((evt) => evt.action?.en ?? "")
    .filter((action) => action.length > 0)
    .map(stripHtml)
    .filter((action) => action.length > 0);
  
  if (!steps.length) return "";
  if (steps.length === 1 && steps[0] === "Complete the offer") return "";
  
  return steps.join(" → ");
}

export const gemiAdAdapter: OfferProviderAdapter = {
  slug: "gemiad",
  providerType: "cpa",

  validateConfig(provider) {
    const cfg = (provider.sync_config ?? {}) as Record<string, unknown>;
    const placementId = String(cfg["placement_id"] ?? "").trim();
    const apiKey = String(cfg["api_key"] ?? "").trim();

    if (!placementId) {
      return "GemiAd placement_id is not configured in sync_config.";
    }
    if (!apiKey) {
      return "GemiAd api_key is not configured in sync_config.";
    }
    return null;
  },

  async fetchOffers(provider, _context) {
    const cfg = (provider.sync_config ?? {}) as Record<string, unknown>;
    const placementId = String(cfg["placement_id"] ?? "").trim();
    const apiKey = String(cfg["api_key"] ?? "").trim();

    if (!placementId || !apiKey) {
      throw new Error("GemiAd placement_id or api_key not configured in sync_config.");
    }

    const url = new URL(API_BASE);
    url.searchParams.set("placementId", placementId);
    url.searchParams.set("apiKey", apiKey);

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
        },
      });
    } catch (err) {
      throw new Error(
        `GemiAd fetch failed: ${err instanceof Error ? err.message : "network error"}`,
      );
    }

    // Handle rate limit gracefully
    if (response.status === 429) {
      throw new Error(
        "GemiAd rate limit exceeded (5 req/min). Serving cached feed if available.",
      );
    }

    // Handle auth errors
    if (response.status === 401) {
      throw new Error("GemiAd authentication failed. Check api_key in sync_config.");
    }

    if (response.status === 404) {
      throw new Error("GemiAd placement not found. Check placement_id in sync_config.");
    }

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`GemiAd API error (${response.status}): ${text.slice(0, 200)}`);
    }

    let parsed: GemiAdResponse;
    try {
      parsed = JSON.parse(text) as GemiAdResponse;
    } catch {
      throw new Error(`GemiAd returned non-JSON: ${text.slice(0, 200)}`);
    }

    if (parsed.success === false) {
      throw new Error(`GemiAd API error: ${parsed.error ?? "unknown error"}`);
    }

    const list = Array.isArray(parsed.offers) ? parsed.offers : [];
    if (!list.length) {
      throw new Error("GemiAd API returned no offers.");
    }

    const seen = new Set<string>();
    const offers: NormalizedOffer[] = [];

    for (const item of list) {
      const externalOfferId = String(item.id ?? "").trim();
      const clickUrl = String(item.url ?? "").trim();
      const title = String(item.name ?? "").trim();
      const payout = Number.parseFloat(String(item.payout ?? "")) || 0;

      if (!externalOfferId || !clickUrl || !title || payout <= 0) continue;
      if (seen.has(externalOfferId)) continue;
      seen.add(externalOfferId);

      // Normalize countries (uppercase)
      const countries = (item.country ?? []).map((c) => c.toUpperCase());

      // Normalize devices
      const devices = (item.device ?? []).map(mapDevice);

      // Extract requirements from events
      const requirements = extractRequirements(item);

      // Use icon first, fallback to banner
      const icon = String(item.icon ?? item.banner ?? "").trim();

      // Description from description.en
      const description = String(item.description?.en ?? "").trim();

      offers.push({
        externalOfferId,
        title,
        description,
        requirements,
        icon,
        // Click URL contains [USER_ID] placeholder — left as-is for per-user replacement
        clickUrl,
        networkPayout: payout,
        countries,
        devices,
        category: mapCategory(item.category),
        raw: item,
      });
    }

    return offers;
  },
};
