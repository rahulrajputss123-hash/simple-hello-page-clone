-- =============================================================================
-- Global payout methods
--
-- Widens payout_methods beyond UPI/PayPal/Bank so the app can support a global
-- audience, and snapshots the chosen method onto each withdrawal request so the
-- record survives the payout method later being edited or deleted.
--
-- Deliberately additive: the existing ifsc column is KEPT for backward
-- compatibility (old India-only rows keep their data) but is no longer required
-- by the form. account_number is reused for IBAN / international account number.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- payout_methods
-- ---------------------------------------------------------------------------
ALTER TABLE public.payout_methods
  -- SWIFT / BIC, the international equivalent of the India-only IFSC.
  ADD COLUMN IF NOT EXISTS country_bank_code text,
  -- Crypto payout address (Bitcoin today).
  ADD COLUMN IF NOT EXISTS wallet_address text,
  -- Where a gift-card code should be delivered.
  ADD COLUMN IF NOT EXISTS gift_card_recipient_email text,
  -- PayPal payouts are addressed by email, which has no existing column.
  ADD COLUMN IF NOT EXISTS paypal_email text,
  -- Required by the global bank-transfer form; no existing columns for these.
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS country text;

COMMENT ON COLUMN public.payout_methods.country_bank_code IS
  'SWIFT/BIC code for international bank transfers. Replaces the India-only ifsc column, which is kept only for backward compatibility.';
COMMENT ON COLUMN public.payout_methods.ifsc IS
  'DEPRECATED (India-only). Retained for existing rows; new bank methods use country_bank_code (SWIFT/BIC).';
COMMENT ON COLUMN public.payout_methods.account_number IS
  'Bank account number or IBAN.';

-- No CHECK constraint existed on method_type, so add one now that the set of
-- supported types is fixed. Ethereum is included because it is a recognised
-- (coming-soon) type, even though the UI does not yet let users store one.
-- Guarded so re-running the migration is safe.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payout_methods_method_type_check'
      AND conrelid = 'public.payout_methods'::regclass
  ) THEN
    ALTER TABLE public.payout_methods
      ADD CONSTRAINT payout_methods_method_type_check
      CHECK (method_type IN (
        'upi',
        'paypal',
        'bank',
        'amazon_gift_card',
        'google_play_gift_card',
        'bitcoin',
        'ethereum'
      ));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- withdrawal_requests
-- ---------------------------------------------------------------------------
ALTER TABLE public.withdrawal_requests
  -- Snapshot of the method type at request time.
  ADD COLUMN IF NOT EXISTS method_type text,
  -- Masked-safe payout details at request time, for audit / admin display.
  ADD COLUMN IF NOT EXISTS payout_details_snapshot jsonb,
  -- Admin-entered fulfilment reference once the payout is actually sent.
  -- NOTE: text, unlike wallet_transactions.reference_id which is a uuid FK-ish
  -- pointer. This one holds an external provider/gift-card reference.
  ADD COLUMN IF NOT EXISTS reference_id text;

COMMENT ON COLUMN public.withdrawal_requests.method_type IS
  'Snapshot of payout_methods.method_type at request time, so the request survives the method being edited or deleted.';
COMMENT ON COLUMN public.withdrawal_requests.payout_details_snapshot IS
  'Masked-safe payout details captured at request time for audit and admin display. Never store full secrets here.';
COMMENT ON COLUMN public.withdrawal_requests.reference_id IS
  'Admin-entered external fulfilment reference (payout transaction id, gift-card order id, BTC txid).';

-- Backfill existing rows from their payout method before enforcing NOT NULL.
-- payout_method_id is ON DELETE SET NULL, so rows whose method was deleted
-- cannot be inferred and are marked 'unknown' rather than guessed.
UPDATE public.withdrawal_requests w
SET method_type = COALESCE(pm.method_type, 'unknown')
FROM public.payout_methods pm
WHERE w.payout_method_id = pm.id
  AND w.method_type IS NULL;

UPDATE public.withdrawal_requests
SET method_type = 'unknown'
WHERE method_type IS NULL;

ALTER TABLE public.withdrawal_requests
  ALTER COLUMN method_type SET NOT NULL;

-- Deliberately no CHECK on withdrawal_requests.method_type: legacy rows may be
-- 'unknown', and this column is a historical snapshot rather than live config.

CREATE INDEX IF NOT EXISTS withdrawal_requests_method_type_idx
  ON public.withdrawal_requests (method_type);

-- ---------------------------------------------------------------------------
-- RLS — reassert the existing own-rows-only policies.
--
-- RLS is row-level, so the new columns are already covered by these policies and
-- cannot leak across users. Recreated idempotently so the guarantee holds
-- regardless of which migrations have run.
-- ---------------------------------------------------------------------------
ALTER TABLE public.payout_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own payout methods" ON public.payout_methods;
CREATE POLICY "own payout methods" ON public.payout_methods
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own withdrawals" ON public.withdrawal_requests;
CREATE POLICY "own withdrawals" ON public.withdrawal_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Writes stay service-role only (unchanged): authenticated keeps SELECT on
-- withdrawal_requests, so users can never insert or mutate a payout request
-- directly.
GRANT SELECT ON public.withdrawal_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payout_methods TO authenticated;
