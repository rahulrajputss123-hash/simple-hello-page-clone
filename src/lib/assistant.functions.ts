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
    const { buildOfferAssistantContext, resolveOfferIdFromMessage } =
      await import("./assistant/offer-context.server");

    // Resolution order, deliberately: a name typed in the MESSAGE wins over the
    // offer in context. Someone with offer A on screen who types offer B's name
    // is asking about B, so the chip must not override them. resolveOfferIdFrom-
    // Message is conservative (needs a distinctive 6+ char title word, refuses
    // to guess on ties, and ignores question words), so ordinary questions like
    // "how do I complete this offer" resolve to nothing and the in-context offer
    // is used as before.
    const contextOfferId = data.offerId ?? null;
    const namedOfferId = await resolveOfferIdFromMessage(data.message);
    const offerId = namedOfferId ?? contextOfferId;

    if (namedOfferId && contextOfferId && namedOfferId !== contextOfferId) {
      console.info(
        `[assistant] message names offer ${namedOfferId}, overriding the in-context offer ${contextOfferId}`,
      );
    } else if (namedOfferId && !contextOfferId) {
      console.info(`[assistant] resolved offer ${namedOfferId} from the message text`);
    }

    let extraContext: string | undefined;
    if (offerId) {
      // Scoped to the caller's own user id, so the claim status can only ever be
      // their own. A missing/unknown offer just yields no context.
      const offerContext = await buildOfferAssistantContext(offerId, context.userId);
      if (offerContext) {
        extraContext = `${OFFER_CONTEXT_RULES}\n\n${offerContext.promptBlock}`;
        console.info(
          `[assistant] offer context attached: ${offerContext.offerId} (${offerContext.conversionMode}), ${extraContext.length} chars`,
        );
      } else {
        // The only silent way to lose offer-awareness: a valid uuid that has no
        // row in `offers`. Logged so it can never look like a model problem.
        console.warn(
          `[assistant] offerId ${offerId} returned no context (no matching offers row) — answering without offer data`,
        );
      }
    }

    const reply = await generateAssistantReply(data.message, data.history, extraContext);
    return { reply };
  });
