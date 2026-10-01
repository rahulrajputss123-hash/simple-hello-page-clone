-- =============================================================================
-- URGENT SECURITY FIX (companion to 20270220000000) — server-write-only money tables
-- =============================================================================
-- user_tasks had the same class of hole as profiles: the "own user_tasks" RLS
-- policy is FOR ALL, and `authenticated` holds INSERT/UPDATE. A signed-in user
-- could therefore:
--   * flip a paid automated task back to reward_status = 'pending'; the next
--     syncUserTasks run recomputes progress from task_events, sees it complete,
--     claims pending -> paid again and credits the wallet again (repeatable), or
--   * set a manual task's progress to steps_total - 1 (or reset a completed one)
--     so completeTaskImpl pays on the next tap.
-- The app never writes user_tasks from the browser (only server code on the
-- service role does), so making it read-only for clients changes no behaviour.
--
-- The other money tables already have no client write POLICY, so RLS blocks
-- writes today. Their write PRIVILEGES are revoked too (defence in depth: a
-- future permissive policy would otherwise silently re-open them). Every one is
-- only ever SELECTed from the browser:
--   wallet_transactions, withdrawal_requests, referrals, offer_claims,
--   quest_sessions, task_events, sdk_offerwall_conversions
--
-- Safe to re-run. Apply in the Supabase SQL editor.
-- =============================================================================

-- user_tasks: read-only for clients.
REVOKE ALL ON TABLE public.user_tasks FROM anon, authenticated;
GRANT SELECT ON TABLE public.user_tasks TO authenticated;
GRANT ALL ON TABLE public.user_tasks TO service_role;

DROP POLICY IF EXISTS "own user_tasks" ON public.user_tasks;
DROP POLICY IF EXISTS "own user_tasks readable" ON public.user_tasks;
CREATE POLICY "own user_tasks readable" ON public.user_tasks
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Money tables: SELECT only for signed-in users (their RLS SELECT policies are
-- unchanged), nothing for anon. Skips any table that does not exist.
DO $$
DECLARE
  t text;
  money_tables text[] := ARRAY[
    'wallet_transactions', 'withdrawal_requests', 'referrals', 'offer_claims',
    'quest_sessions', 'task_events', 'sdk_offerwall_conversions'
  ];
BEGIN
  FOREACH t IN ARRAY money_tables LOOP
    IF to_regclass(format('public.%I', t)) IS NULL THEN
      RAISE NOTICE 'public.% does not exist; skipped', t;
      CONTINUE;
    END IF;
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT SELECT ON TABLE public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', t);
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- Verification (run after applying; read-only)
-- -----------------------------------------------------------------------------
-- Expect only SELECT rows for authenticated, and no anon rows:
--   SELECT table_name, grantee, privilege_type
--   FROM information_schema.role_table_grants
--   WHERE table_schema = 'public'
--     AND table_name IN ('user_tasks', 'wallet_transactions', 'withdrawal_requests',
--                        'referrals', 'offer_claims', 'quest_sessions', 'task_events',
--                        'sdk_offerwall_conversions')
--     AND grantee IN ('anon', 'authenticated')
--   ORDER BY table_name, grantee, privilege_type;
--
-- Expect no INSERT/UPDATE/DELETE/ALL policy for authenticated on user_tasks:
--   SELECT policyname, cmd, roles FROM pg_policies
--   WHERE schemaname = 'public' AND tablename = 'user_tasks';
