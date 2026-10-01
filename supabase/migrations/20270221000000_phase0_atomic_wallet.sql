-- =============================================================================
-- PHASE 0 — atomic wallet. Every publisher balance change now runs inside one
-- Postgres transaction with a row lock, using delta updates.
-- =============================================================================
-- Why: the app read wallet_balance / held_balance / lifetime_* in JavaScript,
-- added in JS, and wrote the absolute value back. Two concurrent writers could
-- silently erase each other's change (lost update). supabase-js cannot run
-- multi-statement transactions, so these functions are the only way to make a
-- balance change and its ledger row commit (or fail) together.
--
-- Also fixes three existing money bugs (D3):
--   * withdrawal_settle: a withdrawal could be approved twice (double deduct),
--     and an approved one could be "rejected" without a refund.
--   * offer_claim_settle: two concurrent approvals of one claim could both pay.
--   * sdk_conversion_credit: two concurrent retries of one conversion could both
--     pay; the main postback path now credits + marks credited atomically too.
-- And makes referral release/reversal atomic (a failed credit used to burn the
-- release claim, losing the reward for good).
--
-- Idempotent credits: wallet_apply applies a non-null p_reference_id at most
-- once per (user, source, kind, reference). Quest sessions, task rows, offer
-- claims, conversions and streak days pass their id, so double-submits pay
-- once and a credit that failed after its claim committed can simply be retried.
--
-- Conventions:
--   * SECURITY INVOKER (not DEFINER): service_role already has the table
--     privileges and BYPASSRLS these need. If EXECUTE were ever granted to
--     anon/authenticated by mistake (e.g. a future overload picking up
--     Supabase's default function privileges), the profiles column privileges
--     and guard trigger would still refuse the balance write.
--   * SET search_path = '' (all objects schema-qualified).
--   * EXECUTE for service_role only. Revoked from PUBLIC/anon/authenticated,
--     because Supabase's default privileges grant EXECUTE on new functions to
--     the client roles. Re-run the REVOKE block after any signature change.
--   * Lock order: the "thing" row (request / claim / conversion / referral)
--     first, then the profile row. wallet_apply locks only the profile row.
--   * Errors are raised with stable machine-readable messages (WALLET_*,
--     WITHDRAWAL_*, CLAIM_*, CONVERSION_*) that the TypeScript layer maps to
--     user-facing copy.
--
-- No table or column changes; adds two indexes on wallet_transactions. Old app
-- code keeps working with this applied, but the Phase 0 code needs it: apply
-- (and verify) this BEFORE the Phase 0 code is pushed/deployed.
-- Safe to re-run. Apply in the Supabase SQL editor.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
-- Fast lookups by reference (wallet_apply's idempotency check, withdrawal
-- ledger updates).
CREATE INDEX IF NOT EXISTS wallet_transactions_reference_idx
  ON public.wallet_transactions (reference_id)
  WHERE reference_id IS NOT NULL;

-- DB-level backstop for the idempotency rule on earning sources. Before this
-- migration none of these sources ever set reference_id, so existing rows
-- cannot conflict.
CREATE UNIQUE INDEX IF NOT EXISTS wallet_transactions_credit_once
  ON public.wallet_transactions (user_id, source, kind, reference_id)
  WHERE reference_id IS NOT NULL
    AND status = 'completed'
    AND source IN ('quest', 'task', 'streak', 'offer', 'offerwall');


-- -----------------------------------------------------------------------------
-- wallet_apply: the single primitive for crediting/debiting a publisher wallet.
-- -----------------------------------------------------------------------------
-- p_lifetime_earned_delta: NULL means "credits count toward lifetime_earned,
-- debits don't" (the old creditWallet behaviour). lifetime_earned never goes
-- below 0. Returns previous_lifetime_earned so callers keep the existing
-- "first earning" referral-milestone rule (previous value = 0).
CREATE OR REPLACE FUNCTION public.wallet_apply(
  p_user_id uuid,
  p_amount numeric,
  p_source text,
  p_kind text,
  p_description text,
  p_reference_id uuid DEFAULT NULL,
  p_lifetime_earned_delta numeric DEFAULT NULL,
  p_allow_negative boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_amount numeric(12,2);
  v_lifetime numeric(12,2);
  v_kind text := COALESCE(NULLIF(btrim(p_kind), ''), 'earned');
  v_balance numeric;
  v_held numeric;
  v_prev_lifetime numeric;
  v_tx_id uuid;
  v_existing_amount numeric;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'WALLET_NOT_FOUND';
  END IF;
  IF p_amount IS NULL OR p_amount = 'NaN'::numeric THEN
    RAISE EXCEPTION 'WALLET_INVALID_AMOUNT';
  END IF;
  IF p_source IS NULL OR btrim(p_source) = '' THEN
    RAISE EXCEPTION 'WALLET_INVALID_SOURCE';
  END IF;

  v_amount := round(p_amount, 2);
  v_lifetime := round(COALESCE(p_lifetime_earned_delta, GREATEST(v_amount, 0)), 2);

  SELECT wallet_balance, held_balance, lifetime_earned
    INTO v_balance, v_held, v_prev_lifetime
    FROM public.profiles
   WHERE id = p_user_id
     FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'WALLET_NOT_FOUND';
  END IF;

  -- Idempotency: a non-null reference is applied at most once per
  -- (user, source, kind, reference). Checked under the profile lock, so two
  -- concurrent calls with the same reference serialise and the second sees the
  -- first's row. This is what makes "claim, then credit" flows safe to retry
  -- and safe against double-submits.
  IF p_reference_id IS NOT NULL THEN
    SELECT id, amount INTO v_tx_id, v_existing_amount
      FROM public.wallet_transactions
     WHERE user_id = p_user_id
       AND source = p_source
       AND kind = v_kind
       AND reference_id = p_reference_id
       AND status = 'completed'
     LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object(
        'duplicate', true,
        'transaction_id', v_tx_id,
        'amount', v_existing_amount,
        'wallet_balance', v_balance,
        'held_balance', v_held,
        'previous_lifetime_earned', v_prev_lifetime
      );
    END IF;
  END IF;

  -- Only debits are guarded (so a legacy negative balance never blocks a
  -- credit), and against the AVAILABLE balance, so a debit can't eat funds
  -- held for a pending withdrawal.
  IF NOT p_allow_negative AND v_amount < 0 AND (v_balance - v_held) + v_amount < 0 THEN
    RAISE EXCEPTION 'WALLET_NEGATIVE';
  END IF;

  UPDATE public.profiles
     SET wallet_balance  = wallet_balance + v_amount,
         lifetime_earned = GREATEST(0, lifetime_earned + v_lifetime)
   WHERE id = p_user_id
  RETURNING wallet_balance, held_balance INTO v_balance, v_held;

  INSERT INTO public.wallet_transactions
    (user_id, source, description, amount, kind, status, reference_id)
  VALUES
    (p_user_id, p_source, COALESCE(p_description, ''), v_amount, v_kind, 'completed', p_reference_id)
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object(
    'duplicate', false,
    'transaction_id', v_tx_id,
    'amount', v_amount,
    'wallet_balance', v_balance,
    'held_balance', v_held,
    'previous_lifetime_earned', v_prev_lifetime
  );
END;
$$;


-- -----------------------------------------------------------------------------
-- Withdrawals
-- -----------------------------------------------------------------------------
-- withdrawal_request: balance check, one-pending rule, hold and ledger row in
-- one transaction. The profile lock serialises concurrent requests per user,
-- so two simultaneous requests can no longer both pass the "one pending" check.
-- Payout-method ownership/availability is validated in TypeScript beforehand.
CREATE OR REPLACE FUNCTION public.withdrawal_request(
  p_user_id uuid,
  p_amount numeric,
  p_payout_method_id uuid,
  p_method_type text,
  p_snapshot jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_amount numeric(12,2);
  v_balance numeric;
  v_held numeric;
  v_request public.withdrawal_requests%ROWTYPE;
BEGIN
  IF p_amount IS NULL OR p_amount = 'NaN'::numeric OR p_amount <= 0 THEN
    RAISE EXCEPTION 'WITHDRAWAL_INVALID_AMOUNT';
  END IF;
  v_amount := round(p_amount, 2);

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
    (user_id, amount, payout_method_id, method_type, payout_details_snapshot)
  VALUES
    (p_user_id, v_amount, p_payout_method_id, p_method_type, p_snapshot)
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


-- withdrawal_cancel: user cancels their own pending request; hold released.
CREATE OR REPLACE FUNCTION public.withdrawal_cancel(
  p_user_id uuid,
  p_request_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_request public.withdrawal_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_request
    FROM public.withdrawal_requests
   WHERE id = p_request_id AND user_id = p_user_id
     FOR UPDATE;
  IF NOT FOUND OR v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'WITHDRAWAL_NOT_CANCELLABLE';
  END IF;

  UPDATE public.withdrawal_requests SET status = 'cancelled' WHERE id = p_request_id;

  UPDATE public.profiles
     SET held_balance = GREATEST(0, held_balance - v_request.amount)
   WHERE id = v_request.user_id;

  UPDATE public.wallet_transactions
     SET status = 'failed', description = 'Withdrawal cancelled'
   WHERE reference_id = p_request_id AND source = 'withdrawal';

  RETURN jsonb_build_object('ok', true, 'amount', v_request.amount);
END;
$$;


-- withdrawal_settle: admin approve/reject. Money moves ONLY on the transition
-- out of 'pending' (bug fix: re-approving used to deduct again). Re-approving
-- an already-approved request only updates the fulfilment reference / note.
-- Any other change to a settled request is refused.
CREATE OR REPLACE FUNCTION public.withdrawal_settle(
  p_request_id uuid,
  p_decision text,
  p_note text DEFAULT NULL,
  p_reference text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_request public.withdrawal_requests%ROWTYPE;
  v_reference text := NULLIF(btrim(COALESCE(p_reference, '')), '');
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
    UPDATE public.withdrawal_requests
       SET reference_id = COALESCE(v_reference, reference_id),
           admin_note   = COALESCE(p_note, admin_note)
     WHERE id = p_request_id;
    RETURN jsonb_build_object(
      'settled', false, 'already_settled', true, 'status', 'approved',
      'user_id', v_request.user_id, 'amount', v_request.amount
    );
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'WITHDRAWAL_ALREADY_SETTLED';
  END IF;

  UPDATE public.withdrawal_requests
     SET status       = p_decision,
         admin_note   = p_note,
         reference_id = COALESCE(v_reference, reference_id)
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


-- -----------------------------------------------------------------------------
-- offer_claim_settle: approve/reject a pending offer claim exactly once.
-- -----------------------------------------------------------------------------
-- p_reward: the reward to pay on approval. NULL = the claim's snapshot. The
-- caller recomputes limited-deal rewards from the offer's current config.
-- Status change and wallet credit commit together, so an approved claim can no
-- longer end up unpaid, and a concurrent second approval is a no-op.
CREATE OR REPLACE FUNCTION public.offer_claim_settle(
  p_claim_id uuid,
  p_decision text,
  p_note text DEFAULT NULL,
  p_reward numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_claim public.offer_claims%ROWTYPE;
  v_reward numeric(12,2);
  v_wallet jsonb;
BEGIN
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'CLAIM_INVALID_DECISION';
  END IF;

  SELECT * INTO v_claim
    FROM public.offer_claims
   WHERE id = p_claim_id
     FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'CLAIM_NOT_FOUND';
  END IF;

  IF v_claim.status <> 'pending' THEN
    RETURN jsonb_build_object(
      'settled', false, 'already_reviewed', true, 'status', v_claim.status,
      'user_id', v_claim.user_id
    );
  END IF;

  IF p_decision = 'rejected' THEN
    UPDATE public.offer_claims
       SET status = 'rejected', admin_note = p_note
     WHERE id = p_claim_id;
    RETURN jsonb_build_object(
      'settled', true, 'already_reviewed', false, 'status', 'rejected',
      'user_id', v_claim.user_id
    );
  END IF;

  IF p_reward IS NOT NULL AND p_reward = 'NaN'::numeric THEN
    RAISE EXCEPTION 'CLAIM_INVALID_REWARD';
  END IF;
  v_reward := round(COALESCE(p_reward, v_claim.reward_amount), 2);
  IF v_reward < 0 THEN
    RAISE EXCEPTION 'CLAIM_INVALID_REWARD';
  END IF;

  UPDATE public.offer_claims
     SET status = 'approved', admin_note = p_note, reward_amount = v_reward
   WHERE id = p_claim_id;

  v_wallet := public.wallet_apply(
    v_claim.user_id, v_reward, 'offer', 'earned', 'Offer reward', v_claim.id
  );

  RETURN jsonb_build_object(
    'settled', true, 'already_reviewed', false, 'status', 'approved',
    'user_id', v_claim.user_id, 'reward', v_reward,
    'transaction_id', v_wallet->'transaction_id',
    'previous_lifetime_earned', v_wallet->'previous_lifetime_earned'
  );
END;
$$;


-- -----------------------------------------------------------------------------
-- sdk_conversion_credit: credit an SDK offerwall conversion exactly once.
-- -----------------------------------------------------------------------------
-- Used by the postback pipeline (status 'pending', p_allow_retry = false) and
-- by the admin retry (also accepts 'rejected', p_allow_retry = true). The row
-- lock + status check means concurrent callers can only ever credit once.
-- Returns credited = false with a reason instead of raising for the expected
-- "nothing to do" cases.
CREATE OR REPLACE FUNCTION public.sdk_conversion_credit(
  p_conversion_id uuid,
  p_reward numeric,
  p_description text,
  p_allow_retry boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_conv public.sdk_offerwall_conversions%ROWTYPE;
  v_reward numeric(12,2);
  v_wallet jsonb;
BEGIN
  SELECT * INTO v_conv
    FROM public.sdk_offerwall_conversions
   WHERE id = p_conversion_id
     FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'CONVERSION_NOT_FOUND';
  END IF;

  IF v_conv.status = 'credited' THEN
    RETURN jsonb_build_object('credited', false, 'reason', 'already_credited');
  END IF;
  IF v_conv.status = 'duplicate' THEN
    RETURN jsonb_build_object('credited', false, 'reason', 'duplicate');
  END IF;
  IF NOT (v_conv.status = 'pending' OR (p_allow_retry AND v_conv.status = 'rejected')) THEN
    RETURN jsonb_build_object('credited', false, 'reason', 'not_creditable', 'status', v_conv.status);
  END IF;
  IF v_conv.user_id IS NULL THEN
    RETURN jsonb_build_object('credited', false, 'reason', 'user_not_found');
  END IF;
  IF p_reward IS NULL OR p_reward = 'NaN'::numeric OR round(p_reward, 2) <= 0 THEN
    RETURN jsonb_build_object('credited', false, 'reason', 'zero_reward');
  END IF;
  v_reward := round(p_reward, 2);

  v_wallet := public.wallet_apply(
    v_conv.user_id, v_reward, 'offerwall', 'earned', COALESCE(p_description, 'Offerwall reward'), v_conv.id
  );

  UPDATE public.sdk_offerwall_conversions
     SET status                = 'credited',
         reward_amount         = v_reward,
         reject_reason         = NULL,
         processed_at          = now(),
         wallet_transaction_id = (v_wallet->>'transaction_id')::uuid
   WHERE id = p_conversion_id;

  RETURN jsonb_build_object(
    'credited', true, 'reward', v_reward, 'user_id', v_conv.user_id,
    'transaction_id', v_wallet->'transaction_id',
    'previous_lifetime_earned', v_wallet->'previous_lifetime_earned'
  );
END;
$$;


-- -----------------------------------------------------------------------------
-- Referral reward release / expiry reversal
-- -----------------------------------------------------------------------------
-- referral_release_reward: pays the referrer once, after 3/3 milestones and
-- inside the window. The release claim and the credit now commit together, so
-- a failed credit no longer burns the claim. Re-checks milestones and expiry
-- under the lock rather than trusting the caller's earlier read.
CREATE OR REPLACE FUNCTION public.referral_release_reward(
  p_referral_id uuid,
  p_max_bonus numeric,
  p_window_days integer,
  p_description text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_ref public.referrals%ROWTYPE;
  v_payout numeric(12,2);
BEGIN
  SELECT * INTO v_ref
    FROM public.referrals
   WHERE id = p_referral_id
     FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('released', false, 'reason', 'not_found');
  END IF;
  IF v_ref.reward_released_at IS NOT NULL THEN
    RETURN jsonb_build_object('released', false, 'reason', 'already_released');
  END IF;
  IF v_ref.signup_credited_at IS NULL
     OR v_ref.earning_credited_at IS NULL
     OR v_ref.withdrawal_credited_at IS NULL THEN
    RETURN jsonb_build_object('released', false, 'reason', 'incomplete');
  END IF;
  IF v_ref.status = 'expired'
     OR v_ref.created_at < now() - make_interval(days => p_window_days) THEN
    RETURN jsonb_build_object('released', false, 'reason', 'expired');
  END IF;

  -- Legacy rows credited under the old per-milestone model already hold part of
  -- the reward: only top up to the maximum.
  v_payout := GREATEST(0, round(p_max_bonus, 2) - GREATEST(0, v_ref.bonus_amount));

  UPDATE public.referrals
     SET reward_released_at = now(),
         bonus_amount       = round(p_max_bonus, 2),
         status             = 'completed'
   WHERE id = p_referral_id;

  IF v_payout > 0 THEN
    PERFORM public.wallet_apply(
      v_ref.referrer_id, v_payout, 'referral', 'bonus', p_description, v_ref.id
    );
  END IF;

  RETURN jsonb_build_object(
    'released', true, 'payout', v_payout, 'referrer_id', v_ref.referrer_id
  );
END;
$$;


-- referral_reverse_expired: claws back legacy per-milestone bonus from a
-- referral that expired before 3/3. Exactly once (bonus_amount is zeroed under
-- the lock). May take the balance negative, as the previous code did.
CREATE OR REPLACE FUNCTION public.referral_reverse_expired(
  p_referral_id uuid,
  p_description text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_ref public.referrals%ROWTYPE;
  v_amount numeric(12,2);
BEGIN
  SELECT * INTO v_ref
    FROM public.referrals
   WHERE id = p_referral_id
     FOR UPDATE;
  IF NOT FOUND OR v_ref.reward_released_at IS NOT NULL THEN
    RETURN jsonb_build_object('reversed', false);
  END IF;

  v_amount := round(GREATEST(0, v_ref.bonus_amount), 2);
  IF v_amount <= 0 THEN
    RETURN jsonb_build_object('reversed', false);
  END IF;

  PERFORM public.wallet_apply(
    v_ref.referrer_id, -v_amount, 'referral', 'adjustment', p_description, v_ref.id,
    -v_amount, true
  );

  UPDATE public.referrals
     SET bonus_amount = 0, status = 'expired'
   WHERE id = p_referral_id;

  RETURN jsonb_build_object(
    'reversed', true, 'amount', v_amount, 'referrer_id', v_ref.referrer_id
  );
END;
$$;


-- -----------------------------------------------------------------------------
-- Privileges: service_role only.
-- -----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.wallet_apply(uuid, numeric, text, text, text, uuid, numeric, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.withdrawal_request(uuid, numeric, uuid, text, jsonb)                 FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.withdrawal_cancel(uuid, uuid)                                        FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.withdrawal_settle(uuid, text, text, text)                            FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.offer_claim_settle(uuid, text, text, numeric)                        FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sdk_conversion_credit(uuid, numeric, text, boolean)                  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.referral_release_reward(uuid, numeric, integer, text)                FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.referral_reverse_expired(uuid, text)                                 FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.wallet_apply(uuid, numeric, text, text, text, uuid, numeric, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.withdrawal_request(uuid, numeric, uuid, text, jsonb)                 TO service_role;
GRANT EXECUTE ON FUNCTION public.withdrawal_cancel(uuid, uuid)                                        TO service_role;
GRANT EXECUTE ON FUNCTION public.withdrawal_settle(uuid, text, text, text)                            TO service_role;
GRANT EXECUTE ON FUNCTION public.offer_claim_settle(uuid, text, text, numeric)                        TO service_role;
GRANT EXECUTE ON FUNCTION public.sdk_conversion_credit(uuid, numeric, text, boolean)                  TO service_role;
GRANT EXECUTE ON FUNCTION public.referral_release_reward(uuid, numeric, integer, text)                TO service_role;
GRANT EXECUTE ON FUNCTION public.referral_reverse_expired(uuid, text)                                 TO service_role;

-- Make the new functions callable through the REST API immediately.
NOTIFY pgrst, 'reload schema';

-- -----------------------------------------------------------------------------
-- Verification (run after applying; read-only)
-- -----------------------------------------------------------------------------
-- Expect EXACTLY 8 rows (a 9th means a stale overload exists — drop it), each
-- with service_exec = true, anon_exec = auth_exec = false, and
-- security_definer = false:
--   SELECT p.proname,
--          has_function_privilege('anon', p.oid, 'EXECUTE')          AS anon_exec,
--          has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_exec,
--          has_function_privilege('service_role', p.oid, 'EXECUTE')  AS service_exec,
--          p.prosecdef AS security_definer
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public'
--     AND p.proname IN ('wallet_apply', 'withdrawal_request', 'withdrawal_cancel',
--                       'withdrawal_settle', 'offer_claim_settle', 'sdk_conversion_credit',
--                       'referral_release_reward', 'referral_reverse_expired')
--   ORDER BY p.proname;
