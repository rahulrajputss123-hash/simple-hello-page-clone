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

/** Start an offer claim (for URL+proof workflow) - creates "started" status */
export const startOfferClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ offerId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { startOfferClaimImpl } = await import("./coinquest.server");
    return startOfferClaimImpl(context.userId, data.offerId);
  });

/** Submit proof for a started offer claim - moves from "started" to "pending" */
export const submitOfferProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        offerId: z.string().uuid(),
        proofPath: z.string().trim().min(1).max(500),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { submitOfferProofImpl } = await import("./coinquest.server");
    return submitOfferProofImpl(context.userId, data.offerId, data.proofPath);
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

export const savePayoutMethod = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        methodType: z.string(),
        label: z.string().trim().max(200),
        holderName: z.string().trim().max(80).nullable().optional(),
        upiId: z.string().trim().max(120).nullable().optional(),
        paypalEmail: z.string().trim().max(200).nullable().optional(),
        accountNumber: z.string().trim().max(60).nullable().optional(),
        countryBankCode: z.string().trim().max(20).nullable().optional(),
        bankName: z.string().trim().max(120).nullable().optional(),
        country: z.string().trim().max(80).nullable().optional(),
        giftCardRecipientEmail: z.string().trim().max(200).nullable().optional(),
        walletAddress: z.string().trim().max(120).nullable().optional(),
        binancePayId: z.string().trim().max(200).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { savePayoutMethodImpl } = await import("./coinquest.server");
    return savePayoutMethodImpl(context.userId, data);
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
    const { requireRole } = await import("./admin-audit.server");
    const { adminOverviewImpl } = await import("./coinquest.server");
    await requireRole(context.userId, ["admin"]);
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
        referenceId: z.string().trim().max(200).nullable().optional(),
        transactionHash: z.string().trim().max(200).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./admin-audit.server");
    const { adminUpdateWithdrawalImpl } = await import("./coinquest.server");
    await requireRole(context.userId, ["admin", "finance"]);
    return adminUpdateWithdrawalImpl(
      context.userId,
      data.id,
      data.status,
      data.note ?? null,
      data.referenceId ?? null,
      data.transactionHash ?? null,
    );
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
    const { requireRole } = await import("./admin-audit.server");
    const { adminUpdateOfferClaimImpl } = await import("./coinquest.server");
    await requireRole(context.userId, ["admin", "finance"]);
    return adminUpdateOfferClaimImpl(context.userId, data.id, data.status, data.note ?? null);
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
    const { requireRole } = await import("./admin-audit.server");
    const { adminRespondTicketImpl } = await import("./coinquest.server");
    await requireRole(context.userId, ["admin", "finance", "support"]);
    return adminRespondTicketImpl(context.userId, data.id, data.response, data.status);
  });

export const adminSetFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), flagged: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./admin-audit.server");
    const { adminSetFlagImpl } = await import("./coinquest.server");
    await requireRole(context.userId, ["admin"]);
    return adminSetFlagImpl(context.userId, data.userId, data.flagged);
  });

export const adminAdjustWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        amount: z.number().min(-10000).max(10000),
        reason: z.string().trim().min(5, "Reason must be at least 5 characters").max(200),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./admin-audit.server");
    const { adminAdjustWalletImpl } = await import("./coinquest.server");
    await requireRole(context.userId, ["admin"]);
    return adminAdjustWalletImpl(context.userId, data.userId, data.amount, data.reason);
  });

/** Account deletion (Amazon/Google app store compliance). */
export const requestAccountDeletion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requestAccountDeletionImpl, AccountDeletionError } =
      await import("./account-deletion.server");
    try {
      return await requestAccountDeletionImpl(context.userId);
    } catch (err) {
      if (err instanceof AccountDeletionError) {
        throw new Error(`${err.code}: ${err.message}`);
      }
      throw err;
    }
  });

export const transferEarningsToAdvertiser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        amount: z.number().min(5, "Minimum transfer is $5.00").max(1000000),
        idempotencyKey: z.string().min(1).max(100),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { transferEarningsToAdvertiserImpl } = await import("./coinquest.server");
    return transferEarningsToAdvertiserImpl(context.userId, data.amount, data.idempotencyKey);
  });

export const adminListUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        search: z.string().trim().max(200).optional(),
        flaggedOnly: z.boolean().optional(),
        suspiciousOnly: z.boolean().optional(),
        page: z.number().int().min(1).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./admin-audit.server");
    const { adminListUsersImpl } = await import("./coinquest.server");
    await requireRole(context.userId, ["admin"]);
    return adminListUsersImpl(data);
  });

export const adminListWithdrawals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        status: z.enum(["pending", "approved", "rejected", "all"]).optional(),
        page: z.number().int().min(1).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./admin-audit.server");
    const { adminListWithdrawalsImpl } = await import("./coinquest.server");
    await requireRole(context.userId, ["admin", "finance"]);
    return adminListWithdrawalsImpl(data);
  });

export const adminListClaims = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        status: z.enum(["pending", "approved", "rejected", "all"]).optional(),
        page: z.number().int().min(1).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./admin-audit.server");
    const { adminListClaimsImpl } = await import("./coinquest.server");
    await requireRole(context.userId, ["admin", "finance"]);
    return adminListClaimsImpl(data);
  });

export const adminListTickets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        status: z.enum(["open", "resolved", "all"]).optional(),
        page: z.number().int().min(1).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./admin-audit.server");
    const { adminListTicketsImpl } = await import("./coinquest.server");
    await requireRole(context.userId, ["admin", "finance", "support"]);
    return adminListTicketsImpl(data);
  });


// ============================================================================
// WALLET ADJUSTMENT REQUESTS
// ============================================================================

export const createAdjustmentRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        amount: z.number().refine((val) => Math.abs(val) > 100, "Amount must be > $100"),
        reason: z.string().trim().min(5).max(200),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./admin-audit.server");
    const { createAdjustmentRequestImpl } = await import("./coinquest.server");
    await requireRole(context.userId, ["admin"]);
    return createAdjustmentRequestImpl(context.userId, data.userId, data.amount, data.reason);
  });

export const listAdjustmentRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        status: z.enum(["pending", "approved", "rejected"]).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./admin-audit.server");
    const { listAdjustmentRequestsImpl } = await import("./coinquest.server");
    await requireRole(context.userId, ["admin"]);
    return listAdjustmentRequestsImpl(data.status);
  });

export const approveAdjustmentRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        requestId: z.string().uuid(),
        note: z.string().trim().max(200).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./admin-audit.server");
    const { approveAdjustmentRequestImpl } = await import("./coinquest.server");
    await requireRole(context.userId, ["admin"]);
    return approveAdjustmentRequestImpl(context.userId, data.requestId, data.note);
  });

export const rejectAdjustmentRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        requestId: z.string().uuid(),
        note: z.string().trim().min(5).max(200),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./admin-audit.server");
    const { rejectAdjustmentRequestImpl } = await import("./coinquest.server");
    await requireRole(context.userId, ["admin"]);
    return rejectAdjustmentRequestImpl(context.userId, data.requestId, data.note);
  });

// ============================================================================
// AUDIT LOG
// ============================================================================

export const adminListAuditLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        adminFilter: z.string().trim().max(100).optional(),
        actionFilter: z.string().trim().max(100).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        page: z.number().int().min(1).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./admin-audit.server");
    const { adminListAuditLogsImpl } = await import("./coinquest.server");
    await requireRole(context.userId, ["admin"]);
    return adminListAuditLogsImpl({
      adminId: data.adminFilter,
      action: data.actionFilter,
      dateFrom: data.startDate,
      dateTo: data.endDate,
      page: data.page,
    });
  });

// ============================================================================
// FRAUD SIGNALS
// ============================================================================

export const getWithdrawalFraudSignals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        withdrawalId: z.string().uuid(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./admin-audit.server");
    const { getWithdrawalFraudSignalsImpl } = await import("./coinquest.server");
    await requireRole(context.userId, ["admin", "finance"]);
    return getWithdrawalFraudSignalsImpl(data.withdrawalId);
  });

export const getUsersWithSameDevice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        deviceId: z.string().trim().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./admin-audit.server");
    const { getUsersWithSameDeviceImpl } = await import("./coinquest.server");
    await requireRole(context.userId, ["admin"]);
    return getUsersWithSameDeviceImpl(data.deviceId);
  });

// ============================================================================
// STAFF MANAGEMENT
// ============================================================================

export const assignRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userEmail: z.string().trim().email(),
        role: z.enum(["admin", "finance", "support"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./admin-audit.server");
    const { assignRoleImpl } = await import("./coinquest.server");
    await requireRole(context.userId, ["admin"]);
    return assignRoleImpl(context.userId, data.userEmail, data.role);
  });

export const removeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(["admin", "finance", "support"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./admin-audit.server");
    const { removeRoleImpl } = await import("./coinquest.server");
    await requireRole(context.userId, ["admin"]);
    return removeRoleImpl(context.userId, data.userId, data.role);
  });

export const listStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireRole } = await import("./admin-audit.server");
    const { listStaffImpl } = await import("./coinquest.server");
    await requireRole(context.userId, ["admin"]);
    return listStaffImpl();
  });
