import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
import { n as DEFAULT_PREMIUM_STEPS } from "./premium-BIRn1NQB.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/server-BNCCeHSG.js
init_client_server();
var ONBOARDING_TARGET_IDS = [
	{
		id: "tour-wallet-balance",
		label: "Wallet balance pill (header)",
		location: "AppHeader — links to /wallet, shows the live balance in gold."
	},
	{
		id: "tour-starter-quests",
		label: "Starter Quests section (home)",
		location: "Home page — the ads-for-cash Starter Quests row above Featured Offers."
	},
	{
		id: "tour-featured-offers",
		label: "Featured Offers section (home)",
		location: "Home page — the featured offer cards below the Starter Quests."
	}
].map((t) => t.id);
var db = supabaseAdmin;
/** Authenticated read: enabled steps in display order. */
async function listEnabledStepsImpl() {
	const { data, error } = await db.from("onboarding_steps").select("*").eq("experience", "tour").eq("enabled", true).order("display_order", { ascending: true });
	if (error) throw new Error(error.message ?? "Could not load onboarding steps.");
	return data ?? [];
}
/** Admin: full list including disabled. */
async function listAdminStepsImpl() {
	const { data, error } = await db.from("onboarding_steps").select("*").eq("experience", "tour").order("display_order", { ascending: true }).order("created_at", { ascending: true });
	if (error) throw new Error(error.message ?? "Could not load onboarding steps.");
	return data ?? [];
}
function assertKnownTarget(id) {
	if (!ONBOARDING_TARGET_IDS.includes(id)) throw new Error(`Unknown target_element_id "${id}". Add the id to ONBOARDING_TARGETS in src/lib/onboarding/targets.ts first, and make sure the matching DOM element has that id attribute.`);
}
async function saveOnboardingStepImpl(input) {
	assertKnownTarget(input.targetElementId);
	const row = {
		experience: "tour",
		target_element_id: input.targetElementId,
		title: input.title.trim(),
		description: input.description.trim(),
		display_order: Number.isFinite(input.displayOrder) ? input.displayOrder : 0,
		enabled: input.enabled
	};
	if (input.id) {
		const { data, error } = await db.from("onboarding_steps").update(row).eq("id", input.id).select("id").single();
		if (error) throw new Error(error.message ?? "Could not save step.");
		return data;
	}
	const { data, error } = await db.from("onboarding_steps").insert(row).select("id").single();
	if (error) throw new Error(error.message ?? "Could not create step.");
	return data;
}
async function listPremiumStepsImpl(client = db) {
	const { data, error } = await client.from("onboarding_steps").select("*").eq("experience", "premium").eq("enabled", true).order("display_order", { ascending: true });
	if (error) return DEFAULT_PREMIUM_STEPS;
	return data ?? [];
}
async function listAdminPremiumStepsImpl(client = db) {
	const { data, error } = await client.from("onboarding_steps").select("*").eq("experience", "premium").order("display_order", { ascending: true }).order("created_at", { ascending: true });
	if (error) throw new Error(error.message ?? "Could not load premium onboarding steps.");
	return data ?? [];
}
async function savePremiumStepImpl(input, client = db) {
	const row = {
		experience: "premium",
		target_element_id: "premium-onboarding",
		step_key: input.stepKey.trim(),
		title: input.title.trim(),
		subtitle: input.subtitle.trim(),
		description: input.description.trim(),
		step_type: input.stepType,
		cta_text: input.ctaText.trim() || "Next →",
		display_order: input.displayOrder,
		enabled: input.enabled,
		accent_style: input.accentStyle,
		position: input.position,
		illustration: input.illustration ?? null,
		icon: input.icon ?? null
	};
	if (input.id) {
		const { data, error } = await client.from("onboarding_steps").update(row).eq("id", input.id).select("*").single();
		if (error) throw new Error(error.message ?? "Could not save premium step.");
		return data;
	}
	const { data, error } = await client.from("onboarding_steps").insert(row).select("*").single();
	if (error) throw new Error(error.message ?? "Could not create premium step.");
	return data;
}
async function deletePremiumStepImpl(id, client = db) {
	const { error } = await client.from("onboarding_steps").delete().eq("id", id).eq("experience", "premium");
	if (error) throw new Error(error.message ?? "Could not delete premium step.");
	return { ok: true };
}
async function reorderPremiumStepsImpl(orderedIds, client = db) {
	for (let i = 0; i < orderedIds.length; i += 1) {
		const { error } = await client.from("onboarding_steps").update({ display_order: i + 1 }).eq("id", orderedIds[i]).eq("experience", "premium");
		if (error) throw new Error(error.message ?? "Could not reorder premium steps.");
	}
	return { ok: true };
}
async function completePremiumOnboardingImpl(userId, values, client = db) {
	const patch = {
		name: values.name.trim(),
		avatar_url: values.avatarId,
		...values.gender ? { gender: values.gender } : {},
		...values.dateOfBirth ? { date_of_birth: values.dateOfBirth } : {},
		onboarded: true,
		has_seen_onboarding: true
	};
	const updated = await client.from("profiles").update(patch).eq("id", userId).select("*").single();
	if (!updated.error) return updated.data;
	const fallback = await client.from("profiles").update({
		name: values.name.trim(),
		onboarded: true
	}).eq("id", userId).select("*").single();
	if (fallback.error) throw new Error("Could not save your profile. Please try again.");
	return fallback.data;
}
async function deleteOnboardingStepImpl(id) {
	const { error } = await db.from("onboarding_steps").delete().eq("id", id);
	if (error) throw new Error(error.message ?? "Could not delete step.");
	return { ok: true };
}
async function reorderOnboardingStepsImpl(orderedIds) {
	for (let i = 0; i < orderedIds.length; i += 1) {
		const { error } = await db.from("onboarding_steps").update({ display_order: i + 1 }).eq("id", orderedIds[i]);
		if (error) throw new Error(error.message ?? "Could not reorder steps.");
	}
	return { ok: true };
}
/** Mark the tour as seen for the given user. Never called for admin preview. */
async function markOnboardingSeenImpl(userId) {
	const { error } = await supabaseAdmin.from("profiles").update({ has_seen_onboarding: true }).eq("id", userId);
	if (error) throw new Error(error.message ?? "Could not save.");
	return { ok: true };
}
/** "Replay" from the Support tab — flips the flag back to false. */
async function resetOnboardingImpl(userId) {
	const { error } = await supabaseAdmin.from("profiles").update({ has_seen_onboarding: false }).eq("id", userId);
	if (error) throw new Error(error.message ?? "Could not reset.");
	return { ok: true };
}
//#endregion
export { completePremiumOnboardingImpl, deleteOnboardingStepImpl, deletePremiumStepImpl, listAdminPremiumStepsImpl, listAdminStepsImpl, listEnabledStepsImpl, listPremiumStepsImpl, markOnboardingSeenImpl, reorderOnboardingStepsImpl, reorderPremiumStepsImpl, resetOnboardingImpl, saveOnboardingStepImpl, savePremiumStepImpl };
