#!/usr/bin/env tsx
/**
 * Check script for git bisect: verify Games offers appear in featured feed.
 * 
 * Tests the same logic the Offers page uses:
 * 1. Call assembleFeaturedImpl (or its equivalent logic)
 * 2. Filter by platform (filterOffersByPlatform)
 * 3. Count offers with category === 'Games'
 * 
 * Exit 0 if Games count > 0, exit 1 if count is 0.
 * 
 * Usage:
 *   npx tsx scripts/check-games-feed.ts [country] [platform]
 *   Default: IN android
 */

import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: Missing SUPABASE env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const country = process.argv[2] || 'IN';
const platform = process.argv[3] || 'android';

type FeaturedOffer = {
  id: string;
  title: string;
  category: string | null;
  devices: string[];
};

/**
 * Filter offers by platform (same logic as src/lib/offers/platform.server.ts)
 */
function filterOffersByPlatform(offers: FeaturedOffer[], userPlatform: string): FeaturedOffer[] {
  return offers.filter(
    (offer) => !offer.devices || offer.devices.length === 0 || offer.devices.includes(userPlatform)
  );
}

async function checkGamesFeed() {
  console.log(`\n=== Checking Games offers in feed ===`);
  console.log(`Country: ${country}`);
  console.log(`Platform: ${platform}\n`);

  // Get offer_feed_cache entries for this country
  const { data: cacheEntries, error: cacheError } = await supabase
    .from('offer_feed_cache')
    .select('offers')
    .eq('country', country);

  if (cacheError) {
    console.error('ERROR fetching cache:', cacheError);
    process.exit(1);
  }

  if (!cacheEntries || cacheEntries.length === 0) {
    console.log(`No cache entries for ${country}`);
    process.exit(1);
  }

  // Extract all offer IDs from JSONB offers arrays
  const offerIds = new Set<string>();
  for (const entry of cacheEntries) {
    const offers = entry.offers as any[];
    if (Array.isArray(offers)) {
      offers.forEach(o => offerIds.add(o.id));
    }
  }

  console.log(`Found ${offerIds.size} unique offers in cache`);

  if (offerIds.size === 0) {
    console.log('No offers in cache');
    process.exit(1);
  }

  // Fetch offer details with category and devices (same as assembleFeaturedImpl does)
  const { data: offers, error: offersError } = await supabase
    .from('offers')
    .select('id, title, category, devices')
    .in('id', [...offerIds])
    .eq('is_active', true);

  if (offersError) {
    console.error('ERROR fetching offers:', offersError);
    process.exit(1);
  }

  if (!offers || offers.length === 0) {
    console.log('No active offers found');
    process.exit(1);
  }

  console.log(`Loaded ${offers.length} active offers from DB`);

  // Apply platform filter
  const filtered = filterOffersByPlatform(offers as FeaturedOffer[], platform);
  console.log(`After platform filter (${platform}): ${filtered.length} offers`);

  // Count Games offers
  const gamesOffers = filtered.filter(o => o.category === 'Games');
  console.log(`\nGames offers found: ${gamesOffers.length}`);

  if (gamesOffers.length > 0) {
    console.log('\nSample Games offers:');
    gamesOffers.slice(0, 5).forEach(o => {
      console.log(`  - ${o.title} (devices: ${JSON.stringify(o.devices)})`);
    });
    console.log('\n✅ PASS: Games offers are visible');
    process.exit(0);
  } else {
    console.log('\n❌ FAIL: No Games offers visible');
    process.exit(1);
  }
}

checkGamesFeed().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
