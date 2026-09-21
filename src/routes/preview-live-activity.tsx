/**
 * TEMPORARY preview route for reviewing the Simulated Live Activity strip.
 *
 * Exists only so the card can be inspected without signing in. It seeds the
 * real ["featured-feed","home"] cache key with sample offers so the live
 * component behaves exactly as it does on Home.
 *
 * SAFE TO DELETE — remove this file before committing.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { LiveActivityCard, SimulatedLiveActivity } from "@/components/SimulatedLiveActivity";
import { DUMMY_USERNAMES, type SimulatedActivity } from "@/hooks/useSimulatedActivityFeed";
import { AVATAR_OPTIONS } from "@/lib/onboarding/premium";

export const Route = createFileRoute("/preview-live-activity")({
  ssr: false,
  component: PreviewLiveActivity,
});

/**
 * Stand-in offers shaped like FeaturedOffer, only for this preview page.
 * Spread across payout tiers so the weighted selection is observable, and two
 * entries above the $50.00 cap that must NEVER appear in the strip.
 */
const SAMPLE_OFFERS = [
  { id: "sample-1", title: "Survey Junkie — Paid Surveys", reward_amount: 0.35, image_url: null },
  { id: "sample-2", title: "Temu — Install & Explore", reward_amount: 0.8, image_url: null },
  { id: "sample-3", title: "Coin Master — Reach Level 5", reward_amount: 1.25, image_url: null },
  { id: "sample-4", title: "Shop & Save App", reward_amount: 2.4, image_url: null },
  { id: "sample-5", title: "CapCut — Video Editor", reward_amount: 4.5, image_url: null },
  { id: "sample-6", title: "HostingTom — 110% Cashback", reward_amount: 10, image_url: null },
  { id: "sample-7", title: "At the cap — $50.00 (allowed)", reward_amount: 50, image_url: null },
  {
    id: "over-cap-1",
    title: "OVER CAP $50.01 — must never show",
    reward_amount: 50.01,
    image_url: null,
  },
  {
    id: "over-cap-2",
    title: "OVER CAP $250 — must never show",
    reward_amount: 250,
    image_url: null,
  },
];

/**
 * Stand-in active quests, seeding the same ["quests-active"] cache key Home
 * fills — the feed's second (and only other) source.
 */
const SAMPLE_QUESTS = [
  { id: "quest-1", label: "Watch 5 Ads", reward_amount: 0.5, icon: "gift" },
  { id: "quest-2", label: "Shortlink Chain", reward_amount: 1, icon: "gift" },
  { id: "quest-3", label: "Complete Locker", reward_amount: 1.5, icon: "gift" },
];

const VARIANTS: SimulatedActivity[] = [
  {
    id: "v1",
    username: "Alex***",
    avatarUrl: AVATAR_OPTIONS[0]?.imageUrl ?? null,
    offerId: "sample-1",
    offerTitle: "Survey Junkie — Paid Surveys",
    offerImageUrl: AVATAR_OPTIONS[3]?.imageUrl ?? null,
    rewardAmount: 1.25,
  },
  {
    id: "v2",
    username: "User_8291",
    avatarUrl: null,
    offerId: "sample-2",
    offerTitle: "Temu — Install & Explore",
    offerImageUrl: AVATAR_OPTIONS[5]?.imageUrl ?? null,
    rewardAmount: 2.4,
  },
  {
    id: "v3",
    username: "Priya**",
    avatarUrl: AVATAR_OPTIONS[7]?.imageUrl ?? null,
    offerId: "sample-3",
    offerTitle: "Coin Master — Reach Level 5 and claim your bonus reward today",
    offerImageUrl: null,
    rewardAmount: 0.85,
  },
];

function PreviewLiveActivity() {
  const queryClient = useQueryClient();

  // Seed the same two cache keys the Home page fills, so the live component
  // finds both of its sources.
  useEffect(() => {
    queryClient.setQueryData(["featured-feed", "home"], {
      country: "IN",
      offers: SAMPLE_OFFERS,
    });
    queryClient.setQueryData(["quests-active"], SAMPLE_QUESTS);
  }, [queryClient]);

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <h1 className="font-display text-xl text-primary">Live Activity — preview</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Temporary review page. Not a real route; delete before commit.
      </p>

      <h2 className="mt-6 text-sm font-semibold">All visual variants (always visible)</h2>
      <p className="mt-1 text-[11px] text-muted-foreground">
        With avatar + offer image · no avatar · long title with fallback offer glyph.
      </p>
      <div className="mt-3 space-y-3">
        {VARIANTS.map((variant) => (
          <LiveActivityCard key={variant.id} activity={variant} />
        ))}
      </div>

      <h2 className="mt-8 text-sm font-semibold">Live behaviour (real timings)</h2>
      <p className="mt-1 text-[11px] text-muted-foreground">
        First activity appears after ~1.2s, then each one is replaced in place every 6–12s. It never
        disappears in between — leave this open to watch the stream.
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Pool = 7 offers + 3 quests. Low payouts should dominate; $10 and $50 should be rare. The two
        &quot;OVER CAP&quot; entries must never appear.
      </p>
      <div className="mt-1 rounded-xl border border-dashed border-border p-2">
        <SimulatedLiveActivity />
      </div>
    </main>
  );
}
