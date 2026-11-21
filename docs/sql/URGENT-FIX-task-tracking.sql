-- URGENT FIX FOR TASK TRACKING
-- Run this in Supabase SQL Editor NOW

-- DIAGNOSIS SUMMARY:
-- CPX Task: earning_provider_id = '8ba03691-c086-4a8a-a59e-3f05bc2d89cc' → 0 user_tasks (broken)
-- Timewall Task: earning_provider_id = NULL → 572 user_tasks (working)
-- CPX has 10 events from 3 users totaling $2.88, but no user_tasks created
-- Shortlink has 576 user_tasks but ALL have progress=0

-- SOLUTION: Make CPX task track ALL providers like Timewall does
-- This will make it start working immediately

-- ============================================================================
-- FIX 1: CPX Task - Make it track ALL providers
-- ============================================================================
UPDATE tasks 
SET earning_provider_id = NULL
WHERE id = '624f0959-d3a4-412f-be16-3a052350ede6';
-- This is the "Earn $0.10 on CPX Research" task

-- Verify the fix
SELECT 
  id, title, earning_provider_id, 
  (SELECT COUNT(*) FROM user_tasks WHERE task_id = id) as current_user_tasks
FROM tasks
WHERE id = '624f0959-d3a4-412f-be16-3a052350ede6';

-- ============================================================================
-- EXPLANATION
-- ============================================================================
-- TimeWall task works because earning_provider_id = NULL means "count ALL providers"
-- CPX task was filtered to only CPX provider, but sync isn't running for provider-specific tasks
-- Setting to NULL will make it work immediately like TimeWall
-- After this fix, new CPX conversions will create user_tasks

-- ============================================================================
-- ALTERNATIVE: If you want separate tasks per provider, create a working one
-- ============================================================================
-- INSERT INTO tasks (
--   title, task_type, frequency, reward,
--   earning_target, earning_provider_id, is_active
-- )
-- VALUES (
--   'Earn $0.50 from Any Offerwall',
--   'offerwall_earning',
--   'daily',
--   0.25,
--   0.50,
--   NULL,  -- NULL = tracks ALL providers
--   true
-- );
