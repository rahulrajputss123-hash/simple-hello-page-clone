-- ============================================================================
-- Migration: Network Chain Quest Type
-- ============================================================================
-- Adds "network" quest type where users complete offers from a pool of SDK
-- offerwall providers. Uses quest tokens as user IDs to track completions
-- without crediting the user's wallet (quest reward only).
--
-- NOTE: quest_type is TEXT with CHECK constraint, NOT an enum.
-- This migration is idempotent and safe to re-run.
-- ============================================================================

-- 1. Add 'network' to quest_type CHECK constraint
DO $$ BEGIN
  ALTER TABLE public.quests DROP CONSTRAINT IF EXISTS quests_quest_type_check;
  ALTER TABLE public.quests ADD CONSTRAINT quests_quest_type_check 
    CHECK (quest_type IN ('ads', 'shortlink', 'locker', 'checkin', 'feed_ptc', 'feed_shortlink', 'feed_article', 'network'));
END $$;

-- 2. Add network quest configuration columns to quests table
ALTER TABLE public.quests
  ADD COLUMN IF NOT EXISTS network_provider_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS required_count integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS min_qualifying_usd numeric(10,4) DEFAULT 0.01,
  ADD COLUMN IF NOT EXISTS token_ttl_hours integer DEFAULT 24,
  ADD COLUMN IF NOT EXISTS reward_hold_hours integer DEFAULT 0;

-- Constraints for network quest fields
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quests_required_count_check') THEN
    ALTER TABLE public.quests ADD CONSTRAINT quests_required_count_check 
      CHECK (required_count >= 1);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quests_min_qualifying_usd_check') THEN
    ALTER TABLE public.quests ADD CONSTRAINT quests_min_qualifying_usd_check 
      CHECK (min_qualifying_usd >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quests_network_token_ttl_hours_check') THEN
    ALTER TABLE public.quests ADD CONSTRAINT quests_network_token_ttl_hours_check 
      CHECK (token_ttl_hours > 0 AND token_ttl_hours <= 720);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quests_reward_hold_hours_check') THEN
    ALTER TABLE public.quests ADD CONSTRAINT quests_reward_hold_hours_check 
      CHECK (reward_hold_hours >= 0 AND reward_hold_hours <= 720);
  END IF;
END $$;

-- 3. Create quest_network_tokens table
CREATE TABLE IF NOT EXISTS public.quest_network_tokens (
  token text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.quest_sessions(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.sdk_offerwall_providers(id) ON DELETE CASCADE,
  quest_key text NOT NULL,
  kind text NOT NULL DEFAULT 'network' CHECK (kind IN ('network')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Partial unique index: one active token per (session, provider)
CREATE UNIQUE INDEX IF NOT EXISTS quest_network_tokens_session_provider_active_uniq
  ON public.quest_network_tokens (session_id, provider_id)
  WHERE (expires_at > now());

CREATE INDEX IF NOT EXISTS quest_network_tokens_user_idx
  ON public.quest_network_tokens (user_id);

CREATE INDEX IF NOT EXISTS quest_network_tokens_session_idx
  ON public.quest_network_tokens (session_id);

CREATE INDEX IF NOT EXISTS quest_network_tokens_expires_idx
  ON public.quest_network_tokens (expires_at);

-- RLS: service-role only
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quest_network_tokens TO authenticated;
GRANT ALL ON public.quest_network_tokens TO service_role;

ALTER TABLE public.quest_network_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quest_network_tokens' AND policyname = 'quest network tokens service role only') THEN
    CREATE POLICY "quest network tokens service role only" ON public.quest_network_tokens
      FOR ALL TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 4. Create quest_network_completions table
CREATE TABLE IF NOT EXISTS public.quest_network_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.quest_sessions(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.sdk_offerwall_providers(id) ON DELETE CASCADE,
  conversion_id uuid NOT NULL REFERENCES public.sdk_offerwall_conversions(id) ON DELETE CASCADE,
  step_index integer NOT NULL,
  kind text NOT NULL DEFAULT 'network' CHECK (kind IN ('network')),
  amount_usd numeric(10,4) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint: each provider counts once per session
CREATE UNIQUE INDEX IF NOT EXISTS quest_network_completions_session_provider_uniq
  ON public.quest_network_completions (session_id, provider_id)
  WHERE (kind = 'network');

-- Unique constraint: step_index per session
CREATE UNIQUE INDEX IF NOT EXISTS quest_network_completions_session_step_uniq
  ON public.quest_network_completions (session_id, step_index)
  WHERE (kind = 'network');

-- Indexes
CREATE INDEX IF NOT EXISTS quest_network_completions_session_idx
  ON public.quest_network_completions (session_id);

CREATE INDEX IF NOT EXISTS quest_network_completions_conversion_idx
  ON public.quest_network_completions (conversion_id);

-- RLS: service-role only
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quest_network_completions TO authenticated;
GRANT ALL ON public.quest_network_completions TO service_role;

ALTER TABLE public.quest_network_completions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quest_network_completions' AND policyname = 'quest network completions service role only') THEN
    CREATE POLICY "quest network completions service role only" ON public.quest_network_completions
      FOR ALL TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 5. Extend sdk_offerwall_conversions status to include 'quest_absorbed'
-- NOTE: DO NOT DROP OR RECREATE sdk_offerwall_conversions_status_check!
-- The live database has existing CHECK constraints and 67 'rejected' rows.
-- This is idempotent - if the constraint already includes quest_absorbed, this is a no-op.
DO $$ 
DECLARE
  constraint_def text;
BEGIN
  -- Check if quest_absorbed is already in the constraint
  SELECT pg_get_constraintdef(oid) INTO constraint_def
  FROM pg_constraint
  WHERE conname = 'sdk_offerwall_conversions_status_check'
    AND conrelid = 'public.sdk_offerwall_conversions'::regclass;
  
  -- Only modify if quest_absorbed is not present
  IF constraint_def IS NOT NULL AND constraint_def NOT LIKE '%quest_absorbed%' THEN
    ALTER TABLE public.sdk_offerwall_conversions DROP CONSTRAINT sdk_offerwall_conversions_status_check;
    ALTER TABLE public.sdk_offerwall_conversions ADD CONSTRAINT sdk_offerwall_conversions_status_check 
      CHECK (status IN ('pending', 'credited', 'rejected', 'duplicate', 'reversed', 'quest_absorbed'));
  END IF;
END $$;

-- Comments
COMMENT ON TABLE public.quest_network_tokens IS
  'Quest tokens used as user IDs for network quests. Allows tracking completions without crediting the user wallet.';

COMMENT ON COLUMN public.quest_network_tokens.token IS
  'Secret token used as user ID in offerwall URLs. Format: "q_" + 24 random url-safe chars.';

COMMENT ON COLUMN public.quest_network_tokens.kind IS
  'Token type. Always "network" for network quest tokens. Future: may add other quest token types.';

COMMENT ON TABLE public.quest_network_completions IS
  'Tracks which providers have been completed in each network quest session. UNIQUE per (session, provider).';

COMMENT ON COLUMN public.quest_network_completions.step_index IS
  'Completion order (1-based). Determines which step reward to pay. Assigned atomically on insert.';

COMMENT ON COLUMN public.quest_network_completions.kind IS
  'Completion type. Always "network" for network quest completions.';

COMMENT ON COLUMN public.quests.network_provider_ids IS
  'Pool of sdk_offerwall_provider UUIDs for network quests. Admin picks N providers, user must complete K.';

COMMENT ON COLUMN public.quests.required_count IS
  'Number of distinct providers that must be completed to finish the quest. Must be <= pool size.';

COMMENT ON COLUMN public.quests.min_qualifying_usd IS
  'Minimum offer payout in USD to count toward quest completion. Filters out PTC/shortlink micro-payouts. Default 0.01.';

COMMENT ON COLUMN public.quests.token_ttl_hours IS
  'Hours before a quest token expires. Default 24h. Reissued on each openQuestNetwork call.';

COMMENT ON COLUMN public.quests.reward_hold_hours IS
  'Optional delay before releasing quest reward. Protects against chargebacks. 0 = instant (default).';
