-- Torox Offer Feed provider
-- CPA network using Partner API (separate from any SDK offerwall).

INSERT INTO public.offer_providers (
  slug,
  name,
  provider_type,
  enabled,
  default_revenue_share,
  sync_config,
  sync_status
)
VALUES (
  'torox',
  'Torox',
  'cpa',
  false, -- Enable after TOROX_FEED_SOURCE_ID and TOROX_FEED_TOKEN configured
  0.8, -- 80% to users
  jsonb_build_object(
    'max_offers', 50,
    'weight', 1
  ),
  'idle'
)
ON CONFLICT (slug) DO NOTHING;
