-- =============================================================================
-- Feature: 'first_withdrawal' lock type + lock support on Tasks
-- =============================================================================
-- Two related changes, both additive and behaviour-preserving:
--
--   1. quests.lock_type gains a fourth value, 'first_withdrawal'. The existing
--      quests_lock_type_check CHECK only permitted 'none' | 'time' | 'earning',
--      so it has to be replaced rather than just documented.
--
--   2. public.tasks gains lock_type + unlock_at, mirroring the quest columns.
--      Tasks support 'none' | 'time' | 'first_withdrawal' (no 'earning' variant
--      was requested, and leaving it out keeps the CHECK honest).
--
-- 'first_withdrawal' unlocks when profiles.lifetime_withdrawn > 0. That column is
-- incremented exactly once per approved withdrawal in the withdrawal-approval
-- flow (src/lib/coinquest.server.ts), which is the same signal the
-- "friend's first withdrawal" referral milestone already keys off — so there is
-- no second tracking mechanism to keep in sync.
--
-- Every existing row keeps lock_type = 'none', i.e. unlocked, exactly as today.
-- -----------------------------------------------------------------------------

-- ------------------------- (1) QUESTS: new lock value ------------------------
-- 'first_withdrawal' needs neither unlock_at nor required_lifetime_earned, so
-- both must be NULL for that branch (same shape as the 'none' branch).
ALTER TABLE public.quests
  DROP CONSTRAINT IF EXISTS quests_lock_type_check;
ALTER TABLE public.quests
  ADD CONSTRAINT quests_lock_type_check CHECK (
    lock_type = 'none'
    OR (lock_type = 'time'    AND unlock_at IS NOT NULL AND required_lifetime_earned IS NULL)
    OR (lock_type = 'earning' AND required_lifetime_earned IS NOT NULL AND unlock_at IS NULL)
    OR (lock_type = 'first_withdrawal' AND unlock_at IS NULL AND required_lifetime_earned IS NULL)
  );

COMMENT ON COLUMN public.quests.lock_type IS
  'none | time (needs unlock_at) | earning (needs required_lifetime_earned) | first_withdrawal (unlocks once profiles.lifetime_withdrawn > 0).';

-- --------------------------- (2) TASKS: lock support -------------------------
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS lock_type text        NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS unlock_at timestamptz NULL;

ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_lock_type_check;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_lock_type_check CHECK (
    lock_type = 'none'
    OR (lock_type = 'time' AND unlock_at IS NOT NULL)
    OR (lock_type = 'first_withdrawal' AND unlock_at IS NULL)
  );

COMMENT ON COLUMN public.tasks.lock_type IS
  'none | time (needs unlock_at) | first_withdrawal (unlocks once profiles.lifetime_withdrawn > 0). Enforced server-side in src/lib/tasks/engine.server.ts; is_active remains the separate visibility switch.';
COMMENT ON COLUMN public.tasks.unlock_at IS
  'UTC moment a time-locked task becomes available. NULL for every other lock_type.';

-- A locked task is still listed (the client renders a locked card), so no RLS or
-- visibility change is needed here — progress and crediting are what get blocked.
