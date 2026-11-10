#!/usr/bin/env tsx
/**
 * Part 2 A1: Sync providers with proper adapter registration
 */

import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

// MUST import registry first to register adapters!
import { getAdapter } from '../src/lib/offers/registry.server.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function syncProvider(slug: string, country = 'IN') {
  try {
    // Verify adapter is registered
    const adapter = getAdapter(slug);
    if (!adapter) {
      return { slug, success: false, error: 'No adapter registered' };
    }
    
    // Get provider from DB
    const { data: provider, error: provError } = await supabase
      .from('sdk_offerwall_providers')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (provError || !provider) {
      return { slug, success: false, error: 'Provider not in database' };
    }
    
    console.log(`\n📡 Syncing ${slug} (${provider.name})...`);
    
    // Call adapter directly
    const startTime = Date.now();
    
    const offers = await adapter.fetchOffers(provider as any, { country, ip: undefined });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`  Retrieved ${offers.length} offers in ${duration}s`);
    
    if (offers.length === 0) {
      return { slug, success: true, count: 0, note: 'No offers returned' };
    }
    
    // Sample first offer
    console.log(`  Sample offer:`, {
      id: offers[0].externalOfferId,
      title: offers[0].title?.substring(0, 50),
      reward: offers[0].rewardAmount,
      category: offers[0].category,
      devices: offers[0].devices
    });
    
    return { slug, success: true, count: offers.length, duration };
    
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`  ❌ ERROR: ${msg.substring(0, 200)}`);
    return { slug, success: false, error: msg };
  }
}

async function main() {
  console.log('=== Part 2 A1: Provider Sync Test ===');
  console.log('Testing adapters with API keys...\n');
  
  const providers = [
    'torox',
    'gemiad',
    'revtoo',
    'adswedmedia',
    'affike'
    // 'adbluemedia' will be added after checking if it exists
  ];
  
  const results = [];
  
  for (const slug of providers) {
    const result = await syncProvider(slug);
    results.push(result);
    
    // Rate limit
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('\n=== Summary ===\n');
  
  let totalSuccess = 0;
  let totalOffers = 0;
  
  for (const r of results) {
    if (r.success) {
      console.log(`✅ ${r.slug}: ${r.count} offers${r.note ? ` (${r.note})` : ''}`);
      totalSuccess++;
      totalOffers += r.count || 0;
    } else {
      console.log(`❌ ${r.slug}: ${r.error}`);
    }
  }
  
  console.log(`\nTotal: ${totalSuccess}/${results.length} succeeded, ${totalOffers} offers fetched`);
}

main().catch(console.error);
