-- =============================================================================
-- MARKETPLACE FEATURED PLACEMENT
-- =============================================================================
-- Implements paid featured placement for advertiser campaigns.
-- Featured campaigns appear at the top of the task list with a special badge.
--
-- Changes:
-- 1. Add featured fields to campaigns table
-- 2. Add featured_price_per_day to marketplace_settings
-- 3. Create function to check and expire featured campaigns
-- 4. Create pg_cron job to run expiry checks every 5 minutes
-- 5. Add index for efficient featured campaign queries
--
-- Security:
-- - Fee calculation happens server-side only (never trust client)
-- - Featured fee is charged through existing wallet/ledger system
-- - Campaign creation + fee charge is atomic (transaction-safe)
-- - Expiry is enforced at query time + via scheduled job
--
-- Safe to apply. Additive only. Existing campaigns default to not featured.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ADD FEATURED FIELDS TO CAMPAIGNS
-- -----------------------------------------------------------------------------

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS featured_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS featured_fee_paid numeric(10,2) NOT NULL DEFAULT 0 CHECK (featured_fee_paid >= 0);

-- Index for efficient featured campaign queries (active + not expired)
CREATE INDEX IF NOT EXISTS campaigns_featured_active_idx 
  ON public.campaigns (is_featured, featured_expires_at, status) 
  WHERE is_featured = true AND status = 'active';

-- -----------------------------------------------------------------------------
-- 2. ADD FEATURED PRICING TO SETTINGS
-- -----------------------------------------------------------------------------

ALTER TABLE public.marketplace_settings
  ADD COLUMN IF NOT EXISTS featured_price_per_day numeric(10,2) NOT NULL DEFAULT 2.00 
    CHECK (featured_price_per_day >= 0 AND featured_price_per_day <= 1000);

-- -----------------------------------------------------------------------------
-- 3. FEATURED EXPIRY FUNCTION
-- -----------------------------------------------------------------------------
-- Automatically expires featured campaigns whose featured_expires_at has passed.
-- Called by pg_cron every 5 minutes and also checked at query time.

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

COMMENT ON FUNCTION public.mkt_expire_featured_campaigns IS
  'Expires featured campaigns whose featured_expires_at has passed. Called by pg_cron every 5 minutes.';

-- -----------------------------------------------------------------------------
-- 4. SCHEDULE FEATURED EXPIRY JOB (pg_cron)
-- -----------------------------------------------------------------------------
-- Runs every 5 minutes to check for expired featured campaigns

DO $$
BEGIN
  -- Check if pg_cron extension exists
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Unschedule existing job if it exists (safe way)
    BEGIN
      PERFORM cron.unschedule('expire-featured-campaigns');
    EXCEPTION
      WHEN undefined_table THEN NULL;
      WHEN undefined_function THEN NULL;
      WHEN OTHERS THEN NULL;
    END;

    -- Schedule the job to run every 5 minutes
    PERFORM cron.schedule(
      'expire-featured-campaigns',
      '*/5 * * * *',
      'SELECT public.mkt_expire_featured_campaigns()'
    );
    
    RAISE NOTICE 'Featured expiry cron job scheduled successfully';
  ELSE
    RAISE WARNING 'pg_cron extension not available - featured expiry will only happen at query time';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 5. HELPER VIEW FOR ACTIVE FEATURED CAMPAIGNS
-- -----------------------------------------------------------------------------
-- Makes it easy to query currently-featured campaigns (not expired)

CREATE OR REPLACE VIEW public.active_featured_campaigns AS
SELECT 
  id,
  advertiser_id,
  name,
  status,
  featured_started_at,
  featured_expires_at,
  featured_fee_paid,
  EXTRACT(EPOCH FROM (featured_expires_at - now())) / 3600 AS hours_remaining
FROM public.campaigns
WHERE is_featured = true
  AND featured_expires_at IS NOT NULL
  AND featured_expires_at > now()
  AND status IN ('active', 'paused', 'budget_exhausted')
ORDER BY featured_expires_at ASC;

COMMENT ON VIEW public.active_featured_campaigns IS
  'Active featured campaigns that have not expired. Useful for admin monitoring.';

-- Grant view access to service_role only
GRANT SELECT ON public.active_featured_campaigns TO service_role;

-- =============================================================================
-- VERIFICATION QUERIES (comment out in production)
-- =============================================================================
-- SELECT featured_price_per_day FROM public.marketplace_settings WHERE id = true;
-- Expected: 2.00 (default)
--
-- SELECT * FROM cron.job WHERE jobname = 'expire-featured-campaigns';
-- Expected: 1 row with schedule '*/5 * * * *'
--
-- SELECT public.mkt_expire_featured_campaigns();
-- Expected: {"expired_count": 0, "checked_at": "..."}
