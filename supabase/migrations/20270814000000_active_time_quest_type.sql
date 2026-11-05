-- ============================================================================
-- Migration: Active Time Quest Type
-- ============================================================================
-- Adds "active_time" quest type where users earn rewards after X cumulative
-- minutes of active app use across sessions. Server-authoritative time tracking
-- with ping tokens, grace periods for offers, and daily caps.
--
-- Features:
-- - Ping-based tracking (30s intervals, server credits min(gap, 35s))
-- - One-time tokens prevent replay attacks
-- - Grace periods when user clicks offers (count background time)
-- - Daily cap on counted seconds
-- - Atomic reward payout via Postgres function
--
-- NOTE: quest_type is TEXT with CHECK constraint, NOT an enum.
-- This migration is idempotent and safe to re-run.
-- ============================================================================

-- 1. Add 'active_time' to quest_type CHECK constraint
DO $$ 
DECLARE
  constraint_def text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO constraint_def
  FROM pg_constraint
  WHERE conname = 'quests_quest_type_check'
    AND conrelid = 'public.quests'::regclass;
  
  -- Only modify if active_time is not present
  IF constraint_def IS NOT NULL AND constraint_def NOT LIKE '%active_time%' THEN
    ALTER TABLE public.quests DROP CONSTRAINT quests_quest_type_check;
    ALTER TABLE public.quests ADD CONSTRAINT quests_quest_type_check 
      CHECK (quest_type IN (
        'ads', 'shortlink', 'locker', 'checkin', 
        'feed_ptc', 'feed_shortlink', 'feed_article', 
        'network', 'survey', 'timed_ptc', 'active_time'
      ));
  END IF;
END $$;

-- 2. Add active_time quest configuration columns to quests table
ALTER TABLE public.quests
  ADD COLUMN IF NOT EXISTS target_minutes integer DEFAULT 60,
  ADD COLUMN IF NOT EXISTS daily_cap_minutes integer DEFAULT 120,
  ADD COLUMN IF NOT EXISTS grace_minutes integer DEFAULT 10;

-- Constraints for active_time quest fields
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quests_target_minutes_check') THEN
    ALTER TABLE public.quests ADD CONSTRAINT quests_target_minutes_check 
      CHECK (target_minutes >= 1 AND target_minutes <= 1440);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quests_daily_cap_minutes_check') THEN
    ALTER TABLE public.quests ADD CONSTRAINT quests_daily_cap_minutes_check 
      CHECK (daily_cap_minutes >= 1 AND daily_cap_minutes <= 1440);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quests_grace_minutes_check') THEN
    ALTER TABLE public.quests ADD CONSTRAINT quests_grace_minutes_check 
      CHECK (grace_minutes >= 0 AND grace_minutes <= 60);
  END IF;
END $$;

-- 3. Create quest_active_time_progress table
-- Stores cumulative active time per user per quest (server-authoritative)
CREATE TABLE IF NOT EXISTS public.quest_active_time_progress (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quest_key text NOT NULL,
  total_seconds integer NOT NULL DEFAULT 0,
  today_seconds integer NOT NULL DEFAULT 0,
  today_date date NOT NULL DEFAULT CURRENT_DATE,
  last_ping_at timestamptz,
  last_ping_token text,
  grace_until timestamptz,
  grace_offer_id text,
  grace_count_hour integer NOT NULL DEFAULT 0,
  grace_hour_start timestamptz,
  credited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, quest_key)
);

-- Indexes for queries
CREATE INDEX IF NOT EXISTS quest_active_time_progress_quest_key_idx
  ON public.quest_active_time_progress (quest_key);

CREATE INDEX IF NOT EXISTS quest_active_time_progress_grace_until_idx
  ON public.quest_active_time_progress (grace_until)
  WHERE grace_until IS NOT NULL;

-- RLS: Users can read their own progress, only service role can write
ALTER TABLE public.quest_active_time_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quest_active_time_progress_select ON public.quest_active_time_progress;
CREATE POLICY quest_active_time_progress_select
  ON public.quest_active_time_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS quest_active_time_progress_service_all ON public.quest_active_time_progress;
CREATE POLICY quest_active_time_progress_service_all
  ON public.quest_active_time_progress
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Create quest_active_time_grace_history table
-- Tracks grace period usage (offer clicks) for rate limiting
CREATE TABLE IF NOT EXISTS public.quest_active_time_grace_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quest_key text NOT NULL,
  offer_id text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  seconds_credited integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for grace lookups
CREATE INDEX IF NOT EXISTS quest_active_time_grace_history_user_quest_idx
  ON public.quest_active_time_grace_history (user_id, quest_key, started_at DESC);

CREATE INDEX IF NOT EXISTS quest_active_time_grace_history_offer_idx
  ON public.quest_active_time_grace_history (user_id, quest_key, offer_id, started_at DESC);

-- RLS: Service role only
ALTER TABLE public.quest_active_time_grace_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quest_active_time_grace_history_service_all ON public.quest_active_time_grace_history;
CREATE POLICY quest_active_time_grace_history_service_all
  ON public.quest_active_time_grace_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Atomic reward payout function
-- Ensures reward is paid exactly once even with concurrent calls
-- Note: Actual wallet credit happens in app code via creditWallet helper
CREATE OR REPLACE FUNCTION public.claim_active_time_quest_reward(
  p_user_id uuid,
  p_quest_key text
)
RETURNS TABLE (
  success boolean,
  reason text,
  reward_amount numeric,
  accumulated_seconds integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_progress record;
  v_quest record;
  v_target_seconds integer;
BEGIN
  -- Lock the progress row for this user+quest
  SELECT * INTO v_progress
  FROM public.quest_active_time_progress
  WHERE user_id = p_user_id AND quest_key = p_quest_key
  FOR UPDATE;
  
  -- Check if row exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'progress_not_found'::text, 0::numeric, 0;
    RETURN;
  END IF;
  
  -- Check if already credited
  IF v_progress.credited_at IS NOT NULL THEN
    RETURN QUERY SELECT false, 'already_claimed'::text, 0::numeric, v_progress.accumulated_seconds;
    RETURN;
  END IF;
  
  -- Get quest config
  SELECT target_minutes, reward_amount INTO v_quest
  FROM public.quests
  WHERE key = p_quest_key AND quest_type = 'active_time' AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'quest_not_found'::text, 0::numeric, 0;
    RETURN;
  END IF;
  
  v_target_seconds := v_quest.target_minutes * 60;
  
  -- Check if target reached
  IF v_progress.accumulated_seconds < v_target_seconds THEN
    RETURN QUERY SELECT false, 'target_not_reached'::text, 0::numeric, v_progress.accumulated_seconds;
    RETURN;
  END IF;
  
  -- Mark as credited (actual wallet credit happens in app code)
  UPDATE public.quest_active_time_progress
  SET credited_at = now(), updated_at = now()
  WHERE user_id = p_user_id AND quest_key = p_quest_key;
  
  RETURN QUERY SELECT true, 'claimed'::text, v_quest.reward_amount, v_progress.accumulated_seconds;
END;
$$;

COMMENT ON FUNCTION public.claim_active_time_quest_reward IS
  'Atomically marks active time quest as claimed. Uses row-level locking. Wallet credit happens in app code.';

-- Grant execute to service role only
REVOKE ALL ON FUNCTION public.claim_active_time_quest_reward FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_active_time_quest_reward TO service_role;

