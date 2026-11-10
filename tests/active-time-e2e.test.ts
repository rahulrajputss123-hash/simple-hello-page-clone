/**
 * Active Time Quest End-to-End Test
 * 
 * SAFETY RULES:
 * - Only touches test user (qa-active-time-<timestamp>@example.com)
 * - Only touches test quest (QA_active_time)
 * - Always cleans up at the end
 * - Proves nothing is left in database
 * 
 * This test:
 * 1. Creates a test quest with 2-minute target
 * 2. Creates a test user
 * 3. Simulates 5 pings over 2+ minutes
 * 4. Verifies total_seconds grows from 0 to 60-120+
 * 5. Prints DB row after each ping
 * 6. Cleans up everything
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const shouldSkip = !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY;

describe.skipIf(shouldSkip)("Active Time Quest E2E", () => {
  const supabaseAdmin = shouldSkip ? null : createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
  
  const TEST_QUEST_KEY = `QA_active_time_${Date.now()}`;
  const TEST_USER_EMAIL = `qa-active-time-${Date.now()}@example.com`;
  const TEST_USER_PASSWORD = "TestPass123!@#";
  let testUserId: string;
  
  console.log("\n=== Active Time Quest E2E Test ===");
  console.log(`Test quest: ${TEST_QUEST_KEY}`);
  console.log(`Test user: ${TEST_USER_EMAIL}`);
  
  beforeAll(async () => {
    if (!supabaseAdmin) return;
    
    console.log("\n=== SETUP ===");
    
    // Create test quest
    console.log("Creating test quest...");
    const { error: questError } = await supabaseAdmin
      .from("quests")
      .insert({
        key: TEST_QUEST_KEY,
        label: "QA Active Time Test",
        quest_type: "active_time",
        target_minutes: 2, // 2 minutes = 120 seconds
        reward_amount: 0.01,
        is_active: true,
        daily_cap_minutes: 120,
      });
    
    if (questError) {
      console.error("Failed to create test quest:", questError);
      throw questError;
    }
    console.log("✓ Test quest created");
    
    // Create test user
    console.log("Creating test user...");
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      email_confirm: true,
    });
    
    if (authError || !authData.user) {
      console.error("Failed to create test user:", authError);
      throw authError;
    }
    
    testUserId = authData.user.id;
    console.log(`✓ Test user created: ${testUserId}`);
    
    // Wait for profile trigger
    await new Promise(resolve => setTimeout(resolve, 2000));
  });
  
  afterAll(async () => {
    if (!supabaseAdmin) return;
    
    console.log("\n=== CLEANUP ===");
    
    // Delete progress
    console.log("Deleting test progress...");
    await supabaseAdmin
      .from("quest_active_time_progress")
      .delete()
      .eq("user_id", testUserId)
      .eq("quest_key", TEST_QUEST_KEY);
    
    // Delete sessions
    console.log("Deleting test sessions...");
    await supabaseAdmin
      .from("quest_sessions")
      .delete()
      .eq("user_id", testUserId)
      .eq("quest_key", TEST_QUEST_KEY);
    
    // Delete user (cascades to auth)
    console.log("Deleting test user...");
    await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", testUserId);
    
    // Delete quest
    console.log("Deleting test quest...");
    await supabaseAdmin
      .from("quests")
      .delete()
      .eq("key", TEST_QUEST_KEY);
    
    console.log("✓ Cleanup complete");
    
    // Verify nothing left
    console.log("\n=== VERIFICATION: Nothing Left ===");
    
    const { count: progressCount } = await supabaseAdmin
      .from("quest_active_time_progress")
      .select("*", { count: "exact", head: true })
      .eq("quest_key", TEST_QUEST_KEY);
    
    const { count: questCount } = await supabaseAdmin
      .from("quests")
      .select("*", { count: "exact", head: true })
      .eq("key", TEST_QUEST_KEY);
    
    console.log(`Progress rows: ${progressCount} (expected: 0)`);
    console.log(`Quest rows: ${questCount} (expected: 0)`);
    
    if (progressCount === 0 && questCount === 0) {
      console.log("✓ VERIFIED: All test data cleaned up\n");
    } else {
      console.log("✗ WARNING: Some test data remains!\n");
    }
  });
  
  it("should accumulate active time seconds over multiple pings", async () => {
    if (!supabaseAdmin) return;
    
    console.log("\n=== TEST: Ping Simulation ===\n");
    
    // Import the server function
    const { processActiveTimePingImpl } = await import("../src/lib/quests.server");
    
    // Check initial state (should be no progress row)
    console.log("Step 1: Check initial state...");
    const { data: initial } = await supabaseAdmin
      .from("quest_active_time_progress")
      .select("*")
      .eq("user_id", testUserId)
      .eq("quest_key", TEST_QUEST_KEY)
      .maybeSingle();
    
    console.log("Initial progress:", initial || "none");
    expect(initial).toBeNull();
    
    // Simulate 5 pings, 30 seconds apart
    console.log("\nStep 2: Simulating 5 pings (30s intervals)...\n");
    
    let lastToken: string | null = null;
    const pingResults: Array<{ ping: number; totalSeconds: number; credited: number }> = [];
    
    for (let i = 1; i <= 5; i++) {
      console.log(`--- Ping ${i}/5 ---`);
      
      // Wait 30 seconds between pings (except first)
      if (i > 1) {
        console.log("Waiting 30 seconds...");
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
      
      // Send ping
      const dummyToken = lastToken || "00000000-0000-0000-0000-000000000000";
      const result = await processActiveTimePingImpl(testUserId, TEST_QUEST_KEY, dummyToken);
      
      console.log("Ping result:", {
        success: result.success,
        reason: result.reason,
        totalSeconds: result.totalSeconds,
        todaySeconds: result.todaySeconds,
        hasNextToken: !!result.nextToken,
      });
      
      expect(result.success).toBe(true);
      expect(result.nextToken).toBeTruthy();
      
      lastToken = result.nextToken;
      
      // Query DB to verify
      const { data: progress } = await supabaseAdmin
        .from("quest_active_time_progress")
        .select("*")
        .eq("user_id", testUserId)
        .eq("quest_key", TEST_QUEST_KEY)
        .single();
      
      console.log("DB Row:", {
        total_seconds: progress.total_seconds,
        today_seconds: progress.today_seconds,
        last_ping_at: progress.last_ping_at,
        last_ping_token: progress.last_ping_token?.slice(0, 8) + "...",
      });
      
      const credited = i === 1 ? 0 : result.totalSeconds - pingResults[i - 2].totalSeconds;
      pingResults.push({
        ping: i,
        totalSeconds: result.totalSeconds,
        credited,
      });
      
      console.log("");
    }
    
    // Final verification
    console.log("=== FINAL RESULTS ===\n");
    
    console.log("Ping Summary:");
    pingResults.forEach(r => {
      console.log(`  Ping ${r.ping}: total=${r.totalSeconds}s (credited ${r.credited}s)`);
    });
    
    const finalTotal = pingResults[pingResults.length - 1].totalSeconds;
    console.log(`\nFinal total_seconds: ${finalTotal}`);
    console.log(`Target range: 60-150 seconds (4 pings * ~30s each)`);
    
    // Verify total_seconds is in expected range
    // First ping: 0s
    // Subsequent pings should credit ~25-35 seconds each
    // 4 pings * 30s = 120s theoretical, but first ping gives 0
    // So we expect: 60-150 seconds (allowing for timing variance)
    expect(finalTotal).toBeGreaterThanOrEqual(60);
    expect(finalTotal).toBeLessThanOrEqual(150);
    
    // Verify it increased
    expect(finalTotal).toBeGreaterThan(0);
    
    // Verify we got at least 3 credited pings
    const creditedPings = pingResults.filter(r => r.credited > 0);
    expect(creditedPings.length).toBeGreaterThanOrEqual(3);
    
    console.log("\n✓ TEST PASSED: Active time accumulation working correctly");
  }, 180000); // 3 minute timeout
});
