-- =============================================================================
-- MARKETPLACE CATEGORIES SYSTEM
-- =============================================================================
-- Adds a unified category/subcategory system for advertiser campaigns.
-- Replaces the hardcoded "General" category and provides structured filtering.
--
-- Changes:
-- 1. marketplace_categories table (7 main categories)
-- 2. marketplace_subcategories table (subcategories per category)
-- 3. campaigns.category_id and campaigns.subcategory_id columns
-- 4. Constraint: subcategory must belong to selected category
-- 5. Legacy type_key → category mapping for backward compatibility
-- 6. Client read-only access to category tables
--
-- Safe to apply. Additive only. Nullable columns allow existing campaigns.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CATEGORIES TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.marketplace_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE CHECK (slug ~ '^[a-z][a-z0-9_-]{1,39}$'),
  name        text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 60),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 500),
  icon        text CHECK (icon IS NULL OR char_length(icon) <= 50),
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_categories_sort_idx 
  ON public.marketplace_categories (sort_order, name) WHERE is_active;

-- -----------------------------------------------------------------------------
-- 2. SUBCATEGORIES TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.marketplace_subcategories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.marketplace_categories(id) ON DELETE RESTRICT,
  slug        text NOT NULL CHECK (slug ~ '^[a-z][a-z0-9_-]{1,39}$'),
  name        text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 60),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 500),
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, slug)
);

CREATE INDEX IF NOT EXISTS marketplace_subcategories_category_idx 
  ON public.marketplace_subcategories (category_id, sort_order, name) WHERE is_active;

-- -----------------------------------------------------------------------------
-- 3. SEED CATEGORIES AND SUBCATEGORIES
-- -----------------------------------------------------------------------------

-- Insert 7 main categories
INSERT INTO public.marketplace_categories (slug, name, description, icon, sort_order) VALUES
  ('deals-offers', 'Deals & Offers', 'Special deals, trials, purchases, and subscriptions', 'tag', 10),
  ('website-app', 'Website & App', 'Website visits, app installs, signups, and testing', 'globe', 20),
  ('social-media', 'Social Media', 'Social platform engagement and sharing tasks', 'share-2', 30),
  ('surveys-research', 'Surveys & Research', 'Surveys, questionnaires, and feedback', 'clipboard-list', 40),
  ('cpa-lead-gen', 'CPA & Lead Generation', 'Qualified signups and verified conversions', 'target', 50),
  ('video-content', 'Video & Content', 'Video watching and content review tasks', 'video', 60),
  ('other-tasks', 'Other Microtasks', 'Shortlinks, data collection, and custom tasks', 'sparkles', 70)
ON CONFLICT (slug) DO NOTHING;

-- Insert subcategories (using DO block to get category IDs)
DO $$
DECLARE
  cat_deals uuid;
  cat_web uuid;
  cat_social uuid;
  cat_surveys uuid;
  cat_cpa uuid;
  cat_video uuid;
  cat_other uuid;
BEGIN
  -- Get category IDs
  SELECT id INTO cat_deals FROM public.marketplace_categories WHERE slug = 'deals-offers';
  SELECT id INTO cat_web FROM public.marketplace_categories WHERE slug = 'website-app';
  SELECT id INTO cat_social FROM public.marketplace_categories WHERE slug = 'social-media';
  SELECT id INTO cat_surveys FROM public.marketplace_categories WHERE slug = 'surveys-research';
  SELECT id INTO cat_cpa FROM public.marketplace_categories WHERE slug = 'cpa-lead-gen';
  SELECT id INTO cat_video FROM public.marketplace_categories WHERE slug = 'video-content';
  SELECT id INTO cat_other FROM public.marketplace_categories WHERE slug = 'other-tasks';

  -- Deals & Offers subcategories
  INSERT INTO public.marketplace_subcategories (category_id, slug, name, sort_order) VALUES
    (cat_deals, 'free-trial', 'Free Trial', 10),
    (cat_deals, 'paid-trial', 'Paid Trial', 20),
    (cat_deals, 'purchase', 'Purchase', 30),
    (cat_deals, 'product-deal', 'Product Deal', 40),
    (cat_deals, 'subscription', 'Subscription', 50),
    (cat_deals, 'discount-offer', 'Discount Offer', 60),
    (cat_deals, 'special-deal', 'Special Deal', 70)
  ON CONFLICT (category_id, slug) DO NOTHING;

  -- Website & App subcategories
  INSERT INTO public.marketplace_subcategories (category_id, slug, name, sort_order) VALUES
    (cat_web, 'website-visit', 'Website Visit', 10),
    (cat_web, 'app-install', 'App Install', 20),
    (cat_web, 'signup', 'Signup', 30),
    (cat_web, 'registration', 'Registration', 40),
    (cat_web, 'app-testing', 'App Testing', 50),
    (cat_web, 'website-engagement', 'Website Engagement', 60)
  ON CONFLICT (category_id, slug) DO NOTHING;

  -- Social Media subcategories
  INSERT INTO public.marketplace_subcategories (category_id, slug, name, sort_order) VALUES
    (cat_social, 'instagram', 'Instagram', 10),
    (cat_social, 'youtube', 'YouTube', 20),
    (cat_social, 'facebook', 'Facebook', 30),
    (cat_social, 'tiktok', 'TikTok', 40),
    (cat_social, 'social-sharing', 'Social Sharing', 50),
    (cat_social, 'social-engagement', 'Social Engagement', 60)
  ON CONFLICT (category_id, slug) DO NOTHING;

  -- Surveys & Research subcategories
  INSERT INTO public.marketplace_subcategories (category_id, slug, name, sort_order) VALUES
    (cat_surveys, 'surveys', 'Surveys', 10),
    (cat_surveys, 'questionnaires', 'Questionnaires', 20),
    (cat_surveys, 'product-feedback', 'Product Feedback', 30),
    (cat_surveys, 'user-testing', 'User Testing', 40),
    (cat_surveys, 'opinion-polls', 'Opinion Polls', 50)
  ON CONFLICT (category_id, slug) DO NOTHING;

  -- CPA & Lead Generation subcategories
  INSERT INTO public.marketplace_subcategories (category_id, slug, name, sort_order) VALUES
    (cat_cpa, 'qualified-signup', 'Qualified Signup', 10),
    (cat_cpa, 'lead-form', 'Lead Form', 20),
    (cat_cpa, 'app-offer', 'App Offer', 30),
    (cat_cpa, 'verified-conversion', 'Verified Conversion', 40)
  ON CONFLICT (category_id, slug) DO NOTHING;

  -- Video & Content subcategories
  INSERT INTO public.marketplace_subcategories (category_id, slug, name, sort_order) VALUES
    (cat_video, 'video-watch', 'Video Watch', 10),
    (cat_video, 'content-review', 'Content Review', 20),
    (cat_video, 'content-feedback', 'Content Feedback', 30)
  ON CONFLICT (category_id, slug) DO NOTHING;

  -- Other Microtasks subcategories
  INSERT INTO public.marketplace_subcategories (category_id, slug, name, sort_order) VALUES
    (cat_other, 'shortlink-visit', 'Shortlink Visit', 10),
    (cat_other, 'content-unlocker', 'Content Unlocker', 20),
    (cat_other, 'data-collection', 'Data Collection', 30),
    (cat_other, 'simple-tasks', 'Simple Tasks', 40),
    (cat_other, 'research-tasks', 'Research Tasks', 50),
    (cat_other, 'custom-task', 'Custom Task', 60)
  ON CONFLICT (category_id, slug) DO NOTHING;
END $$;

-- -----------------------------------------------------------------------------
-- 4. ADD CATEGORY COLUMNS TO CAMPAIGNS
-- -----------------------------------------------------------------------------

ALTER TABLE public.campaigns 
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.marketplace_categories(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES public.marketplace_subcategories(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS estimated_minutes integer CHECK (estimated_minutes IS NULL OR estimated_minutes BETWEEN 1 AND 1440);

-- Trigger to enforce: subcategory must belong to the selected category
-- CHECK constraints cannot use subqueries, so we use a trigger instead
CREATE OR REPLACE FUNCTION public.campaigns_check_subcategory()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  -- If both category and subcategory are set, validate the relationship
  IF NEW.subcategory_id IS NOT NULL AND NEW.category_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.marketplace_subcategories
      WHERE id = NEW.subcategory_id 
        AND category_id = NEW.category_id
    ) THEN
      RAISE EXCEPTION 'CATEGORY_MISMATCH: subcategory does not belong to the selected category';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS campaigns_check_subcategory_trigger ON public.campaigns;
CREATE TRIGGER campaigns_check_subcategory_trigger
  BEFORE INSERT OR UPDATE OF category_id, subcategory_id ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.campaigns_check_subcategory();

CREATE INDEX IF NOT EXISTS campaigns_category_idx 
  ON public.campaigns (category_id, status) WHERE category_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 5. LEGACY TYPE_KEY → CATEGORY MAPPING
-- -----------------------------------------------------------------------------
-- Maps old campaign_types.key to new categories for backward compatibility.
-- Never infers category from title - this is explicit mapping only.

CREATE OR REPLACE FUNCTION public.mkt_get_legacy_category(p_type_key text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_category_id uuid;
BEGIN
  -- Map known type_keys to categories
  SELECT id INTO v_category_id
  FROM public.marketplace_categories
  WHERE slug = CASE p_type_key
    WHEN 'app_install' THEN 'website-app'
    WHEN 'app_signup' THEN 'website-app'
    WHEN 'website_signup' THEN 'website-app'
    WHEN 'website_visit' THEN 'website-app'
    WHEN 'app_download' THEN 'website-app'
    WHEN 'registration' THEN 'website-app'
    WHEN 'lead_form' THEN 'cpa-lead-gen'
    WHEN 'purchase' THEN 'deals-offers'
    WHEN 'first_action' THEN 'other-tasks'
    ELSE 'other-tasks'  -- 'custom' and unknown types → other-tasks
  END;
  
  RETURN v_category_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- 6. CLIENT ACCESS
-- -----------------------------------------------------------------------------

GRANT SELECT ON TABLE public.marketplace_categories TO authenticated;
GRANT SELECT ON TABLE public.marketplace_subcategories TO authenticated;

DROP POLICY IF EXISTS "categories readable" ON public.marketplace_categories;
CREATE POLICY "categories readable" ON public.marketplace_categories
  FOR SELECT TO authenticated 
  USING (is_active OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "subcategories readable" ON public.marketplace_subcategories;
CREATE POLICY "subcategories readable" ON public.marketplace_subcategories
  FOR SELECT TO authenticated 
  USING (is_active OR public.has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------------------------------
-- 7. UPDATED_AT TRIGGERS
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS marketplace_categories_updated_at ON public.marketplace_categories;
CREATE TRIGGER marketplace_categories_updated_at
  BEFORE UPDATE ON public.marketplace_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS marketplace_subcategories_updated_at ON public.marketplace_subcategories;
CREATE TRIGGER marketplace_subcategories_updated_at
  BEFORE UPDATE ON public.marketplace_subcategories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- VERIFICATION QUERIES (comment out in production)
-- =============================================================================
-- SELECT COUNT(*) as category_count FROM public.marketplace_categories;
-- Expected: 7
--
-- SELECT COUNT(*) as subcategory_count FROM public.marketplace_subcategories;
-- Expected: 39 (7+6+6+5+4+3+6)
--
-- SELECT c.name as category, COUNT(s.id) as subcategory_count
-- FROM public.marketplace_categories c
-- LEFT JOIN public.marketplace_subcategories s ON s.category_id = c.id
-- GROUP BY c.name, c.sort_order
-- ORDER BY c.sort_order;
