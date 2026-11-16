/**
 * Test script to verify country filtering for each provider.
 * Tests with BD (Bangladesh) and US (United States) to see if offers change.
 * 
 * Run: npx tsx scripts/test-country-filtering.ts
 */

import { config } from "dotenv";
config(); // Load .env file

import { supabaseAdmin } from "../src/integrations/supabase/client.server";
import { getAdapter } from "../src/lib/offers/registry.server";
import type { OfferProvider } from "../src/lib/offers/provider-types";

async function testProvider(provider: OfferProvider) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing: ${provider.name} (${provider.slug})`);
  console.log("=".repeat(60));

  const adapter = getAdapter(provider.slug);
  if (!adapter) {
    console.log(`❌ No adapter found for ${provider.slug}`);
    return;
  }

  try {
    // Fetch offers for Bangladesh (BD)
    console.log("\n📍 Fetching offers for BD (Bangladesh)...");
    const bdOffers = await adapter.fetchOffers(provider, { country: "BD" });
    console.log(`   Found ${bdOffers.length} offers`);

    // Fetch offers for United States (US)
    console.log("\n📍 Fetching offers for US (United States)...");
    const usOffers = await adapter.fetchOffers(provider, { country: "US" });
    console.log(`   Found ${usOffers.length} offers`);

    // Compare offer IDs
    const bdIds = new Set(bdOffers.map((o) => o.externalOfferId));
    const usIds = new Set(usOffers.map((o) => o.externalOfferId));

    const onlyInBd = [...bdIds].filter((id) => !usIds.has(id));
    const onlyInUs = [...usIds].filter((id) => !bdIds.has(id));
    const inBoth = [...bdIds].filter((id) => usIds.has(id));

    console.log(`\n📊 Comparison:`);
    console.log(`   - Offers only in BD: ${onlyInBd.length}`);
    console.log(`   - Offers only in US: ${onlyInUs.length}`);
    console.log(`   - Offers in both: ${inBoth.length}`);

    // Determine if country-filtered
    const isFiltered = onlyInBd.length > 0 || onlyInUs.length > 0;
    if (isFiltered) {
      console.log(`\n✅ Provider IS country-filtered (different offers per country)`);
    } else {
      console.log(`\n⚠️  Provider is NOT country-filtered (same offers for both countries)`);
    }

    // Sample country data from first 5 offers in each country
    console.log(`\n📝 Sample country data from BD offers (first 5):`);
    for (let i = 0; i < Math.min(5, bdOffers.length); i++) {
      const offer = bdOffers[i];
      console.log(
        `   ${i + 1}. ${offer.externalOfferId}: countries=${JSON.stringify(offer.countries ?? [])}`,
      );
    }

    console.log(`\n📝 Sample country data from US offers (first 5):`);
    for (let i = 0; i < Math.min(5, usOffers.length); i++) {
      const offer = usOffers[i];
      console.log(
        `   ${i + 1}. ${offer.externalOfferId}: countries=${JSON.stringify(offer.countries ?? [])}`,
      );
    }

    // Summary recommendation
    console.log(`\n💡 Recommendation:`);
    if (isFiltered) {
      console.log(
        `   ✓ Safe to store country availability data from ${provider.slug}`,
      );
    } else {
      console.log(
        `   ⚠️ WARNING: ${provider.slug} returns same offers for all countries`,
      );
      console.log(
        `   Consider using requested-country fallback or marking as global`,
      );
    }
  } catch (error) {
    console.error(`\n❌ Error testing ${provider.slug}:`);
    console.error(error instanceof Error ? error.message : String(error));
  }
}

async function main() {
  console.log("🔍 Testing Country Filtering for All Providers\n");
  console.log("This script tests each provider with BD and US to verify:");
  console.log("1. Does the offer list change between countries?");
  console.log("2. What country data does each offer contain?");
  console.log("3. Should we store country availability for this provider?\n");

  // Fetch all enabled providers
  const { data: providers, error } = await supabaseAdmin
    .from("offer_providers")
    .select("*")
    .eq("enabled", true)
    .order("name");

  if (error) {
    console.error("❌ Failed to fetch providers:", error);
    process.exit(1);
  }

  if (!providers || providers.length === 0) {
    console.log("⚠️ No enabled providers found");
    process.exit(0);
  }

  console.log(`Found ${providers.length} enabled providers\n`);

  // Test each provider sequentially (to respect rate limits)
  for (const provider of providers as unknown as OfferProvider[]) {
    await testProvider(provider);

    // Add delay between providers to respect rate limits
    console.log("\n⏳ Waiting 5 seconds before next provider...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("✅ Testing complete!");
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
