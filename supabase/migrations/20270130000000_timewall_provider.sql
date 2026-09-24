-- TimeWall: new web_sdk offerwall provider
--
-- Unlike the five providers configured in
-- 20270115000000_sdk_offerwall_postback_adapters.sql, TimeWall has no existing
-- row, so this inserts and configures it in one statement. Column values match
-- the live web_sdk rows (affike / mooffers): currency_name 'coins',
-- min_reward 0, rounding 'nearest', dedupe by transaction_id over 720h,
-- user_identity_mode 'user_uuid', platforms {android}.
--
-- No secret VALUE is stored here. postback_signature_secret_ref holds the NAME
-- of an environment variable; the adapter reads it with process.env[thatName]
-- at request time. TIMEWALL_SECRET_KEY must be set in the deployment env.
--
-- Money model:
--   * `revenue` from TimeWall is already USD-denominated (NOT the dashboard
--     "Coins"), so currency_per_usd = 1 keeps convertSdkCurrency's division a
--     no-op.
--   * reward_multiplier = 0.8 gives the user their 80% share; we keep 20%.
--
-- Auth model:
--   postback_auth_mode = 'ip_allowlist' — the generic verifyCaller() checks the
--   source IP against TimeWall's three postback IPs. The hash itself is verified
--   inside the adapter, because TimeWall signs
--   sha256(userID || revenue || secretKey) rather than the generic
--   HMAC-over-raw-body scheme verifyCaller() computes.
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
  currency_name,
  currency_per_usd,
  reward_multiplier,
  min_reward,
  max_reward,
  rounding_mode,
  postback_auth_mode,
  postback_signature_secret_ref,
  postback_ip_allowlist,
  transaction_id_param,
  user_id_param,
  reward_param,
  user_identity_mode,
  dedupe_strategy,
  dedupe_window_hours,
  status
) VALUES (
  'timewall',
  'TimeWall',
  'Watch, play & earn',
  true,
  0,
  '{android}',
  'web_sdk',
  'b6537df755dd96d2',
  'coins',
  1,
  0.8,
  0,
  NULL,
  'nearest',
  'ip_allowlist',
  'TIMEWALL_SECRET_KEY',
  ARRAY['18.156.132.55', '51.81.120.73', '142.111.248.18'],
  'txid',
  'userid',
  'revenue',
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
  app_id = EXCLUDED.app_id,
  currency_per_usd = EXCLUDED.currency_per_usd,
  reward_multiplier = EXCLUDED.reward_multiplier,
  postback_auth_mode = EXCLUDED.postback_auth_mode,
  postback_signature_secret_ref = EXCLUDED.postback_signature_secret_ref,
  postback_ip_allowlist = EXCLUDED.postback_ip_allowlist,
  transaction_id_param = EXCLUDED.transaction_id_param,
  user_id_param = EXCLUDED.user_id_param,
  reward_param = EXCLUDED.reward_param,
  status = EXCLUDED.status,
  updated_at = now();
