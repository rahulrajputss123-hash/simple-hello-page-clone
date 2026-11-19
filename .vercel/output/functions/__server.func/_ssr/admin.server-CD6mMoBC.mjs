import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
import { t as getSdkAdapter } from "./registry.server-BSxUB5IY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.server-CD6mMoBC.js
init_client_server();
var COLUMNS = "*";
/** Admin: full provider configuration list, ordered for the wall. */
async function listSdkProvidersImpl() {
	const { data, error } = await supabaseAdmin.from("sdk_offerwall_providers").select(COLUMNS).order("display_order", { ascending: true }).order("name", { ascending: true });
	if (error) throw error;
	return (data ?? []).map((p) => ({
		...p,
		hasAdapter: Boolean(getSdkAdapter(p.slug))
	}));
}
/** App-facing list — safe fields only, enabled providers in display order.
*  Includes lock state computed server-side in UTC so the client can render
*  locked/unlocked cards without any additional round-trips.
*/
async function listPublicSdkProvidersImpl(limit, userId) {
	let query = supabaseAdmin.from("sdk_offerwall_providers").select("id, slug, name, tagline, logo_url, platforms, integration_type, status, display_order, app_id, lock_type, unlock_at, required_lifetime_earned").eq("enabled", true).order("display_order", { ascending: true }).order("name", { ascending: true });
	if (typeof limit === "number") query = query.limit(limit);
	const { data, error } = await query;
	if (error) throw error;
	let lifetimeEarned = 0;
	if (userId) {
		const { data: profile } = await supabaseAdmin.from("profiles").select("lifetime_earned").eq("id", userId).maybeSingle();
		lifetimeEarned = Number(profile?.lifetime_earned ?? 0);
	}
	const { computeLockState } = await import("./lock-state-BmOk6qOC.mjs").then((n) => n.i).then((n) => n.i);
	return (data ?? []).map((row) => {
		const r = row;
		const lockType = r["lock_type"] ?? "none";
		const unlockAt = r["unlock_at"] ?? null;
		const requiredLifetimeEarned = r["required_lifetime_earned"] != null ? Number(r["required_lifetime_earned"]) : null;
		const lockState = userId ? computeLockState(lockType, unlockAt, requiredLifetimeEarned, lifetimeEarned) : {
			is_locked: false,
			unlock_reason: null
		};
		return {
			id: row.id,
			slug: row.slug,
			name: row.name,
			tagline: row.tagline,
			logoUrl: row.logo_url,
			platforms: row.platforms,
			integrationType: row.integration_type,
			status: row.status,
			appId: row.app_id,
			displayOrder: row.display_order,
			lockType,
			unlockAt,
			requiredLifetimeEarned,
			isLocked: lockState.is_locked,
			unlockReason: lockState.unlock_reason
		};
	});
}
function toRow(input) {
	return {
		slug: input.slug,
		name: input.name,
		tagline: input.tagline,
		lock_type: input.lockType ?? "none",
		unlock_at: input.lockType === "time" ? input.unlockAt ?? null : null,
		required_lifetime_earned: input.lockType === "earning" ? input.requiredLifetimeEarned ?? null : null,
		logo_url: input.logoUrl ?? null,
		enabled: input.enabled,
		display_order: input.displayOrder,
		platforms: input.platforms,
		integration_type: input.integrationType,
		sdk_version: input.sdkVersion ?? null,
		app_id: input.appId ?? null,
		placement_id: input.placementId ?? null,
		publisher_id: input.publisherId ?? null,
		extra_config: input.extraConfig,
		secret_refs: input.secretRefs,
		currency_name: input.currencyName,
		currency_per_usd: input.currencyPerUsd,
		reward_multiplier: input.rewardMultiplier,
		min_reward: input.minReward,
		max_reward: input.maxReward ?? null,
		rounding_mode: input.roundingMode,
		postback_path: input.postbackPath ?? null,
		postback_auth_mode: input.postbackAuthMode,
		postback_signature_secret_ref: input.postbackSignatureSecretRef ?? null,
		postback_ip_allowlist: input.postbackIpAllowlist,
		transaction_id_param: input.transactionIdParam,
		user_id_param: input.userIdParam,
		reward_param: input.rewardParam,
		user_identity_mode: input.userIdentityMode,
		user_identity_salt_ref: input.userIdentitySaltRef ?? null,
		dedupe_strategy: input.dedupeStrategy,
		dedupe_window_hours: input.dedupeWindowHours,
		status: input.status,
		notes: input.notes,
		metadata: input.metadata
	};
}
async function upsertSdkProviderImpl(input) {
	const row = toRow(input);
	if (input.id) {
		const { data, error } = await supabaseAdmin.from("sdk_offerwall_providers").update(row).eq("id", input.id).select("id").maybeSingle();
		if (error) throw error;
		return { id: data?.id ?? input.id };
	}
	const { data, error } = await supabaseAdmin.from("sdk_offerwall_providers").insert(row).select("id").maybeSingle();
	if (error) throw error;
	return { id: data?.id ?? "" };
}
async function updateSdkProviderControlsImpl(input) {
	const patch = {};
	if (input.enabled !== void 0) patch["enabled"] = input.enabled;
	if (input.displayOrder !== void 0) patch["display_order"] = input.displayOrder;
	if (input.status !== void 0) patch["status"] = input.status;
	if (Object.keys(patch).length === 0) return { ok: true };
	const { error } = await supabaseAdmin.from("sdk_offerwall_providers").update(patch).eq("id", input.id);
	if (error) throw error;
	return { ok: true };
}
async function deleteSdkProviderImpl(id) {
	const { error } = await supabaseAdmin.from("sdk_offerwall_providers").delete().eq("id", id);
	if (error) throw error;
	return { ok: true };
}
/** Signed upload URL to the public offerwall-assets bucket for admin logo uploads.
*  Identical logic to requestBannerUploadUrlImpl — only the bucket name differs.
*/
async function requestOfferwallLogoUploadUrlImpl(userId, filename) {
	const safe = filename.replace(/[^A-Za-z0-9._-]/g, "_");
	const path = `${userId}/${Date.now()}-${safe}`;
	const { data, error } = await supabaseAdmin.storage.from("offerwall-assets").createSignedUploadUrl(path);
	if (error || !data) throw new Error(error?.message ?? "Could not create upload URL.");
	const publicUrl = supabaseAdmin.storage.from("offerwall-assets").getPublicUrl(path).data.publicUrl;
	return {
		path,
		uploadUrl: data.signedUrl ?? data.signed_url ?? "",
		token: data.token ?? "",
		publicUrl
	};
}
/** Admin: recent conversion records (empty until a real adapter is added). */
async function listSdkConversionsImpl(input) {
	let query = supabaseAdmin.from("sdk_offerwall_conversions").select("id, provider_id, user_id, provider_transaction_id, currency_amount, reward_amount, status, received_at").order("received_at", { ascending: false }).limit(input.limit);
	if (input.providerId) query = query.eq("provider_id", input.providerId);
	const { data, error } = await query;
	if (error) throw error;
	return data ?? [];
}
/**
* Generate a signed URL for offerwall.me with user identity signature.
* Uses the authenticated userId from context (never accepts from client).
* Signature format: HMAC-SHA256(secret, "offerwall-user-v1\n{apiKey}\n{userId}\n{expires}")
*/
async function getOfferwallMeSignedUrlImpl(userId) {
	const { data: provider, error: providerError } = await supabaseAdmin.from("sdk_offerwall_providers").select("app_id").eq("slug", "offerwallme").maybeSingle();
	if (providerError) throw providerError;
	if (!provider?.app_id) throw new Error("offerwall.me provider not configured (missing app_id)");
	const apiKey = provider.app_id.trim();
	const secret = process.env["OFFERWALLME_SECRET_KEY"]?.trim();
	if (!secret) throw new Error("Environment variable OFFERWALLME_SECRET_KEY is not configured");
	const expires = Math.floor(Date.now() / 1e3) + 3600;
	const message = `offerwall-user-v1\n${apiKey}\n${userId}\n${expires}`;
	const signature = (await import("crypto")).createHmac("sha256", secret).update(message, "utf8").digest("hex");
	return `https://offerwall.me/offerwall/${encodeURIComponent(apiKey)}/${encodeURIComponent(userId)}?identityExpires=${expires}&identitySignature=${signature}`;
}
/**
* Generate a signed URL for TheoremReach with user identity signature.
* Uses the authenticated userId from context (never accepts from client).
* Signature format: base64(HMAC-SHA1(secret, urlBeforeHash)), URL-safe encoding
*/
async function getTheoremReachSignedUrlImpl(userId) {
	const { data: provider, error: providerError } = await supabaseAdmin.from("sdk_offerwall_providers").select("app_id").eq("slug", "theoremreach").maybeSingle();
	if (providerError) {
		console.error("[theoremreach] Database error:", providerError);
		throw providerError;
	}
	if (!provider?.app_id) throw new Error("TheoremReach provider not configured (missing app_id)");
	const apiKey = provider.app_id.trim();
	const secret = process.env["THEOREMREACH_SECRET_KEY"]?.trim();
	if (!secret) throw new Error("Environment variable THEOREMREACH_SECRET_KEY is not configured");
	const baseUrl = `https://theoremreach.com/respondent_entry/direct?api_key=${encodeURIComponent(apiKey)}&user_id=${encodeURIComponent(userId)}`;
	const signedUrl = `${baseUrl}&hash=${(await import("crypto")).createHmac("sha1", secret).update(baseUrl, "utf8").digest("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")}`;
	console.log("[theoremreach] Generated signed URL successfully");
	return signedUrl;
}
/**
* Generate a per-player wall URL for Torox by calling their session endpoint.
* Uses the authenticated userId from context (never accepts from client).
* Wall URL is a random per-player token and must be generated on every click.
*/
async function getToroxWallUrlImpl(userId) {
	const { data: provider, error: providerError } = await supabaseAdmin.from("sdk_offerwall_providers").select("app_id, enabled").eq("slug", "torox").maybeSingle();
	if (providerError) throw providerError;
	if (!provider) throw new Error("Torox provider not configured");
	if (!provider.enabled) throw new Error("Torox provider is not enabled");
	if (!provider.app_id) throw new Error("Torox provider missing placement ID (app_id)");
	const placementId = provider.app_id.trim();
	const token = process.env["TOROX_WALL_TOKEN"]?.trim();
	if (!token) throw new Error("Environment variable TOROX_WALL_TOKEN is not configured");
	const apiBase = (process.env["TOROX_API_BASE"] || "https://api.wall.torox.io").trim();
	const sessionUrl = new URL(`${apiBase}/partner/session`);
	sessionUrl.searchParams.set("placement_id", placementId);
	sessionUrl.searchParams.set("token", token);
	let response;
	try {
		response = await fetch(sessionUrl.toString(), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json"
			},
			body: JSON.stringify({ player: { uid: userId } }),
			signal: AbortSignal.timeout(5e3)
		});
	} catch (err) {
		throw new Error(`Failed to connect to Torox: ${err instanceof Error ? err.message : "network error"}`);
	}
	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Torox session API error (${response.status}): ${text.slice(0, 200)}`);
	}
	let parsed;
	try {
		parsed = await response.json();
	} catch {
		throw new Error("Torox session API returned invalid JSON");
	}
	if (!parsed || typeof parsed !== "object") throw new Error("Torox session API returned invalid response");
	const result = parsed;
	if (result.ok !== true) throw new Error("Torox session API returned ok=false");
	const wallUrl = String(result.wall_url ?? "").trim();
	if (!wallUrl) throw new Error("Torox session API did not return wall_url");
	let parsedUrl;
	try {
		parsedUrl = new URL(wallUrl);
	} catch {
		throw new Error("Torox session API returned invalid wall_url");
	}
	if (parsedUrl.protocol !== "https:") throw new Error("Torox wall_url must use HTTPS");
	if (!parsedUrl.hostname.endsWith(".torox.io") && parsedUrl.hostname !== "torox.io") throw new Error("Torox wall_url must be on a torox.io domain");
	return wallUrl;
}
//#endregion
export { deleteSdkProviderImpl, getOfferwallMeSignedUrlImpl, getTheoremReachSignedUrlImpl, getToroxWallUrlImpl, listPublicSdkProvidersImpl, listSdkConversionsImpl, listSdkProvidersImpl, requestOfferwallLogoUploadUrlImpl, updateSdkProviderControlsImpl, upsertSdkProviderImpl };
