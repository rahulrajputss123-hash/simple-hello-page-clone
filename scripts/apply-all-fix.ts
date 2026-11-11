/**
 * Fix manual offers with devices = ["All"] to devices = []
 * Expected: 2 rows (DIGITAVISION and Vrnum)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('\n=== Fix Manual Offers with devices = ["All"] ===\n');

  // Step 1: Show before state
  console.log("BEFORE:");
  const { data: before, error: beforeError } = await supabase
    .from("offers")
    .select("id, title, devices, is_featured, is_active")
    .eq("source", "manual")
    .contains("devices", ["All"]);

  if (beforeError) {
    console.error("Error fetching before state:", beforeError);
    process.exit(1);
  }

  if (!before || before.length === 0) {
    console.log("No offers found with devices containing 'All'");
    return;
  }

  console.table(before);
  console.log(`\nFound ${before.length} offers with "All" in devices\n`);

  // Step 2: Apply fix
  console.log("Applying fix: devices = ['All'] → devices = []...\n");

  for (const offer of before) {
    const { error } = await supabase
      .from("offers")
      .update({ devices: [] })
      .eq("id", offer.id);

    if (error) {
      console.error(`Failed to update ${offer.title}:`, error);
    } else {
      console.log(`✅ Updated: ${offer.title}`);
    }
  }

  // Step 3: Show after state
  console.log("\nAFTER:");
  const offerIds = before.map(o => o.id);
  const { data: after, error: afterError } = await supabase
    .from("offers")
    .select("id, title, devices, is_featured, is_active")
    .in("id", offerIds);

  if (afterError) {
    console.error("Error fetching after state:", afterError);
    process.exit(1);
  }

  console.table(after);

  // Step 4: Verify no more "All" values exist
  const { count, error: countError } = await supabase
    .from("offers")
    .select("*", { count: "exact", head: true })
    .contains("devices", ["All"]);

  if (countError) {
    console.error("Error counting remaining 'All' values:", countError);
    process.exit(1);
  }

  console.log(`\n✅ Fix complete. Remaining offers with "All": ${count ?? 0}`);
}

main().catch(console.error);
