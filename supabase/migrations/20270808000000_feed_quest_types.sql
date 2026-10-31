-- ============================================================================
-- Migration: Feed Quest Types (PTC, Shortlink, Article)
-- ============================================================================
-- Adds "feed_ptc", "feed_shortlink", "feed_article" quest types that build
-- steps dynamically from network feeds. Uses per-step rewards + quest tokens.
--
-- NOTE: quest_type is TEXT with CHECK constraint, NOT an enum.
-- This migration is idempotent and safe to re-run.
-- ============================================================================

-- 1. Add feed quest types to CHECK constraint
-- The constraint name is quests_quest_type_check
DO $$ BEGIN
  -- Drop and recreate the constraint to add new values
  ALTER TABLE public.quests DROP CONSTRAINT IF EXISTS quests_quest_type_check;
  ALTER TABLE public.quests ADD CONSTRAINT quests_quest_type_check 
    CHECK (quest_type IN ('ads', 'shortlink', 'locker', 'checkin', 'feed_ptc', 'feed_shortlink', 'feed_article'));
END $$;

-- 2. Add feed quest configuration columns to quests table
ALTER TABLE public.quests
  ADD COLUMN IF NOT EXISTS feed_kind text,
  ADD COLUMN IF NOT EXISTS steps_count integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS backup_count integer DEFAULT 4,
  ADD COLUMN IF NOT EXISTS feed_provider_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS min_reward_usd numeric(10,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_completion_rate integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS max_per_network integer,
  ADD COLUMN IF NOT EXISTS blocked_domains text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS token_ttl_hours integer DEFAULT 48;

-- Constraints for feed quest fields
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quests_feed_kind_check') THEN
    ALTER TABLE public.quests ADD CONSTRAINT quests_feed_kind_check 
      CHECK (feed_kind IN ('ptc', 'shortlink', 'article') OR feed_kind IS NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quests_steps_count_check') THEN
    ALTER TABLE public.quests ADD CONSTRAINT quests_steps_count_check 
      CHECK (steps_count BETWEEN 1 AND 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quests_backup_count_check') THEN
    ALTER TABLE public.quests ADD CONSTRAINT quests_backup_count_check 
      CHECK (backup_count >= 0 AND backup_count <= 50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quests_min_reward_usd_check') THEN
    ALTER TABLE public.quests ADD CONSTRAINT quests_min_reward_usd_check 
      CHECK (min_reward_usd >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quests_min_completion_rate_check') THEN
    ALTER TABLE public.quests ADD CONSTRAINT quests_min_completion_rate_check 
      CHECK (min_completion_rate >= 0 AND min_completion_rate <= 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quests_token_ttl_hours_check') THEN
    ALTER TABLE public.quests ADD CONSTRAINT quests_token_ttl_hours_check 
      CHECK (token_ttl_hours > 0 AND token_ttl_hours <= 720);
  END IF;
END $$;

-- 3. Add step_index to quest_network_tokens (for feed quest steps)
ALTER TABLE public.quest_network_tokens
  ADD COLUMN IF NOT EXISTS step_index integer,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS campaign_id text;

-- Create unique constraint on (session_id, step_index) for feed quests
CREATE UNIQUE INDEX IF NOT EXISTS quest_network_tokens_session_step_uniq
  ON public.quest_network_tokens (session_id, step_index)
  WHERE step_index IS NOT NULL;

-- Index for looking up tokens by session and step
CREATE INDEX IF NOT EXISTS quest_network_tokens_session_step_idx
  ON public.quest_network_tokens (session_id, step_index)
  WHERE step_index IS NOT NULL;

-- 4. Add feed_snapshot to quest_sessions (stores ranked campaigns)
ALTER TABLE public.quest_sessions
  ADD COLUMN IF NOT EXISTS feed_snapshot jsonb;

COMMENT ON COLUMN public.quest_sessions.feed_snapshot IS
  'Feed quest snapshot: array of {source, campaignId, title, rewardUsd, duration, completionRate, url, backup}. Stable ranking for the session.';

-- 5. Add is_enabled flag to sdk_offerwall_providers
ALTER TABLE public.sdk_offerwall_providers
  ADD COLUMN IF NOT EXISTS is_enabled boolean DEFAULT true;

COMMENT ON COLUMN public.sdk_offerwall_providers.is_enabled IS
  'Whether this provider is enabled for feed quests. Disabled providers are skipped.';

-- Comments
COMMENT ON COLUMN public.quests.feed_kind IS
  'Feed quest type: "ptc", "shortlink", or "article". Determines which feed endpoint to call.';

COMMENT ON COLUMN public.quests.steps_count IS
  'Number of main steps (campaigns) to include in the feed quest. Default 10.';

COMMENT ON COLUMN public.quests.backup_count IS
  'Number of backup campaigns to snapshot in case main campaigns become unavailable. Default 4.';

COMMENT ON COLUMN public.quests.feed_provider_ids IS
  'UUIDs of sdk_offerwall_providers to pull feeds from. Merged and ranked together.';

COMMENT ON COLUMN public.quests.min_reward_usd IS
  'Minimum reward in USD to include a campaign. Filters low-paying offers.';

COMMENT ON COLUMN public.quests.min_completion_rate IS
  'Minimum completion rate (0-100) for shortlink campaigns. Default 50%.';

COMMENT ON COLUMN public.quests.max_per_network IS
  'Maximum campaigns from a single network. NULL = unlimited. Ensures diversity.';

COMMENT ON COLUMN public.quests.blocked_domains IS
  'Array of domain names to exclude (e.g. ["spam.com"]). Filters unwanted campaigns.';

COMMENT ON COLUMN public.quests.token_ttl_hours IS
  'Hours before a quest token expires. Re-issued on step reopen. Default 48h.';

COMMENT ON COLUMN public.quest_network_tokens.step_index IS
  'Step number (1-based) for feed quest tokens. NULL for non-feed quests.';

COMMENT ON COLUMN public.quest_network_tokens.source IS
  'Feed source identifier (e.g. "offerwall.me", "bitcotasks"). Used to match postbacks.';

COMMENT ON COLUMN public.quest_network_tokens.campaign_id IS
  'External campaign ID from the feed provider. Used to match postbacks.';

