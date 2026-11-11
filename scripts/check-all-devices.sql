-- Check manual offers with "All" in devices
SELECT id, title, devices, is_featured, is_active
FROM offers 
WHERE source = 'manual' 
  AND devices @> ARRAY['All']
ORDER BY title;

-- Count all manual featured offers by device array
SELECT devices, COUNT(*) as count, array_agg(title) as titles
FROM offers
WHERE source = 'manual' 
  AND is_featured = true
  AND is_active = true
GROUP BY devices
ORDER BY count DESC;
