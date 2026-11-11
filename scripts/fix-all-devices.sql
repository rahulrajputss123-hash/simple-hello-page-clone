-- Fix manual offers with devices = ["All"] to devices = []
-- Expected: 2 rows (DIGITAVISION and Vrnum)

BEGIN;

-- Show before state
SELECT id, title, devices as before_devices
FROM offers 
WHERE source = 'manual' 
  AND devices @> ARRAY['All'];

-- Apply fix
UPDATE offers 
SET devices = '{}'
WHERE source = 'manual' 
  AND devices @> ARRAY['All'];

-- Show after state
SELECT id, title, devices as after_devices
FROM offers 
WHERE source = 'manual' 
  AND (title ILIKE '%DIGITAVISION%' OR title ILIKE '%Vrnum%');

COMMIT;

-- Verify no more "All" values exist
SELECT COUNT(*) as remaining_all_count
FROM offers
WHERE devices @> ARRAY['All'];
