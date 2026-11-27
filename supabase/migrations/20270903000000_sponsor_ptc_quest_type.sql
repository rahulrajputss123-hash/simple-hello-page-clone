-- ============================================================================
-- Migration: Sponsor PTC Quest Type
-- ============================================================================
-- Adds "sponsor_ptc" quest type: multi-step PTC quests where each step is a
-- landing page on its own sub-domain. Users must complete N visits per step,
-- spending required seconds on sponsor pages.
--
-- Features:
-- - Handoff tokens (single-use, 10min expiry) for secure cross-domain transfer
-- - Session tokens (45min expiry) for visit tracking
-- - Visit tracking with open/close timestamps
-- - Sequential step progression
-- - Per-step rewards + final bonus
--
-- NOTE: quest_type is TEXT with CHECK constraint, NOT an enum.
-- This migration is idempotent and safe to re-run.
-- ============================================================================

-- 1. Add 'sponsor_ptc' to quest_type CHECK constraint
-- Reads live constraint and rebuilds as union of existing + 'sponsor_ptc'
DO $$ 
DECLARE
  constraint_def text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO constraint_def
  FROM pg_constraint
  WHERE conname = 'quests_quest_type_check'
    AND conrelid = 'public.quests'::regclass;
  
  -- Only modify if sponsor_ptc is not present
  IF constraint_def IS NOT NULL AND constraint_def NOT LIKE '%sponsor_ptc%' THEN
    ALTER TABLE public.quests DROP CONSTRAINT quests_quest_type_check;
    
    -- Build constraint with all existing values plus sponsor_ptc
    ALTER TABLE public.quests ADD CONSTRAINT quests_quest_type_check 
      CHECK (quest_type IN (
        'ads', 'shortlink', 'locker', 'checkin', 
        'feed_ptc', 'feed_shortlink', 'feed_article', 
        'network', 'survey', 'timed_ptc', 'active_time', 'sponsor_ptc'
      ));
  END IF;
END $$;

-- 2. Add sponsor_ptc configuration columns to quests table
ALTER TABLE public.quests
  ADD COLUMN IF NOT EXISTS sponsor_steps jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS sponsor_visits integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS sponsor_visit_seconds integer DEFAULT 20;

-- Constraints for sponsor_ptc fields
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quests_sponsor_visits_check') THEN
    ALTER TABLE public.quests ADD CONSTRAINT quests_sponsor_visits_check 
      CHECK (sponsor_visits >= 1 AND sponsor_visits <= 10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quests_sponsor_visit_seconds_check') THEN
    ALTER TABLE public.quests ADD CONSTRAINT quests_sponsor_visit_seconds_check 
      CHECK (sponsor_visit_seconds >= 5 AND sponsor_visit_seconds <= 300);
  END IF;
END $$;

-- 3. Create sponsor_ptc_sessions table
-- Stores per-step session state for sponsor PTC quests
CREATE TABLE IF NOT EXISTS public.sponsor_ptc_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quest_id uuid NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  quest_session_id uuid NOT NULL REFERENCES public.quest_sessions(id) ON DELETE CASCADE,
  step_index integer NOT NULL,
  host text NOT NULL,
  handoff_hash text UNIQUE,
  handoff_used_at timestamptz,
  session_hash text UNIQUE,
  session_expires_at timestamptz,
  visits jsonb NOT NULL DEFAULT '[]',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sponsor_ptc_sessions_step_index_check CHECK (step_index >= 1 AND step_index <= 5)
);

-- Indexes for queries
CREATE INDEX IF NOT EXISTS sponsor_ptc_sessions_user_idx
  ON public.sponsor_ptc_sessions (user_id, quest_session_id);

CREATE INDEX IF NOT EXISTS sponsor_ptc_sessions_handoff_hash_idx
  ON public.sponsor_ptc_sessions (handoff_hash)
  WHERE handoff_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS sponsor_ptc_sessions_session_hash_idx
  ON public.sponsor_ptc_sessions (session_hash)
  WHERE session_hash IS NOT NULL;

-- RLS: Service role only (no direct user access)
ALTER TABLE public.sponsor_ptc_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sponsor_ptc_sessions_service_all ON public.sponsor_ptc_sessions;
CREATE POLICY sponsor_ptc_sessions_service_all
  ON public.sponsor_ptc_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Seed an INACTIVE sponsor_ptc quest for testing
-- Only insert columns that are NOT NULL without defaults, plus sponsor-specific fields
INSERT INTO public.quests (
  key,
  label,
  icon,
  quest_type,
  reward_amount,
  step_reward,
  step_rewards,
  sponsor_steps,
  sponsor_visits,
  sponsor_visit_seconds,
  is_active,
  sort_order
) VALUES (
  'sponsor_ptc_3',
  '3 Sponsor PTC',
  'dollar-sign',
  'sponsor_ptc',
  0.01,
  0.01,
  ARRAY[0.01, 0.01, 0.01]::numeric[],
  '[
    {
      "host": "quest1.cashgpt.in",
      "content_key": "special_missions",
      "smartlink_url": "",
      "push_network": "propush"
    },
    {
      "host": "quest2.cashgpt.in",
      "content_key": "marketplace",
      "smartlink_url": "",
      "push_network": "evadav"
    },
    {
      "host": "quest3.cashgpt.in",
      "content_key": "surveys_offers",
      "smartlink_url": "",
      "push_network": "none"
    }
  ]'::jsonb,
  3,
  20,
  false,
  999
)
ON CONFLICT (key) DO NOTHING;

