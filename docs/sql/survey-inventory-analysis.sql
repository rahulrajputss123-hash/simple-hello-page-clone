-- Survey Inventory Analysis: Last 7 Days
-- Shows survey availability by country and network

SELECT 
  context->>'country' AS country,
  context->>'network' AS network,
  COUNT(*) AS log_count,
  AVG((context->>'count')::int) AS avg_surveys,
  SUM((context->>'count')::int) AS total_surveys,
  COUNT(DISTINCT user_id) AS unique_users,
  SUM(CASE WHEN (context->>'has_profile')::boolean THEN 1 ELSE 0 END) AS users_with_profile,
  SUM(CASE WHEN (context->>'count')::int = 0 THEN 1 ELSE 0 END) AS zero_inventory_count
FROM automation_logs
WHERE event_type = 'survey_inventory'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY context->>'country', context->>'network'
ORDER BY country, network;

-- Reasons for zero inventory (when surveys = 0)
SELECT 
  context->>'country' AS country,
  context->>'network' AS network,
  context->>'reason' AS reason,
  COUNT(*) AS occurrence_count
FROM automation_logs
WHERE event_type = 'survey_inventory'
  AND created_at >= NOW() - INTERVAL '7 days'
  AND (context->>'count')::int = 0
  AND context->>'reason' IS NOT NULL
GROUP BY context->>'country', context->>'network', context->>'reason'
ORDER BY occurrence_count DESC;

-- Daily trend by country
SELECT 
  DATE(created_at) AS date,
  context->>'country' AS country,
  COUNT(DISTINCT user_id) AS unique_users,
  AVG((context->>'count')::int) AS avg_surveys_available
FROM automation_logs
WHERE event_type = 'survey_inventory'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), context->>'country'
ORDER BY date DESC, country;
