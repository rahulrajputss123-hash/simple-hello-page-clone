import { i as __toESM } from "../_runtime.mjs";
import { a as formatDateTime } from "./referral-progress-DmJLJmiB.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { C as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { C as Sparkles, It as CircleQuestionMark, M as Send, Rt as CirclePlay, Y as MessageCircle, Z as Mail, at as LifeBuoy, it as Lightbulb, n as X, v as Ticket } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as createServerFn } from "./server-CpGMOUrW.mjs";
import { t as createSsrRpc } from "./createSsrRpc-Bbq2Yr9O.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Br_KWlRY.mjs";
import { n as supabase } from "./client-QOMq7HzS.mjs";
import { i as enumType, l as stringType, n as arrayType, s as objectType } from "../_libs/zod.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { D as Input, E as Label, M as SectionHeading, Ot as Button, d as AppShell, k as useViewedOffer, nr as useServerFn, rr as cn, tr as useAuth } from "./router-sXMnYegW.mjs";
import { t as EmptyState } from "./States-Cg9ELwgo.mjs";
import { t as Textarea } from "./textarea-kko37XEX.mjs";
import { o as resetOnboarding } from "./functions-BCv4WNrg.mjs";
import { i as AccordionTrigger, n as AccordionContent, r as AccordionItem, t as Accordion } from "./accordion-uwqhymWC.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/support-BnFtLhyw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var turnSchema = objectType({
	role: enumType(["user", "assistant"]),
	content: stringType().trim().min(1).max(4e3)
});
var chatInput = objectType({
	message: stringType().trim().min(1).max(2e3),
	history: arrayType(turnSchema).max(12).default([]),
	/**
	* Optional id of the offer the user is currently viewing. Only the id is
	* accepted — the offer's facts are loaded server-side so the client can never
	* feed the model made-up offer data.
	*/
	offerId: stringType().uuid().nullable().optional()
});
/**
* Authenticated: sends a user message + short conversation history to Gemini
* (with CASHGPT_SYSTEM_PROMPT as the system instruction) and returns the reply.
*
* When `offerId` is supplied, the real offer row (plus this user's own claim) is
* loaded and appended to the system instruction so offer-specific questions are
* answered from stored data. Without it, behaviour is unchanged.
*/
var sendAssistantMessage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => chatInput.parse(input)).handler(createSsrRpc("8c90d46f19347dc6eb554371817d0ca3267967968a59b2cb5b8deda869be6bfe"));
var FALLBACK_REPLY = "Sorry — I couldn't reach the assistant just now. Please try again or open a support ticket below and a human will follow up.";
var WELCOME = "Hi! I'm the CashGPT Assistant 🪙 Ask me about earning coins, quests, offers, payouts, or your wallet.";
var QUICK_REPLIES = [
	{
		label: "How do I earn coins?",
		question: "How do I earn coins?"
	},
	{
		label: "Minimum withdrawal?",
		question: "What is the minimum withdrawal?"
	},
	{
		label: "Payout time?",
		question: "How long do payouts take?"
	},
	{
		label: "KYC & verification",
		question: "Why do I need KYC and how does verification work?"
	}
];
/** Shown instead of the general prompts while an offer is in context. */
var OFFER_QUICK_REPLIES = [
	{
		label: "How do I complete this?",
		question: "How do I complete this offer?"
	},
	{
		label: "What's the conversion flow?",
		question: "What is the conversion flow for this offer?"
	},
	{
		label: "Do I need proof?",
		question: "Do I need to upload proof for this offer?"
	},
	{
		label: "When do I get paid?",
		question: "When will I get paid for this offer?"
	}
];
var OPENED_KEY = "cashgpt.assistant.opened";
/**
* Asked automatically when the chat is opened from an offer's "Ask the
* assistant" button, so the user gets a real answer without typing.
*
* Deliberately contains only words that offer-context.server.ts treats as
* question words ("complete", "offer", "about"), so it can never name-resolve to
* some other offer and override the one actually in context.
*/
var AUTO_OFFER_QUESTION = "Tell me about this offer and how to complete it.";
function newId() {
	return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
/** Mascot avatar — the CashGPT coin mascot, reused across the card, header, and bubble. */
function AssistantMascot({ className = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-grid place-items-center overflow-hidden rounded-full bg-jade-gradient shadow-soft", className || "size-10"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: "/assistant-mascot.webp",
			alt: "CashGPT Assistant",
			width: 80,
			height: 80,
			className: "h-full w-full scale-110 object-cover",
			loading: "eager",
			decoding: "async",
			draggable: false
		})
	});
}
function AiAssistant() {
	const { session } = useAuth();
	const queryClient = useQueryClient();
	const { viewedOffer, clearViewedOffer, assistantOpenRequested, consumeAssistantOpen } = useViewedOffer();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [messages, setMessages] = (0, import_react.useState)([{
		id: "welcome",
		role: "assistant",
		content: WELCOME
	}]);
	const [input, setInput] = (0, import_react.useState)("");
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	const [showNudge, setShowNudge] = (0, import_react.useState)(false);
	const scrollRef = (0, import_react.useRef)(null);
	const inputRef = (0, import_react.useRef)(null);
	/** Guards the one-shot auto-ask fired when opened from an offer. */
	const autoAskedRef = (0, import_react.useRef)(false);
	const callAssistant = useServerFn(sendAssistantMessage);
	const storageKey = session?.user?.id ? `cashgpt.assistant.chat.${session.user.id}` : null;
	(0, import_react.useEffect)(() => {
		if (!storageKey) return;
		try {
			const raw = window.localStorage.getItem(storageKey);
			if (raw) {
				const parsed = JSON.parse(raw);
				if (Array.isArray(parsed) && parsed.length) setMessages(parsed);
			}
		} catch {}
		setHydrated(true);
	}, [storageKey]);
	(0, import_react.useEffect)(() => {
		if (!storageKey || !hydrated) return;
		try {
			window.localStorage.setItem(storageKey, JSON.stringify(messages));
		} catch {}
	}, [
		messages,
		storageKey,
		hydrated
	]);
	(0, import_react.useEffect)(() => {
		try {
			if (!window.localStorage.getItem(OPENED_KEY)) setShowNudge(true);
		} catch {}
	}, []);
	(0, import_react.useEffect)(() => {
		if (open) inputRef.current?.focus();
	}, [open]);
	(0, import_react.useEffect)(() => {
		if (!assistantOpenRequested) return;
		consumeAssistantOpen();
		setOpen(true);
		setShowNudge(false);
		try {
			window.localStorage.setItem(OPENED_KEY, "1");
		} catch {}
		if (!autoAskedRef.current && viewedOffer) {
			autoAskedRef.current = true;
			send(AUTO_OFFER_QUESTION);
		}
	}, [assistantOpenRequested, consumeAssistantOpen]);
	const chat = useMutation({
		mutationFn: (payload) => callAssistant({ data: payload }),
		onSuccess: (result) => {
			setMessages((prev) => [...prev, {
				id: newId(),
				role: "assistant",
				content: result.reply
			}]);
		},
		onError: () => {
			setMessages((prev) => [...prev, {
				id: newId(),
				role: "assistant",
				content: FALLBACK_REPLY
			}]);
		}
	});
	const ticket = useMutation({
		mutationFn: async () => {
			if (!session) throw new Error("no-session");
			const convo = messages.filter((m) => m.id !== "welcome").map((m) => `${m.role === "user" ? "You" : "Assistant"}: ${m.content}`).join("\n\n");
			const subject = `AI chat: ${(messages.find((m) => m.role === "user")?.content ?? "Support request").slice(0, 80)}`;
			const description = `Escalated from the CashGPT AI Assistant chat.\n\n${convo || "(No messages yet.)"}`.slice(0, 2e3);
			const { error } = await supabase.from("support_tickets").insert({
				user_id: session.user.id,
				subject,
				description
			});
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("Ticket submitted — a human will follow up.");
			setMessages((prev) => [...prev, {
				id: newId(),
				role: "assistant",
				content: "I've created a support ticket from our chat 🎫 A human will follow up — you can track it under \"Your tickets\" in the Support tab."
			}]);
			queryClient.invalidateQueries({ queryKey: ["tickets"] });
		},
		onError: () => toast.error("Couldn't create a ticket. Please use the form below.")
	});
	(0, import_react.useEffect)(() => {
		if (!open) return;
		scrollRef.current?.scrollTo({
			top: scrollRef.current.scrollHeight,
			behavior: "smooth"
		});
	}, [
		messages,
		open,
		chat.isPending
	]);
	function openChat() {
		setOpen(true);
		setShowNudge(false);
		try {
			window.localStorage.setItem(OPENED_KEY, "1");
		} catch {}
	}
	function send(text) {
		const trimmed = text.trim();
		if (!trimmed || chat.isPending) return;
		const history = messages.filter((m) => m.id !== "welcome").slice(-10).map((m) => ({
			role: m.role,
			content: m.content
		}));
		setMessages((prev) => [...prev, {
			id: newId(),
			role: "user",
			content: trimmed
		}]);
		setInput("");
		chat.mutate({
			message: trimmed,
			history,
			...viewedOffer ? { offerId: viewedOffer.id } : {}
		});
	}
	const showQuickReplies = !messages.some((m) => m.role === "user") && !chat.isPending;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "surface-card flex items-center gap-4 p-4",
			"data-testid": "ai-assistant-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssistantMascot, { className: "size-14 shrink-0" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-base leading-tight",
							children: "AI Assistant"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-3.5 text-gold" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-0.5 text-xs text-muted-foreground",
						children: "Instant answers about coins, offers, payouts & more."
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "jade",
					onClick: openChat,
					"data-testid": "ai-assistant-open-btn",
					children: "Chat now"
				})
			]
		}),
		!open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2 md:right-[max(1rem,calc(50%-32rem))]",
			children: [showNudge && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "animate-in fade-in slide-in-from-bottom-2 relative max-w-[13rem] rounded-2xl rounded-br-sm border border-border bg-card px-3 py-2 text-xs font-medium text-card-foreground shadow-lift",
				"data-testid": "ai-assistant-nudge",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Dismiss",
					onClick: () => setShowNudge(false),
					"data-testid": "ai-assistant-nudge-dismiss",
					className: "absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-soft transition-colors hover:text-foreground",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3" })
				}), "Need a hand? 👋 Ask me anything about earning or payouts!"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: openChat,
				"aria-label": "Open AI Assistant",
				"data-testid": "ai-assistant-fab",
				className: "relative grid size-16 place-items-center rounded-full bg-jade-gradient p-0 shadow-lift transition-transform hover:scale-105 active:scale-95",
				children: [
					showNudge && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-0 -z-10 animate-ping rounded-full bg-mint/40" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute inset-1 overflow-hidden rounded-full",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: "/assistant-mascot.webp",
							alt: "",
							className: "h-full w-full scale-110 object-cover",
							draggable: false,
							decoding: "async"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute -right-0.5 -top-0.5 grid size-6 place-items-center rounded-full bg-gold-gradient text-gold-foreground shadow-gold",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "size-3.5" })
					})
				]
			})]
		}),
		open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			"data-testid": "ai-assistant-panel",
			className: "fixed bottom-24 right-4 z-50 flex h-[70vh] max-h-[560px] w-[calc(100%-2rem)] max-w-sm flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-lift md:right-[max(1rem,calc(50%-32rem))]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 bg-jade-gradient px-4 py-3 text-primary-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssistantMascot, { className: "size-10 shrink-0 shadow-none" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-sm leading-tight",
								children: "CashGPT Assistant"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "flex items-center gap-1 text-[11px] opacity-80",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "inline-block size-1.5 rounded-full bg-mint" }), "Online now"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setOpen(false),
							"aria-label": "Close AI Assistant",
							"data-testid": "ai-assistant-close-btn",
							className: "grid size-8 place-items-center rounded-full bg-white/15 transition-colors hover:bg-white/25",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
						})
					]
				}),
				viewedOffer && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 border-b border-border bg-primary/5 px-3 py-2",
					"data-testid": "ai-assistant-offer-context",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
							className: "size-3.5 shrink-0 text-primary",
							"aria-hidden": true
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "min-w-0 flex-1 truncate text-[11px] text-primary",
							children: ["Answering about: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "font-semibold",
								children: viewedOffer.title
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: clearViewedOffer,
							"aria-label": "Stop answering about this offer",
							"data-testid": "ai-assistant-offer-context-clear",
							className: "grid size-5 shrink-0 place-items-center rounded-full text-primary/70 transition-colors hover:text-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3" })
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					ref: scrollRef,
					"data-testid": "ai-assistant-messages",
					className: "flex-1 space-y-3 overflow-y-auto bg-background-alt/40 px-3 py-4",
					children: [
						messages.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: cn("flex items-end gap-2", m.role === "user" ? "justify-end" : "justify-start"),
							children: [m.role === "assistant" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssistantMascot, { className: "size-7 shrink-0 shadow-none" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								"data-testid": `ai-assistant-msg-${m.role}`,
								className: cn("max-w-[78%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm shadow-soft", m.role === "user" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-card text-card-foreground"),
								children: m.content
							})]
						}, m.id)),
						chat.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-end gap-2",
							"data-testid": "ai-assistant-loading",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssistantMascot, { className: "size-7 shrink-0 shadow-none" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1 rounded-2xl rounded-bl-sm bg-card px-4 py-3 shadow-soft",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 animate-bounce rounded-full bg-muted-foreground/60" })
								]
							})]
						}),
						showQuickReplies && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-2 pt-1",
							"data-testid": "ai-assistant-quick-replies",
							children: (viewedOffer ? OFFER_QUICK_REPLIES : QUICK_REPLIES).map((qr) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => send(qr.question),
								"data-testid": "ai-assistant-quick-reply",
								className: "rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 active:scale-95",
								children: qr.label
							}, qr.label))
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => ticket.mutate(),
					disabled: ticket.isPending || !session,
					"data-testid": "ai-assistant-ticket-btn",
					className: "flex items-center justify-center gap-1.5 border-t border-border bg-background-alt/60 py-2 text-xs font-semibold text-primary transition-colors hover:bg-background-alt disabled:opacity-50",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LifeBuoy, { className: "size-3.5" }), ticket.isPending ? "Creating ticket…" : "Talk to a human — create a support ticket"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "flex items-center gap-2 border-t border-border bg-card p-3",
					onSubmit: (event) => {
						event.preventDefault();
						send(input);
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: inputRef,
						value: input,
						onChange: (event) => setInput(event.target.value),
						maxLength: 2e3,
						placeholder: "Ask about coins, payouts…",
						"data-testid": "ai-assistant-input",
						className: "h-11 flex-1 rounded-full border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						size: "icon",
						variant: "jade",
						disabled: !input.trim() || chat.isPending,
						"aria-label": "Send message",
						"data-testid": "ai-assistant-send-btn",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-4" })
					})]
				})
			]
		})
	] });
}
function SupportPage() {
	const { session } = useAuth();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const replay = useServerFn(resetOnboarding);
	const replayAction = useMutation({
		mutationFn: () => replay({}),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["profile"] });
			toast.success("Tour will replay on the home screen.");
			navigate({ to: "/home" });
		},
		onError: () => toast.error("Couldn't reset the tour.")
	});
	const faq = useQuery({
		queryKey: ["faq"],
		queryFn: async () => {
			const { data } = await supabase.from("faq").select("*").order("sort_order");
			return data ?? [];
		}
	});
	const tickets = useQuery({
		queryKey: ["tickets", session?.user.id],
		enabled: Boolean(session),
		queryFn: async () => {
			const { data } = await supabase.from("support_tickets").select("*").order("created_at", { ascending: false });
			return data ?? [];
		}
	});
	const createTicket = useMutation({
		mutationFn: async (values) => {
			const { error } = await supabase.from("support_tickets").insert({
				user_id: session.user.id,
				...values
			});
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("Ticket submitted — we'll reply soon.");
			queryClient.invalidateQueries({ queryKey: ["tickets"] });
		},
		onError: () => toast.error("Couldn't submit that ticket.")
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		subtitle: "Support",
		mainClass: "page-fade-in",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				size: "page",
				icon: LifeBuoy,
				iconSrc: "/icons/icon-support.webp",
				title: "Help centre"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AiAssistant, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				icon: Lightbulb,
				iconSrc: "/icons/icon-tips.webp",
				title: "Tips"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card flex items-center justify-between gap-3 p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-semibold",
						children: "Replay the app tour"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "See the quick spotlight walkthrough again."
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: "outline",
					disabled: replayAction.isPending,
					onClick: () => replayAction.mutate(),
					"data-testid": "support-replay-tour-btn",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CirclePlay, { className: "mr-1 h-4 w-4" }), replayAction.isPending ? "…" : "Replay"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				icon: CircleQuestionMark,
				iconSrc: "/icons/icon-faq.webp",
				title: "FAQ"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "surface-card px-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Accordion, {
					type: "single",
					collapsible: true,
					children: (faq.data ?? []).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AccordionItem, {
						value: item.id,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccordionTrigger, {
							className: "text-left text-sm",
							children: item.question
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccordionContent, {
							className: "text-sm text-muted-foreground",
							children: item.answer
						})]
					}, item.id))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				icon: Mail,
				iconSrc: "/icons/icon-contact-us.webp",
				title: "Contact us"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "surface-card space-y-3 p-4",
				onSubmit: (event) => {
					event.preventDefault();
					const form = new FormData(event.currentTarget);
					const subject = String(form.get("subject")).trim();
					const description = String(form.get("description")).trim();
					if (subject.length < 3 || description.length < 10) {
						toast.error("Add a subject and a bit more detail.");
						return;
					}
					createTicket.mutate({
						subject,
						description
					});
					event.currentTarget.reset();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "subject",
							children: "Subject"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "subject",
							name: "subject",
							maxLength: 120
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "description",
							children: "How can we help?"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							id: "description",
							name: "description",
							maxLength: 1e3,
							rows: 4
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						variant: "jade",
						disabled: createTicket.isPending,
						children: "Submit ticket"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				icon: Ticket,
				iconSrc: "/icons/icon-your-tickets.webp",
				title: "Your tickets"
			}),
			!tickets.data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				icon: LifeBuoy,
				title: "No tickets yet",
				description: "Anything unclear? Send us a message above."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-2",
				children: tickets.data.map((ticket) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "surface-card p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate font-semibold",
								children: ticket.subject
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full bg-background-alt px-2.5 py-1 text-[11px] font-semibold capitalize",
								children: ticket.status
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-muted-foreground",
							children: formatDateTime(ticket.created_at)
						}),
						ticket.admin_response && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 rounded-xl bg-background-alt p-2 text-sm",
							children: ticket.admin_response
						})
					]
				}, ticket.id))
			})
		]
	});
}
//#endregion
export { SupportPage as component };
