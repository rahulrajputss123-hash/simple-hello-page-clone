/**
 * Pricing module tests - verifies acceptance criteria
 * Run with: node --loader ts-node/esm pricing.test.ts (if ts-node available)
 * Or compile first: tsc pricing.test.ts && node pricing.test.js
 */

import { costPerSlot, campaignTotals, hasSufficientFunds } from "./pricing";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual: number, expected: number, message: string) {
  const diff = Math.abs(actual - expected);
  if (diff > 0.005) { // Allow 0.5 cent rounding difference
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

// ACCEPTANCE TABLE TESTS (reward 0.50, 15 slots, feePercent 0)

console.log("Running pricing tests...\n");

// Test 1: fees OFF
console.log("Test 1: fees OFF");
const test1 = campaignTotals({
  slots: 15,
  reward: 0.50,
  feePercent: 0,
  feesEnabled: false,
  feeUsd: 0.50,
  feeType: "per_campaign",
});
assertEqual(test1.allocation, 7.50, "allocation");
assertEqual(test1.campaignFee, 0, "campaignFee");
assertEqual(test1.total, 7.50, "total");
console.log("✓ PASS: allocation=7.50, campaignFee=0, total=7.50\n");

// Test 2: fees ON per_campaign 0.50
console.log("Test 2: fees ON per_campaign 0.50");
const test2 = campaignTotals({
  slots: 15,
  reward: 0.50,
  feePercent: 0,
  feesEnabled: true,
  feeUsd: 0.50,
  feeType: "per_campaign",
});
assertEqual(test2.allocation, 7.50, "allocation");
assertEqual(test2.campaignFee, 0.50, "campaignFee");
assertEqual(test2.total, 8.00, "total");
console.log("✓ PASS: total=8.00\n");

// Test 3: fees ON per_slot 0.50
console.log("Test 3: fees ON per_slot 0.50");
const test3 = campaignTotals({
  slots: 15,
  reward: 0.50,
  feePercent: 0,
  feesEnabled: true,
  feeUsd: 0.50,
  feeType: "per_slot",
});
assertEqual(test3.allocation, 7.50, "allocation");
assertEqual(test3.campaignFee, 7.50, "campaignFee (15 * 0.50)");
assertEqual(test3.total, 15.00, "total");
console.log("✓ PASS: campaignFee=7.50, total=15.00\n");

// Test 4: fees ON per_campaign 0.50 + featured 7 days at 2.00
console.log("Test 4: fees ON per_campaign 0.50 + featured 7 days at 2.00");
const test4 = campaignTotals({
  slots: 15,
  reward: 0.50,
  feePercent: 0,
  feesEnabled: true,
  feeUsd: 0.50,
  feeType: "per_campaign",
  featuredFee: 14.00, // 7 days * 2.00/day
});
assertEqual(test4.allocation, 7.50, "allocation");
assertEqual(test4.campaignFee, 0.50, "campaignFee");
assertEqual(test4.featuredFee, 14.00, "featuredFee");
assertEqual(test4.total, 22.00, "total");
console.log("✓ PASS: total=22.00\n");

// Test 5: legacy check costPerSlot(0.50, 20) = 0.63
console.log("Test 5: legacy check costPerSlot(0.50, 20)");
const legacyCost = costPerSlot(0.50, 20);
assertEqual(legacyCost, 0.63, "costPerSlot with 20% fee");
const legacyTotal = legacyCost * 15;
assertEqual(legacyTotal, 9.45, "15 slots total");
console.log("✓ PASS: costPerSlot(0.50, 20) = 0.63, so 15 slots = 9.45\n");

// Test hasSufficientFunds
console.log("Test 6: hasSufficientFunds checks");
const totals = campaignTotals({
  slots: 15,
  reward: 0.50,
  feePercent: 0,
  feesEnabled: true,
  feeUsd: 0.50,
  feeType: "per_campaign",
  featuredFee: 14.00,
});

// Sufficient funds
assert(
  hasSufficientFunds(15.00, 10.00, totals),
  "Should have sufficient funds (15 deposit + 10 bonus >= 22 total, 15 deposit >= 14.50 fees)"
);

// Insufficient deposit for fees (even though spendable is enough)
assert(
  !hasSufficientFunds(10.00, 15.00, totals),
  "Should NOT have sufficient funds (deposit 10 < fees 14.50)"
);

// Insufficient total
assert(
  !hasSufficientFunds(15.00, 5.00, totals),
  "Should NOT have sufficient funds (spendable 20 < total 22)"
);

console.log("✓ PASS: hasSufficientFunds checks\n");

console.log("All tests passed! ✓");
