#!/usr/bin/env tsx
/**
 * A1: Run syncs for Revtoo, AdswedMedia, Affike, AdBlueMedia
 * Reports sync_status and sync_error for each provider
 */

import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Import the actual sync function
async function runSync(providerSlug: string) {
  try {
    // Get provider ID
    const { data: provider, error: provError } = await supabase
      .from('sdk_offerwall_providers')
      .select('id, slug, name')
      .eq('slug', providerSlug)
      .single();
    
    if (provError || !provider) {
      console.log(`  ❌ Provider ${providerSlug} not found`);
      return { success: false, error: 'Provider not found' };
    }
    
    console.log(`\nSyncing ${provider.slug} (${provider.name})...`);
    
    // Import and call the actual refresh function
    const { adminRefreshProviderImpl } = await import('../src/lib/offers/feed-cache.server.js');
    
    const startTime = Date.now();
    await adminRefreshProviderImpl(provider.id, 'IN'); // Default to India
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Check results
    const { data: cache } = await supabase
      .from('offer_feed_cache')
      .select('offer_count, sync_error, last_synced_at')
      .eq('provider_id', provider.id)
      .eq('country', 'IN')
      .single();
    
    const { count } = await supabase
      .from('offers')
      .select('*', { count: 'exact', head: true })
      .eq('provider_id', provider.id);
    
    if (cache?.sync_error) {
      console.log(`  ❌ FAILED: ${cache.sync_error}`);
      return { success: false, error: cache.sync_error, count: 0 };
    } else {
      console.log(`  ✅ SUCCESS: ${count} offers synced in ${duration}s`);
      return { success: true, count, duration };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`  ❌ ERROR: ${msg}`);
    return { success: false, error: msg, count: 0 };
  }
}

async function main() {
  console.log('=== Part 2 A1: Running Provider Syncs ===');
  console.log('Note: OGAds skipped (no API key provided)\n');
  
  const providers = [
    'revtoo',
    'adswedmedia', 
    'affike',
    'adbluemedia',
    'torox',
    'gemiad'
  ];
  
  const results: Record<string, any> = {};
  
  for (const slug of providers) {
    const result = await runSync(slug);
    results[slug] = result;
    
    // Wait a bit between syncs to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n=== Sync Results Summary ===\n');
  
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalOffers = 0;
  
  for (const [slug, result] of Object.entries(results)) {
    if (result.success) {
      console.log(`✅ ${slug}: ${result.count} offers`);
      totalSuccess++;
      totalOffers += result.count;
    } else {
      console.log(`❌ ${slug}: ${result.error}`);
      totalFailed++;
    }
  }
  
  console.log(`\nTotal: ${totalSuccess} succeeded, ${totalFailed} failed, ${totalOffers} offers`);
}

main().catch(console.error);
