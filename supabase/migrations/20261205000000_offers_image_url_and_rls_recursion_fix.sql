-- =============================================================================
-- (A) Fix infinite recursion in the offers SELECT RLS policy (Postgres 42P17)
-- =============================================================================
-- The old "offers readable" policy sub-queried public.offers INSIDE its own
-- policy (JOIN public.offers other ...), which re-triggers the same policy ->
-- infinite recursion, so every logged-in client read of `offers` returned 500.
--
-- Fix: make the SELECT policy recursion-proof by NOT referencing offers at all.
-- The limited-deal "one claim per deal_group" rule is still enforced:
--   * at claim time, server-side, in coinquest.server.ts (the real integrity guard), and
--   * visually, in the server-side Featured Offers feed (feed-cache.server.ts),
-- so removing the sub-query from RLS changes no behaviour.

DROP POLICY IF EXISTS "offers readable" ON public.offers;
CREATE POLICY "offers readable" ON public.offers
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Remove the helper that an earlier iteration used inside the policy; the
-- sibling-hide no longer lives in RLS, so this function is unused.
DROP FUNCTION IF EXISTS public.user_has_sibling_deal_claim(text, uuid);

-- (Admin full-read policy "admins see all offers" is left intact.)

-- =============================================================================
-- (B) Add a real `image_url` column instead of overloading `icon`
-- =============================================================================
-- Network offers historically stored their banner image URL in `icon`, while
-- manual offers store a lucide icon keyword there. Give images a dedicated
-- column and backfill it from any icon value that is already an http(s) URL.

ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS image_url text NULL;

UPDATE public.offers
SET image_url = icon
WHERE image_url IS NULL
  AND icon ~* '^https?://';
