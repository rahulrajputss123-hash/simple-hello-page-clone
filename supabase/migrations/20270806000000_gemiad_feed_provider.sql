-- GemiAd Offer Feed provider
-- Separate from SDK offerwall (different placement, different secret).

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
  'gemiad',
  'GemiAd',
  'cpa',
  false, -- Enable after API key configured
  0.8, -- 80% to users
  jsonb_build_object(
    'placement_id', '',
    'api_key', '',
    'max_offers', 50,
    'weight', 1
  ),
  'idle'
)
ON CONFLICT (slug) DO NOTHING;
