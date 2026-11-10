-- Check AdBlueMedia raw category_id values to build proper mapping
-- The category_id is a 24-char hex ID, not 1-9 as previously assumed

SELECT DISTINCT
  raw_payload->>'category_id' as category_id,
  COUNT(*) as offer_count,
  -- Sample offer titles to help identify category
  array_agg(DISTINCT title) FILTER (WHERE title IS NOT NULL) as sample_titles
FROM offers o
LEFT JOIN offer_providers op ON o.provider_id = op.id
WHERE 
  op.slug = 'adbluemedia'
  AND raw_payload IS NOT NULL
  AND raw_payload->>'category_id' IS NOT NULL
GROUP BY raw_payload->>'category_id'
ORDER BY offer_count DESC;

-- Also show offers without category_id
SELECT COUNT(*) as offers_without_category_id
FROM offers o
LEFT JOIN offer_providers op ON o.provider_id = op.id
WHERE 
  op.slug = 'adbluemedia'
  AND (raw_payload IS NULL OR raw_payload->>'category_id' IS NULL);
