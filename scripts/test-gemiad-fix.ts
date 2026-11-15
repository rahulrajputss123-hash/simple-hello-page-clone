import { config } from "dotenv";
config();
import { getAdapter } from "../src/lib/offers/registry.server";
import type { OfferProvider } from "../src/lib/offers/provider-types";

const adapter = getAdapter("gemiad");
if (!adapter) {
  console.log("❌ GemiAd adapter not found");
  process.exit(1);
}

const provider = {
  id: "test",
  slug: "gemiad",
  name: "GemiAd",
  sync_config: {
    placement_id: process.env["GEMIAD_PLACEMENT_ID"],
    api_key: process.env["GEMIAD_API_KEY"],
  },
  default_revenue_share: 0.8,
} as unknown as OfferProvider;

console.log("Testing GemiAd with country filtering fix...\n");

(async () => {
  try {
    console.log("📍 Fetching BD offers...");
    const bdOffers = await adapter.fetchOffers(provider, { country: "BD" });
    console.log(`   Found ${bdOffers.length} offers`);

    console.log("\n📍 Fetching US offers...");
    const usOffers = await adapter.fetchOffers(provider, { country: "US" });
    console.log(`   Found ${usOffers.length} offers`);

    const bdIds = new Set(bdOffers.map((o) => o.externalOfferId));
    const usIds = new Set(usOffers.map((o) => o.externalOfferId));

    console.log(`\n📊 After fix:`);
    console.log(`   - Only in BD: ${[...bdIds].filter((id) => !usIds.has(id)).length}`);
    console.log(`   - Only in US: ${[...usIds].filter((id) => !bdIds.has(id)).length}`);
    console.log(`   - In both: ${[...bdIds].filter((id) => usIds.has(id)).length}`);

    if (bdOffers.length !== usOffers.length) {
      console.log(`\n✅ GemiAd is now country-filtered!`);
    } else {
      console.log(`\n⚠️  Still returning same count - checking sample data`);
    }

    // Sample data
    console.log(`\n📝 Sample BD offers (first 3 with countries):`);
    bdOffers.slice(0, 3).forEach((o, i) => {
      console.log(
        `   ${i + 1}. ${o.externalOfferId}: countries=${JSON.stringify(o.countries)}`,
      );
    });

    console.log(`\n📝 Sample US offers (first 3 with countries):`);
    usOffers.slice(0, 3).forEach((o, i) => {
      console.log(
        `   ${i + 1}. ${o.externalOfferId}: countries=${JSON.stringify(o.countries)}`,
      );
    });
  } catch (err) {
    console.error("Error:", err instanceof Error ? err.message : String(err));
  }
})();
