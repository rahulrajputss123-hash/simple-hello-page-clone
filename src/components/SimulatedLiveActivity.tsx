import { Gift } from "lucide-react";
import { useEffect, useState } from "react";

import { formatMoney } from "@/lib/coinquest";
import { useSimulatedActivityFeed } from "@/hooks/useSimulatedActivityFeed";

/**
 * Simulated Live User Activity Feed.
 *
 * UI-only: shows a rotating, anonymized "someone just earned" notification
 * built from REAL, GEO-filtered active offers (via `useSimulatedActivityFeed`,
 * which reuses the same offer feed/cache as `FeaturedOffers`). No fake users,
 * claims, transactions, wallet changes, or postbacks are created — this
 * component only renders a transient card.
 *
 * Placement: rendered on Home directly below the top header and above the
 * "7 Ways to Earn" banner (see `src/routes/_authenticated/home.tsx`).
 */
export function SimulatedLiveActivity() {
  const { activity, visible } = useSimulatedActivityFeed();
  const [imageBroken, setImageBroken] = useState(false);

  // Reset the broken-image flag whenever a new activity/offer image comes in.
  useEffect(() => {
    setImageBroken(false);
  }, [activity?.offerImageUrl]);

  if (!activity) return null;

  return (
    <div
      aria-live="polite"
      className="mb-3 mt-1 px-0.5"
      data-testid="simulated-live-activity"
    >
      <div
        className={`surface-card flex items-center gap-2.5 !rounded-2xl !p-2.5 shadow-soft transition-all duration-500 ease-out ${
          visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        {activity.avatar ? (
          <span
            className={`grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br ${activity.avatar.tone} text-base text-white shadow-soft`}
            data-testid="simulated-activity-avatar"
          >
            {activity.avatar.imageUrl ? (
              <img
                src={activity.avatar.imageUrl}
                alt=""
                className="size-full object-cover"
                loading="lazy"
              />
            ) : (
              <span aria-hidden>{activity.avatar.symbol}</span>
            )}
          </span>
        ) : (
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mint/15 text-primary">
            <span className="relative grid size-2 place-items-center">
              <span className="payout-live-dot absolute inset-0 rounded-full bg-mint" />
              <span className="size-2 rounded-full bg-mint" />
            </span>
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs leading-tight text-foreground">
            <span className="font-semibold">{activity.username}</span>{" "}
            <span className="text-muted-foreground">completed</span>{" "}
            <span className="font-semibold">{activity.offerTitle}</span>
          </p>
          <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
            Earned{" "}
            <span className="text-amount font-bold text-gold-dark">
              +{formatMoney(activity.reward)}
            </span>
          </p>
        </div>

        <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-xl bg-background-alt text-primary">
          {activity.offerImageUrl && !imageBroken ? (
            <img
              src={activity.offerImageUrl}
              alt=""
              className="size-full object-cover"
              loading="lazy"
              onError={() => setImageBroken(true)}
            />
          ) : (
            <Gift className="size-4" />
          )}
        </span>
      </div>
    </div>
  );
}
