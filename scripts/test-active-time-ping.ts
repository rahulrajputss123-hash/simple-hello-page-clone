/**
 * Test script for Active Time ping RPC
 * 
 * Run with: npx tsx scripts/test-active-time-ping.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Set them in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test user ID (replace with a real test user)
const TEST_USER_ID = process.env.TEST_USER_ID || '00000000-0000-0000-0000-000000000001';
const QUEST_KEY = 'active_time';

async function testPing(pingToken: string | null, isActive: boolean = true): Promise<any> {
  console.log('\n========================================');
  console.log(`Testing ping_active_time RPC`);
  console.log(`User: ${TEST_USER_ID.slice(0, 8)}...`);
  console.log(`Quest: ${QUEST_KEY}`);
  console.log(`Token: ${pingToken?.slice(0, 8) || 'null'}`);
  console.log(`Active: ${isActive}`);
  console.log('========================================\n');

  const params = {
    p_user_id: TEST_USER_ID,
    p_quest_key: QUEST_KEY,
    p_ping_token: pingToken,
    p_is_active: isActive,
  };

  console.log('RPC params:', JSON.stringify(params, null, 2));

  const { data, error } = await supabase.rpc('ping_active_time', params);

  if (error) {
    console.error('\n❌ RPC ERROR:');
    console.error('  Code:', error.code);
    console.error('  Message:', error.message);
    console.error('  Details:', error.details);
    console.error('  Hint:', error.hint);
    return null;
  }

  if (!data || data.length === 0) {
    console.error('\n❌ No data returned');
    return null;
  }

  const result = data[0];
  console.log('\n✅ RPC SUCCESS:');
  console.log('  Success:', result.success);
  console.log('  Reason:', result.reason);
  console.log('  Total seconds:', result.total_seconds);
  console.log('  Today seconds:', result.today_seconds);
  console.log('  Target seconds:', result.target_seconds);
  console.log('  Can claim:', result.can_claim);
  console.log('  Next token:', result.next_token?.slice(0, 16) || 'null');

  return result;
}

async function checkDbRow() {
  console.log('\n========================================');
  console.log('Checking DB row...');
  console.log('========================================\n');

  const { data, error } = await supabase
    .from('quest_active_time_progress')
    .select('*')
    .eq('user_id', TEST_USER_ID)
    .eq('quest_key', QUEST_KEY)
    .maybeSingle();

  if (error) {
    console.error('❌ DB query error:', error.message);
    return;
  }

  if (!data) {
    console.log('ℹ️  No row exists yet (will be created on first ping)');
    return;
  }

  console.log('✅ DB Row:');
  console.log('  User:', data.user_id.slice(0, 8) + '...');
  console.log('  Quest:', data.quest_key);
  console.log('  Total seconds:', data.total_seconds);
  console.log('  Today seconds:', data.today_seconds);
  console.log('  Last ping:', data.last_ping_at);
  console.log('  Created:', data.created_at);
}

async function main() {
  console.log('='.repeat(60));
  console.log('Active Time Ping RPC Test');
  console.log('='.repeat(60));

  // Check initial state
  await checkDbRow();

  // First ping (no token)
  console.log('\n\n📍 TEST 1: First ping (should create row)');
  const result1 = await testPing(null, true);
  
  if (!result1) {
    console.error('\n❌ First ping failed - cannot continue');
    process.exit(1);
  }

  // Check DB after first ping
  await checkDbRow();

  // Wait 30 seconds
  console.log('\n\n⏳ Waiting 30 seconds for second ping...');
  await new Promise(resolve => setTimeout(resolve, 30000));

  // Second ping (with token)
  console.log('\n\n📍 TEST 2: Second ping (should credit ~30 seconds)');
  const result2 = await testPing(result1.next_token, true);

  if (!result2) {
    console.error('\n❌ Second ping failed');
    process.exit(1);
  }

  // Check DB after second ping
  await checkDbRow();

  // Verify progression
  const secondsPassed = result2.total_seconds - result1.total_seconds;
  console.log('\n========================================');
  console.log('VERIFICATION:');
  console.log('========================================');
  console.log('  First ping total:', result1.total_seconds);
  console.log('  Second ping total:', result2.total_seconds);
  console.log('  Seconds credited:', secondsPassed);
  console.log('  Expected: ~30s');
  
  if (secondsPassed >= 25 && secondsPassed <= 35) {
    console.log('\n✅ TEST PASSED: Time credited correctly!');
  } else {
    console.log('\n⚠️  WARNING: Unexpected time credit (should be ~30s)');
  }

  console.log('\n' + '='.repeat(60));
  console.log('Test complete!');
  console.log('='.repeat(60));
}

main().catch((err) => {
  console.error('\n❌ FATAL ERROR:', err);
  process.exit(1);
});
