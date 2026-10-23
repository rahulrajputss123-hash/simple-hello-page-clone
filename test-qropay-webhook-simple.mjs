/**
 * Simple test to demonstrate QroPay order_id mapping.
 * Run with: node test-qropay-webhook-simple.mjs
 */

// Test UUID
const testDepositId = "a1b2c3d4-e5f6-7890-1234-56789abcdef0";

console.log("=== QroPay Order ID Mapping Test ===\n");
console.log("Deposit UUID:", testDepositId);

// Remove dashes
const dashlessId = testDepositId.replace(/-/g, "");
console.log("Dashless UUID:", dashlessId);
console.log("  Length:", dashlessId.length, "characters");

// Old format (16 chars from position 16-32 + 4 random)
const oldFormat16Chars = dashlessId.substring(16, 32);
console.log("\nOld format (16 chars from pos 16-32):", oldFormat16Chars);
console.log("  Would add 4 random chars, e.g.:", oldFormat16Chars + "go01");

// New format (last 20 chars from position 12-32)
const newFormat20Chars = dashlessId.substring(12, 32);
console.log("\nNew format (last 20 chars from pos 12-32):", newFormat20Chars);
console.log("  Deterministic: YES (no random suffix)");
console.log("  Reversible: YES (can find deposit by suffix match)");

console.log("\n=== Webhook Lookup Logic ===");
console.log("\nReceived order_id from QroPay:", newFormat20Chars);
console.log("\nMatching logic:");
console.log("  1. Get all pending qropay deposits");
console.log("  2. For each deposit, extract dashless UUID");
console.log("  3. Check if dashless UUID substring(12,32) === received order_id");
console.log("  4. For backward compatibility, also check substring(16,32) === first 16 chars of received order_id");
console.log("\nExample match:");
console.log("  Deposit dashless:", dashlessId);
console.log("  Substring(12,32):", dashlessId.substring(12, 32));
console.log("  Received order_id:", newFormat20Chars);
console.log("  Match:", dashlessId.substring(12, 32) === newFormat20Chars ? "✅ YES" : "❌ NO");

console.log("\n=== Structured Logging Example ===");
console.log("\nSuccess case:");
console.log("  [qropay-webhook] Credit attempt | order_id=" + newFormat20Chars + " status=success amount=100 matched=true deposit_id=" + testDepositId + " decision=credited");

console.log("\nRejection case (amount mismatch):");
console.log("  [qropay-webhook] Amount mismatch | order_id=" + newFormat20Chars + " status=success amount=95 matched=true deposit_id=" + testDepositId + " decision=rejected_amount_mismatch expected=100 received=95");

console.log("\nUnknown order case:");
console.log("  [qropay-webhook] No deposit matched | order_id=unknownorder123456 status=success amount=100 matched=false decision=ignored_unknown_order");

console.log("\n=== Test Complete ===");
