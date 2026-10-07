/**
 * Advertiser referral tracking for Phase 7
 * Uses same referral link - tracks when referred users become advertisers
 */

import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export interface AdvertiserReferralStats {
  referredAdvertisers: number; // Count of referred users who created advertiser accounts
  qualifyingActivations: number; // Count who made their first credited deposit
  rewardsEarned: number; // Total rewards from advertiser referrals
  rewardPerActivation: number; // Fixed reward amount per qualifying activation
}

const ADVERTISER_REFERRAL_REWARD = 10; // $10 per qualifying activation

/**
 * Get advertiser referral stats for a user
 * Checks their referrals table entries to see which referred users:
 * 1. Created an advertiser account (advertiser_accounts table)
 * 2. Made a credited first deposit (advertiser_deposits with credited_at not null)
 */
const getAdvertiserReferralStatsInput = z.object({
  userId: z.string().uuid(),
});

export const getAdvertiserReferralStatsImpl = async (
  input: z.infer<typeof getAdvertiserReferralStatsInput>
): Promise<AdvertiserReferralStats> => {
  const { userId } = getAdvertiserReferralStatsInput.parse(input);
  const supabase = supabaseAdmin();

  // Get all referrals where this user is the referrer
  const { data: referrals, error: referralsError } = await supabase
    .from("referrals")
    .select("referred_id")
    .eq("referrer_id", userId);

  if (referralsError) throw new Error(`Failed to fetch referrals: ${referralsError.message}`);

  if (!referrals || referrals.length === 0) {
    return {
      referredAdvertisers: 0,
      qualifyingActivations: 0,
      rewardsEarned: 0,
      rewardPerActivation: ADVERTISER_REFERRAL_REWARD,
    };
  }

  const referredIds = referrals.map((r) => r.referred_id);

  // Check which referred users have advertiser accounts
  const { data: advertiserAccounts, error: accountsError } = await supabase
    .from("advertiser_accounts")
    .select("user_id")
    .in("user_id", referredIds);

  if (accountsError) throw new Error(`Failed to fetch advertiser accounts: ${accountsError.message}`);

  const referredAdvertisers = advertiserAccounts?.length ?? 0;

  if (referredAdvertisers === 0) {
    return {
      referredAdvertisers: 0,
      qualifyingActivations: 0,
      rewardsEarned: 0,
      rewardPerActivation: ADVERTISER_REFERRAL_REWARD,
    };
  }

  const advertiserIds = advertiserAccounts?.map((a) => a.user_id) ?? [];

  // Check which advertisers have credited deposits (qualifying activation)
  const { data: creditedDeposits, error: depositsError} = await supabase
    .from("advertiser_deposits")
    .select("advertiser_id")
    .in("advertiser_id", advertiserIds)
    .not("credited_at", "is", null)
    .order("credited_at", { ascending: true });

  if (depositsError) throw new Error(`Failed to fetch deposits: ${depositsError.message}`);

  // Count unique advertisers with at least one credited deposit (first deposit counts as activation)
  const uniqueActivatedAdvertisers = new Set(
    creditedDeposits?.map((d) => d.advertiser_id) ?? []
  ).size;

  const qualifyingActivations = uniqueActivatedAdvertisers;
  const rewardsEarned = qualifyingActivations * ADVERTISER_REFERRAL_REWARD;

  return {
    referredAdvertisers,
    qualifyingActivations,
    rewardsEarned,
    rewardPerActivation: ADVERTISER_REFERRAL_REWARD,
  };
};

export const getAdvertiserReferralStats = createServerFn({ method: "GET" })
  .validator(getAdvertiserReferralStatsInput)
  .handler(({ data }) => getAdvertiserReferralStatsImpl(data));
