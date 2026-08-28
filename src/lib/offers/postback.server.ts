import { createHmac, timingSafeEqual, createHash } from "crypto";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { creditWallet, payReferralMilestone } from "@/lib/coinquest.server";
import { logAutomation } from "@/lib/automation/logs.server";

export type OfferPostbackResult = {
  ok: boolean;
  status: "credited" | "duplicate" | "rejected";
  reason?: string;
  reward?: number;
  claimId?: string;
};

export type OfferPostbackRequest = {
  offerId: string;
  params: Record<string, string>;
  rawBody: string;
  headers: Record<string, string>;
  sourceIp: string | null;
};

function secretValue(ref: string | null | undefined): string | null {
  if (!ref) return null;
  return process.env[ref] ?? null;
}

function signatureMatches(expected: string, provided: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Postback pipeline for offers on payout_mode='auto_postback'.
 *
 * Verification reuses the same patterns as the SDK offerwall pipeline:
 *   - HMAC-SHA256 signature over `txn:user:amount` using the per-offer secret
 *     env var referenced by offers.postback_secret_ref
 *   - Optional IP allowlist (offers.postback_ip_allowlist)
 *
 * On success it upserts an offer_claims row directly at status='approved' with
 * proof_url=null and credits the wallet.
 */
export async function processOfferPostback(
  req: OfferPostbackRequest,
): Promise<OfferPostbackResult> {
  const offer = await supabaseAdmin
    .from("offers")
    .select("*")
    .eq("id", req.offerId)
    .maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o = offer.data as any;
  if (!o) return log("unknown_offer", req, null, null, null);
  if (!o.is_active) return log("offer_inactive", req, req.offerId, null, null);
  if (o.payout_mode !== "auto_postback") {
    return log("not_auto_postback", req, req.offerId, null, null);
  }

  // ---- Verify caller -------------------------------------------------------
  const secret = secretValue(o.postback_secret_ref);
  if (!secret) return log("signature_secret_missing", req, req.offerId, null, null);

  const allow: string[] = o.postback_ip_allowlist ?? [];
  if (allow.length > 0 && (!req.sourceIp || !allow.includes(req.sourceIp))) {
    return log("ip_not_allowed", req, req.offerId, null, null);
  }

  const txnId = (req.params["txn"] ?? req.params["transaction_id"] ?? "").trim();
  const userRef = (req.params["uid"] ?? req.params["user_id"] ?? "").trim();
  const amount = Number(req.params["amount"] ?? req.params["reward"] ?? 0);
  if (!txnId) return log("missing_transaction_id", req, req.offerId, null, null);

  const provided = (
    req.params["sig"] ??
    req.params["signature"] ??
    req.headers["x-signature"] ??
    ""
  ).toLowerCase();
  const base =
    req.rawBody && req.rawBody.length > 0 ? req.rawBody : `${txnId}:${userRef}:${amount}`;
  const expected = createHmac("sha256", secret).update(base).digest("hex");
  if (!provided || !signatureMatches(expected, provided)) {
    return log("invalid_signature", req, req.offerId, userRef, null);
  }

  // ---- Resolve user --------------------------------------------------------
  if (!userRef) return log("missing_user", req, req.offerId, null, null);
  const profile = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", userRef)
    .maybeSingle();
  const userId = profile.data?.id ?? null;
  if (!userId) return log("user_not_found", req, req.offerId, userRef, null);

  // ---- Dedupe via offer_claims.postback_txn_id unique index ---------------
  const existing = await supabaseAdmin
    .from("offer_claims")
    .select("id, status")
    .eq("offer_id", req.offerId)
    .eq("postback_txn_id", txnId)
    .maybeSingle();
  if (existing.data) {
    await logAutomation({
      eventType: "sdk_postback",
      status: "warning",
      source: "offer_postback",
      referenceId: existing.data.id,
      userId,
      message: "Duplicate offer postback ignored",
      context: { offerId: req.offerId, txnId },
    });
    return { ok: true, status: "duplicate", reason: "duplicate", claimId: existing.data.id };
  }

  // ---- Insert approved claim + credit --------------------------------------
  const reward = Number(o.reward_amount);
  const claim = await supabaseAdmin
    .from("offer_claims")
    .insert({
      user_id: userId,
      offer_id: req.offerId,
      reward_amount: reward,
      status: "approved",
      postback_txn_id: txnId,
      admin_note: "Auto-credited via postback",
    } as never)
    .select("id")
    .maybeSingle();
  if (claim.error || !claim.data) {
    // Unique index collision = concurrent duplicate; treat as duplicate.
    return { ok: true, status: "duplicate", reason: "duplicate" };
  }

  try {
    await creditWallet(userId, reward, "offer", `Offer reward: ${o.title}`);
  } catch (error) {
    await logAutomation({
      eventType: "wallet_credit",
      status: "error",
      source: "offer_postback",
      userId,
      referenceId: claim.data.id,
      message: error instanceof Error ? error.message : "Wallet credit failed",
    });
    return { ok: false, status: "rejected", reason: "wallet_credit_failed" };
  }

  await logAutomation({
    eventType: "wallet_credit",
    status: "success",
    source: "offer_postback",
    userId,
    referenceId: claim.data.id,
    message: `Credited $${reward.toFixed(2)} for offer ${o.title}`,
    context: { offerId: req.offerId, txnId },
  });

  try {
    await payReferralMilestone(userId, "earning", "Referral: friend's first earning");
  } catch {
    // Non-fatal
  }

  return { ok: true, status: "credited", reward, claimId: claim.data.id };
}

async function log(
  reason: string,
  req: OfferPostbackRequest,
  offerId: string | null,
  userRef: string | null,
  userId: string | null,
): Promise<OfferPostbackResult> {
  const hash = createHash("sha256").update(JSON.stringify(req.params)).digest("hex").slice(0, 16);
  await logAutomation({
    eventType: "sdk_postback",
    status: "error",
    source: "offer_postback",
    userId,
    message: `Offer postback rejected: ${reason}`,
    context: { offerId, userRef, paramsHash: hash, sourceIp: req.sourceIp },
  });
  return { ok: false, status: "rejected", reason };
}
