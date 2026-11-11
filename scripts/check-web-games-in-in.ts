#!/usr/bin/env tsx
import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // Get Games with web and empty countries (available to ALL)
  const { data: allCountryGames } = await supabase
    .from('offers')
    .select('id, title, devices')
    .eq('category', 'Games')
    .contains('devices', ['web'])
    .eq('countries', []);

  if (!allCountryGames || allCountryGames.length === 0) {
    console.log('No Games with web + empty countries');
    return;
  }

  console.log(`Games with web + ALL countries: ${allCountryGames.length}`);
  allCountryGames.forEach(g => console.log(`  - ${g.title}: ${JSON.stringify(g.devices)}`));

  // Check if they're in IN cache
  const { data: inCache } = await supabase
    .from('offer_feed_cache')
    .select('offers')
    .eq('country', 'IN');

  if (!inCache) return;

  const inCachedIds = new Set<string>();
  for (const entry of inCache) {
    const offers = entry.offers as any[];
    if (Array.isArray(offers)) {
      offers.forEach(o => inCachedIds.add(o.id));
    }
  }

  console.log('\nIn IN cache:');
  allCountryGames.forEach(g => {
    const inCache = inCachedIds.has(g.id) ? '✅' : '❌';
    console.log(`  ${inCache} ${g.title}`);
  });
}

main();
