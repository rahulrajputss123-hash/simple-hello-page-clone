# Database Migration Summary

## Overview
This document summarizes the SQL migrations needed to fix check-in quest tracking and related issues.

## Migrations Created

### 1. Fix Check-In Step Index Constraint
**File:** `supabase/migrations/20270815000000_fix_checkin_step_index_constraint.sql`

**Issue:** The `quest_step_credits` table had a CHECK constraint `step_index > 0` which prevented Day 1 (step_index 0) credits from being inserted for check-in quests.

**Fix:** Changed constraint to `step_index >= 0` to allow Day 1 credits.

**Impact:** 
- ✅ Safe to run - constraint relaxation only
- ✅ Existing data unaffected
- ✅ Future Day 1 credits will now succeed

**SQL:**
```sql
ALTER TABLE public.quest_step_credits 
  DROP CONSTRAINT IF EXISTS quest_step_credits_step_index_check;

ALTER TABLE public.quest_step_credits 
  ADD CONSTRAINT quest_step_credits_step_index_check 
  CHECK (step_index >= 0);
```

### 2. Add Binance Pay ID Column
**File:** `supabase/migrations/20270815000001_add_payout_methods_binance_pay_id.sql`

**Issue:** The `payout_methods` table was missing `binance_pay_id` column for Binance Pay withdrawals.

**Fix:** Added nullable `binance_pay_id text` column with index.

**Impact:**
- ✅ Safe to run - adding nullable column
- ✅ Existing rows will have NULL
- ✅ Non-breaking change

**SQL:**
```sql
ALTER TABLE public.payout_methods 
  ADD COLUMN IF NOT EXISTS binance_pay_id text;

CREATE INDEX IF NOT EXISTS idx_payout_methods_binance_pay_id 
  ON public.payout_methods(binance_pay_id) 
  WHERE binance_pay_id IS NOT NULL;
```

## Already Fixed (No Migration Needed)

### createAnonClient Issue
**Status:** ✅ Already fixed in code

**Issue:** `checkMaintenanceStatusImpl` was trying to use `createAnonClient` which doesn't exist.

**Fix:** Changed to use `supabaseAdmin` from `@/integrations/supabase/client.server`.

**Code Location:** `src/lib/coinquest.server.ts` line 2672

### quest_label in quest_sessions
**Status:** ℹ️ Not actually needed

**Analysis:** The `quest_sessions` table doesn't have a `quest_label` column, but it's not being inserted anywhere in the codebase. The quest label comes from the `quests` table via JOIN when needed. No migration required.

## Audit Script

### Check-In Day 1 Credits Audit
**File:** `scripts/audit-checkin-day1-credits.ts`

**Purpose:** Finds all check-in sessions where Day 1 is completed but has no corresponding `quest_step_credits` row (due to the step_index > 0 constraint).

**Safety:** Admin-safe - only LISTS affected sessions, does NOT auto-credit.

**Usage:**
```bash
npx tsx scripts/audit-checkin-day1-credits.ts
```

**Output:**
- List of affected sessions with user_id, quest_key, amounts
- JSON report saved to `orphaned-day1-credits-report.json`
- Total count and amount to be credited

## Deployment Checklist

1. ✅ Review migration SQL files
2. ⬜ Backup production database
3. ⬜ Run migrations in order:
   - `20270815000000_fix_checkin_step_index_constraint.sql`
   - `20270815000001_add_payout_methods_binance_pay_id.sql`
4. ⬜ Verify migrations applied successfully
5. ⬜ Run audit script to find orphaned Day 1 credits
6. ⬜ Review audit report
7. ⬜ Manually credit affected users (or create batch credit script)
8. ⬜ Deploy code changes
9. ⬜ Verify check-in quest tracking works in production
10. ⬜ Monitor logs for any "Cannot determine user IP address" errors

## Code Changes Summary

### New Components
- `src/components/QuestTracking.tsx` - Global tracking hooks
- `src/components/QuestTimer.tsx` - Live timer UI with mm:ss display

### Modified Components
- `src/components/AppShell.tsx` - Mounts QuestTracking globally
- `src/components/QuestCard.tsx` - Shows live timers, removed "Start Streak"
- `src/components/QuestDetailsDialog.tsx` - Checkin/active_time show "Close" only
- `src/components/StarterQuests.tsx` - Fetches last_ping_at for local ticking

### Modified Libraries
- `src/lib/quest-view.ts` - Added last_ping_at to QuestSessionView type

### Scripts
- `scripts/audit-checkin-day1-credits.ts` - Day 1 credit audit tool

## Testing Recommendations

1. **Check-In Quest Flow:**
   - Create new check-in quest session
   - Verify Day 1 completes and credits successfully
   - Verify Day 2 unlocks after 24 hours
   - Verify Day 3 completes and final reward credited

2. **Active Time Quest Flow:**
   - Verify tracking starts automatically
   - Verify timer shows in quest card
   - Verify "Still here?" prompt appears after 10min inactivity
   - Verify daily cap handling

3. **IP Extraction:**
   - Monitor logs for "Cannot determine user IP address" errors
   - Verify cf-connecting-ip, x-forwarded-for, x-real-ip work
   - Verify port stripping from x-forwarded-for

4. **Audit Script:**
   - Run against production (read-only)
   - Verify counts match expectations
   - Review JSON report for accuracy

## Notes

- All migrations are safe to run (constraint relaxation, adding nullable columns)
- Code changes are backward compatible
- Tracking hooks are mounted globally but only activate when user has active quests
- Timer UI ticks locally between server pings for smooth UX
- Day 1 auto-credits require manual review before bulk crediting
