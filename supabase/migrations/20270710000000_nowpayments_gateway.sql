-- NOWPayments Gateway Support
-- Extends advertiser deposits to support crypto payments via NOWPayments.
-- Follows the same architecture as Razorpay: deposit creation, webhook crediting.

-- 1. Extend gateway enum to allow 'manual' and 'nowpayments' alongside 'razorpay'
ALTER TABLE advertiser_deposits DROP CONSTRAINT IF EXISTS advertiser_deposits_gateway_check;
ALTER TABLE advertiser_deposits ADD CONSTRAINT advertiser_deposits_gateway_check 
  CHECK (gateway IN ('razorpay', 'manual', 'nowpayments'));

-- 2. Update mkt_credit_deposit payment-id requirement to IN ('razorpay','nowpayments')
-- Production already has this change. We only update the CHECK inside the function body.
-- DO NOT rewrite the entire function body — only the gateway check line.
DO $$
BEGIN
  -- This is a placeholder for the actual change already applied in production.
  -- The CHECK was modified from:
  --   IF v_deposit.gateway = 'razorpay' AND (p_gateway_payment_id IS NULL OR p_gateway_payment_id = '') THEN
  -- To:
  --   IF v_deposit.gateway IN ('razorpay', 'nowpayments') AND (p_gateway_payment_id IS NULL OR p_gateway_payment_id = '') THEN
  -- 
  -- Since production has already been fixed, we do NOT recreate the function here.
  -- This migration only documents the constraint extension above.
  RAISE NOTICE 'mkt_credit_deposit payment-id check already updated in production to IN (razorpay, nowpayments)';
END
$$;

COMMENT ON CONSTRAINT advertiser_deposits_gateway_check ON advertiser_deposits IS 
  'Allows razorpay, manual, and nowpayments gateways. razorpay and nowpayments require webhook crediting via mkt_credit_deposit.';
