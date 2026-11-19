import { i as createServerFn } from "./server-CpGMOUrW.mjs";
import { i as enumType, o as numberType, r as booleanType, s as objectType } from "../_libs/zod.mjs";
import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
import { t as createServerRpc } from "./createServerRpc-BPtk4SPL.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-settings.server-C25xyjOM.js
/**
* Admin marketplace and referral settings management
* Phase 6: Configure marketplace parameters and referral bonuses
*/
init_client_server();
var getMarketplaceSettingsImpl = async () => {
	try {
		const { data, error } = await supabaseAdmin.from("marketplace_settings").select("*").eq("id", true).single();
		if (error) throw new Error(`Failed to fetch marketplace settings: ${error.message}`);
		if (!data) throw new Error("Marketplace settings not found");
		return data;
	} catch (error) {
		console.error("[getMarketplaceSettings] Error:", error);
		throw error;
	}
};
var getMarketplaceSettings_createServerFn_handler = createServerRpc({
	id: "20c329ab6313b2403b652df70d42fb07efbf492aeabb194e1d893b788153bfca",
	name: "getMarketplaceSettings",
	filename: "src/lib/marketplace/admin-settings.server.ts"
}, (opts) => getMarketplaceSettings.__executeServer(opts));
var getMarketplaceSettings = createServerFn({ method: "GET" }).handler(getMarketplaceSettings_createServerFn_handler, getMarketplaceSettingsImpl);
var getReferralSettingsImpl = async () => {
	const { data, error } = await supabaseAdmin.from("referral_settings").select("*").eq("id", true).single();
	if (error) throw new Error(`Failed to fetch referral settings: ${error.message}`);
	if (!data) throw new Error("Referral settings not found");
	return data;
};
var getReferralSettings_createServerFn_handler = createServerRpc({
	id: "6a566336c270fa8566c30bb5363e0d19e303facccfdc67c87fbaf4c246f28f4a",
	name: "getReferralSettings",
	filename: "src/lib/marketplace/admin-settings.server.ts"
}, (opts) => getReferralSettings.__executeServer(opts));
var getReferralSettings = createServerFn({ method: "GET" }).handler(getReferralSettings_createServerFn_handler, getReferralSettingsImpl);
/**
* Update marketplace settings
*/
var updateMarketplaceSettingsInput = objectType({
	platform_fee_percent: numberType().min(0).max(90).optional(),
	first_deposit_bonus_percent: numberType().min(0).max(100).optional(),
	referral_bonus_split_percent: numberType().min(0).max(100).optional(),
	referrer_bonus_hold_days: numberType().min(0).max(365).optional(),
	min_publisher_reward: numberType().min(0).optional(),
	auto_approve_after_hours: numberType().min(1).max(720).optional(),
	appeal_window_hours: numberType().min(1).max(720).optional(),
	auto_approve_enabled: booleanType().optional(),
	auto_approve_after_minutes: numberType().int().min(1).max(120).optional(),
	auto_approve_skip_first_campaign: booleanType().optional(),
	fees_enabled: booleanType().optional(),
	campaign_fee_usd: numberType().min(0).max(100).optional(),
	campaign_fee_type: enumType(["per_campaign", "per_slot"]).optional(),
	featured_price_per_day: numberType().min(0).max(1e3).optional(),
	deposits_enabled: booleanType().optional(),
	manual_deposits_enabled: booleanType().optional(),
	inr_per_usd: numberType().min(0).nullable().optional()
});
var updateMarketplaceSettingsImpl = async (input) => {
	const validated = updateMarketplaceSettingsInput.parse(input);
	const { data, error } = await supabaseAdmin.from("marketplace_settings").update(validated).eq("id", true).select().single();
	if (error) throw new Error(`Failed to update marketplace settings: ${error.message}`);
	return data;
};
var updateMarketplaceSettings_createServerFn_handler = createServerRpc({
	id: "e234f87cb875bc5a3fc13ed5fa35dd523cfe873d251564970dc93f6d1a6ae497",
	name: "updateMarketplaceSettings",
	filename: "src/lib/marketplace/admin-settings.server.ts"
}, (opts) => updateMarketplaceSettings.__executeServer(opts));
var updateMarketplaceSettings = createServerFn({ method: "POST" }).validator(updateMarketplaceSettingsInput).handler(updateMarketplaceSettings_createServerFn_handler, ({ data }) => updateMarketplaceSettingsImpl(data));
/**
* Update referral settings
*/
var updateReferralSettingsInput = objectType({
	pub_signup_bonus: numberType().min(0).optional(),
	pub_first_earning_bonus: numberType().min(0).optional(),
	pub_first_withdrawal_bonus: numberType().min(0).optional(),
	pub_window_days: numberType().min(1).max(3650).optional()
});
var updateReferralSettingsImpl = async (input) => {
	const validated = updateReferralSettingsInput.parse(input);
	const { data, error } = await supabaseAdmin.from("referral_settings").update(validated).eq("id", true).select().single();
	if (error) throw new Error(`Failed to update referral settings: ${error.message}`);
	return data;
};
var updateReferralSettings_createServerFn_handler = createServerRpc({
	id: "865feb8dee62f5ef4fea3d59cd99ca2035c23c3f1554caa0b3ffefbb9203a27e",
	name: "updateReferralSettings",
	filename: "src/lib/marketplace/admin-settings.server.ts"
}, (opts) => updateReferralSettings.__executeServer(opts));
var updateReferralSettings = createServerFn({ method: "POST" }).validator(updateReferralSettingsInput).handler(updateReferralSettings_createServerFn_handler, ({ data }) => updateReferralSettingsImpl(data));
//#endregion
export { getMarketplaceSettings_createServerFn_handler, getReferralSettings_createServerFn_handler, updateMarketplaceSettings_createServerFn_handler, updateReferralSettings_createServerFn_handler };
