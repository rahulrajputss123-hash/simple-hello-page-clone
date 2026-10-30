-- ============================================================================
-- Migration: Sub-cent amount support (4 decimal places)
-- ============================================================================
-- Widens money columns from numeric(x,2) to numeric(14,4) to support amounts
-- like $0.0175. This is a safe widening operation - no data loss, no value changes.
--
-- WHAT CHANGES:
-- - Earning/reward columns: profiles balances, offer/quest/task rewards, claims
-- - Precision: Can now store 0.0001 increments instead of 0.01
-- - Display will show 3 decimals for rewards (via formatReward)
--
-- WHAT STAYS THE SAME:
-- - Withdrawal amounts, network fees, minimums stay at 2 decimals
-- - Payout method settings stay at 2 decimals  
-- - Campaign/marketplace money stays at 2 decimals
-- - Existing data unchanged (just type widened)
-- ============================================================================

-- Profiles: publisher wallet and lifetime stats
ALTER TABLE public.profiles
  ALTER COLUMN wallet_balance TYPE numeric(14,4),
  ALTER COLUMN held_balance TYPE numeric(14,4),
  ALTER COLUMN lifetime_earned TYPE numeric(14,4),
  ALTER COLUMN lifetime_withdrawn TYPE numeric(14,4);

COMMENT ON COLUMN public.profiles.wallet_balance IS
  'Available balance in USD. Now supports 4 decimals for sub-cent earnings.';
COMMENT ON COLUMN public.profiles.held_balance IS
  'Held/pending balance in USD. Now supports 4 decimals for sub-cent earnings.';
COMMENT ON COLUMN public.profiles.lifetime_earned IS
  'Total lifetime earnings in USD. Now supports 4 decimals for sub-cent amounts.';
COMMENT ON COLUMN public.profiles.lifetime_withdrawn IS
  'Total withdrawn amount in USD. Withdrawals stay at 2 decimals but column widened for consistency.';

-- Wallet transactions: earning history
ALTER TABLE public.wallet_transactions
  ALTER COLUMN amount TYPE numeric(14,4);

COMMENT ON COLUMN public.wallet_transactions.amount IS
  'Transaction amount in USD. Now supports 4 decimals for sub-cent earnings.';

-- Offers: reward amounts
ALTER TABLE public.offers
  ALTER COLUMN reward_amount TYPE numeric(14,4);

COMMENT ON COLUMN public.offers.reward_amount IS
  'Offer reward in USD. Now supports 4 decimals for sub-cent amounts.';

-- Quests: reward amounts
ALTER TABLE public.quests
  ALTER COLUMN reward_amount TYPE numeric(14,4);

COMMENT ON COLUMN public.quests.reward_amount IS
  'Quest reward in USD. Now supports 4 decimals for sub-cent amounts.';

-- Quest sessions: reward tracking
ALTER TABLE public.quest_sessions
  ALTER COLUMN reward_amount TYPE numeric(14,4);

COMMENT ON COLUMN public.quest_sessions.reward_amount IS
  'Quest session reward in USD. Now supports 4 decimals for sub-cent amounts.';

-- Tasks: reward amounts
ALTER TABLE public.tasks
  ALTER COLUMN reward TYPE numeric(14,4);

COMMENT ON COLUMN public.tasks.reward IS
  'Task reward in USD. Now supports 4 decimals for sub-cent amounts.';

-- Offer claims: reward tracking
ALTER TABLE public.offer_claims
  ALTER COLUMN reward_amount TYPE numeric(14,4);

COMMENT ON COLUMN public.offer_claims.reward_amount IS
  'Claimed reward amount in USD. Now supports 4 decimals for sub-cent amounts.';

-- Marketplace campaigns: reward amounts
ALTER TABLE public.campaigns
  ALTER COLUMN reward TYPE numeric(14,4);

COMMENT ON COLUMN public.campaigns.reward IS
  'Campaign publisher reward in USD. Now supports 4 decimals for sub-cent amounts.';

-- Referrals: bonus tracking
ALTER TABLE public.referrals
  ALTER COLUMN bonus_amount TYPE numeric(14,4);

COMMENT ON COLUMN public.referrals.bonus_amount IS
  'Referral bonus amount in USD. Now supports 4 decimals for sub-cent amounts.';

-- Referral settings: bonus amounts
ALTER TABLE public.referral_settings
  ALTER COLUMN pub_signup_bonus TYPE numeric(14,4),
  ALTER COLUMN pub_first_earning_bonus TYPE numeric(14,4),
  ALTER COLUMN pub_first_withdrawal_bonus TYPE numeric(14,4);

COMMENT ON COLUMN public.referral_settings.pub_signup_bonus IS
  'Publisher signup bonus in USD. Now supports 4 decimals for sub-cent amounts.';
COMMENT ON COLUMN public.referral_settings.pub_first_earning_bonus IS
  'Publisher first earning bonus in USD. Now supports 4 decimals for sub-cent amounts.';
COMMENT ON COLUMN public.referral_settings.pub_first_withdrawal_bonus IS
  'Publisher first withdrawal bonus in USD. Now supports 4 decimals for sub-cent amounts.';

-- ============================================================================
-- NOTES:
-- - Withdrawal amounts (withdrawal_requests.amount) intentionally left at numeric(12,2)
-- - Network fees (withdrawal_requests.network_fee, payout_methods.network_fee_usd) stay at 2 decimals
-- - Minimum withdrawal (payout_methods.min_withdrawal_usd) stays at 2 decimals
-- - Advertiser balances stay at numeric(12,2) - marketplace operates at 2 decimal precision
-- - Campaign costs and fees stay at 2 decimals
-- ============================================================================
