/**
 * Torox Offer Feed postback processor.
 * 
 * Security:
 * - MD5 signature verification: sig = md5(oid + "-" + user_id + "-" + TOROX_FEED_TOKEN)
 * - IP allowlist: 44.212.211.226 (Torox postback source)
 * - Must respond "1" for success/duplicate/reversal, "0" for failure
 * - Idempotent: Torox retries on non-"1" response
 * 
 * Postback parameters:
 * - id: Conversion ID (deduplication key)
 * - oid: Offer ID (external_offer_id)
 * - amount: Offer amount (USD)
 * - currency_name: Currency name (logged only)
 * - user_id: User UUID
 * - payout: Publisher revenue in USD (positive for credit, negative for reversal)
 * - o_name: Offer name (logged only)
 * - sig: MD5 signature (lowercase hex)
 * - package_id: Package/app ID (logged only)
 * - ip_address: User's IP address (logged only)
 * - event: Event name (logged only)
 * - subid1, subid2, subid3: Optional tracking params (logged only)
 * - click_ts: Click timestamp (logged only)
 * - conversion_ts: Conversion timestamp (logged only)
 * 
 * Reversal handling:
 * - payout < 0 OR amount < 0: Do not credit, wallet untouched
 * - Log the reversal for audit purposes
 * - Return "1" to acknowledge (stop retries)
 */

import { createHash, timingSafeEqual } from "crypto";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { payReferralMilestone } from "@/lib/coinquest.server";
import { settleOfferClaimRpc } from "@/lib/wallet/rpc.server";
import { logAutomation } from "@/lib/automation/logs.server";

export type ToroxPostbackResult = {
  ok: boolean;
  status: "credited" | "duplicate" | "rejected";
  reason?: string;
  reward?: number;
  claimId?: string;
};

export type ToroxPostbackParams = {
  id: string;
  oid: string;
  amount?: string;
  currency_name?: string;
  user_id: string;
  payout: string;
  o_name?: string;
  sig: string;
  package_id?: string;
  ip_address?: string;
  event?: string;
  subid1?: string;
  subid2?: string;
  subid3?: string;
  click_ts?: string;
  conversion_ts?: string;
};

const TOROX_SOURCE_IP = "44.212.211.226";

/**
 * Validate UUID format (RFC 4122).
 */
function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/**
 * MD5 hash helper (lowercase hex).
 */
function md5Hex(data: string): string {
  return createHash("md5").update(data, "utf8").digest("hex").toLowerCase();
}

/**
 * Constant-time hash comparison.
 */
function secureEquals(expected: string, provided: string): boolean {
  if (!expected || !provided) return false;
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(provided, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Process Torox feed postback.
 * 
 * Flow:
 * 1. Verify source IP is 44.212.211.226
 * 2. Verify MD5 signature = md5(oid + "-" + user_id + "-" + TOROX_FEED_TOKEN)
 * 3. Validate required parameters and UUID format
 * 4. Check payout and amount for reversal
 * 5. Find offer by provider=torox and external_offer_id
 * 6. Validate user UUID exists
 * 7. Dedupe on (provider_slug='torox', external_lead_id=id)
 * 8. Credit wallet using existing offer claim settlement logic
 */
export async function processToroxPostback(
  params: ToroxPostbackParams,
  sourceIp: string | null,
): Promise<ToroxPostbackResult> {
  const {
    id: conversionId,
    oid: externalOfferId,
    amount: amountStr,
    currency_name: currencyName,
    user_id: userId,
    payout: payoutStr,
    o_name: offerName,
    sig: providedSig,
    package_id: packageId,
    ip_address: userIp,
    event,
    subid1,
    subid2,
    subid3,
    click_ts: clickTs,
    conversion_ts: conversionTs,
  } = params;

  // 1. Verify source IP
  if (sourceIp !== TOROX_SOURCE_IP) {
    await logError("invalid_source_ip", null, userId, null, conversionId, sourceIp, {
      expectedIp: TOROX_SOURCE_IP,
      userIp,
    });
    return { ok: false, status: "rejected", reason: "invalid_source_ip" };
  }

  // 2. Verify signature
  const token = process.env["TOROX_FEED_TOKEN"];
  if (!token) {
    await logError("token_not_configured", null, userId, null, conversionId, sourceIp, { userIp });
    return { ok: false, status: "rejected", reason: "token_not_configured" };
  }

  // sig = md5(oid + "-" + user_id + "-" + token)
  const signatureString = `${externalOfferId}-${userId}-${token}`;
  const expectedSig = md5Hex(signatureString);

  if (!secureEquals(expectedSig, providedSig)) {
    await logError("invalid_signature", null, userId, externalOfferId, conversionId, sourceIp, {
      providedSig,
      userIp,
    });
    return { ok: false, status: "rejected", reason: "invalid_signature" };
  }

  // 3. Validate required parameters
  if (!userId || !externalOfferId || !conversionId || !payoutStr) {
    await logError("missing_parameters", null, userId, externalOfferId, conversionId, sourceIp, {
      hasUserId: Boolean(userId),
      hasOfferId: Boolean(externalOfferId),
      hasConversionId: Boolean(conversionId),
      hasPayout: Boolean(payoutStr),
      userIp,
    });
    return { ok: false, status: "rejected", reason: "missing_parameters" };
  }

  // 4. Validate UUID format before DB query
  if (!isValidUuid(userId)) {
    await logError("invalid_user_uuid", null, userId, externalOfferId, conversionId, sourceIp, { userIp });
    return { ok: false, status: "rejected", reason: "invalid_user_uuid" };
  }

  // 5. Validate payout is a finite number
  const payoutAmount = Number.parseFloat(payoutStr);
  if (!Number.isFinite(payoutAmount)) {
    await logError("invalid_payout", null, userId, externalOfferId, conversionId, sourceIp, {
      payout: payoutStr,
      userIp,
    });
    return { ok: false, status: "rejected", reason: "invalid_payout" };
  }

  // 6. Parse amount if provided
  const offerAmount = amountStr ? Number.parseFloat(amountStr) : null;

  // 7. Check for reversal: payout < 0 OR amount < 0
  const isReversal = payoutAmount < 0 || (offerAmount !== null && offerAmount < 0);

  if (isReversal) {
    await logAutomation({
      eventType: "sdk_postback",
      status: "warning",
      source: "torox_feed_postback",
      userId,
      message: "Torox reversal received (not credited)",
      context: {
        externalOfferId,
        offerName,
        conversionId,
        payout: payoutAmount,
        amount: offerAmount,
        currencyName,
        packageId,
        event,
        userIp,
        sourceIp,
        subid1,
        subid2,
        subid3,
        clickTs,
        conversionTs,
      },
    });
    // Return success (reversal acknowledged) but do NOT credit
    return { ok: true, status: "rejected", reason: "reversal" };
  }

  // Validate payout > 0 for credit
  if (payoutAmount <= 0) {
    await logError("invalid_payout_amount", null, userId, externalOfferId, conversionId, sourceIp, {
      payout: payoutAmount,
      userIp,
    });
    return { ok: false, status: "rejected", reason: "invalid_payout_amount" };
  }

  // 8. Find offer by external_offer_id and provider
  const offerQuery = await supabaseAdmin
    .from("offers")
    .select("id, title, reward_amount, is_active, provider_id, offer_providers!inner(slug)")
    .eq("external_offer_id", externalOfferId)
    .eq("offer_providers.slug", "torox")
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const offer = offerQuery.data as any;
  if (!offer) {
    await logError("offer_not_found", null, userId, externalOfferId, conversionId, sourceIp, {
      offerName,
      userIp,
    });
    return { ok: false, status: "rejected", reason: "offer_not_found" };
  }

  // Note: Unlike gemiad, we don't reject inactive offers since user may have clicked before deactivation

  // 9. Validate user exists
  const userQuery = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!userQuery.data) {
    await logError("user_not_found", offer.id, userId, externalOfferId, conversionId, sourceIp, {
      offerName,
      userIp,
    });
    return { ok: false, status: "rejected", reason: "user_not_found" };
  }

  // 10. Check for duplicate using (provider_slug='torox', external_lead_id=conversionId)
  const existingClaim = await supabaseAdmin
    .from("offer_claims")
    .select("id, status")
    .eq("provider_slug", "torox")
    .eq("external_lead_id", conversionId)
    .maybeSingle();

  if (existingClaim.data) {
    await logAutomation({
      eventType: "sdk_postback",
      status: "warning",
      source: "torox_feed_postback",
      userId,
      referenceId: existingClaim.data.id,
      message: "Duplicate Torox postback ignored",
      context: {
        offerId: offer.id,
        externalOfferId,
        offerName,
        conversionId,
        userIp,
        sourceIp,
      },
    });
    return { ok: true, status: "duplicate", reason: "duplicate", claimId: existingClaim.data.id };
  }

  // 11. Insert pending claim with dedup fields
  const reward = Number(offer.reward_amount);
  const claimInsert = await supabaseAdmin
    .from("offer_claims")
    .insert({
      user_id: userId,
      offer_id: offer.id,
      reward_amount: reward,
      status: "pending",
      provider_slug: "torox",
      external_lead_id: conversionId,
    } as never)
    .select("id")
    .maybeSingle();

  if (claimInsert.error || !claimInsert.data) {
    // Unique constraint collision = concurrent duplicate
    return { ok: true, status: "duplicate", reason: "duplicate" };
  }

  // 12. Settle claim and credit wallet atomically
  try {
    const settled = await settleOfferClaimRpc({
      claimId: claimInsert.data.id,
      decision: "approved",
      note: "Auto-credited via Torox feed postback",
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
      source: "torox_feed_postback",
      userId,
      referenceId: claimInsert.data.id,
      message: error instanceof Error ? error.message : "Wallet credit failed",
      context: {
        offerId: offer.id,
        externalOfferId,
        offerName,
        conversionId,
        networkPayout: payoutAmount,
        offerAmount,
        currencyName,
        packageId,
        event,
        userIp,
        sourceIp,
        subid1,
        subid2,
        subid3,
        clickTs,
        conversionTs,
        leftPendingForReview: true,
      },
    });
    return { ok: false, status: "rejected", reason: "wallet_credit_failed" };
  }

  // 13. Log success
  await logAutomation({
    eventType: "wallet_credit",
    status: "success",
    source: "torox_feed_postback",
    userId,
    referenceId: claimInsert.data.id,
    message: `Credited $${reward.toFixed(2)} for offer ${offer.title}`,
    context: {
      offerId: offer.id,
      externalOfferId,
      offerName,
      conversionId,
      networkPayout: payoutAmount,
      offerAmount,
      currencyName,
      packageId,
      event,
      userIp,
      sourceIp,
      subid1,
      subid2,
      subid3,
      clickTs,
      conversionTs,
    },
  });

  // 14. Pay referral milestone (non-fatal)
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
  conversionId: string | null,
  sourceIp: string | null,
  extra?: Record<string, unknown>,
): Promise<void> {
  await logAutomation({
    eventType: "sdk_postback",
    status: "error",
    source: "torox_feed_postback",
    userId,
    message: `Torox feed postback rejected: ${reason}`,
    context: { offerId, externalOfferId, conversionId, sourceIp, ...extra },
  });
}
