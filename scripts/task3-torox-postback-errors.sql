-- Task 3: Find out why Torox postbacks are not crediting
-- Purpose: Read automation logs and identify common error reasons

-- Check recent Torox postback logs (last 30 days)
SELECT 
  event_type,
  status,
  source,
  message,
  COUNT(*) AS occurrence_count,
  MIN(created_at) AS first_seen,
  MAX(created_at) AS last_seen
FROM automation_logs
WHERE source IN ('torox_feed_postback', 'torox_click_url')
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY event_type, status, source, message
ORDER BY occurrence_count DESC, last_seen DESC
LIMIT 50;

-- Check for signature validation failures
SELECT 
  message,
  COUNT(*) AS count,
  jsonb_pretty(context) AS sample_context
FROM automation_logs
WHERE source = 'torox_feed_postback'
  AND message LIKE '%signature%'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY message, context
ORDER BY count DESC
LIMIT 10;

-- Check for offer lookup failures
SELECT 
  message,
  COUNT(*) AS count,
  context->>'externalOfferId' AS external_offer_id,
  context->>'offerName' AS offer_name
FROM automation_logs
WHERE source = 'torox_feed_postback'
  AND message LIKE '%offer%not%found%'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY message, context->>'externalOfferId', context->>'offerName'
ORDER BY count DESC
LIMIT 10;

-- Check for user lookup failures
SELECT 
  message,
  COUNT(*) AS count,
  user_id
FROM automation_logs
WHERE source = 'torox_feed_postback'
  AND message LIKE '%user%not%found%'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY message, user_id
ORDER BY count DESC
LIMIT 10;

-- Check for reversal/zero-payout cases
SELECT 
  message,
  COUNT(*) AS count,
  context->>'payout' AS payout,
  context->>'amount' AS amount,
  context->>'externalOfferId' AS external_offer_id
FROM automation_logs
WHERE source = 'torox_feed_postback'
  AND (message LIKE '%reversal%' OR message LIKE '%invalid_payout%')
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY message, context->>'payout', context->>'amount', context->>'externalOfferId'
ORDER BY count DESC
LIMIT 10;

-- Check successful credits
SELECT 
  COUNT(*) AS successful_credits,
  COUNT(DISTINCT context->>'offerId') AS offers_credited,
  COUNT(DISTINCT user_id) AS unique_users_credited
FROM automation_logs
WHERE source = 'torox_feed_postback'
  AND status = 'success'
  AND event_type = 'wallet_credit'
  AND created_at > NOW() - INTERVAL '30 days';

-- Summary: Error reasons breakdown
SELECT 
  CASE 
    WHEN message LIKE '%signature%' THEN 'signature_validation_failed'
    WHEN message LIKE '%offer%not%found%' THEN 'offer_not_found'
    WHEN message LIKE '%user%not%found%' THEN 'user_not_found'
    WHEN message LIKE '%reversal%' THEN 'reversal_received'
    WHEN message LIKE '%invalid_payout%' THEN 'invalid_payout_amount'
    WHEN message LIKE '%duplicate%' THEN 'duplicate_postback'
    WHEN message LIKE '%wallet%credit%failed%' THEN 'wallet_credit_failed'
    ELSE 'other'
  END AS error_category,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS percentage
FROM automation_logs
WHERE source = 'torox_feed_postback'
  AND status != 'success'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY error_category
ORDER BY count DESC;
