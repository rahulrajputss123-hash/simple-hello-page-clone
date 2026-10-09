-- =============================================================================
-- FEATURED PLACEMENT RPC
-- =============================================================================
-- Refactors featured placement billing to use a proper RPC function instead of
-- direct client-side ledger manipulation.
--
-- Changes:
-- 1. Create mkt_charge_featured RPC that handles all featured billing atomically
-- 2. Update mkt__guard_campaigns to reject direct featured field manipulation
-- 3. Update mkt_expire_featured_campaigns to call money mode
--
-- Security:
-- - Featured fee calculation is SERVER-SIDE ONLY
-- - All billing happens in one atomic transaction via RPC
-- - Guard trigger rejects any attempt to set featured fields outside money mode
-- - Idempotency prevents double-charging on retries
--
-- Safe to apply. Does not modify existing data.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. FEATURED PLACEMENT BILLING RPC
-- -----------------------------------------------------------------------------
-- Charges featured placement fee and updates campaign in one atomic transaction.
-- Follows mkt_submit_campaign style: locks campaign, checks ownership & status,
-- validates business rules, performs atomic billing.

CREATE OR REPLACE FUNCTION public.mkt_charge_featured(
  p_campaign_id uuid,
  p_days integer,
  p_actor uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  s public.marketplace_settings := public.mkt__settings();
  c public.campaigns := public.mkt__lock_campaign(p_campaign_id);
  v_fee_per_day numeric;
  v_total_fee numeric;
  v_current_balance numeric;
  v_balance_after numeric;
  v_expires_at timestamptz;
  v_idempotency_key text;
BEGIN
  -- Ownership check
  IF c.advertiser_id <> p_actor THEN
    RAISE EXCEPTION 'MKT_NOT_OWNER';
  END IF;

  -- Status check (must be draft, pending_review, active, or paused)
  IF c.status NOT IN ('draft', 'pending_review', 'active', 'paused') THEN
    RAISE EXCEPTION 'MKT_INVALID_STATUS' USING DETAIL = c.status;
  END IF;

  -- Advertiser must be active
  PERFORM public.mkt__assert_advertiser_active(c.advertiser_id);

  -- Validate days parameter
  IF p_days IS NULL OR p_days < 1 OR p_days > 30 THEN
    RAISE EXCEPTION 'MKT_INVALID_FEATURED' USING DETAIL = 'days must be between 1 and 30';
  END IF;

  -- Check if already featured
  IF c.is_featured THEN
    RAISE EXCEPTION 'MKT_DUPLICATE_FEATURED' USING DETAIL = 'campaign already has featured placement';
  END IF;

  -- Get featured price from settings
  v_fee_per_day := s.featured_price_per_day;
  IF v_fee_per_day IS NULL THEN
    RAISE EXCEPTION 'MKT_SETTINGS_ERROR' USING DETAIL = 'featured pricing not configured';
  END IF;

  -- Calculate total fee
  v_total_fee := v_fee_per_day * p_days;

  -- Get current deposit balance
  SELECT deposit_balance
  INTO v_current_balance
  FROM public.advertiser_accounts
  WHERE user_id = c.advertiser_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'MKT_NO_ACCOUNT' USING DETAIL = 'advertiser account not found';
  END IF;

  -- Check sufficient funds
  IF v_current_balance < v_total_fee THEN
    RAISE EXCEPTION 'MKT_INSUFFICIENT_FUNDS' USING DETAIL = format(
      'need %s but only have %s in deposit', v_total_fee, v_current_balance
    );
  END IF;

  -- Calculate new balance
  v_balance_after := v_current_balance - v_total_fee;

  -- Calculate expiry timestamp using make_interval
  v_expires_at := now() + make_interval(days => p_days);

  -- Generate idempotency key (campaign-specific to prevent double charges)
  v_idempotency_key := 'featured-' || p_campaign_id::text;

  -- Enable money mode before making changes
  PERFORM public.mkt__money_mode();

  -- Insert ledger entry (with idempotency protection)
  INSERT INTO public.advertiser_ledger (
    advertiser_id,
    kind,
    bucket,
    amount,
    delta,
    balance_after,
    campaign_id,
    reference_type,
    reference_id,
    description,
    idempotency_key
  )
  VALUES (
    c.advertiser_id,
    'adjustment',
    'deposit',
    v_total_fee,
    -v_total_fee,
    v_balance_after,
    p_campaign_id,
    'featured_placement',
    p_campaign_id,
    'Featured placement (' || p_days || ' days)',
    v_idempotency_key
  );

  -- Update advertiser account balance
  UPDATE public.advertiser_accounts
  SET
    deposit_balance = v_balance_after,
    lifetime_spent = lifetime_spent + v_total_fee,
    updated_at = now()
  WHERE user_id = c.advertiser_id;

  -- Update campaign with featured fields
  UPDATE public.campaigns
  SET
    is_featured = true,
    featured_started_at = now(),
    featured_expires_at = v_expires_at,
    featured_fee_paid = v_total_fee,
    updated_at = now()
  WHERE id = p_campaign_id;

  -- Return success info
  RETURN jsonb_build_object(
    'fee_charged', v_total_fee,
    'days', p_days,
    'expires_at', v_expires_at,
    'balance_after', v_balance_after
  );

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'MKT_DUPLICATE_REQUEST' USING DETAIL = 'featured placement already charged for this campaign';
END;
$$;

COMMENT ON FUNCTION public.mkt_charge_featured IS
  'Atomically charges featured placement fee and updates campaign. SERVICE_ROLE ONLY.';

-- Revoke from public and standard roles, grant only to service_role
REVOKE ALL ON FUNCTION public.mkt_charge_featured(uuid, integer, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mkt_charge_featured(uuid, integer, uuid) TO service_role;

-- -----------------------------------------------------------------------------
-- 2. UPDATE GUARD TO REJECT FEATURED MANIPULATION
-- -----------------------------------------------------------------------------
-- Copy the exact body from 20270301000000 and add featured field checks to INSERT.

CREATE OR REPLACE FUNCTION public.mkt__guard_campaigns()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  content_cols text[] := ARRAY[
    'type_key', 'name', 'summary', 'description', 'steps', 'rules', 'completion_requirements',
    'estimated_minutes', 'icon_url', 'landing_url', 'tracking_url', 'verification_mode',
    'proof_description', 'proof_min_images', 'proof_max_images', 'proof_fields',
    'min_seconds_to_convert', 'countries', 'devices', 'min_age', 'eligibility_notes',
    'slot_minutes', 'attribution_hours', 'starts_at', 'ends_at'];
  price_cols text[] := ARRAY['publisher_reward', 'max_completions'];
BEGIN
  IF public.mkt__in_money_mode() THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  IF TG_OP = 'DELETE' THEN
    IF OLD.status <> 'draft' OR OLD.budget_allocated <> 0 THEN
      RAISE EXCEPTION 'MKT_CAMPAIGN_LOCKED' USING DETAIL = 'only empty drafts can be deleted';
    END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'draft' OR NEW.budget_allocated <> 0 OR NEW.budget_remaining <> 0
       OR NEW.budget_reserved <> 0 OR NEW.budget_spent <> 0 OR NEW.budget_released <> 0
       OR NEW.completions_count <> 0 OR NEW.advertiser_cost IS NOT NULL
       OR NEW.fee_percent IS NOT NULL OR NEW.needs_review OR NEW.paused_by IS NOT NULL
       OR NEW.is_featured OR NEW.featured_fee_paid <> 0 OR NEW.featured_started_at IS NOT NULL OR NEW.featured_expires_at IS NOT NULL THEN
      RAISE EXCEPTION 'MKT_FUNCTION_ONLY' USING DETAIL = 'campaigns INSERT must be an empty draft';
    END IF;
    RETURN NEW;
  END IF;
  IF OLD.status NOT IN ('draft', 'rejected', 'paused') THEN
    RAISE EXCEPTION 'MKT_CAMPAIGN_LOCKED' USING DETAIL = 'pause the campaign before editing it';
  END IF;
  IF OLD.status = 'paused' THEN
    IF (to_jsonb(NEW) - (content_cols || 'updated_at'::text))
       IS DISTINCT FROM (to_jsonb(OLD) - (content_cols || 'updated_at'::text)) THEN
      RAISE EXCEPTION 'MKT_FUNCTION_ONLY' USING DETAIL = 'only content can change while paused';
    END IF;
    IF (to_jsonb(NEW) - 'updated_at'::text) IS DISTINCT FROM (to_jsonb(OLD) - 'updated_at'::text) THEN
      NEW.needs_review := true;
    END IF;
    RETURN NEW;
  END IF;
  IF (to_jsonb(NEW) - (content_cols || price_cols || 'updated_at'::text))
     IS DISTINCT FROM (to_jsonb(OLD) - (content_cols || price_cols || 'updated_at'::text)) THEN
    RAISE EXCEPTION 'MKT_FUNCTION_ONLY' USING DETAIL = 'campaigns UPDATE';
  END IF;
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. UPDATE FEATURED EXPIRY FUNCTION TO USE MONEY MODE
-- -----------------------------------------------------------------------------
-- The expiry function updates campaign fields, so it must call money mode first.

CREATE OR REPLACE FUNCTION public.mkt_expire_featured_campaigns()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_expired_count integer := 0;
  v_campaign_id uuid;
BEGIN
  -- Enable money mode before updating campaigns
  PERFORM public.mkt__money_mode();

  -- Find and expire campaigns where featured period has ended
  FOR v_campaign_id IN
    SELECT id FROM public.campaigns
    WHERE is_featured = true
      AND featured_expires_at IS NOT NULL
      AND featured_expires_at <= now()
      AND status IN ('active', 'paused', 'budget_exhausted')
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.campaigns
    SET 
      is_featured = false,
      updated_at = now()
    WHERE id = v_campaign_id;
    
    v_expired_count := v_expired_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'expired_count', v_expired_count,
    'checked_at', now()
  );
END;
$$;

-- =============================================================================
-- VERIFICATION QUERIES (comment out in production)
-- =============================================================================
-- Test that guard rejects featured INSERT outside money mode:
-- INSERT INTO campaigns (advertiser_id, is_featured) VALUES (auth.uid(), true);
-- Expected: ERROR MKT_FUNCTION_ONLY
--
-- Test that RPC works (as service_role):
-- SELECT public.mkt_charge_featured('<campaign_id>'::uuid, 7, '<user_id>'::uuid);
-- Expected: {"fee_charged": 14.00, "days": 7, ...}
