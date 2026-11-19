import { i as createServerFn } from "./server-CpGMOUrW.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Br_KWlRY.mjs";
import { c as recordType, i as enumType, l as stringType, n as arrayType, o as numberType, r as booleanType, s as objectType, u as unknownType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-BPtk4SPL.mjs";
import { t as withServerTiming } from "./server-timing-middleware-BDljk4aZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/offers.functions-DaWzb6oC.js
/** User: log a click event for an offer (called when Continue is tapped in the pre-redirect popup). */
var trackOfferClick_createServerFn_handler = createServerRpc({
	id: "66437436eeef20d6dfef86ab3205b98db2664c719b12e833c4c787ab05ead73e",
	name: "trackOfferClick",
	filename: "src/lib/offers.functions.ts"
}, (opts) => trackOfferClick.__executeServer(opts));
var trackOfferClick = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ offerId: stringType().uuid() }).parse(input)).handler(trackOfferClick_createServerFn_handler, withServerTiming("trackOfferClick", async ({ data, context }) => {
	const { recordOfferClickImpl } = await import("./tags.server-D4OttxCH.mjs");
	const { detectCountryFromRequest } = await import("./geo.server-BPDqDCBk.mjs");
	const { getUserCountry } = await import("./profile.server-uhkAcSlI.mjs");
	let country = detectCountryFromRequest();
	if (!country) country = await getUserCountry(context.userId);
	return recordOfferClickImpl(data.offerId, context.userId, country);
}));
var listOfferProviders_createServerFn_handler = createServerRpc({
	id: "d148dd34ea16cb6c25a5b85dc9a64fe3a27e8a51ac5f5b1d79978ed1e5e07c7e",
	name: "listOfferProviders",
	filename: "src/lib/offers.functions.ts"
}, (opts) => listOfferProviders.__executeServer(opts));
var listOfferProviders = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(listOfferProviders_createServerFn_handler, withServerTiming("listOfferProviders", async ({ context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	await requireRole(context.userId, ["admin"]);
	const { listProvidersImpl } = await import("./sync.server-D8twT0Oa.mjs");
	return listProvidersImpl();
}));
var upsertOfferProvider_createServerFn_handler = createServerRpc({
	id: "6d8448540ed674ec4a0370dfdecfee6affd27274570035d7bb3e5c775c742487",
	name: "upsertOfferProvider",
	filename: "src/lib/offers.functions.ts"
}, (opts) => upsertOfferProvider.__executeServer(opts));
var upsertOfferProvider = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid().optional(),
	name: stringType().trim().min(1).max(80),
	slug: stringType().trim().min(1).max(40).regex(/^[a-z0-9-]+$/),
	providerType: enumType([
		"offerwall",
		"cpa",
		"cpi",
		"survey",
		"other"
	]),
	enabled: booleanType().default(false),
	syncConfig: recordType(stringType(), unknownType()).default({}),
	defaultRevenueShare: numberType().min(0).max(1).default(.6)
}).parse(input)).handler(upsertOfferProvider_createServerFn_handler, withServerTiming("upsertOfferProvider", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	await requireRole(context.userId, ["admin"]);
	const { upsertProviderImpl } = await import("./sync.server-D8twT0Oa.mjs");
	return upsertProviderImpl(data);
}));
var syncOfferProvider_createServerFn_handler = createServerRpc({
	id: "818e16ce4a1d2d5a30213a62e0231231300e4685f446e944e6b5c2251b3540d2",
	name: "syncOfferProvider",
	filename: "src/lib/offers.functions.ts"
}, (opts) => syncOfferProvider.__executeServer(opts));
var syncOfferProvider = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ providerId: stringType().uuid() }).parse(input)).handler(syncOfferProvider_createServerFn_handler, withServerTiming("syncOfferProvider", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	await requireRole(context.userId, ["admin"]);
	const { syncProviderImpl } = await import("./sync.server-D8twT0Oa.mjs");
	return syncProviderImpl(data.providerId);
}));
var adminDashboard_createServerFn_handler = createServerRpc({
	id: "afb66e9a8ee2fe5cd094eaa68cde8c54a95ef07a12c9ae10792eec1cb6ba6d9a",
	name: "adminDashboard",
	filename: "src/lib/offers.functions.ts"
}, (opts) => adminDashboard.__executeServer(opts));
var adminDashboard = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(adminDashboard_createServerFn_handler, withServerTiming("adminDashboard", async ({ context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	await requireRole(context.userId, ["admin"]);
	const { adminDashboardImpl } = await import("./admin.server-DoNcukvF.mjs");
	return adminDashboardImpl();
}));
var listAdminOffers_createServerFn_handler = createServerRpc({
	id: "85900f329c914f1a090a93f7f1352bf2ea15ce26086fd489acdfeb07e359afd4",
	name: "listAdminOffers",
	filename: "src/lib/offers.functions.ts"
}, (opts) => listAdminOffers.__executeServer(opts));
var listAdminOffers = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	source: enumType([
		"all",
		"manual",
		"network"
	]).default("all"),
	search: stringType().trim().max(80).optional(),
	status: enumType([
		"all",
		"active",
		"inactive",
		"featured",
		"expired"
	]).default("all"),
	providerId: stringType().uuid().optional(),
	country: stringType().trim().max(4).optional(),
	limit: numberType().int().min(1).max(200).default(100)
}).parse(input ?? {})).handler(listAdminOffers_createServerFn_handler, withServerTiming("listAdminOffers", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	await requireRole(context.userId, ["admin"]);
	const { listAdminOffersImpl } = await import("./admin.server-DoNcukvF.mjs");
	return listAdminOffersImpl(data);
}));
var saveManualOffer_createServerFn_handler = createServerRpc({
	id: "56b52ef0d5ef0f4c99a66e7af3f44622420ab64b37d8c15eb5fe47c63329689d",
	name: "saveManualOffer",
	filename: "src/lib/offers.functions.ts"
}, (opts) => saveManualOffer.__executeServer(opts));
var saveManualOffer = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid().optional(),
	title: stringType().trim().min(2).max(120),
	description: stringType().trim().max(600).default(""),
	requirements: stringType().trim().max(600).default(""),
	notAllowed: stringType().trim().max(1e3).default(""),
	icon: stringType().trim().max(300).default("gift"),
	rewardAmount: numberType().min(0).max(1e4),
	networkPayout: numberType().min(0).max(1e4).nullable().optional(),
	clickUrl: stringType().trim().url().max(1e3).nullable().optional(),
	countries: arrayType(stringType().trim().min(2).max(3)).max(250).default([]),
	devices: arrayType(stringType().trim().max(20)).max(10).default([]),
	expiresAt: stringType().datetime().nullable().optional(),
	isActive: booleanType().default(true),
	isFeatured: booleanType().default(false),
	sortOrder: numberType().int().min(0).max(9999).default(0),
	adminPriority: numberType().int().min(0).max(9999).default(0),
	isLimitedDeal: booleanType().default(false),
	dealGroupId: stringType().trim().max(60).nullable().optional(),
	actualCost: numberType().min(0).max(1e6).nullable().optional(),
	payoutPercentage: numberType().min(0).max(1e3).default(110),
	maxPayoutCap: numberType().min(0).max(1e6).nullable().optional(),
	displayPrice: stringType().trim().max(24).nullable().optional(),
	displayPercent: numberType().min(0).max(1e5).nullable().optional(),
	payoutMode: enumType([
		"manual",
		"manual_proof",
		"auto_postback"
	]).default("manual"),
	postbackSecretRef: stringType().trim().max(120).nullable().optional(),
	postbackIpAllowlist: arrayType(stringType().trim().max(64)).max(20).default([]),
	category: enumType([
		"App Install",
		"Trial",
		"Deals",
		"Survey",
		"Games",
		"Link Locker",
		"Shortlink"
	]).nullable().optional(),
	tags: arrayType(enumType([
		"Hot",
		"Trending",
		"Easy",
		"Popular"
	])).max(4).default([])
}).parse(input)).handler(saveManualOffer_createServerFn_handler, withServerTiming("saveManualOffer", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	await requireRole(context.userId, ["admin"]);
	const { upsertManualOfferImpl } = await import("./admin.server-DoNcukvF.mjs");
	return upsertManualOfferImpl(data);
}));
var deleteManualOffer_createServerFn_handler = createServerRpc({
	id: "efd6156f0f391c21f248c89e0f2d417f0fd423fa12436f58d3cba7a6f62af638",
	name: "deleteManualOffer",
	filename: "src/lib/offers.functions.ts"
}, (opts) => deleteManualOffer.__executeServer(opts));
var deleteManualOffer = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(deleteManualOffer_createServerFn_handler, withServerTiming("deleteManualOffer", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	await requireRole(context.userId, ["admin"]);
	const { deleteManualOfferImpl } = await import("./admin.server-DoNcukvF.mjs");
	return deleteManualOfferImpl(data.id);
}));
var getFeaturedFeed_createServerFn_handler = createServerRpc({
	id: "585ce132a1e0f891880904f8c5f19dedeef58124ed99460c00e053513e9c2eb2",
	name: "getFeaturedFeed",
	filename: "src/lib/offers.functions.ts"
}, (opts) => getFeaturedFeed.__executeServer(opts));
var getFeaturedFeed = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ scope: enumType(["home", "all"]).default("home") }).parse(input ?? {})).handler(getFeaturedFeed_createServerFn_handler, withServerTiming("getFeaturedFeed", async ({ data, context }) => {
	const { detectCountryFromRequest, detectIpFromRequest } = await import("./geo.server-BPDqDCBk.mjs");
	const { getFeaturedFeedImpl } = await import("./feed-cache.server-CY3cPWq8.mjs");
	const { detectPlatformFromRequest } = await import("./platform.server-bwRAE082.mjs");
	const { updateUserCountryIfChanged } = await import("./profile.server-uhkAcSlI.mjs");
	const country = detectCountryFromRequest();
	const ip = detectIpFromRequest();
	const platform = await detectPlatformFromRequest();
	updateUserCountryIfChanged(context.userId).catch(() => {});
	return getFeaturedFeedImpl(country, data.scope, ip, context.userId, platform);
}));
var getOfferById_createServerFn_handler = createServerRpc({
	id: "6919ff95c813986fc7d527c9669978608cb9dac59370fe4b92fd6270b31f8912",
	name: "getOfferById",
	filename: "src/lib/offers.functions.ts"
}, (opts) => getOfferById.__executeServer(opts));
var getOfferById = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ offerId: stringType().uuid() }).parse(input)).handler(getOfferById_createServerFn_handler, withServerTiming("getOfferById", async ({ data, context }) => {
	const { getOfferByIdImpl } = await import("./feed-cache.server-CY3cPWq8.mjs");
	return getOfferByIdImpl(data.offerId, context.userId);
}));
var getFeedAutomation_createServerFn_handler = createServerRpc({
	id: "90551b8bac25a82f3a7283427ee3888635b0cce9e7cbfef914897a7628ef47d0",
	name: "getFeedAutomation",
	filename: "src/lib/offers.functions.ts"
}, (opts) => getFeedAutomation.__executeServer(opts));
var getFeedAutomation = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(getFeedAutomation_createServerFn_handler, withServerTiming("getFeedAutomation", async ({ context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	await requireRole(context.userId, ["admin"]);
	const { getFeedAutomationImpl } = await import("./feed-cache.server-CY3cPWq8.mjs");
	return getFeedAutomationImpl();
}));
var updateFeedSettings_createServerFn_handler = createServerRpc({
	id: "de9e6765019cc50a35aeb77c2254756190ba5879d0f3e1d592b193deda13adaf",
	name: "updateFeedSettings",
	filename: "src/lib/offers.functions.ts"
}, (opts) => updateFeedSettings.__executeServer(opts));
var updateFeedSettings = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	refreshIntervalHours: numberType().int().min(1).max(168),
	defaultCountry: stringType().trim().length(2).regex(/^[A-Za-z]{2}$/),
	fallbackBehavior: enumType(["none", "default_country"]),
	featuredSlots: numberType().int().min(1).max(24)
}).parse(input)).handler(updateFeedSettings_createServerFn_handler, withServerTiming("updateFeedSettings", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	await requireRole(context.userId, ["admin"]);
	const { updateFeedSettingsImpl } = await import("./feed-settings.server-782fwX6y.mjs");
	return updateFeedSettingsImpl(data);
}));
var updateNetworkFeedSettings_createServerFn_handler = createServerRpc({
	id: "292b0546ffa144fda7c6a5b6a62ceabf0549fdddfa6115f7644edcf1b3fda8f7",
	name: "updateNetworkFeedSettings",
	filename: "src/lib/offers.functions.ts"
}, (opts) => updateNetworkFeedSettings.__executeServer(opts));
var updateNetworkFeedSettings = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	providerId: stringType().uuid(),
	enabled: booleanType(),
	maxOffers: numberType().int().min(1).max(50),
	weight: numberType().min(.01).max(1e3)
}).parse(input)).handler(updateNetworkFeedSettings_createServerFn_handler, withServerTiming("updateNetworkFeedSettings", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	await requireRole(context.userId, ["admin"]);
	const { updateNetworkFeedSettingsImpl } = await import("./feed-settings.server-782fwX6y.mjs");
	return updateNetworkFeedSettingsImpl(data);
}));
var adminRefreshFeed_createServerFn_handler = createServerRpc({
	id: "c495b4632acf8119dc10d8b3b99cef7ee8d80f20efb5880df7db4b986e18b2aa",
	name: "adminRefreshFeed",
	filename: "src/lib/offers.functions.ts"
}, (opts) => adminRefreshFeed.__executeServer(opts));
var adminRefreshFeed = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	providerId: stringType().uuid(),
	country: stringType().trim().length(2).regex(/^[A-Za-z]{2}$/).optional()
}).parse(input)).handler(adminRefreshFeed_createServerFn_handler, withServerTiming("adminRefreshFeed", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	await requireRole(context.userId, ["admin"]);
	const { adminRefreshProviderImpl } = await import("./feed-cache.server-CY3cPWq8.mjs");
	return adminRefreshProviderImpl(data.providerId, data.country);
}));
var updateOfferControls_createServerFn_handler = createServerRpc({
	id: "088992ae4f6e071a83f68239645093eb6980d78c82dbb7cc1fd9b01be88570e6",
	name: "updateOfferControls",
	filename: "src/lib/offers.functions.ts"
}, (opts) => updateOfferControls.__executeServer(opts));
var updateOfferControls = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid(),
	isActive: booleanType().optional(),
	isFeatured: booleanType().optional(),
	adminPriority: numberType().int().min(0).max(9999).optional(),
	sortOrder: numberType().int().min(0).max(9999).optional(),
	rewardAmount: numberType().min(0).max(1e4).optional(),
	revenueShare: numberType().min(0).max(1).optional(),
	payoutMode: enumType([
		"manual",
		"manual_proof",
		"auto_postback"
	]).optional(),
	postbackSecretRef: stringType().trim().max(120).nullable().optional(),
	pushToBottom: booleanType().nullable().optional(),
	category: enumType([
		"App Install",
		"Trial",
		"Deals",
		"Survey",
		"Games",
		"Link Locker",
		"Shortlink"
	]).nullable().optional(),
	tags: arrayType(enumType([
		"Hot",
		"Trending",
		"Easy",
		"Popular"
	])).max(4).optional()
}).parse(input)).handler(updateOfferControls_createServerFn_handler, withServerTiming("updateOfferControls", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	await requireRole(context.userId, ["admin"]);
	const { updateOfferControlsImpl } = await import("./admin.server-DoNcukvF.mjs");
	return updateOfferControlsImpl(data);
}));
var adminSignProofUrl_createServerFn_handler = createServerRpc({
	id: "8a6c8aae26bd4bc164e5db5ca586f167d66a8f15d58a5acc033e7b109a2f4696",
	name: "adminSignProofUrl",
	filename: "src/lib/offers.functions.ts"
}, (opts) => adminSignProofUrl.__executeServer(opts));
var adminSignProofUrl = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ path: stringType().trim().min(1).max(500) }).parse(input)).handler(adminSignProofUrl_createServerFn_handler, withServerTiming("adminSignProofUrl", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	await requireRole(context.userId, ["admin"]);
	const { signProofUrl } = await import("./proof.server-DMSAyAXD.mjs");
	return { url: await signProofUrl(data.path, 300) };
}));
var requestProofUploadUrl_createServerFn_handler = createServerRpc({
	id: "5c191730bfd51354b56c81f477a5dcc377cfcebc50cae4f579a0723dc1571e91",
	name: "requestProofUploadUrl",
	filename: "src/lib/offers.functions.ts"
}, (opts) => requestProofUploadUrl.__executeServer(opts));
var requestProofUploadUrl = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	offerId: stringType().uuid(),
	filename: stringType().trim().min(1).max(120)
}).parse(input)).handler(requestProofUploadUrl_createServerFn_handler, withServerTiming("requestProofUploadUrl", async ({ data, context }) => {
	const { requestProofUploadUrlImpl } = await import("./proof-upload.server-CbAwWEdl.mjs");
	return requestProofUploadUrlImpl(context.userId, data.offerId, data.filename);
}));
var getCountryAnalytics_createServerFn_handler = createServerRpc({
	id: "ac64164f56428bb07c4aaa0bf255d86d17a78fc8b436119856afcd91020e327f",
	name: "getCountryAnalytics",
	filename: "src/lib/offers.functions.ts"
}, (opts) => getCountryAnalytics.__executeServer(opts));
var getCountryAnalytics = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	startDate: stringType().regex(/^\d{4}-\d{2}-\d{2}/),
	endDate: stringType().regex(/^\d{4}-\d{2}-\d{2}/)
}).parse(input)).handler(getCountryAnalytics_createServerFn_handler, withServerTiming("getCountryAnalytics", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	await requireRole(context.userId, ["admin"]);
	const { getCountryAnalyticsImpl } = await import("./admin-country-analytics.server-CwZKsXN5.mjs");
	return getCountryAnalyticsImpl(data.startDate, data.endDate);
}));
var getFeedHealthStatus_createServerFn_handler = createServerRpc({
	id: "76a76fcecc4544119ba2a867bbe8ccf44a181b0124391578a42e9296ea564a08",
	name: "getFeedHealthStatus",
	filename: "src/lib/offers.functions.ts"
}, (opts) => getFeedHealthStatus.__executeServer(opts));
var getFeedHealthStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(getFeedHealthStatus_createServerFn_handler, withServerTiming("getFeedHealthStatus", async ({ context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	await requireRole(context.userId, ["admin"]);
	const { getFeedHealthStatusImpl } = await import("./admin-country-analytics.server-CwZKsXN5.mjs");
	return getFeedHealthStatusImpl();
}));
//#endregion
export { adminDashboard_createServerFn_handler, adminRefreshFeed_createServerFn_handler, adminSignProofUrl_createServerFn_handler, deleteManualOffer_createServerFn_handler, getCountryAnalytics_createServerFn_handler, getFeaturedFeed_createServerFn_handler, getFeedAutomation_createServerFn_handler, getFeedHealthStatus_createServerFn_handler, getOfferById_createServerFn_handler, listAdminOffers_createServerFn_handler, listOfferProviders_createServerFn_handler, requestProofUploadUrl_createServerFn_handler, saveManualOffer_createServerFn_handler, syncOfferProvider_createServerFn_handler, trackOfferClick_createServerFn_handler, updateFeedSettings_createServerFn_handler, updateNetworkFeedSettings_createServerFn_handler, updateOfferControls_createServerFn_handler, upsertOfferProvider_createServerFn_handler };
