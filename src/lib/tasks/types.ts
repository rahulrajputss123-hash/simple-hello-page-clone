/** Shared (client-safe) task automation vocabulary. */

export const TASK_TYPES = [
  "manual",
  "referral_count",
  "referral_window",
  "referral_daily",
  "offer_completion",
  "ad_watch",
  "shortlink",
  "content_locker",
  "offerwall_earning",
] as const;

export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  manual: "Manual (step based)",
  referral_count: "Referral count",
  referral_window: "Referral count in period",
  referral_daily: "Daily referral target",
  offer_completion: "Offer completion",
  ad_watch: "Ads watched",
  shortlink: "Shortlink completion",
  content_locker: "Content locker completion",
  offerwall_earning: "SDK Offerwall earning target",
};

export const TASK_FREQUENCIES = ["daily", "weekly", "one_time", "lifetime"] as const;
export type TaskFrequency = (typeof TASK_FREQUENCIES)[number];

export const TASK_FREQUENCY_LABELS: Record<TaskFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  one_time: "One time",
  lifetime: "Lifetime",
};

/** Event stream names produced by real user activity. */
export const TASK_EVENT_TYPES = [
  "referral",
  "offer_completion",
  "ad_watch",
  "shortlink",
  "content_locker",
  "offerwall_earning",
] as const;
export type TaskEventType = (typeof TASK_EVENT_TYPES)[number];

/** Which activity stream drives each automated task type. */
export const TASK_TYPE_EVENT: Record<TaskType, TaskEventType | null> = {
  manual: null,
  referral_count: "referral",
  referral_window: "referral",
  referral_daily: "referral",
  offer_completion: "offer_completion",
  ad_watch: "ad_watch",
  shortlink: "shortlink",
  content_locker: "content_locker",
  offerwall_earning: "offerwall_earning",
};

/** Bucket a moment in time into the reset period of a task. */
export function periodKey(frequency: TaskFrequency, at: Date = new Date()): string {
  if (frequency === "daily") return at.toISOString().slice(0, 10);
  if (frequency === "weekly") {
    const d = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() - (day - 1));
    return `w${d.toISOString().slice(0, 10)}`;
  }
  return "lifetime";
}

/** Inclusive lower bound of the window progress is counted over. */
export function periodStart(
  input: { frequency: TaskFrequency; task_type: TaskType; window_days: number | null; starts_at: string | null },
  at: Date = new Date(),
): Date {
  if (input.task_type === "referral_daily") {
    return new Date(`${at.toISOString().slice(0, 10)}T00:00:00.000Z`);
  }
  if (input.task_type === "referral_window" && input.window_days) {
    return new Date(at.getTime() - input.window_days * 86_400_000);
  }
  if (input.frequency === "daily") return new Date(`${at.toISOString().slice(0, 10)}T00:00:00.000Z`);
  if (input.frequency === "weekly") return new Date(`${periodKey("weekly", at).slice(1)}T00:00:00.000Z`);
  return input.starts_at ? new Date(input.starts_at) : new Date(0);
}
