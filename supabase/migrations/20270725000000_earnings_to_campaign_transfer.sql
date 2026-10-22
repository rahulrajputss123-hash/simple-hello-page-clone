-- Earnings -> Campaign Balance transfer (one-way).
-- ALREADY APPLIED IN PRODUCTION. Do not run again; this file only mirrors production.

DO $$ BEGIN
  ALTER TABLE public.advertiser_ledger DROP CONSTRAINT IF EXISTS advertiser_ledger_kind_check;
  ALTER TABLE public.advertiser_ledger ADD CONSTRAINT advertiser_ledger_kind_check CHECK (kind IN (
    'deposit', 'deposit_reversal', 'first_deposit_bonus', 'first_deposit_bonus_reversal',
    'bonus_unlock', 'bonus_forfeit', 'campaign_allocation', 'campaign_release',
    'conversion_charge', 'adjustment', 'earnings_transfer'));
END $$;

CREATE OR REPLACE FUNCTION public.earner_to_advertiser_transfer(
  p_user_id uuid,
  p_amount numeric,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_status text;
  v_deposit numeric;
  v_wallet numeric;
  v_held numeric;
  v_key text;
  v_ledger_id uuid;
  v_posted boolean;
  v_wallet_after numeric;
  v_deposit_after numeric;
BEGIN
  IF p_user_id IS NULL OR p_amount IS NULL OR p_amount = 'NaN'::numeric
     OR p_idempotency_key IS NULL OR btrim(p_idempotency_key) = '' OR length(p_idempotency_key) > 100 THEN
    RAISE EXCEPTION 'TRANSFER_INVALID_INPUT';
  END IF;
  IF p_amount > 1000000 OR p_amount <> round(p_amount, 2) THEN
    RAISE EXCEPTION 'TRANSFER_INVALID_AMOUNT' USING DETAIL = 'At most two decimals';
  END IF;
  IF p_amount < 5 THEN
    RAISE EXCEPTION 'TRANSFER_BELOW_MINIMUM' USING DETAIL = 'Minimum transfer is $5.00';
  END IF;

  -- Lock order: advertiser account first (same as the marketplace functions), then the earner profile.
  SELECT status, deposit_balance INTO v_status, v_deposit
    FROM public.advertiser_accounts WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'TRANSFER_NO_ADVERTISER_ACCOUNT';
  END IF;
  IF v_status <> 'active' THEN
    RAISE EXCEPTION 'TRANSFER_ADVERTISER_NOT_ACTIVE';
  END IF;

  SELECT wallet_balance, held_balance INTO v_wallet, v_held
    FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'TRANSFER_USER_NOT_FOUND';
  END IF;

  v_key := 'earnings-transfer:' || p_user_id::text || ':' || btrim(p_idempotency_key);

  -- Idempotency: a repeated key returns the current balances without moving money again.
  SELECT id INTO v_ledger_id FROM public.advertiser_ledger WHERE idempotency_key = v_key;
  IF FOUND THEN
    RETURN jsonb_build_object('wallet_balance', v_wallet, 'deposit_balance', v_deposit,
                              'transferred', true, 'duplicate', true);
  END IF;

  IF COALESCE(v_wallet, 0) - COALESCE(v_held, 0) < p_amount THEN
    RAISE EXCEPTION 'TRANSFER_INSUFFICIENT_BALANCE'
      USING DETAIL = format('Available: %s, requested: %s', COALESCE(v_wallet, 0) - COALESCE(v_held, 0), p_amount);
  END IF;

  v_posted := public.mkt__post(p_user_id, 'earnings_transfer', 'deposit', p_amount, p_amount, v_key,
                               NULL, NULL, 'earnings_transfer', NULL, 'Transferred from earnings');
  IF NOT v_posted THEN
    RAISE EXCEPTION 'TRANSFER_LEDGER_CONFLICT';
  END IF;
  SELECT id INTO v_ledger_id FROM public.advertiser_ledger WHERE idempotency_key = v_key;

  UPDATE public.profiles SET wallet_balance = wallet_balance - p_amount
   WHERE id = p_user_id RETURNING wallet_balance INTO v_wallet_after;

  INSERT INTO public.wallet_transactions (user_id, source, description, amount, kind, status, reference_id)
  VALUES (p_user_id, 'transfer_to_advertiser', 'Moved to Campaign Balance', -p_amount, 'transfer', 'completed', v_ledger_id);

  SELECT deposit_balance INTO v_deposit_after FROM public.advertiser_accounts WHERE user_id = p_user_id;

  RETURN jsonb_build_object('wallet_balance', v_wallet_after, 'deposit_balance', v_deposit_after, 'transferred', true);
END;
$$;

REVOKE ALL ON FUNCTION public.earner_to_advertiser_transfer(uuid, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.earner_to_advertiser_transfer(uuid, numeric, text) TO service_role;
