/**
 * Survey Profile Server Functions
 * 
 * Handle demographic profile data for survey targeting.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { withServerTiming } from "@/lib/server-timing-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Postal code validation patterns per country
const POSTAL_CODE_PATTERNS: Record<string, RegExp> = {
  US: /^\d{5}(-\d{4})?$/, // 12345 or 12345-6789
  IN: /^\d{6}$/, // 110001
  GB: /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i, // SW1A 1AA
  CA: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i, // K1A 0B1
  AU: /^\d{4}$/, // 2000
  // Add more as needed
};

const surveyProfileSchema = z.object({
  age: z.number().int().min(1).max(99),
  gender: z.enum(["male", "female"]),
  postalCode: z.string().trim().min(1).max(20),
  countryCode: z
    .string()
    .trim()
    .length(2)
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "Must be ISO 3166-1 alpha-2 code"),
});

export type SurveyProfile = z.infer<typeof surveyProfileSchema>;

/**
 * Validate postal code format for a specific country.
 */
function validatePostalCode(code: string, country: string): boolean {
  const pattern = POSTAL_CODE_PATTERNS[country];
  if (!pattern) {
    // Unknown country - allow any non-empty string
    return code.trim().length > 0;
  }
  return pattern.test(code);
}

/**
 * Get the user's survey profile (if it exists).
 */
export const getSurveyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
    withServerTiming("getSurveyProfile", async ({ context }) => {
      const { data, error } = await supabaseAdmin
        .from("user_survey_profiles")
        .select("age, gender, postal_code, country_code, updated_at")
        .eq("user_id", context.userId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        age: data.age,
        gender: data.gender as "male" | "female",
        postalCode: data.postal_code,
        countryCode: data.country_code,
        updatedAt: data.updated_at,
      };
    }),
  );

/**
 * Save or update the user's survey profile.
 */
export const saveSurveyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => surveyProfileSchema.parse(input))
  .handler(
    withServerTiming("saveSurveyProfile", async ({ data, context }) => {
      // Validate postal code format
      if (!validatePostalCode(data.postalCode, data.countryCode)) {
        throw new Error(`Invalid postal code format for ${data.countryCode}`);
      }

      // Upsert profile
      const { error } = await supabaseAdmin
        .from("user_survey_profiles")
        .upsert(
          {
            user_id: context.userId,
            age: data.age,
            gender: data.gender,
            postal_code: data.postalCode,
            country_code: data.countryCode,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

      if (error) throw error;

      return { success: true };
    }),
  );
