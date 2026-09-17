import { skipToken, useQuery } from "@tanstack/react-query";
import { Gift, UserRound } from "lucide-react";
import { useMemo } from "react";

import {
  useSimulatedActivityFeed,
  type ActivityOffer,
  type SimulatedActivity,
} from "@/hooks/useSimulatedActivityFeed";
import { formatMoney } from "@/lib/coinquest";
import type { FeaturedFeedResult } from "@/lib/offers/feed-cache.server";

/**
 * Presentational activity row. Kept separate from the timing/data wiring so it can
 * be rendered in isolation for visual review.
 */
export function LiveActivityCard({ activity }: { activity: SimulatedActivity }) {
  return (
    <article
      className="live-activity-card surface-card flex items-center gap-2.5 p-2.5 shadow-soft"
      data-testid="live-activity-card"
    >
      {activity.avatarUrl ? (
        <img
          src={activity.avatarUrl}
          alt=""
          aria-hidden
          loading="lazy"
          className="size-9 shrink-0 rounded-full border border-border object-cover"
          data-testid="live-activity-avatar"
        />
      ) : (
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-full bg-mint/15 text-primary ring-1 ring-inset ring-mint/25"
        >
          <UserRound className="size-4" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] leading-tight" data-testid="live-activity-text">
          <span className="font-semibold text-foreground">{activity.username}</span>
          <span className="text-muted-foreground"> completed </span>
          <span className="font-medium text-foreground">{activity.offerTitle}</span>
        </p>
        <p className="mt-1 flex items-center gap-1.5 leading-none">
          <span className="relative grid size-1.5 shrink-0 place-items-center" aria-hidden>
            <span className="payout-live-dot absolute inset-0 rounded-full bg-mint" />
            <span className="size-1.5 rounded-full bg-mint" />
          </span>
          <span className="text-amount text-[12px] leading-none text-gold-dark">
            Earned +{formatMoney(activity.rewardAmount)}
          </span>
        </p>
      </div>

      {activity.offerImageUrl ? (
        <img
          src={activity.offerImageUrl}
          alt=""
          aria-hidden
          loading="lazy"
          className="size-9 shrink-0 rounded-xl border border-border object-cover"
          data-testid="live-activity-offer-image"
        />
      ) : (
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-xl bg-jade-gradient text-primary-foreground"
        >
          <Gift className="size-4" />
        </span>
      )}
    </article>
  );
}

/**
 * Compact simulated "live activity" strip for the Home page.
 *
 * Offers come from the cache entry that <FeaturedOffers scope="home" /> already
 * fills on this page — `skipToken` means this observer only *reads* that cache and
 * never issues its own request, so GEO filtering, active/expiry filtering and
 * per-user hiding are all inherited from the existing feed with no duplication.
 *
 * Purely presentational: nothing here writes data or triggers tracking.
 */
export function SimulatedLiveActivity() {
  const { data } = useQuery<FeaturedFeedResult>({
    queryKey: ["featured-feed", "home"],
    queryFn: skipToken,
  });

  const offers = useMemo<ActivityOffer[]>(
    () =>
      (data?.offers ?? []).map((offer) => ({
        id: offer.id,
        title: offer.title,
        reward_amount: offer.reward_amount,
        image_url: offer.image_url,
      })),
    [data?.offers],
  );

  const activity = useSimulatedActivityFeed(offers);

  return (
    <div
      // grid-rows 0fr→1fr animates the collapse so the banner below never jumps.
      className={`live-activity-slot grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        activity ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
      aria-live="polite"
      aria-atomic="true"
      data-testid="live-activity-slot"
    >
      <div className="overflow-hidden">
        {activity && (
          <div className="pt-3">
            <LiveActivityCard key={activity.id} activity={activity} />
          </div>
        )}
      </div>
    </div>
  );
}
