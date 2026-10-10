/**
 * Admin financial overview functions
 * Phase 6: Real ledger data for admin dashboard
 */

import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

interface FinancialOverview {
  totalDeposits: number;
  totalCampaignSpend: number;
  totalPublisherPayouts: number;
  platformFeeCollected: number;
  activeAdvertisers: number;
  activeCampaigns: number;
  pendingSubmissions: number;
}

/**
 * Get financial overview from real ledger data
 * Pulls from advertiser_ledger and campaign_submissions tables
 */
export const getFinancialOverviewImpl = async (): Promise<FinancialOverview> => {
  try {
    // Get total deposits from advertiser_ledger (kind = 'deposit')
    const { data: deposits, error: depositError } = await supabaseAdmin
      .from("advertiser_ledger")
      .select("amount")
      .eq("kind", "deposit");

    if (depositError) throw new Error(`Failed to fetch deposits: ${depositError.message}`);

    const totalDeposits = deposits?.reduce((sum, row) => sum + Number(row.amount), 0) ?? 0;

    // Get total campaign spend from advertiser_ledger (kind = 'conversion_charge')
    const { data: charges, error: chargeError } = await supabaseAdmin
      .from("advertiser_ledger")
      .select("amount")
      .eq("kind", "conversion_charge");

    if (chargeError) throw new Error(`Failed to fetch campaign spend: ${chargeError.message}`);

    const totalCampaignSpend = charges?.reduce((sum, row) => sum + Number(row.amount), 0) ?? 0;

    // Get total publisher payouts from campaign_submissions (status approved/appeal_approved, sum reward_amount)
    const { data: payouts, error: payoutError } = await supabaseAdmin
      .from("campaign_submissions")
      .select("reward_amount")
      .in("status", ["approved", "appeal_approved"]);

    if (payoutError) throw new Error(`Failed to fetch payouts: ${payoutError.message}`);

    const totalPublisherPayouts = payouts?.reduce((sum, row) => sum + Number(row.reward_amount), 0) ?? 0;

    // Calculate platform fee: total campaign spend minus total publisher payouts
    const platformFeeCollected = totalCampaignSpend - totalPublisherPayouts;

    // Get active advertisers count
    const { count: activeAdvertisers, error: advertiserError } = await supabaseAdmin
      .from("advertiser_accounts")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    if (advertiserError) throw new Error(`Failed to fetch advertisers: ${advertiserError.message}`);

    // Get active campaigns count
    const { count: activeCampaigns, error: campaignError } = await supabaseAdmin
      .from("campaigns")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    if (campaignError) throw new Error(`Failed to fetch campaigns: ${campaignError.message}`);

    // Get pending submissions count
    const { count: pendingSubmissions, error: submissionError } = await supabaseAdmin
      .from("campaign_submissions")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "appealed"]);

    if (submissionError) throw new Error(`Failed to fetch submissions: ${submissionError.message}`);

    return {
      totalDeposits,
      totalCampaignSpend,
      totalPublisherPayouts,
      platformFeeCollected,
      activeAdvertisers: activeAdvertisers ?? 0,
      activeCampaigns: activeCampaigns ?? 0,
      pendingSubmissions: pendingSubmissions ?? 0,
    };
  } catch (error) {
    console.error("[getFinancialOverview] Error:", error);
    throw error;
  }
};

export const getFinancialOverview = createServerFn({ method: "GET" }).handler(getFinancialOverviewImpl);
