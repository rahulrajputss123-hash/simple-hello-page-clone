-- Fix any "Gaming" categories to "Games" to match the type system
-- This migration ensures consistency between database and code

-- Update category field
UPDATE offers 
SET category = 'Games'
WHERE category = 'Gaming'
  AND is_active = true;

-- Update category_manual field  
UPDATE offers 
SET category_manual = 'Games'
WHERE category_manual = 'Gaming'
  AND is_active = true;

-- Add comment
COMMENT ON COLUMN offers.category IS 'Offer category: App Install, Trial, Deals, Survey, Games, Link Locker, or Shortlink';
COMMENT ON COLUMN offers.category_manual IS 'Admin-override category (same values as category field)';
