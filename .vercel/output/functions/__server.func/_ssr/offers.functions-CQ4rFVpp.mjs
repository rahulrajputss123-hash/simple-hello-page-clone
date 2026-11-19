import { i as createServerFn } from "./server-CpGMOUrW.mjs";
import { t as createSsrRpc } from "./createSsrRpc-Bbq2Yr9O.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Br_KWlRY.mjs";
import { c as recordType, i as enumType, l as stringType, n as arrayType, o as numberType, r as booleanType, s as objectType, u as unknownType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/offers.functions-CQ4rFVpp.js
/** Middle dot with hair spaces, matching how the app separates inline metadata. */
var SEPARATOR = " · ";
function cleanPrice(value) {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}
function cleanPercent(value) {
	if (value === null || value === void 0 || value === "") return null;
	const n = Number(value);
	if (!Number.isFinite(n) || n < 0) return null;
	return `${Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)))}%`;
}
/**
* The badge string, or null when neither field is set.
* Returning null (rather than "") lets callers branch to the reward fallback.
*/
function offerDisplayBadge(offer) {
	const price = cleanPrice(offer.display_price);
	const percent = cleanPercent(offer.display_percent);
	if (price && percent) return `${price}${SEPARATOR}${percent}`;
	return price ?? percent ?? null;
}
/** User: log a click event for an offer (called when Continue is tapped in the pre-redirect popup). */
var trackOfferClick = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ offerId: stringType().uuid() }).parse(input)).handler(createSsrRpc("66437436eeef20d6dfef86ab3205b98db2664c719b12e833c4c787ab05ead73e"));
/** Admin-only API surface for future Providers / Network offer management screens. */
var listOfferProviders = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("d148dd34ea16cb6c25a5b85dc9a64fe3a27e8a51ac5f5b1d79978ed1e5e07c7e"));
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
}).parse(input)).handler(createSsrRpc("6d8448540ed674ec4a0370dfdecfee6affd27274570035d7bb3e5c775c742487"));
var syncOfferProvider = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ providerId: stringType().uuid() }).parse(input)).handler(createSsrRpc("818e16ce4a1d2d5a30213a62e0231231300e4685f446e944e6b5c2251b3540d2"));
var adminDashboard = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("afb66e9a8ee2fe5cd094eaa68cde8c54a95ef07a12c9ae10792eec1cb6ba6d9a"));
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
}).parse(input ?? {})).handler(createSsrRpc("85900f329c914f1a090a93f7f1352bf2ea15ce26086fd489acdfeb07e359afd4"));
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
}).parse(input)).handler(createSsrRpc("56b52ef0d5ef0f4c99a66e7af3f44622420ab64b37d8c15eb5fe47c63329689d"));
var deleteManualOffer = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(createSsrRpc("efd6156f0f391c21f248c89e0f2d417f0fd423fa12436f58d3cba7a6f62af638"));
/** Authenticated: geo-targeted, ranked Featured Offers for the requesting user's country. */
var getFeaturedFeed = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ scope: enumType(["home", "all"]).default("home") }).parse(input ?? {})).handler(createSsrRpc("585ce132a1e0f891880904f8c5f19dedeef58124ed99460c00e053513e9c2eb2"));
/** Authenticated: get single offer by ID with user's claim status */
var getOfferById = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ offerId: stringType().uuid() }).parse(input)).handler(createSsrRpc("6919ff95c813986fc7d527c9669978608cb9dac59370fe4b92fd6270b31f8912"));
/** Admin: read feed-automation settings + per-network config + cache freshness. */
var getFeedAutomation = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("90551b8bac25a82f3a7283427ee3888635b0cce9e7cbfef914897a7628ef47d0"));
/** Admin: update global feed-automation settings. */
var updateFeedSettings = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	refreshIntervalHours: numberType().int().min(1).max(168),
	defaultCountry: stringType().trim().length(2).regex(/^[A-Za-z]{2}$/),
	fallbackBehavior: enumType(["none", "default_country"]),
	featuredSlots: numberType().int().min(1).max(24)
}).parse(input)).handler(createSsrRpc("de9e6765019cc50a35aeb77c2254756190ba5879d0f3e1d592b193deda13adaf"));
/** Admin: update per-network automation config (enable, max offers, ranking weight). */
var updateNetworkFeedSettings = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	providerId: stringType().uuid(),
	enabled: booleanType(),
	maxOffers: numberType().int().min(1).max(50),
	weight: numberType().min(.01).max(1e3)
}).parse(input)).handler(createSsrRpc("292b0546ffa144fda7c6a5b6a62ceabf0549fdddfa6115f7644edcf1b3fda8f7"));
/** Admin: manually refresh one network's feed for a country (defaults to the default country). */
var adminRefreshFeed = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	providerId: stringType().uuid(),
	country: stringType().trim().length(2).regex(/^[A-Za-z]{2}$/).optional()
}).parse(input)).handler(createSsrRpc("c495b4632acf8119dc10d8b3b99cef7ee8d80f20efb5880df7db4b986e18b2aa"));
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
}).parse(input)).handler(createSsrRpc("088992ae4f6e071a83f68239645093eb6980d78c82dbb7cc1fd9b01be88570e6"));
/** Admin: fetch a short-lived signed URL to preview a proof file. */
var adminSignProofUrl = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ path: stringType().trim().min(1).max(500) }).parse(input)).handler(createSsrRpc("8a6c8aae26bd4bc164e5db5ca586f167d66a8f15d58a5acc033e7b109a2f4696"));
/** User: request a signed upload URL for a proof file (path scoped to their uid). */
var requestProofUploadUrl = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	offerId: stringType().uuid(),
	filename: stringType().trim().min(1).max(120)
}).parse(input)).handler(createSsrRpc("5c191730bfd51354b56c81f477a5dcc377cfcebc50cae4f579a0723dc1571e91"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	startDate: stringType().regex(/^\d{4}-\d{2}-\d{2}/),
	endDate: stringType().regex(/^\d{4}-\d{2}-\d{2}/)
}).parse(input)).handler(createSsrRpc("ac64164f56428bb07c4aaa0bf255d86d17a78fc8b436119856afcd91020e327f"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("76a76fcecc4544119ba2a867bbe8ccf44a181b0124391578a42e9296ea564a08"));
//#endregion
export { updateOfferControls as _, getFeaturedFeed as a, listAdminOffers as c, requestProofUploadUrl as d, saveManualOffer as f, updateNetworkFeedSettings as g, updateFeedSettings as h, deleteManualOffer as i, listOfferProviders as l, trackOfferClick as m, adminRefreshFeed as n, getFeedAutomation as o, syncOfferProvider as p, adminSignProofUrl as r, getOfferById as s, adminDashboard as t, offerDisplayBadge as u, upsertOfferProvider as v };
