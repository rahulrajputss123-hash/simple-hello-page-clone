import { config } from "dotenv";
config();
import { supabaseAdmin } from "../src/integrations/supabase/client.server";
import { getAdapter } from "../src/lib/offers/registry.server";
import type { OfferProvider } from "../src/lib/offers/provider-types";

async function testProvider(slug: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing: ${slug.toUpperCase()}`);
  console.log("=".repeat(60));

  const { data: provider, error } = await supabaseAdmin
    .from("offer_providers")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !provider) {
    console.log(`❌ Provider not found in database`);
    return;
  }

  const adapter = getAdapter(slug);
  if (!adapter) {
    console.log(`❌ No adapter found`);
    return;
  }

  try {
    console.log("\n📍 Fetching BD offers...");
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

    const onlyBd = [...bdIds].filter((id) => !usIds.has(id)).length;
    const onlyUs = [...usIds].filter((id) => !bdIds.has(id)).length;
    const both = [...bdIds].filter((id) => usIds.has(id)).length;

    console.log(`\n📊 Comparison:`);
    console.log(`   - Only in BD: ${onlyBd}`);
    console.log(`   - Only in US: ${onlyUs}`);
    console.log(`   - In both: ${both}`);

    if (onlyBd > 0 || onlyUs > 0) {
      console.log(`\n✅ Provider IS country-filtered`);
    } else {
      console.log(`\n⚠️  Provider NOT country-filtered`);
    }

    console.log(`\n📝 Sample BD offers (first 3):`);
    bdOffers.slice(0, 3).forEach((o, i) => {
      console.log(
        `   ${i + 1}. ${o.externalOfferId}: countries=${JSON.stringify(o.countries ?? [])}`,
      );
    });

    console.log(`\n📝 Sample US offers (first 3):`);
    usOffers.slice(0, 3).forEach((o, i) => {
      console.log(
        `   ${i + 1}. ${o.externalOfferId}: countries=${JSON.stringify(o.countries ?? [])}`,
      );
    });
  } catch (err) {
    console.error(`\n❌ Error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

(async () => {
  await testProvider("torox");
  console.log("\n⏳ Waiting 3 seconds...\n");
  await new Promise((resolve) => setTimeout(resolve, 3000));
  await testProvider("adswedmedia");
})();
