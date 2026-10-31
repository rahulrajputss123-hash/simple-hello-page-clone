/**
 * Feed adapters for dynamic quest sources.
 * 
 * Each adapter fetches campaigns from a network feed and normalizes them
 * into a common format for ranking and step creation.
 */

import crypto from "crypto";

export type FeedKind = "ptc" | "shortlink" | "article";

export type FeedContext = {
  userRef: string; // Quest token (user ID for this step)
  ip: string; // User's real IP
  country: string; // ISO country code
  userAgent: string; // User's browser User-Agent
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
  is_enabled: boolean;
};

/**
 * Fetch feed from a provider.
 * Returns normalized items or throws on error.
 */
export async function fetchFeed(
  kind: FeedKind,
  provider: FeedProvider,
  context: FeedContext,
): Promise<FeedItem[]> {
  if (!provider.is_enabled) {
    console.warn(`[feed] Provider ${provider.key} is disabled, skipping`);
    return [];
  }

  if (!provider.currency_per_usd || provider.currency_per_usd <= 0) {
    console.error(`[feed] Provider ${provider.key} has invalid currency_per_usd, skipping`);
    return [];
  }

  switch (provider.key) {
    case "offerwall.me":
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
 * Uses signed identity: HMAC-SHA256(secret, "offerwall-user-v1\nAPIKEY\nUSERREF\nEXPIRY")
 */
async function fetchOfferwallMe(
  kind: FeedKind,
  provider: FeedProvider,
  context: FeedContext,
): Promise<FeedItem[]> {
  if (!provider.api_key || !provider.secret) {
    throw new Error("Offerwall.me requires api_key and secret");
  }

  // Article not supported
  if (kind === "article") {
    console.warn("[feed] Offerwall.me does not support article feeds");
    return [];
  }

  const endpoint = kind === "ptc" ? "api.php" : "slapi.php";
  
  // Generate signed identity (48h expiry)
  const expiryMs = Date.now() + 48 * 60 * 60 * 1000;
  const message = `offerwall-user-v1\n${provider.api_key}\n${context.userRef}\n${expiryMs}`;
  const signature = crypto
    .createHmac("sha256", provider.secret)
    .update(message)
    .digest("hex");

  const url = new URL(`https://offerwall.me/${endpoint}`);
  url.searchParams.set("api", provider.api_key);
  url.searchParams.set("id", context.userRef);
  url.searchParams.set("ip", context.ip);
  url.searchParams.set("token", provider.bearer_token ?? "");
  url.searchParams.set("country", context.country);
  url.searchParams.set("identityExpires", expiryMs.toString());
  url.searchParams.set("identitySignature", signature);

  console.log(`[feed] Fetching Offerwall.me ${kind}: ${url.origin}${url.pathname}`);

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": context.userAgent,
    },
  });

  if (!response.ok) {
    throw new Error(`Offerwall.me ${kind} failed: ${response.status}`);
  }

  const json = await response.json();
  const data = json.data ?? [];

  if (kind === "ptc") {
    return data
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
          source: "offerwall.me",
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
      .filter((item: any) => (item.remaining_views ?? 0) > 0)
      .map((item: any) => ({
        source: "offerwall.me",
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
  if (!provider.api_key || !provider.bearer_token) {
    throw new Error("BitcoTasks requires api_key and bearer_token");
  }

  const endpoints = {
    ptc: "api",
    shortlink: "sl-api",
    article: "ra-api",
  };

  const endpoint = endpoints[kind];
  const url = `https://bitcotasks.com/${endpoint}/${provider.api_key}/${context.userRef}/${context.ip}`;

  console.log(`[feed] Fetching BitcoTasks ${kind}: https://bitcotasks.com/${endpoint}/***`);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${provider.bearer_token}`,
      "User-UA": context.userAgent,
    },
  });

  if (!response.ok) {
    throw new Error(`BitcoTasks ${kind} failed: ${response.status}`);
  }

  const json = await response.json();

  if (json.status !== "200") {
    throw new Error(`BitcoTasks ${kind} error: ${json.message ?? "Unknown error"}`);
  }

  const data = json.data ?? [];

  if (kind === "ptc") {
    return data.map((item: any) => ({
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
      .filter((item: any) => (item.available ?? 0) > 0)
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
      .filter((item: any) => (item.available ?? 0) > 0)
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
  // Filter by min reward
  let filtered = items.filter((item) => item.rewardUsd >= options.minRewardUsd);

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
