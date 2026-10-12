-- =============================================================================
-- Storage bucket: offerwall-assets
-- Mirrors banner-assets bucket policy exactly, just with a different bucket name.
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('offerwall-assets', 'offerwall-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public read offerwall assets" ON storage.objects;
CREATE POLICY "public read offerwall assets" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'offerwall-assets');

DROP POLICY IF EXISTS "admins upload offerwall assets" ON storage.objects;
CREATE POLICY "admins upload offerwall assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'offerwall-assets'
    AND public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "admins update offerwall assets" ON storage.objects;
CREATE POLICY "admins update offerwall assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'offerwall-assets'
    AND public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "admins delete offerwall assets" ON storage.objects;
CREATE POLICY "admins delete offerwall assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'offerwall-assets'
    AND public.has_role(auth.uid(), 'admin')
  );
