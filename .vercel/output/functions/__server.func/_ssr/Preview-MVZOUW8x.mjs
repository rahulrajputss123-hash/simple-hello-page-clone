import { x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { en as BadgeCheck, on as ArrowLeft, qt as Camera, wt as Eye } from "../_libs/lucide-react.mjs";
import "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/Preview-MVZOUW8x.js
var import_jsx_runtime = require_jsx_runtime();
var VERIFICATION_LABEL = {
	auto: "Auto Verified",
	proof: "Proof Required"
};
/** Small notice shown at the top of every marketplace preview screen. */
function PreviewNotice({ className = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		"data-testid": "preview-notice",
		className: `inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-semibold text-gold-dark ${className}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-3.5" }), " Preview — sample data"]
	});
}
/** Auto Verified / Proof Required pill. Publisher-facing language only. */
function VerificationBadge({ verification, size = "sm" }) {
	const auto = verification === "auto";
	const Icon = auto ? BadgeCheck : Camera;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		"data-testid": `verification-badge-${verification}`,
		className: `inline-flex items-center gap-1 rounded-full font-semibold ${size === "md" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[11px]"} ${auto ? "bg-mint/20 text-primary" : "bg-gold/15 text-gold-dark"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				"aria-hidden": true,
				children: auto ? "🟢" : "🟡"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3" }),
			VERIFICATION_LABEL[verification]
		]
	});
}
/** Compact back link used on nested marketplace screens. */
function BackLink({ to, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		className: "mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-3.5" }),
			" ",
			label
		]
	});
}
/** Advertiser-style KPI tile. */
function StatTile({ label, value, hint, tone = "default" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `rounded-2xl p-3 ${tone === "gold" ? "bg-gold/10 text-gold-dark" : tone === "mint" ? "bg-mint/15 text-primary" : "surface-card"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-amount mt-1 text-lg leading-none",
				children: value
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-[10px] text-muted-foreground",
				children: hint
			}) : null
		]
	});
}
function formatShortDate(iso) {
	return new Date(iso).toLocaleDateString(void 0, {
		day: "numeric",
		month: "short"
	});
}
//#endregion
export { formatShortDate as a, VerificationBadge as i, PreviewNotice as n, StatTile as r, BackLink as t };
