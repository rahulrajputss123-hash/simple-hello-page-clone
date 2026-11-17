import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { withServerTiming } from "@/lib/server-timing-middleware";

/** User: log a click event for an offer (called when Continue is tapped in the pre-redirect popup). */
export const trackOfferClick = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ offerId: z.string().uuid() }).parse(input))
  .handler(withServerTiming("trackOfferClick", async ({ data, context }) => {
    const { recordOfferClickImpl } = await import("./offers/tags.server");
    const { detectCountryFromRequest } = await import("./offers/geo.server");
    const { getUserCountry } = await import("./profile.server");
    
    // Get country from request first, fallback to profile
    let country = detectCountryFromRequest();
    if (!country) {
      country = await getUserCountry(context.userId);
    }
    
    return recordOfferClickImpl(data.offerId, context.userId, country);
  }));

/** Admin-only API surface for future Providers / Network offer management screens. */

export const listOfferProviders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(withServerTiming("listOfferProviders", async ({ context }) => {
    const { requireRole } = await import("./admin-audit.server");
    await requireRole(context.userId, ["admin"]);
    const { listProvidersImpl } = await import("./offers/sync.server");
    return listProvidersImpl();
  }));

export const upsertOfferProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(1).max(80),
        slug: z
          .string()
          .trim()
          .min(1)
          .max(40)
          .regex(/^[a-z0-9-]+$/),
        providerType: z.enum(["offerwall", "cpa", "cpi", "survey", "other"]),
        enabled: z.boolean().default(false),
        syncConfig: z.record(z.string(), z.unknown()).default({}),
        defaultRevenueShare: z.number().min(0).max(1).default(0.6),
      })
      .parse(input),
  )
  .handler(withServerTiming("upsertOfferProvider", async ({ data, context }) => {
    const { requireRole } = await import("./admin-audit.server");
    await requireRole(context.userId, ["admin"]);
    const { upsertProviderImpl } = await import("./offers/sync.server");
    return upsertProviderImpl(data);
  }));

export const syncOfferProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ providerId: z.string().uuid() }).parse(input))
  .handler(withServerTiming("syncOfferProvider", async ({ data, context }) => {
    const { requireRole } = await import("./admin-audit.server");
    await requireRole(context.userId, ["admin"]);
    const { syncProviderImpl } = await import("./offers/sync.server");
    return syncProviderImpl(data.providerId);
  }));

export const adminDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(withServerTiming("adminDashboard", async ({ context }) => {
    const { requireRole } = await import("./admin-audit.server");
    await requireRole(context.userId, ["admin"]);
    const { adminDashboardImpl } = await import("./offers/admin.server");
    return adminDashboardImpl();
  }));

export const listAdminOffers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        source: z.enum(["all", "manual", "network"]).default("all"),
        search: z.string().trim().max(80).optional(),
        status: z.enum(["all", "active", "inactive", "featured", "expired"]).default("all"),
        providerId: z.string().uuid().optional(),
        country: z.string().trim().max(4).optional(),
        limit: z.number().int().min(1).max(200).default(100),
      })
      .parse(input ?? {}),
  )
  .handler(withServerTiming("listAdminOffers", async ({ data, context }) => {
    const { requireRole } = await import("./admin-audit.server");
    await requireRole(context.userId, ["admin"]);
    const { listAdminOffersImpl } = await import("./offers/admin.server");
    return listAdminOffersImpl(data);
  }));

export const saveManualOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        title: z.string().trim().min(2).max(120),
        description: z.string().trim().max(600).default(""),
        requirements: z.string().trim().max(600).default(""),
        notAllowed: z.string().trim().max(1000).default(""),
        icon: z.string().trim().max(300).default("gift"),
        rewardAmount: z.number().min(0).max(10000),
        networkPayout: z.number().min(0).max(10000).nullable().optional(),
        clickUrl: z.string().trim().url().max(1000).nullable().optional(),
        // 250 = the full ISO 3166-1 picker list. The old cap of 60 was fine for a
        // comma-separated text field but is easy to exceed now that the admin can
        // tick whole regions; going over it would fail the save with no clear cause.
        // (Targeting every country is still best expressed as [] — "no restriction".)
        countries: z.array(z.string().trim().min(2).max(3)).max(250).default([]),
        devices: z.array(z.string().trim().max(20)).max(10).default([]),
        expiresAt: z.string().datetime().nullable().optional(),
        isActive: z.boolean().default(true),
        isFeatured: z.boolean().default(false),
        sortOrder: z.number().int().min(0).max(9999).default(0),
        adminPriority: z.number().int().min(0).max(9999).default(0),
        // Limited-deal fields
        isLimitedDeal: z.boolean().default(false),
        dealGroupId: z.string().trim().max(60).nullable().optional(),
        actualCost: z.number().min(0).max(1000000).nullable().optional(),
        payoutPercentage: z.number().min(0).max(1000).default(110),
        maxPayoutCap: z.number().min(0).max(1000000).nullable().optional(),
        // Display-only badges — rendered verbatim on the card, never used in any
        // reward calculation. Bounds mirror the DB CHECK constraints.
        displayPrice: z.string().trim().max(24).nullable().optional(),
        displayPercent: z.number().min(0).max(100_000).nullable().optional(),
        // Payout mode
        payoutMode: z.enum(["manual", "manual_proof", "auto_postback"]).default("manual"),
        postbackSecretRef: z.string().trim().max(120).nullable().optional(),
        postbackIpAllowlist: z.array(z.string().trim().max(64)).max(20).default([]),
        // Category + tags
        category: z
          .enum(["App Install", "Trial", "Deals", "Survey", "Games", "Link Locker", "Shortlink"])
          .nullable()
          .optional(),
        tags: z
          .array(z.enum(["Hot", "Trending", "Easy", "Popular"]))
          .max(4)
          .default([]),
      })
      .parse(input),
  )
  .handler(withServerTiming("saveManualOffer", async ({ data, context }) => {
    const { requireRole } = await import("./admin-audit.server");
    await requireRole(context.userId, ["admin"]);
    const { upsertManualOfferImpl } = await import("./offers/admin.server");
    return upsertManualOfferImpl(data);
  }));

export const deleteManualOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(withServerTiming("deleteManualOffer", async ({ data, context }) => {
    const { requireRole } = await import("./admin-audit.server");
    await requireRole(context.userId, ["admin"]);
    const { deleteManualOfferImpl } = await import("./offers/admin.server");
    return deleteManualOfferImpl(data.id);
  }));

/** Authenticated: geo-targeted, ranked Featured Offers for the requesting user's country. */
export const getFeaturedFeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ scope: z.enum(["home", "all"]).default("home") }).parse(input ?? {}),
  )
  .handler(withServerTiming("getFeaturedFeed", async ({ data, context }) => {
    const { detectCountryFromRequest, detectIpFromRequest } = await import("./offers/geo.server");
    const { getFeaturedFeedImpl } = await import("./offers/feed-cache.server");
    const { detectPlatformFromRequest } = await import("./offers/platform.server");
    const { updateUserCountryIfChanged } = await import("./profile.server");
    
    const country = detectCountryFromRequest();
    const ip = detectIpFromRequest();
    const platform = await detectPlatformFromRequest();
    
    // Update user's country if it changed (non-blocking)
    updateUserCountryIfChanged(context.userId).catch(() => {
      // Fail silently - don't block feed request
    });
    
    return getFeaturedFeedImpl(country, data.scope, ip, context.userId, platform);
  }));

/** Authenticated: get single offer by ID with user's claim status */
export const getOfferById = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ offerId: z.string().uuid() }).parse(input))
  .handler(withServerTiming("getOfferById", async ({ data, context }) => {
    const { getOfferByIdImpl } = await import("./offers/feed-cache.server");
    return getOfferByIdImpl(data.offerId, context.userId);
  }));

/** Admin: read feed-automation settings + per-network config + cache freshness. */
export const getFeedAutomation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(withServerTiming("getFeedAutomation", async ({ context }) => {
    const { requireRole } = await import("./admin-audit.server");
    await requireRole(context.userId, ["admin"]);
    const { getFeedAutomationImpl } = await import("./offers/feed-cache.server");
    return getFeedAutomationImpl();
  }));

/** Admin: update global feed-automation settings. */
export const updateFeedSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        refreshIntervalHours: z.number().int().min(1).max(168),
        defaultCountry: z
          .string()
          .trim()
          .length(2)
          .regex(/^[A-Za-z]{2}$/),
        fallbackBehavior: z.enum(["none", "default_country"]),
        featuredSlots: z.number().int().min(1).max(24),
      })
      .parse(input),
  )
  .handler(withServerTiming("updateFeedSettings", async ({ data, context }) => {
    const { requireRole } = await import("./admin-audit.server");
    await requireRole(context.userId, ["admin"]);
    const { updateFeedSettingsImpl } = await import("./offers/feed-settings.server");
    return updateFeedSettingsImpl(data);
  }));

/** Admin: update per-network automation config (enable, max offers, ranking weight). */
export const updateNetworkFeedSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        providerId: z.string().uuid(),
        enabled: z.boolean(),
        maxOffers: z.number().int().min(1).max(50),
        weight: z.number().min(0.01).max(1000),
      })
      .parse(input),
  )
  .handler(withServerTiming("updateNetworkFeedSettings", async ({ data, context }) => {
    const { requireRole } = await import("./admin-audit.server");
    await requireRole(context.userId, ["admin"]);
    const { updateNetworkFeedSettingsImpl } = await import("./offers/feed-settings.server");
    return updateNetworkFeedSettingsImpl(data);
  }));

/** Admin: manually refresh one network's feed for a country (defaults to the default country). */
export const adminRefreshFeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        providerId: z.string().uuid(),
        country: z
          .string()
          .trim()
          .length(2)
          .regex(/^[A-Za-z]{2}$/)
          .optional(),
      })
      .parse(input),
  )
  .handler(withServerTiming("adminRefreshFeed", async ({ data, context }) => {
    const { requireRole } = await import("./admin-audit.server");
    await requireRole(context.userId, ["admin"]);
    const { adminRefreshProviderImpl } = await import("./offers/feed-cache.server");
    return adminRefreshProviderImpl(data.providerId, data.country);
  }));

export const updateOfferControls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        isActive: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
        adminPriority: z.number().int().min(0).max(9999).optional(),
        sortOrder: z.number().int().min(0).max(9999).optional(),
        rewardAmount: z.number().min(0).max(10000).optional(),
        revenueShare: z.number().min(0).max(1).optional(),
        payoutMode: z.enum(["manual", "manual_proof", "auto_postback"]).optional(),
        postbackSecretRef: z.string().trim().max(120).nullable().optional(),
        pushToBottom: z.boolean().nullable().optional(),
        category: z
          .enum(["App Install", "Trial", "Deals", "Survey", "Games", "Link Locker", "Shortlink"])
          .nullable()
          .optional(),
        tags: z
          .array(z.enum(["Hot", "Trending", "Easy", "Popular"]))
          .max(4)
          .optional(),
      })
      .parse(input),
  )
  .handler(withServerTiming("updateOfferControls", async ({ data, context }) => {
    const { requireRole } = await import("./admin-audit.server");
    await requireRole(context.userId, ["admin"]);
    const { updateOfferControlsImpl } = await import("./offers/admin.server");
    return updateOfferControlsImpl(data);
  }));

/** Admin: fetch a short-lived signed URL to preview a proof file. */
export const adminSignProofUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ path: z.string().trim().min(1).max(500) }).parse(input),
  )
  .handler(withServerTiming("adminSignProofUrl", async ({ data, context }) => {
    const { requireRole } = await import("./admin-audit.server");
    await requireRole(context.userId, ["admin"]);
    const { signProofUrl } = await import("./offers/proof.server");
    const url = await signProofUrl(data.path, 300);
    return { url };
  }));

/** User: request a signed upload URL for a proof file (path scoped to their uid). */
export const requestProofUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  // The filename is only length-capped here: requestProofUploadUrlImpl sanitises
  // it to [A-Za-z0-9._-]. The previous strict regex rejected the default screenshot
  // filenames real users upload (spaces, colons) before the sanitiser ever ran.
  .inputValidator((input: unknown) =>
    z
      .object({
        offerId: z.string().uuid(),
        filename: z.string().trim().min(1).max(120),
      })
      .parse(input),
  )
  .handler(withServerTiming("requestProofUploadUrl", async ({ data, context }) => {
    const { requestProofUploadUrlImpl } = await import("./offers/proof-upload.server");
    return requestProofUploadUrlImpl(context.userId, data.offerId, data.filename);
  }));

/** Admin: get country-wise analytics for a date range */
export const getCountryAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
      })
      .parse(input),
  )
  .handler(withServerTiming("getCountryAnalytics", async ({ data, context }) => {
    const { requireRole } = await import("./admin-audit.server");
    await requireRole(context.userId, ["admin"]);
    const { getCountryAnalyticsImpl } = await import("./admin-country-analytics.server");
    return getCountryAnalyticsImpl(data.startDate, data.endDate);
  }));

/** Admin: get feed health status per provider */
export const getFeedHealthStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(withServerTiming("getFeedHealthStatus", async ({ context }) => {
    const { requireRole } = await import("./admin-audit.server");
    await requireRole(context.userId, ["admin"]);
    const { getFeedHealthStatusImpl } = await import("./admin-country-analytics.server");
    return getFeedHealthStatusImpl();
  }));
