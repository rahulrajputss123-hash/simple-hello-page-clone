-- Daily Check-in Streak Quest Type
-- Supports timezone-aware day boundaries, active time tracking, consecutive/total streak modes,
-- and per-step rewards (each completed day = one step).
--
-- NOTE: quest_type is a TEXT column with CHECK constraint, NOT an enum.
-- The CHECK constraint quests_quest_type_check already allows 'checkin'.
-- This migration is idempotent and safe to re-run.

-- 1. Add timezone to profiles (IANA format, e.g. "Asia/Kolkata", "Asia/Kathmandu")
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS timezone_changed_at timestamptz;

-- 2. Add timezone lock to quest_sessions
ALTER TABLE public.quest_sessions
  ADD COLUMN IF NOT EXISTS timezone text;

COMMENT ON COLUMN public.quest_sessions.timezone IS
  'Locked timezone for this session. Set when checkin session starts, used for all day boundaries.';

-- 3. Add checkin-specific columns to quests
ALTER TABLE public.quests
  ADD COLUMN IF NOT EXISTS total_days integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS required_active_seconds integer DEFAULT 300,
  ADD COLUMN IF NOT EXISTS streak_mode text DEFAULT 'consecutive',
  ADD COLUMN IF NOT EXISTS grace_days integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS day1_auto_complete boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS repeatable boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_timezone text DEFAULT 'Asia/Kolkata';

-- Constraints for checkin fields
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quests_total_days_check') THEN
    ALTER TABLE public.quests ADD CONSTRAINT quests_total_days_check CHECK (total_days BETWEEN 1 AND 365);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quests_required_active_seconds_check') THEN
    ALTER TABLE public.quests ADD CONSTRAINT quests_required_active_seconds_check CHECK (required_active_seconds >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quests_streak_mode_check') THEN
    ALTER TABLE public.quests ADD CONSTRAINT quests_streak_mode_check CHECK (streak_mode IN ('consecutive', 'total'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quests_grace_days_check') THEN
    ALTER TABLE public.quests ADD CONSTRAINT quests_grace_days_check CHECK (grace_days >= 0 AND grace_days <= 30);
  END IF;
END $$;

-- 4. Unique index to prevent multiple active checkin sessions per user per quest
CREATE UNIQUE INDEX IF NOT EXISTS quest_sessions_one_active_checkin
  ON public.quest_sessions (user_id, quest_key)
  WHERE quest_type = 'checkin' AND status = 'started';

COMMENT ON INDEX quest_sessions_one_active_checkin IS
  'Prevents race conditions: only one active checkin session per user per quest.';

-- 5. Create quest_checkin_days table to track daily progress
CREATE TABLE IF NOT EXISTS public.quest_checkin_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.quest_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quest_key text NOT NULL,
  local_date text NOT NULL, -- YYYY-MM-DD in user's locked timezone
  active_seconds integer NOT NULL DEFAULT 0,
  last_ping_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for efficient queries
CREATE UNIQUE INDEX IF NOT EXISTS quest_checkin_days_session_date_uniq
  ON public.quest_checkin_days (session_id, local_date);

CREATE INDEX IF NOT EXISTS quest_checkin_days_user_quest_idx
  ON public.quest_checkin_days (user_id, quest_key);

CREATE INDEX IF NOT EXISTS quest_checkin_days_session_idx
  ON public.quest_checkin_days (session_id);

CREATE INDEX IF NOT EXISTS quest_checkin_days_local_date_idx
  ON public.quest_checkin_days (local_date);

-- RLS: service-role only (same as other quest tables)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quest_checkin_days TO authenticated;
GRANT ALL ON public.quest_checkin_days TO service_role;

ALTER TABLE public.quest_checkin_days ENABLE ROW LEVEL SECURITY;

-- Read policy: users can only see their own checkin days
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quest_checkin_days' AND policyname = 'checkin days readable by owner') THEN
    CREATE POLICY "checkin days readable by owner" ON public.quest_checkin_days
      FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Write policy: service role only (all logic is server-side)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quest_checkin_days' AND policyname = 'checkin days writable by service role') THEN
    CREATE POLICY "checkin days writable by service role" ON public.quest_checkin_days
      FOR ALL TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Trigger for updated_at
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'quest_checkin_days_updated_at') THEN
    CREATE TRIGGER quest_checkin_days_updated_at
      BEFORE UPDATE ON public.quest_checkin_days
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Comment
COMMENT ON TABLE public.quest_checkin_days IS 
  'Daily check-in progress tracking with timezone-aware local dates. Each row = one day in a check-in session.';
