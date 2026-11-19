import { i as createServerFn } from "./server-CpGMOUrW.mjs";
import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
import { t as createServerRpc } from "./createServerRpc-BPtk4SPL.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-financial.server-79yv5434.js
/**
* Admin financial overview functions
* Phase 6: Real ledger data for admin dashboard
*/
init_client_server();
/**
* Get financial overview from real ledger data
* Pulls from advertiser_ledger and campaign_submissions tables
*/
var getFinancialOverviewImpl = async () => {
	try {
		const { data: deposits, error: depositError } = await supabaseAdmin.from("advertiser_ledger").select("amount").eq("kind", "deposit");
		if (depositError) throw new Error(`Failed to fetch deposits: ${depositError.message}`);
		const totalDeposits = deposits?.reduce((sum, row) => sum + Number(row.amount), 0) ?? 0;
		const { data: charges, error: chargeError } = await supabaseAdmin.from("advertiser_ledger").select("amount").eq("kind", "conversion_charge");
		if (chargeError) throw new Error(`Failed to fetch campaign spend: ${chargeError.message}`);
		const totalCampaignSpend = charges?.reduce((sum, row) => sum + Number(row.amount), 0) ?? 0;
		const { data: payouts, error: payoutError } = await supabaseAdmin.from("campaign_submissions").select("reward_amount").in("status", ["approved", "appeal_approved"]);
		if (payoutError) throw new Error(`Failed to fetch payouts: ${payoutError.message}`);
		const totalPublisherPayouts = payouts?.reduce((sum, row) => sum + Number(row.reward_amount), 0) ?? 0;
		const platformFeeCollected = totalCampaignSpend - totalPublisherPayouts;
		const { count: activeAdvertisers, error: advertiserError } = await supabaseAdmin.from("advertiser_accounts").select("*", {
			count: "exact",
			head: true
		}).eq("status", "active");
		if (advertiserError) throw new Error(`Failed to fetch advertisers: ${advertiserError.message}`);
		const { count: activeCampaigns, error: campaignError } = await supabaseAdmin.from("campaigns").select("*", {
			count: "exact",
			head: true
		}).eq("status", "active");
		if (campaignError) throw new Error(`Failed to fetch campaigns: ${campaignError.message}`);
		const { count: pendingSubmissions, error: submissionError } = await supabaseAdmin.from("campaign_submissions").select("*", {
			count: "exact",
			head: true
		}).in("status", ["pending", "appealed"]);
		if (submissionError) throw new Error(`Failed to fetch submissions: ${submissionError.message}`);
		return {
			totalDeposits,
			totalCampaignSpend,
			totalPublisherPayouts,
			platformFeeCollected,
			activeAdvertisers: activeAdvertisers ?? 0,
			activeCampaigns: activeCampaigns ?? 0,
			pendingSubmissions: pendingSubmissions ?? 0
		};
	} catch (error) {
		console.error("[getFinancialOverview] Error:", error);
		throw error;
	}
};
var getFinancialOverview_createServerFn_handler = createServerRpc({
	id: "ee21775ccd9c7dba68ac0e1967f05354f9c8557b2cceebf07c58224bf4b6189e",
	name: "getFinancialOverview",
	filename: "src/lib/marketplace/admin-financial.server.ts"
}, (opts) => getFinancialOverview.__executeServer(opts));
var getFinancialOverview = createServerFn({ method: "GET" }).handler(getFinancialOverview_createServerFn_handler, getFinancialOverviewImpl);
//#endregion
export { getFinancialOverview_createServerFn_handler };
