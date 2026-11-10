-- Part 2 B & C Verification: Device Normalization and Category Mapping
-- Run this after syncing offers to verify data quality

-- B5: Verify devices only contain android, ios, web (no desktop, no "All")
-- This query finds any offers with invalid device values
SELECT 
  provider_id,
  op.slug as provider_slug,
  COUNT(*) as offer_count,
  jsonb_array_elements_text(devices) as invalid_device
FROM offers o
LEFT JOIN offer_providers op ON o.provider_id = op.id
WHERE 
  source = 'network'
  AND devices IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM jsonb_array_elements_text(devices) AS device_elem
    WHERE device_elem NOT IN ('android', 'ios', 'web')
  )
GROUP BY provider_id, op.slug, invalid_device
ORDER BY provider_slug, invalid_device;

-- Expected result: 0 rows (no invalid devices)

-- B5: Count offers by device combinations per provider
SELECT 
  op.slug as provider_slug,
  devices,
  COUNT(*) as offer_count
FROM offers o
LEFT JOIN offer_providers op ON o.provider_id = op.id
WHERE source = 'network'
GROUP BY op.slug, devices
ORDER BY provider_slug, devices;

-- C9: Count offers by category per provider (including NULL)
SELECT 
  op.slug as provider_slug,
  COALESCE(category, 'NULL') as category,
  COUNT(*) as offer_count
FROM offers o
LEFT JOIN offer_providers op ON o.provider_id = op.id
WHERE source = 'network'
GROUP BY op.slug, category
ORDER BY provider_slug, category;

-- C9: Find offers with NULL category and show raw category fields from payload
-- (helps verify if NULL is correct or if category mapping is missing)
SELECT 
  op.slug as provider_slug,
  o.external_offer_id,
  o.title,
  o.category,
  -- Extract relevant category fields from raw_payload per provider
  CASE 
    WHEN op.slug = 'gemiad' THEN raw_payload->>'category'
    WHEN op.slug = 'torox' THEN raw_payload->>'verticalNames'
    WHEN op.slug = 'revtoo' THEN raw_payload->>'category'
    WHEN op.slug = 'adswedmedia' THEN raw_payload->'categories'->>0
    WHEN op.slug = 'affike' THEN raw_payload->>'category'
    WHEN op.slug = 'adbluemedia' THEN raw_payload->>'category_id'
    WHEN op.slug = 'ogads' THEN raw_payload->>'category'
    ELSE NULL
  END as raw_category_field
FROM offers o
LEFT JOIN offer_providers op ON o.provider_id = op.id
WHERE 
  source = 'network'
  AND category IS NULL
LIMIT 50;

-- C8: Show distinct raw category values per provider
-- (helps verify category mappings are complete)
SELECT 
  op.slug as provider_slug,
  CASE 
    WHEN op.slug = 'gemiad' THEN raw_payload->>'category'
    WHEN op.slug = 'torox' THEN raw_payload->>'verticalNames'
    WHEN op.slug = 'revtoo' THEN raw_payload->>'category'
    WHEN op.slug = 'adswedmedia' THEN raw_payload->'categories'->>0
    WHEN op.slug = 'affike' THEN raw_payload->>'category'
    WHEN op.slug = 'adbluemedia' THEN raw_payload->>'category_id'
    WHEN op.slug = 'ogads' THEN raw_payload->>'category'
    ELSE NULL
  END as raw_category_value,
  COUNT(*) as offer_count
FROM offers o
LEFT JOIN offer_providers op ON o.provider_id = op.id
WHERE 
  source = 'network'
  AND raw_payload IS NOT NULL
GROUP BY provider_slug, raw_category_value
ORDER BY provider_slug, offer_count DESC;

-- Overall summary: Offers per provider with device and category status
SELECT 
  op.slug as provider_slug,
  COUNT(*) as total_offers,
  COUNT(CASE WHEN devices IS NULL OR jsonb_array_length(devices) = 0 THEN 1 END) as offers_no_devices,
  COUNT(CASE WHEN category IS NULL THEN 1 END) as offers_no_category,
  COUNT(CASE WHEN devices IS NOT NULL AND jsonb_array_length(devices) > 0 THEN 1 END) as offers_with_devices,
  COUNT(CASE WHEN category IS NOT NULL THEN 1 END) as offers_with_category
FROM offers o
LEFT JOIN offer_providers op ON o.provider_id = op.id
WHERE source = 'network'
GROUP BY op.slug
ORDER BY provider_slug;
