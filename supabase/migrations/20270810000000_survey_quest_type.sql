-- ============================================================================
-- Migration: Survey Quest Type
-- ============================================================================
-- Adds "survey" quest type that mixes surveys from CPX Research, TheoremReach,
-- and Timewall. Users complete surveys from any network, earning step rewards
-- plus a final completion bonus.
--
-- NOTE: quest_type is TEXT with CHECK constraint, NOT an enum.
-- This migration is idempotent and safe to re-run.
-- ============================================================================

-- 1. Add survey quest columns to quests table
ALTER TABLE public.quests
  ADD COLUMN IF NOT EXISTS required_surveys integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS allowed_networks text[] DEFAULT ARRAY['cpxresearch', 'theoremreach', 'timewall']::text[],
  ADD COLUMN IF NOT EXISTS min_payout_usd numeric(10,4),
  ADD COLUMN IF NOT EXISTS max_loi integer;

-- Constraints for survey quest fields
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quests_required_surveys_check') THEN
    ALTER TABLE public.quests ADD CONSTRAINT quests_required_surveys_check 
      CHECK (required_surveys BETWEEN 1 AND 10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quests_max_loi_check') THEN
    ALTER TABLE public.quests ADD CONSTRAINT quests_max_loi_check 
      CHECK (max_loi IS NULL OR max_loi > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quests_min_payout_usd_check') THEN
    ALTER TABLE public.quests ADD CONSTRAINT quests_min_payout_usd_check 
      CHECK (min_payout_usd IS NULL OR min_payout_usd >= 0);
  END IF;
END $$;

-- 2. Add survey session tracking columns to quest_sessions
ALTER TABLE public.quest_sessions
  ADD COLUMN IF NOT EXISTS survey_network text,
  ADD COLUMN IF NOT EXISTS survey_id text;

-- 3. Create unique index to prevent duplicate survey tracking per session
CREATE UNIQUE INDEX IF NOT EXISTS quest_sessions_survey_dedup
  ON public.quest_sessions (user_id, quest_key, survey_network, survey_id)
  WHERE quest_type = 'survey' AND survey_network IS NOT NULL AND survey_id IS NOT NULL;

-- Comments
COMMENT ON COLUMN public.quests.required_surveys IS
  'Survey quest: number of completed surveys required (1-10).';

COMMENT ON COLUMN public.quests.allowed_networks IS
  'Survey quest: array of allowed network slugs (cpxresearch, theoremreach, timewall).';

COMMENT ON COLUMN public.quests.min_payout_usd IS
  'Survey quest: optional minimum payout filter in USD.';

COMMENT ON COLUMN public.quests.max_loi IS
  'Survey quest: optional maximum length of interview in minutes.';

COMMENT ON COLUMN public.quest_sessions.survey_network IS
  'Survey quest: network slug of the survey being tracked (cpxresearch, theoremreach, timewall).';

COMMENT ON COLUMN public.quest_sessions.survey_id IS
  'Survey quest: external survey ID from the network for deduplication.';

