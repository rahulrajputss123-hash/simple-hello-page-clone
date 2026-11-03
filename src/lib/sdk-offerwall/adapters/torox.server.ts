// Torox — S2S postback adapter for the web_sdk offerwall.
//
// Signature: sig = md5(oid + "-" + user_id + "-" + secret)
// Credit when payout > 0 (positive USD). Reversals have payout < 0.
// Response must be "1" for success/duplicate, "0" for failure.
//
// Provider config:
// - slug: 'torox'
// - integration_type: 'web_sdk'
// - user_identity_mode: 'user_uuid'
// - transaction_id_param: 'id'
// - user_id_param: 'user_id'
// - reward_param: 'payout'
// - dedupe_strategy: 'transaction_id'
// - postback_auth_mode: 'ip_allowlist'
// - postback_ip_allowlist: ['44.212.211.226']
// - postback_signature_secret_ref: 'TOROX_WALL_TOKEN'
// - currency_per_usd: 1 (payout is already in USD)
//
// Required env vars:
// - TOROX_WALL_TOKEN: App Key for signature verification and session generation
// - TOROX_API_BASE: (optional) API base URL (default: https://api.wall.torox.io)
//
// Postback fields:
// - id: conversion ID (unique identifier for deduplication)
// - oid: offer ID
// - amount: offer amount (not used for crediting)
// - currency_name: currency name (not used)
// - user_id: user UUID
// - payout: USD amount paid to publisher (used for crediting)
// - o_name: offer name
// - sig: MD5 signature = md5(oid + "-" + user_id + "-" + secret)
// - event: event name
// - ip_address: user's IP address
// - subid1, subid2, subid3: tracking parameters
// - click_ts: click timestamp
// - conversion_ts: conversion timestamp

import type { SdkOfferwallAdapter } from "../types";
import { field, md5Hex, numericField, providerSecret, secureEquals } from "./_shared.server";

export const toroxSdkAdapter: SdkOfferwallAdapter = {
  slug: "torox",
  integrationType: "web_sdk",

  parsePostback: (provider, payload) => {
    const secret = providerSecret(provider);
    const id = field(payload, "id");
    const oid = field(payload, "oid");
    const userId = field(payload, "user_id");
    const payout = numericField(payload, "payout");
    const providedSig = field(payload, "sig");

    // Verify signature: md5(oid + "-" + user_id + "-" + secret)
    const validSignature = secret
      ? secureEquals(md5Hex(`${oid}-${userId}-${secret}`), providedSig)
      : false;

    // Credit only when signature is valid AND payout > 0
    // Negative payout = reversal, zero payout = test/invalid
    const shouldCredit = validSignature && payout > 0;

    return {
      // Empty txId on invalid signature -> generic pipeline rejects it
      providerTransactionId: validSignature ? id : "",
      providerUserRef: userId,
      providerOfferId: oid || undefined,
      currencyAmount: shouldCredit ? payout : 0,
      raw: payload,
    };
  },
};

export default toroxSdkAdapter;
