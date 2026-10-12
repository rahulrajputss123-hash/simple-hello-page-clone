-- =============================================================================
-- Referral reward release gate
--
-- Milestones (signup / earning / withdrawal) are still tracked individually, but
-- the money is no longer credited per milestone. It stays PENDING until all
-- three are complete, then the full REFERRAL_MAX_BONUS ($3) is released to the
-- referrer's MAIN wallet exactly once.
--
-- `reward_released_at` is the idempotency guard for that single release: the
-- application claims it with a conditional UPDATE ... WHERE reward_released_at
-- IS NULL before any money moves, so duplicate events, retries and concurrent
-- callers can never pay the same referral twice.
--
-- `bonus_amount` keeps its existing meaning: the amount ACTUALLY released to the
-- wallet (0 until the release, REFERRAL_MAX_BONUS after). The admin dashboard
-- already labels it "paid", so that stays accurate.
-- =============================================================================

ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS reward_released_at timestamptz;

COMMENT ON COLUMN public.referrals.reward_released_at IS
  'Set once the full referral reward has been released to the referrer''s main wallet. Acts as the idempotency guard for that release.';

-- Backfill: referrals that already completed all three milestones AND were fully
-- paid under the previous per-milestone model are marked as released, so the new
-- release path can never pay them a second time.
UPDATE public.referrals
SET reward_released_at = COALESCE(withdrawal_credited_at, created_at)
WHERE reward_released_at IS NULL
  AND signup_credited_at IS NOT NULL
  AND earning_credited_at IS NOT NULL
  AND withdrawal_credited_at IS NOT NULL
  AND bonus_amount >= 3;

-- Partially-paid legacy rows (bonus_amount 1 or 2, not yet 3/3) are deliberately
-- left with reward_released_at NULL. When they reach 3/3 the application releases
-- only the remaining top-up (REFERRAL_MAX_BONUS - bonus_amount), so the referrer
-- is never double-paid and nothing already credited is clawed back.

-- Lets the release path find a referral by referred user quickly.
CREATE INDEX IF NOT EXISTS referrals_referred_id_idx ON public.referrals (referred_id);
