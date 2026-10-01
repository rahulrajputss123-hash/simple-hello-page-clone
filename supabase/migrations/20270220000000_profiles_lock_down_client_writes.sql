-- =============================================================================
-- URGENT SECURITY FIX — profiles: stop signed-in users editing their own balance
-- =============================================================================
-- Before this migration, `authenticated` held table-level INSERT/UPDATE on
-- public.profiles and the "own profile update" RLS policy only checks
-- id = auth.uid(). RLS cannot restrict columns, so any signed-in user could
-- PATCH their own wallet_balance / held_balance / lifetime_* / is_flagged /
-- referred_by straight through the public REST API.
--
-- Fix (privileges, not policies):
--   1. REVOKE ALL table privileges from anon + authenticated. Per the Postgres
--      docs, revoking a table privilege also revokes any column privileges.
--   2. Re-GRANT SELECT, and UPDATE on ONLY the columns the app writes from the
--      browser / user-scoped server client:
--        profile.tsx ............ name, avatar_url, gender, date_of_birth,
--                                 push_enabled, language
--        onboarding/server.ts ... name, avatar_url, gender, date_of_birth,
--                                 onboarded, has_seen_onboarding
--      No client code INSERTs profiles (ensureProfile runs on the service role),
--      so INSERT is not re-granted and the unused insert policy is dropped.
--   3. Defence in depth: a BEFORE INSERT/UPDATE trigger that rejects any change
--      to a non-allowlisted column when the caller is anon/authenticated. It
--      keeps the hole closed even if a later migration re-grants table-level
--      UPDATE (Supabase's default privileges and Lovable-generated migrations
--      both tend to). service_role and SECURITY DEFINER functions are unaffected
--      because current_user is not anon/authenticated for them.
--
-- Safe to re-run. Apply in the Supabase SQL editor.
-- =============================================================================

-- 1. Remove every table privilege the client roles hold (also clears column grants).
REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;

-- 2. Minimum privileges for signed-in users. RLS still limits rows to their own.
GRANT SELECT ON TABLE public.profiles TO authenticated;

-- Column-level UPDATE, granted only for columns that exist (premium onboarding
-- columns were added by a later migration).
-- KEEP IN SYNC with the `allowed` array in profiles_guard_client_writes below:
-- a new browser-writable profile column needs BOTH a GRANT and an allowlist
-- entry, otherwise the write fails with 42501.
DO $$
DECLARE
  col text;
  allowed text[] := ARRAY[
    'name', 'avatar_url', 'gender', 'date_of_birth',
    'push_enabled', 'language', 'onboarded', 'has_seen_onboarding'
  ];
BEGIN
  FOREACH col IN ARRAY allowed LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = col
    ) THEN
      EXECUTE format('GRANT UPDATE (%I) ON TABLE public.profiles TO authenticated', col);
    ELSE
      RAISE NOTICE 'profiles.% does not exist; not granted', col;
    END IF;
  END LOOP;
END $$;

-- service_role keeps full access (unchanged; restated for clarity).
GRANT ALL ON TABLE public.profiles TO service_role;

-- RLS policies: inserts are server-only now, so the client insert policy goes.
DROP POLICY IF EXISTS "own profile insert" ON public.profiles;

DROP POLICY IF EXISTS "own profile update" ON public.profiles;
CREATE POLICY "own profile update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 3. Defence-in-depth guard trigger.
CREATE OR REPLACE FUNCTION public.profiles_guard_client_writes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  -- Columns a signed-in user may change on their own row. updated_at is listed
  -- so trigger ordering with profiles_updated_at can never cause a false reject.
  -- KEEP IN SYNC with the column GRANT list above.
  allowed text[] := ARRAY[
    'name', 'avatar_url', 'gender', 'date_of_birth',
    'push_enabled', 'language', 'onboarded', 'has_seen_onboarding', 'updated_at'
  ];
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'profiles: client inserts are not allowed'
      USING ERRCODE = '42501';
  END IF;

  -- Allowlist comparison: any column NOT listed above (wallet_balance,
  -- held_balance, lifetime_*, is_flagged, referral_code, referred_by, device_id,
  -- email, streak_*, id, created_at, and any column added in future) must be
  -- unchanged.
  IF (to_jsonb(NEW) - allowed) IS DISTINCT FROM (to_jsonb(OLD) - allowed) THEN
    RAISE EXCEPTION 'profiles: that field can only be changed by the server'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.profiles_guard_client_writes() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS profiles_guard_client_writes ON public.profiles;
CREATE TRIGGER profiles_guard_client_writes
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_client_writes();

-- -----------------------------------------------------------------------------
-- Verification (run after applying; read-only)
-- -----------------------------------------------------------------------------
-- Expect exactly one row: authenticated | SELECT
--   SELECT grantee, privilege_type
--   FROM information_schema.role_table_grants
--   WHERE table_schema = 'public' AND table_name = 'profiles'
--     AND grantee IN ('anon', 'authenticated')
--   ORDER BY grantee, privilege_type;
--
-- Expect the 8 allowlisted columns only:
--   SELECT column_name
--   FROM information_schema.column_privileges
--   WHERE table_schema = 'public' AND table_name = 'profiles'
--     AND grantee = 'authenticated' AND privilege_type = 'UPDATE'
--   ORDER BY column_name;
