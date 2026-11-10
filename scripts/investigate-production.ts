#!/usr/bin/env tsx
/**
 * Task B: Audit failed quest-token postbacks since 2026-11-09 20:00 UTC
 * Task C: Find and list all test rows created during investigation
 */

import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function taskB_AuditFailedPostbacks() {
  console.log('\n=== TASK B: Quest-Token Postbacks Since 2026-11-09 20:00 UTC ===\n');
  
  // Quest tokens are tracked through automation_logs table
  // Look for automation logs with quest_automation or sdk_postback events that mention errors
  const cutoffDate = '2026-11-09 20:00:00+00';
  
  console.log('Querying automation_logs for quest postback errors...\n');
  
  const { data: automationLogs, error: automationError } = await supabase
    .from('automation_logs')
    .select('*')
    .in('event_type', ['quest_automation', 'sdk_postback'])
    .eq('status', 'error')
    .gte('created_at', cutoffDate)
    .order('created_at', { ascending: false })
    .limit(100);
  
  if (automationError) {
    console.error('ERROR querying automation_logs:', automationError);
  } else {
    console.log(`Found ${automationLogs?.length || 0} error events in automation_logs`);
    
    if (automationLogs && automationLogs.length > 0) {
      // Filter for quest-related and postback-related errors
      const questErrors = automationLogs.filter(evt => 
        evt.message?.toLowerCase().includes('quest') ||
        evt.context?.questKey ||
        evt.context?.sessionId
      );
      
      console.log(`\nQuest-related errors: ${questErrors.length}\n`);
      
      if (questErrors.length > 0) {
        questErrors.forEach(evt => {
          console.log(`--- Event ${evt.id} ---`);
          console.log(`Created: ${evt.created_at}`);
          console.log(`Type: ${evt.event_type}`);
          console.log(`Status: ${evt.status}`);
          console.log(`Source: ${evt.source || 'null'}`);
          console.log(`User ID: ${evt.user_id || 'null'}`);
          console.log(`Message: ${evt.message}`);
          console.log(`Context: ${JSON.stringify(evt.context, null, 2)}`);
          console.log('');
        });
      }
      
      // Check for normalize errors specifically
      const normalizeErrors = automationLogs.filter(evt =>
        evt.message?.includes('normalize') ||
        JSON.stringify(evt.context).includes('normalize')
      );
      
      if (normalizeErrors.length > 0) {
        console.log(`\n⚠️  Found ${normalizeErrors.length} events with "normalize" errors:`);
        normalizeErrors.forEach(evt => {
          console.log(`\nEvent: ${evt.id}`);
          console.log(`Created: ${evt.created_at}`);
          console.log(`Message: ${evt.message}`);
          console.log(`Context: ${JSON.stringify(evt.context, null, 2)}`);
        });
      } else {
        console.log('\n✅ No "normalize" errors found in automation_logs since 2026-11-09 20:00 UTC');
      }
    }
  }
  
  // Also check sdk_offerwall_conversions for quest_absorbed status (quest tokens)
  console.log('\n--- Checking sdk_offerwall_conversions for quest_absorbed entries ---\n');
  
  const { data: conversions, error: conversionError } = await supabase
    .from('sdk_offerwall_conversions')
    .select('id, provider_id, user_id, status, reject_reason, created_at, received_at')
    .eq('status', 'quest_absorbed')
    .gte('received_at', cutoffDate)
    .order('received_at', { ascending: false })
    .limit(50);
  
  if (conversionError) {
    console.error('ERROR:', conversionError);
  } else {
    console.log(`Found ${conversions?.length || 0} quest_absorbed conversions since ${cutoffDate}`);
    
    if (conversions && conversions.length > 0) {
      const rejected = conversions.filter(c => c.reject_reason != null);
      console.log(`  - ${rejected.length} with reject_reason (failed validation)`);
      console.log(`  - ${conversions.length - rejected.length} successful`);
      
      if (rejected.length > 0) {
        console.log('\nRejected conversions:');
        rejected.forEach(c => {
          console.log(`  ID: ${c.id}, Reason: ${c.reject_reason}, Created: ${c.created_at}`);
        });
      }
    }
  }
}

async function taskC_FindTestRows() {
  console.log('\n\n=== TASK C: Find Test Rows Created During Investigation ===\n');
  
  // 1. Check quest_active_time_progress for test rows (recent ones)
  console.log('--- Checking quest_active_time_progress (last 48 hours) ---');
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  
  const { data: progressRows, error: progressError } = await supabase
    .from('quest_active_time_progress')
    .select('*')
    .or('quest_key.ilike.%TEST%,quest_key.ilike.%test%')
    .gte('created_at', twoDaysAgo)
    .order('created_at', { ascending: false });
  
  if (progressError) {
    console.error('ERROR:', progressError);
  } else {
    console.log(`Found ${progressRows?.length || 0} test rows in quest_active_time_progress (last 48h)`);
    if (progressRows && progressRows.length > 0) {
      progressRows.forEach(row => {
        console.log(`  - ID: ${row.id}, Quest: ${row.quest_key}, User: ${row.user_id}, Created: ${row.created_at}`);
      });
    }
  }
  
  // 2. Check quests table for TEST_ prefix
  console.log('\n--- Checking quests ---');
  const { data: questRows, error: questError } = await supabase
    .from('quests')
    .select('id, key, label, created_at')
    .or('key.ilike.TEST_%,key.ilike.%test%,label.ilike.%TEST%')
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (questError) {
    console.error('ERROR:', questError);
  } else {
    console.log(`Found ${questRows?.length || 0} test rows in quests`);
    if (questRows && questRows.length > 0) {
      questRows.forEach(row => {
        console.log(`  - ID: ${row.id}, Key: ${row.key}, Label: ${row.label}, Created: ${row.created_at}`);
      });
    }
  }
  
  // 3. Check sdk_offerwall_conversions for very recent test entries
  console.log('\n--- Checking sdk_offerwall_conversions (last 48 hours) ---');
  const { data: conversionRows, error: conversionError } = await supabase
    .from('sdk_offerwall_conversions')
    .select('id, provider_id, user_id, provider_transaction_id, status, created_at')
    .or('provider_transaction_id.ilike.TEST_%,provider_transaction_id.ilike.%test%,provider_user_ref.ilike.TEST_%,provider_user_ref.ilike.%test%')
    .gte('received_at', twoDaysAgo)
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (conversionError) {
    console.error('ERROR:', conversionError);
  } else {
    console.log(`Found ${conversionRows?.length || 0} test rows in sdk_offerwall_conversions (last 48h)`);
    if (conversionRows && conversionRows.length > 0) {
      conversionRows.forEach(row => {
        console.log(`  - ID: ${row.id}, TxID: ${row.provider_transaction_id}, User: ${row.user_id}, Created: ${row.created_at}`);
      });
    }
  }
  
  // 4. Check quest_sessions for test entries
  console.log('\n--- Checking quest_sessions (last 48 hours) ---');
  const { data: sessionRows, error: sessionError } = await supabase
    .from('quest_sessions')
    .select('id, quest_key, user_id, status, started_at')
    .or('quest_key.ilike.TEST_%,quest_key.ilike.%test%')
    .gte('started_at', twoDaysAgo)
    .order('started_at', { ascending: false })
    .limit(50);
  
  if (sessionError) {
    console.error('ERROR:', sessionError);
  } else {
    console.log(`Found ${sessionRows?.length || 0} test rows in quest_sessions (last 48h)`);
    if (sessionRows && sessionRows.length > 0) {
      sessionRows.forEach(row => {
        console.log(`  - ID: ${row.id}, Quest: ${row.quest_key}, User: ${row.user_id}, Status: ${row.status}, Started: ${row.started_at}`);
      });
    }
  }
  
  // 5. Check automation_logs for test-related entries
  console.log('\n--- Checking automation_logs (last 48 hours) ---');
  const { data: eventRows, error: eventError } = await supabase
    .from('automation_logs')
    .select('id, event_type, status, message, created_at')
    .or('message.ilike.%test%,message.ilike.%TEST%')
    .gte('created_at', twoDaysAgo)
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (eventError) {
    console.error('ERROR:', eventError);
  } else {
    console.log(`Found ${eventRows?.length || 0} test-related rows in automation_logs (last 48h)`);
    if (eventRows && eventRows.length > 0) {
      eventRows.forEach(row => {
        console.log(`  - ID: ${row.id}, Type: ${row.event_type}, Message: ${row.message?.substring(0, 80)}, Created: ${row.created_at}`);
      });
    }
  }
}

async function main() {
  console.log('Connected to:', SUPABASE_URL);
  
  await taskB_AuditFailedPostbacks();
  await taskC_FindTestRows();
  
  console.log('\n=== Investigation Complete ===\n');
  console.log('⚠️  No deletions performed. Review output above before proceeding with cleanup.');
}

main().catch(console.error);
