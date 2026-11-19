-- User Survey Profiles
-- Store demographic information used to target surveys from CPX Research and TheoremReach

CREATE TABLE public.user_survey_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  birth_date date CHECK (birth_date <= CURRENT_DATE AND birth_date >= CURRENT_DATE - INTERVAL '100 years'),
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  postal_code text,
  country_code text NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.user_survey_profiles TO authenticated;
GRANT ALL ON public.user_survey_profiles TO service_role;

ALTER TABLE public.user_survey_profiles ENABLE ROW LEVEL SECURITY;

-- User can only read and write their own profile
CREATE POLICY "own survey profile select" ON public.user_survey_profiles 
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "own survey profile insert" ON public.user_survey_profiles 
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "own survey profile update" ON public.user_survey_profiles 
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

-- Auto-update updated_at timestamp
CREATE TRIGGER user_survey_profiles_updated_at 
  BEFORE UPDATE ON public.user_survey_profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX user_survey_profiles_user_id_idx ON public.user_survey_profiles(user_id);

COMMENT ON TABLE public.user_survey_profiles IS 'User demographic profiles for survey targeting (CPX Research, TheoremReach)';
COMMENT ON COLUMN public.user_survey_profiles.birth_date IS 'User birth date (used to calculate age for survey targeting)';
COMMENT ON COLUMN public.user_survey_profiles.gender IS 'User gender: male or female';
COMMENT ON COLUMN public.user_survey_profiles.postal_code IS 'Postal/ZIP code (format validated per country)';
COMMENT ON COLUMN public.user_survey_profiles.country_code IS 'ISO 3166-1 alpha-2 country code';
