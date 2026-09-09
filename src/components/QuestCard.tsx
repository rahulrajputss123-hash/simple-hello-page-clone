import {
  CalendarDays,
  Check,
  ChevronRight,
  Clapperboard,
  Coins,
  ExternalLink,
  Film,
  Gift,
  Leaf,
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
  cardClass: string;
  infoClass: string;
  progressColor: string;
  ringTrack: string;
  buttonClass: string;
};

const QUEST_VISUALS: Record<QuestRow["quest_type"], QuestVisual> = {
  ads: {
    badge: "Easy",
    fallbackIcon: Clapperboard,
    badgeIcon: <Zap className="size-3.5 fill-current" />,
    progressIcon: <Film className="size-5" />,
    badgeClass: "bg-[#2fd897] text-[#073f34]",
    cardClass: "border-[#8be5c3] bg-[radial-gradient(circle_at_50%_27%,#c8f7e2_0%,#effbf5_58%,#ffffff_100%)] shadow-[0_16px_36px_rgba(34,177,130,.16)]",
    infoClass: "border-[#bdebd9] bg-[#dff7ed] text-[#0c7059]",
    progressColor: "#18b982",
    ringTrack: "#cdeee1",
    buttonClass: "bg-[linear-gradient(180deg,#18ae80,#08735f)] text-white shadow-[0_10px_22px_rgba(8,115,95,.28)] hover:brightness-110",
  },
  shortlink: {
    badge: "Challenge",
    fallbackIcon: Link2,
    badgeIcon: <Sparkles className="size-3.5" />,
    progressIcon: <Link2 className="size-5" />,
    badgeClass: "bg-[#ff7b22] text-white",
    cardClass: "border-[#ffd27e] bg-[radial-gradient(circle_at_50%_27%,#ffe9ba_0%,#fff8e8_58%,#fffefb_100%)] shadow-[0_16px_36px_rgba(255,139,31,.16)]",
    infoClass: "border-[#ffe0a0] bg-[#fff0cb] text-[#a25a00]",
    progressColor: "#ff9718",
    ringTrack: "#f7e6c4",
    buttonClass: "bg-[linear-gradient(180deg,#ffab24,#ff7b16)] text-white shadow-[0_10px_22px_rgba(255,123,22,.28)] hover:brightness-105",
  },
  locker: {
    badge: "Daily",
    fallbackIcon: LockKeyhole,
    badgeIcon: <CalendarDays className="size-3.5" />,
    progressIcon: <Gift className="size-5" />,
    badgeClass: "bg-[#1677d2] text-white",
    cardClass: "border-[#91c9f1] bg-[radial-gradient(circle_at_50%_27%,#cce8fb_0%,#edf7fe_58%,#ffffff_100%)] shadow-[0_16px_36px_rgba(22,119,210,.16)]",
    infoClass: "border-[#bddcf4] bg-[#e0effb] text-[#07599d]",
    progressColor: "#1677d2",
    ringTrack: "#d5e7f5",
    buttonClass: "bg-[linear-gradient(180deg,#278edc,#0868b5)] text-white shadow-[0_10px_22px_rgba(8,104,181,.28)] hover:brightness-105",
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

function QuestArtwork({ value, type, fallback: Fallback }: { value: string; type: QuestRow["quest_type"]; fallback: LucideIcon }) {
  const [customBroken, setCustomBroken] = useState(false);
  const [fallbackBroken, setFallbackBroken] = useState(false);
  const trimmed = value.trim();
  const isCustomUrl = /^https?:\/\//i.test(trimmed);
  const key = trimmed.toLowerCase().replace(/[\s_]+/g, "-");
  const Icon = ICONS[key] ?? Fallback;
  const source = isCustomUrl && !customBroken ? trimmed : QUEST_ARTWORK[type];

  if (fallbackBroken) return <Icon className="size-12" strokeWidth={1.8} aria-hidden />;
  return <img src={source} alt="" className="size-full scale-[1.16] rounded-full object-cover mix-blend-multiply transition-transform duration-300 group-hover:scale-[1.22]" onError={() => isCustomUrl && !customBroken ? setCustomBroken(true) : setFallbackBroken(true)} />;
}

function ProgressRing({ value, total, visual, testId }: { value: number; total: number; visual: QuestVisual; testId: string }) {
  const safeTotal = Math.max(1, total);
  const safeValue = Math.min(Math.max(0, value), safeTotal);
  const radius = 31;
  const circumference = 2 * Math.PI * radius;
  const percent = (safeValue / safeTotal) * 100;
  return <div className="relative grid size-[82px] shrink-0 place-items-center" data-testid={testId}><svg viewBox="0 0 76 76" className="absolute inset-0 size-full -rotate-90" aria-hidden><circle cx="38" cy="38" r={radius} fill="none" stroke={visual.ringTrack} strokeWidth="7" /><circle cx="38" cy="38" r={radius} fill="none" stroke={visual.progressColor} strokeWidth="7" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - (circumference * percent) / 100} style={{ transition: "stroke-dashoffset 420ms cubic-bezier(.22,1,.36,1)" }} /></svg><span className="relative text-amount text-lg text-[#0b2b28]">{safeValue}/{safeTotal}</span></div>;
}

export function QuestCard({ quest, active, credited, busy, lockLabel, onAction, onLocked }: QuestCardProps) {
  const visual = QUEST_VISUALS[quest.quest_type] ?? QUEST_VISUALS.ads;
  const locked = Boolean(quest.is_locked);
  const total = quest.quest_type === "ads" ? Math.max(1, quest.ads_required) : quest.quest_type === "shortlink" ? Math.max(1, quest.shortlink_steps.length) : 1;
  const current = credited ? total : quest.quest_type === "ads" ? Number(active?.ads_watched ?? 0) : quest.quest_type === "shortlink" ? Number(active?.current_step ?? 0) : 0;
  const progress = Math.min(Math.max(0, current), total);
  const remaining = Math.max(0, total - progress);
  const nextStep = Math.min(progress + 1, total);
  const description = quest.quest_type === "ads" ? `Watch ${total} ${total === 1 ? "video ad" : "video ads"} and get rewarded!` : quest.quest_type === "shortlink" ? `Visit ${total === 1 ? "the short link" : `${total} short links`} and get rewarded!` : "Complete the partner offer and unlock your reward!";
  const detail = locked ? lockLabel ?? "This quest is currently locked" : credited ? "Reward verified and added to your wallet" : quest.quest_type === "ads" ? `${remaining} ${remaining === 1 ? "ad" : "ads"} left to verify` : quest.quest_type === "shortlink" ? `Step ${nextStep} of ${total} · ${quest.min_seconds_per_step}s minimum` : "Secure partner completion required";
  const summary = locked ? lockLabel ?? "Quest locked" : credited ? "Reward credited" : quest.quest_type === "ads" ? `Watch ${total} ${total === 1 ? "Ad" : "Ads"}` : quest.quest_type === "shortlink" ? `Visit ${total} ${total === 1 ? "Shortlink" : "Shortlinks"}` : "Complete Locker";
  const ctaText = locked ? "Locked" : credited ? "✓ Completed" : busy ? "Opening..." : quest.quest_type === "ads" ? "Watch Ads" : quest.quest_type === "shortlink" ? progress > 0 ? "Continue" : "Start Quest" : "Open Locker";
  const actionTestId = quest.quest_type === "ads" ? `quest-watch-${quest.key}` : quest.quest_type === "shortlink" ? `quest-open-${quest.key}` : `quest-locker-${quest.key}`;

  return (
    <article className={`surface-card group relative flex h-[390px] w-[248px] min-w-[248px] snap-start flex-col overflow-hidden !rounded-[1.65rem] !border p-4 !shadow-none transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-1 ${locked ? "border-border bg-background-alt opacity-70" : credited ? "border-[#8bd9bb] bg-[#effbf5]" : visual.cardClass}`} data-testid={`quest-card-${quest.key}`}>
      <Leaf className="pointer-events-none absolute -bottom-3 -left-3 size-16 rotate-[28deg] opacity-20" style={{ color: visual.progressColor }} aria-hidden />
      <Leaf className="pointer-events-none absolute -bottom-4 -right-4 size-14 -rotate-[38deg] opacity-15" style={{ color: visual.progressColor }} aria-hidden />

      <div className="relative z-10 flex items-start justify-between gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] shadow-sm ${locked ? "bg-muted text-muted-foreground" : visual.badgeClass}`} data-testid={`quest-type-${quest.key}`}>{locked ? <LockKeyhole className="size-3.5" /> : visual.badgeIcon}{locked ? "Locked" : visual.badge}</span>
        <span className="flex items-center gap-1.5 rounded-xl border border-[#e8b62c] bg-[linear-gradient(180deg,#ffe574,#f5c842)] px-2.5 py-1.5 text-[#563900] shadow-[0_5px_12px_rgba(212,175,55,.22)]" data-testid={`quest-reward-${quest.key}`}><Coins className="size-4" /><span className="text-right"><span className="block text-amount text-sm leading-none">{formatMoney(quest.reward_amount)}</span><span className="mt-0.5 block text-[7px] font-black uppercase tracking-[0.1em]">Reward</span></span></span>
      </div>

      <div className="relative z-10 mt-2 flex flex-col items-center text-center">
        <div className="relative grid size-[104px] place-items-center" data-testid={`quest-icon-${quest.key}`}>
          <span className="absolute inset-2 rounded-full bg-white/65 shadow-[0_0_28px_rgba(255,255,255,.9)]" aria-hidden />
          <span className="absolute left-0 top-6 h-1 w-4 -rotate-[18deg] rounded-full opacity-65" style={{ backgroundColor: visual.progressColor }} aria-hidden />
          <span className="absolute right-0 top-8 h-1 w-3 rotate-[20deg] rounded-full opacity-65" style={{ backgroundColor: visual.progressColor }} aria-hidden />
          <Sparkles className="absolute right-1 top-1 size-4 text-[#d4af37]" aria-hidden />
          <span className={`relative grid size-[90px] place-items-center overflow-hidden rounded-full ${locked ? "bg-muted text-muted-foreground" : "bg-white/45"}`}>{locked ? <LockKeyhole className="size-12" /> : <QuestArtwork value={quest.icon} type={quest.quest_type} fallback={visual.fallbackIcon} />}</span>
        </div>
        <h3 className="mt-1 line-clamp-1 font-display text-[22px] leading-tight text-[#0b2b28]" data-testid={`quest-title-${quest.key}`}>{quest.label}</h3>
        <p className="mx-auto mt-1.5 line-clamp-2 max-w-[205px] text-xs leading-relaxed text-[#687c77]" data-testid={`quest-description-${quest.key}`}>{description}</p>
      </div>

      <div className="relative z-10 mt-3 flex items-center justify-center gap-4">
        <ProgressRing value={progress} total={total} visual={visual} testId={`quest-progress-${quest.key}`} />
        <div className="min-w-0 text-left"><span className="mb-1 grid size-7 place-items-center rounded-lg bg-white/75" style={{ color: visual.progressColor }}>{visual.progressIcon}</span><p className="sr-only" data-testid={`quest-progress-text-${quest.key}`}>{progress} / {total}</p><p className="font-display text-base leading-tight text-[#173f38]" data-testid={`quest-remaining-${quest.key}`}>{credited ? "Completed" : `${remaining} more`}</p><p className="mt-0.5 text-[10px] text-[#71817c]">to complete</p></div>
      </div>

      <div className={`relative z-10 mt-3 flex h-10 items-center gap-2 rounded-full border px-3 text-xs font-bold ${locked ? "border-border bg-muted text-muted-foreground" : credited ? "border-[#bdebd9] bg-[#dff7ed] text-[#0c7059]" : visual.infoClass}`} data-testid={`quest-detail-${quest.key}`}><span className="[&_svg]:size-4">{locked ? <LockKeyhole /> : credited ? <ShieldCheck /> : visual.progressIcon}</span><span className="min-w-0 flex-1 truncate">{summary}</span><ChevronRight className="size-4 shrink-0 opacity-70" /><span className="sr-only">{detail}</span></div>

      <Button type="button" size="lg" variant="outline" className={`relative z-10 mt-auto h-12 w-full rounded-full border-0 text-sm font-extrabold ${locked || credited ? "border border-border bg-white/70 text-muted-foreground shadow-none" : visual.buttonClass}`} disabled={busy || credited} onClick={locked ? onLocked : onAction} data-testid={actionTestId}>{busy ? <Loader2 className="size-4 animate-spin" /> : locked ? <LockKeyhole className="size-4" /> : credited ? <Check className="size-4" /> : quest.quest_type === "ads" ? <Play className="size-4 fill-current" /> : quest.quest_type === "shortlink" ? <Link2 className="size-4" /> : <Gift className="size-4" />}{ctaText}</Button>
    </article>
  );
}