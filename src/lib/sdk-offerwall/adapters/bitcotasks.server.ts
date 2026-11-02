// BitcoTasks — S2S postback adapter for PTC, shortlinks, articles, and offers.
//
// Signature: signature = md5(`${subId}${transId}${reward}${secretKey}`)
// Credit only when status === "1" AND debug !== "1".
// Response must be exactly "ok" (lowercase) or BitcoTasks marks it failed.
//
// Provider config:
// - slug: 'bitcotasks'
// - integration_type: 'api'
// - user_identity_mode: 'user_uuid'
// - transaction_id_param: 'transId'
// - user_id_param: 'subId'
// - reward_param: 'reward'
// - dedupe_strategy: 'transaction_id'
// - postback_auth_mode: 'ip_allowlist'
// - postback_ip_allowlist: ['45.14.135.48']
// - postback_signature_secret_ref: env var name for Secret Key (e.g. 'BITCOTASKS_SECRET')
// - currency_per_usd: units per $1 (e.g. 1000 for a 1000-unit-per-dollar system)
//
// Required env vars:
// - BITCOTASKS_SECRET: Secret Key for signature verification
// - BITCOTASKS_API_KEY: (optional) API key for feed fetching
// - BITCOTASKS_BEARER: (optional) Bearer token for authenticated requests
//
// Postback fields:
// - subId: user identifier (user UUID)
// - transId: transaction ID
// - offer_name: campaign name
// - offer_type: 'ptc' | 'offer' | 'task' | 'shortlink' (article may be 'article' or 'task' - unverified)
// - reward: site currency amount (absolute)
// - reward_name: currency name
// - reward_value: units per $1
// - payout: USD amount (absolute) - NOT used for wallet credit
// - userIp: user's IP address
// - country: user's country code
// - status: '1' = credit, '2' = chargeback
// - debug: '1' = test postback, '0' = live
// - signature: MD5 hash

import type { SdkOfferwallAdapter } from "../types";
import { field, md5Hex, numericField, providerSecret, secureEquals } from "./_shared.server";

/**
 * Mapping of feed quest kinds to BitcoTasks offer_type values.
 * TODO: Verify 'article' offer_type with a real postback - may be 'task' instead.
 */
export const FEED_KIND_OFFER_TYPES = {
  ptc: ["ptc"],
  shortlink: ["shortlink"],
  article: ["article", "task"],
} as const;

export const bitcotasksSdkAdapter: SdkOfferwallAdapter = {
  slug: "bitcotasks",
  integrationType: "api",

  parsePostback: (provider, payload) => {
    const secret = providerSecret(provider);
    const subId = field(payload, "subId");
    const transId = field(payload, "transId");
    // Signed as the raw string the network sent, so reward is concatenated
    // verbatim rather than re-formatted as a number.
    const reward = field(payload, "reward");
    const providedSig = field(payload, "signature");
    const status = field(payload, "status");
    const debug = field(payload, "debug");
    const offerName = field(payload, "offer_name");
    const offerType = field(payload, "offer_type");
    const rewardValue = numericField(payload, "reward_value");

    // Verify signature
    const validSignature = secret
      ? secureEquals(md5Hex(`${subId}${transId}${reward}${secret}`), providedSig)
      : false;

    // Log warning if reward_value differs from provider's currency_per_usd
    if (validSignature && rewardValue > 0 && provider.currency_per_usd > 0) {
      if (Math.abs(rewardValue - provider.currency_per_usd) > 0.01) {
        console.warn(
          `[BitcoTasks] Postback reward_value (${rewardValue}) differs from provider currency_per_usd (${provider.currency_per_usd})`,
        );
      }
    }

    // Credit only when: valid signature AND status="1" AND debug!="1"
    const shouldCredit = validSignature && status === "1" && debug !== "1";

    return {
      // Empty on mismatch -> generic pipeline rejects it, nothing is credited.
      providerTransactionId: validSignature ? transId : "",
      providerUserRef: subId,
      providerOfferId: offerName || undefined,
      currencyAmount: shouldCredit ? numericField(payload, "reward") : 0,
      raw: payload,
    };
  },
};

export default bitcotasksSdkAdapter;

