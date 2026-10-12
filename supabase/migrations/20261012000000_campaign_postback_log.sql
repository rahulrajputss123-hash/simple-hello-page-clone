create table if not exists public.campaign_postback_log (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns on delete cascade,
  received_at timestamptz not null default now(),
  result text not null check (result in ('credited', 'duplicate', 'unauthorized', 'held', 'test_ok', 'error')),
  click_id uuid null,
  txn_id text null,
  http_status int
);

create index if not exists campaign_postback_log_campaign_received_idx
  on public.campaign_postback_log (campaign_id, received_at desc);

alter table public.campaign_postback_log enable row level security;

create policy "Advertisers can view their campaign postback logs"
  on public.campaign_postback_log for select
  to authenticated
  using (exists (
    select 1 from public.campaigns c
    where c.id = campaign_postback_log.campaign_id
      and c.advertiser_id = (select auth.uid())
  ));

create policy "Admins can view all campaign postback logs"
  on public.campaign_postback_log for select
  to authenticated
  using (public.has_role((select auth.uid()), 'admin'));

grant select on public.campaign_postback_log to authenticated;
revoke insert, update, delete on public.campaign_postback_log from anon, authenticated;

comment on table public.campaign_postback_log is 'Append-only postback diagnostics; tokens, query strings, and IP addresses are never stored.';
