/**
 * Survey Admin Settings
 * 
 * Manage survey section and network enable/disable switches from admin panel.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { withServerTiming } from "@/lib/server-timing-middleware";

const surveySettingsSchema = z.object({
  sectionEnabled: z.boolean(),
  cpxEnabled: z.boolean(),
  theoremreachEnabled: z.boolean(),
  timewallEnabled: z.boolean(),
});

export type SurveyAdminSettings = z.infer<typeof surveySettingsSchema>;

/**
 * Get survey admin settings (requires admin role).
 */
export const getSurveyAdminSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
    withServerTiming("getSurveyAdminSettings", async ({ context }) => {
      // Check admin role
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("app_role")
        .eq("user_id", context.userId)
        .single();

      if (profile?.app_role !== "admin") {
        throw new Error("Admin access required");
      }

      // Fetch settings from app_settings table
      const { data } = await supabaseAdmin
        .from("app_settings")
        .select("key, value")
        .in("key", [
          "survey_section_enabled",
          "cpx_enabled",
          "theoremreach_enabled",
          "timewall_enabled",
        ]);

      const settings = (data ?? []).reduce(
        (acc, row) => {
          acc[row.key as string] = row.value === "true" || row.value === true;
          return acc;
        },
        {} as Record<string, boolean>,
      );

      return {
        sectionEnabled: settings.survey_section_enabled ?? true,
        cpxEnabled: settings.cpx_enabled ?? true,
        theoremreachEnabled: settings.theoremreach_enabled ?? true,
        timewallEnabled: settings.timewall_enabled ?? true,
      };
    }),
  );

/**
 * Update survey admin settings (requires admin role).
 */
export const updateSurveyAdminSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => surveySettingsSchema.parse(input))
  .handler(
    withServerTiming("updateSurveyAdminSettings", async ({ data, context }) => {
      // Check admin role
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("app_role")
        .eq("user_id", context.userId)
        .single();

      if (profile?.app_role !== "admin") {
        throw new Error("Admin access required");
      }

      // Upsert each setting
      const settingsToUpdate = [
        { key: "survey_section_enabled", value: String(data.sectionEnabled) },
        { key: "cpx_enabled", value: String(data.cpxEnabled) },
        { key: "theoremreach_enabled", value: String(data.theoremreachEnabled) },
        { key: "timewall_enabled", value: String(data.timewallEnabled) },
      ];

      const { error } = await supabaseAdmin
        .from("app_settings")
        .upsert(settingsToUpdate, { onConflict: "key" });

      if (error) throw error;

      return { success: true };
    }),
  );
