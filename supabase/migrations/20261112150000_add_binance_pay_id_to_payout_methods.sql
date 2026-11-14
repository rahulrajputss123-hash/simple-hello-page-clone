-- Add binance_pay_id column to payout_methods table
ALTER TABLE public.payout_methods
ADD COLUMN binance_pay_id text;

-- Add comment to document the column
COMMENT ON COLUMN public.payout_methods.binance_pay_id IS 'Binance Pay ID for cryptocurrency payouts';
