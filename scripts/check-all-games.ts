#!/usr/bin/env tsx
/**
 * Check Games offers visibility across all platforms and countries
 */

import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type FeaturedOffer = {
  id: string;
  title: string;
  category: string | null;
  devices: string[];
};

function filterOffersByPlatform(offers: FeaturedOffer[], userPlatform: string): FeaturedOffer[] {
  return offers.filter(
    (offer) => !offer.devices || offer.devices.length === 0 || offer.devices.includes(userPlatform)
  );
}

async function checkAllGames() {
  const countries = ['IN', 'BD', 'US', 'NG', 'PK'];
  const platforms = ['android', 'ios', 'web'];

  console.log('\n=== Games Offers Visibility Report ===\n');

  for (const country of countries) {
    const { data: cacheEntries } = await supabase
      .from('offer_feed_cache')
      .select('offers')
      .eq('country', country);

    if (!cacheEntries || cacheEntries.length === 0) continue;

    const offerIds = new Set<string>();
    for (const entry of cacheEntries) {
      const offers = entry.offers as any[];
      if (Array.isArray(offers)) {
        offers.forEach(o => offerIds.add(o.id));
      }
    }

    const { data: offers } = await supabase
      .from('offers')
      .select('id, title, category, devices')
      .in('id', [...offerIds])
      .eq('is_active', true);

    if (!offers) continue;

    console.log(`${country}:`);
    for (const platform of platforms) {
      const filtered = filterOffersByPlatform(offers as FeaturedOffer[], platform);
      const gamesCount = filtered.filter(o => o.category === 'Games').length;
      const status = gamesCount > 0 ? '✅' : '❌';
      console.log(`  ${platform}: ${gamesCount} Games offers ${status}`);
    }
    console.log();
  }
}

checkAllGames().catch(console.error);
