import type { BannerSection } from "./server";

/**
 * Smart banners are NEVER stored in the DB. They are a small set of message
 * templates defined here; each template receives the live user/app data
 * already available in the app and returns a concrete banner (or null).
 *
 * Every value shown MUST come from real data at render time — never fake a
 * number, streak, count or availability.
 */

export type SmartBanner = {
  id: string;
  section: BannerSection;
  title: string;
  description: string;
  priority: number;
  variant: "welcome" | "streak" | "progress" | "opportunity" | "info";
  cta: { label: string; route: string } | null;
};

export type SmartContext = {
  profile: {
    onboarded?: boolean | null;
    streak_count?: number | null;
    lifetime_earned?: number | string | null;
    updated_at?: string | null;
    name?: string | null;
  } | null;
  offersCount: number;
  hasHighValueOffer: boolean;
  tasksInProgress: number;
  tasksNearComplete: number; // >=70% progress not yet completed
  activeOfferwallCount: number;
};

const STREAK_GOAL = 7;

function firstName(name?: string | null): string {
  const n = (name ?? "").trim().split(/\s+/)[0];
  return n || "there";
}

export function buildSmartBanners(section: BannerSection, ctx: SmartContext): SmartBanner[] {
  const banners: SmartBanner[] = [];
  const profile = ctx.profile;
  const isNew = !profile?.lifetime_earned || Number(profile.lifetime_earned) === 0;
  const streak = Number(profile?.streak_count ?? 0);

  if (section === "home") {
    if (isNew) {
      banners.push({
        id: "smart:home:new-user",
        section,
        title: `Welcome, ${firstName(profile?.name)} 👋`,
        description:
          "Start with a Starter Quest — watch a few ads and earn your first $1.00 in minutes.",
        priority: 50,
        variant: "welcome",
        cta: { label: "Start earning", route: "/home" },
      });
    } else {
      banners.push({
        id: "smart:home:returning",
        section,
        title: `Welcome back, ${firstName(profile?.name)}!`,
        description: "Fresh offers and tasks are waiting to top up your wallet today.",
        priority: 20,
        variant: "welcome",
        cta: { label: "See what's new", route: "/offers" },
      });
    }
    if (streak > 0) {
      const toGoal = Math.max(0, STREAK_GOAL - (streak % STREAK_GOAL));
      banners.push({
        id: "smart:home:streak",
        section,
        title: `🔥 ${streak}-day streak`,
        description:
          toGoal === 0
            ? "You just hit a streak bonus — nice one. Keep it rolling tomorrow."
            : `${toGoal} more ${toGoal === 1 ? "day" : "days"} until your next streak bonus.`,
        priority: 40,
        variant: "streak",
        cta: { label: "Earn today", route: "/task" },
      });
    }
    if (ctx.hasHighValueOffer) {
      banners.push({
        id: "smart:home:hot-offer",
        section,
        title: "High-paying offer live",
        description: "A partner offer worth $1+ just landed. Grab it while it's up.",
        priority: 30,
        variant: "opportunity",
        cta: { label: "View offer", route: "/offers" },
      });
    }
  }

  if (section === "offers") {
    if (ctx.offersCount > 0) {
      banners.push({
        id: "smart:offers:count",
        section,
        title: `${ctx.offersCount} offer${ctx.offersCount === 1 ? "" : "s"} ready for you`,
        description: "Complete any and we'll credit your wallet after review.",
        priority: 20,
        variant: "opportunity",
        cta: { label: "Browse offers", route: "/offers" },
      });
    }
    if (ctx.hasHighValueOffer) {
      banners.push({
        id: "smart:offers:high-value",
        section,
        title: "Big payout available",
        description: "One of today's partner offers pays more than $1 — check it out first.",
        priority: 40,
        variant: "opportunity",
        cta: null,
      });
    }
  }

  if (section === "tasks") {
    if (ctx.tasksNearComplete > 0) {
      banners.push({
        id: "smart:tasks:near-complete",
        section,
        title: `${ctx.tasksNearComplete} task${ctx.tasksNearComplete === 1 ? "" : "s"} almost done`,
        description: "Finish the last steps to unlock the rewards you've already earned.",
        priority: 50,
        variant: "progress",
        cta: { label: "Finish tasks", route: "/task" },
      });
    } else if (ctx.tasksInProgress > 0) {
      banners.push({
        id: "smart:tasks:in-progress",
        section,
        title: "Keep the momentum going",
        description: `You've started ${ctx.tasksInProgress} task${
          ctx.tasksInProgress === 1 ? "" : "s"
        } — a few more steps unlocks the payout.`,
        priority: 30,
        variant: "progress",
        cta: null,
      });
    }
    if (streak > 0) {
      banners.push({
        id: "smart:tasks:streak",
        section,
        title: `Day ${streak} of your streak`,
        description: "Complete at least one task today to keep the streak alive.",
        priority: 20,
        variant: "streak",
        cta: null,
      });
    }
  }

  if (section === "offerwall") {
    if (ctx.activeOfferwallCount > 0) {
      banners.push({
        id: "smart:offerwall:live",
        section,
        title: `${ctx.activeOfferwallCount} network${
          ctx.activeOfferwallCount === 1 ? "" : "s"
        } live`,
        description: "Games, surveys and downloads — each partner pays into the same wallet.",
        priority: 20,
        variant: "opportunity",
        cta: { label: "Browse networks", route: "/offerwall" },
      });
    } else {
      banners.push({
        id: "smart:offerwall:empty",
        section,
        title: "New partners on the way",
        description: "We're onboarding new offerwall networks. Check back soon.",
        priority: 10,
        variant: "info",
        cta: null,
      });
    }
  }

  return banners;
}
