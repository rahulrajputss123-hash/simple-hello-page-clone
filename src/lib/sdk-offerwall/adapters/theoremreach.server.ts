// TheoremReach — S2S postback adapter for the web_sdk single-link offerwall.
//
// Standard callback parameters (adjust based on actual TheoremReach docs):
// - user_id: Your user identifier
// - reward: Amount to credit (in their currency)
// - transaction_id: Unique transaction identifier
// - hash: Security signature for verification
//
// Hash calculation (typical pattern, verify with TheoremReach docs):
// hash = md5(transaction_id + user_id + reward + secret_key)
//
// Provider config: postback_auth_mode = "signature" — the digest is a plain
// concatenated MD5, not the HMAC-over-raw-body the generic verifier computes,
// so verification lives here in parsePostback.

import type { SdkOfferwallAdapter } from "../types";
import { field, md5Hex, numericField, providerSecret, secureEquals } from "./_shared.server";

export const theoremreachSdkAdapter: SdkOfferwallAdapter = {
  slug: "theoremreach",
  integrationType: "web_sdk",

  parsePostback: (provider, payload) => {
    const secret = providerSecret(provider);
    const userId = field(payload, "user_id");
    const transactionId = field(payload, "transaction_id");
    // Signed as the raw string the network sent
    const reward = field(payload, "reward");
    const providedHash = field(payload, "hash");

    // Standard pattern: md5(transaction_id + user_id + reward + secret_key)
    const validSignature = secureEquals(
      md5Hex(`${transactionId}${userId}${reward}${secret}`),
      providedHash,
    );

    return {
      // Empty on mismatch -> generic pipeline rejects it, nothing is credited.
      providerTransactionId: validSignature ? transactionId : "",
      providerUserRef: userId,
      providerOfferId: field(payload, "offer_id") || undefined,
      currencyAmount: validSignature ? numericField(payload, "reward") : 0,
      raw: payload,
    };
  },
};

export default theoremreachSdkAdapter;
