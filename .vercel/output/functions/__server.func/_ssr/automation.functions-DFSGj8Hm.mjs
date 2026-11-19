import { i as createServerFn } from "./server-CpGMOUrW.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Br_KWlRY.mjs";
import { i as enumType, l as stringType, o as numberType, s as objectType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-BPtk4SPL.mjs";
import { t as withServerTiming } from "./server-timing-middleware-BDljk4aZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/automation.functions-DFSGj8Hm.js
/** Admin-only automation observability + retry API. */
var listAutomationLogs_createServerFn_handler = createServerRpc({
	id: "3496dc372a78d4eb4ce1811294c47da645af755f6da0ad04be131560d5bb05bf",
	name: "listAutomationLogs",
	filename: "src/lib/automation.functions.ts"
}, (opts) => listAutomationLogs.__executeServer(opts));
var listAutomationLogs = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	eventType: stringType().trim().max(60).optional(),
	status: enumType([
		"info",
		"success",
		"warning",
		"error"
	]).optional(),
	limit: numberType().int().min(1).max(200).default(50)
}).parse(input ?? {})).handler(listAutomationLogs_createServerFn_handler, withServerTiming("listAutomationLogs", async ({ data, context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { listAutomationLogsImpl } = await import("./logs.server-DbNT75_y.mjs").then((n) => n.n).then((n) => n.n);
	return listAutomationLogsImpl(data);
}));
var automationStats_createServerFn_handler = createServerRpc({
	id: "af6f16c0f33cb0696a7a87808039804596b18d30ad3fd34e91acaa160ed261df",
	name: "automationStats",
	filename: "src/lib/automation.functions.ts"
}, (opts) => automationStats.__executeServer(opts));
var automationStats = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(automationStats_createServerFn_handler, withServerTiming("automationStats", async ({ context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { automationStatsImpl } = await import("./logs.server-DbNT75_y.mjs").then((n) => n.n).then((n) => n.n);
	return automationStatsImpl();
}));
var retryConversion_createServerFn_handler = createServerRpc({
	id: "0bd057af126f88808da8e0ddaee5f4f4a6a129039c5b0b5fb08f4676e811fb6f",
	name: "retryConversion",
	filename: "src/lib/automation.functions.ts"
}, (opts) => retryConversion.__executeServer(opts));
var retryConversion = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ conversionId: stringType().uuid() }).parse(input)).handler(retryConversion_createServerFn_handler, withServerTiming("retryConversion", async ({ data, context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { retryConversionImpl } = await import("./retry.server-BcC6lDrz.mjs");
	return retryConversionImpl(data.conversionId);
}));
//#endregion
export { automationStats_createServerFn_handler, listAutomationLogs_createServerFn_handler, retryConversion_createServerFn_handler };
