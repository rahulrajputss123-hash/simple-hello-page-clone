# Network Quest Progress Fix - Verification Guide

## Problem Fixed
Network quest cards showed "0 of 3" progress even when completions existed in `quest_network_completions`. The card reads `quest_sessions.current_step`, but the network postback path never updated this field.

## Solution
After inserting a `quest_network_completions` row, the postback handler now:
1. Counts all network completions for that session (WHERE kind = 'network')
2. Updates `quest_sessions.current_step` to that count
3. Uses count (not increment) to make it idempotent - repeated postbacks don't double-count

## Changes
- **File:** `src/lib/automation/postback.server.ts`
- **Lines:** 987-1000 (after the successful completion insert)
- **Test session:** `b506c638-d088-4c3f-bfeb-656ca83bb7c6`

## Verification Steps

### 1. Check Database (Production)
```sql
-- Check completions for the test session
SELECT * FROM quest_network_completions 
WHERE session_id = 'b506c638-d088-4c3f-bfeb-656ca83bb7c6' 
  AND kind = 'network';

-- Expected: 1 row with step_index = 1, provider = b0f17d40-804f-4742-84be-189c2ebb8de9

-- Check quest_sessions.current_step
SELECT current_step, quest_key, status, user_id 
FROM quest_sessions 
WHERE id = 'b506c638-d088-4c3f-bfeb-656ca83bb7c6';

-- Expected: current_step = 1 (matching the count of completions)
```

### 2. Run Verification Test
```bash
# This test checks the session and calls getNetworkQuestProgressImpl
npm test -- --run verify-network-progress.test.ts

# Expected output:
# Completions found: 1
# Session current_step: 1
# Session quest_key: Network
# Progress returned: { done: 1, required: 3, providers: 3 }
```

### 3. Check UI
1. Log in as the user who owns session `b506c638-d088-4c3f-bfeb-656ca83bb7c6`
2. Navigate to the quests page
3. Find the "Network" quest card
4. **Expected:** Card shows "1 of 3" progress (not "0 of 3")
5. Click the card to open quest details dialog
6. **Expected:** Dialog shows "1 of 3" with one provider marked complete

### 4. Test New Postback
To verify the fix works for new completions:
1. Use session `b506c638-d088-4c3f-bfeb-656ca83bb7c6`
2. Send a network quest postback from a different provider
3. Check `quest_sessions.current_step` → should be 2
4. Check UI → should show "2 of 3"

## Test Results
- ✅ All 297 existing tests pass
- ✅ No changes to survey or feed code
- ✅ Uses count (idempotent) instead of increment
- ✅ Card component unchanged (still reads current_step)

## Commit
```
c6396ea fix: update quest_sessions.current_step for network quest progress
```

## Expected Behavior After Deploy

### Before Fix
- Network completion inserted → ✅
- `current_step` updated → ❌ (stayed at 0)
- Card shows progress → ❌ (showed "0 of 3")

### After Fix
- Network completion inserted → ✅
- `current_step` updated → ✅ (set to completion count)
- Card shows progress → ✅ (shows "1 of 3", "2 of 3", etc.)
