import { i as createServerFn } from "./server-CpGMOUrW.mjs";
import { t as createSsrRpc } from "./createSsrRpc-Bbq2Yr9O.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Br_KWlRY.mjs";
import { i as enumType, l as stringType, n as arrayType, o as numberType, r as booleanType, s as objectType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/functions-BCv4WNrg.js
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
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("7dbe2a7021154b399e2c4f6b2b4c273b977d16e1e1b849b8d34f27a33ed0d8b4"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("365d505f98cca490b53272ba65f7c16773018ffdc3a553dae769fc794682cf6a"));
/** Authenticated: replay the tour (used by the Support tab). */
var resetOnboarding = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("fefcfd4e8a70d37ac0e158de80e94fa549f634d02f3a28839111921fc497e5f3"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("4288710aedd7d76a93f035c8631ebd30aa656bf9b529b165eee4fef6d591d88b"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid().optional(),
	targetElementId: stringType().trim().min(1).max(100),
	title: stringType().trim().min(1).max(120),
	description: stringType().trim().max(500).default(""),
	displayOrder: numberType().int().min(0).max(999).default(0),
	enabled: booleanType().default(true)
}).parse(input)).handler(createSsrRpc("e383da82562c26cb29a2ee24a884c3d41100a5fbd1571397ad596a0302416a72"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(createSsrRpc("8a3d968e2cc71e21d8934bfbeeea434bdca38f8e429b512d31dfc807c293368f"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ orderedIds: arrayType(stringType().uuid()).min(1).max(50) }).parse(input)).handler(createSsrRpc("944a5ed7b9016b55c61355fb35c621b0a61b04ad2c0de5ccc0e2e9dba1371ebf"));
/** Authenticated: fetch the premium onboarding flow. */
var listPremiumOnboardingSteps = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("89e3d1144746874336c39944d1dff530622453baa14793b025ed752614349d6f"));
/** Authenticated: persist profile setup and premium onboarding completion. */
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
}).parse(input)).handler(createSsrRpc("ecfc9be8a178bbd3051df2187dd55031b3f9de3b01120cba5c708c40e41c4bf9"));
/** Admin: full premium flow including disabled steps. */
var listAdminPremiumOnboardingSteps = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("0417a07bdddc5b0bdddf084f3faf3d3f45989a08c56a391f58836aeb1e5d3f2d"));
var savePremiumOnboardingStep = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => premiumStepSchema.parse(input)).handler(createSsrRpc("af5bf14ea3c5519c183a7ad1cba980e33a0d632f9f01e9d6c2aa5b66063b7f1a"));
var deletePremiumOnboardingStep = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(createSsrRpc("c728b0f85b61ceed12decd622d5942f3cd82fdfd3b70357dfbce52c4b1ec2e5f"));
var reorderPremiumOnboardingSteps = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ orderedIds: arrayType(stringType().uuid()).min(1).max(50) }).parse(input)).handler(createSsrRpc("8a30725712b7a5c1d0d1733b1b512c5fc4636852a404fdedf9c27a1a95717977"));
//#endregion
export { reorderPremiumOnboardingSteps as a, listPremiumOnboardingSteps as i, deletePremiumOnboardingStep as n, resetOnboarding as o, listAdminPremiumOnboardingSteps as r, savePremiumOnboardingStep as s, completePremiumOnboarding as t };
