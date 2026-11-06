/**
 * Feed adapters for dynamic quest sources.
 * 
 * Each adapter fetches campaigns from a network feed and normalizes them
 * into a common format for ranking and step creation.
 */

import { createHmac } from "crypto";

/**
 * Generate Offerwall.me signed identity.
 * Used by both feed fetch and signed URL generation to ensure consistency.
 * 
 * @param apiKey - Offerwall.me API key
 * @param userRef - User reference/ID
 * @param expiresSeconds - Expiry timestamp in SECONDS (not ms)
 * @param secret - HMAC secret key
 * @returns HMAC-SHA256 hex signature
 */
export function generateOfferwallMeSignature(
  apiKey: string,
  userRef: string,
  expiresSeconds: number,
  secret: string,
): string {
  const message = `offerwall-user-v1\n${apiKey}\n${userRef}\n${expiresSeconds}`;
  return createHmac("sha256", secret)
    .update(message)
    .digest("hex");
}

export type FeedKind = "ptc" | "shortlink" | "article";

export type FeedContext = {
  userRef: string; // Quest token (user ID for this step)
  ip: string; // User's real IP
  country: string; // ISO country code
  userAgent: string; // User's browser User-Agent
  ipSource?: string; // Where the IP came from (for debugging)
};

export type FeedItem = {
  source: string; // Provider identifier (e.g. "offerwall.me")
  campaignId: string; // External campaign ID
  title: string;
  rewardRaw: number; // Reward in provider's currency
  rewardUsd: number; // Reward in USD (converted)
  durationSeconds?: number; // PTC duration
  completionRate?: number; // Shortlink completion rate (0-100)
  available?: number; // Remaining views/limit
  url: string; // Campaign URL to open
  raw: any; // Original response item (for debugging)
};

export type FeedProvider = {
  id: string;
  key: string;
  name: string;
  api_key: string | null;
  bearer_token: string | null;
  secret: string | null;
  currency_per_usd: number;
  enabled: boolean; // From sdk_offerwall_providers.enabled column
  status: string; // From sdk_offerwall_providers.status column
};

/**
 * Query providers for feed quests:
 * 
 * ```sql
 * SELECT id, slug as key, name, 
 *        extra_config->>'api_key' as api_key,
 *        extra_config->>'bearer_token' as bearer_token,
 *        secret_refs->>'secret' as secret,
 *        currency_per_usd, enabled, status
 * FROM sdk_offerwall_providers
 * WHERE id = ANY($1)  -- feed_provider_ids from quest
 *   AND enabled = true
 *   AND status != 'disabled'
 * ORDER BY display_order
 * ```
 */

/**
 * Fetch feed from a provider.
 * Returns normalized items or throws on error.
 */
export async function fetchFeed(
  kind: FeedKind,
  provider: FeedProvider,
  context: FeedContext,
): Promise<FeedItem[]> {
  // Skip if provider not enabled or disabled
  if (!provider.enabled || provider.status === 'disabled') {
    console.warn(`[feed] Provider ${provider.key} is not enabled (enabled=${provider.enabled}, status=${provider.status}), skipping`);
    return [];
  }

  if (!provider.currency_per_usd || provider.currency_per_usd <= 0) {
    console.error(`[feed] Provider ${provider.key} has invalid currency_per_usd (${provider.currency_per_usd}), skipping`);
    return [];
  }

  switch (provider.key) {
    case "offerwallme":
      return fetchOfferwallMe(kind, provider, context);
    case "bitcotasks":
      return fetchBitcoTasks(kind, provider, context);
    default:
      console.warn(`[feed] Unknown provider ${provider.key}`);
      return [];
  }
}

/**
 * Offerwall.me feed adapter.
 * 
 * PTC: GET https://offerwall.me/api.php
 * Shortlink: GET https://offerwall.me/slapi.php
 * Article: Not supported
 * 
 * Uses signed identity: HMAC-SHA256(secret, "offerwall-user-v1\nAPIKEY\nUSERREF\nEXPIRES")
 * IMPORTANT: EXPIRES must be in SECONDS, not milliseconds
 */
async function fetchOfferwallMe(
  kind: FeedKind,
  provider: FeedProvider,
  context: FeedContext,
): Promise<FeedItem[]> {
  // Read credentials from environment (DB row only for enabled/status/currency)
  const apiKey = process.env.OFFERWALLME_API_KEY;
  const bearerToken = process.env.OFFERWALLME_BEARER_TOKEN;
  const secret = process.env.OFFERWALLME_SECRET_KEY;

  if (!apiKey || !secret) {
    console.error("[feed] Offerwall.me missing env vars: OFFERWALLME_API_KEY, OFFERWALLME_SECRET_KEY");
    throw new Error("Offerwall.me credentials not configured");
  }

  // Article not supported
  if (kind === "article") {
    console.warn("[feed] Offerwall.me does not support article feeds");
    return [];
  }

  const endpoint = kind === "ptc" ? "api.php" : "slapi.php";
  
  // Generate signed identity with 1 HOUR expiry (3600 seconds)
  // Must match the pattern in getOfferwallMeSignedUrlImpl
  const expiresSeconds = Math.floor(Date.now() / 1000) + 3600;
  const signature = generateOfferwallMeSignature(apiKey, context.userRef, expiresSeconds, secret);

  console.log(`[feed] Offerwall.me ${kind}: expires in 1 hour (${expiresSeconds})`);

  const url = new URL(`https://offerwall.me/${endpoint}`);
  url.searchParams.set("api", apiKey);
  url.searchParams.set("id", context.userRef);
  url.searchParams.set("ip", context.ip);
  url.searchParams.set("token", bearerToken ?? "");
  url.searchParams.set("country", context.country);
  url.searchParams.set("identityExpires", expiresSeconds.toString());
  url.searchParams.set("identitySignature", signature);

  console.log(`[feed] Fetching Offerwall.me ${kind}: ${url.origin}${url.pathname}`);

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": context.userAgent,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unable to read response body");
    // Mask any API keys or secrets in the error body
    const maskedBody = errorBody
      .replace(new RegExp(apiKey, 'g'), '***API_KEY***')
      .replace(new RegExp(secret, 'g'), '***SECRET***');
    console.error(`[feed] Offerwall.me ${kind} HTTP ${response.status}:`, maskedBody);
    throw new Error(`Offerwall.me ${kind} failed: HTTP ${response.status}`);
  }

  const json = await response.json();
  const data = json.data ?? [];

  if (kind === "ptc") {
    return data
      .filter((item: any) => item != null)
      .map((item: any) => {
        // Extract campaign ID from url query param "1"
        let campaignId = "";
        try {
          const itemUrl = new URL(item.url);
          campaignId = itemUrl.searchParams.get("1") ?? "";
        } catch {
          campaignId = "";
        }

        if (!campaignId) {
          console.warn("[feed] Offerwall.me PTC item missing campaign ID:", item.url);
          return null;
        }

        return {
          source: "offerwallme",
          campaignId,
          title: item.title ?? "PTC Ad",
          rewardRaw: parseFloat(item.reward) || 0,
          rewardUsd: (parseFloat(item.reward) || 0) / provider.currency_per_usd,
          durationSeconds: parseInt(item.duration) || 0,
          url: item.url,
          raw: item,
        };
      })
      .filter((item): item is FeedItem => item !== null);
  } else {
    // Shortlink
    return data
      .filter((item: any) => item != null && (item.remaining_views ?? 0) > 0)
      .map((item: any) => ({
        source: "offerwallme",
        campaignId: String(item.id ?? ""),
        title: item.name ?? "Shortlink",
        rewardRaw: parseFloat(item.reward) || 0,
        rewardUsd: (parseFloat(item.reward) || 0) / provider.currency_per_usd,
        available: parseInt(item.remaining_views) || 0,
        url: item.shortlink ?? item.url ?? "",
        raw: item,
      }));
  }
}

/**
 * BitcoTasks feed adapter.
 * 
 * PTC: GET https://bitcotasks.com/api/{API_KEY}/{USER_ID}/{USER_IP}
 * Shortlink: GET https://bitcotasks.com/sl-api/{API_KEY}/{USER_ID}/{USER_IP}
 * Article: GET https://bitcotasks.com/ra-api/{API_KEY}/{USER_ID}/{USER_IP}
 * 
 * All endpoints require:
 * - Header "Authorization: Bearer <BEARER_TOKEN>"
 * - Header "User-UA: <User-Agent>"
 * - Response: {status:"200", message, data[]}
 */
async function fetchBitcoTasks(
  kind: FeedKind,
  provider: FeedProvider,
  context: FeedContext,
): Promise<FeedItem[]> {
  // Read credentials from environment (DB row only for enabled/status/currency)
  const apiKey = process.env.BITCOTASKS_API_KEY;
  const bearerToken = process.env.BITCOTASKS_BEARER;

  if (!apiKey) {
    console.error("[feed] BitcoTasks missing env var: BITCOTASKS_API_KEY");
    throw new Error("BitcoTasks credentials not configured");
  }

  const endpoints = {
    ptc: "api",
    shortlink: "sl-api",
    article: "ra-api",
  };

  const endpoint = endpoints[kind];
  const url = `https://bitcotasks.com/${endpoint}/${apiKey}/${context.userRef}/${context.ip}`;

  console.log(`[feed] BitcoTasks ${kind} request:`);
  console.log(`[feed]   URL: https://bitcotasks.com/${endpoint}/***/${context.userRef.substring(0, 8)}.../${context.ip}`);
  console.log(`[feed]   IP source: ${context.ipSource ?? "not-tracked"}`);
  console.log(`[feed]   User-Agent: ${context.userAgent.substring(0, 60)}${context.userAgent.length > 60 ? "..." : ""}`);
  console.log(`[feed]   Bearer token: ${bearerToken ? "present" : "MISSING"}`);

  const headers: Record<string, string> = {
    "User-UA": context.userAgent,
  };
  
  // Add bearer token if configured (may be required for some endpoints)
  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`;
  }

  const response = await fetch(url, { headers });

  console.log(`[feed] BitcoTasks ${kind} response: HTTP ${response.status}`);

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unable to read response body");
    console.error(`[feed] BitcoTasks ${kind} HTTP ${response.status}:`, errorBody);
    
    // Provide helpful error messages
    if (response.status === 401) {
      if (errorBody.includes("Unauthorized 1")) {
        console.error("[feed] BitcoTasks auth error: Missing or invalid User-UA header");
      } else if (errorBody.includes("Unauthorized 2")) {
        console.error("[feed] BitcoTasks auth error: Bearer token is invalid or API key needs whitelisting");
        console.error("[feed] Please verify BITCOTASKS_BEARER matches the token in your BitcoTasks dashboard");
      }
    }
    
    throw new Error(`BitcoTasks ${kind} failed: HTTP ${response.status}`);
  }

  const json = await response.json();

  // BitcoTasks returns different status codes:
  // - status: "200" with data[] = success with campaigns
  // - status: "success" with empty/no data = success but no campaigns available
  // - HTTP 200 with data[] (no status field) = success (some endpoints)
  // Only treat as error if status is explicitly an error code AND not a success message
  
  const hasData = json.data && Array.isArray(json.data) && json.data.length > 0;
  const isSuccessStatus = json.status === "200" || json.status === "success";
  const isSuccessMessage = json.message === "success" || !json.message;
  
  // If HTTP 200 and has data, it's success regardless of status field
  if (response.ok && hasData) {
    console.log(`[feed] BitcoTasks ${kind}: ${json.data.length} campaigns available`);
  }
  // If status is explicitly not success AND message is not success, it's an error
  else if (!isSuccessStatus && !isSuccessMessage && json.status) {
    console.error(`[feed] BitcoTasks ${kind} API error:`, json.message ?? json.status ?? "Unknown error");
    throw new Error(`BitcoTasks ${kind} error: ${json.message ?? json.status ?? "Unknown error"}`);
  }
  // If no data available, return empty array (not an error)
  else if (!hasData) {
    console.log(`[feed] BitcoTasks ${kind}: No campaigns available (status: ${json.status ?? "none"}, message: ${json.message ?? "none"})`);
    return [];
  }

  const data = json.data ?? [];

  if (kind === "ptc") {
    return data
      .filter((item: any) => item != null)
      .map((item: any) => ({
        source: "bitcotasks",
        campaignId: String(item.id ?? ""),
        title: item.title ?? "PTC Ad",
        rewardRaw: parseFloat(item.reward) || 0,
        rewardUsd: (parseFloat(item.reward) || 0) / provider.currency_per_usd,
        durationSeconds: parseInt(item.duration) || 0,
        url: item.url ?? "",
        raw: item,
      }));
  } else if (kind === "shortlink") {
    return data
      .filter((item: any) => item != null && (item.available ?? 0) > 0)
      .map((item: any) => ({
        source: "bitcotasks",
        campaignId: String(item.id ?? ""),
        title: item.title ?? "Shortlink",
        rewardRaw: parseFloat(item.reward) || 0,
        rewardUsd: (parseFloat(item.reward) || 0) / provider.currency_per_usd,
        completionRate: parseInt(item.completion_rate) || 0,
        available: parseInt(item.available) || 0,
        url: item.url ?? "",
        raw: item,
      }));
  } else {
    // Article
    return data
      .filter((item: any) => item != null && (item.available ?? 0) > 0)
      .map((item: any) => ({
        source: "bitcotasks",
        campaignId: String(item.id ?? ""),
        title: item.title ?? "Article",
        rewardRaw: parseFloat(item.reward) || 0,
        rewardUsd: (parseFloat(item.reward) || 0) / provider.currency_per_usd,
        available: parseInt(item.available) || 0,
        url: item.url ?? "",
        raw: item,
      }));
  }
}

/**
 * Rank and filter feed items according to quest rules.
 * 
 * Ranking:
 * - PTC: rewardUsd DESC, then durationSeconds ASC
 * - Shortlink: filter by min_completion_rate, then rewardUsd DESC, completionRate DESC
 * - Article: rewardUsd DESC
 * 
 * Applies:
 * - min_reward_usd filter
 * - max_per_network limit
 * - blocked_domains filter
 * 
 * Returns top N + backup campaigns.
 */
export function rankAndFilterFeed(
  items: FeedItem[],
  options: {
    kind: FeedKind;
    stepsCount: number;
    backupCount: number;
    minRewardUsd: number;
    minCompletionRate: number;
    maxPerNetwork: number | null;
    blockedDomains: string[];
  },
): { steps: FeedItem[]; backups: FeedItem[] } {
  // DON'T filter by min reward - use it only for ordering/prioritization
  // Bug fix: min_reward_usd should not remove campaigns, only affect ranking
  let filtered = items;

  // Filter by completion rate (shortlink only)
  if (options.kind === "shortlink") {
    filtered = filtered.filter(
      (item) => (item.completionRate ?? 100) >= options.minCompletionRate,
    );
  }

  // Filter by available (shortlink/article)
  if (options.kind === "shortlink" || options.kind === "article") {
    filtered = filtered.filter((item) => (item.available ?? 1) > 0);
  }

  // Filter by blocked domains
  if (options.blockedDomains.length > 0) {
    filtered = filtered.filter((item) => {
      try {
        const url = new URL(item.url);
        const hostname = url.hostname.toLowerCase();
        return !options.blockedDomains.some((domain) =>
          hostname.includes(domain.toLowerCase()),
        );
      } catch {
        return true; // Keep if URL is invalid
      }
    });
  }

  // Rank
  const ranked = filtered.sort((a, b) => {
    if (options.kind === "ptc") {
      // PTC: reward desc, duration asc
      if (Math.abs(a.rewardUsd - b.rewardUsd) > 0.0001) {
        return b.rewardUsd - a.rewardUsd;
      }
      return (a.durationSeconds ?? 0) - (b.durationSeconds ?? 0);
    } else if (options.kind === "shortlink") {
      // Shortlink: reward desc, completion rate desc
      if (Math.abs(a.rewardUsd - b.rewardUsd) > 0.0001) {
        return b.rewardUsd - a.rewardUsd;
      }
      return (b.completionRate ?? 0) - (a.completionRate ?? 0);
    } else {
      // Article: reward desc
      return b.rewardUsd - a.rewardUsd;
    }
  });

  // Apply max_per_network
  let final = ranked;
  if (options.maxPerNetwork && options.maxPerNetwork > 0) {
    const countByNetwork: Record<string, number> = {};
    final = ranked.filter((item) => {
      const count = countByNetwork[item.source] ?? 0;
      if (count >= options.maxPerNetwork!) {
        return false;
      }
      countByNetwork[item.source] = count + 1;
      return true;
    });
  }

  // Split into steps and backups
  const steps = final.slice(0, options.stepsCount);
  const backups = final.slice(options.stepsCount, options.stepsCount + options.backupCount);

  return { steps, backups };
}
