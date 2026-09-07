-- =============================================================================
-- Feature: Content Locker quest type
-- Adds 'locker' to the quest_type CHECK constraint, a locker_url column on
-- quests, and a session_token column on quest_sessions for future token-based
-- matching (currently unused in the redirect flow — see app code comments).
-- =============================================================================

-- 1. Widen the quest_type CHECK to include 'locker'.
ALTER TABLE public.quests
  DROP CONSTRAINT IF EXISTS quests_quest_type_check;

ALTER TABLE public.quests
  ADD CONSTRAINT quests_quest_type_check
  CHECK (quest_type IN ('ads', 'shortlink', 'locker'));

-- 2. Add locker_url column (NULL for non-locker quest types).
ALTER TABLE public.quests
  ADD COLUMN IF NOT EXISTS locker_url text;

-- 3. Add session_token to quest_sessions.
--    Unique where not null so two sessions can never share a token.
ALTER TABLE public.quest_sessions
  ADD COLUMN IF NOT EXISTS session_token text;

CREATE UNIQUE INDEX IF NOT EXISTS quest_sessions_session_token_unique
  ON public.quest_sessions (session_token)
  WHERE session_token IS NOT NULL;
