-- Check what category values exist for game-related offers
SELECT DISTINCT category, category_manual, COUNT(*) 
FROM offers 
WHERE (category ILIKE '%gam%' OR category_manual ILIKE '%gam%')
  AND is_active = true
GROUP BY category, category_manual;

-- Check Gemiad provider offers
SELECT 
  o.id,
  o.title,
  o.category,
  o.category_manual,
  op.name as provider_name
FROM offers o
JOIN offer_providers op ON o.provider_id = op.id
WHERE op.name ILIKE '%gemiad%'
  AND o.is_active = true
LIMIT 10;
