import { n as __exportAll } from "../_runtime.mjs";
import { l as __exportAll$1 } from "./server-CpGMOUrW.mjs";
import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/logs.server-DbNT75_y.js
var logs_server_DbNT75_y_exports = /* @__PURE__ */ __exportAll({
	n: () => logs_server_exports,
	t: () => logAutomation
});
var logs_server_exports = /* @__PURE__ */ __exportAll$1({
	automationStatsImpl: () => automationStatsImpl,
	listAutomationLogsImpl: () => listAutomationLogsImpl,
	logAutomation: () => logAutomation
});
init_client_server();
/** Fire-and-forget automation audit trail. Never throws into the caller. */
async function logAutomation(input) {
	try {
		await supabaseAdmin.from("automation_logs").insert({
			event_type: input.eventType,
			status: input.status ?? "info",
			source: input.source ?? "system",
			provider_id: input.providerId ?? null,
			user_id: input.userId ?? null,
			reference_id: input.referenceId ?? null,
			message: input.message ?? "",
			context: input.context ?? {}
		});
	} catch {}
}
async function listAutomationLogsImpl(input) {
	let query = supabaseAdmin.from("automation_logs").select("id, event_type, status, source, provider_id, user_id, reference_id, message, context, created_at").order("created_at", { ascending: false }).limit(input.limit);
	if (input.eventType) query = query.eq("event_type", input.eventType);
	if (input.status) query = query.eq("status", input.status);
	const { data, error } = await query;
	if (error) throw error;
	return data ?? [];
}
async function automationStatsImpl() {
	const since = (/* @__PURE__ */ new Date(Date.now() - 864e5)).toISOString();
	const [total, errors, credited, duplicates] = await Promise.all([
		supabaseAdmin.from("automation_logs").select("id", {
			count: "exact",
			head: true
		}).gte("created_at", since),
		supabaseAdmin.from("automation_logs").select("id", {
			count: "exact",
			head: true
		}).gte("created_at", since).eq("status", "error"),
		supabaseAdmin.from("sdk_offerwall_conversions").select("id", {
			count: "exact",
			head: true
		}).eq("status", "credited"),
		supabaseAdmin.from("sdk_offerwall_conversions").select("id", {
			count: "exact",
			head: true
		}).eq("status", "duplicate")
	]);
	return {
		events24h: total.count ?? 0,
		errors24h: errors.count ?? 0,
		creditedConversions: credited.count ?? 0,
		duplicateConversions: duplicates.count ?? 0
	};
}
//#endregion
export { logs_server_DbNT75_y_exports as n, logAutomation as t };
