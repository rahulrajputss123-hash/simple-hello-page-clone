/**
 * Torox per-user click URL generation.
 * 
 * Torox click URLs MUST be generated at click time per user and cannot be
 * cached or reused. This server function:
 * 1. Loads the offer from DB and verifies it's a Torox offer
 * 2. Takes userId from authenticated session (never from client input)
 * 3. Determines user's country from profile or falls back to feed default
 * 4. Calls Torox click API with fresh credentials
 * 5. Returns the validated tracking URL
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { detectCountryFromRequest } from "@/lib/offers/geo.server";
import { logAutomation } from "@/lib/automation/logs.server";

const DEFAULT_API_BASE = "https://api.wall.torox.io";

const getToroxClickUrlSchema = z.object({
  offerId: z.string().uuid(),
});

export const getToroxClickUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => getToroxClickUrlSchema.parse(input))
  .handler(async ({ data: { offerId }, context }) => {
    const userId = context.userId;

    // 1. Load offer and verify it's Torox
    const offerQuery = await supabaseAdmin
      .from("offers")
      .select("id, title, external_offer_id, is_active, offer_providers!inner(slug)")
      .eq("id", offerId)
      .eq("offer_providers.slug", "torox")
      .maybeSingle();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const offer = offerQuery.data as any;
    
    if (!offer) {
      await logAutomation({
        eventType: "offer_click",
        status: "error",
        source: "torox_click_url",
        userId,
        message: "Torox offer not found or not a Torox offer",
        context: { offerId },
      });
      throw new Error("Offer not found or not available.");
    }

    if (!offer.is_active) {
      await logAutomation({
        eventType: "offer_click",
        status: "warning",
        source: "torox_click_url",
        userId,
        referenceId: offerId,
        message: "Torox offer is inactive",
        context: { title: offer.title },
      });
      throw new Error("This offer is no longer available.");
    }

    const campaignId = String(offer.external_offer_id ?? "").trim();
    if (!campaignId) {
      await logAutomation({
        eventType: "offer_click",
        status: "error",
        source: "torox_click_url",
        userId,
        referenceId: offerId,
        message: "Torox offer missing external_offer_id",
        context: { title: offer.title },
      });
      throw new Error("Offer configuration error.");
    }

    // 2. Get user's country from request headers (or default to "US")
    const userCountry = detectCountryFromRequest() ?? "US";

    // 3. Call Torox click API
    const sourceId = (process.env["TOROX_FEED_SOURCE_ID"] ?? "").trim();
    const token = (process.env["TOROX_FEED_TOKEN"] ?? "").trim();
    const apiBase = (process.env["TOROX_API_BASE"] ?? DEFAULT_API_BASE).trim();

    if (!sourceId || !token) {
      await logAutomation({
        eventType: "offer_click",
        status: "error",
        source: "torox_click_url",
        userId,
        referenceId: offerId,
        message: "Torox credentials not configured",
        context: { title: offer.title },
      });
      throw new Error("Service temporarily unavailable.");
    }

    const url = new URL(`${apiBase}/partner/user/click`);
    url.searchParams.set("source_id", sourceId);
    url.searchParams.set("token", token);
    url.searchParams.set("uid", userId);
    url.searchParams.set("geo", userCountry);
    url.searchParams.set("campaign_id", campaignId);

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(10000),
      });
    } catch (err) {
      await logAutomation({
        eventType: "offer_click",
        status: "error",
        source: "torox_click_url",
        userId,
        referenceId: offerId,
        message: `Torox click API network error: ${err instanceof Error ? err.message : "unknown"}`,
        context: { title: offer.title, campaignId },
      });
      throw new Error("Could not generate tracking link. Please try again.");
    }

    if (!response.ok) {
      const text = await response.text();
      await logAutomation({
        eventType: "offer_click",
        status: "error",
        source: "torox_click_url",
        userId,
        referenceId: offerId,
        message: `Torox click API error (${response.status})`,
        context: { title: offer.title, campaignId, error: text.slice(0, 200) },
      });
      throw new Error("Could not generate tracking link. Please try again.");
    }

    // Parse response
    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      await logAutomation({
        eventType: "offer_click",
        status: "error",
        source: "torox_click_url",
        userId,
        referenceId: offerId,
        message: "Torox click API returned non-JSON",
        context: { 
          title: offer.title, 
          campaignId, 
          httpStatus: response.status,
          contentType: response.headers.get("content-type"),
          responseBody: text.slice(0, 500)
        },
      });
      throw new Error("Invalid response from tracking service.");
    }

    // Extract click URL (try multiple field names and nested paths)
    let clickUrl = "";
    if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;
      
      // Try top-level fields first
      clickUrl = String(obj.url ?? obj.click_url ?? obj.tracking_url ?? obj.redirect_url ?? "").trim();
      
      // Try nested data.url pattern
      if (!clickUrl && obj.data && typeof obj.data === "object") {
        const data = obj.data as Record<string, unknown>;
        clickUrl = String(data.url ?? data.click_url ?? data.tracking_url ?? data.redirect_url ?? "").trim();
      }
      
      // Try nested result.url pattern
      if (!clickUrl && obj.result && typeof obj.result === "object") {
        const result = obj.result as Record<string, unknown>;
        clickUrl = String(result.url ?? result.click_url ?? result.tracking_url ?? result.redirect_url ?? "").trim();
      }
    }

    // Validate it's a proper HTTPS URL
    if (!clickUrl || !clickUrl.startsWith("https://")) {
      // Log the raw response body and available keys for debugging (no token)
      const availableKeys = parsed && typeof parsed === "object" ? Object.keys(parsed) : [];
      const nestedKeys = parsed && typeof parsed === "object" ? 
        Object.entries(parsed as Record<string, unknown>)
          .filter(([_, v]) => v && typeof v === "object")
          .map(([k, v]) => `${k}:${Object.keys(v as Record<string, unknown>).join(",")}`)
        : [];
      
      await logAutomation({
        eventType: "offer_click",
        status: "error",
        source: "torox_click_url",
        userId,
        referenceId: offerId,
        message: "Torox click API returned invalid or missing URL",
        context: { 
          title: offer.title, 
          campaignId, 
          clickUrl: clickUrl || "(empty)",
          httpStatus: response.status,
          responseBody: text.slice(0, 500),
          topLevelKeys: availableKeys,
          nestedStructure: nestedKeys
        },
      });
      throw new Error("Invalid tracking link received. The offer may not be available in your region.");
    }

    // Log success
    await logAutomation({
      eventType: "offer_click",
      status: "success",
      source: "torox_click_url",
      userId,
      referenceId: offerId,
      message: `Generated Torox click URL for ${offer.title}`,
      context: { campaignId },
    });

    return { clickUrl };
  });
