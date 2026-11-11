#!/usr/bin/env tsx
/**
 * Debug exactly what happens when we filter for Games
 */

import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

function filterOffersByPlatform(offers: any[], userPlatform: string): any[] {
  return offers.filter(
    (offer) => !offer.devices || offer.devices.length === 0 || offer.devices.includes(userPlatform)
  );
}

async function main() {
  // Step 1: Get cache for IN
  const { data: cacheEntries } = await supabase
    .from('offer_feed_cache')
    .select('offers')
    .eq('country', 'IN');

  if (!cacheEntries) return;

  const offerIds = new Set<string>();
  for (const entry of cacheEntries) {
    const offers = entry.offers as any[];
    if (Array.isArray(offers)) {
      offers.forEach(o => offerIds.add(o.id));
    }
  }

  console.log(`\n=== Step 1: Cache has ${offerIds.size} offers ===\n`);

  // Step 2: Load from DB with category
  const { data: allOffers } = await supabase
    .from('offers')
    .select('id, title, category, devices')
    .in('id', [...offerIds])
    .eq('is_active', true);

  if (!allOffers) return;

  console.log(`=== Step 2: Loaded ${allOffers.length} active offers from DB ===\n`);

  // Step 3: Filter by Android platform
  const androidOffers = filterOffersByPlatform(allOffers, 'android');
  console.log(`=== Step 3: After Android filter: ${androidOffers.length} offers ===\n`);

  // Step 4: Count by category
  const byCategory = new Map<string, number>();
  for (const offer of androidOffers) {
    const cat = offer.category || 'null';
    byCategory.set(cat, (byCategory.get(cat) || 0) + 1);
  }

  console.log('=== Step 4: Offers by category ===');
  for (const [cat, count] of Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }

  // Step 5: Filter for Games only
  const gamesOffers = androidOffers.filter(o => o.category === 'Games');
  console.log(`\n=== Step 5: Games filter result: ${gamesOffers.length} offers ===\n`);

  if (gamesOffers.length > 0) {
    console.log('Games offers:');
    gamesOffers.forEach(g => console.log(`  - ${g.title} (devices: ${JSON.stringify(g.devices)})`));
  } else {
    console.log('❌ NO GAMES!');
  }

  // Double check - are there any Games in the original list?
  const allGames = allOffers.filter(o => o.category === 'Games');
  console.log(`\n=== Verification: Total Games in DB (before Android filter): ${allGames.length} ===`);
}

main();
