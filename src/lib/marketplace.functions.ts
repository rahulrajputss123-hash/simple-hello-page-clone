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

export const listMyCampaigns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listCampaignsImpl } = await import("./marketplace/advertiser.server");
    return listCampaignsImpl(context.userId);
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