import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getFeaturedFeed } from "@/lib/offers.functions";
import { AVATAR_OPTIONS, type AvatarOption } from "@/lib/onboarding/premium";

export type SimulatedActivity = {
  username: string;
  offerTitle: string;
  reward: number;
  offerImageUrl: string | null;
  avatar: AvatarOption | null;
};

/**
 * Dummy/anonymized username pool for the simulated activity feed.
 *
 * These are NEVER sourced from real registered users — they are a fixed,
 * client-only display pool combining two harmless styles:
 *  - masked first-name style ("Alex*", "Rahul**", "Priya***")
 *  - numeric-handle style ("User_8291")
 *
 * 30 first names x 3 mask variants (90) + 50 numeric handles = 140 unique
 * entries, comfortably over the 100+ requirement.
 */
const NAME_ROOTS = [
  "Alex", "Rahul", "Priya", "Sam", "Aman", "Neha", "Ravi", "Zoya", "Kabir", "Meera",
  "Arjun", "Divya", "Rohan", "Sara", "Vikram", "Anya", "Karan", "Isha", "Yusuf", "Tara",
  "Nikhil", "Pooja", "Aditya", "Simran", "Farhan", "Riya", "Dev", "Anika", "Suresh", "Maya",
] as const;

const MASKED_USERNAMES: string[] = NAME_ROOTS.flatMap((name) => [
  `${name}*`,
  `${name}**`,
  `${name}***`,
]);

// Strictly decreasing arithmetic sequence -> every value is unique by construction.
const NUMERIC_USERNAMES: string[] = Array.from(
  { length: 50 },
  (_, i) => `User_${9421 - i * 47}`,
);

export const DUMMY_USERNAMES: string[] = [...MASKED_USERNAMES, ...NUMERIC_USERNAMES];

function randomBetween(minInclusive: number, maxExclusive: number): number {
  return Math.floor(minInclusive + Math.random() * (maxExclusive - minInclusive));
}

function pickUsername(): string {
  return DUMMY_USERNAMES[Math.floor(Math.random() * DUMMY_USERNAMES.length)]!;
}

/**
 * Drives the "Simulated Live User Activity Feed" shown on Home.
 *
 * UI-only simulation: reuses the same `["featured-feed","home"]` React Query
 * cache as `FeaturedOffers` (via the existing `getFeaturedFeed` server fn), so
 * no extra network request is created and the existing GEO-targeted, active
 * offer list is respected automatically. Dummy usernames are combined with a
 * randomly chosen REAL offer to build each activity item — never a fake offer.
 *
 * Timing: first activity after a random 8–25s delay, visible for ~4–7s, then
 * fades out and the next one is scheduled after another random 8–25s delay.
 * The same username+offer combination is never shown twice in a row.
 */
export function useSimulatedActivityFeed() {
  const fetchFeed = useServerFn(getFeaturedFeed);

  const { data } = useQuery({
    queryKey: ["featured-feed", "home"],
    queryFn: () => fetchFeed({ data: { scope: "home" as const } }),
  });

  const offers = data?.offers ?? [];
  const offersRef = useRef(offers);
  useEffect(() => {
    offersRef.current = offers;
  }, [offers]);

  const [activity, setActivity] = useState<SimulatedActivity | null>(null);
  const [visible, setVisible] = useState(false);
  const lastKeyRef = useRef<string | null>(null);
  const enabled = offers.length > 0;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let delayTimer: ReturnType<typeof setTimeout> | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    function scheduleNext() {
      const delay = randomBetween(8000, 25000);
      delayTimer = setTimeout(() => {
        if (cancelled) return;
        const pool = offersRef.current;
        if (!pool.length) {
          scheduleNext();
          return;
        }

        const offer = pool[Math.floor(Math.random() * pool.length)]!;
        let username = pickUsername();
        let key = `${username}:${offer.id}`;
        let guard = 0;
        // Avoid immediately repeating the same username + offer combination.
        while (key === lastKeyRef.current && guard < 5) {
          username = pickUsername();
          key = `${username}:${offer.id}`;
          guard += 1;
        }
        lastKeyRef.current = key;

        setActivity({
          username,
          offerTitle: offer.title,
          reward: Number(offer.reward_amount),
          offerImageUrl: offer.image_url ?? null,
          // Some activities show an avatar, some don't.
          avatar:
            Math.random() < 0.55
              ? AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)]!
              : null,
        });
        setVisible(true);

        const visibleDuration = randomBetween(4000, 7000);
        hideTimer = setTimeout(() => {
          if (cancelled) return;
          setVisible(false);
          scheduleNext();
        }, visibleDuration);
      }, delay);
    }

    scheduleNext();

    return () => {
      cancelled = true;
      if (delayTimer) clearTimeout(delayTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [enabled]);

  return { activity, visible };
}
