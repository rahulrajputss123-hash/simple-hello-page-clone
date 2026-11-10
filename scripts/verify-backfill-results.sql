-- Verify backfill results - run after backfill completes

-- 1. Count devices per provider
SELECT 
  op.slug as provider,
  COUNT(*) as total_offers,
  COUNT(*) FILTER (WHERE devices IS NOT NULL AND jsonb_array_length(devices) > 0) as has_devices,
  COUNT(*) FILTER (WHERE devices IS NULL OR jsonb_array_length(devices) = 0) as no_devices,
  COUNT(*) FILTER (WHERE category IS NOT NULL) as has_category,
  COUNT(*) FILTER (WHERE category IS NULL) as no_category
FROM offers o
LEFT JOIN offer_providers op ON o.provider_id = op.id
WHERE o.source = 'network'
GROUP BY op.slug
ORDER BY total_offers DESC;

-- 2. Check for desktop/PC (should be 0)
SELECT COUNT(*) as desktop_or_pc_count
FROM offers
WHERE devices::text ILIKE '%desktop%' OR devices::text ILIKE '%pc%';

-- 3. Sample offers to verify UI will show data
SELECT 
  op.slug as provider,
  op.name as provider_name,
  o.title,
  o.devices,
  o.category
FROM offers o
LEFT JOIN offer_providers op ON o.provider_id = op.id
WHERE o.source = 'network'
  AND (devices IS NOT NULL OR category IS NOT NULL)
LIMIT 20;
