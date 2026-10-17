-- =============================================================================
-- Update withdrawal_request RPC to accept and store network_fee
--
-- Modifies the withdrawal_request function to accept an optional p_network_fee
-- parameter and store it on the withdrawal_requests row. This fee represents
-- the flat network cost (in USD) deducted from crypto withdrawals, shown to
-- the user before they confirm.
-- 
-- IMPORTANT: When dropping and recreating a function, permissions must be
-- restored. Production requires strict access control: only service_role can
-- execute this function.
-- =============================================================================

-- Drop the old 5-arg version
DROP FUNCTION IF EXISTS public.withdrawal_request(uuid, numeric, uuid, text, jsonb);

-- Create the new 6-arg version with p_network_fee
CREATE OR REPLACE FUNCTION public.withdrawal_request(
  p_user_id uuid,
  p_amount numeric,
  p_payout_method_id uuid,
  p_method_type text,
  p_snapshot jsonb,
  p_network_fee numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_amount numeric(12,2);
  v_network_fee numeric(12,2);
  v_balance numeric;
  v_held numeric;
  v_request public.withdrawal_requests%ROWTYPE;
BEGIN
  IF p_amount IS NULL OR p_amount = 'NaN'::numeric OR p_amount <= 0 THEN
    RAISE EXCEPTION 'WITHDRAWAL_INVALID_AMOUNT';
  END IF;
  v_amount := round(p_amount, 2);
  
  -- Network fee defaults to 0 for non-crypto methods
  v_network_fee := COALESCE(round(p_network_fee, 2), 0);
  IF v_network_fee < 0 THEN
    RAISE EXCEPTION 'WITHDRAWAL_INVALID_NETWORK_FEE';
  END IF;

  SELECT wallet_balance, held_balance
    INTO v_balance, v_held
    FROM public.profiles
   WHERE id = p_user_id
     FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'WALLET_NOT_FOUND';
  END IF;

  IF v_amount > v_balance - v_held THEN
    RAISE EXCEPTION 'WITHDRAWAL_INSUFFICIENT';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.withdrawal_requests
     WHERE user_id = p_user_id AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'WITHDRAWAL_ALREADY_PENDING';
  END IF;

  INSERT INTO public.withdrawal_requests
    (user_id, amount, payout_method_id, method_type, payout_details_snapshot, network_fee)
  VALUES
    (p_user_id, v_amount, p_payout_method_id, p_method_type, p_snapshot, v_network_fee)
  RETURNING * INTO v_request;

  UPDATE public.profiles
     SET held_balance = held_balance + v_amount
   WHERE id = p_user_id;

  INSERT INTO public.wallet_transactions
    (user_id, source, description, amount, kind, status, reference_id)
  VALUES
    (p_user_id, 'withdrawal', 'Withdrawal request', -v_amount, 'withdrawn', 'pending', v_request.id);

  RETURN to_jsonb(v_request);
END;
$$;

-- Restore permissions: REVOKE all, then GRANT to service_role only
REVOKE ALL ON FUNCTION public.withdrawal_request(uuid, numeric, uuid, text, jsonb, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.withdrawal_request(uuid, numeric, uuid, text, jsonb, numeric) FROM anon;
REVOKE ALL ON FUNCTION public.withdrawal_request(uuid, numeric, uuid, text, jsonb, numeric) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.withdrawal_request(uuid, numeric, uuid, text, jsonb, numeric) TO service_role;

COMMENT ON FUNCTION public.withdrawal_request IS
  'Creates a pending withdrawal request and holds the funds. Now accepts optional network_fee for crypto withdrawals. Throws WITHDRAWAL_INSUFFICIENT or WITHDRAWAL_ALREADY_PENDING. Restricted to service_role only.';
