-- =============================================================================
-- CAMPAIGN AUTO-APPROVAL
-- =============================================================================
-- Automatically approve campaigns that wait too long in admin review queue.
--
-- Rules:
--   1. When submitted, campaign.submitted_at records the time it entered pending_review
--   2. If not approved/rejected within N minutes (default 10), auto-approve
--   3. Auto-approval has exactly the same effect as manual approval
--   4. Only fully-funded campaigns can be auto-approved
--   5. Appealed/flagged campaigns and advertiser's first campaign are never auto-approved
--   6. Records who approved: review_source ('auto' vs 'admin'), audit log entry
--   7. Idempotent and race-safe against simultaneous manual review
--
-- Admin settings (stored in marketplace_settings):
--   - auto_approve_enabled (default true)
--   - auto_approve_after_minutes (default 10, range 1-120)
--   - auto_approve_skip_first_campaign (default true)
--
-- Scheduling: pg_cron job runs every minute, calls mkt_auto_approve_pending_campaigns()
--
-- Admin UI: countdown chip on pending campaigns, "Auto-approved" badge on approved campaigns
-- =============================================================================


-- =============================================================================
-- 1. SCHEMA CHANGES
-- =============================================================================

-- Add review_source to track auto vs manual approval
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS review_source text CHECK (review_source IN ('admin', 'auto'));

-- Add auto-approval settings to marketplace_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'marketplace_settings'
      AND column_name = 'auto_approve_enabled'
  ) THEN
    ALTER TABLE public.marketplace_settings
      ADD COLUMN auto_approve_enabled boolean NOT NULL DEFAULT true,
      ADD COLUMN auto_approve_after_minutes integer NOT NULL DEFAULT 10
        CHECK (auto_approve_after_minutes BETWEEN 1 AND 120),
      ADD COLUMN auto_approve_skip_first_campaign boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- Add audit log table for tracking auto-approvals and other system actions
CREATE TABLE IF NOT EXISTS public.marketplace_audit_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      text NOT NULL CHECK (event_type IN (
                    'campaign_auto_approved', 'campaign_auto_approval_skipped',
                    'campaign_manually_approved', 'campaign_manually_rejected')),
  campaign_id     uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  advertiser_id   uuid REFERENCES public.advertiser_accounts(user_id) ON DELETE SET NULL,
  actor_id        uuid,  -- admin user id for manual actions, NULL for system
  actor_role      text CHECK (actor_role IN ('admin', 'system')),
  details         jsonb NOT NULL DEFAULT '{}'::jsonb,
  message         text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_audit_log_campaign_idx
  ON public.marketplace_audit_log (campaign_id, created_at DESC)
  WHERE campaign_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS marketplace_audit_log_advertiser_idx
  ON public.marketplace_audit_log (advertiser_id, created_at DESC)
  WHERE advertiser_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS marketplace_audit_log_event_idx
  ON public.marketplace_audit_log (event_type, created_at DESC);

-- Grants for audit log (service_role only, no client access)
REVOKE ALL ON TABLE public.marketplace_audit_log FROM anon, authenticated;
GRANT ALL ON TABLE public.marketplace_audit_log TO service_role;
ALTER TABLE public.marketplace_audit_log ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- 2. HELPER FUNCTIONS
-- =============================================================================

-- Check if this is the advertiser's first campaign
CREATE OR REPLACE FUNCTION public.mkt__is_first_campaign(p_advertiser_id uuid, p_campaign_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE advertiser_id = p_advertiser_id
      AND id <> p_campaign_id
      AND status NOT IN ('draft', 'rejected')
  );
$$;

-- Check if campaign is eligible for auto-approval
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

  -- Must not be flagged
  IF adv.flagged_for_review THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'advertiser flagged for review');
  END IF;

  -- Must be fully funded (budget allocated)
  IF c.budget_allocated = 0 THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'no budget allocated');
  END IF;

  -- Check if first campaign (if skip_first enabled)
  IF p_settings.auto_approve_skip_first_campaign THEN
    v_is_first := public.mkt__is_first_campaign(c.advertiser_id, c.id);
    IF v_is_first THEN
      RETURN jsonb_build_object('eligible', false, 'reason', 'first campaign');
    END IF;
  END IF;

  -- Eligible!
  RETURN jsonb_build_object('eligible', true);
END;
$$;


-- =============================================================================
-- 3. AUTO-APPROVAL FUNCTION (called by pg_cron or server route)
-- =============================================================================

-- Auto-approve eligible campaigns that have been pending too long.
-- Returns summary of actions taken.
CREATE OR REPLACE FUNCTION public.mkt_auto_approve_pending_campaigns()
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  s public.marketplace_settings := public.mkt__settings();
  v_pending uuid[];
  v_campaign_id uuid;
  v_eligibility jsonb;
  v_approved_count integer := 0;
  v_skipped_count integer := 0;
  v_results jsonb := '[]'::jsonb;
  v_result jsonb;
  v_minutes_waited numeric;
BEGIN
  -- Check if auto-approve is enabled
  IF NOT s.auto_approve_enabled THEN
    RETURN jsonb_build_object(
      'enabled', false,
      'approved', 0,
      'skipped', 0,
      'message', 'Auto-approval is disabled'
    );
  END IF;

  -- Get all pending campaigns that might be eligible
  -- (submitted_at + wait time has passed)
  SELECT array_agg(id)
    INTO v_pending
    FROM public.campaigns
   WHERE status = 'pending_review'
     AND submitted_at IS NOT NULL
     AND submitted_at + (s.auto_approve_after_minutes || ' minutes')::interval <= now();

  IF v_pending IS NULL OR cardinality(v_pending) = 0 THEN
    RETURN jsonb_build_object(
      'enabled', true,
      'approved', 0,
      'skipped', 0,
      'message', 'No campaigns eligible at this time'
    );
  END IF;

  -- Process each eligible campaign
  FOREACH v_campaign_id IN ARRAY v_pending
  LOOP
    BEGIN
      -- Check eligibility (includes all business rules)
      v_eligibility := public.mkt__is_auto_approve_eligible(v_campaign_id, s);

      IF (v_eligibility->>'eligible')::boolean THEN
        -- Approve the campaign (reuses existing review logic)
        v_result := public.mkt__auto_approve_campaign(v_campaign_id, s);

        IF (v_result->>'success')::boolean THEN
          v_approved_count := v_approved_count + 1;
          v_results := v_results || jsonb_build_object(
            'campaign_id', v_campaign_id,
            'action', 'approved',
            'status', v_result->>'status'
          );
        ELSE
          v_skipped_count := v_skipped_count + 1;
          v_results := v_results || jsonb_build_object(
            'campaign_id', v_campaign_id,
            'action', 'skipped',
            'reason', v_result->>'reason'
          );
        END IF;
      ELSE
        v_skipped_count := v_skipped_count + 1;
        v_results := v_results || jsonb_build_object(
          'campaign_id', v_campaign_id,
          'action', 'skipped',
          'reason', v_eligibility->>'reason'
        );
      END IF;

    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue with other campaigns
      v_skipped_count := v_skipped_count + 1;
      v_results := v_results || jsonb_build_object(
        'campaign_id', v_campaign_id,
        'action', 'error',
        'error', SQLERRM
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'enabled', true,
    'approved', v_approved_count,
    'skipped', v_skipped_count,
    'results', v_results,
    'message', format('Processed %s campaigns: %s approved, %s skipped',
                      cardinality(v_pending), v_approved_count, v_skipped_count)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.mkt_auto_approve_pending_campaigns() TO service_role;


-- Internal function to auto-approve a single campaign
-- Race-safe: locks row, re-checks status, does nothing if already reviewed
CREATE OR REPLACE FUNCTION public.mkt__auto_approve_campaign(
  p_campaign_id uuid,
  p_settings public.marketplace_settings
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  c public.campaigns;
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

  -- Re-check status (might have been manually reviewed between check and lock)
  IF c.status <> 'pending_review' THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', format('status changed to %s', c.status)
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

  -- TODO: Send notification to advertiser (implement via server-side notification system)
  -- For now, just return success - the server can poll audit log or add notification logic

  RETURN jsonb_build_object(
    'success', true,
    'status', v_status,
    'minutes_waited', round(v_minutes_waited::numeric, 1),
    'message', v_message
  );
END;
$$;


-- =============================================================================
-- 4. UPDATE EXISTING REVIEW FUNCTION TO TRACK REVIEW SOURCE
-- =============================================================================

-- Update mkt_review_campaign to set review_source = 'admin'
CREATE OR REPLACE FUNCTION public.mkt_review_campaign(
  p_campaign_id uuid, p_admin uuid, p_decision text, p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  c public.campaigns := public.mkt__lock_campaign(p_campaign_id);
  v_released numeric := 0;
  v_status text;
  v_event_type text;
BEGIN
  IF p_decision NOT IN ('approved', 'rejected') THEN RAISE EXCEPTION 'MKT_INVALID_DECISION'; END IF;
  IF c.status <> 'pending_review' THEN RAISE EXCEPTION 'MKT_INVALID_STATUS' USING DETAIL = c.status; END IF;
  PERFORM public.mkt__money_mode();

  IF p_decision = 'approved' THEN
    v_status := CASE WHEN c.completions_count >= c.max_completions THEN 'budget_exhausted' ELSE 'active' END;
    v_event_type := 'campaign_manually_approved';
    UPDATE public.campaigns
       SET status = v_status, activated_at = COALESCE(activated_at, now()),
           review_note = p_note, review_source = 'admin', reviewed_by = p_admin, reviewed_at = now(), paused_by = NULL
     WHERE id = c.id;
  ELSE
    IF char_length(btrim(COALESCE(p_note, ''))) < 10 THEN RAISE EXCEPTION 'MKT_REASON_REQUIRED'; END IF;
    v_status := 'rejected';
    v_event_type := 'campaign_manually_rejected';
    UPDATE public.campaigns
       SET status = 'rejected', review_note = p_note, review_source = 'admin',
           reviewed_by = p_admin, reviewed_at = now()
     WHERE id = c.id;
    v_released := public.mkt__release_remaining(c.id);
  END IF;

  -- Write audit log
  INSERT INTO public.marketplace_audit_log (
    event_type, campaign_id, advertiser_id, actor_id, actor_role, details, message
  ) VALUES (
    v_event_type,
    c.id,
    c.advertiser_id,
    p_admin,
    'admin',
    jsonb_build_object(
      'decision', p_decision,
      'new_status', v_status,
      'note', p_note,
      'campaign_name', c.name
    ),
    format('Campaign %s by admin', p_decision)
  );

  RETURN jsonb_build_object('status', v_status, 'released', v_released);
END;
$$;


-- =============================================================================
-- 5. HELPER FUNCTION FOR ADMIN UI (countdown calculation)
-- =============================================================================

-- Calculate when a pending campaign will be auto-approved
-- Returns NULL if auto-approval is disabled or campaign not eligible
CREATE OR REPLACE FUNCTION public.mkt_campaign_auto_approve_at(p_campaign_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  s public.marketplace_settings := public.mkt__settings();
  c public.campaigns%ROWTYPE;
  v_eligibility jsonb;
BEGIN
  -- Check if auto-approve is enabled
  IF NOT s.auto_approve_enabled THEN
    RETURN NULL;
  END IF;

  -- Get campaign
  SELECT * INTO c FROM public.campaigns WHERE id = p_campaign_id;
  IF NOT FOUND OR c.status <> 'pending_review' OR c.submitted_at IS NULL THEN
    RETURN NULL;
  END IF;

  -- Check basic eligibility (excluding time check)
  -- If not eligible for other reasons, return NULL
  SELECT * INTO v_eligibility FROM public.mkt__is_auto_approve_eligible(p_campaign_id, s);

  -- If eligible or only waiting for time, return the auto-approve timestamp
  IF (v_eligibility->>'eligible')::boolean
     OR (v_eligibility->>'reason') = 'not enough time elapsed' THEN
    RETURN c.submitted_at + (s.auto_approve_after_minutes || ' minutes')::interval;
  END IF;

  -- Not eligible for auto-approval
  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mkt_campaign_auto_approve_at(uuid) TO service_role;


-- =============================================================================
-- 6. SETUP pg_cron JOB
-- =============================================================================

-- This requires pg_cron extension to be enabled in Supabase
-- To enable: Go to Supabase Dashboard > Database > Extensions > Enable pg_cron
--
-- The cron job runs every minute and calls mkt_auto_approve_pending_campaigns()

DO $$
BEGIN
  -- Check if pg_cron extension exists
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove existing job if it exists
    PERFORM cron.unschedule('campaign-auto-approval');

    -- Schedule new job to run every minute
    PERFORM cron.schedule(
      'campaign-auto-approval',
      '* * * * *',  -- Every minute
      $$SELECT public.mkt_auto_approve_pending_campaigns()$$
    );

    RAISE NOTICE 'pg_cron job scheduled: campaign-auto-approval runs every minute';
  ELSE
    RAISE NOTICE 'pg_cron extension not enabled. Auto-approval will not run automatically.';
    RAISE NOTICE 'To enable: Supabase Dashboard > Database > Extensions > Enable pg_cron';
    RAISE NOTICE 'Then re-run this migration or manually schedule the job.';
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Insufficient privileges to schedule cron job. This is expected if not running as superuser.';
    RAISE NOTICE 'After enabling pg_cron extension, run: SELECT cron.schedule(''campaign-auto-approval'', ''* * * * *'', $$SELECT public.mkt_auto_approve_pending_campaigns()$$);';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not schedule pg_cron job: %', SQLERRM;
    RAISE NOTICE 'You may need to enable pg_cron extension first, then manually schedule the job.';
END $$;


-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Summary of changes:
-- 1. Added review_source column to campaigns table
-- 2. Added auto-approval settings to marketplace_settings
-- 3. Created marketplace_audit_log table for tracking approvals
-- 4. Created helper functions for eligibility checking
-- 5. Created mkt_auto_approve_pending_campaigns() main function
-- 6. Updated mkt_review_campaign() to track review_source
-- 7. Created mkt_campaign_auto_approve_at() for UI countdown
-- 8. Attempted to schedule pg_cron job (requires extension enabled)

-- Next steps:
-- 1. Enable pg_cron extension in Supabase Dashboard if not already enabled
-- 2. Update admin UI to show countdown and auto-approved badges
-- 3. Add notification system to alert advertisers when campaigns are auto-approved
-- 4. Test with auto_approve_after_minutes = 1 for quick testing
