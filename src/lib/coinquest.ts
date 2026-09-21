export const QUESTS = [
  { key: "starter_5", label: "5 Ads", ads: 5, reward: 1 },
  { key: "starter_25", label: "25 Ads", ads: 25, reward: 1 },
  { key: "starter_50", label: "50 Ads", ads: 50, reward: 1 },
] as const;

export type QuestKey = (typeof QUESTS)[number]["key"];

export const MIN_WITHDRAWAL = 5;
/** Minimum seconds a single rewarded video must run before the server accepts it. */
export const MIN_SECONDS_PER_AD = 5;
/** Fraud guard: max ads credited per user per rolling hour. */
export const MAX_ADS_PER_HOUR = 80;
/** Consecutive active days needed for a streak bonus. */
export const STREAK_GOAL = 7;
export const STREAK_BONUS = 1;
/** Credit paid to the referrer per referral milestone. */
export const REFERRAL_MILESTONE_BONUS = 1;
/** Maximum a referrer can earn from a single referral (3 x $1 milestones). */
export const REFERRAL_MAX_BONUS = REFERRAL_MILESTONE_BONUS * 3;
/** Days a referral has to complete all milestones before the credited bonuses are reversed. */
export const REFERRAL_WINDOW_DAYS = 365;
/**
 * Allowed number of steps in a shortlink-chain quest. Shared by the zod schema,
 * the server-side validation and the admin form so the three can never disagree.
 */
export const SHORTLINK_MIN_STEPS = 1;
export const SHORTLINK_MAX_STEPS = 10;

export function formatMoney(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return `$${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
