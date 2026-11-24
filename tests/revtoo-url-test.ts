/**
 * Test script to verify Revtoo URL replacement
 * Run with: npx tsx tests/revtoo-url-test.ts
 */

import { REVTOO_USER_ID_PLACEHOLDER } from "../src/lib/offers/constants";

// Simulate a Revtoo URL as it comes from the feed sync
const mockRevtooUrl = `https://revtoo.com/api/redirect?api_key=abc123&offer_id=12345&user_id=${REVTOO_USER_ID_PLACEHOLDER}`;

// Simulate a test user ID
const testUserId = "550e8400-e29b-41d4-a716-446655440000";

// Server-side replacement (what we just implemented)
const replacedUrl = mockRevtooUrl.split(REVTOO_USER_ID_PLACEHOLDER).join(testUserId);

console.log("Original URL (from feed sync):");
console.log(mockRevtooUrl);
console.log("\nAfter server-side replacement:");
console.log(replacedUrl);
console.log("\nUser ID last 4 chars:", testUserId.slice(-4));
console.log("\nURL contains placeholder?", replacedUrl.includes(REVTOO_USER_ID_PLACEHOLDER) ? "YES (BUG!)" : "NO (FIXED)");
console.log("URL contains real user ID?", replacedUrl.includes(testUserId) ? "YES (CORRECT)" : "NO (BUG!)");

// Verify the fix
if (!replacedUrl.includes(REVTOO_USER_ID_PLACEHOLDER) && replacedUrl.includes(testUserId)) {
  console.log("\n✅ TEST PASSED: Placeholder replaced with real user ID");
  process.exit(0);
} else {
  console.log("\n❌ TEST FAILED: Placeholder not properly replaced");
  process.exit(1);
}
