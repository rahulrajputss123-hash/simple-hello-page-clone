import { i as createServerFn } from "./server-CpGMOUrW.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Br_KWlRY.mjs";
import { i as enumType, l as stringType, o as numberType, r as booleanType, s as objectType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-BPtk4SPL.mjs";
import { t as withServerTiming } from "./server-timing-middleware-BDljk4aZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/coinquest.functions-DjTCt4BN.js
var ensureProfile_createServerFn_handler = createServerRpc({
	id: "69736a15d12256af6cb97ecc7e69f563827999cb9801396c73b1fcf6539b35b3",
	name: "ensureProfile",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => ensureProfile.__executeServer(opts));
var ensureProfile = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	name: stringType().trim().max(80).optional(),
	phone: stringType().trim().max(30).optional(),
	referralCode: stringType().trim().max(20).optional(),
	deviceId: stringType().trim().max(64).optional()
}).parse(input ?? {})).handler(ensureProfile_createServerFn_handler, withServerTiming("ensureProfile", async ({ data, context }) => {
	const { ensureProfileImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	return ensureProfileImpl({
		userId: context.userId,
		email: context.claims["email"] ?? null,
		...data
	});
}));
var completeOnboarding_createServerFn_handler = createServerRpc({
	id: "8abe77de2e342523204df239659f20c6e46730e5b22e4f8069a4c31fc709307b",
	name: "completeOnboarding",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => completeOnboarding.__executeServer(opts));
var completeOnboarding = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	name: stringType().trim().min(2).max(80),
	phone: stringType().trim().max(30).optional(),
	deviceId: stringType().trim().max(64).optional()
}).parse(input)).handler(completeOnboarding_createServerFn_handler, withServerTiming("completeOnboarding", async ({ data, context }) => {
	const { completeOnboardingImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	return completeOnboardingImpl(context.userId, data);
}));
var startQuest_createServerFn_handler = createServerRpc({
	id: "9bde25c7ada0ca6363e6ef7b8359777f9e450afbd65431743d10ecc219a65518",
	name: "startQuest",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => startQuest.__executeServer(opts));
var startQuest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ questKey: stringType().max(40) }).parse(input)).handler(startQuest_createServerFn_handler, withServerTiming("startQuest", async ({ data, context }) => {
	const { startQuestImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	return startQuestImpl(context.userId, data.questKey);
}));
var reportAdWatched_createServerFn_handler = createServerRpc({
	id: "e2a6f803475a534f9babbd306a69a732e4852d5cded559d31c9fab9b02e38b67",
	name: "reportAdWatched",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => reportAdWatched.__executeServer(opts));
var reportAdWatched = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	sessionId: stringType().uuid(),
	provider: stringType().optional()
}).parse(input)).handler(reportAdWatched_createServerFn_handler, withServerTiming("reportAdWatched", async ({ data, context }) => {
	const { reportAdImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	return reportAdImpl(context.userId, data.sessionId, data.provider);
}));
var completeTask_createServerFn_handler = createServerRpc({
	id: "04aad9c95604b74d2339128ffc7deeedf2c971cbe46d6226f5b0dca8a2cec3ba",
	name: "completeTask",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => completeTask.__executeServer(opts));
var completeTask = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ taskId: stringType().uuid() }).parse(input)).handler(completeTask_createServerFn_handler, withServerTiming("completeTask", async ({ data, context }) => {
	const { completeTaskImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	return completeTaskImpl(context.userId, data.taskId);
}));
var claimOffer_createServerFn_handler = createServerRpc({
	id: "30fef264186afa0605a3e0521a6582b80911dd9262292afbde94f4a6542204b9",
	name: "claimOffer",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => claimOffer.__executeServer(opts));
var claimOffer = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	offerId: stringType().uuid(),
	proofUrl: stringType().trim().min(1).max(500).optional()
}).parse(input)).handler(claimOffer_createServerFn_handler, withServerTiming("claimOffer", async ({ data, context }) => {
	const { claimOfferImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	const { detectCountryFromRequest } = await import("./geo.server-BPDqDCBk.mjs");
	const { getUserCountry } = await import("./profile.server-uhkAcSlI.mjs");
	let country = detectCountryFromRequest();
	if (!country) country = await getUserCountry(context.userId);
	return claimOfferImpl(context.userId, data.offerId, data.proofUrl ?? null, country);
}));
var startOfferClaim_createServerFn_handler = createServerRpc({
	id: "7237fe6320898543f36acd1719a81135a099cd1b099e17d4824f2d230768f6d8",
	name: "startOfferClaim",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => startOfferClaim.__executeServer(opts));
var startOfferClaim = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ offerId: stringType().uuid() }).parse(input)).handler(startOfferClaim_createServerFn_handler, withServerTiming("startOfferClaim", async ({ data, context }) => {
	const { startOfferClaimImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	const { detectCountryFromRequest } = await import("./geo.server-BPDqDCBk.mjs");
	const { getUserCountry } = await import("./profile.server-uhkAcSlI.mjs");
	let country = detectCountryFromRequest();
	if (!country) country = await getUserCountry(context.userId);
	return startOfferClaimImpl(context.userId, data.offerId, country);
}));
var submitOfferProof_createServerFn_handler = createServerRpc({
	id: "b4c716a6b34c857be82c5b7e3bbc35c2b67047e80cca7c677b55fb1fee3c04af",
	name: "submitOfferProof",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => submitOfferProof.__executeServer(opts));
var submitOfferProof = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	offerId: stringType().uuid(),
	proofPath: stringType().trim().min(1).max(500)
}).parse(input)).handler(submitOfferProof_createServerFn_handler, withServerTiming("submitOfferProof", async ({ data, context }) => {
	const { submitOfferProofImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	return submitOfferProofImpl(context.userId, data.offerId, data.proofPath);
}));
var createWithdrawal_createServerFn_handler = createServerRpc({
	id: "c932e030a490a4df7fe79d171fa31660f55ec5f365794522b8b6eab2a17b8687",
	name: "createWithdrawal",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => createWithdrawal.__executeServer(opts));
var createWithdrawal = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	amount: numberType().positive().max(1e5),
	payoutMethodId: stringType().uuid()
}).parse(input)).handler(createWithdrawal_createServerFn_handler, withServerTiming("createWithdrawal", async ({ data, context }) => {
	const { createWithdrawalImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	return createWithdrawalImpl(context.userId, data.amount, data.payoutMethodId);
}));
var savePayoutMethod_createServerFn_handler = createServerRpc({
	id: "bc11cc1e29f12355d4a0e05b13918ee5a48ff51af2fef07f421a9a2c02cb093f",
	name: "savePayoutMethod",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => savePayoutMethod.__executeServer(opts));
var savePayoutMethod = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	methodType: stringType(),
	label: stringType().trim().max(200),
	holderName: stringType().trim().max(80).nullable().optional(),
	upiId: stringType().trim().max(120).nullable().optional(),
	paypalEmail: stringType().trim().max(200).nullable().optional(),
	accountNumber: stringType().trim().max(60).nullable().optional(),
	countryBankCode: stringType().trim().max(20).nullable().optional(),
	bankName: stringType().trim().max(120).nullable().optional(),
	country: stringType().trim().max(80).nullable().optional(),
	giftCardRecipientEmail: stringType().trim().max(200).nullable().optional(),
	walletAddress: stringType().trim().max(120).nullable().optional(),
	binancePayId: stringType().trim().max(200).nullable().optional()
}).parse(input)).handler(savePayoutMethod_createServerFn_handler, withServerTiming("savePayoutMethod", async ({ data, context }) => {
	const { savePayoutMethodImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	return savePayoutMethodImpl(context.userId, data);
}));
var cancelWithdrawal_createServerFn_handler = createServerRpc({
	id: "3a02c0ec3a5b150508469413ee78fa7ee96fea7420a85e9fb299a4ce8f85a45f",
	name: "cancelWithdrawal",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => cancelWithdrawal.__executeServer(opts));
var cancelWithdrawal = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(cancelWithdrawal_createServerFn_handler, withServerTiming("cancelWithdrawal", async ({ data, context }) => {
	const { cancelWithdrawalImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	return cancelWithdrawalImpl(context.userId, data.id);
}));
var adminOverview_createServerFn_handler = createServerRpc({
	id: "1060e64b0e1b4bdf0639654e5da952eca13175b2e82a67c5953efb70bcb28b59",
	name: "adminOverview",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => adminOverview.__executeServer(opts));
var adminOverview = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(adminOverview_createServerFn_handler, withServerTiming("adminOverview", async ({ context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { adminOverviewImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, ["admin"]);
	return adminOverviewImpl();
}));
var adminUpdateWithdrawal_createServerFn_handler = createServerRpc({
	id: "85dd6f6e3122690b52df9700134e9211e877df8ec3abe412ffb787ee37190953",
	name: "adminUpdateWithdrawal",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => adminUpdateWithdrawal.__executeServer(opts));
var adminUpdateWithdrawal = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid(),
	status: enumType(["approved", "rejected"]),
	note: stringType().trim().max(300).nullable().optional(),
	referenceId: stringType().trim().max(200).nullable().optional(),
	transactionHash: stringType().trim().max(200).nullable().optional()
}).parse(input)).handler(adminUpdateWithdrawal_createServerFn_handler, withServerTiming("adminUpdateWithdrawal", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { adminUpdateWithdrawalImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, ["admin", "finance"]);
	return adminUpdateWithdrawalImpl(context.userId, data.id, data.status, data.note ?? null, data.referenceId ?? null, data.transactionHash ?? null);
}));
var adminUpdateOfferClaim_createServerFn_handler = createServerRpc({
	id: "fee09825a3188d8e35ddd5cb58636765d668e7acf6ac8584278fd94abbf41ddd",
	name: "adminUpdateOfferClaim",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => adminUpdateOfferClaim.__executeServer(opts));
var adminUpdateOfferClaim = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid(),
	status: enumType(["approved", "rejected"]),
	note: stringType().trim().max(300).nullable().optional()
}).parse(input)).handler(adminUpdateOfferClaim_createServerFn_handler, withServerTiming("adminUpdateOfferClaim", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { adminUpdateOfferClaimImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, ["admin", "finance"]);
	return adminUpdateOfferClaimImpl(context.userId, data.id, data.status, data.note ?? null);
}));
var adminRespondTicket_createServerFn_handler = createServerRpc({
	id: "71a1a9072834e563aacbcf4e95af8580575d9c69bf6c5fc41c144a5c56d02809",
	name: "adminRespondTicket",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => adminRespondTicket.__executeServer(opts));
var adminRespondTicket = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid(),
	response: stringType().trim().min(2).max(1e3),
	status: enumType(["open", "resolved"])
}).parse(input)).handler(adminRespondTicket_createServerFn_handler, withServerTiming("adminRespondTicket", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { adminRespondTicketImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, [
		"admin",
		"finance",
		"support"
	]);
	return adminRespondTicketImpl(context.userId, data.id, data.response, data.status);
}));
var adminSetFlag_createServerFn_handler = createServerRpc({
	id: "28142979b76ff44b4bae725f95f907133001489270b956994b7f74e0c8ba6e50",
	name: "adminSetFlag",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => adminSetFlag.__executeServer(opts));
var adminSetFlag = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	userId: stringType().uuid(),
	flagged: booleanType()
}).parse(input)).handler(adminSetFlag_createServerFn_handler, withServerTiming("adminSetFlag", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { adminSetFlagImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, ["admin"]);
	return adminSetFlagImpl(context.userId, data.userId, data.flagged);
}));
var adminAdjustWallet_createServerFn_handler = createServerRpc({
	id: "03bb27beccf34db0164432c252207c160452c0880b7ccac2d0e91085681e0aec",
	name: "adminAdjustWallet",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => adminAdjustWallet.__executeServer(opts));
var adminAdjustWallet = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	userId: stringType().uuid(),
	amount: numberType().min(-1e4).max(1e4),
	reason: stringType().trim().min(5, "Reason must be at least 5 characters").max(200)
}).parse(input)).handler(adminAdjustWallet_createServerFn_handler, withServerTiming("adminAdjustWallet", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { adminAdjustWalletImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, ["admin"]);
	return adminAdjustWalletImpl(context.userId, data.userId, data.amount, data.reason);
}));
var requestAccountDeletion_createServerFn_handler = createServerRpc({
	id: "f4b66bfec0c2609294cb252ab3221c14583c2fe7fde6e61e767660124872b28b",
	name: "requestAccountDeletion",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => requestAccountDeletion.__executeServer(opts));
var requestAccountDeletion = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(requestAccountDeletion_createServerFn_handler, withServerTiming("requestAccountDeletion", async ({ context }) => {
	const { requestAccountDeletionImpl, AccountDeletionError } = await import("./account-deletion.server-VTJXYklm.mjs");
	try {
		return await requestAccountDeletionImpl(context.userId);
	} catch (err) {
		if (err instanceof AccountDeletionError) throw new Error(`${err.code}: ${err.message}`);
		throw err;
	}
}));
var transferEarningsToAdvertiser_createServerFn_handler = createServerRpc({
	id: "1301f5e2ff0e980b8a00500548c051c63330a9822c1e78b659e8c0f37d4bac26",
	name: "transferEarningsToAdvertiser",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => transferEarningsToAdvertiser.__executeServer(opts));
var transferEarningsToAdvertiser = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	amount: numberType().min(5, "Minimum transfer is $5.00").max(1e6),
	idempotencyKey: stringType().min(1).max(100)
}).parse(input)).handler(transferEarningsToAdvertiser_createServerFn_handler, withServerTiming("transferEarningsToAdvertiser", async ({ data, context }) => {
	const { transferEarningsToAdvertiserImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	return transferEarningsToAdvertiserImpl(context.userId, data.amount, data.idempotencyKey);
}));
var adminListUsers_createServerFn_handler = createServerRpc({
	id: "4754bc9ae6c09ebe68be77e94b59aa5098a72057fbdff48a998dfd8ed6f7cb11",
	name: "adminListUsers",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => adminListUsers.__executeServer(opts));
var adminListUsers = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	search: stringType().trim().max(200).optional(),
	flaggedOnly: booleanType().optional(),
	suspiciousOnly: booleanType().optional(),
	page: numberType().int().min(1).optional()
}).parse(input ?? {})).handler(adminListUsers_createServerFn_handler, withServerTiming("adminListUsers", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { adminListUsersImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, ["admin"]);
	return adminListUsersImpl(data);
}));
var adminListWithdrawals_createServerFn_handler = createServerRpc({
	id: "ff6bd837e51c0fd4314a7cd7aa557eb421fba73a581fa7bc4425699794c88015",
	name: "adminListWithdrawals",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => adminListWithdrawals.__executeServer(opts));
var adminListWithdrawals = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	status: enumType([
		"pending",
		"approved",
		"rejected",
		"all"
	]).optional(),
	page: numberType().int().min(1).optional()
}).parse(input ?? {})).handler(adminListWithdrawals_createServerFn_handler, withServerTiming("adminListWithdrawals", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { adminListWithdrawalsImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, ["admin", "finance"]);
	return adminListWithdrawalsImpl(data);
}));
var adminListClaims_createServerFn_handler = createServerRpc({
	id: "a2735c244711fe24b40a166a97a29fca8fe98fbe689bcc50a988122ac73b028e",
	name: "adminListClaims",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => adminListClaims.__executeServer(opts));
var adminListClaims = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	status: enumType([
		"pending",
		"approved",
		"rejected",
		"all"
	]).optional(),
	page: numberType().int().min(1).optional()
}).parse(input ?? {})).handler(adminListClaims_createServerFn_handler, withServerTiming("adminListClaims", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { adminListClaimsImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, ["admin", "finance"]);
	return adminListClaimsImpl(data);
}));
var adminListTickets_createServerFn_handler = createServerRpc({
	id: "da7a7c112406ffa7dad29fc3ceb8da908ca78e9f1d5290cf7a7cba1243b16a4f",
	name: "adminListTickets",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => adminListTickets.__executeServer(opts));
var adminListTickets = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	status: enumType([
		"open",
		"resolved",
		"all"
	]).optional(),
	page: numberType().int().min(1).optional()
}).parse(input ?? {})).handler(adminListTickets_createServerFn_handler, withServerTiming("adminListTickets", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { adminListTicketsImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, [
		"admin",
		"finance",
		"support"
	]);
	return adminListTicketsImpl(data);
}));
var createAdjustmentRequest_createServerFn_handler = createServerRpc({
	id: "47f9d2e7a8567318a3039053b316a3fc4a847200f893519312ff0a4f585ea157",
	name: "createAdjustmentRequest",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => createAdjustmentRequest.__executeServer(opts));
var createAdjustmentRequest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	userId: stringType().uuid(),
	amount: numberType().refine((val) => Math.abs(val) > 100, "Amount must be > $100"),
	reason: stringType().trim().min(5).max(200)
}).parse(input)).handler(createAdjustmentRequest_createServerFn_handler, withServerTiming("createAdjustmentRequest", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { createAdjustmentRequestImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, ["admin"]);
	return createAdjustmentRequestImpl(context.userId, data.userId, data.amount, data.reason);
}));
var listAdjustmentRequests_createServerFn_handler = createServerRpc({
	id: "6d1aa3398c44cc086cc9d9b3024394ce9211635d72a2421085801ef9dc408202",
	name: "listAdjustmentRequests",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => listAdjustmentRequests.__executeServer(opts));
var listAdjustmentRequests = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ status: enumType([
	"pending",
	"approved",
	"rejected"
]).optional() }).parse(input ?? {})).handler(listAdjustmentRequests_createServerFn_handler, withServerTiming("listAdjustmentRequests", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { listAdjustmentRequestsImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, ["admin"]);
	return listAdjustmentRequestsImpl(data.status);
}));
var approveAdjustmentRequest_createServerFn_handler = createServerRpc({
	id: "222961bb2dbc8040282b1b546f7f57b265daec2ba3391d2123176de9466ddc40",
	name: "approveAdjustmentRequest",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => approveAdjustmentRequest.__executeServer(opts));
var approveAdjustmentRequest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	requestId: stringType().uuid(),
	note: stringType().trim().max(200).optional()
}).parse(input)).handler(approveAdjustmentRequest_createServerFn_handler, withServerTiming("approveAdjustmentRequest", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { approveAdjustmentRequestImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, ["admin"]);
	return approveAdjustmentRequestImpl(context.userId, data.requestId, data.note);
}));
var rejectAdjustmentRequest_createServerFn_handler = createServerRpc({
	id: "e067f32dfd11bb788f8bddd66ef0591eafba5d6179e65d0a7199ed32a17ad2fc",
	name: "rejectAdjustmentRequest",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => rejectAdjustmentRequest.__executeServer(opts));
var rejectAdjustmentRequest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	requestId: stringType().uuid(),
	note: stringType().trim().min(5).max(200)
}).parse(input)).handler(rejectAdjustmentRequest_createServerFn_handler, withServerTiming("rejectAdjustmentRequest", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { rejectAdjustmentRequestImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, ["admin"]);
	return rejectAdjustmentRequestImpl(context.userId, data.requestId, data.note);
}));
var adminListAuditLogs_createServerFn_handler = createServerRpc({
	id: "57137ee209e75373aa5abd336744eccf473f3c2903828aef0acb327a6640c715",
	name: "adminListAuditLogs",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => adminListAuditLogs.__executeServer(opts));
var adminListAuditLogs = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	adminFilter: stringType().trim().max(100).optional(),
	actionFilter: stringType().trim().max(100).optional(),
	startDate: stringType().optional(),
	endDate: stringType().optional(),
	page: numberType().int().min(1).optional()
}).parse(input ?? {})).handler(adminListAuditLogs_createServerFn_handler, withServerTiming("adminListAuditLogs", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { adminListAuditLogsImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, ["admin"]);
	return adminListAuditLogsImpl({
		adminId: data.adminFilter,
		action: data.actionFilter,
		dateFrom: data.startDate,
		dateTo: data.endDate,
		page: data.page
	});
}));
var getWithdrawalFraudSignals_createServerFn_handler = createServerRpc({
	id: "ec3a363f41fdad120369bb72cbbe8441edbc002fce885e8911424c09165ef6bf",
	name: "getWithdrawalFraudSignals",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => getWithdrawalFraudSignals.__executeServer(opts));
var getWithdrawalFraudSignals = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ withdrawalId: stringType().uuid() }).parse(input)).handler(getWithdrawalFraudSignals_createServerFn_handler, withServerTiming("getWithdrawalFraudSignals", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { getWithdrawalFraudSignalsImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, ["admin", "finance"]);
	return getWithdrawalFraudSignalsImpl(data.withdrawalId);
}));
var getUsersWithSameDevice_createServerFn_handler = createServerRpc({
	id: "6c24b986dd76fd4d7a0e55422413aeb5bdd62422f0410e30f771c537288e6939",
	name: "getUsersWithSameDevice",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => getUsersWithSameDevice.__executeServer(opts));
var getUsersWithSameDevice = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ deviceId: stringType().trim().min(1) }).parse(input)).handler(getUsersWithSameDevice_createServerFn_handler, withServerTiming("getUsersWithSameDevice", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { getUsersWithSameDeviceImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, ["admin"]);
	return getUsersWithSameDeviceImpl(data.deviceId);
}));
var assignRole_createServerFn_handler = createServerRpc({
	id: "15849f100c883a96dcb4fd37c4eb251b8bcd52d121c815f386dfe0263b32d220",
	name: "assignRole",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => assignRole.__executeServer(opts));
var assignRole = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	userEmail: stringType().trim().email(),
	role: enumType([
		"admin",
		"finance",
		"support"
	])
}).parse(input)).handler(assignRole_createServerFn_handler, withServerTiming("assignRole", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { assignRoleImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, ["admin"]);
	return assignRoleImpl(context.userId, data.userEmail, data.role);
}));
var removeRole_createServerFn_handler = createServerRpc({
	id: "bfd7ffe86bb196c9e468f50b9e23fedb720c942cd6fca5117e1c675f73a61d02",
	name: "removeRole",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => removeRole.__executeServer(opts));
var removeRole = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	userId: stringType().uuid(),
	role: enumType([
		"admin",
		"finance",
		"support"
	])
}).parse(input)).handler(removeRole_createServerFn_handler, withServerTiming("removeRole", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { removeRoleImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, ["admin"]);
	return removeRoleImpl(context.userId, data.userId, data.role);
}));
var listStaff_createServerFn_handler = createServerRpc({
	id: "7bd36b172431ea04c0ef8cc9cd6fd9b2d166b81c7931314e78a26193b5fc9488",
	name: "listStaff",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => listStaff.__executeServer(opts));
var listStaff = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(listStaff_createServerFn_handler, withServerTiming("listStaff", async ({ context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { listStaffImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, ["admin"]);
	return listStaffImpl();
}));
var listQuickReplies_createServerFn_handler = createServerRpc({
	id: "3040184cae8619f59f1f1d15feab48b60e8f1cc0bc61379a647618a0da8c4011",
	name: "listQuickReplies",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => listQuickReplies.__executeServer(opts));
var listQuickReplies = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(listQuickReplies_createServerFn_handler, withServerTiming("listQuickReplies", async ({ context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { listQuickRepliesImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, [
		"admin",
		"finance",
		"support"
	]);
	return listQuickRepliesImpl(context.userId);
}));
var createQuickReply_createServerFn_handler = createServerRpc({
	id: "279fef0972c37ad2f35187ad7c48164ada2cbca0ee4b541c890ef6dc5164583b",
	name: "createQuickReply",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => createQuickReply.__executeServer(opts));
var createQuickReply = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	title: stringType().trim().min(1).max(100),
	content: stringType().trim().min(1).max(2e3)
}).parse(input)).handler(createQuickReply_createServerFn_handler, withServerTiming("createQuickReply", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { createQuickReplyImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, [
		"admin",
		"finance",
		"support"
	]);
	return createQuickReplyImpl(context.userId, data.title, data.content);
}));
var updateQuickReply_createServerFn_handler = createServerRpc({
	id: "aed052e6142a45a8906a8daaef356763a510908b24a11d98391719ef846f7ce6",
	name: "updateQuickReply",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => updateQuickReply.__executeServer(opts));
var updateQuickReply = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid(),
	title: stringType().trim().min(1).max(100),
	content: stringType().trim().min(1).max(2e3)
}).parse(input)).handler(updateQuickReply_createServerFn_handler, withServerTiming("updateQuickReply", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { updateQuickReplyImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, [
		"admin",
		"finance",
		"support"
	]);
	return updateQuickReplyImpl(context.userId, data.id, data.title, data.content);
}));
var deleteQuickReply_createServerFn_handler = createServerRpc({
	id: "1cd5ee983de5d7fdae35082851de3cf9b6e1f26f74eef3a92f7554e8251a7839",
	name: "deleteQuickReply",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => deleteQuickReply.__executeServer(opts));
var deleteQuickReply = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(deleteQuickReply_createServerFn_handler, withServerTiming("deleteQuickReply", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { deleteQuickReplyImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, [
		"admin",
		"finance",
		"support"
	]);
	return deleteQuickReplyImpl(context.userId, data.id);
}));
var getDashboardSignups_createServerFn_handler = createServerRpc({
	id: "7a0df54040071cd9f8be948b8492ba678a7e89171c887cc6134ba0eecfa8504b",
	name: "getDashboardSignups",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => getDashboardSignups.__executeServer(opts));
var getDashboardSignups = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).validator(objectType({ days: numberType().int().min(1).max(365) })).handler(getDashboardSignups_createServerFn_handler, withServerTiming("getDashboardSignups", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { getDashboardSignupsImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, ["admin"]);
	return getDashboardSignupsImpl(data.days);
}));
var getDashboardActiveUsers_createServerFn_handler = createServerRpc({
	id: "113e0390e2c66bd55e0bdefe8fa79f992fe2654db151956ca61360374a2c6754",
	name: "getDashboardActiveUsers",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => getDashboardActiveUsers.__executeServer(opts));
var getDashboardActiveUsers = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).validator(objectType({ days: numberType().int().min(1).max(365) })).handler(getDashboardActiveUsers_createServerFn_handler, withServerTiming("getDashboardActiveUsers", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { getDashboardActiveUsersImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, ["admin"]);
	return getDashboardActiveUsersImpl(data.days);
}));
var getDashboardRevenuePayout_createServerFn_handler = createServerRpc({
	id: "c2511777fe3b0761f08be211dd2f7b07f7c47daaaff3842ab1a37f3eef0a97ed",
	name: "getDashboardRevenuePayout",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => getDashboardRevenuePayout.__executeServer(opts));
var getDashboardRevenuePayout = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).validator(objectType({ days: numberType().int().min(1).max(365) })).handler(getDashboardRevenuePayout_createServerFn_handler, withServerTiming("getDashboardRevenuePayout", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { getDashboardRevenuePayoutImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, ["admin"]);
	return getDashboardRevenuePayoutImpl(data.days);
}));
var getDashboardTopOffers_createServerFn_handler = createServerRpc({
	id: "5065cf49b310417358eaba46745296e634b714b04a58937137bae52bb061239f",
	name: "getDashboardTopOffers",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => getDashboardTopOffers.__executeServer(opts));
var getDashboardTopOffers = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).validator(objectType({ days: numberType().int().min(1).max(365) })).handler(getDashboardTopOffers_createServerFn_handler, withServerTiming("getDashboardTopOffers", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { getDashboardTopOffersImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, ["admin"]);
	return getDashboardTopOffersImpl(data.days);
}));
var getUserDetail_createServerFn_handler = createServerRpc({
	id: "afe747b8a5a771bb295ac07d3972faf4ebd06084c027772b3573176a0c608d28",
	name: "getUserDetail",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => getUserDetail.__executeServer(opts));
var getUserDetail = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).validator(objectType({ userId: stringType().uuid() })).handler(getUserDetail_createServerFn_handler, withServerTiming("getUserDetail", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { getUserDetailImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, [
		"admin",
		"finance",
		"support"
	]);
	return getUserDetailImpl(data.userId);
}));
var getUserAuditLog_createServerFn_handler = createServerRpc({
	id: "0f92a2bbcf4795e87b159b4c672e04ebada3cd5b2a03598808454f1688207c8a",
	name: "getUserAuditLog",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => getUserAuditLog.__executeServer(opts));
var getUserAuditLog = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).validator(objectType({ userId: stringType().uuid() })).handler(getUserAuditLog_createServerFn_handler, withServerTiming("getUserAuditLog", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	const { getUserAuditLogImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await requireRole(context.userId, ["admin"]);
	return getUserAuditLogImpl(data.userId);
}));
var sendBroadcastNotification_createServerFn_handler = createServerRpc({
	id: "f1979d02e433c0316c3ab77f141bbda44be63e1fae604d1ae4bc285a19a1daa5",
	name: "sendBroadcastNotification",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => sendBroadcastNotification.__executeServer(opts));
var sendBroadcastNotification = createServerFn({ method: "POST" }).validator((data) => data).handler(sendBroadcastNotification_createServerFn_handler, withServerTiming("sendBroadcastNotification", async (ctx) => {
	const { sendBroadcastNotificationImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	return sendBroadcastNotificationImpl(ctx, ctx.data);
}));
var setMaintenanceMode_createServerFn_handler = createServerRpc({
	id: "53705949da61097c1d3afab2d0033998e69f5dee3539b1314c077f0e5b7ea3ed",
	name: "setMaintenanceMode",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => setMaintenanceMode.__executeServer(opts));
var setMaintenanceMode = createServerFn({ method: "POST" }).validator((data) => data).handler(setMaintenanceMode_createServerFn_handler, withServerTiming("setMaintenanceMode", async (ctx) => {
	const { setMaintenanceModeImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	return setMaintenanceModeImpl(ctx, ctx.data);
}));
var getMaintenanceStatus_createServerFn_handler = createServerRpc({
	id: "b8ea89771a82ddd7394a429936694fda49efbcb4c7350dc96b457ec39bcbd906",
	name: "getMaintenanceStatus",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => getMaintenanceStatus.__executeServer(opts));
var getMaintenanceStatus = createServerFn({ method: "GET" }).handler(getMaintenanceStatus_createServerFn_handler, withServerTiming("getMaintenanceStatus", async (ctx) => {
	const { getMaintenanceStatusImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	return getMaintenanceStatusImpl(ctx);
}));
var checkMaintenanceStatus_createServerFn_handler = createServerRpc({
	id: "d660e138cc1fab9a5d286cb11545a9c7eeee3764efbfc6c522f1a4fa5d84f37c",
	name: "checkMaintenanceStatus",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => checkMaintenanceStatus.__executeServer(opts));
var checkMaintenanceStatus = createServerFn({ method: "GET" }).handler(checkMaintenanceStatus_createServerFn_handler, withServerTiming("checkMaintenanceStatus", async (ctx) => {
	const { checkMaintenanceStatusImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	return checkMaintenanceStatusImpl(ctx);
}));
var exportUsersCsv_createServerFn_handler = createServerRpc({
	id: "339ddf6971dd621f9de34f096bdbc0cc607f6f61973c596fc46f9fb09095c3ef",
	name: "exportUsersCsv",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => exportUsersCsv.__executeServer(opts));
var exportUsersCsv = createServerFn({ method: "POST" }).validator((data) => data).handler(exportUsersCsv_createServerFn_handler, withServerTiming("exportUsersCsv", async (ctx) => {
	const { exportUsersCsvImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	return exportUsersCsvImpl(ctx, ctx.data);
}));
var exportTransactionsCsv_createServerFn_handler = createServerRpc({
	id: "286099256527088e3b90e3a445cac65c94ef3778958574f7a5727494032bf6f2",
	name: "exportTransactionsCsv",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => exportTransactionsCsv.__executeServer(opts));
var exportTransactionsCsv = createServerFn({ method: "POST" }).validator((data) => data).handler(exportTransactionsCsv_createServerFn_handler, withServerTiming("exportTransactionsCsv", async (ctx) => {
	const { exportTransactionsCsvImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	return exportTransactionsCsvImpl(ctx, ctx.data);
}));
var exportPayoutsCsv_createServerFn_handler = createServerRpc({
	id: "bac2e645eb646ba78971372360356d2304e5e68b94daab4514885cec0525b995",
	name: "exportPayoutsCsv",
	filename: "src/lib/coinquest.functions.ts"
}, (opts) => exportPayoutsCsv.__executeServer(opts));
var exportPayoutsCsv = createServerFn({ method: "POST" }).validator((data) => data).handler(exportPayoutsCsv_createServerFn_handler, withServerTiming("exportPayoutsCsv", async (ctx) => {
	const { exportPayoutsCsvImpl } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	return exportPayoutsCsvImpl(ctx, ctx.data);
}));
//#endregion
export { adminAdjustWallet_createServerFn_handler, adminListAuditLogs_createServerFn_handler, adminListClaims_createServerFn_handler, adminListTickets_createServerFn_handler, adminListUsers_createServerFn_handler, adminListWithdrawals_createServerFn_handler, adminOverview_createServerFn_handler, adminRespondTicket_createServerFn_handler, adminSetFlag_createServerFn_handler, adminUpdateOfferClaim_createServerFn_handler, adminUpdateWithdrawal_createServerFn_handler, approveAdjustmentRequest_createServerFn_handler, assignRole_createServerFn_handler, cancelWithdrawal_createServerFn_handler, checkMaintenanceStatus_createServerFn_handler, claimOffer_createServerFn_handler, completeOnboarding_createServerFn_handler, completeTask_createServerFn_handler, createAdjustmentRequest_createServerFn_handler, createQuickReply_createServerFn_handler, createWithdrawal_createServerFn_handler, deleteQuickReply_createServerFn_handler, ensureProfile_createServerFn_handler, exportPayoutsCsv_createServerFn_handler, exportTransactionsCsv_createServerFn_handler, exportUsersCsv_createServerFn_handler, getDashboardActiveUsers_createServerFn_handler, getDashboardRevenuePayout_createServerFn_handler, getDashboardSignups_createServerFn_handler, getDashboardTopOffers_createServerFn_handler, getMaintenanceStatus_createServerFn_handler, getUserAuditLog_createServerFn_handler, getUserDetail_createServerFn_handler, getUsersWithSameDevice_createServerFn_handler, getWithdrawalFraudSignals_createServerFn_handler, listAdjustmentRequests_createServerFn_handler, listQuickReplies_createServerFn_handler, listStaff_createServerFn_handler, rejectAdjustmentRequest_createServerFn_handler, removeRole_createServerFn_handler, reportAdWatched_createServerFn_handler, requestAccountDeletion_createServerFn_handler, savePayoutMethod_createServerFn_handler, sendBroadcastNotification_createServerFn_handler, setMaintenanceMode_createServerFn_handler, startOfferClaim_createServerFn_handler, startQuest_createServerFn_handler, submitOfferProof_createServerFn_handler, transferEarningsToAdvertiser_createServerFn_handler, updateQuickReply_createServerFn_handler };
