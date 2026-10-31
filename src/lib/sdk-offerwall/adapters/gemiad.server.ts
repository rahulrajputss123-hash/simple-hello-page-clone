// GemiAd — S2S postback adapter for the web_sdk offerwall (iframe/webview).
//
// Hash: hash = sha256(userId + offerId + txid + secret), verified in-adapter.
// GemiAd's digest is a plain concatenated SHA-256, not the generic HMAC-over-
// raw-body that verifyCaller() computes.
//
// Query parameter names: GemiAd sends {TXID}, {USER_ID}, etc. as macros, so
// the actual query keys may vary in casing. Read case-insensitively.
//
// `payout` is USD-denominated, so currency_per_usd on the provider row must be 1.
// convertSdkCurrency() then applies reward_multiplier (0.8) for the user's 80% share.
//
// status="rejected" OR payout < 0 -> zero reward, wallet left untouched (matches
// how the other adapters here handle chargebacks/reversals; no reversal support
// exists in the pipeline).
//
// Provider config: postback_auth_mode = "signature_and_ip" (SHA256 hash + IP allowlist
// 64.226.92.208), so the generic verifyCaller() handles the IP check before this
// adapter's parsePostback ever runs; the hash check happens here because it is not
// the generic HMAC scheme.

import type { SdkOfferwallAdapter } from "../types";
import { field, numericField, providerSecret, secureEquals, sha256Hex } from "./_shared.server";

/** Postback status that must NOT move money. Only "completed" (or empty) credits. */
const NON_CREDIT_STATUSES = new Set(["rejected"]);

/**
 * Case-insensitive field lookup (GemiAd macros may vary in casing).
 */
function fieldCaseInsensitive(payload: Record<string, unknown>, key: string): string {
  // Try exact match first
  const exactValue = payload[key];
  if (exactValue !== null && exactValue !== undefined) {
    return String(exactValue).trim();
  }

  // Try case-insensitive match
  const lowerKey = key.toLowerCase();
  for (const [k, v] of Object.entries(payload)) {
    if (k.toLowerCase() === lowerKey && v !== null && v !== undefined) {
      return String(v).trim();
    }
  }

  return "";
}

/**
 * Case-insensitive numeric field lookup.
 */
function numericFieldCaseInsensitive(payload: Record<string, unknown>, key: string): number {
  const parsed = Number.parseFloat(fieldCaseInsensitive(payload, key));
  return Number.isFinite(parsed) ? parsed : 0;
}

export const gemiAdSdkAdapter: SdkOfferwallAdapter = {
  slug: "gemiad",
  integrationType: "web_sdk",

  parsePostback: (provider, payload) => {
    const secret = providerSecret(provider);
    
    // Read query parameters case-insensitively
    const userId = fieldCaseInsensitive(payload, "userId");
    const offerId = fieldCaseInsensitive(payload, "offerId");
    const txid = fieldCaseInsensitive(payload, "txid");
    const providedHash = fieldCaseInsensitive(payload, "hash");
    const status = (fieldCaseInsensitive(payload, "status") || "completed").toLowerCase();
    
    // Payout is signed as the raw string GemiAd sent and must never be rounded
    // or reformatted before hashing.
    const payoutStr = fieldCaseInsensitive(payload, "payout");
    const payout = numericFieldCaseInsensitive(payload, "payout");

    // Hash = sha256(userId + offerId + txid + secret)
    const validSignature =
      secret.length > 0 && secureEquals(sha256Hex(`${userId}${offerId}${txid}${secret}`), providedHash);

    // Reversal: status="rejected" OR payout < 0
    const isReversal = NON_CREDIT_STATUSES.has(status) || payout < 0;
    const credited = validSignature && !isReversal && payout > 0;

    return {
      // Empty on mismatch -> generic pipeline rejects it, nothing is credited.
      // Kept for reversal so the conversion is still recorded and deduplicated
      // against the eventual follow-up postback.
      providerTransactionId: validSignature ? txid : "",
      providerUserRef: userId,
      providerOfferId: offerId || undefined,
      // payout is already USD; currency_per_usd = 1 on the provider row keeps
      // convertSdkCurrency's division a no-op, and reward_multiplier = 0.8 gives
      // the user their 80% share. Reversals and rejected status fall through to 0
      // here because `credited` is false for them.
      currencyAmount: credited ? payout : 0,
      raw: payload,
    };
  },
};

export default gemiAdSdkAdapter;
