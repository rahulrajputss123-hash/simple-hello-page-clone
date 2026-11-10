#!/usr/bin/env tsx
/**
 * Fix offers that have 'desktop' in devices array - convert to 'web'
 * This is a one-time fix for offers that were synced before normalizeDevices was created.
 * 
 * Run with:
 * - Dry run (default): npx tsx scripts/fix-desktop-devices.ts
 * - Apply changes: npx tsx scripts/fix-desktop-devices.ts --apply
 */

import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';
import { normalizeDevices } from '../src/lib/offers/normalize-devices.js';

const DRY_RUN = !process.argv.includes('--apply');
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

if (DRY_RUN) {
  console.log("🔍 DRY RUN MODE - No changes will be written to database");
  console.log("To apply changes, run with --apply flag\n");
} else {
  console.log("✍️  APPLY MODE - Changes will be written to database\n");
}

async function main() {
  console.log('=== Finding offers with "desktop" in devices ===\n');

  // Get all offers with devices containing 'desktop'
  const { data: offers, error } = await supabase
    .from('offers')
    .select('id, source, category, devices, title')
    .filter('devices', 'cs', '{"desktop"}'); // contains 'desktop'

  if (error) {
    console.error('Error fetching offers:', error);
    return;
  }

  console.log(`Found ${offers.length} offers with "desktop" in devices\n`);

  if (offers.length === 0) {
    console.log('✅ No offers to fix!');
    return;
  }

  let updatedCount = 0;
  let errorCount = 0;

  for (const offer of offers) {
    const oldDevices = offer.devices;
    const newDevices = normalizeDevices(oldDevices);

    console.log(`\nOffer: ${offer.title.substring(0, 50)}`);
    console.log(`  ID: ${offer.id}`);
    console.log(`  Category: ${offer.category || 'null'}`);
    console.log(`  Old devices: ${JSON.stringify(oldDevices)}`);
    console.log(`  New devices: ${JSON.stringify(newDevices)}`);

    if (JSON.stringify(oldDevices) === JSON.stringify(newDevices)) {
      console.log('  ⏭️  No change needed');
      continue;
    }

    if (DRY_RUN) {
      console.log('  [DRY RUN] Would update');
      updatedCount++;
    } else {
      const { error: updateError } = await supabase
        .from('offers')
        .update({ devices: newDevices })
        .eq('id', offer.id);

      if (updateError) {
        console.error('  ❌ Error:', updateError);
        errorCount++;
      } else {
        console.log('  ✅ Updated');
        updatedCount++;
      }
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total offers found: ${offers.length}`);
  console.log(`${DRY_RUN ? 'Would update' : 'Updated'}: ${updatedCount}`);
  if (errorCount > 0) {
    console.log(`Errors: ${errorCount}`);
  }
}

main().catch(console.error);
