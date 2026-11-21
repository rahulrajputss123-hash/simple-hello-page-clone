# Task Tracking Debug Guide

## Problem Statement

Two task tracking issues identified:

1. **CPX Offerwall Earning Task**: Has `task_events` with `event_type='offerwall_earning'` from 2 users, but `user_tasks` shows 0 records
2. **Shortlink Task**: Has 576 users assigned but 0 completed, despite `task_events` having shortlink records

## Architecture Overview

Task tracking flow:
1. `postback.server.ts` records conversions → calls `recordTaskEvent()`
2. `recordTaskEvent()` inserts into `task_events` table → calls `syncUserTasks()`
3. `syncUserTasks()` reads `task_events`, creates/updates `user_tasks`, pays rewards

## Diagnostic Queries

Run these queries in your Supabase SQL editor:

```sql
-- 1. Check CPX earning task configuration
SELECT 
  t.id,
  t.title,
  t.task_type,
  t.frequency,
  t.target,
  t.earning_target,
  t.earning_provider_id,
  t.is_active,
  t.starts_at,
  t.ends_at,
  t.lock_type,
  t.unlock_at,
  p.slug as provider_slug
FROM tasks t
LEFT JOIN providers p ON p.id = t.earning_provider_id
WHERE t.task_type = 'offerwall_earning';

-- 2. Check shortlink task configuration
SELECT 
  id,
  title,
  task_type,
  frequency,
  target,
  steps_total,
  is_active,
  starts_at,
  ends_at,
  lock_type,
  unlock_at
FROM tasks
WHERE task_type = 'shortlink';

-- 3. Check task_events for offerwall_earning
SELECT 
  te.event_type,
  te.provider_id,
  p.slug as provider_slug,
  COUNT(*) as event_count,
  COUNT(DISTINCT te.user_id) as unique_users,
  SUM(te.quantity) as total_quantity
FROM task_events te
LEFT JOIN providers p ON p.id = te.provider_id
WHERE te.event_type = 'offerwall_earning'
GROUP BY te.event_type, te.provider_id, p.slug;

-- 4. Check task_events for shortlink
SELECT 
  event_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(quantity) as total_quantity,
  MIN(occurred_at) as first_event,
  MAX(occurred_at) as last_event
FROM task_events
WHERE event_type = 'shortlink'
GROUP BY event_type;

-- 5. Check user_tasks status
SELECT 
  t.task_type,
  t.title,
  COUNT(ut.id) as total_user_tasks,
  COUNT(CASE WHEN ut.status = 'active' THEN 1 END) as active_count,
  COUNT(CASE WHEN ut.status = 'completed' THEN 1 END) as completed_count,
  SUM(ut.progress) as total_progress,
  COUNT(DISTINCT ut.period_key) as unique_periods
FROM tasks t
LEFT JOIN user_tasks ut ON ut.task_id = t.id
WHERE t.task_type IN ('offerwall_earning', 'shortlink')
GROUP BY t.task_type, t.title
ORDER BY t.task_type, t.title;

-- 6. Deep dive: specific user's offerwall_earning events vs user_tasks
-- Replace USER_ID with actual user ID from task_events
SELECT 
  'Events' as source,
  te.occurred_at::date as date,
  te.provider_id,
  p.slug as provider,
  SUM(te.quantity) as amount
FROM task_events te
LEFT JOIN providers p ON p.id = te.provider_id
WHERE te.user_id = 'USER_ID' 
  AND te.event_type = 'offerwall_earning'
GROUP BY te.occurred_at::date, te.provider_id, p.slug
ORDER BY date DESC;

-- Then check if this user has ANY user_tasks for offerwall tasks
SELECT 
  ut.period_key,
  ut.progress,
  ut.target,
  ut.status,
  t.title,
  t.earning_provider_id,
  p.slug as task_provider
FROM user_tasks ut
JOIN tasks t ON t.id = ut.task_id
LEFT JOIN providers p ON p.id = t.earning_provider_id
WHERE ut.user_id = 'USER_ID'
  AND t.task_type = 'offerwall_earning';

-- 7. Deep dive: shortlink events vs user_tasks for specific users
SELECT 
  te.user_id,
  COUNT(*) as event_count,
  SUM(te.quantity) as total_quantity,
  MIN(te.occurred_at) as first_event,
  MAX(te.occurred_at) as last_event,
  EXISTS(
    SELECT 1 FROM user_tasks ut 
    JOIN tasks t ON t.id = ut.task_id 
    WHERE ut.user_id = te.user_id 
      AND t.task_type = 'shortlink'
  ) as has_user_task
FROM task_events te
WHERE te.event_type = 'shortlink'
GROUP BY te.user_id
ORDER BY event_count DESC
LIMIT 10;
```

## Common Issues to Check

### Issue 1: Task Date/Time Filters

**Symptom**: `task_events` exist but no `user_tasks` created

**Check**:
```sql
SELECT 
  id, title, task_type,
  starts_at,
  ends_at,
  starts_at > NOW() as "not_started_yet",
  ends_at < NOW() as "already_ended"
FROM tasks
WHERE task_type IN ('offerwall_earning', 'shortlink');
```

**Fix**: If `starts_at` is in future or `ends_at` is in past, adjust dates or set to NULL.

### Issue 2: Task Lock State

**Symptom**: Task is active but progress doesn't accrue

**Check**:
```sql
SELECT 
  id, title, task_type,
  lock_type,
  unlock_at,
  lock_type != 'none' AND unlock_at > NOW() as "currently_locked"
FROM tasks
WHERE task_type IN ('offerwall_earning', 'shortlink');
```

**Fix**: If locked, either:
- Set `lock_type = 'none'`
- Set `unlock_at` to past date
- Ensure users meet unlock criteria (first_withdrawal)

### Issue 3: Provider ID Mismatch

**Symptom**: CPX offerwall_earning events exist but no user_tasks

**Root Cause**: Task has `earning_provider_id` set to specific provider, but:
- Events have different `provider_id`, OR
- Task expects NULL (all providers) but events have specific provider

**Check**:
```sql
SELECT 
  t.id as task_id,
  t.title,
  t.earning_provider_id as task_provider_id,
  tp.slug as task_provider_slug,
  te.provider_id as event_provider_id,
  ep.slug as event_provider_slug,
  COUNT(*) as event_count
FROM tasks t
LEFT JOIN providers tp ON tp.id = t.earning_provider_id
CROSS JOIN task_events te
LEFT JOIN providers ep ON ep.id = te.provider_id
WHERE t.task_type = 'offerwall_earning'
  AND te.event_type = 'offerwall_earning'
GROUP BY t.id, t.title, t.earning_provider_id, tp.slug, te.provider_id, ep.slug;
```

**Fix**:
- If task should track ALL providers: `UPDATE tasks SET earning_provider_id = NULL WHERE ...`
- If task should track specific provider: Verify provider IDs match exactly

### Issue 4: Period Key Mismatch

**Symptom**: Shortlink events exist but shows 0 completed

**Root Cause**: Task frequency changed, or `period_key` calculation doesn't match event timestamps

**Check**:
```sql
-- Check period keys in use
SELECT DISTINCT
  t.frequency,
  ut.period_key,
  COUNT(*) as user_task_count
FROM user_tasks ut
JOIN tasks t ON t.id = ut.task_id
WHERE t.task_type = 'shortlink'
GROUP BY t.frequency, ut.period_key
ORDER BY ut.period_key DESC;

-- Compare with event dates
SELECT 
  DATE_TRUNC('day', occurred_at)::date as event_date,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users
FROM task_events
WHERE event_type = 'shortlink'
GROUP BY DATE_TRUNC('day', occurred_at)::date
ORDER BY event_date DESC
LIMIT 30;
```

**Understanding**: 
- `daily`: period_key = `2026-11-20` (YYYY-MM-DD)
- `weekly`: period_key = `w2026-11-17` (Monday of week)
- `lifetime`: period_key = `lifetime`

### Issue 5: Target vs Progress

**Symptom**: Task shows as active but should be completed

**Check**:
```sql
SELECT 
  ut.user_id,
  t.title,
  ut.progress,
  ut.target,
  ut.status,
  ut.completed_at,
  ut.progress >= ut.target as "should_be_complete"
FROM user_tasks ut
JOIN tasks t ON t.id = ut.task_id
WHERE t.task_type IN ('offerwall_earning', 'shortlink')
  AND ut.status = 'active'
  AND ut.progress >= ut.target
LIMIT 10;
```

**Fix**: Re-run sync manually or wait for next event

### Issue 6: Reward Status Blocking

**Symptom**: Task completed but reward not paid

**Check**:
```sql
SELECT 
  ut.user_id,
  t.title,
  ut.status,
  ut.reward_status,
  ut.completed_at,
  ut.rewarded_at,
  t.reward
FROM user_tasks ut
JOIN tasks t ON t.id = ut.task_id
WHERE t.task_type IN ('offerwall_earning', 'shortlink')
  AND ut.status = 'completed'
  AND ut.reward_status = 'pending'
LIMIT 10;
```

## Manual Sync Test

To force a sync for a specific user and event type:

```typescript
// In Supabase Edge Function or test script
import { syncUserTasks } from './src/lib/tasks/engine.server';

// Sync all offerwall_earning tasks for user
await syncUserTasks('user-id-here', 'offerwall_earning');

// Sync all shortlink tasks for user
await syncUserTasks('user-id-here', 'shortlink');

// Sync ALL tasks for user (no event type filter)
await syncUserTasks('user-id-here');
```

## Expected Behavior

When working correctly:

1. User completes CPX offer → postback received
2. `task_events` row inserted: `{event_type: 'offerwall_earning', provider_id: 'cpx-provider-id', quantity: 2.50}`
3. `syncUserTasks()` called automatically
4. For each active `offerwall_earning` task:
   - Checks if task applies (dates, locks, provider match)
   - Counts progress from `task_events` where `provider_id` matches (or all if task has NULL `earning_provider_id`)
   - Creates/updates `user_tasks` row with current progress
   - If `progress >= target`, marks completed and pays reward
5. User sees task progress update immediately

## Next Steps

1. Run diagnostic queries to identify which condition is failing
2. Check application logs for any `[tasks]` error messages
3. Add temporary logging (see below) and trigger a new conversion
4. Verify `syncUserTasks()` is being called after `recordTaskEvent()`

## Where to Add Logging

Key points in `src/lib/tasks/engine.server.ts`:

- Start of `syncUserTasks()`: Log user and event type
- Inside task loop: Log which tasks are being evaluated
- After `countProgress()`: Log actual progress counted
- Skip conditions: Log why a task was skipped (dates, locks, wrong event type)
- After `user_tasks` insert/update: Log result
