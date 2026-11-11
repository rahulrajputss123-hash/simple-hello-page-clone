-- IMMEDIATE FIX: Run this in Supabase SQL Editor to fix Gaming -> Games
-- This updates any existing offers with "Gaming" to "Games"

BEGIN;

-- Update category field
UPDATE offers 
SET category = 'Games'
WHERE category = 'Gaming';

-- Update category_manual field  
UPDATE offers 
SET category_manual = 'Games'
WHERE category_manual = 'Gaming';

-- Show what was updated
SELECT 
  'Updated offers' as action,
  COUNT(*) as count
FROM offers 
WHERE category = 'Games' OR category_manual = 'Games';

COMMIT;

-- Verify the fix
SELECT 
  category,
  category_manual,
  COUNT(*) as offer_count
FROM offers
WHERE is_active = true
  AND (category ILIKE '%gam%' OR category_manual ILIKE '%gam%')
GROUP BY category, category_manual;
