-- Check what Gaming offers exist in database
SELECT 
  id,
  title,
  category,
  category_manual,
  is_active,
  provider_id,
  source
FROM offers 
WHERE (category = 'Gaming' OR category_manual = 'Gaming')
  AND is_active = true
ORDER BY created_at DESC
LIMIT 20;

-- Check offer_providers table
SELECT * FROM offer_providers WHERE name ILIKE '%gemiad%';

-- Check if any offers have provider_id matching Gemiad
SELECT 
  o.id,
  o.title,
  o.category,
  o.category_manual,
  o.provider_id,
  op.name as provider_name
FROM offers o
LEFT JOIN offer_providers op ON o.provider_id = op.id
WHERE op.name ILIKE '%gemiad%'
  AND o.is_active = true
LIMIT 20;

-- Check all categories in use
SELECT DISTINCT category, COUNT(*) as count
FROM offers 
WHERE is_active = true
GROUP BY category
ORDER BY count DESC;

-- Check all manual categories in use
SELECT DISTINCT category_manual, COUNT(*) as count
FROM offers 
WHERE is_active = true AND category_manual IS NOT NULL
GROUP BY category_manual
ORDER BY count DESC;
