import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
import { n as computeLockState, t as assertNotLocked } from "./lock-state-BmOk6qOC.mjs";
import { r as creditWallet } from "./coinquest.server-CBcexWIA.mjs";
import { t as normalizeQuest } from "./quest-normalize-Bw3iycyW.mjs";
import crypto, { createHmac } from "crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/quests.server-C-e2yiq_.js
init_client_server();
/**
* Feed adapters for dynamic quest sources.
* 
* Each adapter fetches campaigns from a network feed and normalizes them
* into a common format for ranking and step creation.
*/
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
function generateOfferwallMeSignature(apiKey, userRef, expiresSeconds, secret) {
	const message = `offerwall-user-v1\n${apiKey}\n${userRef}\n${expiresSeconds}`;
	return createHmac("sha256", secret).update(message).digest("hex");
}
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
async function fetchFeed(kind, provider, context) {
	if (!provider.enabled || provider.status === "disabled") {
		console.warn(`[feed] Provider ${provider.key} is not enabled (enabled=${provider.enabled}, status=${provider.status}), skipping`);
		return [];
	}
	if (!provider.currency_per_usd || provider.currency_per_usd <= 0) {
		console.error(`[feed] Provider ${provider.key} has invalid currency_per_usd (${provider.currency_per_usd}), skipping`);
		return [];
	}
	switch (provider.key) {
		case "offerwallme": return fetchOfferwallMe(kind, provider, context);
		case "bitcotasks": return fetchBitcoTasks(kind, provider, context);
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
async function fetchOfferwallMe(kind, provider, context) {
	const apiKey = process.env.OFFERWALLME_API_KEY;
	const bearerToken = process.env.OFFERWALLME_BEARER_TOKEN;
	const secret = process.env.OFFERWALLME_SECRET_KEY;
	if (!apiKey || !secret) {
		console.error("[feed] Offerwall.me missing env vars: OFFERWALLME_API_KEY, OFFERWALLME_SECRET_KEY");
		throw new Error("Offerwall.me credentials not configured");
	}
	if (kind === "article") {
		console.warn("[feed] Offerwall.me does not support article feeds");
		return [];
	}
	const endpoint = kind === "ptc" ? "api.php" : "slapi.php";
	const nowSeconds = Math.floor(Date.now() / 1e3);
	const identityExpires = nowSeconds + 3600;
	const signature = generateOfferwallMeSignature(apiKey, context.userRef, identityExpires, secret);
	console.log(`[feed] Offerwall.me ${kind}: identity expires at ${identityExpires} (now: ${nowSeconds}, TTL: 3600s)`);
	const url = new URL(`https://offerwall.me/${endpoint}`);
	url.searchParams.set("api", apiKey);
	url.searchParams.set("id", context.userRef);
	url.searchParams.set("ip", context.ip);
	url.searchParams.set("token", bearerToken ?? "");
	url.searchParams.set("country", context.country);
	url.searchParams.set("identityExpires", identityExpires.toString());
	url.searchParams.set("identitySignature", signature);
	console.log(`[feed] Fetching Offerwall.me ${kind}: ${url.origin}${url.pathname}`);
	const response = await fetch(url.toString(), { headers: { "User-Agent": context.userAgent } });
	if (!response.ok) {
		const maskedBody = (await response.text().catch(() => "Unable to read response body")).replace(new RegExp(apiKey, "g"), "***API_KEY***").replace(new RegExp(secret, "g"), "***SECRET***");
		console.error(`[feed] Offerwall.me ${kind} HTTP ${response.status}:`, maskedBody);
		throw new Error(`Offerwall.me ${kind} failed: HTTP ${response.status}`);
	}
	const data = (await response.json()).data ?? [];
	if (kind === "ptc") return data.filter((item) => item != null).map((item) => {
		let campaignId = "";
		try {
			campaignId = new URL(item.url).searchParams.get("1") ?? "";
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
			raw: item
		};
	}).filter((item) => item !== null);
	else return data.filter((item) => item != null && (item.remaining_views ?? 0) > 0).map((item) => ({
		source: "offerwallme",
		campaignId: String(item.id ?? ""),
		title: item.name ?? "Shortlink",
		rewardRaw: parseFloat(item.reward) || 0,
		rewardUsd: (parseFloat(item.reward) || 0) / provider.currency_per_usd,
		available: parseInt(item.remaining_views) || 0,
		url: item.shortlink ?? item.url ?? "",
		raw: item
	}));
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
async function fetchBitcoTasks(kind, provider, context) {
	const apiKey = process.env.BITCOTASKS_API_KEY;
	const bearerToken = process.env.BITCOTASKS_BEARER;
	if (!apiKey) {
		console.error("[feed] BitcoTasks missing env var: BITCOTASKS_API_KEY");
		throw new Error("BitcoTasks credentials not configured");
	}
	const endpoint = {
		ptc: "api",
		shortlink: "sl-api",
		article: "ra-api"
	}[kind];
	const url = `https://bitcotasks.com/${endpoint}/${apiKey}/${context.userRef}/${context.ip}`;
	console.log(`[feed] BitcoTasks ${kind} request:`);
	console.log(`[feed]   URL: https://bitcotasks.com/${endpoint}/***/${context.userRef.substring(0, 8)}.../${context.ip}`);
	console.log(`[feed]   IP source: ${context.ipSource ?? "unknown"}`);
	console.log(`[feed]   User-Agent: ${context.userAgent.substring(0, 60)}${context.userAgent.length > 60 ? "..." : ""}`);
	console.log(`[feed]   Bearer token: ${bearerToken ? "present" : "MISSING"}`);
	const headers = { "User-UA": context.userAgent };
	if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;
	const response = await fetch(url, { headers });
	console.log(`[feed] BitcoTasks ${kind} response: HTTP ${response.status}`);
	if (!response.ok) {
		const errorBody = await response.text().catch(() => "Unable to read response body");
		console.error(`[feed] BitcoTasks ${kind} HTTP ${response.status}:`, errorBody);
		if (response.status === 401) {
			if (errorBody.includes("Unauthorized 1")) console.error("[feed] BitcoTasks auth error: Missing or invalid User-UA header");
			else if (errorBody.includes("Unauthorized 2")) {
				console.error("[feed] BitcoTasks auth error: Bearer token is invalid or API key needs whitelisting");
				console.error("[feed] Please verify BITCOTASKS_BEARER matches the token in your BitcoTasks dashboard");
			}
		}
		throw new Error(`BitcoTasks ${kind} failed: HTTP ${response.status}`);
	}
	const json = await response.json();
	const hasData = json.data && Array.isArray(json.data) && json.data.length > 0;
	const isSuccessStatus = json.status === "200" || json.status === "success";
	const isSuccessMessage = json.message === "success" || !json.message;
	if (response.ok && hasData) console.log(`[feed] BitcoTasks ${kind}: ${json.data.length} campaigns available`);
	else if (!isSuccessStatus && !isSuccessMessage && json.status) {
		console.error(`[feed] BitcoTasks ${kind} API error:`, json.message ?? json.status ?? "Unknown error");
		throw new Error(`BitcoTasks ${kind} error: ${json.message ?? json.status ?? "Unknown error"}`);
	} else if (!hasData) {
		console.log(`[feed] BitcoTasks ${kind}: No campaigns available (status: ${json.status ?? "none"}, message: ${json.message ?? "none"})`);
		return [];
	}
	const data = json.data ?? [];
	if (kind === "ptc") return data.filter((item) => item != null).map((item) => ({
		source: "bitcotasks",
		campaignId: String(item.id ?? ""),
		title: item.title ?? "PTC Ad",
		rewardRaw: parseFloat(item.reward) || 0,
		rewardUsd: (parseFloat(item.reward) || 0) / provider.currency_per_usd,
		durationSeconds: parseInt(item.duration) || 0,
		url: item.url ?? "",
		raw: item
	}));
	else if (kind === "shortlink") return data.filter((item) => item != null && (item.available ?? 0) > 0).map((item) => ({
		source: "bitcotasks",
		campaignId: String(item.id ?? ""),
		title: item.title ?? "Shortlink",
		rewardRaw: parseFloat(item.reward) || 0,
		rewardUsd: (parseFloat(item.reward) || 0) / provider.currency_per_usd,
		completionRate: parseInt(item.completion_rate) || 0,
		available: parseInt(item.available) || 0,
		url: item.url ?? "",
		raw: item
	}));
	else return data.filter((item) => item != null && (item.available ?? 0) > 0).map((item) => ({
		source: "bitcotasks",
		campaignId: String(item.id ?? ""),
		title: item.title ?? "Article",
		rewardRaw: parseFloat(item.reward) || 0,
		rewardUsd: (parseFloat(item.reward) || 0) / provider.currency_per_usd,
		available: parseInt(item.available) || 0,
		url: item.url ?? "",
		raw: item
	}));
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
function rankAndFilterFeed(items, options) {
	let filtered = items;
	if (options.kind === "shortlink") filtered = filtered.filter((item) => (item.completionRate ?? 100) >= options.minCompletionRate);
	if (options.kind === "shortlink" || options.kind === "article") filtered = filtered.filter((item) => (item.available ?? 1) > 0);
	if (options.blockedDomains.length > 0) filtered = filtered.filter((item) => {
		try {
			const hostname = new URL(item.url).hostname.toLowerCase();
			return !options.blockedDomains.some((domain) => hostname.includes(domain.toLowerCase()));
		} catch {
			return true;
		}
	});
	const ranked = filtered.sort((a, b) => {
		if (options.kind === "ptc") {
			if (Math.abs(a.rewardUsd - b.rewardUsd) > 1e-4) return b.rewardUsd - a.rewardUsd;
			return (a.durationSeconds ?? 0) - (b.durationSeconds ?? 0);
		} else if (options.kind === "shortlink") {
			if (Math.abs(a.rewardUsd - b.rewardUsd) > 1e-4) return b.rewardUsd - a.rewardUsd;
			return (b.completionRate ?? 0) - (a.completionRate ?? 0);
		} else return b.rewardUsd - a.rewardUsd;
	});
	let final = ranked;
	if (options.maxPerNetwork && options.maxPerNetwork > 0) {
		const countByNetwork = {};
		final = ranked.filter((item) => {
			const count = countByNetwork[item.source] ?? 0;
			if (count >= options.maxPerNetwork) return false;
			countByNetwork[item.source] = count + 1;
			return true;
		});
	}
	return {
		steps: final.slice(0, options.stepsCount),
		backups: final.slice(options.stepsCount, options.stepsCount + options.backupCount)
	};
}
/**
* Feed Quest Logic - Part 2
* 
* Implements feed quests (feed_ptc, feed_shortlink, feed_article) that build
* steps dynamically from network feeds.
*/
/**
* Generate a quest token for feed quests.
* Format: "q_" + 24 url-safe random characters
*/
function generateQuestToken() {
	return "q_" + crypto.randomBytes(18).toString("base64url").slice(0, 24);
}
/**
* Get user's real IP, country, and User-Agent from request headers.
* Server-side only - never expose to client.
*/
function extractUserContext(request) {
	let ip = "";
	let ipSource = "none";
	const cfIp = request.headers.get("cf-connecting-ip");
	if (cfIp) {
		ip = cfIp.trim();
		ipSource = "cf-connecting-ip";
	}
	if (!ip) {
		const xffIp = request.headers.get("x-forwarded-for");
		if (xffIp) {
			ip = xffIp.split(",")[0].trim().split(":")[0];
			ipSource = "x-forwarded-for";
		}
	}
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
			xRealIp: request.headers.get("x-real-ip") ?? "null"
		});
		throw new Error("Cannot determine user IP address");
	}
	console.log(`[feed] Extracted IP: ${ip} from ${ipSource}`);
	const country = request.headers.get("cf-ipcountry") || request.headers.get("x-country-code") || "US";
	const userAgent = request.headers.get("user-agent") || "Mozilla/5.0 (Unknown)";
	return {
		ip,
		country,
		userAgent,
		ipSource
	};
}
/**
* Start a feed quest: fetch feeds, rank, and store snapshot.
* 
* @returns { success: true, sessionId } or { success: false, reason: "unavailable" | "error" }
*/
async function startFeedQuestImpl(db, userId, questKey, quest, request) {
	if (!quest.feed_kind) return {
		success: false,
		reason: "error"
	};
	const context = extractUserContext(request);
	const { data: providers } = await db.from("sdk_offerwall_providers").select("id, slug, name, extra_config, secret_refs, currency_per_usd, enabled, status").in("id", quest.feed_provider_ids).eq("enabled", true).neq("status", "disabled");
	if (!providers || providers.length === 0) {
		console.warn(`[feed-quest] No enabled providers for quest ${questKey}`);
		return {
			success: false,
			reason: "unavailable"
		};
	}
	const feedProviders = providers.map((p) => ({
		id: p.id,
		key: p.slug,
		name: p.name,
		api_key: null,
		bearer_token: null,
		secret: null,
		currency_per_usd: Number(p.currency_per_usd ?? 1),
		enabled: p.enabled,
		status: p.status
	})).filter((p) => p.currency_per_usd > 0);
	if (feedProviders.length === 0) {
		console.warn(`[feed-quest] No valid providers after filtering for quest ${questKey}`);
		return {
			success: false,
			reason: "unavailable"
		};
	}
	const feedContext = {
		userRef: userId,
		ip: context.ip,
		country: context.country,
		userAgent: context.userAgent,
		ipSource: context.ipSource
	};
	const allItems = [];
	for (const provider of feedProviders) try {
		const items = await fetchFeed(quest.feed_kind, provider, feedContext);
		allItems.push(...items);
	} catch (error) {
		console.error(`[feed-quest] Failed to fetch from ${provider.key}:`, error);
	}
	if (allItems.length === 0) {
		console.warn(`[feed-quest] No items fetched for quest ${questKey}`);
		return {
			success: false,
			reason: "unavailable"
		};
	}
	const { steps, backups } = rankAndFilterFeed(allItems, {
		kind: quest.feed_kind,
		stepsCount: quest.steps_count,
		backupCount: quest.backup_count,
		minRewardUsd: quest.min_reward_usd,
		minCompletionRate: quest.min_completion_rate,
		maxPerNetwork: quest.max_per_network,
		blockedDomains: quest.blocked_domains
	});
	steps.length + backups.length;
	if (steps.length < quest.steps_count) {
		const needed = quest.steps_count - steps.length;
		const canUseBackups = Math.min(needed, backups.length);
		if (canUseBackups > 0) {
			console.log(`[feed-quest] Using ${canUseBackups} backups to fill ${needed} missing steps for quest ${questKey}`);
			steps.push(...backups.splice(0, canUseBackups));
		}
		if (steps.length < quest.steps_count) {
			console.warn(`[feed-quest] Only ${steps.length}/${quest.steps_count} steps available (even after backups) for quest ${questKey}`);
			return {
				success: false,
				reason: "unavailable"
			};
		}
	}
	const snapshot = [...steps.map((item) => ({
		source: item.source,
		campaignId: item.campaignId,
		title: item.title,
		rewardUsd: item.rewardUsd,
		duration: item.durationSeconds,
		completionRate: item.completionRate,
		url: "",
		backup: false
	})), ...backups.map((item) => ({
		source: item.source,
		campaignId: item.campaignId,
		title: item.title,
		rewardUsd: item.rewardUsd,
		duration: item.durationSeconds,
		completionRate: item.completionRate,
		url: "",
		backup: true
	}))];
	const { data: session, error: sessionError } = await db.from("quest_sessions").insert({
		user_id: userId,
		quest_key: questKey,
		quest_type: "feed",
		current_step: 0,
		ads_required: quest.ads_required ?? 0,
		ads_watched: 0,
		reward_amount: quest.reward_amount,
		status: "started",
		started_at: (/* @__PURE__ */ new Date()).toISOString(),
		feed_snapshot: snapshot
	}).select("id").single();
	if (sessionError || !session) {
		console.error(`[feed-quest] Failed to create session for ${questKey}:`, sessionError);
		return {
			success: false,
			reason: "error"
		};
	}
	console.log(`[feed-quest] Started ${questKey} for user ${userId}, session ${session.id}, ${steps.length} steps + ${backups.length} backups`);
	return {
		success: true,
		sessionId: session.id
	};
}
/**
* Open a specific feed quest step.
* Steps must be completed sequentially (1, 2, 3...).
* 
* @returns { url: string } or { error: string }
*/
async function openFeedQuestStepImpl(db, userId, questKey, step, quest, request) {
	if (!quest.feed_kind) return { error: "Invalid quest type" };
	const { data: session } = await db.from("quest_sessions").select("id, feed_snapshot, status").eq("user_id", userId).eq("quest_key", questKey).order("started_at", { ascending: false }).limit(1).maybeSingle();
	if (!session) {
		console.error(`[feed-quest] No session found: questKey=${questKey}, userId=${userId}`);
		return { error: "No session found for this quest" };
	}
	if (session.status !== "started") return { error: `Quest is ${session.status}. Cannot open new steps.` };
	const snapshot = session.feed_snapshot;
	if (!snapshot || snapshot.length === 0) return { error: "Invalid session snapshot" };
	const mainSteps = snapshot.filter((s) => !s.backup);
	if (step < 1 || step > mainSteps.length) return { error: "Invalid step number" };
	if (step > 1) {
		const { data: completions } = await db.from("quest_network_completions").select("step_index").eq("session_id", session.id).eq("kind", "feed");
		const completedSteps = new Set((completions || []).map((c) => c.step_index));
		for (let i = 1; i < step; i++) if (!completedSteps.has(i)) return { error: `Step ${i} must be completed first` };
	}
	const stepCampaign = mainSteps[step - 1];
	const context = extractUserContext(request);
	const expiresAt = new Date(Date.now() + quest.token_ttl_hours * 60 * 60 * 1e3);
	let token;
	const { data: existingToken } = await db.from("quest_network_tokens").select("token").eq("session_id", session.id).eq("kind", "feed").eq("step_index", step).gt("expires_at", (/* @__PURE__ */ new Date()).toISOString()).maybeSingle();
	if (existingToken) token = existingToken.token;
	else {
		token = generateQuestToken();
		const { data: provider } = await db.from("sdk_offerwall_providers").select("id").eq("slug", stepCampaign.source).maybeSingle();
		if (!provider) return { error: "Provider not found" };
		const { error: tokenError } = await db.from("quest_network_tokens").insert({
			token,
			user_id: userId,
			session_id: session.id,
			provider_id: provider.id,
			quest_key: questKey,
			kind: "feed",
			step_index: step,
			source: stepCampaign.source,
			campaign_id: stepCampaign.campaignId,
			expires_at: expiresAt.toISOString()
		});
		if (tokenError) {
			console.error(`[feed-quest] Failed to create token:`, tokenError);
			return { error: "Failed to create token" };
		}
	}
	const feedContext = {
		userRef: token,
		ip: context.ip,
		country: context.country,
		userAgent: context.userAgent
	};
	const { data: providerData } = await db.from("sdk_offerwall_providers").select("id, slug, name, extra_config, secret_refs, currency_per_usd, enabled, status").eq("slug", stepCampaign.source).maybeSingle();
	if (!providerData) return { error: "Provider not found" };
	const feedProvider = {
		id: providerData.id,
		key: providerData.slug,
		name: providerData.name,
		api_key: providerData.extra_config?.api_key || null,
		bearer_token: providerData.extra_config?.bearer_token || null,
		secret: providerData.secret_refs?.secret || null,
		currency_per_usd: Number(providerData.currency_per_usd ?? 1),
		enabled: providerData.enabled,
		status: providerData.status
	};
	let freshItems;
	try {
		freshItems = await fetchFeed(quest.feed_kind, feedProvider, feedContext);
	} catch (error) {
		console.error(`[feed-quest] Failed to fetch fresh feed from ${stepCampaign.source}:`, error);
		return { error: "Failed to fetch feed" };
	}
	const freshCampaign = freshItems.find((item) => item.source === stepCampaign.source && item.campaignId === stepCampaign.campaignId);
	if (freshCampaign) return { url: freshCampaign.url };
	console.warn(`[feed-quest] Campaign ${stepCampaign.campaignId} unavailable, trying backup`);
	const backups = snapshot.filter((s) => s.backup);
	for (const backup of backups) {
		if (backup.source !== stepCampaign.source) continue;
		const backupInFeed = freshItems.find((item) => item.source === backup.source && item.campaignId === backup.campaignId);
		if (backupInFeed) {
			const updatedSnapshot = snapshot.map((s) => {
				if (s.source === stepCampaign.source && s.campaignId === stepCampaign.campaignId && !s.backup) return {
					...backup,
					backup: false
				};
				if (s.source === backup.source && s.campaignId === backup.campaignId && s.backup) return {
					...stepCampaign,
					backup: true
				};
				return s;
			});
			await db.from("quest_sessions").update({ feed_snapshot: updatedSnapshot }).eq("id", session.id);
			await db.from("quest_network_tokens").update({ campaign_id: backup.campaignId }).eq("token", token);
			console.log(`[feed-quest] Swapped ${stepCampaign.campaignId} with backup ${backup.campaignId}`);
			return { url: backupInFeed.url };
		}
	}
	return { error: "Campaign unavailable and no backup found" };
}
/**
* Process an active time ping - calls atomic Postgres function
* 
* @param db - Supabase client (service role)
* @param userId - Authenticated user ID
* @param questKey - Quest key
* @param lastToken - Token from previous ping (null on first ping)
* @param isActive - Whether user is actively interacting (false = idle, no credit)
* @returns Ping result with next token and progress
*/
async function processActiveTimePing(db, userId, questKey, lastToken, isActive = true) {
	const userShort = userId.slice(0, 8);
	const tokenShort = lastToken?.slice(0, 8) || "null";
	const params = {
		p_user_id: userId,
		p_quest_key: questKey,
		p_ping_token: lastToken,
		p_is_active: isActive
	};
	console.log(`[active-time] PING user=${userShort} quest=${questKey} token=${tokenShort} active=${isActive}`);
	console.log(`[active-time] RPC params:`, JSON.stringify(params, null, 2));
	try {
		const { data, error } = await db.rpc("ping_active_time", params);
		if (error) {
			console.error(`[active-time] RPC ERROR user=${userShort}:`, {
				code: error.code,
				message: error.message,
				details: error.details,
				hint: error.hint,
				params
			});
			throw new Error(`Ping RPC failed: ${error.code} - ${error.message}${error.hint ? ` (${error.hint})` : ""}`);
		}
		if (!data || data.length === 0) {
			console.error(`[active-time] RPC returned no data for user=${userShort}`);
			throw new Error("Ping returned no data");
		}
		const result = data[0];
		console.log(`[active-time] SUCCESS user=${userShort} reason=${result.reason} total=${result.total_seconds}s today=${result.today_seconds}s nextToken=${result.next_token?.slice(0, 8) || "null"}`);
		return {
			success: result.success,
			reason: result.reason,
			nextToken: result.next_token,
			totalSeconds: result.total_seconds,
			todaySeconds: result.today_seconds,
			targetSeconds: result.target_seconds,
			progressPercent: Math.min(100, result.total_seconds / result.target_seconds * 100),
			canClaim: result.can_claim
		};
	} catch (error) {
		console.error(`[active-time] EXCEPTION user=${userShort}:`, error);
		throw error;
	}
}
/**
* Start a grace period when user clicks an offer/survey
*/
async function startActiveTimeGrace(db, userId, questKey, offerId) {
	const now = /* @__PURE__ */ new Date();
	const { data: quest } = await db.from("quests").select("grace_minutes, is_active").eq("key", questKey).eq("quest_type", "active_time").maybeSingle();
	if (!quest || !quest.is_active) return {
		success: false,
		reason: "quest_not_found",
		graceUntil: null
	};
	const graceMinutes = quest.grace_minutes || 10;
	const graceUntil = new Date(now.getTime() + graceMinutes * 60 * 1e3);
	const { data: progress } = await db.from("quest_active_time_progress").select("*").eq("user_id", userId).eq("quest_key", questKey).maybeSingle();
	if (!progress) return {
		success: false,
		reason: "progress_not_found",
		graceUntil: null
	};
	if (progress.credited_at) return {
		success: false,
		reason: "already_claimed",
		graceUntil: null
	};
	const hourStart = /* @__PURE__ */ new Date(now.getTime() - 36e5);
	const graceHourStart = progress.grace_hour_start ? new Date(progress.grace_hour_start) : null;
	let graceCount = progress.grace_count_hour || 0;
	if (!graceHourStart || graceHourStart < hourStart) graceCount = 0;
	if (graceCount >= 3) return {
		success: false,
		reason: "grace_limit_reached",
		graceUntil: null
	};
	const cooldownStart = /* @__PURE__ */ new Date(now.getTime() - 864e5);
	const { data: recentGrace } = await db.from("quest_active_time_grace_history").select("id").eq("user_id", userId).eq("quest_key", questKey).eq("offer_id", offerId).gte("started_at", cooldownStart.toISOString()).limit(1).maybeSingle();
	if (recentGrace) return {
		success: false,
		reason: "offer_cooldown",
		graceUntil: null
	};
	await db.from("quest_active_time_progress").update({
		grace_until: graceUntil.toISOString(),
		grace_offer_id: offerId,
		grace_count_hour: graceCount + 1,
		grace_hour_start: graceHourStart && graceHourStart >= hourStart ? graceHourStart.toISOString() : now.toISOString(),
		updated_at: now.toISOString()
	}).eq("user_id", userId).eq("quest_key", questKey);
	await db.from("quest_active_time_grace_history").insert({
		user_id: userId,
		quest_key: questKey,
		offer_id: offerId,
		started_at: now.toISOString()
	});
	return {
		success: true,
		graceUntil: graceUntil.toISOString()
	};
}
/**
* End grace period early
*/
async function endActiveTimeGrace(db, userId, questKey, offerId) {
	const now = /* @__PURE__ */ new Date();
	const { data: progress } = await db.from("quest_active_time_progress").select("grace_offer_id, grace_until").eq("user_id", userId).eq("quest_key", questKey).maybeSingle();
	if (!progress || progress.grace_offer_id !== offerId) return;
	await db.from("quest_active_time_progress").update({
		grace_until: null,
		grace_offer_id: null,
		updated_at: now.toISOString()
	}).eq("user_id", userId).eq("quest_key", questKey);
	await db.from("quest_active_time_grace_history").update({ ended_at: now.toISOString() }).eq("user_id", userId).eq("quest_key", questKey).eq("offer_id", offerId).is("ended_at", null).order("started_at", { ascending: false }).limit(1);
}
/**
* Claim active time quest reward
*/
async function claimActiveTimeReward(db, userId, questKey) {
	const { data, error } = await db.rpc("claim_active_time_quest_reward", {
		p_user_id: userId,
		p_quest_key: questKey
	});
	if (error || !data || data.length === 0) {
		console.error("[active-time] RPC claim failed:", error);
		return {
			success: false,
			reason: "claim_failed"
		};
	}
	const result = data[0];
	if (!result.out_success) return {
		success: false,
		reason: result.out_reason,
		totalSeconds: result.out_total_seconds
	};
	try {
		const { creditWallet } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
		const rewardAmount = Number(result.out_reward_amount);
		const { data: quest } = await db.from("quests").select("label").eq("key", questKey).maybeSingle();
		const questLabel = quest?.label || questKey;
		let { data: session } = await db.from("quest_sessions").select("id").eq("user_id", userId).eq("quest_key", questKey).in("status", ["started", "verified"]).order("started_at", { ascending: false }).maybeSingle();
		if (!session) {
			const { data: newSession, error: sessionError } = await db.from("quest_sessions").insert({
				user_id: userId,
				quest_key: questKey,
				quest_type: "active_time",
				status: "started",
				reward_amount: rewardAmount
			}).select("id").single();
			if (sessionError) {
				console.error("[active-time] Session create failed:", sessionError);
				await db.from("quest_active_time_progress").update({ credited_at: null }).eq("user_id", userId).eq("quest_key", questKey);
				return {
					success: false,
					reason: "session_creation_failed"
				};
			}
			session = newSession;
		}
		const sessionId = session.id;
		await creditWallet(userId, rewardAmount, "quest", `Active time — ${questLabel}`, "earned", sessionId);
		await db.from("quest_sessions").update({
			status: "credited",
			credited_at: (/* @__PURE__ */ new Date()).toISOString()
		}).eq("id", sessionId);
		await db.from("notifications").insert({
			user_id: userId,
			title: "Quest completed",
			body: `You earned $${rewardAmount.toFixed(2)} for "${questLabel}".`,
			kind: "quest"
		});
		return {
			success: true,
			reason: "claimed",
			totalSeconds: result.out_total_seconds
		};
	} catch (creditError) {
		console.error("[active-time] Wallet credit failed:", creditError);
		await db.from("quest_active_time_progress").update({ credited_at: null }).eq("user_id", userId).eq("quest_key", questKey);
		return {
			success: false,
			reason: "wallet_credit_failed"
		};
	}
}
/**
* Server implementations for the DB-backed Starter Quests + Shortlink Chain quests.
* Lock columns added by 20261210000000_quest_offerwall_locks.sql.
*
* The generated supabase types don't include the new table yet, so we access
* the client via an untyped alias — safe because runtime schema is authoritative.
*/
var db = supabaseAdmin;
var normalize = normalizeQuest;
/**
* Both figures the lock rules depend on, in one round trip.
* lifetime_withdrawn is incremented once per approved withdrawal, so `> 0` is the
* "has withdrawn at least once" signal used by the 'first_withdrawal' lock.
*/
async function fetchLockInputs(userId) {
	const { data } = await db.from("profiles").select("lifetime_earned, lifetime_withdrawn").eq("id", userId).maybeSingle();
	return {
		lifetimeEarned: Number(data?.lifetime_earned ?? 0),
		lifetimeWithdrawn: Number(data?.lifetime_withdrawn ?? 0)
	};
}
/**
* Active quests for the starter row.
* When userId is provided, each quest is annotated with is_locked + unlock_reason
* computed server-side in UTC. Locked quests are INCLUDED so the client can render
* a locked state instead of hiding them.
* Ads quests are filtered out when ADS_ENABLED is false.
* App-only quests are filtered out when isNative is false.
*
* @param isNative - Client-reported platform flag. WARNING: Can be spoofed. Server enforcement
*                   in assertQuestNotLocked provides additional protection.
*/
async function listActiveQuestsImpl(userId, isNative) {
	const { data, error } = await db.from("quests").select("*").eq("is_active", true).order("sort_order", { ascending: true });
	if (error) throw new Error(error.message ?? "Could not load quests.");
	let rows = (data ?? []).map((r) => normalize(r));
	const { areAdsEnabledImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	if (!await areAdsEnabledImpl()) rows = rows.filter((quest) => quest.quest_type !== "ads");
	if (isNative === false) rows = rows.filter((quest) => !quest.app_only);
	const { lifetimeEarned, lifetimeWithdrawn } = userId ? await fetchLockInputs(userId) : {
		lifetimeEarned: 0,
		lifetimeWithdrawn: 0
	};
	return rows.map((quest) => {
		const lockState = userId ? computeLockState(quest.lock_type, quest.unlock_at, quest.required_lifetime_earned, lifetimeEarned, lifetimeWithdrawn) : {
			is_locked: false,
			unlock_reason: null
		};
		return {
			...quest,
			...lockState
		};
	});
}
async function listAdminQuestsImpl() {
	const { data, error } = await db.from("quests").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true });
	if (error) throw new Error(error.message ?? "Could not load quests.");
	return (data ?? []).map((r) => normalize(r));
}
async function upsertQuestImpl(input) {
	const lockerUrls = (input.lockerUrls ?? []).map((url) => url.trim()).filter(Boolean);
	const shortlinkSteps = input.shortlinkSteps ?? [];
	const timedSteps = input.timedSteps ?? [];
	if (input.questType === "shortlink" && shortlinkSteps.length > 10) throw new Error(`A shortlink quest can have at most 10 steps.`);
	if (input.questType === "timed_ptc" && timedSteps.length > 10) throw new Error("A timed PTC quest can have at most 10 steps.");
	if (input.questType === "ads" && input.adsRequired < 1) throw new Error("Ads-type quests need at least 1 ad.");
	if (input.questType === "locker") {
		if (lockerUrls.length > 10) throw new Error(`A locker quest can have at most 10 locker URLs.`);
		if (lockerUrls.some((url) => !/^https?:\/\/.+/.test(url))) throw new Error("Every locker URL must be valid (must start with http:// or https://).");
	}
	/**
	* The admin's Active toggle is authoritative, including for a quest with zero
	* links. Such a quest is visible and tappable; the start calls below return
	* `{ unavailable: true }` so the user sees a friendly "link coming soon"
	* instead of an error, and no reward is ever credited for it.
	*/
	const isActive = input.isActive;
	if (input.lockType === "time" && !input.unlockAt) throw new Error("A time-locked quest requires an unlock date.");
	if (input.lockType === "earning" && (input.requiredLifetimeEarned == null || input.requiredLifetimeEarned <= 0)) throw new Error("An earning-locked quest requires a positive required amount.");
	const isFeedQuest = input.questType === "feed_ptc" || input.questType === "feed_shortlink" || input.questType === "feed_article";
	const feedKind = input.questType === "feed_ptc" ? "ptc" : input.questType === "feed_shortlink" ? "shortlink" : input.questType === "feed_article" ? "article" : null;
	const row = {
		key: input.key.trim(),
		label: input.label.trim(),
		icon: (input.icon || "gift").trim(),
		quest_type: input.questType,
		ads_required: input.questType === "ads" ? input.adsRequired : 0,
		reward_amount: input.rewardAmount,
		step_reward: input.stepReward ?? 0,
		step_rewards: input.stepRewards ?? null,
		shortlink_steps: input.questType === "shortlink" ? shortlinkSteps : [],
		min_seconds_per_step: input.minSecondsPerStep,
		locker_urls: input.questType === "locker" ? lockerUrls : [],
		total_days: input.questType === "checkin" ? input.totalDays : 3,
		required_active_seconds: input.questType === "checkin" ? input.requiredActiveSeconds : 300,
		streak_mode: input.questType === "checkin" ? input.streakMode : "consecutive",
		grace_days: input.questType === "checkin" ? input.graceDays : 0,
		day1_auto_complete: input.questType === "checkin" ? input.day1AutoComplete : true,
		repeatable: input.questType === "checkin" ? input.repeatable : false,
		default_timezone: input.questType === "checkin" ? input.defaultTimezone : "Asia/Kolkata",
		network_provider_ids: input.questType === "network" ? input.networkProviderIds : [],
		required_count: input.questType === "network" ? input.requiredCount : 3,
		min_qualifying_usd: input.questType === "network" ? input.minQualifyingUsd : .01,
		reward_hold_hours: input.questType === "network" ? input.rewardHoldHours : 0,
		feed_kind: feedKind,
		steps_count: isFeedQuest ? input.stepsCount ?? 10 : 10,
		backup_count: isFeedQuest ? input.backupCount ?? 4 : 4,
		feed_provider_ids: isFeedQuest ? input.feedProviderIds ?? [] : [],
		min_reward_usd: isFeedQuest ? input.minRewardUsd ?? 0 : 0,
		min_completion_rate: isFeedQuest ? input.minCompletionRate ?? 50 : 50,
		max_per_network: isFeedQuest ? input.maxPerNetwork ?? null : null,
		blocked_domains: isFeedQuest ? input.blockedDomains ?? [] : [],
		token_ttl_hours: input.questType === "network" ? input.tokenTtlHours : isFeedQuest ? input.tokenTtlHours ?? 48 : 24,
		timed_steps: input.questType === "timed_ptc" ? timedSteps : [],
		timed_step_seconds: input.questType === "timed_ptc" ? input.timedStepSeconds : 60,
		timed_checkpoint_seconds: input.questType === "timed_ptc" ? input.timedCheckpointSeconds : 10,
		timed_max_failed_taps: input.questType === "timed_ptc" ? input.timedMaxFailedTaps : 2,
		target_minutes: input.questType === "active_time" ? input.targetMinutes : 30,
		daily_cap_minutes: input.questType === "active_time" ? input.dailyCapMinutes : 120,
		grace_minutes: input.questType === "active_time" ? input.graceMinutes : 10,
		is_active: isActive,
		sort_order: input.sortOrder,
		lock_type: input.lockType,
		unlock_at: input.lockType === "time" ? input.unlockAt : null,
		required_lifetime_earned: input.lockType === "earning" ? input.requiredLifetimeEarned : null,
		app_only: input.appOnly
	};
	if (input.id) {
		const { data, error } = await db.from("quests").update(row).eq("id", input.id).select("id").single();
		if (error) throw new Error(error.message ?? "Could not save quest.");
		return data;
	}
	const { data, error } = await db.from("quests").insert(row).select("id").single();
	if (error) throw new Error(error.message ?? "Could not create quest.");
	return data;
}
async function deleteQuestImpl(id) {
	const quest = await db.from("quests").select("key").eq("id", id).single();
	if (quest.error) throw new Error("Quest not found.");
	if ((await db.from("quest_sessions").select("id").eq("quest_key", quest.data.key).limit(1)).data?.length) {
		const { error } = await db.from("quests").update({ is_active: false }).eq("id", id);
		if (error) throw new Error(error.message ?? "Could not deactivate quest.");
		return {
			deleted: false,
			deactivated: true
		};
	}
	const { error } = await db.from("quests").delete().eq("id", id);
	if (error) throw new Error(error.message ?? "Could not delete quest.");
	return {
		deleted: true,
		deactivated: false
	};
}
async function getQuestByKey(key) {
	const { data, error } = await db.from("quests").select("*").eq("key", key).eq("is_active", true).maybeSingle();
	if (error) throw new Error(error.message ?? "Quest lookup failed.");
	if (!data) throw new Error("Unknown quest.");
	return normalize(data);
}
/**
* Credits the reward for completing a quest step (shortlink or locker).
* Idempotent via quest_step_credits unique constraint.
* Returns the amount credited (0 if already credited or if step_reward is 0).
* 
* RECONCILIATION: Find orphaned claims (claim without matching wallet transaction):
* 
* SELECT qsc.id, qsc.user_id, qsc.quest_key, qsc.step_index, qsc.amount, qsc.created_at
* FROM quest_step_credits qsc
* LEFT JOIN wallet_transactions wt
*   ON wt.reference_id = CONCAT('quest_step_', qsc.session_id, '_', qsc.step_index)
*   AND wt.user_id = qsc.user_id
*   AND wt.transaction_type = 'earned'
* WHERE wt.id IS NULL
*   AND qsc.amount > 0
* ORDER BY qsc.created_at DESC;
* 
* These rows indicate a crash occurred between claim insert and wallet credit.
* To reconcile: manually credit the wallet or delete the orphaned claim row.
*/
async function creditStepReward(userId, sessionId, questKey, questLabel, stepIndex, stepReward, metadata) {
	if (stepReward <= 0) return 0;
	const roundedAmount = Math.round(stepReward * 100) / 100;
	if (Math.abs(stepReward - roundedAmount) > .001) console.warn(`[quests] Step reward ${stepReward} exceeds wallet precision, rounding to ${roundedAmount}`);
	try {
		const { error: insertError } = await db.from("quest_step_credits").insert({
			session_id: sessionId,
			user_id: userId,
			quest_key: questKey,
			step_index: stepIndex,
			amount: roundedAmount,
			metadata: metadata || {}
		});
		if (insertError) {
			if (insertError.code === "23505") return 0;
			throw insertError;
		}
		try {
			await creditWallet(userId, roundedAmount, "quest_step", `Quest step ${stepIndex} — ${questLabel}`, "earned", null);
			return roundedAmount;
		} catch (creditError) {
			await db.from("quest_step_credits").delete().eq("session_id", sessionId).eq("step_index", stepIndex);
			throw creditError;
		}
	} catch (error) {
		console.error(`[quests] Failed to credit step ${stepIndex} reward for session ${sessionId}:`, error);
		return 0;
	}
}
/**
* Server-side lock enforcement.
* Fetches the user's current lifetime_earned and throws if the quest is locked.
* Call this before allowing any quest progress or crediting any reward.
*/
async function assertQuestNotLocked(userId, quest) {
	if (quest.lock_type === "none") return;
	const { lifetimeEarned, lifetimeWithdrawn } = await fetchLockInputs(userId);
	const state = computeLockState(quest.lock_type, quest.unlock_at, quest.required_lifetime_earned, lifetimeEarned, lifetimeWithdrawn);
	assertNotLocked(state, quest.label);
}
/**
* Server-side platform enforcement for app-only quests.
* Throws if the quest is marked app_only and the request is NOT from a native app.
* Call this before allowing any quest progress or crediting any reward.
*
* WARNING: Platform detection can be spoofed. This is a best-effort check to improve
* UX and reduce accidental web access, not a security boundary.
*/
function assertQuestPlatform(quest, isNative) {
	if (quest.app_only && !isNative) throw new Error("This quest is only available in the app");
}
/**
* Records the generic "a quest was completed" event that the quest_count task
* type counts. One event per quest SESSION across every quest type, deduplicated
* by session id via the unique (user_id, event_type, event_key) index.
*
* Task automation must never roll back a quest that has already been credited,
* so a failure here is swallowed — matching how the offerwall postback treats it.
*/
async function recordQuestCompletedEvent(userId, sessionId) {
	try {
		const { recordTaskEvent } = await import("./engine.server-C6tIpR1m.mjs");
		await recordTaskEvent({
			userId,
			eventType: "quest_completed",
			eventKey: sessionId
		});
	} catch (error) {
		console.error(`[quests] quest_completed task event failed for session ${sessionId}:`, error instanceof Error ? error.message : error);
	}
}
/**
* Records a task event for shortlink step completion.
* One event per step, keyed as `${sessionId}:${step}` so each step counts exactly once.
* Failure is non-fatal and never rolls back the credited step.
*/
async function recordShortlinkStepEvent(userId, sessionId, step) {
	try {
		const { recordTaskEvent } = await import("./engine.server-C6tIpR1m.mjs");
		await recordTaskEvent({
			userId,
			eventType: "shortlink",
			eventKey: `${sessionId}:${step}`
		});
	} catch (error) {
		console.error(`[quests] shortlink task event failed for session ${sessionId} step ${step}:`, error instanceof Error ? error.message : error);
	}
}
/**
* Records a task event for content locker step completion.
* One event per step, keyed as `${sessionId}:${step}` so each step counts exactly once.
* Failure is non-fatal and never rolls back the credited step.
*/
async function recordLockerStepEvent(userId, sessionId, step) {
	try {
		const { recordTaskEvent } = await import("./engine.server-C6tIpR1m.mjs");
		await recordTaskEvent({
			userId,
			eventType: "content_locker",
			eventKey: `${sessionId}:${step}`
		});
	} catch (error) {
		console.error(`[quests] content_locker task event failed for session ${sessionId} step ${step}:`, error instanceof Error ? error.message : error);
	}
}
/**
* Pays a 'verified' locker/shortlink session and marks it credited.
*
* Safe to call more than once and from overlapping requests: the credit is
* keyed on the session id, so only the first call pays (and notifies). A
* session left 'verified' by a failed credit is finished by the user's next
* attempt instead of being stranded.
*/
async function finishQuestSession(userId, sessionId, reward, description) {
	const credit = await creditWallet(userId, reward, "quest", description, "earned", sessionId);
	await db.from("quest_sessions").update({
		status: "credited",
		credited_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", sessionId).eq("status", "verified");
	if (!credit.duplicate) await db.from("notifications").insert({
		user_id: userId,
		title: "Quest completed",
		body: `You earned $${reward.toFixed(2)}.`,
		kind: "quest"
	});
	await recordQuestCompletedEvent(userId, sessionId);
}
/**
* Start a locker quest for a user.
*
* DESIGN NOTE — "most recent started session" fallback:
* AdBlueMedia's locker builder has a single static "Redirect URL" field with no
* per-session macro support. We therefore cannot embed a unique token in the
* redirect URL at launch time. Instead, completeLockerQuestImpl credits the
* user's most recent 'started' locker session for the given quest_key.
* session_token is generated and stored here for future use if AdBlueMedia
* ever adds a {click_id} or similar macro.
*
* Returns the NEXT locker URL the client should open — quest.locker_urls at the
* session's current_step, mirroring how startShortlinkStepImpl serves one step
* at a time. The admin configures AdBlueMedia's own "Redirect URL" field once
* in their dashboard to point to /go/locker/return?questKey=<key>; that single
* static URL serves every locker in the chain.
*
* `step` is 1-based and `total` is the number of lockers, so the UI can render
* "Locker 1 of 3".
*/
async function startLockerQuestImpl(userId, questKey, isNative) {
	const quest = await getQuestByKey(questKey);
	if (quest.quest_type !== "locker") throw new Error("This quest is not a locker quest.");
	assertQuestPlatform(quest, isNative);
	const urls = quest.locker_urls;
	if (!urls.length) return { unavailable: true };
	await assertQuestNotLocked(userId, quest);
	const existing = await db.from("quest_sessions").select("*").eq("user_id", userId).eq("quest_key", questKey).in("status", ["started", "verified"]).order("started_at", { ascending: false }).limit(1).maybeSingle();
	if (existing.data) {
		const currentStep = Number(existing.data.current_step ?? 0);
		const index = Math.min(Math.max(0, currentStep), urls.length - 1);
		const nextStep = currentStep + 1;
		if (nextStep <= urls.length) await db.from("quest_sessions").update({
			issued_step: nextStep,
			step_issued_at: (/* @__PURE__ */ new Date()).toISOString()
		}).eq("id", existing.data.id);
		return {
			sessionId: existing.data.id,
			lockerUrl: urls[index],
			step: index + 1,
			total: urls.length
		};
	}
	const sessionToken = crypto.randomUUID();
	const created = await db.from("quest_sessions").insert({
		user_id: userId,
		quest_key: quest.key,
		ads_required: 0,
		reward_amount: quest.reward_amount,
		quest_type: "locker",
		current_step: 0,
		issued_step: 1,
		step_issued_at: (/* @__PURE__ */ new Date()).toISOString(),
		session_token: sessionToken
	}).select("id").single();
	if (created.error) throw new Error("Could not start this locker quest.");
	return {
		sessionId: created.data.id,
		lockerUrl: urls[0],
		step: 1,
		total: urls.length
	};
}
/**
* Credit the user's most recent 'started' locker session for questKey.
*
* Called by the /go/locker/return route after AdBlueMedia redirects the user
* back. Because AdBlueMedia's redirect URL is static (no per-session token
* macro), we match on (userId, questKey, status='started') ordered by
* started_at DESC — i.e. the most recently started session wins.
*
* ⚠️  SECURITY: This function now requires issued_step === current_step + 1
* and a minimum time elapsed since step_issued_at. This is a TIME-BASED
* MITIGATION ONLY. The proper verification would be a server-to-server
* postback from the locker network confirming the user completed the challenge.
* Without that postback, a user who knows the return URL can hit it directly
* after the minimum time and claim credit without actually completing the locker.
*
* ⚠️  KNOWN LIMITATION: if the same user has two browser tabs or devices
* simultaneously running the same locker quest, the OLDER session will never
* be credited — only the most recent one is matched. This is an inherent
* consequence of the static-redirect design. See reply notes for details.
*/
async function completeLockerQuestImpl(userId, questKey, isNative) {
	const quest = await getQuestByKey(questKey);
	if (quest.quest_type !== "locker") throw new Error("This quest is not a locker quest.");
	assertQuestPlatform(quest, isNative);
	await assertQuestNotLocked(userId, quest);
	const session = await db.from("quest_sessions").select("*").eq("user_id", userId).eq("quest_key", questKey).in("status", ["started", "verified"]).order("started_at", { ascending: false }).limit(1).maybeSingle();
	if (!session.data) throw new Error("No active locker session found. Please start the quest again.");
	const total = Math.max(1, quest.locker_urls.length);
	const currentStep = Number(session.data.current_step ?? 0);
	const issuedStep = Number(session.data.issued_step ?? 0);
	if (session.data.status === "verified") {
		const reward = Number(quest.reward_amount);
		await finishQuestSession(userId, session.data.id, reward, `Content locker — ${quest.label}`);
		return {
			completed: true,
			credited: true,
			reward,
			step: total,
			total,
			nextStep: null,
			nextUrl: null
		};
	}
	if (issuedStep !== currentStep + 1) throw new Error("No locker is currently open. Please start from the app.");
	const issuedAt = session.data.step_issued_at ? new Date(session.data.step_issued_at).getTime() : 0;
	const elapsed = (Date.now() - issuedAt) / 1e3;
	if (!issuedAt || elapsed < quest.min_seconds_per_step) throw new Error(`Locker opened too quickly. Please spend at least ${quest.min_seconds_per_step} seconds completing it.`);
	const completedCount = currentStep + 1;
	const stepReward = quest.step_rewards && quest.step_rewards[completedCount - 1] != null ? quest.step_rewards[completedCount - 1] : quest.step_reward;
	const stepRewardCredited = await creditStepReward(userId, session.data.id, questKey, quest.label, completedCount, stepReward);
	await recordLockerStepEvent(userId, session.data.id, completedCount);
	if (completedCount < total) {
		await db.from("quest_sessions").update({
			current_step: completedCount,
			issued_step: 0,
			step_issued_at: null
		}).eq("id", session.data.id);
		return {
			completed: false,
			credited: false,
			reward: 0,
			stepReward: stepRewardCredited,
			stepIndex: completedCount,
			totalSteps: total,
			completionBonus: Number(quest.reward_amount),
			step: completedCount,
			total,
			nextStep: completedCount + 1,
			nextUrl: quest.locker_urls[completedCount] ?? null
		};
	}
	await db.from("quest_sessions").update({
		current_step: completedCount,
		issued_step: 0,
		step_issued_at: null,
		status: "verified",
		verified_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", session.data.id).eq("status", "started");
	const completionBonus = Number(quest.reward_amount);
	await finishQuestSession(userId, session.data.id, completionBonus, `Content locker — ${quest.label}`);
	return {
		completed: true,
		credited: true,
		reward: completionBonus,
		stepReward: stepRewardCredited,
		stepIndex: completedCount,
		totalSteps: total,
		completionBonus,
		step: total,
		total,
		nextStep: null,
		nextUrl: null
	};
}
async function startShortlinkStepImpl(userId, questKey, step, isNative) {
	const quest = await getQuestByKey(questKey);
	if (quest.quest_type !== "shortlink") throw new Error("This quest is not a shortlink quest.");
	assertQuestPlatform(quest, isNative);
	if (!quest.shortlink_steps.length) return { unavailable: true };
	await assertQuestNotLocked(userId, quest);
	const session = await db.from("quest_sessions").select("*").eq("user_id", userId).eq("quest_key", questKey).eq("status", "started").maybeSingle();
	if (!session.data) throw new Error("Start the quest first.");
	const currentStep = Number(session.data.current_step ?? 0);
	const issuedStep = Number(session.data.issued_step ?? 0);
	if (step !== currentStep + 1 && step !== issuedStep) throw new Error("Complete the previous step first.");
	await db.from("quest_sessions").update({
		issued_step: step,
		step_issued_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", session.data.id);
	const url = quest.shortlink_steps[step - 1]?.url ?? null;
	return {
		sessionId: session.data.id,
		step,
		url,
		minSeconds: quest.min_seconds_per_step
	};
}
async function completeShortlinkStepImpl(userId, questKey, step, isNative) {
	const quest = await getQuestByKey(questKey);
	if (quest.quest_type !== "shortlink") throw new Error("This quest is not a shortlink quest.");
	assertQuestPlatform(quest, isNative);
	await assertQuestNotLocked(userId, quest);
	const session = await db.from("quest_sessions").select("*").eq("user_id", userId).eq("quest_key", questKey).in("status", ["started", "verified"]).order("started_at", { ascending: false }).limit(1).maybeSingle();
	if (!session.data) throw new Error("No active session for this quest.");
	if (session.data.status === "verified") {
		const reward = Number(quest.reward_amount);
		await finishQuestSession(userId, session.data.id, reward, `Shortlink quest — ${quest.label}`);
		const total = Math.max(1, quest.shortlink_steps.length);
		return {
			completed: true,
			credited: true,
			reward,
			nextStep: null,
			nextUrl: null,
			step: total,
			total
		};
	}
	const currentStep = Number(session.data.current_step ?? 0);
	if (Number(session.data.issued_step ?? 0) !== step) throw new Error("This step was not opened. Please start from the app.");
	if (step !== currentStep + 1) throw new Error("Wrong step — go back and start from the app.");
	const issuedAt = session.data.step_issued_at ? new Date(session.data.step_issued_at).getTime() : 0;
	const elapsed = (Date.now() - issuedAt) / 1e3;
	if (!issuedAt || elapsed < quest.min_seconds_per_step) throw new Error(`Step opened too quickly. Please spend at least ${quest.min_seconds_per_step} seconds on the network's page.`);
	const total = Math.max(1, quest.shortlink_steps.length);
	const isFinal = step >= total;
	const stepReward = quest.step_rewards && quest.step_rewards[step - 1] != null ? quest.step_rewards[step - 1] : quest.step_reward;
	const stepRewardCredited = await creditStepReward(userId, session.data.id, questKey, quest.label, step, stepReward);
	await recordShortlinkStepEvent(userId, session.data.id, step);
	if (isFinal) {
		await db.from("quest_sessions").update({
			current_step: step,
			issued_step: 0,
			step_issued_at: null,
			status: "verified",
			verified_at: (/* @__PURE__ */ new Date()).toISOString()
		}).eq("id", session.data.id).eq("status", "started");
		const completionBonus = Number(quest.reward_amount);
		await finishQuestSession(userId, session.data.id, completionBonus, `Shortlink quest — ${quest.label}`);
		return {
			completed: true,
			credited: true,
			reward: completionBonus,
			stepReward: stepRewardCredited,
			stepIndex: step,
			totalSteps: total,
			completionBonus,
			nextStep: null,
			nextUrl: null,
			step: total,
			total
		};
	}
	await db.from("quest_sessions").update({
		current_step: step,
		issued_step: 0,
		step_issued_at: null
	}).eq("id", session.data.id);
	return {
		completed: false,
		credited: false,
		reward: 0,
		stepReward: stepRewardCredited,
		stepIndex: step,
		totalSteps: total,
		completionBonus: Number(quest.reward_amount),
		nextStep: step + 1,
		nextUrl: quest.shortlink_steps[step]?.url ?? null,
		step,
		total
	};
}
/**
* Get or create a check-in quest session for a user.
* Auto-starts the quest on first access and completes Day 1 if day1_auto_complete is enabled.
*
* Returns: { session, day1Completed } where day1Completed indicates if Day 1 was just auto-completed
*/
async function getOrCreateCheckinSession(userId, quest, userTimezone) {
	const { getLocalDate } = await import("./timezone.server-BkfCTy6F.mjs");
	const todayLocal = getLocalDate(userTimezone);
	const existing = await db.from("quest_sessions").select("*").eq("user_id", userId).eq("quest_key", quest.key).eq("quest_type", "checkin").eq("status", "started").order("started_at", { ascending: false }).maybeSingle();
	if (existing.data) return {
		session: existing.data,
		day1Completed: false
	};
	const sessionToken = crypto.randomUUID();
	try {
		const created = await db.from("quest_sessions").insert({
			user_id: userId,
			quest_key: quest.key,
			quest_type: "checkin",
			reward_amount: quest.reward_amount,
			ads_required: quest.total_days ?? 3,
			status: "started",
			started_at: (/* @__PURE__ */ new Date()).toISOString(),
			session_token: sessionToken,
			timezone: userTimezone
		}).select("*").single();
		if (created.error) {
			if (created.error.code === "23505") {
				const race = await db.from("quest_sessions").select("*").eq("user_id", userId).eq("quest_key", quest.key).eq("quest_type", "checkin").eq("status", "started").single();
				if (race.data) return {
					session: race.data,
					day1Completed: false
				};
			}
			throw new Error(created.error.message ?? "Failed to create check-in session");
		}
		let day1Completed = false;
		if (quest.day1_auto_complete && created.data) day1Completed = await completeCheckinDay(userId, created.data.id, quest.key, quest, todayLocal, 0, userTimezone);
		return {
			session: created.data,
			day1Completed
		};
	} catch (err) {
		console.error("[checkin] Failed to get or create session:", err);
		throw err;
	}
}
/**
* Attempts to complete a check-in day
*/
async function attemptCompleteDay(userId, sessionId, questKey, localDate, quest) {
	const { error } = await db.from("quest_checkin_days").upsert({
		session_id: sessionId,
		user_id: userId,
		quest_key: questKey,
		local_date: localDate,
		active_seconds: quest.required_active_seconds,
		completed_at: (/* @__PURE__ */ new Date()).toISOString()
	}, { onConflict: "session_id,local_date" });
	return error;
}
/**
* Complete a check-in day and credit the step reward.
* Idempotent via quest_step_credits unique constraint.
*
* @returns true if day was newly completed, false if already complete
*/
async function completeCheckinDay(userId, sessionId, questKey, quest, localDate, dayIndex, userTimezone) {
	if ((await db.from("quest_checkin_days").select("completed_at").eq("session_id", sessionId).eq("local_date", localDate).maybeSingle()).data?.completed_at) return false;
	const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);
	const userEmail = authData.user?.email ?? null;
	const { ensureProfileImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await ensureProfileImpl({
		userId,
		email: userEmail
	});
	let upsertError = await attemptCompleteDay(userId, sessionId, questKey, localDate, quest);
	if (upsertError && upsertError.code === "23503") {
		console.warn("[checkin] Foreign key error on first attempt, retrying after profile creation...");
		await new Promise((resolve) => setTimeout(resolve, 500));
		await ensureProfileImpl({
			userId,
			email: userEmail
		});
		upsertError = await attemptCompleteDay(userId, sessionId, questKey, localDate, quest);
	}
	if (upsertError) {
		console.error("[checkin] Failed to complete day:", upsertError);
		if (upsertError.code === "23503") throw new Error("Unable to save check-in. Please refresh the page and try again.");
		throw new Error("Failed to complete check-in day");
	}
	const stepReward = quest.step_rewards && quest.step_rewards[dayIndex] != null ? quest.step_rewards[dayIndex] : quest.step_reward;
	if (stepReward && stepReward > 0) await creditStepReward(userId, sessionId, questKey, quest.label, dayIndex, stepReward);
	if (((await db.from("quest_checkin_days").select("local_date").eq("session_id", sessionId).not("completed_at", "is", null)).data?.length ?? 0) >= quest.total_days) await finishQuestSession(userId, sessionId, quest.reward_amount, `Quest completed: ${quest.label}`);
	return true;
}
/**
* Get user's timezone from profile, with fallback to quest's default timezone.
*/
async function getUserTimezone(userId, defaultTimezone) {
	const { data } = await db.from("profiles").select("timezone").eq("id", userId).maybeSingle();
	const userTz = data?.timezone;
	if (userTz) {
		const { validateTimezone } = await import("./timezone.server-BkfCTy6F.mjs");
		const validated = validateTimezone(userTz);
		if (validated) return validated;
	}
	return defaultTimezone;
}
/**
* Update user's timezone (service role, validated server-side).
* Enforces 7-day change limit.
* Client sends Intl.DateTimeFormat().resolvedOptions().timeZone.
*/
async function updateUserTimezoneImpl(userId, timezone) {
	try {
		const { validateTimezone, canChangeTimezone } = await import("./timezone.server-BkfCTy6F.mjs");
		const validated = validateTimezone(timezone);
		if (!validated) return {
			success: false,
			error: "Invalid timezone"
		};
		const { data: profile } = await db.from("profiles").select("timezone, timezone_changed_at").eq("id", userId).maybeSingle();
		if (profile?.timezone && profile.timezone === validated) return {
			success: true,
			timezone: validated
		};
		if (profile?.timezone && !canChangeTimezone(profile.timezone_changed_at)) return {
			success: false,
			error: "Timezone can only be changed once per 7 days"
		};
		const { error } = await db.from("profiles").update({
			timezone: validated,
			timezone_changed_at: (/* @__PURE__ */ new Date()).toISOString()
		}).eq("id", userId);
		if (error) {
			console.error("[timezone] Failed to update:", error);
			return {
				success: false,
				error: "Failed to update timezone"
			};
		}
		return {
			success: true,
			timezone: validated
		};
	} catch (err) {
		console.error("[timezone] Update error:", err);
		return {
			success: false,
			error: err instanceof Error ? err.message : "Unknown error"
		};
	}
}
/**
* Evaluate streak status and handle resets for consecutive mode.
* Lazy evaluation: checks for missed days when the quest is accessed.
*
* Returns: { needsReset, missedDays } where needsReset indicates session should be reset
*/
async function evaluateCheckinStreak(session, quest, userTimezone) {
	if (quest.streak_mode === "total") return {
		needsReset: false,
		missedDays: 0
	};
	const { getLocalDate, getYesterdayLocal, getDaysBetween } = await import("./timezone.server-BkfCTy6F.mjs");
	const todayLocal = getLocalDate(userTimezone);
	const yesterdayLocal = getYesterdayLocal(userTimezone);
	const completed = (await db.from("quest_checkin_days").select("local_date").eq("session_id", session.id).not("completed_at", "is", null).order("local_date", { ascending: false })).data?.map((d) => d.local_date) ?? [];
	if (completed.length === 0) return {
		needsReset: false,
		missedDays: 0
	};
	const lastCompletedDate = completed[0];
	if (lastCompletedDate === todayLocal) return {
		needsReset: false,
		missedDays: 0
	};
	if (lastCompletedDate === yesterdayLocal) return {
		needsReset: false,
		missedDays: 0
	};
	const daysSinceLastComplete = getDaysBetween(userTimezone, lastCompletedDate, todayLocal) - 1;
	const missedDays = Math.max(0, daysSinceLastComplete);
	if (missedDays > quest.grace_days) return {
		needsReset: true,
		missedDays
	};
	return {
		needsReset: false,
		missedDays
	};
}
/**
* Reset a check-in quest session (consecutive mode).
* Creates a new session and auto-completes Day 1 if enabled.
* Does NOT claw back step rewards already paid.
*/
async function resetCheckinSession(userId, oldSessionId, quest, userTimezone) {
	await db.from("quest_sessions").update({ status: "failed" }).eq("id", oldSessionId);
	return getOrCreateCheckinSession(userId, quest, userTimezone);
}
/**
* Ensure a check-in session exists and is valid.
* Idempotent - safe to call multiple times, will only create/pay once.
*
* Client should call this after loading quests to initialize check-in sessions.
* Handles:
* - Session creation with race-safe unique constraint
* - Day 1 auto-complete (paid exactly once via quest_step_credits)
* - Streak evaluation and reset (consecutive mode)
* - Timezone lock
*
* @returns Session state and whether Day 1 was newly completed
*/
async function ensureCheckinSessionImpl(userId, questKey) {
	try {
		const { data: quest } = await db.from("quests").select("*").eq("key", questKey).eq("quest_type", "checkin").eq("is_active", true).maybeSingle();
		if (!quest) return {
			success: false,
			error: "Check-in quest not found"
		};
		const normalizedQuest = normalize(quest);
		const userTimezone = await getUserTimezone(userId, normalizedQuest.default_timezone);
		const { session, day1Completed } = await getOrCreateCheckinSession(userId, normalizedQuest, userTimezone);
		const { needsReset } = await evaluateCheckinStreak(session, normalizedQuest, userTimezone);
		if (needsReset) {
			const resetResult = await resetCheckinSession(userId, session.id, normalizedQuest, userTimezone);
			return {
				success: true,
				session: resetResult.session,
				day1Completed: resetResult.day1Completed
			};
		}
		return {
			success: true,
			session,
			day1Completed
		};
	} catch (err) {
		console.error("[checkin] Failed to ensure session:", err);
		return {
			success: false,
			error: err instanceof Error ? err.message : "Unknown error"
		};
	}
}
/**
* Ping active time for a check-in quest.
* Called by client every 30s while visible and focused.
*
* Server logic:
* - Ignore pings <20s after previous ping (prevents parallel tabs/rapid pings)
* - Add min(now - last_ping_at, 35s) to today's active_seconds
* - Cap at required_active_seconds
* - Complete day when threshold reached
*
* Returns: { dayCompleted, activeSeconds, requiredSeconds, stepReward }
*/
async function pingActiveTimeImpl(userId, questKey) {
	const { data: quest } = await db.from("quests").select("*").eq("key", questKey).eq("quest_type", "checkin").eq("is_active", true).maybeSingle();
	if (!quest) throw new Error("Check-in quest not found");
	const normalizedQuest = normalize(quest);
	const userTimezone = await getUserTimezone(userId, normalizedQuest.default_timezone);
	const { getLocalDate } = await import("./timezone.server-BkfCTy6F.mjs");
	getLocalDate(userTimezone);
	const { session } = await getOrCreateCheckinSession(userId, normalizedQuest, userTimezone);
	const { needsReset } = await evaluateCheckinStreak(session, normalizedQuest, userTimezone);
	if (needsReset) {
		const { session: newSession } = await resetCheckinSession(userId, session.id, normalizedQuest, userTimezone);
		Object.assign(session, newSession);
	}
	const lockedTimezone = session.timezone ?? session.metadata?.locked_timezone ?? userTimezone;
	const todayLocalLocked = getLocalDate(lockedTimezone);
	const existingDay = await db.from("quest_checkin_days").select("*").eq("session_id", session.id).eq("local_date", todayLocalLocked).maybeSingle();
	const now = /* @__PURE__ */ new Date();
	const nowMs = now.getTime();
	if (existingDay.data?.completed_at) return {
		dayCompleted: true,
		activeSeconds: normalizedQuest.required_active_seconds,
		requiredSeconds: normalizedQuest.required_active_seconds,
		stepReward: 0
	};
	const lastPingAt = existingDay.data?.last_ping_at;
	if (lastPingAt) {
		if ((nowMs - new Date(lastPingAt).getTime()) / 1e3 < 20) return {
			dayCompleted: false,
			activeSeconds: existingDay.data.active_seconds ?? 0,
			requiredSeconds: normalizedQuest.required_active_seconds,
			stepReward: 0
		};
	}
	let secondsToAdd = 30;
	if (lastPingAt) {
		const elapsedSeconds = (nowMs - new Date(lastPingAt).getTime()) / 1e3;
		secondsToAdd = Math.min(elapsedSeconds, 35);
	}
	const currentActiveSeconds = existingDay.data?.active_seconds ?? 0;
	const newActiveSeconds = Math.min(currentActiveSeconds + secondsToAdd, normalizedQuest.required_active_seconds);
	await db.from("quest_checkin_days").upsert({
		session_id: session.id,
		user_id: userId,
		quest_key: questKey,
		local_date: todayLocalLocked,
		active_seconds: newActiveSeconds,
		last_ping_at: now.toISOString()
	}, { onConflict: "session_id,local_date" });
	if (newActiveSeconds >= normalizedQuest.required_active_seconds && !existingDay.data?.completed_at) {
		const dayIndex = (await db.from("quest_checkin_days").select("local_date").eq("session_id", session.id).not("completed_at", "is", null)).data?.length ?? 0;
		await completeCheckinDay(userId, session.id, questKey, normalizedQuest, todayLocalLocked, dayIndex, lockedTimezone);
		const stepReward = normalizedQuest.step_rewards && normalizedQuest.step_rewards[dayIndex] != null ? normalizedQuest.step_rewards[dayIndex] : normalizedQuest.step_reward;
		return {
			dayCompleted: true,
			activeSeconds: newActiveSeconds,
			requiredSeconds: normalizedQuest.required_active_seconds,
			stepReward: stepReward ?? 0
		};
	}
	return {
		dayCompleted: false,
		activeSeconds: newActiveSeconds,
		requiredSeconds: normalizedQuest.required_active_seconds,
		stepReward: 0
	};
}
/**
* Check in today (tap-only mode).
* Completes today's day immediately if not already done.
* Only works when required_active_seconds = 0.
*
* Returns: { success, dayCompleted, stepReward }
*/
async function checkInTodayImpl(userId, questKey) {
	const { data: quest } = await db.from("quests").select("*").eq("key", questKey).eq("quest_type", "checkin").eq("is_active", true).maybeSingle();
	if (!quest) return {
		success: false,
		dayCompleted: false,
		stepReward: 0,
		message: "Quest not found"
	};
	const normalizedQuest = normalize(quest);
	if (normalizedQuest.required_active_seconds !== 0) return {
		success: false,
		dayCompleted: false,
		stepReward: 0,
		message: "Quest requires active time tracking"
	};
	const userTimezone = await getUserTimezone(userId, normalizedQuest.default_timezone);
	const { getLocalDate } = await import("./timezone.server-BkfCTy6F.mjs");
	getLocalDate(userTimezone);
	const { session } = await getOrCreateCheckinSession(userId, normalizedQuest, userTimezone);
	const { needsReset } = await evaluateCheckinStreak(session, normalizedQuest, userTimezone);
	if (needsReset) {
		const { session: newSession } = await resetCheckinSession(userId, session.id, normalizedQuest, userTimezone);
		Object.assign(session, newSession);
	}
	const lockedTimezone = session.timezone ?? session.metadata?.locked_timezone ?? userTimezone;
	const todayLocalLocked = getLocalDate(lockedTimezone);
	if ((await db.from("quest_checkin_days").select("completed_at").eq("session_id", session.id).eq("local_date", todayLocalLocked).maybeSingle()).data?.completed_at) return {
		success: true,
		dayCompleted: false,
		stepReward: 0,
		message: "Already checked in today"
	};
	const dayIndex = (await db.from("quest_checkin_days").select("local_date").eq("session_id", session.id).not("completed_at", "is", null)).data?.length ?? 0;
	if (!await completeCheckinDay(userId, session.id, questKey, normalizedQuest, todayLocalLocked, dayIndex, lockedTimezone)) return {
		success: false,
		dayCompleted: false,
		stepReward: 0,
		message: "Failed to complete check-in"
	};
	return {
		success: true,
		dayCompleted: true,
		stepReward: (normalizedQuest.step_rewards && normalizedQuest.step_rewards[dayIndex] != null ? normalizedQuest.step_rewards[dayIndex] : normalizedQuest.step_reward) ?? 0
	};
}
/**
* Open a network quest provider (generate token and return offerwall URL).
*
* Creates or reuses a quest token for the given provider and returns the
* offerwall URL with the token as the user ID. This allows tracking completions
* without crediting the user's wallet.
*
* @param userId - Authenticated user ID from context (never from client)
* @param questKey - Quest key
* @param providerId - SDK offerwall provider UUID
* @returns {url: string} or {unavailable: boolean} or {error: string}
*/
async function openQuestNetworkImpl(userId, questKey, providerId) {
	const { data: quest } = await db.from("quests").select("*").eq("key", questKey).eq("is_active", true).maybeSingle();
	if (!quest) return { error: "Quest not found" };
	const normalizedQuest = normalize(quest);
	if (normalizedQuest.quest_type !== "network") return { error: "Quest is not a network quest" };
	const { lifetimeEarned, lifetimeWithdrawn } = await fetchLockInputs(userId);
	if (computeLockState(normalizedQuest.lock_type, normalizedQuest.unlock_at, normalizedQuest.required_lifetime_earned, lifetimeEarned, lifetimeWithdrawn).is_locked) return { error: "Quest is locked" };
	if (!normalizedQuest.network_provider_ids.includes(providerId)) return { error: "Provider not in quest pool" };
	const { data: provider, error: providerError } = await db.from("sdk_offerwall_providers").select("*").eq("id", providerId).eq("enabled", true).maybeSingle();
	if (providerError) {
		console.error(`[network quest] Provider query error for ${providerId}:`, providerError);
		return { error: `Provider lookup failed: ${providerError.message}` };
	}
	if (!provider) {
		console.error(`[network quest] Provider ${providerId} not found or not enabled`);
		return { error: "Provider not available or not enabled" };
	}
	const { data: existingSession } = await db.from("quest_sessions").select("*").eq("user_id", userId).eq("quest_key", questKey).eq("status", "started").order("started_at", { ascending: false }).maybeSingle();
	let sessionId;
	if (existingSession) sessionId = existingSession.id;
	else {
		const { data: newSession, error: sessionError } = await db.from("quest_sessions").insert({
			user_id: userId,
			quest_key: questKey,
			quest_type: "network",
			reward_amount: normalizedQuest.reward_amount,
			ads_required: 0,
			status: "started",
			started_at: (/* @__PURE__ */ new Date()).toISOString(),
			session_token: crypto.randomUUID()
		}).select("id").single();
		if (sessionError || !newSession) {
			console.error("[network quest] Failed to create session:", sessionError);
			return { error: "Failed to create quest session" };
		}
		sessionId = newSession.id;
	}
	const { data: existingCompletion } = await db.from("quest_network_completions").select("id").eq("session_id", sessionId).eq("provider_id", providerId).eq("kind", "network").maybeSingle();
	if (existingCompletion) return { error: "Provider already completed in this session" };
	const expiresAt = new Date(Date.now() + normalizedQuest.token_ttl_hours * 60 * 60 * 1e3);
	const { data: existingToken } = await db.from("quest_network_tokens").select("token").eq("session_id", sessionId).eq("provider_id", providerId).maybeSingle();
	let token;
	if (existingToken) {
		token = existingToken.token;
		await db.from("quest_network_tokens").update({ expires_at: expiresAt.toISOString() }).eq("token", token);
	} else {
		const randomBytes = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(18));
		token = `q_${Buffer.from(randomBytes).toString("base64url").substring(0, 24)}`;
		const { error: tokenError } = await db.from("quest_network_tokens").insert({
			token,
			user_id: userId,
			session_id: sessionId,
			provider_id: providerId,
			quest_key: questKey,
			kind: "network",
			expires_at: expiresAt.toISOString()
		});
		if (tokenError) {
			console.error("[network quest] Failed to create token:", tokenError);
			return { error: "Failed to create quest token" };
		}
	}
	try {
		return { url: await buildQuestOfferwallUrl(token, provider) };
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		console.error("[network quest] Failed to build URL for provider", provider.slug, ":", errorMessage, err);
		return { error: `Failed to open ${provider.name}: ${errorMessage}` };
	}
}
/**
* Build offerwall URL with quest token as user ID.
* Mirrors the logic in OfferwallSlot/buildOfferwallUrl using correct provider schema.
*/
async function buildQuestOfferwallUrl(token, provider) {
	const slug = provider.slug;
	const appId = provider.app_id;
	if (slug === "mooffers") return `https://wall.mooffers.com/offerwall/${appId}?uid=${encodeURIComponent(token)}`;
	if (slug === "affike") return `https://affike.com/offerwall/${appId}/${encodeURIComponent(token)}`;
	if (slug === "revtoo") return `https://revtoo.com/offerwall/${appId}/${encodeURIComponent(token)}`;
	if (slug === "gemiad") return `https://gemiwall.com/${appId}/${encodeURIComponent(token)}`;
	if (slug === "timewall") return `https://timewall.io/users/login?oid=${appId}&uid=${encodeURIComponent(token)}`;
	if (slug === "cpxresearch") return `https://offers.cpx-research.com/index.php?app_id=${appId}&ext_user_id=${encodeURIComponent(token)}`;
	if (slug === "adswedmedia") return `https://adswedmedia.com/offer/${appId}/${encodeURIComponent(token)}`;
	if (slug === "offerwallme") {
		const { getOfferwallMeSignedUrlImpl } = await import("./admin.server-CD6mMoBC.mjs");
		return getOfferwallMeSignedUrlImpl(token);
	}
	if (slug === "theoremreach") {
		const { getTheoremReachSignedUrlImpl } = await import("./admin.server-CD6mMoBC.mjs");
		return getTheoremReachSignedUrlImpl(token);
	}
	if (slug === "torox") {
		const { getToroxWallUrlImpl } = await import("./admin.server-CD6mMoBC.mjs");
		return getToroxWallUrlImpl(token);
	}
	throw new Error(`Unsupported provider slug: ${slug}`);
}
/**
* Get network quest progress for a session.
* Returns array of providers with completion status.
*/
async function getNetworkQuestProgressImpl(userId, questKey) {
	const { data: quest } = await db.from("quests").select("*").eq("key", questKey).eq("is_active", true).maybeSingle();
	if (!quest || quest.quest_type !== "network") return null;
	const normalizedQuest = normalize(quest);
	const { data: session } = await db.from("quest_sessions").select("id").eq("user_id", userId).eq("quest_key", questKey).eq("status", "started").order("started_at", { ascending: false }).maybeSingle();
	if (!session) {
		const { data: providers } = await db.from("sdk_offerwall_providers").select("id, name, logo_url").in("id", normalizedQuest.network_provider_ids);
		return {
			providers: (providers ?? []).map((p) => ({
				providerId: p.id,
				name: p.name,
				logoUrl: p.logo_url,
				done: false
			})),
			done: 0,
			required: normalizedQuest.required_count
		};
	}
	const { data: completions } = await db.from("quest_network_completions").select("provider_id").eq("session_id", session.id).eq("kind", "network");
	const completedProviderIds = new Set((completions ?? []).map((c) => c.provider_id));
	const { data: providers } = await db.from("sdk_offerwall_providers").select("id, name, logo_url").in("id", normalizedQuest.network_provider_ids);
	return {
		providers: (providers ?? []).map((p) => ({
			providerId: p.id,
			name: p.name,
			logoUrl: p.logo_url,
			done: completedProviderIds.has(p.id)
		})),
		done: completedProviderIds.size,
		required: normalizedQuest.required_count
	};
}
/**
* Get active quest by key (with lock validation).
*/
async function getActiveQuestByKey(userId, key) {
	try {
		const quest = await getQuestByKey(key);
		await assertQuestNotLocked(userId, quest);
		return quest;
	} catch {
		return null;
	}
}
async function processActiveTimePingImpl(userId, questKey, pingToken, isActive = true) {
	return processActiveTimePing(db, userId, questKey, pingToken, isActive);
}
async function startActiveTimeGraceImpl(userId, questKey, offerId) {
	return startActiveTimeGrace(db, userId, questKey, offerId);
}
async function endActiveTimeGraceImpl(userId, questKey) {
	return endActiveTimeGrace(db, userId, questKey);
}
async function claimActiveTimeRewardImpl(userId, questKey) {
	return claimActiveTimeReward(db, userId, questKey);
}
//#endregion
export { assertQuestNotLocked, assertQuestPlatform, checkInTodayImpl, claimActiveTimeRewardImpl, completeLockerQuestImpl, completeShortlinkStepImpl, creditStepReward, deleteQuestImpl, endActiveTimeGraceImpl, ensureCheckinSessionImpl, finishQuestSession, getActiveQuestByKey, getNetworkQuestProgressImpl, getQuestByKey, listActiveQuestsImpl, listAdminQuestsImpl, openFeedQuestStepImpl, openQuestNetworkImpl, pingActiveTimeImpl, processActiveTimePingImpl, startActiveTimeGraceImpl, startFeedQuestImpl, startLockerQuestImpl, startShortlinkStepImpl, updateUserTimezoneImpl, upsertQuestImpl };
