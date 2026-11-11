/**
 * Test script to check offer steps extraction
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEST_OFFERS = {
  revtoo_rocket: "49d1df92-727b-4edb-8c1c-7ccf078744d9", // Expect 17 steps
  affike_lords: "37e7fd66-7e6b-4c5f-9058-0d0f95d3b451", // Expect 32 steps
  affike_bingo: "94562a14-7d16-48d1-8844-c7af62f2421a", // Expect 22 steps
};

async function testOffer(id: string, name: string, expectedSteps: number) {
  console.log(`\n=== Testing: ${name} (${id}) ===`);
  console.log(`Expected steps: ${expectedSteps}`);

  const { data: offer, error } = await supabase
    .from("offers")
    .select("id, title, requirements, raw_payload, offer_providers(slug, name)")
    .eq("id", id)
    .maybeSingle();

  if (error || !offer) {
    console.log("❌ Error fetching offer:", error);
    return;
  }

  const providerData = (offer as any).offer_providers;
  const providerSlug = providerData?.slug ?? null;

  console.log(`Provider slug: ${providerSlug}`);
  console.log(`Title: ${offer.title}`);
  console.log(`Requirements length: ${offer.requirements?.length || 0} chars`);
  console.log(`Requirements preview: ${(offer.requirements || "").slice(0, 100)}...`);
  
  if (offer.raw_payload && typeof offer.raw_payload === "object") {
    const payload = offer.raw_payload as Record<string, unknown>;
    console.log(`Raw payload keys: ${Object.keys(payload).join(", ")}`);
    
    if (providerSlug === "revtoo" && Array.isArray(payload.events)) {
      console.log(`Revtoo events count: ${payload.events.length}`);
      console.log(`First event:`, JSON.stringify(payload.events[0], null, 2));
    }
    
    if (providerSlug === "affike" && Array.isArray(payload.conversionEvents)) {
      console.log(`Affike conversionEvents count: ${payload.conversionEvents.length}`);
      console.log(`First event:`, JSON.stringify(payload.conversionEvents[0], null, 2));
    }
  } else {
    console.log("❌ No raw_payload or not an object");
  }
}

async function main() {
  console.log("Testing offer step extraction...\n");

  await testOffer(TEST_OFFERS.revtoo_rocket, "Revtoo Rocket Hit", 17);
  await testOffer(TEST_OFFERS.affike_lords, "Affike Lords Mobile", 32);
  await testOffer(TEST_OFFERS.affike_bingo, "Affike Bingo Island", 22);

  console.log("\n=== Done ===");
}

main().catch(console.error);
