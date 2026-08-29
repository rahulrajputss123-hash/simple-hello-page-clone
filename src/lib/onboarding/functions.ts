import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
