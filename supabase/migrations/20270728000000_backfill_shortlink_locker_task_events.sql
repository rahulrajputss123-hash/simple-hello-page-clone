-- Migration: Backfill task_events for existing shortlink and content_locker quest completions
-- 
-- Problem: The "Complete shortlinks" and "Complete lockers" task milestones never progressed
-- because no code was recording task_events with event_type 'shortlink' or 'content_locker'.
-- 
-- Solution: Insert task_events for all completed steps in existing quest_sessions, using the
-- same event_key format (session_id:step) that the updated code now uses.

-- Backfill shortlink step events
-- For each completed step in shortlink sessions, insert a task event
INSERT INTO public.task_events (user_id, event_type, event_key, quantity, occurred_at)
SELECT 
  qs.user_id,
  'shortlink' AS event_type,
  qs.id || ':' || generate_series AS event_key,
  1 AS quantity,
  qs.verified_at AS occurred_at
FROM public.quest_sessions qs
WHERE 
  qs.quest_type = 'shortlink'
  AND qs.status IN ('verified', 'credited')
  AND qs.current_step > 0
  CROSS JOIN generate_series(1, qs.current_step)
ON CONFLICT (user_id, event_type, event_key) DO NOTHING;

-- Backfill content_locker step events
-- For each completed step in locker sessions, insert a task event
INSERT INTO public.task_events (user_id, event_type, event_key, quantity, occurred_at)
SELECT 
  qs.user_id,
  'content_locker' AS event_type,
  qs.id || ':' || generate_series AS event_key,
  1 AS quantity,
  qs.verified_at AS occurred_at
FROM public.quest_sessions qs
WHERE 
  qs.quest_type = 'locker'
  AND qs.status IN ('verified', 'credited')
  AND qs.current_step > 0
  CROSS JOIN generate_series(1, qs.current_step)
ON CONFLICT (user_id, event_type, event_key) DO NOTHING;

-- Sync user task progress after backfilling events
-- This updates user_tasks.current based on the newly inserted task_events
-- Only sync for users who have completed shortlink or locker quests
DO $$
DECLARE
  affected_user RECORD;
BEGIN
  FOR affected_user IN 
    SELECT DISTINCT user_id 
    FROM public.quest_sessions 
    WHERE quest_type IN ('shortlink', 'locker') 
      AND status IN ('verified', 'credited')
      AND current_step > 0
  LOOP
    PERFORM public.sync_user_tasks(affected_user.user_id);
  END LOOP;
END $$;

COMMENT ON COLUMN public.task_events.event_key IS 'Unique event identifier for deduplication. Format varies by event_type: session_id for quest_completed, session_id:step for shortlink/content_locker';
