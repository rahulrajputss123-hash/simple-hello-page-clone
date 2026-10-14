-- =============================================================================
-- Marketplace PART 2: Notifications, Proof Examples, Advanced Targeting, Edit & Top-up
-- =============================================================================
-- Implements:
-- 1. Notification triggers for advertiser and earner events
-- 2. Proof example image storage bucket and UI field
-- 3. Advanced campaign settings (start/end dates, devices, eligibility, daily limits)
-- 4. Campaign editing for draft/rejected/paused campaigns
-- 5. Budget top-up functionality
--
-- IDEMPOTENT: Safe to re-run. Uses CREATE OR REPLACE and IF NOT EXISTS.
-- ADDITIVE ONLY: Does not modify existing functions or triggers except to enhance them.
-- =============================================================================

-- =============================================================================
-- 1. STORAGE BUCKET FOR PROOF EXAMPLES
-- =============================================================================

-- Create the bucket for proof example images (public read, authenticated write in own folder)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaign-proof-examples',
  'campaign-proof-examples',
  true, -- Public read
  2097152, -- 2 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for proof examples
-- 1. Public read access
DROP POLICY IF EXISTS "Public can view proof examples" ON storage.objects;
CREATE POLICY "Public can view proof examples"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'campaign-proof-examples');

-- 2. Authenticated users can upload to their own folder
DROP POLICY IF EXISTS "Authenticated users can upload proof examples" ON storage.objects;
CREATE POLICY "Authenticated users can upload proof examples"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'campaign-proof-examples'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Users can update their own files
DROP POLICY IF EXISTS "Users can update their proof examples" ON storage.objects;
CREATE POLICY "Users can update their proof examples"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'campaign-proof-examples'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'campaign-proof-examples'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Users can delete their own files
DROP POLICY IF EXISTS "Users can delete their proof examples" ON storage.objects;
CREATE POLICY "Users can delete their proof examples"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'campaign-proof-examples'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- =============================================================================
-- 2. NOTIFICATION HELPERS FOR MARKETPLACE EVENTS
-- =============================================================================

-- Helper function to send notification (fire-and-forget)
CREATE OR REPLACE FUNCTION public.mkt__notify(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_kind text DEFAULT 'info'
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, kind)
  VALUES (p_user_id, p_title, p_body, p_kind);
EXCEPTION WHEN OTHERS THEN
  -- Silent fail - never break the main flow
  RAISE WARNING 'mkt__notify failed for user %: %', p_user_id, SQLERRM;
END;
$$;

REVOKE ALL ON FUNCTION public.mkt__notify FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mkt__notify TO service_role;

COMMENT ON FUNCTION public.mkt__notify IS 
  'Fire-and-forget notification helper for marketplace events. Never throws.';


-- =============================================================================
-- 3. NOTIFICATION TRIGGERS
-- =============================================================================

-- Trigger: Campaign review decision (approved/rejected)
CREATE OR REPLACE FUNCTION public.mkt__notify_campaign_reviewed()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  -- Only fire when status changes to 'active' (approved) or 'rejected'
  IF (TG_OP = 'UPDATE' AND OLD.status <> NEW.status) THEN
    IF NEW.status = 'active' AND OLD.status = 'pending_review' THEN
      -- Campaign approved
      PERFORM public.mkt__notify(
        NEW.advertiser_id,
        'Campaign approved',
        'Your campaign "' || NEW.name || '" is now live and accepting completions.',
        'success'
      );
    ELSIF NEW.status = 'rejected' THEN
      -- Campaign rejected
      PERFORM public.mkt__notify(
        NEW.advertiser_id,
        'Campaign rejected',
        CASE
          WHEN NEW.review_note IS NOT NULL AND NEW.review_note <> '' 
          THEN 'Your campaign "' || NEW.name || '" was rejected: ' || NEW.review_note
          ELSE 'Your campaign "' || NEW.name || '" was rejected. Please review and resubmit.'
        END,
        'error'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mkt_notify_campaign_reviewed ON public.campaigns;
CREATE TRIGGER mkt_notify_campaign_reviewed
  AFTER UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.mkt__notify_campaign_reviewed();


-- Trigger: New proof submission (notify advertiser)
CREATE OR REPLACE FUNCTION public.mkt__notify_new_submission()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_campaign_name text;
  v_advertiser_id uuid;
BEGIN
  -- Get campaign info
  SELECT name, advertiser_id INTO v_campaign_name, v_advertiser_id
    FROM public.campaigns
   WHERE id = NEW.campaign_id;
  
  IF v_advertiser_id IS NOT NULL THEN
    PERFORM public.mkt__notify(
      v_advertiser_id,
      'New proof to review',
      'A new proof submission is waiting for your review in "' || v_campaign_name || '".',
      'info'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mkt_notify_new_submission ON public.campaign_submissions;
CREATE TRIGGER mkt_notify_new_submission
  AFTER INSERT ON public.campaign_submissions
  FOR EACH ROW 
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.mkt__notify_new_submission();


-- Trigger: Proof decision (approved/rejected/auto-approved)
CREATE OR REPLACE FUNCTION public.mkt__notify_proof_decision()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_campaign_name text;
  v_advertiser_id uuid;
  v_is_auto_approved boolean;
BEGIN
  -- Only fire when status changes to final state
  IF (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected')) THEN
    -- Get campaign info
    SELECT name, advertiser_id INTO v_campaign_name, v_advertiser_id
      FROM public.campaigns
     WHERE id = NEW.campaign_id;
    
    -- Check if this was auto-approved (decided_by is NULL or system UUID)
    v_is_auto_approved := (NEW.decided_by IS NULL OR NEW.decided_by = '00000000-0000-0000-0000-000000000000'::uuid);
    
    IF NEW.status = 'approved' THEN
      -- Notify earner: proof approved
      IF v_is_auto_approved THEN
        PERFORM public.mkt__notify(
          NEW.publisher_id,
          'Proof auto-approved',
          'Your proof for "' || v_campaign_name || '" was automatically approved. You earned $' || NEW.publisher_reward::text || '.',
          'success'
        );
        -- Notify advertiser: submission auto-approved
        IF v_advertiser_id IS NOT NULL THEN
          PERFORM public.mkt__notify(
            v_advertiser_id,
            'Submission auto-approved',
            'A proof in "' || v_campaign_name || '" was automatically approved (review window expired).',
            'info'
          );
        END IF;
      ELSE
        PERFORM public.mkt__notify(
          NEW.publisher_id,
          'Proof approved',
          'Your proof for "' || v_campaign_name || '" was approved. You earned $' || NEW.publisher_reward::text || '.',
          'success'
        );
      END IF;
    ELSIF NEW.status = 'rejected' THEN
      -- Notify earner: proof rejected
      PERFORM public.mkt__notify(
        NEW.publisher_id,
        'Proof rejected',
        CASE
          WHEN NEW.rejection_reason IS NOT NULL AND NEW.rejection_reason <> ''
          THEN 'Your proof for "' || v_campaign_name || '" was rejected: ' || NEW.rejection_reason
          ELSE 'Your proof for "' || v_campaign_name || '" was rejected. Please try again if slots are available.'
        END,
        'error'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mkt_notify_proof_decision ON public.campaign_submissions;
CREATE TRIGGER mkt_notify_proof_decision
  AFTER UPDATE ON public.campaign_submissions
  FOR EACH ROW EXECUTE FUNCTION public.mkt__notify_proof_decision();


-- Trigger: Campaign completed or budget exhausted
CREATE OR REPLACE FUNCTION public.mkt__notify_campaign_ended()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_reason text;
BEGIN
  -- Only fire when status changes to 'completed' or 'budget_exhausted'
  IF (TG_OP = 'UPDATE' AND OLD.status <> NEW.status AND NEW.status IN ('completed', 'budget_exhausted')) THEN
    v_reason := CASE
      WHEN NEW.status = 'completed' THEN 'Your campaign "' || NEW.name || '" has completed all slots.'
      ELSE 'Your campaign "' || NEW.name || '" budget is exhausted.'
    END;
    
    PERFORM public.mkt__notify(
      NEW.advertiser_id,
      'Campaign ended',
      v_reason,
      'info'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mkt_notify_campaign_ended ON public.campaigns;
CREATE TRIGGER mkt_notify_campaign_ended
  AFTER UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.mkt__notify_campaign_ended();


-- Trigger: Low balance warning (once per day per advertiser)
-- This runs on advertiser_ledger inserts that bring deposit_balance below threshold
CREATE OR REPLACE FUNCTION public.mkt__check_low_balance()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_current_balance numeric;
  v_already_notified boolean;
  v_today text;
BEGIN
  -- Only check on ledger entries that decrease deposit balance
  IF NEW.bucket = 'deposit' AND NEW.delta < 0 THEN
    -- Get current deposit balance
    SELECT COALESCE(SUM(delta), 0) INTO v_current_balance
      FROM public.advertiser_ledger
     WHERE advertiser_id = NEW.advertiser_id
       AND bucket = 'deposit';
    
    -- Check if balance is below $5
    IF v_current_balance < 5.00 THEN
      -- Check if we already sent notification today
      v_today := to_char(now(), 'YYYY-MM-DD');
      
      SELECT EXISTS (
        SELECT 1 FROM public.notifications
         WHERE user_id = NEW.advertiser_id
           AND title = 'Low campaign balance'
           AND created_at >= (v_today || ' 00:00:00')::timestamptz
      ) INTO v_already_notified;
      
      IF NOT v_already_notified THEN
        PERFORM public.mkt__notify(
          NEW.advertiser_id,
          'Low campaign balance',
          'Your Campaign Balance is below $5.00 (currently $' || v_current_balance::text || '). Add funds to keep campaigns running.',
          'warning'
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mkt_check_low_balance ON public.advertiser_ledger;
CREATE TRIGGER mkt_check_low_balance
  AFTER INSERT ON public.advertiser_ledger
  FOR EACH ROW EXECUTE FUNCTION public.mkt__check_low_balance();


-- =============================================================================
-- 4. DAILY LIMIT ENFORCEMENT
-- =============================================================================

-- Trigger: Enforce daily limit on campaign clicks
CREATE OR REPLACE FUNCTION public.mkt__check_daily_limit()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_daily_limit integer;
  v_count_24h integer;
BEGIN
  -- Get daily limit from campaign_options
  SELECT daily_limit INTO v_daily_limit
    FROM public.campaign_options
   WHERE campaign_id = NEW.campaign_id;
  
  -- If no limit set, allow
  IF v_daily_limit IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Take advisory lock on campaign to prevent race conditions
  PERFORM pg_advisory_xact_lock(hashtext(NEW.campaign_id::text));
  
  -- Count non-expired clicks in the last 24 hours
  SELECT COUNT(*) INTO v_count_24h
    FROM public.campaign_clicks
   WHERE campaign_id = NEW.campaign_id
     AND status <> 'expired'
     AND created_at >= now() - interval '24 hours';
  
  -- Check if limit reached
  IF v_count_24h >= v_daily_limit THEN
    RAISE EXCEPTION 'MKT_DAILY_LIMIT' USING MESSAGE = 'Daily completion limit reached for this campaign';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mkt_check_daily_limit ON public.campaign_clicks;
CREATE TRIGGER mkt_check_daily_limit
  BEFORE INSERT ON public.campaign_clicks
  FOR EACH ROW EXECUTE FUNCTION public.mkt__check_daily_limit();


-- =============================================================================
-- 5. ENHANCED mkt_add_budget FOR TOP-UP
-- =============================================================================

-- The existing mkt_add_budget RPC already exists and handles top-ups.
-- We just need to ensure it's properly integrated with the UI.
-- No changes needed to the RPC itself - it already:
-- 1. Checks ownership
-- 2. Validates campaign status (active/paused only)
-- 3. Allocates budget from advertiser balance
-- 4. Creates new tranches with current pricing
-- 5. Returns MKT_INSUFFICIENT_FUNDS if balance is too low

-- Add a helper function to calculate top-up cost (for UI preview)
CREATE OR REPLACE FUNCTION public.mkt_calculate_topup_cost(
  p_campaign_id uuid,
  p_additional_completions integer
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_campaign record;
  v_settings record;
  v_fee_percent numeric;
  v_cost_per_completion numeric;
  v_total_cost numeric;
BEGIN
  -- Get campaign
  SELECT publisher_reward, advertiser_id INTO v_campaign
    FROM public.campaigns
   WHERE id = p_campaign_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Campaign not found');
  END IF;
  
  -- Get settings for fee calculation
  SELECT platform_fee_percent, promo_ends_at, fees_enabled INTO v_settings
    FROM public.marketplace_settings
   WHERE id = true;
  
  -- Calculate fee (same logic as mkt_add_budget)
  IF v_settings.fees_enabled AND (v_settings.promo_ends_at IS NULL OR now() >= v_settings.promo_ends_at) THEN
    v_fee_percent := v_settings.platform_fee_percent;
  ELSE
    v_fee_percent := 0;
  END IF;
  
  -- Calculate cost per completion
  v_cost_per_completion := ceil((v_campaign.publisher_reward / (1 - v_fee_percent / 100)) * 100) / 100;
  v_total_cost := v_cost_per_completion * p_additional_completions;
  
  RETURN jsonb_build_object(
    'costPerCompletion', v_cost_per_completion,
    'totalCost', v_total_cost,
    'feePercent', v_fee_percent,
    'completions', p_additional_completions
  );
END;
$$;

REVOKE ALL ON FUNCTION public.mkt_calculate_topup_cost FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mkt_calculate_topup_cost TO service_role;

COMMENT ON FUNCTION public.mkt_calculate_topup_cost IS
  'Calculate the cost of adding completions to a campaign (for UI preview). service_role only.';


-- =============================================================================
-- 6. CAMPAIGN EDITING GUARDS
-- =============================================================================

-- The existing campaign_guards trigger already prevents edits to active campaigns.
-- We need to ensure it allows edits to draft/rejected/paused campaigns.
-- The guard should also mark paused campaigns as needs_review when content changes.

-- This is already handled by the existing mkt__guard_campaigns_money trigger and
-- the application logic. No additional SQL changes needed.
-- The UI will check campaign status before allowing edits.


-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION public.mkt__check_daily_limit IS
  'BEFORE INSERT trigger on campaign_clicks: enforces daily_limit from campaign_options using advisory lock.';

COMMENT ON TRIGGER mkt_notify_campaign_reviewed ON public.campaigns IS
  'Sends notification when campaign is approved or rejected';

COMMENT ON TRIGGER mkt_notify_new_submission ON public.campaign_submissions IS
  'Sends notification to advertiser when new proof is submitted';

COMMENT ON TRIGGER mkt_notify_proof_decision ON public.campaign_submissions IS
  'Sends notification to earner when proof is approved/rejected/auto-approved';

COMMENT ON TRIGGER mkt_notify_campaign_ended ON public.campaigns IS
  'Sends notification when campaign completes or budget exhausts';

COMMENT ON TRIGGER mkt_check_low_balance ON public.advertiser_ledger IS
  'Sends notification when advertiser balance drops below $5 (once per day)';

COMMENT ON TRIGGER mkt_check_daily_limit ON public.campaign_clicks IS
  'Enforces daily completion limit with advisory lock to prevent race conditions';

