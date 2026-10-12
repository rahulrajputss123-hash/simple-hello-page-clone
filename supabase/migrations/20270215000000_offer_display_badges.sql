-- =============================================================================
-- Replace the percentage REWARD CALCULATION with purely visual display badges
-- =============================================================================
-- 20270205000000_offer_reward_mode.sql added reward_mode / reward_percentage and
-- materialised reward_amount from them. That turned out to be the wrong feature:
-- what was wanted is decorative text on the offer card, with no effect on what a
-- user is actually paid.
--
-- So those two columns go, and two display-only columns arrive:
--
--   display_price    text     free-form, e.g. '$5' or 'From $5'. Text rather than
--                             numeric on purpose — it is rendered verbatim and
--                             never used in arithmetic.
--   display_percent  numeric  e.g. 110, rendered as '110%'.
--
-- Both optional and independent: either, both or neither may be set. Nothing
-- reads them except the card/dialog renderers.
--
-- NOT TOUCHED: payout_percentage + max_payout_cap (the Limited Deal actual_cost
-- rule) and revenue_share (network sync). Those are real reward maths and keep
-- working exactly as before.
--
-- DEPLOY ORDER: ship the application code that stops selecting reward_mode /
-- reward_percentage BEFORE applying this, otherwise the admin offer list query
-- errors with 42703 for the gap between the two.
-- -----------------------------------------------------------------------------

-- ------------------------- (1) NEW display-only columns ----------------------
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS display_price   text,
  ADD COLUMN IF NOT EXISTS display_percent numeric;

-- Guard against a stray digit, while still allowing >100% (the whole point of a
-- promotional badge) and a blank value.
ALTER TABLE public.offers
  DROP CONSTRAINT IF EXISTS offers_display_percent_check;
ALTER TABLE public.offers
  ADD CONSTRAINT offers_display_percent_check
  CHECK (display_percent IS NULL OR (display_percent >= 0 AND display_percent <= 100000));

ALTER TABLE public.offers
  DROP CONSTRAINT IF EXISTS offers_display_price_len_check;
ALTER TABLE public.offers
  ADD CONSTRAINT offers_display_price_len_check
  CHECK (display_price IS NULL OR char_length(display_price) <= 24);

COMMENT ON COLUMN public.offers.display_price IS
  'DISPLAY ONLY. Free-form badge text on the offer card, e.g. ''$5''. Never used in reward maths or crediting.';
COMMENT ON COLUMN public.offers.display_percent IS
  'DISPLAY ONLY. Rendered as a percentage badge, e.g. 110 -> ''110%''. Never used in reward maths or crediting.';

-- ------------------- (2) Drop the reward-calculation columns ------------------
-- Constraints first: dropping a column would take them with it, but naming them
-- explicitly keeps this readable and makes a partially-applied 20270205 safe.
ALTER TABLE public.offers DROP CONSTRAINT IF EXISTS offers_reward_mode_check;
ALTER TABLE public.offers DROP CONSTRAINT IF EXISTS offers_reward_percentage_check;
ALTER TABLE public.offers DROP CONSTRAINT IF EXISTS offers_reward_percentage_required_check;

-- IF EXISTS so this installs cleanly whether or not 20270205 ever ran.
-- reward_amount itself is untouched: rows keep whatever figure they were last
-- saved with, so nothing a user sees or is paid changes.
ALTER TABLE public.offers DROP COLUMN IF EXISTS reward_mode;
ALTER TABLE public.offers DROP COLUMN IF EXISTS reward_percentage;
