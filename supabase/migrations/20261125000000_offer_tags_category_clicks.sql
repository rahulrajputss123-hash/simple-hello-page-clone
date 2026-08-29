-- =============================================================================
-- Feature: Offer tags + category filter + lightweight click tracking
-- =============================================================================
-- All additive. Every existing offer keeps its current behaviour because:
--  * `tags` defaults to '{}' (renders no badges)
--  * `category` defaults to NULL (falls under "All Offers")
--  * `tags_manual` / `category_manual` default to false so the sync engine
--    keeps overwriting them until an admin sets one, at which point the
--    trigger below freezes the field.

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
CREATE OR REPLACE FUNCTION public.preserve_manual_offer_overrides()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.category_manual = true THEN
    NEW.category := OLD.category;
    NEW.category_manual := true;
  END IF;
  IF OLD.tags_manual = true THEN
    NEW.tags := OLD.tags;
    NEW.tags_manual := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS preserve_offer_admin_overrides ON public.offers;
CREATE TRIGGER preserve_offer_admin_overrides
  BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.preserve_manual_offer_overrides();

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
