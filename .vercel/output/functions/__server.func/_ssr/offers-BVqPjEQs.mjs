import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { b as Tag, in as ArrowRight, ot as LayoutGrid, st as Layers } from "../_libs/lucide-react.mjs";
import { i as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { M as SectionHeading, d as AppShell, nr as useServerFn } from "./router-sXMnYegW.mjs";
import { n as SectionBanner } from "./SectionBanner-Cf6xDjCJ.mjs";
import { a as getFeaturedFeed } from "./offers.functions-CQ4rFVpp.mjs";
import { n as OfferFilterButton, t as FeaturedOffers } from "./FeaturedOffers-pOqzVpyY.mjs";
import { t as OfferwallSlot } from "./OfferwallSlot-BiVjfKXB.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/offers-BVqPjEQs.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function OffersPage() {
	const [filter, setFilter] = (0, import_react.useState)("All");
	const queryClient = useQueryClient();
	useServerFn(getFeaturedFeed);
	(0, import_react.useEffect)(() => {
		queryClient.prefetchQuery({
			queryKey: ["sdk-offerwall-public", "all"],
			staleTime: 3e5
		});
	}, [queryClient]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		subtitle: "Offers",
		mainClass: "page-fade-in",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				size: "page",
				icon: Tag,
				iconSrc: "/icons/icon-offers.webp",
				title: "Offers",
				subtitle: "Complete partner offers for bigger payouts."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBanner, { section: "offers" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				icon: LayoutGrid,
				iconSrc: "/icons/icon-offer-filter.webp",
				title: "All Offers",
				className: "!mt-4",
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfferFilterButton, {
					value: filter,
					onChange: setFilter
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeaturedOffers, {
				scope: "all",
				filter
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				icon: Layers,
				iconSrc: "/icons/icon-offerwall.webp",
				title: "Offerwall"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfferwallSlot, { limit: 6 }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 flex justify-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ViewAllLink, {
					to: "/offerwall",
					testid: "offers-view-all-offerwall"
				})
			})
		]
	});
}
function ViewAllLink({ to, testid }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		"data-testid": testid,
		className: "group inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-card px-4 py-1.5 text-xs font-semibold text-primary shadow-soft transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground",
		children: ["View All", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3.5 transition-transform group-hover:translate-x-0.5" })]
	});
}
//#endregion
export { OffersPage as component };
