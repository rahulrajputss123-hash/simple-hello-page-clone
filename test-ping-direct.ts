/**
 * Direct ping test - no browser, just calls the server function
 * Run with: npx tsx test-ping-direct.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TEST_QUEST_KEY = "quest_activity"; // Use the real quest
const TEST_USER_EMAIL = `test-ping-${Date.now()}@example.com`;

async function main() {
  console.log("\n=== DIRECT PING TEST ===\n");
  console.log(`Quest: ${TEST_QUEST_KEY}`);
  console.log(`Creating test user: ${TEST_USER_EMAIL}\n`);

  // Create test user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: TEST_USER_EMAIL,
    password: "TestPass123!",
    email_confirm: true,
  });

  if (authError || !authData.user) {
    console.error("Failed to create user:", authError);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`✓ User created: ${userId.slice(0, 8)}...\n`);

  // Wait for profile creation
  await new Promise(r => setTimeout(r, 2000));

  try {
    // Test: First ping should create row
    console.log("--- Ping 1 (should create row) ---");
    const { data: result1, error: error1 } = await supabase.rpc("ping_active_time", {
      p_user_id: userId,
      p_quest_key: TEST_QUEST_KEY,
      p_ping_token: "00000000-0000-0000-0000-000000000000",
      p_is_active: true,
    });

    if (error1) {
      console.error("ERROR:", error1);
    } else {
      console.log("Result:", JSON.stringify(result1, null, 2));
    }

    // Check DB
    const { data: row1 } = await supabase
      .from("quest_active_time_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("quest_key", TEST_QUEST_KEY)
      .single();

    console.log("DB Row:", {
      total_seconds: row1?.total_seconds,
      today_seconds: row1?.today_seconds,
      has_token: !!row1?.last_ping_token,
    });

    if (!result1 || result1.length === 0) {
      console.error("\n✗ FAIL: Ping returned no data");
      return;
    }

    const token1 = result1[0].next_token;
    console.log(`✓ First ping OK, got token: ${token1?.slice(0, 8)}...\n`);

    // Wait 30 seconds
    console.log("Waiting 30 seconds...");
    await new Promise(r => setTimeout(r, 30000));

    // Test: Second ping should credit ~30 seconds
    console.log("\n--- Ping 2 (should credit ~30s) ---");
    const { data: result2, error: error2 } = await supabase.rpc("ping_active_time", {
      p_user_id: userId,
      p_quest_key: TEST_QUEST_KEY,
      p_ping_token: token1,
      p_is_active: true,
    });

    if (error2) {
      console.error("ERROR:", error2);
    } else {
      console.log("Result:", JSON.stringify(result2, null, 2));
    }

    const { data: row2 } = await supabase
      .from("quest_active_time_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("quest_key", TEST_QUEST_KEY)
      .single();

    console.log("DB Row:", {
      total_seconds: row2?.total_seconds,
      today_seconds: row2?.today_seconds,
      has_token: !!row2?.last_ping_token,
    });

    if (result2 && result2.length > 0) {
      const credited = result2[0].total_seconds - result1[0].total_seconds;
      console.log(`\n✓ Second ping OK, credited ${credited} seconds`);

      if (credited >= 25 && credited <= 35) {
        console.log("✓ PASS: Seconds credited in expected range (25-35)\n");
      } else {
        console.log(`✗ FAIL: Expected 25-35 seconds, got ${credited}\n`);
      }
    }

  } finally {
    // Cleanup
    console.log("\n=== CLEANUP ===");
    
    await supabase
      .from("quest_active_time_progress")
      .delete()
      .eq("user_id", userId);
    
    await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    console.log("✓ Test user and data deleted\n");
  }
}

main().catch(console.error);
