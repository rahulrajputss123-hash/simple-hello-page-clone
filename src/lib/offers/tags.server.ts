import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Server-side auto-tag computation for network / non-manual offers.
 * Uses ONLY real data already in the DB — never guesses.
 *
 * Rules (per spec):
 *   Hot       → offer's reward_amount is in the top ~15% of active offers.
 *   Popular   → highest click activity in the last 7 days (top ~15%) using
 *               offer_click_events; falls back to offer_claims count when
 *               no click events exist yet.
 *   Trending  → 7-day activity is >= 1.5× the prior 7-day activity and
 *               has at least a small minimum sample size (>=3 clicks/claims)
 *               to avoid noisy tags on brand-new offers.
 *   Easy      → short requirements text (<=60 chars) OR category is
 *               "Sign Up"-like (Trial). No signal → leave untagged.
 *
 * When an admin sets `tags_manual=true`, the stored `tags` array is used
 * as-is and this function is not consulted.
 */
export type AutoTag = "Hot" | "Trending" | "Easy" | "Popular";

export type AutoTagRow = {
  id: string;
  reward_amount: number;
  requirements: string | null;
  category: string | null;
};

export type AutoTagsMap = Record<string, AutoTag[]>;

const MIN_SAMPLE_FOR_TRENDING = 3;
const TOP_TIER_FRACTION = 0.15;

async function fetch7dActivity(
  offerIds: string[],
): Promise<{ recent: Map<string, number>; prior: Map<string, number> }> {
  const recent = new Map<string, number>();
  const prior = new Map<string, number>();
  if (!offerIds.length) return { recent, prior };

  const now = Date.now();
  const start14 = new Date(now - 14 * 24 * 3600 * 1000).toISOString();
  const boundary = new Date(now - 7 * 24 * 3600 * 1000).toISOString();

  // Prefer real click events (which the OfferDetailsDialog inserts on "Continue")
  const clicks = await supabaseAdmin
    .from("offer_click_events")
    .select("offer_id, created_at")
    .in("offer_id", offerIds)
    .gte("created_at", start14);

  const clickRows = (clicks.data ?? []) as { offer_id: string; created_at: string }[];
  if (clickRows.length > 0) {
    for (const row of clickRows) {
      const bucket = row.created_at >= boundary ? recent : prior;
      bucket.set(row.offer_id, (bucket.get(row.offer_id) ?? 0) + 1);
    }
    return { recent, prior };
  }

  // Fallback: use offer_claims (undercounts real interest but is real data).
  const claims = await supabaseAdmin
    .from("offer_claims")
    .select("offer_id, created_at")
    .in("offer_id", offerIds)
    .gte("created_at", start14);
  for (const row of (claims.data ?? []) as { offer_id: string; created_at: string }[]) {
    const bucket = row.created_at >= boundary ? recent : prior;
    bucket.set(row.offer_id, (bucket.get(row.offer_id) ?? 0) + 1);
  }
  return { recent, prior };
}

function topTierThreshold(values: number[]): number {
  if (!values.length) return Number.POSITIVE_INFINITY;
  const sorted = [...values].sort((a, b) => b - a);
  const idx = Math.max(0, Math.floor(sorted.length * TOP_TIER_FRACTION) - 1);
  return sorted[idx] ?? sorted[0];
}

/** Compute Hot/Popular/Trending/Easy for the given offers. */
export async function computeAutoTags(offers: AutoTagRow[]): Promise<AutoTagsMap> {
  const map: AutoTagsMap = {};
  if (!offers.length) return map;
  const ids = offers.map((o) => o.id);

  const rewardThreshold = topTierThreshold(offers.map((o) => Number(o.reward_amount ?? 0)));
  const { recent, prior } = await fetch7dActivity(ids);
  const activityValues = Array.from(recent.values());
  const popularThreshold = topTierThreshold(activityValues);

  for (const offer of offers) {
    const tags: AutoTag[] = [];
    const reward = Number(offer.reward_amount ?? 0);
    if (reward > 0 && reward >= rewardThreshold) tags.push("Hot");

    const recentCount = recent.get(offer.id) ?? 0;
    const priorCount = prior.get(offer.id) ?? 0;
    if (recentCount >= popularThreshold && recentCount > 0) tags.push("Popular");
    if (
      recentCount >= MIN_SAMPLE_FOR_TRENDING &&
      (priorCount === 0 ? recentCount >= MIN_SAMPLE_FOR_TRENDING : recentCount / priorCount >= 1.5)
    ) {
      tags.push("Trending");
    }

    const reqLen = (offer.requirements ?? "").trim().length;
    if ((reqLen > 0 && reqLen <= 60) || offer.category === "Trial") tags.push("Easy");

    if (tags.length) map[offer.id] = tags;
  }
  return map;
}

/** Insert a click event — called from the pre-redirect popup Continue button. */
export async function recordOfferClickImpl(offerId: string) {
  await supabaseAdmin.from("offer_click_events").insert({ offer_id: offerId } as never);
  return { ok: true };
}
