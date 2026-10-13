-- Add "started" status to offer_claims for URL+proof workflow
-- A "started" claim means the user opened the URL but hasn't uploaded proof yet

-- Drop existing constraint if it exists and recreate with "started" included
ALTER TABLE public.offer_claims 
  DROP CONSTRAINT IF EXISTS offer_claims_status_check;

ALTER TABLE public.offer_claims
  ADD CONSTRAINT offer_claims_status_check 
  CHECK (status IN ('started', 'pending', 'approved', 'rejected'));

-- Update unique constraint to allow one active claim per user per offer
-- "started", "pending", and "approved" are mutually exclusive
-- A "rejected" claim can be replaced by a new attempt
DROP INDEX IF EXISTS offer_claims_user_offer_uniq;

CREATE UNIQUE INDEX offer_claims_user_offer_active_uniq
  ON public.offer_claims (user_id, offer_id)
  WHERE status IN ('started', 'pending', 'approved');

COMMENT ON INDEX offer_claims_user_offer_active_uniq IS 
  'Enforce one active claim per user per offer. Rejected claims can be retried.';

-- Migrate existing offers: set payout_mode to manual_proof if click_url is empty
UPDATE public.offers
SET payout_mode = 'manual_proof'
WHERE (click_url IS NULL OR click_url = '')
  AND payout_mode = 'manual'
  AND payout_mode != 'auto_postback';

COMMENT ON COLUMN public.offer_claims.status IS 
  'started: user opened URL but no proof yet | pending: awaiting admin review | approved: reward paid | rejected: claim denied';
