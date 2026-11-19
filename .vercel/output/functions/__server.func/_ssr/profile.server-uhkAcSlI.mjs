import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
import { detectCountryFromRequest } from "./geo.server-BPDqDCBk.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile.server-uhkAcSlI.js
init_client_server();
/**
* Update user's country if it changed
* Called on authenticated session load
* Never blocks - fails silently if update fails
*/
async function updateUserCountryIfChanged(userId) {
	try {
		const requestCountry = detectCountryFromRequest();
		if (!requestCountry) return;
		const { data: profile } = await supabaseAdmin.from("profiles").select("country").eq("id", userId).maybeSingle();
		if (profile && profile.country !== requestCountry) {
			await supabaseAdmin.from("profiles").update({
				country: requestCountry,
				country_updated_at: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("id", userId);
			console.log(`[profile] Updated country for user ${userId}: ${profile.country} -> ${requestCountry}`);
		}
	} catch (error) {
		console.error("[profile] Failed to update user country:", error);
	}
}
/**
* Get user's country from profile
* Used as fallback when request country is not available
*/
async function getUserCountry(userId) {
	try {
		const { data: profile } = await supabaseAdmin.from("profiles").select("country").eq("id", userId).maybeSingle();
		return profile?.country ?? null;
	} catch (error) {
		console.error("[profile] Failed to get user country:", error);
		return null;
	}
}
//#endregion
export { getUserCountry, updateUserCountryIfChanged };
