#!/usr/bin/env tsx
import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // Get Games offers from cache for IN
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

  // Get full offer details
  const { data: offers } = await supabase
    .from('offers')
    .select('id, title, category, devices, raw_payload')
    .in('id', [...offerIds])
    .eq('category', 'Games')
    .eq('is_active', true);

  if (!offers || offers.length === 0) {
    console.log('No Games offers in cache');
    return;
  }

  console.log(`Found ${offers.length} Games offers in IN cache\n`);

  // Check if they have steps in raw_payload
  for (const offer of offers.slice(0, 5)) {
    console.log(`${offer.title}:`);
    console.log(`  Devices: ${JSON.stringify(offer.devices)}`);
    
    const raw = offer.raw_payload as any;
    if (raw?.events && Array.isArray(raw.events)) {
      console.log(`  Has events (steps): ${raw.events.length} steps`);
      console.log(`  Sample steps:`, raw.events.slice(0, 2).map((e: any) => ({
        action: e.action?.en || e.description || 'unknown',
        payout: e.payout || e.reward
      })));
    } else {
      console.log(`  No events/steps`);
    }
    console.log();
  }
}

main();
