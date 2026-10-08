import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Phase 2 — client-callable advertiser functions. Thin: validation here,
 * everything else in ./marketplace/advertiser.server.ts (service role).
 * Money never moves from these functions; see processRazorpayWebhook.
 */

export const getAdvertiserOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getOverviewImpl } = await import("./marketplace/advertiser.server");
    return getOverviewImpl(context.userId);
  });

export const becomeAdvertiser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(async (input: unknown) => {
    const { becomeAdvertiserInput } = await import("./marketplace/advertiser.server");
    return becomeAdvertiserInput.parse(input);
  })
  .handler(async ({ data, context }) => {
    const { becomeAdvertiserImpl } = await import("./marketplace/advertiser.server");
    return becomeAdvertiserImpl(context.userId, data);
  });

export const updateAdvertiserProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(async (input: unknown) => {
    const { updateAdvertiserProfileInput } = await import("./marketplace/advertiser.server");
    return updateAdvertiserProfileInput.parse(input);
  })
  .handler(async ({ data, context }) => {
    const { updateAdvertiserProfileImpl } = await import("./marketplace/advertiser.server");
    return updateAdvertiserProfileImpl(context.userId, data);
  });

export const createDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ amountUsd: z.number().positive().max(100000) }).parse(input))
  .handler(async ({ data, context }) => {
    const { createDepositImpl, DepositError } = await import("./marketplace/advertiser.server");
    try {
      return await createDepositImpl(context.userId, data.amountUsd);
    } catch (err) {
      if (err instanceof DepositError) throw new Error(`${err.code}: ${err.message}`);
      throw err;
    }
  });

export const confirmCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        depositId: z.string().uuid(),
        orderId: z.string().min(1).max(64),
        paymentId: z.string().min(1).max(64),
        signature: z.string().regex(/^[0-9a-f]{64}$/i),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { confirmCheckoutImpl, DepositError } = await import("./marketplace/advertiser.server");
    try {
      return await confirmCheckoutImpl(context.userId, data);
    } catch (err) {
      if (err instanceof DepositError) throw new Error(`${err.code}: ${err.message}`);
      throw err;
    }
  });

export const abandonDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ depositId: z.string().uuid(), reason: z.string().max(200).default("checkout_dismissed") }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { abandonDepositImpl } = await import("./marketplace/advertiser.server");
    await abandonDepositImpl(context.userId, data.depositId, data.reason);
    return { ok: true };
  });

export const getDepositStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ depositId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { getDepositImpl } = await import("./marketplace/advertiser.server");
    return getDepositImpl(context.userId, data.depositId);
  });

export const listAdvertiserTransactions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listTransactionsImpl } = await import("./marketplace/advertiser.server");
    return listTransactionsImpl(context.userId);
  });

// Admin: get marketplace settings for auto-approval configuration
export const getMarketplaceSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getMarketplaceSettingsImpl } = await import("./marketplace/admin.server");
    return getMarketplaceSettingsImpl(context.userId);
  });

// Admin: update marketplace settings
export const updateMarketplaceSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        auto_approve_enabled: z.boolean().optional(),
        auto_approve_after_minutes: z.number().int().min(1).max(120).optional(),
        auto_approve_skip_first_campaign: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { updateMarketplaceSettingsImpl } = await import("./marketplace/admin.server");
    return updateMarketplaceSettingsImpl(context.userId, data);
  });

export const listMyCampaigns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listCampaignsImpl } = await import("./marketplace/advertiser.server");
    return listCampaignsImpl(context.userId);
  });

export const createCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(async (input: unknown) => {
    const { createCampaignInput } = await import("./marketplace/advertiser.server");
    return createCampaignInput.parse(input);
  })
  .handler(async ({ data, context }) => {
    const { createCampaignImpl, DepositError } = await import("./marketplace/advertiser.server");
    try {
      return await createCampaignImpl(context.userId, data);
    } catch (err) {
      if (err instanceof DepositError) throw new Error(`${err.code}: ${err.message}`);
      throw err;
    }
  });

export const campaignAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        campaignId: z.string().uuid(),
        action: z.enum(["pause", "resume", "submit", "complete", "archive"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { campaignActionImpl, DepositError } = await import("./marketplace/advertiser.server");
    try {
      const result = await campaignActionImpl(context.userId, data.campaignId, data.action);
      return {
        ok: true,
        status: typeof result["status"] === "string" ? (result["status"] as string) : null,
        released: typeof result["released"] === "number" ? (result["released"] as number) : null,
      };
    } catch (err) {
      if (err instanceof DepositError) throw new Error(`${err.code}: ${err.message}`);
      throw err;
    }
  });

/* ---------------------------------------------------------------- publisher */

export const listActiveCampaigns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listActiveCampaignsImpl } = await import("./marketplace/publisher.server");
    return listActiveCampaignsImpl(context.userId);
  });

export const listMySubmissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listMySubmissionsImpl } = await import("./marketplace/publisher.server");
    return listMySubmissionsImpl(context.userId);
  });

export const submitProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(async (input: unknown) => {
    const { submitProofInput } = await import("./marketplace/publisher.server");
    return submitProofInput.parse(input);
  })
  .handler(async ({ data, context }) => {
    const { submitProofImpl, SubmissionError } = await import("./marketplace/publisher.server");
    try {
      return await submitProofImpl(context.userId, data);
    } catch (err) {
      if (err instanceof SubmissionError) throw new Error(`${err.code}: ${err.message}`);
      throw err;
    }
  });

export const appealSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(async (input: unknown) => {
    const { appealSubmissionInput } = await import("./marketplace/publisher.server");
    return appealSubmissionInput.parse(input);
  })
  .handler(async ({ data, context }) => {
    const { appealSubmissionImpl, SubmissionError } = await import("./marketplace/publisher.server");
    try {
      await appealSubmissionImpl(context.userId, data);
      return { ok: true };
    } catch (err) {
      if (err instanceof SubmissionError) throw new Error(`${err.code}: ${err.message}`);
      throw err;
    }
  });

/* -------------------------------------------------------------------- admin */

export const listPendingCampaigns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { listPendingCampaignsImpl } = await import("./marketplace/admin.server");
    return listPendingCampaignsImpl();
  });

export const listPendingProofs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { listPendingProofsImpl } = await import("./marketplace/admin.server");
    return listPendingProofsImpl();
  });

export const reviewCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        campaignId: z.string().uuid(),
        decision: z.enum(["approved", "rejected"]),
        note: z.string().min(5).max(500), // Note is required (not nullable)
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { reviewCampaignImpl, AdminActionError } = await import("./marketplace/admin.server");
    try {
      await reviewCampaignImpl(context.userId, data.campaignId, data.decision, data.note);
      return { ok: true };
    } catch (err) {
      if (err instanceof AdminActionError) throw new Error(`${err.code}: ${err.message}`);
      throw err;
    }
  });

export const reviewProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        submissionId: z.string().uuid(),
        role: z.enum(["admin", "advertiser"]).default("admin"),
        decision: z.enum(["approved", "rejected"]),
        reason: z.string().min(10).max(500).nullable(), // Required if rejecting
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { reviewProofImpl, AdminActionError } = await import("./marketplace/admin.server");
    try {
      await reviewProofImpl(context.userId, data.submissionId, data.role, data.decision, data.reason);
      return { ok: true };
    } catch (err) {
      if (err instanceof AdminActionError) throw new Error(`${err.code}: ${err.message}`);
      throw err;
    }
  });

/* ----------------------------------------------------------- conversions */

export const startCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        campaignId: z.string().uuid(),
        ipAddress: z.string().max(45),
        userAgent: z.string().max(500).nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { startCampaignImpl } = await import("./marketplace/publisher.server");
    return startCampaignImpl(context.userId, data.campaignId, data.ipAddress, data.userAgent);
  });

// Legacy alias for backward compatibility
export const recordClick = startCampaign;

/* --------------------------------------------------------- role preference */

export const getPreferredRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getPreferredRoleImpl } = await import("./marketplace/role-preference.server");
    return getPreferredRoleImpl(context.userId);
  });

export const setPreferredRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ role: z.enum(["publisher", "advertiser"]) }).parse(input))
  .handler(async ({ data, context }) => {
    const { setPreferredRoleImpl } = await import("./marketplace/role-preference.server");
    await setPreferredRoleImpl(context.userId, data.role);
    return { ok: true };
  });