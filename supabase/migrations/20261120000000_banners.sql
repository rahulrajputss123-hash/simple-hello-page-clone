-- =============================================================================
-- Feature: Banner System (custom + scheduled DB banners; smart banners are
-- evaluated live in code and NOT stored here)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL CHECK (section IN ('home', 'offers', 'tasks', 'offerwall')),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  cta_label text,
  cta_kind text NOT NULL DEFAULT 'none' CHECK (
    cta_kind IN ('none','offers','tasks','offerwall','offer','offerwall_provider','url')
  ),
  cta_target text,                     -- offer.id / provider.id / url when cta_kind requires it
  priority integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,               -- inclusive (UTC); null = no lower bound
  ends_at   timestamptz,               -- exclusive (UTC); null = no upper bound
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS banners_section_active_idx
  ON public.banners (section, is_active, priority DESC);

GRANT SELECT ON public.banners TO authenticated;
GRANT ALL    ON public.banners TO service_role;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "eligible banners readable" ON public.banners;
CREATE POLICY "eligible banners readable" ON public.banners
  FOR SELECT TO authenticated
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at   IS NULL OR ends_at   >  now())
  );

DROP POLICY IF EXISTS "admins manage banners" ON public.banners;
CREATE POLICY "admins manage banners" ON public.banners
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS banners_updated_at ON public.banners;
CREATE TRIGGER banners_updated_at BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------- Storage bucket --------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('banner-assets', 'banner-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public read banner assets" ON storage.objects;
CREATE POLICY "public read banner assets" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'banner-assets');

DROP POLICY IF EXISTS "admins upload banner assets" ON storage.objects;
CREATE POLICY "admins upload banner assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'banner-assets'
    AND public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "admins update banner assets" ON storage.objects;
CREATE POLICY "admins update banner assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'banner-assets'
    AND public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "admins delete banner assets" ON storage.objects;
CREATE POLICY "admins delete banner assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'banner-assets'
    AND public.has_role(auth.uid(), 'admin')
  );
