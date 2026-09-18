import { REFERRAL_MAX_BONUS, REFERRAL_MILESTONE_BONUS, REFERRAL_WINDOW_DAYS } from "./coinquest";

/**
 * Referral milestone progress, shared by the server (to decide when to release
 * the reward) and the Referral screen (to display pending vs credited), so the
 * two can never disagree about how much a referral is worth.
 *
 * The three milestones are tracked individually but pay nothing on their own —
 * the full REFERRAL_MAX_BONUS is released to the main wallet only at 3/3.
 */

export const REFERRAL_MILESTONE_KEYS = [
  "signup_credited_at",
  "earning_credited_at",
  "withdrawal_credited_at",
] as const;

export type ReferralMilestoneKey = (typeof REFERRAL_MILESTONE_KEYS)[number];

export const REFERRAL_MILESTONE_COUNT = REFERRAL_MILESTONE_KEYS.length;

/** Only the fields progress depends on, so both a DB row and a test fixture fit. */
export type ReferralProgressInput = {
  created_at: string;
  signup_credited_at: string | null;
  earning_credited_at: string | null;
  withdrawal_credited_at: string | null;
  bonus_amount: number | string | null;
  reward_released_at?: string | null;
  status?: string | null;
};

export type ReferralRewardState =
  /** Some milestones outstanding, reward accruing but locked. */
  | "in_progress"
  /** All milestones done, release in flight (transient). */
  | "unlocked"
  /** Reward released into the main wallet. */
  | "credited"
  /** 365-day window elapsed before 3/3 — nothing will be released. */
  | "expired";

export type ReferralProgress = {
  /** Completed milestones, 0..REFERRAL_MILESTONE_COUNT. */
  completed: number;
  total: number;
  allComplete: boolean;
  /** Earned by milestones but NOT yet in the main wallet. */
  pendingAmount: number;
  /** Actually released into the main wallet. */
  creditedAmount: number;
  /** Full value of the referral once all milestones land. */
  maxAmount: number;
  released: boolean;
  expired: boolean;
  /** Days left in the 365-day window; 0 once elapsed. */
  daysRemaining: number;
  state: ReferralRewardState;
  /** Next milestone the friend needs to hit, or null at 3/3. */
  nextMilestone: ReferralMilestoneKey | null;
};

const DAY_MS = 86_400_000;

export function deriveReferralProgress(
  referral: ReferralProgressInput,
  now: number = Date.now(),
): ReferralProgress {
  const completed = REFERRAL_MILESTONE_KEYS.filter((key) => Boolean(referral[key])).length;
  const allComplete = completed === REFERRAL_MILESTONE_COUNT;

  // bonus_amount is what actually reached the wallet (0 before the release).
  const creditedAmount = Math.max(0, Number(referral.bonus_amount ?? 0));
  const released = Boolean(referral.reward_released_at) || creditedAmount >= REFERRAL_MAX_BONUS;

  const ageMs = now - new Date(referral.created_at).getTime();
  const windowMs = REFERRAL_WINDOW_DAYS * DAY_MS;
  const expired = !released && (referral.status === "expired" || ageMs > windowMs);

  // Milestones earn REFERRAL_MILESTONE_BONUS each. Anything a legacy row already
  // had credited under the old per-milestone model is not pending any more.
  const earnedByMilestones = completed * REFERRAL_MILESTONE_BONUS;
  const pendingAmount = released || expired ? 0 : Math.max(0, earnedByMilestones - creditedAmount);

  const state: ReferralRewardState = released
    ? "credited"
    : expired
      ? "expired"
      : allComplete
        ? "unlocked"
        : "in_progress";

  return {
    completed,
    total: REFERRAL_MILESTONE_COUNT,
    allComplete,
    pendingAmount,
    creditedAmount,
    maxAmount: REFERRAL_MAX_BONUS,
    released,
    expired,
    daysRemaining: Math.max(0, Math.ceil((windowMs - ageMs) / DAY_MS)),
    state,
    nextMilestone: REFERRAL_MILESTONE_KEYS.find((key) => !referral[key]) ?? null,
  };
}

export type ReferralTotals = {
  /** Unlocked by milestones but still locked out of the main wallet. */
  pending: number;
  /** Already released into the main wallet. */
  credited: number;
  /** pending + credited. */
  total: number;
  /** Referrals still inside the window and not yet complete. */
  inProgress: number;
  completed: number;
  expired: number;
};

export function sumReferralTotals(
  referrals: ReferralProgressInput[],
  now: number = Date.now(),
): ReferralTotals {
  return referrals.reduce<ReferralTotals>(
    (totals, referral) => {
      const progress = deriveReferralProgress(referral, now);
      totals.pending += progress.pendingAmount;
      totals.credited += progress.creditedAmount;
      totals.total = totals.pending + totals.credited;
      if (progress.state === "credited") totals.completed += 1;
      else if (progress.state === "expired") totals.expired += 1;
      else totals.inProgress += 1;
      return totals;
    },
    { pending: 0, credited: 0, total: 0, inProgress: 0, completed: 0, expired: 0 },
  );
}
