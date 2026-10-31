-- TheoremReach: new web_sdk offerwall provider
--
-- Integration type: web_sdk with server-signed launch URLs (like offerwallme).
-- Launch URL is built server-side and includes a hash signature to prevent
-- tampering. The hash is base64-encoded HMAC-SHA1.
--
-- No secret VALUE is stored here. postback_signature_secret_ref holds the NAME
-- of an environment variable; the adapter reads it with process.env[thatName]
-- at request time. THEOREMREACH_SECRET_KEY must be set in the deployment env.
--
-- Money model:
--   * `currency` from TheoremReach postback is already USD-denominated, so
--     currency_per_usd = 1 keeps convertSdkCurrency's division a no-op.
--   * reward_multiplier = 0.8 gives the user their 80% share; we keep 20%.
--
-- Auth model:
--   postback_auth_mode = 'signature' — the adapter verifies the hash parameter
--   using TheoremReach's specific formula (HMAC-SHA1 over the full callback URL).
--
-- Configuration:
--   * app_id: TheoremReach API key (filled by admin later)
--   * placement_id: partner_id (filled by admin later)
--   * platforms: {web, android, ios} - TheoremReach supports all platforms
--
-- status = 'testing' deliberately: flip to 'live' once a real postback has been
-- confirmed end to end.

INSERT INTO public.sdk_offerwall_providers (
  slug,
  name,
  tagline,
  enabled,
  display_order,
  platforms,
  integration_type,
  app_id,
  placement_id,
  currency_name,
  currency_per_usd,
  reward_multiplier,
  min_reward,
  max_reward,
  rounding_mode,
  postback_path,
  postback_auth_mode,
  postback_signature_secret_ref,
  transaction_id_param,
  user_id_param,
  reward_param,
  user_identity_mode,
  dedupe_strategy,
  dedupe_window_hours,
  status
) VALUES (
  'theoremreach',
  'TheoremReach',
  'Quick surveys & rewards',
  true,
  0,
  '{web,android,ios}',
  'web_sdk',
  NULL, -- API key to be filled by admin
  NULL, -- partner_id to be filled by admin
  'coins',
  1,
  0.8,
  0,
  NULL,
  'nearest',
  '/api/public/offerwall/theoremreach',
  'signature',
  'THEOREMREACH_SECRET_KEY',
  'transaction_id',
  'external_id',
  'currency',
  'user_uuid',
  'transaction_id',
  720,
  'testing'
)
-- Idempotent: re-running must not duplicate the row, and must not silently
-- leave stale money/auth config behind if the values above change.
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  enabled = EXCLUDED.enabled,
  integration_type = EXCLUDED.integration_type,
  currency_per_usd = EXCLUDED.currency_per_usd,
  reward_multiplier = EXCLUDED.reward_multiplier,
  postback_path = EXCLUDED.postback_path,
  postback_auth_mode = EXCLUDED.postback_auth_mode,
  postback_signature_secret_ref = EXCLUDED.postback_signature_secret_ref,
  transaction_id_param = EXCLUDED.transaction_id_param,
  user_id_param = EXCLUDED.user_id_param,
  reward_param = EXCLUDED.reward_param,
  status = EXCLUDED.status,
  updated_at = now();
