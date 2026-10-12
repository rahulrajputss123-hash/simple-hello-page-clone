-- =============================================================================
-- Feature: Proof-of-completion + Limited Deals + Per-offer Payout Mode
-- =============================================================================
-- All additive; every existing offer keeps behaving identically because new
-- flags default to their current-behaviour values (is_limited_deal=false,
-- payout_mode='manual').

-- ------------------------------ (1) PROOF URL --------------------------------
ALTER TABLE public.offer_claims
  ADD COLUMN IF NOT EXISTS proof_url text;

-- Private storage bucket for user-uploaded proof screenshots / receipts.
INSERT INTO storage.buckets (id, name, public)
VALUES ('offer-proofs', 'offer-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Path convention: offer-proofs/{userId}/{claimId or timestamp}/{filename}
-- Users may read/write ONLY under their own uid folder; service_role reads all.
DROP POLICY IF EXISTS "user reads own proof" ON storage.objects;
CREATE POLICY "user reads own proof" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'offer-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "user uploads own proof" ON storage.objects;
CREATE POLICY "user uploads own proof" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'offer-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "admin reads all proof" ON storage.objects;
CREATE POLICY "admin reads all proof" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'offer-proofs'
    AND public.has_role(auth.uid(), 'admin')
  );

-- --------------------------- (2) LIMITED DEAL --------------------------------
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS is_limited_deal   boolean       NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deal_group_id     text          NULL,
  ADD COLUMN IF NOT EXISTS actual_cost       numeric(12,2) NULL,
  ADD COLUMN IF NOT EXISTS payout_percentage numeric(6,2)  NOT NULL DEFAULT 110,
  ADD COLUMN IF NOT EXISTS max_payout_cap    numeric(12,2) NULL;

CREATE INDEX IF NOT EXISTS offers_deal_group_idx
  ON public.offers (deal_group_id)
  WHERE deal_group_id IS NOT NULL;

-- --------------------------- (3) PAYOUT MODE ---------------------------------
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS payout_mode text NOT NULL DEFAULT 'manual';

-- Named check constraint so it can be replaced safely on re-run.
ALTER TABLE public.offers DROP CONSTRAINT IF EXISTS offers_payout_mode_check;
ALTER TABLE public.offers
  ADD CONSTRAINT offers_payout_mode_check
  CHECK (payout_mode IN ('manual', 'manual_proof', 'auto_postback'));

-- Per-offer postback secret env-var reference (offers with payout_mode='auto_postback'
-- read process.env[postback_secret_ref] server-side to verify HMAC signatures).
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS postback_secret_ref text NULL,
  ADD COLUMN IF NOT EXISTS postback_ip_allowlist text[] NOT NULL DEFAULT '{}';

-- Dedup key for offer postbacks so a re-fire never double-credits.
ALTER TABLE public.offer_claims
  ADD COLUMN IF NOT EXISTS postback_txn_id text NULL;

CREATE UNIQUE INDEX IF NOT EXISTS offer_claims_postback_txn_uniq
  ON public.offer_claims (offer_id, postback_txn_id)
  WHERE postback_txn_id IS NOT NULL;

-- --------------------- (2b) RLS: hide locked deal-group offers ---------------
-- The client queries `offers` directly under RLS, so this filter MUST live in
-- the SELECT policy itself, not in application code. Once a user holds a
-- non-rejected claim on any offer sharing a deal_group_id, all sibling offers
-- in that group disappear for them.
DROP POLICY IF EXISTS "offers readable" ON public.offers;
CREATE POLICY "offers readable" ON public.offers
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND (
      deal_group_id IS NULL
      OR NOT EXISTS (
        SELECT 1
        FROM public.offer_claims oc
        JOIN public.offers other ON other.id = oc.offer_id
        WHERE oc.user_id = auth.uid()
          AND other.deal_group_id = offers.deal_group_id
          AND oc.status <> 'rejected'
          AND other.id <> offers.id
      )
    )
  );

-- Preserve admin's ability to see everything.
DROP POLICY IF EXISTS "admins see all offers" ON public.offers;
CREATE POLICY "admins see all offers" ON public.offers
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
