/**
 * Manual task sync test script
 * 
 * Run this to manually trigger syncUserTasks for debugging.
 * 
 * Usage:
 *   1. Replace USER_ID with actual user ID from task_events
 *   2. Deploy or run locally
 *   3. Check console logs for detailed debugging output
 */

import { syncUserTasks } from "../src/lib/tasks/engine.server";

const TEST_USER_ID = "REPLACE_WITH_ACTUAL_USER_ID";

async function testTaskSync() {
  console.log("=== Testing Task Sync ===");
  console.log("User ID:", TEST_USER_ID);
  console.log();

  // Test 1: Sync offerwall_earning tasks
  console.log("--- Test 1: Sync offerwall_earning tasks ---");
  const result1 = await syncUserTasks(TEST_USER_ID, "offerwall_earning");
  console.log("Result:", result1);
  console.log();

  // Test 2: Sync shortlink tasks
  console.log("--- Test 2: Sync shortlink tasks ---");
  const result2 = await syncUserTasks(TEST_USER_ID, "shortlink");
  console.log("Result:", result2);
  console.log();

  // Test 3: Sync ALL tasks (no event filter)
  console.log("--- Test 3: Sync ALL tasks ---");
  const result3 = await syncUserTasks(TEST_USER_ID);
  console.log("Result:", result3);
  console.log();

  console.log("=== Test Complete ===");
}

// Run the test
testTaskSync().catch(console.error);
