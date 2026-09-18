import { Clapperboard, Link2, Lock, LockKeyhole, ShieldCheck, type LucideIcon } from "lucide-react";

import type { QuestRow } from "@/lib/quests.server";

/**
 * Shared quest presentation model.
 *
 * Lives outside the component files so QuestCard and QuestDetailsDialog can both
 * use it without either importing the other, and so neither file mixes component
 * and non-component exports (which would break React fast refresh).
 */

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

/**
 * A quest category accent. Colour is deliberately confined to the icon tile,
 * the badge and the progress fill — never a full-card gradient, which is what
 * made the earlier revision read as candy.
 */
export type QuestAccent = {
  label: string;
  icon: LucideIcon;
  /** Faint wash behind the card header. */
  wash: string;
  badgeBg: string;
  badgeInk: string;
  tile: string;
  tileShadow: string;
  bar: string;
};

export const QUEST_ACCENTS: Record<QuestRow["quest_type"], QuestAccent> = {
  ads: {
    label: "Easy",
    icon: Clapperboard,
    wash: "rgba(16,163,113,0.10)",
    badgeBg: "rgba(16,163,113,0.12)",
    badgeInk: "#0A6B4A",
    tile: "linear-gradient(145deg, #34D399 0%, #059669 100%)",
    tileShadow: "rgba(5,150,105,0.32)",
    bar: "linear-gradient(90deg, #34D399, #059669)",
  },
  shortlink: {
    label: "Challenge",
    icon: Link2,
    wash: "rgba(217,119,6,0.10)",
    badgeBg: "rgba(217,119,6,0.13)",
    badgeInk: "#92400E",
    tile: "linear-gradient(145deg, #FBBF24 0%, #D97706 100%)",
    tileShadow: "rgba(217,119,6,0.32)",
    bar: "linear-gradient(90deg, #FBBF24, #D97706)",
  },
  locker: {
    label: "Daily",
    // Padlock (not a gift) — this is a content-locker quest. The blue accent is
    // kept because colour signals the category, not the glyph.
    icon: Lock,
    wash: "rgba(2,132,199,0.10)",
    badgeBg: "rgba(2,132,199,0.12)",
    badgeInk: "#075985",
    tile: "linear-gradient(145deg, #38BDF8 0%, #0369A1 100%)",
    tileShadow: "rgba(3,105,161,0.32)",
    bar: "linear-gradient(90deg, #38BDF8, #0369A1)",
  },
};

export const LOCKED_ACCENT: QuestAccent = {
  label: "Locked",
  icon: LockKeyhole,
  wash: "rgba(100,116,139,0.07)",
  badgeBg: "rgba(100,116,139,0.11)",
  badgeInk: "#52616F",
  tile: "linear-gradient(145deg, #CBD5E1 0%, #94A3B8 100%)",
  tileShadow: "rgba(100,116,139,0.26)",
  bar: "linear-gradient(90deg, #CBD5E1, #94A3B8)",
};

export const CREDITED_ACCENT: QuestAccent = {
  ...QUEST_ACCENTS.ads,
  label: "Completed",
  icon: ShieldCheck,
};

export type QuestView = {
  total: number;
  progress: number;
  remaining: number;
  nextStep: number;
  progressPercent: number;
  description: string;
};

/**
 * Progress + copy derived from a quest and its active session.
 *
 * Shared by QuestCard and QuestDetailsDialog so the two can never disagree
 * about how far along a quest is or which step comes next.
 */
export function deriveQuestView(
  quest: QuestCardQuest,
  active: QuestSessionView | undefined,
  credited: boolean,
): QuestView {
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
  return {
    total,
    progress,
    remaining: Math.max(0, total - progress),
    nextStep: Math.min(progress + 1, total),
    progressPercent: Math.min(100, Math.max(0, (progress / Math.max(1, total)) * 100)),
    description:
      quest.quest_type === "ads"
        ? `Watch ${total} ${total === 1 ? "video ad" : "video ads"} and get rewarded!`
        : quest.quest_type === "shortlink"
          ? `Visit ${total === 1 ? "the short link" : `${total} short links`} and get rewarded!`
          : "Complete the locker challenge and unlock your reward!",
  };
}
