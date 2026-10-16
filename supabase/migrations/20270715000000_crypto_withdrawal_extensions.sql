-- =============================================================================
-- Crypto withdrawal extensions
--
-- Extends payout_methods and withdrawal_requests to support crypto payouts with
-- per-method minimum withdrawal amounts, network fees, transaction hashes, and
-- the new crypto method types (USDT TRC20/BEP20, Litecoin).
--
-- Network fees are flat USD amounts deducted from the withdrawal and shown to
-- the user before they confirm. Transaction hashes are required when settling
-- crypto withdrawals as 'approved'.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- payout_methods: add crypto method types and per-method config
-- ---------------------------------------------------------------------------

-- Add new crypto types to the CHECK constraint
ALTER TABLE public.payout_methods
  DROP CONSTRAINT IF EXISTS payout_methods_method_type_check;

ALTER TABLE public.payout_methods
  ADD CONSTRAINT payout_methods_method_type_check
  CHECK (method_type IN (
    'upi',
    'paypal',
    'bank',
    'amazon_gift_card',
    'google_play_gift_card',
    'bitcoin',
    'ethereum',
    'usdt_trc20',
    'usdt_bep20',
    'litecoin'
  ));

-- Add per-method configuration columns
-- Note: These are NOT stored per user payout method, but are derived from the
-- catalog in payout-methods.ts. We keep them on the table for future flexibility
-- (e.g., custom minimums for certain users).
ALTER TABLE public.payout_methods
  ADD COLUMN IF NOT EXISTS min_withdrawal_usd numeric(12,2),
  ADD COLUMN IF NOT EXISTS network_fee_usd numeric(12,2);

COMMENT ON COLUMN public.payout_methods.min_withdrawal_usd IS
  'Minimum withdrawal amount in USD for this payout method (currently derived from catalog, not user-editable).';
COMMENT ON COLUMN public.payout_methods.network_fee_usd IS
  'Flat network fee in USD for crypto withdrawals (currently derived from catalog, not user-editable).';

-- ---------------------------------------------------------------------------
-- withdrawal_requests: add network_fee and transaction_hash
-- ---------------------------------------------------------------------------

ALTER TABLE public.withdrawal_requests
  ADD COLUMN IF NOT EXISTS network_fee numeric(12,2),
  ADD COLUMN IF NOT EXISTS transaction_hash text;

COMMENT ON COLUMN public.withdrawal_requests.network_fee IS
  'Flat network fee in USD deducted from the withdrawal amount (crypto only). Shown to user before confirm and stored for audit.';
COMMENT ON COLUMN public.withdrawal_requests.transaction_hash IS
  'Transaction hash/txid for crypto withdrawals, required when settling as approved. Used to generate block explorer links.';

-- Index for looking up withdrawals by transaction hash (admin search, duplicate detection)
CREATE INDEX IF NOT EXISTS withdrawal_requests_transaction_hash_idx
  ON public.withdrawal_requests (transaction_hash)
  WHERE transaction_hash IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Comments for clarity
-- ---------------------------------------------------------------------------

COMMENT ON TABLE public.payout_methods IS
  'User-saved payout methods (UPI, PayPal, bank, gift cards, crypto wallets). Each method is validated before storage. Crypto addresses are validated server-side with per-network rules.';

COMMENT ON TABLE public.withdrawal_requests IS
  'Publisher withdrawal requests. Flow: pending (funds held) → admin review → approved (funds released, user notified) or rejected (hold released). Crypto withdrawals require transaction_hash when approved.';
