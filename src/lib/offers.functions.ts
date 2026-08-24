import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Admin-only API surface for future Providers / Network offer management screens. */

export const listOfferProviders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { listProvidersImpl } = await import("./offers/sync.server");
    return listProvidersImpl();
  });

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
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { upsertProviderImpl } = await import("./offers/sync.server");
    return upsertProviderImpl(data);
  });

export const syncOfferProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ providerId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { syncProviderImpl } = await import("./offers/sync.server");
    return syncProviderImpl(data.providerId);
  });

export const adminDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { adminDashboardImpl } = await import("./offers/admin.server");
    return adminDashboardImpl();
  });

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
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { listAdminOffersImpl } = await import("./offers/admin.server");
    return listAdminOffersImpl(data);
  });

export const saveManualOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        title: z.string().trim().min(2).max(120),
        description: z.string().trim().max(600).default(""),
        requirements: z.string().trim().max(600).default(""),
        icon: z.string().trim().max(300).default("gift"),
        rewardAmount: z.number().min(0).max(10000),
        networkPayout: z.number().min(0).max(10000).nullable().optional(),
        clickUrl: z.string().trim().url().max(1000).nullable().optional(),
        countries: z.array(z.string().trim().min(2).max(3)).max(60).default([]),
        devices: z.array(z.string().trim().max(20)).max(10).default([]),
        expiresAt: z.string().datetime().nullable().optional(),
        isActive: z.boolean().default(true),
        isFeatured: z.boolean().default(false),
        sortOrder: z.number().int().min(0).max(9999).default(0),
        adminPriority: z.number().int().min(0).max(9999).default(0),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { upsertManualOfferImpl } = await import("./offers/admin.server");
    return upsertManualOfferImpl(data);
  });

export const deleteManualOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { deleteManualOfferImpl } = await import("./offers/admin.server");
    return deleteManualOfferImpl(data.id);
  });

/** Authenticated: geo-targeted, ranked Featured Offers for the requesting user's country. */
export const getFeaturedFeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ scope: z.enum(["home", "all"]).default("home") }).parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const { detectCountryFromRequest } = await import("./offers/geo.server");
    const { getFeaturedFeedImpl } = await import("./offers/feed-cache.server");
    const country = detectCountryFromRequest();
    return getFeaturedFeedImpl(country, data.scope);
  });

/** Admin: read feed-automation settings + per-network config + cache freshness. */
export const getFeedAutomation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { getFeedAutomationImpl } = await import("./offers/feed-cache.server");
    return getFeedAutomationImpl();
  });

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
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { updateFeedSettingsImpl } = await import("./offers/feed-settings.server");
    return updateFeedSettingsImpl(data);
  });

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
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { updateNetworkFeedSettingsImpl } = await import("./offers/feed-settings.server");
    return updateNetworkFeedSettingsImpl(data);
  });

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
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { adminRefreshProviderImpl } = await import("./offers/feed-cache.server");
    return adminRefreshProviderImpl(data.providerId, data.country);
  });

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
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { updateOfferControlsImpl } = await import("./offers/admin.server");
    return updateOfferControlsImpl(data);
  });
