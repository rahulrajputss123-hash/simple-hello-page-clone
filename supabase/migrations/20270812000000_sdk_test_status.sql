/**
 * Add 'test' status to sdk_offerwall_conversions for debug callbacks.
 * 
 * TheoremReach and other providers send test callbacks (debug=true) from their
 * dashboards to verify postback URL and signature. These should be logged with
 * status='test' rather than rejected as 'user_not_found'.
 */

-- Idempotent: Only modify if 'test' is not already in the constraint
DO $$
DECLARE
  constraint_def text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO constraint_def
  FROM pg_constraint
  WHERE conname = 'sdk_offerwall_conversions_status_check'
    AND conrelid = 'public.sdk_offerwall_conversions'::regclass;
  
  -- Only modify if test is not present
  IF constraint_def IS NOT NULL AND constraint_def NOT LIKE '%test%' THEN
    ALTER TABLE public.sdk_offerwall_conversions DROP CONSTRAINT sdk_offerwall_conversions_status_check;
    ALTER TABLE public.sdk_offerwall_conversions ADD CONSTRAINT sdk_offerwall_conversions_status_check 
      CHECK (status IN ('pending', 'credited', 'rejected', 'duplicate', 'reversed', 'quest_absorbed', 'test'));
  END IF;
END $$;
