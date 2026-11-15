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

  console.log("Testing AdswedMedia...\n");
  console.log("📍 Fetching BD offers...");
  const bdOffers = await adapter!.fetchOffers(provider as unknown as OfferProvider, {
    country: "BD",
  });
  console.log(`   Found ${bdOffers.length} offers`);

  console.log("\n📍 Fetching US offers...");
  const usOffers = await adapter!.fetchOffers(provider as unknown as OfferProvider, {
    country: "US",
  });
  console.log(`   Found ${usOffers.length} offers`);

  const bdIds = new Set(bdOffers.map((o) => o.externalOfferId));
  const usIds = new Set(usOffers.map((o) => o.externalOfferId));

  console.log(`\n📊 Comparison:`);
  console.log(`   - Only in BD: ${[...bdIds].filter((id) => !usIds.has(id)).length}`);
  console.log(`   - Only in US: ${[...usIds].filter((id) => !bdIds.has(id)).length}`);
  console.log(`   - In both: ${[...bdIds].filter((id) => usIds.has(id)).length}`);

  console.log(`\n📝 Sample BD offers (first 3):`);
  bdOffers.slice(0, 3).forEach((o, i) => {
    console.log(`   ${i + 1}. ${o.externalOfferId}: countries=${JSON.stringify(o.countries)}`);
  });

  console.log(`\n📝 Sample US offers (first 3):`);
  usOffers.slice(0, 3).forEach((o, i) => {
    console.log(`   ${i + 1}. ${o.externalOfferId}: countries=${JSON.stringify(o.countries)}`);
  });
})();
