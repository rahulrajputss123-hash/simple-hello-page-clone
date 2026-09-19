// MoOffers — S2S postback adapter for the web_sdk single-link offerwall.
//
// DELIBERATELY NO verifyPostback / no signature code here.
// MoOffers is configured with postback_auth_mode = "signature", so the generic
// pipeline in src/lib/automation/postback.server.ts already verifies
// HMAC-SHA256(secret, rawBody) against the "x-callback-signature" header.
// Defining verifyPostback here would OVERRIDE that generic verification
// (processSdkPostback prefers the adapter's own verifier), so this adapter
// implements parsePostback only and lets the generic verifier do its job.
//
// Status handling: only "approved" credits. "pending", "reversed" and "invalid"
// yield a zero amount, so the conversion is recorded but no wallet credit is made.

import type { SdkOfferwallAdapter } from "../types";
import { field, numericField } from "./_shared.server";

export const mooffersSdkAdapter: SdkOfferwallAdapter = {
  slug: "mooffers",
  integrationType: "web_sdk",

  parsePostback: (_provider, payload) => {
    const approved = field(payload, "status") === "approved";

    return {
      // Kept even when not approved: the generic pipeline needs a stable
      // transaction id to dedupe repeat callbacks for the same conversion.
      providerTransactionId: field(payload, "conversion_no"),
      providerUserRef: field(payload, "uid"),
      providerOfferId: field(payload, "offer_id") || undefined,
      currencyAmount: approved ? numericField(payload, "reward") : 0,
      raw: payload,
    };
  },
};

export default mooffersSdkAdapter;
