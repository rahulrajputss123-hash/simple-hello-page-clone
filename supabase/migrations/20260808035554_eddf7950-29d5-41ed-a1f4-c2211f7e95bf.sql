ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS signup_credited_at timestamptz,
  ADD COLUMN IF NOT EXISTS earning_credited_at timestamptz,
  ADD COLUMN IF NOT EXISTS withdrawal_credited_at timestamptz;

UPDATE public.referrals
SET signup_credited_at = COALESCE(signup_credited_at, created_at)
WHERE status = 'credited';