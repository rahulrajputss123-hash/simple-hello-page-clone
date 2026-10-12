// CPX Research — S2S postback adapter for the web_sdk single-link offerwall.
// Separate from the catalogue-feed adapter in src/lib/offers/adapters/.
//
// Signature: secure_hash = md5(`${trans_id}-${secret}`)
// Credit only when status === "1".
//
// Provider config: postback_auth_mode = "none" — verification happens here in
// parsePostback rather than in the generic verifier, because CPX signs
// trans_id rather than the raw body or the generic txid:user:amount base.

import type { SdkOfferwallAdapter } from "../types";
import { field, md5Hex, numericField, providerSecret, secureEquals } from "./_shared.server";

export const cpxResearchSdkAdapter: SdkOfferwallAdapter = {
  slug: "cpxresearch",
  integrationType: "web_sdk",

  parsePostback: (provider, payload) => {
    const secret = providerSecret(provider);
    const transId = field(payload, "trans_id");
    const providedHash = field(payload, "secure_hash");

    // A missing secret must never verify — secureEquals("", …) is false.
    const validSignature = secureEquals(md5Hex(`${transId}-${secret}`), providedHash);
    const credited = validSignature && field(payload, "status") === "1";

    const offerId = field(payload, "offer_id");

    return {
      // An empty transaction id makes the generic pipeline reject the postback
      // ("missing_transaction_id") so nothing is credited on a bad signature.
      providerTransactionId: validSignature ? transId : "",
      providerUserRef: field(payload, "user_id"),
      providerOfferId: offerId || undefined,
      currencyAmount: credited ? numericField(payload, "amount_usd") : 0,
      raw: payload,
    };
  },
};

export default cpxResearchSdkAdapter;
