-- Add push_to_bottom column to offers table for admin control over feed ordering.
-- null = use keyword detection (casino/betting), true = always bottom, false = never bottom

ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS push_to_bottom boolean DEFAULT NULL;

COMMENT ON COLUMN public.offers.push_to_bottom IS
'Admin override for feed ordering. null = auto-detect casino/betting by keywords, true = always push to bottom, false = never push to bottom';

-- Index for feed queries that filter on this column
CREATE INDEX IF NOT EXISTS offers_push_to_bottom_idx ON public.offers (push_to_bottom)
  WHERE push_to_bottom IS NOT NULL;
