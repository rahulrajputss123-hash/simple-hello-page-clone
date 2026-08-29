-- =============================================================================
-- Cleanup: drop the buggy `preserve_offer_admin_overrides` trigger + its
-- backing function `preserve_manual_offer_overrides()` if they still exist
-- from an earlier install of the `20261125000000_offer_tags_category_clicks`
-- migration.
--
-- Why: a row-level trigger cannot distinguish a legitimate admin re-edit
-- from a network sync overwrite, so it locked admins out of ever changing
-- category/tags again after their first save.
--
-- The equivalent protection now lives in the sync engine
-- (`src/lib/offers/sync.server.ts` — `syncProviderImpl` strips `category` /
-- `tags` from the upsert payload for offers whose *_manual flag is true).
-- This is idempotent and safe to run on databases that never had the
-- trigger installed.
-- =============================================================================

DROP TRIGGER IF EXISTS preserve_offer_admin_overrides ON public.offers;
DROP FUNCTION IF EXISTS public.preserve_manual_offer_overrides();
