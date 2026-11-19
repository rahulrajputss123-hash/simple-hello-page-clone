/**
 * Surveys Home Feed Server Functions
 * 
 * Fetch surveys for display on the home page (no quest context).
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { withServerTiming } from "@/lib/server-timing-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Fetch surveys for home page display.
 * Includes all enabled networks, converted to coins with exchange rate.
 */
export const fetchSurveysList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(
    withServerTiming("fetchSurveysList", async ({ context }) => {
      const { getRequest } = await import("@tanstack/react-start/server");
      const { detectIpFromRequest, detectCountryFromRequest } = await import("../offers/geo.server");
      const { fetchSurveyFeed: fetchSurveyFeedImpl, getSurveySettings } = await import(
        "./survey-feed.server"
      );

      // Check if surveys section is enabled
      const settings = await getSurveySettings();
      if (!settings.sectionEnabled) {
        return {
          surveys: [],
          networks: [],
        };
      }

      // Extract IP and country
      const request = getRequest();
      const ip = detectIpFromRequest();
      const countryCode = detectCountryFromRequest();
      const userAgent = request?.headers?.get("user-agent") || "Mozilla/5.0";

      if (!ip || !countryCode) {
        return {
          surveys: [],
          networks: [
            {
              network: "system",
              ok: false,
              count: 0,
              reason: "Unable to determine location",
            },
          ],
        };
      }

      // Get exchange rate and provider settings
      const [{ data: exchangeRate }, { data: providers }] = await Promise.all([
        supabaseAdmin
          .from("app_settings")
          .select("value")
          .eq("key", "exchange_rate")
          .maybeSingle(),
        supabaseAdmin
          .from("sdk_offerwall_providers")
          .select("slug, reward_multiplier")
          .in("slug", ["cpxresearch", "theoremreach", "timewall"]),
      ]);

      const rate = Number(exchangeRate?.value ?? 100);
      const multiplierBySlug = new Map(
        (providers ?? []).map((p: any) => [p.slug, p.reward_multiplier ?? 0.8]),
      );

      // Fetch user survey profile
      const { data: profileData } = await supabaseAdmin
        .from("user_survey_profiles")
        .select("birth_date, gender, postal_code, country_code, updated_at")
        .eq("user_id", context.userId)
        .maybeSingle();

      const profile = profileData
        ? {
            birthDate: profileData.birth_date,
            age: profileData.birth_date
              ? (() => {
                  const birth = new Date(profileData.birth_date);
                  const today = new Date();
                  let age = today.getFullYear() - birth.getFullYear();
                  const monthDiff = today.getMonth() - birth.getMonth();
                  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                    age--;
                  }
                  return age;
                })()
              : 0,
            gender: profileData.gender as "male" | "female",
            postalCode: profileData.postal_code || undefined,
            countryCode: profileData.country_code,
            updatedAt: profileData.updated_at,
          }
        : null;

      // Determine which networks to fetch based on settings
      const allowedNetworks: ("cpxresearch" | "theoremreach" | "timewall")[] = [];
      if (settings.cpxEnabled) allowedNetworks.push("cpxresearch");
      if (settings.theoremreachEnabled) allowedNetworks.push("theoremreach");
      if (settings.timewallEnabled) allowedNetworks.push("timewall");

      // Fetch surveys
      const result = await fetchSurveyFeedImpl({
        userId: context.userId,
        sessionId: "home", // Not tied to a quest session
        ip,
        countryCode,
        userAgent,
        allowedNetworks,
        profile,
      });

      // Add Timewall wall card if enabled
      const surveys = [...result.surveys];
      if (settings.timewallEnabled) {
        // Get Timewall provider app_id
        const { data: timewallProvider } = await supabaseAdmin
          .from("sdk_offerwall_providers")
          .select("app_id")
          .eq("slug", "timewall")
          .maybeSingle();

        if (timewallProvider?.app_id) {
          const timewallUrl = `https://timewall.io/users/login?oid=${timewallProvider.app_id}&uid=${encodeURIComponent(context.userId)}`;
          surveys.push({
            id: "timewall-wall",
            network: "timewall",
            title: "Browse surveys",
            payoutUsd: 0, // No per-card payout
            loi: 0,
            entryLink: timewallUrl,
          });
        }
      }

      // Convert USD to coins
      const surveysWithCoins = surveys.map((s) => {
        const multiplier =
          multiplierBySlug.get(s.network === "cpxresearch" ? "cpxresearch" : "theoremreach") ?? 0.8;
        const coins = Math.round(s.payoutUsd * rate * multiplier);

        return {
          id: s.id,
          network: s.network,
          title: s.network === "timewall" ? s.title : `${s.loi} min survey`,
          payoutCoins: coins,
          loi: s.loi,
          rating: s.rating,
          entryLink: s.entryLink,
        };
      });

      return {
        surveys: surveysWithCoins,
        networks: result.networks,
      };
    }),
  );
