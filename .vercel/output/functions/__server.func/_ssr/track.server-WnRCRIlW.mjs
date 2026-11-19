import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
import { detectCountryFromRequest } from "./geo.server-BPDqDCBk.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/track.server-WnRCRIlW.js
init_client_server();
var ALLOWED_EVENTS = /* @__PURE__ */ new Set([
	"session_start",
	"page_view",
	"home_quest_view",
	"home_quest_click",
	"offer_list_view",
	"offer_click",
	"offer_started",
	"proof_screen_view",
	"proof_submit_attempt",
	"proof_submit_success",
	"proof_submit_error",
	"claim_status_view",
	"quest_start",
	"quest_complete",
	"wallet_view",
	"withdraw_view",
	"withdraw_submit",
	"app_background",
	"client_error"
]);
var MAX_EVENTS_PER_BATCH = 20;
var MAX_PROPERTIES_SIZE = 2048;
/**
* Validate and insert analytics events
* @param payload - Batch of events from client
* @param userId - User ID from session (null for anonymous)
* @returns Success status and any rejected events
*/
async function trackEventsImpl(payload, userId) {
	const rejected = [];
	const validEvents = [];
	if (!payload.events || payload.events.length === 0) return {
		ok: false,
		accepted: 0,
		rejected: ["no events provided"]
	};
	if (payload.events.length > MAX_EVENTS_PER_BATCH) return {
		ok: false,
		accepted: 0,
		rejected: [`batch size exceeds maximum of ${MAX_EVENTS_PER_BATCH}`]
	};
	const country = detectCountryFromRequest();
	for (const event of payload.events) {
		if (!ALLOWED_EVENTS.has(event.event_name)) {
			rejected.push(`unknown event: ${event.event_name}`);
			continue;
		}
		if (JSON.stringify(event.properties || {}).length > MAX_PROPERTIES_SIZE) {
			rejected.push(`${event.event_name}: properties exceed ${MAX_PROPERTIES_SIZE} bytes`);
			continue;
		}
		const sanitized = sanitizeProperties(event.properties || {});
		validEvents.push({
			event_name: event.event_name,
			user_id: userId,
			anon_id: payload.anon_id,
			country,
			device: event.device || null,
			page: event.page || null,
			properties: sanitized
		});
	}
	if (validEvents.length > 0) {
		const { error } = await supabaseAdmin.from("app_events").insert(validEvents);
		if (error) {
			console.error("[analytics] insert failed:", error);
			return {
				ok: false,
				accepted: 0,
				rejected: [...rejected, "database insert failed"]
			};
		}
	}
	return {
		ok: true,
		accepted: validEvents.length,
		rejected
	};
}
/**
* Server-side sanitization as an extra safety layer
* Removes any keys that might contain PII
*/
function sanitizeProperties(properties) {
	const sanitized = {};
	const blockedKeys = [
		"email",
		"phone",
		"password",
		"token",
		"secret",
		"key",
		"ip",
		"ipaddress",
		"ip_address",
		"authorization",
		"auth"
	];
	for (const [key, value] of Object.entries(properties)) {
		const lowerKey = key.toLowerCase();
		if (blockedKeys.some((blocked) => lowerKey.includes(blocked))) continue;
		if (typeof value === "string") {
			if (value.includes("@") && value.includes(".")) continue;
			if (/\d{10,}/.test(value)) continue;
		}
		sanitized[key] = value;
	}
	return sanitized;
}
//#endregion
export { trackEventsImpl };
