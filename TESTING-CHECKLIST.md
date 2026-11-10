# Testing Checklist for Quest Fixes

**Branch**: `feature/fix-feed-quest-production-bugs`  
**Latest Commit**: `4de7560` - fix: active time quest tracking not starting for new users  
**Status**: ✅ All changes pushed and ready for testing

---

## Changes Included

### 1. Active Time Quest Tracking Fix (Commit 4de7560)
**Problem**: quest_active_time_progress had 0 rows - first ping never sent  
**Fix**: 
- Allow first ping without token (sends dummy UUID)
- Send first ping immediately on tracking start
- Fixed server to accept dummy token on first ping
- Added comprehensive logging at every stage

**Files Changed**:
- `src/hooks/useActiveTimeTracking.ts`
- `src/components/QuestTracking.tsx`
- `src/lib/quests/active-time.server.ts`

### 2. Feed Quest Session Lookup Fix (Commit ec0c93e)
**Problem**: PostgREST error 42703 - quest_sessions has no created_at column  
**Fix**: Changed all `.order("created_at")` to `.order("started_at")`

**Files Changed**:
- `src/lib/quests/feed-quests.server.ts` (line 279)
- `src/lib/quests.functions.ts` (lines 493, 691)

### 3. Quest Processing Safety Net (Commit 199f7f4 - in earlier history)
**Problem**: Quest token conversions could fail and lose user rewards  
**Fix**: Wrapped all quest processing in try/catch with fallback to normal wallet credit

**Files Changed**:
- `src/lib/automation/postback.server.ts`

### 4. Check-in Card UI Fixes (Commits 74ce583, ad2f408)
**Problem**: Text overlapping/cut off in check-in quest cards  
**Fix**: Adjusted spacing and line-clamp to prevent overlap

**Files Changed**:
- `src/components/QuestCard.tsx`

---

## Testing Instructions

### Active Time Quest - What to Look For:

1. **Open browser console** (F12)
2. **Log in** and go to home page
3. **Look for these console logs** (should appear immediately):
   ```
   [QuestTracking] Component mounted - tracking hooks active
   [QuestTracking] Active time quest found for user: <quest_key>
   [useActiveTimeTracking] Hook mounted: { questKey: '...', initialToken: null }
   [active-time] Starting tracking for quest: <quest_key>
   [active-time] Sending ping for quest: <quest_key> { hasToken: false, timeSinceActivity: 0 }
   ```

4. **Within 5 seconds**, you should see:
   ```
   [active-time] Ping response: { success: true, reason: undefined, hasNextToken: true }
   [active-time] Ping successful, time credited
   ```

5. **Check database** (immediately after first ping):
   ```sql
   SELECT * FROM quest_active_time_progress 
   WHERE user_id = '<your_user_id>' 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
   **Expected**: Row exists with `total_seconds = 0`, `last_ping_token` is NOT null

6. **Wait 30 seconds**, tap/scroll the page, check console for next ping:
   ```
   [active-time] Sending ping for quest: <quest_key> { hasToken: true, timeSinceActivity: <low number> }
   [active-time] Ping response: { success: true, ... }
   ```

7. **Check database again**:
   ```sql
   SELECT total_seconds, today_seconds, last_ping_at 
   FROM quest_active_time_progress 
   WHERE user_id = '<your_user_id>';
   ```
   **Expected**: `total_seconds` increased by 25-35 seconds

8. **After 2 minutes total** (~4 pings):
   - total_seconds should be ~100-120
   - If target is 120s (2 min), reward should auto-claim
   - Check `credited_at` is set
   - Check wallet_transactions for reward

### Feed Quest - What to Look For:

1. **Start a feed quest** (PTC, Shortlink, or Article)
2. **Open Step 1**
3. **Check console** - should NOT see "No session found" error
4. **Check Vercel logs** if error occurs - should see:
   ```
   [feed-quest] No session found: questKey=<key>, userId=<id>
   ```
   This tells you exactly what values were sent

5. **Complete the step** (visit link, wait timer)
6. **Check database**:
   ```sql
   SELECT * FROM quest_network_completions 
   WHERE session_id = '<session_id>' 
   AND kind = 'feed'
   ORDER BY completed_at DESC;
   ```
   **Expected**: Row created with correct step_index

### Check-in Quest - What to Look For:

1. **Look at check-in card** on home page
2. **Verify text is NOT overlapping**:
   - Title "Check-In" visible
   - Description (1 line) visible
   - Day indicators clear
   - "Keep app open for 5m" visible
   - Progress "0 / 3" visible
   - "3 more days to go" NOT cut off at bottom

3. **Day 1 should auto-complete** at registration:
   ```sql
   SELECT * FROM quest_step_credits 
   WHERE user_id = '<new_user_id>' 
   AND step_index = 0;
   ```
   **Expected**: Row exists for step 0

---

## If Something Fails

### Active Time NOT Tracking:
1. Check console for which stage stops
2. Check `quest_active_time_progress` table - does row exist?
3. Check Vercel function logs for ping errors
4. Paste the console logs here

### Feed Quest "No Session Found":
1. Check Vercel logs for the exact questKey and userId
2. Query database:
   ```sql
   SELECT * FROM quest_sessions 
   WHERE quest_key = '<from_log>' 
   AND user_id = '<from_log>';
   ```
3. If row exists, check `status` and `started_at` columns

### Check-in Text Still Overlapping:
1. Take screenshot
2. Check which text is overlapping which
3. Use browser dev tools to inspect spacing

---

## Quick Database Queries for Testing

```sql
-- Check active time progress for a user
SELECT 
  quest_key,
  total_seconds,
  today_seconds,
  last_ping_at,
  credited_at,
  created_at
FROM quest_active_time_progress
WHERE user_id = '<user_id>'
ORDER BY created_at DESC;

-- Check feed quest sessions
SELECT 
  quest_key,
  status,
  started_at,
  verified_at
FROM quest_sessions
WHERE user_id = '<user_id>'
AND quest_key LIKE 'feed_%'
ORDER BY started_at DESC;

-- Check feed quest completions
SELECT 
  qnc.step_index,
  qnc.completed_at,
  qs.quest_key
FROM quest_network_completions qnc
JOIN quest_sessions qs ON qs.id = qnc.session_id
WHERE qs.user_id = '<user_id>'
AND qnc.kind = 'feed'
ORDER BY qnc.completed_at DESC;

-- Check check-in credits
SELECT 
  qsc.step_index,
  qsc.step_reward,
  qsc.credited_at,
  qs.quest_key
FROM quest_step_credits qsc
JOIN quest_sessions qs ON qs.id = qsc.session_id
WHERE qs.user_id = '<user_id>'
AND qs.quest_type = 'checkin'
ORDER BY qsc.credited_at DESC;

-- Check recent wallet transactions
SELECT 
  amount,
  type,
  notes,
  created_at
FROM wallet_transactions
WHERE user_id = '<user_id>'
ORDER BY created_at DESC
LIMIT 10;
```

---

## All Commits on Branch

```
4de7560 - fix: active time quest tracking not starting for new users
ec0c93e - fix: change quest_sessions ordering from created_at to started_at (42703 error fix)
ea57311 - fix: add logging for feed quest session lookup failure (questKey, userId)
74ce583 - fix: reduce bottom spacing to prevent '3 more days to go' text cutoff
ad2f408 - fix: replace webkit-box with tailwind line-clamp to prevent text overlap in check-in cards
2518553 - fix: reduce check-in quest description to 1 line to prevent text cutoff
5c82528 - fix: increase spacing in check-in quest card to prevent text overlap
0daf796 - docs: comprehensive quest token critical fixes summary
199f7f4 - fix: wrap quest processing in try/catch with fallback + fix session errors
4acf165 - fix: extract normalizeQuest to shared module (CRITICAL normalize() crash fix)
```

---

## Expected Results Summary

| Feature | Expected Behavior | Check |
|---------|------------------|-------|
| Active Time Tracking | Progress row created on first ping | `quest_active_time_progress` has row |
| Active Time Pings | Every 30s, credits 25-35s | `total_seconds` increases |
| Active Time Reward | Auto-claims at 120s | `credited_at` set, wallet credited |
| Feed Quest Step | Opens without error | Console has no "No session found" |
| Feed Quest Completion | Records step completion | `quest_network_completions` has row |
| Check-in Card UI | All text visible, no overlap | Visual check |
| Check-in Day 1 | Auto-completes at registration | `quest_step_credits` step 0 exists |

---

**Ready to test!** Merge to main/production and run through the checklist above.
