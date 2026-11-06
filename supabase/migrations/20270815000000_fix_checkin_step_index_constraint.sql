-- Migration: Fix quest_step_credits to allow step_index 0 (Day 1 of check-in quests)
-- 
-- Issue: The original CHECK constraint required step_index > 0, which prevented
-- Day 1 (step_index 0) credits from being inserted for check-in quests.
--
-- Fix: Change constraint to step_index >= 0 to allow Day 1 credits.
--
-- Safe to run: This is a constraint relaxation (making it less restrictive).
-- Existing data is unaffected. Future inserts with step_index 0 will now succeed.

-- Drop the old constraint
ALTER TABLE public.quest_step_credits 
  DROP CONSTRAINT IF EXISTS quest_step_credits_step_index_check;

-- Add the new constraint allowing step_index >= 0
ALTER TABLE public.quest_step_credits 
  ADD CONSTRAINT quest_step_credits_step_index_check 
  CHECK (step_index >= 0);

-- Update the comment to reflect the change
COMMENT ON TABLE public.quest_step_credits IS
  'Records individual step reward credits for idempotency. Each (session_id, step_index) can only be credited once. step_index starts from 0 (Day 1 for check-in quests).';
