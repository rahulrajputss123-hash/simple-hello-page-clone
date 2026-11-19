import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { C as Sparkles, O as ShieldCheck, i as Wallet, jt as Coins } from "../_libs/lucide-react.mjs";
import { I as HOW_IT_WORKS } from "./router-sXMnYegW.mjs";
import { n as StoreDialog, r as useStoreDialog, t as StoreButtons } from "./useStoreDialog-BOC_p28C.mjs";
import { n as OffersShowcase, r as TrustSection, t as EarnWaysSection } from "./TrustSection-CKe3jRbO.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app-DOqZ53Du.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** True once the window has scrolled past `offset` px. Drives the sticky mobile bar. */
function useScrolledPast(offset) {
	const [passed, setPassed] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const onScroll = () => setPassed(window.scrollY > offset);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, [offset]);
	return passed;
}
function AppLandingPage() {
	const storeDialog = useStoreDialog();
	const showStickyBar = useScrolledPast(480);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "page-fade-in min-h-screen bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "relative isolate overflow-hidden bg-jade-gradient",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"aria-hidden": true,
						className: "pointer-events-none absolute -right-20 -top-24 size-72 rounded-full opacity-40 blur-3xl",
						style: { background: "radial-gradient(closest-side, var(--color-gold), transparent)" }
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"aria-hidden": true,
						className: "pointer-events-none absolute -bottom-32 -left-24 size-80 rounded-full opacity-30 blur-3xl",
						style: { background: "radial-gradient(closest-side, var(--color-mint), transparent)" }
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: "/logo-horizontal-dark.webp",
							alt: "CashGPT — Earn · Complete · Cashout",
							className: "h-9 w-auto select-none sm:h-10",
							draggable: false,
							decoding: "async"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-12 max-w-2xl sm:mt-16",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-gold-foreground shadow-gold",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-3.5" }), " Free to install"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
									className: "mt-5 font-display text-[2.4rem] leading-[1.05] text-primary-foreground sm:text-[3.5rem]",
									children: [
										"Get paid for the time you're ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-gold",
											children: "already spending"
										}),
										"."
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-4 max-w-xl text-base leading-relaxed text-primary-foreground/75 sm:text-lg",
									children: "Watch, play, survey and claim offers — then cash out to PayPal, crypto or gift cards from just $5. Eight ways to earn, one app."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreButtons, {
									onSelect: storeDialog.select,
									tone: "dark",
									className: "mt-8"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
									className: "mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-primary-foreground/60",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "flex items-center gap-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-3.5 text-mint" }), " No hidden charges"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "flex items-center gap-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "size-3.5 text-mint" }), " Withdraw from $5"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "flex items-center gap-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coins, { className: "size-3.5 text-mint" }), " Paid in real currency"]
										})
									]
								})
							]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto w-full max-w-5xl space-y-16 px-4 py-14 sm:space-y-20 sm:px-6 sm:py-20",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EarnWaysSection, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OffersShowcase, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HowItWorks, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrustSection, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FinalCta, { onSelect: storeDialog.select })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: "bg-jade-gradient px-4 py-8 pb-28 sm:px-6 md:pb-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex w-full max-w-5xl flex-col items-center gap-3 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: "/logo-horizontal-dark.webp",
						alt: "CashGPT",
						className: "h-8 w-auto select-none",
						draggable: false,
						decoding: "async"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-primary-foreground/60",
						children: [
							"© ",
							(/* @__PURE__ */ new Date()).getFullYear(),
							" CashGPT. All rights reserved."
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"data-testid": "sticky-install-bar",
				"aria-hidden": !showStickyBar,
				className: `fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-4 py-3 shadow-lift backdrop-blur-md transition-transform duration-300 md:hidden ${showStickyBar ? "translate-y-0" : "pointer-events-none translate-y-full"}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex w-full max-w-lg items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate font-display text-sm leading-tight text-foreground",
							children: "Start earning today"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-[11px] text-muted-foreground",
							children: "Free install · Payouts from $5"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreButtons, {
						onSelect: storeDialog.select,
						tone: "light",
						compact: true,
						primaryOnly: true,
						className: "shrink-0"
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreDialog, {
				store: storeDialog.store,
				open: storeDialog.open,
				onOpenChange: storeDialog.setOpen
			})
		]
	});
}
function HowItWorks() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		"data-testid": "how-it-works",
		"aria-labelledby": "how-it-works-heading",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
				id: "how-it-works-heading",
				className: "font-display text-[1.6rem] leading-tight text-foreground sm:text-[2rem]",
				children: ["How it ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-gold-dark",
					children: "works"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mx-auto mt-2 max-w-md text-sm text-muted-foreground",
				children: "Three steps from install to payout. No invites, no subscriptions."
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "stagger-children mt-7 grid gap-4 sm:grid-cols-3",
			"data-testid": "how-it-works-steps",
			children: HOW_IT_WORKS.map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "surface-card relative flex flex-col gap-2 p-5 pt-6",
				"data-testid": `how-it-works-step-${step.number}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-hidden": true,
						className: "text-amount grid size-11 place-items-center rounded-2xl bg-jade-gradient text-lg text-primary-foreground shadow-lift",
						children: step.number
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 font-display text-lg leading-tight text-foreground",
						children: step.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-relaxed text-muted-foreground",
						children: step.description
					})
				]
			}, step.number))
		})]
	});
}
function FinalCta({ onSelect }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		"data-testid": "final-cta",
		"aria-labelledby": "final-cta-heading",
		className: "relative isolate overflow-hidden rounded-[1.75rem] bg-jade-gradient px-5 py-10 text-center shadow-lift sm:px-10 sm:py-14",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute -left-16 -top-20 size-56 rounded-full opacity-40 blur-3xl",
				style: { background: "radial-gradient(closest-side, var(--color-gold), transparent)" }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute -bottom-24 -right-16 size-56 rounded-full opacity-30 blur-3xl",
				style: { background: "radial-gradient(closest-side, var(--color-mint), transparent)" }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						id: "final-cta-heading",
						className: "font-display text-[1.9rem] leading-tight text-primary-foreground sm:text-[2.5rem]",
						children: ["Your first payout is ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-gold",
							children: "minutes away"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mx-auto mt-3 max-w-lg text-sm text-primary-foreground/75 sm:text-base",
						children: "Install CashGPT, finish a task or two, and withdraw as soon as you hit $5."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreButtons, {
						onSelect,
						tone: "dark",
						className: "mt-8 justify-center sm:justify-center"
					})
				]
			})
		]
	});
}
//#endregion
export { AppLandingPage as component };
