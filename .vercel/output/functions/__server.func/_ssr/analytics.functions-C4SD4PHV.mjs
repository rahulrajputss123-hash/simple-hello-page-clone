import { i as createServerFn } from "./server-CpGMOUrW.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Br_KWlRY.mjs";
import { l as stringType, o as numberType, s as objectType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-BPtk4SPL.mjs";
import { t as withServerTiming } from "./server-timing-middleware-BDljk4aZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/analytics.functions-C4SD4PHV.js
/**
* Analytics server functions for admin dashboard
*/
/** Get funnel analysis for admin dashboard */
var getFunnelAnalytics_createServerFn_handler = createServerRpc({
	id: "9371b0f660deda1fe1d2f77f3d80d6162fc61d7f56a924c31ce505280821d431",
	name: "getFunnelAnalytics",
	filename: "src/lib/analytics/analytics.functions.ts"
}, (opts) => getFunnelAnalytics.__executeServer(opts));
var getFunnelAnalytics = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	fromDate: stringType(),
	toDate: stringType(),
	country: stringType().optional().nullable()
}).parse(input)).handler(getFunnelAnalytics_createServerFn_handler, withServerTiming("getFunnelAnalytics", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	await requireRole(context.userId, ["admin"]);
	const { getFunnelImpl } = await import("./funnel.server-D435yE6W.mjs");
	return getFunnelImpl(data.fromDate, data.toDate, data.country);
}));
var getTopClientErrors_createServerFn_handler = createServerRpc({
	id: "3f35e3ea3795d3fbf1d561595252fa4e9466aca2a3abd2ce032f1aecc822f7a3",
	name: "getTopClientErrors",
	filename: "src/lib/analytics/analytics.functions.ts"
}, (opts) => getTopClientErrors.__executeServer(opts));
var getTopClientErrors = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	fromDate: stringType(),
	toDate: stringType(),
	country: stringType().optional().nullable(),
	limit: numberType().min(1).max(50).optional()
}).parse(input)).handler(getTopClientErrors_createServerFn_handler, withServerTiming("getTopClientErrors", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	await requireRole(context.userId, ["admin"]);
	const { getTopClientErrorsImpl } = await import("./funnel.server-D435yE6W.mjs");
	return getTopClientErrorsImpl(data.fromDate, data.toDate, data.country, data.limit);
}));
var getTopProofErrors_createServerFn_handler = createServerRpc({
	id: "da851d027e9d9d76aa9b2fd9a7cb9d5e28f9c6134bdf28b26397cb4c41206539",
	name: "getTopProofErrors",
	filename: "src/lib/analytics/analytics.functions.ts"
}, (opts) => getTopProofErrors.__executeServer(opts));
var getTopProofErrors = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	fromDate: stringType(),
	toDate: stringType(),
	country: stringType().optional().nullable(),
	limit: numberType().min(1).max(50).optional()
}).parse(input)).handler(getTopProofErrors_createServerFn_handler, withServerTiming("getTopProofErrors", async ({ data, context }) => {
	const { requireRole } = await import("./admin-audit.server-KG3-2V08.mjs");
	await requireRole(context.userId, ["admin"]);
	const { getTopProofErrorsImpl } = await import("./funnel.server-D435yE6W.mjs");
	return getTopProofErrorsImpl(data.fromDate, data.toDate, data.country, data.limit);
}));
//#endregion
export { getFunnelAnalytics_createServerFn_handler, getTopClientErrors_createServerFn_handler, getTopProofErrors_createServerFn_handler };
