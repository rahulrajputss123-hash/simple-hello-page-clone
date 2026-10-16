-- =============================================================================
-- Update withdrawal_settle RPC to accept and store transaction_hash
--
-- Extends the withdrawal_settle function to accept an optional p_transaction_hash
-- parameter and store it on the withdrawal_requests row. This is required for
-- crypto withdrawals when settling as 'approved'.
-- =============================================================================

DROP FUNCTION IF EXISTS public.withdrawal_settle(uuid, text, text, text);

CREATE OR REPLACE FUNCTION public.withdrawal_settle(
  p_request_id uuid,
  p_decision text,
  p_note text DEFAULT NULL,
  p_reference text DEFAULT NULL,
  p_transaction_hash text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_request public.withdrawal_requests%ROWTYPE;
  v_reference text := NULLIF(btrim(COALESCE(p_reference, '')), '');
  v_transaction_hash text := NULLIF(btrim(COALESCE(p_transaction_hash, '')), '');
BEGIN
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'WITHDRAWAL_INVALID_DECISION';
  END IF;

  SELECT * INTO v_request
    FROM public.withdrawal_requests
   WHERE id = p_request_id
     FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'WITHDRAWAL_NOT_FOUND';
  END IF;

  IF v_request.status = 'approved' AND p_decision = 'approved' THEN
    -- Re-approving: update reference/note/transaction_hash without money movement
    UPDATE public.withdrawal_requests
       SET reference_id = COALESCE(v_reference, reference_id),
           admin_note   = COALESCE(p_note, admin_note),
           transaction_hash = COALESCE(v_transaction_hash, transaction_hash)
     WHERE id = p_request_id;
    RETURN jsonb_build_object(
      'settled', false, 'already_settled', true, 'status', 'approved',
      'user_id', v_request.user_id, 'amount', v_request.amount
    );
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'WITHDRAWAL_ALREADY_SETTLED';
  END IF;

  -- Update status, note, reference_id, and transaction_hash
  UPDATE public.withdrawal_requests
     SET status       = p_decision,
         admin_note   = p_note,
         reference_id = COALESCE(v_reference, reference_id),
         transaction_hash = v_transaction_hash
   WHERE id = p_request_id;

  IF p_decision = 'approved' THEN
    UPDATE public.profiles
       SET wallet_balance     = wallet_balance - v_request.amount,
           held_balance       = GREATEST(0, held_balance - v_request.amount),
           lifetime_withdrawn = lifetime_withdrawn + v_request.amount
     WHERE id = v_request.user_id;

    UPDATE public.wallet_transactions
       SET status = 'completed', description = 'Withdrawal paid'
     WHERE reference_id = p_request_id AND source = 'withdrawal';
  ELSE
    UPDATE public.profiles
       SET held_balance = GREATEST(0, held_balance - v_request.amount)
     WHERE id = v_request.user_id;

    UPDATE public.wallet_transactions
       SET status = 'failed', description = 'Withdrawal rejected'
     WHERE reference_id = p_request_id AND source = 'withdrawal';
  END IF;

  RETURN jsonb_build_object(
    'settled', true, 'already_settled', false, 'status', p_decision,
    'user_id', v_request.user_id, 'amount', v_request.amount
  );
END;
$$;

COMMENT ON FUNCTION public.withdrawal_settle IS
  'Admin approve/reject for withdrawals. Money moves only on transition out of pending. Now accepts optional transaction_hash for crypto payouts.';
