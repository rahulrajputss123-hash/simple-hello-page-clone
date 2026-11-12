-- Task 2: Reconcile stuck claims (read-only report)
-- Purpose: List pending claims with provider_slug IS NULL, grouped by offer and provider

-- List all stuck pending claims (provider_slug IS NULL)
SELECT 
  oc.id AS claim_id,
  oc.user_id,
  oc.offer_id,
  o.title AS offer_title,
  o.external_offer_id,
  op.slug AS provider_slug,
  op.name AS provider_name,
  oc.status,
  oc.reward_amount,
  oc.created_at,
  oc.updated_at,
  -- Check if there's a matching Torox postback claim for same user+offer
  EXISTS (
    SELECT 1 FROM offer_claims oc2
    WHERE oc2.user_id = oc.user_id
      AND oc2.offer_id = oc.offer_id
      AND oc2.provider_slug = 'torox'
      AND oc2.status = 'approved'
  ) AS has_torox_approved_claim
FROM offer_claims oc
JOIN offers o ON oc.offer_id = o.id
LEFT JOIN offer_providers op ON o.provider_id = op.id
WHERE oc.status = 'pending'
  AND oc.provider_slug IS NULL
ORDER BY o.provider_id, o.id, oc.created_at DESC;

-- Summary by offer and provider
SELECT 
  op.slug AS provider_slug,
  op.name AS provider_name,
  o.id AS offer_id,
  o.title AS offer_title,
  o.external_offer_id,
  o.payout_mode,
  COUNT(oc.id) AS stuck_claim_count,
  MIN(oc.created_at) AS oldest_claim,
  MAX(oc.created_at) AS newest_claim,
  -- Check if any users have approved Torox postback claims for this offer
  COUNT(DISTINCT CASE 
    WHEN EXISTS (
      SELECT 1 FROM offer_claims oc2
      WHERE oc2.user_id = oc.user_id
        AND oc2.offer_id = oc.offer_id
        AND oc2.provider_slug = 'torox'
        AND oc2.status = 'approved'
    ) THEN oc.user_id 
  END) AS users_with_torox_approved
FROM offer_claims oc
JOIN offers o ON oc.offer_id = o.id
LEFT JOIN offer_providers op ON o.provider_id = op.id
WHERE oc.status = 'pending'
  AND oc.provider_slug IS NULL
GROUP BY op.slug, op.name, o.id, o.title, o.external_offer_id, o.payout_mode
ORDER BY stuck_claim_count DESC, provider_slug, o.title;

-- Recommendation: Safe to cancel
-- Claims where:
-- 1. Offer is Torox (provider_slug = 'torox')
-- 2. User has no approved Torox postback claim for the same offer
-- 3. Claim is older than 7 days
WITH stuck_claims AS (
  SELECT 
    oc.id AS claim_id,
    oc.user_id,
    oc.offer_id,
    o.title AS offer_title,
    op.slug AS provider_slug,
    oc.created_at,
    EXISTS (
      SELECT 1 FROM offer_claims oc2
      WHERE oc2.user_id = oc.user_id
        AND oc2.offer_id = oc.offer_id
        AND oc2.provider_slug = 'torox'
        AND oc2.status = 'approved'
    ) AS has_approved_postback
  FROM offer_claims oc
  JOIN offers o ON oc.offer_id = o.id
  LEFT JOIN offer_providers op ON o.provider_id = op.id
  WHERE oc.status = 'pending'
    AND oc.provider_slug IS NULL
    AND op.slug = 'torox'
    AND oc.created_at < NOW() - INTERVAL '7 days'
)
SELECT 
  provider_slug,
  COUNT(*) AS safe_to_cancel_count,
  COUNT(*) FILTER (WHERE has_approved_postback) AS already_credited_elsewhere,
  COUNT(*) FILTER (WHERE NOT has_approved_postback) AS never_credited
FROM stuck_claims
GROUP BY provider_slug;

-- Final recommendation message
SELECT 
  'RECOMMENDATION: ' || COUNT(*) || ' Torox pending claims older than 7 days can be safely cancelled.' AS message,
  'Of these, ' || COUNT(*) FILTER (WHERE has_approved_postback) || ' users were already credited via postback.' AS detail,
  'And ' || COUNT(*) FILTER (WHERE NOT has_approved_postback) || ' users were never credited (postback may have failed or not been sent).' AS detail2
FROM (
  SELECT 
    oc.id,
    EXISTS (
      SELECT 1 FROM offer_claims oc2
      WHERE oc2.user_id = oc.user_id
        AND oc2.offer_id = oc.offer_id
        AND oc2.provider_slug = 'torox'
        AND oc2.status = 'approved'
    ) AS has_approved_postback
  FROM offer_claims oc
  JOIN offers o ON oc.offer_id = o.id
  LEFT JOIN offer_providers op ON o.provider_id = op.id
  WHERE oc.status = 'pending'
    AND oc.provider_slug IS NULL
    AND op.slug = 'torox'
    AND oc.created_at < NOW() - INTERVAL '7 days'
) sub;
