import type { NormalizedOffer, OfferProviderAdapter } from "../provider-types";

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
const DEFAULT_FEED_URL = "https://lockerpreview.com/api/v2";

// We don't have a real per-user IP / UA during catalog sync, so fall back to
// generic, realistic values for the default country.
const DEFAULT_IP = "8.8.8.8";
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

type OgAdsOffer = {
  offerid?: string | number;
  name?: string;
  name_short?: string;
  description?: string;
  adcopy?: string;
  picture?: string;
  payout?: string | number;
  country?: string;
  device?: string;
  link?: string;
  epc?: string | number;
};

type OgAdsResponse = {
  success?: boolean;
  error?: string | null;
  offers?: OgAdsOffer[];
};

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}

function splitList(value: unknown): string[] {
  return String(value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export const ogAdsAdapter: OfferProviderAdapter = {
  slug: "ogads",
  providerType: "cpa",

  validateConfig() {
    if (!process.env["OGADS_API_KEY"]) {
      return "OGADS_API_KEY is not configured on the server.";
    }
    return null;
  },

  async fetchOffers(_provider, context) {
    const apiKey = process.env["OGADS_API_KEY"];
    if (!apiKey) throw new Error("OGADS_API_KEY is not configured on the server.");

    const url = new URL(DEFAULT_FEED_URL);
    url.searchParams.set("ip", context?.ip ?? DEFAULT_IP);
    url.searchParams.set("user_agent", DEFAULT_USER_AGENT);
    // ctype is bitwise: 1=CPI (install) + 2=CPA (action) => 3 fetches both.
    url.searchParams.set("ctype", "3");
    url.searchParams.set("max", "100");

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`OGAds feed error (${response.status}): ${text.slice(0, 200)}`);
    }

    let parsed: OgAdsResponse;
    try {
      parsed = JSON.parse(text) as OgAdsResponse;
    } catch {
      throw new Error(`OGAds feed returned non-JSON: ${text.slice(0, 200)}`);
    }

    if (parsed.success === false) {
      throw new Error(`OGAds feed error: ${parsed.error ?? "unknown error"}`);
    }

    const list = Array.isArray(parsed.offers) ? parsed.offers : [];
    if (!list.length) throw new Error("OGAds feed returned no offers.");

    const seen = new Set<string>();
    const offers: NormalizedOffer[] = [];

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
        // Shared catalog URL — per-user `&aff_sub4={userId}` is appended in the UI.
        clickUrl,
        networkPayout: Number.parseFloat(String(item.payout ?? "")) || 0,
        countries: splitList(item.country),
        devices: splitList(item.device),
        category: null,
        raw: item,
      });
    }

    return offers;
  },
};
