/**
 * Monitor Active Time pings and DB updates
 * 
 * Run with: npx tsx scripts/monitor-active-time.ts
 * 
 * Polls DB every 30s for 3 minutes to verify time progression
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_USER_ID = process.env.TEST_USER_ID || '00000000-0000-0000-0000-000000000001';
const QUEST_KEY = 'active_time';

async function checkDb(): Promise<number> {
  const { data, error } = await supabase
    .from('quest_active_time_progress')
    .select('total_seconds, today_seconds, last_ping_at, updated_at')
    .eq('user_id', TEST_USER_ID)
    .eq('quest_key', QUEST_KEY)
    .maybeSingle();

  if (error) {
    console.error('  ❌ DB error:', error.message);
    return -1;
  }

  if (!data) {
    console.log('  ℹ️  No row yet');
    return 0;
  }

  const lastPing = data.last_ping_at ? new Date(data.last_ping_at).toISOString().split('T')[1].slice(0, 8) : 'never';
  console.log(`  ✅ total=${data.total_seconds}s today=${data.today_seconds}s lastPing=${lastPing}`);
  
  return data.total_seconds;
}

async function main() {
  console.log('='.repeat(70));
  console.log('Active Time Monitoring - 3 Minutes');
  console.log(`User: ${TEST_USER_ID.slice(0, 8)}...`);
  console.log(`Quest: ${QUEST_KEY}`);
  console.log('='.repeat(70));
  console.log('\nInstructions:');
  console.log('1. Open app in browser with test account');
  console.log('2. Navigate to page with active time quest');
  console.log('3. Keep this script running');
  console.log('4. Watch total_seconds increase by ~30s every 30s');
  console.log('5. After 3min, reload page - timer should continue from server value\n');
  console.log('='.repeat(70));

  const readings: Array<{ time: string; total: number }> = [];
  
  for (let i = 0; i < 7; i++) { // 0, 30, 60, 90, 120, 150, 180 seconds
    const now = new Date();
    console.log(`\n[${now.toISOString().split('T')[1].slice(0, 8)}] Check ${i + 1}/7 (${i * 30}s):`);
    
    const total = await checkDb();
    readings.push({ time: now.toISOString(), total });
    
    if (i < 6) {
      console.log('  ⏳ Waiting 30s...');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('RESULTS:');
  console.log('='.repeat(70));
  
  console.log('\nTimeline:');
  readings.forEach((r, i) => {
    const timeMark = `${i * 30}s`.padEnd(5);
    console.log(`  ${timeMark}: ${r.total}s`);
  });

  console.log('\nProgression:');
  for (let i = 1; i < readings.length; i++) {
    const prev = readings[i - 1];
    const curr = readings[i];
    const diff = curr.total - prev.total;
    const expected = 30;
    const status = diff >= 25 && diff <= 35 ? '✅' : '⚠️ ';
    console.log(`  ${status} ${(i - 1) * 30}s → ${i * 30}s: +${diff}s (expected ~${expected}s)`);
  }

  const firstTotal = readings[0].total;
  const lastTotal = readings[readings.length - 1].total;
  const totalIncrease = lastTotal - firstTotal;
  const expectedIncrease = (readings.length - 1) * 30;

  console.log('\nSummary:');
  console.log(`  Start:    ${firstTotal}s`);
  console.log(`  End:      ${lastTotal}s`);
  console.log(`  Increase: ${totalIncrease}s`);
  console.log(`  Expected: ~${expectedIncrease}s`);

  if (totalIncrease >= expectedIncrease - 30 && totalIncrease <= expectedIncrease + 30) {
    console.log('\n✅ PASS: Time is being credited correctly!');
  } else if (totalIncrease === 0) {
    console.log('\n❌ FAIL: No time credited - check pings are being sent');
  } else {
    console.log('\n⚠️  WARNING: Unexpected time progression');
  }

  console.log('\n' + '='.repeat(70));
  console.log('Test complete!');
  console.log('Now reload the page and verify timer continues from', lastTotal, 'seconds');
  console.log('='.repeat(70));
}

main().catch((err) => {
  console.error('\n❌ FATAL ERROR:', err);
  process.exit(1);
});
