# Deployment Checklist - Quest Fixes & Feed Network Issues

**Status**: Code merged to `main` (commit 735ee92) ✅  
**Lovable Auto-Deploy**: Will sync automatically from main branch

---

## 1. Run SQL Migrations (CRITICAL - Do First!)

### Migration 1: Fix Check-In Day 1 Credits
**File**: `supabase/migrations/20270815000000_fix_checkin_step_index_constraint.sql`

Go to Supabase Dashboard → SQL Editor → New Query → Paste and run:

```sql
-- Drop the old constraint
ALTER TABLE public.quest_step_credits 
  DROP CONSTRAINT IF EXISTS quest_step_credits_step_index_check;

-- Add the new constraint allowing step_index >= 0
ALTER TABLE public.quest_step_credits 
  ADD CONSTRAINT quest_step_credits_step_index_check 
  CHECK (step_index >= 0);

-- Update the comment
COMMENT ON TABLE public.quest_step_credits IS
  'Records individual step reward credits for idempotency. Each (session_id, step_index) can only be credited once. step_index starts from 0 (Day 1 for check-in quests).';
```

### Migration 2: Add Binance Pay ID Column
**File**: `supabase/migrations/20270815000001_add_payout_methods_binance_pay_id.sql`

```sql
-- Add binance_pay_id column
ALTER TABLE public.payout_methods 
  ADD COLUMN IF NOT EXISTS binance_pay_id text;

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_payout_methods_binance_pay_id 
  ON public.payout_methods(binance_pay_id) 
  WHERE binance_pay_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.payout_methods.binance_pay_id IS
  'Binance Pay ID for Binance Pay withdrawal method. Stores the user''s Binance Pay identifier.';
```

---

## 2. Verify Deployment

### Check Lovable Auto-Deploy Status
- Go to your Lovable dashboard
- Verify the latest commit (735ee92) has been deployed
- Check deployment logs for errors

### Verify Environment Variables
Confirm these are set in production:
- ✅ `BITCOTASKS_API_KEY`: ly1j8t2vzuae1yr93w6j9xyc9el368
- ✅ `BITCOTASKS_BEARER`: 0c501a231a8781bf9ba2bb45249101a9fe6afcf65cb753995bdc0825aeabe03f
- ✅ `OFFERWALLME_API_KEY`: QHvPl1a7Rl8BdLSLh6MLDpTEJpN1a1
- ✅ `OFFERWALLME_SECRET_KEY`: kgQ4xBE8AVLYxL5RFtVLiPXapFMsG6Oo

---

## 3. Test Feed Quests (Should Now Work!)

### Test BitcoTasks PTC
1. Log into your app
2. Navigate to Quests → Network/Feed quests
3. You should see **BitcoTasks PTC** with ~70 available campaigns
4. **Before fix**: Error "API error: success"
5. **After fix**: Shows campaigns or "No campaigns available" (not an error)

### Test Offerwall.me
1. Look for Offerwall.me quests
2. Click to start a quest
3. **Before fix**: 403 EXPIRED_PUBLISHER_IDENTITY error
4. **After fix**: Quest starts successfully (7-day expiry instead of 48 hours)

### Check Logs
Open Vercel logs and verify:
- ✅ No more "BitcoTasks API error: success" errors
- ✅ No more "Offerwall.me 403 EXPIRED_PUBLISHER_IDENTITY" errors
- ✅ IP source shows "x-forwarded-for" or "cf-connecting-ip" (not "unknown")

---

## 4. Test Check-In Quest Tracking

### Verify Quest Tracking Hooks Are Working
1. Log into the app (creates check-in session automatically)
2. Open browser DevTools → Console
3. You should see heartbeat logs every 60 seconds:
   ```
   ⏰ Checkin heartbeat fired
   ✅ Checkin ping successful: { ... }
   ```

### Verify Day 1 Credit
1. New user signup should auto-complete Day 1 and credit 1₹
2. Check database:
   ```sql
   SELECT * FROM quest_checkin_days 
   WHERE user_id = '<new_user_id>' 
   ORDER BY day_index;
   ```
3. Verify `last_ping_at` is NOT null (was the old bug)

### Verify Live Timer
1. Check-in quest card should show:
   - Live mm:ss countdown timer
   - "Tracking..." button (not "Start Streak")
   - Progress dots for Day 1/2/3
2. Timer ticks every second (smooth UX)

---

## 5. Run Audit Script (Find Affected Users)

**Purpose**: Find users whose Day 1 was completed but never credited (due to old constraint bug)

```bash
npx tsx scripts/audit-checkin-day1-credits.ts
```

**Expected Output**: JSON report like:
```json
{
  "summary": {
    "totalAffectedSessions": 5,
    "totalMissingCredits": "5.00"
  },
  "affectedSessions": [
    {
      "sessionId": "uuid-1",
      "userId": "uuid-1",
      "questId": "uuid-1",
      "dayIndex": 0,
      "rewardAmount": "1.00",
      "markedCompletedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Do NOT auto-credit** - review the list first, then manually credit if needed.

---

## 6. Monitor Production for 24 Hours

### Watch For:
- ✅ Feed quests showing campaigns (not errors)
- ✅ Users completing check-in quests successfully
- ✅ No "unknown" IP source in logs
- ✅ Quest tracking heartbeats working
- ✅ Day 1 credits being issued

### Rollback Plan (If Needed):
```bash
git revert 735ee92
git push origin main
```

---

## What Was Fixed

### Quest Tracking Issues:
1. ✅ **Mounted tracking hooks globally** - `QuestTracking.tsx` in `AppShell.tsx`
2. ✅ **Auto-start check-in/active-time** - No "Start" button, tracks automatically
3. ✅ **Live mm:ss timers** - `QuestTimer.tsx` with smooth countdown
4. ✅ **Day 1 credits fixed** - Changed constraint from `step_index > 0` to `>= 0`
5. ✅ **Audit script created** - Find affected users (read-only, safe)
6. ✅ **SQL migrations ready** - Two migration files

### Production Feed Errors:
1. ✅ **BitcoTasks "success" status** - Now accepts both "200" AND "success"
2. ✅ **Offerwall.me 403 expiry** - Increased from 48 hours to 7 days
3. ✅ **IP source "unknown"** - Added `ipSource` to `FeedContext` type

---

## Files Changed (12 files, +971 lines)

**New Files:**
- `MIGRATION_SUMMARY.md` - Detailed migration guide
- `scripts/audit-checkin-day1-credits.ts` - Find affected users
- `src/components/QuestTimer.tsx` - Live countdown timer
- `src/components/QuestTracking.tsx` - Global tracking hooks
- `supabase/migrations/20270815000000_*.sql` - Fix step_index constraint
- `supabase/migrations/20270815000001_*.sql` - Add binance_pay_id column

**Modified Files:**
- `src/components/AppShell.tsx` - Added QuestTracking
- `src/components/QuestCard.tsx` - Integrated timer, changed button text
- `src/components/QuestDetailsDialog.tsx` - Show only Close for auto-start quests
- `src/components/StarterQuests.tsx` - Fetch last_ping_at
- `src/lib/quest-view.ts` - Added last_ping_at to type
- `src/lib/quests/feed-adapters.server.ts` - All 3 production fixes

---

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase logs (Database → Logs)
3. Check browser console for quest tracking logs
4. Review `MIGRATION_SUMMARY.md` for detailed troubleshooting

**Deployed**: 2024-11-06 (Friday)  
**Branch**: `main` (merged from `feature/quest-feed-network-fixes`)  
**Commit**: 735ee92
