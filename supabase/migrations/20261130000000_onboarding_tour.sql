-- =============================================================================
-- Feature: First-time onboarding coach-mark tour
-- =============================================================================
-- NOTE: `profiles.onboarded` is a DIFFERENT, pre-existing boolean that
-- drives the name/referral profile-setup redirect to /onboarding. It is
-- untouched here. This tour's completion flag is `has_seen_onboarding`
-- (deliberately different name) and is only ever evaluated once
-- profiles.onboarded is already true.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_seen_onboarding boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.onboarding_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_element_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS onboarding_steps_enabled_order_idx
  ON public.onboarding_steps (enabled, display_order);

GRANT SELECT ON public.onboarding_steps TO authenticated;
GRANT ALL    ON public.onboarding_steps TO service_role;
ALTER TABLE public.onboarding_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enabled steps readable" ON public.onboarding_steps;
CREATE POLICY "enabled steps readable" ON public.onboarding_steps
  FOR SELECT TO authenticated
  USING (enabled = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins manage onboarding steps" ON public.onboarding_steps;
CREATE POLICY "admins manage onboarding steps" ON public.onboarding_steps
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS onboarding_steps_updated_at ON public.onboarding_steps;
CREATE TRIGGER onboarding_steps_updated_at BEFORE UPDATE ON public.onboarding_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed: wallet balance (merged real-time + withdrawal-entry) + Featured Offers.
INSERT INTO public.onboarding_steps (target_element_id, title, description, display_order, enabled)
VALUES
  (
    'tour-wallet-balance',
    'Your wallet, always live',
    'This is your balance — it updates in real time as you earn. Tap it any time to cash out.',
    1, true
  ),
  (
    'tour-featured-offers',
    'Featured Offers pay the most',
    'Featured Offers are the main way to earn. Complete one and the reward lands in your wallet after review.',
    2, true
  )
ON CONFLICT DO NOTHING;
