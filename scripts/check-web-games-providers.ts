#!/usr/bin/env tsx
import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data } = await supabase
    .from('offers')
    .select('id, title, devices, source, provider_id, offer_providers!inner(slug)')
    .eq('category', 'Games');

  if (!data) return;

  const withWeb = data.filter(o => o.devices.includes('web'));
  
  console.log(`Total Games: ${data.length}`);
  console.log(`Games with web: ${withWeb.length}`);
  
  // Group by provider
  const byProvider = new Map<string, number>();
  for (const offer of withWeb) {
    const provider = (offer as any).offer_providers?.slug || 'unknown';
    byProvider.set(provider, (byProvider.get(provider) || 0) + 1);
  }
  
  console.log('\nGames with web by provider:');
  for (const [provider, count] of Array.from(byProvider.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${provider}: ${count}`);
  }
  
  console.log('\nSample offers:');
  withWeb.slice(0, 10).forEach(o => {
    const provider = (o as any).offer_providers?.slug || 'unknown';
    console.log(`  - [${provider}] ${o.title}: ${JSON.stringify(o.devices)}`);
  });
}

main();
