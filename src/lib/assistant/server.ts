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

type Role = "user" | "assistant";

export interface AssistantTurn {
  role: Role;
  content: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
}

/** Sends the conversation to Gemini and returns the model's plain-text reply. */
export async function generateAssistantReply(
  message: string,
  history: AssistantTurn[],
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

  const body = {
    system_instruction: { parts: [{ text: CASHGPT_SYSTEM_PROMPT }] },
    contents,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1024,
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  let response: Response;
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
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`[assistant] Gemini API error ${response.status}: ${detail.slice(0, 500)}`);
    throw new Error("assistant_upstream_error");
  }

  const data = (await response.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    console.error("[assistant] Gemini returned an empty reply");
    throw new Error("assistant_empty_reply");
  }

  return text;
}
