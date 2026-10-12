-- =============================================================================
-- Raise the locker-URL ceiling on quests from 3 to 10
-- =============================================================================
-- Widening a CHECK only, so every existing row (0-3 URLs) stays valid.
--
-- Still no lower bound: a quest may hold zero locker URLs. Such a quest is
-- allowed to be active and visible, and the user-facing start call returns a
-- soft "link coming soon" result instead of throwing — see startLockerQuestImpl
-- in src/lib/quests.server.ts.
--
-- Shortlink quests are unchanged and keep their SHORTLINK_MAX_STEPS cap, which
-- lives in application code rather than a constraint.
-- -----------------------------------------------------------------------------

ALTER TABLE public.quests
  DROP CONSTRAINT IF EXISTS quests_locker_urls_max_check;
ALTER TABLE public.quests
  ADD CONSTRAINT quests_locker_urls_max_check CHECK (cardinality(locker_urls) <= 10);

COMMENT ON COLUMN public.quests.locker_urls IS
  'Ordered content-locker URLs (0-10), completed sequentially; the reward is credited only after the last one. Zero URLs is a valid "not configured yet" state and is surfaced to users as "link coming soon", never as an error.';
