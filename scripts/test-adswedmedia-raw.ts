import { config } from "dotenv";
config();
import { supabaseAdmin } from "../src/integrations/supabase/client.server";
import { getAdapter } from "../src/lib/offers/registry.server";
import type { OfferProvider } from "../src/lib/offers/provider-types";

(async () => {
  const { data: provider } = await supabaseAdmin
    .from("offer_providers")
    .select("*")
    .eq("slug", "adswedmedia")
    .single();

  const adapter = getAdapter("adswedmedia");

  console.log("Testing AdswedMedia WITHOUT country filter...\n");
  
  // Fetch without country context to see raw feed
  console.log("📍 Fetching ALL offers (no country filter)...");
  const allOffers = await adapter!.fetchOffers(provider as unknown as OfferProvider);
  console.log(`   Found ${allOffers.length} offers in raw feed\n`);

  if (allOffers.length > 0) {
    console.log("📝 Sample offers (first 5) with country data:");
    allOffers.slice(0, 5).forEach((o, i) => {
      console.log(`   ${i + 1}. ${o.externalOfferId}:`);
      console.log(`      Title: ${o.title.substring(0, 50)}...`);
      console.log(`      Countries: ${JSON.stringify(o.countries)}`);
      console.log(`      Devices: ${JSON.stringify(o.devices)}`);
    });

    // Now test with BD
    console.log("\n📍 Fetching BD offers (with geo-filter)...");
    const bdOffers = await adapter!.fetchOffers(provider as unknown as OfferProvider, {
      country: "BD",
    });
    console.log(`   Found ${bdOffers.length} offers\n`);

    // Now test with US
    console.log("📍 Fetching US offers (with geo-filter)...");
    const usOffers = await adapter!.fetchOffers(provider as unknown as OfferProvider, {
      country: "US",
    });
    console.log(`   Found ${usOffers.length} offers\n`);

    // Check if any offers have BD or US
    const offersWithBD = allOffers.filter((o) => {
      const c = o.countries ?? [];
      return c.length === 0 || c.some((code) => code.toUpperCase() === "ALL") || c.includes("BD");
    });
    const offersWithUS = allOffers.filter((o) => {
      const c = o.countries ?? [];
      return c.length === 0 || c.some((code) => code.toUpperCase() === "ALL") || c.includes("US");
    });

    console.log("📊 Analysis:");
    console.log(`   - Offers with BD eligibility: ${offersWithBD.length}`);
    console.log(`   - Offers with US eligibility: ${offersWithUS.length}`);
    console.log(`   - Offers with empty countries (global): ${allOffers.filter((o) => !o.countries || o.countries.length === 0).length}`);
    console.log(`   - Offers with "all" marker: ${allOffers.filter((o) => o.countries?.some((c) => c.toLowerCase() === "all")).length}`);
  } else {
    console.log("⚠️  Raw feed is empty - API returned 0 offers");
  }
})();
