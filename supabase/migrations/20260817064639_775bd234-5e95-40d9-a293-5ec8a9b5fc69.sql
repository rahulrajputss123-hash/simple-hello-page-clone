-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  email text,
  phone text,
  avatar_url text,
  wallet_balance numeric(12,2) NOT NULL DEFAULT 0,
  held_balance numeric(12,2) NOT NULL DEFAULT 0,
  lifetime_earned numeric(12,2) NOT NULL DEFAULT 0,
  lifetime_withdrawn numeric(12,2) NOT NULL DEFAULT 0,
  referral_code text NOT NULL UNIQUE,
  referred_by text,
  device_id text,
  streak_count integer NOT NULL DEFAULT 0,
  streak_date date,
  onboarded boolean NOT NULL DEFAULT false,
  is_flagged boolean NOT NULL DEFAULT false,
  push_enabled boolean NOT NULL DEFAULT true,
  language text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- OFFERS
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  icon text NOT NULL DEFAULT 'gift',
  description text NOT NULL DEFAULT '',
  reward_amount numeric(10,2) NOT NULL DEFAULT 0,
  requirements text NOT NULL DEFAULT '',
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers TO authenticated;
GRANT ALL ON public.offers TO service_role;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "offers admin write" ON public.offers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TASKS
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  reward numeric(10,2) NOT NULL DEFAULT 0,
  steps_total integer NOT NULL DEFAULT 1,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks readable" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "tasks admin write" ON public.tasks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.user_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_tasks TO authenticated;
GRANT ALL ON public.user_tasks TO service_role;
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own user_tasks" ON public.user_tasks FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- QUEST SESSIONS
CREATE TABLE public.quest_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quest_key text NOT NULL,
  ads_required integer NOT NULL,
  ads_watched integer NOT NULL DEFAULT 0,
  reward_amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'started',
  started_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  credited_at timestamptz
);
GRANT SELECT ON public.quest_sessions TO authenticated;
GRANT ALL ON public.quest_sessions TO service_role;
ALTER TABLE public.quest_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own quest sessions" ON public.quest_sessions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- WALLET TRANSACTIONS
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL,
  description text NOT NULL DEFAULT '',
  amount numeric(12,2) NOT NULL,
  kind text NOT NULL DEFAULT 'earned',
  status text NOT NULL DEFAULT 'completed',
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own transactions" ON public.wallet_transactions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- PAYOUT METHODS
CREATE TABLE public.payout_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  method_type text NOT NULL DEFAULT 'upi',
  label text NOT NULL DEFAULT '',
  upi_id text,
  account_number text,
  ifsc text,
  holder_name text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payout_methods TO authenticated;
GRANT ALL ON public.payout_methods TO service_role;
ALTER TABLE public.payout_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own payout methods" ON public.payout_methods FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- WITHDRAWALS
CREATE TABLE public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  payout_method_id uuid REFERENCES public.payout_methods(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.withdrawal_requests TO authenticated;
GRANT ALL ON public.withdrawal_requests TO service_role;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own withdrawals" ON public.withdrawal_requests FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER withdrawals_updated_at BEFORE UPDATE ON public.withdrawal_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SUPPORT
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  admin_response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tickets select" ON public.support_tickets FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own tickets insert" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin tickets update" ON public.support_tickets FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- FAQ
CREATE TABLE public.faq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faq TO authenticated;
GRANT SELECT ON public.faq TO anon;
GRANT ALL ON public.faq TO service_role;
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faq public read" ON public.faq FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "faq admin write" ON public.faq FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- REFERRALS
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL UNIQUE,
  code text NOT NULL,
  bonus_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  signup_credited_at timestamptz,
  earning_credited_at timestamptz,
  withdrawal_credited_at timestamptz
);
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own referrals" ON public.referrals FOR SELECT TO authenticated USING (referrer_id = auth.uid() OR referred_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications select" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- FUNCTION GRANTS
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;

-- OFFER CLAIMS
CREATE TABLE public.offer_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  reward_amount numeric NOT NULL DEFAULT 0,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, offer_id)
);
GRANT SELECT, INSERT ON public.offer_claims TO authenticated;
GRANT ALL ON public.offer_claims TO service_role;
ALTER TABLE public.offer_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own offer claims select" ON public.offer_claims
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER offer_claims_updated_at
  BEFORE UPDATE ON public.offer_claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- OFFER PROVIDERS (offer feed)
CREATE TABLE public.offer_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  provider_type text NOT NULL DEFAULT 'offerwall',
  enabled boolean NOT NULL DEFAULT false,
  sync_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  sync_status text NOT NULL DEFAULT 'idle',
  sync_error text,
  default_revenue_share numeric NOT NULL DEFAULT 0.6,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offer_providers TO authenticated;
GRANT ALL ON public.offer_providers TO service_role;
ALTER TABLE public.offer_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "providers admin all" ON public.offer_providers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER offer_providers_updated_at
  BEFORE UPDATE ON public.offer_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.offers
  ADD COLUMN source text NOT NULL DEFAULT 'manual',
  ADD COLUMN provider_id uuid REFERENCES public.offer_providers(id) ON DELETE SET NULL,
  ADD COLUMN external_offer_id text,
  ADD COLUMN click_url text,
  ADD COLUMN network_payout numeric,
  ADD COLUMN revenue_share numeric,
  ADD COLUMN countries text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN devices text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN expires_at timestamptz,
  ADD COLUMN last_seen_at timestamptz,
  ADD COLUMN admin_priority integer NOT NULL DEFAULT 0,
  ADD COLUMN raw_payload jsonb;

ALTER TABLE public.offers
  ADD CONSTRAINT offers_source_check CHECK (source IN ('manual','network')),
  ADD CONSTRAINT offers_network_identity_check CHECK (
    source = 'manual' OR (provider_id IS NOT NULL AND external_offer_id IS NOT NULL)
  );

CREATE UNIQUE INDEX offers_provider_external_uniq ON public.offers (provider_id, external_offer_id);
CREATE INDEX offers_featured_rank_idx
  ON public.offers (is_active, is_featured, admin_priority DESC, sort_order);

CREATE POLICY "offers eligible readable" ON public.offers
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (is_active = true AND (expires_at IS NULL OR expires_at > now()))
  );

-- TASK ENGINE
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS task_type text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS target integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS frequency text NOT NULL DEFAULT 'one_time',
  ADD COLUMN IF NOT EXISTS icon text NOT NULL DEFAULT 'target',
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS window_days integer,
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_task_type_check CHECK (task_type IN ('manual','referral_count','referral_window','referral_daily','offer_completion','ad_watch','shortlink','content_locker')),
  ADD CONSTRAINT tasks_frequency_check CHECK (frequency IN ('daily','weekly','one_time','lifetime'));

ALTER TABLE public.user_tasks
  ADD COLUMN IF NOT EXISTS period_key text NOT NULL DEFAULT 'lifetime',
  ADD COLUMN IF NOT EXISTS target integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reward_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS rewarded_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS user_tasks_user_task_period_key ON public.user_tasks (user_id, task_id, period_key);

CREATE TABLE IF NOT EXISTS public.task_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_key text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS task_events_dedupe ON public.task_events (user_id, event_type, event_key);
CREATE INDEX IF NOT EXISTS task_events_user_time ON public.task_events (user_id, event_type, occurred_at DESC);
GRANT SELECT ON public.task_events TO authenticated;
GRANT ALL ON public.task_events TO service_role;
ALTER TABLE public.task_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own task events" ON public.task_events FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- SEED
INSERT INTO public.offers (title, icon, description, reward_amount, requirements, is_featured, sort_order) VALUES
('Coin Master Rush', 'gamepad', 'Install and reach village level 5', 4.50, 'Reach level 5 within 7 days', true, 1),
('Survey Sprint', 'clipboard', 'Complete a 5 minute opinion survey', 0.75, 'Answer all questions honestly', true, 2),
('Shop & Save App', 'shopping-bag', 'Install and make your first search', 1.20, 'Keep app installed 48 hours', true, 3),
('Crypto Wallet Signup', 'wallet', 'Create and verify a free wallet', 6.00, 'Complete identity check', false, 4),
('Daily News Reader', 'newspaper', 'Read 3 articles in the partner app', 0.35, 'Stay 30s per article', false, 5);

INSERT INTO public.tasks (title, description, reward, steps_total, is_featured, sort_order) VALUES
('Complete your profile', 'Add your name and avatar to unlock payouts', 0.25, 1, false, 1),
('Watch 10 ads today', 'Keep your streak alive with 10 rewarded videos', 0.50, 10, true, 2),
('Add a payout method', 'Save a UPI ID or bank account', 0.20, 1, false, 3),
('Invite 3 friends', 'Share your referral code and get bonuses', 1.50, 3, true, 4),
('Complete 2 offers', 'Finish any two partner offers', 2.00, 2, false, 5);

INSERT INTO public.faq (question, answer, category, sort_order) VALUES
('How do I earn coins?', 'Watch rewarded ads in Starter Quests, complete partner offers, finish daily tasks, and invite friends.', 'earning', 1),
('When is my quest credited?', 'Every ad session is verified on our servers. Credit lands in your wallet within seconds of verification.', 'earning', 2),
('What is the minimum withdrawal?', 'You can cash out once your available balance reaches $5.00.', 'payouts', 3),
('How long do payouts take?', 'Approved withdrawals are processed within 3 business days to your default payout method.', 'payouts', 4),
('Why do I need KYC?', 'Withdrawals of $20.00 or more require identity verification to keep the platform fraud free.', 'payouts', 5),
('Can I use two accounts?', 'No. One account per device is allowed. Duplicate accounts are flagged and may be suspended.', 'account', 6);