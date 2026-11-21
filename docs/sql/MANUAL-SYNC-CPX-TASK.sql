-- MANUAL SYNC FOR CPX TASK
-- This will manually create user_tasks for users who have CPX earnings

-- Step 1: See which users have CPX earnings but no user_tasks
SELECT 
  te.user_id,
  SUM(te.quantity) as total_earned,
  COUNT(*) as event_count,
  EXISTS(
    SELECT 1 FROM user_tasks ut 
    WHERE ut.user_id = te.user_id 
      AND ut.task_id = '624f0959-d3a4-412f-be16-3a052350ede6'
  ) as has_user_task
FROM task_events te
WHERE te.event_type = 'offerwall_earning'
  AND te.provider_id = '8ba03691-c086-4a8a-a59e-3f05bc2d89cc'
GROUP BY te.user_id
HAVING SUM(te.quantity) >= 0.1  -- Task target
ORDER BY total_earned DESC;

-- Step 2: Manually create user_tasks for these users
-- (This simulates what syncUserTasks should have done automatically)

INSERT INTO user_tasks (
  user_id,
  task_id,
  period_key,
  progress,
  target,
  status,
  completed_at
)
SELECT 
  te.user_id,
  '624f0959-d3a4-412f-be16-3a052350ede6' as task_id,
  'lifetime' as period_key,
  LEAST(SUM(te.quantity), 0.1) as progress,
  0.1 as target,
  CASE 
    WHEN SUM(te.quantity) >= 0.1 THEN 'completed'
    ELSE 'active'
  END as status,
  CASE 
    WHEN SUM(te.quantity) >= 0.1 THEN NOW()
    ELSE NULL
  END as completed_at
FROM task_events te
WHERE te.event_type = 'offerwall_earning'
  AND te.provider_id = '8ba03691-c086-4a8a-a59e-3f05bc2d89cc'
  AND NOT EXISTS (
    SELECT 1 FROM user_tasks ut 
    WHERE ut.user_id = te.user_id 
      AND ut.task_id = '624f0959-d3a4-412f-be16-3a052350ede6'
      AND ut.period_key = 'lifetime'
  )
GROUP BY te.user_id
HAVING SUM(te.quantity) > 0;

-- Step 3: Verify the fix
SELECT 
  ut.user_id,
  ut.progress,
  ut.target,
  ut.status,
  ut.completed_at
FROM user_tasks ut
WHERE ut.task_id = '624f0959-d3a4-412f-be16-3a052350ede6'
ORDER BY ut.progress DESC;

-- Step 4: Check if rewards need to be paid
-- (Completed tasks with reward_status = 'pending')
SELECT 
  ut.id,
  ut.user_id,
  ut.progress,
  ut.status,
  ut.reward_status,
  t.reward
FROM user_tasks ut
JOIN tasks t ON t.id = ut.task_id
WHERE ut.task_id = '624f0959-d3a4-412f-be16-3a052350ede6'
  AND ut.status = 'completed'
  AND ut.reward_status = 'pending';

-- Note: Rewards should be paid automatically by next sync,
-- or you can manually credit using the wallet_transactions table
