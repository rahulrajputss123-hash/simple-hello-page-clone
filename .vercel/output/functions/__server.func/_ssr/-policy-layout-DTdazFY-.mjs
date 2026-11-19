import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { Ht as ChevronRight, St as FileText, Yt as CalendarClock, lt as Info, nn as ArrowUp, on as ArrowLeft } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/-policy-layout-DTdazFY-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PolicyLayout({ title, subtitle, lastUpdated, sections, siblings, intro, footer }) {
	const [scrolled, setScrolled] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const onScroll = () => setScrolled(window.scrollY > 12);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "policy-page relative min-h-screen bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute inset-0",
				style: { background: "radial-gradient(60% 40% at 20% 0%, rgba(34,197,94,0.10), transparent 70%), radial-gradient(45% 35% at 90% 15%, rgba(244,180,0,0.12), transparent 75%)" }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `sticky top-0 z-30 border-b transition-colors ${scrolled ? "border-border/70 bg-background/85 shadow-soft backdrop-blur-md" : "border-transparent bg-background/0"}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/home",
						className: "inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-primary shadow-soft transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground",
						"data-testid": "policy-back-btn",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-3.5" }), "Back"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate font-display text-sm leading-tight",
							children: title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "flex items-center gap-1 text-[11px] text-muted-foreground",
							"data-testid": "policy-last-updated",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarClock, { className: "size-3" }),
								"Last updated: ",
								lastUpdated
							]
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative mx-auto w-full max-w-2xl px-4 pb-16 pt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-semibold uppercase tracking-widest text-gold-dark",
								children: "Legal"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display text-3xl leading-tight text-primary",
								children: title
							}),
							subtitle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: subtitle
							})
						]
					}),
					siblings.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "mt-5 flex flex-wrap gap-2",
						"aria-label": "Related documents",
						"data-testid": "policy-siblings-nav",
						children: siblings.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: s.href,
							className: "inline-flex items-center gap-1 rounded-full border border-primary/25 bg-card px-3 py-1 text-[11px] font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/10",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-3" }), s.label]
						}, s.href))
					}),
					intro && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 flex items-start gap-2 rounded-2xl border border-primary/25 bg-primary/5 p-3 text-sm leading-relaxed text-primary",
						"data-testid": "policy-intro",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "mt-0.5 size-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "min-w-0",
							children: intro
						})]
					}),
					sections.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
						className: "surface-card mt-6 p-4",
						"aria-label": "Table of contents",
						"data-testid": "policy-toc",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
							children: "On this page"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
							className: "mt-2 space-y-1",
							children: sections.map((s, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: `#${s.id}`,
								className: "group flex items-center gap-1.5 text-sm text-foreground transition-colors hover:text-primary",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground",
										children: idx + 1
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "flex-1 leading-snug",
										children: s.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-3 opacity-0 transition-opacity group-hover:opacity-100" })
								]
							}) }, s.id))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-6 space-y-4",
						children: sections.map((s, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
							id: s.id,
							className: "surface-card scroll-mt-24 p-5",
							"data-testid": `policy-section-${s.id}`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 font-display text-sm text-primary",
									children: idx + 1
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-display text-lg leading-tight text-primary",
										children: s.title
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "policy-body mt-3 space-y-3 text-sm leading-[1.65] text-foreground/85",
										children: s.body
									})]
								})]
							})
						}, s.id))
					}),
					footer && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-6 rounded-2xl border border-dashed border-primary/30 bg-background-alt p-4 text-xs text-muted-foreground",
						children: footer
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-8 flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => window.scrollTo({
								top: 0,
								behavior: "smooth"
							}),
							className: "inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-primary shadow-soft transition-colors hover:border-primary",
							"data-testid": "policy-back-to-top",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, { className: "size-3.5" }), "Back to top"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/home",
							className: "text-xs font-semibold text-primary underline-offset-4 hover:underline",
							children: "← Return to CashGPT"
						})]
					})
				]
			})
		]
	});
}
/** Utility helpers for authoring section bodies without extra imports per file. */
function P({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children });
}
function UL({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "ml-5 list-disc space-y-1.5",
		children
	});
}
function LI({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children });
}
function Strong({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
		className: "font-semibold text-foreground",
		children
	});
}
function Callout({ tone = "info", children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `rounded-xl border ${tone === "warn" ? "border-gold/40 bg-gold/10 text-gold-dark" : "border-primary/30 bg-primary/5 text-primary"} p-3 text-[13px] leading-relaxed`,
		children
	});
}
//#endregion
export { Strong as a, PolicyLayout as i, LI as n, UL as o, P as r, Callout as t };
