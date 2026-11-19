import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/server-B0A-5l2D.js
init_client_server();
var db = supabaseAdmin;
function sectionFallbackRoute(section) {
	switch (section) {
		case "home": return "/home";
		case "offers": return "/offers";
		case "tasks": return "/special";
		case "offerwall": return "/offerwall";
	}
}
async function resolveCta(banner) {
	if (banner.cta_kind === "none" || !banner.cta_label) return null;
	const label = banner.cta_label;
	const fallback = {
		route: sectionFallbackRoute(banner.section),
		label
	};
	switch (banner.cta_kind) {
		case "offers": return {
			route: "/offers",
			label
		};
		case "tasks": return {
			route: "/special",
			label
		};
		case "offerwall": return {
			route: "/offerwall",
			label
		};
		case "url":
			if (!banner.cta_target) return fallback;
			return {
				url: banner.cta_target,
				label
			};
		case "offer": {
			if (!banner.cta_target) return fallback;
			const { data } = await db.from("offers").select("id, is_active").eq("id", banner.cta_target).maybeSingle();
			if (!data || !data.is_active) return fallback;
			return {
				route: "/offers",
				label
			};
		}
		case "offerwall_provider": {
			if (!banner.cta_target) return fallback;
			const { data } = await db.from("sdk_offerwall_providers").select("id, enabled, status").eq("id", banner.cta_target).maybeSingle();
			if (!data || !data.enabled || data.status === "disabled") return fallback;
			return {
				route: "/offerwall",
				label
			};
		}
		default: return null;
	}
}
/** Public/authenticated: eligible custom+scheduled banners for a section. */
async function listEligibleBannersImpl(section) {
	const nowIso = (/* @__PURE__ */ new Date()).toISOString();
	const { data, error } = await db.from("banners").select("*").eq("section", section).eq("is_active", true).or(`starts_at.is.null,starts_at.lte.${nowIso}`).or(`ends_at.is.null,ends_at.gt.${nowIso}`).order("priority", { ascending: false }).order("created_at", { ascending: false });
	if (error) throw new Error(error.message ?? "Could not load banners.");
	const rows = data ?? [];
	const resolved = [];
	for (const row of rows) {
		const cta = await resolveCta(row);
		resolved.push({
			...row,
			cta_resolved: cta
		});
	}
	return resolved;
}
/** Admin: full list including inactive/scheduled-outside-window. */
async function listAdminBannersImpl() {
	const { data, error } = await db.from("banners").select("*").order("section", { ascending: true }).order("priority", { ascending: false }).order("created_at", { ascending: false });
	if (error) throw new Error(error.message ?? "Could not load banners.");
	return data ?? [];
}
async function upsertBannerImpl(input) {
	const titleTrimmed = input.title.trim();
	const hasImage = Boolean(input.imageUrl?.trim());
	if (!titleTrimmed && !hasImage) throw new Error("A banner needs either an image or a title.");
	const row = {
		section: input.section,
		title: titleTrimmed,
		description: input.description.trim(),
		image_url: input.imageUrl?.trim() || null,
		cta_label: input.ctaKind === "none" ? null : input.ctaLabel?.trim() || null,
		cta_kind: input.ctaKind,
		cta_target: input.ctaKind === "none" || input.ctaKind === "offers" || input.ctaKind === "tasks" || input.ctaKind === "offerwall" ? null : input.ctaTarget?.trim() || null,
		priority: input.priority,
		is_active: input.isActive,
		starts_at: input.startsAt,
		ends_at: input.endsAt
	};
	if (input.id) {
		const { data, error } = await db.from("banners").update(row).eq("id", input.id).select("id").single();
		if (error) throw new Error(error.message ?? "Could not save banner.");
		return data;
	}
	const { data, error } = await db.from("banners").insert(row).select("id").single();
	if (error) throw new Error(error.message ?? "Could not create banner.");
	return data;
}
async function deleteBannerImpl(id) {
	const { error } = await db.from("banners").delete().eq("id", id);
	if (error) throw new Error(error.message ?? "Could not delete banner.");
	return { ok: true };
}
/**
* On/off switches for smart-banner templates. Fails open: if the table doesn't
* exist yet (migration not run) or the query errors, returns [] so every
* template is treated as enabled by default.
*/
async function listSmartBannerSettingsImpl() {
	const { data, error } = await db.from("smart_banner_settings").select("template_key, enabled");
	if (error) {
		console.warn("[banners] smart_banner_settings unavailable (treating all as enabled):", error.message);
		return [];
	}
	return data ?? [];
}
/** Admin: upsert a single smart-banner template's enabled flag. */
async function setSmartBannerEnabledImpl(templateKey, enabled) {
	const { error } = await db.from("smart_banner_settings").upsert({
		template_key: templateKey,
		enabled,
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	}, { onConflict: "template_key" });
	if (error) throw new Error(error.message ?? "Could not update smart banner.");
	return { ok: true };
}
/**
* Signed upload URL to the public banner-assets bucket for admin uploads.
*
* `folder` namespaces the upload so more than one admin form can share this
* bucket (banners write to the bucket root, offer artwork to `offers/`).
* Omitting it preserves the original banner paths exactly.
*/
async function requestBannerUploadUrlImpl(userId, filename, folder) {
	const safe = filename.replace(/[^A-Za-z0-9._-]/g, "_");
	const path = `${folder ? `${folder.replace(/[^a-z0-9-]/gi, "")}/` : ""}${userId}/${Date.now()}-${safe}`;
	const { data, error } = await db.storage.from("banner-assets").createSignedUploadUrl(path);
	if (error || !data) throw new Error(error?.message ?? "Could not create upload URL.");
	const publicUrl = db.storage.from("banner-assets").getPublicUrl(path).data.publicUrl;
	return {
		path,
		uploadUrl: data.signedUrl ?? data.signed_url ?? "",
		token: data.token ?? "",
		publicUrl
	};
}
//#endregion
export { deleteBannerImpl, listAdminBannersImpl, listEligibleBannersImpl, listSmartBannerSettingsImpl, requestBannerUploadUrlImpl, setSmartBannerEnabledImpl, upsertBannerImpl };
