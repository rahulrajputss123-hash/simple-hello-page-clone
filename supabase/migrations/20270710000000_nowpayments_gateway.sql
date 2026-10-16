-- NOWPayments Gateway Support
-- Extends advertiser deposits to support crypto payments via NOWPayments.
-- Follows the same architecture as Razorpay: deposit creation, webhook crediting.

-- 1. Extend gateway enum to allow 'nowpayments'
ALTER TABLE advertiser_deposits DROP CONSTRAINT IF EXISTS advertiser_deposits_gateway_check;
ALTER TABLE advertiser_deposits ADD CONSTRAINT advertiser_deposits_gateway_check 
  CHECK (gateway IN ('razorpay', 'nowpayments'));

-- 2. Update mkt_credit_deposit to require non-empty p_gateway_payment_id for nowpayments
CREATE OR REPLACE FUNCTION mkt_credit_deposit(
  p_deposit_id uuid,
  p_gateway_payment_id text,
  p_event jsonb DEFAULT NULL,
  p_confirmed_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_deposit advertiser_deposits;
  v_account advertiser_accounts;
  v_bonus_amount numeric;
  v_first_deposit_bonus_percent numeric;
  v_referral_bonus_split_percent numeric;
  v_referrer_id uuid;
  v_already_credited boolean;
BEGIN
  -- Fetch deposit with row lock
  SELECT * INTO v_deposit FROM advertiser_deposits WHERE id = p_deposit_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('credited', false, 'reason', 'deposit_not_found');
  END IF;

  -- Require non-empty gateway_payment_id for razorpay and nowpayments
  IF v_deposit.gateway IN ('razorpay', 'nowpayments') AND (p_gateway_payment_id IS NULL OR p_gateway_payment_id = '') THEN
    RETURN jsonb_build_object('credited', false, 'reason', 'missing_payment_id');
  END IF;

  -- Check if already credited (idempotent)
  v_already_credited := v_deposit.status = 'completed';
  IF v_already_credited THEN
    RETURN jsonb_build_object('credited', false, 'reason', 'already_credited');
  END IF;

  -- Only credit from 'pending' or 'created'
  IF v_deposit.status NOT IN ('pending', 'created') THEN
    RETURN jsonb_build_object('credited', false, 'reason', 'wrong_status', 'status', v_deposit.status);
  END IF;

  -- Get advertiser account
  SELECT * INTO v_account FROM advertiser_accounts WHERE user_id = v_deposit.advertiser_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('credited', false, 'reason', 'account_not_found');
  END IF;

  -- Calculate first-deposit bonus if applicable
  v_bonus_amount := 0;
  IF v_deposit.is_first_deposit THEN
    SELECT first_deposit_bonus_percent, referral_bonus_split_percent 
    INTO v_first_deposit_bonus_percent, v_referral_bonus_split_percent
    FROM marketplace_settings LIMIT 1;

    -- Check for referrer
    SELECT referrer_id INTO v_referrer_id FROM referrals WHERE referred_id = v_deposit.advertiser_id;

    -- Apply bonus (reduced by referral split if they have a referrer)
    IF v_referrer_id IS NOT NULL THEN
      v_bonus_amount := v_deposit.amount_usd * (v_first_deposit_bonus_percent - v_referral_bonus_split_percent) / 100;
    ELSE
      v_bonus_amount := v_deposit.amount_usd * v_first_deposit_bonus_percent / 100;
    END IF;
  END IF;

  -- Update deposit status
  UPDATE advertiser_deposits
  SET 
    status = 'completed',
    gateway_payment_id = p_gateway_payment_id,
    last_event = p_event,
    confirmed_at = now(),
    confirmed_by = p_confirmed_by
  WHERE id = p_deposit_id;

  -- Credit advertiser account
  UPDATE advertiser_accounts
  SET
    deposit_balance = deposit_balance + v_deposit.amount_usd,
    bonus_locked = bonus_locked + v_bonus_amount,
    lifetime_deposited = lifetime_deposited + v_deposit.amount_usd,
    lifetime_bonus = lifetime_bonus + v_bonus_amount
  WHERE user_id = v_deposit.advertiser_id;

  -- Create ledger entry
  INSERT INTO advertiser_ledger (advertiser_id, kind, bucket, amount, deposit_id)
  VALUES (v_deposit.advertiser_id, 'deposit', 'deposit', v_deposit.amount_usd, p_deposit_id);

  IF v_bonus_amount > 0 THEN
    INSERT INTO advertiser_ledger (advertiser_id, kind, bucket, amount, deposit_id)
    VALUES (v_deposit.advertiser_id, 'bonus', 'bonus', v_bonus_amount, p_deposit_id);
  END IF;

  RETURN jsonb_build_object(
    'credited', true, 
    'amount', v_deposit.amount_usd,
    'bonus', v_bonus_amount
  );
END;
$fn$;

-- 3. Verify mkt__guard_deposits allows server-side updates for nowpayments
-- The existing trigger should already allow status/field updates from the server
-- Just ensure it doesn't block legitimate nowpayments workflow
COMMENT ON CONSTRAINT advertiser_deposits_gateway_check ON advertiser_deposits IS 
  'Allows razorpay and nowpayments gateways. Both require webhook crediting via mkt_credit_deposit.';
