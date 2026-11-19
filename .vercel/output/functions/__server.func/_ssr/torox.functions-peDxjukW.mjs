import { i as createServerFn } from "./server-CpGMOUrW.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Br_KWlRY.mjs";
import { l as stringType, s as objectType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-BPtk4SPL.mjs";
import { t as withServerTiming } from "./server-timing-middleware-BDljk4aZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/torox.functions-peDxjukW.js
/**
* Torox per-user click URL generation.
* 
* Torox click URLs MUST be generated at click time per user and cannot be
* cached or reused. This server function:
* 1. Loads the offer from DB and verifies it's a Torox offer
* 2. Takes userId from authenticated session (never from client input)
* 3. Determines user's country from profile or falls back to feed default
* 4. Calls Torox click API with fresh credentials
* 5. Returns the validated tracking URL
*/
var DEFAULT_API_BASE = "https://api.wall.torox.io";
var getToroxClickUrlSchema = objectType({ offerId: stringType().uuid() });
var getToroxClickUrl_createServerFn_handler = createServerRpc({
	id: "facbb8b312f11359eaeee6faa073c46f1c8b656b24082f024e37e4ccb8e90fd6",
	name: "getToroxClickUrl",
	filename: "src/lib/offers/torox.functions.ts"
}, (opts) => getToroxClickUrl.__executeServer(opts));
var getToroxClickUrl = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => getToroxClickUrlSchema.parse(input)).handler(getToroxClickUrl_createServerFn_handler, withServerTiming("getToroxClickUrl", async ({ data: { offerId }, context }) => {
	const { supabaseAdmin } = await import("./client.server-gEMheit0.mjs").then((n) => n.t).then((n) => (n.n(), n.t));
	const { detectCountryFromRequest } = await import("./geo.server-BPDqDCBk.mjs");
	const { logAutomation } = await import("./logs.server-DbNT75_y.mjs").then((n) => n.n).then((n) => n.n);
	const userId = context.userId;
	const offer = (await supabaseAdmin.from("offers").select("id, title, external_offer_id, is_active, offer_providers!inner(slug)").eq("id", offerId).eq("offer_providers.slug", "torox").maybeSingle()).data;
	if (!offer) {
		await logAutomation({
			eventType: "offer_click",
			status: "error",
			source: "torox_click_url",
			userId,
			message: "Torox offer not found or not a Torox offer",
			context: { offerId }
		});
		throw new Error("Offer not found or not available.");
	}
	if (!offer.is_active) {
		await logAutomation({
			eventType: "offer_click",
			status: "warning",
			source: "torox_click_url",
			userId,
			referenceId: offerId,
			message: "Torox offer is inactive",
			context: { title: offer.title }
		});
		throw new Error("This offer is no longer available.");
	}
	const campaignId = String(offer.external_offer_id ?? "").trim();
	if (!campaignId) {
		await logAutomation({
			eventType: "offer_click",
			status: "error",
			source: "torox_click_url",
			userId,
			referenceId: offerId,
			message: "Torox offer missing external_offer_id",
			context: { title: offer.title }
		});
		throw new Error("Offer configuration error.");
	}
	const userCountry = detectCountryFromRequest() ?? "US";
	const sourceId = (process.env["TOROX_FEED_SOURCE_ID"] ?? "").trim();
	const token = (process.env["TOROX_FEED_TOKEN"] ?? "").trim();
	const apiBase = (process.env["TOROX_API_BASE"] ?? DEFAULT_API_BASE).trim();
	if (!sourceId || !token) {
		await logAutomation({
			eventType: "offer_click",
			status: "error",
			source: "torox_click_url",
			userId,
			referenceId: offerId,
			message: "Torox credentials not configured",
			context: { title: offer.title }
		});
		throw new Error("Service temporarily unavailable.");
	}
	const url = new URL(`${apiBase}/partner/user/click`);
	url.searchParams.set("source_id", sourceId);
	url.searchParams.set("token", token);
	url.searchParams.set("uid", userId);
	url.searchParams.set("geo", userCountry);
	url.searchParams.set("campaign_id", campaignId);
	let response;
	try {
		response = await fetch(url.toString(), {
			headers: { Accept: "application/json" },
			signal: AbortSignal.timeout(1e4)
		});
	} catch (err) {
		await logAutomation({
			eventType: "offer_click",
			status: "error",
			source: "torox_click_url",
			userId,
			referenceId: offerId,
			message: `Torox click API network error: ${err instanceof Error ? err.message : "unknown"}`,
			context: {
				title: offer.title,
				campaignId
			}
		});
		throw new Error("Could not generate tracking link. Please try again.");
	}
	if (!response.ok) {
		const text = await response.text();
		await logAutomation({
			eventType: "offer_click",
			status: "error",
			source: "torox_click_url",
			userId,
			referenceId: offerId,
			message: `Torox click API error (${response.status})`,
			context: {
				title: offer.title,
				campaignId,
				error: text.slice(0, 200)
			}
		});
		throw new Error("Could not generate tracking link. Please try again.");
	}
	const text = await response.text();
	let parsed;
	try {
		parsed = JSON.parse(text);
	} catch {
		await logAutomation({
			eventType: "offer_click",
			status: "error",
			source: "torox_click_url",
			userId,
			referenceId: offerId,
			message: "Torox click API returned non-JSON",
			context: {
				title: offer.title,
				campaignId,
				httpStatus: response.status,
				contentType: response.headers.get("content-type"),
				responseBody: text.slice(0, 500)
			}
		});
		throw new Error("Invalid response from tracking service.");
	}
	let clickUrl = "";
	if (parsed && typeof parsed === "object") {
		const obj = parsed;
		clickUrl = String(obj.clickUrl ?? obj.url ?? obj.click_url ?? obj.tracking_url ?? obj.redirect_url ?? "").trim();
		if (!clickUrl && obj.data && typeof obj.data === "object") {
			const data = obj.data;
			clickUrl = String(data.clickUrl ?? data.url ?? data.click_url ?? data.tracking_url ?? data.redirect_url ?? "").trim();
		}
		if (!clickUrl && obj.result && typeof obj.result === "object") {
			const result = obj.result;
			clickUrl = String(result.clickUrl ?? result.url ?? result.click_url ?? result.tracking_url ?? result.redirect_url ?? "").trim();
		}
	}
	if (!clickUrl || !clickUrl.startsWith("https://")) {
		const availableKeys = parsed && typeof parsed === "object" ? Object.keys(parsed) : [];
		const nestedKeys = parsed && typeof parsed === "object" ? Object.entries(parsed).filter(([_, v]) => v && typeof v === "object").map(([k, v]) => `${k}:${Object.keys(v).join(",")}`) : [];
		await logAutomation({
			eventType: "offer_click",
			status: "error",
			source: "torox_click_url",
			userId,
			referenceId: offerId,
			message: "Torox click API returned invalid or missing URL",
			context: {
				title: offer.title,
				campaignId,
				clickUrl: clickUrl || "(empty)",
				httpStatus: response.status,
				responseBody: text.slice(0, 500),
				topLevelKeys: availableKeys,
				nestedStructure: nestedKeys
			}
		});
		console.error(`[Torox] Missing tracking URL for offer ${offerId}, campaign ${campaignId}. Response keys:`, availableKeys);
		throw new Error("Torox returned no tracking link.");
	}
	await logAutomation({
		eventType: "offer_click",
		status: "success",
		source: "torox_click_url",
		userId,
		referenceId: offerId,
		message: `Generated Torox click URL for ${offer.title}`,
		context: { campaignId }
	});
	return { clickUrl };
}));
//#endregion
export { getToroxClickUrl_createServerFn_handler };
