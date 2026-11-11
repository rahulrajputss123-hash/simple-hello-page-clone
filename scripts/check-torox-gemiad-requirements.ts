import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Check Torox offers with requirements
  const { data: toroxOffers } = await supabase
    .from("offers")
    .select("id, title, requirements, offer_providers!inner(slug)")
    .eq("is_active", true)
    .eq("offer_providers.slug", "torox")
    .limit(5);

  console.log("\n=== Torox Offers ===");
  toroxOffers?.forEach(o => {
    console.log(`${o.title}: requirements length = ${(o.requirements || "").length} chars`);
    console.log(`  First 100 chars: ${(o.requirements || "").slice(0, 100)}`);
  });

  // Check GemiAd offers with requirements
  const { data: gemiadOffers } = await supabase
    .from("offers")
    .select("id, title, requirements, offer_providers!inner(slug)")
    .eq("is_active", true)
    .eq("offer_providers.slug", "gemiad")
    .limit(5);

  console.log("\n=== GemiAd Offers ===");
  gemiadOffers?.forEach(o => {
    console.log(`${o.title}: requirements length = ${(o.requirements || "").length} chars`);
    console.log(`  First 100 chars: ${(o.requirements || "").slice(0, 100)}`);
  });

  // Count offers with requirements by provider
  const { data: reqCounts } = await supabase
    .rpc('execute_sql', {
      query: `
        SELECT op.slug, 
               COUNT(*) FILTER (WHERE o.requirements IS NOT NULL AND o.requirements != '') as with_requirements,
               COUNT(*) as total
        FROM offers o
        JOIN offer_providers op ON o.provider_id = op.id
        WHERE o.is_active = true
          AND op.slug IN ('torox', 'gemiad', 'affike', 'revtoo')
        GROUP BY op.slug
        ORDER BY op.slug;
      `
    });

  console.log("\n=== Requirements Count by Provider ===");
  console.log(reqCounts);
}

main().catch(console.error);
