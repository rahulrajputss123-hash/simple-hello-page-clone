-- Add issued_step column to quest_sessions to track which step is opened but not yet completed.
-- This fixes the security issue where current_step was incremented on open, allowing users to skip steps.
--
-- NEW FLOW:
-- - Open: set issued_step = current_step + 1, step_issued_at = now. current_step stays unchanged.
-- - Complete: require issued_step === step and minimum time elapsed, then set current_step = step, issued_step = 0.
-- - Progress shown: current_step / total (completed steps, not including the currently opened one).

-- Add the issued_step column (0 = no step is issued/open right now)
ALTER TABLE quest_sessions
ADD COLUMN issued_step integer NOT NULL DEFAULT 0;

-- Backfill: for started shortlink/locker sessions with step_issued_at not null and current_step > 0,
-- assume the user opened a step but hasn't completed it yet.
-- Set issued_step = current_step and roll back current_step to the last truly completed step.
UPDATE quest_sessions
SET 
  issued_step = current_step,
  current_step = GREATEST(current_step - 1, 0)
WHERE 
  status = 'started'
  AND step_issued_at IS NOT NULL
  AND current_step > 0
  AND quest_type IN ('shortlink', 'locker');

-- No index needed: queries already filter by (user_id, quest_key, status) which is sufficient.
