import type {
  NormalizedOffer,
  OfferFetchContext,
  OfferProviderAdapter,
  OfferCategory,
} from "../provider-types";

/**
 * Revtoo CPA offer feed adapter.
 * Endpoint: GET https://revtoo.com/api/offers/
 * Params: api_key, countries, user_id, limit, page
 *
 * Response shape:
 *   { success, status, reward_value, reward_name, reward_round, total_offers,
 *     shown_offers, offers: [...], pagination }
 *
 * NOTE on per-user tracking:
 * Revtoo embeds whatever string you pass as `user_id` verbatim into every
 * offer's `url` field in the response. Because fetchOffers runs once per
 * country and the resulting clickUrl is cached and shared across all users
 * (see feed-cache.server.ts), we CANNOT pass a real user id here.
 *
 * Instead we embed REVTOO_USER_ID_PLACEHOLDER as the user_id param. The
 * placeholder is then replaced with the real user id at click time in
 * click-url.ts — the same pattern used by the "adswedmedia" adapter.
 */
export const REVTOO_USER_ID_PLACEHOLDER = "REVTOO_USER_ID_PLACEHOLDER";

const REVTOO_API_URL = "https://revtoo.com/api/offers/";

type RevtooOffer = {
  id?: string | number;
  title?: string;
  description?: string;
  payout?: number | string;
  reward?: number | string;
  url?: string;
  image?: string;
  category?: string;
  countries?: string[];
  os?: string[];
  hasEvents?: boolean;
  featured?: boolean;
  timestamp?: string;
  events?: unknown;
};

type RevtooResponse = {
  success?: boolean;
  status?: number;
  total_offers?: number;
  shown_offers?: number;
  offers?: RevtooOffer[];
  pagination?: unknown;
};

/**
 * Parse payout/reward into a number.
 * Returns null when the value is the literal "*" (variable payout).
 */
function parsePayout(value: unknown): number | null {
  if (value === "*") return null;
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Map Revtoo's category string to our internal OfferCategory enum.
 * Only "survey" has a confirmed mapping; all other strings map to null
 * (uncategorised) rather than guessing. Verify against a real API response.
 */
function mapCategory(raw: string | undefined): OfferCategory | null {
  if (!raw) return null;
  switch (raw.toLowerCase()) {
    case "survey":
      return "Survey";
    default:
      return null;
  }
}

export const revtooAdapter: OfferProviderAdapter = {
  slug: "revtoo",
  providerType: "cpa",

  validateConfig() {
    if (!process.env["REVTOO_API_KEY"]) {
      return "REVTOO_API_KEY is not configured on the server.";
    }
    return null;
  },

  async fetchOffers(_provider, context?: OfferFetchContext): Promise<NormalizedOffer[]> {
    const apiKey = process.env["REVTOO_API_KEY"];
    if (!apiKey) throw new Error("REVTOO_API_KEY is not configured on the server.");

    const url = new URL(REVTOO_API_URL);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("user_id", REVTOO_USER_ID_PLACEHOLDER);
    if (context?.country) url.searchParams.set("countries", context.country);
    // Leave limit and page empty to use Revtoo defaults (full feed).

    const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Revtoo feed error (${response.status}): ${text.slice(0, 200)}`);
    }

    let parsed: RevtooResponse;
    try {
      parsed = JSON.parse(text) as RevtooResponse;
    } catch {
      throw new Error(`Revtoo feed returned non-JSON: ${text.slice(0, 200)}`);
    }

    const list = Array.isArray(parsed.offers) ? parsed.offers : [];
    if (!list.length) throw new Error("Revtoo feed returned no offers.");

    const seen = new Set<string>();
    const offers: NormalizedOffer[] = [];

    for (const item of list) {
      const externalOfferId = String(item.id ?? "").trim();
      const clickUrl = String(item.url ?? "").trim();
      const title = String(item.title ?? "").trim();

      // Skip offers missing required fields.
      if (!externalOfferId || !clickUrl || !title) continue;
      // Dedupe by externalOfferId.
      if (seen.has(externalOfferId)) continue;
      seen.add(externalOfferId);

      // Prefer payout; fall back to reward. Either may be "*" (variable).
      const payoutRaw = item.payout ?? item.reward;
      const payoutValue = parsePayout(payoutRaw);
      const isVariable = payoutValue === null;

      offers.push({
        externalOfferId,
        title,
        description: String(item.description ?? "").trim() || undefined,
        requirements: isVariable ? "Variable payout" : undefined,
        icon: String(item.image ?? "").trim() || undefined,
        // Shared catalog URL — REVTOO_USER_ID_PLACEHOLDER is replaced with the
        // real user id at click time in click-url.ts (appendAffSub4).
        clickUrl,
        networkPayout: isVariable ? 0 : payoutValue,
        countries: Array.isArray(item.countries)
          ? item.countries.map((c) => String(c).toUpperCase())
          : undefined,
        devices: Array.isArray(item.os) ? item.os.map((o) => String(o)) : undefined,
        isFeatured: item.featured === true,
        category: mapCategory(item.category),
        raw: item,
      });
    }

    return offers;
  },
};

export default revtooAdapter;
