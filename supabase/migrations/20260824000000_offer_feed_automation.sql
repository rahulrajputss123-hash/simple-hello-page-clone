-- Offer Feed Automation: geo-targeted, background-refreshed network offer cache.
-- Follows existing RLS conventions: read-only for authenticated users, writes via service role only.

-- 1. Per (network, country) cache of fetched offers.
CREATE TABLE public.offer_feed_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.offer_providers(id) ON DELETE CASCADE,
  country text NOT NULL,
  offers jsonb NOT NULL DEFAULT '[]'::jsonb,
  offer_count integer NOT NULL DEFAULT 0,
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now(),
  sync_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX offer_feed_cache_provider_country_uniq
  ON public.offer_feed_cache (provider_id, country);
CREATE INDEX offer_feed_cache_country_idx ON public.offer_feed_cache (country);
CREATE INDEX offer_feed_cache_expires_idx ON public.offer_feed_cache (expires_at);

GRANT SELECT ON public.offer_feed_cache TO authenticated;
GRANT ALL ON public.offer_feed_cache TO service_role;

ALTER TABLE public.offer_feed_cache ENABLE ROW LEVEL SECURITY;

-- Read-only for authenticated users (writes happen only through the service role, which bypasses RLS).
CREATE POLICY "offer feed cache readable" ON public.offer_feed_cache
  FOR SELECT TO authenticated
  USING (true);

CREATE TRIGGER offer_feed_cache_updated_at
  BEFORE UPDATE ON public.offer_feed_cache
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Singleton global settings row for feed automation.
CREATE TABLE public.offer_feed_settings (
  id boolean PRIMARY KEY DEFAULT true,
  refresh_interval_hours integer NOT NULL DEFAULT 5,
  default_country text NOT NULL DEFAULT 'US',
  fallback_behavior text NOT NULL DEFAULT 'default_country',
  featured_slots integer NOT NULL DEFAULT 3,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT offer_feed_settings_singleton CHECK (id),
  CONSTRAINT offer_feed_settings_fallback_check CHECK (fallback_behavior IN ('none','default_country')),
  CONSTRAINT offer_feed_settings_interval_check CHECK (refresh_interval_hours BETWEEN 1 AND 168),
  CONSTRAINT offer_feed_settings_slots_check CHECK (featured_slots BETWEEN 1 AND 24)
);

GRANT SELECT ON public.offer_feed_settings TO authenticated;
GRANT ALL ON public.offer_feed_settings TO service_role;

ALTER TABLE public.offer_feed_settings ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read settings; only admins may change them from the app,
-- and the service role (cron) bypasses RLS.
CREATE POLICY "feed settings readable" ON public.offer_feed_settings
  FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "feed settings admin write" ON public.offer_feed_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER offer_feed_settings_updated_at
  BEFORE UPDATE ON public.offer_feed_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the single settings row.
INSERT INTO public.offer_feed_settings (id) VALUES (true)
ON CONFLICT (id) DO NOTHING;
