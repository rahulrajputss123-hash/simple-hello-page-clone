import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { S as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { i as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { t as AVATAR_OPTIONS } from "./premium-BIRn1NQB.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/preview-live-activity-DO5w_Zja.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* TEMPORARY preview route for reviewing the Simulated Live Activity strip.
*
* Exists only so the card can be inspected without signing in. It seeds the
* real ["featured-feed","home"] cache key with sample offers so the live
* component behaves exactly as it does on Home.
*
* Development only.
*/
/**
* Stand-in offers shaped like FeaturedOffer, only for this preview page.
* Spread across payout tiers so the weighted selection is observable, and two
* entries above the $50.00 cap that must NEVER appear in the strip.
*/
var SAMPLE_OFFERS = [
	{
		id: "sample-1",
		title: "Survey Junkie — Paid Surveys",
		reward_amount: .35,
		image_url: null
	},
	{
		id: "sample-2",
		title: "Temu — Install & Explore",
		reward_amount: .8,
		image_url: null
	},
	{
		id: "sample-3",
		title: "Coin Master — Reach Level 5",
		reward_amount: 1.25,
		image_url: null
	},
	{
		id: "sample-4",
		title: "Shop & Save App",
		reward_amount: 2.4,
		image_url: null
	},
	{
		id: "sample-5",
		title: "CapCut — Video Editor",
		reward_amount: 4.5,
		image_url: null
	},
	{
		id: "sample-6",
		title: "HostingTom — 110% Cashback",
		reward_amount: 10,
		image_url: null
	},
	{
		id: "sample-7",
		title: "At the cap — $50.00 (allowed)",
		reward_amount: 50,
		image_url: null
	},
	{
		id: "over-cap-1",
		title: "OVER CAP $50.01 — must never show",
		reward_amount: 50.01,
		image_url: null
	},
	{
		id: "over-cap-2",
		title: "OVER CAP $250 — must never show",
		reward_amount: 250,
		image_url: null
	}
];
/**
* Stand-in active quests, seeding the same ["quests-active"] cache key Home
* fills — the feed's second (and only other) source.
*/
var SAMPLE_QUESTS = [
	{
		id: "quest-1",
		label: "Watch 5 Ads",
		reward_amount: .5,
		icon: "gift"
	},
	{
		id: "quest-2",
		label: "Shortlink Chain",
		reward_amount: 1,
		icon: "gift"
	},
	{
		id: "quest-3",
		label: "Complete Locker",
		reward_amount: 1.5,
		icon: "gift"
	}
];
AVATAR_OPTIONS[0]?.imageUrl, AVATAR_OPTIONS[3]?.imageUrl, AVATAR_OPTIONS[5]?.imageUrl, AVATAR_OPTIONS[7]?.imageUrl;
function PreviewLiveActivity() {
	const queryClient = useQueryClient();
	(0, import_react.useEffect)(() => {
		queryClient.setQueryData(["featured-feed", "home"], {
			country: "IN",
			offers: SAMPLE_OFFERS
		});
		queryClient.setQueryData(["quests-active"], SAMPLE_QUESTS);
	}, [queryClient]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
		to: "/",
		replace: true
	});
}
//#endregion
export { PreviewLiveActivity as component };
