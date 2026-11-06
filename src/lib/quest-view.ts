import {
  CalendarCheck,
  Clapperboard,
  Link2,
  Lock,
  LockKeyhole,
  Network,
  ShieldCheck,
  MessageSquare,
  Timer,
  type LucideIcon,
} from "lucide-react";

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
  // Checkin-specific fields
  checkin_days?: Array<{
    local_date: string;
    active_seconds?: number;
    last_ping_at?: string | null;
    completed_at?: string | null;
  }>;
  // Network quest progress
  network_completions?: Array<{
    provider_id: string;
    provider_name: string;
    provider_logo_url?: string;
  }>;
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
  checkin: {
    label: "Streak",
    icon: CalendarCheck,
    wash: "rgba(139,92,246,0.10)",
    badgeBg: "rgba(139,92,246,0.12)",
    badgeInk: "#5B21B6",
    tile: "linear-gradient(145deg, #A78BFA 0%, #7C3AED 100%)",
    tileShadow: "rgba(124,58,237,0.32)",
    bar: "linear-gradient(90deg, #A78BFA, #7C3AED)",
  },
  network: {
    label: "Network",
    icon: Network,
    wash: "rgba(236,72,153,0.10)",
    badgeBg: "rgba(236,72,153,0.12)",
    badgeInk: "#9F1239",
    tile: "linear-gradient(145deg, #F472B6 0%, #DB2777 100%)",
    tileShadow: "rgba(219,39,119,0.32)",
    bar: "linear-gradient(90deg, #F472B6, #DB2777)",
  },
  feed_ptc: {
    label: "PTC Feed",
    icon: Clapperboard,
    wash: "rgba(16,163,113,0.10)",
    badgeBg: "rgba(16,163,113,0.12)",
    badgeInk: "#0A6B4A",
    tile: "linear-gradient(145deg, #34D399 0%, #059669 100%)",
    tileShadow: "rgba(5,150,105,0.32)",
    bar: "linear-gradient(90deg, #34D399, #059669)",
  },
  feed_shortlink: {
    label: "Link Feed",
    icon: Link2,
    wash: "rgba(217,119,6,0.10)",
    badgeBg: "rgba(217,119,6,0.13)",
    badgeInk: "#92400E",
    tile: "linear-gradient(145deg, #FBBF24 0%, #D97706 100%)",
    tileShadow: "rgba(217,119,6,0.32)",
    bar: "linear-gradient(90deg, #FBBF24, #D97706)",
  },
  feed_article: {
    label: "Read Feed",
    icon: Link2,
    wash: "rgba(2,132,199,0.10)",
    badgeBg: "rgba(2,132,199,0.12)",
    badgeInk: "#075985",
    tile: "linear-gradient(145deg, #38BDF8 0%, #0369A1 100%)",
    tileShadow: "rgba(3,105,161,0.32)",
    bar: "linear-gradient(90deg, #38BDF8, #0369A1)",
  },
  survey: {
    label: "Survey",
    icon: MessageSquare,
    wash: "rgba(14,165,233,0.10)",
    badgeBg: "rgba(14,165,233,0.12)",
    badgeInk: "#0C4A6E",
    tile: "linear-gradient(145deg, #0EA5E9 0%, #0284C7 100%)",
    tileShadow: "rgba(2,132,199,0.32)",
    bar: "linear-gradient(90deg, #0EA5E9, #0284C7)",
  },
  timed_ptc: {
    label: "Timed PTC",
    icon: Timer,
    wash: "rgba(251,146,60,0.10)",
    badgeBg: "rgba(251,146,60,0.12)",
    badgeInk: "#9A3412",
    tile: "linear-gradient(145deg, #FB923C 0%, #EA580C 100%)",
    tileShadow: "rgba(234,88,12,0.32)",
    bar: "linear-gradient(90deg, #FB923C, #EA580C)",
  },
  active_time: {
    label: "Active Time",
    icon: Timer,
    wash: "rgba(99,102,241,0.10)",
    badgeBg: "rgba(99,102,241,0.12)",
    badgeInk: "#3730A3",
    tile: "linear-gradient(145deg, #818CF8 0%, #6366F1 100%)",
    tileShadow: "rgba(99,102,241,0.32)",
    bar: "linear-gradient(90deg, #818CF8, #6366F1)",
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
  activeTimeProgress?: { total_seconds: number; today_seconds: number } | null,
): QuestView {
  if (quest.quest_type === "survey") {
    // Survey quest: complete N surveys from allowed networks
    const total = Math.max(1, quest.required_surveys ?? 5);
    const progress = credited ? total : (active?.survey_completions_count ?? 0);

    return {
      total,
      progress,
      remaining: Math.max(0, total - progress),
      nextStep: Math.min(progress + 1, total),
      progressPercent: Math.min(100, Math.max(0, (progress / Math.max(1, total)) * 100)),
      description: `Complete ${total} ${total === 1 ? "survey" : "surveys"} and get rewarded!`,
    };
  }

  if (quest.quest_type === "network") {
    // Network quest: K completions from N providers
    const total = Math.max(1, quest.required_count ?? 3);
    const progress = credited ? total : (active?.network_completions?.length ?? 0);

    return {
      total,
      progress,
      remaining: Math.max(0, total - progress),
      nextStep: Math.min(progress + 1, total),
      progressPercent: Math.min(100, Math.max(0, (progress / Math.max(1, total)) * 100)),
      description: `Complete offers from ${total} ${total === 1 ? "network" : "networks"} and get rewarded!`,
    };
  }

  if (
    quest.quest_type === "feed_ptc" ||
    quest.quest_type === "feed_shortlink" ||
    quest.quest_type === "feed_article"
  ) {
    // Feed quest: complete N sequential campaigns from dynamic feed
    const total = Math.max(1, quest.steps_count ?? 10);
    const progress = credited ? total : (active?.current_step ?? 0);

    const feedTypeName =
      quest.quest_type === "feed_ptc"
        ? "PTC campaign"
        : quest.quest_type === "feed_shortlink"
          ? "shortlink"
          : "article";

    return {
      total,
      progress,
      remaining: Math.max(0, total - progress),
      nextStep: Math.min(progress + 1, total),
      progressPercent: Math.min(100, Math.max(0, (progress / Math.max(1, total)) * 100)),
      description:
        total === 1
          ? `Complete the ${feedTypeName} and get rewarded!`
          : `Complete ${total} ${feedTypeName}s and get rewarded!`,
    };
  }

  if (quest.quest_type === "checkin") {
    // Checkin quest: each day = one step
    const total = Math.max(1, quest.total_days ?? 3);
    const completedDays = active?.checkin_days?.filter((d) => d.completed_at) ?? [];
    const progress = credited ? total : completedDays.length;

    return {
      total,
      progress,
      remaining: Math.max(0, total - progress),
      nextStep: Math.min(progress + 1, total),
      progressPercent: Math.min(100, Math.max(0, (progress / Math.max(1, total)) * 100)),
      description:
        total === 1
          ? "Check in today and get rewarded!"
          : `Check in for ${total} days and build your streak!`,
    };
  }

  if (quest.quest_type === "active_time") {
    // Active Time quest: accumulate minutes of active app usage
    const total = Math.max(1, quest.target_minutes ?? 30);
    const progressMinutes = activeTimeProgress ? activeTimeProgress.total_seconds / 60 : 0;
    const progress = credited ? total : Math.min(total, Math.floor(progressMinutes));

    return {
      total,
      progress,
      remaining: Math.max(0, total - progress),
      nextStep: Math.min(progress + 1, total),
      progressPercent: Math.min(100, Math.max(0, (progressMinutes / Math.max(1, total)) * 100)),
      description: `Stay active in the app for ${total} ${total === 1 ? "minute" : "minutes"} to earn your reward!`,
    };
  }

  if (quest.quest_type === "timed_ptc") {
    // Timed PTC quest: sequential steps with timer + checkpoints
    const total = Math.max(1, quest.timed_steps?.length ?? 1);
    const progress = credited ? total : (active?.current_step ?? 0);

    return {
      total,
      progress,
      remaining: Math.max(0, total - progress),
      nextStep: Math.min(progress + 1, total),
      progressPercent: Math.min(100, Math.max(0, (progress / Math.max(1, total)) * 100)),
      description:
        total === 1
          ? "Complete the timed step and get rewarded!"
          : `Complete ${total} timed steps and get rewarded!`,
    };
  }

  const total =
    quest.quest_type === "ads"
      ? Math.max(1, quest.ads_required)
      : quest.quest_type === "shortlink"
        ? Math.max(1, quest.shortlink_steps.length)
        : // locker: one step per configured locker, same as shortlink.
          Math.max(1, quest.locker_urls.length);
  const current = credited
    ? total
    : quest.quest_type === "ads"
      ? Number(active?.ads_watched ?? 0)
      : // Both shortlink and locker chains track progress in current_step.
        Number(active?.current_step ?? 0);
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
          : total === 1
            ? "Complete the locker challenge and unlock your reward!"
            : `Complete ${total} locker challenges and unlock your reward!`,
  };
}
