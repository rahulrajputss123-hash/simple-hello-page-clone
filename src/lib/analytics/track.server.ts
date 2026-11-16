/**
 * Server-side analytics implementation
 * 
 * Validates and stores analytics events with:
 * - Event name allow-list enforcement
 * - Properties size validation (max 2KB per event)
 * - User ID from session
 * - Country detection from request headers
 * - Batch insert (up to 20 events)
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { detectCountryFromRequest } from "@/lib/offers/geo.server";

// Event name allow-list - only these events are accepted
const ALLOWED_EVENTS = new Set([
  "session_start",
  "page_view",
  "home_quest_view",
  "home_quest_click",
  "offer_list_view",
  "offer_click",
  "offer_started",
  "proof_screen_view",
  "proof_submit_attempt",
  "proof_submit_success",
  "proof_submit_error",
  "claim_status_view",
  "quest_start",
  "quest_complete",
  "wallet_view",
  "withdraw_view",
  "withdraw_submit",
  "app_background",
  "client_error",
]);

const MAX_EVENTS_PER_BATCH = 20;
const MAX_PROPERTIES_SIZE = 2048; // 2KB

interface IncomingEvent {
  event_name: string;
  properties: Record<string, unknown>;
  page: string;
  device: string;
}

interface TrackEventsPayload {
  anon_id: string | null;
  events: IncomingEvent[];
}

/**
 * Validate and insert analytics events
 * @param payload - Batch of events from client
 * @param userId - User ID from session (null for anonymous)
 * @returns Success status and any rejected events
 */
export async function trackEventsImpl(
  payload: TrackEventsPayload,
  userId: string | null
): Promise<{ ok: boolean; accepted: number; rejected: string[] }> {
  const rejected: string[] = [];
  const validEvents: Array<{
    event_name: string;
    user_id: string | null;
    anon_id: string | null;
    country: string | null;
    device: string | null;
    page: string | null;
    properties: Record<string, unknown>;
  }> = [];

  // Validate batch size
  if (!payload.events || payload.events.length === 0) {
    return { ok: false, accepted: 0, rejected: ["no events provided"] };
  }

  if (payload.events.length > MAX_EVENTS_PER_BATCH) {
    return {
      ok: false,
      accepted: 0,
      rejected: [`batch size exceeds maximum of ${MAX_EVENTS_PER_BATCH}`],
    };
  }

  // Get country from request headers
  const country = detectCountryFromRequest();

  // Validate each event
  for (const event of payload.events) {
    // Check event name is in allow-list
    if (!ALLOWED_EVENTS.has(event.event_name)) {
      rejected.push(`unknown event: ${event.event_name}`);
      continue;
    }

    // Validate properties size
    const propertiesJson = JSON.stringify(event.properties || {});
    if (propertiesJson.length > MAX_PROPERTIES_SIZE) {
      rejected.push(
        `${event.event_name}: properties exceed ${MAX_PROPERTIES_SIZE} bytes`
      );
      continue;
    }

    // Sanitize properties to ensure no PII leaked
    const sanitized = sanitizeProperties(event.properties || {});

    validEvents.push({
      event_name: event.event_name,
      user_id: userId,
      anon_id: payload.anon_id,
      country,
      device: event.device || null,
      page: event.page || null,
      properties: sanitized,
    });
  }

  // Insert valid events
  if (validEvents.length > 0) {
    const { error } = await supabaseAdmin.from("app_events").insert(validEvents);

    if (error) {
      console.error("[analytics] insert failed:", error);
      return {
        ok: false,
        accepted: 0,
        rejected: [...rejected, "database insert failed"],
      };
    }
  }

  return {
    ok: true,
    accepted: validEvents.length,
    rejected,
  };
}

/**
 * Server-side sanitization as an extra safety layer
 * Removes any keys that might contain PII
 */
function sanitizeProperties(
  properties: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  const blockedKeys = [
    "email",
    "phone",
    "password",
    "token",
    "secret",
    "key",
    "ip",
    "ipaddress",
    "ip_address",
    "authorization",
    "auth",
  ];

  for (const [key, value] of Object.entries(properties)) {
    const lowerKey = key.toLowerCase();

    // Skip blocked keys
    if (blockedKeys.some((blocked) => lowerKey.includes(blocked))) {
      continue;
    }

    // Skip if value looks like an email (simple heuristic)
    if (typeof value === "string") {
      if (value.includes("@") && value.includes(".")) {
        continue;
      }
      // Skip if value looks like a phone number (10+ digits)
      if (/\d{10,}/.test(value)) {
        continue;
      }
    }

    sanitized[key] = value;
  }

  return sanitized;
}
