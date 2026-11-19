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
 * Get survey admin settings.
 */
export const getSurveyAdminSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
    withServerTiming("getSurveyAdminSettings", async () => {
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

      // Initialize missing settings with defaults
      const defaults = {
        sectionEnabled: settings.survey_section_enabled ?? true,
        cpxEnabled: settings.cpx_enabled ?? true,
        theoremreachEnabled: settings.theoremreach_enabled ?? true,
        timewallEnabled: settings.timewall_enabled ?? true,
      };

      // If any settings are missing, insert them
      const missingSettings: { key: string; value: string }[] = [];
      if (!data?.find((s) => s.key === "survey_section_enabled")) {
        missingSettings.push({ key: "survey_section_enabled", value: "true" });
      }
      if (!data?.find((s) => s.key === "cpx_enabled")) {
        missingSettings.push({ key: "cpx_enabled", value: "true" });
      }
      if (!data?.find((s) => s.key === "theoremreach_enabled")) {
        missingSettings.push({ key: "theoremreach_enabled", value: "true" });
      }
      if (!data?.find((s) => s.key === "timewall_enabled")) {
        missingSettings.push({ key: "timewall_enabled", value: "true" });
      }

      if (missingSettings.length > 0) {
        await supabaseAdmin.from("app_settings").insert(missingSettings);
      }

      return defaults;
    }),
  );

/**
 * Update survey admin settings.
 */
export const updateSurveyAdminSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => {
    console.log("Validating input:", input);
    try {
      const result = surveySettingsSchema.parse(input);
      console.log("Validation passed:", result);
      return result;
    } catch (error) {
      console.error("Validation failed:", error);
      throw error;
    }
  })
  .handler(
    withServerTiming("updateSurveyAdminSettings", async ({ data }) => {
      console.log("Updating survey settings with data:", data);
      
      // Upsert each setting
      const settingsToUpdate = [
        { key: "survey_section_enabled", value: String(data.sectionEnabled) },
        { key: "cpx_enabled", value: String(data.cpxEnabled) },
        { key: "theoremreach_enabled", value: String(data.theoremreachEnabled) },
        { key: "timewall_enabled", value: String(data.timewallEnabled) },
      ];

      console.log("Upserting settings:", settingsToUpdate);

      const { error } = await supabaseAdmin
        .from("app_settings")
        .upsert(settingsToUpdate, { onConflict: "key" });

      if (error) {
        console.error("Upsert error:", error);
        throw error;
      }

      console.log("Survey settings updated successfully");
      return { success: true };
    }),
  );
