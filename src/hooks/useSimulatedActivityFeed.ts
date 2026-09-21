import { useEffect, useRef, useState } from "react";

import { AVATAR_OPTIONS } from "@/lib/onboarding/premium";

/**
 * Simulated "live user activity" feed.
 *
 * UI-ONLY. This never writes to Supabase, never creates users/claims/transactions,
 * and never triggers postbacks or affiliate tracking. It pairs a hardcoded pool of
 * anonymised dummy usernames with REAL offers supplied by the caller (which come
 * from the existing GEO-filtered featured feed), purely to render social proof.
 */

/**
 * The minimum shape this simulation needs from one real activity source.
 *
 * The pool is built from exactly two sources, both already loaded by Home:
 * GEO-filtered featured/regular offers, and active quests. Offerwall data is
 * deliberately NOT a source.
 */
export type ActivityItem = {
  id: string;
  title: string;
  reward_amount: number;
  image_url: string | null;
};

export type SimulatedActivity = {
  /** Unique per appearance so the CSS enter animation restarts each time. */
  id: string;
  username: string;
  /** null for roughly a third of activities, so some render without an avatar. */
  avatarUrl: string | null;
  /** Id of the source offer OR quest this activity was built from. */
  offerId: string;
  /** Title of the offer, or the quest's label. */
  offerTitle: string;
  offerImageUrl: string | null;
  rewardAmount: number;
};

/**
 * Cadence between replacements. The visible activity is never cleared in
 * between — the next one replaces it directly, so there is no blank gap.
 */
const ROTATE_MIN_MS = 6_000;
const ROTATE_MAX_MS = 12_000;
/** Short delay before the first activity appears, then it stays for good. */
const FIRST_SHOW_MS = 1_200;
/** Share of activities that render with an avatar. */
const AVATAR_CHANCE = 0.65;

/**
 * Hard ceiling. A payout of exactly $50.00 is allowed; anything above it must
 * never appear in the feed.
 */
const MAX_REWARD = 50;

/**
 * Weighted tier probabilities — low payouts dominate the stream and high ones
 * are rare, so the feed never looks like a list of the biggest offers.
 * Roughly 65 / 27 / 8 percent.
 */
const TIER_WEIGHTS = { low: 0.65, mid: 0.27, high: 0.08 } as const;

type ActivityTiers = { low: ActivityItem[]; mid: ActivityItem[]; high: ActivityItem[] };

/**
 * Anonymised dummy usernames (152 unique). These are invented placeholders — no
 * value here is read from, derived from, or matched against a registered user.
 */
export const DUMMY_USERNAMES: readonly string[] = [
  // masked given names
  "Rahul*",
  "Priya**",
  "Aman***",
  "Neha**",
  "Vikram*",
  "Arjun*",
  "Meera**",
  "Rohit*",
  "Ananya**",
  "Karan*",
  "Divya**",
  "Nikhil*",
  "Pooja**",
  "Sanjay*",
  "Kavya**",
  "Manish*",
  "Ritu**",
  "Deepak*",
  "Shreya**",
  "Varun*",
  "Isha**",
  "Gaurav*",
  "Tanya**",
  "Akash*",
  "Nisha**",
  "Rajesh*",
  "Swati**",
  "Abhay*",
  "Preeti**",
  "Suresh*",
  "Anjali**",
  "Kunal*",
  "Sneha**",
  "Mohit*",
  "Simran**",
  "Yash*",
  "Payal**",
  "Harsh*",
  "Komal**",
  "Tarun*",
  "Rekha**",
  "Vishal*",
  "Jyoti**",
  "Ajay*",
  "Bhavna**",
  "Naveen*",
  "Lata**",
  "Farhan*",
  "Ayesha**",
  "Imran*",
  "Alex*",
  "Sam*",
  "Sara**",
  "Emma**",
  "Liam*",
  "Olivia**",
  "Noah*",
  "Ava**",
  "Ethan*",
  "Sophia**",
  "Mason*",
  "Mia**",
  "Lucas*",
  "Isabella**",
  "Logan*",
  "Amelia**",
  "Jacob*",
  "Harper**",
  "Jack*",
  "Ella**",
  "Ryan*",
  "Grace**",
  "Owen*",
  "Chloe**",
  "Dylan*",
  "Zoe**",
  "Caleb*",
  "Lily**",
  "Nathan*",
  "Ruby**",
  "Aaron*",
  "Nora**",
  "Carlos*",
  "Maria**",
  "Diego*",
  "Lucia**",
  "Javier*",
  "Elena**",
  "Miguel*",
  "Sofia**",
  "Pablo*",
  "Carmen**",
  "Chen*",
  "Wei**",
  "Yuki*",
  "Hana**",
  "Minjun*",
  "Jiho**",
  "Aiko*",
  "Kenji**",
  "Ahmed*",
  "Fatima**",
  "Omar*",
  "Layla**",
  "Yusuf*",
  "Zara**",
  "Bilal*",
  "Amina**",
  "Daniel*",
  "Rachel**",
  "Piotr*",
  "Laura**",
  "Tomas*",
  "Nina**",
  "Viktor*",
  "Anna**",
  "Kwame*",
  "Amara**",
  "Chidi*",
  "Zuri**",
  // numeric handles
  "User_8291",
  "User_4718",
  "User_2053",
  "User_6142",
  "User_9375",
  "User_1826",
  "User_5490",
  "User_7238",
  "User_3061",
  "User_8547",
  "User_2914",
  "User_6703",
  "User_4185",
  "User_9628",
  "User_1357",
  "User_7042",
  "User_5871",
  "User_3496",
  "User_8130",
  "User_2765",
  "User_6019",
  "User_4523",
  "User_9184",
  "User_1670",
  "User_7395",
  "User_5238",
  "User_3801",
  "User_8462",
  "User_2107",
  "User_6584",
  "User_4970",
  "User_1243",
];

/** Inclusive random integer. */
function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickOne<T>(list: readonly T[]): T | null {
  return list.length ? (list[randInt(0, list.length - 1)] ?? null) : null;
}

/**
 * Splits the pool into payout tiers by rank, not by fixed dollar thresholds, so
 * the tiering adapts to whatever payouts actually exist: the cheapest ~60% are
 * "low", the next ~30% "mid", the dearest ~10% "high". Ranking by position keeps
 * every tier non-empty for any pool size, which fixed cut-offs would not.
 *
 * Anything above MAX_REWARD is dropped here and can never be selected.
 */
function buildTiers(items: readonly ActivityItem[]): ActivityTiers | null {
  const eligible = items.filter(
    (item) =>
      Number.isFinite(item.reward_amount) &&
      item.reward_amount > 0 &&
      item.reward_amount <= MAX_REWARD,
  );
  if (!eligible.length) return null;

  const sorted = [...eligible].sort((a, b) => a.reward_amount - b.reward_amount);
  const count = sorted.length;
  const lowEnd = Math.max(1, Math.round(count * 0.6));
  const midEnd = Math.max(lowEnd, Math.round(count * 0.9));

  return {
    low: sorted.slice(0, lowEnd),
    mid: sorted.slice(lowEnd, midEnd),
    high: sorted.slice(midEnd),
  };
}

/**
 * Weighted pick across the tiers. Empty tiers are skipped and their weight is
 * renormalised over the rest, so a small pool still behaves sensibly.
 */
function pickWeighted(tiers: ActivityTiers): ActivityItem | null {
  const buckets = [
    { items: tiers.low, weight: TIER_WEIGHTS.low },
    { items: tiers.mid, weight: TIER_WEIGHTS.mid },
    { items: tiers.high, weight: TIER_WEIGHTS.high },
  ].filter((bucket) => bucket.items.length > 0);
  if (!buckets.length) return null;

  const total = buckets.reduce((sum, bucket) => sum + bucket.weight, 0);
  let roll = Math.random() * total;
  for (const bucket of buckets) {
    roll -= bucket.weight;
    if (roll <= 0) return pickOne(bucket.items);
  }
  return pickOne(buckets[buckets.length - 1]!.items);
}

/**
 * Builds one activity from a real offer/quest + a dummy username, retrying a few
 * times so the same username+source pair never appears twice in a row.
 */
function buildActivity(
  items: readonly ActivityItem[],
  lastCombo: string | null,
): SimulatedActivity | null {
  const tiers = buildTiers(items);
  if (!tiers) return null;

  for (let attempt = 0; attempt < 8; attempt++) {
    const username = pickOne(DUMMY_USERNAMES);
    const offer = pickWeighted(tiers);
    if (!username || !offer) return null;

    const combo = `${username}|${offer.id}`;
    // Last attempt accepts a repeat rather than showing nothing at all.
    if (combo === lastCombo && attempt < 7) continue;

    const avatar = Math.random() < AVATAR_CHANCE ? pickOne(AVATAR_OPTIONS) : null;
    return {
      id: `${combo}|${Date.now()}`,
      username,
      avatarUrl: avatar?.imageUrl ?? null,
      offerId: offer.id,
      offerTitle: offer.title,
      offerImageUrl: offer.image_url,
      rewardAmount: offer.reward_amount,
    };
  }
  return null;
}

/**
 * Drives a CONTINUOUS feed: once the first activity is shown it stays visible
 * and is replaced in place by the next one. The hook never returns to null
 * after the first activity, so the UI has no blank state to render.
 *
 * @param items Real offers + active quests. Stays idle until non-empty.
 */
export function useSimulatedActivityFeed(items: readonly ActivityItem[]): SimulatedActivity | null {
  const [current, setCurrent] = useState<SimulatedActivity | null>(null);

  // Read the pool through a ref so a refreshed list is picked up without
  // tearing down and restarting the timer chain.
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const lastComboRef = useRef<string | null>(null);
  const hasItems = items.length > 0;

  useEffect(() => {
    if (!hasItems) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const rotate = () => {
      if (cancelled) return;
      const next = buildActivity(itemsRef.current, lastComboRef.current);
      // If nothing is currently eligible (e.g. every payout is above the cap),
      // keep whatever is already on screen rather than blanking, and try again
      // on the next tick.
      if (next) {
        lastComboRef.current = `${next.username}|${next.offerId}`;
        setCurrent(next);
      }
      timer = setTimeout(rotate, randInt(ROTATE_MIN_MS, ROTATE_MAX_MS));
    };

    timer = setTimeout(rotate, FIRST_SHOW_MS);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      // Deliberately NOT clearing `current`: if the pool briefly empties the
      // last activity stays on screen instead of flashing to blank.
    };
  }, [hasItems]);

  return current;
}
