-- 1. Providers table
CREATE TABLE public.offer_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  provider_type text NOT NULL DEFAULT 'offerwall',
  enabled boolean NOT NULL DEFAULT false,
  sync_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  sync_status text NOT NULL DEFAULT 'idle',
  sync_error text,
  default_revenue_share numeric NOT NULL DEFAULT 0.6,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.offer_providers TO authenticated;
GRANT ALL ON public.offer_providers TO service_role;

ALTER TABLE public.offer_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "providers admin all" ON public.offer_providers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER offer_providers_updated_at
  BEFORE UPDATE ON public.offer_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Extend offers
ALTER TABLE public.offers
  ADD COLUMN source text NOT NULL DEFAULT 'manual',
  ADD COLUMN provider_id uuid REFERENCES public.offer_providers(id) ON DELETE SET NULL,
  ADD COLUMN external_offer_id text,
  ADD COLUMN click_url text,
  ADD COLUMN network_payout numeric,
  ADD COLUMN revenue_share numeric,
  ADD COLUMN countries text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN devices text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN expires_at timestamptz,
  ADD COLUMN last_seen_at timestamptz,
  ADD COLUMN admin_priority integer NOT NULL DEFAULT 0,
  ADD COLUMN raw_payload jsonb;

ALTER TABLE public.offers
  ADD CONSTRAINT offers_source_check CHECK (source IN ('manual','network')),
  ADD CONSTRAINT offers_network_identity_check CHECK (
    source = 'manual' OR (provider_id IS NOT NULL AND external_offer_id IS NOT NULL)
  );

-- 3. Uniqueness for imported provider offers
CREATE UNIQUE INDEX offers_provider_external_unique
  ON public.offers (provider_id, external_offer_id)
  WHERE provider_id IS NOT NULL AND external_offer_id IS NOT NULL;

CREATE INDEX offers_featured_rank_idx
  ON public.offers (is_active, is_featured, admin_priority DESC, sort_order);

-- 4. RLS: eligible active offers only
DROP POLICY IF EXISTS "offers readable" ON public.offers;

CREATE POLICY "offers eligible readable" ON public.offers
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (is_active = true AND (expires_at IS NULL OR expires_at > now()))
  );
