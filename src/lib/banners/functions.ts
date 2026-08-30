import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const sectionSchema = z.enum(["home", "offers", "tasks", "offerwall"]);
const ctaKindSchema = z.enum([
  "none",
  "offers",
  "tasks",
  "offerwall",
  "offer",
  "offerwall_provider",
  "url",
]);

/** Authenticated: eligible custom+scheduled banners for a section. */
export const listEligibleBanners = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ section: sectionSchema }).parse(input))
  .handler(async ({ data }) => {
    const { listEligibleBannersImpl } = await import("./server");
    return listEligibleBannersImpl(data.section);
  });

/** Admin: full list including inactive/scheduled-outside-window. */
export const listAdminBanners = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("../coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { listAdminBannersImpl } = await import("./server");
    return listAdminBannersImpl();
  });

export const saveBanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        section: sectionSchema,
        title: z.string().trim().min(1).max(120),
        description: z.string().trim().max(500).default(""),
        imageUrl: z.string().trim().url().max(1000).nullable().optional(),
        ctaLabel: z.string().trim().max(40).nullable().optional(),
        ctaKind: ctaKindSchema.default("none"),
        ctaTarget: z.string().trim().max(1000).nullable().optional(),
        priority: z.number().int().min(0).max(9999).default(0),
        isActive: z.boolean().default(true),
        startsAt: z.string().datetime().nullable().optional(),
        endsAt: z.string().datetime().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("../coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { upsertBannerImpl } = await import("./server");
    return upsertBannerImpl({
      ...data,
      imageUrl: data.imageUrl ?? null,
      ctaLabel: data.ctaLabel ?? null,
      ctaTarget: data.ctaTarget ?? null,
      startsAt: data.startsAt ?? null,
      endsAt: data.endsAt ?? null,
    });
  });

export const deleteBanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("../coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { deleteBannerImpl } = await import("./server");
    return deleteBannerImpl(data.id);
  });

/** Authenticated: on/off state for smart-banner templates (fail-open if table missing). */
export const listSmartBannerSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { listSmartBannerSettingsImpl } = await import("./server");
    return listSmartBannerSettingsImpl();
  });

/** Admin: enable/disable a single smart-banner template. */
export const setSmartBannerEnabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ templateKey: z.string().trim().min(1).max(100), enabled: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("../coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { setSmartBannerEnabledImpl } = await import("./server");
    return setSmartBannerEnabledImpl(data.templateKey, data.enabled);
  });

export const requestBannerUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        filename: z
          .string()
          .trim()
          .min(1)
          .max(120)
          .regex(/^[A-Za-z0-9._-]+$/, "Bad filename"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("../coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { requestBannerUploadUrlImpl } = await import("./server");
    return requestBannerUploadUrlImpl(context.userId, data.filename);
  });
