// Affike — S2S postback adapter for the web_sdk single-link offerwall.
//
// Signature: signature = HMAC-SHA256(secret, `${user_id}${payout}${transaction_id}`)
// compared in constant time via crypto.timingSafeEqual (see secureEquals).
//
// Provider config: postback_auth_mode = "none" (verification happens here), and
// currency_per_usd = 1 because Affike's `payout` is already USD-denominated
// rather than the app's virtual currency like the other networks.

import type { SdkOfferwallAdapter } from "../types";
import { field, hmacSha256Hex, numericField, providerSecret, secureEquals } from "./_shared.server";

export const affikeSdkAdapter: SdkOfferwallAdapter = {
  slug: "affike",
  integrationType: "web_sdk",

  parsePostback: (provider, payload) => {
    const secret = providerSecret(provider);
    const userId = field(payload, "user_id");
    const transactionId = field(payload, "transaction_id");
    // Concatenated verbatim in the order Affike signs them.
    const payout = field(payload, "payout");
    const providedSig = field(payload, "signature");

    const validSignature =
      secret.length > 0 &&
      secureEquals(hmacSha256Hex(secret, `${userId}${payout}${transactionId}`), providedSig);

    return {
      // Empty on mismatch -> generic pipeline rejects it, nothing is credited.
      providerTransactionId: validSignature ? transactionId : "",
      providerUserRef: userId,
      providerOfferId: field(payload, "offer_id") || undefined,
      // payout is already USD; currency_per_usd = 1 keeps convertSdkCurrency a no-op.
      currencyAmount: validSignature ? numericField(payload, "payout") : 0,
      raw: payload,
    };
  },
};

export default affikeSdkAdapter;
