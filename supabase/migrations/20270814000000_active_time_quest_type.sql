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
CREATE OR REPLACE FUNCTION public.claim_active_time_quest_reward(
  p_user_id uuid,
  p_quest_key text,
  p_target_seconds integer,
  p_reward_amount numeric
)
RETURNS TABLE (
  success boolean,
  reason text,
  total_seconds integer,
  credited_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_progress record;
  v_session_id uuid;
  v_quest_label text;
BEGIN
  -- Lock the progress row for this user+quest
  SELECT * INTO v_progress
  FROM public.quest_active_time_progress
  WHERE user_id = p_user_id AND quest_key = p_quest_key
  FOR UPDATE;
  
  -- Check if row exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'progress_not_found'::text, 0, null::timestamptz;
    RETURN;
  END IF;
  
  -- Check if already credited
  IF v_progress.credited_at IS NOT NULL THEN
    RETURN QUERY SELECT false, 'already_credited'::text, v_progress.total_seconds, v_progress.credited_at;
    RETURN;
  END IF;
  
  -- Check if target reached
  IF v_progress.total_seconds < p_target_seconds THEN
    RETURN QUERY SELECT false, 'target_not_reached'::text, v_progress.total_seconds, null::timestamptz;
    RETURN;
  END IF;
  
  -- Find or create active session
  SELECT id, quests.label INTO v_session_id, v_quest_label
  FROM public.quest_sessions
  JOIN public.quests ON quests.key = quest_sessions.quest_key
  WHERE quest_sessions.user_id = p_user_id 
    AND quest_sessions.quest_key = p_quest_key
    AND quest_sessions.status = 'started'
  ORDER BY quest_sessions.started_at DESC
  LIMIT 1;
  
  -- Create session if none exists
  IF v_session_id IS NULL THEN
    SELECT label INTO v_quest_label FROM public.quests WHERE key = p_quest_key;
    
    INSERT INTO public.quest_sessions (user_id, quest_key, quest_type, status, started_at)
    VALUES (p_user_id, p_quest_key, 'active_time', 'started', now())
    RETURNING id INTO v_session_id;
  END IF;
  
  -- Mark as credited (atomic)
  UPDATE public.quest_active_time_progress
  SET credited_at = now(), updated_at = now()
  WHERE user_id = p_user_id AND quest_key = p_quest_key AND credited_at IS NULL;
  
  -- Check if update succeeded (another process may have claimed it)
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'already_credited'::text, v_progress.total_seconds, v_progress.credited_at;
    RETURN;
  END IF;
  
  -- Mark session as verified and credit wallet
  UPDATE public.quest_sessions
  SET status = 'verified', verified_at = now()
  WHERE id = v_session_id AND status = 'started';
  
  -- Credit wallet
  INSERT INTO public.ledger_entries (
    user_id, amount, entry_type, category, description, metadata, quest_session_id
  ) VALUES (
    p_user_id,
    p_reward_amount,
    'credit',
    'quest',
    'Active Time Quest: ' || COALESCE(v_quest_label, p_quest_key),
    jsonb_build_object('quest_key', p_quest_key, 'seconds', v_progress.total_seconds),
    v_session_id
  );
  
  -- Update wallet balance
  UPDATE public.profiles
  SET balance = balance + p_reward_amount
  WHERE id = p_user_id;
  
  RETURN QUERY SELECT true, 'success'::text, v_progress.total_seconds, now();
END;
$$;

COMMENT ON FUNCTION public.claim_active_time_quest_reward IS
  'Atomically pays out active time quest reward exactly once. Uses row-level locking.';

-- Grant execute to service role only
REVOKE ALL ON FUNCTION public.claim_active_time_quest_reward FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_active_time_quest_reward TO service_role;
