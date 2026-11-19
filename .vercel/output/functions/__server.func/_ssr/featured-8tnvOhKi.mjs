import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { ot as LayoutGrid } from "../_libs/lucide-react.mjs";
import { M as SectionHeading, d as AppShell } from "./router-sXMnYegW.mjs";
import { t as FeaturedOffers } from "./FeaturedOffers-pOqzVpyY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/featured-8tnvOhKi.js
var import_jsx_runtime = require_jsx_runtime();
function FeaturedPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		subtitle: "All offers",
		mainClass: "page-fade-in",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
			variant: "ribbon",
			size: "page",
			icon: LayoutGrid,
			iconSrc: "/icons/icon-offer-filter.webp",
			title: "All Offers"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeaturedOffers, { scope: "all" })]
	});
}
//#endregion
export { FeaturedPage as component };
