// Test formatUsd function
function formatUsd(amount) {
  if (amount === 0) return "$0";
  
  // For positive values below 0.01, show up to 4 decimals (no rounding to 0)
  if (amount > 0 && amount < 0.01) {
    // Format with 4 decimals and trim trailing zeros
    const formatted = amount.toFixed(4).replace(/\.?0+$/, "");
    return `$${formatted}`;
  }
  
  // For values >= 0.01, show 2 decimals minimum
  const formatted = amount.toFixed(4).replace(/\.?0+$/, "");
  // Ensure at least 2 decimal places for values >= 0.01
  if (amount >= 0.01) {
    const parts = formatted.split(".");
    if (!parts[1] || parts[1].length < 2) {
      return `$${amount.toFixed(2)}`;
    }
  }
  
  return `$${formatted}`;
}

console.log("Test cases:");
console.log("0.014 ->", formatUsd(0.014), "(expected: $0.014)");
console.log("0.002 ->", formatUsd(0.002), "(expected: $0.002)");
console.log("0.0025 ->", formatUsd(0.0025), "(expected: $0.0025)");
console.log("0.1 ->", formatUsd(0.1), "(expected: $0.10)");
console.log("0.10 ->", formatUsd(0.10), "(expected: $0.10)");
console.log("1.5 ->", formatUsd(1.5), "(expected: $1.50)");
console.log("0 ->", formatUsd(0), "(expected: $0)");
console.log("0.0001 ->", formatUsd(0.0001), "(expected: $0.0001)");
console.log("5.1234 ->", formatUsd(5.1234), "(expected: $5.1234)");

// Verify no value shows as $0 when it's actually positive
const testCases = [0.014, 0.002, 0.0025, 0.0001];
let allPass = true;
for (const val of testCases) {
  const result = formatUsd(val);
  if (result === "$0") {
    console.error(`FAIL: ${val} rendered as $0`);
    allPass = false;
  }
}

if (allPass) {
  console.log("\n✅ All tests passed!");
} else {
  console.log("\n❌ Some tests failed!");
  process.exit(1);
}
