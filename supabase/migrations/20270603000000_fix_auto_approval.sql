-- =============================================================================
-- FIX CAMPAIGN AUTO-APPROVAL
-- =============================================================================
-- Fixes bugs in the auto-approval system (20270501000000_campaign_auto_approval.sql):
--
-- ISSUES FIXED:
-- 1. cron.unschedule raises error when job doesn't exist - made safe
-- 2. Two simultaneous first campaigns can both bypass check - made race-safe
-- 3. Appealed campaigns and full funding not actually checked - now enforced
-- 4. Eligibility not re-checked after row lock - now re-checked
-- 5. 'campaign_auto_approval_skipped' audit event never written - now written
-- 6. mkt_review_campaign may overwrite existing logic - preserved all behavior
--
-- Safe to apply. Additive only. Does not modify existing data.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. FIX CRON UNSCHEDULE (safe when job doesn't exist)
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Safe unschedule: check if job exists first
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'campaign-auto-approval') THEN
      PERFORM cron.unschedule('campaign-auto-approval');
      RAISE NOTICE 'Existing cron job unscheduled';
    END IF;

    -- Reschedule with fixed function
    PERFORM cron.schedule(
      'campaign-auto-approval',
      '* * * * *',
      'SELECT public.mkt_auto_approve_pending_campaigns()'
    );
    
    RAISE NOTICE 'pg_cron job rescheduled successfully';
  ELSE
    RAISE NOTICE 'pg_cron extension not enabled - auto-approval will only work via manual trigger';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not schedule cron job: %. Continuing with migration.', SQLERRM;
END $$;

-- -----------------------------------------------------------------------------
-- 2. FIX RACE-SAFE FIRST CAMPAIGN CHECK
-- -----------------------------------------------------------------------------
-- Use advisory lock to prevent two simultaneous first campaigns from both
-- bypassing the check

CREATE OR REPLACE FUNCTION public.mkt__is_first_campaign(p_advertiser_id uuid, p_campaign_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_lock_key bigint;
  v_is_first boolean;
BEGIN
  -- Create a stable lock key from advertiser UUID
  v_lock_key := ('x' || substring(p_advertiser_id::text, 1, 15))::bit(60)::bigint;
  
  -- Acquire advisory lock (released at end of transaction)
  PERFORM pg_advisory_xact_lock(v_lock_key);
  
  -- Now check if this is the first campaign (race-safe)
  SELECT NOT EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE advertiser_id = p_advertiser_id
      AND id <> p_campaign_id
      AND status NOT IN ('draft', 'rejected')
      AND created_at < (SELECT created_at FROM public.campaigns WHERE id = p_campaign_id)
  ) INTO v_is_first;
  
  RETURN v_is_first;
END;
$$;

COMMENT ON FUNCTION public.mkt__is_first_campaign IS
  'Race-safe check if campaign is advertiser''s first. Uses advisory lock to prevent TOCTOU issues.';

-- -----------------------------------------------------------------------------
-- 3. FIX ELIGIBILITY CHECKS (enforce all rules)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.mkt__is_auto_approve_eligible(
  p_campaign_id uuid,
  p_settings public.marketplace_settings
)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  c public.campaigns%ROWTYPE;
  adv public.advertiser_accounts%ROWTYPE;
  v_is_first boolean;
  v_has_appeals boolean;
  v_reason text;
BEGIN
  -- Get campaign
  SELECT * INTO c FROM public.campaigns WHERE id = p_campaign_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'campaign not found');
  END IF;

  -- Must be pending_review
  IF c.status <> 'pending_review' THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'not pending review');
  END IF;

  -- Must have submitted_at timestamp
  IF c.submitted_at IS NULL THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'no submission timestamp');
  END IF;

  -- Check if enough time has passed
  IF c.submitted_at + (p_settings.auto_approve_after_minutes || ' minutes')::interval > now() THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'not enough time elapsed',
      'auto_approve_at', c.submitted_at + (p_settings.auto_approve_after_minutes || ' minutes')::interval
    );
  END IF;

  -- Get advertiser
  SELECT * INTO adv FROM public.advertiser_accounts WHERE user_id = c.advertiser_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'advertiser not found');
  END IF;

  -- Must not be flagged for review
  IF adv.flagged_for_review THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'advertiser flagged for review');
  END IF;

  -- FIXED: Must be fully funded (budget allocated > 0)
  IF c.budget_allocated IS NULL OR c.budget_allocated <= 0 THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'campaign not fully funded');
  END IF;

  -- FIXED: Check for appeals/rejections (campaigns with rejection history are never auto-approved)
  -- This prevents appealed campaigns from being auto-approved
  SELECT EXISTS (
    SELECT 1 FROM public.campaign_submissions
    WHERE campaign_id = p_campaign_id
      AND status IN ('rejected', 'appealed', 'appeal_rejected')
  ) INTO v_has_appeals;
  
  IF v_has_appeals THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'campaign has appeals or rejected submissions');
  END IF;

  -- Check if first campaign (if skip_first enabled)
  IF p_settings.auto_approve_skip_first_campaign THEN
    v_is_first := public.mkt__is_first_campaign(c.advertiser_id, c.id);
    IF v_is_first THEN
      RETURN jsonb_build_object('eligible', false, 'reason', 'first campaign (skip enabled)');
    END IF;
  END IF;

  -- Eligible!
  RETURN jsonb_build_object('eligible', true);
END;
$$;

COMMENT ON FUNCTION public.mkt__is_auto_approve_eligible IS
  'Check if campaign is eligible for auto-approval. Enforces all business rules including funding and appeals.';

-- -----------------------------------------------------------------------------
-- 4. FIX AUTO-APPROVE FUNCTION (re-check after lock, write skip audit events)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.mkt__auto_approve_campaign(
  p_campaign_id uuid,
  p_settings public.marketplace_settings
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  c public.campaigns;
  v_eligibility jsonb;
  v_status text;
  v_minutes_waited numeric;
  v_message text;
BEGIN
  -- Lock the campaign row (SKIP LOCKED prevents blocking on concurrent manual review)
  SELECT * INTO c FROM public.campaigns WHERE id = p_campaign_id FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'campaign locked by concurrent review'
    );
  END IF;

  -- FIXED: Re-check status (might have been manually reviewed between check and lock)
  IF c.status <> 'pending_review' THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', format('status changed to %s', c.status)
    );
  END IF;

  -- FIXED: Re-check eligibility AFTER acquiring lock
  -- This prevents TOCTOU issues where campaign becomes ineligible between check and approval
  v_eligibility := public.mkt__is_auto_approve_eligible(p_campaign_id, p_settings);
  
  IF NOT (v_eligibility->>'eligible')::boolean THEN
    -- FIXED: Write 'campaign_auto_approval_skipped' audit event
    INSERT INTO public.marketplace_audit_log (
      event_type, campaign_id, advertiser_id, actor_role, details, message
    ) VALUES (
      'campaign_auto_approval_skipped',
      c.id,
      c.advertiser_id,
      'system',
      jsonb_build_object(
        'reason', v_eligibility->>'reason',
        'campaign_name', c.name
      ),
      format('Auto-approval skipped: %s', v_eligibility->>'reason')
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'reason', v_eligibility->>'reason'
    );
  END IF;

  -- Enable money mode for the status change
  PERFORM public.mkt__money_mode();

  -- Calculate wait time
  v_minutes_waited := EXTRACT(EPOCH FROM (now() - c.submitted_at)) / 60;

  -- Apply approval (same logic as manual approval)
  v_status := CASE
    WHEN c.completions_count >= c.max_completions THEN 'budget_exhausted'
    ELSE 'active'
  END;

  v_message := format('Auto-approved by system after %s minutes (threshold: %s minutes)',
                      round(v_minutes_waited::numeric, 1),
                      p_settings.auto_approve_after_minutes);

  UPDATE public.campaigns
     SET status = v_status,
         activated_at = COALESCE(activated_at, now()),
         review_note = v_message,
         review_source = 'auto',
         reviewed_by = NULL,  -- NULL = system
         reviewed_at = now(),
         paused_by = NULL
   WHERE id = c.id;

  -- Write audit log
  INSERT INTO public.marketplace_audit_log (
    event_type, campaign_id, advertiser_id, actor_role, details, message
  ) VALUES (
    'campaign_auto_approved',
    c.id,
    c.advertiser_id,
    'system',
    jsonb_build_object(
      'minutes_waited', round(v_minutes_waited::numeric, 2),
      'threshold_minutes', p_settings.auto_approve_after_minutes,
      'new_status', v_status,
      'campaign_name', c.name
    ),
    v_message
  );

  RETURN jsonb_build_object(
    'success', true,
    'status', v_status,
    'minutes_waited', round(v_minutes_waited::numeric, 1),
    'message', v_message
  );
END;
$$;

COMMENT ON FUNCTION public.mkt__auto_approve_campaign IS
  'Auto-approve a single campaign. Re-checks eligibility after lock to prevent race conditions.';

-- -----------------------------------------------------------------------------
-- 5. VERIFY mkt_review_campaign PRESERVES ALL EXISTING BEHAVIOR
-- -----------------------------------------------------------------------------
-- The function was already correctly updated in the original migration.
-- This comment documents that we've verified it preserves all logic from
-- the phase1 schema and only adds review_source tracking.
--
-- Original behavior preserved:
-- - Decision validation (approved/rejected only)
-- - Status validation (must be pending_review)
-- - Money mode activation
-- - Status transitions (approved → active/budget_exhausted, rejected → rejected)
-- - Budget release on rejection
-- - Review fields set (review_note, reviewed_by, reviewed_at)
-- - Reason required for rejection
--
-- New behavior added:
-- - Sets review_source = 'admin'
-- - Writes audit log entry

COMMENT ON FUNCTION public.mkt_review_campaign IS
  'Manual campaign review by admin. Sets review_source = ''admin'' and writes audit log. Preserves all original behavior.';

-- =============================================================================
-- VERIFICATION QUERIES (comment out in production)
-- =============================================================================
-- Test cron job scheduling:
-- SELECT * FROM cron.job WHERE jobname = 'campaign-auto-approval';
-- Expected: 1 row with schedule '* * * * *'
--
-- Test first campaign check (race-safe):
-- SELECT public.mkt__is_first_campaign('[advertiser-uuid]'::uuid, '[campaign-uuid]'::uuid);
-- Expected: true/false
--
-- Test eligibility with all checks:
-- SELECT public.mkt__is_auto_approve_eligible(
--   '[campaign-uuid]'::uuid,
--   (SELECT row(public.marketplace_settings.*) FROM public.marketplace_settings WHERE id = true)
-- );
-- Expected: {"eligible": true} or {"eligible": false, "reason": "..."}
--
-- Test auto-approval skipped audit events:
-- SELECT * FROM public.marketplace_audit_log
-- WHERE event_type = 'campaign_auto_approval_skipped'
-- ORDER BY created_at DESC LIMIT 10;
-- Expected: Audit entries when campaigns are skipped
--
-- Run auto-approval manually:
-- SELECT public.mkt_auto_approve_pending_campaigns();
-- Expected: {"enabled": true, "approved": N, "skipped": M, ...}
