import { i as createServerFn } from "./server-CpGMOUrW.mjs";
import { l as stringType, s as objectType } from "../_libs/zod.mjs";
import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
import { t as createServerRpc } from "./createServerRpc-BPtk4SPL.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/advertiser-referral.server-UP6WaY4H.js
/**
* Advertiser referral tracking for Phase 7
* Uses same referral link - tracks when referred users become advertisers
*/
init_client_server();
var ADVERTISER_REFERRAL_REWARD = 10;
/**
* Get advertiser referral stats for a user
* Checks their referrals table entries to see which referred users:
* 1. Created an advertiser account (advertiser_accounts table)
* 2. Made a credited first deposit (advertiser_deposits with credited_at not null)
*/
var getAdvertiserReferralStatsInput = objectType({ userId: stringType().uuid() });
var getAdvertiserReferralStatsImpl = async (input) => {
	const { userId } = getAdvertiserReferralStatsInput.parse(input);
	const { data: referrals, error: referralsError } = await supabaseAdmin.from("referrals").select("referred_id").eq("referrer_id", userId);
	if (referralsError) throw new Error(`Failed to fetch referrals: ${referralsError.message}`);
	if (!referrals || referrals.length === 0) return {
		referredAdvertisers: 0,
		totalDeposits: 0,
		rewardsEarned: 0,
		referralPercent: 50
	};
	const referredIds = referrals.map((r) => r.referred_id);
	const { data: advertiserAccounts, error: accountsError } = await supabaseAdmin.from("advertiser_accounts").select("user_id").in("user_id", referredIds);
	if (accountsError) throw new Error(`Failed to fetch advertiser accounts: ${accountsError.message}`);
	const referredAdvertisers = advertiserAccounts?.length ?? 0;
	if (referredAdvertisers === 0) return {
		referredAdvertisers: 0,
		totalDeposits: 0,
		rewardsEarned: 0,
		referralPercent: 50
	};
	const advertiserIds = advertiserAccounts?.map((a) => a.user_id) ?? [];
	const { data: creditedDeposits, error: depositsError } = await supabaseAdmin.from("advertiser_deposits").select("advertiser_id").in("advertiser_id", advertiserIds).not("credited_at", "is", null).order("credited_at", { ascending: true });
	if (depositsError) throw new Error(`Failed to fetch deposits: ${depositsError.message}`);
	const qualifyingActivations = new Set(creditedDeposits?.map((d) => d.advertiser_id) ?? []).size;
	return {
		referredAdvertisers,
		totalDeposits: qualifyingActivations,
		rewardsEarned: qualifyingActivations * ADVERTISER_REFERRAL_REWARD,
		referralPercent: 50
	};
};
var getAdvertiserReferralStats_createServerFn_handler = createServerRpc({
	id: "afdd46c7530466a0c353f0987cbdf1db8dc3874d98680aa441278ca95b82d708",
	name: "getAdvertiserReferralStats",
	filename: "src/lib/marketplace/advertiser-referral.server.ts"
}, (opts) => getAdvertiserReferralStats.__executeServer(opts));
var getAdvertiserReferralStats = createServerFn({ method: "GET" }).validator(getAdvertiserReferralStatsInput).handler(getAdvertiserReferralStats_createServerFn_handler, ({ data }) => getAdvertiserReferralStatsImpl(data));
//#endregion
export { getAdvertiserReferralStats_createServerFn_handler };
