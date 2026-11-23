-- Enable pg_net extension for making HTTP requests
create extension if not exists pg_net;

-- Create a function that calls the refresh endpoint
create or replace function public.refresh_offer_feed_cron()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
begin
  -- Retrieve the secret from Supabase Vault
  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'offer_feed_cron_secret'
  limit 1;

  if v_secret is null then
    raise warning 'offer_feed_cron_secret missing in vault';
    return;
  end if;

  -- Make HTTP POST request to the refresh endpoint
  perform net.http_post(
    url := 'https://cashgpt.in/api/cron/refresh-offer-feed',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
end;
$$;

-- Revoke public access to the function
revoke all on function public.refresh_offer_feed_cron() from public, anon, authenticated;

-- Schedule the job to run every 30 minutes
-- Note: pg_cron uses cron syntax (minute hour day month weekday)
-- */30 * * * * means "every 30 minutes"
select cron.schedule(
  'refresh-offer-feed-every-30min',
  '*/30 * * * *',
  'select public.refresh_offer_feed_cron();'
);

-- To view scheduled jobs, run:
-- SELECT * FROM cron.job;

-- To manually unschedule (for testing/debugging), run:
-- SELECT cron.unschedule('refresh-offer-feed-every-30min');
