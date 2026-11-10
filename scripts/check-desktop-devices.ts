#!/usr/bin/env tsx
/**
 * Find offers that still have 'desktop' in devices array
 */

import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('\n=== Finding offers with "desktop" in devices ===\n');

  // Get all offers with devices containing 'desktop'
  const { data: offers, error } = await supabase
    .from('offers')
    .select('id, source, category, devices, title')
    .filter('devices', 'cs', '{"desktop"}'); // contains 'desktop'

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${offers.length} offers with "desktop" in devices:`);
  console.table(offers);
}

main().catch(console.error);
