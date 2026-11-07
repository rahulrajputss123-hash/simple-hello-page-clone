-- Manual re-processing of AdswedMedia conversion Kb2Lw5Uz8Aw1
-- User: 3850dd20-7ce0-45f9-a355-a386ac5a90db
-- Issue: Conversion was absorbed by quest system but should have been normal wallet credit
-- Resolution: Update conversion status to pending and credit normal reward (idempotent)

-- Step 1: Find the conversion and verify it exists with quest_absorbed status
DO $$
DECLARE
  v_conversion_id uuid;
  v_user_id uuid := '3850dd20-7ce0-45f9-a355-a386ac5a90db';
  v_provider_id uuid;
  v_currency_amount numeric;
  v_current_status text;
BEGIN
  -- Find the conversion
  SELECT id, provider_id, currency_amount, status
  INTO v_conversion_id, v_provider_id, v_currency_amount, v_current_status
  FROM sdk_offerwall_conversions
  WHERE provider_transaction_id LIKE '%Kb2Lw5Uz8Aw1%'
    AND user_id = v_user_id
  LIMIT 1;

  IF v_conversion_id IS NULL THEN
    RAISE NOTICE 'Conversion Kb2Lw5Uz8Aw1 not found for user %', v_user_id;
    RETURN;
  END IF;

  RAISE NOTICE 'Found conversion: id=%, status=%, currency_amount=%', v_conversion_id, v_current_status, v_currency_amount;

  -- Check if already processed (credited status means it was already credited)
  IF v_current_status = 'credited' THEN
    RAISE NOTICE 'Conversion already credited - skipping to avoid double credit';
    RETURN;
  END IF;

  -- Step 2: Update conversion status from quest_absorbed to pending
  -- This allows the normal credit pipeline to process it
  UPDATE sdk_offerwall_conversions
  SET 
    status = 'pending',
    reject_reason = NULL,
    processed_at = NULL  -- Reset to allow reprocessing
  WHERE id = v_conversion_id
    AND status = 'quest_absorbed';  -- Only update if still quest_absorbed

  IF NOT FOUND THEN
    RAISE NOTICE 'Conversion status is not quest_absorbed (current: %) - skipping update', v_current_status;
    RETURN;
  END IF;

  RAISE NOTICE 'Updated conversion status to pending';

  -- Step 3: Call credit_sdk_conversion_rpc to credit the reward
  -- This will handle wallet credit, referrals, earnings events, and milestones
  BEGIN
    PERFORM credit_sdk_conversion_rpc(v_conversion_id);
    RAISE NOTICE 'Successfully credited conversion via credit_sdk_conversion_rpc';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error calling credit_sdk_conversion_rpc: %', SQLERRM;
    -- Rollback status update on error
    UPDATE sdk_offerwall_conversions
    SET status = 'quest_absorbed'
    WHERE id = v_conversion_id;
    RAISE;
  END;

  -- Step 4: Log the manual reprocessing
  INSERT INTO automation_logs (
    event_type,
    status,
    source,
    provider_id,
    user_id,
    reference_id,
    message,
    context
  ) VALUES (
    'manual_reprocess',
    'success',
    'admin_sql',
    v_provider_id,
    v_user_id,
    v_conversion_id,
    'Manually reprocessed AdswedMedia conversion Kb2Lw5Uz8Aw1 - credited normal wallet reward',
    jsonb_build_object(
      'transactionId', 'Kb2Lw5Uz8Aw1',
      'reason', 'quest_absorbed_incorrectly',
      'previousStatus', v_current_status,
      'currencyAmount', v_currency_amount
    )
  );

  RAISE NOTICE 'Manual reprocessing complete';
END $$;
