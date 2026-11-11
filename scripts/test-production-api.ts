/**
 * Test what the production API actually returns for offer details
 */

const VERCEL_URL = "https://wvvwbff2b.vercel.app";

const TEST_OFFERS = {
  revtoo: "49d1df92-727b-4edb-8c1c-7ccf078744d9",
  affike_lords: "37e7fd66-7e6b-4c5f-9058-0d0f95d3b451",
  affike_bingo: "94562a14-7d16-48d1-8844-c7af62f2421a",
};

async function testOffer(id: string, name: string) {
  console.log(`\n=== Testing: ${name} ===`);
  console.log(`Offer ID: ${id}`);
  
  try {
    // This simulates what the app does
    const response = await fetch(`${VERCEL_URL}/api/offers/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
      return;
    }

    const data = await response.json();
    
    console.log(`Title: ${data.title || "N/A"}`);
    console.log(`Provider: ${data.provider_name || data.provider_slug || "N/A"}`);
    console.log(`Has steps property: ${data.steps !== undefined}`);
    console.log(`Steps count: ${data.steps?.length || 0}`);
    
    if (data.steps && data.steps.length > 0) {
      console.log(`✅ PASS - ${data.steps.length} steps found`);
      console.log(`First step: ${data.steps[0].label} ($${data.steps[0].usd})`);
    } else {
      console.log(`❌ FAIL - No steps returned`);
      console.log(`Requirements: ${data.requirements?.slice(0, 100) || "none"}`);
    }
  } catch (error) {
    console.log(`❌ Error:`, error);
  }
}

async function main() {
  console.log(`Testing Vercel deployment: ${VERCEL_URL}\n`);
  
  await testOffer(TEST_OFFERS.revtoo, "Revtoo Rocket Hit");
  await testOffer(TEST_OFFERS.affike_lords, "Affike Lords Mobile");
  await testOffer(TEST_OFFERS.affike_bingo, "Affike Bingo Island");
}

main().catch(console.error);
