import { createHash } from "crypto";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database, Json } from "@/integrations/supabase/types";

/**
 * Typed wrappers around the Phase 0 wallet functions
 * (supabase/migrations/20270221000000_phase0_atomic_wallet.sql).
 *
 * Every publisher balance change goes through one of these. Each call is a
 * single Postgres transaction with a row lock and delta updates, so concurrent
 * writers can no longer erase each other's changes, and a balance change and
 * its wallet_transactions row always commit (or fail) together.
 *
 * The functions are EXECUTE-able by service_role only, so they must be called
 * through supabaseAdmin from server code.
 */

type RpcName = keyof Database["public"]["Functions"];
type RpcArgs<N extends RpcName> = Database["public"]["Functions"][N]["Args"];

/** Machine-readable error raised by a wallet function (e.g. WALLET_NEGATIVE). */
export class WalletRpcError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "WalletRpcError";
    this.code = code;
  }
}

const ERROR_CODE = /\b(?:WALLET|WITHDRAWAL|CLAIM|CONVERSION)_[A-Z_]+\b/;

/** Every key the wallet functions return in their jsonb result. */
type RpcKey =
  | "id"
  | "duplicate"
  | "transaction_id"
  | "amount"
  | "wallet_balance"
  | "held_balance"
  | "previous_lifetime_earned"
  | "settled"
  | "already_settled"
  | "already_reviewed"
  | "status"
  | "user_id"
  | "reward"
  | "credited"
  | "reason"
  | "released"
  | "payout"
  | "referrer_id"
  | "reversed";
type RpcRow = Partial<Record<RpcKey, Json>> & { [key: string]: Json | undefined };

async function callWalletRpc<N extends RpcName>(name: N, args: RpcArgs<N>): Promise<RpcRow> {
  const { data, error } = await supabaseAdmin.rpc(name, args as never);
  if (error) {
    const code = error.message?.match(ERROR_CODE)?.[0] ?? "RPC_FAILED";
    throw new WalletRpcError(code, `${name}: ${error.message}`);
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new WalletRpcError("RPC_BAD_RESPONSE", `${name}: unexpected response`);
  }
  return data as RpcRow;
}

/**
 * Stable uuid-shaped reference for credits that have no row of their own
 * (e.g. one streak bonus per user per day), for walletApply's idempotency.
 */
export function deterministicReferenceId(...parts: string[]): string {
  const h = createHash("md5").update(parts.join(":")).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

const num = (value: Json | undefined): number => Number(value ?? 0);
const str = (value: Json | undefined): string | null =>
  typeof value === "string" ? value : value == null ? null : String(value);

export type WalletApplyResult = {
  /**
   * True when this referenceId was already applied: nothing changed this time
   * and transactionId/amount describe the original row.
   */
  duplicate: boolean;
  transactionId: string;
  amount: number;
  walletBalance: number;
  heldBalance: number;
  /** lifetime_earned before this change; 0 means this was the first earning. */
  previousLifetimeEarned: number;
};

/**
 * Credits (positive amount) or debits (negative amount) a publisher wallet and
 * writes the matching completed wallet_transactions row.
 *
 * referenceId makes the call idempotent: the same (user, source, kind,
 * referenceId) is applied at most once, and a repeat returns duplicate = true.
 * Pass the id of the thing being paid for (quest session, task row, claim…).
 *
 * lifetimeEarnedDelta: omit for the default (credits count toward
 * lifetime_earned, debits don't). Debits that would take the AVAILABLE balance
 * (wallet − held) below zero throw WALLET_NEGATIVE unless allowNegative is set.
 */
export async function walletApply(input: {
  userId: string;
  amount: number;
  source: string;
  kind: string;
  description: string;
  referenceId?: string | null;
  lifetimeEarnedDelta?: number | null;
  allowNegative?: boolean;
}): Promise<WalletApplyResult> {
  const data = await callWalletRpc("wallet_apply", {
    p_user_id: input.userId,
    p_amount: input.amount,
    p_source: input.source,
    p_kind: input.kind,
    p_description: input.description,
    p_reference_id: input.referenceId ?? null,
    p_lifetime_earned_delta: input.lifetimeEarnedDelta ?? null,
    p_allow_negative: input.allowNegative ?? false,
  });
  return {
    duplicate: data.duplicate === true,
    transactionId: str(data.transaction_id) ?? "",
    amount: num(data.amount),
    walletBalance: num(data.wallet_balance),
    heldBalance: num(data.held_balance),
    previousLifetimeEarned: num(data.previous_lifetime_earned),
  };
}

/**
 * Creates a pending withdrawal and holds the funds. Throws WITHDRAWAL_INSUFFICIENT
 * or WITHDRAWAL_ALREADY_PENDING. Returns the inserted withdrawal_requests row.
 */
export async function requestWithdrawalRpc(input: {
  userId: string;
  amount: number;
  payoutMethodId: string;
  methodType: string;
  snapshot: Json;
}) {
  return callWalletRpc("withdrawal_request", {
    p_user_id: input.userId,
    p_amount: input.amount,
    p_payout_method_id: input.payoutMethodId,
    p_method_type: input.methodType,
    p_snapshot: input.snapshot,
  });
}

/** Cancels the user's own pending withdrawal. Throws WITHDRAWAL_NOT_CANCELLABLE. */
export async function cancelWithdrawalRpc(userId: string, requestId: string) {
  await callWalletRpc("withdrawal_cancel", { p_user_id: userId, p_request_id: requestId });
}

export type WithdrawalSettleResult = {
  /** True only when this call moved the request out of 'pending'. */
  settled: boolean;
  alreadySettled: boolean;
  status: string;
  userId: string;
  amount: number;
};

/**
 * Admin approve/reject. Money moves only on the transition out of 'pending';
 * re-approving an approved request only updates the reference/note. Throws
 * WITHDRAWAL_ALREADY_SETTLED for any other change to a settled request.
 */
export async function settleWithdrawalRpc(input: {
  requestId: string;
  decision: "approved" | "rejected";
  note: string | null;
  reference: string | null;
}): Promise<WithdrawalSettleResult> {
  const data = await callWalletRpc("withdrawal_settle", {
    p_request_id: input.requestId,
    p_decision: input.decision,
    p_note: input.note,
    p_reference: input.reference,
  });
  return {
    settled: data.settled === true,
    alreadySettled: data.already_settled === true,
    status: str(data.status) ?? "",
    userId: str(data.user_id) ?? "",
    amount: num(data.amount),
  };
}

export type OfferClaimSettleResult = {
  settled: boolean;
  alreadyReviewed: boolean;
  status: string;
  userId: string;
  reward: number;
  previousLifetimeEarned: number | null;
};

/**
 * Approves (and pays) or rejects a pending offer claim exactly once. `reward`
 * overrides the claim's snapshot (used for limited deals); null keeps it.
 */
export async function settleOfferClaimRpc(input: {
  claimId: string;
  decision: "approved" | "rejected";
  note: string | null;
  reward: number | null;
}): Promise<OfferClaimSettleResult> {
  const data = await callWalletRpc("offer_claim_settle", {
    p_claim_id: input.claimId,
    p_decision: input.decision,
    p_note: input.note,
    p_reward: input.reward,
  });
  return {
    settled: data.settled === true,
    alreadyReviewed: data.already_reviewed === true,
    status: str(data.status) ?? "",
    userId: str(data.user_id) ?? "",
    reward: num(data.reward),
    previousLifetimeEarned:
      data.previous_lifetime_earned == null ? null : num(data.previous_lifetime_earned),
  };
}

export type SdkConversionCreditResult = {
  credited: boolean;
  /** Set when credited is false: already_credited | duplicate | not_creditable | user_not_found | zero_reward. */
  reason: string | null;
  reward: number;
  transactionId: string | null;
};

/**
 * Credits an SDK offerwall conversion exactly once and marks it credited in the
 * same transaction. allowRetry also accepts conversions in 'rejected' status.
 */
export async function creditSdkConversionRpc(input: {
  conversionId: string;
  reward: number;
  description: string;
  allowRetry: boolean;
}): Promise<SdkConversionCreditResult> {
  const data = await callWalletRpc("sdk_conversion_credit", {
    p_conversion_id: input.conversionId,
    p_reward: input.reward,
    p_description: input.description,
    p_allow_retry: input.allowRetry,
  });
  return {
    credited: data.credited === true,
    reason: str(data.reason),
    reward: num(data.reward),
    transactionId: str(data.transaction_id),
  };
}

/**
 * Releases a referral reward once (3/3 milestones, inside the window). The
 * release claim and the referrer credit commit together.
 */
export async function releaseReferralRewardRpc(input: {
  referralId: string;
  maxBonus: number;
  windowDays: number;
  description: string;
}): Promise<{
  released: boolean;
  reason: string | null;
  payout: number;
  referrerId: string | null;
}> {
  const data = await callWalletRpc("referral_release_reward", {
    p_referral_id: input.referralId,
    p_max_bonus: input.maxBonus,
    p_window_days: input.windowDays,
    p_description: input.description,
  });
  return {
    released: data.released === true,
    reason: str(data.reason),
    payout: num(data.payout),
    referrerId: str(data.referrer_id),
  };
}

/** Claws back a legacy per-milestone bonus from an expired referral, once. */
export async function reverseExpiredReferralRpc(
  referralId: string,
  description: string,
): Promise<{ reversed: boolean; amount: number; referrerId: string | null }> {
  const data = await callWalletRpc("referral_reverse_expired", {
    p_referral_id: referralId,
    p_description: description,
  });
  return {
    reversed: data.reversed === true,
    amount: num(data.amount),
    referrerId: str(data.referrer_id),
  };
}
