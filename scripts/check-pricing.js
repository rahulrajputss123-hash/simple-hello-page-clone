/**
 * Pricing acceptance tests
 * Run with: node scripts/check-pricing.js
 */

// Inline pricing functions (matching src/lib/marketplace/pricing.ts)
function costPerSlot(reward, feePercent) {
  if (feePercent === 0) return reward;
  return Math.ceil((reward * 100) / (1 - feePercent / 100)) / 100;
}

function campaignTotals(params) {
  const { slots, reward, feePercent, feesEnabled, feeUsd, feeType, featuredFee = 0 } = params;

  const allocation = slots * costPerSlot(reward, feePercent);
  const campaignFee = feesEnabled ? (feeType === "per_campaign" ? feeUsd : feeUsd * slots) : 0;
  const total = allocation + campaignFee + featuredFee;

  return {
    allocation: Math.round(allocation * 100) / 100,
    campaignFee: Math.round(campaignFee * 100) / 100,
    featuredFee: Math.round(featuredFee * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

// Test runner
function assertEq(actual, expected, label) {
  if (Math.abs(actual - expected) > 0.001) {
    console.error(`❌ FAIL: ${label} - expected ${expected}, got ${actual}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${label} = ${actual}`);
}

console.log("# Acceptance Table Validation\n");

// Test 1: Fees OFF, 15 slots @ 0.50, fee=0.05
console.log("## Test 1: fees OFF, 15 slots @ 0.50, platform_fee=0");
const t1 = campaignTotals({
  slots: 15,
  reward: 0.5,
  feePercent: 0,
  feesEnabled: false,
  feeUsd: 0.5,
  feeType: "per_campaign",
  featuredFee: 0,
});
console.log(`   allocation=${t1.allocation.toFixed(2)}, campaignFee=${t1.campaignFee.toFixed(2)}, total=${t1.total.toFixed(2)}`);
assertEq(t1.allocation, 7.5, "allocation");
assertEq(t1.campaignFee, 0, "campaignFee");
assertEq(t1.total, 7.5, "total");
console.log();

// Test 2: Fees ON per_campaign 0.50, 15 slots @ 0.50
console.log("## Test 2: fees ON per_campaign 0.50, 15 slots @ 0.50");
const t2 = campaignTotals({
  slots: 15,
  reward: 0.5,
  feePercent: 0,
  feesEnabled: true,
  feeUsd: 0.5,
  feeType: "per_campaign",
  featuredFee: 0,
});
console.log(`   allocation=${t2.allocation.toFixed(2)}, campaignFee=${t2.campaignFee.toFixed(2)}, total=${t2.total.toFixed(2)}`);
assertEq(t2.allocation, 7.5, "allocation");
assertEq(t2.campaignFee, 0.5, "campaignFee");
assertEq(t2.total, 8.0, "total");
console.log();

// Test 3: Fees ON per_slot 0.50, 15 slots @ 0.50
console.log("## Test 3: fees ON per_slot 0.50, 15 slots @ 0.50");
const t3 = campaignTotals({
  slots: 15,
  reward: 0.5,
  feePercent: 0,
  feesEnabled: true,
  feeUsd: 0.5,
  feeType: "per_slot",
  featuredFee: 0,
});
console.log(`   allocation=${t3.allocation.toFixed(2)}, campaignFee=${t3.campaignFee.toFixed(2)}, total=${t3.total.toFixed(2)}`);
assertEq(t3.allocation, 7.5, "allocation");
assertEq(t3.campaignFee, 7.5, "campaignFee");
assertEq(t3.total, 15.0, "total");
console.log();

// Test 4: Fees ON per_campaign 0.50 + featured 7d@2, 15 slots @ 0.50
console.log("## Test 4: fees ON per_campaign 0.50 + featured 7d@2");
const t4 = campaignTotals({
  slots: 15,
  reward: 0.5,
  feePercent: 0,
  feesEnabled: true,
  feeUsd: 0.5,
  feeType: "per_campaign",
  featuredFee: 14.0,
});
console.log(`   allocation=${t4.allocation.toFixed(2)}, campaignFee=${t4.campaignFee.toFixed(2)}, featuredFee=${t4.featuredFee.toFixed(2)}, total=${t4.total.toFixed(2)}`);
assertEq(t4.allocation, 7.5, "allocation");
assertEq(t4.campaignFee, 0.5, "campaignFee");
assertEq(t4.featuredFee, 14.0, "featuredFee");
assertEq(t4.total, 22.0, "total");
console.log();

// Test 5: Legacy costPerSlot(0.50, 20) = 0.63
console.log("## Test 5: legacy costPerSlot(0.50, 20%) = 0.63");
const t5 = costPerSlot(0.5, 20);
console.log(`   costPerSlot(0.50, 20) = ${t5.toFixed(2)}`);
assertEq(t5, 0.63, "costPerSlot");
console.log();

console.log("# All tests passed! ✅\n");
