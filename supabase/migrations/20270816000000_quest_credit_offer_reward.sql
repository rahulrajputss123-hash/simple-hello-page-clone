-- Migration: Add credit_offer_reward column to quests table
-- 
-- When true: quest token conversions record quest progress AND credit normal wallet reward
-- When false (default): quest token conversions record quest progress only (no wallet credit)
--
-- This allows certain quests to dual-credit both quest progress and wallet rewards,
-- useful for quests that should not suppress normal earnings.

ALTER TABLE public.quests 
  ADD COLUMN credit_offer_reward boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.quests.credit_offer_reward IS
  'When true, quest token conversions credit both quest progress and normal wallet reward (with referral, milestones). When false (default), quest progress only.';
