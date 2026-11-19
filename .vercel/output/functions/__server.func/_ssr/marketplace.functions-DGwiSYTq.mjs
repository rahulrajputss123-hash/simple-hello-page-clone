import { i as createServerFn, u as __toCommonJS } from "./server-CpGMOUrW.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Br_KWlRY.mjs";
import { i as enumType, l as stringType, o as numberType, r as booleanType, s as objectType } from "../_libs/zod.mjs";
import { a as init_advertiser_server, r as advertiser_server_exports } from "./advertiser.server-DyvSoHf7.mjs";
import { t as createServerRpc } from "./createServerRpc-BPtk4SPL.mjs";
import { t as withServerTiming } from "./server-timing-middleware-BDljk4aZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/marketplace.functions-DGwiSYTq.js
/**
* Phase 2 — client-callable advertiser functions. Thin: validation here,
* everything else in ./marketplace/advertiser.server.ts (service role).
* Money never moves from these functions; see processRazorpayWebhook.
*/
var getAdvertiserOverview_createServerFn_handler = createServerRpc({
	id: "f14148b6495619d8b0910c66ac43f421222e168d6c062c64ca9124b5393a07d8",
	name: "getAdvertiserOverview",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => getAdvertiserOverview.__executeServer(opts));
var getAdvertiserOverview = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(getAdvertiserOverview_createServerFn_handler, withServerTiming("getAdvertiserOverview", async ({ context }) => {
	const { getOverviewImpl } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	return getOverviewImpl(context.userId);
}));
var becomeAdvertiser_createServerFn_handler = createServerRpc({
	id: "6acb2162c646b7861b223f8493ec4867c241370d406e88d024a30ca88bd3b83d",
	name: "becomeAdvertiser",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => becomeAdvertiser.__executeServer(opts));
var becomeAdvertiser = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(async (input) => {
	const { becomeAdvertiserInput } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	return becomeAdvertiserInput.parse(input);
}).handler(becomeAdvertiser_createServerFn_handler, withServerTiming("becomeAdvertiser", async ({ data, context }) => {
	const { becomeAdvertiserImpl } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	return becomeAdvertiserImpl(context.userId, data);
}));
var updateAdvertiserProfile_createServerFn_handler = createServerRpc({
	id: "afb5c7f7c366c0c22447041b9d6ae1da8401bd5f41bd3eb54ac20f0e5c987376",
	name: "updateAdvertiserProfile",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => updateAdvertiserProfile.__executeServer(opts));
var updateAdvertiserProfile = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(async (input) => {
	const { updateAdvertiserProfileInput } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	return updateAdvertiserProfileInput.parse(input);
}).handler(updateAdvertiserProfile_createServerFn_handler, withServerTiming("updateAdvertiserProfile", async ({ data, context }) => {
	const { updateAdvertiserProfileImpl } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	return updateAdvertiserProfileImpl(context.userId, data);
}));
var createDeposit_createServerFn_handler = createServerRpc({
	id: "1a02e21e7bd36bfbcf11f6cd3162614e7495dbcd81f34d6d171b7518bc8a3984",
	name: "createDeposit",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => createDeposit.__executeServer(opts));
var createDeposit = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ amountUsd: numberType().positive().max(1e5) }).parse(input)).handler(createDeposit_createServerFn_handler, withServerTiming("createDeposit", async ({ data, context }) => {
	const { createDepositImpl, DepositError } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	try {
		return await createDepositImpl(context.userId, data.amountUsd);
	} catch (err) {
		if (err instanceof DepositError) throw new Error(`${err.code}: ${err.message}`);
		throw err;
	}
}));
var createNowpaymentsDeposit_createServerFn_handler = createServerRpc({
	id: "48e234dd2d46a03b02c59d82cebc1e9cd564d071d6881ec2e55057a78570d0ee",
	name: "createNowpaymentsDeposit",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => createNowpaymentsDeposit.__executeServer(opts));
var createNowpaymentsDeposit = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ amountUsd: numberType().positive().max(1e5) }).parse(input)).handler(createNowpaymentsDeposit_createServerFn_handler, withServerTiming("createNowpaymentsDeposit", async ({ data, context }) => {
	const { createNowpaymentsDepositImpl, DepositError } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	try {
		return await createNowpaymentsDepositImpl(context.userId, data.amountUsd);
	} catch (err) {
		if (err instanceof DepositError) throw new Error(`${err.code}: ${err.message}`);
		throw err;
	}
}));
var createQropayDeposit_createServerFn_handler = createServerRpc({
	id: "1fc25f0f0b339dff5de6f9192a64657b2590eb9df858f3c8a25921bb281ad874",
	name: "createQropayDeposit",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => createQropayDeposit.__executeServer(opts));
var createQropayDeposit = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ amountUsd: numberType().positive().max(1e5) }).parse(input)).handler(createQropayDeposit_createServerFn_handler, withServerTiming("createQropayDeposit", async ({ data, context }) => {
	const { createQropayDepositImpl, DepositError } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	try {
		return await createQropayDepositImpl(context.userId, data.amountUsd);
	} catch (err) {
		if (err instanceof DepositError) throw new Error(`${err.code}: ${err.message}`);
		throw err;
	}
}));
var confirmCheckout_createServerFn_handler = createServerRpc({
	id: "e20ba76032641b7fd35d80c663a7a753e56270de4dd1c0a05afc78620a7b0e3d",
	name: "confirmCheckout",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => confirmCheckout.__executeServer(opts));
var confirmCheckout = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	depositId: stringType().uuid(),
	orderId: stringType().min(1).max(64),
	paymentId: stringType().min(1).max(64),
	signature: stringType().regex(/^[0-9a-f]{64}$/i)
}).parse(input)).handler(confirmCheckout_createServerFn_handler, withServerTiming("confirmCheckout", async ({ data, context }) => {
	const { confirmCheckoutImpl, DepositError } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	try {
		return await confirmCheckoutImpl(context.userId, data);
	} catch (err) {
		if (err instanceof DepositError) throw new Error(`${err.code}: ${err.message}`);
		throw err;
	}
}));
var abandonDeposit_createServerFn_handler = createServerRpc({
	id: "60a33c64429e4ccf43cfbc0372780490bc76026d87f307c0bde0544fd388770e",
	name: "abandonDeposit",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => abandonDeposit.__executeServer(opts));
var abandonDeposit = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	depositId: stringType().uuid(),
	reason: stringType().max(200).default("checkout_dismissed")
}).parse(input)).handler(abandonDeposit_createServerFn_handler, withServerTiming("abandonDeposit", async ({ data, context }) => {
	const { abandonDepositImpl } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	await abandonDepositImpl(context.userId, data.depositId, data.reason);
	return { ok: true };
}));
var getDepositStatus_createServerFn_handler = createServerRpc({
	id: "2bd8c3834253865a6e20c2689f8a85aebf7fa15dc3478ce50592825fb8347d00",
	name: "getDepositStatus",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => getDepositStatus.__executeServer(opts));
var getDepositStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ depositId: stringType().uuid() }).parse(input)).handler(getDepositStatus_createServerFn_handler, withServerTiming("getDepositStatus", async ({ data, context }) => {
	const { getDepositImpl } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	return getDepositImpl(context.userId, data.depositId);
}));
var listAdvertiserTransactions_createServerFn_handler = createServerRpc({
	id: "27d3903d900a31b8ccfec3437a2c649c8486041a41dccd03075a8fb1a7af1de3",
	name: "listAdvertiserTransactions",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => listAdvertiserTransactions.__executeServer(opts));
var listAdvertiserTransactions = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(listAdvertiserTransactions_createServerFn_handler, withServerTiming("listAdvertiserTransactions", async ({ context }) => {
	const { listTransactionsImpl } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	return listTransactionsImpl(context.userId);
}));
var getMarketplaceSettings_createServerFn_handler = createServerRpc({
	id: "6b5581f49fa670fd0e66b744e3f541f93b3a4e60f3cfa01a0204f00a035f306d",
	name: "getMarketplaceSettings",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => getMarketplaceSettings.__executeServer(opts));
var getMarketplaceSettings = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(getMarketplaceSettings_createServerFn_handler, withServerTiming("getMarketplaceSettings", async ({ context }) => {
	const { getMarketplaceSettingsImpl } = await import("./admin.server-BZl5UQqf.mjs");
	return getMarketplaceSettingsImpl(context.userId);
}));
var updateMarketplaceSettings_createServerFn_handler = createServerRpc({
	id: "01826f8b211b53868aec025999e043064e83dd2eb7f516d285ad5fe51ddbc4ad",
	name: "updateMarketplaceSettings",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => updateMarketplaceSettings.__executeServer(opts));
var updateMarketplaceSettings = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	auto_approve_enabled: booleanType().optional(),
	auto_approve_after_minutes: numberType().int().min(1).max(120).optional(),
	auto_approve_skip_first_campaign: booleanType().optional()
}).parse(input)).handler(updateMarketplaceSettings_createServerFn_handler, withServerTiming("updateMarketplaceSettings", async ({ data, context }) => {
	const { updateMarketplaceSettingsImpl } = await import("./admin.server-BZl5UQqf.mjs");
	return updateMarketplaceSettingsImpl(context.userId, data);
}));
var listMyCampaigns_createServerFn_handler = createServerRpc({
	id: "166351c4b3b261fec66e592322b4c54794b8916e8df80283b90ffc8352782c97",
	name: "listMyCampaigns",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => listMyCampaigns.__executeServer(opts));
var listMyCampaigns = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(listMyCampaigns_createServerFn_handler, withServerTiming("listMyCampaigns", async ({ context }) => {
	const { listCampaignsImpl } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	return listCampaignsImpl(context.userId);
}));
var createCampaign_createServerFn_handler = createServerRpc({
	id: "bc2d8b04c9d6e79234a498017b6fcc3c3e7beeaf90ba2353692547c777a02974",
	name: "createCampaign",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => createCampaign.__executeServer(opts));
var createCampaign = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(async (input) => {
	const { createCampaignInput } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	return createCampaignInput.parse(input);
}).handler(createCampaign_createServerFn_handler, withServerTiming("createCampaign", async ({ data, context }) => {
	const { createCampaignImpl, DepositError } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	try {
		return await createCampaignImpl(context.userId, data);
	} catch (err) {
		if (err instanceof DepositError) throw new Error(`${err.code}: ${err.message}`);
		throw err;
	}
}));
var campaignAction_createServerFn_handler = createServerRpc({
	id: "0cb5c6aa2488419445699bd40f9c6d047707da2f33d8e7a07a142a0975091ebf",
	name: "campaignAction",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => campaignAction.__executeServer(opts));
var campaignAction = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	campaignId: stringType().uuid(),
	action: enumType([
		"pause",
		"resume",
		"submit",
		"complete",
		"archive"
	])
}).parse(input)).handler(campaignAction_createServerFn_handler, withServerTiming("campaignAction", async ({ data, context }) => {
	const { campaignActionImpl, DepositError } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	try {
		const result = await campaignActionImpl(context.userId, data.campaignId, data.action);
		return {
			ok: true,
			status: typeof result["status"] === "string" ? result["status"] : null,
			released: typeof result["released"] === "number" ? result["released"] : null
		};
	} catch (err) {
		if (err instanceof DepositError) throw new Error(`${err.code}: ${err.message}`);
		throw err;
	}
}));
var rotateCampaignSecret_createServerFn_handler = createServerRpc({
	id: "e0c6b3373ff304f8b645c030077250adb17aaa463c0a35f951c248eff12ce954",
	name: "rotateCampaignSecret",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => rotateCampaignSecret.__executeServer(opts));
var rotateCampaignSecret = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ campaignId: stringType().uuid() }).parse(input)).handler(rotateCampaignSecret_createServerFn_handler, withServerTiming("rotateCampaignSecret", async ({ data, context }) => {
	const { rotateCampaignSecretImpl, DepositError } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	try {
		return await rotateCampaignSecretImpl(context.userId, data.campaignId);
	} catch (err) {
		if (err instanceof DepositError) throw new Error(`${err.code}: ${err.message}`);
		throw err;
	}
}));
var editCampaign_createServerFn_handler = createServerRpc({
	id: "500bd575c3b142dff59398fa8ecdca6d468dee80ee4fcaa354be4feb6d77dedf",
	name: "editCampaign",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => editCampaign.__executeServer(opts));
var editCampaign = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(async (input) => {
	const { editCampaignInput } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	return editCampaignInput.parse(input);
}).handler(editCampaign_createServerFn_handler, withServerTiming("editCampaign", async ({ data, context }) => {
	const { editCampaignImpl, DepositError } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	try {
		return await editCampaignImpl(context.userId, data);
	} catch (err) {
		if (err instanceof DepositError) throw new Error(`${err.code}: ${err.message}`);
		throw err;
	}
}));
var addCampaignBudget_createServerFn_handler = createServerRpc({
	id: "f26e349249ab80720c26b8821b87b838031feb2502b3484ba830e8fb84929bdc",
	name: "addCampaignBudget",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => addCampaignBudget.__executeServer(opts));
var addCampaignBudget = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => {
	const { addCampaignBudgetInput } = (init_advertiser_server(), __toCommonJS(advertiser_server_exports));
	return addCampaignBudgetInput.parse(input);
}).handler(addCampaignBudget_createServerFn_handler, withServerTiming("addCampaignBudget", async ({ data, context }) => {
	const { addCampaignBudgetImpl, DepositError } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	try {
		return await addCampaignBudgetImpl(context.userId, data);
	} catch (err) {
		if (err instanceof DepositError) throw new Error(`${err.code}: ${err.message}`);
		throw err;
	}
}));
var getCampaignResults_createServerFn_handler = createServerRpc({
	id: "e8fd746a783e117d2735202376cba4b14735d9b6765034fc330247df4a9d345c",
	name: "getCampaignResults",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => getCampaignResults.__executeServer(opts));
var getCampaignResults = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ campaignId: stringType().uuid() }).parse(input)).handler(getCampaignResults_createServerFn_handler, withServerTiming("getCampaignResults", async ({ data, context }) => {
	const { getCampaignResultsImpl } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	return getCampaignResultsImpl(context.userId, data.campaignId);
}));
var getCampaignForEdit_createServerFn_handler = createServerRpc({
	id: "b7f55781ecb2d4e63a4b21861e6203bc42bfee60b7c172c0402607a3d4fba50d",
	name: "getCampaignForEdit",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => getCampaignForEdit.__executeServer(opts));
var getCampaignForEdit = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ campaignId: stringType().uuid() }).parse(input)).handler(getCampaignForEdit_createServerFn_handler, withServerTiming("getCampaignForEdit", async ({ data, context }) => {
	const { getCampaignForEditImpl } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	return getCampaignForEditImpl(context.userId, data.campaignId);
}));
var getCampaignForEarner_createServerFn_handler = createServerRpc({
	id: "0198c71f0c8f10b24e7a07f3d23cba83ec7dfea3af097163a6003d4cf4f920d1",
	name: "getCampaignForEarner",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => getCampaignForEarner.__executeServer(opts));
var getCampaignForEarner = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ campaignId: stringType().uuid() }).parse(input)).handler(getCampaignForEarner_createServerFn_handler, withServerTiming("getCampaignForEarner", async ({ data, context }) => {
	const { getCampaignForEarnerImpl } = await import("./publisher.server-BEIokuuX.mjs");
	return getCampaignForEarnerImpl(context.userId, data.campaignId);
}));
var listActiveCampaigns_createServerFn_handler = createServerRpc({
	id: "735e051af52ed52324b238cc62c4f21519b826d2220d9725128c6d32f5778ca6",
	name: "listActiveCampaigns",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => listActiveCampaigns.__executeServer(opts));
var listActiveCampaigns = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(listActiveCampaigns_createServerFn_handler, withServerTiming("listActiveCampaigns", async ({ context }) => {
	const { listActiveCampaignsImpl } = await import("./publisher.server-BEIokuuX.mjs");
	return listActiveCampaignsImpl(context.userId);
}));
var listMySubmissions_createServerFn_handler = createServerRpc({
	id: "5fbb54b5ef21cab546de76d73ad7e40c06f5f680f52d2820cc179be79ea4c79b",
	name: "listMySubmissions",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => listMySubmissions.__executeServer(opts));
var listMySubmissions = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(listMySubmissions_createServerFn_handler, withServerTiming("listMySubmissions", async ({ context }) => {
	const { listMySubmissionsImpl } = await import("./publisher.server-BEIokuuX.mjs");
	return listMySubmissionsImpl(context.userId);
}));
var submitProof_createServerFn_handler = createServerRpc({
	id: "fdedc44e313d9482a2a723e1de3b299ad5c73dc0c5be0c938c2a6f6bf04cf404",
	name: "submitProof",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => submitProof.__executeServer(opts));
var submitProof = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(async (input) => {
	const { submitProofInput } = await import("./publisher.server-BEIokuuX.mjs");
	return submitProofInput.parse(input);
}).handler(submitProof_createServerFn_handler, withServerTiming("submitProof", async ({ data, context }) => {
	const { submitProofImpl, SubmissionError } = await import("./publisher.server-BEIokuuX.mjs");
	try {
		return await submitProofImpl(context.userId, data);
	} catch (err) {
		if (err instanceof SubmissionError) throw new Error(`${err.code}: ${err.message}`);
		throw err;
	}
}));
var submitProofForCampaign_createServerFn_handler = createServerRpc({
	id: "adc78d8003df45cd074be3d1720f3b3112c450c3e39d2359e0b0b16bc4e557af",
	name: "submitProofForCampaign",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => submitProofForCampaign.__executeServer(opts));
var submitProofForCampaign = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(async (input) => {
	const { submitProofForCampaignInput } = await import("./publisher.server-BEIokuuX.mjs");
	return submitProofForCampaignInput.parse(input);
}).handler(submitProofForCampaign_createServerFn_handler, withServerTiming("submitProofForCampaign", async ({ data, context }) => {
	const { submitProofForCampaignImpl, SubmissionError } = await import("./publisher.server-BEIokuuX.mjs");
	try {
		return await submitProofForCampaignImpl(context.userId, data);
	} catch (err) {
		if (err instanceof SubmissionError) throw new Error(`${err.code}: ${err.message}`);
		throw err;
	}
}));
var appealSubmission_createServerFn_handler = createServerRpc({
	id: "68242992373f656278810b55d6f3201dfed4aab2921196fd991db25853568424",
	name: "appealSubmission",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => appealSubmission.__executeServer(opts));
var appealSubmission = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(async (input) => {
	const { appealSubmissionInput } = await import("./publisher.server-BEIokuuX.mjs");
	return appealSubmissionInput.parse(input);
}).handler(appealSubmission_createServerFn_handler, withServerTiming("appealSubmission", async ({ data, context }) => {
	const { appealSubmissionImpl, SubmissionError } = await import("./publisher.server-BEIokuuX.mjs");
	try {
		await appealSubmissionImpl(context.userId, data);
		return { ok: true };
	} catch (err) {
		if (err instanceof SubmissionError) throw new Error(`${err.code}: ${err.message}`);
		throw err;
	}
}));
var listPendingCampaigns_createServerFn_handler = createServerRpc({
	id: "290529a93d217bb18991308c933eb7766fdde3656f3d6c80a7fd4b8274af0ef9",
	name: "listPendingCampaigns",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => listPendingCampaigns.__executeServer(opts));
var listPendingCampaigns = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(listPendingCampaigns_createServerFn_handler, withServerTiming("listPendingCampaigns", async () => {
	const { listPendingCampaignsImpl } = await import("./admin.server-BZl5UQqf.mjs");
	return listPendingCampaignsImpl();
}));
var listPendingProofs_createServerFn_handler = createServerRpc({
	id: "e13a0617e69af1a7d094a68ecadafaa3ef521b51e81efa71b169be7e00e418ac",
	name: "listPendingProofs",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => listPendingProofs.__executeServer(opts));
var listPendingProofs = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(listPendingProofs_createServerFn_handler, withServerTiming("listPendingProofs", async () => {
	const { listPendingProofsImpl } = await import("./admin.server-BZl5UQqf.mjs");
	return listPendingProofsImpl();
}));
var reviewCampaign_createServerFn_handler = createServerRpc({
	id: "202bbe3fdb8310b2f765d14762b52cfcd635877c0f13671dc778353719a07d22",
	name: "reviewCampaign",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => reviewCampaign.__executeServer(opts));
var reviewCampaign = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	campaignId: stringType().uuid(),
	decision: enumType(["approved", "rejected"]),
	note: stringType().min(5).max(500)
}).parse(input)).handler(reviewCampaign_createServerFn_handler, withServerTiming("reviewCampaign", async ({ data, context }) => {
	const { reviewCampaignImpl, AdminActionError } = await import("./admin.server-BZl5UQqf.mjs");
	try {
		await reviewCampaignImpl(context.userId, data.campaignId, data.decision, data.note);
		return { ok: true };
	} catch (err) {
		if (err instanceof AdminActionError) throw new Error(`${err.code}: ${err.message}`);
		throw err;
	}
}));
var reviewProof_createServerFn_handler = createServerRpc({
	id: "22cde728fbba6955bb956f49399aaf5ecc9036d565ba08f2170d336555ecbd2e",
	name: "reviewProof",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => reviewProof.__executeServer(opts));
var reviewProof = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	submissionId: stringType().uuid(),
	role: enumType(["admin", "advertiser"]).default("admin"),
	decision: enumType(["approved", "rejected"]),
	reason: stringType().min(10).max(500).nullable()
}).parse(input)).handler(reviewProof_createServerFn_handler, withServerTiming("reviewProof", async ({ data, context }) => {
	const { reviewProofImpl, AdminActionError } = await import("./admin.server-BZl5UQqf.mjs");
	try {
		await reviewProofImpl(context.userId, data.submissionId, data.role, data.decision, data.reason);
		return { ok: true };
	} catch (err) {
		if (err instanceof AdminActionError) throw new Error(`${err.code}: ${err.message}`);
		throw err;
	}
}));
var startCampaign_createServerFn_handler = createServerRpc({
	id: "2f36ee3878798c8bc429d86262222cdecb0c58fc1536833f4d7689d1d1263d9a",
	name: "startCampaign",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => startCampaign.__executeServer(opts));
var startCampaign = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	campaignId: stringType().uuid(),
	userAgent: stringType().max(500).nullable()
}).parse(input)).handler(startCampaign_createServerFn_handler, withServerTiming("startCampaign", async ({ data, context }) => {
	const { startCampaignImpl } = await import("./publisher.server-BEIokuuX.mjs");
	return startCampaignImpl(context.userId, data.campaignId, data.userAgent);
}));
var getPreferredRole_createServerFn_handler = createServerRpc({
	id: "0e6ae522803d99c0afa815d1843b1edc6c49f108d79e95537ea494d9d669c8fd",
	name: "getPreferredRole",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => getPreferredRole.__executeServer(opts));
var getPreferredRole = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(getPreferredRole_createServerFn_handler, withServerTiming("getPreferredRole", async ({ context }) => {
	const { getPreferredRoleImpl } = await import("./role-preference.server-C1QFm-gj.mjs");
	return getPreferredRoleImpl(context.userId);
}));
var setPreferredRole_createServerFn_handler = createServerRpc({
	id: "1750371c6a1617af6bdbe567635273cefd8cd0746a4b22b0b2d06bb9962a070e",
	name: "setPreferredRole",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => setPreferredRole.__executeServer(opts));
var setPreferredRole = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ role: enumType(["publisher", "advertiser"]) }).parse(input)).handler(setPreferredRole_createServerFn_handler, withServerTiming("setPreferredRole", async ({ data, context }) => {
	const { setPreferredRoleImpl } = await import("./role-preference.server-C1QFm-gj.mjs");
	await setPreferredRoleImpl(context.userId, data.role);
	return { ok: true };
}));
var listCategories_createServerFn_handler = createServerRpc({
	id: "b26aa50745b61d721b8b74bdb186ee1b935d33b94926e2a9960892966bfcfb67",
	name: "listCategories",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => listCategories.__executeServer(opts));
var listCategories = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(listCategories_createServerFn_handler, withServerTiming("listCategories", async () => {
	const { listCategoriesWithSubcategoriesImpl } = await import("./categories.server-L6n-f_NZ.mjs");
	return listCategoriesWithSubcategoriesImpl();
}));
var listPendingReviews_createServerFn_handler = createServerRpc({
	id: "26d11672bf8e3b56a22b9ad6cb6dd09df2df1dbbaa33a4aaccbca62314ee25ef",
	name: "listPendingReviews",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => listPendingReviews.__executeServer(opts));
var listPendingReviews = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(listPendingReviews_createServerFn_handler, withServerTiming("listPendingReviews", async ({ context }) => {
	const { listPendingReviewsImpl } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	return listPendingReviewsImpl(context.userId);
}));
var reviewSubmission_createServerFn_handler = createServerRpc({
	id: "515149c9123f00a24401fad9482cfac0f566b8e395f00a903a44b8db233033f3",
	name: "reviewSubmission",
	filename: "src/lib/marketplace.functions.ts"
}, (opts) => reviewSubmission.__executeServer(opts));
var reviewSubmission = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	submissionId: stringType().uuid(),
	decision: enumType(["approved", "rejected"]),
	reason: stringType().optional()
}).parse(input)).handler(reviewSubmission_createServerFn_handler, withServerTiming("reviewSubmission", async ({ data, context }) => {
	const { reviewSubmissionImpl } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	await reviewSubmissionImpl(context.userId, data.submissionId, data.decision, data.reason);
	return { ok: true };
}));
//#endregion
export { abandonDeposit_createServerFn_handler, addCampaignBudget_createServerFn_handler, appealSubmission_createServerFn_handler, becomeAdvertiser_createServerFn_handler, campaignAction_createServerFn_handler, confirmCheckout_createServerFn_handler, createCampaign_createServerFn_handler, createDeposit_createServerFn_handler, createNowpaymentsDeposit_createServerFn_handler, createQropayDeposit_createServerFn_handler, editCampaign_createServerFn_handler, getAdvertiserOverview_createServerFn_handler, getCampaignForEarner_createServerFn_handler, getCampaignForEdit_createServerFn_handler, getCampaignResults_createServerFn_handler, getDepositStatus_createServerFn_handler, getMarketplaceSettings_createServerFn_handler, getPreferredRole_createServerFn_handler, listActiveCampaigns_createServerFn_handler, listAdvertiserTransactions_createServerFn_handler, listCategories_createServerFn_handler, listMyCampaigns_createServerFn_handler, listMySubmissions_createServerFn_handler, listPendingCampaigns_createServerFn_handler, listPendingProofs_createServerFn_handler, listPendingReviews_createServerFn_handler, reviewCampaign_createServerFn_handler, reviewProof_createServerFn_handler, reviewSubmission_createServerFn_handler, rotateCampaignSecret_createServerFn_handler, setPreferredRole_createServerFn_handler, startCampaign_createServerFn_handler, submitProofForCampaign_createServerFn_handler, submitProof_createServerFn_handler, updateAdvertiserProfile_createServerFn_handler, updateMarketplaceSettings_createServerFn_handler };
