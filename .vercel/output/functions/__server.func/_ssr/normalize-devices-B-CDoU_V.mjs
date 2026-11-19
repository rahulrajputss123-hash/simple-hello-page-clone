import { n as __exportAll } from "../_runtime.mjs";
import { l as __exportAll$1 } from "./server-CpGMOUrW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/normalize-devices-B-CDoU_V.js
var normalize_devices_B_CDoU_V_exports = /* @__PURE__ */ __exportAll({
	n: () => normalize_devices_exports,
	t: () => normalizeDevices
});
var normalize_devices_exports = /* @__PURE__ */ __exportAll$1({ normalizeDevices: () => normalizeDevices });
/**
* Shared device normalization used by all adapters and backfill script.
* 
* Rules:
* - desktop, PC → web
* - All, empty, "*", or unknown → []
* - mobile → [android, ios]
* - Only keep: android, ios, web
* - Lowercase, deduplicated, sorted
* 
* Part 2 B4: Single source of truth for device normalization
*/
function normalizeDevices(devices) {
	const normalized = /* @__PURE__ */ new Set();
	for (const d of devices) {
		const lower = d.toLowerCase().trim();
		if (!lower || lower === "all" || lower === "*") continue;
		if (lower === "android" || lower.includes("android")) normalized.add("android");
		else if (lower === "ios" || lower.includes("ios") || lower.includes("iphone") || lower.includes("ipad")) normalized.add("ios");
		else if (lower === "web" || lower === "desktop" || lower === "pc" || lower === "windows" || lower === "macos" || lower.includes("desktop") || lower.includes("pc") || lower.includes("windows") || lower.includes("macos")) normalized.add("web");
		else if (lower === "mobile") {
			normalized.add("android");
			normalized.add("ios");
		}
	}
	return Array.from(normalized).sort();
}
//#endregion
export { normalize_devices_B_CDoU_V_exports as n, normalizeDevices as t };
