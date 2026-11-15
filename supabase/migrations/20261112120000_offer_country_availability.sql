-- Part 3: Create offer_country_availability table
-- Tracks which network offers are available in which countries
-- Populated during feed refresh from network API responses

CREATE TABLE IF NOT EXISTS offer_country_availability (
  offer_id uuid NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  country text NOT NULL,
  provider_id uuid NOT NULL REFERENCES offer_providers(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (offer_id, country)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_offer_country_availability_country ON offer_country_availability(country);
CREATE INDEX IF NOT EXISTS idx_offer_country_availability_provider ON offer_country_availability(provider_id);
CREATE INDEX IF NOT EXISTS idx_offer_country_availability_last_seen ON offer_country_availability(last_seen_at);

-- Composite index for feed assembly (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_offer_country_availability_country_provider ON offer_country_availability(country, provider_id);

-- Add comments for documentation
COMMENT ON TABLE offer_country_availability IS 'Tracks which network offers are available in which countries based on feed API responses';
COMMENT ON COLUMN offer_country_availability.offer_id IS 'Reference to the offer';
COMMENT ON COLUMN offer_country_availability.country IS 'ISO-3166 alpha-2 country code where offer is available';
COMMENT ON COLUMN offer_country_availability.provider_id IS 'Network provider (for efficient cleanup per provider+country)';
COMMENT ON COLUMN offer_country_availability.last_seen_at IS 'Last time this offer was seen in this country feed (for staleness detection)';
