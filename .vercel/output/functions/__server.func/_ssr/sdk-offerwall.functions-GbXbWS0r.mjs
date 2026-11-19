import { i as createServerFn } from "./server-CpGMOUrW.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Br_KWlRY.mjs";
import { c as recordType, i as enumType, l as stringType, n as arrayType, o as numberType, r as booleanType, s as objectType, t as anyType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-BPtk4SPL.mjs";
import { t as withServerTiming } from "./server-timing-middleware-BDljk4aZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sdk-offerwall.functions-GbXbWS0r.js
/** SDK Offerwall management API. Separate from the Offer Feed provider API. */
var providerSchema = objectType({
	id: stringType().uuid().optional(),
	slug: stringType().trim().min(1).max(40).regex(/^[a-z0-9-]+$/),
	name: stringType().trim().min(1).max(80),
	tagline: stringType().trim().max(140).default(""),
	logoUrl: stringType().trim().max(500).nullable().optional(),
	enabled: booleanType().default(false),
	displayOrder: numberType().int().min(0).max(999).default(0),
	platforms: arrayType(enumType([
		"android",
		"ios",
		"web"
	])).max(3).default(["android"]),
	integrationType: enumType([
		"placeholder",
		"native_sdk",
		"web_sdk",
		"hybrid",
		"api"
	]).default("placeholder"),
	sdkVersion: stringType().trim().max(40).nullable().optional(),
	appId: stringType().trim().max(120).nullable().optional(),
	placementId: stringType().trim().max(120).nullable().optional(),
	publisherId: stringType().trim().max(120).nullable().optional(),
	extraConfig: recordType(stringType(), anyType()).default({}),
	secretRefs: recordType(stringType(), anyType()).default({}),
	currencyName: stringType().trim().min(1).max(30).default("coins"),
	currencyPerUsd: numberType().positive().max(1e6).default(100),
	rewardMultiplier: numberType().min(0).max(100).default(1),
	minReward: numberType().min(0).max(1e4).default(0),
	maxReward: numberType().min(0).max(1e4).nullable().optional(),
	roundingMode: enumType([
		"floor",
		"ceil",
		"nearest"
	]).default("nearest"),
	postbackPath: stringType().trim().max(300).nullable().optional(),
	postbackAuthMode: enumType([
		"none",
		"signature",
		"ip_allowlist",
		"signature_and_ip"
	]).default("none"),
	postbackSignatureSecretRef: stringType().trim().max(80).nullable().optional(),
	postbackIpAllowlist: arrayType(stringType().trim().max(60)).max(40).default([]),
	transactionIdParam: stringType().trim().min(1).max(60).default("transaction_id"),
	userIdParam: stringType().trim().min(1).max(60).default("sub_id"),
	rewardParam: stringType().trim().min(1).max(60).default("amount"),
	userIdentityMode: enumType([
		"user_uuid",
		"hashed_uuid",
		"referral_code",
		"custom"
	]).default("user_uuid"),
	userIdentitySaltRef: stringType().trim().max(80).nullable().optional(),
	dedupeStrategy: enumType([
		"transaction_id",
		"transaction_id_and_user",
		"payload_hash"
	]).default("transaction_id"),
	dedupeWindowHours: numberType().int().min(1).max(8760).default(720),
	status: enumType([
		"draft",
		"configured",
		"testing",
		"live",
		"disabled"
	]).default("draft"),
	notes: stringType().trim().max(1e3).default(""),
	metadata: recordType(stringType(), anyType()).default({}),
	lockType: enumType([
		"none",
		"time",
		"earning"
	]).default("none"),
	unlockAt: stringType().datetime({ offset: true }).nullable().optional(),
	requiredLifetimeEarned: numberType().min(0).max(1e5).nullable().optional()
});
/** Signed-in users: enabled providers only, safe fields.
*  Passes the requesting userId so lock state is computed per-user server-side.
*/
var listSdkOfferwallProviders_createServerFn_handler = createServerRpc({
	id: "55a33d66fd4b49b9176c4beb1cc678958ccf2b3d0641d2228ff84fcf02fc847d",
	name: "listSdkOfferwallProviders",
	filename: "src/lib/sdk-offerwall.functions.ts"
}, (opts) => listSdkOfferwallProviders.__executeServer(opts));
var listSdkOfferwallProviders = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ limit: numberType().int().min(1).max(50).optional() }).parse(input ?? {})).handler(listSdkOfferwallProviders_createServerFn_handler, withServerTiming("listSdkOfferwallProviders", async ({ data, context }) => {
	const { listPublicSdkProvidersImpl } = await import("./admin.server-CD6mMoBC.mjs");
	return listPublicSdkProvidersImpl(data.limit, context.userId);
}));
var listAdminSdkProviders_createServerFn_handler = createServerRpc({
	id: "cfbc4f3091bd2c48ae834b93c7626c67862c9f0600425a38ba94afbd3175fc87",
	name: "listAdminSdkProviders",
	filename: "src/lib/sdk-offerwall.functions.ts"
}, (opts) => listAdminSdkProviders.__executeServer(opts));
var listAdminSdkProviders = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(listAdminSdkProviders_createServerFn_handler, withServerTiming("listAdminSdkProviders", async ({ context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { listSdkProvidersImpl } = await import("./admin.server-CD6mMoBC.mjs");
	return listSdkProvidersImpl();
}));
var saveSdkProvider_createServerFn_handler = createServerRpc({
	id: "369fe079323a1311e88e20ca1b558193c7e0f4c5125230a1e88107cb250d3275",
	name: "saveSdkProvider",
	filename: "src/lib/sdk-offerwall.functions.ts"
}, (opts) => saveSdkProvider.__executeServer(opts));
var saveSdkProvider = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => providerSchema.parse(input)).handler(saveSdkProvider_createServerFn_handler, withServerTiming("saveSdkProvider", async ({ data, context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { upsertSdkProviderImpl } = await import("./admin.server-CD6mMoBC.mjs");
	return upsertSdkProviderImpl(data);
}));
var updateSdkProviderControls_createServerFn_handler = createServerRpc({
	id: "1e9bad61763d167895f0f0f2d488be428daeb2e793474492b9b16e34f1f367dd",
	name: "updateSdkProviderControls",
	filename: "src/lib/sdk-offerwall.functions.ts"
}, (opts) => updateSdkProviderControls.__executeServer(opts));
var updateSdkProviderControls = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid(),
	enabled: booleanType().optional(),
	displayOrder: numberType().int().min(0).max(999).optional(),
	status: enumType([
		"draft",
		"configured",
		"testing",
		"live",
		"disabled"
	]).optional()
}).parse(input)).handler(updateSdkProviderControls_createServerFn_handler, withServerTiming("updateSdkProviderControls", async ({ data, context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { updateSdkProviderControlsImpl } = await import("./admin.server-CD6mMoBC.mjs");
	return updateSdkProviderControlsImpl(data);
}));
var deleteSdkProvider_createServerFn_handler = createServerRpc({
	id: "abc5ff39129e51ce03cb2bab1645d43fbf012e773f1c4f2d9f94546e0a5983d4",
	name: "deleteSdkProvider",
	filename: "src/lib/sdk-offerwall.functions.ts"
}, (opts) => deleteSdkProvider.__executeServer(opts));
var deleteSdkProvider = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(deleteSdkProvider_createServerFn_handler, withServerTiming("deleteSdkProvider", async ({ data, context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { deleteSdkProviderImpl } = await import("./admin.server-CD6mMoBC.mjs");
	return deleteSdkProviderImpl(data.id);
}));
var requestOfferwallLogoUploadUrl_createServerFn_handler = createServerRpc({
	id: "60b43d02542a6640684277cd91a6e606d6c5310a57148955b6a126d2d7035774",
	name: "requestOfferwallLogoUploadUrl",
	filename: "src/lib/sdk-offerwall.functions.ts"
}, (opts) => requestOfferwallLogoUploadUrl.__executeServer(opts));
var requestOfferwallLogoUploadUrl = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ filename: stringType().trim().min(1).max(120) }).parse(input)).handler(requestOfferwallLogoUploadUrl_createServerFn_handler, withServerTiming("requestOfferwallLogoUploadUrl", async ({ data, context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { requestOfferwallLogoUploadUrlImpl } = await import("./admin.server-CD6mMoBC.mjs");
	return requestOfferwallLogoUploadUrlImpl(context.userId, data.filename);
}));
var listSdkConversions_createServerFn_handler = createServerRpc({
	id: "317fd5d51f85da1f7da865cf09437f631189a83afc3a706d69b5bb8938968ec0",
	name: "listSdkConversions",
	filename: "src/lib/sdk-offerwall.functions.ts"
}, (opts) => listSdkConversions.__executeServer(opts));
var listSdkConversions = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	providerId: stringType().uuid().optional(),
	limit: numberType().int().min(1).max(200).default(50)
}).parse(input ?? {})).handler(listSdkConversions_createServerFn_handler, withServerTiming("listSdkConversions", async ({ data, context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { listSdkConversionsImpl } = await import("./admin.server-CD6mMoBC.mjs");
	return listSdkConversionsImpl(data);
}));
var getOfferwallMeSignedUrl_createServerFn_handler = createServerRpc({
	id: "8691889db9cec3a36a2afa4f5fe3899ea19cc6c9cedbeb2471fecb299f8ff8c1",
	name: "getOfferwallMeSignedUrl",
	filename: "src/lib/sdk-offerwall.functions.ts"
}, (opts) => getOfferwallMeSignedUrl.__executeServer(opts));
var getOfferwallMeSignedUrl = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(getOfferwallMeSignedUrl_createServerFn_handler, withServerTiming("getOfferwallMeSignedUrl", async ({ context }) => {
	const { getOfferwallMeSignedUrlImpl } = await import("./admin.server-CD6mMoBC.mjs");
	return getOfferwallMeSignedUrlImpl(context.userId);
}));
var getTheoremReachSignedUrl_createServerFn_handler = createServerRpc({
	id: "f9ad3890c128f4134e4a0668b7debc65c2082b347475f4806966901a8e60c407",
	name: "getTheoremReachSignedUrl",
	filename: "src/lib/sdk-offerwall.functions.ts"
}, (opts) => getTheoremReachSignedUrl.__executeServer(opts));
var getTheoremReachSignedUrl = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(getTheoremReachSignedUrl_createServerFn_handler, withServerTiming("getTheoremReachSignedUrl", async ({ context }) => {
	const { getTheoremReachSignedUrlImpl } = await import("./admin.server-CD6mMoBC.mjs");
	return getTheoremReachSignedUrlImpl(context.userId);
}));
var getToroxWallUrl_createServerFn_handler = createServerRpc({
	id: "0e70905ea4d244fceb9bb13c51cdc6a00535628e1f4b241707ceaf20d6e72bce",
	name: "getToroxWallUrl",
	filename: "src/lib/sdk-offerwall.functions.ts"
}, (opts) => getToroxWallUrl.__executeServer(opts));
var getToroxWallUrl = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(getToroxWallUrl_createServerFn_handler, withServerTiming("getToroxWallUrl", async ({ context }) => {
	const { getToroxWallUrlImpl } = await import("./admin.server-CD6mMoBC.mjs");
	return getToroxWallUrlImpl(context.userId);
}));
//#endregion
export { deleteSdkProvider_createServerFn_handler, getOfferwallMeSignedUrl_createServerFn_handler, getTheoremReachSignedUrl_createServerFn_handler, getToroxWallUrl_createServerFn_handler, listAdminSdkProviders_createServerFn_handler, listSdkConversions_createServerFn_handler, listSdkOfferwallProviders_createServerFn_handler, requestOfferwallLogoUploadUrl_createServerFn_handler, saveSdkProvider_createServerFn_handler, updateSdkProviderControls_createServerFn_handler };
