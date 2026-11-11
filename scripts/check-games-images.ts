#!/usr/bin/env tsx
import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data } = await supabase
    .from('offers')
    .select('id, title, icon, image_url, category, devices')
    .eq('category', 'Games')
    .contains('devices', ['android'])
    .limit(10);
  
  if (!data) return;
  
  console.log('Android Games offers images:');
  data.forEach(o => {
    const hasIcon = !!o.icon && o.icon !== 'gift';
    const hasImageUrl = !!o.image_url;
    console.log(`  ${o.title}:`);
    console.log(`    icon: ${hasIcon ? o.icon.substring(0, 50) : 'default/missing'}`);
    console.log(`    image_url: ${hasImageUrl ? o.image_url.substring(0, 50) : 'missing'}`);
  });
}

main();
