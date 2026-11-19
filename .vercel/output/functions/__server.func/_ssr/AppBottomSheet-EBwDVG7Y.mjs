import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { i as SheetTitle, n as SheetContent, r as SheetHeader, t as Sheet } from "./sheet-BNcevado.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/AppBottomSheet-EBwDVG7Y.js
var import_jsx_runtime = require_jsx_runtime();
/**
* Shared bottom sheet component with consistent styling across the app.
* Matches the tuned style from OfferFilterButton: rounded-t-3xl, drag handle,
* max-h-[85dvh], smooth slide-up animation, safe-area padding.
*/
function AppBottomSheet({ open, onOpenChange, title, children, footer, className = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			side: "bottom",
			className: `flex max-h-[85dvh] flex-col rounded-t-3xl ${className}`,
			style: {
				animation: "slide-up 200ms ease-out",
				willChange: "transform"
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-4 h-1 w-12 shrink-0 rounded-full bg-muted" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, {
					className: "shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: title })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex-1 overflow-y-auto overscroll-contain py-4",
					children
				}),
				footer && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "shrink-0 border-t pt-4",
					style: { paddingBottom: "max(1rem, env(safe-area-inset-bottom))" },
					children: footer
				})
			]
		})
	});
}
//#endregion
export { AppBottomSheet as t };
