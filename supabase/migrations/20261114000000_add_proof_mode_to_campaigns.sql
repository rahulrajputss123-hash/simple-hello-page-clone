-- Add proof_mode column to campaigns table
-- Defines how proof validation works for microtasks

ALTER TABLE public.campaigns
ADD COLUMN proof_mode text CHECK (proof_mode IN ('either', 'screenshot', 'text', 'both'));

-- Add comment to document the column
COMMENT ON COLUMN public.campaigns.proof_mode IS 'Proof validation mode: either (image OR text), screenshot (image required), text (text required), both (image AND text required)';

-- Backfill from campaign_options for all campaigns where proof_mode exists
UPDATE public.campaigns c
SET proof_mode = co.proof_mode
FROM public.campaign_options co
WHERE c.id = co.campaign_id
  AND co.proof_mode IS NOT NULL
  AND c.proof_mode IS NULL;

-- Override specific campaigns per requirements:
-- Sign Up on JumpTask: requirement says 'either' (campaign_options has 'both')
UPDATE public.campaigns
SET proof_mode = 'either'
WHERE id = '056ee9d2-24e0-46e3-b999-8c8f4e876568';
