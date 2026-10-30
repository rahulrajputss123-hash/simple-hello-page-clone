-- ============================================================================
-- Migration: Quest step rewards + completion bonus
-- ============================================================================
-- Adds configurable per-step rewards to shortlink/locker quests.
-- The existing reward_amount becomes the completion bonus (paid once at end).
-- New step_reward is the default per-step amount, with optional step_rewards
-- array for per-step customization.
--
-- Example: 3-step quest with step_reward=$0.50, reward_amount=$0.50
--   Step 1 complete: +$0.50
--   Step 2 complete: +$0.50
--   Step 3 complete: +$0.50
--   Quest complete:  +$0.50 (completion bonus)
--   Total earned:    $2.00
-- ============================================================================

-- Add reward columns to quests table
ALTER TABLE public.quests
  ADD COLUMN IF NOT EXISTS step_reward numeric(14,4) NOT NULL DEFAULT 0 
    CHECK (step_reward >= 0 AND step_reward <= 1000),
  ADD COLUMN IF NOT EXISTS step_rewards numeric(14,4)[] NULL;

COMMENT ON COLUMN public.quests.step_reward IS
  'Default reward per step for shortlink/locker quests. Step_rewards array overrides this if present.';

COMMENT ON COLUMN public.quests.step_rewards IS
  'Optional per-step reward amounts. If present, length must equal number of steps. Overrides step_reward.';

COMMENT ON COLUMN public.quests.reward_amount IS
  'Completion bonus paid once when the entire quest finishes. For ads quests, this is the only reward. For step-based quests, this is paid in addition to step rewards.';

-- Create quest_step_credits table for idempotent step rewards
CREATE TABLE IF NOT EXISTS public.quest_step_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.quest_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  quest_key text NOT NULL,
  step_index integer NOT NULL CHECK (step_index > 0),
  amount numeric(14,4) NOT NULL CHECK (amount >= 0),
  credited_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure each step is only credited once per session
  UNIQUE (session_id, step_index)
);

CREATE INDEX IF NOT EXISTS idx_quest_step_credits_session 
  ON public.quest_step_credits(session_id);
CREATE INDEX IF NOT EXISTS idx_quest_step_credits_user 
  ON public.quest_step_credits(user_id, credited_at DESC);

COMMENT ON TABLE public.quest_step_credits IS
  'Records individual step reward credits for idempotency. Each (session_id, step_index) can only be credited once.';

-- Grant permissions
GRANT SELECT ON public.quest_step_credits TO authenticated;
GRANT ALL ON public.quest_step_credits TO service_role;

-- RLS: Users can see their own step credits
ALTER TABLE public.quest_step_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own step credits" 
  ON public.quest_step_credits 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- NOTES:
-- - Existing quests have step_reward = 0, so behavior is unchanged
-- - Ads quests ignore step_reward (they have no steps)
-- - Step rewards are credited immediately upon step completion
-- - Completion bonus (reward_amount) is still credited via finishQuestSession
-- - Step credits are never clawed back, even if quest is abandoned
-- ============================================================================
