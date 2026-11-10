#!/usr/bin/env tsx
/**
 * Quick script to check Games offers and their device values
 */

import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('\n=== Checking Games offers device values ===\n');

  // Get sample Games offers
  const { data: sampleOffers, error: sampleError } = await supabase
    .from('offers')
    .select('id, source, category, devices, title')
    .eq('category', 'Games')
    .order('source')
    .order('id')
    .limit(20);

  if (sampleError) {
    console.error('Error fetching sample offers:', sampleError);
    return;
  }

  console.log('Sample Games offers:');
  console.table(sampleOffers);

  // Count by device values
  const { data: allGamesOffers, error: countError } = await supabase
    .from('offers')
    .select('devices')
    .eq('category', 'Games');

  if (countError) {
    console.error('Error fetching all Games offers:', countError);
    return;
  }

  // Group by device value
  const deviceCounts = new Map<string, number>();
  for (const offer of allGamesOffers) {
    const key = JSON.stringify(offer.devices);
    deviceCounts.set(key, (deviceCounts.get(key) || 0) + 1);
  }

  console.log('\n=== Device value counts ===');
  const sortedCounts = Array.from(deviceCounts.entries())
    .map(([devices, count]) => ({ devices, count }))
    .sort((a, b) => b.count - a.count);
  
  console.table(sortedCounts);

  console.log(`\nTotal Games offers: ${allGamesOffers.length}`);
}

main().catch(console.error);
