# Feed Quest Production Fixes

**Branch**: `feature/fix-feed-quest-production-bugs`  
**Commit**: `258e45b`  
**PR**: https://github.com/rahulrajputss123-hash/simple-hello-page-clone/compare/main...feature/fix-feed-quest-production-bugs

## Summary

Fixed 7 critical production bugs preventing Ptc_2, top_shortlink, and Top_articles feed quests from working end-to-end on cashgpt.in.

## What Was Fixed

### 1. ✅ quest_sessions insert missing NOT NULL columns

**Issue**: Starting quest failed with:
```
null value in column "reward_amount" of relation "quest_sessions" violates not-null constraint
```

**Fix**: Include all NOT NULL columns in insert:
- `user_id` ✓
- `quest_key` ✓
- `quest_type` = "feed" (NEW)
- `current_step` = 0 (NEW)
- `ads_required` = quest.ads_required ?? 0 (NEW)
- `ads_watched` = 0 (NEW)
- `reward_amount` = quest.reward_amount (NEW)
- `status` = "started" ✓
- `started_at` = now() ✓
- `feed_snapshot` = snapshot ✓

**Test**: `tests/feed-quest-production-fixes.test.ts` - verifies insert payload includes all required columns

---

### 2. ✅ Offerwall.me identity expiry incorrect

**Issue**: 403 EXPIRED_PUBLISHER_IDENTITY for both ptc and shortlink. Identity expiry was 7 days (604800 seconds).

**Fix**: Set expiry to **1 hour (3600 seconds)** matching the pattern in `getOfferwallMeSignedUrlImpl` from `admin.server.ts`:
```typescript
const nowSeconds = Math.floor(Date.now() / 1000);
const identityExpires = nowSeconds + 3600; // 1 hour from now
const signature = generateOfferwallMeSignature(apiKey, userRef, identityExpires, secret);
```

**Test**: Verifies `identityExpires = now + 3600` and HMAC message includes correct value

---

### 3. ✅ min_reward_usd filter removed campaigns

**Issue**: Minimum reward filter (0.05 USD) removed BitcoTasks campaigns with rewards as low as 0.0008 USD. Same providers returned 4 usable items for Top_ptc2 (min 0.0001) and 0 for Ptc_2 (min 0.05).

**Fix**: For feed quests, **min_reward_usd does NOT remove campaigns**. It's only used for ordering/prioritization if needed. Campaigns are ranked by reward DESC, but all campaigns are kept.

**Test**: Verifies campaigns below min_reward_usd are NOT filtered out, only sorted

---

### 4. ✅ Backup count not used when shortfall

**Issue**: Top_ptc2 found 4 of 5 steps and failed with "Not enough campaigns available" instead of using backups.

**Fix**: When `steps.length < steps_count`, use `backup_count` to fill the shortfall:
```typescript
if (steps.length < quest.steps_count) {
  const needed = quest.steps_count - steps.length;
  const canUseBackups = Math.min(needed, backups.length);
  
  if (canUseBackups > 0) {
    console.log(`[feed-quest] Using ${canUseBackups} backups to fill ${needed} missing steps`);
    steps.push(...backups.splice(0, canUseBackups));
  }
  
  // Still not enough after using backups?
  if (steps.length < quest.steps_count) {
    return { success: false, reason: "unavailable" };
  }
}
```

**Test**: Verifies backups fill missing steps before failing

---

### 5. ✅ BitcoTasks article endpoint error handling

**Issue**: BitcoTasks article endpoint returns HTTP 200 with a status string, and the code threw "BitcoTasks article error: success".

**Fix**: Treat HTTP 200 with data array as success. The docs say status is the string "200". Do not throw on message "success":
```typescript
const hasData = json.data && Array.isArray(json.data) && json.data.length > 0;
const isSuccessStatus = json.status === "200" || json.status === "success";
const isSuccessMessage = json.message === "success" || !json.message;

// If HTTP 200 and has data, it's success regardless of status field
if (response.ok && hasData) {
  console.log(`[feed] BitcoTasks ${kind}: ${json.data.length} campaigns available`);
}
// If status is explicitly not success AND message is not success, it's an error
else if (!isSuccessStatus && !isSuccessMessage && json.status) {
  throw new Error(`BitcoTasks ${kind} error: ${json.message ?? json.status}`);
}
// If no data available, return empty array (not an error)
else if (!hasData) {
  console.log(`[feed] BitcoTasks ${kind}: No campaigns available`);
  return [];
}
```

**Test**: Verifies status="200", status="success", and HTTP 200 with data[] all succeed

---

### 6. ✅ BitcoTasks credentials from wrong source

**Issue**: Credentials were read from the `sdk_offerwall_providers` row where they are empty.

**Fix**: Read from environment variables:
```typescript
const apiKey = process.env.BITCOTASKS_API_KEY;
const bearerToken = process.env.BITCOTASKS_BEARER;
```

**Test**: Verifies credentials come from `process.env`, not from database row

---

### 7. ✅ IP source logging misleading

**Issue**: Logged "IP source: not-tracked" instead of actual source.

**Fix**: Log the real IP source. The IP is already correctly extracted from x-forwarded-for:
```typescript
console.log(`[feed]   IP source: ${context.ipSource ?? "unknown"}`);
```

And pass `ipSource` through in `FeedContext`:
```typescript
const feedContext: FeedContext = {
  userRef: userId,
  ip: context.ip,
  country: context.country,
  userAgent: context.userAgent,
  ipSource: context.ipSource, // Pass through for logging
};
```

**Test**: Verifies ipSource is logged correctly (cf-connecting-ip, x-forwarded-for, x-real-ip)

---

## Testing

### New Tests
- ✅ **17 production fix tests** in `tests/feed-quest-production-fixes.test.ts`
- All tests pass

### Full Test Suite
- ✅ **289/289 tests pass**
- 26 skipped (intentional)
- 2 todo (future work)

### Test Coverage
1. quest_sessions insert includes all NOT NULL columns
2. Offerwall.me identity expiry is 1 hour (3600 seconds)
3. min_reward_usd does not filter campaigns
4. backup_count fills shortfall
5. BitcoTasks treats HTTP 200 + data as success
6. BitcoTasks reads credentials from env vars
7. IP source logging shows actual source

### TypeScript
- ✅ Compiles without errors

---

## Files Changed

### Modified
- `src/lib/quests/feed-quests.server.ts` - Fixed quest_sessions insert, pass ipSource
- `src/lib/quests/feed-adapters.server.ts` - Fixed Offerwall.me expiry, BitcoTasks error handling, IP logging
- `src/lib/quests/feed-quests.test.ts` - Updated test for min_reward_usd bug fix

### New
- `tests/feed-quest-production-fixes.test.ts` - 17 production fix tests
- `FINAL_IMPLEMENTATION_SUMMARY.md` - Quest token bug fix summary
- `FEED_QUEST_PRODUCTION_FIXES.md` - This file

---

## Database Impact

- ❌ No schema changes
- ❌ No migration files needed
- ✅ Uses existing schema

---

## Deployment

After merge and Vercel production deploy:

### Test Each Quest with Indian IP

1. **Ptc_2** (feed_ptc)
   - Start quest on cashgpt.in
   - Should show 3 steps from BitcoTasks + Offerwall.me
   - Reward shown: ₹0.50

2. **top_shortlink** (feed_shortlink)
   - Start quest on cashgpt.in
   - Should show steps from BitcoTasks + Offerwall.me
   - Reward shown: ₹0.005

3. **Top_articles** (feed_article)
   - Start quest on cashgpt.in
   - Should show steps from BitcoTasks (Offerwall.me doesn't support articles)
   - Reward shown: ₹0.20

### Production Log Verification

Each quest start should log:
```
[feed-quest] Started {quest_key} for user {user_id}, session {session_id}, {N} steps + {M} backups
[feed] BitcoTasks {kind}: {count} campaigns available
[feed] Offerwall.me {kind}: identity expires at {timestamp} (now: {now}, TTL: 3600s)
[feed]   IP source: x-forwarded-for (or cf-connecting-ip)
```

---

## Environment Variables Required

Ensure these are set in Vercel production:

```bash
# Offerwall.me
OFFERWALLME_API_KEY=<api-key>
OFFERWALLME_SECRET_KEY=<secret-key>
OFFERWALLME_BEARER_TOKEN=<bearer-token>

# BitcoTasks
BITCOTASKS_API_KEY=<api-key>
BITCOTASKS_BEARER=<bearer-token>
```

---

## PR Checklist

- ✅ All 7 production bugs fixed
- ✅ 17 new tests added
- ✅ Full test suite passes (289/289)
- ✅ TypeScript compiles
- ✅ No schema changes
- ✅ Commit message describes all fixes
- ✅ Branch pushed to remote
- ⏳ PR created (manual step required)
- ⏳ Deployed to production
- ⏳ Tested on cashgpt.in with Indian IP

---

## Expected User Experience

### Before Fix
- ❌ Starting quest: "null value in column 'reward_amount' violates not-null constraint"
- ❌ Offerwall.me: 403 EXPIRED_PUBLISHER_IDENTITY
- ❌ BitcoTasks rewards filtered out (too low)
- ❌ Not enough campaigns (backups not used)
- ❌ BitcoTasks article: "error: success"

### After Fix
- ✅ User taps Start on quest → quest starts and shows steps
- ✅ Campaigns picked for user's IP/country
- ✅ BitcoTasks + Offerwall.me campaigns merged, sorted by reward DESC
- ✅ Top N campaigns shown (N = steps_count + backup_count from quest row)
- ✅ User sees quest reward (0.5, 0.005, 0.2), NOT network payout
- ✅ Quest does NOT fail if steps_count + backup_count items can be found

---

## Next Steps

1. **Create PR**: https://github.com/rahulrajputss123-hash/simple-hello-page-clone/compare/main...feature/fix-feed-quest-production-bugs
2. **Review PR**: Check all changes and tests
3. **Merge to main**: DO NOT force push or rebase (Lovable sync)
4. **Deploy**: Vercel will auto-deploy main branch to production
5. **Test**: Start each quest on cashgpt.in with Indian IP
6. **Monitor**: Check production logs for errors
7. **Verify**: Confirm users can complete quests end-to-end

---

## Commit

```
258e45b - fix: feed quest production failures (7 critical bugs)
```

All changes committed to `feature/fix-feed-quest-production-bugs` branch.
Ready for PR and production deployment.
