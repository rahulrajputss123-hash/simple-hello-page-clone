import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/funnel.server-D435yE6W.js
init_client_server();
/**
* Get funnel metrics for user journey
* Returns distinct user/anon counts for each funnel step with conversion rates
*/
async function getFunnelImpl(fromDate, toDate, country) {
	const funnelSteps = [
		"session_start",
		"home_quest_view",
		"offer_list_view",
		"offer_click",
		"offer_started",
		"proof_screen_view",
		"proof_submit_attempt",
		"proof_submit_success",
		"withdraw_view",
		"withdraw_submit"
	];
	const steps = [];
	let previousCount = 0;
	for (const stepName of funnelSteps) {
		let query = supabaseAdmin.from("app_events").select("user_id, anon_id", {
			count: "exact",
			head: false
		}).eq("event_name", stepName).gte("created_at", fromDate).lte("created_at", toDate);
		if (country && country !== "all") query = query.eq("country", country);
		const { data, error } = await query;
		if (error) {
			console.error(`[funnel] Error fetching ${stepName}:`, error);
			continue;
		}
		const uniqueUsers = /* @__PURE__ */ new Set();
		data?.forEach((row) => {
			const id = row.user_id || row.anon_id;
			if (id) uniqueUsers.add(id);
		});
		const count = uniqueUsers.size;
		const conversionRate = previousCount > 0 ? count / previousCount * 100 : null;
		steps.push({
			step: stepName,
			count,
			conversionRate
		});
		previousCount = count;
	}
	return {
		country: country || null,
		steps,
		dateRange: {
			from: fromDate,
			to: toDate
		}
	};
}
/**
* Get top client error routes for a date range
*/
async function getTopClientErrorsImpl(fromDate, toDate, country, limit = 10) {
	let query = supabaseAdmin.from("app_events").select("properties").eq("event_name", "client_error").gte("created_at", fromDate).lte("created_at", toDate);
	if (country && country !== "all") query = query.eq("country", country);
	const { data, error } = await query;
	if (error) {
		console.error("[funnel] Error fetching client errors:", error);
		return [];
	}
	const routeCounts = /* @__PURE__ */ new Map();
	data?.forEach((row) => {
		const route = row.properties?.route;
		if (route) routeCounts.set(route, (routeCounts.get(route) || 0) + 1);
	});
	return Array.from(routeCounts.entries()).map(([route, count]) => ({
		route,
		count
	})).sort((a, b) => b.count - a.count).slice(0, limit);
}
/**
* Get top proof submission error codes for a date range
*/
async function getTopProofErrorsImpl(fromDate, toDate, country, limit = 10) {
	let query = supabaseAdmin.from("app_events").select("properties").eq("event_name", "proof_submit_error").gte("created_at", fromDate).lte("created_at", toDate);
	if (country && country !== "all") query = query.eq("country", country);
	const { data, error } = await query;
	if (error) {
		console.error("[funnel] Error fetching proof errors:", error);
		return [];
	}
	const errorCounts = /* @__PURE__ */ new Map();
	data?.forEach((row) => {
		const errorCode = row.properties?.error_code;
		if (errorCode) errorCounts.set(errorCode, (errorCounts.get(errorCode) || 0) + 1);
	});
	return Array.from(errorCounts.entries()).map(([error_code, count]) => ({
		error_code,
		count
	})).sort((a, b) => b.count - a.count).slice(0, limit);
}
//#endregion
export { getFunnelImpl, getTopClientErrorsImpl, getTopProofErrorsImpl };
