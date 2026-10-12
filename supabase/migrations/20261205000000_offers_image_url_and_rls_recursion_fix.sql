-- =============================================================================
-- (A) Fix infinite recursion in the offers SELECT RLS policy (Postgres 42P17)
-- =============================================================================
-- Root cause: over successive migrations the `offers` table accumulated several
-- SELECT-applicable policies ("offers readable", "offers eligible readable",
-- "admins see all offers", and the FOR ALL "offers admin write"). At least one
-- still contained a sub-query on public.offers inside its own USING clause,
-- which re-triggers offers' RLS -> infinite recursion -> HTTP 500 42P17 for
-- every authenticated client read of `offers`.
--
-- Fix: drop ALL existing offers policies and replace them with a single, simple,
-- recursion-proof SELECT policy. Writes are performed only by server functions
-- using the service role (which bypasses RLS), so no authenticated write policy
-- is required. The limited-deal "one claim per deal_group" rule remains enforced
-- server-side in coinquest.server.ts (claim time) and visually in the Featured
-- Offers feed (feed-cache.server.ts).

DROP POLICY IF EXISTS "offers readable"          ON public.offers;
DROP POLICY IF EXISTS "offers eligible readable" ON public.offers;
DROP POLICY IF EXISTS "admins see all offers"    ON public.offers;
DROP POLICY IF EXISTS "offers admin write"       ON public.offers;

-- Helper an earlier iteration used inside the policy — no longer referenced.
DROP FUNCTION IF EXISTS public.user_has_sibling_deal_claim(text, uuid);

CREATE POLICY "offers readable" ON public.offers
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  );

-- =============================================================================
-- (B) Add a real `image_url` column instead of overloading `icon`
-- =============================================================================
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS image_url text NULL;

UPDATE public.offers
SET image_url = icon
WHERE image_url IS NULL
  AND icon ~* '^https?://';
