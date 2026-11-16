-- Part 2: Add country tracking to clicks and claims
-- Record user_id and country on every click and claim for analytics

-- Add columns to offer_click_events
ALTER TABLE offer_click_events
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS country text;

-- Add country column to offer_claims
ALTER TABLE offer_claims
ADD COLUMN IF NOT EXISTS country text;

-- Add indexes for efficient country-based queries
CREATE INDEX IF NOT EXISTS idx_offer_click_events_user_id ON offer_click_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_offer_click_events_country ON offer_click_events(country) WHERE country IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_offer_claims_country ON offer_claims(country) WHERE country IS NOT NULL;

-- Add composite index for country + date analytics
CREATE INDEX IF NOT EXISTS idx_offer_click_events_country_date ON offer_click_events(country, created_at) WHERE country IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_offer_claims_country_date ON offer_claims(country, created_at) WHERE country IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN offer_click_events.user_id IS 'User who clicked the offer (null for anonymous clicks)';
COMMENT ON COLUMN offer_click_events.country IS 'ISO-3166 alpha-2 country code at time of click';
COMMENT ON COLUMN offer_claims.country IS 'ISO-3166 alpha-2 country code at time of claim';
