# Task Tracking Investigation Summary

## Problem

Two critical task tracking bugs:

1. **CPX Offerwall Earning Task**: Has `task_events` records with conversions from 2 users, but `user_tasks` table shows 0 records
2. **Complete Shortlinks Task**: Has 576 users assigned but 0 completed, despite `task_events` having shortlink records

## How Task Tracking Works

### Architecture Flow

```
User Action → Postback Handler → recordTaskEvent() → syncUserTasks() → user_tasks table
```

### Detailed Steps

1. **Event Recording** (`postback.server.ts` → `recordTaskEvent()`)
   - User completes offer/shortlink/etc
   - Postback received from provider
   - `recordTaskEvent()` called with:
     - `userId`: User ID
     - `eventType`: e.g., "offerwall_earning", "shortlink"
     - `eventKey`: Unique identifier (conversion ID)
     - `quantity`: Amount (dollars for earning, 1 for completions)
     - `providerId`: Provider ID (for offerwall_earning)
   - Row inserted into `task_events` table (idempotent via unique constraint)
   - `syncUserTasks()` automatically triggered

2. **Progress Counting** (`countProgress()`)
   - Queries `task_events` for matching events since period start
   - For `offerwall_earning`: sums dollar quantities
   - For other types: counts or sums quantities
   - **Provider filtering**: If task has `earning_provider_id`, only counts events with matching `provider_id`

3. **User Task Sync** (`syncUserTasks()`)
   - Fetches all active, non-manual tasks
   - For each task:
     - Checks if task applies to this event type
     - Validates date range (starts_at, ends_at)
     - Validates lock state
     - Computes period_key (daily, weekly, lifetime)
     - Counts progress from task_events
     - Creates or updates user_tasks row
     - If completed and reward pending, credits wallet

## Potential Root Causes

### 1. Task Configuration Issues

**Date/Time Filters**
```sql
-- Check if tasks are in valid date range
SELECT id, title, starts_at, ends_at,
  starts_at > NOW() as "not_started",
  ends_at < NOW() as "ended"
FROM tasks
WHERE task_type IN ('offerwall_earning', 'shortlink');
```

**Symptoms**: 
- Task not started yet: `starts_at` is in future
- Task already ended: `ends_at` is in past

**Fix**: Set dates to NULL or valid range

---

**Lock State**
```sql
-- Check if tasks are locked
SELECT id, title, lock_type, unlock_at,
  (lock_type = 'time' AND unlock_at > NOW()) as "time_locked"
FROM tasks
WHERE task_type IN ('offerwall_earning', 'shortlink');
```

**Symptoms**:
- Lock type "time" with future unlock_at date
- Lock type "first_withdrawal" for users who haven't withdrawn

**Fix**: 
- Set `lock_type = 'none'`
- Set `unlock_at` to past date
- Or ensure users meet unlock criteria

---

### 2. Provider ID Mismatch (CPX Issue)

**The Problem**: 
Task tracking for `offerwall_earning` uses `earning_provider_id` to scope tasks to specific providers. If there's a mismatch between the task's `earning_provider_id` and the events' `provider_id`, progress won't count.

**Diagnosis Query**:
```sql
-- Check provider ID alignment
SELECT 
  t.id as task_id,
  t.title,
  t.earning_provider_id as task_provider_id,
  tp.slug as task_provider,
  COUNT(DISTINCT te.provider_id) as unique_event_providers,
  STRING_AGG(DISTINCT ep.slug, ', ') as event_providers,
  COUNT(*) as total_events
FROM tasks t
LEFT JOIN providers tp ON tp.id = t.earning_provider_id
LEFT JOIN task_events te ON te.event_type = 'offerwall_earning'
LEFT JOIN providers ep ON ep.id = te.provider_id
WHERE t.task_type = 'offerwall_earning'
GROUP BY t.id, t.title, t.earning_provider_id, tp.slug;
```

**Expected Behavior**:
- Task with `earning_provider_id = 'cpx-uuid'` → Only counts events with `provider_id = 'cpx-uuid'`
- Task with `earning_provider_id = NULL` → Counts events from ALL providers

**Fix**:
```sql
-- Option A: Track all providers (remove provider scope)
UPDATE tasks 
SET earning_provider_id = NULL 
WHERE task_type = 'offerwall_earning' 
  AND title = 'CPX Earning Task';

-- Option B: Match task to correct provider
-- First, find correct provider ID
SELECT id, slug FROM providers WHERE slug = 'cpxresearch';

-- Then update task
UPDATE tasks 
SET earning_provider_id = 'correct-provider-uuid-here'
WHERE task_type = 'offerwall_earning'
  AND title = 'CPX Earning Task';
```

---

### 3. Period Key Mismatch (Shortlink Issue)

**The Problem**: 
User tasks are partitioned by `period_key` which depends on task frequency. If frequency changed or period calculation is off, user_tasks won't match current period.

**Period Key Logic**:
- `daily`: `"2026-11-20"` (YYYY-MM-DD)
- `weekly`: `"w2026-11-17"` (Monday of week)
- `lifetime` or `one_time`: `"lifetime"`

**Diagnosis Query**:
```sql
-- Check period keys in use
SELECT 
  t.frequency,
  ut.period_key,
  COUNT(*) as user_count,
  MAX(ut.updated_at) as last_update
FROM user_tasks ut
JOIN tasks t ON t.id = ut.task_id
WHERE t.task_type = 'shortlink'
GROUP BY t.frequency, ut.period_key
ORDER BY last_update DESC;

-- Compare with recent events
SELECT 
  DATE(occurred_at) as event_date,
  COUNT(*) as events,
  COUNT(DISTINCT user_id) as users
FROM task_events
WHERE event_type = 'shortlink'
  AND occurred_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(occurred_at)
ORDER BY event_date DESC;
```

**Symptoms**:
- User tasks exist but with old period_keys
- Recent events don't create new user_tasks

**Fix**: Force re-sync or wait for new events

---

### 4. Event Recording Not Triggering Sync

**The Problem**: 
`recordTaskEvent()` should automatically call `syncUserTasks()`, but if there's an error or the call is missing, events won't create user_tasks.

**Check Logs**: Look for:
```
[tasks] syncUserTasks START
```

If missing, sync isn't being called.

**Manual Fix**:
```typescript
// Force sync for specific user
await syncUserTasks('user-id-here', 'offerwall_earning');
await syncUserTasks('user-id-here', 'shortlink');
```

---

### 5. Target Configuration Issues

**The Problem**:
- `offerwall_earning` tasks use `earning_target` (dollar amount)
- Other tasks use `target` or `steps_total` (integer count)

**Diagnosis Query**:
```sql
SELECT 
  id, title, task_type, frequency,
  target, steps_total, earning_target,
  CASE 
    WHEN task_type = 'offerwall_earning' THEN earning_target
    ELSE COALESCE(target, steps_total, 1)
  END as effective_target
FROM tasks
WHERE task_type IN ('offerwall_earning', 'shortlink');
```

**Symptoms**:
- Target is NULL or 0
- Earning target not set for offerwall_earning tasks

**Fix**:
```sql
-- Set earning target for offerwall tasks
UPDATE tasks 
SET earning_target = 5.00  -- $5 target
WHERE task_type = 'offerwall_earning'
  AND earning_target IS NULL;

-- Set target for shortlink tasks
UPDATE tasks
SET target = 10  -- 10 completions
WHERE task_type = 'shortlink'
  AND (target IS NULL OR target = 0);
```

---

## Debugging Process

### Step 1: Run Diagnostic Queries

Use queries from `docs/debugging/task-tracking-debug.md` to identify the issue.

### Step 2: Check Application Logs

After adding comprehensive logging (done), deploy and check for:

```
[tasks] syncUserTasks START
[tasks] evaluating task
[tasks] countProgress START
[tasks] SKIP - <reason>
[tasks] computed progress
[tasks] INSERTED user_task
```

Look for SKIP messages to see why tasks aren't processing.

### Step 3: Test Manually

Use `scripts/test-task-sync.ts`:

```bash
# 1. Update USER_ID in script
# 2. Run locally or deploy
npx tsx scripts/test-task-sync.ts
```

### Step 4: Verify Event Recording

```sql
-- Check recent task_events
SELECT 
  user_id, event_type, event_key, quantity, 
  provider_id, occurred_at
FROM task_events
WHERE event_type IN ('offerwall_earning', 'shortlink')
ORDER BY occurred_at DESC
LIMIT 20;
```

Ensure events are being recorded correctly with right provider_id.

---

## Bitcotask Provider Support

**Question**: Will new provider "bitcotask" work with same logic?

**Answer**: YES, if configured correctly:

1. **Add Provider to Database**:
```sql
INSERT INTO providers (slug, name, kind)
VALUES ('bitcotask', 'Bitcotask', 'sdk_offerwall');
```

2. **Create Task** (if separate task for bitcotask):
```sql
INSERT INTO tasks (
  title, task_type, frequency, reward,
  earning_target, earning_provider_id, is_active
)
SELECT 
  'Earn from Bitcotask',
  'offerwall_earning',
  'daily',
  1.00,  -- reward
  5.00,  -- earning target
  id,    -- provider_id
  true
FROM providers
WHERE slug = 'bitcotask';
```

3. **OR Update Existing Task** to track ALL providers:
```sql
-- Make task track all SDK offerwalls
UPDATE tasks 
SET earning_provider_id = NULL
WHERE task_type = 'offerwall_earning';
```

4. **Ensure Postback Records Events**:
The existing code in `postback.server.ts` already handles this:
```typescript
await recordTaskEvent({
  userId,
  eventType: "offerwall_earning",
  eventKey: conversionId,
  quantity: reward,  // dollar amount
  providerId: provider.id,  // bitcotask provider ID
});
```

As long as bitcotask is in the `providers` table and postbacks call `recordTaskEvent()` with correct `providerId`, it will work.

---

## Next Steps

1. **Run diagnostic SQL queries** to identify which condition is failing
2. **Deploy code with new logging** to production
3. **Trigger a test conversion** (CPX offer + shortlink)
4. **Check application logs** for detailed sync trace
5. **Apply fix** based on findings
6. **Test with different providers** including bitcotask

## Files Modified

- `src/lib/tasks/engine.server.ts` - Added comprehensive logging to syncUserTasks and countProgress
- `docs/debugging/task-tracking-debug.md` - Diagnostic guide with SQL queries
- `docs/debugging/task-tracking-summary.md` - This file
- `scripts/test-task-sync.ts` - Manual sync test script
