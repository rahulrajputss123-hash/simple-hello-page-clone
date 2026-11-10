import { Check, Loader2, LockKeyhole, Clock } from "lucide-react";
import { memo } from "react";

import { formatReward } from "@/lib/format-reward";
import {
  CREDITED_ACCENT,
  deriveQuestView,
  LOCKED_ACCENT,
  QUEST_ACCENTS,
  type QuestCardQuest,
  type QuestSessionView,
} from "@/lib/quest-view";
import { ActiveTimeProgress } from "@/components/ActiveTimeProgress";
import { QuestTimer, CheckinDayDotsCompact, CompactTimer, NextDayCountdown } from "@/components/QuestTimer";

// Re-exported so existing importers of these types keep working. Type-only, so
// this does not reintroduce a non-component runtime export.
export type { QuestCardQuest, QuestSessionView } from "@/lib/quest-view";

type QuestCardProps = {
  quest: QuestCardQuest;
  active?: QuestSessionView | undefined;
  credited: boolean;
  busy: boolean;
  lockLabel: string | null;
  /**
   * Opens the quest details dialog. The card never starts the quest itself —
   * the external URL / ad is only triggered from the dialog's Continue button,
   * mirroring how Featured Offers gate on OfferDetailsDialog.
   */
  onOpenDetails: () => void;
  onLocked: () => void;
  activeTimeQuestKey?: string | null;
  activeTimeProgress?: { last_ping_token: string; total_seconds: number; today_seconds: number } | null;
  activeTimeTracking?: {
    isTracking: boolean;
    isPaused: boolean;
    showStillHerePrompt: boolean;
  };
};

const CARD_W = 240;

/** Display font already loaded in __root.tsx — geometric, for premium onboarding only. */
const DISPLAY_FONT = '"Manrope", "Inter", ui-sans-serif, system-ui, sans-serif';

/* Neutral palette, warm-tinted to sit on the app's cream background. */
const INK = "#0B2B28"; // deep jade, primary text
const INK_SOFT = "#5F726F"; // secondary text
const INK_FAINT = "#94A4A1"; // tertiary / meta text
const HAIRLINE = "#EBE6DD";
const TRACK = "#EDF0EF";

/** Small flat gold coin. Restrained on purpose — no fake specular highlight. */
function CoinMark({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden>
      <defs>
        <linearGradient id="questCoin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F3D274" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>
      </defs>
      <circle cx="8" cy="8" r="7" fill="url(#questCoin)" />
      <circle cx="8" cy="8" r="4.6" fill="none" stroke="#B8912A" strokeOpacity="0.45" />
    </svg>
  );
}

export const QuestCard = memo(function QuestCard({
  quest,
  active,
  credited,
  busy,
  lockLabel,
  onOpenDetails,
  onLocked,
  activeTimeProgress,
  activeTimeTracking,
}: QuestCardProps) {
  const locked = Boolean(quest.is_locked);
  const accent = locked
    ? LOCKED_ACCENT
    : credited
      ? CREDITED_ACCENT
      : (QUEST_ACCENTS[quest.quest_type] ?? QUEST_ACCENTS.ads);
  const TileIcon = accent.icon;

  const { total, progress, remaining, nextStep, progressPercent, description } = deriveQuestView(
    quest,
    active,
    credited,
    activeTimeProgress,
  );

  // Calculate total reward for step-based quests
  const displayReward = (() => {
    if (quest.quest_type === "ads") {
      return quest.reward_amount; // Ads quests: reward_amount is the only reward
    }
    if (quest.quest_type === "survey") {
      // Survey quests: step reward per survey + completion bonus
      const requiredSurveys = quest.required_surveys ?? 5;
      const stepReward = quest.step_reward ?? 0;
      return requiredSurveys * stepReward + quest.reward_amount;
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
      return totalStepRewards + quest.reward_amount;
    }
    if (
      quest.quest_type === "feed_ptc" ||
      quest.quest_type === "feed_shortlink" ||
      quest.quest_type === "feed_article"
    ) {
      // Feed quests: sum all step rewards + completion bonus
      const stepsCount = quest.steps_count ?? 10;
      const baseReward = quest.step_reward ?? 0;
      const customRewards = quest.step_rewards ?? [];
      let totalStepRewards = 0;
      for (let i = 0; i < stepsCount; i++) {
        totalStepRewards += customRewards[i] !== undefined ? customRewards[i] : baseReward;
      }
      return totalStepRewards + quest.reward_amount;
    }
    if (quest.quest_type === "checkin") {
      // Checkin: sum all step rewards (per-day) + completion bonus
      const totalDays = quest.total_days ?? 3;
      const baseReward = quest.step_reward ?? 0;
      const customRewards = quest.step_rewards ?? [];
      let totalStepRewards = 0;
      for (let i = 0; i < totalDays; i++) {
        totalStepRewards += customRewards[i] !== undefined ? customRewards[i] : baseReward;
      }
      return totalStepRewards + quest.reward_amount;
    }
    if (quest.quest_type === "timed_ptc") {
      // Timed PTC: sum all step rewards + completion bonus
      const timedSteps = quest.timed_steps?.length ?? 1;
      const baseReward = quest.step_reward ?? 0;
      const customRewards = quest.step_rewards ?? [];
      let totalStepRewards = 0;
      for (let i = 0; i < timedSteps; i++) {
        totalStepRewards += customRewards[i] !== undefined ? customRewards[i] : baseReward;
      }
      return totalStepRewards + quest.reward_amount;
    }
    // Step-based quests (shortlink/locker): sum step rewards + completion bonus
    const stepCount = total;
    const baseReward = quest.step_reward ?? 0;
    const customRewards = quest.step_rewards ?? [];
    let totalStepRewards = 0;
    for (let i = 0; i < stepCount; i++) {
      totalStepRewards += customRewards[i] !== undefined ? customRewards[i] : baseReward;
    }
    return totalStepRewards + quest.reward_amount;
  })();

  const detail = locked
    ? (lockLabel ?? "This quest is currently locked")
    : credited
      ? "Reward verified and added to your wallet"
      : quest.quest_type === "ads"
        ? `${remaining} ${remaining === 1 ? "ad" : "ads"} left to verify`
        : quest.quest_type === "survey"
          ? `${remaining} ${remaining === 1 ? "survey" : "surveys"} remaining`
          : quest.quest_type === "shortlink"
            ? `Step ${nextStep} of ${total} · ${quest.min_seconds_per_step}s minimum`
            : quest.quest_type === "checkin"
              ? quest.streak_mode === "consecutive"
                ? `${remaining} more ${remaining === 1 ? "day" : "days"} to go`
                : `Check in ${remaining} more ${remaining === 1 ? "day" : "days"}`
              : quest.quest_type === "network"
                ? `Complete ${remaining} more ${remaining === 1 ? "network" : "networks"}`
                : quest.quest_type === "feed_ptc" ||
                    quest.quest_type === "feed_shortlink" ||
                    quest.quest_type === "feed_article"
                  ? `Step ${nextStep} of ${total} · Top campaigns`
                  : quest.quest_type === "timed_ptc"
                    ? `Step ${nextStep} of ${total} · ${quest.timed_step_seconds ?? 60}s timer`
                    : "Secure locker completion required";
  const summary = locked
    ? (lockLabel ?? "Quest locked")
    : credited
      ? "Reward credited"
      : quest.quest_type === "ads"
        ? `Watch ${total} ${total === 1 ? "Ad" : "Ads"}`
        : quest.quest_type === "survey"
          ? `Complete ${total} ${total === 1 ? "Survey" : "Surveys"}`
          : quest.quest_type === "shortlink"
            ? `Visit ${total} ${total === 1 ? "Shortlink" : "Shortlinks"}`
            : quest.quest_type === "checkin"
              ? `Check in ${total} ${total === 1 ? "Day" : "Days"}`
              : quest.quest_type === "network"
                ? `Complete ${total} ${total === 1 ? "Network" : "Networks"}`
                : quest.quest_type === "feed_ptc"
                  ? `Top ${total} PTC`
                  : quest.quest_type === "feed_shortlink"
                    ? `Top ${total} Shortlinks`
                    : quest.quest_type === "feed_article"
                      ? `Top ${total} Articles`
                      : quest.quest_type === "timed_ptc"
                        ? `${total} Timed ${total === 1 ? "Step" : "Steps"}`
                        : "Complete Locker";
  const ctaText = locked
    ? "Locked"
    : credited
      ? "✓ Completed"
      : busy
        ? "Opening..."
        : quest.quest_type === "ads"
          ? "Watch Ads"
          : quest.quest_type === "survey"
            ? progress > 0
              ? "Continue"
              : "Start Quest"
            : quest.quest_type === "shortlink"
              ? progress > 0
                ? "Continue"
                : "Start Quest"
              : quest.quest_type === "checkin"
                ? "Tracking..."
                : quest.quest_type === "network"
                  ? progress > 0
                    ? "Continue"
                    : "Start Quest"
                  : quest.quest_type === "active_time"
                    ? "Tracking..."
                    : quest.quest_type === "feed_ptc" ||
                      quest.quest_type === "feed_shortlink" ||
                      quest.quest_type === "feed_article"
                    ? progress > 0
                      ? "Continue"
                      : "Start Quest"
                    : quest.quest_type === "timed_ptc"
                      ? progress > 0
                        ? "Continue"
                        : "Start Quest"
                      : "Complete Locker";
  const actionTestId =
    quest.quest_type === "ads"
      ? `quest-watch-${quest.key}`
      : quest.quest_type === "survey"
        ? `quest-survey-${quest.key}`
        : quest.quest_type === "shortlink"
          ? `quest-open-${quest.key}`
          : quest.quest_type === "checkin"
            ? `quest-checkin-${quest.key}`
            : quest.quest_type === "network"
              ? `quest-network-${quest.key}`
              : quest.quest_type === "feed_ptc" ||
                  quest.quest_type === "feed_shortlink" ||
                  quest.quest_type === "feed_article"
                ? `quest-feed-${quest.key}`
                : quest.quest_type === "timed_ptc"
                  ? `quest-timed-ptc-${quest.key}`
                  : `quest-locker-${quest.key}`;

  const inactive = locked || credited;

  return (
    <article
      className="group relative shrink-0 snap-start overflow-hidden transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1"
      style={{
        width: CARD_W,
        minWidth: CARD_W,
        minHeight: 340,
        borderRadius: 18,
        background: "#FFFFFF",
        border: `1px solid ${HAIRLINE}`,
        boxShadow: "0 1px 2px rgba(11,43,40,0.04), 0 12px 28px -12px rgba(11,43,40,0.16)",
      }}
      data-testid={`quest-card-${quest.key}`}
    >
      {/* faint category wash, top-anchored so the card stays predominantly white */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: 132,
          background: `linear-gradient(180deg, ${accent.wash} 0%, rgba(255,255,255,0) 100%)`,
        }}
        aria-hidden
      />

      <div className="relative flex h-full flex-col px-4 pb-4 pt-4">
        {/* header: category + reward */}
        <div className="flex items-start justify-between gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold uppercase leading-none tracking-[0.07em]"
            style={{ background: accent.badgeBg, color: accent.badgeInk }}
            data-testid={`quest-type-${quest.key}`}
          >
            {locked ? <LockKeyhole className="size-3" /> : null}
            {accent.label}
          </span>

          <span className="text-right" data-testid={`quest-reward-${quest.key}`}>
            <span
              className="block text-[9px] font-bold uppercase leading-none tracking-[0.11em]"
              style={{ color: INK_FAINT }}
            >
              Reward
            </span>
            <span className="mt-1 flex items-center justify-end gap-1.5">
              <CoinMark />
              <span
                className="text-[17px] font-bold leading-none [font-variant-numeric:tabular-nums]"
                style={{ color: INK, fontFamily: DISPLAY_FONT }}
              >
                {formatReward(displayReward)}
              </span>
            </span>
          </span>
        </div>

        {/* icon tile — the single place category colour is fully saturated */}
        <div
          className="mt-4 shrink-0 grid place-items-center transition-transform duration-300 group-hover:scale-[1.04]"
          style={{
            width: 44,
            height: 44,
            borderRadius: 13,
            background: accent.tile,
            boxShadow: `0 6px 14px -4px ${accent.tileShadow}, inset 0 1px 0 rgba(255,255,255,0.45)`,
          }}
          data-testid={`quest-icon-${quest.key}`}
        >
          <TileIcon className="size-5 text-white" strokeWidth={2} aria-hidden />
        </div>

        <h3
          className="mt-3.5 shrink-0 line-clamp-1 text-[17px] font-bold leading-tight tracking-[-0.01em]"
          style={{ color: INK, fontFamily: DISPLAY_FONT }}
          data-testid={`quest-title-${quest.key}`}
        >
          {quest.label}
        </h3>
        <p
          className="mt-1.5 shrink-0 line-clamp-2 text-[12px] leading-[1.45]"
          style={{ color: INK_SOFT }}
          data-testid={`quest-description-${quest.key}`}
        >
          {description}
        </p>

        <div className="flex-1" />

        {/* checkin quest: compact day dots + status line */}
        {quest.quest_type === "checkin" && !credited && !locked ? (
          <div className="mb-3 space-y-2" data-testid={`quest-checkin-status-${quest.key}`}>
            {/* Compact Day Dots */}
            <CheckinDayDotsCompact
              totalDays={total}
              completedDays={progress}
              currentDay={progress + 1}
            />
            
            {/* Single status line: timer OR unlock countdown, never both */}
            {(() => {
              const todayDay = active?.checkin_days?.find((d, idx) => idx === progress);
              const todayRequired = quest.required_active_seconds ?? 0;
              
              // Check if today is complete and next day is locked
              if (todayDay?.completed_at && progress < total) {
                const completedAt = new Date(todayDay.completed_at);
                const nextDayUnlock = new Date(completedAt);
                nextDayUnlock.setDate(nextDayUnlock.getDate() + 1);
                nextDayUnlock.setHours(0, 0, 0, 0);
                
                const now = new Date();
                if (now < nextDayUnlock) {
                  // Show unlock countdown
                  const diff = nextDayUnlock.getTime() - now.getTime();
                  const hours = Math.floor(diff / (1000 * 60 * 60));
                  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                  const nextDayNum = progress + 2; // progress is 0-indexed, so +2 for next day number
                  return (
                    <p className="text-center text-[10px] text-gray-500">
                      Day {nextDayNum} unlocks tonight at 12:00 AM ({hours}h {minutes}m)
                    </p>
                  );
                }
              }
              
              // Show live timer if today is in progress
              if (todayDay && !todayDay.completed_at && todayRequired > 0) {
                return (
                  <CompactTimer
                    currentSeconds={todayDay.active_seconds ?? 0}
                    targetSeconds={todayRequired}
                    status={undefined}
                  />
                );
              }
              
              return null;
            })()}
            
            {/* Single progress line: "1 of 3 days" */}
            <p className="text-center text-[10px] text-gray-600">
              {progress} of {total} days
            </p>
          </div>
        ) : null}

        {/* active_time quest: compact stopwatch + status */}
        {quest.quest_type === "active_time" && activeTimeProgress && !credited && !locked ? (
          <div className="mb-3 space-y-2" data-testid={`quest-active-time-status-${quest.key}`}>
            <CompactTimer
              currentSeconds={activeTimeProgress.total_seconds}
              targetSeconds={(quest.target_minutes ?? 30) * 60}
              isLive={true}
              status={
                activeTimeTracking?.isPaused
                  ? "Paused"
                  : activeTimeProgress.today_seconds >= (quest.daily_cap_minutes ?? 120) * 60
                    ? "Daily cap reached"
                    : credited
                      ? "Credited"
                      : "Tracking"
              }
            />
          </div>
        ) : null}

        {/* progress - hide for checkin/active_time (shown in compact sections above) */}
        {quest.quest_type !== "checkin" && quest.quest_type !== "active_time" && (
          <div data-testid={`quest-progress-${quest.key}`}>
            <>
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className="text-[11px] font-semibold [font-variant-numeric:tabular-nums]"
                  style={{ color: INK }}
                  data-testid={`quest-progress-text-${quest.key}`}
                >
                  {progress} / {total}
                </span>
                <span
                  className="text-[11px] font-medium"
                  style={{ color: INK_FAINT }}
                  data-testid={`quest-remaining-${quest.key}`}
                >
                  {credited ? "Completed" : `${remaining} more`}
                </span>
              </div>
              <div
                className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
                style={{ background: TRACK }}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{ width: `${progressPercent}%`, background: accent.bar }}
                />
              </div>
            </>
          </div>
        )}

        {/* Detail text - hide for checkin/active_time (shown in compact sections) */}
        {quest.quest_type !== "checkin" && quest.quest_type !== "active_time" && (
          <p
            className="mt-2 line-clamp-1 text-[10px] leading-tight"
            style={{ color: INK_FAINT }}
            data-testid={`quest-detail-${quest.key}`}
          >
            {detail}
            <span className="sr-only"> — {summary}</span>
          </p>
        )}

        {/* CTA - status pill for checkin/active_time, button for others */}
        {quest.quest_type === "checkin" || quest.quest_type === "active_time" ? (
          // Status pill - no button, whole card opens details
          <div
            className="mt-2.5 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg text-[11px] font-medium"
            style={{ background: "rgba(16,163,113,0.08)", color: "#059669" }}
            data-testid={actionTestId}
          >
            <Clock className="size-3.5" />
            {quest.quest_type === "checkin" ? "Tracking Progress" : "Tracking Active Time"}
          </div>
        ) : (
          // Regular button for other quest types
          <button
            type="button"
            className="mt-2.5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[11px] text-[13px] font-semibold transition-[filter,background-color] duration-200 disabled:cursor-not-allowed enabled:hover:brightness-[1.12] [&_svg]:size-4"
            style={
              credited
                ? { background: "rgba(16,163,113,0.12)", color: "#0A6B4A" }
                : locked
                  ? { background: "#F3F5F4", color: INK_FAINT }
                  : {
                      background: INK,
                      color: "#FFFFFF",
                      boxShadow: "0 1px 2px rgba(11,43,40,0.18)",
                    }
            }
            disabled={busy || credited}
            onClick={locked ? onLocked : onOpenDetails}
            data-testid={actionTestId}
          >
            {busy ? (
              <Loader2 className="animate-spin" />
            ) : locked ? (
              <LockKeyhole />
            ) : credited ? (
              <Check />
            ) : null}
            {ctaText}
          </button>
        )}
      </div>

      {inactive ? null : (
        <span
          className="pointer-events-none absolute inset-0 rounded-[18px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ boxShadow: `inset 0 0 0 1px ${accent.badgeBg}` }}
          aria-hidden
        />
      )}
    </article>
  );
});
