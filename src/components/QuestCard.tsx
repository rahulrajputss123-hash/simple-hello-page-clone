import {
  Check,
  Clapperboard,
  Coins,
  ExternalLink,
  Gift,
  Link2,
  Loader2,
  LockKeyhole,
  Play,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  Video,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

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
  badgeClass: string;
  iconClass: string;
  detailClass: string;
  progressColor: string;
  stripClass: string;
  buttonVariant: "jade" | "gold";
};

const QUEST_VISUALS: Record<QuestRow["quest_type"], QuestVisual> = {
  ads: {
    badge: "Easy",
    fallbackIcon: Clapperboard,
    badgeClass: "bg-[#42dfa6] text-[#063f35] shadow-[0_4px_12px_rgba(47,216,151,.28)]",
    iconClass: "bg-[#dffff2] text-primary",
    detailClass: "border-[#79ddba] bg-[#cdf7e7] text-[#0b5e4d]",
    progressColor: "var(--mint)",
    stripClass: "from-mint via-primary-soft to-primary",
    buttonVariant: "jade",
  },
  shortlink: {
    badge: "Challenge",
    fallbackIcon: Link2,
    badgeClass: "bg-gradient-to-r from-[#ff7b22] to-[#ff9f1c] text-white shadow-[0_4px_12px_rgba(255,123,34,.28)]",
    iconClass: "bg-[#fff0c8] text-gold-dark",
    detailClass: "border-[#ffc75e] bg-[#ffedbd] text-[#8f5200]",
    progressColor: "var(--gold-dark)",
    stripClass: "from-gold-dark via-gold to-amber-300",
    buttonVariant: "gold",
  },
  locker: {
    badge: "Bonus",
    fallbackIcon: LockKeyhole,
    badgeClass: "bg-gradient-to-r from-[#1677d2] to-[#35a4e8] text-white shadow-[0_4px_12px_rgba(22,119,210,.24)]",
    iconClass: "bg-[#d9f7f2] text-primary",
    detailClass: "border-[#61cbbb] bg-[#d6f6ef] text-[#07584d]",
    progressColor: "var(--primary)",
    stripClass: "from-primary via-primary-soft to-mint",
    buttonVariant: "jade",
  },
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
  rocket: Rocket,
  zap: Zap,
  star: Star,
  sparkles: Sparkles,
  shield: ShieldCheck,
  lock: LockKeyhole,
  "lock-keyhole": LockKeyhole,
};

const QUEST_ARTWORK: Record<QuestRow["quest_type"], string> = {
  ads: "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/8ed3ba7ebe1e98d1e2e54a495c946a509a33a184c908a82384a8cd1eddd9fcc2.jpeg",
  shortlink: "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/c38403c6cd3cb8b13229c2d5859d2f81b58c1544bcbf1f8d5bf3dfab91427e23.jpeg",
  locker: "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/890789a2d705fd97ed2bbcea4fcf922c4eb57741d95c028bbc3bdd71138666ab.jpeg",
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
  const [imageBroken, setImageBroken] = useState(false);
  const trimmed = value.trim();
  const isCustomUrl = /^https?:\/\//i.test(trimmed);
  const key = trimmed.toLowerCase().replace(/[\s_]+/g, "-");
  const Icon = ICONS[key] ?? Fallback;
  const source = isCustomUrl && !imageBroken ? trimmed : QUEST_ARTWORK[type];

  return (
    <span className="relative block size-full overflow-hidden rounded-[1.1rem]">
      <img
        src={source}
        alt=""
        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        onError={() => setImageBroken(true)}
      />
      {!isCustomUrl && (
        <span className="absolute bottom-1 right-1 grid size-5 place-items-center rounded-full bg-white/90 text-primary shadow-soft">
          <Icon className="size-2.5" strokeWidth={2.5} aria-hidden />
        </span>
      )}
    </span>
  );
}

function ProgressRing({
  value,
  total,
  color,
  testId,
}: {
  value: number;
  total: number;
  color: string;
  testId: string;
}) {
  const safeTotal = Math.max(1, total);
  const safeValue = Math.min(Math.max(0, value), safeTotal);
  const percent = (safeValue / safeTotal) * 100;
  const radius = 30;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative grid size-[68px] shrink-0 place-items-center" data-testid={testId}>
      <svg viewBox="0 0 76 76" className="absolute inset-0 size-full -rotate-90" aria-hidden>
        <circle cx="38" cy="38" r={radius} fill="none" stroke="var(--muted)" strokeWidth="7" />
        <circle
          cx="38"
          cy="38"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (circumference * percent) / 100}
          style={{ transition: "stroke-dashoffset 420ms cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div className="relative text-center">
        <p className="text-amount text-sm leading-none text-foreground">{safeValue}/{safeTotal}</p>
        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
          progress
        </p>
      </div>
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
      ? `Watch ${total} ${total === 1 ? "ad" : "ads"} and get rewarded!`
      : quest.quest_type === "shortlink"
        ? `Complete ${total} ${total === 1 ? "shortlink" : "shortlinks"} and get rewarded!`
        : "Complete this partner challenge and unlock your reward.";
  const detail = locked
    ? lockLabel ?? "This quest is currently locked"
    : credited
      ? "Reward verified and added to your wallet"
      : quest.quest_type === "ads"
        ? `${remaining} ${remaining === 1 ? "ad" : "ads"} left to verify`
        : quest.quest_type === "shortlink"
          ? `Step ${nextStep} of ${total} · ${quest.min_seconds_per_step}s minimum`
          : "Secure partner completion required";
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
              : "Start Quest"
            : "Open Locker";
  const actionTestId =
    quest.quest_type === "ads"
      ? `quest-watch-${quest.key}`
      : quest.quest_type === "shortlink"
        ? `quest-open-${quest.key}`
        : `quest-locker-${quest.key}`;

  return (
    <article
      className={`surface-card group relative flex h-[338px] w-[214px] min-w-[214px] snap-start flex-col overflow-hidden !rounded-[1.35rem] !border p-3.5 !shadow-soft transition-[transform,box-shadow,border-color,opacity] duration-200 hover:-translate-y-0.5 hover:shadow-lift ${
        locked
          ? "border-border bg-background-alt/80 opacity-75"
          : credited
            ? "border-[#65d9ad] bg-[radial-gradient(circle_at_50%_25%,#c8f8e3_0%,#effcf6_55%,#ffffff_100%)]"
            : quest.quest_type === "shortlink"
              ? "border-[#ffc457] bg-[radial-gradient(circle_at_50%_26%,#ffe7aa_0%,#fff7e5_58%,#fffdf8_100%)] shadow-[0_10px_28px_rgba(255,159,28,.16)]"
              : quest.quest_type === "locker"
                ? "border-[#6ad8c8] bg-[radial-gradient(circle_at_50%_26%,#c8f5ea_0%,#ecfbf7_58%,#ffffff_100%)] shadow-[0_10px_28px_rgba(20,145,125,.14)]"
                : "border-[#73deb8] bg-[radial-gradient(circle_at_50%_26%,#c9f8e3_0%,#ecfbf4_58%,#ffffff_100%)] shadow-[0_10px_28px_rgba(47,216,151,.15)]"
      }`}
      data-testid={`quest-card-${quest.key}`}
    >
      <span className="pointer-events-none absolute -right-7 top-16 size-20 rounded-full bg-white/35 blur-xl" aria-hidden />
      <span className="pointer-events-none absolute -left-8 bottom-16 size-16 rounded-full bg-gold/10 blur-xl" aria-hidden />
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${visual.stripClass}`} aria-hidden />
      <div className="flex items-start justify-between gap-2 pt-1">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] shadow-soft ${locked ? "bg-muted text-muted-foreground" : visual.badgeClass}`}
          data-testid={`quest-type-${quest.key}`}
        >
          {locked ? <LockKeyhole className="size-3" /> : <Sparkles className="size-3" />}
          {locked ? "Locked" : visual.badge}
        </span>
        <span
          className="flex items-center gap-1.5 rounded-xl border border-[#f0b92d] bg-gradient-to-br from-[#fff3a8] to-[#ffd54e] px-2 py-1 text-[#674000] shadow-[0_4px_12px_rgba(240,154,0,.2)]"
          data-testid={`quest-reward-${quest.key}`}
        >
          <Coins className="size-4" />
          <span className="text-right">
            <span className="block text-amount text-xs leading-none">{formatMoney(quest.reward_amount)}</span>
            <span className="mt-0.5 block text-[7px] font-bold uppercase tracking-wider text-gold-dark/70">Reward</span>
          </span>
        </span>
      </div>

      <div className="mt-2.5 flex flex-col items-center text-center">
        <span
          className={`relative grid size-[74px] shrink-0 place-items-center rounded-[1.15rem] shadow-[0_10px_22px_rgba(15,61,62,.16)] ring-4 ring-white/75 ${locked ? "bg-muted text-muted-foreground" : visual.iconClass}`}
          data-testid={`quest-icon-${quest.key}`}
        >
          {locked ? <LockKeyhole className="size-8" /> : <QuestArtwork value={quest.icon} type={quest.quest_type} fallback={visual.fallbackIcon} />}
        </span>
        <div className="mt-2 min-w-0">
          <h3 className="line-clamp-1 font-display text-lg leading-tight text-foreground" data-testid={`quest-title-${quest.key}`}>
            {quest.label}
          </h3>
          <p className="mx-auto mt-1 line-clamp-2 max-w-[175px] text-[11px] leading-snug text-muted-foreground" data-testid={`quest-description-${quest.key}`}>
            {description}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-center gap-3 px-1">
        <ProgressRing value={progress} total={total} color={locked ? "var(--muted-foreground)" : visual.progressColor} testId={`quest-progress-${quest.key}`} />
        <div className="min-w-0 text-left">
          <p className="sr-only" data-testid={`quest-progress-text-${quest.key}`}>{progress} / {total}</p>
          <p className="font-display text-base leading-tight text-foreground" data-testid={`quest-remaining-${quest.key}`}>
            {credited ? "Completed" : `${remaining} more`}
          </p>
          <p className="mt-1 text-[10px] leading-snug text-muted-foreground">to complete</p>
        </div>
      </div>

      <div className={`mt-2 flex min-h-9 items-center gap-2 rounded-xl border px-2.5 py-2 text-[10px] ${locked ? "border-border bg-muted/60 text-muted-foreground" : credited ? "border-mint/25 bg-mint/10 text-primary" : visual.detailClass}`} data-testid={`quest-detail-${quest.key}`}>
        {locked ? <LockKeyhole className="size-4 shrink-0" /> : credited ? <ShieldCheck className="size-4 shrink-0" /> : quest.quest_type === "shortlink" ? <ExternalLink className="size-4 shrink-0" /> : <Target className="size-4 shrink-0" />}
        <span className="line-clamp-1 leading-snug">{detail}</span>
      </div>

      <Button
        type="button"
        size="sm"
        variant={locked || credited ? "outline" : visual.buttonVariant}
        className={`mt-auto h-10 w-full gap-2 rounded-xl font-bold shadow-[0_8px_18px_rgba(15,61,62,.18)] ${credited ? "border-mint/35 bg-mint/10 text-primary" : ""} ${!locked && !credited && quest.quest_type === "shortlink" ? "bg-gradient-to-r from-[#ff9718] to-[#ff7b16] text-white hover:from-[#ff8a08] hover:to-[#f66a0a]" : ""}`}
        disabled={busy || credited}
        onClick={locked ? onLocked : onAction}
        data-testid={actionTestId}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : locked ? <LockKeyhole className="size-4" /> : credited ? <Check className="size-4" /> : quest.quest_type === "ads" ? <Play className="size-4" /> : <ExternalLink className="size-4" />}
        {ctaText}
      </Button>
    </article>
  );
}