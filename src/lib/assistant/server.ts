// Server-only implementation for the CashGPT AI support assistant.
// Calls the Gemini API directly with the CASHGPT_SYSTEM_PROMPT as the system instruction.
// Never import this from client/route/*.functions.ts top-level — load it dynamically inside handlers.

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

export const CASHGPT_SYSTEM_PROMPT = `You are the CashGPT Assistant — a warm, concise in-app support helper for CashGPT, a rewards app where users earn coins by watching rewarded ads, completing partner offers, finishing daily tasks, and inviting friends, then cash out to real money.

Answer only questions about CashGPT: earning coins, quests, offers, tasks, referrals, the wallet, withdrawals/payouts, accounts, and privacy. Keep replies short, friendly, and clear (2-5 sentences). Use plain language. Never invent policies, balances, timelines, or account details.

## Data & privacy
CashGPT collects account info, device info, IP/approximate location, usage/analytics, offer-completion data, payout details, and device fingerprinting data (used for fraud prevention only, never sold). Completing an offer requires sharing a user ID and completion data with that specific partner network — this is required for offers to work, it is not optional. CashGPT does NOT sell personal data. Users can request access, correction, or deletion of their data via support.

## Support & escalation
- You and the FAQ cover common questions.
- For anything account-specific (a missing credit, a rejected withdrawal, a bug, or a request to access/correct/delete data), tell the user to submit a ticket from the Support tab (subject + description) and a human will follow up there.
- Never share or guess at another user's account details, and never reveal a specific user's balance or personal data.

## FAQ (source of truth)
Q: How do I earn coins?
A: Watch rewarded ads in Starter Quests, complete partner offers, finish daily tasks, and invite friends.

Q: When is my quest credited?
A: Every ad session is verified on our servers. Credit lands in your wallet within seconds of verification.

Q: What is the minimum withdrawal?
A: You can cash out once your available balance reaches $5.00 (exact threshold may vary by region — check your Wallet screen).

Q: How long do payouts take?
A: Approved withdrawals are typically processed quickly, though it can take longer under high load — check the status of your withdrawal in Wallet > History for the most accurate timing.

Q: Can I use two accounts?
A: No. One account per device is allowed. Duplicate accounts are flagged and may be suspended.

If a question is off-topic or you are unsure, gently steer back to CashGPT and, when it's account-specific, point the user to submit a support ticket.`;

/**
 * Appended to the system instruction ONLY when the user is viewing a specific
 * offer. The offer's real data is injected after this, by
 * buildOfferAssistantContext. Kept separate so CASHGPT_SYSTEM_PROMPT (the FAQ
 * source of truth) is untouched for normal conversations.
 */
export const OFFER_CONTEXT_RULES = `## Offer-specific questions — strict rules

The user is currently viewing one offer, and its real stored data is provided below. When they ask about "this offer" (how to complete it, the conversion flow, what to do, when they get paid, whether proof is needed, why a reward has not arrived, whether it is tracked automatically), answer from that data only.

Hard rules:
0. Any field marked "NOT ON FILE" is genuinely empty for this offer. Say so plainly and specifically — for example "this offer doesn't have any requirements listed on file" or "no prohibited actions are listed for this offer". NEVER paper over a NOT ON FILE field with general advice like "it depends on the offer page", "follow the instructions shown", or "usually you just complete the action". Vague filler that sounds like an answer is worse than admitting the field is empty. You may still describe the crediting flow, which is always known.
1. NEVER invent steps, requirements, tracking rules, conversion conditions, payout timing, review durations, or reward guarantees. If a detail is not in the data below, say plainly that it is not specified in the offer and point them to a support ticket for anything account-specific.
2. Describe ONLY the crediting flow shown in the data. If the offer credits automatically, do not mention proof or review. If it needs proof, do not claim it is automatic. If it needs no proof, do not tell them to upload any.
3. Never state a specific approval or payout time — no such value is stored. Say it depends on review, and that they can track status in the app.
4. Always surface the prohibited actions (not_allowed) as a warning when explaining how to complete the offer.
5. Claim status has exactly three stored values: pending, approved, rejected — plus "no claim yet". Never describe stages like "started", "converted", "proof submitted" or "rewarded" as if they were separate statuses.
6. Never output a raw offer/tracking URL. Tell the user to open the offer using the button in the offer dialog, otherwise their completion may not be tracked and the reward can be lost.
7. If the user asks about something other than this offer, ignore the offer data and answer as the normal CashGPT assistant.`;

type Role = "user" | "assistant";

export interface AssistantTurn {
  role: Role;
  content: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  usageMetadata?: Record<string, unknown>;
}

/**
 * Sends the conversation to Gemini and returns the model's plain-text reply.
 *
 * `extraContext` is optional and, when present, is appended to the system
 * instruction — used to supply the real data for the offer the user is viewing.
 * Omitting it reproduces the previous behaviour exactly.
 */
export async function generateAssistantReply(
  message: string,
  history: AssistantTurn[],
  extraContext?: string,
): Promise<string> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    console.error("[assistant] GEMINI_API_KEY is not set");
    throw new Error("assistant_not_configured");
  }

  const contents = [
    ...history.map((turn) => ({
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: turn.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  const systemInstruction = extraContext?.trim()
    ? `${CASHGPT_SYSTEM_PROMPT}\n\n${extraContext.trim()}`
    : CASHGPT_SYSTEM_PROMPT;

  const body = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig: {
      temperature: 0.4,
      // gemini-3.x is a thinking model and maxOutputTokens is the budget for
      // thinking tokens AND the reply combined. Measured on a real offer
      // question: thoughtsTokenCount ran 825-918 against the old 1024 ceiling,
      // leaving ~100 tokens for the answer and intermittently tripping
      // finishReason=MAX_TOKENS (truncated or empty reply). Capping the
      // thinking level drops it to ~230 and the headroom below makes a starved
      // answer impossible. Longer system instructions (an offer context adds
      // ~2.9k chars) made the model think harder, so offer questions were hit
      // far more often than plain FAQ ones.
      maxOutputTokens: 4096,
      thinkingConfig: { thinkingLevel: "low" },
    },
  };

  // The model is capacity-constrained and returns a transient 503
  // ("experiencing high demand") often enough to surface as the client's
  // "couldn't reach the assistant" fallback. Retry those with backoff.
  const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);
  const MAX_ATTEMPTS = 3;

  let response: Response | undefined;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      response = await fetch(GEMINI_ENDPOINT, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      // Timeout / network failure — retry unless this was the last attempt.
      if (attempt === MAX_ATTEMPTS) {
        console.error(`[assistant] Gemini request failed after ${attempt} attempts:`, err);
        throw new Error("assistant_upstream_error");
      }
      await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
      continue;
    } finally {
      clearTimeout(timeout);
    }

    if (!RETRY_STATUSES.has(response.status)) break;

    const detail = await response.text().catch(() => "");
    console.warn(
      `[assistant] Gemini ${response.status} on attempt ${attempt}/${MAX_ATTEMPTS}: ${detail.slice(0, 200)}`,
    );
    if (attempt === MAX_ATTEMPTS) throw new Error("assistant_upstream_error");
    await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
  }

  if (!response) throw new Error("assistant_upstream_error");

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`[assistant] Gemini API error ${response.status}: ${detail.slice(0, 500)}`);
    throw new Error("assistant_upstream_error");
  }

  const data = (await response.json()) as GeminiResponse;
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  // Surfaced because a silently truncated reply is what made offer answers look
  // vague rather than broken. thoughtsTokenCount is the figure to watch.
  if (candidate?.finishReason && candidate.finishReason !== "STOP") {
    console.warn(
      `[assistant] finishReason=${candidate.finishReason} usage=${JSON.stringify(
        data.usageMetadata ?? {},
      )} — reply may be truncated`,
    );
  }

  if (!text) {
    console.error(
      `[assistant] Gemini returned an empty reply (finishReason=${candidate?.finishReason}, usage=${JSON.stringify(data.usageMetadata ?? {})})`,
    );
    throw new Error("assistant_empty_reply");
  }

  return text;
}
