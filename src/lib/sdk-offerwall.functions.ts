import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** SDK Offerwall management API. Separate from the Offer Feed provider API. */

const providerSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(1).max(80),
  tagline: z.string().trim().max(140).default(""),
  logoUrl: z.string().trim().max(500).nullable().optional(),
  enabled: z.boolean().default(false),
  displayOrder: z.number().int().min(0).max(999).default(0),
  platforms: z
    .array(z.enum(["android", "ios", "web"]))
    .max(3)
    .default(["android"]),
  integrationType: z
    .enum(["placeholder", "native_sdk", "web_sdk", "hybrid", "api"])
    .default("placeholder"),
  sdkVersion: z.string().trim().max(40).nullable().optional(),
  appId: z.string().trim().max(120).nullable().optional(),
  placementId: z.string().trim().max(120).nullable().optional(),
  publisherId: z.string().trim().max(120).nullable().optional(),
  extraConfig: z.record(z.string(), z.any()).default({}),
  secretRefs: z.record(z.string(), z.any()).default({}),
  currencyName: z.string().trim().min(1).max(30).default("coins"),
  currencyPerUsd: z.number().positive().max(1_000_000).default(100),
  rewardMultiplier: z.number().min(0).max(100).default(1),
  minReward: z.number().min(0).max(10000).default(0),
  maxReward: z.number().min(0).max(10000).nullable().optional(),
  roundingMode: z.enum(["floor", "ceil", "nearest"]).default("nearest"),
  postbackPath: z.string().trim().max(300).nullable().optional(),
  postbackAuthMode: z
    .enum(["none", "signature", "ip_allowlist", "signature_and_ip"])
    .default("none"),
  postbackSignatureSecretRef: z.string().trim().max(80).nullable().optional(),
  postbackIpAllowlist: z.array(z.string().trim().max(60)).max(40).default([]),
  transactionIdParam: z.string().trim().min(1).max(60).default("transaction_id"),
  userIdParam: z.string().trim().min(1).max(60).default("sub_id"),
  rewardParam: z.string().trim().min(1).max(60).default("amount"),
  userIdentityMode: z
    .enum(["user_uuid", "hashed_uuid", "referral_code", "custom"])
    .default("user_uuid"),
  userIdentitySaltRef: z.string().trim().max(80).nullable().optional(),
  dedupeStrategy: z
    .enum(["transaction_id", "transaction_id_and_user", "payload_hash"])
    .default("transaction_id"),
  dedupeWindowHours: z.number().int().min(1).max(8760).default(720),
  status: z.enum(["draft", "configured", "testing", "live", "disabled"]).default("draft"),
  notes: z.string().trim().max(1000).default(""),
  metadata: z.record(z.string(), z.any()).default({}),
  lockType: z.enum(["none", "time", "earning"]).default("none"),
  unlockAt: z.string().datetime({ offset: true }).nullable().optional(),
  requiredLifetimeEarned: z.number().min(0).max(100_000).nullable().optional(),
});

/** Signed-in users: enabled providers only, safe fields.
 *  Passes the requesting userId so lock state is computed per-user server-side.
 */
export const listSdkOfferwallProviders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ limit: z.number().int().min(1).max(50).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { listPublicSdkProvidersImpl } = await import("./sdk-offerwall/admin.server");
    return listPublicSdkProvidersImpl(data.limit, context.userId);
  });

export const listAdminSdkProviders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { listSdkProvidersImpl } = await import("./sdk-offerwall/admin.server");
    return listSdkProvidersImpl();
  });

export const saveSdkProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => providerSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { upsertSdkProviderImpl } = await import("./sdk-offerwall/admin.server");
    return upsertSdkProviderImpl(data);
  });

export const updateSdkProviderControls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        enabled: z.boolean().optional(),
        displayOrder: z.number().int().min(0).max(999).optional(),
        status: z.enum(["draft", "configured", "testing", "live", "disabled"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { updateSdkProviderControlsImpl } = await import("./sdk-offerwall/admin.server");
    return updateSdkProviderControlsImpl(data);
  });

export const deleteSdkProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { deleteSdkProviderImpl } = await import("./sdk-offerwall/admin.server");
    return deleteSdkProviderImpl(data.id);
  });

export const requestOfferwallLogoUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  // The filename is only length-capped here: requestOfferwallLogoUploadUrlImpl
  // sanitises it to [A-Za-z0-9._-]. The previous strict regex rejected ordinary
  // filenames containing spaces or parentheses before the sanitiser ever ran.
  .inputValidator((input: unknown) =>
    z.object({ filename: z.string().trim().min(1).max(120) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { requestOfferwallLogoUploadUrlImpl } = await import("./sdk-offerwall/admin.server");
    return requestOfferwallLogoUploadUrlImpl(context.userId, data.filename);
  });

export const listSdkConversions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        providerId: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(200).default(50),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { listSdkConversionsImpl } = await import("./sdk-offerwall/admin.server");
    return listSdkConversionsImpl(data);
  });
