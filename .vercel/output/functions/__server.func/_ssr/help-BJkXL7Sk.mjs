import { x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { It as CircleQuestionMark, Z as Mail, at as LifeBuoy } from "../_libs/lucide-react.mjs";
import { n as PreviewNotice, t as BackLink } from "./Preview-MVZOUW8x.mjs";
import { M as SectionHeading, d as AppShell } from "./router-sXMnYegW.mjs";
import { i as AccordionTrigger, n as AccordionContent, r as AccordionItem, t as Accordion } from "./accordion-uwqhymWC.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/help-BJkXL7Sk.js
var import_jsx_runtime = require_jsx_runtime();
var FAQ = [
	["How do campaigns get approved?", "Every new campaign is reviewed by the CashGPT team, usually within one business day. You'll see it under My Campaigns → Active once it's live."],
	["When is my Campaign Balance charged?", "Only when a publisher completes your task — on auto-verified completion, or when you approve a proof submission. Clicks and starts are free."],
	["Manual Proof vs Auto Verified — which should I pick?", "Auto Verified is best for installs, video views and surveys we can detect automatically. Manual Proof fits sign-ups, follows and reviews where a screenshot is the evidence."],
	["Can I pause a campaign?", "Yes. Pausing stops new publishers from starting your task. Anyone who already started can still finish and be paid."],
	["What happens to unused Campaign Funds?", "They stay in your Campaign Balance and can be used for any future campaign."]
];
function AdvertiserHelpPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		subtitle: "Advertiser",
		mainClass: "page-fade-in",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BackLink, {
				to: "/home",
				label: "Back to dashboard"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				size: "page",
				icon: LifeBuoy,
				iconSrc: "/icons/icon-support.webp",
				title: "Advertiser Help",
				className: "mb-2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewNotice, {}),
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
					children: FAQ.map(([q, a]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AccordionItem, {
						value: q,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccordionTrigger, {
							className: "text-left text-sm",
							children: q
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccordionContent, {
							className: "text-sm text-muted-foreground",
							children: a
						})]
					}, q))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				icon: Mail,
				iconSrc: "/icons/icon-contact-us.webp",
				title: "Contact us"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card p-4 text-sm text-muted-foreground",
				children: ["Need help with a campaign? Our regular support team handles advertiser questions too.", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/support",
					className: "mt-2 block font-semibold text-primary",
					children: "Open Help centre →"
				})]
			})
		]
	});
}
//#endregion
export { AdvertiserHelpPage as component };
