/**
 * Shared pricing calculation module for marketplace campaigns.
 * Used by both server-side preflight checks and client-side UI.
 * 
 * Mirrors SQL functions:
 * - mkt__cost: calculates advertiser cost per slot
 * - Campaign fee logic from mkt_submit_campaign_with_fee
 */

/**
 * Calculate cost per slot (mirrors SQL mkt__cost function).
 * Rounds UP to the cent to match database behavior.
 * 
 * @param reward - Publisher reward per completion
 * @param feePercent - Platform fee percentage (0-100)
 * @returns Cost per slot rounded up to nearest cent
 */
export function costPerSlot(reward: number, feePercent: number): number {
  if (feePercent >= 100) {
    throw new Error("Fee percent must be less than 100");
  }
  return Math.ceil((reward * 100) / (1 - feePercent / 100)) / 100;
}

export type CampaignTotalsInput = {
  slots: number;
  reward: number;
  feePercent: number;
  feesEnabled: boolean;
  feeUsd: number;
  feeType: "per_campaign" | "per_slot";
  featuredFee?: number;
};

export type CampaignTotals = {
  allocation: number;        // Budget allocated to slots (slots × cost per slot)
  campaignFee: number;       // Campaign creation fee
  featuredFee: number;       // Featured placement fee
  total: number;             // Total cost (allocation + campaignFee + featuredFee)
};

/**
 * Calculate complete campaign cost breakdown.
 * 
 * @param input - Campaign configuration
 * @returns Breakdown of all costs
 */
export function campaignTotals(input: CampaignTotalsInput): CampaignTotals {
  const { slots, reward, feePercent, feesEnabled, feeUsd, feeType, featuredFee = 0 } = input;

  // Calculate allocation (budget for slots)
  const costPerSlotValue = costPerSlot(reward, feePercent);
  const allocation = slots * costPerSlotValue;

  // Calculate campaign fee
  let campaignFee = 0;
  if (feesEnabled) {
    if (feeType === "per_campaign") {
      campaignFee = feeUsd;
    } else {
      // per_slot
      campaignFee = feeUsd * slots;
    }
  }

  // Total cost
  const total = allocation + campaignFee + featuredFee;

  return {
    allocation: Math.round(allocation * 100) / 100,
    campaignFee: Math.round(campaignFee * 100) / 100,
    featuredFee: Math.round(featuredFee * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Check if advertiser has sufficient funds for campaign creation.
 * 
 * Preflight rule:
 * - Total spendable (deposit + bonus) must cover total cost
 * - Deposit alone must cover campaign fee + featured fee (fees can't use bonus)
 * 
 * @param params - Object with spendable, deposit, and totals
 * @returns true if funds are sufficient
 */
export function hasSufficientFunds(params: {
  spendable: number;
  deposit: number;
  totals: CampaignTotals;
}): boolean {
  const { spendable, deposit, totals } = params;
  const feesOnly = totals.campaignFee + totals.featuredFee;

  return spendable >= totals.total && deposit >= feesOnly;
}
