import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const premiumStepSchema = z.object({
  id: z.string().uuid().optional(),
  stepKey: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().max(180).default(""),
  description: z.string().trim().max(500).default(""),
  stepType: z.enum(["welcome", "avatar", "profile", "showcase", "celebration"]),
  ctaText: z.string().trim().max(80).default("Next →"),
  displayOrder: z.number().int().min(0).max(999).default(0),
  enabled: z.boolean().default(true),
  accentStyle: z.enum(["gold", "jade"]).default("gold"),
  position: z.enum(["center", "bottom"]).default("bottom"),
  illustration: z.string().trim().max(120).nullable().optional(),
  icon: z.string().trim().max(80).nullable().optional(),
});

/** Public/authenticated: fetch enabled steps in display order. */
export const listOnboardingSteps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { listEnabledStepsImpl } = await import("./server");
    return listEnabledStepsImpl();
  });

/** Authenticated: mark the current user's tour as complete. */
export const markOnboardingSeen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { markOnboardingSeenImpl } = await import("./server");
    return markOnboardingSeenImpl(context.userId);
  });

/** Authenticated: replay the tour (used by the Support tab). */
export const resetOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resetOnboardingImpl } = await import("./server");
    return resetOnboardingImpl(context.userId);
  });

/** Admin: full list including disabled. */
export const listAdminOnboardingSteps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("../coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { listAdminStepsImpl } = await import("./server");
    return listAdminStepsImpl();
  });

export const saveOnboardingStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        targetElementId: z.string().trim().min(1).max(100),
        title: z.string().trim().min(1).max(120),
        description: z.string().trim().max(500).default(""),
        displayOrder: z.number().int().min(0).max(999).default(0),
        enabled: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("../coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { saveOnboardingStepImpl } = await import("./server");
    return saveOnboardingStepImpl(data);
  });

export const deleteOnboardingStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("../coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { deleteOnboardingStepImpl } = await import("./server");
    return deleteOnboardingStepImpl(data.id);
  });

export const reorderOnboardingSteps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ orderedIds: z.array(z.string().uuid()).min(1).max(50) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("../coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { reorderOnboardingStepsImpl } = await import("./server");
    return reorderOnboardingStepsImpl(data.orderedIds);
  });

/** Authenticated: fetch the premium onboarding flow. */
export const listPremiumOnboardingSteps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listPremiumStepsImpl } = await import("./server");
    return listPremiumStepsImpl(context.supabase as never);
  });

/** Authenticated: persist profile setup and premium onboarding completion. */
export const completePremiumOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().trim().min(2).max(80),
        avatarId: z.string().trim().min(1).max(80),
        gender: z.enum(["female", "male", "non_binary", "prefer_not_to_say"]).optional(),
        dateOfBirth: z.string().date().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { completePremiumOnboardingImpl } = await import("./server");
    return completePremiumOnboardingImpl(context.userId, data, context.supabase as never);
  });

/** Admin: full premium flow including disabled steps. */
export const listAdminPremiumOnboardingSteps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("../coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { listAdminPremiumStepsImpl } = await import("./server");
    return listAdminPremiumStepsImpl(context.supabase as never);
  });

export const savePremiumOnboardingStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => premiumStepSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("../coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { savePremiumStepImpl } = await import("./server");
    return savePremiumStepImpl(data, context.supabase as never);
  });

export const deletePremiumOnboardingStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("../coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { deletePremiumStepImpl } = await import("./server");
    return deletePremiumStepImpl(data.id, context.supabase as never);
  });

export const reorderPremiumOnboardingSteps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ orderedIds: z.array(z.string().uuid()).min(1).max(50) }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("../coinquest.server");
    await assertAdmin(context.supabase, context.userId);
    const { reorderPremiumStepsImpl } = await import("./server");
    return reorderPremiumStepsImpl(data.orderedIds, context.supabase as never);
  });
