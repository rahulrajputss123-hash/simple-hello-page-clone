-- Add preferred_role column to profiles for role switcher persistence
-- Phase 7: Role switcher should survive refresh

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferred_role text CHECK (preferred_role IS NULL OR preferred_role IN ('publisher', 'advertiser'));

COMMENT ON COLUMN public.profiles.preferred_role IS 'User preference for which role dashboard to show by default (publisher vs advertiser mode)';
