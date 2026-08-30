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
});

/**
 * Authenticated: sends a user message + short conversation history to Gemini
 * (with CASHGPT_SYSTEM_PROMPT as the system instruction) and returns the reply.
 */
export const sendAssistantMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => chatInput.parse(input))
  .handler(async ({ data }) => {
    const { generateAssistantReply } = await import("./assistant/server");
    const reply = await generateAssistantReply(data.message, data.history);
    return { reply };
  });
