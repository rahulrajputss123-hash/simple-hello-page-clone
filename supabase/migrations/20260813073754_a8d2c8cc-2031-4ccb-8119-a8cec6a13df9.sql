ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS task_type text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS target integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS frequency text NOT NULL DEFAULT 'one_time',
  ADD COLUMN IF NOT EXISTS icon text NOT NULL DEFAULT 'target',
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS window_days integer,
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_task_type_check CHECK (task_type IN ('manual','referral_count','referral_window','referral_daily','offer_completion','ad_watch','shortlink','content_locker')),
  ADD CONSTRAINT tasks_frequency_check CHECK (frequency IN ('daily','weekly','one_time','lifetime'));

ALTER TABLE public.user_tasks
  ADD COLUMN IF NOT EXISTS period_key text NOT NULL DEFAULT 'lifetime',
  ADD COLUMN IF NOT EXISTS target integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reward_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS rewarded_at timestamptz;

ALTER TABLE public.user_tasks DROP CONSTRAINT IF EXISTS user_tasks_user_id_task_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS user_tasks_user_task_period_key ON public.user_tasks (user_id, task_id, period_key);

CREATE TABLE IF NOT EXISTS public.task_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_key text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS task_events_dedupe ON public.task_events (user_id, event_type, event_key);
CREATE INDEX IF NOT EXISTS task_events_user_time ON public.task_events (user_id, event_type, occurred_at DESC);

GRANT SELECT ON public.task_events TO authenticated;
GRANT ALL ON public.task_events TO service_role;
ALTER TABLE public.task_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own task events" ON public.task_events FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));