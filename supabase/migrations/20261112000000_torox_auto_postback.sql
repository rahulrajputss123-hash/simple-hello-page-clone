-- Migration: Set Torox offers to auto_postback mode
-- Date: 2026-11-12
-- Purpose: Fix Torox postback flow by preventing manual claims

-- Update all Torox offers to use auto_postback payout mode
UPDATE offers
SET payout_mode = 'auto_postback'
FROM offer_providers
WHERE offers.provider_id = offer_providers.id
  AND offer_providers.slug = 'torox'
  AND offers.payout_mode != 'auto_postback';

-- Verify the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM offers
  JOIN offer_providers ON offers.provider_id = offer_providers.id
  WHERE offer_providers.slug = 'torox'
    AND offers.payout_mode = 'auto_postback';
  
  RAISE NOTICE 'Updated % Torox offers to auto_postback mode', updated_count;
END $$;
