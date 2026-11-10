import type { NormalizedOffer, OfferCategory, OfferProviderAdapter } from "../provider-types";

/**
 * Torox Offer Feed adapter (Partner API - CPA network).
 * 
 * API: GET {TOROX_API_BASE}/partner/campaigns?source_id={ID}&token={TOKEN}&goals=all
 * Default base: https://api.wall.torox.io
 * 
 * Response: Bare JSON array (also tolerates {offers:[...]} / {data:[...]})
 * Shape: { offerId, name, description, payout (USD), geos, os, image, verticalNames, events, ... }
 * 
 * Security:
 * - source_id and token required on every request
 * - Token is server-only (never exposed to client)
 * 
 * Click URLs:
 * - Must be generated per-user at click time via /partner/user/click API
 * - Cannot be cached or reused across users/sessions
 * - Stored as sentinel `torox://campaign/{offerId}` in cached offers
 * - Real URL fetched at click time by getToroxClickUrl server function
 * 
 * Gambling Exclusion:
 * - sync_config.exclude_real_money_gambling (default true)
 * - Skips offers with "casino", "gambling", "betting", or "poker" in verticalNames
 */

const DEFAULT_API_BASE = "https://api.wall.torox.io";

// Torox click URLs use a sentinel pattern since they must be generated per-user
export const TOROX_CLICK_URL_SENTINEL = "torox://campaign/";

type ToroxOffer = {
  offerId: number;
  name: string;
  description: string;
  callToAction?: string;
  disclaimer?: string;
  payoutType?: "CPA" | "CPE";
  payout: number; // USD
  amount?: number; // Virtual currency (IGNORE)
  geos?: string; // Single country or comma list
  os?: "web" | "ios" | "android";
  packageId?: string;
  landingUrl?: string; // NEVER use as click URL (no tracking)
  image?: string;
  coverImage?: string;
  verticalNames?: string;
  pinned?: boolean;
  promoted?: boolean;
  completions?: number;
  rating?: number;
  events?: Array<{
    eventId: number;
    orderId: number;
    eventName: string;
    payout: number; // USD
    amount?: number; // Virtual currency (IGNORE)
    timeframeMin?: number;
    timeframeMax?: number | null;
  }>;
};

type ToroxResponse =
  | ToroxOffer[]
  | { offers: ToroxOffer[] }
  | { data: ToroxOffer[] }
  | { campaigns: ToroxOffer[] };

/**
 * Decode HTML entities and strip tags.
 * Handles common entities: &amp; &lt; &gt; &quot; &#039; &uuml; &ndash; &egrave; etc.
 */
function decodeAndStrip(value: string): string {
  let decoded = value
    // Named entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&uuml;/g, "ü")
    .replace(/&egrave;/g, "è")
    .replace(/&eacute;/g, "é")
    .replace(/&agrave;/g, "à")
    .replace(/&aacute;/g, "á")
    // Numeric entities &#NNN;
    .replace(/&#(\d+);/g, (_match, num) => String.fromCharCode(parseInt(num, 10)))
    // Hex entities &#xHHH;
    .replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) => String.fromCharCode(parseInt(hex, 16)));
  
  // Strip HTML tags
  decoded = decoded.replace(/<[^>]*>/g, "");
  
  return decoded.trim();
}

/**
 * Parse Torox geos field: single country or comma-separated list.
 * Empty or "ALL" = everywhere.
 */
function parseGeos(geos: string | undefined): string[] {
  if (!geos) return [];
  
  const str = geos.trim().toUpperCase();
  if (!str || str === "ALL") return [];
  
  return str
    .split(",")
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
}

/**
 * Normalize Torox os to standard device names.
 */
function normalizeDevice(os: string | undefined): string {
  if (!os) return "web";
  const lower = os.toLowerCase();
  if (lower === "web") return "web";
  if (lower === "ios") return "ios";
  if (lower === "android") return "android";
  return "web";
}

/**
 * Map Torox verticalNames to OfferCategory.
 * Real Money Casino -> null (excluded by default)
 * Strategy/Gaming -> Games
 */
function mapCategory(verticalNames: string | undefined): OfferCategory | null {
  if (!verticalNames) return null;
  
  const lower = verticalNames.toLowerCase();
  
  // Skip gambling categories
  if (lower.includes("casino") || lower.includes("gambling") || 
      lower.includes("betting") || lower.includes("poker")) {
    return null;
  }
  
  // Gaming categories
  if (lower.includes("gaming") || lower.includes("strategy") || 
      lower.includes("game")) {
    return "Games";
  }
  
  return null;
}

/**
 * Check if offer should be excluded due to gambling content.
 */
function isGamblingOffer(verticalNames: string | undefined): boolean {
  if (!verticalNames) return false;
  
  const lower = verticalNames.toLowerCase();
  return (
    lower.includes("casino") ||
    lower.includes("gambling") ||
    lower.includes("betting") ||
    lower.includes("poker")
  );
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

    // Get exclude_real_money_gambling flag (default true)
    const excludeGambling = provider.sync_config?.exclude_real_money_gambling ?? true;

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

    // Extract offers array from various response shapes
    let rawOffers: ToroxOffer[] = [];
    
    if (Array.isArray(parsed)) {
      // Bare array (most common)
      rawOffers = parsed;
    } else if (parsed && typeof parsed === "object") {
      if ("offers" in parsed && Array.isArray(parsed.offers)) {
        rawOffers = parsed.offers;
      } else if ("data" in parsed && Array.isArray(parsed.data)) {
        rawOffers = parsed.data;
      } else if ("campaigns" in parsed && Array.isArray(parsed.campaigns)) {
        rawOffers = parsed.campaigns;
      }
    }

    if (rawOffers.length === 0) {
      const keys = parsed && typeof parsed === "object" ? Object.keys(parsed).join(", ") : "none";
      throw new Error(
        `Torox API returned no offers. Top-level keys: ${keys}. First 300 chars: ${text.slice(0, 300)}`,
      );
    }

    // Track skip reasons for debugging
    const skipReasons = {
      missingId: 0,
      missingName: 0,
      invalidPayout: 0,
      gamblingExcluded: 0,
      geoExcluded: 0,
    };

    const seen = new Set<string>();
    const offers: NormalizedOffer[] = [];
    
    // When context is undefined (admin sync), skip geo filtering and return full catalog
    const userCountry = context?.country?.toUpperCase() ?? null;

    for (const item of rawOffers) {
      // Must have offerId
      if (!item.offerId) {
        skipReasons.missingId++;
        continue;
      }

      const externalOfferId = String(item.offerId);
      
      // Must have name
      if (!item.name || !item.name.trim()) {
        skipReasons.missingName++;
        continue;
      }

      // Must have valid payout
      const payout = Number(item.payout);
      if (!payout || payout <= 0) {
        skipReasons.invalidPayout++;
        continue;
      }

      // Skip duplicates
      if (seen.has(externalOfferId)) continue;
      seen.add(externalOfferId);

      // Exclude gambling offers if configured
      if (excludeGambling && isGamblingOffer(item.verticalNames)) {
        skipReasons.gamblingExcluded++;
        continue;
      }

      // Parse countries (empty or "ALL" = everywhere)
      const countries = parseGeos(item.geos);
      
      // Filter by user country only if context provided (admin sync gets full catalog)
      if (userCountry && countries.length > 0) {
        if (!countries.includes(userCountry)) {
          skipReasons.geoExcluded++;
          continue;
        }
      }

      // Decode HTML entities and strip tags from description
      const description = decodeAndStrip(item.description || "");

      // Store call-to-action in requirements
      const requirements = item.callToAction ? decodeAndStrip(item.callToAction) : "";

      // Store disclaimer in notAllowed
      const notAllowed = item.disclaimer ? decodeAndStrip(item.disclaimer) : "";

      // Handle events (multi-step offers)
      let stepRewards: Array<{ step: string; reward: number }> = [];
      if (item.events && item.events.length > 0) {
        // Sort by orderId
        const sortedEvents = [...item.events].sort((a, b) => a.orderId - b.orderId);
        
        stepRewards = sortedEvents.map((evt) => ({
          step: decodeAndStrip(evt.eventName),
          reward: Number(evt.payout) || 0,
        })).filter((sr) => sr.step && sr.reward > 0);
      }

      // Icon: prefer image (https only), fallback to coverImage
      let icon = "";
      if (item.image && item.image.startsWith("https://")) {
        icon = item.image;
      } else if (item.coverImage && item.coverImage.startsWith("https://")) {
        icon = item.coverImage;
      }

      // Device
      const device = normalizeDevice(item.os);

      // Category
      const category = mapCategory(item.verticalNames);

      // Featured status
      const isFeatured = item.promoted || item.pinned || false;

      // Click URL sentinel (real URL generated per-user at click time)
      const clickUrl = `${TOROX_CLICK_URL_SENTINEL}${externalOfferId}`;

      offers.push({
        externalOfferId,
        title: decodeAndStrip(item.name.trim()),
        description,
        requirements,
        notAllowed,
        icon,
        clickUrl,
        networkPayout: payout,
        countries,
        devices: [device],
        category,
        isFeatured,
        stepRewards: stepRewards.length > 0 ? stepRewards : undefined,
        raw: item,
      });
    }

    if (offers.length === 0) {
      // Provide detailed skip reasons
      const reasons = Object.entries(skipReasons)
        .filter(([_, count]) => count > 0)
        .map(([reason, count]) => `${reason}: ${count}`)
        .join(", ");
      
      const firstItemKeys = rawOffers.length > 0 && typeof rawOffers[0] === "object"
        ? Object.keys(rawOffers[0]).join(", ")
        : "none";

      throw new Error(
        `Torox API returned ${rawOffers.length} offers but none passed filtering. ` +
        `Skip reasons: ${reasons || "none"}. ` +
        `First item keys: ${firstItemKeys}. ` +
        `Config: excludeGambling=${excludeGambling}, userCountry=${userCountry ?? "none"}`
      );
    }

    return offers;
  },
};
