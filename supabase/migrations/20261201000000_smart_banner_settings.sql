-- =============================================================================
-- Feature: Smart-banner on/off switches
-- Smart banners stay code-only (content is always computed live from real data).
-- This table is JUST an enabled/disabled switch per template — no content here.
-- A template with no row is treated as ENABLED by default.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.smart_banner_settings (
  template_key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.smart_banner_settings TO authenticated;
GRANT ALL    ON public.smart_banner_settings TO service_role;
ALTER TABLE public.smart_banner_settings ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read (needed at render time to know which templates to skip).
DROP POLICY IF EXISTS "smart banner settings readable" ON public.smart_banner_settings;
CREATE POLICY "smart banner settings readable" ON public.smart_banner_settings
  FOR SELECT TO authenticated
  USING (true);

-- Only admins can change the switches.
DROP POLICY IF EXISTS "admins manage smart banner settings" ON public.smart_banner_settings;
CREATE POLICY "admins manage smart banner settings" ON public.smart_banner_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS smart_banner_settings_updated_at ON public.smart_banner_settings;
CREATE TRIGGER smart_banner_settings_updated_at BEFORE UPDATE ON public.smart_banner_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
