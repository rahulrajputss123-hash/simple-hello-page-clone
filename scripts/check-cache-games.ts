#!/usr/bin/env tsx
import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const country = process.argv[2] || 'IN';
  
  // Get cache entries
  const { data: cacheEntries } = await supabase
    .from('offer_feed_cache')
    .select('offers, provider_id, offer_providers!inner(slug)')
    .eq('country', country);

  if (!cacheEntries || cacheEntries.length === 0) {
    console.log(`No cache for ${country}`);
    return;
  }

  const offerIds = new Set<string>();
  for (const entry of cacheEntries) {
    const offers = entry.offers as any[];
    if (Array.isArray(offers)) {
      offers.forEach(o => offerIds.add(o.id));
    }
  }

  console.log(`Cache has ${offerIds.size} offers for ${country}`);

  // Check which ones are Games
  const { data: offers } = await supabase
    .from('offers')
    .select('id, title, category, devices')
    .in('id', [...offerIds]);

  if (!offers) return;

  const games = offers.filter(o => o.category === 'Games');
  console.log(`${games.length} Games offers in cache`);
  
  const gamesDeviceCounts = {
    android: games.filter(g => g.devices.includes('android')).length,
    ios: games.filter(g => g.devices.includes('ios')).length,
    web: games.filter(g => g.devices.includes('web')).length,
    empty: games.filter(g => g.devices.length === 0).length,
  };
  
  console.log('\nGames device breakdown:');
  console.log(`  Android: ${gamesDeviceCounts.android}`);
  console.log(`  iOS: ${gamesDeviceCounts.ios}`);
  console.log(`  Web: ${gamesDeviceCounts.web}`);
  console.log(`  Empty: ${gamesDeviceCounts.empty}`);
  
  if (gamesDeviceCounts.web > 0) {
    console.log('\nGames with web:');
    games.filter(g => g.devices.includes('web')).slice(0, 5).forEach(g => {
      console.log(`  - ${g.title}: ${JSON.stringify(g.devices)}`);
    });
  }
}

main();
