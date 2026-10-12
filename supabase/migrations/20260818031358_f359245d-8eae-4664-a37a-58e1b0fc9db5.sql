CREATE TABLE public.automation_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  status text not null default 'info',
  source text not null default 'system',
  provider_id uuid references public.sdk_offerwall_providers(id) on delete set null,
  user_id uuid,
  reference_id uuid,
  message text not null default '',
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

CREATE INDEX automation_logs_created_at_idx ON public.automation_logs (created_at DESC);
CREATE INDEX automation_logs_event_type_idx ON public.automation_logs (event_type);

GRANT SELECT ON public.automation_logs TO authenticated;
GRANT ALL ON public.automation_logs TO service_role;

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view automation logs"
ON public.automation_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));