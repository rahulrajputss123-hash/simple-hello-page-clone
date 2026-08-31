-- =============================================================================
-- (A) Fix infinite recursion in the offers SELECT RLS policy (Postgres 42P17)
-- =============================================================================
-- The previous "offers readable" policy sub-queried public.offers INSIDE the
-- offers policy itself (JOIN public.offers other ...). Evaluating the offers
-- policy therefore re-triggers the same policy -> infinite recursion, so every
-- client-side (anon/authenticated) read of `offers` returned HTTP 500 42P17.
--
-- Fix: move the "did the user already claim a sibling offer in this deal group?"
-- check into a SECURITY DEFINER function. SECURITY DEFINER runs with the owner's
-- rights and bypasses RLS, so the function can read offers/offer_claims without
-- re-entering the offers policy -> no recursion.

CREATE OR REPLACE FUNCTION public.user_has_sibling_deal_claim(_deal_group_id text, _offer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.offer_claims oc
    JOIN public.offers other ON other.id = oc.offer_id
    WHERE oc.user_id = auth.uid()
      AND other.deal_group_id = _deal_group_id
      AND oc.status <> 'rejected'
      AND other.id <> _offer_id
  );
$$;

REVOKE ALL ON FUNCTION public.user_has_sibling_deal_claim(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_has_sibling_deal_claim(text, uuid) TO authenticated, service_role;

-- Rebuild the SELECT policy without the self-referential sub-query.
DROP POLICY IF EXISTS "offers readable" ON public.offers;
CREATE POLICY "offers readable" ON public.offers
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (
      deal_group_id IS NULL
      OR NOT public.user_has_sibling_deal_claim(deal_group_id, id)
    )
  );

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
