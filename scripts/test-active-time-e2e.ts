/**
 * END-TO-END Active Time Quest Test Script
 * Run with: tsx scripts/test-active-time-e2e.ts
 * 
 * Tests against REAL Supabase database with real server function calls
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/integrations/supabase/types";

// Load env
import dotenv from "dotenv";
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const TEST_TIMESTAMP = Date.now();
const TEST_USER_EMAIL = `qa-active-time-${TEST_TIMESTAMP}@example.com`;
const TEST_USER_PASSWORD = `TestPass${TEST_TIMESTAMP}!`;
const TEST_QUEST_KEY = `QA_active_time_${TEST_TIMESTAMP}`;

let testUserId: string;
let accessToken: string;

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

async function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

async function sleep(ms: number) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

async function setup() {
  console.log("\n" + "=".repeat(60));
  console.log("SETUP: Creating Test Data");
  console.log("=".repeat(60) + "\n");
  
  // Create test user
  await log(`Creating test user: ${TEST_USER_EMAIL}`);
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
    email_confirm: true,
  });
  
  if (authError || !authData.user) {
    throw new Error(`Failed to create test user: ${authError?.message}`);
  }
  
  testUserId = authData.user.id;
  await log(`✅ Test user created: ${testUserId}`);
  
  // Get access token
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });
  
  if (signInError || !signInData.session) {
    throw new Error(`Failed to sign in: ${signInError?.message}`);
  }
  
  accessToken = signInData.session.access_token;
  await log(`✅ Access token obtained`);
  
  // Verify profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", testUserId)
    .single();
  
  await log(`✅ Profile created with wallet_balance: ${profile?.wallet_balance}`);
  console.log(JSON.stringify(profile, null, 2));
  
  // Create test quest
  await log(`\nCreating test quest: ${TEST_QUEST_KEY}`);
  const { data: quest, error: questError } = await supabase
    .from("quests")
    .insert({
      key: TEST_QUEST_KEY,
      quest_type: "active_time",
      label: "QA Active Time Test",
      reward_amount: 0.05,
      target_minutes: 2,
      daily_cap_minutes: 10,
      grace_minutes: 1,
      is_active: true,
    })
    .select()
    .single();
  
  if (questError) {
    throw new Error(`Failed to create test quest: ${questError.message}`);
  }
  
  await log(`✅ Test quest created`);
  console.log(JSON.stringify(quest, null, 2));
  
  console.log("\n" + "=".repeat(60));
  console.log("SETUP COMPLETE");
  console.log("=".repeat(60) + "\n");
}

async function cleanup() {
  console.log("\n" + "=".repeat(60));
  console.log("CLEANUP: Deleting Test Data");
  console.log("=".repeat(60) + "\n");
  
  // Delete in order
  await supabase.from("quest_active_time_progress").delete().eq("user_id", testUserId);
  await log("✅ Deleted quest_active_time_progress");
  
  await supabase.from("quest_active_time_grace_history").delete().eq("user_id", testUserId);
  await log("✅ Deleted quest_active_time_grace_history");
  
  await supabase.from("quest_step_credits").delete().eq("user_id", testUserId);
  await log("✅ Deleted quest_step_credits");
  
  await supabase.from("wallet_transactions").delete().eq("user_id", testUserId);
  await log("✅ Deleted wallet_transactions");
  
  await supabase.from("quests").delete().eq("key", TEST_QUEST_KEY);
  await log("✅ Deleted test quest");
  
  await supabase.auth.admin.deleteUser(testUserId);
  await log("✅ Deleted test user");
  
  console.log("\n" + "=".repeat(60));
  console.log("CLEANUP COMPLETE");
  console.log("=".repeat(60) + "\n");
}

async function testFirstPing() {
  await log("\n[TEST 1] First ping without token creates progress row");
  
  try {
    // Call server function (simulate what the client does)
    const dummyToken = "00000000-0000-0000-0000-000000000000";
    
    // Import and call the server function directly
    const { processActiveTimePingImpl } = await import("../src/lib/quests.server");
    const { supabaseAdmin } = await import("../src/integrations/supabase/client.server");
    
    const result = await processActiveTimePingImpl(
      testUserId,
      TEST_QUEST_KEY,
      dummyToken
    );
    
    await log(`Ping result: ${JSON.stringify(result, null, 2)}`);
    
    // Check DB
    const { data: progress } = await supabase
      .from("quest_active_time_progress")
      .select("*")
      .eq("user_id", testUserId)
      .eq("quest_key", TEST_QUEST_KEY)
      .single();
    
    await log(`Progress row: ${JSON.stringify(progress, null, 2)}`);
    
    if (!progress) {
      throw new Error("Progress row not created");
    }
    
    if (progress.total_seconds !== 0) {
      throw new Error(`Expected total_seconds=0, got ${progress.total_seconds}`);
    }
    
    if (!result.success || !result.nextToken) {
      throw new Error(`Ping failed: ${result.reason}`);
    }
    
    results.push({
      name: "First ping creates progress row",
      passed: true,
      details: { progress, result },
    });
    
    await log("✅ TEST 1 PASSED");
    return result.nextToken;
    
  } catch (error) {
    results.push({
      name: "First ping creates progress row",
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    await log(`❌ TEST 1 FAILED: ${error}`);
    throw error;
  }
}

async function testSecondPing(token: string) {
  await log("\n[TEST 2] Second ping after 30s credits time");
  
  try {
    await log("Waiting 30 seconds...");
    await sleep(30000);
    
    const { processActiveTimePingImpl } = await import("../src/lib/quests.server");
    
    const result = await processActiveTimePingImpl(
      testUserId,
      TEST_QUEST_KEY,
      token
    );
    
    await log(`Ping result: ${JSON.stringify(result, null, 2)}`);
    
    const { data: progress } = await supabase
      .from("quest_active_time_progress")
      .select("*")
      .eq("user_id", testUserId)
      .eq("quest_key", TEST_QUEST_KEY)
      .single();
    
    await log(`Progress row: ${JSON.stringify(progress, null, 2)}`);
    
    if (!progress || progress.total_seconds === 0) {
      throw new Error("No time credited");
    }
    
    if (progress.total_seconds > 35) {
      throw new Error(`Too much time credited: ${progress.total_seconds}s`);
    }
    
    results.push({
      name: "Second ping credits time",
      passed: true,
      details: { progress, result },
    });
    
    await log(`✅ TEST 2 PASSED: Credited ${progress.total_seconds}s`);
    return result.nextToken!;
    
  } catch (error) {
    results.push({
      name: "Second ping credits time",
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    await log(`❌ TEST 2 FAILED: ${error}`);
    throw error;
  }
}

async function testReplayToken(oldToken: string, currentToken: string) {
  await log("\n[TEST 3] Replaying old token is rejected");
  
  try {
    const { processActiveTimePingImpl } = await import("../src/lib/quests.server");
    
    const result = await processActiveTimePingImpl(
      testUserId,
      TEST_QUEST_KEY,
      oldToken // Use OLD token
    );
    
    await log(`Ping result: ${JSON.stringify(result, null, 2)}`);
    
    if (result.success) {
      throw new Error("Old token was accepted (should be rejected)");
    }
    
    if (result.reason !== "invalid_token") {
      throw new Error(`Expected reason='invalid_token', got '${result.reason}'`);
    }
    
    results.push({
      name: "Replaying old token is rejected",
      passed: true,
      details: { result },
    });
    
    await log("✅ TEST 3 PASSED");
    
  } catch (error) {
    results.push({
      name: "Replaying old token is rejected",
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    await log(`❌ TEST 3 FAILED: ${error}`);
    throw error;
  }
}

async function testTooFrequentPing(token: string) {
  await log("\n[TEST 4] Ping too soon (<20s) credits nothing");
  
  try {
    const { data: progressBefore } = await supabase
      .from("quest_active_time_progress")
      .select("total_seconds")
      .eq("user_id", testUserId)
      .eq("quest_key", TEST_QUEST_KEY)
      .single();
    
    const totalBefore = progressBefore?.total_seconds || 0;
    
    const { processActiveTimePingImpl } = await import("../src/lib/quests.server");
    
    const result = await processActiveTimePingImpl(
      testUserId,
      TEST_QUEST_KEY,
      token
    );
    
    await log(`Ping result: ${JSON.stringify(result, null, 2)}`);
    
    if (result.success) {
      throw new Error("Ping succeeded (should fail due to frequency)");
    }
    
    if (result.reason !== "ping_too_frequent") {
      throw new Error(`Expected reason='ping_too_frequent', got '${result.reason}'`);
    }
    
    if (result.totalSeconds !== totalBefore) {
      throw new Error(`Time changed: ${totalBefore} -> ${result.totalSeconds}`);
    }
    
    results.push({
      name: "Too-frequent ping rejected",
      passed: true,
      details: { result },
    });
    
    await log("✅ TEST 4 PASSED");
    
  } catch (error) {
    results.push({
      name: "Too-frequent ping rejected",
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    await log(`❌ TEST 4 FAILED: ${error}`);
    throw error;
  }
}

async function printReport() {
  console.log("\n" + "=".repeat(60));
  console.log("TEST RESULTS SUMMARY");
  console.log("=".repeat(60) + "\n");
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}\n`);
  
  console.log("| Test | Status | Details |");
  console.log("|------|--------|---------|");
  
  for (const result of results) {
    const status = result.passed ? "✅ PASS" : "❌ FAIL";
    const details = result.error || "OK";
    console.log(`| ${result.name} | ${status} | ${details} |`);
  }
  
  console.log("\n" + "=".repeat(60) + "\n");
  
  if (failed > 0) {
    process.exit(1);
  }
}

async function main() {
  try {
    await setup();
    
    console.log("\n" + "=".repeat(60));
    console.log("RUNNING TESTS");
    console.log("=".repeat(60));
    
    const token1 = await testFirstPing();
    const token2 = await testSecondPing(token1);
    await testReplayToken(token1, token2);
    await testTooFrequentPing(token2);
    
    await printReport();
    
  } catch (error) {
    console.error("\n❌ FATAL ERROR:", error);
    await printReport();
  } finally {
    await cleanup();
  }
}

main();
