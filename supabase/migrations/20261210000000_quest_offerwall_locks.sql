-- Quest and SDK Offerwall lock system
-- Adds three columns to both quests and sdk_offerwall_providers:
--   lock_type                 'none' | 'time' | 'earning'  (default 'none')
--   unlock_at                 timestamptz, used when lock_type = 'time'
--   required_lifetime_earned  numeric,     used when lock_type = 'earning'
--
-- A CHECK constraint enforces consistency so the app never has to guess.
-- Existing rows default to lock_type = 'none' with both nullable columns NULL
-- — no backfill is required.
--
-- All unlock_at comparisons happen server-side in UTC (Postgres timestamptz
-- is always stored in UTC regardless of the session timezone).

ALTER TABLE public.quests
  ADD COLUMN IF NOT EXISTS lock_type                text           NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS unlock_at               timestamptz    NULL,
  ADD COLUMN IF NOT EXISTS required_lifetime_earned numeric(12,2)  NULL;

ALTER TABLE public.quests
  ADD CONSTRAINT quests_lock_type_check CHECK (
    lock_type = 'none'
    OR (lock_type = 'time'    AND unlock_at IS NOT NULL AND required_lifetime_earned IS NULL)
    OR (lock_type = 'earning' AND required_lifetime_earned IS NOT NULL AND unlock_at IS NULL)
  );

COMMENT ON COLUMN public.quests.lock_type IS
  'none = always accessible; time = locked until unlock_at (UTC); earning = locked until user lifetime_earned >= required_lifetime_earned';

ALTER TABLE public.sdk_offerwall_providers
  ADD COLUMN IF NOT EXISTS lock_type                text           NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS unlock_at               timestamptz    NULL,
  ADD COLUMN IF NOT EXISTS required_lifetime_earned numeric(12,2)  NULL;

ALTER TABLE public.sdk_offerwall_providers
  ADD CONSTRAINT sdk_offerwall_providers_lock_type_check CHECK (
    lock_type = 'none'
    OR (lock_type = 'time'    AND unlock_at IS NOT NULL AND required_lifetime_earned IS NULL)
    OR (lock_type = 'earning' AND required_lifetime_earned IS NOT NULL AND unlock_at IS NULL)
  );

COMMENT ON COLUMN public.sdk_offerwall_providers.lock_type IS
  'none = always accessible; time = locked until unlock_at (UTC); earning = locked until user lifetime_earned >= required_lifetime_earned';
