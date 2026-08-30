import { supabaseAdmin } from "@/integrations/supabase/client.server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as unknown as { from: (t: string) => any; storage: any };

export type BannerSection = "home" | "offers" | "tasks" | "offerwall";
export type BannerCtaKind =
  | "none"
  | "offers"
  | "tasks"
  | "offerwall"
  | "offer"
  | "offerwall_provider"
  | "url";

export type BannerRow = {
  id: string;
  section: BannerSection;
  title: string;
  description: string;
  image_url: string | null;
  cta_label: string | null;
  cta_kind: BannerCtaKind;
  cta_target: string | null;
  priority: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export type EligibleBanner = BannerRow & {
  /**
   * Resolved CTA that the client can render directly.
   * - `route` = internal TanStack Router `to` path
   * - `url`   = external absolute URL
   * If the original cta_target became invalid (offer/provider inactive), the
   * server falls back to the section's main route instead of hiding the banner.
   */
  cta_resolved: { route?: string; url?: string; label: string } | null;
};

function sectionFallbackRoute(section: BannerSection): string {
  switch (section) {
    case "home":
      return "/home";
    case "offers":
      return "/offers";
    case "tasks":
      return "/task";
    case "offerwall":
      return "/offerwall";
  }
}

async function resolveCta(banner: BannerRow): Promise<EligibleBanner["cta_resolved"]> {
  if (banner.cta_kind === "none" || !banner.cta_label) return null;
  const label = banner.cta_label;
  const fallback = { route: sectionFallbackRoute(banner.section), label };

  switch (banner.cta_kind) {
    case "offers":
      return { route: "/offers", label };
    case "tasks":
      return { route: "/task", label };
    case "offerwall":
      return { route: "/offerwall", label };
    case "url":
      if (!banner.cta_target) return fallback;
      return { url: banner.cta_target, label };
    case "offer": {
      if (!banner.cta_target) return fallback;
      const { data } = await db
        .from("offers")
        .select("id, is_active")
        .eq("id", banner.cta_target)
        .maybeSingle();
      if (!data || !data.is_active) return fallback;
      // Deep-link to the offers list; opening the specific offer's dialog is a
      // client concern — we simply land the user on the right page.
      return { route: "/offers", label };
    }
    case "offerwall_provider": {
      if (!banner.cta_target) return fallback;
      const { data } = await db
        .from("sdk_offerwall_providers")
        .select("id, enabled, status")
        .eq("id", banner.cta_target)
        .maybeSingle();
      if (!data || !data.enabled || data.status === "disabled") return fallback;
      return { route: "/offerwall", label };
    }
    default:
      return null;
  }
}

/** Public/authenticated: eligible custom+scheduled banners for a section. */
export async function listEligibleBannersImpl(section: BannerSection): Promise<EligibleBanner[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await db
    .from("banners")
    .select("*")
    .eq("section", section)
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message ?? "Could not load banners.");
  const rows: BannerRow[] = data ?? [];
  const resolved: EligibleBanner[] = [];
  for (const row of rows) {
    const cta = await resolveCta(row);
    resolved.push({ ...row, cta_resolved: cta });
  }
  return resolved;
}

/** Admin: full list including inactive/scheduled-outside-window. */
export async function listAdminBannersImpl(): Promise<BannerRow[]> {
  const { data, error } = await db
    .from("banners")
    .select("*")
    .order("section", { ascending: true })
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message ?? "Could not load banners.");
  return data ?? [];
}

export type BannerFormInput = {
  id?: string;
  section: BannerSection;
  title: string;
  description: string;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaKind: BannerCtaKind;
  ctaTarget: string | null;
  priority: number;
  isActive: boolean;
  startsAt: string | null; // ISO UTC
  endsAt: string | null; // ISO UTC
};

export async function upsertBannerImpl(input: BannerFormInput) {
  const row = {
    section: input.section,
    title: input.title.trim(),
    description: input.description.trim(),
    image_url: input.imageUrl?.trim() || null,
    cta_label: input.ctaKind === "none" ? null : input.ctaLabel?.trim() || null,
    cta_kind: input.ctaKind,
    cta_target:
      input.ctaKind === "none" ||
      input.ctaKind === "offers" ||
      input.ctaKind === "tasks" ||
      input.ctaKind === "offerwall"
        ? null
        : input.ctaTarget?.trim() || null,
    priority: input.priority,
    is_active: input.isActive,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
  };
  if (input.id) {
    const { data, error } = await db
      .from("banners")
      .update(row)
      .eq("id", input.id)
      .select("id")
      .single();
    if (error) throw new Error(error.message ?? "Could not save banner.");
    return data;
  }
  const { data, error } = await db.from("banners").insert(row).select("id").single();
  if (error) throw new Error(error.message ?? "Could not create banner.");
  return data;
}

export async function deleteBannerImpl(id: string) {
  const { error } = await db.from("banners").delete().eq("id", id);
  if (error) throw new Error(error.message ?? "Could not delete banner.");
  return { ok: true };
}

export type SmartBannerSetting = { template_key: string; enabled: boolean };

/**
 * On/off switches for smart-banner templates. Fails open: if the table doesn't
 * exist yet (migration not run) or the query errors, returns [] so every
 * template is treated as enabled by default.
 */
export async function listSmartBannerSettingsImpl(): Promise<SmartBannerSetting[]> {
  const { data, error } = await db
    .from("smart_banner_settings")
    .select("template_key, enabled");
  if (error) {
    console.warn("[banners] smart_banner_settings unavailable (treating all as enabled):", error.message);
    return [];
  }
  return data ?? [];
}

/** Admin: upsert a single smart-banner template's enabled flag. */
export async function setSmartBannerEnabledImpl(templateKey: string, enabled: boolean) {
  const { error } = await db
    .from("smart_banner_settings")
    .upsert(
      { template_key: templateKey, enabled, updated_at: new Date().toISOString() },
      { onConflict: "template_key" },
    );
  if (error) throw new Error(error.message ?? "Could not update smart banner.");
  return { ok: true };
}

/** Signed upload URL to the public banner-assets bucket for admin uploads. */
export async function requestBannerUploadUrlImpl(userId: string, filename: string) {
  const safe = filename.replace(/[^A-Za-z0-9._-]/g, "_");
  const path = `${userId}/${Date.now()}-${safe}`;
  const { data, error } = await db.storage.from("banner-assets").createSignedUploadUrl(path);
  if (error || !data) {
    throw new Error(error?.message ?? "Could not create upload URL.");
  }
  const publicUrl = db.storage.from("banner-assets").getPublicUrl(path).data.publicUrl as string;
  return {
    path,
    uploadUrl: data.signedUrl ?? data.signed_url ?? "",
    token: data.token ?? "",
    publicUrl,
  };
}
