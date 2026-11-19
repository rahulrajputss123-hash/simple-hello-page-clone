import { i as createServerFn } from "./server-CpGMOUrW.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Br_KWlRY.mjs";
import { i as enumType, l as stringType, o as numberType, r as booleanType, s as objectType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-BPtk4SPL.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/functions-BmoDkZn9.js
var sectionSchema = enumType([
	"home",
	"offers",
	"tasks",
	"offerwall"
]);
var ctaKindSchema = enumType([
	"none",
	"offers",
	"tasks",
	"offerwall",
	"offer",
	"offerwall_provider",
	"url"
]);
/** Authenticated: eligible custom+scheduled banners for a section. */
var listEligibleBanners_createServerFn_handler = createServerRpc({
	id: "6a7c320e1c86a9d2e931030f4080fade96597a5f487c7691c4627738dfc9b42d",
	name: "listEligibleBanners",
	filename: "src/lib/banners/functions.ts"
}, (opts) => listEligibleBanners.__executeServer(opts));
var listEligibleBanners = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ section: sectionSchema }).parse(input)).handler(listEligibleBanners_createServerFn_handler, async ({ data }) => {
	const { listEligibleBannersImpl } = await import("./server-B0A-5l2D.mjs");
	return listEligibleBannersImpl(data.section);
});
var listAdminBanners_createServerFn_handler = createServerRpc({
	id: "dad71b67e380175074d9624654f05cbb11d369c8577e2e6a2b2c582f116dd3af",
	name: "listAdminBanners",
	filename: "src/lib/banners/functions.ts"
}, (opts) => listAdminBanners.__executeServer(opts));
var listAdminBanners = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(listAdminBanners_createServerFn_handler, async ({ context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { listAdminBannersImpl } = await import("./server-B0A-5l2D.mjs");
	return listAdminBannersImpl();
});
var saveBanner_createServerFn_handler = createServerRpc({
	id: "f591482d446e664b444330d0996206e27a146e2704100ede39945e2e09155f62",
	name: "saveBanner",
	filename: "src/lib/banners/functions.ts"
}, (opts) => saveBanner.__executeServer(opts));
var saveBanner = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid().optional(),
	section: sectionSchema,
	title: stringType().trim().max(120).default(""),
	description: stringType().trim().max(500).default(""),
	imageUrl: stringType().trim().url().max(1e3).nullable().optional(),
	ctaLabel: stringType().trim().max(40).nullable().optional(),
	ctaKind: ctaKindSchema.default("none"),
	ctaTarget: stringType().trim().max(1e3).nullable().optional(),
	priority: numberType().int().min(0).max(9999).default(0),
	isActive: booleanType().default(true),
	startsAt: stringType().datetime().nullable().optional(),
	endsAt: stringType().datetime().nullable().optional()
}).refine((d) => d.title.length > 0 || Boolean(d.imageUrl), { message: "A banner needs either an image or a title." }).parse(input)).handler(saveBanner_createServerFn_handler, async ({ data, context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { upsertBannerImpl } = await import("./server-B0A-5l2D.mjs");
	return upsertBannerImpl({
		...data,
		imageUrl: data.imageUrl ?? null,
		ctaLabel: data.ctaLabel ?? null,
		ctaTarget: data.ctaTarget ?? null,
		startsAt: data.startsAt ?? null,
		endsAt: data.endsAt ?? null
	});
});
var deleteBanner_createServerFn_handler = createServerRpc({
	id: "e022ed18b2ca50ab1a6eb7abc5a10e30fb9057a68ee897b093e93156d73c491f",
	name: "deleteBanner",
	filename: "src/lib/banners/functions.ts"
}, (opts) => deleteBanner.__executeServer(opts));
var deleteBanner = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(deleteBanner_createServerFn_handler, async ({ data, context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { deleteBannerImpl } = await import("./server-B0A-5l2D.mjs");
	return deleteBannerImpl(data.id);
});
var listSmartBannerSettings_createServerFn_handler = createServerRpc({
	id: "bcd925c33377882596932acaf4012ad8bca8b802c759d68b35e75c1254303423",
	name: "listSmartBannerSettings",
	filename: "src/lib/banners/functions.ts"
}, (opts) => listSmartBannerSettings.__executeServer(opts));
var listSmartBannerSettings = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(listSmartBannerSettings_createServerFn_handler, async () => {
	const { listSmartBannerSettingsImpl } = await import("./server-B0A-5l2D.mjs");
	return listSmartBannerSettingsImpl();
});
var setSmartBannerEnabled_createServerFn_handler = createServerRpc({
	id: "5af89718379d3f3a9acf31d0f2e9c51a0bd467c9def3698744f786a2c265a123",
	name: "setSmartBannerEnabled",
	filename: "src/lib/banners/functions.ts"
}, (opts) => setSmartBannerEnabled.__executeServer(opts));
var setSmartBannerEnabled = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	templateKey: stringType().trim().min(1).max(100),
	enabled: booleanType()
}).parse(input)).handler(setSmartBannerEnabled_createServerFn_handler, async ({ data, context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { setSmartBannerEnabledImpl } = await import("./server-B0A-5l2D.mjs");
	return setSmartBannerEnabledImpl(data.templateKey, data.enabled);
});
var requestBannerUploadUrl_createServerFn_handler = createServerRpc({
	id: "92a64a7fcf14c96725985bd6609acae86c66c8e3528a5cff8d4cdf201d9fe0dc",
	name: "requestBannerUploadUrl",
	filename: "src/lib/banners/functions.ts"
}, (opts) => requestBannerUploadUrl.__executeServer(opts));
var requestBannerUploadUrl = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	filename: stringType().trim().min(1).max(120),
	target: enumType(["banners", "offers"]).default("banners")
}).parse(input)).handler(requestBannerUploadUrl_createServerFn_handler, async ({ data, context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { requestBannerUploadUrlImpl } = await import("./server-B0A-5l2D.mjs");
	return requestBannerUploadUrlImpl(context.userId, data.filename, data.target === "offers" ? "offers" : void 0);
});
//#endregion
export { deleteBanner_createServerFn_handler, listAdminBanners_createServerFn_handler, listEligibleBanners_createServerFn_handler, listSmartBannerSettings_createServerFn_handler, requestBannerUploadUrl_createServerFn_handler, saveBanner_createServerFn_handler, setSmartBannerEnabled_createServerFn_handler };
