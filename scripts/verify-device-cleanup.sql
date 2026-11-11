-- Part 4 verification queries

-- Check for any remaining 'desktop' devices (should be 0)
SELECT count(*) as desktop_count
FROM offers 
WHERE is_active = true 
  AND devices @> ARRAY['desktop'];

-- Check empty devices by source
SELECT 
  source, 
  COUNT(*) FILTER (WHERE devices = '{}' OR devices IS NULL OR cardinality(devices) = 0) as empty_devices,
  COUNT(*) as total
FROM offers 
WHERE is_active = true 
GROUP BY source
ORDER BY source;

-- Check device value distribution
SELECT 
  unnest(devices) as device_value,
  COUNT(*) as count
FROM offers
WHERE is_active = true
GROUP BY device_value
ORDER BY count DESC;

-- Verify no invalid device values remain
SELECT id, title, devices
FROM offers
WHERE is_active = true
  AND (
    devices @> ARRAY['desktop'] 
    OR devices @> ARRAY['PC']
    OR devices @> ARRAY['Windows']
    OR devices @> ARRAY['macOS']
    OR devices @> ARRAY['iphone']
    OR devices @> ARRAY['ipad']
    OR devices @> ARRAY['*']
    OR devices @> ARRAY['All']
  )
LIMIT 20;
