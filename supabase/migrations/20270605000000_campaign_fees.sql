-- =============================================================================
-- CAMPAIGN FEES AND POSTBACK SECURITY
-- =============================================================================
-- Implements campaign creation fees (per-campaign or per-slot) and postback
-- security enhancements for auto-verified campaigns.
--
-- Changes:
-- 1. Add campaign fee settings to marketplace_settings
-- 2. Set platform_fee_percent to 0 (replaced by campaign fees)
-- 3. Create mkt_submit_campaign_with_fee RPC
-- 4. Update campaign_secrets table structure
--
-- Safe to apply. Does not modify existing campaigns.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ADD CAMPAIGN FEE SETTINGS
-- -----------------------------------------------------------------------------

ALTER TABLE public.marketplace_settings
  ADD COLUMN IF NOT EXISTS fees_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS campaign_fee_usd numeric(10,2) NOT NULL DEFAULT 0.50 
    CHECK (campaign_fee_usd >= 0 AND campaign_fee_usd <= 1000),
  ADD COLUMN IF NOT EXISTS campaign_fee_type text NOT NULL DEFAULT 'per_campaign' 
    CHECK (campaign_fee_type IN ('per_campaign', 'per_slot'));

COMMENT ON COLUMN public.marketplace_settings.fees_enabled IS
  'Whether campaign creation fees are enabled. When false, campaigns are free to create.';

COMMENT ON COLUMN public.marketplace_settings.campaign_fee_usd IS
  'Fee amount in USD. Applied per campaign or per slot based on campaign_fee_type.';

COMMENT ON COLUMN public.marketplace_settings.campaign_fee_type IS
  'How the fee is calculated: per_campaign (flat fee) or per_slot (fee × max_completions).';

-- -----------------------------------------------------------------------------
-- 2. ONE-TIME: SET PLATFORM FEE PERCENT TO ZERO
-- -----------------------------------------------------------------------------
-- The platform_fee_percent is no longer used for budget calculations.
-- Campaign fees are now charged separately via campaign_fee_usd.

UPDATE public.marketplace_settings 
SET platform_fee_percent = 0 
WHERE id = true 
  AND platform_fee_percent <> 0;

-- -----------------------------------------------------------------------------
-- 3. CAMPAIGN SUBMISSION WITH FEE
-- -----------------------------------------------------------------------------
-- Charges campaign creation fee (if enabled) and submits the campaign for review.
-- Fee is charged once per campaign (idempotent) even if resubmitted after rejection.

CREATE OR REPLACE FUNCTION public.mkt_submit_campaign_with_fee(
  p_campaign_id uuid,
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
  v_fee numeric := 0;
  v_current_balance numeric;
  v_balance_after numeric;
  v_idempotency_key text;
  v_already_charged boolean;
  v_submit_result jsonb;
BEGIN
  -- Ownership check
  IF c.advertiser_id <> p_actor THEN
    RAISE EXCEPTION 'MKT_NOT_OWNER';
  END IF;

  -- Status check (must be draft or rejected)
  IF c.status NOT IN ('draft', 'rejected') THEN
    RAISE EXCEPTION 'MKT_INVALID_STATUS' USING DETAIL = c.status;
  END IF;

  -- Advertiser must be active
  PERFORM public.mkt__assert_advertiser_active(c.advertiser_id);

  -- Calculate fee (0 if fees are disabled)
  IF s.fees_enabled THEN
    IF s.campaign_fee_type = 'per_campaign' THEN
      v_fee := s.campaign_fee_usd;
    ELSE -- 'per_slot'
      v_fee := s.campaign_fee_usd * c.max_completions;
    END IF;
  END IF;

  -- Charge fee if needed (idempotent via idempotency_key)
  IF v_fee > 0 THEN
    v_idempotency_key := 'campaign-fee-' || p_campaign_id::text;

    -- Check if already charged
    SELECT EXISTS(
      SELECT 1 FROM public.advertiser_ledger
      WHERE idempotency_key = v_idempotency_key
    ) INTO v_already_charged;

    IF NOT v_already_charged THEN
      -- Lock advertiser account
      SELECT deposit_balance
      INTO v_current_balance
      FROM public.advertiser_accounts
      WHERE user_id = c.advertiser_id
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'MKT_NO_ACCOUNT' USING DETAIL = 'advertiser account not found';
      END IF;

      -- Check sufficient funds
      IF v_current_balance < v_fee THEN
        RAISE EXCEPTION 'MKT_INSUFFICIENT_FUNDS' USING DETAIL = format(
          'campaign fee %s exceeds deposit balance %s', v_fee, v_current_balance
        );
      END IF;

      -- Calculate new balance
      v_balance_after := v_current_balance - v_fee;

      -- Enable money mode for money operations
      PERFORM public.mkt__money_mode();

      -- Insert ledger entry
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
        v_fee,
        -v_fee,
        v_balance_after,
        p_campaign_id,
        'campaign_fee',
        p_campaign_id,
        CASE 
          WHEN s.campaign_fee_type = 'per_campaign' THEN 'Campaign creation fee'
          ELSE format('Campaign fee (%s slots)', c.max_completions)
        END,
        v_idempotency_key
      );

      -- Update advertiser account balance
      UPDATE public.advertiser_accounts
      SET
        deposit_balance = v_balance_after,
        lifetime_spent = lifetime_spent + v_fee,
        updated_at = now()
      WHERE user_id = c.advertiser_id;
    END IF;
  END IF;

  -- Submit campaign (calls mkt_submit_campaign which validates and allocates budget)
  v_submit_result := public.mkt_submit_campaign(p_campaign_id, p_actor);

  -- Return submit result with fee information
  RETURN v_submit_result || jsonb_build_object('campaign_fee', v_fee);

EXCEPTION
  WHEN unique_violation THEN
    -- Idempotency key collision should not happen, but handle gracefully
    RAISE EXCEPTION 'MKT_DUPLICATE_FEE' USING DETAIL = 'campaign fee already charged';
END;
$$;

COMMENT ON FUNCTION public.mkt_submit_campaign_with_fee IS
  'Charges campaign creation fee (if enabled) and submits campaign for review. Fee is charged once per campaign. SERVICE_ROLE ONLY.';

-- Revoke from public and standard roles, grant only to service_role
REVOKE ALL ON FUNCTION public.mkt_submit_campaign_with_fee(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mkt_submit_campaign_with_fee(uuid, uuid) TO service_role;

-- -----------------------------------------------------------------------------
-- 4. UPDATE CAMPAIGN_SECRETS DEFAULT AUTH MODE
-- -----------------------------------------------------------------------------
-- New auto-verified campaigns default to 'token' mode (simpler, no HMAC required)

ALTER TABLE public.campaign_secrets
  ALTER COLUMN auth_mode SET DEFAULT 'token';

COMMENT ON COLUMN public.campaign_secrets.auth_mode IS
  'Authentication mode: token (query param) or hmac (X-Signature header). Defaults to token for simplicity.';

-- =============================================================================
-- VERIFICATION QUERIES (comment out in production)
-- =============================================================================
-- Test that fees_enabled defaults to false:
-- SELECT fees_enabled, campaign_fee_usd, campaign_fee_type FROM public.marketplace_settings WHERE id = true;
-- Expected: false, 0.50, 'per_campaign'
--
-- Test that platform_fee_percent is now 0:
-- SELECT platform_fee_percent FROM public.marketplace_settings WHERE id = true;
-- Expected: 0
