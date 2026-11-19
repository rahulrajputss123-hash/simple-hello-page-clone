import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { Dt as Download, O as ShieldCheck } from "../_libs/lucide-react.mjs";
import { A as Dialog, G as DialogDescription, J as DialogTitle, K as DialogFooter, N as APK_DOWNLOAD_URL, Ot as Button, U as DialogClose, W as DialogContent, q as DialogHeader, z as STORE_COPY } from "./router-sXMnYegW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/useStoreDialog-BOC_p28C.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function GooglePlayGlyph({ className = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 24 24",
		fill: "currentColor",
		"aria-hidden": true,
		className,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l10.885-10.87L1.337.924zm12.007 10.25l2.988-2.971L2.936.153a1.49 1.49 0 0 0-.755-.152l11.163 11.173zm0 1.649L2.193 23.994c.233-.014.469-.073.684-.199l13.469-7.674-3.002-2.998z" })
	});
}
function AppleGlyph({ className = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 24 24",
		fill: "currentColor",
		"aria-hidden": true,
		className,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" })
	});
}
/**
* The Google Play / App Store CTA pair. Neither button navigates — both hand the
* chosen store up to the page-level dialog.
*
* @param tone "dark" for jade surfaces, "light" for cream/white surfaces.
* @param compact Tighter sizing, and drops the two-line store labels.
* @param primaryOnly Render just the gold CTA (used by the sticky mobile bar).
*/
function StoreButtons({ onSelect, tone = "dark", compact = false, primaryOnly = false, className = "" }) {
	const size = compact ? "default" : "lg";
	const secondaryTone = tone === "dark" ? "border border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground shadow-none backdrop-blur-sm hover:bg-primary-foreground/20" : "border border-border bg-card text-foreground shadow-soft hover:bg-background-alt";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `flex gap-3 ${primaryOnly ? "" : "flex-col sm:flex-row sm:items-center"} ${className}`,
		"data-testid": "store-buttons",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: `relative inline-flex ${primaryOnly ? "" : "w-full sm:w-auto"}`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				"aria-hidden": true,
				className: "pointer-events-none absolute -inset-1.5 rounded-3xl opacity-40 motion-reduce:opacity-30",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "block size-full rounded-3xl bg-gold blur-lg animate-[splash-halo-pulse_2.6s_ease-in-out_infinite] motion-reduce:animate-none" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "gold",
				size,
				onClick: () => onSelect("play"),
				className: `relative w-full ${compact ? "" : "px-7"}`,
				"data-testid": "cta-google-play",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GooglePlayGlyph, { className: "size-4 shrink-0" }), compact ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm",
					children: "Install Free"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex flex-col items-start leading-none",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] font-semibold uppercase tracking-wider opacity-70",
						children: "Get it on"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[15px]",
						children: "Google Play"
					})]
				})]
			})]
		}), !primaryOnly && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			size,
			onClick: () => onSelect("appstore"),
			className: `w-full sm:w-auto ${secondaryTone} ${compact ? "" : "px-7"}`,
			"data-testid": "cta-app-store",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppleGlyph, { className: "size-4 shrink-0" }), compact ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm",
				children: "App Store"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "flex flex-col items-start leading-none",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[10px] font-semibold uppercase tracking-wider opacity-70",
					children: "Download on"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[15px]",
					children: "App Store"
				})]
			})]
		})]
	});
}
/**
* Friendly "listing is under review" popup with a direct APK fallback.
* Controlled — drive it from {@link useStoreDialog}.
*/
function StoreDialog({ store, open, onOpenChange }) {
	const copy = store ? STORE_COPY[store] : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-h-[90vh] max-w-sm overflow-y-auto rounded-[1.25rem]",
			"data-testid": "store-unavailable-dialog",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-hidden": true,
						className: "grid size-12 place-items-center rounded-2xl bg-gold-gradient text-gold-foreground shadow-gold",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-6" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
						className: "pt-2 text-left font-display text-lg",
						"data-testid": "store-dialog-title",
						children: copy?.title ?? "Store listing unavailable"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
						className: "text-left text-sm leading-relaxed",
						children: copy?.message
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
					className: "mt-1 gap-2 sm:flex-col sm:space-x-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "jade",
						className: "w-full",
						"data-testid": "store-dialog-apk",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: APK_DOWNLOAD_URL,
							download: true,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), "Direct Download (APK)"]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							className: "w-full text-muted-foreground",
							children: "Maybe later"
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-center text-[11px] text-muted-foreground",
					children: "Android 7.0+ · Free to install · No hidden charges"
				})
			]
		})
	});
}
/**
* Owns which store popup is showing on the landing page.
*
* Keep one instance per page and pass `select` to every `StoreButtons` so only a
* single `StoreDialog` is ever mounted.
*
* `store` is intentionally left set after closing so the copy doesn't blank out
* mid close-animation; `open` is what drives visibility.
*/
function useStoreDialog() {
	const [store, setStore] = (0, import_react.useState)(null);
	const [open, setOpen] = (0, import_react.useState)(false);
	return {
		store,
		open,
		select: (next) => {
			setStore(next);
			setOpen(true);
		},
		setOpen
	};
}
//#endregion
export { StoreDialog as n, useStoreDialog as r, StoreButtons as t };
