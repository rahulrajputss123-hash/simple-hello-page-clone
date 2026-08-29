import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ONBOARDING_TARGET_IDS } from "./targets";

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
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message ?? "Could not load onboarding steps.");
  return data ?? [];
}

export type OnboardingStepInput = {
  id?: string;
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
