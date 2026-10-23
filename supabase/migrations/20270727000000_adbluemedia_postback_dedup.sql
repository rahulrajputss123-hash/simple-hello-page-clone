-- Migration: AdBlueMedia postback deduplication
-- Add unique constraint for AdBlueMedia postbacks using (provider_slug, external_lead_id)

-- Add column to store the provider slug for easier deduplication
ALTER TABLE public.offer_claims
  ADD COLUMN IF NOT EXISTS provider_slug text NULL;

-- Add column to store external lead ID from AdBlueMedia (and other networks in future)
ALTER TABLE public.offer_claims
  ADD COLUMN IF NOT EXISTS external_lead_id text NULL;

-- Create unique index to prevent duplicate credits for the same lead_id from the same provider
-- This is separate from postback_txn_id which is used for per-offer postback dedup
CREATE UNIQUE INDEX IF NOT EXISTS offer_claims_provider_lead_uniq
  ON public.offer_claims (provider_slug, external_lead_id)
  WHERE provider_slug IS NOT NULL AND external_lead_id IS NOT NULL;

COMMENT ON COLUMN public.offer_claims.provider_slug IS 'Provider slug (e.g., adbluemedia, ogads) for postback deduplication';
COMMENT ON COLUMN public.offer_claims.external_lead_id IS 'External lead/transaction ID from the provider for deduplication (AdBlueMedia lead_id, etc)';
