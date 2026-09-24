// TimeWall — S2S postback adapter for the web_sdk single-link offerwall.
//
// Hash: hash = sha256(`${userID}${revenue}${secretKey}`), verified in-adapter
// (TimeWall's digest is a plain concatenated SHA-256, not the generic
// HMAC-over-raw-body verifyCaller() computes).
//
// `revenue` is signed as the RAW string TimeWall sent and must never be rounded
// or reformatted before hashing — sub-cent values like "0.002" would not match
// if normalised to "0.00".
//
// `revenue` is already USD-denominated (like Affike's `payout`), so
// currency_per_usd on the provider row must be 1 — convertSdkCurrency() then
// just applies reward_multiplier (0.8) for the user's 80% share.
//
// type=chargeback -> zero reward, wallet left untouched (matches how the other
// adapters here handle chargebacks; no reversal support exists in the pipeline).
// type=hold / hold_cancelled -> zero reward, NOT treated as fraud; TimeWall
// follows up with a credit or chargeback postback once the hold resolves.
//
// Provider config: postback_auth_mode = "ip_allowlist" (TimeWall's 3 source
// IPs), so the generic verifyCaller() handles the IP check before this adapter's
// parsePostback ever runs; the hash check happens here because it is not the
// generic HMAC scheme.

import type { SdkOfferwallAdapter } from "../types";
import { field, numericField, providerSecret, secureEquals, sha256Hex } from "./_shared.server";

/** Postback types that must NOT move money. Only "credit" (or empty) credits. */
const NON_CREDIT_TYPES = new Set(["chargeback", "hold", "hold_cancelled"]);

export const timewallSdkAdapter: SdkOfferwallAdapter = {
  slug: "timewall",
  integrationType: "web_sdk",

  parsePostback: (provider, payload) => {
    const secret = providerSecret(provider);
    const userId = field(payload, "userid");
    const txid = field(payload, "txid");
    // Signed as the raw string TimeWall sent — never round/reformat.
    const revenue = field(payload, "revenue");
    const providedHash = field(payload, "hash");
    // An empty {type} macro means a normal credit.
    const type = (field(payload, "type") || "credit").toLowerCase();

    const validSignature =
      secret.length > 0 && secureEquals(sha256Hex(`${userId}${revenue}${secret}`), providedHash);

    const credited = validSignature && !NON_CREDIT_TYPES.has(type);

    return {
      // Empty on mismatch -> generic pipeline rejects it, nothing is credited.
      // Kept for chargeback/hold so the conversion is still recorded and
      // deduplicated against the eventual follow-up postback.
      providerTransactionId: validSignature ? txid : "",
      providerUserRef: userId,
      providerOfferId: field(payload, "offername") || undefined,
      // revenue is already USD; currency_per_usd = 1 on the provider row keeps
      // convertSdkCurrency's division a no-op, and reward_multiplier = 0.8 gives
      // the user their 80% share. chargeback/hold/hold_cancelled all fall
      // through to 0 here because `credited` is false for them.
      currencyAmount: credited ? numericField(payload, "revenue") : 0,
      raw: payload,
    };
  },
};

export default timewallSdkAdapter;
