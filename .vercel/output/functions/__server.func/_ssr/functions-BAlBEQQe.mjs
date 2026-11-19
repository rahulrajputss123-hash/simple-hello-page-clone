import { i as createServerFn } from "./server-CpGMOUrW.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Br_KWlRY.mjs";
import { i as enumType, l as stringType, n as arrayType, o as numberType, r as booleanType, s as objectType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-BPtk4SPL.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/functions-BAlBEQQe.js
var premiumStepSchema = objectType({
	id: stringType().uuid().optional(),
	stepKey: stringType().trim().min(1).max(80),
	title: stringType().trim().min(1).max(120),
	subtitle: stringType().trim().max(180).default(""),
	description: stringType().trim().max(500).default(""),
	stepType: enumType([
		"welcome",
		"avatar",
		"profile",
		"showcase",
		"celebration"
	]),
	ctaText: stringType().trim().max(80).default("Next →"),
	displayOrder: numberType().int().min(0).max(999).default(0),
	enabled: booleanType().default(true),
	accentStyle: enumType(["gold", "jade"]).default("gold"),
	position: enumType(["center", "bottom"]).default("bottom"),
	illustration: stringType().trim().max(120).nullable().optional(),
	icon: stringType().trim().max(80).nullable().optional()
});
/** Public/authenticated: fetch enabled steps in display order. */
var listOnboardingSteps_createServerFn_handler = createServerRpc({
	id: "7dbe2a7021154b399e2c4f6b2b4c273b977d16e1e1b849b8d34f27a33ed0d8b4",
	name: "listOnboardingSteps",
	filename: "src/lib/onboarding/functions.ts"
}, (opts) => listOnboardingSteps.__executeServer(opts));
var listOnboardingSteps = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(listOnboardingSteps_createServerFn_handler, async () => {
	const { listEnabledStepsImpl } = await import("./server-BNCCeHSG.mjs");
	return listEnabledStepsImpl();
});
var markOnboardingSeen_createServerFn_handler = createServerRpc({
	id: "365d505f98cca490b53272ba65f7c16773018ffdc3a553dae769fc794682cf6a",
	name: "markOnboardingSeen",
	filename: "src/lib/onboarding/functions.ts"
}, (opts) => markOnboardingSeen.__executeServer(opts));
var markOnboardingSeen = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(markOnboardingSeen_createServerFn_handler, async ({ context }) => {
	const { markOnboardingSeenImpl } = await import("./server-BNCCeHSG.mjs");
	return markOnboardingSeenImpl(context.userId);
});
var resetOnboarding_createServerFn_handler = createServerRpc({
	id: "fefcfd4e8a70d37ac0e158de80e94fa549f634d02f3a28839111921fc497e5f3",
	name: "resetOnboarding",
	filename: "src/lib/onboarding/functions.ts"
}, (opts) => resetOnboarding.__executeServer(opts));
var resetOnboarding = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(resetOnboarding_createServerFn_handler, async ({ context }) => {
	const { resetOnboardingImpl } = await import("./server-BNCCeHSG.mjs");
	return resetOnboardingImpl(context.userId);
});
var listAdminOnboardingSteps_createServerFn_handler = createServerRpc({
	id: "4288710aedd7d76a93f035c8631ebd30aa656bf9b529b165eee4fef6d591d88b",
	name: "listAdminOnboardingSteps",
	filename: "src/lib/onboarding/functions.ts"
}, (opts) => listAdminOnboardingSteps.__executeServer(opts));
var listAdminOnboardingSteps = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(listAdminOnboardingSteps_createServerFn_handler, async ({ context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { listAdminStepsImpl } = await import("./server-BNCCeHSG.mjs");
	return listAdminStepsImpl();
});
var saveOnboardingStep_createServerFn_handler = createServerRpc({
	id: "e383da82562c26cb29a2ee24a884c3d41100a5fbd1571397ad596a0302416a72",
	name: "saveOnboardingStep",
	filename: "src/lib/onboarding/functions.ts"
}, (opts) => saveOnboardingStep.__executeServer(opts));
var saveOnboardingStep = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid().optional(),
	targetElementId: stringType().trim().min(1).max(100),
	title: stringType().trim().min(1).max(120),
	description: stringType().trim().max(500).default(""),
	displayOrder: numberType().int().min(0).max(999).default(0),
	enabled: booleanType().default(true)
}).parse(input)).handler(saveOnboardingStep_createServerFn_handler, async ({ data, context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { saveOnboardingStepImpl } = await import("./server-BNCCeHSG.mjs");
	return saveOnboardingStepImpl(data);
});
var deleteOnboardingStep_createServerFn_handler = createServerRpc({
	id: "8a3d968e2cc71e21d8934bfbeeea434bdca38f8e429b512d31dfc807c293368f",
	name: "deleteOnboardingStep",
	filename: "src/lib/onboarding/functions.ts"
}, (opts) => deleteOnboardingStep.__executeServer(opts));
var deleteOnboardingStep = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(deleteOnboardingStep_createServerFn_handler, async ({ data, context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { deleteOnboardingStepImpl } = await import("./server-BNCCeHSG.mjs");
	return deleteOnboardingStepImpl(data.id);
});
var reorderOnboardingSteps_createServerFn_handler = createServerRpc({
	id: "944a5ed7b9016b55c61355fb35c621b0a61b04ad2c0de5ccc0e2e9dba1371ebf",
	name: "reorderOnboardingSteps",
	filename: "src/lib/onboarding/functions.ts"
}, (opts) => reorderOnboardingSteps.__executeServer(opts));
var reorderOnboardingSteps = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ orderedIds: arrayType(stringType().uuid()).min(1).max(50) }).parse(input)).handler(reorderOnboardingSteps_createServerFn_handler, async ({ data, context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { reorderOnboardingStepsImpl } = await import("./server-BNCCeHSG.mjs");
	return reorderOnboardingStepsImpl(data.orderedIds);
});
var listPremiumOnboardingSteps_createServerFn_handler = createServerRpc({
	id: "89e3d1144746874336c39944d1dff530622453baa14793b025ed752614349d6f",
	name: "listPremiumOnboardingSteps",
	filename: "src/lib/onboarding/functions.ts"
}, (opts) => listPremiumOnboardingSteps.__executeServer(opts));
var listPremiumOnboardingSteps = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(listPremiumOnboardingSteps_createServerFn_handler, async ({ context }) => {
	const { listPremiumStepsImpl } = await import("./server-BNCCeHSG.mjs");
	return listPremiumStepsImpl(context.supabase);
});
var completePremiumOnboarding_createServerFn_handler = createServerRpc({
	id: "ecfc9be8a178bbd3051df2187dd55031b3f9de3b01120cba5c708c40e41c4bf9",
	name: "completePremiumOnboarding",
	filename: "src/lib/onboarding/functions.ts"
}, (opts) => completePremiumOnboarding.__executeServer(opts));
var completePremiumOnboarding = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	name: stringType().trim().min(2).max(80),
	avatarId: stringType().trim().min(1).max(80),
	gender: enumType([
		"female",
		"male",
		"non_binary",
		"prefer_not_to_say"
	]).optional(),
	dateOfBirth: stringType().date().optional()
}).parse(input)).handler(completePremiumOnboarding_createServerFn_handler, async ({ data, context }) => {
	const { completePremiumOnboardingImpl } = await import("./server-BNCCeHSG.mjs");
	return completePremiumOnboardingImpl(context.userId, data, context.supabase);
});
var listAdminPremiumOnboardingSteps_createServerFn_handler = createServerRpc({
	id: "0417a07bdddc5b0bdddf084f3faf3d3f45989a08c56a391f58836aeb1e5d3f2d",
	name: "listAdminPremiumOnboardingSteps",
	filename: "src/lib/onboarding/functions.ts"
}, (opts) => listAdminPremiumOnboardingSteps.__executeServer(opts));
var listAdminPremiumOnboardingSteps = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(listAdminPremiumOnboardingSteps_createServerFn_handler, async ({ context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { listAdminPremiumStepsImpl } = await import("./server-BNCCeHSG.mjs");
	return listAdminPremiumStepsImpl(context.supabase);
});
var savePremiumOnboardingStep_createServerFn_handler = createServerRpc({
	id: "af5bf14ea3c5519c183a7ad1cba980e33a0d632f9f01e9d6c2aa5b66063b7f1a",
	name: "savePremiumOnboardingStep",
	filename: "src/lib/onboarding/functions.ts"
}, (opts) => savePremiumOnboardingStep.__executeServer(opts));
var savePremiumOnboardingStep = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => premiumStepSchema.parse(input)).handler(savePremiumOnboardingStep_createServerFn_handler, async ({ data, context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { savePremiumStepImpl } = await import("./server-BNCCeHSG.mjs");
	return savePremiumStepImpl(data, context.supabase);
});
var deletePremiumOnboardingStep_createServerFn_handler = createServerRpc({
	id: "c728b0f85b61ceed12decd622d5942f3cd82fdfd3b70357dfbce52c4b1ec2e5f",
	name: "deletePremiumOnboardingStep",
	filename: "src/lib/onboarding/functions.ts"
}, (opts) => deletePremiumOnboardingStep.__executeServer(opts));
var deletePremiumOnboardingStep = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(deletePremiumOnboardingStep_createServerFn_handler, async ({ data, context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { deletePremiumStepImpl } = await import("./server-BNCCeHSG.mjs");
	return deletePremiumStepImpl(data.id, context.supabase);
});
var reorderPremiumOnboardingSteps_createServerFn_handler = createServerRpc({
	id: "8a30725712b7a5c1d0d1733b1b512c5fc4636852a404fdedf9c27a1a95717977",
	name: "reorderPremiumOnboardingSteps",
	filename: "src/lib/onboarding/functions.ts"
}, (opts) => reorderPremiumOnboardingSteps.__executeServer(opts));
var reorderPremiumOnboardingSteps = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ orderedIds: arrayType(stringType().uuid()).min(1).max(50) }).parse(input)).handler(reorderPremiumOnboardingSteps_createServerFn_handler, async ({ data, context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { reorderPremiumStepsImpl } = await import("./server-BNCCeHSG.mjs");
	return reorderPremiumStepsImpl(data.orderedIds, context.supabase);
});
//#endregion
export { completePremiumOnboarding_createServerFn_handler, deleteOnboardingStep_createServerFn_handler, deletePremiumOnboardingStep_createServerFn_handler, listAdminOnboardingSteps_createServerFn_handler, listAdminPremiumOnboardingSteps_createServerFn_handler, listOnboardingSteps_createServerFn_handler, listPremiumOnboardingSteps_createServerFn_handler, markOnboardingSeen_createServerFn_handler, reorderOnboardingSteps_createServerFn_handler, reorderPremiumOnboardingSteps_createServerFn_handler, resetOnboarding_createServerFn_handler, saveOnboardingStep_createServerFn_handler, savePremiumOnboardingStep_createServerFn_handler };
