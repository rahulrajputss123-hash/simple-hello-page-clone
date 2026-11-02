/**
 * Survey Feed Server Logic
 * 
 * Fetches and aggregates surveys from CPX Research, TheoremReach, and Timewall.
 * All secrets stay server-side, never sent to client.
 */

import { createHash, createHmac } from "crypto";

export type SurveyNetwork = "cpxresearch" | "theoremreach" | "timewall";

export type Survey = {
  id: string;
  network: SurveyNetwork;
  title: string;
  payoutUsd: number;
  loi: number; // Length of Interview in minutes
  rating?: number; // 0-5 scale
  conversionRate?: number; // 0-100 percentage
  entryLink: string;
};

export type SurveyFeedParams = {
  userId: string;
  sessionId: string;
  ip: string;
  countryCode: string;
  userAgent: string;
  allowedNetworks: SurveyNetwork[];
  minPayoutUsd?: number;
  maxLoi?: number;
};

type CachedFeed = {
  surveys: Survey[];
  cachedAt: number;
};

// Cache feeds per user for 120 seconds
const feedCache = new Map<string, CachedFeed>();
const CACHE_TTL = 120 * 1000; // 120 seconds

/**
 * Fetch surveys from all allowed networks and merge into one list.
 */
export async function fetchSurveyFeed(params: SurveyFeedParams): Promise<Survey[]> {
  const cacheKey = `${params.userId}:${params.allowedNetworks.join(",")}`;
  const cached = feedCache.get(cacheKey);
  
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    return filterSurveys(cached.surveys, params);
  }

  const allSurveys: Survey[] = [];

  // Fetch from each allowed network in parallel
  const promises = params.allowedNetworks.map(async (network) => {
    try {
      switch (network) {
        case "cpxresearch":
          return await fetchCPXSurveys(params);
        case "theoremreach":
          return await fetchTheoremReachSurveys(params);
        case "timewall":
          return []; // Timewall has no list API, returns empty
        default:
          return [];
      }
    } catch (error) {
      console.error(`[survey-feed] Failed to fetch from ${network}:`, error);
      return [];
    }
  });

  const results = await Promise.all(promises);
  results.forEach((surveys) => allSurveys.push(...surveys));

  // Cache the raw results
  feedCache.set(cacheKey, {
    surveys: allSurveys,
    cachedAt: Date.now(),
  });

  return filterSurveys(allSurveys, params);
}

/**
 * Apply min_payout_usd and max_loi filters.
 */
function filterSurveys(surveys: Survey[], params: SurveyFeedParams): Survey[] {
  let filtered = surveys;

  if (params.minPayoutUsd != null && params.minPayoutUsd > 0) {
    filtered = filtered.filter((s) => s.payoutUsd >= params.minPayoutUsd!);
  }

  if (params.maxLoi != null && params.maxLoi > 0) {
    filtered = filtered.filter((s) => s.loi <= params.maxLoi!);
  }

  return filtered;
}

/**
 * Fetch CPX Research surveys.
 * 
 * GET https://live-api.cpx-research.com/api/get-surveys.php
 * Params: app_id, ext_user_id, subid_1 (session), output_method=api, ip_user, user_agent, limit, secure_hash
 * Hash: md5(ext_user_id + "-" + secret)
 */
async function fetchCPXSurveys(params: SurveyFeedParams): Promise<Survey[]> {
  const appId = process.env.CPX_APP_ID;
  const secret = process.env.CPX_SECURE_HASH_SECRET;

  if (!appId || !secret) {
    console.warn("[survey-feed] CPX credentials not configured");
    return [];
  }

  const secureHash = createHash("md5")
    .update(`${params.userId}-${secret}`)
    .digest("hex");

  const url = new URL("https://live-api.cpx-research.com/api/get-surveys.php");
  url.searchParams.set("app_id", appId);
  url.searchParams.set("ext_user_id", params.userId);
  url.searchParams.set("subid_1", params.sessionId);
  url.searchParams.set("output_method", "api");
  url.searchParams.set("ip_user", params.ip);
  url.searchParams.set("user_agent", encodeURIComponent(params.userAgent));
  url.searchParams.set("limit", "12");
  url.searchParams.set("secure_hash", secureHash);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`CPX API failed: ${response.status}`);
  }

  const data = await response.json();
  const surveys = data.surveys || [];

  return surveys.map((s: any) => ({
    id: String(s.id),
    network: "cpxresearch" as const,
    title: s.title || `Survey ${s.id}`,
    payoutUsd: Number(s.payout_publisher_usd || 0),
    loi: Number(s.loi || 0),
    rating: Number(s.statistics_rating_avg || 0),
    conversionRate: Number(s.conversion_rate || 0),
    entryLink: s.href || "", // Always new design
  }));
}

/**
 * Fetch TheoremReach surveys.
 * 
 * GET https://api.theoremreach.com/api/publishers/v1/surveys
 * Params: api_key, user_id, ip, country_code, hash
 * Hash: base64url(HMAC-SHA1(secret, full URL without &hash=))
 * 
 * Note: DO NOT request include_question_info
 */
async function fetchTheoremReachSurveys(params: SurveyFeedParams): Promise<Survey[]> {
  const apiKey = process.env.THEOREMREACH_API_KEY;
  const secret = process.env.THEOREMREACH_SECRET;

  if (!apiKey || !secret) {
    console.warn("[survey-feed] TheoremReach credentials not configured");
    return [];
  }

  // Build URL without hash first
  const baseUrl = "https://api.theoremreach.com/api/publishers/v1/surveys";
  const url = new URL(baseUrl);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("user_id", params.userId);
  url.searchParams.set("ip", params.ip);
  url.searchParams.set("country_code", params.countryCode);

  // Sign the full URL without hash param
  const urlToSign = url.toString();
  const signature = createHmac("sha1", secret)
    .update(urlToSign)
    .digest(); // Raw binary, not hex

  // Base64url encoding: replace + with -, / with _, remove =
  const hash = signature
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  url.searchParams.set("hash", hash);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`TheoremReach API failed: ${response.status}`);
  }

  const data = await response.json();
  const surveys = data.surveys || [];

  return surveys.map((s: any) => ({
    id: String(s.id),
    network: "theoremreach" as const,
    title: s.title || s.name || `Survey ${s.id}`,
    payoutUsd: Number(s.payout_usd || 0),
    loi: Number(s.loi || 0),
    rating: Number(s.rating || 0),
    conversionRate: undefined,
    entryLink: s.entry_link || "", // Already signed by TheoremReach
  }));
}

/**
 * Get Timewall wall URL.
 * Timewall has no list API, so we return a single "wall" card.
 */
export function getTimewallWallUrl(userId: string): string {
  // This will use the existing buildOfferwallUrl logic for slug "timewall"
  // Implementation will be in the server function that calls this
  return ""; // Placeholder, actual URL built in handler
}

/**
 * Base64url encoding helper (for TheoremReach)
 */
function base64url(input: Buffer): string {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}
