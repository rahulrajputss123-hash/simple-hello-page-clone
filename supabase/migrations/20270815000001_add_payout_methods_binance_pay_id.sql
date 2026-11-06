-- Migration: Add binance_pay_id column to payout_methods table
--
-- Issue: payout_methods table is missing binance_pay_id column for Binance Pay withdrawals
--
-- Safe to run: Adding a nullable column is non-breaking. Existing rows will have NULL.

-- Add binance_pay_id column
ALTER TABLE public.payout_methods 
  ADD COLUMN IF NOT EXISTS binance_pay_id text;

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_payout_methods_binance_pay_id 
  ON public.payout_methods(binance_pay_id) 
  WHERE binance_pay_id IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.payout_methods.binance_pay_id IS
  'Binance Pay ID for Binance Pay withdrawal method. Stores the user''s Binance Pay identifier.';
