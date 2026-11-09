#!/usr/bin/env node

/**
 * Test script to simulate clicking an offer and see the actual error
 */

import { createFileRoute } from "@tanstack/react-router";

console.log("=== Testing Offer Route Definition ===\n");

// Simulate what the route file exports
const RouteConfig = {
  component: function OfferDetailsPage() {
    console.log("Component would render here");
  },
};

console.log("Route config:", RouteConfig);
console.log("\nChecking for 'head' function:", RouteConfig.head);
console.log("Checking for 'component' function:", typeof RouteConfig.component);

// Now simulate what TanStack Router does internally
try {
  const route = createFileRoute("/_authenticated/offer/$offerId")(RouteConfig);
  console.log("\n✅ Route created successfully!");
  console.log("Route object:", route);
} catch (error) {
  console.error("\n❌ Route creation failed!");
  console.error("Error:", error.message);
  console.error("Stack:", error.stack);
}

// Try to access component property like the error message suggests
try {
  const comp = RouteConfig.component;
  console.log("\n✅ Component access successful:", typeof comp);
} catch (error) {
  console.error("\n❌ Component access failed!");
  console.error("Error:", error.message);
}

console.log("\n=== Test Complete ===");
