import { c as getRequest } from "./server-CpGMOUrW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/geo.server-BPDqDCBk.js
/**
* Server-side GEO detection from standard proxy headers (Vercel / Cloudflare / common CDNs).
* No client-side geolocation prompts. Returns an uppercase ISO-3166 alpha-2 code, or null.
*/
var GEO_HEADERS = [
	"x-vercel-ip-country",
	"cf-ipcountry",
	"x-country-code",
	"x-geo-country",
	"x-appengine-country"
];
var IGNORED_CODES = /* @__PURE__ */ new Set([
	"XX",
	"T1",
	"A1",
	"A2",
	"ZZ",
	"EU"
]);
function normalizeCountry(value) {
	if (!value) return null;
	const code = value.trim().toUpperCase();
	if (!/^[A-Z]{2}$/.test(code)) return null;
	if (IGNORED_CODES.has(code)) return null;
	return code;
}
/** Reads the requesting user's country from proxy headers. Returns null when absent/unknown. */
function detectCountryFromRequest() {
	const headers = getRequest()?.headers;
	if (!headers) return null;
	for (const key of GEO_HEADERS) {
		const found = normalizeCountry(headers.get(key));
		if (found) return found;
	}
	return null;
}
/** Reads the requesting user's real IP from proxy headers (for geo-targeting on network APIs). */
function detectIpFromRequest() {
	const headers = getRequest()?.headers;
	if (!headers) return null;
	const forwarded = headers.get("x-forwarded-for");
	if (forwarded) {
		const first = forwarded.split(",")[0]?.trim();
		if (first) return first;
	}
	return (headers.get("x-real-ip") ?? headers.get("cf-connecting-ip"))?.trim() || null;
}
//#endregion
export { detectCountryFromRequest, detectIpFromRequest, normalizeCountry };
