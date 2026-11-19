import "../_runtime.mjs";
import { n as toResponse, t as H3Event } from "../_libs/h3-v2+rou3+srvx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { B as _getRenderedMatches, F as getScriptPreloadAttrs, G as isDangerousProtocol, H as invariant, I as getStylesheetHref, J as isRedirect, K as isPromise, L as resolveManifestAssetLink, M as toCrossJSONStream, Q as isNotFound, R as resolveManifestCssLink, V as executeRewriteInput, Y as parseRedirect, Z as rootRouteId, a as isSsrResponse, c as stripSsrResponseBody, h as RouterProvider, i as disposeSsrResponse, j as toCrossJSONAsync, k as fromJSON, n as bindSsrResponseToRequest, o as normalizeSsrResponse, r as defineHandlerCallback, s as replaceSsrResponse, t as renderRouterToStream, z as waitForReason } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as createServerHistory } from "../_libs/tanstack__history.mjs";
import { a as defaultSerovalDeserializerPlugins, i as createRawStreamRPCPlugin, n as attachRouterServerSsrUtils, o as makeSerovalPlugin, r as getNormalizedURL, s as createSerializationAdapter, t as mergeHeaders } from "../_libs/@tanstack/router-core+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { AsyncLocalStorage } from "node:async_hooks";
//#region node_modules/.nitro/vite/services/ssr/assets/rolldown-runtime-DkIiUugF.js
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esmMin = (fn, res, err) => () => {
	if (err) throw err[0];
	try {
		return fn && (res = fn(fn = 0)), res;
	} catch (e) {
		throw err = [e], e;
	}
};
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toCommonJS = (mod) => __hasOwnProp.call(mod, "module.exports") ? mod["module.exports"] : __copyProps(__defProp({}, "__esModule", { value: true }), mod);
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/createMiddleware-B_4t7rW1.js
var createMiddleware = (options, __opts) => {
	const resolvedOptions = {
		type: "request",
		...__opts || options
	};
	const setValidator = (validator) => {
		return createMiddleware({}, Object.assign(resolvedOptions, {
			validator,
			inputValidator: validator
		}));
	};
	return {
		options: resolvedOptions,
		middleware: (middleware) => {
			return createMiddleware({}, Object.assign(resolvedOptions, { middleware }));
		},
		validator: setValidator,
		inputValidator: setValidator,
		client: (client) => {
			return createMiddleware({}, Object.assign(resolvedOptions, { client }));
		},
		server: (server) => {
			return createMiddleware({}, Object.assign(resolvedOptions, { server }));
		}
	};
};
require_react();
var import_jsx_runtime = require_jsx_runtime();
function StartServer(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RouterProvider, { router: props.router });
}
var defaultStreamHandler = defineHandlerCallback(({ request, router, responseHeaders }) => renderRouterToStream({
	request,
	router,
	responseHeaders,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StartServer, { router })
}));
var GLOBAL_EVENT_STORAGE_KEY = Symbol.for("tanstack-start:event-storage");
var globalObj$1 = globalThis;
if (!globalObj$1[GLOBAL_EVENT_STORAGE_KEY]) globalObj$1[GLOBAL_EVENT_STORAGE_KEY] = new AsyncLocalStorage();
var eventStorage = globalObj$1[GLOBAL_EVENT_STORAGE_KEY];
function isPromiseLike(value) {
	return (typeof value === "object" || typeof value === "function") && value !== null && typeof value.then === "function";
}
function getSetCookieValues(headers) {
	const headersWithSetCookie = headers;
	if (typeof headersWithSetCookie.getSetCookie === "function") return headersWithSetCookie.getSetCookie();
	const value = headers.get("set-cookie");
	return value ? [value] : [];
}
function mergeEventResponseHeaders(response, event) {
	if (response.ok) return;
	const eventSetCookies = getSetCookieValues(event.res.headers);
	if (eventSetCookies.length === 0) return;
	const responseSetCookies = getSetCookieValues(response.headers);
	response.headers.delete("set-cookie");
	for (const cookie of responseSetCookies) response.headers.append("set-cookie", cookie);
	for (const cookie of eventSetCookies) response.headers.append("set-cookie", cookie);
}
function finalizeResponse(value, event) {
	const response = ensureResponse(value);
	mergeEventResponseHeaders(response, event);
	return response;
}
function finalizeMaybeResponse(value, event) {
	if (isPromiseLike(value)) return Promise.resolve(value).then((resolved) => finalizeResponse(resolved, event), (error) => finalizeResponse(handleResponseError(error), event));
	return finalizeResponse(value, event);
}
function ensureResponse(value) {
	if (value instanceof Response) return value;
	return new Response("Internal Server Error", { status: 500 });
}
function handleResponseError(error) {
	if (error instanceof Response) return error;
	if (error instanceof Error) throw error;
	return new Response("Internal Server Error", { status: 500 });
}
function requestHandler(handler) {
	return (request, requestOpts) => {
		let h3Event;
		try {
			h3Event = new H3Event(request);
		} catch (error) {
			if (error instanceof URIError) return new Response(null, {
				status: 400,
				statusText: "Bad Request"
			});
			throw error;
		}
		let response;
		try {
			response = eventStorage.run({ h3Event }, () => handler(request, requestOpts));
		} catch (error) {
			response = handleResponseError(error);
		}
		return toResponse(finalizeMaybeResponse(response, h3Event), h3Event);
	};
}
function getH3Event() {
	const event = eventStorage.getStore();
	if (!event) throw new Error(`No StartEvent found in AsyncLocalStorage. Make sure you are using the function within the server runtime.`);
	return event.h3Event;
}
function getRequest() {
	return getH3Event().req;
}
function getResponse() {
	return getH3Event().res;
}
var HEADERS = { TSS_SHELL: "X-TSS_SHELL" };
/**
* @description Returns the router manifest data that should be sent to the client.
* This includes only the assets and preloads for the current route and any
* special assets that are needed for the client. It does not include relationships
* between routes or any other data that is not needed for the client.
*
* @param matchedRoutes - In dev mode, the matched routes are used to build
* the dev styles URL for route-scoped CSS collection.
*/
async function getStartManifest(matchedRoutes) {
	const { tsrStartManifest } = await import("../_tanstack-start-manifest_v-C-5EJ61P.mjs");
	const startManifest = tsrStartManifest();
	let routes = startManifest.routes;
	routes[rootRouteId];
	const manifestRoutes = {};
	for (const k in routes) {
		const v = routes[k];
		const result = {};
		if (v.preloads && v.preloads.length > 0) result.preloads = v.preloads;
		if (v.scripts && v.scripts.length > 0) result.scripts = v.scripts;
		if (v.css?.length) result.css = v.css;
		if (result.preloads || result.scripts || result.css) manifestRoutes[k] = result;
	}
	return {
		...startManifest.scriptFormat ? { scriptFormat: startManifest.scriptFormat } : {},
		...startManifest.inlineCss ? { inlineCss: startManifest.inlineCss } : {},
		routes: manifestRoutes
	};
}
var manifest = {
	"01826f8b211b53868aec025999e043064e83dd2eb7f516d285ad5fe51ddbc4ad": {
		functionName: "updateMarketplaceSettings_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"0198c71f0c8f10b24e7a07f3d23cba83ec7dfea3af097163a6003d4cf4f920d1": {
		functionName: "getCampaignForEarner_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"03bb27beccf34db0164432c252207c160452c0880b7ccac2d0e91085681e0aec": {
		functionName: "adminAdjustWallet_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"0417a07bdddc5b0bdddf084f3faf3d3f45989a08c56a391f58836aeb1e5d3f2d": {
		functionName: "listAdminPremiumOnboardingSteps_createServerFn_handler",
		importer: () => import("./functions-BAlBEQQe.mjs")
	},
	"04aad9c95604b74d2339128ffc7deeedf2c971cbe46d6226f5b0dca8a2cec3ba": {
		functionName: "completeTask_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"088992ae4f6e071a83f68239645093eb6980d78c82dbb7cc1fd9b01be88570e6": {
		functionName: "updateOfferControls_createServerFn_handler",
		importer: () => import("./offers.functions-DaWzb6oC.mjs")
	},
	"099357483872b0de9c0cd536938f0b3aefae1cfe68e538c32bdd14ac324500f6": {
		functionName: "refreshMyTasks_createServerFn_handler",
		importer: () => import("./tasks.functions-5faH8Qm6.mjs")
	},
	"0bd057af126f88808da8e0ddaee5f4f4a6a129039c5b0b5fb08f4676e811fb6f": {
		functionName: "retryConversion_createServerFn_handler",
		importer: () => import("./automation.functions-DFSGj8Hm.mjs")
	},
	"0cb5c6aa2488419445699bd40f9c6d047707da2f33d8e7a07a142a0975091ebf": {
		functionName: "campaignAction_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"0e6ae522803d99c0afa815d1843b1edc6c49f108d79e95537ea494d9d669c8fd": {
		functionName: "getPreferredRole_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"0e70905ea4d244fceb9bb13c51cdc6a00535628e1f4b241707ceaf20d6e72bce": {
		functionName: "getToroxWallUrl_createServerFn_handler",
		importer: () => import("./sdk-offerwall.functions-GbXbWS0r.mjs")
	},
	"0f92a2bbcf4795e87b159b4c672e04ebada3cd5b2a03598808454f1688207c8a": {
		functionName: "getUserAuditLog_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"1060e64b0e1b4bdf0639654e5da952eca13175b2e82a67c5953efb70bcb28b59": {
		functionName: "adminOverview_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"113e0390e2c66bd55e0bdefe8fa79f992fe2654db151956ca61360374a2c6754": {
		functionName: "getDashboardActiveUsers_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"1301f5e2ff0e980b8a00500548c051c63330a9822c1e78b659e8c0f37d4bac26": {
		functionName: "transferEarningsToAdvertiser_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"15849f100c883a96dcb4fd37c4eb251b8bcd52d121c815f386dfe0263b32d220": {
		functionName: "assignRole_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"166351c4b3b261fec66e592322b4c54794b8916e8df80283b90ffc8352782c97": {
		functionName: "listMyCampaigns_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"16fba392848896b5beac1cd77afde2cf48211a79c9dc79a450e3e27f88dded40": {
		functionName: "getQuestActiveTimeProgress_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"1750371c6a1617af6bdbe567635273cefd8cd0746a4b22b0b2d06bb9962a070e": {
		functionName: "setPreferredRole_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"1a02e21e7bd36bfbcf11f6cd3162614e7495dbcd81f34d6d171b7518bc8a3984": {
		functionName: "createDeposit_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"1cd5ee983de5d7fdae35082851de3cf9b6e1f26f74eef3a92f7554e8251a7839": {
		functionName: "deleteQuickReply_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"1e5b0cb8d5d4f064fb5d3e63fe837f49245be02d431739537235c3a9c493a24c": {
		functionName: "listAdminQuests_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"1e9bad61763d167895f0f0f2d488be428daeb2e793474492b9b16e34f1f367dd": {
		functionName: "updateSdkProviderControls_createServerFn_handler",
		importer: () => import("./sdk-offerwall.functions-GbXbWS0r.mjs")
	},
	"1fc25f0f0b339dff5de6f9192a64657b2590eb9df858f3c8a25921bb281ad874": {
		functionName: "createQropayDeposit_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"202bbe3fdb8310b2f765d14762b52cfcd635877c0f13671dc778353719a07d22": {
		functionName: "reviewCampaign_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"20c329ab6313b2403b652df70d42fb07efbf492aeabb194e1d893b788153bfca": {
		functionName: "getMarketplaceSettings_createServerFn_handler",
		importer: () => import("./admin-settings.server-C25xyjOM.mjs")
	},
	"222961bb2dbc8040282b1b546f7f57b265daec2ba3391d2123176de9466ddc40": {
		functionName: "approveAdjustmentRequest_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"22cde728fbba6955bb956f49399aaf5ecc9036d565ba08f2170d336555ecbd2e": {
		functionName: "reviewProof_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"26d11672bf8e3b56a22b9ad6cb6dd09df2df1dbbaa33a4aaccbca62314ee25ef": {
		functionName: "listPendingReviews_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"279fef0972c37ad2f35187ad7c48164ada2cbca0ee4b541c890ef6dc5164583b": {
		functionName: "createQuickReply_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"27d3903d900a31b8ccfec3437a2c649c8486041a41dccd03075a8fb1a7af1de3": {
		functionName: "listAdvertiserTransactions_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"28142979b76ff44b4bae725f95f907133001489270b956994b7f74e0c8ba6e50": {
		functionName: "adminSetFlag_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"286099256527088e3b90e3a445cac65c94ef3778958574f7a5727494032bf6f2": {
		functionName: "exportTransactionsCsv_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"290529a93d217bb18991308c933eb7766fdde3656f3d6c80a7fd4b8274af0ef9": {
		functionName: "listPendingCampaigns_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"292b0546ffa144fda7c6a5b6a62ceabf0549fdddfa6115f7644edcf1b3fda8f7": {
		functionName: "updateNetworkFeedSettings_createServerFn_handler",
		importer: () => import("./offers.functions-DaWzb6oC.mjs")
	},
	"2938aa646e13b524a8024f6fab490fcb3c5e662bad721b55da4a0e7173d4a94f": {
		functionName: "saveAdminTask_createServerFn_handler",
		importer: () => import("./tasks.functions-5faH8Qm6.mjs")
	},
	"2bd8c3834253865a6e20c2689f8a85aebf7fa15dc3478ce50592825fb8347d00": {
		functionName: "getDepositStatus_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"2c5406b4f29b5fa4985355e5ea844aa88185334de80dfb5049cfdd19867f977e": {
		functionName: "startFeedQuest_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"2f36ee3878798c8bc429d86262222cdecb0c58fc1536833f4d7689d1d1263d9a": {
		functionName: "startCampaign_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"3040184cae8619f59f1f1d15feab48b60e8f1cc0bc61379a647618a0da8c4011": {
		functionName: "listQuickReplies_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"30fef264186afa0605a3e0521a6582b80911dd9262292afbde94f4a6542204b9": {
		functionName: "claimOffer_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"317fd5d51f85da1f7da865cf09437f631189a83afc3a706d69b5bb8938968ec0": {
		functionName: "listSdkConversions_createServerFn_handler",
		importer: () => import("./sdk-offerwall.functions-GbXbWS0r.mjs")
	},
	"339ddf6971dd621f9de34f096bdbc0cc607f6f61973c596fc46f9fb09095c3ef": {
		functionName: "exportUsersCsv_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"33fe3e85e3e734fbfa02b4e8709fa45c366b966dfb0eb3c7dfd2c4eb20060001": {
		functionName: "deleteAdminTask_createServerFn_handler",
		importer: () => import("./tasks.functions-5faH8Qm6.mjs")
	},
	"3496dc372a78d4eb4ce1811294c47da645af755f6da0ad04be131560d5bb05bf": {
		functionName: "listAutomationLogs_createServerFn_handler",
		importer: () => import("./automation.functions-DFSGj8Hm.mjs")
	},
	"365d505f98cca490b53272ba65f7c16773018ffdc3a553dae769fc794682cf6a": {
		functionName: "markOnboardingSeen_createServerFn_handler",
		importer: () => import("./functions-BAlBEQQe.mjs")
	},
	"369fe079323a1311e88e20ca1b558193c7e0f4c5125230a1e88107cb250d3275": {
		functionName: "saveSdkProvider_createServerFn_handler",
		importer: () => import("./sdk-offerwall.functions-GbXbWS0r.mjs")
	},
	"3a02c0ec3a5b150508469413ee78fa7ee96fea7420a85e9fb299a4ce8f85a45f": {
		functionName: "cancelWithdrawal_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"3f35e3ea3795d3fbf1d561595252fa4e9466aca2a3abd2ce032f1aecc822f7a3": {
		functionName: "getTopClientErrors_createServerFn_handler",
		importer: () => import("./analytics.functions-C4SD4PHV.mjs")
	},
	"4288710aedd7d76a93f035c8631ebd30aa656bf9b529b165eee4fef6d591d88b": {
		functionName: "listAdminOnboardingSteps_createServerFn_handler",
		importer: () => import("./functions-BAlBEQQe.mjs")
	},
	"4628f23376d570c6c12510bb75a2b12ea7bba83c9e0c72483f218c31fcca978b": {
		functionName: "clearAdvertiserFlag_createServerFn_handler",
		importer: () => import("./admin-advertisers.server-rLVlYSC2.mjs")
	},
	"4754bc9ae6c09ebe68be77e94b59aa5098a72057fbdff48a998dfd8ed6f7cb11": {
		functionName: "adminListUsers_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"47f9d2e7a8567318a3039053b316a3fc4a847200f893519312ff0a4f585ea157": {
		functionName: "createAdjustmentRequest_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"48e234dd2d46a03b02c59d82cebc1e9cd564d071d6881ec2e55057a78570d0ee": {
		functionName: "createNowpaymentsDeposit_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"500bd575c3b142dff59398fa8ecdca6d468dee80ee4fcaa354be4feb6d77dedf": {
		functionName: "editCampaign_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"50369dc8041e0f1633f8e9d111f00f15a04808cbddd3c04b0a29d1780ed9d04a": {
		functionName: "startShortlinkStep_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"5065cf49b310417358eaba46745296e634b714b04a58937137bae52bb061239f": {
		functionName: "getDashboardTopOffers_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"515149c9123f00a24401fad9482cfac0f566b8e395f00a903a44b8db233033f3": {
		functionName: "reviewSubmission_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"53705949da61097c1d3afab2d0033998e69f5dee3539b1314c077f0e5b7ea3ed": {
		functionName: "setMaintenanceMode_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"54403fd88ead069bb713c532eb8fca2b0538b59139b03e58be3a6b55f7160ed0": {
		functionName: "endActiveTimeGrace_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"55a33d66fd4b49b9176c4beb1cc678958ccf2b3d0641d2228ff84fcf02fc847d": {
		functionName: "listSdkOfferwallProviders_createServerFn_handler",
		importer: () => import("./sdk-offerwall.functions-GbXbWS0r.mjs")
	},
	"55d205c4104833b5da1cc369fabe6432aeaf54b61e5ec03777ba6a05481fe8d2": {
		functionName: "getActiveTimeQuestKey_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"56b52ef0d5ef0f4c99a66e7af3f44622420ab64b37d8c15eb5fe47c63329689d": {
		functionName: "saveManualOffer_createServerFn_handler",
		importer: () => import("./offers.functions-DaWzb6oC.mjs")
	},
	"57137ee209e75373aa5abd336744eccf473f3c2903828aef0acb327a6640c715": {
		functionName: "adminListAuditLogs_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"585ce132a1e0f891880904f8c5f19dedeef58124ed99460c00e053513e9c2eb2": {
		functionName: "getFeaturedFeed_createServerFn_handler",
		importer: () => import("./offers.functions-DaWzb6oC.mjs")
	},
	"5af89718379d3f3a9acf31d0f2e9c51a0bd467c9def3698744f786a2c265a123": {
		functionName: "setSmartBannerEnabled_createServerFn_handler",
		importer: () => import("./functions-BmoDkZn9.mjs")
	},
	"5c191730bfd51354b56c81f477a5dcc377cfcebc50cae4f579a0723dc1571e91": {
		functionName: "requestProofUploadUrl_createServerFn_handler",
		importer: () => import("./offers.functions-DaWzb6oC.mjs")
	},
	"5c24e8a9841a8e4c3d765536b0d527ee0b3ab7c5771de0cf0a870c2fef46b3bd": {
		functionName: "saveQuest_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"5fbb54b5ef21cab546de76d73ad7e40c06f5f680f52d2820cc179be79ea4c79b": {
		functionName: "listMySubmissions_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"60a33c64429e4ccf43cfbc0372780490bc76026d87f307c0bde0544fd388770e": {
		functionName: "abandonDeposit_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"60b43d02542a6640684277cd91a6e606d6c5310a57148955b6a126d2d7035774": {
		functionName: "requestOfferwallLogoUploadUrl_createServerFn_handler",
		importer: () => import("./sdk-offerwall.functions-GbXbWS0r.mjs")
	},
	"63d8fb14ad0c7aedbce0b0328f87b059830d5c6d1ffea83aeda7baef888b176a": {
		functionName: "listSdkProvidersForQuests_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"658527fa974b5f8e35f690e417a88b854b678e758ea20ab4c7a3ce76f60355cd": {
		functionName: "getFeedQuestProgress_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"66437436eeef20d6dfef86ab3205b98db2664c719b12e833c4c787ab05ead73e": {
		functionName: "trackOfferClick_createServerFn_handler",
		importer: () => import("./offers.functions-DaWzb6oC.mjs")
	},
	"68242992373f656278810b55d6f3201dfed4aab2921196fd991db25853568424": {
		functionName: "appealSubmission_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"6919ff95c813986fc7d527c9669978608cb9dac59370fe4b92fd6270b31f8912": {
		functionName: "getOfferById_createServerFn_handler",
		importer: () => import("./offers.functions-DaWzb6oC.mjs")
	},
	"69736a15d12256af6cb97ecc7e69f563827999cb9801396c73b1fcf6539b35b3": {
		functionName: "ensureProfile_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"6a566336c270fa8566c30bb5363e0d19e303facccfdc67c87fbaf4c246f28f4a": {
		functionName: "getReferralSettings_createServerFn_handler",
		importer: () => import("./admin-settings.server-C25xyjOM.mjs")
	},
	"6a7c320e1c86a9d2e931030f4080fade96597a5f487c7691c4627738dfc9b42d": {
		functionName: "listEligibleBanners_createServerFn_handler",
		importer: () => import("./functions-BmoDkZn9.mjs")
	},
	"6acb2162c646b7861b223f8493ec4867c241370d406e88d024a30ca88bd3b83d": {
		functionName: "becomeAdvertiser_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"6b5581f49fa670fd0e66b744e3f541f93b3a4e60f3cfa01a0204f00a035f306d": {
		functionName: "getMarketplaceSettings_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"6c24b986dd76fd4d7a0e55422413aeb5bdd62422f0410e30f771c537288e6939": {
		functionName: "getUsersWithSameDevice_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"6cf688e24a3ee56a47ab363b5deb2ffc96e531e071e15e6f2455845a6ddd0e30": {
		functionName: "openFeedQuestStep_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"6d1aa3398c44cc086cc9d9b3024394ce9211635d72a2421085801ef9dc408202": {
		functionName: "listAdjustmentRequests_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"6d8448540ed674ec4a0370dfdecfee6affd27274570035d7bb3e5c775c742487": {
		functionName: "upsertOfferProvider_createServerFn_handler",
		importer: () => import("./offers.functions-DaWzb6oC.mjs")
	},
	"6ec3785b5340a6c4e7e32744d3bbbc719ea3d940d654049ff8a508c117884b30": {
		functionName: "listActiveQuests_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"7007da75d1dcac471af5a70484867b72815f34fe68f76855ff5774148c895910": {
		functionName: "completeTimedPtcStep_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"705633caa6134c8ce4cd31b45c7bc7ae85165f5bb875f52535eeb6dfbf0e1b34": {
		functionName: "checkInToday_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"71a1a9072834e563aacbcf4e95af8580575d9c69bf6c5fc41c144a5c56d02809": {
		functionName: "adminRespondTicket_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"7237fe6320898543f36acd1719a81135a099cd1b099e17d4824f2d230768f6d8": {
		functionName: "startOfferClaim_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"735e051af52ed52324b238cc62c4f21519b826d2220d9725128c6d32f5778ca6": {
		functionName: "listActiveCampaigns_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"76a76fcecc4544119ba2a867bbe8ccf44a181b0124391578a42e9296ea564a08": {
		functionName: "getFeedHealthStatus_createServerFn_handler",
		importer: () => import("./offers.functions-DaWzb6oC.mjs")
	},
	"7a0df54040071cd9f8be948b8492ba678a7e89171c887cc6134ba0eecfa8504b": {
		functionName: "getDashboardSignups_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"7bd36b172431ea04c0ef8cc9cd6fd9b2d166b81c7931314e78a26193b5fc9488": {
		functionName: "listStaff_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"7ccc9b45da74a1471a1818b7ab07c9d3b4abaf5817887ddb4f67e697be59c49b": {
		functionName: "startSurveyQuest_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"7dbe2a7021154b399e2c4f6b2b4c273b977d16e1e1b849b8d34f27a33ed0d8b4": {
		functionName: "listOnboardingSteps_createServerFn_handler",
		importer: () => import("./functions-BAlBEQQe.mjs")
	},
	"7dfe5c9c0312a363dd0e8ff6e41f6b4aae35a6c9d51f6a65b6ded779049cd62b": {
		functionName: "fetchSurveyFeed_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"818e16ce4a1d2d5a30213a62e0231231300e4685f446e944e6b5c2251b3540d2": {
		functionName: "syncOfferProvider_createServerFn_handler",
		importer: () => import("./offers.functions-DaWzb6oC.mjs")
	},
	"85900f329c914f1a090a93f7f1352bf2ea15ce26086fd489acdfeb07e359afd4": {
		functionName: "listAdminOffers_createServerFn_handler",
		importer: () => import("./offers.functions-DaWzb6oC.mjs")
	},
	"85dd6f6e3122690b52df9700134e9211e877df8ec3abe412ffb787ee37190953": {
		functionName: "adminUpdateWithdrawal_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"865feb8dee62f5ef4fea3d59cd99ca2035c23c3f1554caa0b3ffefbb9203a27e": {
		functionName: "updateReferralSettings_createServerFn_handler",
		importer: () => import("./admin-settings.server-C25xyjOM.mjs")
	},
	"8691889db9cec3a36a2afa4f5fe3899ea19cc6c9cedbeb2471fecb299f8ff8c1": {
		functionName: "getOfferwallMeSignedUrl_createServerFn_handler",
		importer: () => import("./sdk-offerwall.functions-GbXbWS0r.mjs")
	},
	"88d044370dcbcebbae90178e5043c60096c7b4fecf8ba4e6ab7d032f939f7648": {
		functionName: "startTimedPtcStep_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"89667eeeedc6d755c2afe5ebbafa244938c64ba501d89a3ef96d3772eb5ea52f": {
		functionName: "startActiveTimeGrace_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"89e3d1144746874336c39944d1dff530622453baa14793b025ed752614349d6f": {
		functionName: "listPremiumOnboardingSteps_createServerFn_handler",
		importer: () => import("./functions-BAlBEQQe.mjs")
	},
	"8a30725712b7a5c1d0d1733b1b512c5fc4636852a404fdedf9c27a1a95717977": {
		functionName: "reorderPremiumOnboardingSteps_createServerFn_handler",
		importer: () => import("./functions-BAlBEQQe.mjs")
	},
	"8a3d968e2cc71e21d8934bfbeeea434bdca38f8e429b512d31dfc807c293368f": {
		functionName: "deleteOnboardingStep_createServerFn_handler",
		importer: () => import("./functions-BAlBEQQe.mjs")
	},
	"8a6c8aae26bd4bc164e5db5ca586f167d66a8f15d58a5acc033e7b109a2f4696": {
		functionName: "adminSignProofUrl_createServerFn_handler",
		importer: () => import("./offers.functions-DaWzb6oC.mjs")
	},
	"8abe77de2e342523204df239659f20c6e46730e5b22e4f8069a4c31fc709307b": {
		functionName: "completeOnboarding_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"8c90d46f19347dc6eb554371817d0ca3267967968a59b2cb5b8deda869be6bfe": {
		functionName: "sendAssistantMessage_createServerFn_handler",
		importer: () => import("./assistant.functions-BXsq-9U2.mjs")
	},
	"90551b8bac25a82f3a7283427ee3888635b0cce9e7cbfef914897a7628ef47d0": {
		functionName: "getFeedAutomation_createServerFn_handler",
		importer: () => import("./offers.functions-DaWzb6oC.mjs")
	},
	"911f464e6d3f0f9b48a2cba46755d85d612a44875fe7e277ba6312a45844fdee": {
		functionName: "claimActiveTimeReward_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"92a64a7fcf14c96725985bd6609acae86c66c8e3528a5cff8d4cdf201d9fe0dc": {
		functionName: "requestBannerUploadUrl_createServerFn_handler",
		importer: () => import("./functions-BmoDkZn9.mjs")
	},
	"9371b0f660deda1fe1d2f77f3d80d6162fc61d7f56a924c31ce505280821d431": {
		functionName: "getFunnelAnalytics_createServerFn_handler",
		importer: () => import("./analytics.functions-C4SD4PHV.mjs")
	},
	"944a5ed7b9016b55c61355fb35c621b0a61b04ad2c0de5ccc0e2e9dba1371ebf": {
		functionName: "reorderOnboardingSteps_createServerFn_handler",
		importer: () => import("./functions-BAlBEQQe.mjs")
	},
	"94cc60bee564ee34f6c461a08365cc9ea57608ea564d851162bbfbb247d8d5c3": {
		functionName: "setAdminTaskActive_createServerFn_handler",
		importer: () => import("./tasks.functions-5faH8Qm6.mjs")
	},
	"9bde25c7ada0ca6363e6ef7b8359777f9e450afbd65431743d10ecc219a65518": {
		functionName: "startQuest_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"a03b81ebb9860460017f4301a536a581f9a1cb593796f760b3bb87d6b5a61682": {
		functionName: "deleteQuest_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"a19f75bb513a10f83c33b8cc120fca54414d81318ec4991323529a447efefc51": {
		functionName: "completeLockerQuest_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"a2735c244711fe24b40a166a97a29fca8fe98fbe689bcc50a988122ac73b028e": {
		functionName: "adminListClaims_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"a2e1136a7fe9ee33e8a98e0a2dcbe265af076be4942452cf95d74ae82a984037": {
		functionName: "completeShortlinkStep_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"a31872f9e4147316c165a9d9badc989c93ec627768bde954f52825f0bb25cc68": {
		functionName: "openQuestNetwork_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"abc5ff39129e51ce03cb2bab1645d43fbf012e773f1c4f2d9f94546e0a5983d4": {
		functionName: "deleteSdkProvider_createServerFn_handler",
		importer: () => import("./sdk-offerwall.functions-GbXbWS0r.mjs")
	},
	"ac64164f56428bb07c4aaa0bf255d86d17a78fc8b436119856afcd91020e327f": {
		functionName: "getCountryAnalytics_createServerFn_handler",
		importer: () => import("./offers.functions-DaWzb6oC.mjs")
	},
	"adc78d8003df45cd074be3d1720f3b3112c450c3e39d2359e0b0b16bc4e557af": {
		functionName: "submitProofForCampaign_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"aed052e6142a45a8906a8daaef356763a510908b24a11d98391719ef846f7ce6": {
		functionName: "updateQuickReply_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"af5bf14ea3c5519c183a7ad1cba980e33a0d632f9f01e9d6c2aa5b66063b7f1a": {
		functionName: "savePremiumOnboardingStep_createServerFn_handler",
		importer: () => import("./functions-BAlBEQQe.mjs")
	},
	"af6f16c0f33cb0696a7a87808039804596b18d30ad3fd34e91acaa160ed261df": {
		functionName: "automationStats_createServerFn_handler",
		importer: () => import("./automation.functions-DFSGj8Hm.mjs")
	},
	"afb5c7f7c366c0c22447041b9d6ae1da8401bd5f41bd3eb54ac20f0e5c987376": {
		functionName: "updateAdvertiserProfile_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"afb66e9a8ee2fe5cd094eaa68cde8c54a95ef07a12c9ae10792eec1cb6ba6d9a": {
		functionName: "adminDashboard_createServerFn_handler",
		importer: () => import("./offers.functions-DaWzb6oC.mjs")
	},
	"afdd46c7530466a0c353f0987cbdf1db8dc3874d98680aa441278ca95b82d708": {
		functionName: "getAdvertiserReferralStats_createServerFn_handler",
		importer: () => import("./advertiser-referral.server-UP6WaY4H.mjs")
	},
	"afe747b8a5a771bb295ac07d3972faf4ebd06084c027772b3573176a0c608d28": {
		functionName: "getUserDetail_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"b26aa50745b61d721b8b74bdb186ee1b935d33b94926e2a9960892966bfcfb67": {
		functionName: "listCategories_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"b4c716a6b34c857be82c5b7e3bbc35c2b67047e80cca7c677b55fb1fee3c04af": {
		functionName: "submitOfferProof_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"b7f55781ecb2d4e63a4b21861e6203bc42bfee60b7c172c0402607a3d4fba50d": {
		functionName: "getCampaignForEdit_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"b8ea89771a82ddd7394a429936694fda49efbcb4c7350dc96b457ec39bcbd906": {
		functionName: "getMaintenanceStatus_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"bac2e645eb646ba78971372360356d2304e5e68b94daab4514885cec0525b995": {
		functionName: "exportPayoutsCsv_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"bc11cc1e29f12355d4a0e05b13918ee5a48ff51af2fef07f421a9a2c02cb093f": {
		functionName: "savePayoutMethod_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"bc2d8b04c9d6e79234a498017b6fcc3c3e7beeaf90ba2353692547c777a02974": {
		functionName: "createCampaign_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"bcd925c33377882596932acaf4012ad8bca8b802c759d68b35e75c1254303423": {
		functionName: "listSmartBannerSettings_createServerFn_handler",
		importer: () => import("./functions-BmoDkZn9.mjs")
	},
	"bdb5b904982fc7d03a95a7294877adcd44df7c73c7b6ee4a42df2c791de6694a": {
		functionName: "setAdvertiserStatus_createServerFn_handler",
		importer: () => import("./admin-advertisers.server-rLVlYSC2.mjs")
	},
	"bdd8412a518cb4eba332a3fa82e2bbd5f74c9acfbc7a7a972bc5ec56d2b67b0d": {
		functionName: "getNetworkQuestProgress_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"bec3a0b3879f1e1b2d6d399aa4d751a65feb0de2bb943315be8997828a6a5e0e": {
		functionName: "ensureCheckinSession_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"bfd7ffe86bb196c9e468f50b9e23fedb720c942cd6fca5117e1c675f73a61d02": {
		functionName: "removeRole_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"c2511777fe3b0761f08be211dd2f7b07f7c47daaaff3842ab1a37f3eef0a97ed": {
		functionName: "getDashboardRevenuePayout_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"c495b4632acf8119dc10d8b3b99cef7ee8d80f20efb5880df7db4b986e18b2aa": {
		functionName: "adminRefreshFeed_createServerFn_handler",
		importer: () => import("./offers.functions-DaWzb6oC.mjs")
	},
	"c728b0f85b61ceed12decd622d5942f3cd82fdfd3b70357dfbce52c4b1ec2e5f": {
		functionName: "deletePremiumOnboardingStep_createServerFn_handler",
		importer: () => import("./functions-BAlBEQQe.mjs")
	},
	"c91c951ce76c21ec2e6eb2eed9dc27fd83cfcf0ab41c3577a3c3dfbd38a01ef9": {
		functionName: "listAdminTasks_createServerFn_handler",
		importer: () => import("./tasks.functions-5faH8Qm6.mjs")
	},
	"c932e030a490a4df7fe79d171fa31660f55ec5f365794522b8b6eab2a17b8687": {
		functionName: "createWithdrawal_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"ca9c4284fc571e89e956503ff11f192c447eef468ca43107e9cef26ffc86da03": {
		functionName: "listAdvertisers_createServerFn_handler",
		importer: () => import("./admin-advertisers.server-rLVlYSC2.mjs")
	},
	"cef844c72587d57fc888b189b67ddcd835c7cd19ae967982ddf91ed50c8cb904": {
		functionName: "pingActiveTime_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"cfbc4f3091bd2c48ae834b93c7626c67862c9f0600425a38ba94afbd3175fc87": {
		functionName: "listAdminSdkProviders_createServerFn_handler",
		importer: () => import("./sdk-offerwall.functions-GbXbWS0r.mjs")
	},
	"d148dd34ea16cb6c25a5b85dc9a64fe3a27e8a51ac5f5b1d79978ed1e5e07c7e": {
		functionName: "listOfferProviders_createServerFn_handler",
		importer: () => import("./offers.functions-DaWzb6oC.mjs")
	},
	"d660e138cc1fab9a5d286cb11545a9c7eeee3764efbfc6c522f1a4fa5d84f37c": {
		functionName: "checkMaintenanceStatus_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"d7488d8f2d9585235f7e02cd9eb1961bcbc41feddd5632ef47d629dd8452d8ff": {
		functionName: "requestTaskImageUploadUrl_createServerFn_handler",
		importer: () => import("./tasks.functions-5faH8Qm6.mjs")
	},
	"da0a6ff20dcd5dddf23e892fe8b96b3a0b242fe0e3faa3e505fcd7b0e279a3ab": {
		functionName: "processActiveTimePing_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"da7a7c112406ffa7dad29fc3ceb8da908ca78e9f1d5290cf7a7cba1243b16a4f": {
		functionName: "adminListTickets_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"da851d027e9d9d76aa9b2fd9a7cb9d5e28f9c6134bdf28b26397cb4c41206539": {
		functionName: "getTopProofErrors_createServerFn_handler",
		importer: () => import("./analytics.functions-C4SD4PHV.mjs")
	},
	"dad71b67e380175074d9624654f05cbb11d369c8577e2e6a2b2c582f116dd3af": {
		functionName: "listAdminBanners_createServerFn_handler",
		importer: () => import("./functions-BmoDkZn9.mjs")
	},
	"dcf7373c0658abe2988a25d239bc7944cb7c412e0b12701a08df24d92fa1266d": {
		functionName: "getSurveyQuestProgress_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"de9e6765019cc50a35aeb77c2254756190ba5879d0f3e1d592b193deda13adaf": {
		functionName: "updateFeedSettings_createServerFn_handler",
		importer: () => import("./offers.functions-DaWzb6oC.mjs")
	},
	"e022ed18b2ca50ab1a6eb7abc5a10e30fb9057a68ee897b093e93156d73c491f": {
		functionName: "deleteBanner_createServerFn_handler",
		importer: () => import("./functions-BmoDkZn9.mjs")
	},
	"e067f32dfd11bb788f8bddd66ef0591eafba5d6179e65d0a7199ed32a17ad2fc": {
		functionName: "rejectAdjustmentRequest_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"e0c6b3373ff304f8b645c030077250adb17aaa463c0a35f951c248eff12ce954": {
		functionName: "rotateCampaignSecret_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"e13a0617e69af1a7d094a68ecadafaa3ef521b51e81efa71b169be7e00e418ac": {
		functionName: "listPendingProofs_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"e20ba76032641b7fd35d80c663a7a753e56270de4dd1c0a05afc78620a7b0e3d": {
		functionName: "confirmCheckout_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"e234f87cb875bc5a3fc13ed5fa35dd523cfe873d251564970dc93f6d1a6ae497": {
		functionName: "updateMarketplaceSettings_createServerFn_handler",
		importer: () => import("./admin-settings.server-C25xyjOM.mjs")
	},
	"e2a6f803475a534f9babbd306a69a732e4852d5cded559d31c9fab9b02e38b67": {
		functionName: "reportAdWatched_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"e383da82562c26cb29a2ee24a884c3d41100a5fbd1571397ad596a0302416a72": {
		functionName: "saveOnboardingStep_createServerFn_handler",
		importer: () => import("./functions-BAlBEQQe.mjs")
	},
	"e8fd746a783e117d2735202376cba4b14735d9b6765034fc330247df4a9d345c": {
		functionName: "getCampaignResults_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"ec3a363f41fdad120369bb72cbbe8441edbc002fce885e8911424c09165ef6bf": {
		functionName: "getWithdrawalFraudSignals_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"ecfc9be8a178bbd3051df2187dd55031b3f9de3b01120cba5c708c40e41c4bf9": {
		functionName: "completePremiumOnboarding_createServerFn_handler",
		importer: () => import("./functions-BAlBEQQe.mjs")
	},
	"ee21775ccd9c7dba68ac0e1967f05354f9c8557b2cceebf07c58224bf4b6189e": {
		functionName: "getFinancialOverview_createServerFn_handler",
		importer: () => import("./admin-financial.server-79yv5434.mjs")
	},
	"efd6156f0f391c21f248c89e0f2d417f0fd423fa12436f58d3cba7a6f62af638": {
		functionName: "deleteManualOffer_createServerFn_handler",
		importer: () => import("./offers.functions-DaWzb6oC.mjs")
	},
	"f1035bbae52f7fca5385a916bed488fc71d295d58b1768c47f084be7632141a2": {
		functionName: "startLockerQuest_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"f14148b6495619d8b0910c66ac43f421222e168d6c062c64ca9124b5393a07d8": {
		functionName: "getAdvertiserOverview_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"f1979d02e433c0316c3ab77f141bbda44be63e1fae604d1ae4bc285a19a1daa5": {
		functionName: "sendBroadcastNotification_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"f26e349249ab80720c26b8821b87b838031feb2502b3484ba830e8fb84929bdc": {
		functionName: "addCampaignBudget_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"f4b66bfec0c2609294cb252ab3221c14583c2fe7fde6e61e767660124872b28b": {
		functionName: "requestAccountDeletion_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"f591482d446e664b444330d0996206e27a146e2704100ede39945e2e09155f62": {
		functionName: "saveBanner_createServerFn_handler",
		importer: () => import("./functions-BmoDkZn9.mjs")
	},
	"f9ad3890c128f4134e4a0668b7debc65c2082b347475f4806966901a8e60c407": {
		functionName: "getTheoremReachSignedUrl_createServerFn_handler",
		importer: () => import("./sdk-offerwall.functions-GbXbWS0r.mjs")
	},
	"facbb8b312f11359eaeee6faa073c46f1c8b656b24082f024e37e4ccb8e90fd6": {
		functionName: "getToroxClickUrl_createServerFn_handler",
		importer: () => import("./torox.functions-peDxjukW.mjs")
	},
	"fd087eab454d1a70419d9dff8f6cb2a398aafc5701120272724c0b59d62ba6f5": {
		functionName: "updateUserTimezone_createServerFn_handler",
		importer: () => import("./quests.functions-DSdNa8Xg.mjs")
	},
	"fdedc44e313d9482a2a723e1de3b299ad5c73dc0c5be0c938c2a6f6bf04cf404": {
		functionName: "submitProof_createServerFn_handler",
		importer: () => import("./marketplace.functions-DGwiSYTq.mjs")
	},
	"fee09825a3188d8e35ddd5cb58636765d668e7acf6ac8584278fd94abbf41ddd": {
		functionName: "adminUpdateOfferClaim_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	},
	"fefcfd4e8a70d37ac0e158de80e94fa549f634d02f3a28839111921fc497e5f3": {
		functionName: "resetOnboarding_createServerFn_handler",
		importer: () => import("./functions-BAlBEQQe.mjs")
	},
	"ff6bd837e51c0fd4314a7cd7aa557eb421fba73a581fa7bc4425699794c88015": {
		functionName: "adminListWithdrawals_createServerFn_handler",
		importer: () => import("./coinquest.functions-DjTCt4BN.mjs")
	}
};
async function getServerFnById(id, access) {
	const serverFnInfo = manifest[id];
	if (!serverFnInfo) throw new Error("Server function info not found for " + id);
	const fnModule = serverFnInfo.module ??= await serverFnInfo.importer();
	if (!fnModule) throw new Error("Server function module not resolved for " + id);
	const action = fnModule[serverFnInfo.functionName];
	if (!action) throw new Error("Server function module export not resolved for serverFn ID: " + id);
	return action;
}
var TSS_FORMDATA_CONTEXT = "__TSS_CONTEXT";
var TSS_SERVER_FUNCTION = Symbol.for("TSS_SERVER_FUNCTION");
var TSS_SERVER_FUNCTION_FACTORY = Symbol.for("TSS_SERVER_FUNCTION_FACTORY");
var X_TSS_SERIALIZED = "x-tss-serialized";
var X_TSS_RAW_RESPONSE = "x-tss-raw";
/** Content-Type for multiplexed framed responses (RawStream support) */
var TSS_CONTENT_TYPE_FRAMED = "application/x-tss-framed";
/** Largest payload accepted by one framed-protocol record. */
var MAX_FRAME_PAYLOAD_SIZE = 16777216;
/** Largest number of raw streams accepted in one framed response. */
var MAX_FRAMED_STREAMS = 1024;
/** Full Content-Type header value with version parameter */
var TSS_CONTENT_TYPE_FRAMED_VERSIONED = `${TSS_CONTENT_TYPE_FRAMED}; v=1`;
var GLOBAL_STORAGE_KEY = Symbol.for("tanstack-start:start-storage-context");
var globalObj = globalThis;
if (!globalObj[GLOBAL_STORAGE_KEY]) globalObj[GLOBAL_STORAGE_KEY] = new AsyncLocalStorage();
var startStorage = globalObj[GLOBAL_STORAGE_KEY];
async function runWithStartContext(context, fn) {
	return startStorage.run(context, fn);
}
function getStartContext(opts) {
	const context = startStorage.getStore();
	if (!context && opts?.throwIfNotFound !== false) throw new Error(`No Start context found in AsyncLocalStorage. Make sure you are using the function within the server runtime.`);
	return context;
}
var getStartOptions = () => getStartContext().startOptions;
/** Start's serialization adapters followed by `routerPlugins`. */
function getSerovalPlugins(routerPlugins) {
	return [...(getStartOptions()?.serializationAdapters)?.map(makeSerovalPlugin) ?? [], ...routerPlugins];
}
/**
* Binary frame protocol for multiplexing JSON and raw streams over HTTP.
*
* Frame format: [type:1][streamId:4][length:4][payload:length]
* - type: 1 byte - frame type (JSON, CHUNK, END, ERROR)
* - streamId: 4 bytes big-endian uint32 - stream identifier
* - length: 4 bytes big-endian uint32 - payload length
* - payload: variable length bytes
*/
/** Cached TextEncoder for frame encoding */
var textEncoder$1 = new TextEncoder();
/** Shared empty payload for END frames - avoids allocation per call */
var EMPTY_PAYLOAD = /* @__PURE__ */ new Uint8Array(0);
var MAX_ERROR_MESSAGE_CODE_UNITS = 4096;
/**
* Encodes a single frame with header and payload.
*/
function encodeFrame(type, streamId, payload) {
	if (payload.byteLength > 16777216) throw new RangeError(`Frame payload exceeds ${MAX_FRAME_PAYLOAD_SIZE} bytes`);
	const frame = new Uint8Array(9 + payload.length);
	frame[0] = type;
	frame[1] = streamId >>> 24 & 255;
	frame[2] = streamId >>> 16 & 255;
	frame[3] = streamId >>> 8 & 255;
	frame[4] = streamId & 255;
	frame[5] = payload.length >>> 24 & 255;
	frame[6] = payload.length >>> 16 & 255;
	frame[7] = payload.length >>> 8 & 255;
	frame[8] = payload.length & 255;
	frame.set(payload, 9);
	return frame;
}
/** Encodes an error message payload, truncated to a bounded length. */
function encodeErrorPayload(error) {
	const originalMessage = error instanceof Error ? error.message : String(error ?? "Unknown error");
	const message = originalMessage.length > MAX_ERROR_MESSAGE_CODE_UNITS ? `${originalMessage.slice(0, MAX_ERROR_MESSAGE_CODE_UNITS)}…` : originalMessage;
	return textEncoder$1.encode(message);
}
/**
* Creates a multiplexed ReadableStream from serialized response records.
*
* A record's JSON frame is admitted before any raw stream referenced by that
* record starts. Raw streams from admitted records are pumped concurrently.
* The caller bounds the stream count before records reach this function.
*/
function createMultiplexedStream(recordStream, options = {}) {
	let controller;
	let stopped = false;
	let activePumps = 0;
	let wakeDemand;
	let admission;
	const readers = /* @__PURE__ */ new Set();
	const pendingRawStreams = /* @__PURE__ */ new Set();
	const abortOutput = () => errorOutput(options.signal?.reason);
	const wakeAdmission = () => {
		const wake = wakeDemand;
		wakeDemand = void 0;
		wake?.();
	};
	const cancelReader = (reader, reason) => {
		reader.cancel(reason).catch(() => {});
	};
	const cancelStream = (stream, reason) => {
		stream.cancel(reason).catch(() => {});
	};
	const stop = (reason) => {
		if (stopped) return false;
		stopped = [reason];
		options.signal?.removeEventListener("abort", abortOutput);
		wakeAdmission();
		for (const reader of readers) cancelReader(reader, reason);
		for (const stream of pendingRawStreams) cancelStream(stream, reason);
		pendingRawStreams.clear();
		return true;
	};
	const errorOutput = (error) => {
		if (!stop(error)) return;
		try {
			controller.error(error);
		} catch {}
	};
	const waitForDemand = async () => {
		while (!stopped && (controller.desiredSize ?? 0) <= 0) await new Promise((resolve) => {
			wakeDemand = resolve;
		});
		return !stopped;
	};
	const admitFrame = (type, streamId, payload) => {
		if (stopped) return false;
		if (!admission && (controller.desiredSize ?? 0) > 0) {
			controller.enqueue(encodeFrame(type, streamId, payload));
			return true;
		}
		const runAdmission = async () => {
			if (!await waitForDemand()) return false;
			controller.enqueue(encodeFrame(type, streamId, payload));
			return true;
		};
		const result = admission ? admission.then(runAdmission) : runAdmission();
		const clearAdmission = () => {
			if (admission === tail) admission = void 0;
		};
		const tail = result.then(clearAdmission, clearAdmission);
		admission = tail;
		return result;
	};
	const maybeClose = () => {
		if (activePumps !== 0 || !stop()) return;
		try {
			controller.close();
		} catch {}
	};
	const startPump = (pump) => {
		activePumps++;
		pump().then(() => {
			activePumps--;
			maybeClose();
		}, (error) => {
			activePumps--;
			errorOutput(error);
		});
	};
	async function pumpRawStream(streamId, stream) {
		const reader = stream.getReader();
		readers.add(reader);
		try {
			while (!stopped) {
				const { done, value } = await reader.read();
				if (stopped) return;
				if (done) {
					const frameAdmission = admitFrame(2, streamId, EMPTY_PAYLOAD);
					if (frameAdmission !== true) await frameAdmission;
					return;
				}
				if (!(value instanceof Uint8Array)) throw new TypeError("RawStream chunks must be Uint8Array");
				let offset = 0;
				do {
					const frameAdmission = admitFrame(1, streamId, value.byteLength <= 16777216 ? value : value.subarray(offset, offset + MAX_FRAME_PAYLOAD_SIZE));
					if (frameAdmission !== true && (frameAdmission === false || !await frameAdmission)) return;
					offset += MAX_FRAME_PAYLOAD_SIZE;
				} while (offset < value.byteLength);
			}
		} catch (error) {
			if (!stopped) {
				const frameAdmission = admitFrame(3, streamId, encodeErrorPayload(error));
				if (frameAdmission !== true) await frameAdmission;
			}
		} finally {
			readers.delete(reader);
			reader.releaseLock();
		}
	}
	async function pumpRecords() {
		const reader = recordStream.getReader();
		readers.add(reader);
		try {
			while (!stopped) {
				const { done, value } = await reader.read();
				if (stopped) {
					if (!done) for (const registration of value.rawStreams) cancelStream(registration.stream, stopped[0]);
					return;
				}
				if (done) return;
				for (const registration of value.rawStreams) pendingRawStreams.add(registration.stream);
				const frameAdmission = admitFrame(0, 0, value.json);
				if (frameAdmission !== true && (frameAdmission === false || !await frameAdmission)) return;
				for (const registration of value.rawStreams) {
					pendingRawStreams.delete(registration.stream);
					startPump(pumpRawStream.bind(void 0, registration.id, registration.stream));
				}
			}
		} catch (error) {
			if (!stopped) errorOutput(error);
		} finally {
			readers.delete(reader);
			reader.releaseLock();
		}
	}
	return new ReadableStream({
		start(ctrl) {
			controller = ctrl;
			if (options.signal?.aborted) {
				cancelStream(recordStream, options.signal.reason);
				errorOutput(options.signal.reason);
				return;
			}
			options.signal?.addEventListener("abort", abortOutput, { once: true });
			startPump(pumpRecords);
		},
		pull() {
			wakeAdmission();
		},
		cancel(reason) {
			if (stop(reason)) options.onCancel?.(reason);
		}
	});
}
function isSafeKey(key) {
	return key !== "__proto__" && key !== "constructor" && key !== "prototype";
}
/**
* Merge target and source into a new null-proto object, filtering dangerous keys.
*/
function safeObjectMerge(target, source) {
	const result = Object.create(null);
	if (target) {
		for (const key of Object.keys(target)) if (isSafeKey(key)) result[key] = target[key];
	}
	if (source && typeof source === "object") {
		for (const key of Object.keys(source)) if (isSafeKey(key)) result[key] = source[key];
	}
	return result;
}
/**
* Create a null-prototype object, optionally copying from source.
*/
function createNullProtoObject(source) {
	if (!source) return Object.create(null);
	const obj = Object.create(null);
	for (const key of Object.keys(source)) if (isSafeKey(key)) obj[key] = source[key];
	return obj;
}
var getStartContextServerOnly = getStartContext;
var createServerFn = (options, __opts) => {
	const resolvedOptions = __opts || options || {};
	if (typeof resolvedOptions.method === "undefined") resolvedOptions.method = "GET";
	const setValidator = (validator) => {
		return createServerFn(void 0, {
			...resolvedOptions,
			validator,
			inputValidator: validator
		});
	};
	const res = {
		options: resolvedOptions,
		middleware: (middleware) => {
			const newMiddleware = [...resolvedOptions.middleware || []];
			middleware.forEach((item) => {
				if (TSS_SERVER_FUNCTION_FACTORY in item) {
					if (item.options.middleware) newMiddleware.push(...item.options.middleware);
				} else newMiddleware.push(item);
			});
			const res = createServerFn(void 0, {
				...resolvedOptions,
				middleware: newMiddleware
			});
			res[TSS_SERVER_FUNCTION_FACTORY] = true;
			return res;
		},
		validator: setValidator,
		inputValidator: setValidator,
		handler: (...args) => {
			const [extractedFn, serverFn] = args;
			const newOptions = {
				...resolvedOptions,
				extractedFn,
				serverFn
			};
			const resolvedMiddleware = [...newOptions.middleware || [], serverFnBaseToMiddleware(newOptions)];
			extractedFn.method = resolvedOptions.method;
			return Object.assign(async (opts) => {
				const result = await executeMiddleware$1(resolvedMiddleware, "client", {
					...extractedFn,
					...newOptions,
					data: opts?.data,
					headers: opts?.headers,
					signal: opts?.signal,
					fetch: opts?.fetch,
					context: createNullProtoObject()
				});
				const redirect = parseRedirect(result.error);
				if (redirect) throw redirect;
				if (result.error) throw result.error;
				return result.result;
			}, {
				...extractedFn,
				method: resolvedOptions.method,
				__executeServer: async (opts) => {
					const startContext = getStartContextServerOnly();
					const serverContextAfterGlobalMiddlewares = startContext.contextAfterGlobalMiddlewares;
					return await executeMiddleware$1(resolvedMiddleware, "server", {
						...extractedFn,
						data: opts.data,
						method: opts.method ?? resolvedOptions.method,
						serverFnMeta: extractedFn.serverFnMeta,
						context: safeObjectMerge(opts.context, serverContextAfterGlobalMiddlewares),
						request: startContext.request
					}).then((d) => ({
						result: d.result,
						error: d.error,
						context: d.sendContext
					}));
				}
			});
		}
	};
	const fun = (options) => {
		return createServerFn(void 0, {
			...resolvedOptions,
			...options
		});
	};
	return Object.assign(fun, res);
};
async function executeMiddleware$1(middlewares, env, opts) {
	let flattenedMiddlewares = flattenMiddlewares([...getStartOptions()?.functionMiddleware || [], ...middlewares]);
	if (env === "server") {
		const startContext = getStartContextServerOnly({ throwIfNotFound: false });
		if (startContext?.executedRequestMiddlewares) flattenedMiddlewares = flattenedMiddlewares.filter((m) => !startContext.executedRequestMiddlewares.has(m));
	}
	const callNextMiddleware = async (ctx) => {
		const nextMiddleware = flattenedMiddlewares.shift();
		if (!nextMiddleware) return ctx;
		try {
			let validator = "validator" in nextMiddleware.options ? nextMiddleware.options.validator : void 0;
			if (!validator && "inputValidator" in nextMiddleware.options) validator = nextMiddleware.options.inputValidator;
			if (validator && env === "server") ctx.data = await execValidator(validator, ctx.data);
			let middlewareFn = void 0;
			if (env === "client") {
				if ("client" in nextMiddleware.options) middlewareFn = nextMiddleware.options.client;
			} else if ("server" in nextMiddleware.options) middlewareFn = nextMiddleware.options.server;
			if (middlewareFn) {
				const userNext = async (userCtx = {}) => {
					const result = await callNextMiddleware({
						...ctx,
						...userCtx,
						context: safeObjectMerge(ctx.context, userCtx.context),
						sendContext: safeObjectMerge(ctx.sendContext, userCtx.sendContext),
						headers: mergeHeaders(ctx.headers, userCtx.headers),
						_callSiteFetch: ctx._callSiteFetch,
						fetch: ctx._callSiteFetch ?? userCtx.fetch ?? ctx.fetch,
						result: userCtx.result !== void 0 ? userCtx.result : userCtx instanceof Response ? userCtx : ctx.result,
						error: userCtx.error ?? ctx.error
					});
					if (result.error) throw result.error;
					return result;
				};
				const result = await middlewareFn({
					...ctx,
					next: userNext
				});
				if (isRedirect(result)) return {
					...ctx,
					error: result
				};
				if (result instanceof Response) return {
					...ctx,
					result
				};
				if (!result) throw new Error("User middleware returned undefined. You must call next() or return a result in your middlewares.");
				return result;
			}
			return callNextMiddleware(ctx);
		} catch (error) {
			return {
				...ctx,
				error
			};
		}
	};
	return callNextMiddleware({
		...opts,
		headers: opts.headers || {},
		sendContext: opts.sendContext || {},
		context: opts.context || createNullProtoObject(),
		_callSiteFetch: opts.fetch
	});
}
function flattenMiddlewares(middlewares, maxDepth = 100) {
	const seen = /* @__PURE__ */ new Set();
	const flattened = [];
	const recurse = (middleware, depth) => {
		if (depth > maxDepth) throw new Error(`Middleware nesting depth exceeded maximum of ${maxDepth}. Check for circular references.`);
		middleware.forEach((m) => {
			if (m.options.middleware) recurse(m.options.middleware, depth + 1);
			if (!seen.has(m)) {
				seen.add(m);
				flattened.push(m);
			}
		});
	};
	recurse(middlewares, 0);
	return flattened;
}
async function execValidator(validator, input) {
	if (validator == null) return {};
	if ("~standard" in validator) {
		const result = await validator["~standard"].validate(input);
		if (result.issues) throw new Error(JSON.stringify(result.issues, void 0, 2));
		return result.value;
	}
	if ("parse" in validator) return validator.parse(input);
	if (typeof validator === "function") return validator(input);
	throw new Error("Invalid validator type!");
}
function serverFnBaseToMiddleware(options) {
	return {
		"~types": void 0,
		options: {
			inputValidator: options.validator ?? options.inputValidator,
			client: async ({ next, sendContext, fetch, ...ctx }) => {
				const payload = {
					...ctx,
					context: sendContext,
					fetch
				};
				return next(await options.extractedFn?.(payload));
			},
			server: async ({ next, ...ctx }) => {
				const result = await options.serverFn?.(ctx);
				return next({
					...ctx,
					result
				});
			}
		}
	};
}
var innerCreateCsrfMiddleware = (opts = {}) => {
	return createMiddleware().server(async (ctx) => {
		const csrfCtx = ctx;
		if (opts.filter && !await opts.filter(csrfCtx)) return ctx.next();
		if (await isCsrfRequestAllowed(opts, csrfCtx)) return ctx.next();
		return getFailureResponse(opts, csrfCtx);
	});
};
var createCsrfMiddleware = innerCreateCsrfMiddleware;
async function isCsrfRequestAllowed(opts, ctx) {
	const result = await getCsrfRequestValidationResult(opts, ctx);
	return result === true || result === void 0 && opts.allowRequestsWithoutOriginCheck === true;
}
async function getCsrfRequestValidationResult(opts, ctx) {
	const fetchSite = ctx.request.headers.get("Sec-Fetch-Site");
	if (fetchSite !== null) return matchValue(opts.secFetchSite ?? "same-origin", fetchSite, ctx);
	const origin = ctx.request.headers.get("Origin");
	if (origin !== null) {
		if (opts.origin) return matchValue(opts.origin, origin, ctx);
		return origin === new URL(ctx.request.url).origin;
	}
	const referer = ctx.request.headers.get("Referer");
	if (referer === null || opts.referer === false) return;
	if (typeof opts.referer === "function") return opts.referer(referer, ctx);
	if (opts.origin) {
		const refererOrigin = getOriginFromUrl(referer);
		return refererOrigin !== void 0 && matchValue(opts.origin, refererOrigin, ctx);
	}
	return isRefererSameOrigin(referer, new URL(ctx.request.url).origin);
}
async function matchValue(matcher, value, ctx) {
	if (typeof matcher === "function") return matcher(value, ctx);
	if (Array.isArray(matcher)) return matcher.includes(value);
	return value === matcher;
}
function getOriginFromUrl(url) {
	try {
		return new URL(url).origin;
	} catch {
		return;
	}
}
function isRefererSameOrigin(referer, requestOrigin) {
	if (referer === requestOrigin) return true;
	if (!referer.startsWith(requestOrigin)) return false;
	if (referer.length === requestOrigin.length) return true;
	const code = referer.charCodeAt(requestOrigin.length);
	return code === 47 || code === 63 || code === 35;
}
async function getFailureResponse(opts, ctx) {
	if (typeof opts.failureResponse === "function") return opts.failureResponse(ctx);
	return opts.failureResponse?.clone() ?? new Response("Forbidden", { status: 403 });
}
var serovalPlugins = void 0;
var FORM_DATA_CONTENT_TYPES = ["multipart/form-data", "application/x-www-form-urlencoded"];
var MAX_PAYLOAD_SIZE = 1e6;
var MAX_PENDING_SERIALIZATION_RECORDS = 1024;
var MAX_PENDING_SERIALIZATION_BYTES = 33554432;
var textEncoder = new TextEncoder();
function encodeSerializationRecord(value) {
	return textEncoder.encode(JSON.stringify(value));
}
function exceedsPendingSerializationLimit(record, recordCount, pendingBytes) {
	return recordCount >= MAX_PENDING_SERIALIZATION_RECORDS || pendingBytes + record.byteLength > MAX_PENDING_SERIALIZATION_BYTES;
}
function runSerializationCleanup(dispose) {
	try {
		dispose();
	} catch {}
}
function cancelRawStream(stream, reason) {
	stream.cancel(reason).catch(() => {});
}
var handleServerAction = async ({ request, context, serverFnId }) => {
	const methodUpper = request.method.toUpperCase();
	const url = new URL(request.url);
	const action = await getServerFnById(serverFnId, { origin: "client" });
	if (action.method && methodUpper !== action.method) return new Response(`expected ${action.method} method. Got ${methodUpper}`, {
		status: 405,
		headers: { Allow: action.method }
	});
	const isServerFn = request.headers.get("x-tsr-serverFn") === "true";
	serovalPlugins ??= getSerovalPlugins(defaultSerovalDeserializerPlugins);
	const contentType = request.headers.get("Content-Type");
	try {
		let res;
		if (FORM_DATA_CONTENT_TYPES.some((type) => contentType && contentType.includes(type))) {
			if (methodUpper === "GET") invariant();
			const formData = await request.formData();
			const serializedContext = formData.get(TSS_FORMDATA_CONTEXT);
			formData.delete(TSS_FORMDATA_CONTEXT);
			const params = {
				context,
				data: formData,
				method: methodUpper
			};
			if (typeof serializedContext === "string") try {
				const deserializedContext = fromJSON(JSON.parse(serializedContext), { plugins: serovalPlugins });
				if (typeof deserializedContext === "object" && deserializedContext) params.context = safeObjectMerge(deserializedContext, context);
			} catch (e) {}
			res = await action(params);
		} else if (methodUpper === "GET") {
			const payloadParam = url.searchParams.get("payload");
			if (payloadParam && payloadParam.length > MAX_PAYLOAD_SIZE) throw new Error("Payload too large");
			const payload = payloadParam ? fromJSON(JSON.parse(payloadParam), { plugins: serovalPlugins }) : void 0;
			res = await action({
				data: payload?.data,
				context: safeObjectMerge(payload?.context, context),
				method: methodUpper
			});
		} else {
			const payload = contentType?.includes("application/json") ? fromJSON(await request.json(), { plugins: serovalPlugins }) : void 0;
			res = await action({
				data: payload?.data,
				context: safeObjectMerge(payload?.context, context),
				method: methodUpper
			});
		}
		const unwrapped = res.error !== void 0 ? res.error : res.result;
		if (isNotFound(res)) res = isNotFoundResponse(res);
		if (!isServerFn && (unwrapped instanceof Response || unwrapped === null || typeof unwrapped !== "object")) return unwrapped;
		if (unwrapped instanceof Response) {
			if (isRedirect(unwrapped)) return unwrapped;
			unwrapped.headers.set(X_TSS_RAW_RESPONSE, "true");
			return unwrapped;
		}
		return serializeResult(res, request.signal, serovalPlugins);
	} catch (error) {
		if (error instanceof Response) return error;
		if (isNotFound(error)) return isNotFoundResponse(error);
		console.error("Server Fn Error!", error);
		const serializedError = JSON.stringify(await toCrossJSONAsync(error, {
			refs: /* @__PURE__ */ new Map(),
			plugins: serovalPlugins
		}));
		const response = getResponse();
		const headers = {
			"Content-Type": "application/json",
			[X_TSS_SERIALIZED]: "true"
		};
		try {
			return new Response(serializedError, {
				status: response.status ?? 500,
				statusText: response.statusText,
				headers
			});
		} catch {
			return new Response(serializedError, {
				status: 500,
				statusText: "",
				headers
			});
		}
	}
};
/**
* Serializes a server-function result. A result that Seroval completes
* synchronously without RawStreams becomes plain JSON; everything else is a
* framed response whose records and raw streams are multiplexed in order.
*/
function serializeResult(res, signal, plugins) {
	const alsResponse = getResponse();
	const initialRecords = [];
	let initialBytes = 0;
	const pendingRawStreams = [];
	let done = false;
	let initialParsed = false;
	let serializationFailure;
	let disposeSerialization;
	let onParse = (value, initial) => {
		if (serializationFailure) return;
		initialParsed ||= initial;
		const record = encodeSerializationRecord(value);
		if (exceedsPendingSerializationLimit(record, initialRecords.length, initialBytes)) {
			serializationFailure = [/* @__PURE__ */ new Error("Server function serialization exceeded its pending output limit")];
			return;
		}
		initialRecords.push(record);
		initialBytes += record.byteLength;
	};
	let onDone = () => {
		if (initialParsed) done = true;
	};
	let onError = (error) => {
		serializationFailure ??= [error];
	};
	const rawStreamPlugin = createRawStreamRPCPlugin((id, stream) => {
		if (serializationFailure) {
			cancelRawStream(stream, serializationFailure[0]);
			return;
		}
		if (id > 1024) {
			const error = /* @__PURE__ */ new Error(`Too many raw streams in framed response (max ${MAX_FRAMED_STREAMS})`);
			cancelRawStream(stream, error);
			onError(error);
			return;
		}
		pendingRawStreams.push({
			id,
			stream
		});
	});
	const dispose = toCrossJSONStream(res, {
		refs: /* @__PURE__ */ new Map(),
		plugins: [rawStreamPlugin, ...plugins],
		onParse(value, initial) {
			onParse(value, initial);
		},
		onDone() {
			onDone();
		},
		onError: (error) => {
			onError(error);
		}
	});
	if (serializationFailure) {
		runSerializationCleanup(dispose);
		for (const registration of pendingRawStreams) cancelRawStream(registration.stream, serializationFailure[0]);
		throw serializationFailure[0];
	}
	if (!done) disposeSerialization = dispose;
	if (done && pendingRawStreams.length === 0 && initialRecords.length === 1) return new Response(initialRecords[0], {
		status: alsResponse.status,
		statusText: alsResponse.statusText,
		headers: {
			"Content-Type": "application/json",
			[X_TSS_SERIALIZED]: "true"
		}
	});
	if (done && initialRecords.length === 1) {
		const json = initialRecords[0];
		if (json.byteLength > 16777216) {
			const error = /* @__PURE__ */ new Error("Server function serialization exceeded its pending output limit");
			for (const registration of pendingRawStreams) cancelRawStream(registration.stream, error);
			throw error;
		}
		const rawStreams = pendingRawStreams.splice(0);
		initialRecords.length = 0;
		return createFramedResponse(new ReadableStream({
			start(controller) {
				controller.enqueue({
					json,
					rawStreams
				});
				controller.close();
			},
			cancel(reason) {
				for (const registration of rawStreams) cancelRawStream(registration.stream, reason);
			}
		}), { signal });
	}
	const { readable, writable } = new TransformStream();
	const writer = writable.getWriter();
	const recordAbortController = new AbortController();
	let pendingBytes = 0;
	const pendingRecords = /* @__PURE__ */ new Set();
	const abortRecordStream = (error) => {
		if (serializationFailure) return;
		serializationFailure = [error];
		const disposeCurrentSerialization = disposeSerialization;
		disposeSerialization = void 0;
		for (const registration of pendingRawStreams.splice(0)) cancelRawStream(registration.stream, error);
		for (const record of pendingRecords) for (const registration of record.rawStreams) cancelRawStream(registration.stream, error);
		pendingRecords.clear();
		recordAbortController.abort(error);
		writer.abort(error).catch(() => {});
		if (disposeCurrentSerialization) runSerializationCleanup(disposeCurrentSerialization);
	};
	const writeRecord = (json, rawStreams) => {
		if (serializationFailure) {
			for (const registration of rawStreams) cancelRawStream(registration.stream, serializationFailure[0]);
			return false;
		}
		if (json.byteLength > 16777216 || exceedsPendingSerializationLimit(json, pendingRecords.size, pendingBytes)) {
			const error = /* @__PURE__ */ new Error("Server function serialization exceeded its pending output limit");
			for (const registration of rawStreams) cancelRawStream(registration.stream, error);
			onError(error);
			return false;
		}
		pendingBytes += json.byteLength;
		const record = {
			json,
			rawStreams
		};
		pendingRecords.add(record);
		writer.write(record).then(() => {
			pendingRecords.delete(record);
			pendingBytes -= json.byteLength;
		}, (error) => {
			const stillOwned = pendingRecords.delete(record);
			pendingBytes -= json.byteLength;
			if (stillOwned) for (const registration of rawStreams) cancelRawStream(registration.stream, error);
		});
		return true;
	};
	onParse = (value) => {
		if (serializationFailure) return;
		writeRecord(encodeSerializationRecord(value), pendingRawStreams.splice(0));
	};
	onDone = () => {
		if (serializationFailure) return;
		disposeSerialization = void 0;
		writer.close().catch(() => {});
	};
	onError = (error) => {
		abortRecordStream(error);
	};
	const initialRawStreams = pendingRawStreams.splice(0);
	for (let index = 0; index < initialRecords.length; index++) {
		const isLast = index === initialRecords.length - 1;
		if (!writeRecord(initialRecords[index], isLast ? initialRawStreams : [])) {
			if (!isLast) for (const registration of initialRawStreams) cancelRawStream(registration.stream, serializationFailure[0]);
			initialRecords.length = 0;
			throw serializationFailure[0];
		}
	}
	initialRecords.length = 0;
	if (done) onDone();
	writer.closed.catch((error) => {
		abortRecordStream(error);
	});
	return createFramedResponse(readable, {
		signal: AbortSignal.any([recordAbortController.signal, signal]),
		onCancel: abortRecordStream
	});
	function createFramedResponse(records, options) {
		const multiplexedStream = createMultiplexedStream(records, options);
		try {
			return new Response(multiplexedStream, {
				status: alsResponse.status,
				statusText: alsResponse.statusText,
				headers: {
					"Content-Type": TSS_CONTENT_TYPE_FRAMED_VERSIONED,
					[X_TSS_SERIALIZED]: "true"
				}
			});
		} catch (error) {
			cancelRawStream(multiplexedStream, error);
			throw error;
		}
	}
}
function isNotFoundResponse(error) {
	const { headers, ...rest } = error;
	const response = new Response(JSON.stringify(rest), {
		status: 404,
		headers
	});
	response.headers.set("Content-Type", "application/json");
	return response;
}
var LINK_PARAM_TOKEN_RE = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
var PRELOAD_AS_VALUES = /* @__PURE__ */ new Set([
	"fetch",
	"font",
	"image",
	"script",
	"style",
	"track"
]);
function buildLinkParam(name, value) {
	if (value === void 0) return name;
	if (LINK_PARAM_TOKEN_RE.test(value)) return `${name}=${value}`;
	return `${name}=${JSON.stringify(value)}`;
}
function serializeEarlyHint(hint) {
	const parts = [`<${hint.href}>`, buildLinkParam("rel", hint.rel)];
	if (hint.as) parts.push(buildLinkParam("as", hint.as));
	if (hint.crossOrigin !== void 0) parts.push(buildLinkParam("crossorigin", hint.crossOrigin || void 0));
	if (hint.type) parts.push(buildLinkParam("type", hint.type));
	if (hint.integrity) parts.push(buildLinkParam("integrity", hint.integrity));
	if (hint.referrerPolicy) parts.push(buildLinkParam("referrerpolicy", hint.referrerPolicy));
	if (hint.fetchPriority) parts.push(buildLinkParam("fetchpriority", hint.fetchPriority));
	return parts.join("; ");
}
function getStringAttr(attrs, name, fallbackName) {
	const value = attrs?.[name] ?? (fallbackName ? attrs?.[fallbackName] : void 0);
	return typeof value === "string" ? value : void 0;
}
function getPreloadAs(attrs) {
	const as = getStringAttr(attrs, "as");
	return as && PRELOAD_AS_VALUES.has(as) ? as : void 0;
}
function addEarlyHintFetchAttrs(hint, attrs) {
	const crossOrigin = getStringAttr(attrs, "crossOrigin", "crossorigin");
	const type = getStringAttr(attrs, "type");
	const integrity = getStringAttr(attrs, "integrity");
	const referrerPolicy = getStringAttr(attrs, "referrerPolicy", "referrerpolicy");
	const fetchPriority = getStringAttr(attrs, "fetchPriority", "fetchpriority");
	if (crossOrigin !== void 0) hint.crossOrigin = crossOrigin;
	if (type) hint.type = type;
	if (integrity) hint.integrity = integrity;
	if (referrerPolicy) hint.referrerPolicy = referrerPolicy;
	if (fetchPriority) hint.fetchPriority = fetchPriority;
}
function linkAttrsToEarlyHint(attrs) {
	const href = getStringAttr(attrs, "href");
	const rel = getStringAttr(attrs, "rel");
	if (!href || !rel) return void 0;
	const relTokens = rel.split(/\s+/);
	let hintRel;
	let hintAs;
	if (relTokens.includes("modulepreload")) {
		hintRel = "modulepreload";
		hintAs = "script";
	} else if (relTokens.includes("stylesheet")) {
		hintRel = "preload";
		hintAs = "style";
	} else if (relTokens.includes("preload")) {
		hintAs = getPreloadAs(attrs);
		if (!hintAs) return void 0;
		hintRel = "preload";
	} else if (relTokens.includes("preconnect")) {
		hintRel = "preconnect";
		hintAs = void 0;
	} else if (relTokens.includes("dns-prefetch")) {
		hintRel = "dns-prefetch";
		hintAs = void 0;
	}
	if (!hintRel) return void 0;
	const hint = {
		href,
		rel: hintRel
	};
	if (hintAs) hint.as = hintAs;
	addEarlyHintFetchAttrs(hint, attrs);
	return hint;
}
function collectStaticHintsFromManifest(manifest, matchedRoutes) {
	const hints = [];
	for (const route of matchedRoutes) {
		const routeManifest = manifest.routes[route.id];
		if (!routeManifest) continue;
		for (const link of routeManifest.preloads ?? []) {
			const attrs = getScriptPreloadAttrs(manifest, link);
			const hint = {
				href: attrs.href,
				rel: attrs.rel,
				as: "script"
			};
			if (attrs.crossOrigin !== void 0) hint.crossOrigin = attrs.crossOrigin;
			hints.push(hint);
		}
		for (const link of routeManifest.css ?? []) {
			const stylesheetHref = getStylesheetHref(link);
			if (manifest.inlineCss?.styles[stylesheetHref] !== void 0) continue;
			const resolvedLink = resolveManifestCssLink(link);
			const hint = {
				href: stylesheetHref,
				rel: "preload",
				as: "style"
			};
			if (resolvedLink.crossOrigin !== void 0) hint.crossOrigin = resolvedLink.crossOrigin;
			hints.push(hint);
		}
	}
	return hints;
}
function collectDynamicHintsFromMatches(matches) {
	const hints = [];
	for (const match of matches) {
		const links = match.links;
		if (!Array.isArray(links)) continue;
		for (const link of links) {
			const hint = linkAttrsToEarlyHint(link);
			if (hint) hints.push(hint);
		}
	}
	return hints;
}
function createEarlyHintsEvent(opts) {
	const nextHints = [];
	const nextLinks = [];
	for (const hint of opts.hints) {
		const link = serializeEarlyHint(hint);
		if (opts.sentLinks.has(link)) continue;
		opts.sentLinks.add(link);
		opts.sentHints.push(hint);
		nextHints.push(hint);
		nextLinks.push(link);
	}
	if (!nextHints.length && opts.phase !== "dynamic") return void 0;
	return {
		phase: opts.phase,
		hints: nextHints,
		links: nextLinks,
		allHints: opts.sentHints.slice(),
		allLinks: Array.from(opts.sentLinks)
	};
}
function createResponseLinkHeaderEntries(opts) {
	for (const hint of opts.hints) {
		const link = serializeEarlyHint(hint);
		if (opts.sentLinks.has(link)) continue;
		opts.sentLinks.add(link);
		opts.entries.push({
			phase: opts.phase,
			hint,
			link
		});
	}
}
function getResponseLinkHeaderEntries(opts) {
	if (!opts.filter) return opts.entries.map((entry) => entry.link);
	try {
		const links = [];
		for (const entry of opts.entries) if (opts.filter(entry)) links.push(entry.link);
		return links;
	} catch (err) {
		console.error("Error filtering response Link headers:", err);
		return [];
	}
}
function notifyEarlyHints(phase, event, onEarlyHints) {
	try {
		const result = onEarlyHints(event);
		if (result) Promise.resolve(result).catch((err) => {
			console.error(`Error sending ${phase} early hints:`, err);
		});
	} catch (err) {
		console.error(`Error sending ${phase} early hints:`, err);
	}
}
function getResponseLinkHeaderFilter(responseLinkHeader) {
	if (typeof responseLinkHeader !== "object") return;
	return responseLinkHeader.filter;
}
function appendResponseLinkHeaders(opts) {
	for (const link of getResponseLinkHeaderEntries(opts)) opts.responseHeaders.append("Link", link);
}
function collectResponseLinkHeaderEntries(opts) {
	for (let index = 0; index < opts.event.hints.length; index++) opts.entries.push({
		phase: opts.phase,
		hint: opts.event.hints[index],
		link: opts.event.links[index]
	});
}
function collectEarlyHintsPhase(opts) {
	const event = opts.onEarlyHints ? createEarlyHintsEvent({
		phase: opts.phase,
		hints: opts.hints,
		sentLinks: opts.sentLinks,
		sentHints: opts.sentHints
	}) : void 0;
	if (event) notifyEarlyHints(opts.phase, event, opts.onEarlyHints);
	if (!opts.responseLinkHeaderEntries) return;
	if (event) {
		collectResponseLinkHeaderEntries({
			phase: opts.phase,
			event,
			entries: opts.responseLinkHeaderEntries
		});
		return;
	}
	createResponseLinkHeaderEntries({
		phase: opts.phase,
		hints: opts.hints,
		sentLinks: opts.sentLinks,
		entries: opts.responseLinkHeaderEntries
	});
}
function createEarlyHintsCollector(opts) {
	if (!opts?.onEarlyHints && !opts?.responseLinkHeader) return;
	const sentLinks = /* @__PURE__ */ new Set();
	const sentHints = opts.onEarlyHints ? new Array() : void 0;
	const responseLinkHeaderEntries = opts.responseLinkHeader ? new Array() : void 0;
	const responseLinkHeaderFilter = getResponseLinkHeaderFilter(opts.responseLinkHeader);
	return {
		collectStatic: ({ manifest, matchedRoutes }) => {
			if (!matchedRoutes?.length) return;
			collectEarlyHintsPhase({
				phase: "static",
				hints: collectStaticHintsFromManifest(manifest, matchedRoutes),
				sentLinks,
				sentHints,
				onEarlyHints: opts.onEarlyHints,
				responseLinkHeaderEntries
			});
		},
		collectDynamic: (matches) => {
			collectEarlyHintsPhase({
				phase: "dynamic",
				hints: collectDynamicHintsFromMatches(matches),
				sentLinks,
				sentHints,
				onEarlyHints: opts.onEarlyHints,
				responseLinkHeaderEntries
			});
		},
		appendResponseHeaders: (headers) => {
			if (!responseLinkHeaderEntries?.length) return;
			appendResponseLinkHeaders({
				responseHeaders: headers,
				entries: responseLinkHeaderEntries,
				filter: responseLinkHeaderFilter
			});
		}
	};
}
function normalizeTransformAssetResult(result) {
	if (typeof result === "string") return { href: result };
	return result;
}
function escapeCssString(value) {
	return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\a ").replace(/\r/g, "\\d ").replace(/\f/g, "\\c ");
}
async function transformInlineCssTemplate(options) {
	const { strings, urls } = options.template;
	if (strings.length !== urls.length + 1) throw new Error(`TanStack Start inlineCss template for ${options.stylesheetHref} is invalid`);
	let css = strings[0];
	for (let index = 0; index < urls.length; index++) {
		const transformed = normalizeTransformAssetResult(await options.transformFn({
			kind: "css-url",
			url: urls[index],
			stylesheetHref: options.stylesheetHref
		}));
		css += escapeCssString(transformed.href) + strings[index + 1];
	}
	return css;
}
async function transformInlineCssStyles(inlineCss, transformFn) {
	const transformedStyles = {};
	const transformedEntries = await Promise.all(Object.entries(inlineCss.styles).map(async ([stylesheetHref, css]) => {
		const template = inlineCss.templates?.[stylesheetHref];
		return [stylesheetHref, template ? await transformInlineCssTemplate({
			stylesheetHref,
			template,
			transformFn
		}) : css];
	}));
	for (const [stylesheetHref, css] of transformedEntries) transformedStyles[stylesheetHref] = css;
	return {
		styles: transformedStyles,
		...inlineCss.templates ? { templates: inlineCss.templates } : {}
	};
}
function resolveTransformAssetsCrossOrigin(config, kind) {
	if (!config) return void 0;
	if (typeof config === "string") return config;
	return config[kind];
}
function isObjectShorthand(transform) {
	return "prefix" in transform;
}
function resolveTransformAssetsConfig(transform) {
	if (typeof transform === "string") {
		const prefix = transform;
		return {
			type: "transform",
			transformFn: ({ url }) => ({ href: `${prefix}${url}` }),
			cache: true
		};
	}
	if (typeof transform === "function") return {
		type: "transform",
		transformFn: transform,
		cache: true
	};
	if (isObjectShorthand(transform)) {
		const { prefix, crossOrigin } = transform;
		return {
			type: "transform",
			transformFn: ({ url, kind }) => {
				const href = `${prefix}${url}`;
				if (kind === "css-url") return { href };
				const co = resolveTransformAssetsCrossOrigin(crossOrigin, kind);
				return co ? {
					href,
					crossOrigin: co
				} : { href };
			},
			cache: true
		};
	}
	if ("createTransform" in transform && transform.createTransform) return {
		type: "createTransform",
		createTransform: transform.createTransform,
		cache: transform.cache !== false
	};
	return {
		type: "transform",
		transformFn: typeof transform.transform === "string" ? (({ url }) => ({ href: `${transform.transform}${url}` })) : transform.transform,
		cache: transform.cache !== false
	};
}
function assignManifestLink(link, next) {
	if (typeof link === "string") return next.crossOrigin ? next : next.href;
	const nextLink = {
		...link,
		href: next.href
	};
	if (next.crossOrigin) nextLink.crossOrigin = next.crossOrigin;
	else delete nextLink.crossOrigin;
	return nextLink;
}
async function transformManifestAssets(source, transformFn, _opts) {
	const manifest = structuredClone(source);
	const inlineCssEnabled = _opts?.inlineCss !== false;
	const scriptTransforms = /* @__PURE__ */ new Map();
	const transformScript = (url) => {
		const cached = scriptTransforms.get(url);
		if (cached) return cached;
		const transformed = Promise.resolve(transformFn({
			url,
			kind: "script"
		})).then(normalizeTransformAssetResult);
		scriptTransforms.set(url, transformed);
		return transformed;
	};
	if (!inlineCssEnabled) delete manifest.inlineCss;
	else if (manifest.inlineCss) manifest.inlineCss = await transformInlineCssStyles(manifest.inlineCss, transformFn);
	for (const route of Object.values(manifest.routes)) {
		if (route.preloads?.length) route.preloads = await Promise.all(route.preloads.map(async (link) => {
			const result = await transformScript(resolveManifestAssetLink(link).href);
			return assignManifestLink(link, {
				href: result.href,
				crossOrigin: result.crossOrigin
			});
		}));
		if (route.css?.length && !manifest.inlineCss) route.css = await Promise.all(route.css.map(async (link) => {
			const result = normalizeTransformAssetResult(await transformFn({
				url: resolveManifestCssLink(link).href,
				kind: "stylesheet"
			}));
			return assignManifestLink(link, {
				href: result.href,
				crossOrigin: result.crossOrigin
			});
		}));
		if (route.scripts?.length) for (const script of route.scripts) {
			const src = script.attrs?.src;
			if (typeof src !== "string") continue;
			const result = await transformScript(src);
			script.attrs = {
				...script.attrs,
				src: result.href
			};
			if (result.crossOrigin) script.attrs.crossOrigin = result.crossOrigin;
			else delete script.attrs.crossOrigin;
		}
	}
	return manifest;
}
/**
* Builds a final ServerManifest without URL transforms. Used when no
* transformAssets option is provided.
*
* Returns a new manifest object so the cached base manifest is never mutated.
*/
function buildManifest(source, opts) {
	return {
		...source.scriptFormat ? { scriptFormat: source.scriptFormat } : {},
		...opts?.inlineCss !== false && source.inlineCss ? { inlineCss: structuredClone(source.inlineCss) } : {},
		routes: { ...source.routes }
	};
}
function getStaticHandlerInlineCssDefault(handlerInlineCss) {
	if (typeof handlerInlineCss === "function") return;
	return handlerInlineCss ?? true;
}
async function resolveInlineCssForRequest(opts) {
	if (opts.requestInlineCss !== void 0) return opts.requestInlineCss;
	if (typeof opts.handlerInlineCss === "function") return await opts.handlerInlineCss({ request: opts.request });
	return opts.handlerInlineCss ?? true;
}
function createCachedBaseManifestLoader(loadBaseManifest) {
	let baseManifestPromise;
	return () => {
		if (!baseManifestPromise) baseManifestPromise = loadBaseManifest().catch((error) => {
			baseManifestPromise = void 0;
			throw error;
		});
		return baseManifestPromise;
	};
}
function createFinalManifestTransformResolver(transformAssets, opts) {
	const transformConfig = transformAssets !== void 0 ? resolveTransformAssetsConfig(transformAssets) : void 0;
	const cache = transformConfig ? transformConfig.cache : true;
	const warmup = !!transformAssets && typeof transformAssets === "object" && "warmup" in transformAssets && transformAssets.warmup === true;
	let cachedCreateTransformPromise;
	const clearCachedCreateTransform = () => {
		cachedCreateTransformPromise = void 0;
	};
	return {
		cache,
		warmup,
		clearCachedCreateTransform,
		getTransformFn: async (ctx) => {
			if (!transformConfig) return void 0;
			if (transformConfig.type !== "createTransform") return transformConfig.transformFn;
			if (!cache || !opts.cacheCreateTransform) return transformConfig.createTransform(ctx);
			if (!cachedCreateTransformPromise) cachedCreateTransformPromise = Promise.resolve(transformConfig.createTransform(ctx)).catch((error) => {
				clearCachedCreateTransform();
				throw error;
			});
			return cachedCreateTransformPromise;
		}
	};
}
function createFinalManifestResolver(opts) {
	const finalManifestCache = /* @__PURE__ */ new Map();
	const transformResolver = createFinalManifestTransformResolver(opts.transformAssets, { cacheCreateTransform: opts.cacheCreateTransform });
	const handlerDefaultInlineCss = getStaticHandlerInlineCssDefault(opts.inlineCss);
	const getRequestManifestOptions = async (requestOpts) => {
		const transformFn = await transformResolver.getTransformFn({
			warmup: false,
			request: requestOpts.request
		});
		const inlineCss = await resolveInlineCssForRequest({
			request: requestOpts.request,
			handlerInlineCss: opts.inlineCss,
			requestInlineCss: requestOpts.requestInlineCss
		});
		return {
			getBaseManifest: requestOpts.getBaseManifest,
			transformFn,
			cache: transformResolver.cache,
			inlineCss
		};
	};
	const resolveRequest = async (requestOpts, cache) => {
		return resolveFinalManifest({
			...await getRequestManifestOptions(requestOpts),
			finalManifestCache: cache
		});
	};
	return {
		warmup: ({ getBaseManifest }) => warmupFinalManifest({
			enabled: transformResolver.warmup,
			handlerDefaultInlineCss,
			cache: transformResolver.cache,
			finalManifestCache,
			getBaseManifest,
			getTransformFn: () => transformResolver.getTransformFn({ warmup: true }),
			onError: transformResolver.clearCachedCreateTransform
		}),
		resolveCached: (requestOpts) => resolveRequest(requestOpts, finalManifestCache),
		resolveUncached: (requestOpts) => resolveRequest(requestOpts, void 0)
	};
}
function getFinalManifestCacheKey(inlineCss) {
	return inlineCss ? "inline-css" : "linked-css";
}
function cacheFinalManifestPromise(cachedFinalManifestPromises, cacheKey, promise) {
	const cachedFinalManifestPromise = promise.catch((error) => {
		if (cachedFinalManifestPromises.get(cacheKey) === cachedFinalManifestPromise) cachedFinalManifestPromises.delete(cacheKey);
		throw error;
	});
	cachedFinalManifestPromises.set(cacheKey, cachedFinalManifestPromise);
	return cachedFinalManifestPromise;
}
function getOrCreateCachedFinalManifestPromise(cachedFinalManifestPromises, cacheKey, computeFinalManifest) {
	const cachedFinalManifestPromise = cachedFinalManifestPromises.get(cacheKey);
	if (cachedFinalManifestPromise) return cachedFinalManifestPromise;
	return cacheFinalManifestPromise(cachedFinalManifestPromises, cacheKey, Promise.resolve().then(computeFinalManifest));
}
async function buildFinalManifest(opts) {
	return opts.transformFn ? await transformManifestAssets(opts.base, opts.transformFn, { inlineCss: opts.inlineCss }) : buildManifest(opts.base, { inlineCss: opts.inlineCss });
}
async function resolveFinalManifest(opts) {
	const computeFinalManifest = async () => {
		return buildFinalManifest({
			base: await opts.getBaseManifest(),
			transformFn: opts.transformFn,
			inlineCss: opts.inlineCss
		});
	};
	if (opts.finalManifestCache && (!opts.transformFn || opts.cache)) return getOrCreateCachedFinalManifestPromise(opts.finalManifestCache, getFinalManifestCacheKey(opts.inlineCss), computeFinalManifest);
	return computeFinalManifest();
}
function warmupFinalManifest(opts) {
	if (!opts.enabled || opts.handlerDefaultInlineCss === void 0 || !opts.cache) return;
	const inlineCss = opts.handlerDefaultInlineCss;
	const warmupPromise = getOrCreateCachedFinalManifestPromise(opts.finalManifestCache, getFinalManifestCacheKey(inlineCss), async () => {
		const [base, transformFn] = await Promise.all([opts.getBaseManifest(), opts.getTransformFn()]);
		return buildFinalManifest({
			base,
			transformFn,
			inlineCss
		});
	});
	if (opts.onError) warmupPromise.catch(opts.onError);
	return warmupPromise;
}
var ServerFunctionSerializationAdapter = createSerializationAdapter({
	key: "$TSS/serverfn",
	test: (v) => {
		if (typeof v !== "function") return false;
		if (!(TSS_SERVER_FUNCTION in v)) return false;
		return !!v[TSS_SERVER_FUNCTION];
	},
	toSerializable: ({ serverFnMeta }) => ({ functionId: serverFnMeta.id }),
	fromSerializable: ({ functionId }) => {
		const fn = async (opts, signal) => {
			const serverFn = await getServerFnById(functionId, { origin: "client" });
			const result = await serverFn({
				data: opts?.data,
				context: opts?.context,
				method: serverFn.method ?? "GET"
			}, signal);
			if (result.error !== void 0) throw result.error;
			return result.result;
		};
		return fn;
	}
});
function getStartResponseHeaders(opts) {
	return mergeHeaders({ "Content-Type": "text/html; charset=utf-8" }, ..._getRenderedMatches(opts.router.stores.matches.get()).map((match) => {
		return match.headers;
	}));
}
var entriesPromise;
var defaultCsrfMiddleware = createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" });
var getCachedBaseManifest = createCachedBaseManifestLoader(() => getStartManifest());
var getProdBaseManifest = () => getCachedBaseManifest();
var getBaseManifest = getProdBaseManifest;
var createEarlyHintsForRequest = createEarlyHintsCollector;
async function loadEntries() {
	const [routerEntry, startEntry, pluginAdapters] = await Promise.all([
		import("./router-sXMnYegW.mjs").then((n) => n.t),
		import("./start-Bn8Eurft.mjs"),
		import("./empty-plugin-adapters-D9UWiqvJ.mjs")
	]);
	return {
		routerEntry,
		startEntry,
		pluginAdapters
	};
}
function getEntries() {
	if (!entriesPromise) entriesPromise = loadEntries();
	return entriesPromise;
}
var ROUTER_BASEPATH = "/";
var SERVER_FN_BASE = "/_serverFn/";
var IS_PRERENDERING = process.env.TSS_PRERENDERING === "true";
var IS_SHELL_ENV = process.env.TSS_SHELL === "true";
var IS_DEV = false;
var ERR_NO_RESPONSE = IS_DEV ? `It looks like you forgot to return a response from your server route handler. If you want to defer to the app router, make sure to have a component set in this route.` : "Internal Server Error";
var ERR_NO_DEFER = IS_DEV ? `You cannot defer to the app router if there is no component defined on this route.` : "Internal Server Error";
function throwRouteHandlerError() {
	throw new Error(ERR_NO_RESPONSE);
}
function throwIfMayNotDefer() {
	throw new Error(ERR_NO_DEFER);
}
function getResponseFromResult(result) {
	return isSsrResponse(result) || result instanceof Response ? result : result?.response;
}
var responseBodySources = /* @__PURE__ */ new WeakMap();
function disposeResponseResult(result, reason) {
	const response = getResponseFromResult(result);
	if (isSsrResponse(response) || response instanceof Response) disposeSsrResponse(response, reason);
}
function hasResponseBody(value) {
	return value instanceof Response && value.body !== null;
}
function inheritsResponseOwnership(ownership, candidate) {
	return hasResponseBody(candidate) && (candidate.body === ownership.response.body || responseBodySources.get(candidate) === ownership.response);
}
function disposeResponseOwnership(ownership, reason) {
	const { response, sourceBody, streamResponse } = ownership;
	streamResponse?.dispose(reason);
	if (!streamResponse || response.body !== sourceBody) response.body.cancel(reason).catch(() => {});
}
function getOwnedResponse(ownership) {
	const { response, sourceBody, streamResponse } = ownership;
	if (!streamResponse) return response;
	if (streamResponse.response === response && response.body === sourceBody) return streamResponse;
	if (response.body === sourceBody) return {
		...streamResponse,
		response
	};
	return {
		...streamResponse,
		response,
		dispose(reason) {
			disposeResponseOwnership(ownership, reason);
		}
	};
}
function createLateResponseDisposer(signal) {
	return (result) => disposeResponseResult(result, signal.reason);
}
/**
* Compose middleware around a terminal response handler. With no middleware
* the terminal runs directly.
*/
async function executeMiddleware(middlewares, terminal, ctx, signal, terminalNext) {
	let index = -1;
	let responseOwnership;
	let settled = false;
	const disposeAbandonedResult = createLateResponseDisposer(signal);
	const setResponse = (response) => {
		const ssrResponse = isSsrResponse(response) ? response : void 0;
		const streamResponse = ssrResponse?.serverSsrCleanup === "stream" ? ssrResponse : void 0;
		const exposed = ssrResponse ? ssrResponse.response : response;
		const current = responseOwnership;
		if (settled) {
			if (exposed !== ctx.response) disposeResponseResult(response, "late middleware response");
			return;
		}
		if (current && current.response === exposed) current.streamResponse ??= streamResponse;
		else if (current && inheritsResponseOwnership(current, exposed)) {
			current.response = exposed;
			current.streamResponse ??= streamResponse;
		} else {
			if (current) disposeResponseOwnership(current, "middleware response replaced");
			if (hasResponseBody(exposed)) responseOwnership = {
				response: exposed,
				sourceBody: exposed.body,
				streamResponse
			};
			else responseOwnership = void 0;
		}
		ctx.response = exposed;
	};
	const reconcileCtxResponse = () => {
		if (ctx.response !== responseOwnership?.response) setResponse(ctx.response);
	};
	let nextPromise;
	function next(nextCtx) {
		const result = runNext(nextCtx);
		nextPromise = result;
		return result;
	}
	async function runNext(nextCtx) {
		signal.throwIfAborted();
		if (nextCtx) {
			if (nextCtx.context) ctx.context = safeObjectMerge(ctx.context, nextCtx.context);
			for (const key of Object.keys(nextCtx)) if (key === "response") setResponse(nextCtx.response);
			else if (key !== "context") ctx[key] = nextCtx[key];
		}
		index++;
		const isTerminal = index === middlewares.length;
		const middleware = index < middlewares.length ? middlewares[index] : isTerminal ? terminal : void 0;
		const middlewareNext = isTerminal && terminalNext ? terminalNext : next;
		if (!middleware) return ctx;
		let result;
		try {
			const pending = middleware({
				...ctx,
				next: middlewareNext
			});
			if (nextPromise && pending === nextPromise) {
				nextPromise = void 0;
				await pending;
				if (signal.aborted) throw signal.reason;
				return ctx;
			} else if (!isPromise(pending)) {
				result = pending;
				signal.throwIfAborted();
			} else result = await waitForReason(pending, signal, disposeAbandonedResult, disposeAbandonedResult);
		} catch (err) {
			reconcileCtxResponse();
			if (signal.aborted) {
				if (result !== void 0) disposeAbandonedResult(result);
				if (err !== signal.reason) disposeAbandonedResult(err);
				throw signal.reason;
			}
			if (err instanceof Response) {
				setResponse(err);
				return ctx;
			}
			throw err;
		}
		if (isTerminal && terminalNext && !result) throwRouteHandlerError();
		reconcileCtxResponse();
		if (result && result !== ctx) {
			const response = getResponseFromResult(result);
			if (response !== void 0 && response !== ctx.response) setResponse(response);
			if (response !== result && result.context && result.context !== ctx.context) ctx.context = safeObjectMerge(ctx.context, result.context);
		}
		return ctx;
	}
	try {
		await runNext();
		const response = ctx.response;
		if (!response) throwRouteHandlerError();
		reconcileCtxResponse();
		if (signal.aborted) throw signal.reason;
		settled = true;
		return responseOwnership ? getOwnedResponse(responseOwnership) : response;
	} catch (err) {
		settled = true;
		if (responseOwnership) disposeResponseOwnership(responseOwnership, signal.aborted ? signal.reason : err);
		throw err;
	}
}
/**
* Creates the TanStack Start request handler.
*
* @example Backwards-compatible usage (handler callback only):
* ```ts
* export default createStartHandler(defaultStreamHandler)
* ```
*
* @example With CDN URL rewriting:
* ```ts
* export default createStartHandler({
*   handler: defaultStreamHandler,
*   transformAssets: 'https://cdn.example.com',
* })
* ```
*
* @example With per-request URL rewriting:
* ```ts
* export default createStartHandler({
*   handler: defaultStreamHandler,
*   transformAssets: {
*     transform: ({ url }) => {
*       const cdnBase = getRequest().headers.get('x-cdn-base') || ''
*       return { href: `${cdnBase}${url}` }
*     },
*     cache: false,
*   },
* })
* ```
*/
function createStartHandler(cbOrOptions) {
	const handlerOptions = typeof cbOrOptions === "function" ? {} : cbOrOptions;
	const cb = typeof cbOrOptions === "function" ? cbOrOptions : cbOrOptions.handler;
	const finalManifestResolver = createFinalManifestResolver({
		...handlerOptions,
		cacheCreateTransform: true
	});
	const resolveManifestForRequest = finalManifestResolver.resolveCached;
	finalManifestResolver.warmup({ getBaseManifest: () => getBaseManifest(void 0) });
	const startRequestResolver = async (request, requestOpts) => {
		const signal = request.signal;
		let router;
		let routerPromise;
		let responseOwnsCleanup = false;
		try {
			signal.throwIfAborted();
			const { url, handledProtocolRelativeURL } = getNormalizedURL(request.url);
			const href = url.pathname + url.search + url.hash;
			const origin = url.origin;
			if (handledProtocolRelativeURL) return Response.redirect(url, 308);
			const entries = await waitForReason(getEntries(), signal);
			const isServerFnRequest = !!SERVER_FN_BASE && url.pathname.startsWith(SERVER_FN_BASE);
			const startInstance = entries.startEntry.startInstance;
			let startOptions;
			if (startInstance) {
				const pendingStartOptions = startInstance.getOptions();
				startOptions = isPromise(pendingStartOptions) ? await waitForReason(pendingStartOptions, signal) : pendingStartOptions;
				signal.throwIfAborted();
			} else startOptions = {};
			const { hasPluginAdapters, pluginSerializationAdapters } = entries.pluginAdapters;
			const serializationAdapters = [
				...startOptions.serializationAdapters || [],
				...hasPluginAdapters ? pluginSerializationAdapters : [],
				ServerFunctionSerializationAdapter
			];
			const requestStartOptions = {
				...startOptions,
				requestMiddleware: startInstance ? startOptions.requestMiddleware : isServerFnRequest ? [defaultCsrfMiddleware] : void 0,
				serializationAdapters
			};
			const flattenedRequestMiddlewares = requestStartOptions.requestMiddleware ? flattenMiddlewares(requestStartOptions.requestMiddleware) : [];
			const executedRequestMiddlewares = new Set(flattenedRequestMiddlewares);
			const getRouter = () => {
				routerPromise ??= (async () => {
					signal.throwIfAborted();
					const requestRouter = await waitForReason(entries.routerEntry.getRouter(), signal);
					let isShell = IS_SHELL_ENV;
					if (IS_PRERENDERING && !isShell) isShell = request.headers.get(HEADERS.TSS_SHELL) === "true";
					const history = createServerHistory(href);
					requestRouter.update({
						history,
						isShell,
						isPrerendering: IS_PRERENDERING,
						origin: requestRouter.options.origin ?? origin,
						defaultSsr: requestStartOptions.defaultSsr,
						serializationAdapters: [...requestStartOptions.serializationAdapters, ...requestRouter.options.serializationAdapters || []],
						basepath: ROUTER_BASEPATH
					});
					router = requestRouter;
					return requestRouter;
				})();
				return routerPromise;
			};
			const handlerType = isServerFnRequest ? "serverFn" : "router";
			const startContext = {
				getRouter,
				startOptions: requestStartOptions,
				request,
				executedRequestMiddlewares,
				handlerType
			};
			let terminal;
			if (isServerFnRequest) {
				const serverFnId = url.pathname.slice(SERVER_FN_BASE.length).split("/")[0];
				if (!serverFnId) throw new Error("Invalid server action param for serverFnId");
				terminal = ({ context }) => runWithStartContext({
					...startContext,
					contextAfterGlobalMiddlewares: context
				}, () => handleServerAction({
					request,
					context: requestOpts?.context,
					serverFnId
				}));
			} else {
				const executeRouter = async (serverContext, matchedRoutes) => {
					if (!/(^|,)\s*(\*\/\*|text\/html)/.test(request.headers.get("Accept") || "*/*")) return normalizeSsrResponse(Response.json({ error: "Only HTML requests are supported here" }, { status: 406 }));
					const manifest = await waitForReason(resolveManifestForRequest({
						request,
						requestInlineCss: requestOpts?.inlineCss,
						getBaseManifest: () => getBaseManifest(matchedRoutes)
					}), signal);
					const earlyHints = createEarlyHintsForRequest({
						onEarlyHints: requestOpts?.onEarlyHints,
						responseLinkHeader: requestOpts?.responseLinkHeader
					});
					earlyHints?.collectStatic({
						manifest,
						matchedRoutes
					});
					const routerInstance = await getRouter();
					attachRouterServerSsrUtils({
						router: routerInstance,
						manifest,
						getRequestAssets: () => getStartContext({ throwIfNotFound: false })?.requestAssets
					});
					routerInstance.options.additionalContext = { serverContext };
					await routerInstance.load({ _signal: signal });
					signal.throwIfAborted();
					if (routerInstance._serverResult?.type === "redirect") return normalizeSsrResponse(routerInstance._serverResult.redirect);
					earlyHints?.collectDynamic(_getRenderedMatches(routerInstance.stores.matches.get()));
					const ctx = getStartContext({ throwIfNotFound: false });
					await routerInstance.serverSsr.dehydrate({
						requestAssets: ctx?.requestAssets,
						signal
					});
					signal.throwIfAborted();
					const responseHeaders = getStartResponseHeaders({ router: routerInstance });
					earlyHints?.appendResponseHeaders(responseHeaders);
					signal.throwIfAborted();
					const disposeLate = createLateResponseDisposer(signal);
					return normalizeSsrResponse(await waitForReason(cb({
						request,
						router: routerInstance,
						responseHeaders
					}), signal, disposeLate, disposeLate));
				};
				terminal = ({ context }) => runWithStartContext({
					...startContext,
					contextAfterGlobalMiddlewares: context
				}, () => handleServerRoutes({
					getRouter,
					request,
					url,
					executeRouter,
					context,
					executedRequestMiddlewares
				}));
			}
			const middlewareResponse = await executeMiddleware(flattenedRequestMiddlewares.map((d) => d.options.server), terminal, {
				request,
				pathname: url.pathname,
				handlerType,
				context: createNullProtoObject(requestOpts?.context)
			}, signal);
			let result;
			try {
				result = await handleRedirectResponse(middlewareResponse, getRouter, signal, isServerFnRequest && request.headers.get("x-tsr-serverFn") === "true");
				if (request.method === "HEAD") result = stripSsrResponseBody(result, "HEAD body stripped");
			} catch (error) {
				disposeResponseResult(middlewareResponse, signal.aborted ? signal.reason : error);
				throw error;
			}
			bindSsrResponseToRequest(router, result, signal);
			signal.throwIfAborted();
			responseOwnsCleanup = result.serverSsrCleanup === "stream";
			return result.response;
		} finally {
			if (router?.serverSsr && !responseOwnsCleanup) router.serverSsr.cleanup();
		}
	};
	return requestHandler(startRequestResolver);
}
var relativeRedirectProtocols = /* @__PURE__ */ new Set();
async function handleRedirectResponse(response, getRouter, signal, serializeRedirect) {
	signal.throwIfAborted();
	const ssrResponse = normalizeSsrResponse(response);
	const redirect = ssrResponse.response;
	if (!isRedirect(redirect)) return ssrResponse;
	const opts = redirect.options;
	const href = redirect.headers.get("Location") || opts.href;
	if (!href && opts.to && typeof opts.to === "string" && !opts.to.startsWith("/")) throw new Error(`Server side redirects must use absolute paths via the 'href' or 'to' options. The redirect() method's "to" property accepts an internal path only. Use the "href" property to provide an external URL. Received: ${JSON.stringify(opts)}`);
	if (!href && [
		"params",
		"search",
		"hash"
	].some((d) => typeof opts[d] === "function")) throw new Error(`Server side redirects must use static search, params, and hash values and do not support functional values. Received functional values for: ${Object.keys(opts).filter((d) => typeof opts[d] === "function").map((d) => `"${d}"`).join(", ")}`);
	signal.throwIfAborted();
	if (href && !isDangerousProtocol(href, relativeRedirectProtocols)) {
		opts.href = href;
		redirect.headers.set("Location", href);
	} else {
		const router = await getRouter();
		signal.throwIfAborted();
		router.resolveRedirect(redirect);
	}
	if (serializeRedirect) {
		const redirectOptions = { ...opts };
		delete redirectOptions.headers;
		const responseHeaders = new Headers(redirect.headers);
		responseHeaders.set("content-type", "application/json");
		return replaceSsrResponse(ssrResponse, Response.json({
			...redirectOptions,
			isSerializedRedirect: true
		}, { headers: responseHeaders }), "redirect response replaced");
	}
	return ssrResponse;
}
function withParsedParams(handler, matchedRoutes) {
	if (!matchedRoutes.some((route) => route.options.params?.parse ?? route.options.parseParams)) return handler;
	return (ctx) => {
		const params = Object.assign(Object.create(null), ctx.params);
		for (const route of matchedRoutes) {
			const parse = route.options.params?.parse ?? route.options.parseParams;
			if (parse) Object.assign(params, parse(params));
		}
		return handler({
			...ctx,
			params
		});
	};
}
async function handleServerRoutes({ getRouter, request, url, executeRouter, context, executedRequestMiddlewares }) {
	const router = await getRouter();
	const pathname = executeRewriteInput(router.rewrite, url).pathname;
	const [matchedRoutes, rawParams, foundRoute] = router.getMatchedRoutes(pathname);
	const isExactMatch = foundRoute && rawParams["**"] === void 0;
	const routeMiddlewares = [];
	let terminalHandler = (ctx) => executeRouter(ctx.context, matchedRoutes);
	let terminalNext;
	for (const route of matchedRoutes) {
		const serverMiddleware = route.options.server?.middleware;
		if (serverMiddleware) {
			const flattened = flattenMiddlewares(serverMiddleware);
			for (const m of flattened) if (!executedRequestMiddlewares.has(m)) routeMiddlewares.push(m.options.server);
		}
	}
	const server = foundRoute?.options.server;
	if (server?.handlers && isExactMatch) {
		const handlers = typeof server.handlers === "function" ? server.handlers({ createHandlers: (d) => d }) : server.handlers;
		const requestMethod = request.method.toUpperCase();
		const handler = requestMethod === "HEAD" ? handlers["HEAD"] ?? handlers["GET"] ?? handlers["ANY"] : handlers[requestMethod] ?? handlers["ANY"];
		if (handler) {
			const mayDefer = !!foundRoute.options.component;
			if (typeof handler !== "function") {
				if (handler.middleware?.length) {
					const handlerMiddlewares = flattenMiddlewares(handler.middleware);
					for (const m of handlerMiddlewares) routeMiddlewares.push(m.options.server);
				}
			}
			const routeHandler = typeof handler === "function" ? handler : handler.handler;
			if (routeHandler) {
				const parsedHandler = withParsedParams(routeHandler, matchedRoutes);
				if (!mayDefer) {
					terminalHandler = parsedHandler;
					terminalNext = throwIfMayNotDefer;
				} else routeMiddlewares.push(parsedHandler);
			}
		}
	}
	return normalizeSsrResponse(await executeMiddleware(routeMiddlewares, terminalHandler, {
		request,
		context,
		params: rawParams,
		pathname,
		handlerType: "router"
	}, request.signal, terminalNext));
}
var server_exports = /* @__PURE__ */ __exportAll({
	createServerEntry: () => createServerEntry,
	default: () => server_default
});
var fetch = createStartHandler(defaultStreamHandler);
function createServerEntry(entry) {
	return { async fetch(...args) {
		return await entry.fetch(...args);
	} };
}
var server_default = createServerEntry({ fetch });
//#endregion
export { TSS_SERVER_FUNCTION as a, getRequest as c, createServerFn as i, __exportAll as l, createMiddleware as n, getServerFnById as o, createCsrfMiddleware as r, __esmMin as s, server_exports as t, __toCommonJS as u };
