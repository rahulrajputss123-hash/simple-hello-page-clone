-- Offerwall earning target task type
--
-- 1. Adds 'offerwall_earning' to the tasks_task_type_check constraint.
--    All existing 8 values are preserved exactly.
-- 2. Adds tasks.earning_target  — the dollar amount target (only used by this type).
-- 3. Adds tasks.earning_provider_id — scopes to one SDK offerwall provider;
--    NULL means "combined across all SDK offerwalls".
-- 4. Adds task_events.provider_id — records which provider an offerwall_earning
--    event came from, enabling combined-vs-scoped filtering in countProgress().

-- Step 1: drop the old CHECK and recreate it with the new value.
-- (Postgres does not support ALTER CONSTRAINT for CHECK constraints.)
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
      'offerwall_earning'
    )
  );

-- Step 2: new columns on tasks.
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS earning_target        numeric(10,2) NULL,
  ADD COLUMN IF NOT EXISTS earning_provider_id   uuid          NULL
    REFERENCES public.sdk_offerwall_providers(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.tasks.earning_target IS
  'Dollar amount target for offerwall_earning tasks. NULL for all other task types.';
COMMENT ON COLUMN public.tasks.earning_provider_id IS
  'Scope to a specific SDK offerwall provider. NULL = combined across all providers.';

-- Step 3: provider_id on task_events so combined-vs-scoped filtering works.
ALTER TABLE public.task_events
  ADD COLUMN IF NOT EXISTS provider_id uuid NULL;

COMMENT ON COLUMN public.task_events.provider_id IS
  'Set for offerwall_earning events; records which sdk_offerwall_providers row fired the event.';

CREATE INDEX IF NOT EXISTS task_events_provider_id_idx
  ON public.task_events (provider_id)
  WHERE provider_id IS NOT NULL;
