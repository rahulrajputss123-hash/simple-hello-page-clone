import type { NormalizedOffer, OfferProvider, OfferProviderAdapter, OfferCategory } from "../provider-types";

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
    feedUrl: typeof cfg["feed_url"] === "string" && cfg["feed_url"] ? cfg["feed_url"] : DEFAULT_FEED_URL,
    userId: String(cfg["user_id"] ?? "788820"),
    s1: typeof cfg["s1"] === "string" ? cfg["s1"] : "",
    s2: typeof cfg["s2"] === "string" ? cfg["s2"] : "",
  };
}

export const adblueMediaAdapter: OfferProviderAdapter = {
  slug: "adbluemedia",
  providerType: "cpa",

  validateConfig() {
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
        ? ((parsed as { offers: FeedOffer[] }).offers)
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
        category: categoryFromAdblueId(item.category_id ?? null),
        raw: item,
      });
    }

    return offers;
  },
};

/**
 * AdBlueMedia's numeric `category_id` mapped to our internal category enum.
 * The exact mapping should be verified against their publisher dashboard;
 * values below are best-guess and can be adjusted without a code redeploy
 * (admin can also override each offer's category via the Admin form).
 *
 * Unknown ids → null so the offer stays "uncategorized" (still shown under
 * "All Offers") rather than being tagged inaccurately.
 */
const ADBLUEMEDIA_CATEGORY_MAP: Record<string, OfferCategory | undefined> = {
  "1": "App Install",
  "2": "Survey",
  "3": "Trial",
  "4": "Trial",       // Sign-up / registration
  "5": "Deals",
  "6": "Games",
  "7": "Link Locker",
  "8": "Shortlink",
  "9": "Deals",
};

function categoryFromAdblueId(raw: string | null): OfferCategory | null {
  if (!raw) return null;
  return ADBLUEMEDIA_CATEGORY_MAP[String(raw).trim()] ?? null;
}
