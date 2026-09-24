import { skipToken, useQuery } from "@tanstack/react-query";
import { Gift, UserRound } from "lucide-react";
import { useMemo } from "react";

import {
  useSimulatedActivityFeed,
  type ActivityItem,
  type SimulatedActivity,
} from "@/hooks/useSimulatedActivityFeed";
import { formatMoney } from "@/lib/coinquest";
import type { FeaturedFeedResult } from "@/lib/offers/feed-cache.server";
import type { QuestRow } from "@/lib/quests.server";

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
          decoding="async"
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
          decoding="async"
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

/** A quest icon doubles as an image URL when it is one; otherwise there is none. */
function questImageUrl(icon: string | null | undefined): string | null {
  const value = (icon ?? "").trim();
  return /^https?:\/\//i.test(value) ? value : null;
}

/**
 * Compact simulated "live activity" strip for the Home page.
 *
 * The pool is built from exactly TWO sources, both already loaded by this page:
 *   1. Featured/regular offers — the cache entry <FeaturedOffers scope="home" />
 *      fills, so GEO filtering, active/expiry filtering and per-user hiding are
 *      all inherited from the existing feed.
 *   2. Active quests — the cache entry <StarterQuests /> fills.
 *
 * Offerwall data is deliberately NOT a source.
 *
 * `skipToken` on both observers means this component only *reads* those caches
 * and never issues a request of its own, so neither the GEO logic nor the quest
 * system is duplicated here.
 *
 * Purely presentational: nothing here writes data or triggers tracking.
 */
export function SimulatedLiveActivity() {
  const { data } = useQuery<FeaturedFeedResult>({
    queryKey: ["featured-feed", "home"],
    queryFn: skipToken,
  });

  const { data: quests } = useQuery<QuestRow[]>({
    queryKey: ["quests-active"],
    queryFn: skipToken,
  });

  const items = useMemo<ActivityItem[]>(() => {
    const offerItems: ActivityItem[] = (data?.offers ?? []).map((offer) => ({
      id: offer.id,
      title: offer.title,
      reward_amount: offer.reward_amount,
      image_url: offer.image_url,
    }));

    const questItems: ActivityItem[] = (quests ?? []).map((quest) => ({
      id: `quest:${quest.id}`,
      title: quest.label,
      reward_amount: Number(quest.reward_amount ?? 0),
      image_url: questImageUrl(quest.icon),
    }));

    return [...offerItems, ...questItems];
  }, [data?.offers, quests]);

  const activity = useSimulatedActivityFeed(items);

  return (
    <div
      // grid-rows 0fr→1fr animates the one-time reveal of the first activity so
      // the banner below never jumps. After that the slot stays at 1fr for good:
      // the feed replaces activities in place and never collapses again, so the
      // container height is stable and there is no blank gap between activities.
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
            {/* Keying on activity.id swaps the card synchronously — React mounts
                the replacement in the same commit the old one unmounts, so no
                frame renders empty — and replays the live-activity-in slide/fade
                for the incoming activity. That keyframe is already disabled
                under prefers-reduced-motion in styles.css. */}
            <LiveActivityCard key={activity.id} activity={activity} />
          </div>
        )}
      </div>
    </div>
  );
}
