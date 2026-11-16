-- Part 1: Add country tracking to profiles
-- Store user's country for feed filtering and reporting
-- Country is detected from request headers and updated on session load

-- Add country columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS country_updated_at timestamptz;

-- Add index for efficient country-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country) WHERE country IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN profiles.country IS 'ISO-3166 alpha-2 country code detected from request headers';
COMMENT ON COLUMN profiles.country_updated_at IS 'Last time country was detected and updated';
