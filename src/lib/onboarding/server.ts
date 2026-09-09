import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ONBOARDING_TARGET_IDS } from "./targets";
import { DEFAULT_PREMIUM_STEPS, type PremiumOnboardingStep } from "./premium";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as unknown as { from: (t: string) => any };

export type OnboardingStepRow = {
  id: string;
  target_element_id: string;
  title: string;
  description: string;
  display_order: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

/** Authenticated read: enabled steps in display order. */
export async function listEnabledStepsImpl(): Promise<OnboardingStepRow[]> {
  const { data, error } = await db
    .from("onboarding_steps")
    .select("*")
    .eq("experience", "tour")
    .eq("enabled", true)
    .order("display_order", { ascending: true });
  if (error) throw new Error(error.message ?? "Could not load onboarding steps.");
  return data ?? [];
}

/** Admin: full list including disabled. */
export async function listAdminStepsImpl(): Promise<OnboardingStepRow[]> {
  const { data, error } = await db
    .from("onboarding_steps")
    .select("*")
    .eq("experience", "tour")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message ?? "Could not load onboarding steps.");
  return data ?? [];
}

export type OnboardingStepInput = {
  id?: string | undefined;
  targetElementId: string;
  title: string;
  description: string;
  displayOrder: number;
  enabled: boolean;
};

function assertKnownTarget(id: string) {
  if (!(ONBOARDING_TARGET_IDS as readonly string[]).includes(id)) {
    throw new Error(
      `Unknown target_element_id "${id}". Add the id to ONBOARDING_TARGETS in src/lib/onboarding/targets.ts first, and make sure the matching DOM element has that id attribute.`,
    );
  }
}

export async function saveOnboardingStepImpl(input: OnboardingStepInput) {
  assertKnownTarget(input.targetElementId);
  const row = {
    experience: "tour",
    target_element_id: input.targetElementId,
    title: input.title.trim(),
    description: input.description.trim(),
    display_order: Number.isFinite(input.displayOrder) ? input.displayOrder : 0,
    enabled: input.enabled,
  };
  if (input.id) {
    const { data, error } = await db
      .from("onboarding_steps")
      .update(row)
      .eq("id", input.id)
      .select("id")
      .single();
    if (error) throw new Error(error.message ?? "Could not save step.");
    return data;
  }
  const { data, error } = await db
    .from("onboarding_steps")
    .insert(row)
    .select("id")
    .single();
  if (error) throw new Error(error.message ?? "Could not create step.");
  return data;
}

export async function listPremiumStepsImpl(client = db): Promise<PremiumOnboardingStep[]> {
  const { data, error } = await client
    .from("onboarding_steps")
    .select("*")
    .eq("experience", "premium")
    .eq("enabled", true)
    .order("display_order", { ascending: true });
  if (error) return DEFAULT_PREMIUM_STEPS;
  return (data ?? []) as PremiumOnboardingStep[];
}

export async function listAdminPremiumStepsImpl(client = db): Promise<PremiumOnboardingStep[]> {
  const { data, error } = await client
    .from("onboarding_steps")
    .select("*")
    .eq("experience", "premium")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message ?? "Could not load premium onboarding steps.");
  return (data ?? []) as PremiumOnboardingStep[];
}

export type PremiumOnboardingStepInput = {
  id?: string | undefined;
  stepKey: string;
  title: string;
  subtitle: string;
  description: string;
  stepType: PremiumOnboardingStep["step_type"];
  ctaText: string;
  displayOrder: number;
  enabled: boolean;
  accentStyle: PremiumOnboardingStep["accent_style"];
  position: PremiumOnboardingStep["position"];
  illustration?: string | null | undefined;
  icon?: string | null | undefined;
};

export async function savePremiumStepImpl(input: PremiumOnboardingStepInput, client = db) {
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
    icon: input.icon ?? null,
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

export async function deletePremiumStepImpl(id: string, client = db) {
  const { error } = await client.from("onboarding_steps").delete().eq("id", id).eq("experience", "premium");
  if (error) throw new Error(error.message ?? "Could not delete premium step.");
  return { ok: true };
}

export async function reorderPremiumStepsImpl(orderedIds: string[], client = db) {
  for (let i = 0; i < orderedIds.length; i += 1) {
    const { error } = await client.from("onboarding_steps").update({ display_order: i + 1 }).eq("id", orderedIds[i]).eq("experience", "premium");
    if (error) throw new Error(error.message ?? "Could not reorder premium steps.");
  }
  return { ok: true };
}

export async function completePremiumOnboardingImpl(
  userId: string,
  values: { name: string; avatarId: string; gender?: string | undefined; dateOfBirth?: string | undefined },
  client = db,
) {
  const patch = {
    name: values.name.trim(),
    avatar_url: values.avatarId,
    ...(values.gender ? { gender: values.gender } : {}),
    ...(values.dateOfBirth ? { date_of_birth: values.dateOfBirth } : {}),
    onboarded: true,
    has_seen_onboarding: true,
  };
  const updated = await client.from("profiles").update(patch).eq("id", userId).select("*").single();
  if (!updated.error) return updated.data;

  // The core profile schema predates the optional premium fields. Keep first-run
  // completion resilient until the additive migration is applied in Supabase.
  const fallback = await client.from("profiles").update({ name: values.name.trim(), onboarded: true }).eq("id", userId).select("*").single();
  if (fallback.error) throw new Error("Could not save your profile. Please try again.");
  return fallback.data;
}

export async function deleteOnboardingStepImpl(id: string) {
  const { error } = await db.from("onboarding_steps").delete().eq("id", id);
  if (error) throw new Error(error.message ?? "Could not delete step.");
  return { ok: true };
}

export async function reorderOnboardingStepsImpl(orderedIds: string[]) {
  // Each id gets its new display_order = index + 1.
  for (let i = 0; i < orderedIds.length; i += 1) {
    const { error } = await db
      .from("onboarding_steps")
      .update({ display_order: i + 1 })
      .eq("id", orderedIds[i]);
    if (error) throw new Error(error.message ?? "Could not reorder steps.");
  }
  return { ok: true };
}

/** Mark the tour as seen for the given user. Never called for admin preview. */
export async function markOnboardingSeenImpl(userId: string) {
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ has_seen_onboarding: true } as never)
    .eq("id", userId);
  if (error) throw new Error(error.message ?? "Could not save.");
  return { ok: true };
}

/** "Replay" from the Support tab — flips the flag back to false. */
export async function resetOnboardingImpl(userId: string) {
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ has_seen_onboarding: false } as never)
    .eq("id", userId);
  if (error) throw new Error(error.message ?? "Could not reset.");
  return { ok: true };
}
