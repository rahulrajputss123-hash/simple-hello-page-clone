-- Proof mode improvements for campaigns
-- Adds proof_mode column and enforces "either" mode validation

-- 1. Add proof_mode column to campaign_options (idempotent)
ALTER TABLE public.campaign_options 
  ADD COLUMN IF NOT EXISTS proof_mode text 
  CHECK (proof_mode IN ('screenshot', 'text', 'both', 'either'));

COMMENT ON COLUMN public.campaign_options.proof_mode IS 
  'Proof submission mode: screenshot (images only), text (fields only), both (images AND fields required), either (images OR fields, at least one)';

-- 2. Enforce "either" mode validation via trigger
-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS mktenforce_proof_mode_trigger ON public.campaign_submissions;
DROP FUNCTION IF EXISTS public.mktenforce_proof_mode() CASCADE;

-- Create trigger function
CREATE OR REPLACE FUNCTION public.mktenforce_proof_mode()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  v_proof_mode text;
  v_has_images boolean;
  v_has_fields boolean;
  v_field_key text;
  v_field_value text;
BEGIN
  -- Get campaign proof_mode from campaign_options
  SELECT proof_mode INTO v_proof_mode
  FROM public.campaign_options
  WHERE campaign_id = NEW.campaign_id;

  -- Only enforce for 'either' mode
  IF v_proof_mode = 'either' THEN
    -- Check if submission has images
    v_has_images := (NEW.proof_paths IS NOT NULL AND array_length(NEW.proof_paths, 1) > 0);
    
    -- Check if submission has non-empty field values
    v_has_fields := false;
    IF NEW.field_values IS NOT NULL THEN
      FOR v_field_key, v_field_value IN
        SELECT key, value
        FROM jsonb_each_text(NEW.field_values)
      LOOP
        IF v_field_value IS NOT NULL AND btrim(v_field_value) <> '' THEN
          v_has_fields := true;
          EXIT;
        END IF;
      END LOOP;
    END IF;

    -- Enforce: at least one of images or fields must be provided
    IF NOT v_has_images AND NOT v_has_fields THEN
      RAISE EXCEPTION 'MKT_INVALID_PROOF'
        USING DETAIL = 'This campaign requires either a screenshot or the requested details. Please provide at least one.';
    END IF;
  END IF;

  RETURN NEW;
END;
$fn$;

-- Create trigger (fires before insert on campaign_submissions)
CREATE TRIGGER mktenforce_proof_mode_trigger
  BEFORE INSERT ON public.campaign_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.mktenforce_proof_mode();

COMMENT ON FUNCTION public.mktenforce_proof_mode IS 
  'Enforces proof_mode validation for campaign submissions. For "either" mode, requires at least one of: proof images OR field values.';
