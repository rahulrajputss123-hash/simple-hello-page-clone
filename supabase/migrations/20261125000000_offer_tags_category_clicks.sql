-- =============================================================================
-- Feature: Offer tags + category filter + lightweight click tracking
-- =============================================================================
-- All additive. Every existing offer keeps its current behaviour because:
--  * `tags` defaults to '{}' (renders no badges)
--  * `category` defaults to NULL (falls under "All Offers")
--  * `tags_manual` / `category_manual` default to false so the network sync
--    engine keeps refreshing them until an admin sets one, at which point
--    the sync engine (`src/lib/offers/sync.server.ts` — `syncProviderImpl`)
--    strips those columns from its upsert payload for that offer. Admin
--    edits therefore stick, but the admin can still change them again at
--    any time — only the sync path is restricted.

ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS category         text,
  ADD COLUMN IF NOT EXISTS category_manual  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tags             text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags_manual      boolean NOT NULL DEFAULT false;

-- Optional check (permissive: null OK, only enforce known values when present).
ALTER TABLE public.offers DROP CONSTRAINT IF EXISTS offers_category_check;
ALTER TABLE public.offers
  ADD CONSTRAINT offers_category_check
  CHECK (
    category IS NULL
    OR category IN ('App Install','Trial','Deals','Survey','Games','Link Locker','Shortlink')
  );

-- ---------- Preserve admin-set category / tags across network re-syncs ------
-- NOTE: An earlier version of this migration installed a BEFORE UPDATE trigger
-- (`preserve_offer_admin_overrides` / `preserve_manual_offer_overrides()`) to
-- freeze admin edits. That approach was WRONG — a row-level trigger cannot
-- distinguish a legitimate admin re-edit from a network sync overwrite, so
-- it locked admins out of ever changing category/tags again after their
-- first save.
--
-- The protection now lives in the sync engine itself (see
-- `src/lib/offers/sync.server.ts` — `syncProviderImpl` strips `category`
-- and `tags` from the upsert payload when the corresponding *_manual flag
-- is already true), which is the same safe pattern already used for
-- `payout_mode` (which is simply never written by sync).
--
-- These DROPs ensure any pre-existing installation of the trigger/function
-- is removed cleanly.
DROP TRIGGER IF EXISTS preserve_offer_admin_overrides ON public.offers;
DROP FUNCTION IF EXISTS public.preserve_manual_offer_overrides();

-- ---------------------------- Click tracking --------------------------------
CREATE TABLE IF NOT EXISTS public.offer_click_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS offer_click_events_offer_created_idx
  ON public.offer_click_events (offer_id, created_at DESC);

ALTER TABLE public.offer_click_events ENABLE ROW LEVEL SECURITY;
GRANT INSERT ON public.offer_click_events TO authenticated;
GRANT SELECT ON public.offer_click_events TO service_role;

DROP POLICY IF EXISTS "authenticated inserts click events" ON public.offer_click_events;
CREATE POLICY "authenticated inserts click events" ON public.offer_click_events
  FOR INSERT TO authenticated
  WITH CHECK (true);
