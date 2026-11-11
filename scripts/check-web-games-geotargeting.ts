#!/usr/bin/env tsx
import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // Get all Games with web
  const { data: gamesWithWeb } = await supabase
    .from('offers')
    .select('id, title, countries, devices')
    .eq('category', 'Games')
    .contains('devices', ['web']);

  if (!gamesWithWeb) return;

  console.log(`Total Games with web: ${gamesWithWeb.length}\n`);

  // Check country restrictions
  const withIN = gamesWithWeb.filter(g => g.countries.length === 0 || g.countries.includes('IN'));
  const withBD = gamesWithWeb.filter(g => g.countries.length === 0 || g.countries.includes('BD'));
  const withUS = gamesWithWeb.filter(g => g.countries.length === 0 || g.countries.includes('US'));
  const withEmpty = gamesWithWeb.filter(g => g.countries.length === 0);

  console.log('Country availability:');
  console.log(`  Empty countries (all): ${withEmpty.length}`);
  console.log(`  IN: ${withIN.length}`);
  console.log(`  BD: ${withBD.length}`);
  console.log(`  US: ${withUS.length}`);

  // Check a few samples
  console.log('\nSample offers:');
  gamesWithWeb.slice(0, 10).forEach(g => {
    const countriesStr = g.countries.length === 0 ? 'ALL' : g.countries.join(', ');
    console.log(`  - ${g.title}`);
    console.log(`    Devices: ${JSON.stringify(g.devices)}`);
    console.log(`    Countries: ${countriesStr}`);
  });
}

main();
