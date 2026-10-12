-- =============================================================================
-- Storage bucket: task-assets
-- Mirrors the offerwall-assets bucket policy exactly, just with a different
-- bucket name: public read, admin-only write/update/delete.
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('task-assets', 'task-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public read task assets" ON storage.objects;
CREATE POLICY "public read task assets" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'task-assets');

DROP POLICY IF EXISTS "admins upload task assets" ON storage.objects;
CREATE POLICY "admins upload task assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'task-assets'
    AND public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "admins update task assets" ON storage.objects;
CREATE POLICY "admins update task assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'task-assets'
    AND public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "admins delete task assets" ON storage.objects;
CREATE POLICY "admins delete task assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'task-assets'
    AND public.has_role(auth.uid(), 'admin')
  );
