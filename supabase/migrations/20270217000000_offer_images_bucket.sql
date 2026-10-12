-- =============================================================================
-- Public "offer-images" bucket for network offer artwork
-- =============================================================================
-- Some partners (Affike, ~11% of their catalogue) send offer artwork as a base64
-- data: URI rather than a URL. Those used to be discarded outright, so those
-- offers rendered with the generic fallback icon.
--
-- They are now decoded and uploaded here during sync, and only the resulting
-- public URL is stored in offers.image_url — the offers table never holds an
-- inline base64 blob.
--
-- Public read, mirroring banner-assets / offerwall-assets: these are partner
-- creatives shown on the offer wall, nothing sensitive. Writes are server-only
-- via the service role during sync, so no authenticated-user INSERT policy is
-- granted here (unlike banner-assets, which admins upload to from the browser).
-- -----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('offer-images', 'offer-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public read offer images" ON storage.objects;
CREATE POLICY "public read offer images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'offer-images');

-- Path convention: offer-images/{providerSlug}/{externalOfferId}-{hash}.{ext}
-- The content hash means an unchanged image resolves to the same path, so a
-- re-sync overwrites in place rather than accumulating duplicates.
