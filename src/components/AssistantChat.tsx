import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LifeBuoy, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { sendAssistantMessage } from "@/lib/assistant.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const FALLBACK_REPLY =
  "Sorry — I couldn't reach the assistant just now. Please try again or open a support ticket below and a human will follow up.";

const WELCOME =
  "Hi! I'm the CashGPT Assistant 🪙 Ask me about earning coins, quests, offers, payouts, or your wallet.";

const QUICK_REPLIES = [
  { label: "How do I earn coins?", question: "How do I earn coins?" },
  { label: "Minimum withdrawal?", question: "What is the minimum withdrawal?" },
  { label: "Payout time?", question: "How long do payouts take?" },
  { label: "KYC & verification", question: "Why do I need KYC and how does verification work?" },
];

const OPENED_KEY = "cashgpt.assistant.opened";

type Role = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
}

function newId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Mascot avatar — the CashGPT coin mascot, reused across the card, header, and bubble. */
export function AssistantMascot({ className = "" }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-grid place-items-center overflow-hidden rounded-full bg-jade-gradient shadow-soft",
        className || "size-10",
      )}
    >
      <img
        src="/assistant-mascot.png"
        alt="CashGPT Assistant"
        className="h-full w-full scale-110 object-cover"
        loading="eager"
        decoding="async"
        draggable={false}
      />
    </span>
  );
}

export function AiAssistant() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const callAssistant = useServerFn(sendAssistantMessage);

  const storageKey = session?.user?.id ? `cashgpt.assistant.chat.${session.user.id}` : null;

  // Chat memory — load any saved conversation for this user once we know who they are.
  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length) setMessages(parsed);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, [storageKey]);

  // Persist the conversation across refreshes (only after the initial load).
  useEffect(() => {
    if (!storageKey || !hydrated) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      /* storage full / unavailable — non-fatal */
    }
  }, [messages, storageKey, hydrated]);

  // Unread nudge — invite first-time users to ask a question.
  useEffect(() => {
    try {
      if (!window.localStorage.getItem(OPENED_KEY)) setShowNudge(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const chat = useMutation({
    mutationFn: (payload: { message: string; history: { role: Role; content: string }[] }) =>
      callAssistant({ data: payload }),
    onSuccess: (result: { reply: string }) => {
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: "assistant", content: result.reply },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: "assistant", content: FALLBACK_REPLY },
      ]);
    },
  });

  const ticket = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error("no-session");
      const convo = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => `${m.role === "user" ? "You" : "Assistant"}: ${m.content}`)
        .join("\n\n");
      const firstUser = messages.find((m) => m.role === "user")?.content ?? "Support request";
      const subject = `AI chat: ${firstUser.slice(0, 80)}`;
      const description = `Escalated from the CashGPT AI Assistant chat.\n\n${
        convo || "(No messages yet.)"
      }`.slice(0, 2000);
      const { error } = await supabase
        .from("support_tickets")
        .insert({ user_id: session.user.id, subject, description });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ticket submitted — a human will follow up.");
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: "assistant",
          content:
            "I've created a support ticket from our chat 🎫 A human will follow up — you can track it under \"Your tickets\" in the Support tab.",
        },
      ]);
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: () => toast.error("Couldn't create a ticket. Please use the form below."),
  });

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, chat.isPending]);

  function openChat() {
    setOpen(true);
    setShowNudge(false);
    try {
      window.localStorage.setItem(OPENED_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || chat.isPending) return;

    const history = messages
      .filter((m) => m.id !== "welcome")
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { id: newId(), role: "user", content: trimmed }]);
    setInput("");
    chat.mutate({ message: trimmed, history });
  }

  const hasUserMessage = messages.some((m) => m.role === "user");
  const showQuickReplies = !hasUserMessage && !chat.isPending;

  return (
    <>
      {/* AI Assistant card (inline in the Support tab) */}
      <div className="surface-card flex items-center gap-4 p-4" data-testid="ai-assistant-card">
        <AssistantMascot className="size-14 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="font-display text-base leading-tight">AI Assistant</p>
            <Sparkles className="size-3.5 text-gold" />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Instant answers about coins, offers, payouts &amp; more.
          </p>
        </div>
        <Button
          size="sm"
          variant="jade"
          onClick={openChat}
          data-testid="ai-assistant-open-btn"
        >
          Chat now
        </Button>
      </div>

      {/* Floating chat bubble + unread nudge */}
      {!open && (
        <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2 md:right-[max(1rem,calc(50%-32rem))]">
          {showNudge && (
            <div
              className="animate-in fade-in slide-in-from-bottom-2 relative max-w-[13rem] rounded-2xl rounded-br-sm border border-border bg-card px-3 py-2 text-xs font-medium text-card-foreground shadow-lift"
              data-testid="ai-assistant-nudge"
            >
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setShowNudge(false)}
                data-testid="ai-assistant-nudge-dismiss"
                className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-soft transition-colors hover:text-foreground"
              >
                <X className="size-3" />
              </button>
              Need a hand? 👋 Ask me anything about earning or payouts!
            </div>
          )}
          <button
            type="button"
            onClick={openChat}
            aria-label="Open AI Assistant"
            data-testid="ai-assistant-fab"
            className="relative grid size-16 place-items-center rounded-full bg-jade-gradient p-0 shadow-lift transition-transform hover:scale-105 active:scale-95"
          >
            {showNudge && (
              <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-mint/40" />
            )}
            <span className="absolute inset-1 overflow-hidden rounded-full">
              <img
                src="/assistant-mascot.png"
                alt=""
                className="h-full w-full scale-110 object-cover"
                draggable={false}
              />
            </span>
            <span className="absolute -right-0.5 -top-0.5 grid size-6 place-items-center rounded-full bg-gold-gradient text-gold-foreground shadow-gold">
              <MessageCircle className="size-3.5" />
            </span>
          </button>
        </div>
      )}

      {/* Chat panel */}
      {open && (
        <div
          data-testid="ai-assistant-panel"
          className="fixed bottom-24 right-4 z-50 flex h-[70vh] max-h-[560px] w-[calc(100%-2rem)] max-w-sm flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-lift md:right-[max(1rem,calc(50%-32rem))]"
        >
          {/* Header */}
          <div className="flex items-center gap-3 bg-jade-gradient px-4 py-3 text-primary-foreground">
            <AssistantMascot className="size-10 shrink-0 shadow-none" />
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm leading-tight">CashGPT Assistant</p>
              <p className="flex items-center gap-1 text-[11px] opacity-80">
                <span className="inline-block size-1.5 rounded-full bg-mint" />
                Online now
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close AI Assistant"
              data-testid="ai-assistant-close-btn"
              className="grid size-8 place-items-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            data-testid="ai-assistant-messages"
            className="flex-1 space-y-3 overflow-y-auto bg-background-alt/40 px-3 py-4"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex items-end gap-2",
                  m.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {m.role === "assistant" && (
                  <AssistantMascot className="size-7 shrink-0 shadow-none" />
                )}
                <div
                  data-testid={`ai-assistant-msg-${m.role}`}
                  className={cn(
                    "max-w-[78%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm shadow-soft",
                    m.role === "user"
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-card text-card-foreground",
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {chat.isPending && (
              <div className="flex items-end gap-2" data-testid="ai-assistant-loading">
                <AssistantMascot className="size-7 shrink-0 shadow-none" />
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-card px-4 py-3 shadow-soft">
                  <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                  <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                  <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60" />
                </div>
              </div>
            )}

            {/* Quick replies */}
            {showQuickReplies && (
              <div className="flex flex-wrap gap-2 pt-1" data-testid="ai-assistant-quick-replies">
                {QUICK_REPLIES.map((qr) => (
                  <button
                    key={qr.label}
                    type="button"
                    onClick={() => send(qr.question)}
                    data-testid="ai-assistant-quick-reply"
                    className="rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 active:scale-95"
                  >
                    {qr.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Escalation to a human */}
          <button
            type="button"
            onClick={() => ticket.mutate()}
            disabled={ticket.isPending || !session}
            data-testid="ai-assistant-ticket-btn"
            className="flex items-center justify-center gap-1.5 border-t border-border bg-background-alt/60 py-2 text-xs font-semibold text-primary transition-colors hover:bg-background-alt disabled:opacity-50"
          >
            <LifeBuoy className="size-3.5" />
            {ticket.isPending ? "Creating ticket…" : "Talk to a human — create a support ticket"}
          </button>

          {/* Composer */}
          <form
            className="flex items-center gap-2 border-t border-border bg-card p-3"
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={2000}
              placeholder="Ask about coins, payouts…"
              data-testid="ai-assistant-input"
              className="h-11 flex-1 rounded-full border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button
              type="submit"
              size="icon"
              variant="jade"
              disabled={!input.trim() || chat.isPending}
              aria-label="Send message"
              data-testid="ai-assistant-send-btn"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
