/**
 * Reward mode for manual offers: a flat amount, or a percentage of the offer's
 * payout.
 *
 * Shared (not server-only) so the admin form can preview exactly what the server
 * will store — the server is still the authority, `upsertManualOfferImpl`
 * recomputes on every save and ignores whatever reward the client sent.
 *
 * Distinct from two mechanisms that already exist and are deliberately untouched:
 *   - `payout_percentage` x `actual_cost` capped by `max_payout_cap`, used for
 *     self-funded Limited Deals (see computeLimitedDealReward).
 *   - `revenue_share` x `network_payout`, written by the network sync.
 */

export type RewardMode = "fixed" | "percent_payout";

/** Mirrors the offers_reward_percentage_check ceiling in the DB. */
export const MAX_REWARD_PERCENTAGE = 500;

export type RewardBasisInput = {
  networkPayout?: number | string | null | undefined;
  actualCost?: number | string | null | undefined;
};

const toPositiveNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * The figure a percentage applies to: the network payout if present, otherwise
 * the actual cost. Returns null when neither is set, which is what makes
 * percentage mode unavailable in the UI.
 */
export function rewardBase(input: RewardBasisInput): number | null {
  return toPositiveNumber(input.networkPayout) ?? toPositiveNumber(input.actualCost);
}

/** Which field the base came from, for labelling the admin UI. */
export function rewardBaseLabel(input: RewardBasisInput): "payout" | "cost" | null {
  if (toPositiveNumber(input.networkPayout) != null) return "payout";
  if (toPositiveNumber(input.actualCost) != null) return "cost";
  return null;
}

/** base x pct / 100, clamped to >= 0 and rounded to cents. */
export function computePercentReward(base: number, percentage: number | string | null): number {
  const pct = Number(percentage ?? 0);
  if (!Number.isFinite(base) || base <= 0) return 0;
  if (!Number.isFinite(pct) || pct <= 0) return 0;
  const clamped = Math.min(pct, MAX_REWARD_PERCENTAGE);
  return Math.max(0, Math.round(((base * clamped) / 100) * 100) / 100);
}

/**
 * Final reward to store in `offers.reward_amount`.
 *
 * Falls back to the fixed amount whenever percentage mode can't be satisfied
 * (no percentage, or no base payout to apply it to), so a half-filled form can
 * never silently store a 0 reward.
 */
export function resolveRewardAmount(input: {
  rewardMode: RewardMode;
  rewardAmount: number;
  rewardPercentage?: number | string | null | undefined;
  networkPayout?: number | string | null | undefined;
  actualCost?: number | string | null | undefined;
}): number {
  const fixed = Math.max(0, Math.round((Number(input.rewardAmount) || 0) * 100) / 100);
  if (input.rewardMode !== "percent_payout") return fixed;

  const base = rewardBase(input);
  const pct = Number(input.rewardPercentage ?? 0);
  if (base == null || !Number.isFinite(pct) || pct <= 0) return fixed;

  return computePercentReward(base, pct);
}
