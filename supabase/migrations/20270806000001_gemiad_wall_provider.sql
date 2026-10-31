-- GemiAd SDK Offerwall provider (web_sdk iframe/webview wall)
-- Separate from offer feed (different placement, different secret).

INSERT INTO public.sdk_offerwall_providers (
  slug,
  name,
  tagline,
  logo_url,
  enabled,
  display_order,
  platforms,
  integration_type,
  sdk_version,
  app_id,
  placement_id,
  publisher_id,
  extra_config,
  secret_refs,
  currency_name,
  currency_per_usd,
  reward_multiplier,
  min_reward,
  max_reward,
  rounding_mode,
  postback_path,
  postback_auth_mode,
  postback_signature_secret_ref,
  postback_ip_allowlist,
  transaction_id_param,
  user_id_param,
  reward_param,
  user_identity_mode,
  user_identity_salt_ref,
  dedupe_strategy,
  dedupe_window_hours,
  status,
  notes,
  metadata
)
VALUES (
  'gemiad',
  'GemiAd',
  'Complete offers and surveys',
  null, -- Admin can upload logo later
  false, -- Enable after placement_id configured
  900, -- Display order
  ARRAY['web', 'android', 'ios']::text[],
  'web_sdk',
  null, -- No SDK version
  '', -- app_id = placement_id (filled by admin)
  null, -- placement_id (filled by admin)
  null, -- No publisher_id
  '{}'::jsonb,
  jsonb_build_object('secret_key', 'GEMIAD_WALL_SECRET_KEY'),
  'coins',
  1, -- USD payout from API
  0.8, -- 80% to users
  0, -- Min reward
  null, -- No max reward
  'nearest',
  '/api/public/offerwall/gemiad',
  'signature_and_ip',
  'GEMIAD_WALL_SECRET_KEY',
  ARRAY['64.226.92.208']::text[], -- GemiAd postback IP
  'txid',
  'userId',
  'payout',
  'user_uuid',
  null, -- No salt needed
  'transaction_id',
  720, -- 30 days deduplication window
  'testing',
  'GemiAd web offerwall. Postback requires SHA256 signature: hash = sha256(userId + offerId + txid + secret). Source IP: 64.226.92.208. Must respond with HTTP 200 "Approved" within 5 seconds.',
  '{}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;
