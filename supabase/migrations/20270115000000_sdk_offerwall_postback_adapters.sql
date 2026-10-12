-- SDK offerwall postback adapter configuration (web_sdk single-link system)
--
-- Wires the 5 networks that now have signature-verified S2S postback adapters
-- under src/lib/sdk-offerwall/adapters/. Configuration only — no schema change,
-- and no secret VALUES are stored here. `postback_signature_secret_ref` holds
-- the NAME of an environment variable; the adapter reads the value with
-- process.env[thatName] at request time.
--
-- postback_auth_mode rationale:
--   'none'      -> the adapter's own parsePostback verifies the signature and
--                  returns an empty provider_transaction_id on mismatch, which
--                  the generic pipeline rejects as missing_transaction_id.
--                  Used where the network's digest is NOT the generic
--                  HMAC-SHA256-over-raw-body that verifyCaller() computes.
--   'signature' -> the generic verifier in src/lib/automation/postback.server.ts
--                  does the work: HMAC-SHA256(secret, rawBody) compared against
--                  the x-callback-signature header. Only MoOffers uses this.
--
-- Environment variables that must be set for crediting to work:
--   CPX_SECURE_HASH           (also used by the live survey fetch)
--   OFFERWALLME_SECRET_KEY
--   REVTOO_POSTBACK_SECRET
--   AFFIKE_POSTBACK_SECRET
--   MOOFFERS_POSTBACK_SECRET

-- CPX Research — secure_hash = md5(trans_id || '-' || secret), verified in-adapter.
-- Points at CPX_SECURE_HASH (not the previous CPX_APP_SECRET) because CPX has a
-- single "secure hash" secret shared by the survey API and the postback, and
-- fetchCpxSurveys already reads CPX_SECURE_HASH.
UPDATE public.sdk_offerwall_providers
SET postback_auth_mode = 'none',
    postback_signature_secret_ref = 'CPX_SECURE_HASH',
    updated_at = now()
WHERE slug = 'cpxresearch';

-- Offerwall.me — signature = md5(subId || transId || reward || secret), in-adapter.
UPDATE public.sdk_offerwall_providers
SET postback_auth_mode = 'none',
    postback_signature_secret_ref = 'OFFERWALLME_SECRET_KEY',
    updated_at = now()
WHERE slug = 'offerwallme';

-- Revtoo — identical MD5 formula to Offerwall.me, verified in-adapter.
-- Was 'ip_allowlist' with an empty allowlist, which rejected every postback
-- (verifyCaller returns ip_allowlist_empty when the list is empty).
UPDATE public.sdk_offerwall_providers
SET postback_auth_mode = 'none',
    postback_signature_secret_ref = 'REVTOO_POSTBACK_SECRET',
    updated_at = now()
WHERE slug = 'revtoo';

-- Affike — signature = HMAC-SHA256(secret, user_id || payout || transaction_id),
-- verified in-adapter with a constant-time comparison.
-- currency_per_usd = 1 because Affike's `payout` is already USD-denominated,
-- unlike the other networks' virtual currency. convertSdkCurrency() divides by
-- this value, so leaving it at 100 would have paid out 1/100th of the real amount.
UPDATE public.sdk_offerwall_providers
SET postback_auth_mode = 'none',
    postback_signature_secret_ref = 'AFFIKE_POSTBACK_SECRET',
    currency_per_usd = 1,
    updated_at = now()
WHERE slug = 'affike';

-- MoOffers — the ONE provider that uses the generic verifier. Its adapter
-- implements parsePostback only (no verifyPostback), so this mode is what
-- actually authenticates the caller.
UPDATE public.sdk_offerwall_providers
SET postback_auth_mode = 'signature',
    postback_signature_secret_ref = 'MOOFFERS_POSTBACK_SECRET',
    updated_at = now()
WHERE slug = 'mooffers';
