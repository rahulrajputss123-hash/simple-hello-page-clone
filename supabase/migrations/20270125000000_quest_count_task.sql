-- New automated task type: quest_count ("any N quests completed")
--
-- Counts completed quest SESSIONS across all three quest types together —
-- ads, shortlink chain and content locker — and pays the task reward once the
-- target is reached. Driven by the new 'quest_completed' task event, which is
-- emitted wherever a quest_sessions row reaches status 'credited'.
--
-- NOTE ON SCOPE: the only constraint that needed changing is on
-- `tasks.task_type`. `task_events.event_type` is a plain `text NOT NULL` column
-- with NO check constraint and NO enum (verified against the live database by
-- inserting an arbitrary event_type, which succeeded), so 'quest_completed'
-- needs no migration on that table.

-- Postgres cannot ALTER a CHECK constraint, so drop and recreate it.
-- All 9 existing values are preserved exactly; only 'quest_count' is added.
ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_task_type_check;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_task_type_check CHECK (
    task_type IN (
      'manual',
      'referral_count',
      'referral_window',
      'referral_daily',
      'offer_completion',
      'ad_watch',
      'shortlink',
      'content_locker',
      'offerwall_earning',
      'quest_count'
    )
  );

-- Speeds up countProgress()'s generic branch for this event stream. The existing
-- task_events_user_time index already covers (user_id, event_type, occurred_at),
-- so no new index is required.
