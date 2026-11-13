-- Add default value to quest_sessions.ads_required column
-- This column tracks how many ads are required for ad-watching quests.
-- Default to 0 for non-ad quest types (shortlink, network, feed, etc.)

ALTER TABLE public.quest_sessions 
  ALTER COLUMN ads_required SET DEFAULT 0;

-- Also make ads_watched consistent with the default
ALTER TABLE public.quest_sessions 
  ALTER COLUMN ads_watched SET DEFAULT 0;
