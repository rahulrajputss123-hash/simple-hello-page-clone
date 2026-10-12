CREATE TABLE public.sdk_offerwall_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  logo_url text,
  tagline text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  platforms text[] NOT NULL DEFAULT '{android}'::text[],
  integration_type text NOT NULL DEFAULT 'placeholder',
  sdk_version text,
  app_id text,
  placement_id text,
  publisher_id text,
  extra_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  secret_refs jsonb NOT NULL DEFAULT '{}'::jsonb,
  currency_name text NOT NULL DEFAULT 'coins',
  currency_per_usd numeric NOT NULL DEFAULT 100,
  reward_multiplier numeric NOT NULL DEFAULT 1,
  min_reward numeric NOT NULL DEFAULT 0,
  max_reward numeric,
  rounding_mode text NOT NULL DEFAULT 'nearest',
  postback_path text,
  postback_auth_mode text NOT NULL DEFAULT 'none',
  postback_signature_secret_ref text,
  postback_ip_allowlist text[] NOT NULL DEFAULT '{}'::text[],
  transaction_id_param text NOT NULL DEFAULT 'transaction_id',
  user_id_param text NOT NULL DEFAULT 'sub_id',
  reward_param text NOT NULL DEFAULT 'amount',
  user_identity_mode text NOT NULL DEFAULT 'user_uuid',
  user_identity_salt_ref text,
  dedupe_strategy text NOT NULL DEFAULT 'transaction_id',
  dedupe_window_hours integer NOT NULL DEFAULT 720,
  status text NOT NULL DEFAULT 'draft',
  notes text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sdk_offerwall_providers_integration_type_check
    CHECK (integration_type IN ('placeholder','native_sdk','web_sdk','hybrid','api')),
  CONSTRAINT sdk_offerwall_providers_status_check
    CHECK (status IN ('draft','configured','testing','live','disabled')),
  CONSTRAINT sdk_offerwall_providers_rounding_check
    CHECK (rounding_mode IN ('floor','ceil','nearest')),
  CONSTRAINT sdk_offerwall_providers_identity_check
    CHECK (user_identity_mode IN ('user_uuid','hashed_uuid','referral_code','custom')),
  CONSTRAINT sdk_offerwall_providers_dedupe_check
    CHECK (dedupe_strategy IN ('transaction_id','transaction_id_and_user','payload_hash')),
  CONSTRAINT sdk_offerwall_providers_auth_mode_check
    CHECK (postback_auth_mode IN ('none','signature','ip_allowlist','signature_and_ip'))
);

CREATE INDEX sdk_offerwall_providers_order_idx
  ON public.sdk_offerwall_providers (enabled, display_order, name);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sdk_offerwall_providers TO authenticated;
GRANT ALL ON public.sdk_offerwall_providers TO service_role;
ALTER TABLE public.sdk_offerwall_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sdk providers admin all" ON public.sdk_offerwall_providers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER sdk_offerwall_providers_updated_at
  BEFORE UPDATE ON public.sdk_offerwall_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.sdk_offerwall_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.sdk_offerwall_providers(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  provider_transaction_id text NOT NULL,
  provider_user_ref text,
  provider_offer_id text,
  currency_amount numeric NOT NULL DEFAULT 0,
  reward_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  reject_reason text,
  signature_valid boolean,
  source_ip text,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  wallet_transaction_id uuid,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sdk_offerwall_conversions_status_check
    CHECK (status IN ('pending','credited','rejected','duplicate','reversed'))
);

CREATE UNIQUE INDEX sdk_offerwall_conversions_dedupe
  ON public.sdk_offerwall_conversions (provider_id, provider_transaction_id);
CREATE INDEX sdk_offerwall_conversions_user_idx
  ON public.sdk_offerwall_conversions (user_id, received_at DESC);

GRANT SELECT ON public.sdk_offerwall_conversions TO authenticated;
GRANT ALL ON public.sdk_offerwall_conversions TO service_role;
ALTER TABLE public.sdk_offerwall_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own sdk conversions" ON public.sdk_offerwall_conversions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER sdk_offerwall_conversions_updated_at
  BEFORE UPDATE ON public.sdk_offerwall_conversions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.sdk_offerwall_providers (slug, name, tagline, display_order, platforms, integration_type, status, postback_path) VALUES
('adgem', 'AdGem', 'Games & app installs', 1, '{android,ios}', 'placeholder', 'draft', '/api/public/sdk-offerwall/adgem'),
('offertoro', 'OfferToro', 'Surveys and sign-ups', 2, '{android,ios}', 'placeholder', 'draft', '/api/public/sdk-offerwall/offertoro'),
('digital-turbine', 'Digital Turbine', 'Premium partner offers', 3, '{android,ios}', 'placeholder', 'draft', '/api/public/sdk-offerwall/digital-turbine'),
('torox', 'Torox', 'Quick micro tasks', 4, '{android,ios}', 'placeholder', 'draft', '/api/public/sdk-offerwall/torox'),
('adscend', 'Adscend', 'Sign-up and trial offers', 5, '{android,ios}', 'placeholder', 'draft', '/api/public/sdk-offerwall/adscend'),
('pollfish', 'Pollfish', 'Paid survey panels', 6, '{android,ios}', 'placeholder', 'draft', '/api/public/sdk-offerwall/pollfish');