// Affike — S2S postback adapter for the web_sdk single-link offerwall.
//
// NO SIGNATURE VERIFICATION IS POSSIBLE HERE. Affike's macro list exposes no
// {signature} / {hash} equivalent, so there is nothing to cryptographically
// verify. The previous HMAC-SHA256 check was built from incorrect docs and has
// been removed rather than left to fail every real postback.
//
// Because this adapter defines no verifyPostback, the generic verifier in
// src/lib/automation/postback.server.ts applies instead — and Affike's row is
// postback_auth_mode = "none", which accepts any caller. An IP allowlist is the
// only authentication this network can support; see postback_ip_allowlist.
//
// Field names are confirmed against Affike's live dashboard:
//   user_id, payout, txn_id, status, offer_id, offer_name, click_id
//
// Status handling: only "confirmed" credits. Anything else — including the
// "test" value Affike's own dashboard test button sends — records the
// conversion with a zero amount, so no wallet credit is made.
//
// currency_per_usd = 1 because Affike's `payout` is already USD-denominated
// rather than the app's virtual currency, which makes convertSdkCurrency a
// no-op. Leaving it at 100 would pay out 1/100th of the real amount.

import type { SdkOfferwallAdapter } from "../types";
import { field, numericField } from "./_shared.server";

export const affikeSdkAdapter: SdkOfferwallAdapter = {
  slug: "affike",
  integrationType: "web_sdk",

  parsePostback: (_provider, payload) => {
    const confirmed = field(payload, "status") === "confirmed";

    return {
      // Kept even when not confirmed: the generic pipeline needs a stable
      // transaction id to dedupe repeat callbacks for the same conversion.
      providerTransactionId: field(payload, "txn_id"),
      providerUserRef: field(payload, "user_id"),
      providerOfferId: field(payload, "offer_id") || undefined,
      currencyAmount: confirmed ? numericField(payload, "payout") : 0,
      raw: payload,
    };
  },
};

export default affikeSdkAdapter;
