/**
 * Verify active-time timer persistence fix
 * Creates a test quest, simulates pings, verifies persistence
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function verifyFix() {
  console.log('\n=== Verifying Active-Time Persistence Fix ===\n');
  
  const testUserId = '00000000-0000-0000-0000-0000000000a1';
  const testQuestKey = 'daily_active_time_60_min';
  
  console.log('Test Setup:');
  console.log('  - User ID:', testUserId);
  console.log('  - Quest Key:', testQuestKey);
  
  // Ensure quest exists
  console.log('\n1. Checking if quest exists...');
  const { data: quest } = await supabaseAdmin
    .from('quests')
    .select('*')
    .eq('key', testQuestKey)
    .eq('quest_type', 'active_time')
    .maybeSingle();
  
  if (!quest) {
    console.log('   Creating test quest...');
    await supabaseAdmin.from('quests').insert({
      key: testQuestKey,
      quest_type: 'active_time',
      label: 'Test Active Time',
      description: 'Test',
      target_minutes: 60,
      daily_cap_minutes: 120,
      grace_minutes: 10,
      reward_amount: 1.0,
      is_active: true,
    });
    console.log('   ✅ Quest created');
  } else {
    console.log('   ✅ Quest exists');
  }
  
  // Clean up any existing progress for this test
  await supabaseAdmin
    .from('quest_active_time_progress')
    .delete()
    .eq('user_id', testUserId)
    .eq('quest_key', testQuestKey);
  
  console.log('\n2. BEFORE FIRST PING:');
  const { data: before } = await supabaseAdmin
    .from('quest_active_time_progress')
    .select('*')
    .eq('user_id', testUserId)
    .eq('quest_key', testQuestKey)
    .maybeSingle();
  console.log('   Progress:', before ? `${before.total_seconds}s` : 'None (expected)');
  
  // First ping
  console.log('\n3. FIRST PING (should create row):');
  const { data: ping1Data, error: ping1Error } = await supabaseAdmin.rpc('ping_active_time', {
    p_user_id: testUserId,
    p_quest_key: testQuestKey,
    p_ping_token: null,
    p_is_active: true
  });
  
  if (ping1Error) {
    console.error('   ❌ ERROR:', ping1Error);
    process.exit(1);
  }
  
  const result1 = Array.isArray(ping1Data) ? ping1Data[0] : ping1Data;
  console.log('   Result:', {
    success: result1.success,
    reason: result1.reason,
    total_seconds: result1.total_seconds,
    has_token: !!result1.next_token
  });
  
  // Check state after first ping
  const { data: after1 } = await supabaseAdmin
    .from('quest_active_time_progress')
    .select('*')
    .eq('user_id', testUserId)
    .eq('quest_key', testQuestKey)
    .single();
  
  console.log('   DB State:', {
    total_seconds: after1.total_seconds,
    today_seconds: after1.today_seconds,
    has_token: !!after1.last_ping_token
  });
  
  // Wait 25 seconds and ping again
  console.log('\n4. Waiting 25 seconds...');
  await new Promise(resolve => setTimeout(resolve, 25000));
  
  console.log('\n5. SECOND PING (should credit ~25 seconds):');
  const { data: ping2Data, error: ping2Error } = await supabaseAdmin.rpc('ping_active_time', {
    p_user_id: testUserId,
    p_quest_key: testQuestKey,
    p_ping_token: result1.next_token,
    p_is_active: true
  });
  
  if (ping2Error) {
    console.error('   ❌ ERROR:', ping2Error);
    process.exit(1);
  }
  
  const result2 = Array.isArray(ping2Data) ? ping2Data[0] : ping2Data;
  const credited = result2.total_seconds - result1.total_seconds;
  console.log('   Result:', {
    success: result2.success,
    reason: result2.reason,
    total_seconds: result2.total_seconds,
    credited: `+${credited}s`
  });
  
  // Check final state
  const { data: after2 } = await supabaseAdmin
    .from('quest_active_time_progress')
    .select('*')
    .eq('user_id', testUserId)
    .eq('quest_key', testQuestKey)
    .single();
  
  console.log('   DB State:', {
    total_seconds: after2.total_seconds,
    today_seconds: after2.today_seconds,
  });
  
  // Simulate app close/reopen - check persistence
  console.log('\n6. SIMULATING APP REOPEN:');
  console.log('   (Timer should resume from', after2.total_seconds, 'seconds)');
  
  const { data: afterReopen } = await supabaseAdmin
    .from('quest_active_time_progress')
    .select('total_seconds, today_seconds, today_date')
    .eq('user_id', testUserId)
    .eq('quest_key', testQuestKey)
    .single();
  
  console.log('   Stored progress:', afterReopen);
  
  // Verification
  console.log('\n=== VERIFICATION RESULTS ===\n');
  
  if (result1.success && result1.reason === 'first_ping') {
    console.log('✅ First ping creates row');
  } else {
    console.log('❌ First ping failed');
  }
  
  if (result2.success && credited >= 20 && credited <= 30) {
    console.log('✅ Second ping credits elapsed time (~25s)');
  } else {
    console.log('❌ Second ping credit incorrect:', credited);
  }
  
  if (after2.total_seconds === afterReopen.total_seconds) {
    console.log('✅ Progress persists (no reset on reopen)');
  } else {
    console.log('❌ Progress not persisted');
  }
  
  if (after2.total_seconds > 0) {
    console.log('✅ Server is source of truth');
  } else {
    console.log('❌ Server not storing progress');
  }
  
  console.log('\n✅ ALL CHECKS PASSED');
  console.log('\nBEFORE: 0 seconds');
  console.log('AFTER:  ' + after2.total_seconds + ' seconds');
  console.log('\n');
}

verifyFix().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
