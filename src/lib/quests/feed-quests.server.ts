/**
 * Feed Quest Logic - Part 2
 * 
 * Implements feed quests (feed_ptc, feed_shortlink, feed_article) that build
 * steps dynamically from network feeds.
 */

import crypto from "crypto";
import type { QuestRow } from "../quests.server";
import { fetchFeed, rankAndFilterFeed, type FeedKind, type FeedContext, type FeedItem, type FeedProvider } from "./feed-adapters.server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = { from: (t: string) => any };

export type FeedSnapshot = {
  source: string;
  campaignId: string;
  title: string;
  rewardUsd: number;
  duration?: number;
  completionRate?: number;
  url: string;
  backup: boolean;
}[];

/**
 * Generate a quest token for feed quests.
 * Format: "q_" + 24 url-safe random characters
 */
export function generateQuestToken(): string {
  const bytes = crypto.randomBytes(18); // 18 bytes = 24 base64 chars
  return "q_" + bytes.toString("base64url").slice(0, 24);
}

/**
 * Get user's real IP, country, and User-Agent from request headers.
 * Server-side only - never expose to client.
 */
export function extractUserContext(request: Request): {
  ip: string;
  country: string;
  userAgent: string;
  ipSource: string; // For debugging
} {
  let ip = "";
  let ipSource = "none";
  
  // Try Cloudflare first
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) {
    ip = cfIp.trim();
    ipSource = "cf-connecting-ip";
  }
  
  // Try X-Forwarded-For (take first IP, strip port)
  if (!ip) {
    const xffIp = request.headers.get("x-forwarded-for");
    if (xffIp) {
      const firstIp = xffIp.split(",")[0].trim();
      // Strip port if present (e.g., "198.51.100.1:8080" -> "198.51.100.1")
      ip = firstIp.split(":")[0];
      ipSource = "x-forwarded-for";
    }
  }
  
  // Try X-Real-IP
  if (!ip) {
    const xRealIp = request.headers.get("x-real-ip");
    if (xRealIp) {
      ip = xRealIp.trim();
      ipSource = "x-real-ip";
    }
  }
  
  if (!ip) {
    console.error("[feed] IP extraction failed - no valid headers found");
    console.error("[feed] Available headers:", {
      cfConnecting: request.headers.get("cf-connecting-ip") ?? "null",
      xForwardedFor: request.headers.get("x-forwarded-for") ?? "null",
      xRealIp: request.headers.get("x-real-ip") ?? "null",
    });
    throw new Error("Cannot determine user IP address");
  }
  
  console.log(`[feed] Extracted IP: ${ip} from ${ipSource}`);
  
  const country = 
    request.headers.get("cf-ipcountry") || // Cloudflare
    request.headers.get("x-country-code") || // Generic
    "US";
  
  const userAgent = request.headers.get("user-agent") || "Mozilla/5.0 (Unknown)";
  
  return { ip, country, userAgent, ipSource };
}

/**
 * Start a feed quest: fetch feeds, rank, and store snapshot.
 * 
 * @returns { success: true, sessionId } or { success: false, reason: "unavailable" | "error" }
 */
export async function startFeedQuestImpl(
  db: DbClient,
  userId: string,
  questKey: string,
  quest: QuestRow,
  request: Request,
): Promise<{ success: boolean; sessionId?: string; reason?: string }> {
  if (!quest.feed_kind) {
    return { success: false, reason: "error" };
  }

  // Get user context
  const context = extractUserContext(request);
  
  // Load enabled providers
  const { data: providers } = await db
    .from("sdk_offerwall_providers")
    .select("id, slug, name, extra_config, secret_refs, currency_per_usd, enabled, status")
    .in("id", quest.feed_provider_ids)
    .eq("enabled", true)
    .neq("status", "disabled");

  if (!providers || providers.length === 0) {
    console.warn(`[feed-quest] No enabled providers for quest ${questKey}`);
    return { success: false, reason: "unavailable" };
  }

  // Normalize providers (credentials from env, DB only has enabled/status/currency)
  const feedProviders: FeedProvider[] = providers.map((p: any) => ({
    id: p.id,
    key: p.slug,
    name: p.name,
    api_key: null, // Read from env in adapters
    bearer_token: null,
    secret: null,
    currency_per_usd: Number(p.currency_per_usd ?? 1),
    enabled: p.enabled,
    status: p.status,
  })).filter((p: FeedProvider) => p.currency_per_usd > 0);

  if (feedProviders.length === 0) {
    console.warn(`[feed-quest] No valid providers after filtering for quest ${questKey}`);
    return { success: false, reason: "unavailable" };
  }

  // Fetch feeds from all providers (use real user ID for listing, but DON'T expose URLs to client)
  const feedContext: FeedContext = {
    userRef: userId, // Real user ID for feed listing only
    ip: context.ip,
    country: context.country,
    userAgent: context.userAgent,
  };

  const allItems: FeedItem[] = [];
  for (const provider of feedProviders) {
    try {
      const items = await fetchFeed(quest.feed_kind as FeedKind, provider, feedContext);
      allItems.push(...items);
    } catch (error) {
      console.error(`[feed-quest] Failed to fetch from ${provider.key}:`, error);
      // Continue with other providers
    }
  }

  if (allItems.length === 0) {
    console.warn(`[feed-quest] No items fetched for quest ${questKey}`);
    return { success: false, reason: "unavailable" };
  }

  // Rank and filter
  const { steps, backups } = rankAndFilterFeed(allItems, {
    kind: quest.feed_kind as FeedKind,
    stepsCount: quest.steps_count,
    backupCount: quest.backup_count,
    minRewardUsd: quest.min_reward_usd,
    minCompletionRate: quest.min_completion_rate,
    maxPerNetwork: quest.max_per_network,
    blockedDomains: quest.blocked_domains,
  });

  // Check if we have enough steps (including backups)
  const totalAvailable = steps.length + backups.length;
  
  if (steps.length < quest.steps_count) {
    // Use backups if available
    const needed = quest.steps_count - steps.length;
    const canUseBackups = Math.min(needed, backups.length);
    
    if (canUseBackups > 0) {
      console.log(`[feed-quest] Using ${canUseBackups} backups to fill ${needed} missing steps for quest ${questKey}`);
      steps.push(...backups.splice(0, canUseBackups));
    }
    
    // Still not enough after using backups?
    if (steps.length < quest.steps_count) {
      console.warn(`[feed-quest] Only ${steps.length}/${quest.steps_count} steps available (even after backups) for quest ${questKey}`);
      return { success: false, reason: "unavailable" };
    }
  }

  // Build snapshot (DON'T include URLs - they'll be regenerated with step tokens)
  const snapshot: FeedSnapshot = [
    ...steps.map((item) => ({
      source: item.source,
      campaignId: item.campaignId,
      title: item.title,
      rewardUsd: item.rewardUsd,
      duration: item.durationSeconds,
      completionRate: item.completionRate,
      url: "", // Placeholder - generated per-step with token
      backup: false,
    })),
    ...backups.map((item) => ({
      source: item.source,
      campaignId: item.campaignId,
      title: item.title,
      rewardUsd: item.rewardUsd,
      duration: item.durationSeconds,
      completionRate: item.completionRate,
      url: "", // Placeholder
      backup: true,
    })),
  ];

  // Create session with snapshot
  const { data: session, error: sessionError } = await db
    .from("quest_sessions")
    .insert({
      user_id: userId,
      quest_key: questKey,
      status: "started",
      started_at: new Date().toISOString(),
      feed_snapshot: snapshot,
      ads_required: quest.ads_required ?? 0, // Bug fix: set ads_required from quest (default 0)
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    console.error(`[feed-quest] Failed to create session for ${questKey}:`, sessionError);
    return { success: false, reason: "error" };
  }

  console.log(`[feed-quest] Started ${questKey} for user ${userId}, session ${session.id}, ${steps.length} steps + ${backups.length} backups`);
  
  return { success: true, sessionId: session.id };
}

/**
 * Open a specific feed quest step.
 * Steps must be completed sequentially (1, 2, 3...).
 * 
 * @returns { url: string } or { error: string }
 */
export async function openFeedQuestStepImpl(
  db: DbClient,
  userId: string,
  questKey: string,
  step: number,
  quest: QuestRow,
  request: Request,
): Promise<{ url?: string; error?: string }> {
  if (!quest.feed_kind) {
    return { error: "Invalid quest type" };
  }

  // Get active session
  const { data: session } = await db
    .from("quest_sessions")
    .select("id, feed_snapshot, status")
    .eq("user_id", userId)
    .eq("quest_key", questKey)
    .eq("status", "started")
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (!session) {
    return { error: "No active session" };
  }

  const snapshot = session.feed_snapshot as FeedSnapshot;
  if (!snapshot || snapshot.length === 0) {
    return { error: "Invalid session snapshot" };
  }

  // Validate step number
  const mainSteps = snapshot.filter((s) => !s.backup);
  if (step < 1 || step > mainSteps.length) {
    return { error: "Invalid step number" };
  }

  // Check sequential constraint: step N requires steps 1..N-1 to be completed
  if (step > 1) {
    const { data: completions } = await db
      .from("quest_network_completions")
      .select("step_index")
      .eq("session_id", session.id)
      .eq("kind", "feed");

    const completedSteps = new Set((completions || []).map((c: any) => c.step_index));
    
    for (let i = 1; i < step; i++) {
      if (!completedSteps.has(i)) {
        return { error: `Step ${i} must be completed first` };
      }
    }
  }

  // Get the campaign for this step
  const stepCampaign = mainSteps[step - 1];
  
  // Get user context
  const context = extractUserContext(request);

  // Create or reuse token for this step
  const expiresAt = new Date(Date.now() + quest.token_ttl_hours * 60 * 60 * 1000);
  
  let token: string;
  
  // Try to find existing token for this step
  const { data: existingToken } = await db
    .from("quest_network_tokens")
    .select("token")
    .eq("session_id", session.id)
    .eq("kind", "feed")
    .eq("step_index", step)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (existingToken) {
    token = existingToken.token;
  } else {
    // Generate new token
    token = generateQuestToken();
    
    // Get provider ID
    const { data: provider } = await db
      .from("sdk_offerwall_providers")
      .select("id")
      .eq("slug", stepCampaign.source)
      .maybeSingle();

    if (!provider) {
      return { error: "Provider not found" };
    }

    // Insert token
    const { error: tokenError } = await db
      .from("quest_network_tokens")
      .insert({
        token,
        user_id: userId,
        session_id: session.id,
        provider_id: provider.id,
        quest_key: questKey,
        kind: "feed",
        step_index: step,
        source: stepCampaign.source,
        campaign_id: stepCampaign.campaignId,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error(`[feed-quest] Failed to create token:`, tokenError);
      return { error: "Failed to create token" };
    }
  }

  // Fetch fresh feed with the STEP TOKEN as user ID
  const feedContext: FeedContext = {
    userRef: token, // Use token as user ID
    ip: context.ip,
    country: context.country,
    userAgent: context.userAgent,
  };

  // Load provider
  const { data: providerData } = await db
    .from("sdk_offerwall_providers")
    .select("id, slug, name, extra_config, secret_refs, currency_per_usd, enabled, status")
    .eq("slug", stepCampaign.source)
    .maybeSingle();

  if (!providerData) {
    return { error: "Provider not found" };
  }

  const feedProvider: FeedProvider = {
    id: providerData.id,
    key: providerData.slug,
    name: providerData.name,
    api_key: providerData.extra_config?.api_key || null,
    bearer_token: providerData.extra_config?.bearer_token || null,
    secret: providerData.secret_refs?.secret || null,
    currency_per_usd: Number(providerData.currency_per_usd ?? 1),
    enabled: providerData.enabled,
    status: providerData.status,
  };

  // Fetch fresh feed
  let freshItems: FeedItem[];
  try {
    freshItems = await fetchFeed(quest.feed_kind as FeedKind, feedProvider, feedContext);
  } catch (error) {
    console.error(`[feed-quest] Failed to fetch fresh feed from ${stepCampaign.source}:`, error);
    return { error: "Failed to fetch feed" };
  }

  // Find the campaign in fresh feed
  const freshCampaign = freshItems.find(
    (item) => item.source === stepCampaign.source && item.campaignId === stepCampaign.campaignId
  );

  if (freshCampaign) {
    // Campaign still available, return its URL
    return { url: freshCampaign.url };
  }

  // Campaign unavailable, try to swap with a backup
  console.warn(`[feed-quest] Campaign ${stepCampaign.campaignId} unavailable, trying backup`);
  
  const backups = snapshot.filter((s) => s.backup);
  
  for (const backup of backups) {
    if (backup.source !== stepCampaign.source) continue; // Only swap from same network
    
    const backupInFeed = freshItems.find(
      (item) => item.source === backup.source && item.campaignId === backup.campaignId
    );
    
    if (backupInFeed) {
      // Found available backup, swap it in
      const updatedSnapshot = snapshot.map((s) => {
        if (s.source === stepCampaign.source && s.campaignId === stepCampaign.campaignId && !s.backup) {
          return {
            ...backup,
            backup: false, // Promote backup to main step
          };
        }
        if (s.source === backup.source && s.campaignId === backup.campaignId && s.backup) {
          return {
            ...stepCampaign,
            backup: true, // Demote failed step to backup
          };
        }
        return s;
      });

      // Update session snapshot
      await db
        .from("quest_sessions")
        .update({ feed_snapshot: updatedSnapshot })
        .eq("id", session.id);

      // Update token campaign_id
      await db
        .from("quest_network_tokens")
        .update({ campaign_id: backup.campaignId })
        .eq("token", token);

      console.log(`[feed-quest] Swapped ${stepCampaign.campaignId} with backup ${backup.campaignId}`);
      
      return { url: backupInFeed.url };
    }
  }

  // No available backup
  return { error: "Campaign unavailable and no backup found" };
}
