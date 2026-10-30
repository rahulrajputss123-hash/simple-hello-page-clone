-- ============================================================================
-- Migration: Update SQL functions for sub-cent support (4 decimal places)
-- ============================================================================
-- Changes round(x, 2) to round(x, 4) in credit/earning functions.
-- DOES NOT change withdrawal, payout, or minimum withdrawal logic (stays at 2 decimals).
--
-- Run this AFTER 20270804000000_subcent_support.sql
-- ============================================================================

-- ============================================================================
-- wallet_apply: Core wallet credit function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.wallet_apply(
  p_user_id uuid,
  p_source text,
  p_description text,
  p_amount numeric,
  p_kind text DEFAULT 'earned',
  p_lifetime_earned_delta numeric DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_amount numeric(14,4);
  v_lifetime numeric(14,4);
  v_held numeric(14,4);
  v_transaction_id uuid;
  v_profile_exists boolean;
BEGIN
  -- Validation
  IF p_user_id IS NULL OR p_source IS NULL OR p_amount IS NULL THEN
    RAISE EXCEPTION 'WALLET_INVALID_INPUT';
  END IF;

  -- Round to 4 decimals and validate minimum
  v_amount := round(p_amount, 4);
  IF v_amount < 0.0001 AND v_amount > -0.0001 THEN
    RAISE EXCEPTION 'WALLET_AMOUNT_TOO_SMALL' 
      USING DETAIL = 'Amount must be at least 0.0001 or at most -0.0001';
  END IF;

  v_lifetime := round(COALESCE(p_lifetime_earned_delta, GREATEST(v_amount, 0)), 4);

  -- Check profile exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_user_id) INTO v_profile_exists;
  IF NOT v_profile_exists THEN
    RAISE EXCEPTION 'WALLET_USER_NOT_FOUND';
  END IF;

  -- Held balance logic
  IF p_kind = 'held' THEN
    v_held := v_amount;
    v_amount := 0;
  ELSE
    v_held := 0;
  END IF;

  -- Insert transaction (idempotency handled by unique constraint if key provided)
  INSERT INTO public.wallet_transactions (user_id, source, description, amount, kind, status, idempotency_key)
  VALUES (p_user_id, p_source, p_description, v_amount + v_held, p_kind, 'completed', p_idempotency_key)
  RETURNING id INTO v_transaction_id;

  -- Update profile balances
  UPDATE public.profiles
  SET wallet_balance = wallet_balance + v_amount,
      held_balance = held_balance + v_held,
      lifetime_earned = lifetime_earned + v_lifetime
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'amount', v_amount,
    'held', v_held,
    'lifetime_delta', v_lifetime
  );
END;
$$;

-- ============================================================================
-- settle_offer_claim: Settle offer claim and credit user
-- ============================================================================
CREATE OR REPLACE FUNCTION public.settle_offer_claim(
  p_claim_id uuid,
  p_approved boolean,
  p_admin_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_claim public.offer_claims;
  v_reward numeric(14,4);
  v_profile_exists boolean;
BEGIN
  -- Lock and fetch claim
  SELECT * INTO v_claim FROM public.offer_claims WHERE id = p_claim_id FOR UPDATE;
  
  IF v_claim IS NULL THEN
    RAISE EXCEPTION 'CLAIM_NOT_FOUND';
  END IF;

  IF v_claim.status <> 'pending' THEN
    RAISE EXCEPTION 'CLAIM_ALREADY_SETTLED';
  END IF;

  -- Validate reward
  IF v_claim.reward_amount IS NULL OR round(v_claim.reward_amount, 4) < 0.0001 THEN
    RAISE EXCEPTION 'CLAIM_INVALID_REWARD';
  END IF;

  v_reward := round(v_claim.reward_amount, 4);

  -- Check user exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = v_claim.user_id) INTO v_profile_exists;
  IF NOT v_profile_exists THEN
    RAISE EXCEPTION 'CLAIM_USER_NOT_FOUND';
  END IF;

  -- Update claim status
  UPDATE public.offer_claims
  SET status = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
      admin_note = p_admin_note,
      updated_at = now()
  WHERE id = p_claim_id;

  -- Credit if approved
  IF p_approved THEN
    PERFORM public.wallet_apply(
      v_claim.user_id,
      'offer_claim',
      'Offer: ' || COALESCE((SELECT title FROM public.offers WHERE id = v_claim.offer_id), 'Unknown'),
      v_reward,
      'earned',
      v_reward,
      'offer_claim_' || p_claim_id::text
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'approved', p_approved,
    'reward', v_reward
  );
END;
$$;

-- ============================================================================
-- report_ad_watched_internal: Credit ad quest progress
-- ============================================================================
CREATE OR REPLACE FUNCTION public.report_ad_watched_internal(
  p_user_id uuid,
  p_quest_key text,
  p_reward numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reward numeric(14,4);
  v_wallet jsonb;
BEGIN
  -- Validate inputs
  IF p_user_id IS NULL OR p_quest_key IS NULL THEN
    RETURN jsonb_build_object('credited', false, 'reason', 'invalid_input');
  END IF;

  -- Check user exists
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RETURN jsonb_build_object('credited', false, 'reason', 'user_not_found');
  END IF;

  -- Validate and round reward to 4 decimals
  IF p_reward IS NULL OR p_reward = 'NaN'::numeric OR round(p_reward, 4) < 0.0001 THEN
    RETURN jsonb_build_object('credited', false, 'reason', 'reward_too_small');
  END IF;

  v_reward := round(p_reward, 4);

  -- Credit via wallet_apply
  v_wallet := public.wallet_apply(
    p_user_id,
    'ad_quest',
    'Quest: ' || p_quest_key,
    v_reward,
    'earned',
    v_reward,
    'ad_quest_' || p_quest_key || '_' || extract(epoch from now())::text
  );

  RETURN jsonb_build_object(
    'credited', true,
    'reward', v_reward,
    'wallet_result', v_wallet
  );
END;
$$;

-- ============================================================================
-- complete_referral_milestone: Credit referral bonus
-- ============================================================================
CREATE OR REPLACE FUNCTION public.complete_referral_milestone(
  p_referral_id uuid,
  p_max_bonus numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ref public.referrals;
  v_payout numeric(14,4);
BEGIN
  -- Lock referral
  SELECT * INTO v_ref FROM public.referrals WHERE id = p_referral_id FOR UPDATE;
  
  IF v_ref IS NULL THEN
    RAISE EXCEPTION 'REFERRAL_NOT_FOUND';
  END IF;

  -- Calculate payout (top up to max, accounting for already credited amount)
  v_payout := GREATEST(0, round(p_max_bonus, 4) - GREATEST(0, v_ref.bonus_amount));

  IF v_payout < 0.0001 THEN
    RETURN jsonb_build_object('success', true, 'payout', 0, 'reason', 'already_maxed');
  END IF;

  -- Update referral
  UPDATE public.referrals
  SET reward_released_at = now(),
      bonus_amount = round(p_max_bonus, 4),
      status = 'completed'
  WHERE id = p_referral_id;

  -- Credit referrer
  IF v_payout >= 0.0001 THEN
    PERFORM public.wallet_apply(
      v_ref.referrer_id,
      'referral_bonus',
      'Referral milestone bonus',
      v_payout,
      'earned',
      v_payout,
      'referral_milestone_' || p_referral_id::text
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'payout', v_payout
  );
END;
$$;

-- ============================================================================
-- MARKETPLACE FUNCTIONS - Keep at 4 decimals for publisher side
-- ============================================================================

-- Note: Advertiser balance functions keep round(x, 2) because advertiser
-- balances remain at 2 decimal precision. Only publisher earning functions
-- are updated to round(x, 4).

-- Update settle_marketplace_claim to use 4 decimals for publisher rewards
CREATE OR REPLACE FUNCTION public.settle_marketplace_claim(
  p_submission_id uuid,
  p_approved boolean,
  p_admin_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_submission public.campaign_submissions;
  v_campaign public.campaigns;
  v_reward numeric(14,4);
BEGIN
  -- Lock submission
  SELECT * INTO v_submission FROM public.campaign_submissions WHERE id = p_submission_id FOR UPDATE;
  
  IF v_submission IS NULL THEN
    RAISE EXCEPTION 'SUBMISSION_NOT_FOUND';
  END IF;

  IF v_submission.status <> 'pending' THEN
    RAISE EXCEPTION 'SUBMISSION_ALREADY_SETTLED';
  END IF;

  -- Get campaign
  SELECT * INTO v_campaign FROM public.campaigns WHERE id = v_submission.campaign_id;
  
  IF v_campaign IS NULL THEN
    RAISE EXCEPTION 'CAMPAIGN_NOT_FOUND';
  END IF;

  -- Validate and round reward to 4 decimals
  v_reward := round(v_campaign.reward, 4);

  IF v_reward < 0.0001 THEN
    RAISE EXCEPTION 'REWARD_TOO_SMALL';
  END IF;

  -- Update submission
  UPDATE public.campaign_submissions
  SET status = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
      reviewed_at = now(),
      admin_note = p_admin_note
  WHERE id = p_submission_id;

  -- Credit publisher if approved
  IF p_approved THEN
    PERFORM public.wallet_apply(
      v_submission.user_id,
      'campaign_reward',
      'Campaign: ' || v_campaign.name,
      v_reward,
      'earned',
      v_reward,
      'campaign_submission_' || p_submission_id::text
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'approved', p_approved,
    'reward', v_reward
  );
END;
$$;

-- ============================================================================
-- NOTES:
-- - Withdrawal functions NOT changed (stay at round(x, 2))
-- - Payout method minimum/fee logic NOT changed (stays at 2 decimals)
-- - Advertiser balance functions NOT changed (stay at round(x, 2))
-- - Campaign cost calculations NOT changed (stay at 2 decimals)
-- - Only publisher earning/credit paths updated to round(x, 4)
-- ============================================================================
