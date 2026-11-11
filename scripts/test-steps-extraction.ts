/**
 * Test extractStepsFromRawPayload function directly
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type OfferStep = { label: string; usd: number };

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&nbsp;": " ",
  };
  return text.replace(/&[a-z]+;|&#\d+;/gi, (match) => entities[match] || match);
}

function extractStepsFromRawPayload(
  providerSlug: string | null,
  rawPayload: unknown,
  offerRewardAmount: number,
  revenueShare: number | null,
  defaultRevenueShare: number,
): OfferStep[] | null {
  if (!rawPayload || typeof rawPayload !== "object") return null;
  
  const payload = rawPayload as Record<string, unknown>;
  const share = revenueShare ?? defaultRevenueShare;
  
  // torox: events = [{ eventId, orderId, eventName, payout, amount, timeframeMin, timeframeMax }]
  if (providerSlug === "torox" && Array.isArray(payload.events)) {
    const events = payload.events as Array<{
      eventId?: number;
      orderId?: number;
      eventName?: string;
      payout?: number;
      amount?: number;
      timeframeMin?: number;
      timeframeMax?: number | null;
    }>;
    
    if (events.length === 0) return null;
    
    // Sort by orderId
    const sorted = [...events].sort((a, b) => (a.orderId ?? 0) - (b.orderId ?? 0));
    
    const steps: OfferStep[] = [];
    for (const event of sorted) {
      const label = decodeHtmlEntities(stripHtml(event.eventName || "")).trim();
      const payout = Number(event.payout) || 0;
      if (!label || payout <= 0) continue;
      
      const usd = payout * share;
      steps.push({ label, usd });
    }
    
    return steps.length > 0 ? steps : null;
  }
  
  // gemiad: events = [{ action: { en }, payout }]
  if (providerSlug === "gemiad" && Array.isArray(payload.events)) {
    const events = payload.events as Array<{
      action?: { en?: string };
      payout?: string | number;
    }>;
    
    if (events.length === 0) return null;
    
    const steps: OfferStep[] = [];
    for (const event of events) {
      const label = stripHtml(event.action?.en || "").trim();
      const payout = Number(event.payout) || 0;
      if (!label || payout <= 0) continue;
      
      const usd = payout * share;
      steps.push({ label, usd });
    }
    
    // If only one step with generic label, don't show steps
    if (steps.length === 1 && steps[0].label.toLowerCase() === "complete the offer") {
      return null;
    }
    
    return steps.length > 0 ? steps : null;
  }
  
  // affike: conversionEvents = [{ id, action, points }]
  if (providerSlug === "affike" && Array.isArray(payload.conversionEvents)) {
    const events = payload.conversionEvents as Array<{
      id?: string;
      action?: string;
      points?: number;
    }>;
    
    const totalPoints = events.reduce((sum, e) => sum + (Number(e.points) || 0), 0);
    if (totalPoints === 0) return null;
    
    const steps: OfferStep[] = [];
    for (const event of events) {
      const label = (event.action || "").trim();
      const points = Number(event.points) || 0;
      if (!label || points <= 0) continue;
      
      const usd = (offerRewardAmount * points) / totalPoints;
      steps.push({ label: stripHtml(label), usd });
    }
    
    // If only one step with generic label, don't show steps
    if (steps.length === 1 && steps[0].label.toLowerCase() === "complete the offer") {
      return null;
    }
    
    return steps.length > 0 ? steps : null;
  }
  
  // revtoo: events = [{ event_id, event_title, event_payout, event_reward, event_description }]
  if (providerSlug === "revtoo" && Array.isArray(payload.events)) {
    const events = payload.events as Array<{
      event_id?: string;
      event_title?: string;
      event_payout?: number;
      event_reward?: string;
      event_description?: string;
    }>;
    
    const steps: OfferStep[] = [];
    
    for (const event of events) {
      const label = (event.event_title || "").trim();
      const payout = Number(event.event_payout) || 0;
      if (!label || payout <= 0) continue;
      
      const usd = payout * share;
      steps.push({ label: stripHtml(label), usd });
    }
    
    // If only one step with generic label, don't show steps
    if (steps.length === 1 && steps[0].label.toLowerCase() === "complete the offer") {
      return null;
    }
    
    return steps.length > 0 ? steps : null;
  }
  
  return null;
}

async function testOffer(id: string, name: string, expectedSteps: number) {
  console.log(`\n=== Testing: ${name} ===`);
  
  const { data: offer, error } = await supabase
    .from("offers")
    .select("id, title, reward_amount, revenue_share, raw_payload, offer_providers(slug, default_revenue_share)")
    .eq("id", id)
    .maybeSingle();

  if (error || !offer) {
    console.log("❌ Error:", error);
    return { name, expected: expectedSteps, actual: 0, status: "ERROR" };
  }

  const providerData = (offer as any).offer_providers;
  const providerSlug = providerData?.slug ?? null;
  const defaultShare = Number(providerData?.default_revenue_share ?? 0.6);
  const revenueShare = offer.revenue_share ? Number(offer.revenue_share) : null;
  const rewardAmount = Number(offer.reward_amount);

  console.log(`Provider: ${providerSlug}`);
  console.log(`Title: ${offer.title}`);
  console.log(`Reward: $${rewardAmount}`);
  console.log(`Revenue share: ${revenueShare ?? defaultShare}`);

  const steps = extractStepsFromRawPayload(
    providerSlug,
    offer.raw_payload,
    rewardAmount,
    revenueShare,
    defaultShare
  );

  const actualSteps = steps?.length ?? 0;
  const status = actualSteps === expectedSteps ? "✅ PASS" : "❌ FAIL";

  console.log(`${status} Expected ${expectedSteps} steps, got ${actualSteps}`);
  
  if (steps && steps.length > 0) {
    console.log(`First step: ${steps[0].label} ($${steps[0].usd.toFixed(4)})`);
    console.log(`Last step: ${steps[steps.length - 1].label} ($${steps[steps.length - 1].usd.toFixed(4)})`);
  }

  return { name, expected: expectedSteps, actual: actualSteps, status: status.includes("PASS") ? "PASS" : "FAIL" };
}

async function main() {
  console.log("=== Testing Step Extraction ===\n");

  const results = [];
  
  results.push(await testOffer("49d1df92-727b-4edb-8c1c-7ccf078744d9", "Revtoo Rocket Hit", 17));
  results.push(await testOffer("37e7fd66-7e6b-4c5f-9058-0d0f95d3b451", "Affike Lords Mobile", 32));
  results.push(await testOffer("94562a14-7d16-48d1-8844-c7af62f2421a", "Affike Bingo Island", 22));

  // Test a Torox offer
  const { data: toroxOffer } = await supabase
    .from("offers")
    .select("id, offer_providers!inner(slug)")
    .eq("is_active", true)
    .eq("offer_providers.slug", "torox")
    .limit(1)
    .single();

  if (toroxOffer) {
    results.push(await testOffer(toroxOffer.id, "Torox (any)", 0)); // Don't know exact count
  }

  // Test a GemiAd offer
  const { data: gemiadOffer } = await supabase
    .from("offers")
    .select("id, offer_providers!inner(slug)")
    .eq("is_active", true)
    .eq("offer_providers.slug", "gemiad")
    .limit(1)
    .single();

  if (gemiadOffer) {
    results.push(await testOffer(gemiadOffer.id, "GemiAd (any)", 0)); // Don't know exact count
  }

  console.log("\n=== Summary ===");
  console.table(results);

  const passCount = results.filter(r => r.status === "PASS").length;
  const failCount = results.filter(r => r.status === "FAIL").length;
  console.log(`\nPassed: ${passCount}/${results.length}`);
  console.log(`Failed: ${failCount}/${results.length}`);
}

main().catch(console.error);
