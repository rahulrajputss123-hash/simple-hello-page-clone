import {
  CalendarDays,
  ChevronRight,
  Clapperboard,
  Coins,
  Film,
  Gift,
  Link2,
  Loader2,
  LockKeyhole,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  Video,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/coinquest";
import type { QuestRow } from "@/lib/quests.server";

export type QuestSessionView = {
  id: string;
  quest_key: string;
  status: string;
  ads_watched: number;
  current_step?: number;
};

export type QuestCardQuest = QuestRow & {
  is_locked?: boolean;
  unlock_reason?:
    | { type: "time"; unlocksAt: string }
    | { type: "earning"; required: number; current: number }
    | null;
};

type QuestCardProps = {
  quest: QuestCardQuest;
  active?: QuestSessionView | undefined;
  credited: boolean;
  busy: boolean;
  lockLabel: string | null;
  onAction: () => void;
  onLocked: () => void;
};

type QuestVisual = {
  badge: string;
  fallbackIcon: LucideIcon;
  badgeIcon: ReactNode;
  progressIcon: ReactNode;
  badgeClass: string;
  cardStyle: React.CSSProperties;
  cardShadowClass: string;
  glowColor: string;
  ctaTextClass: string;
};

const QUEST_VISUALS: Record<QuestRow["quest_type"], QuestVisual> = {
  ads: {
    badge: "Easy",
    fallbackIcon: Clapperboard,
    badgeIcon: <Zap className="size-3 fill-current" />,
    progressIcon: <Film className="size-4" />,
    badgeClass: "bg-[#0b7a50] text-white",
    cardStyle: {
      backgroundImage:
        "radial-gradient(130% 65% at 50% -12%, rgba(255,255,255,.55), rgba(255,255,255,0) 55%)," +
        "linear-gradient(168deg, #6fe0a6 0%, #34c787 42%, #12925f 100%)",
    },
    cardShadowClass:
      "shadow-[inset_0_-28px_46px_-18px_rgba(4,58,38,.35),0_18px_36px_-12px_rgba(14,140,95,.4)]",
    glowColor: "rgba(20,150,105,.45)",
    ctaTextClass: "text-[#0b7a50]",
  },
  shortlink: {
    badge: "Challenge",
    fallbackIcon: Link2,
    badgeIcon: <Sparkles className="size-3" />,
    progressIcon: <Link2 className="size-4" />,
    badgeClass: "bg-[#a34c00] text-white",
    cardStyle: {
      backgroundImage:
        "radial-gradient(130% 65% at 50% -12%, rgba(255,255,255,.55), rgba(255,255,255,0) 55%)," +
        "linear-gradient(168deg, #ffc266 0%, #ff9736 42%, #e0731a 100%)",
    },
    cardShadowClass:
      "shadow-[inset_0_-28px_46px_-18px_rgba(107,47,0,.35),0_18px_36px_-12px_rgba(224,115,26,.4)]",
    glowColor: "rgba(230,125,25,.45)",
    ctaTextClass: "text-[#a34c00]",
  },
  locker: {
    badge: "Daily",
    fallbackIcon: LockKeyhole,
    badgeIcon: <CalendarDays className="size-3" />,
    progressIcon: <Gift className="size-4" />,
    badgeClass: "bg-[#0b4e90] text-white",
    cardStyle: {
      backgroundImage:
        "radial-gradient(130% 65% at 50% -12%, rgba(255,255,255,.55), rgba(255,255,255,0) 55%)," +
        "linear-gradient(168deg, #7ec2f3 0%, #3f97e1 42%, #1c68b1 100%)",
    },
    cardShadowClass:
      "shadow-[inset_0_-28px_46px_-18px_rgba(7,45,86,.35),0_18px_36px_-12px_rgba(28,104,177,.4)]",
    glowColor: "rgba(25,110,190,.45)",
    ctaTextClass: "text-[#0b4e90]",
  },
};

const LOCKED_CARD_STYLE: React.CSSProperties = {
  backgroundImage:
    "radial-gradient(130% 65% at 50% -12%, rgba(255,255,255,.6), rgba(255,255,255,0) 55%)," +
    "linear-gradient(168deg, #e6e6e6 0%, #cfcfcf 42%, #adadad 100%)",
};

const ICONS: Record<string, LucideIcon> = {
  play: Play,
  video: Video,
  clapperboard: Clapperboard,
  link: Link2,
  "link-2": Link2,
  link2: Link2,
  gift: Gift,
  trophy: Trophy,
  target: Target,
  star: Star,
  sparkles: Sparkles,
  shield: ShieldCheck,
  lock: LockKeyhole,
  "lock-keyhole": LockKeyhole,
};

const QUEST_ARTWORK: Record<QuestRow["quest_type"], string> = {
  ads: "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/8ed3ba7ebe1e98d1e2e54a495c946a509a33a184c908a82384a8cd1eddd9fcc2.jpeg",
  shortlink:
    "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/c38403c6cd3cb8b13229c2d5859d2f81b58c1544bcbf1f8d5bf3dfab91427e23.jpeg",
  locker:
    "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/890789a2d705fd97ed2bbcea4fcf922c4eb57741d95c028bbc3bdd71138666ab.jpeg",
};

function QuestArtwork({
  value,
  type,
  fallback: Fallback,
}: {
  value: string;
  type: QuestRow["quest_type"];
  fallback: LucideIcon;
}) {
  const [customBroken, setCustomBroken] = useState(false);
  const [fallbackBroken, setFallbackBroken] = useState(false);
  const trimmed = value.trim();
  const isCustomUrl = /^https?:\/\//i.test(trimmed);
  const key = trimmed.toLowerCase().replace(/[\s_]+/g, "-");
  const Icon = ICONS[key] ?? Fallback;
  const source = isCustomUrl && !customBroken ? trimmed : QUEST_ARTWORK[type];

  if (fallbackBroken) {
    return (
      <Icon
        className="size-11 text-white drop-shadow-[0_8px_10px_rgba(0,0,0,.35)]"
        strokeWidth={1.9}
        aria-hidden
      />
    );
  }
  return (
    <img
      src={source}
      alt=""
      className="size-full scale-[1.2] rounded-full object-cover mix-blend-multiply drop-shadow-[0_10px_12px_rgba(0,0,0,.28)] transition-transform duration-300 group-hover:scale-[1.26]"
      onError={() =>
        isCustomUrl && !customBroken ? setCustomBroken(true) : setFallbackBroken(true)
      }
    />
  );
}

function ProgressRing({
  value,
  total,
  testId,
}: {
  value: number;
  total: number;
  testId: string;
}) {
  const safeTotal = Math.max(1, total);
  const safeValue = Math.min(Math.max(0, value), safeTotal);
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const percent = (safeValue / safeTotal) * 100;
  return (
    <div className="relative grid size-[68px] shrink-0 place-items-center" data-testid={testId}>
      <svg viewBox="0 0 72 72" className="absolute inset-0 size-full -rotate-90" aria-hidden>
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,.32)"
          strokeWidth="7"
        />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="#ffffff"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (circumference * percent) / 100}
          style={{ transition: "stroke-dashoffset 420ms cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <span className="relative text-amount text-base text-white drop-shadow-[0_1px_2px_rgba(0,0,0,.25)]">
        {safeValue}/{safeTotal}
      </span>
    </div>
  );
}

export function QuestCard({
  quest,
  active,
  credited,
  busy,
  lockLabel,
  onAction,
  onLocked,
}: QuestCardProps) {
  const visual = QUEST_VISUALS[quest.quest_type] ?? QUEST_VISUALS.ads;
  const locked = Boolean(quest.is_locked);
  const total =
    quest.quest_type === "ads"
      ? Math.max(1, quest.ads_required)
      : quest.quest_type === "shortlink"
        ? Math.max(1, quest.shortlink_steps.length)
        : 1;
  const current = credited
    ? total
    : quest.quest_type === "ads"
      ? Number(active?.ads_watched ?? 0)
      : quest.quest_type === "shortlink"
        ? Number(active?.current_step ?? 0)
        : 0;
  const progress = Math.min(Math.max(0, current), total);
  const remaining = Math.max(0, total - progress);
  const nextStep = Math.min(progress + 1, total);
  const description =
    quest.quest_type === "ads"
      ? `Watch ${total} ${total === 1 ? "video ad" : "video ads"} and get rewarded!`
      : quest.quest_type === "shortlink"
        ? `Visit ${total === 1 ? "the short link" : `${total} short links`} and get rewarded!`
        : "Complete the partner offer and unlock your reward!";
  const detail = locked
    ? (lockLabel ?? "This quest is currently locked")
    : credited
      ? "Reward verified and added to your wallet"
      : quest.quest_type === "ads"
        ? `${remaining} ${remaining === 1 ? "ad" : "ads"} left to verify`
        : quest.quest_type === "shortlink"
          ? `Step ${nextStep} of ${total} · ${quest.min_seconds_per_step}s minimum`
          : "Secure partner completion required";
  const summary = locked
    ? (lockLabel ?? "Quest locked")
    : credited
      ? "Reward credited"
      : quest.quest_type === "ads"
        ? `Watch ${total} ${total === 1 ? "Ad" : "Ads"}`
        : quest.quest_type === "shortlink"
          ? `Visit ${total} ${total === 1 ? "Shortlink" : "Shortlinks"}`
          : "Complete Locker";
  const ctaText = locked
    ? "Locked"
    : credited
      ? "✓ Completed"
      : busy
        ? "Opening..."
        : quest.quest_type === "ads"
          ? "Watch Ads"
          : quest.quest_type === "shortlink"
            ? progress > 0
              ? "Continue"
              : "Start Quest!"
            : "View Offers";
  const actionTestId =
    quest.quest_type === "ads"
      ? `quest-watch-${quest.key}`
      : quest.quest_type === "shortlink"
        ? `quest-open-${quest.key}`
        : `quest-locker-${quest.key}`;
  const percent = Math.min(100, Math.max(0, (progress / Math.max(1, total)) * 100));

  return (
    <article
      className={`group relative flex h-[390px] w-[248px] min-w-[248px] snap-start flex-col overflow-hidden rounded-[20px] transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-1 ${locked ? "opacity-80" : ""} ${locked ? "" : visual.cardShadowClass}`}
      style={locked ? LOCKED_CARD_STYLE : visual.cardStyle}
      data-testid={`quest-card-${quest.key}`}
    >
      {/* Reward pill — tucked flush into the card's top-right corner */}
      <div
        className="absolute right-0 top-0 z-20 flex items-center gap-1.5 rounded-bl-2xl rounded-tr-[20px] border-b border-l border-[#e8b62c]/70 bg-[linear-gradient(180deg,#ffe574,#f5c842)] px-3.5 py-2 pl-4 text-[#563900] shadow-[0_8px_16px_rgba(0,0,0,.18)]"
        data-testid={`quest-reward-${quest.key}`}
      >
        <Coins className="size-4 shrink-0" />
        <span className="text-right leading-none">
          <span className="block text-amount text-sm">{formatMoney(quest.reward_amount)}</span>
          <span className="mt-0.5 block text-[7px] font-black uppercase tracking-[0.12em]">
            Reward
          </span>
        </span>
      </div>

      <div className="relative z-10 flex h-full flex-col p-4 pb-5">
        {/* Top row: type badge */}
        <div className="flex items-start pr-20">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] shadow-[0_4px_10px_rgba(0,0,0,.18)] ${locked ? "bg-black/25 text-white" : visual.badgeClass}`}
            data-testid={`quest-type-${quest.key}`}
          >
            {locked ? <LockKeyhole className="size-3" /> : visual.badgeIcon}
            {locked ? "Locked" : visual.badge}
          </span>
        </div>

        {/* Icon + title row */}
        <div className="mt-3 flex items-center gap-3">
          <div className="relative grid size-16 shrink-0 place-items-center">
            <span
              aria-hidden
              className="absolute inset-0 rounded-full blur-xl"
              style={{
                background: locked
                  ? "radial-gradient(circle, rgba(255,255,255,.35), transparent 70%)"
                  : `radial-gradient(circle, ${visual.glowColor}, transparent 70%)`,
              }}
            />
            <span
              aria-hidden
              className="absolute bottom-0 h-3 w-10 rounded-full bg-black/25 blur-md"
            />
            <div
              className="relative grid size-14 place-items-center overflow-hidden rounded-full"
              data-testid={`quest-icon-${quest.key}`}
            >
              {locked ? (
                <LockKeyhole className="size-11 text-white/80" strokeWidth={1.9} />
              ) : (
                <QuestArtwork
                  value={quest.icon}
                  type={quest.quest_type}
                  fallback={visual.fallbackIcon}
                />
              )}
            </div>
          </div>
          <h3
            className="min-w-0 flex-1 truncate font-display text-xl leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,.2)]"
            data-testid={`quest-title-${quest.key}`}
          >
            {quest.label}
          </h3>
        </div>

        {/* Description */}
        <p
          className="mt-2 line-clamp-2 text-left text-xs leading-relaxed text-white/85"
          data-testid={`quest-description-${quest.key}`}
        >
          {description}
        </p>

        {/* Progress row */}
        <div className="mt-3 flex items-center gap-3">
          <ProgressRing value={progress} total={total} testId={`quest-progress-${quest.key}`} />
          <div className="min-w-0 flex-1">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full rounded-full bg-white transition-[width] duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="sr-only" data-testid={`quest-progress-text-${quest.key}`}>
              {progress} / {total}
            </p>
            <p
              className="mt-1.5 text-[11px] font-bold text-white/90"
              data-testid={`quest-remaining-${quest.key}`}
            >
              {credited ? "Completed" : `${remaining} more to complete`}
            </p>
          </div>
        </div>

        {/* Info pill */}
        <div
          className="mt-3 flex h-10 items-center gap-2 rounded-full bg-white/20 px-3 text-xs font-bold text-white ring-1 ring-inset ring-white/25"
          data-testid={`quest-detail-${quest.key}`}
        >
          <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-white/25 [&_svg]:size-3.5">
            {locked ? <LockKeyhole /> : credited ? <ShieldCheck /> : visual.progressIcon}
          </span>
          <span className="min-w-0 flex-1 truncate">{summary}</span>
          <ChevronRight className="size-4 shrink-0 opacity-80" />
          <span className="sr-only">{detail}</span>
        </div>

        {/* Main CTA */}
        <Button
          type="button"
          size="lg"
          variant="outline"
          className={`relative z-10 mt-3 h-12 w-full rounded-full border-0 bg-white/95 text-sm font-extrabold shadow-[0_6px_0_rgba(0,0,0,.1),0_10px_18px_rgba(0,0,0,.18)] hover:brightness-105 ${locked || credited ? "text-muted-foreground" : visual.ctaTextClass}`}
          disabled={busy || credited}
          onClick={locked ? onLocked : onAction}
          data-testid={actionTestId}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {ctaText}
        </Button>
      </div>
    </article>
  );
}
