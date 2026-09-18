import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const turnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
});

const chatInput = z.object({
  message: z.string().trim().min(1).max(2000),
  history: z.array(turnSchema).max(12).default([]),
  /**
   * Optional id of the offer the user is currently viewing. Only the id is
   * accepted — the offer's facts are loaded server-side so the client can never
   * feed the model made-up offer data.
   */
  offerId: z.string().uuid().nullable().optional(),
});

/**
 * Authenticated: sends a user message + short conversation history to Gemini
 * (with CASHGPT_SYSTEM_PROMPT as the system instruction) and returns the reply.
 *
 * When `offerId` is supplied, the real offer row (plus this user's own claim) is
 * loaded and appended to the system instruction so offer-specific questions are
 * answered from stored data. Without it, behaviour is unchanged.
 */
export const sendAssistantMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => chatInput.parse(input))
  .handler(async ({ data, context }) => {
    const { generateAssistantReply, OFFER_CONTEXT_RULES } = await import("./assistant/server");

    let extraContext: string | undefined;
    if (data.offerId) {
      const { buildOfferAssistantContext } = await import("./assistant/offer-context.server");
      // Scoped to the caller's own user id, so the claim status can only ever be
      // their own. A missing/unknown offer just yields no context.
      const offerContext = await buildOfferAssistantContext(data.offerId, context.userId);
      if (offerContext) {
        extraContext = `${OFFER_CONTEXT_RULES}\n\n${offerContext.promptBlock}`;
      }
    }

    const reply = await generateAssistantReply(data.message, data.history, extraContext);
    return { reply };
  });
