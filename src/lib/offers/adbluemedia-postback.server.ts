/**
 * AdBlueMedia feed postback processor.
 * 
 * AdBlueMedia uses a single global postback URL per account with no HMAC signature.
 * Security relies on a secret token parameter that must match ADBLUEMEDIA_POSTBACK_TOKEN.
 * 
 * The postback URL format is:
 * https://cashgpt.in/api/public/feed-postback/adbluemedia?token=SECRET&s1={s1}&offer_id={offer_id}&lead_id={lead_id}&payout={payout}&status={status}
 * 
 * Where:
 * - token: Secret token for authentication (constant-time compared)
 * - s1: User UUID (attached to click URL by appendAffSub4)
 * - offer_id: AdBlueMedia's external offer ID
 * - lead_id: Unique transaction ID for deduplication
 * - payout: Amount to credit (in dollars)
 * - status: "1" = success, "0" = chargeback/reversal
 */

import { timingSafeEqual } from "crypto";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { payReferralMilestone } from "@/lib/coinquest.server";
import { settleOfferClaimRpc } from "@/lib/wallet/rpc.server";
import { logAutomation } from "@/lib/automation/logs.server";

export type AdBlueMediaPostbackResult = {
  ok: boolean;
  status: "credited" | "duplicate" | "rejected" | "chargeback";
  reason?: string;
  reward?: number;
  claimId?: string;
};

export type AdBlueMediaPostbackParams = {
  token: string;
  s1: string; // user UUID
  offer_id: string; // external offer ID
  lead_id: string; // transaction ID for deduplication
  payout: string; // amount in dollars
  status: string; // "1" = success, "0" = chargeback
};

/**
 * Constant-time token comparison.
 * Returns false if either token is missing or they don't match.
 */
function secureTokenEquals(expected: string | undefined, provided: string | undefined): boolean {
  if (!expected || !provided) return false;
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(provided, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Process AdBlueMedia postback.
 * 
 * Flow:
 * 1. Verify token against ADBLUEMEDIA_POSTBACK_TOKEN env var
 * 2. Find offer by provider=adbluemedia and external_offer_id
 * 3. Validate user UUID exists
 * 4. Handle status: "1" = credit, "0" = log chargeback
 * 5. Dedupe on (provider_slug, external_lead_id)
 * 6. Credit wallet using existing offer claim settlement logic
 */
export async function processAdBlueMediaPostback(
  params: AdBlueMediaPostbackParams,
  sourceIp: string | null,
): Promise<AdBlueMediaPostbackResult> {
  const { token, s1: userId, offer_id: externalOfferId, lead_id: leadId, payout, status } = params;

  // 1. Verify token (constant-time comparison)
  const expectedToken = process.env["ADBLUEMEDIA_POSTBACK_TOKEN"];
  if (!expectedToken) {
    await logError("token_not_configured", null, null, null, leadId, sourceIp);
    return { ok: false, status: "rejected", reason: "token_not_configured" };
  }

  if (!secureTokenEquals(expectedToken, token)) {
    await logError("invalid_token", null, null, null, leadId, sourceIp);
    return { ok: false, status: "rejected", reason: "invalid_token" };
  }

  // 2. Validate required parameters
  if (!userId || !externalOfferId || !leadId || !payout || !status) {
    await logError("missing_parameters", null, userId, null, leadId, sourceIp);
    return { ok: false, status: "rejected", reason: "missing_parameters" };
  }

  // 3. Handle chargeback (status = "0")
  if (status === "0") {
    await logAutomation({
      eventType: "sdk_postback",
      status: "warning",
      source: "adbluemedia_postback",
      userId: userId || null,
      message: "AdBlueMedia chargeback received",
      context: { externalOfferId, leadId, payout, sourceIp },
    });
    return { ok: true, status: "chargeback", reason: "status_0_chargeback" };
  }

  // 4. Only process status = "1" (success)
  if (status !== "1") {
    await logError("unknown_status", null, userId, null, leadId, sourceIp, { status });
    return { ok: false, status: "rejected", reason: `unknown_status_${status}` };
  }

  // 5. Find offer by external_offer_id and provider
  const offerQuery = await supabaseAdmin
    .from("offers")
    .select("id, title, reward_amount, is_active, provider_id, offer_providers!inner(slug)")
    .eq("external_offer_id", externalOfferId)
    .eq("offer_providers.slug", "adbluemedia")
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const offer = offerQuery.data as any;
  if (!offer) {
    await logError("offer_not_found", null, userId, null, leadId, sourceIp, { externalOfferId });
    return { ok: false, status: "rejected", reason: "offer_not_found" };
  }

  if (!offer.is_active) {
    await logError("offer_inactive", offer.id, userId, null, leadId, sourceIp);
    return { ok: false, status: "rejected", reason: "offer_inactive" };
  }

  // 6. Validate user exists
  const userQuery = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!userQuery.data) {
    await logError("user_not_found", offer.id, userId, null, leadId, sourceIp);
    return { ok: false, status: "rejected", reason: "user_not_found" };
  }

  // 7. Check for duplicate using (provider_slug, external_lead_id)
  const existingClaim = await supabaseAdmin
    .from("offer_claims")
    .select("id, status")
    .eq("provider_slug", "adbluemedia")
    .eq("external_lead_id", leadId)
    .maybeSingle();

  if (existingClaim.data) {
    await logAutomation({
      eventType: "sdk_postback",
      status: "warning",
      source: "adbluemedia_postback",
      userId,
      referenceId: existingClaim.data.id,
      message: "Duplicate AdBlueMedia postback ignored",
      context: { offerId: offer.id, externalOfferId, leadId },
    });
    return { ok: true, status: "duplicate", reason: "duplicate", claimId: existingClaim.data.id };
  }

  // 8. Parse payout amount
  const payoutAmount = Number.parseFloat(payout);
  if (!Number.isFinite(payoutAmount) || payoutAmount <= 0) {
    await logError("invalid_payout", offer.id, userId, null, leadId, sourceIp, { payout });
    return { ok: false, status: "rejected", reason: "invalid_payout" };
  }

  // 9. Insert pending claim with dedup fields
  const reward = Number(offer.reward_amount);
  const claimInsert = await supabaseAdmin
    .from("offer_claims")
    .insert({
      user_id: userId,
      offer_id: offer.id,
      reward_amount: reward,
      status: "pending",
      provider_slug: "adbluemedia",
      external_lead_id: leadId,
    } as never)
    .select("id")
    .maybeSingle();

  if (claimInsert.error || !claimInsert.data) {
    // Unique constraint collision = concurrent duplicate
    return { ok: true, status: "duplicate", reason: "duplicate" };
  }

  // 10. Settle claim and credit wallet atomically
  try {
    const settled = await settleOfferClaimRpc({
      claimId: claimInsert.data.id,
      decision: "approved",
      note: "Auto-credited via AdBlueMedia postback",
      reward,
    });

    if (!settled.settled) {
      // Already settled by someone else (race condition)
      return { ok: true, status: "duplicate", reason: "duplicate", claimId: claimInsert.data.id };
    }
  } catch (error) {
    await logAutomation({
      eventType: "wallet_credit",
      status: "error",
      source: "adbluemedia_postback",
      userId,
      referenceId: claimInsert.data.id,
      message: error instanceof Error ? error.message : "Wallet credit failed",
      context: {
        offerId: offer.id,
        externalOfferId,
        leadId,
        leftPendingForReview: true,
      },
    });
    return { ok: false, status: "rejected", reason: "wallet_credit_failed" };
  }

  // 11. Log success
  await logAutomation({
    eventType: "wallet_credit",
    status: "success",
    source: "adbluemedia_postback",
    userId,
    referenceId: claimInsert.data.id,
    message: `Credited $${reward.toFixed(2)} for offer ${offer.title}`,
    context: { offerId: offer.id, externalOfferId, leadId, networkPayout: payoutAmount },
  });

  // 12. Pay referral milestone (non-fatal)
  try {
    await payReferralMilestone(userId, "earning", "Referral: friend's first earning");
  } catch {
    // Non-fatal
  }

  return { ok: true, status: "credited", reward, claimId: claimInsert.data.id };
}

async function logError(
  reason: string,
  offerId: string | null,
  userId: string | null,
  externalOfferId: string | null,
  leadId: string | null,
  sourceIp: string | null,
  extra?: Record<string, unknown>,
): Promise<void> {
  await logAutomation({
    eventType: "sdk_postback",
    status: "error",
    source: "adbluemedia_postback",
    userId,
    message: `AdBlueMedia postback rejected: ${reason}`,
    context: { offerId, externalOfferId, leadId, sourceIp, ...extra },
  });
}
