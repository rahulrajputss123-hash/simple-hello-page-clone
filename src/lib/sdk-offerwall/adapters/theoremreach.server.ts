// TheoremReach — S2S postback adapter for the web_sdk single-link offerwall.
//
// Callback parameters:
// - user_id: Your user identifier
// - tx_id: Transaction ID (unique identifier for this conversion)
// - reward: Amount in app currency (NOT used for crediting)
// - currency: USD amount paid for this transaction (used for crediting)
// - reversal: "true" if this is a chargeback/reversal
// - debug: "true" for dashboard test button (verify hash, return 200, credit nothing)
// - screenout: "true" if user screened out (ignore)
// - profiler: "true" for profiler completion (treat as regular survey)
// - offer_id: Survey ID
// - offer_name: Survey name
// - ip: User's IP address
// - hash: Security signature
//
// Hash calculation:
// hash = base64url(HMAC-SHA1(secret_key, full callback URL without &hash=))
// The URL is the public URL TheoremReach called (e.g. https://cashgpt.in/api/public/offerwall/theoremreach?...)
// Base64url: replace + with -, / with _, remove =
//
// Response: Return plain "200 OK" for success/duplicate (stops TheoremReach retries)
//
// Provider config:
// - postback_auth_mode = "signature"
// - currency_per_usd = 1 (currency field is already in USD)
// - reward_multiplier = 0.8 (80% to user, 20% platform fee)

import type { SdkOfferwallAdapter } from "../types";
import { field, providerSecret, secureEquals } from "./_shared.server";
import { createHmac } from "crypto";

export const theoremreachSdkAdapter: SdkOfferwallAdapter = {
  slug: "theoremreach",
  integrationType: "web_sdk",

  parsePostback: (provider, payload, context) => {
    const secret = providerSecret(provider);
    const userId = field(payload, "user_id");
    const txId = field(payload, "tx_id");
    const currencyUsd = field(payload, "currency");
    const providedHash = field(payload, "hash");
    const reversal = field(payload, "reversal") === "true";
    const debug = field(payload, "debug") === "true";
    const screenout = field(payload, "screenout") === "true";

    // Reconstruct the callback URL that TheoremReach signed
    // Format: https://cashgpt.in/api/public/offerwall/theoremreach?param1=val1&param2=val2 (excluding &hash=)
    const publicBaseUrl = process.env.PUBLIC_BASE_URL || "https://cashgpt.in";
    const path = "/api/public/offerwall/theoremreach";
    
    // Build query string from payload in original order (excluding hash)
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(payload)) {
      if (key !== "hash" && key !== "src") { // src is added by our router
        params.append(key, String(value));
      }
    }
    
    const urlToVerify = `${publicBaseUrl}${path}?${params.toString()}`;
    
    // Calculate expected hash: base64url(HMAC-SHA1(secret, URL))
    const expectedHashBuffer = createHmac("sha1", secret)
      .update(urlToVerify)
      .digest();
    
    const expectedHash = expectedHashBuffer
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    const validSignature = secureEquals(expectedHash, providedHash);

    // Debug mode: verify hash, return empty to signal 200 but no credit
    if (debug) {
      return {
        providerTransactionId: validSignature ? txId : "",
        providerUserRef: userId,
        providerOfferId: field(payload, "offer_id") || undefined,
        currencyAmount: 0, // No credit for debug
        raw: payload,
      };
    }

    // Screenout: no credit
    if (screenout) {
      return {
        providerTransactionId: "",
        providerUserRef: userId,
        providerOfferId: field(payload, "offer_id") || undefined,
        currencyAmount: 0,
        raw: payload,
      };
    }

    // Reversal: mark as reversed (generic pipeline handles this)
    if (reversal) {
      return {
        providerTransactionId: "", // Empty signals rejection
        providerUserRef: userId,
        providerOfferId: field(payload, "offer_id") || undefined,
        currencyAmount: 0,
        raw: payload,
      };
    }

    // Valid completion: use currency (USD amount), not reward
    return {
      providerTransactionId: validSignature ? txId : "",
      providerUserRef: userId,
      providerOfferId: field(payload, "offer_id") || undefined,
      currencyAmount: validSignature ? Number(currencyUsd || 0) : 0,
      raw: payload,
    };
  },
};

export default theoremreachSdkAdapter;
