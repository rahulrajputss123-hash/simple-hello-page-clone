import type { NormalizedOffer, OfferCategory, OfferProviderAdapter } from "../provider-types";

/**
 * Torox Offer Feed adapter (Partner API - CPA network).
 * 
 * API: GET {TOROX_API_BASE}/partner/campaigns?source_id={ID}&token={TOKEN}&goals=all
 * Default base: https://api.wall.torox.io (staging: https://api.wall.stage.torox.io)
 * Rate limit: Up to 5s response time
 * 
 * Security:
 * - source_id and token required on every request
 * - Token is server-only (never exposed to client)
 * 
 * Click URLs:
 * - Must be generated per-user at click time via separate API call
 * - Cannot be cached or reused across users/sessions
 * - Stored as sentinel `torox://campaign/{id}` in cached offers
 * - Real URL fetched via getToroxClickUrl server function at click time
 * 
 * Fields expected (defensive mapping, as sample response not available):
 * - id | campaign_id | offer_id: Campaign identifier
 * - name | title: Display title
 * - description | desc: Offer description
 * - payout | amount | price: USD payout (number or string)
 * - image | icon | logo | creative: Image URL
 * - countries | geo | country: Array or comma-separated string
 * - devices | os | platform: Device targeting
 * - category | type | vertical: Category classification
 * - events | goals: Array of per-event payouts (for multi-step)
 */

const DEFAULT_API_BASE = "https://api.wall.torox.io";

// Torox click URLs use a sentinel pattern since they must be generated per-user
export const TOROX_CLICK_URL_SENTINEL = "torox://campaign/";

type ToroxCampaign = {
  id?: string | number;
  campaign_id?: string | number;
  offer_id?: string | number;
  name?: string;
  title?: string;
  description?: string;
  desc?: string;
  payout?: string | number;
  amount?: string | number;
  price?: string | number;
  image?: string;
  icon?: string;
  logo?: string;
  creative?: string;
  countries?: string[] | string;
  geo?: string[] | string;
  country?: string[] | string;
  devices?: string[] | string;
  os?: string[] | string;
  platform?: string[] | string;
  category?: string;
  type?: string;
  vertical?: string;
  events?: Array<{
    name?: string;
    payout?: string | number;
  }>;
  goals?: Array<{
    name?: string;
    payout?: string | number;
  }>;
};

type ToroxResponse =
  | {
      campaigns?: ToroxCampaign[];
      [key: string]: unknown;
    }
  | ToroxCampaign[]
  | unknown;

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}

function mapCategory(rawCategory: string | undefined): OfferCategory | null {
  const cat = (rawCategory ?? "").toLowerCase();
  
  // Confident matches only
  if (cat.includes("game")) return "game";
  if (cat.includes("app")) return "app_install";
  if (cat.includes("survey")) return "survey";
  if (cat.includes("sign") || cat.includes("register")) return "signup";
  if (cat.includes("click")) return "click";
  if (cat.includes("install")) return "app_install";
  
  return null;
}

function parseCountries(value: string[] | string | undefined): string[] {
  if (!value) return [];
  
  if (Array.isArray(value)) {
    return value.map((c) => String(c).trim().toUpperCase()).filter((c) => c.length > 0);
  }
  
  // Comma-separated string
  const str = String(value).trim();
  if (!str) return [];
  
  return str
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter((c) => c.length > 0);
}

function normalizeDevice(dev: string): string {
  const lower = dev.toLowerCase();
  if (lower === "desktop" || lower === "web") return "web";
  if (lower === "android") return "android";
  if (lower === "ios" || lower === "iphone" || lower === "ipad") return "ios";
  return lower;
}

function parseDevices(value: string[] | string | undefined): string[] {
  if (!value) return [];
  
  if (Array.isArray(value)) {
    return value.map((d) => normalizeDevice(String(d))).filter((d) => d.length > 0);
  }
  
  // Comma-separated string
  const str = String(value).trim();
  if (!str) return [];
  
  return str
    .split(",")
    .map((d) => normalizeDevice(d.trim()))
    .filter((d) => d.length > 0);
}

export const toroxAdapter: OfferProviderAdapter = {
  slug: "torox",
  providerType: "cpa",

  validateConfig(config) {
    const sourceId = (process.env["TOROX_FEED_SOURCE_ID"] ?? "").trim();
    const token = (process.env["TOROX_FEED_TOKEN"] ?? "").trim();

    if (!sourceId) {
      return "TOROX_FEED_SOURCE_ID environment variable is not configured.";
    }
    if (!token) {
      return "TOROX_FEED_TOKEN environment variable is not configured.";
    }
    return null;
  },

  async fetchOffers(provider, context) {
    const sourceId = (process.env["TOROX_FEED_SOURCE_ID"] ?? "").trim();
    const token = (process.env["TOROX_FEED_TOKEN"] ?? "").trim();
    const apiBase = (process.env["TOROX_API_BASE"] ?? DEFAULT_API_BASE).trim();

    if (!sourceId || !token) {
      throw new Error("TOROX_FEED_SOURCE_ID or TOROX_FEED_TOKEN not configured.");
    }

    const url = new URL(`${apiBase}/partner/campaigns`);
    url.searchParams.set("source_id", sourceId);
    url.searchParams.set("token", token);
    url.searchParams.set("goals", "all");

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(15000),
      });
    } catch (err) {
      throw new Error(
        `Torox fetch failed: ${err instanceof Error ? err.message : "network error"}`,
      );
    }

    // Handle auth errors (never include token in error message)
    if (response.status === 401 || response.status === 403) {
      throw new Error("Torox authentication failed. Check TOROX_FEED_SOURCE_ID and TOROX_FEED_TOKEN.");
    }

    if (response.status === 404) {
      throw new Error("Torox endpoint not found. Check TOROX_API_BASE configuration.");
    }

    const text = await response.text();
    if (!response.ok) {
      // Truncate error message, avoid leaking sensitive data
      throw new Error(`Torox API error (${response.status}): ${text.slice(0, 300)}`);
    }

    let parsed: ToroxResponse;
    try {
      parsed = JSON.parse(text) as ToroxResponse;
    } catch {
      throw new Error(`Torox returned non-JSON: ${text.slice(0, 300)}`);
    }

    // Defensive: try to find campaigns array
    let campaigns: ToroxCampaign[] = [];
    
    if (Array.isArray(parsed)) {
      campaigns = parsed;
    } else if (parsed && typeof parsed === "object" && "campaigns" in parsed) {
      if (Array.isArray(parsed.campaigns)) {
        campaigns = parsed.campaigns;
      }
    }

    // If we couldn't find campaigns, throw an error with response shape for debugging
    if (!campaigns.length) {
      const keys = parsed && typeof parsed === "object" ? Object.keys(parsed).join(", ") : "none";
      throw new Error(
        `Torox API returned no recognizable campaigns. Top-level keys: ${keys}. First 300 chars: ${text.slice(0, 300)}`,
      );
    }

    const seen = new Set<string>();
    const offers: NormalizedOffer[] = [];
    const userCountry = context.country ?? "US";

    for (const item of campaigns) {
      // Try multiple field names for ID
      const externalOfferId = String(
        item.id ?? item.campaign_id ?? item.offer_id ?? "",
      ).trim();
      
      // Try multiple field names for title
      const title = String(item.name ?? item.title ?? "").trim();
      
      // Try multiple field names for payout
      const payoutRaw = item.payout ?? item.amount ?? item.price ?? 0;
      const payout = Number.parseFloat(String(payoutRaw)) || 0;

      // Skip invalid offers
      if (!externalOfferId || !title || payout <= 0) continue;
      if (seen.has(externalOfferId)) continue;
      seen.add(externalOfferId);

      // Try multiple field names for description
      const description = stripHtml(String(item.description ?? item.desc ?? "").trim());

      // Try multiple field names for image
      const icon = String(
        item.image ?? item.icon ?? item.logo ?? item.creative ?? "",
      ).trim();

      // Parse countries (empty or 'ALL' = everywhere)
      const countriesRaw = item.countries ?? item.geo ?? item.country;
      const countries = parseCountries(countriesRaw);
      
      // Filter by user country if countries are specified
      if (countries.length > 0) {
        const hasAll = countries.some((c) => c === "ALL" || c === "*");
        const hasUserCountry = countries.includes(userCountry.toUpperCase());
        if (!hasAll && !hasUserCountry) continue;
      }

      // Parse devices
      const devicesRaw = item.devices ?? item.os ?? item.platform;
      const devices = parseDevices(devicesRaw);

      // Parse category (confident matches only)
      const categoryRaw = item.category ?? item.type ?? item.vertical;
      const category = mapCategory(categoryRaw);

      // Extract requirements from events/goals
      const eventsArray = item.events ?? item.goals ?? [];
      const requirements = eventsArray
        .map((evt) => stripHtml(String(evt.name ?? "").trim()))
        .filter((name) => name.length > 0)
        .join(" → ");

      // Calculate total payout for multi-event campaigns
      let totalPayout = payout;
      if (eventsArray.length > 0) {
        const eventPayouts = eventsArray
          .map((evt) => Number.parseFloat(String(evt.payout ?? 0)))
          .filter((p) => !isNaN(p) && p > 0);
        if (eventPayouts.length > 0) {
          totalPayout = Math.max(payout, ...eventPayouts, eventPayouts.reduce((sum, p) => sum + p, 0));
        }
      }

      // Click URL sentinel (real URL generated per-user at click time)
      const clickUrl = `${TOROX_CLICK_URL_SENTINEL}${externalOfferId}`;

      offers.push({
        externalOfferId,
        title,
        description,
        requirements,
        icon,
        clickUrl,
        networkPayout: totalPayout,
        countries,
        devices,
        category,
        raw: item,
      });
    }

    if (!offers.length) {
      throw new Error("Torox API returned campaigns but none passed filtering.");
    }

    return offers;
  },
};
