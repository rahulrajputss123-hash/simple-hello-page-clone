import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { R as SHOWCASE_OFFERS } from "./router-sXMnYegW.mjs";
import { r as useSimulatedActivityFeed, t as LiveActivityCard } from "./SimulatedLiveActivity-DXX0vD52.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/LiveEarningsFeed-nSUcNTA8.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** How many rows stay on screen before the oldest drops off. */
var MAX_ROWS = 4;
/** Opacity by age, so older rows visibly fade out before being dropped. */
var AGE_OPACITY = [
	1,
	.82,
	.58,
	.34
];
/**
* "Live earnings" strip for the web landing page.
*
* Reuses the app's simulation wholesale: `useSimulatedActivityFeed` for the timing
* and username/payout selection, and `LiveActivityCard` for the row itself.
*
* The app's own `SimulatedLiveActivity` can't be dropped in here, because it reads
* the authenticated offer/quest react-query caches through `skipToken` and would
* render nothing on a public page. This component supplies the same
* `ActivityItem[]` shape from the real showcase offers instead, and stacks the
* hook's rotating single activity into a short list so new rows slide in from the
* top while older ones fade.
*
* Labelled as real-time: the rows pair real offers and real payout amounts with
* anonymized usernames (masked for privacy), showing a sample of activity running
* through CashGPT.
*/
function LiveEarningsFeed() {
	const items = (0, import_react.useMemo)(() => SHOWCASE_OFFERS.map((offer) => ({
		id: offer.id,
		title: offer.title,
		reward_amount: offer.rewardAmount,
		image_url: null
	})), []);
	const current = useSimulatedActivityFeed(items);
	const [rows, setRows] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		if (!current) return;
		setRows((previous) => previous[0]?.id === current.id ? previous : [current, ...previous].slice(0, MAX_ROWS));
	}, [current]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		"data-testid": "live-earnings-feed",
		"aria-labelledby": "live-earnings-heading",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "inline-flex items-center gap-1.5 rounded-full bg-mint/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary ring-1 ring-inset ring-mint/25",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "relative grid size-1.5 place-items-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "payout-live-dot absolute inset-0 rounded-full bg-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-primary" })]
					}), "Real-time earnings"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					id: "live-earnings-heading",
					className: "mt-3 font-display text-[1.6rem] leading-tight text-foreground sm:text-[2rem]",
					children: ["Live ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-gold-dark",
						children: "earnings"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mx-auto mt-2 max-w-md text-sm text-muted-foreground",
					children: "A sample of payouts running through CashGPT. Usernames are masked for privacy."
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto mt-6 flex max-w-lg flex-col gap-2",
			style: { minHeight: `256px` },
			"aria-live": "polite",
			"aria-atomic": "false",
			"data-testid": "live-earnings-rows",
			children: rows.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: { opacity: AGE_OPACITY[index] ?? .3 },
				className: "transition-opacity duration-700",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveActivityCard, { activity: row })
			}, row.id))
		})]
	});
}
//#endregion
export { LiveEarningsFeed };
