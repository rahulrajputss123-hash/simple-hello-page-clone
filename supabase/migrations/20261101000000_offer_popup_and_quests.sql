-- Feature 1: Offer pre-redirect popup
-- Adds `not_allowed` warning text to offers (used by both manual + network offers).
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS not_allowed text NOT NULL DEFAULT '';

-- Feature 2: Editable Starter Quests + Shortlink Chain
CREATE TABLE IF NOT EXISTS public.quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  icon text NOT NULL DEFAULT 'gift',
  quest_type text NOT NULL DEFAULT 'ads' CHECK (quest_type IN ('ads', 'shortlink')),
  ads_required integer NOT NULL DEFAULT 0,
  reward_amount numeric(10,2) NOT NULL DEFAULT 0,
  shortlink_steps jsonb NOT NULL DEFAULT '[]',
  min_seconds_per_step integer NOT NULL DEFAULT 15,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.quests TO authenticated;
GRANT ALL ON public.quests TO service_role;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "active quests readable" ON public.quests;
CREATE POLICY "active quests readable" ON public.quests
  FOR SELECT TO authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS quests_updated_at ON public.quests;
CREATE TRIGGER quests_updated_at BEFORE UPDATE ON public.quests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the existing hardcoded 3 quests so nothing breaks.
INSERT INTO public.quests (key, label, icon, quest_type, ads_required, reward_amount, sort_order)
VALUES
  ('starter_5', '5 Ads', 'play', 'ads', 5, 1, 1),
  ('starter_25', '25 Ads', 'play', 'ads', 25, 1, 2),
  ('starter_50', '50 Ads', 'play', 'ads', 50, 1, 3)
ON CONFLICT (key) DO NOTHING;

-- Extend quest_sessions to support the shortlink chain flow.
ALTER TABLE public.quest_sessions ADD COLUMN IF NOT EXISTS quest_type text NOT NULL DEFAULT 'ads';
ALTER TABLE public.quest_sessions ADD COLUMN IF NOT EXISTS current_step integer NOT NULL DEFAULT 0;
ALTER TABLE public.quest_sessions ADD COLUMN IF NOT EXISTS step_issued_at timestamptz;
