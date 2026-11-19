import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { Gt as Check, _t as Gift, b as Tag, bt as Flame, m as TrendingUp, rn as ArrowUpRight, t as Zap, tt as ListFilter, x as Star } from "../_libs/lucide-react.mjs";
import { t as Skeleton } from "./skeleton-D9W9wFsj.mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { H as formatReward, Ot as Button, nr as useServerFn } from "./router-sXMnYegW.mjs";
import { n as ErrorState, t as EmptyState } from "./States-Cg9ELwgo.mjs";
import { a as SheetTrigger, i as SheetTitle, n as SheetContent, r as SheetHeader, t as Sheet } from "./sheet-BNcevado.mjs";
import { a as getFeaturedFeed, s as getOfferById, u as offerDisplayBadge } from "./offers.functions-CQ4rFVpp.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/FeaturedOffers-pOqzVpyY.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var CONFIG = {
	Deal: {
		icon: Tag,
		label: "Deal",
		className: "bg-gold-gradient text-gold-foreground shadow-gold"
	},
	Hot: {
		icon: Flame,
		label: "Hot",
		className: "bg-red-500/95 text-white shadow-sm"
	},
	Trending: {
		icon: TrendingUp,
		label: "Trending",
		className: "bg-primary/95 text-primary-foreground shadow-sm"
	},
	Easy: {
		icon: Zap,
		label: "Easy",
		className: "bg-mint-gradient text-primary shadow-sm"
	},
	Popular: {
		icon: Star,
		label: "Popular",
		className: "bg-gold/95 text-gold-foreground shadow-sm"
	}
};
function OfferTagRow({ tags, isDeal, className = "", size = "sm" }) {
	const items = [];
	if (isDeal) items.push("Deal");
	for (const t of tags) if (!items.includes(t)) items.push(t);
	if (!items.length) return null;
	const px = size === "xs" ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[11px]";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `flex flex-wrap gap-1 ${className}`,
		"data-testid": "offer-tag-row",
		children: items.map((key) => {
			const c = CONFIG[key];
			const Icon = c.icon;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: `inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wide ${px} ${c.className}`,
				"data-testid": `offer-tag-${key.toLowerCase()}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: size === "xs" ? "size-2.5" : "size-3" }), c.label]
			}, key);
		})
	});
}
/**
* Memoized offer card with internal image error state.
* Renders as a Link to prevent re-renders when other cards change.
*/
var OfferCard = (0, import_react.memo)(function OfferCard({ id, title, description, reward_amount, image_url, tags, is_limited_deal, display_price, display_percent, claim_status, onPrefetch, isEager = false, isPriority = false }) {
	const [broken, setBroken] = (0, import_react.useState)(false);
	const handleImageError = (0, import_react.useCallback)(() => setBroken(true), []);
	const showImage = Boolean(image_url) && !broken;
	const imageSrc = image_url && image_url.includes("supabase.co/storage") ? `${image_url}?width=360&quality=70` : image_url;
	const displayBadge = offerDisplayBadge({
		display_price,
		display_percent
	});
	const showStatusBadge = claim_status === "started" || claim_status === "pending";
	const statusText = claim_status === "started" ? "In progress" : "Pending";
	const statusColor = claim_status === "started" ? "bg-primary text-primary-foreground" : "bg-amber-500 text-white";
	const handleClick = (0, import_react.useCallback)(() => {
		title.substring(0, 100);
	}, [id, title]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
		className: "surface-card group relative flex cursor-pointer flex-col overflow-hidden !p-0 shadow-soft outline-none transition-[transform,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.98]",
		style: {
			contentVisibility: "auto",
			containIntrinsicSize: "0 250px"
		},
		"data-testid": `featured-offer-${id}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: "/offer/$offerId",
			params: { offerId: id },
			preload: "intent",
			className: "flex flex-1 flex-col",
			onClick: handleClick,
			onTouchStart: onPrefetch,
			onPointerDown: onPrefetch,
			onMouseEnter: onPrefetch,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative aspect-[4/3] w-full overflow-hidden bg-background-alt",
				children: [
					showImage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: imageSrc,
						alt: title,
						width: 360,
						height: 270,
						loading: isEager ? "eager" : "lazy",
						fetchPriority: isPriority ? "high" : void 0,
						decoding: "async",
						onError: handleImageError,
						className: "size-full object-cover transition-transform duration-300"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-full place-items-center bg-jade-gradient text-primary-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gift, { className: "size-7" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/25 to-transparent" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfferTagRow, {
						tags: tags ?? [],
						isDeal: is_limited_deal,
						size: "xs",
						className: "absolute left-1.5 top-1.5"
					}),
					showStatusBadge && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `absolute right-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor}`,
						children: statusText
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute bottom-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-card/95 text-primary shadow-soft transition-transform duration-200",
						"data-testid": `featured-offer-claim-${id}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-3.5" })
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-1 flex-col gap-0.5 p-2.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-[13px] font-semibold leading-tight",
						children: title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-[11px] leading-snug text-muted-foreground",
						children: description
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-amount mt-auto pt-1 text-base leading-none text-gold-dark",
						"data-testid": `featured-offer-amount-${id}`,
						children: displayBadge ?? formatReward(reward_amount)
					})
				]
			})]
		})
	});
});
var FILTERS = [
	"All",
	"App Install",
	"Trial",
	"Deals",
	"Survey",
	"Games",
	"Link Locker",
	"Shortlink"
];
function OfferFilterButton({ value, onChange }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const handleSelect = (filter) => {
		setOpen(false);
		setTimeout(() => {
			(0, import_react.startTransition)(() => {
				onChange(filter);
			});
		}, 180);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "button",
				variant: "outline",
				size: "sm",
				className: "gap-1.5 rounded-full border-primary/30 bg-background pl-3 pr-4 shadow-soft",
				"data-testid": "offer-filter-btn",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListFilter, { className: "size-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-semibold",
					children: value === "All" ? "Filter" : value
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			side: "bottom",
			className: "max-h-[85dvh] overflow-y-auto rounded-t-2xl",
			style: {
				paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
				animation: "slide-up 200ms ease-out"
			},
			"data-testid": "offer-filter-sheet",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-4 h-1 w-12 rounded-full bg-muted" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: "Filter offers" }) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-2 space-y-1 pb-4",
					children: FILTERS.map((filter) => {
						const active = value === filter;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => handleSelect(filter),
							"data-testid": `offer-filter-option-${filter.replace(/\s+/g, "-").toLowerCase()}`,
							className: `flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${active ? "border-primary bg-primary/10 font-semibold text-primary" : "border-border bg-card hover:bg-background-alt"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: filter === "All" ? "All Offers" : filter }), active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4 text-primary" })]
						}) }, filter);
					})
				})
			]
		})]
	});
}
/**
* Matches an offer's category (may be null) against the currently-selected filter.
* "All" matches everything. "Deals" matches EITHER category=Deals OR is_limited_deal=true
* so the flagship cashback deals surface naturally under the filter.
*/
function offerMatchesFilter(filter, offer) {
	if (filter === "All") return true;
	if (filter === "Deals" && offer.is_limited_deal) return true;
	return offer.category === filter;
}
var INITIAL_RENDER = 18;
var LOAD_MORE = 18;
var visibleCountStore = /* @__PURE__ */ new Map();
function FeaturedOffers({ scope = "home", filter }) {
	const fetchFeed = useServerFn(getFeaturedFeed);
	const fetchOffer = useServerFn(getOfferById);
	const queryClient = useQueryClient();
	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: ["featured-feed", scope],
		queryFn: () => fetchFeed({ data: { scope } }),
		staleTime: 3e5,
		gcTime: 6e5
	});
	(0, import_react.useEffect)(() => {
		if (data?.offers) {
			console.log("[FeaturedOffers] Feed loaded:", {
				country: data.country,
				totalOffers: data.offers.length,
				categories: [...new Set(data.offers.map((o) => o.category || "null"))]
			});
			data.country, data.offers.length;
		}
	}, [data, scope]);
	const [visibleCount, setVisibleCount] = (0, import_react.useState)(() => {
		return visibleCountStore.get(scope) ?? INITIAL_RENDER;
	});
	(0, import_react.useEffect)(() => {
		visibleCountStore.set(scope, visibleCount);
	}, [scope, visibleCount]);
	const sentinelRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (scope === "home") {
			const prefetch = () => {
				queryClient.prefetchQuery({
					queryKey: ["featured-feed", "all"],
					queryFn: () => fetchFeed({ data: { scope: "all" } }),
					staleTime: 3e5
				});
			};
			if (typeof requestIdleCallback !== "undefined") {
				const id = requestIdleCallback(prefetch);
				return () => cancelIdleCallback(id);
			} else {
				const timeout = setTimeout(prefetch, 2500);
				return () => clearTimeout(timeout);
			}
		}
	}, [
		scope,
		queryClient,
		fetchFeed
	]);
	(0, import_react.useEffect)(() => {
		if (!data?.offers?.length) return;
		data.offers.slice(0, Math.min(12, data.offers.length)).forEach((offer) => {
			if (queryClient.getQueryData(["offer", offer.id])) return;
			queryClient.prefetchQuery({
				queryKey: ["offer", offer.id],
				queryFn: () => fetchOffer({ data: { offerId: offer.id } }),
				staleTime: 0
			});
		});
	}, [
		data?.offers,
		queryClient,
		fetchOffer
	]);
	(0, import_react.useEffect)(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel) return;
		const observer = new IntersectionObserver((entries) => {
			if (entries[0]?.isIntersecting) setVisibleCount((prev) => prev + LOAD_MORE);
		}, { rootMargin: "600px" });
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, []);
	const deferredFilter = (0, import_react.useDeferredValue)(filter);
	const offers = (0, import_react.useMemo)(() => {
		const rawOffers = data?.offers ?? [];
		const result = deferredFilter && deferredFilter !== "All" ? rawOffers.filter((o) => offerMatchesFilter(deferredFilter, o)) : rawOffers;
		if (deferredFilter === "Games") {
			console.log("[FeaturedOffers] Games filter active");
			console.log("[FeaturedOffers] Raw offers:", rawOffers.length);
			console.log("[FeaturedOffers] Games offers:", result.length);
			console.log("[FeaturedOffers] Sample offers with category:", rawOffers.slice(0, 5).map((o) => ({
				title: o.title,
				category: o.category
			})));
			const categoryCount = /* @__PURE__ */ new Map();
			rawOffers.forEach((o) => {
				const cat = o.category || "null";
				categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1);
			});
			console.log("[FeaturedOffers] Category breakdown:", Object.fromEntries(categoryCount));
			const allGames = rawOffers.filter((o) => o.category === "Games");
			console.log("[FeaturedOffers] Total Games in feed:", allGames.length);
			if (allGames.length > 0) console.log("[FeaturedOffers] Sample Games:", allGames.slice(0, 3).map((g) => ({
				title: g.title,
				devices: g.devices
			})));
		}
		return result;
	}, [data?.offers, deferredFilter]);
	const visibleOffers = (0, import_react.useMemo)(() => offers.slice(0, visibleCount), [offers, visibleCount]);
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-3 gap-3",
		"data-testid": "featured-offers-loading",
		children: [
			0,
			1,
			2,
			3,
			4,
			5,
			6,
			7,
			8
		].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "aspect-[3/4] w-full rounded-[1.25rem]" }, i))
	});
	if (isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, { onRetry: () => void refetch() });
	if (!offers.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
		icon: Gift,
		title: filter && filter !== "All" ? `No ${filter} offers right now` : "No offers available right now",
		description: "Check back soon — new partner offers land every day."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "grid grid-cols-3 gap-3",
		"data-testid": "featured-offers-list",
		children: visibleOffers.map((offer, index) => {
			const handlePrefetch = () => {
				if (queryClient.getQueryData(["offer", offer.id])) return;
				queryClient.prefetchQuery({
					queryKey: ["offer", offer.id],
					queryFn: () => fetchOffer({ data: { offerId: offer.id } }),
					staleTime: 0
				});
			};
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfferCard, {
				id: offer.id,
				title: offer.title,
				description: offer.description,
				reward_amount: offer.reward_amount,
				image_url: offer.image_url,
				tags: offer.tags,
				is_limited_deal: offer.is_limited_deal,
				display_price: offer.display_price,
				display_percent: offer.display_percent,
				claim_status: offer.claim_status,
				isEager: index < 6,
				isPriority: index < 3,
				onPrefetch: handlePrefetch
			}, offer.id);
		})
	}), visibleCount < offers.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: sentinelRef,
		className: "h-px",
		"aria-hidden": "true"
	})] });
}
//#endregion
export { OfferFilterButton as n, FeaturedOffers as t };
