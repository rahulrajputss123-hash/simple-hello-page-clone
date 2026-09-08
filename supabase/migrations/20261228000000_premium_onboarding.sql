-- Premium onboarding extends the existing onboarding_steps/profile structures.
-- It does not replace the existing Home screen or the coach-mark tour.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS date_of_birth date;

ALTER TABLE public.onboarding_steps
  ADD COLUMN IF NOT EXISTS experience text NOT NULL DEFAULT 'tour',
  ADD COLUMN IF NOT EXISTS step_key text,
  ADD COLUMN IF NOT EXISTS subtitle text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS step_type text NOT NULL DEFAULT 'showcase',
  ADD COLUMN IF NOT EXISTS cta_text text NOT NULL DEFAULT 'Next →',
  ADD COLUMN IF NOT EXISTS accent_style text NOT NULL DEFAULT 'gold',
  ADD COLUMN IF NOT EXISTS position text NOT NULL DEFAULT 'bottom',
  ADD COLUMN IF NOT EXISTS illustration text,
  ADD COLUMN IF NOT EXISTS icon text;

UPDATE public.onboarding_steps
SET experience = 'tour'
WHERE experience IS NULL;

CREATE INDEX IF NOT EXISTS onboarding_steps_experience_order_idx
  ON public.onboarding_steps (experience, enabled, display_order);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.onboarding_steps WHERE experience = 'premium' AND step_key = 'welcome') THEN
    INSERT INTO public.onboarding_steps (experience, target_element_id, step_key, title, subtitle, description, step_type, cta_text, display_order, enabled, accent_style, position, illustration, icon) VALUES
      ('premium','premium-onboarding','welcome','Welcome to CashGPT','A smarter way to earn on your time','Meet your new earning suite for quests, offers, videos, and referral rewards — all in one calm, guided start.','welcome','Let''s Get Started →',1,true,'gold','center','spark','sparkles'),
      ('premium','premium-onboarding','choose_avatar','Choose your avatar','Make your profile feel like yours','Pick a fixed CashGPT persona to represent you across your profile and rewards journey.','avatar','Next →',2,true,'gold','bottom','avatars','user'),
      ('premium','premium-onboarding','profile','Set up your profile','A few details, a more personal experience','Your profile stays editable from Settings whenever you need it.','profile','Continue →',3,true,'jade','bottom','profile','user-round'),
      ('premium','premium-onboarding','features_offers','Features Offers','Find the right way to earn','Explore tasks, app installs, surveys, and deals. This quick look is educational — live offers stay in the main app.','showcase','Next →',4,true,'gold','bottom','offers','clipboard'),
      ('premium','premium-onboarding','quest','Quest','Unlock more ways to earn','Daily quests turn small actions into satisfying progress, with lockers, shortlinks, and special challenges.','showcase','Next →',5,true,'jade','bottom','quest','lock'),
      ('premium','premium-onboarding','watch_earn','Watch & Earn','Watch available ads and complete earning goals','Short videos and clear goals make it easy to build a rhythm. Real earning sessions begin from Home.','showcase','Next →',6,true,'gold','bottom','watch','play'),
      ('premium','premium-onboarding','offerwall','Offerwall','Explore more earning opportunities','Browse app, survey, game, and partner opportunities when you are ready to go deeper.','showcase','Next →',7,true,'jade','bottom','offerwall','layers'),
      ('premium','premium-onboarding','refer_earn','Refer & Earn','Invite friends and grow together','Share your referral link, help a friend get started, and earn referral rewards from their activity.','showcase','Finish →',8,true,'gold','bottom','referrals','users'),
      ('premium','premium-onboarding','youre_ready','You''re Ready!','Your CashGPT journey starts here','Now you know how CashGPT works. Start earning whenever you''re ready.','celebration','Start Earning →',9,true,'gold','center','celebration','party-popper');
  END IF;
END $$;