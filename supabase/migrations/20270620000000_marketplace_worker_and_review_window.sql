-- =============================================================================
-- Marketplace Background Worker and Per-Campaign Review Window
-- =============================================================================
-- Implements background job processing, campaign-specific review windows,
-- and advertiser review inbox functionality.
--
-- IDEMPOTENT: Safe to re-run. Uses CREATE OR REPLACE and IF NOT EXISTS.
-- ADDITIVE ONLY: Does not modify existing functions or triggers.
-- =============================================================================

-- =============================================================================
-- 1. WORKER LOG TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.mkt_worker_log (
  id              bigserial PRIMARY KEY,
  job_type        text NOT NULL,
  item_id         uuid,
  result          text NOT NULL CHECK (result IN ('success', 'failure')),
  error_message   text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mkt_worker_log_created_at_idx ON public.mkt_worker_log (created_at DESC);

-- Keep only the latest 500 rows (triggered after each insert)
CREATE OR REPLACE FUNCTION public.mkt__trim_worker_log()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  DELETE FROM public.mkt_worker_log
   WHERE id < (SELECT id FROM public.mkt_worker_log ORDER BY id DESC LIMIT 1 OFFSET 500);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS mkt_trim_worker_log_trigger ON public.mkt_worker_log;
CREATE TRIGGER mkt_trim_worker_log_trigger
  AFTER INSERT ON public.mkt_worker_log
  FOR EACH STATEMENT EXECUTE FUNCTION public.mkt__trim_worker_log();

-- RLS: Admin read only
ALTER TABLE public.mkt_worker_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view worker logs" ON public.mkt_worker_log;
CREATE POLICY "Admin can view worker logs" ON public.mkt_worker_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Revoke public access
REVOKE ALL ON public.mkt_worker_log FROM PUBLIC, anon, authenticated;


-- =============================================================================
-- 2. CAMPAIGN OPTIONS TABLE (per-campaign settings)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.campaign_options (
  campaign_id         uuid PRIMARY KEY REFERENCES public.campaigns(id) ON DELETE CASCADE,
  review_window_hours integer CHECK (review_window_hours IS NULL OR (review_window_hours BETWEEN 1 AND 720)),
  daily_limit         integer CHECK (daily_limit IS NULL OR daily_limit >= 1),
  proof_example_url   text CHECK (proof_example_url IS NULL OR proof_example_url ~ '^https://'),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- RLS: Advertiser can SELECT own campaigns, admins can select all
ALTER TABLE public.campaign_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Advertiser can view own campaign options" ON public.campaign_options;
CREATE POLICY "Advertiser can view own campaign options" ON public.campaign_options
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.advertiser_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin can view all campaign options" ON public.campaign_options;
CREATE POLICY "Admin can view all campaign options" ON public.campaign_options
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Revoke client insert/update/delete (server writes only)
REVOKE ALL ON public.campaign_options FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.campaign_options TO authenticated;


-- =============================================================================
-- 3. REVIEW WINDOW TRIGGER ON CAMPAIGN_SUBMISSIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.mkt__apply_review_window()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_review_hours integer;
  v_admin_max_hours integer;
BEGIN
  -- Only apply if auto_approve_at is set (not for requires_admin submissions)
  IF NEW.auto_approve_at IS NOT NULL THEN
    -- Get campaign-specific review window
    SELECT review_window_hours INTO v_review_hours
      FROM public.campaign_options
     WHERE campaign_id = NEW.campaign_id;
    
    IF v_review_hours IS NOT NULL THEN
      -- Get admin maximum from settings
      SELECT auto_approve_after_hours INTO v_admin_max_hours
        FROM public.marketplace_settings
       WHERE id = true;
      
      -- Use the smaller of campaign setting and admin maximum
      v_review_hours := LEAST(v_review_hours, COALESCE(v_admin_max_hours, 720));
      
      -- Override auto_approve_at
      NEW.auto_approve_at := now() + make_interval(hours => v_review_hours);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mkt_apply_review_window_trigger ON public.campaign_submissions;
CREATE TRIGGER mkt_apply_review_window_trigger
  BEFORE INSERT ON public.campaign_submissions
  FOR EACH ROW EXECUTE FUNCTION public.mkt__apply_review_window();


-- =============================================================================
-- 4. BACKGROUND WORKER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.mkt_run_due_work(p_limit integer DEFAULT 200)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_work jsonb;
  v_click_id uuid;
  v_submission_id uuid;
  v_campaign_id uuid;
  v_bonus_id uuid;
  v_hold_id uuid;
  v_processed jsonb;
  v_error_msg text;
BEGIN
  -- Get due work items
  v_work := public.mkt_due_work(p_limit);
  
  -- Initialize counters
  v_processed := jsonb_build_object(
    'expired_clicks', 0,
    'auto_approve', 0,
    'finalize_rejections', 0,
    'ended_campaigns', 0,
    'referrer_bonuses', 0,
    'earning_holds', 0,
    'errors', 0
  );
  
  -- Process expired clicks
  FOR v_click_id IN SELECT jsonb_array_elements_text(v_work->'expired_clicks')::uuid LOOP
    BEGIN
      PERFORM public.mkt_expire_click(v_click_id);
      v_processed := jsonb_set(v_processed, '{expired_clicks}', 
        to_jsonb((v_processed->>'expired_clicks')::int + 1));
      
      INSERT INTO public.mkt_worker_log (job_type, item_id, result)
      VALUES ('expired_click', v_click_id, 'success');
    EXCEPTION WHEN OTHERS THEN
      v_error_msg := SQLERRM;
      v_processed := jsonb_set(v_processed, '{errors}', 
        to_jsonb((v_processed->>'errors')::int + 1));
      
      INSERT INTO public.mkt_worker_log (job_type, item_id, result, error_message)
      VALUES ('expired_click', v_click_id, 'failure', v_error_msg);
    END;
  END LOOP;
  
  -- Process auto-approvals
  FOR v_submission_id IN SELECT jsonb_array_elements_text(v_work->'auto_approve')::uuid LOOP
    BEGIN
      -- Use system role to auto-approve
      PERFORM public.mkt_decide_submission(
        p_submission_id => v_submission_id,
        p_actor => '00000000-0000-0000-0000-000000000000'::uuid, -- system actor
        p_role => 'system',
        p_decision => 'approved',
        p_reason => NULL
      );
      v_processed := jsonb_set(v_processed, '{auto_approve}', 
        to_jsonb((v_processed->>'auto_approve')::int + 1));
      
      INSERT INTO public.mkt_worker_log (job_type, item_id, result)
      VALUES ('auto_approve', v_submission_id, 'success');
    EXCEPTION WHEN OTHERS THEN
      v_error_msg := SQLERRM;
      v_processed := jsonb_set(v_processed, '{errors}', 
        to_jsonb((v_processed->>'errors')::int + 1));
      
      INSERT INTO public.mkt_worker_log (job_type, item_id, result, error_message)
      VALUES ('auto_approve', v_submission_id, 'failure', v_error_msg);
    END;
  END LOOP;
  
  -- Process finalized rejections
  FOR v_submission_id IN SELECT jsonb_array_elements_text(v_work->'finalize_rejections')::uuid LOOP
    BEGIN
      PERFORM public.mkt_finalize_rejection(v_submission_id);
      v_processed := jsonb_set(v_processed, '{finalize_rejections}', 
        to_jsonb((v_processed->>'finalize_rejections')::int + 1));
      
      INSERT INTO public.mkt_worker_log (job_type, item_id, result)
      VALUES ('finalize_rejection', v_submission_id, 'success');
    EXCEPTION WHEN OTHERS THEN
      v_error_msg := SQLERRM;
      v_processed := jsonb_set(v_processed, '{errors}', 
        to_jsonb((v_processed->>'errors')::int + 1));
      
      INSERT INTO public.mkt_worker_log (job_type, item_id, result, error_message)
      VALUES ('finalize_rejection', v_submission_id, 'failure', v_error_msg);
    END;
  END LOOP;
  
  -- Process ended campaigns (set to 'completed')
  FOR v_campaign_id IN SELECT jsonb_array_elements_text(v_work->'ended_campaigns')::uuid LOOP
    BEGIN
      -- Use system role to complete campaigns
      PERFORM public.mkt_set_campaign_status(
        p_campaign_id => v_campaign_id,
        p_actor => '00000000-0000-0000-0000-000000000000'::uuid, -- system actor
        p_actor_role => 'system',
        p_target => 'completed',
        p_reason => 'Campaign end date reached'
      );
      v_processed := jsonb_set(v_processed, '{ended_campaigns}', 
        to_jsonb((v_processed->>'ended_campaigns')::int + 1));
      
      INSERT INTO public.mkt_worker_log (job_type, item_id, result)
      VALUES ('ended_campaign', v_campaign_id, 'success');
    EXCEPTION WHEN OTHERS THEN
      v_error_msg := SQLERRM;
      v_processed := jsonb_set(v_processed, '{errors}', 
        to_jsonb((v_processed->>'errors')::int + 1));
      
      INSERT INTO public.mkt_worker_log (job_type, item_id, result, error_message)
      VALUES ('ended_campaign', v_campaign_id, 'failure', v_error_msg);
    END;
  END LOOP;
  
  -- Process referrer bonuses
  FOR v_bonus_id IN SELECT jsonb_array_elements_text(v_work->'referrer_bonuses')::uuid LOOP
    BEGIN
      PERFORM public.mkt_release_referrer_bonus(v_bonus_id);
      v_processed := jsonb_set(v_processed, '{referrer_bonuses}', 
        to_jsonb((v_processed->>'referrer_bonuses')::int + 1));
      
      INSERT INTO public.mkt_worker_log (job_type, item_id, result)
      VALUES ('referrer_bonus', v_bonus_id, 'success');
    EXCEPTION WHEN OTHERS THEN
      v_error_msg := SQLERRM;
      v_processed := jsonb_set(v_processed, '{errors}', 
        to_jsonb((v_processed->>'errors')::int + 1));
      
      INSERT INTO public.mkt_worker_log (job_type, item_id, result, error_message)
      VALUES ('referrer_bonus', v_bonus_id, 'failure', v_error_msg);
    END;
  END LOOP;
  
  -- Process earning holds
  FOR v_hold_id IN SELECT jsonb_array_elements_text(v_work->'earning_holds')::uuid LOOP
    BEGIN
      PERFORM public.mkt_release_earning_hold(v_hold_id);
      v_processed := jsonb_set(v_processed, '{earning_holds}', 
        to_jsonb((v_processed->>'earning_holds')::int + 1));
      
      INSERT INTO public.mkt_worker_log (job_type, item_id, result)
      VALUES ('earning_hold', v_hold_id, 'success');
    EXCEPTION WHEN OTHERS THEN
      v_error_msg := SQLERRM;
      v_processed := jsonb_set(v_processed, '{errors}', 
        to_jsonb((v_processed->>'errors')::int + 1));
      
      INSERT INTO public.mkt_worker_log (job_type, item_id, result, error_message)
      VALUES ('earning_hold', v_hold_id, 'failure', v_error_msg);
    END;
  END LOOP;
  
  RETURN v_processed;
END;
$$;

-- Revoke from public, grant to service_role only
REVOKE ALL ON FUNCTION public.mkt_run_due_work FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mkt_run_due_work TO service_role;


-- =============================================================================
-- 5. PG_CRON JOB SETUP
-- =============================================================================

-- Schedule mkt_run_due_work every minute using safe pattern with distinct dollar quotes
DO $do$
BEGIN
  -- Check if job already exists, unschedule if present
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'mkt-process-due-work') THEN
    PERFORM cron.unschedule('mkt-process-due-work');
  END IF;
  
  -- Schedule new job
  PERFORM cron.schedule(
    'mkt-process-due-work',
    '* * * * *', -- Every minute
    $cron$SELECT public.mkt_run_due_work(200);$cron$
  );
END $do$;

-- Grant necessary permissions for cron job execution
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA cron TO postgres;


-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.mkt_worker_log IS 
  'Background worker execution log. Keeps latest 500 rows. Admin read-only.';

COMMENT ON TABLE public.campaign_options IS 
  'Per-campaign settings: review window, daily limits, proof examples. Advertiser can SELECT own.';

COMMENT ON FUNCTION public.mkt_run_due_work IS 
  'Processes all due work queues: expired clicks, auto-approvals, finalized rejections, ended campaigns, bonuses, holds. service_role only.';

COMMENT ON FUNCTION public.mkt__apply_review_window IS 
  'BEFORE INSERT trigger on campaign_submissions: applies campaign-specific review window if configured.';

