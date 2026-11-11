#!/usr/bin/env tsx
import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // Get all Games with web
  const { data: gamesWithWeb } = await supabase
    .from('offers')
    .select('id, title')
    .eq('category', 'Games')
    .contains('devices', ['web']);

  if (!gamesWithWeb || gamesWithWeb.length === 0) {
    console.log('No Games with web');
    return;
  }

  const webGameIds = gamesWithWeb.map(g => g.id);
  console.log(`Found ${webGameIds.length} Games with web devices`);

  // Check which countries have these in their cache
  const countries = ['IN', 'BD', 'US', 'NG', 'PK'];
  
  for (const country of countries) {
    const { data: cacheEntries } = await supabase
      .from('offer_feed_cache')
      .select('offers')
      .eq('country', country);

    if (!cacheEntries) continue;

    const cachedIds = new Set<string>();
    for (const entry of cacheEntries) {
      const offers = entry.offers as any[];
      if (Array.isArray(offers)) {
        offers.forEach(o => cachedIds.add(o.id));
      }
    }

    const webGamesInCache = webGameIds.filter(id => cachedIds.has(id));
    console.log(`${country}: ${webGamesInCache.length}/${webGameIds.length} web Games in cache`);
  }
}

main();
