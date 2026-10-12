-- Multiple content lockers per "locker" quest (admin-configurable: 1, 2 or 3)
--
-- Mirrors how "shortlink" quests already work: an ordered array of steps on the
-- quest row plus the existing quest_sessions.current_step counter. No new
-- session columns are needed — current_step and step_issued_at already exist.
--
-- locker_url (singular) is KEPT, deliberately:
--   * dropping it is irreversible and buys nothing here;
--   * it is the rollback source if this change ever needs reverting.
-- No application code reads it any more — src/lib/quests.server.ts QuestRow now
-- exposes locker_urls only, so it cannot be used accidentally.

ALTER TABLE public.quests
  ADD COLUMN IF NOT EXISTS locker_urls text[] NOT NULL DEFAULT '{}';

-- Backfill: an existing single-locker quest becomes a one-element array, so it
-- keeps behaving exactly as before (one locker -> credit on first return hit).
-- Guarded by cardinality = 0 so re-running cannot duplicate entries.
UPDATE public.quests
SET locker_urls = ARRAY[locker_url]
WHERE locker_url IS NOT NULL
  AND btrim(locker_url) <> ''
  AND cardinality(locker_urls) = 0;

-- Cap at 3 in the database. The lower bound (at least 1 for a locker quest) is
-- enforced in upsertQuestImpl + the zod schema rather than here, because a
-- CHECK requiring >= 1 would refuse to install on any environment that already
-- has a locker quest with a NULL locker_url.
ALTER TABLE public.quests
  DROP CONSTRAINT IF EXISTS quests_locker_urls_max_check;
ALTER TABLE public.quests
  ADD CONSTRAINT quests_locker_urls_max_check CHECK (cardinality(locker_urls) <= 3);

COMMENT ON COLUMN public.quests.locker_urls IS
  'Ordered content-locker URLs for a locker quest (1-3). Completed sequentially; the reward is credited only after the last one. Replaces the deprecated locker_url.';
COMMENT ON COLUMN public.quests.locker_url IS
  'DEPRECATED — superseded by locker_urls. Retained for rollback only; no application code reads it.';
