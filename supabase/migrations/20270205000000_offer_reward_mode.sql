-- =============================================================================
-- Feature: per-offer reward mode (fixed amount vs percentage of payout)
-- =============================================================================
-- Additive and behaviour-preserving: every existing row gets
-- reward_mode = 'fixed' and reward_percentage = NULL, which is exactly how
-- offers behave today (reward_amount is taken as entered).
--
-- WHY NEW COLUMNS instead of reusing what's already on the table:
--
--   payout_mode        already means how a conversion is VERIFIED
--                      ('manual' | 'manual_proof' | 'auto_postback') — nothing
--                      to do with how the reward is calculated.
--   payout_percentage  is bound to actual_cost for self-funded Limited Deals
--                      (see computeLimitedDealReward) and defaults to 110 on
--                      every row, so overloading it would make that path
--                      ambiguous.
--   revenue_share      is written by the network sync for every synced offer and
--                      is a 0..1 fraction, so it cannot express >100%.
--
-- None of those three are touched by this migration.
--
-- Base value for the percentage is network_payout, falling back to actual_cost.
-- is_limited_deal keeps precedence: those offers continue to use their own
-- actual_cost x payout_percentage capped rule.
--
-- reward_amount stays the single source of truth for display. The server
-- materialises it on save (upsertManualOfferImpl), so the app, the feed cache and
-- every offer card keep reading one column and need no changes.
-- -----------------------------------------------------------------------------

ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS reward_mode       text    NOT NULL DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS reward_percentage numeric;

-- Only the two supported modes.
ALTER TABLE public.offers
  DROP CONSTRAINT IF EXISTS offers_reward_mode_check;
ALTER TABLE public.offers
  ADD CONSTRAINT offers_reward_mode_check
  CHECK (reward_mode IN ('fixed', 'percent_payout'));

-- Non-negative, with a 500% sanity ceiling. Percentages above 100 are valid and
-- intentional (a loss-leading offer can pay out more than it earns), but a stray
-- extra digit should not be able to drain the wallet budget.
ALTER TABLE public.offers
  DROP CONSTRAINT IF EXISTS offers_reward_percentage_check;
ALTER TABLE public.offers
  ADD CONSTRAINT offers_reward_percentage_check
  CHECK (reward_percentage IS NULL OR (reward_percentage >= 0 AND reward_percentage <= 500));

-- A percentage-based offer must actually carry a percentage.
ALTER TABLE public.offers
  DROP CONSTRAINT IF EXISTS offers_reward_percentage_required_check;
ALTER TABLE public.offers
  ADD CONSTRAINT offers_reward_percentage_required_check
  CHECK (reward_mode <> 'percent_payout' OR reward_percentage IS NOT NULL);

COMMENT ON COLUMN public.offers.reward_mode IS
  'How reward_amount was derived on save: ''fixed'' = entered directly, ''percent_payout'' = reward_percentage% of network_payout (falling back to actual_cost). Display always reads reward_amount.';
COMMENT ON COLUMN public.offers.reward_percentage IS
  'Percent applied to the base payout when reward_mode = ''percent_payout''. 110 means 110%. NULL when reward_mode = ''fixed''. Distinct from payout_percentage, which belongs to the Limited Deal actual_cost rule.';
