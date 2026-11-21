-- Quick comparison: Working (Timewall) vs Non-working (CPX/Shortlink)
-- Run this in Supabase SQL Editor to see the difference

-- PART 1: Show all offerwall_earning tasks side-by-side
SELECT 
  t.title,
  p.slug as task_provider,
  t.earning_provider_id as task_provider_uuid,
  t.frequency,
  t.earning_target,
  t.is_active,
  t.starts_at,
  t.ends_at,
  t.lock_type,
  -- Count user_tasks
  (SELECT COUNT(*) FROM user_tasks ut WHERE ut.task_id = t.id) as user_tasks_count,
  -- Count matching events
  CASE 
    WHEN t.earning_provider_id IS NULL THEN 
      (SELECT COUNT(*) FROM task_events te WHERE te.event_type = 'offerwall_earning')
    ELSE
      (SELECT COUNT(*) FROM task_events te 
       WHERE te.event_type = 'offerwall_earning' 
       AND te.provider_id = t.earning_provider_id)
  END as matching_events_count
FROM tasks t
LEFT JOIN providers p ON p.id = t.earning_provider_id
WHERE t.task_type = 'offerwall_earning'
ORDER BY user_tasks_count DESC;

-- PART 2: Show which providers have events
SELECT 
  p.slug as provider_name,
  p.id as provider_uuid,
  COUNT(*) as total_events,
  COUNT(DISTINCT te.user_id) as unique_users,
  MIN(te.occurred_at)::date as first_event,
  MAX(te.occurred_at)::date as last_event
FROM task_events te
LEFT JOIN providers p ON p.id = te.provider_id
WHERE te.event_type = 'offerwall_earning'
GROUP BY p.slug, p.id
ORDER BY total_events DESC;

-- PART 3: Cross-check - do CPX events exist but with wrong provider_id?
-- This will show if CPX events have a different provider_id than the CPX task expects
SELECT 
  'Task expects' as source,
  t.title as task_name,
  t.earning_provider_id as provider_uuid,
  p.slug as provider_slug
FROM tasks t
LEFT JOIN providers p ON p.id = t.earning_provider_id
WHERE t.task_type = 'offerwall_earning'
  AND t.title ILIKE '%cpx%'

UNION ALL

SELECT 
  'Events have' as source,
  'CPX Events' as task_name,
  te.provider_id as provider_uuid,
  p.slug as provider_slug
FROM task_events te
LEFT JOIN providers p ON p.id = te.provider_id
WHERE te.event_type = 'offerwall_earning'
  AND (p.slug ILIKE '%cpx%' OR te.metadata::text ILIKE '%cpx%')
GROUP BY te.provider_id, p.slug
LIMIT 1;

-- PART 4: Shortlink task check
SELECT 
  t.title,
  t.frequency,
  t.target,
  t.is_active,
  t.starts_at,
  t.ends_at,
  t.lock_type,
  t.unlock_at,
  (SELECT COUNT(*) FROM user_tasks ut WHERE ut.task_id = t.id) as user_tasks_count,
  (SELECT COUNT(*) FROM task_events te WHERE te.event_type = 'shortlink') as total_events
FROM tasks t
WHERE t.task_type = 'shortlink';

-- PART 5: Sample CPX events to see their provider_id
SELECT 
  te.user_id,
  te.provider_id,
  p.slug as provider_name,
  te.quantity,
  te.occurred_at,
  te.metadata
FROM task_events te
LEFT JOIN providers p ON p.id = te.provider_id
WHERE te.event_type = 'offerwall_earning'
  AND (p.slug ILIKE '%cpx%' OR te.metadata::text ILIKE '%cpx%')
LIMIT 5;
