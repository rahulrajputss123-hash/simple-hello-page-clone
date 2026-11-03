-- Torox SDK Offerwall provider (web_sdk iframe/webview wall)
-- S2S authentication: server POSTs to Torox session endpoint to get per-player wall URL.
-- Postback signature: md5(oid + "-" + user_id + "-" + secret)

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
  'torox',
  'Torox',
  'Games, apps and tasks with clear progress',
  null, -- Admin can upload logo later
  false, -- Enable after app_id (placement_id) configured
  910, -- Display order (after GemiAd at 900)
  ARRAY['web', 'android', 'ios']::text[],
  'web_sdk',
  null, -- No SDK version
  '', -- app_id = wall placement_id (filled by admin)
  null, -- placement_id (not used, app_id holds the placement)
  null, -- No publisher_id
  '{}'::jsonb,
  jsonb_build_object('secret_key', 'TOROX_WALL_TOKEN'),
  'coins',
  1, -- USD payout from API
  0.8, -- 80% to users
  0, -- Min reward
  null, -- No max reward
  'nearest',
  '/api/public/offerwall/torox',
  'ip_allowlist', -- IP check only (signature verified in adapter)
  'TOROX_WALL_TOKEN', -- Secret ref for signature verification
  ARRAY['44.212.211.226']::text[], -- Torox postback IP
  'id',
  'user_id',
  'payout',
  'user_uuid',
  null, -- No salt needed
  'transaction_id',
  720, -- 30 days deduplication window
  'testing',
  'Torox web offerwall. Wall URL: server must POST to {BASE}/partner/session with placement_id and token to get per-player wall_url. Postback signature: md5(oid + "-" + user_id + "-" + secret). Source IP: 44.212.211.226. Must respond with "1" for success, "0" for failure.',
  '{}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;
