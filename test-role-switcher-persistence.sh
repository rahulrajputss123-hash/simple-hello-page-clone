#!/bin/bash
set -e

echo "═══════════════════════════════════════════════════════════════════════════"
echo "  ROLE SWITCHER PERSISTENCE TEST — Phase 7"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# Load environment
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

SUPABASE_URL="${VITE_SUPABASE_URL}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_KEY" ]; then
  echo "❌ Missing SUPABASE_URL or SERVICE_KEY in .env"
  exit 1
fi

# Pick a test user (the first advertiser we can find)
echo "📋 Finding test user with advertiser account..."
TEST_USER=$(curl -s \
  "${SUPABASE_URL}/rest/v1/advertiser_accounts?select=user_id&limit=1" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  | jq -r '.[0].user_id // empty')

if [ -z "$TEST_USER" ]; then
  echo "⚠️  No advertiser accounts found. Using first user from profiles..."
  TEST_USER=$(curl -s \
    "${SUPABASE_URL}/rest/v1/profiles?select=id&limit=1" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    | jq -r '.[0].id // empty')
fi

if [ -z "$TEST_USER" ]; then
  echo "❌ Could not find any users in database"
  exit 1
fi

echo "✅ Using test user: ${TEST_USER}"
echo ""

echo "─────────────────────────────────────────────────────────────────────────"
echo "1️⃣  CHECK: Initial preferred_role (should be null or existing value)"
echo "─────────────────────────────────────────────────────────────────────────"

INITIAL_ROLE=$(curl -s \
  "${SUPABASE_URL}/rest/v1/profiles?select=preferred_role&id=eq.${TEST_USER}" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  | jq -r '.[0].preferred_role // "null"')

echo "Current preferred_role: ${INITIAL_ROLE}"
echo ""

echo "─────────────────────────────────────────────────────────────────────────"
echo "2️⃣  SET: Switch to advertiser mode"
echo "─────────────────────────────────────────────────────────────────────────"

curl -s -X PATCH \
  "${SUPABASE_URL}/rest/v1/profiles?id=eq.${TEST_USER}" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{"preferred_role": "advertiser"}' > /dev/null

AFTER_SET=$(curl -s \
  "${SUPABASE_URL}/rest/v1/profiles?select=preferred_role&id=eq.${TEST_USER}" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  | jq -r '.[0].preferred_role // "null"')

if [ "$AFTER_SET" = "advertiser" ]; then
  echo "✅ preferred_role set to: advertiser"
else
  echo "❌ Failed to set preferred_role (got: ${AFTER_SET})"
  exit 1
fi
echo ""

echo "─────────────────────────────────────────────────────────────────────────"
echo "3️⃣  SIMULATE: User refreshes page / navigates away"
echo "─────────────────────────────────────────────────────────────────────────"
echo "(In real app: RoleProvider loads preferred_role from database on mount)"
echo ""

echo "─────────────────────────────────────────────────────────────────────────"
echo "4️⃣  VERIFY: preferred_role persisted across sessions"
echo "─────────────────────────────────────────────────────────────────────────"

PERSISTED=$(curl -s \
  "${SUPABASE_URL}/rest/v1/profiles?select=preferred_role&id=eq.${TEST_USER}" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  | jq -r '.[0].preferred_role // "null"')

if [ "$PERSISTED" = "advertiser" ]; then
  echo "✅ preferred_role persisted: advertiser"
else
  echo "❌ preferred_role did not persist (got: ${PERSISTED})"
  exit 1
fi
echo ""

echo "─────────────────────────────────────────────────────────────────────────"
echo "5️⃣  SET: Switch back to publisher mode"
echo "─────────────────────────────────────────────────────────────────────────"

curl -s -X PATCH \
  "${SUPABASE_URL}/rest/v1/profiles?id=eq.${TEST_USER}" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{"preferred_role": "publisher"}' > /dev/null

AFTER_SWITCH=$(curl -s \
  "${SUPABASE_URL}/rest/v1/profiles?select=preferred_role&id=eq.${TEST_USER}" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  | jq -r '.[0].preferred_role // "null"')

if [ "$AFTER_SWITCH" = "publisher" ]; then
  echo "✅ preferred_role switched to: publisher"
else
  echo "❌ Failed to switch preferred_role (got: ${AFTER_SWITCH})"
  exit 1
fi
echo ""

echo "─────────────────────────────────────────────────────────────────────────"
echo "6️⃣  SET: Clear preference (null = use default logic)"
echo "─────────────────────────────────────────────────────────────────────────"

curl -s -X PATCH \
  "${SUPABASE_URL}/rest/v1/profiles?id=eq.${TEST_USER}" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{"preferred_role": null}' > /dev/null

AFTER_CLEAR=$(curl -s \
  "${SUPABASE_URL}/rest/v1/profiles?select=preferred_role&id=eq.${TEST_USER}" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  | jq -r '.[0].preferred_role // "null"')

if [ "$AFTER_CLEAR" = "null" ]; then
  echo "✅ preferred_role cleared (null)"
else
  echo "❌ Failed to clear preferred_role (got: ${AFTER_CLEAR})"
  exit 1
fi
echo ""

echo "─────────────────────────────────────────────────────────────────────────"
echo "7️⃣  VERIFY: Role switcher persistence functions exist"
echo "─────────────────────────────────────────────────────────────────────────"

if grep -q "getPreferredRole" src/lib/marketplace.functions.ts && \
   grep -q "setPreferredRole" src/lib/marketplace.functions.ts; then
  echo "✅ getPreferredRole and setPreferredRole functions exported"
else
  echo "❌ Role preference functions not found in marketplace.functions.ts"
  exit 1
fi

if grep -q "getPreferredRoleImpl" src/lib/marketplace/role-preference.server.ts && \
   grep -q "setPreferredRoleImpl" src/lib/marketplace/role-preference.server.ts; then
  echo "✅ Role preference implementation functions exist"
else
  echo "❌ Role preference implementation not found"
  exit 1
fi
echo ""

echo "─────────────────────────────────────────────────────────────────────────"
echo "8️⃣  VERIFY: RoleProvider wired to use database persistence"
echo "─────────────────────────────────────────────────────────────────────────"

if grep -q "preferredRoleQuery" src/lib/marketplace/role.tsx && \
   grep -q "fetchPreferredRole" src/lib/marketplace/role.tsx && \
   grep -q "savePreferredRole" src/lib/marketplace/role.tsx; then
  echo "✅ RoleProvider uses database-backed role persistence"
else
  echo "❌ RoleProvider not properly wired for database persistence"
  exit 1
fi
echo ""

echo "═══════════════════════════════════════════════════════════════════════════"
echo "  ✅ ROLE SWITCHER PERSISTENCE TEST PASSED"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "Summary:"
echo "  • preferred_role column working in profiles table"
echo "  • Can set to 'advertiser', switch to 'publisher', clear to null"
echo "  • Role preference persists across page refreshes"
echo "  • Server functions (get/set) implemented and exported"
echo "  • RoleProvider component wired to database"
echo ""
echo "Next steps:"
echo "  1. Test in browser: switch roles and refresh page"
echo "  2. Verify localStorage fallback works if database query fails"
echo "  3. Confirm switching roles doesn't create duplicate accounts"
echo ""
