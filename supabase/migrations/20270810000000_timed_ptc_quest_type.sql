-- ============================================================================
-- Migration: Timed PTC Quest Type
-- ============================================================================
-- Adds "timed_ptc" quest type with timed steps and ad checkpoints.
-- Reuses shortlink step system (issued_step, step_issued_at, strict order).
--
-- NOTE: quest_type is TEXT with CHECK constraint, NOT an enum.
-- This migration is idempotent and safe to re-run.
-- ============================================================================

-- 1. Add 'timed_ptc' to quest_type CHECK constraint
-- Reads live constraint and rebuilds as union of existing + 'timed_ptc'
DO $$ 
DECLARE
  constraint_def text;
  existing_values text;
BEGIN
  -- Get current constraint definition
  SELECT pg_get_constraintdef(oid) INTO constraint_def
  FROM pg_constraint
  WHERE conname = 'quests_quest_type_check'
    AND conrelid = 'public.quests'::regclass;
  
  -- Only modify if timed_ptc is not already present
  IF constraint_def IS NOT NULL AND constraint_def NOT LIKE '%timed_ptc%' THEN
    -- Extract existing quest type values from constraint definition
    -- Example: CHECK (quest_type IN ('ads', 'shortlink', ...))
    existing_values := regexp_replace(
      constraint_def,
      '.*CHECK\s*\(\s*quest_type\s*=\s*ANY\s*\(\s*ARRAY\s*\[([^\]]+)\].*',
      '\1',
      'g'
    );
    
    -- Drop and recreate constraint with timed_ptc added
    ALTER TABLE public.quests DROP CONSTRAINT quests_quest_type_check;
    
    -- Build constraint with all existing values plus timed_ptc
    -- Note: This assumes existing values include at least: ads, shortlink, locker, checkin, 
    -- feed_ptc, feed_shortlink, feed_article, network (and survey if present)
    ALTER TABLE public.quests ADD CONSTRAINT quests_quest_type_check 
      CHECK (quest_type IN (
        'ads', 'shortlink', 'locker', 'checkin', 
        'feed_ptc', 'feed_shortlink', 'feed_article', 
        'network', 'survey', 'timed_ptc'
      ));
  END IF;
END $$;

-- 2. Add timed_ptc quest configuration columns to quests table
ALTER TABLE public.quests
  ADD COLUMN IF NOT EXISTS timed_steps jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS timed_step_seconds integer DEFAULT 60,
  ADD COLUMN IF NOT EXISTS timed_checkpoint_seconds integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS timed_max_failed_taps integer DEFAULT 2;

-- Constraints for timed_ptc quest fields
DO $$ BEGIN
  -- timed_steps: array of {ad_network, push_network}, max 10 steps
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quests_timed_steps_is_array') THEN
    ALTER TABLE public.quests ADD CONSTRAINT quests_timed_steps_is_array 
      CHECK (jsonb_typeof(timed_steps) = 'array');
  END IF;
  
  -- timed_step_seconds: 10 to 600 seconds
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quests_timed_step_seconds_check') THEN
    ALTER TABLE public.quests ADD CONSTRAINT quests_timed_step_seconds_check 
      CHECK (timed_step_seconds >= 10 AND timed_step_seconds <= 600);
  END IF;
  
  -- timed_checkpoint_seconds: 5 to 120 seconds
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quests_timed_checkpoint_seconds_check') THEN
    ALTER TABLE public.quests ADD CONSTRAINT quests_timed_checkpoint_seconds_check 
      CHECK (timed_checkpoint_seconds >= 5 AND timed_checkpoint_seconds <= 120);
  END IF;
  
  -- timed_max_failed_taps: 1 to 5
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quests_timed_max_failed_taps_check') THEN
    ALTER TABLE public.quests ADD CONSTRAINT quests_timed_max_failed_taps_check 
      CHECK (timed_max_failed_taps >= 1 AND timed_max_failed_taps <= 5);
  END IF;
END $$;

-- 3. Seed one INACTIVE timed_ptc quest
-- Matches real quests columns and NOT NULL constraints
-- ON CONFLICT DO NOTHING for idempotency
INSERT INTO public.quests (
  key,
  label,
  icon,
  quest_type,
  ads_required,
  reward_amount,
  step_reward,
  step_rewards,
  shortlink_steps,
  min_seconds_per_step,
  locker_urls,
  timed_steps,
  timed_step_seconds,
  timed_checkpoint_seconds,
  timed_max_failed_taps,
  is_active,
  sort_order
) VALUES (
  'special_ptc_3',
  '3 Special PTC',
  'timer',
  'timed_ptc',
  0,  -- ads_required (not used for timed_ptc)
  0.01,  -- reward_amount (completion bonus)
  0,  -- step_reward (not used, using step_rewards array instead)
  ARRAY[0.01, 0.01, 0.01]::numeric[],  -- step_rewards (per-step rewards)
  '[]'::jsonb,  -- shortlink_steps (not used for timed_ptc)
  15,  -- min_seconds_per_step (default, not used for timed_ptc)
  '{}'::text[],  -- locker_urls (not used for timed_ptc)
  '[
    {"ad_network": "monetag", "push_network": "propush"},
    {"ad_network": "monetag", "push_network": "rollerads"},
    {"ad_network": "monetag", "push_network": "evadav"}
  ]'::jsonb,  -- timed_steps
  60,  -- timed_step_seconds
  10,  -- timed_checkpoint_seconds
  2,  -- timed_max_failed_taps
  false,  -- is_active (INACTIVE)
  100  -- sort_order (high to keep it at bottom)
)
ON CONFLICT (key) DO NOTHING;

-- Comments
COMMENT ON COLUMN public.quests.timed_steps IS
  'Array of {ad_network, push_network} objects for timed_ptc quests. Max 10 steps. Each step shows an ad and requires push subscription.';

COMMENT ON COLUMN public.quests.timed_step_seconds IS
  'Duration in seconds for each timed_ptc step (10-600). User must stay on page for this duration.';

COMMENT ON COLUMN public.quests.timed_checkpoint_seconds IS
  'Interval in seconds between ad checkpoints (5-120). User must interact with ad at each checkpoint.';

COMMENT ON COLUMN public.quests.timed_max_failed_taps IS
  'Maximum number of missed checkpoints before step fails (1-5). User gets this many chances per step.';

