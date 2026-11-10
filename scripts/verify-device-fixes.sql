-- Part 2 Data Gap Verification Scripts

-- 1. Count offers with "desktop" or "PC" in devices (should be 0 after normalization)
SELECT 
  COUNT(*) as count_with_desktop_or_pc,
  'This should be 0 after normalizing desktop/PC to web' as note
FROM offers
WHERE 
  source = 'network'
  AND devices IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 
      FROM jsonb_array_elements_text(devices) AS device_elem
      WHERE device_elem ILIKE '%desktop%' OR device_elem ILIKE '%pc%'
    )
  );

-- Show examples if any found
SELECT 
  op.slug as provider_slug,
  o.external_offer_id,
  o.title,
  o.devices,
  o.raw_payload->'devices' as raw_devices,
  o.raw_payload->'os' as raw_os,
  o.raw_payload->'device' as raw_device
FROM offers o
LEFT JOIN offer_providers op ON o.provider_id = op.id
WHERE 
  source = 'network'
  AND devices IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM jsonb_array_elements_text(devices) AS device_elem
    WHERE device_elem ILIKE '%desktop%' OR device_elem ILIKE '%pc%'
  )
LIMIT 10;

-- 2. Count Affike and Revtoo offers with empty devices but non-empty raw data
-- (Should have devices populated after backfill)
SELECT 
  op.slug as provider_slug,
  COUNT(*) as offers_with_empty_devices,
  COUNT(*) FILTER (WHERE raw_payload->'devices' IS NOT NULL) as affike_raw_devices_present,
  COUNT(*) FILTER (WHERE raw_payload->'os' IS NOT NULL) as revtoo_raw_os_present,
  'These should have devices populated from raw data' as note
FROM offers o
LEFT JOIN offer_providers op ON o.provider_id = op.id
WHERE 
  op.slug IN ('affike', 'revtoo')
  AND source = 'network'
  AND (devices IS NULL OR jsonb_array_length(devices) = 0)
GROUP BY op.slug
ORDER BY op.slug;

-- Show sample raw data for Affike offers with empty devices
SELECT 
  o.external_offer_id,
  o.title,
  o.devices,
  o.raw_payload->'devices' as raw_devices,
  'Affike sample' as note
FROM offers o
LEFT JOIN offer_providers op ON o.provider_id = op.id
WHERE 
  op.slug = 'affike'
  AND source = 'network'
  AND (o.devices IS NULL OR jsonb_array_length(o.devices) = 0)
  AND o.raw_payload->'devices' IS NOT NULL
LIMIT 5;

-- Show sample raw data for Revtoo offers with empty devices
SELECT 
  o.external_offer_id,
  o.title,
  o.devices,
  o.raw_payload->'os' as raw_os,
  'Revtoo sample' as note
FROM offers o
LEFT JOIN offer_providers op ON o.provider_id = op.id
WHERE 
  op.slug = 'revtoo'
  AND source = 'network'
  AND (o.devices IS NULL OR jsonb_array_length(o.devices) = 0)
  AND o.raw_payload->'os' IS NOT NULL
LIMIT 5;

-- Count offers with devices after fix (should match ~158 Affike + ~167 Revtoo)
SELECT 
  op.slug as provider_slug,
  COUNT(*) as total_offers,
  COUNT(*) FILTER (WHERE devices IS NOT NULL AND jsonb_array_length(devices) > 0) as offers_with_devices,
  COUNT(*) FILTER (WHERE devices IS NULL OR jsonb_array_length(devices) = 0) as offers_without_devices
FROM offers o
LEFT JOIN offer_providers op ON o.provider_id = op.id
WHERE 
  op.slug IN ('affike', 'revtoo')
  AND source = 'network'
GROUP BY op.slug
ORDER BY op.slug;

-- 3. Check if devices are treated as empty for ["*"] and ["All"]
-- Show offers with ["*"] or ["All"] in raw data
SELECT 
  op.slug as provider_slug,
  o.external_offer_id,
  o.title,
  o.devices,
  o.raw_payload->'devices' as raw_devices,
  o.raw_payload->'os' as raw_os,
  'Should have empty devices array if raw is ["*"] or ["All"]' as note
FROM offers o
LEFT JOIN offer_providers op ON o.provider_id = op.id
WHERE 
  source = 'network'
  AND (
    o.raw_payload->'devices' @> '["*"]'::jsonb
    OR o.raw_payload->'devices' @> '["All"]'::jsonb
    OR o.raw_payload->'os' @> '["*"]'::jsonb
    OR o.raw_payload->'os' @> '["All"]'::jsonb
  )
LIMIT 10;
