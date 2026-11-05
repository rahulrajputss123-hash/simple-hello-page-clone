/**
 * Survey Feed Server Logic
 * 
 * Fetches and aggregates surveys from CPX Research, TheoremReach, and Timewall.
 * All secrets stay server-side, never sent to client.
 */

import { createHash, createHmac } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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
  quotaIds?: number[]; // TheoremReach quota_ids
};

export type NetworkStatus = {
  network: SurveyNetwork;
  ok: boolean;
  count: number;
  reason?: string;
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

export type SurveyFeedResult = {
  surveys: Survey[];
  networks: NetworkStatus[];
};

type CachedFeed = {
  surveys: Survey[];
  networks: NetworkStatus[];
  cachedAt: number;
};

// Cache feeds per user for 120 seconds
const feedCache = new Map<string, CachedFeed>();
const CACHE_TTL = 120 * 1000; // 120 seconds

/**
 * Fetch surveys from all allowed networks and merge into one list.
 */
export async function fetchSurveyFeed(params: SurveyFeedParams): Promise<SurveyFeedResult> {
  const cacheKey = `${params.userId}:${params.allowedNetworks.join(",")}`;
  const cached = feedCache.get(cacheKey);
  
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    return {
      surveys: filterSurveys(cached.surveys, params),
      networks: cached.networks,
    };
  }

  const allSurveys: Survey[] = [];
  const networks: NetworkStatus[] = [];

  // Fetch from each allowed network in parallel
  const promises = params.allowedNetworks.map(async (network) => {
    try {
      let surveys: Survey[];
      switch (network) {
        case "cpxresearch":
          surveys = await fetchCPXSurveys(params);
          break;
        case "theoremreach":
          surveys = await fetchTheoremReachSurveys(params);
          break;
        case "timewall":
          surveys = []; // Timewall has no list API
          break;
        default:
          surveys = [];
      }
      return { network, surveys, ok: true, reason: undefined };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.error(`[survey-feed] ${network} failed:`, reason);
      return { network, surveys: [], ok: false, reason };
    }
  });

  const results = await Promise.all(promises);
  
  for (const result of results) {
    allSurveys.push(...result.surveys);
    networks.push({
      network: result.network,
      ok: result.ok,
      count: result.surveys.length,
      reason: result.reason,
    });
  }

  // Don't cache empty or failed results
  const hasData = allSurveys.length > 0 || networks.some(n => n.ok);
  if (hasData) {
    feedCache.set(cacheKey, {
      surveys: allSurveys,
      networks,
      cachedAt: Date.now(),
    });
  }

  return {
    surveys: filterSurveys(allSurveys, params),
    networks,
  };
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
  const secret = process.env.CPX_SECURE_HASH;

  if (!appId || !secret) {
    const missing = [];
    if (!appId) missing.push("CPX_APP_ID");
    if (!secret) missing.push("CPX_SECURE_HASH");
    console.error(`[survey-feed] CPX missing env vars: ${missing.join(", ")}`);
    throw new Error(`Missing env: ${missing.join(", ")}`);
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
  url.searchParams.set("user_agent", params.userAgent); // Pass raw user agent, searchParams handles encoding
  url.searchParams.set("limit", "12");
  url.searchParams.set("secure_hash", secureHash);

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}${body ? `: ${body.substring(0, 100)}` : ""}`);
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
    entryLink: s.href || "",
  }));
}

/**
 * Fetch TheoremReach surveys.
 * 
 * GET https://theoremreach.com/api/v1/surveys
 * Real response fields per docs:
 * - campaign_id, quota_id, quota_ids[], rank, buyer_id
 * - loi, cpi (USD, needs multiplier), incidence, attempts_count, completes_count
 * - rating_count, average_rating, entry_link (UNSIGNED)
 * 
 * We must sign the entry_link ourselves before returning.
 */
async function fetchTheoremReachSurveys(params: SurveyFeedParams): Promise<Survey[]> {
  const apiKey = process.env.THEOREMREACH_API_KEY;
  const secret = process.env.THEOREMREACH_SECRET_KEY;

  if (!apiKey || !secret) {
    const missing = [];
    if (!apiKey) missing.push("THEOREMREACH_API_KEY");
    if (!secret) missing.push("THEOREMREACH_SECRET_KEY");
    console.error(`[survey-feed] TheoremReach missing env vars: ${missing.join(", ")}`);
    throw new Error(`Missing env: ${missing.join(", ")}`);
  }

  // Validate country code
  if (!/^[A-Z]{2}$/.test(params.countryCode)) {
    throw new Error(`Invalid country code: ${params.countryCode}`);
  }

  // Get reward multiplier from provider settings
  const { data: provider } = await supabaseAdmin
    .from("sdk_offerwall_providers")
    .select("reward_multiplier")
    .eq("slug", "theoremreach")
    .maybeSingle();

  const rewardMultiplier = provider?.reward_multiplier ?? 0.8;

  // Build URL for /surveys request (also needs signing)
  const baseUrl = "https://theoremreach.com/api/v1/surveys";
  const url = new URL(baseUrl);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("user_id", params.userId);
  url.searchParams.set("country_code", params.countryCode);

  // Sign the /surveys request URL
  const urlToSign = url.toString();
  const requestHash = signTheoremReachUrl(urlToSign, secret);
  url.searchParams.set("hash", requestHash);

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const reason = response.status === 401 
      ? "HTTP 401 (Publisher API not enabled or bad hash)"
      : response.status === 403
      ? "HTTP 403"
      : `HTTP ${response.status}`;
    throw new Error(`${reason}${body ? `: ${body.substring(0, 100)}` : ""}`);
  }

  const data = await response.json();
  const surveys = data.surveys || [];

  if (surveys.length === 0) {
    throw new Error("No surveys for this user/country");
  }

  return surveys.map((s: any) => {
    const campaignId = s.campaign_id;
    const loi = Number(s.loi || 0);
    const cpi = Number(s.cpi || 0); // USD from TheoremReach
    // NOTE: cpi semantics must be verified against real postback - may need adjustment
    const payoutUsd = cpi * rewardMultiplier;
    const rating = Number(s.average_rating || 0);
    const quotaIds = Array.isArray(s.quota_ids) ? s.quota_ids : [];
    
    // Sign the entry_link
    let entryLink = s.entry_link || "";
    if (entryLink) {
      entryLink = signTheoremReachEntryLink(entryLink, secret, params);
    }

    return {
      id: String(campaignId),
      network: "theoremreach" as const,
      title: `${loi} min survey`,
      payoutUsd,
      loi,
      rating,
      entryLink,
      quotaIds,
    };
  });
}

/**
 * Sign a TheoremReach URL (for /surveys request or entry_link).
 * Hash: base64url(HMAC-SHA1(secret, fullUrlWithoutHash))
 */
function signTheoremReachUrl(url: string, secret: string): string {
  const signature = createHmac("sha1", secret)
    .update(url)
    .digest(); // Raw binary

  // Base64url encoding: replace + with -, / with _, remove =
  return signature
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Sign TheoremReach entry_link.
 * entry_link already contains api_key, user_id, survey_id, quota_ids[].
 * Optionally append demographics, then compute and append &hash=<hash> LAST.
 */
function signTheoremReachEntryLink(
  entryLink: string,
  secret: string,
  params: SurveyFeedParams,
): string {
  // TODO: Optionally append &question_1[]=age / &question_2[]=100|101 / &postal_code if we have them
  // For now, sign as-is
  
  const hash = signTheoremReachUrl(entryLink, secret);
  const separator = entryLink.includes("?") ? "&" : "?";
  return `${entryLink}${separator}hash=${hash}`;
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
