// Revtoo — S2S postback adapter for the web_sdk single-link offerwall.
//
// Revtoo uses an MD5 formula identical to Offerwall.me:
//   signature = md5(`${subId}${transId}${reward}${secret}`)
// status "1" = credit, status "2" = chargeback (must NOT credit).
// The only field difference from Offerwall.me is offer_id vs offer_name.
//
// Provider config: postback_auth_mode = "none" — plain concatenated MD5, so
// verification lives here rather than in the generic verifier.

import type { SdkOfferwallAdapter } from "../types";
import { field, md5Hex, numericField, providerSecret, secureEquals } from "./_shared.server";

export const revtooSdkAdapter: SdkOfferwallAdapter = {
  slug: "revtoo",
  integrationType: "web_sdk",

  parsePostback: (provider, payload) => {
    const secret = providerSecret(provider);
    const subId = field(payload, "subId");
    const transId = field(payload, "transId");
    const reward = field(payload, "reward");
    const providedSig = field(payload, "signature");

    const validSignature = secureEquals(
      md5Hex(`${subId}${transId}${reward}${secret}`),
      providedSig,
    );
    // Only "1" credits. "2" is a chargeback: the conversion is recorded with a
    // zero amount (rejected as zero_reward) and the wallet is never debited.
    const credited = validSignature && field(payload, "status") === "1";

    const offerId = field(payload, "offer_id");

    return {
      providerTransactionId: validSignature ? transId : "",
      providerUserRef: subId,
      providerOfferId: offerId || undefined,
      currencyAmount: credited ? numericField(payload, "reward") : 0,
      raw: payload,
    };
  },
};

export default revtooSdkAdapter;
