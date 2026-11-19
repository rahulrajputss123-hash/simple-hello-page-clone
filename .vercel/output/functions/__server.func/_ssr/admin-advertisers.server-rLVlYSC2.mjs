import { i as createServerFn } from "./server-CpGMOUrW.mjs";
import { i as enumType, l as stringType, s as objectType } from "../_libs/zod.mjs";
import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
import { t as createServerRpc } from "./createServerRpc-BPtk4SPL.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-advertisers.server-rLVlYSC2.js
/**
* Admin advertiser management functions
* Phase 6: Real advertiser list and status management
*/
init_client_server();
var listAdvertisersImpl = async () => {
	const { data: advertisers, error } = await supabaseAdmin.from("advertiser_accounts").select("*").order("created_at", { ascending: false });
	if (error) throw new Error(`Failed to fetch advertisers: ${error.message}`);
	return await Promise.all((advertisers ?? []).map(async (advertiser) => {
		const { count } = await supabaseAdmin.from("campaigns").select("*", {
			count: "exact",
			head: true
		}).eq("advertiser_id", advertiser.user_id);
		return {
			...advertiser,
			campaign_count: count ?? 0
		};
	}));
};
var listAdvertisers_createServerFn_handler = createServerRpc({
	id: "ca9c4284fc571e89e956503ff11f192c447eef468ca43107e9cef26ffc86da03",
	name: "listAdvertisers",
	filename: "src/lib/marketplace/admin-advertisers.server.ts"
}, (opts) => listAdvertisers.__executeServer(opts));
var listAdvertisers = createServerFn({ method: "GET" }).handler(listAdvertisers_createServerFn_handler, listAdvertisersImpl);
/**
* Set advertiser account status (active/restricted/suspended)
* Uses mkt_set_advertiser_status function
*/
var setAdvertiserStatusInput = objectType({
	advertiserId: stringType().uuid(),
	adminId: stringType().uuid(),
	status: enumType([
		"active",
		"restricted",
		"suspended"
	]),
	reason: stringType().min(5)
});
var setAdvertiserStatusImpl = async (input) => {
	const { advertiserId, adminId, status, reason } = setAdvertiserStatusInput.parse(input);
	const { data, error } = await supabaseAdmin.rpc("mkt_set_advertiser_status", {
		p_advertiser: advertiserId,
		p_admin: adminId,
		p_status: status,
		p_reason: reason
	});
	if (error) throw new Error(`Failed to set advertiser status: ${error.message}`);
	return data;
};
var setAdvertiserStatus_createServerFn_handler = createServerRpc({
	id: "bdb5b904982fc7d03a95a7294877adcd44df7c73c7b6ee4a42df2c791de6694a",
	name: "setAdvertiserStatus",
	filename: "src/lib/marketplace/admin-advertisers.server.ts"
}, (opts) => setAdvertiserStatus.__executeServer(opts));
var setAdvertiserStatus = createServerFn({ method: "POST" }).validator(setAdvertiserStatusInput).handler(setAdvertiserStatus_createServerFn_handler, ({ data }) => setAdvertiserStatusImpl(data));
/**
* Clear advertiser D5 flag
* Uses mkt_clear_advertiser_flag function
*/
var clearAdvertiserFlagInput = objectType({
	advertiserId: stringType().uuid(),
	adminId: stringType().uuid(),
	note: stringType().min(10)
});
var clearAdvertiserFlagImpl = async (input) => {
	const { advertiserId, adminId, note } = clearAdvertiserFlagInput.parse(input);
	const { data, error } = await supabaseAdmin.rpc("mkt_clear_advertiser_flag", {
		p_advertiser: advertiserId,
		p_admin: adminId,
		p_note: note
	});
	if (error) throw new Error(`Failed to clear flag: ${error.message}`);
	return data;
};
var clearAdvertiserFlag_createServerFn_handler = createServerRpc({
	id: "4628f23376d570c6c12510bb75a2b12ea7bba83c9e0c72483f218c31fcca978b",
	name: "clearAdvertiserFlag",
	filename: "src/lib/marketplace/admin-advertisers.server.ts"
}, (opts) => clearAdvertiserFlag.__executeServer(opts));
var clearAdvertiserFlag = createServerFn({ method: "POST" }).validator(clearAdvertiserFlagInput).handler(clearAdvertiserFlag_createServerFn_handler, ({ data }) => clearAdvertiserFlagImpl(data));
//#endregion
export { clearAdvertiserFlag_createServerFn_handler, listAdvertisers_createServerFn_handler, setAdvertiserStatus_createServerFn_handler };
