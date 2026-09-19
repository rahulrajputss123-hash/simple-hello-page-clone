// Offerwall.me — S2S postback adapter for the web_sdk single-link offerwall.
//
// Signature: signature = md5(`${subId}${transId}${reward}${secret}`)
// Credit only when status === "1".
//
// Provider config: postback_auth_mode = "none" — the digest is a plain
// concatenated MD5, not the HMAC-over-raw-body the generic verifier computes,
// so verification lives here in parsePostback.

import type { SdkOfferwallAdapter } from "../types";
import { field, md5Hex, numericField, providerSecret, secureEquals } from "./_shared.server";

export const offerwallMeSdkAdapter: SdkOfferwallAdapter = {
  slug: "offerwallme",
  integrationType: "web_sdk",

  parsePostback: (provider, payload) => {
    const secret = providerSecret(provider);
    const subId = field(payload, "subId");
    const transId = field(payload, "transId");
    // Signed as the raw string the network sent, so reward is concatenated
    // verbatim rather than re-formatted as a number.
    const reward = field(payload, "reward");
    const providedSig = field(payload, "signature");

    const validSignature = secureEquals(
      md5Hex(`${subId}${transId}${reward}${secret}`),
      providedSig,
    );
    const credited = validSignature && field(payload, "status") === "1";

    const offerName = field(payload, "offer_name");

    return {
      // Empty on mismatch -> generic pipeline rejects it, nothing is credited.
      providerTransactionId: validSignature ? transId : "",
      providerUserRef: subId,
      providerOfferId: offerName || undefined,
      currencyAmount: credited ? numericField(payload, "reward") : 0,
      raw: payload,
    };
  },
};

export default offerwallMeSdkAdapter;
