import { AlertTriangle, ArrowUpRight, Check, ExternalLink, Info, Loader2, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AppBottomSheet } from "@/components/AppBottomSheet";
import { Button } from "@/components/ui/button";
import { formatReward } from "@/lib/format-reward";
import { checkInToday, getNetworkQuestProgress, openQuestNetwork } from "@/lib/quests.functions";
import {
  deriveQuestView,
  QUEST_ACCENTS,
  type QuestCardQuest,
  type QuestSessionView,
} from "@/lib/quest-view";
import { useCheckinHeartbeat } from "@/hooks/useCheckinHeartbeat";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

/**
 * Pre-start confirmation sheet for Starter Quests.
 *
 * Quest cards used to fire the mutation (and open the external URL) straight
 * from the card tap. This gates that behind an explicit Continue, mirroring how
 * Featured Offers gate on OfferDetailsDialog. Nothing external happens until
 * `onContinue` runs.
 */
export function QuestDetailsDialog({
  quest,
  active,
  credited = false,
  open,
  onOpenChange,
  onContinue,
  isSubmitting,
}: {
  quest: QuestCardQuest | null;
  /** Active session for this quest, used to show existing progress. */
  active?: QuestSessionView | undefined;
  credited?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  isSubmitting?: boolean;
}) {
  const accent = quest ? QUEST_ACCENTS[quest.quest_type] : null;
  const view = quest ? deriveQuestView(quest, active, credited) : null;
  const started = Boolean(view && view.progress > 0);
  const [checkinSubmitting, setCheckinSubmitting] = useState(false);

  // Checkin quest specific: detect if today is incomplete
  const isCheckin = quest?.quest_type === "checkin";
  const todayIncomplete = isCheckin && active && !credited && (() => {
    const completedDays = active.checkin_days?.filter((d) => d.completed_at) ?? [];
    const todayDay = active.checkin_days?.find((d, idx) => idx === completedDays.length);
    return !todayDay?.completed_at;
  })();

  // Start heartbeat for checkin quests (only when dialog is open and day incomplete)
  const heartbeat = useCheckinHeartbeat({
    questKey: quest?.key ?? "",
    enabled: Boolean(isCheckin && open && todayIncomplete),
    onDayComplete: () => {
      // Refresh the quest data
      onOpenChange(false);
    },
  });

  const ctaLabel = !quest
    ? "Start Quest"
    : isSubmitting
      ? "Opening…"
      : checkinSubmitting
        ? "Checking In…"
        : quest.quest_type === "ads"
          ? "Watch Ads"
          : quest.quest_type === "shortlink"
            ? started
              ? "Continue"
              : "Start Quest"
            : quest.quest_type === "checkin"
              ? quest.required_active_seconds === 0
                ? "Check In"
                : "Keep App Open"
              : "Complete Locker";

  const handleCheckinTap = async () => {
    if (!quest || quest.required_active_seconds !== 0) return;
    setCheckinSubmitting(true);
    try {
      await checkInToday({ questKey: quest.key });
      onOpenChange(false);
    } catch (error) {
      console.error("Check-in failed:", error);
    } finally {
      setCheckinSubmitting(false);
    }
  };

  if (!open || !quest) return null;

  return (
    <AppBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={quest.label}
      footer={
        quest?.quest_type === "network" ? (
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
            data-testid="quest-details-close"
          >
            Close
          </Button>
        ) : (
        <div className="flex w-full gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="quest-details-cancel"
          >
            Cancel
          </Button>
          {quest?.quest_type === "checkin" ? (
            quest.required_active_seconds === 0 ? (
              <Button
                variant="jade"
                className="flex-1"
                onClick={handleCheckinTap}
                disabled={checkinSubmitting || !quest || credited}
                data-testid="quest-details-checkin"
              >
                {ctaLabel}
              </Button>
            ) : (
              <Button
                variant="jade"
                className="flex-1"
                disabled
                data-testid="quest-details-active"
              >
                <Play className="mr-1 size-3.5" />
                {Math.floor(heartbeat.activeSeconds)}s / {heartbeat.requiredSeconds}s
              </Button>
            )
          ) : (
            <Button
              variant="jade"
              className="flex-1"
              onClick={onContinue}
              disabled={isSubmitting || !quest}
              data-testid="quest-details-continue"
            >
              {ctaLabel}
              <ArrowUpRight className="ml-1 size-3.5" />
            </Button>
          )}
        </div>
        )
      }
    >
      <div className="space-y-4" data-testid="quest-details-dialog">
        <div className="flex items-start gap-3">
          {accent && (
            <span
              aria-hidden
              className="grid size-10 shrink-0 place-items-center rounded-xl text-white"
              style={{
                background: accent.tile,
                boxShadow: `0 6px 14px -4px ${accent.tileShadow}`,
              }}
            >
              <accent.icon className="size-5" strokeWidth={2} />
            </span>
          )}
          <div className="min-w-0 flex-1 text-left">
            <p className="text-amount text-sm text-gold-dark" data-testid="quest-details-reward">
              {(() => {
                if (quest.quest_type === "ads") {
                  return formatReward(quest.reward_amount);
                }
                if (quest.quest_type === "network") {
                  // Network quests: sum all step rewards + completion bonus
                  const requiredCount = quest.required_count ?? 3;
                  const baseReward = quest.step_reward ?? 0;
                  const customRewards = quest.step_rewards ?? [];
                  let totalStepRewards = 0;
                  for (let i = 0; i < requiredCount; i++) {
                    totalStepRewards += customRewards[i] !== undefined ? customRewards[i] : baseReward;
                  }
                  return formatReward(totalStepRewards + quest.reward_amount);
                }
                // Step-based quests: show total reward
                const stepCount = quest.quest_type === "shortlink" 
                  ? quest.shortlink_steps.length 
                  : quest.quest_type === "checkin"
                    ? quest.total_days ?? 3
                    : quest.locker_urls.length;
                const baseReward = quest.step_reward ?? 0;
                const customRewards = quest.step_rewards ?? [];
                let totalStepRewards = 0;
                for (let i = 0; i < stepCount; i++) {
                  totalStepRewards += customRewards[i] !== undefined ? customRewards[i] : baseReward;
                }
                return formatReward(totalStepRewards + quest.reward_amount);
              })()}
            </p>
            {accent && (
              <span
                data-testid="quest-details-badge"
                className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.07em]"
                style={{ background: accent.badgeBg, color: accent.badgeInk }}
              >
                {accent.label}
              </span>
            )}
          </div>
        </div>

        {view && (
          <section className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              About this quest
            </p>
            <p className="text-sm leading-relaxed" data-testid="quest-details-description">
              {view.description}
            </p>
          </section>
        )}

        {view && (quest.quest_type === "shortlink" || quest.quest_type === "locker") && (
          <section className="space-y-2" data-testid="quest-details-rewards">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Rewards
            </p>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
              <ul className="space-y-1.5">
                {(() => {
                  const stepCount = view.total;
                  const baseReward = quest.step_reward ?? 0;
                  const customRewards = quest.step_rewards ?? [];
                  const completionBonus = quest.reward_amount;
                  const currentProgress = view.progress;
                  
                  const steps = Array.from({ length: stepCount }, (_, i) => {
                    const stepNum = i + 1;
                    const stepReward = customRewards[i] !== undefined ? customRewards[i] : baseReward;
                    const isCompleted = stepNum <= currentProgress;
                    return { stepNum, stepReward, isCompleted };
                  });

                  return (
                    <>
                      {steps.map(({ stepNum, stepReward, isCompleted }) => (
                        <li
                          key={stepNum}
                          className="flex items-center justify-between gap-2"
                          data-testid={`quest-reward-step-${stepNum}`}
                        >
                          <span className={isCompleted ? "text-muted-foreground line-through" : ""}>
                            Step {stepNum}
                          </span>
                          <span className="flex items-center gap-1.5 font-semibold tabular-nums">
                            {isCompleted && <span className="text-xs text-primary">✓</span>}
                            {formatReward(stepReward)}
                          </span>
                        </li>
                      ))}
                      {completionBonus > 0 && (
                        <li
                          className="flex items-center justify-between gap-2 border-t border-primary/20 pt-1.5"
                          data-testid="quest-reward-completion"
                        >
                          <span className={credited ? "text-muted-foreground line-through" : ""}>
                            Completion bonus
                          </span>
                          <span className="flex items-center gap-1.5 font-semibold tabular-nums">
                            {credited && <span className="text-xs text-primary">✓</span>}
                            {formatReward(completionBonus)}
                          </span>
                        </li>
                      )}
                      <li
                        className="flex items-center justify-between gap-2 border-t border-primary/30 pt-1.5 text-base font-bold text-primary"
                        data-testid="quest-reward-total"
                      >
                        <span>Total</span>
                        <span className="tabular-nums">
                          {formatReward(
                            steps.reduce((sum, s) => sum + s.stepReward, 0) + completionBonus
                          )}
                        </span>
                      </li>
                    </>
                  );
                })()}
              </ul>
            </div>
          </section>
        )}

        {/* Checkin-specific rewards breakdown */}
        {view && quest.quest_type === "checkin" && (
          <section className="space-y-2" data-testid="quest-details-checkin-rewards">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Daily Rewards
            </p>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
              <ul className="space-y-1.5">
                {(() => {
                  const totalDays = view.total;
                  const baseReward = quest.step_reward ?? 0;
                  const customRewards = quest.step_rewards ?? [];
                  const completionBonus = quest.reward_amount;
                  const completedDays = active?.checkin_days?.filter((d) => d.completed_at) ?? [];
                  
                  const days = Array.from({ length: totalDays }, (_, i) => {
                    const dayNum = i + 1;
                    const dayReward = customRewards[i] !== undefined ? customRewards[i] : baseReward;
                    const isCompleted = i < completedDays.length;
                    return { dayNum, dayReward, isCompleted };
                  });

                  return (
                    <>
                      {days.map(({ dayNum, dayReward, isCompleted }) => (
                        <li
                          key={dayNum}
                          className="flex items-center justify-between gap-2"
                          data-testid={`quest-reward-day-${dayNum}`}
                        >
                          <span className={isCompleted ? "text-muted-foreground line-through" : ""}>
                            Day {dayNum}
                          </span>
                          <span className="flex items-center gap-1.5 font-semibold tabular-nums">
                            {isCompleted && <span className="text-xs text-primary">✓</span>}
                            {formatReward(dayReward)}
                          </span>
                        </li>
                      ))}
                      {completionBonus > 0 && (
                        <li
                          className="flex items-center justify-between gap-2 border-t border-primary/20 pt-1.5"
                          data-testid="quest-reward-completion"
                        >
                          <span className={credited ? "text-muted-foreground line-through" : ""}>
                            Completion bonus
                          </span>
                          <span className="flex items-center gap-1.5 font-semibold tabular-nums">
                            {credited && <span className="text-xs text-primary">✓</span>}
                            {formatReward(completionBonus)}
                          </span>
                        </li>
                      )}
                      <li
                        className="flex items-center justify-between gap-2 border-t border-primary/30 pt-1.5 text-base font-bold text-primary"
                        data-testid="quest-reward-total"
                      >
                        <span>Total</span>
                        <span className="tabular-nums">
                          {formatReward(
                            days.reduce((sum, d) => sum + d.dayReward, 0) + completionBonus
                          )}
                        </span>
                      </li>
                    </>
                  );
                })()}
              </ul>
            </div>
          </section>
        )}

        {view && started && (
          <section className="space-y-1" data-testid="quest-details-progress">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Your progress
            </p>
            <p className="text-sm leading-relaxed">
              <span className="font-semibold [font-variant-numeric:tabular-nums]">
                {view.progress} / {view.total}
              </span>{" "}
              <span className="text-muted-foreground">
                complete — {view.remaining} more to finish.
              </span>
            </p>
          </section>
        )}

        {quest.quest_type === "shortlink" && view && (
          <section
            className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-primary"
            data-testid="quest-details-step"
          >
            <Info className="size-4 shrink-0" />
            <span>
              You&apos;re about to start <strong>step {view.nextStep}</strong> of {view.total}. Stay
              on the page for at least {quest.min_seconds_per_step} seconds, then you&apos;ll be
              sent back automatically.
            </span>
          </section>
        )}

        {quest.quest_type === "checkin" && view && (
          <section
            className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-primary"
            data-testid="quest-details-checkin-info"
          >
            <Info className="size-4 shrink-0" />
            <span>
              {quest.required_active_seconds === 0 ? (
                <>
                  Tap <strong>Check In</strong> once each day to maintain your streak. Come back
                  daily to earn rewards!
                </>
              ) : (
                <>
                  Keep the app open and focused for <strong>{quest.required_active_seconds}s</strong>
                  {" "}each day. We track your active time automatically. Your progress:
                  {" "}<strong>{Math.floor(heartbeat.activeSeconds)}s / {heartbeat.requiredSeconds}s</strong>
                </>
              )}
            </span>
          </section>
        )}

        {/* Network quest: provider grid */}
        {quest.quest_type === "network" && (
          <NetworkQuestProviderGrid
            quest={quest}
            active={active}
            credited={credited}
            open={open}
          />
        )}

        <section
          className="space-y-1 rounded-xl border border-destructive/30 bg-destructive/5 p-3"
          data-testid="quest-details-rules"
        >
          <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-destructive">
            <AlertTriangle className="size-3.5" />
            Before you start
          </p>
          <p className="text-sm leading-relaxed text-destructive">
            Complete the required action fully — closing early won&apos;t count. No VPN, no multiple
            accounts and no emulators, or the reward may be withheld.
          </p>
        </section>
      </div>
    </AppBottomSheet>
  );
}

/**
 * Network quest provider grid component.
 * Shows providers with completion status, handles opening offerwalls, and polls for updates.
 */
function NetworkQuestProviderGrid({
  quest,
  active,
  credited,
  open,
}: {
  quest: QuestCardQuest;
  active?: QuestSessionView;
  credited: boolean;
  open: boolean;
}) {
  const queryClient = useQueryClient();
  const fetchProgress = useServerFn(getNetworkQuestProgress);
  const openNetwork = useServerFn(openQuestNetwork);
  const [opening, setOpening] = useState<string | null>(null);
  const openedWindowRef = useRef<Window | null>(null);

  // Fetch network quest progress
  const { data: progress, refetch } = useQuery({
    queryKey: ["network-quest-progress", quest.key],
    queryFn: () => fetchProgress({ questKey: quest.key }),
    enabled: open && !credited,
    refetchInterval: 5000, // Poll every 5s while dialog is open
  });

  // Poll on window focus
  useEffect(() => {
    if (!open || credited) return;

    const handleFocus = () => {
      void refetch();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [open, credited, refetch]);

  const handleProviderClick = async (providerId: string) => {
    if (opening || credited) return;

    setOpening(providerId);

    try {
      // Pre-open the tab synchronously to avoid popup blockers
      const newWindow = window.open("about:blank", "_blank");
      openedWindowRef.current = newWindow;

      // Get the offerwall URL
      const result = await openNetwork({ questKey: quest.key, providerId });

      if ("url" in result && result.url) {
        // Navigate the pre-opened tab to the actual URL
        if (newWindow) {
          newWindow.location.href = result.url;
        }
      } else {
        // Close the tab if we couldn't get a URL
        newWindow?.close();
        console.error("Failed to open network:", result);
      }

      // Refetch progress after a delay
      setTimeout(() => {
        void refetch();
      }, 1000);
    } catch (error) {
      console.error("Error opening network:", error);
      openedWindowRef.current?.close();
    } finally {
      setOpening(null);
    }
  };

  // Calculate rewards
  const requiredCount = quest.required_count ?? 3;
  const baseReward = quest.step_reward ?? 0;
  const customRewards = quest.step_rewards ?? [];
  let totalStepRewards = 0;
  for (let i = 0; i < requiredCount; i++) {
    totalStepRewards += customRewards[i] !== undefined ? customRewards[i] : baseReward;
  }
  const completionBonus = quest.reward_amount;
  const totalReward = totalStepRewards + completionBonus;

  const providers = progress?.providers ?? [];
  const doneCount = progress?.done ?? 0;
  const required = progress?.required ?? requiredCount;

  return (
    <>
      {/* Providers section */}
      <section className="space-y-2" data-testid="quest-details-network-providers">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Complete offers from {required} {required === 1 ? "network" : "networks"}
        </p>
        
        <div className="grid grid-cols-2 gap-2">
          {providers.map((provider) => {
            const isDone = provider.done;
            const isOpening = opening === provider.providerId;

            return (
              <button
                key={provider.providerId}
                onClick={() => !isDone && handleProviderClick(provider.providerId)}
                disabled={isDone || isOpening || credited}
                className={`
                  relative flex min-h-[80px] flex-col items-center justify-center gap-2 rounded-xl border p-3 transition-all
                  ${isDone 
                    ? "border-primary/30 bg-primary/10 cursor-default" 
                    : "border-primary/20 bg-background hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
                  }
                  ${isOpening ? "opacity-50" : ""}
                `}
                data-testid={`network-provider-${provider.providerId}`}
              >
                {provider.logoUrl ? (
                  <img
                    src={provider.logoUrl}
                    alt={provider.name}
                    className="h-8 w-auto object-contain"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    {provider.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                
                <span className="text-center text-xs font-medium">
                  {provider.name}
                </span>

                {isDone && (
                  <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </div>
                )}

                {isOpening && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/80">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-2 text-center text-sm">
          <span className="font-semibold [font-variant-numeric:tabular-nums]">
            {doneCount} / {required}
          </span>
          <span className="text-muted-foreground"> networks completed</span>
        </div>
      </section>

      {/* Rewards section */}
      <section className="space-y-2" data-testid="quest-details-network-rewards">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Rewards
        </p>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
          <ul className="space-y-1.5">
            <li className="flex items-center justify-between gap-2">
              <span>Per-network reward</span>
              <span className="font-semibold tabular-nums">
                {formatReward(baseReward)} × {required}
              </span>
            </li>
            {completionBonus > 0 && (
              <li className="flex items-center justify-between gap-2 border-t border-primary/20 pt-1.5">
                <span>Completion bonus</span>
                <span className="font-semibold tabular-nums">
                  {formatReward(completionBonus)}
                </span>
              </li>
            )}
            <li className="flex items-center justify-between gap-2 border-t border-primary/30 pt-1.5 text-base font-bold text-primary">
              <span>Total</span>
              <span className="tabular-nums">{formatReward(totalReward)}</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Instructions */}
      <section
        className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-primary"
        data-testid="quest-details-network-info"
      >
        <Info className="size-4 shrink-0" />
        <span>
          Tap a network above to open its offerwall. Complete an <strong>offer, survey, or task</strong> inside the network.
          PTC and shortlinks may not count if below the minimum payout threshold ($
          {(quest.min_qualifying_usd ?? 0.01).toFixed(2)}).
        </span>
      </section>
    </>
  );
}
