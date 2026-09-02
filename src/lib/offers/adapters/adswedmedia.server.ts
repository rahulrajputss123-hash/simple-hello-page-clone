import type { NormalizedOffer, OfferProviderAdapter, OfferCategory } from "../provider-types";

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
const FEED_URL = "https://adswedmedia.com/api/v1/offers";
const IMAGE_PREFIX = "https://adswedmedia.com/asset/images/offers/";

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 60 minutes
const callTimestamps: number[] = [];

/** Sliding-window guard: throws before exceeding 20 calls / 60 minutes. */
function enforceRateLimit() {
  const now = Date.now();
  while (callTimestamps.length && now - callTimestamps[0]! > RATE_WINDOW_MS) {
    callTimestamps.shift();
  }
  if (callTimestamps.length >= RATE_LIMIT) {
    throw new Error("AdswedMedia rate limit reached (max 20 requests per 60 minutes).");
  }
  callTimestamps.push(now);
}

type AdswedMediaOffer = {
  id?: string | number;
  title?: string;
  description?: string;
  image?: string;
  payout?: number | string;
  categories?: string[] | string | null;
  countries?: string[] | string | null;
  devices?: string[] | string | null;
  url?: string;
  events?: unknown;
};

type AdswedMediaResponse = {
  success?: boolean;
  // Live API returns a flat array; the documented shape nests under `data`.
  offers?: AdswedMediaOffer[] | { data?: AdswedMediaOffer[] };
};

/** "All" → ["all"]; a real array is passed through; anything else → []. */
function normalizeList(value: string[] | string | null | undefined): string[] {
  if (typeof value === "string") return value.trim().toLowerCase() === "all" ? ["all"] : [];
  return Array.isArray(value) ? value : [];
}

export const adswedMediaAdapter: OfferProviderAdapter = {
  slug: "adswedmedia",
  providerType: "cpa",

  validateConfig() {
    if (!process.env["ADSWEDMEDIA_SITE_KEY"] || !process.env["ADSWEDMEDIA_SITE_SECRET"]) {
      return "ADSWEDMEDIA_SITE_KEY and ADSWEDMEDIA_SITE_SECRET must be configured on the server.";
    }
    return null;
  },

  async fetchOffers() {
    const siteKey = process.env["ADSWEDMEDIA_SITE_KEY"];
    const siteSecret = process.env["ADSWEDMEDIA_SITE_SECRET"];
    if (!siteKey || !siteSecret) {
      throw new Error("ADSWEDMEDIA_SITE_KEY and ADSWEDMEDIA_SITE_SECRET must be configured on the server.");
    }

    enforceRateLimit();

    const url = new URL(FEED_URL);
    url.searchParams.set("site_key", siteKey);
    url.searchParams.set("site_secret", siteSecret);

    const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`AdswedMedia feed error (${response.status}): ${text.slice(0, 200)}`);
    }

    let parsed: AdswedMediaResponse;
    try {
      parsed = JSON.parse(text) as AdswedMediaResponse;
    } catch {
      throw new Error(`AdswedMedia feed returned non-JSON: ${text.slice(0, 200)}`);
    }

    if (parsed.success === false) {
      throw new Error("AdswedMedia feed returned success=false.");
    }

    // Accept both the live flat-array shape and the documented { offers: { data } } shape.
    const off = parsed.offers;
    const list: AdswedMediaOffer[] = Array.isArray(off)
      ? off
      : Array.isArray((off as { data?: AdswedMediaOffer[] })?.data)
        ? (off as { data: AdswedMediaOffer[] }).data
        : [];
    if (!list.length) throw new Error("AdswedMedia feed returned no offers.");

    const seen = new Set<string>();
    const offers: NormalizedOffer[] = [];

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
        // `image` is a bare filename — prefix with the offers asset path.
        icon: item.image ? `${IMAGE_PREFIX}${item.image}` : "gift",
        // The site PUBLIC-KEY is a static constant, substituted here (server-side,
        // where the site key env exists). The per-user "USER_ID_HERE" placeholder
        // is substituted at click time in click-url.ts.
        clickUrl: clickUrl.split("PUBLIC-KEY").join(siteKey),
        networkPayout: typeof item.payout === "number" ? item.payout : Number.parseFloat(String(item.payout ?? "")) || 0,
        countries: normalizeList(item.countries),
        devices: normalizeList(item.devices),
        category: (categories[0] ?? null) as OfferCategory | null,
        // Keep the multireward events array untouched for future use.
        raw: item,
      });
    }

    return offers;
  },
};
