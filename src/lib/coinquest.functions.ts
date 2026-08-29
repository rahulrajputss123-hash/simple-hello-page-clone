import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const ensureProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().trim().max(80).optional(),
        phone: z.string().trim().max(30).optional(),
        referralCode: z.string().trim().max(20).optional(),
        deviceId: z.string().trim().max(64).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { ensureProfileImpl } = await import("./coinquest.server");
    return ensureProfileImpl({
      userId: context.userId,
      email: (context.claims["email"] as string | undefined) ?? null,
      ...data,
    });
  });

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().trim().min(2).max(80),
        phone: z.string().trim().max(30).optional(),
        deviceId: z.string().trim().max(64).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { completeOnboardingImpl } = await import("./coinquest.server");
    return completeOnboardingImpl(context.userId, data);
  });

export const startQuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ questKey: z.string().max(40) }).parse(input))
  .handler(async ({ data, context }) => {
    const { startQuestImpl } = await import("./coinquest.server");
    return startQuestImpl(context.userId, data.questKey);
  });

export const reportAdWatched = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ sessionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { reportAdImpl } = await import("./coinquest.server");
    return reportAdImpl(context.userId, data.sessionId);
  });

export const completeTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ taskId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { completeTaskImpl } = await import("./coinquest.server");
    return completeTaskImpl(context.userId, data.taskId);
  });

export const claimOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        offerId: z.string().uuid(),
        proofUrl: z.string().trim().min(1).max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { claimOfferImpl } = await import("./coinquest.server");
    return claimOfferImpl(context.userId, data.offerId, data.proofUrl ?? null);
  });

export const createWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ amount: z.number().positive().max(100000), payoutMethodId: z.string().uuid() })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { createWithdrawalImpl } = await import("./coinquest.server");
    return createWithdrawalImpl(context.userId, data.amount, data.payoutMethodId);
  });

export const cancelWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { cancelWithdrawalImpl } = await import("./coinquest.server");
    return cancelWithdrawalImpl(context.userId, data.id);
  });

export const adminOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin, adminOverviewImpl } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    return adminOverviewImpl();
  });

export const adminUpdateWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["approved", "rejected"]),
        note: z.string().trim().max(300).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin, adminUpdateWithdrawalImpl } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    return adminUpdateWithdrawalImpl(data.id, data.status, data.note ?? null);
  });

export const adminUpdateOfferClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["approved", "rejected"]),
        note: z.string().trim().max(300).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin, adminUpdateOfferClaimImpl } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    return adminUpdateOfferClaimImpl(data.id, data.status, data.note ?? null);
  });

export const adminRespondTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        response: z.string().trim().min(2).max(1000),
        status: z.enum(["open", "resolved"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin, adminRespondTicketImpl } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    return adminRespondTicketImpl(data.id, data.response, data.status);
  });

export const adminSetFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), flagged: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin, adminSetFlagImpl } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    return adminSetFlagImpl(data.userId, data.flagged);
  });

export const adminAdjustWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        amount: z.number().min(-10000).max(10000),
        reason: z.string().trim().min(2).max(200),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin, adminAdjustWalletImpl } = await import("./coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    return adminAdjustWalletImpl(data.userId, data.amount, data.reason);
  });
