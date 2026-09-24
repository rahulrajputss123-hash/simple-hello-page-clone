import { useEffect, useMemo, useState } from "react";

import { LiveActivityCard } from "@/components/SimulatedLiveActivity";
import { SHOWCASE_OFFERS } from "@/components/landing/landing-data";
import {
  useSimulatedActivityFeed,
  type ActivityItem,
  type SimulatedActivity,
} from "@/hooks/useSimulatedActivityFeed";

/** How many rows stay on screen before the oldest drops off. */
const MAX_ROWS = 4;

/** Opacity by age, so older rows visibly fade out before being dropped. */
const AGE_OPACITY = [1, 0.82, 0.58, 0.34];

/**
 * "Live earnings" strip for the web landing page.
 *
 * Reuses the app's simulation wholesale: `useSimulatedActivityFeed` for the timing
 * and username/payout selection, and `LiveActivityCard` for the row itself.
 *
 * The app's own `SimulatedLiveActivity` can't be dropped in here, because it reads
 * the authenticated offer/quest react-query caches through `skipToken` and would
 * render nothing on a public page. This component supplies the same
 * `ActivityItem[]` shape from the real showcase offers instead, and stacks the
 * hook's rotating single activity into a short list so new rows slide in from the
 * top while older ones fade.
 *
 * Labelled as simulated: the rows pair real offers and real payout amounts with
 * placeholder usernames, so it would be misleading to present them as live users.
 */
export function LiveEarningsFeed() {
  const items = useMemo<ActivityItem[]>(
    () =>
      SHOWCASE_OFFERS.map((offer) => ({
        id: offer.id,
        title: offer.title,
        reward_amount: offer.rewardAmount,
        // null so the card uses its own jade gift tile: the landing artwork is a
        // tall card on black and would crop badly into a 36px thumbnail.
        image_url: null,
      })),
    [],
  );

  const current = useSimulatedActivityFeed(items);
  const [rows, setRows] = useState<SimulatedActivity[]>([]);

  useEffect(() => {
    if (!current) return;
    setRows((previous) =>
      previous[0]?.id === current.id ? previous : [current, ...previous].slice(0, MAX_ROWS),
    );
  }, [current]);

  return (
    <section data-testid="live-earnings-feed" aria-labelledby="live-earnings-heading">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary ring-1 ring-inset ring-mint/25">
          <span className="relative grid size-1.5 place-items-center">
            <span className="payout-live-dot absolute inset-0 rounded-full bg-primary" />
            <span className="size-1.5 rounded-full bg-primary" />
          </span>
          Simulated activity
        </span>
        <h2
          id="live-earnings-heading"
          className="mt-3 font-display text-[1.6rem] leading-tight text-foreground sm:text-[2rem]"
        >
          Live <span className="text-gold-dark">earnings</span>
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          A sample of the payouts running through CashGPT. Offers and amounts are real; names are
          placeholders.
        </p>
      </div>

      {/* Height is reserved for the full stack so rows arriving never shift the page.
          Flex (not grid) keeps the rows packed at the top instead of stretching them
          across the reserved space while the feed is still filling up. */}
      <div
        className="mx-auto mt-6 flex max-w-lg flex-col gap-2"
        style={{ minHeight: `${MAX_ROWS * 64}px` }}
        aria-live="polite"
        aria-atomic="false"
        data-testid="live-earnings-rows"
      >
        {rows.map((row, index) => (
          // Keying on the activity id replays the live-activity-in slide/fade for
          // each new row, which styles.css already disables under reduced motion.
          <div
            key={row.id}
            style={{ opacity: AGE_OPACITY[index] ?? 0.3 }}
            className="transition-opacity duration-700"
          >
            <LiveActivityCard activity={row} />
          </div>
        ))}
      </div>
    </section>
  );
}
