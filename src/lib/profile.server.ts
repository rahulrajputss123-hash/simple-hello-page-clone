/**
 * Profile management server functions
 * Handles user profile updates including country tracking
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { detectCountryFromRequest } from "./offers/geo.server";

/**
 * Update user's country if it changed
 * Called on authenticated session load
 * Never blocks - fails silently if update fails
 */
export async function updateUserCountryIfChanged(userId: string): Promise<void> {
  try {
    const requestCountry = detectCountryFromRequest();
    
    // If no country detected, don't update
    if (!requestCountry) {
      return;
    }

    // Get current stored country
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("country")
      .eq("id", userId)
      .maybeSingle();

    // Update if different (or not set)
    if (profile && profile.country !== requestCountry) {
      await supabaseAdmin
        .from("profiles")
        .update({
          country: requestCountry,
          country_updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      
      console.log(`[profile] Updated country for user ${userId}: ${profile.country} -> ${requestCountry}`);
    }
  } catch (error) {
    // Never block on failure - just log
    console.error("[profile] Failed to update user country:", error);
  }
}

/**
 * Get user's country from profile
 * Used as fallback when request country is not available
 */
export async function getUserCountry(userId: string): Promise<string | null> {
  try {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("country")
      .eq("id", userId)
      .maybeSingle();
    
    return profile?.country ?? null;
  } catch (error) {
    console.error("[profile] Failed to get user country:", error);
    return null;
  }
}
