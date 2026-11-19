import { x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { on as ArrowLeft } from "../_libs/lucide-react.mjs";
import { d as AppShell } from "./router-sXMnYegW.mjs";
import { t as ErrorBoundary } from "./ErrorBoundary-_LI25I0d.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/offer._offerId-BdhMTAEG.js
var import_jsx_runtime = require_jsx_runtime();
var SplitErrorComponent = ({ error }) => {
	console.error("[OfferDetailsRoute] Error:", error);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorBoundary, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		hideNav: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex min-h-screen flex-col items-center justify-center p-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full max-w-md space-y-4 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mx-auto grid size-16 place-items-center rounded-full bg-destructive/10",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-8 text-destructive" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-2xl font-bold",
						children: "Unable to load offer"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "This offer could not be loaded. Please try again or return to the offers page."
					}),
					false,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/offers",
						className: "mx-auto block w-fit rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Back to offers"
					})
				]
			})
		})
	}) });
};
//#endregion
export { SplitErrorComponent as errorComponent };
