import crypto from "node:crypto";
import { z } from "zod";

import { type UntypedClient, MktRpcError, mktDb, mktRpc, num } from "./db.server";

/**
 * Phase 5 — auto-verified campaigns: click tracking via mkt_start, conversion
 * recording via mkt_record_conversion postback.
 *
 * CRITICAL SCHEMA CORRECTIONS:
 * - Function: mkt_start (NOT recordClick!) - also used by manual campaigns
 * - Function: mkt_record_conversion takes p_meta with signature_valid, source_ip_hash, raw_payload
 * - Column: user_id (NOT publisher_id!)
 * - Column: source_ip_hash (NOT ip_address!) - IPs must be hashed
 * - click_id IS the UUID primary key, not a separate random string
 */

const mktDbConversions = mktDb as UntypedClient;

export type ConversionRow = {
  id: string;
  campaign_id: string;
  user_id: string; // NOT publisher_id!
  click_id: string;
  external_txn_id: string;
  status: "credited" | "held_for_review" | "budget_exhausted" | "rejected";
  hold_reason: string | null;
  reward_amount: string | number;
  charge_amount: string | number;
  signature_valid: boolean | null;
  source_ip_hash: string | null; // NOT ip_address!
  created_at: string;
};

/* ------------------------------------------------------------ conversions */

export class ConversionError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ConversionError";
    this.code = code;
  }
}

/**
 * Verifies postback signature for auto-conversion campaigns.
 * Returns true if signature is valid, false otherwise.
 */
export function verifyPostbackSignature(
  params: Record<string, any>,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) return false;

  // Build signature string from sorted params (excluding signature itself)
  const { signature: _, ...dataToSign } = params;
  const sortedKeys = Object.keys(dataToSign).sort();
  const signatureString = sortedKeys.map((key) => `${key}=${dataToSign[key]}`).join("&");

  // HMAC-SHA256
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(signatureString)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Records a conversion from a postback webhook.
 * 
 * Uses mkt_record_conversion which:
 * - Validates campaign is auto mode
 * - Checks for duplicates (by external_txn_id and click_id)
 * - Validates click exists and is active
 * - Decides outcome: credited, held_for_review, or budget_exhausted
 * - Pays publisher immediately if credited
 * 
 * Returns recorded: false if duplicate or invalid, true if recorded.
 */
export async function recordConversionImpl(
  campaignId: string,
  clickId: string,
  externalTxnId: string,
  sourceIp: string,
  postbackParams: Record<string, any>,
  signatureValid: boolean,
): Promise<{
  recorded: boolean;
  status?: string;
  conversionId?: string;
  userId?: string;
  holdReason?: string | null;
  reason?: string;
}> {
  // CRITICAL: Hash the source IP before storing!
  const sourceIpHash = crypto.createHash("sha256").update(sourceIp).digest("hex");

  try {
    const result = await mktRpc<{
      recorded: boolean;
      status?: string;
      conversion_id?: string;
      user_id?: string;
      hold_reason?: string | null;
      reason?: string;
    }>("mkt_record_conversion", {
      p_campaign_id: campaignId,
      p_click_id: clickId,
      p_external_txn_id: externalTxnId,
      p_meta: {
        signature_valid: signatureValid,
        source_ip_hash: sourceIpHash, // NOT raw ip_address!
        raw_payload: postbackParams,
      },
    });

    return {
      recorded: result.recorded,
      status: result.status,
      conversionId: result.conversion_id,
      userId: result.user_id,
      holdReason: result.hold_reason,
      reason: result.reason,
    };
  } catch (err) {
    if (err instanceof MktRpcError) {
      throw new ConversionError(err.code, humanConversionError(err.code));
    }
    throw err;
  }
}

/**
 * Admin decides on a held or budget_exhausted conversion.
 * Uses mkt_decide_conversion function.
 */
export async function decideConversionImpl(
  adminId: string,
  conversionId: string,
  decision: "approved" | "rejected",
  note: string | null = null,
): Promise<void> {
  if (decision === "rejected" && !note) {
    throw new ConversionError("NOTE_REQUIRED", "A note is required when rejecting a conversion.");
  }

  try {
    await mktRpc("mkt_decide_conversion", {
      p_conversion_id: conversionId,
      p_admin: adminId,
      p_decision: decision,
      p_note: note,
    });
  } catch (err) {
    if (err instanceof MktRpcError) {
      throw new ConversionError(err.code, humanConversionError(err.code));
    }
    throw err;
  }
}

/**
 * Lists held conversions requiring admin review.
 */
export async function listHeldConversionsImpl(campaignId?: string): Promise<any[]> {
  let query = mktDbConversions
    .from("campaign_conversions")
    .select("*, campaigns(name), profiles(full_name)")
    .in("status", ["held_for_review", "budget_exhausted"])
    .order("created_at", { ascending: true });

  if (campaignId) {
    query = query.eq("campaign_id", campaignId);
  }

  const { data, error } = await query;

  if (error) throw new Error(`campaign_conversions: ${error.message}`);
  return data || [];
}

function humanConversionError(code: string): string {
  switch (code) {
    case "MKT_NOT_AUTO_CAMPAIGN":
      return "This campaign doesn't support automatic conversions.";
    case "MKT_INVALID_TXN":
      return "Invalid transaction ID.";
    case "MKT_DUPLICATE":
      return "This conversion was already recorded.";
    case "MKT_UNKNOWN_CLICK":
      return "Click ID not found.";
    case "MKT_CLICK_EXPIRED":
      return "Click expired.";
    case "MKT_CONVERSION_NOT_FOUND":
      return "Conversion not found.";
    case "MKT_NO_BUDGET":
      return "No budget available.";
    default:
      return "Conversion failed.";
  }
}
