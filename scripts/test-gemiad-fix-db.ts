import { config } from "dotenv";
config();
import { supabaseAdmin } from "../src/integrations/supabase/client.server";
import { getAdapter } from "../src/lib/offers/registry.server";
import type { OfferProvider } from "../src/lib/offers/provider-types";

console.log("Testing GemiAd with country filtering fix...\n");

(async () => {
  try {
    // Fetch actual provider from database
    const { data: provider, error: providerError } = await supabaseAdmin
      .from("offer_providers")
      .select("*")
      .eq("slug", "gemiad")
      .single();

    if (providerError || !provider) {
      console.error("❌ Failed to load GemiAd provider:", providerError?.message);
      process.exit(1);
    }

    const adapter = getAdapter("gemiad");
    if (!adapter) {
      console.log("❌ GemiAd adapter not found");
      process.exit(1);
    }

    console.log("📍 Fetching BD offers...");
    const bdOffers = await adapter.fetchOffers(provider as unknown as OfferProvider, {
      country: "BD",
    });
    console.log(`   Found ${bdOffers.length} offers`);

    console.log("\n📍 Fetching US offers...");
    const usOffers = await adapter.fetchOffers(provider as unknown as OfferProvider, {
      country: "US",
    });
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
      console.log(`\n⚠️  Same count - all offers may be global`);
    }

    // Sample data
    console.log(`\n📝 Sample BD offers (first 5 with countries):`);
    bdOffers.slice(0, 5).forEach((o, i) => {
      console.log(
        `   ${i + 1}. ${o.externalOfferId}: countries=${JSON.stringify(o.countries)}`,
      );
    });

    console.log(`\n📝 Sample US offers (first 5 with countries):`);
    usOffers.slice(0, 5).forEach((o, i) => {
      console.log(
        `   ${i + 1}. ${o.externalOfferId}: countries=${JSON.stringify(o.countries)}`,
      );
    });
  } catch (err) {
    console.error("❌ Error:", err instanceof Error ? err.message : String(err));
  }
})();
