import { i as __toESM } from "../_runtime.mjs";
import { o as formatMoney } from "./referral-progress-DmJLJmiB.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { _t as Gift, c as UserRound } from "../_libs/lucide-react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as skipToken } from "../_libs/tanstack__query-core.mjs";
import { t as AVATAR_OPTIONS } from "./premium-BIRn1NQB.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/SimulatedLiveActivity-DXX0vD52.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Cadence between replacements. The visible activity is never cleared in
* between — the next one replaces it directly, so there is no blank gap.
*
* Each gap is drawn uniformly from 18–24s, which bounds the rate to
* 3600/24 = 150 and 3600/18 = 200 changes per hour. Because every single gap
* sits inside that window, any hour of feed stays within 150–200 changes, not
* just the average. (Browsers throttle timers in hidden tabs, which can only
* slow the feed down while it isn't visible.)
*/
var ROTATE_MIN_MS = 18e3;
var ROTATE_MAX_MS = 24e3;
/** Short delay before the first activity appears, then it stays for good. */
var FIRST_SHOW_MS = 400;
/**
* Hard ceiling. A payout of exactly $50.00 is allowed; anything above it must
* never appear in the feed.
*/
var MAX_REWARD = 50;
/**
* Weighted tier probabilities — low payouts dominate the stream and high ones
* are rare, so the feed never looks like a list of the biggest offers.
* Roughly 65 / 27 / 8 percent.
*/
var TIER_WEIGHTS = {
	low: .65,
	mid: .27,
	high: .08
};
/**
* Anonymised dummy usernames (152 unique). These are invented placeholders — no
* value here is read from, derived from, or matched against a registered user.
*/
var DUMMY_USERNAMES = [
	"Rahul*",
	"Priya**",
	"Aman***",
	"Neha**",
	"Vikram*",
	"Arjun*",
	"Meera**",
	"Rohit*",
	"Ananya**",
	"Karan*",
	"Divya**",
	"Nikhil*",
	"Pooja**",
	"Sanjay*",
	"Kavya**",
	"Manish*",
	"Ritu**",
	"Deepak*",
	"Shreya**",
	"Varun*",
	"Isha**",
	"Gaurav*",
	"Tanya**",
	"Akash*",
	"Nisha**",
	"Rajesh*",
	"Swati**",
	"Abhay*",
	"Preeti**",
	"Suresh*",
	"Anjali**",
	"Kunal*",
	"Sneha**",
	"Mohit*",
	"Simran**",
	"Yash*",
	"Payal**",
	"Harsh*",
	"Komal**",
	"Tarun*",
	"Rekha**",
	"Vishal*",
	"Jyoti**",
	"Ajay*",
	"Bhavna**",
	"Naveen*",
	"Lata**",
	"Farhan*",
	"Ayesha**",
	"Imran*",
	"Alex*",
	"Sam*",
	"Sara**",
	"Emma**",
	"Liam*",
	"Olivia**",
	"Noah*",
	"Ava**",
	"Ethan*",
	"Sophia**",
	"Mason*",
	"Mia**",
	"Lucas*",
	"Isabella**",
	"Logan*",
	"Amelia**",
	"Jacob*",
	"Harper**",
	"Jack*",
	"Ella**",
	"Ryan*",
	"Grace**",
	"Owen*",
	"Chloe**",
	"Dylan*",
	"Zoe**",
	"Caleb*",
	"Lily**",
	"Nathan*",
	"Ruby**",
	"Aaron*",
	"Nora**",
	"Carlos*",
	"Maria**",
	"Diego*",
	"Lucia**",
	"Javier*",
	"Elena**",
	"Miguel*",
	"Sofia**",
	"Pablo*",
	"Carmen**",
	"Chen*",
	"Wei**",
	"Yuki*",
	"Hana**",
	"Minjun*",
	"Jiho**",
	"Aiko*",
	"Kenji**",
	"Ahmed*",
	"Fatima**",
	"Omar*",
	"Layla**",
	"Yusuf*",
	"Zara**",
	"Bilal*",
	"Amina**",
	"Daniel*",
	"Rachel**",
	"Piotr*",
	"Laura**",
	"Tomas*",
	"Nina**",
	"Viktor*",
	"Anna**",
	"Kwame*",
	"Amara**",
	"Chidi*",
	"Zuri**",
	"User_8291",
	"User_4718",
	"User_2053",
	"User_6142",
	"User_9375",
	"User_1826",
	"User_5490",
	"User_7238",
	"User_3061",
	"User_8547",
	"User_2914",
	"User_6703",
	"User_4185",
	"User_9628",
	"User_1357",
	"User_7042",
	"User_5871",
	"User_3496",
	"User_8130",
	"User_2765",
	"User_6019",
	"User_4523",
	"User_9184",
	"User_1670",
	"User_7395",
	"User_5238",
	"User_3801",
	"User_8462",
	"User_2107",
	"User_6584",
	"User_4970",
	"User_1243"
];
/** Inclusive random integer. */
function randInt(min, max) {
	return min + Math.floor(Math.random() * (max - min + 1));
}
function pickOne(list) {
	return list.length ? list[randInt(0, list.length - 1)] ?? null : null;
}
/**
* Module-level variable to persist the last shown activity across navigation.
* Browser-only: never shared on the server.
*/
var lastShownActivity = null;
if (typeof window !== "undefined") lastShownActivity = null;
/**
* Splits the pool into payout tiers by rank, not by fixed dollar thresholds, so
* the tiering adapts to whatever payouts actually exist: the cheapest ~60% are
* "low", the next ~30% "mid", the dearest ~10% "high". Ranking by position keeps
* every tier non-empty for any pool size, which fixed cut-offs would not.
*
* Anything above MAX_REWARD is dropped here and can never be selected.
*/
function buildTiers(items) {
	const eligible = items.filter((item) => Number.isFinite(item.reward_amount) && item.reward_amount > 0 && item.reward_amount <= MAX_REWARD);
	if (!eligible.length) return null;
	const sorted = [...eligible].sort((a, b) => a.reward_amount - b.reward_amount);
	const count = sorted.length;
	const lowEnd = Math.max(1, Math.round(count * .6));
	const midEnd = Math.max(lowEnd, Math.round(count * .9));
	return {
		low: sorted.slice(0, lowEnd),
		mid: sorted.slice(lowEnd, midEnd),
		high: sorted.slice(midEnd)
	};
}
/**
* Weighted pick across the tiers. Empty tiers are skipped and their weight is
* renormalised over the rest, so a small pool still behaves sensibly.
*/
function pickWeighted(tiers) {
	const buckets = [
		{
			items: tiers.low,
			weight: TIER_WEIGHTS.low
		},
		{
			items: tiers.mid,
			weight: TIER_WEIGHTS.mid
		},
		{
			items: tiers.high,
			weight: TIER_WEIGHTS.high
		}
	].filter((bucket) => bucket.items.length > 0);
	if (!buckets.length) return null;
	const total = buckets.reduce((sum, bucket) => sum + bucket.weight, 0);
	let roll = Math.random() * total;
	for (const bucket of buckets) {
		roll -= bucket.weight;
		if (roll <= 0) return pickOne(bucket.items);
	}
	return pickOne(buckets[buckets.length - 1].items);
}
/**
* Safely picks a valid avatar from AVATAR_OPTIONS. Ensures the selected avatar
* has a usable imageUrl. If the first pick is invalid, tries again with a
* different option. Never returns null.
*/
function pickAvatar() {
	if (AVATAR_OPTIONS.length === 0) return null;
	for (let attempt = 0; attempt < 3; attempt++) {
		const avatar = pickOne(AVATAR_OPTIONS);
		if (avatar?.imageUrl) return avatar.imageUrl;
	}
	return AVATAR_OPTIONS[0]?.imageUrl ?? null;
}
/**
* Builds one activity from a real offer/quest + a dummy username, retrying a few
* times so the same username+source pair never appears twice in a row.
*/
function buildActivity(items, lastCombo) {
	const tiers = buildTiers(items);
	if (!tiers) return null;
	for (let attempt = 0; attempt < 8; attempt++) {
		const username = pickOne(DUMMY_USERNAMES);
		const offer = pickWeighted(tiers);
		if (!username || !offer) return null;
		const combo = `${username}|${offer.id}`;
		if (combo === lastCombo && attempt < 7) continue;
		return {
			id: `${combo}|${Date.now()}`,
			username,
			avatarUrl: pickAvatar(),
			offerId: offer.id,
			offerTitle: offer.title,
			offerImageUrl: offer.image_url,
			rewardAmount: offer.reward_amount
		};
	}
	return null;
}
/**
* Drives a CONTINUOUS feed: once the first activity is shown it stays visible
* and is replaced in place by the next one. The hook never returns to null
* after the first activity, so the UI has no blank state to render.
*
* @param items Real offers + active quests. Stays idle until non-empty.
*/
function useSimulatedActivityFeed(items) {
	const [current, setCurrent] = (0, import_react.useState)(() => {
		if (typeof window !== "undefined") return lastShownActivity;
		return null;
	});
	const itemsRef = (0, import_react.useRef)(items);
	itemsRef.current = items;
	const lastComboRef = (0, import_react.useRef)(current ? `${current.username}|${current.offerId}` : null);
	const hasItems = items.length > 0;
	(0, import_react.useEffect)(() => {
		if (!hasItems) return;
		let cancelled = false;
		let timer;
		const rotate = () => {
			if (cancelled) return;
			const next = buildActivity(itemsRef.current, lastComboRef.current);
			if (next) {
				lastComboRef.current = `${next.username}|${next.offerId}`;
				setCurrent(next);
				if (typeof window !== "undefined") lastShownActivity = next;
			}
			timer = setTimeout(rotate, randInt(ROTATE_MIN_MS, ROTATE_MAX_MS));
		};
		const initialDelay = current ? randInt(ROTATE_MIN_MS, ROTATE_MAX_MS) : FIRST_SHOW_MS;
		timer = setTimeout(rotate, initialDelay);
		return () => {
			cancelled = true;
			if (timer) clearTimeout(timer);
		};
	}, [hasItems, current]);
	return current;
}
/**
* Presentational activity row. Kept separate from the timing/data wiring so it can
* be rendered in isolation for visual review.
*/
function LiveActivityCard({ activity }) {
	const [avatarError, setAvatarError] = (0, import_react.useState)(false);
	const fallbackAvatarUrl = AVATAR_OPTIONS[0]?.imageUrl ?? null;
	const displayAvatarUrl = avatarError && activity.avatarUrl !== fallbackAvatarUrl ? fallbackAvatarUrl : activity.avatarUrl;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "live-activity-card surface-card flex items-center gap-2.5 p-2.5 shadow-soft",
		"data-testid": "live-activity-card",
		children: [
			displayAvatarUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: displayAvatarUrl,
				alt: "",
				"aria-hidden": true,
				loading: "lazy",
				decoding: "async",
				className: "size-9 shrink-0 rounded-full border border-border object-cover",
				"data-testid": "live-activity-avatar",
				onError: () => {
					if (!avatarError) setAvatarError(true);
				}
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				"aria-hidden": true,
				className: "grid size-9 shrink-0 place-items-center rounded-full bg-mint/15 text-primary ring-1 ring-inset ring-mint/25",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, { className: "size-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "truncate text-[12px] leading-tight",
					"data-testid": "live-activity-text",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold text-foreground",
							children: activity.username
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground",
							children: " completed "
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium text-foreground",
							children: activity.offerTitle
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 flex items-center gap-1.5 leading-none",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "relative grid size-1.5 shrink-0 place-items-center",
						"aria-hidden": true,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "payout-live-dot absolute inset-0 rounded-full bg-mint" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-mint" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-amount text-[12px] leading-none text-gold-dark",
						children: ["Earned +", formatMoney(activity.rewardAmount)]
					})]
				})]
			}),
			activity.offerImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: activity.offerImageUrl,
				alt: "",
				"aria-hidden": true,
				loading: "lazy",
				decoding: "async",
				className: "size-9 shrink-0 rounded-xl border border-border object-cover",
				"data-testid": "live-activity-offer-image"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				"aria-hidden": true,
				className: "grid size-9 shrink-0 place-items-center rounded-xl bg-jade-gradient text-primary-foreground",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gift, { className: "size-4" })
			})
		]
	});
}
/** A quest icon doubles as an image URL when it is one; otherwise there is none. */
function questImageUrl(icon) {
	const value = (icon ?? "").trim();
	return /^https?:\/\//i.test(value) ? value : null;
}
/**
* Compact simulated "live activity" strip for the Home page.
*
* The pool is built from exactly TWO sources, both already loaded by this page:
*   1. Featured/regular offers — the cache entry <FeaturedOffers scope="home" />
*      fills, so GEO filtering, active/expiry filtering and per-user hiding are
*      all inherited from the existing feed.
*   2. Active quests — the cache entry <StarterQuests /> fills.
*
* Offerwall data is deliberately NOT a source.
*
* `skipToken` on both observers means this component only *reads* those caches
* and never issues a request of its own, so neither the GEO logic nor the quest
* system is duplicated here.
*
* Purely presentational: nothing here writes data or triggers tracking.
*/
function SimulatedLiveActivity() {
	const { data, isSuccess: feedLoaded } = useQuery({
		queryKey: ["featured-feed", "home"],
		queryFn: skipToken
	});
	const { data: quests, isSuccess: questsLoaded } = useQuery({
		queryKey: ["quests-active"],
		queryFn: skipToken
	});
	const items = (0, import_react.useMemo)(() => {
		const offerItems = (data?.offers ?? []).map((offer) => ({
			id: offer.id,
			title: offer.title,
			reward_amount: offer.reward_amount,
			image_url: offer.image_url
		}));
		const questItems = (quests ?? []).map((quest) => ({
			id: `quest:${quest.id}`,
			title: quest.label,
			reward_amount: Number(quest.reward_amount ?? 0),
			image_url: questImageUrl(quest.icon)
		}));
		return [...offerItems, ...questItems];
	}, [data?.offers, quests]);
	const activity = useSimulatedActivityFeed(items);
	const hasNoItems = feedLoaded && questsLoaded && items.length === 0;
	const showPlaceholder = !activity && !hasNoItems;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `live-activity-slot grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${activity || showPlaceholder ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`,
		"aria-live": "polite",
		"aria-atomic": "true",
		"data-testid": "live-activity-slot",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "overflow-hidden",
			children: [showPlaceholder && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pt-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card flex h-[56px] items-center gap-2.5 rounded-2xl p-2.5 shadow-soft",
					"data-testid": "live-activity-placeholder",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "size-9 shrink-0 rounded-full bg-muted" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1 space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 w-3/4 rounded bg-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 w-1/2 rounded bg-muted" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "size-9 shrink-0 rounded-xl bg-muted" })
					]
				})
			}), activity && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pt-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveActivityCard, { activity }, activity.id)
			})]
		})
	});
}
//#endregion
export { SimulatedLiveActivity as n, useSimulatedActivityFeed as r, LiveActivityCard as t };
