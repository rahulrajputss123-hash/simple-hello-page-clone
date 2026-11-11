#!/usr/bin/env tsx
import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // Get all offer IDs from IN cache
  const { data: cache } = await supabase
    .from('offer_feed_cache')
    .select('offers')
    .eq('country', 'IN');
  
  if (!cache) return;
  
  const cacheIds = new Set<string>();
  cache.forEach(entry => {
    const offers = entry.offers as any[];
    (offers || []).forEach(o => cacheIds.add(o.id));
  });
  
  console.log(`Total IDs in IN cache: ${cacheIds.size}`);
  
  // Check Games offers status
  const { data: games } = await supabase
    .from('offers')
    .select('id, title, is_active, category, devices, reward_amount')
    .in('id', [...cacheIds])
    .eq('category', 'Games');
  
  if (!games) return;
  
  const active = games.filter(g => g.is_active);
  const inactive = games.filter(g => !g.is_active);
  const zeroReward = games.filter(g => g.reward_amount <= 0);
  
  console.log(`\nGames in IN cache: ${games.length}`);
  console.log(`  Active: ${active.length}`);
  console.log(`  Inactive: ${inactive.length}`);
  console.log(`  Zero/negative reward: ${zeroReward.length}`);
  
  if (inactive.length > 0) {
    console.log('\nInactive Games:');
    inactive.forEach(g => console.log(`  - ${g.title}`));
  }
  
  if (zeroReward.length > 0) {
    console.log('\nZero reward Games:');
    zeroReward.forEach(g => console.log(`  - ${g.title} (reward: ${g.reward_amount})`));
  }
  
  console.log('\nActive Games with valid rewards:');
  active.filter(g => g.reward_amount > 0).slice(0, 5).forEach(g => {
    console.log(`  - ${g.title} (reward: $${g.reward_amount}, devices: ${JSON.stringify(g.devices)})`);
  });
}

main();
