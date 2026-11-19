import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { st as Layers } from "../_libs/lucide-react.mjs";
import { M as SectionHeading, d as AppShell } from "./router-sXMnYegW.mjs";
import { n as SectionBanner } from "./SectionBanner-Cf6xDjCJ.mjs";
import { t as OfferwallSlot } from "./OfferwallSlot-BiVjfKXB.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/offerwall-CcuZEaLz.js
var import_jsx_runtime = require_jsx_runtime();
function OfferwallPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		subtitle: "Offerwall",
		mainClass: "page-fade-in",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				size: "page",
				icon: Layers,
				iconSrc: "/icons/icon-offerwall.webp",
				title: "Offerwall"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBanner, { section: "offerwall" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfferwallSlot, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-center text-xs text-muted-foreground",
				children: "Partner networks activate in the mobile app."
			})
		]
	});
}
//#endregion
export { OfferwallPage as component };
