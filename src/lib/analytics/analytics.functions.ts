/**
 * Analytics server functions for admin dashboard
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Get funnel analysis for admin dashboard */
export const getFunnelAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        fromDate: z.string(),
        toDate: z.string(),
        country: z.string().optional().nullable(),
      })
      .parse(input)
  )
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("@/lib/admin-audit.server");
    await requireRole(context.userId, ["admin"]);

    const { getFunnelImpl } = await import("./funnel.server");
    return getFunnelImpl(data.fromDate, data.toDate, data.country);
  });

/** Get top client errors for admin dashboard */
export const getTopClientErrors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        fromDate: z.string(),
        toDate: z.string(),
        country: z.string().optional().nullable(),
        limit: z.number().min(1).max(50).optional(),
      })
      .parse(input)
  )
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("@/lib/admin-audit.server");
    await requireRole(context.userId, ["admin"]);

    const { getTopClientErrorsImpl } = await import("./funnel.server");
    return getTopClientErrorsImpl(data.fromDate, data.toDate, data.country, data.limit);
  });

/** Get top proof errors for admin dashboard */
export const getTopProofErrors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        fromDate: z.string(),
        toDate: z.string(),
        country: z.string().optional().nullable(),
        limit: z.number().min(1).max(50).optional(),
      })
      .parse(input)
  )
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("@/lib/admin-audit.server");
    await requireRole(context.userId, ["admin"]);

    const { getTopProofErrorsImpl } = await import("./funnel.server");
    return getTopProofErrorsImpl(data.fromDate, data.toDate, data.country, data.limit);
  });
