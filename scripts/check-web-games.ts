#!/usr/bin/env tsx
import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data } = await supabase.from('offers').select('id, title, devices').eq('category', 'Games');
  if (!data) return;
  
  const withWeb = data.filter(o => o.devices.includes('web'));
  const withEmpty = data.filter(o => o.devices.length === 0);
  
  console.log(`Total Games: ${data.length}`);
  console.log(`Games with 'web' in devices: ${withWeb.length}`);
  console.log(`Games with empty devices: ${withEmpty.length}`);
  
  if (withWeb.length > 0) {
    console.log('\nSample with web:');
    withWeb.slice(0, 5).forEach(o => console.log(`  - ${o.title}: ${JSON.stringify(o.devices)}`));
  }
  
  if (withEmpty.length > 0) {
    console.log('\nSample with empty devices:');
    withEmpty.slice(0, 5).forEach(o => console.log(`  - ${o.title}: ${JSON.stringify(o.devices)}`));
  }
}

main();
