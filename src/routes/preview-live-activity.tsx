/**
 * TEMPORARY preview route for reviewing the Simulated Live Activity strip.
 *
 * Exists only so the card can be inspected without signing in and without
 * waiting out the random 8-25s appearance delay. It seeds the real
 * ["featured-feed","home"] cache key with sample offers so the live component
 * behaves exactly as it does on Home.
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

/** Stand-in offers shaped like FeaturedOffer, only for this preview page. */
const SAMPLE_OFFERS = [
  {
    id: "sample-1",
    title: "Survey Junkie — Paid Surveys",
    reward_amount: 1.25,
    image_url: null,
  },
  { id: "sample-2", title: "Temu — Install & Explore", reward_amount: 2.4, image_url: null },
  { id: "sample-3", title: "Coin Master — Reach Level 5", reward_amount: 0.85, image_url: null },
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

  // Seed the same cache key the Home page uses, so the live component finds offers.
  useEffect(() => {
    queryClient.setQueryData(["featured-feed", "home"], {
      country: "IN",
      offers: SAMPLE_OFFERS,
    });
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
        Appears after 8–25s, stays 4–7s, then collapses. Leave this open to watch the cycle.
      </p>
      <div className="mt-1 rounded-xl border border-dashed border-border p-2">
        <SimulatedLiveActivity />
      </div>
    </main>
  );
}
