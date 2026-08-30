import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { sendAssistantMessage } from "@/lib/assistant.functions";
import { cn } from "@/lib/utils";

const FALLBACK_REPLY =
  "Sorry — I couldn't reach the assistant just now. Please try again or open a support ticket below and a human will follow up.";

const WELCOME =
  "Hi! I'm the CashGPT Assistant 🪙 Ask me about earning coins, quests, offers, payouts, or your wallet.";

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
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const callAssistant = useServerFn(sendAssistantMessage);

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

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, chat.isPending]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function handleSend() {
    const text = input.trim();
    if (!text || chat.isPending) return;

    const history = messages
      .filter((m) => m.id !== "welcome")
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { id: newId(), role: "user", content: text }]);
    setInput("");
    chat.mutate({ message: text, history });
  }

  return (
    <>
      {/* AI Assistant card (inline in the Support tab) */}
      <div
        className="surface-card flex items-center gap-4 p-4"
        data-testid="ai-assistant-card"
      >
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
          onClick={() => setOpen(true)}
          data-testid="ai-assistant-open-btn"
        >
          Chat now
        </Button>
      </div>

      {/* Floating chat bubble */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open AI Assistant"
          data-testid="ai-assistant-fab"
          className="fixed bottom-24 right-4 z-40 grid size-16 place-items-center rounded-full bg-jade-gradient p-0 shadow-lift transition-transform hover:scale-105 active:scale-95 md:right-[max(1rem,calc(50%-32rem))]"
        >
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
          </div>

          {/* Composer */}
          <form
            className="flex items-center gap-2 border-t border-border bg-card p-3"
            onSubmit={(event) => {
              event.preventDefault();
              handleSend();
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
