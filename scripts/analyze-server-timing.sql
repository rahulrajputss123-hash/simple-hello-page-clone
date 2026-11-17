-- Analyze server request timing from automation_logs
-- Shows which server functions consume the most wall time (not just CPU)
-- Run this after deploying the timing middleware

-- Summary by function name, sorted by total wall time
SELECT 
  context->>'fn_name' as fn_name,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE (context->>'wall_ms')::int > 2000) as calls_over_2s,
  ROUND(AVG((context->>'wall_ms')::numeric), 0) as avg_wall_ms,
  MAX((context->>'wall_ms')::int) as max_wall_ms,
  ROUND(COUNT(*) * AVG((context->>'wall_ms')::numeric) / 1000, 1) as estimated_total_seconds,
  ROUND(COUNT(*) * AVG((context->>'wall_ms')::numeric) / 60000, 1) as estimated_total_minutes
FROM automation_logs
WHERE event_type = 'server_request_timing'
  AND created_at > NOW() - INTERVAL '6 hours'
  AND context->>'fn_name' IS NOT NULL
GROUP BY context->>'fn_name'
ORDER BY (COUNT(*) * AVG((context->>'wall_ms')::numeric)) DESC
LIMIT 50;

-- Top slowest individual requests
SELECT 
  created_at,
  context->>'fn_name' as fn_name,
  (context->>'wall_ms')::int as wall_ms,
  context->>'user_id_prefix' as user_prefix,
  context->>'status_code' as status,
  context->>'error' as error,
  message
FROM automation_logs
WHERE event_type = 'server_request_timing'
  AND created_at > NOW() - INTERVAL '6 hours'
  AND (context->>'wall_ms')::int > 2000
ORDER BY (context->>'wall_ms')::int DESC
LIMIT 100;

-- Hourly breakdown
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE (context->>'wall_ms')::int > 2000) as slow_calls,
  ROUND(AVG((context->>'wall_ms')::numeric), 0) as avg_wall_ms,
  ROUND(SUM((context->>'wall_ms')::numeric) / 60000, 1) as total_wall_minutes
FROM automation_logs
WHERE event_type = 'server_request_timing'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- Verification query: Run right after deploy to confirm rows are being written
SELECT event_type, COUNT(*) 
FROM automation_logs 
WHERE event_type = 'server_request_timing' 
  AND created_at > NOW() - INTERVAL '15 minutes' 
GROUP BY event_type;
