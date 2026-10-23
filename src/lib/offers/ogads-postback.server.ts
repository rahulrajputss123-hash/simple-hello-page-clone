/**
 * OGAds feed postback processor.
 * 
 * OGAds uses a single global postback URL per account with no HMAC signature.
 * Security relies on a secret token parameter that must match OGADS_POSTBACK_TOKEN.
 * 
 * The postback URL format is:
 * https://cashgpt.in/api/public/feed-postback/ogads?token=SECRET&offer_id={offer_id}&payout={payout}&aff_sub4={aff_sub4}&session_timestamp={session_timestamp}&session_ip={session_ip}
 * 
 * Where:
 * - token: Secret token for authentication (constant-time compared)
 * - offer_id: OGAds external offer ID
 * - payout: Network payout amount (logged only, NOT used for crediting)
 * - aff_sub4: User UUID (attached to click URL by appendAffSub4)
 * - session_timestamp: Unix timestamp from OGAds
 * - session_ip: User's IP address from OGAds
 * 
 * Deduplication: Since OGAds provides no unique lead_id, we construct:
 * external_lead_id = `${aff_sub4}:${offer_id}:${session_timestamp}`
 */

import { timingSafeEqual } from "crypto";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { payReferralMilestone } from "@/lib/coinquest.server";
import { settleOfferClaimRpc } from "@/lib/wallet/rpc.server";
import { logAutomation } from "@/lib/automation/logs.server";

export type OgAdsPostbackResult = {
  ok: boolean;
  status: "credited" | "duplicate" | "rejected";
  reason?: string;
  reward?: number;
  claimId?: string;
};

export type OgAdsPostbackParams = {
  token: string;
  offer_id: string; // external offer ID
  payout: string; // network payout (logged only)
  aff_sub4: string; // user UUID
  session_timestamp: string; // unix timestamp for deduplication
  session_ip?: string; // user IP from OGAds
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
 * Validate UUID format (RFC 4122).
 */
function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Process OGAds postback.
 * 
 * Flow:
 * 1. Verify token against OGADS_POSTBACK_TOKEN env var
 * 2. Validate required parameters and UUID format
 * 3. Find offer by provider=ogads and external_offer_id
 * 4. Validate user UUID exists
 * 5. Build dedup key: aff_sub4:offer_id:session_timestamp
 * 6. Dedupe on (provider_slug='ogads', external_lead_id)
 * 7. Credit wallet using existing offer claim settlement logic
 */
export async function processOgAdsPostback(
  params: OgAdsPostbackParams,
  sourceIp: string | null,
): Promise<OgAdsPostbackResult> {
  const {
    token,
    offer_id: externalOfferId,
    payout,
    aff_sub4: userId,
    session_timestamp: sessionTimestamp,
    session_ip: sessionIp,
  } = params;

  // 1. Verify token (constant-time comparison)
  const expectedToken = process.env["OGADS_POSTBACK_TOKEN"];
  if (!expectedToken) {
    await logError("token_not_configured", null, null, null, null, sourceIp, { sessionIp });
    return { ok: false, status: "rejected", reason: "token_not_configured" };
  }

  if (!secureTokenEquals(expectedToken, token)) {
    await logError("invalid_token", null, null, null, null, sourceIp, { sessionIp });
    return { ok: false, status: "rejected", reason: "invalid_token" };
  }

  // 2. Validate required parameters
  if (!userId || !externalOfferId || !sessionTimestamp) {
    await logError("missing_parameters", null, userId, null, null, sourceIp, {
      sessionIp,
      hasUserId: Boolean(userId),
      hasOfferId: Boolean(externalOfferId),
      hasTimestamp: Boolean(sessionTimestamp),
    });
    return { ok: false, status: "rejected", reason: "missing_parameters" };
  }

  // 3. Validate UUID format before DB query
  if (!isValidUuid(userId)) {
    await logError("invalid_user_uuid", null, userId, null, null, sourceIp, { sessionIp });
    return { ok: false, status: "rejected", reason: "invalid_user_uuid" };
  }

  // 4. Validate payout is a finite number >= 0
  const payoutAmount = Number.parseFloat(payout);
  if (!Number.isFinite(payoutAmount) || payoutAmount < 0) {
    await logError("invalid_payout", null, userId, null, null, sourceIp, {
      sessionIp,
      payout,
    });
    return { ok: false, status: "rejected", reason: "invalid_payout" };
  }

  // 5. Find offer by external_offer_id and provider
  const offerQuery = await supabaseAdmin
    .from("offers")
    .select("id, title, reward_amount, is_active, provider_id, offer_providers!inner(slug)")
    .eq("external_offer_id", externalOfferId)
    .eq("offer_providers.slug", "ogads")
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const offer = offerQuery.data as any;
  if (!offer) {
    await logError("offer_not_found", null, userId, null, null, sourceIp, {
      externalOfferId,
      sessionIp,
    });
    return { ok: false, status: "rejected", reason: "offer_not_found" };
  }

  if (!offer.is_active) {
    await logError("offer_inactive", offer.id, userId, null, null, sourceIp, { sessionIp });
    return { ok: false, status: "rejected", reason: "offer_inactive" };
  }

  // 6. Validate user exists
  const userQuery = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!userQuery.data) {
    await logError("user_not_found", offer.id, userId, null, null, sourceIp, { sessionIp });
    return { ok: false, status: "rejected", reason: "user_not_found" };
  }

  // 7. Build deduplication key: aff_sub4:offer_id:session_timestamp
  const dedupeKey = `${userId}:${externalOfferId}:${sessionTimestamp}`;

  // 8. Check for duplicate using (provider_slug='ogads', external_lead_id)
  const existingClaim = await supabaseAdmin
    .from("offer_claims")
    .select("id, status")
    .eq("provider_slug", "ogads")
    .eq("external_lead_id", dedupeKey)
    .maybeSingle();

  if (existingClaim.data) {
    await logAutomation({
      eventType: "sdk_postback",
      status: "warning",
      source: "ogads_postback",
      userId,
      referenceId: existingClaim.data.id,
      message: "Duplicate OGAds postback ignored",
      context: {
        offerId: offer.id,
        externalOfferId,
        dedupeKey,
        sessionTimestamp,
        sessionIp,
      },
    });
    return { ok: true, status: "duplicate", reason: "duplicate", claimId: existingClaim.data.id };
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
      provider_slug: "ogads",
      external_lead_id: dedupeKey,
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
      note: "Auto-credited via OGAds postback",
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
      source: "ogads_postback",
      userId,
      referenceId: claimInsert.data.id,
      message: error instanceof Error ? error.message : "Wallet credit failed",
      context: {
        offerId: offer.id,
        externalOfferId,
        dedupeKey,
        sessionTimestamp,
        sessionIp,
        leftPendingForReview: true,
      },
    });
    return { ok: false, status: "rejected", reason: "wallet_credit_failed" };
  }

  // 11. Log success
  await logAutomation({
    eventType: "wallet_credit",
    status: "success",
    source: "ogads_postback",
    userId,
    referenceId: claimInsert.data.id,
    message: `Credited $${reward.toFixed(2)} for offer ${offer.title}`,
    context: {
      offerId: offer.id,
      externalOfferId,
      dedupeKey,
      sessionTimestamp,
      networkPayout: payoutAmount,
      sessionIp,
      sourceIp,
    },
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
  dedupeKey: string | null,
  sourceIp: string | null,
  extra?: Record<string, unknown>,
): Promise<void> {
  await logAutomation({
    eventType: "sdk_postback",
    status: "error",
    source: "ogads_postback",
    userId,
    message: `OGAds postback rejected: ${reason}`,
    context: { offerId, externalOfferId, dedupeKey, sourceIp, ...extra },
  });
}
