-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for making HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function that calls the refresh endpoint
CREATE OR REPLACE FUNCTION refresh_offer_feed_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cron_secret text;
  api_url text;
  request_id bigint;
BEGIN
  -- Get the CRON_SECRET from vault or use a placeholder
  -- In production, this should be set via Supabase secrets/vault
  cron_secret := current_setting('app.settings.cron_secret', true);
  
  IF cron_secret IS NULL THEN
    RAISE WARNING 'CRON_SECRET not configured in app.settings.cron_secret';
    RETURN;
  END IF;

  -- Get the API URL from configuration
  api_url := current_setting('app.settings.api_url', true);
  
  IF api_url IS NULL THEN
    RAISE WARNING 'API_URL not configured in app.settings.api_url';
    RETURN;
  END IF;

  -- Make HTTP POST request to the refresh endpoint
  SELECT INTO request_id net.http_post(
    url := api_url || '/api/cron/refresh-offer-feed',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cron_secret
    ),
    body := '{}'::jsonb
  );

  RAISE LOG 'Offer feed refresh triggered, request_id: %', request_id;
END;
$$;

-- Schedule the job to run every 30 minutes
-- Note: pg_cron uses cron syntax (minute hour day month weekday)
-- */30 * * * * means "every 30 minutes"
SELECT cron.schedule(
  'refresh-offer-feed-every-30min',
  '*/30 * * * *',
  'SELECT refresh_offer_feed_cron();'
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- To view scheduled jobs, run:
-- SELECT * FROM cron.job;

-- To manually unschedule (for testing/debugging), run:
-- SELECT cron.unschedule('refresh-offer-feed-every-30min');
