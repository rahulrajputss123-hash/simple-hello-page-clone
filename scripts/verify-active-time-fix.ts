#!/usr/bin/env tsx
/**
 * Verify active-time progress loading fix
 * 1. Find a user with non-zero total_seconds
 * 2. Test the fixed function logic
 * 3. Show what the client would display
 */

import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('=== Active Time Progress Fix Verification ===\n');
  
  // 1. Find a user with non-zero total_seconds
  console.log('1. Finding test user with active-time progress...\n');
  
  const { data: progressRows, error: progressError } = await supabase
    .from('quest_active_time_progress')
    .select('user_id, quest_key, total_seconds, today_seconds, today_date, last_ping_at')
    .gt('total_seconds', 0)
    .order('last_ping_at', { ascending: false })
    .limit(5);
  
  if (progressError) {
    console.error('ERROR querying progress:', progressError);
    return;
  }
  
  if (!progressRows || progressRows.length === 0) {
    console.log('No users with active-time progress found.');
    console.log('Creating test row...\n');
    
    // Create a test row
    const testUserId = '00000000-0000-0000-0000-000000000001'; // Replace with actual user ID if needed
    const { data: inserted, error: insertError } = await supabase
      .from('quest_active_time_progress')
      .insert({
        user_id: testUserId,
        quest_key: 'active-time-1',
        total_seconds: 1234,
        today_seconds: 567,
        today_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('ERROR creating test row:', insertError);
      console.log('Aborting - please use a real user ID or check permissions.\n');
      return;
    }
    
    console.log('✅ Created test row:', inserted);
    progressRows.push(inserted);
  }
  
  console.log(`Found ${progressRows.length} users with progress:\n`);
  progressRows.forEach((row, idx) => {
    console.log(`${idx + 1}. User: ${row.user_id}`);
    console.log(`   Quest: ${row.quest_key}`);
    console.log(`   Total: ${row.total_seconds}s (${Math.floor(row.total_seconds / 60)}m ${row.total_seconds % 60}s)`);
    console.log(`   Today: ${row.today_seconds}s`);
    console.log(`   Date: ${row.today_date}`);
    console.log('');
  });
  
  // 2. Test the OLD broken logic vs NEW fixed logic
  const testUser = progressRows[0];
  console.log(`\n2. Testing with user ${testUser.user_id}, quest ${testUser.quest_key}...\n`);
  
  console.log('--- OLD BROKEN LOGIC (embed with !inner) ---');
  const { data: brokenResult, error: brokenError } = await supabase
    .from('quest_active_time_progress')
    .select('total_seconds, today_seconds, today_date, target_seconds:quests!inner(target_minutes)')
    .eq('user_id', testUser.user_id)
    .eq('quest_key', testUser.quest_key)
    .single();
  
  console.log('Result:', brokenResult);
  console.log('Error:', brokenError);
  console.log('→ Client would see: null (no data) → starts from 0 ❌\n');
  
  console.log('--- NEW FIXED LOGIC (separate queries) ---');
  
  // Step 1: Read progress
  const { data: progress, error: progressErr } = await supabase
    .from('quest_active_time_progress')
    .select('total_seconds, today_seconds, today_date')
    .eq('user_id', testUser.user_id)
    .eq('quest_key', testUser.quest_key)
    .maybeSingle();
  
  if (progressErr) {
    console.error('Progress error:', progressErr);
    return;
  }
  
  console.log('Step 1 - Progress query:', progress);
  
  if (!progress) {
    console.log('→ No progress found (null is correct for new users)');
    return;
  }
  
  // Step 2: Read target_minutes from quests
  const { data: quest, error: questErr } = await supabase
    .from('quests')
    .select('target_minutes')
    .eq('key', testUser.quest_key)
    .maybeSingle();
  
  if (questErr) {
    console.error('Quest error:', questErr);
  }
  
  console.log('Step 2 - Quest query:', quest);
  
  const targetMinutes = quest?.target_minutes ?? 120;
  
  const result = {
    totalSeconds: progress.total_seconds,
    todaySeconds: progress.today_seconds,
    todayDate: progress.today_date,
    targetSeconds: targetMinutes * 60,
  };
  
  console.log('\nFinal result:');
  console.log(JSON.stringify(result, null, 2));
  console.log('→ Client would see: starts from', result.totalSeconds, 'seconds ✅\n');
  
  console.log('3. What the card shows:');
  console.log(`   Total: ${Math.floor(result.totalSeconds / 60)}m ${result.totalSeconds % 60}s / ${Math.floor(result.targetSeconds / 60)}m`);
  console.log(`   Progress: ${Math.round((result.totalSeconds / result.targetSeconds) * 100)}%`);
  console.log(`   Today: ${Math.floor(result.todaySeconds / 60)}m ${result.todaySeconds % 60}s\n`);
  
  // 4. Clean up test rows if created
  const isTestRow = testUser.user_id === '00000000-0000-0000-0000-000000000001';
  if (isTestRow) {
    console.log('4. Cleaning up test row...');
    const { error: deleteError } = await supabase
      .from('quest_active_time_progress')
      .delete()
      .eq('user_id', testUser.user_id)
      .eq('quest_key', testUser.quest_key);
    
    if (deleteError) {
      console.error('ERROR deleting test row:', deleteError);
    } else {
      console.log('✅ Test row deleted\n');
    }
  }
  
  console.log('=== Verification Complete ===');
}

main().catch(console.error);
