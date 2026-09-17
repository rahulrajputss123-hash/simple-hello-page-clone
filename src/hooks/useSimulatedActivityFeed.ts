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

/** The minimum shape this simulation needs from a real, GEO-filtered offer. */
export type ActivityOffer = {
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
  offerId: string;
  offerTitle: string;
  offerImageUrl: string | null;
  rewardAmount: number;
};

/** Delay between one activity disappearing and the next appearing. */
const GAP_MIN_MS = 8_000;
const GAP_MAX_MS = 25_000;
/** How long a single activity stays on screen. */
const SHOW_MIN_MS = 4_000;
const SHOW_MAX_MS = 7_000;
/** Share of activities that render with an avatar. */
const AVATAR_CHANCE = 0.65;

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
 * Builds one activity from a real offer + a dummy username, retrying a few times
 * so the same username+offer pair never appears twice in a row.
 */
function buildActivity(
  offers: readonly ActivityOffer[],
  lastCombo: string | null,
): SimulatedActivity | null {
  if (!offers.length) return null;

  for (let attempt = 0; attempt < 8; attempt++) {
    const username = pickOne(DUMMY_USERNAMES);
    const offer = pickOne(offers);
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
 * Drives the appear/disappear cycle. Returns the activity to render, or null
 * while in the gap between activities.
 *
 * @param offers Real GEO-filtered offers. The cycle stays idle until non-empty.
 */
export function useSimulatedActivityFeed(
  offers: readonly ActivityOffer[],
): SimulatedActivity | null {
  const [current, setCurrent] = useState<SimulatedActivity | null>(null);

  // Read offers through a ref so the feed picks up a refreshed list without
  // tearing down and restarting the timer chain.
  const offersRef = useRef(offers);
  offersRef.current = offers;

  const lastComboRef = useRef<string | null>(null);
  const hasOffers = offers.length > 0;

  useEffect(() => {
    if (!hasOffers) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const scheduleNext = () => {
      timer = setTimeout(show, randInt(GAP_MIN_MS, GAP_MAX_MS));
    };

    const show = () => {
      if (cancelled) return;
      const next = buildActivity(offersRef.current, lastComboRef.current);
      if (!next) {
        scheduleNext();
        return;
      }
      lastComboRef.current = `${next.username}|${next.offerId}`;
      setCurrent(next);
      timer = setTimeout(hide, randInt(SHOW_MIN_MS, SHOW_MAX_MS));
    };

    const hide = () => {
      if (cancelled) return;
      setCurrent(null);
      scheduleNext();
    };

    // First activity waits the same randomised gap as every later one.
    scheduleNext();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      setCurrent(null);
    };
  }, [hasOffers]);

  return current;
}
