-- ============================================================================
-- Migration: Product Analytics Event System
-- Date: 2027-08-20
-- Purpose: Lightweight event tracking for user flow analysis (funnel, drop-off)
-- ============================================================================

-- Create app_events table for product analytics
CREATE TABLE IF NOT EXISTS public.app_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  anon_id text NULL,
  country text NULL,
  device text NULL,
  page text NULL,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for efficient analytics queries
CREATE INDEX IF NOT EXISTS idx_app_events_event_created 
  ON public.app_events (event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_app_events_country_created 
  ON public.app_events (country, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_app_events_user_created 
  ON public.app_events (user_id, created_at DESC) 
  WHERE user_id IS NOT NULL;

-- Enable RLS (insert only through server function, no direct access)
ALTER TABLE public.app_events ENABLE ROW LEVEL SECURITY;

-- No policies for direct insert/select - all access through server functions
-- Admins will use service_role functions to query

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.app_events TO service_role;

-- Revoke direct access from anon and authenticated
REVOKE ALL ON public.app_events FROM anon, authenticated;

COMMENT ON TABLE public.app_events IS 
  'Product analytics events for user flow tracking. Insert via trackEventsImpl server function only. No PII allowed.';

COMMENT ON COLUMN public.app_events.event_name IS 
  'Event name from allow-list (session_start, page_view, offer_click, etc.)';

COMMENT ON COLUMN public.app_events.anon_id IS 
  'Anonymous user ID from localStorage for tracking unauth users';

COMMENT ON COLUMN public.app_events.device IS 
  'Device category only: android, ios, or desktop';

COMMENT ON COLUMN public.app_events.page IS 
  'Route path without query strings or tokens';

COMMENT ON COLUMN public.app_events.properties IS 
  'Event metadata (max 2KB). Must not contain PII, emails, phones, IPs, or auth tokens.';

-- ============================================================================
-- Daily cleanup: Delete events older than 90 days
-- ============================================================================

-- Check if pg_cron extension is available and schedule cleanup
DO $cleanup$ 
DECLARE
  has_pg_cron boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) INTO has_pg_cron;

  IF has_pg_cron THEN
    -- Schedule daily cleanup at 2 AM UTC
    PERFORM cron.schedule(
      'cleanup-old-app-events',
      '0 2 * * *',
      $job$DELETE FROM public.app_events WHERE created_at < now() - interval '90 days'$job$
    );
    
    RAISE NOTICE 'pg_cron job scheduled: cleanup-old-app-events';
  ELSE
    RAISE NOTICE 'pg_cron not available. Use /api/cron/cleanup-events route for manual cleanup.';
  END IF;
END $cleanup$;
