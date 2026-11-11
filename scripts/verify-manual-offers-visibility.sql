-- Verify manual featured offers are visible on all platforms
-- Should include DIGITAVISION, Vrnum, HostingTom, Reddit, Quora, Youtube

-- All manual featured offers
SELECT 
  title,
  devices,
  is_featured,
  is_active
FROM offers
WHERE source = 'manual'
  AND is_featured = true
  AND is_active = true
ORDER BY title;

-- Count manual featured offers visible per platform
-- Android: devices contains 'android' OR devices is empty
SELECT 
  'android' as platform,
  COUNT(*) as visible_count,
  array_agg(title ORDER BY title) as visible_offers
FROM offers
WHERE source = 'manual'
  AND is_featured = true
  AND is_active = true
  AND (devices = '{}' OR devices @> ARRAY['android'])

UNION ALL

-- iOS: devices contains 'ios' OR devices is empty
SELECT 
  'ios' as platform,
  COUNT(*) as visible_count,
  array_agg(title ORDER BY title) as visible_offers
FROM offers
WHERE source = 'manual'
  AND is_featured = true
  AND is_active = true
  AND (devices = '{}' OR devices @> ARRAY['ios'])

UNION ALL

-- Web: devices contains 'web' OR devices is empty
SELECT 
  'web' as platform,
  COUNT(*) as visible_count,
  array_agg(title ORDER BY title) as visible_offers
FROM offers
WHERE source = 'manual'
  AND is_featured = true
  AND is_active = true
  AND (devices = '{}' OR devices @> ARRAY['web'])

ORDER BY platform;
