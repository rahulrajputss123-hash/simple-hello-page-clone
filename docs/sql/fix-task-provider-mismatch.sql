-- Fix task tracking issues
-- Run ONLY the sections that apply to your problem after diagnosis

-- ============================================================================
-- FIX 1: CPX Provider ID Mismatch
-- ============================================================================
-- Use this if CPX events exist but task doesn't count them

-- Option A: Make CPX task track ALL offerwall providers (recommended if you want one task for all)
UPDATE tasks 
SET earning_provider_id = NULL
WHERE task_type = 'offerwall_earning'
  AND title ILIKE '%cpx%';

-- Option B: Set CPX task to track ONLY CPX provider (run this if you want separate tasks per provider)
-- First, find the correct CPX provider UUID:
SELECT id, slug, name FROM providers WHERE slug ILIKE '%cpx%';
-- Then update (replace 'UUID-FROM-ABOVE' with actual UUID):
-- UPDATE tasks 
-- SET earning_provider_id = 'UUID-FROM-ABOVE'
-- WHERE task_type = 'offerwall_earning'
--   AND title ILIKE '%cpx%';

-- ============================================================================
-- FIX 2: Shortlink Task Date/Lock Issues
-- ============================================================================
-- Use this if shortlink events exist but no user_tasks created

-- Remove date and lock restrictions
UPDATE tasks 
SET 
  starts_at = NULL,
  ends_at = NULL,
  lock_type = 'none',
  unlock_at = NULL
WHERE task_type = 'shortlink'
  AND (
    starts_at > NOW() OR 
    ends_at < NOW() OR 
    (lock_type = 'time' AND unlock_at > NOW())
  );

-- ============================================================================
-- FIX 3: Force Manual Sync (after fixing configuration)
-- ============================================================================
-- After fixing task configuration, you can manually trigger sync for test users
-- This is done via application code, not SQL:
-- 
-- In your application or via Supabase Edge Function:
-- import { syncUserTasks } from './src/lib/tasks/engine.server';
-- await syncUserTasks('user-id-here', 'offerwall_earning');
-- await syncUserTasks('user-id-here', 'shortlink');

-- ============================================================================
-- FIX 4: Verify Fixes Worked
-- ============================================================================
-- Run after applying fixes to verify

-- Check task configurations are correct now
SELECT 
  title,
  task_type,
  earning_provider_id,
  starts_at,
  ends_at,
  lock_type,
  is_active
FROM tasks
WHERE task_type IN ('offerwall_earning', 'shortlink')
ORDER BY task_type, title;

-- Check if new user_tasks are created (wait a few minutes or trigger new event)
SELECT 
  t.title,
  t.task_type,
  COUNT(ut.id) as user_task_count,
  MAX(ut.updated_at) as last_update
FROM tasks t
LEFT JOIN user_tasks ut ON ut.task_id = t.id
WHERE t.task_type IN ('offerwall_earning', 'shortlink')
GROUP BY t.title, t.task_type
ORDER BY t.task_type, t.title;
