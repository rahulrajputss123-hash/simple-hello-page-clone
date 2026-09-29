import type {
  NormalizedOffer,
  OfferProvider,
  OfferProviderAdapter,
  OfferCategory,
} from "../provider-types";

/**
 * Affike offerwall feed adapter.
 * Endpoint: https://affike.com/api/offerwall/offers?api_key={api_key}
 * Response shape:
 *   { offers: [{ id, name, description, image, category, payoutAmount,
 *                publisherCutPercent, countries, devices, epc, popularity,
 *                conversionEvents }] }
 *
 * Affike does NOT return a direct click URL — the per-user redirect is built at
 * click time in src/lib/offers/click-url.ts, so clickUrl is left empty here.
 */
const FEED_URL = "https://affike.com/api/offerwall/offers";

type AffikeOffer = {
  id?: string | number;
  name?: string;
  description?: string;
  image?: string;
  category?: string;
  payoutAmount?: string | number;
  publisherCutPercent?: string | number;
  countries?: (string | null)[] | null;
  devices?: string[] | null;
  epc?: string | number;
  popularity?: number;
  conversionEvents?: unknown;
};

function num(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** null / any-null countries → ["all"]; otherwise pass the array through. */
function normalizeCountries(raw: (string | null)[] | null | undefined): string[] {
  if (!Array.isArray(raw) || raw.length === 0) return ["all"];
  if (raw.some((c) => c == null)) return ["all"];
  return raw as string[];
}

/**
 * Only http(s) URLs go in `icon` — that value is written straight to the offers
 * table, so an inline base64 blob must never land there.
 */
function iconFromImage(image: string | null | undefined): string | undefined {
  return typeof image === "string" && image.startsWith("http") ? image : undefined;
}

/**
 * Affike sends roughly 11% of its catalogue with the artwork inline as a base64
 * data URI rather than a URL. Those used to be discarded, so those offers fell
 * back to the generic icon.
 *
 * They are now surfaced separately and uploaded to Storage by the sync layer
 * (materializeInlineOfferImages), which stores only the resulting public URL.
 */
function inlineImageFrom(image: string | null | undefined): string | undefined {
  return typeof image === "string" && /^data:image\//i.test(image.trim())
    ? image.trim()
    : undefined;
}

export const affikeAdapter: OfferProviderAdapter = {
  slug: "affike",
  providerType: "cpa",

  validateConfig(config) {
    const apiKey = config?.["api_key"];
    if (!apiKey || typeof apiKey !== "string") {
      return "Affike sync_config.api_key is not configured.";
    }
    return null;
  },

  async fetchOffers(
    provider: OfferProvider,
    context?: import("../provider-types").OfferFetchContext,
  ) {
    const cfg = (provider.sync_config ?? {}) as Record<string, unknown>;
    const apiKey = typeof cfg["api_key"] === "string" ? (cfg["api_key"] as string) : "";
    if (!apiKey) throw new Error("Affike sync_config.api_key is not configured.");

    const url = new URL(FEED_URL);
    url.searchParams.set("api_key", apiKey);

    const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Affike feed error (${response.status}): ${text.slice(0, 200)}`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`Affike feed returned non-JSON: ${text.slice(0, 200)}`);
    }

    const list: AffikeOffer[] = Array.isArray((parsed as { offers?: AffikeOffer[] })?.offers)
      ? (parsed as { offers: AffikeOffer[] }).offers
      : [];

    if (!list.length) throw new Error("Affike feed returned no offers.");

    const seen = new Set<string>();
    const offers: NormalizedOffer[] = [];

    for (const item of list) {
      const externalOfferId = String(item.id ?? "").trim();
      const title = String(item.name ?? "").trim();
      if (!externalOfferId || !title) continue;
      if (seen.has(externalOfferId)) continue;
      seen.add(externalOfferId);

      const icon = iconFromImage(item.image);
      const imageDataUri = inlineImageFrom(item.image);

      offers.push({
        externalOfferId,
        title,
        description: String(item.description ?? "").trim(),
        // `icon` holds only real http(s) URLs.
        ...(icon ? { icon } : {}),
        // Inline base64 artwork, uploaded to Storage once per offer during sync.
        ...(imageDataUri ? { imageDataUri } : {}),
        // No direct click URL from Affike — built per-user at click time.
        clickUrl: "",
        networkPayout: num(item.payoutAmount),
        countries: normalizeCountries(item.countries),
        devices: Array.isArray(item.devices) ? (item.devices as string[]) : [],
        // Affike returns "web" / "app"; passed through (not persisted by the sync upsert).
        category: (item.category ?? null) as OfferCategory | null,
        raw: item,
      });
    }

    // Geo-filter: keep offers eligible for the requested country.
    // Uses the normalizeCountries() output already stored in each offer's .countries:
    //   - ["all"]      → eligible everywhere (normalizeCountries maps empty/null to ["all"])
    //   - ["AU"]       → eligible only in Australia
    // If context.country is absent, skip filtering (full catalog fallback).
    if (context?.country) {
      const target = context.country.toUpperCase();
      return offers.filter((o) => {
        const c = o.countries ?? [];
        return (
          c.length === 0 ||
          c.some((code) => code.toUpperCase() === "ALL") ||
          c.some((code) => code.toUpperCase() === target)
        );
      });
    }

    return offers;
  },
};
