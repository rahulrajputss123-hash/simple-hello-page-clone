import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { C as Sparkles, _t as Gift, bt as Flame, in as ArrowRight, nt as ListChecks } from "../_libs/lucide-react.mjs";
import { i as createServerFn } from "./server-CpGMOUrW.mjs";
import { t as createSsrRpc } from "./createSsrRpc-Bbq2Yr9O.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Br_KWlRY.mjs";
import { n as supabase, t as safeStorage } from "./client-QOMq7HzS.mjs";
import { i as enumType, l as stringType, o as numberType, r as booleanType, s as objectType } from "../_libs/zod.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { nr as useServerFn, tr as useAuth } from "./router-sXMnYegW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/SectionBanner-Cf6xDjCJ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var sectionSchema = enumType([
	"home",
	"offers",
	"tasks",
	"offerwall"
]);
var ctaKindSchema = enumType([
	"none",
	"offers",
	"tasks",
	"offerwall",
	"offer",
	"offerwall_provider",
	"url"
]);
/** Authenticated: eligible custom+scheduled banners for a section. */
var listEligibleBanners = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ section: sectionSchema }).parse(input)).handler(createSsrRpc("6a7c320e1c86a9d2e931030f4080fade96597a5f487c7691c4627738dfc9b42d"));
/** Admin: full list including inactive/scheduled-outside-window. */
var listAdminBanners = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("dad71b67e380175074d9624654f05cbb11d369c8577e2e6a2b2c582f116dd3af"));
var saveBanner = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid().optional(),
	section: sectionSchema,
	title: stringType().trim().max(120).default(""),
	description: stringType().trim().max(500).default(""),
	imageUrl: stringType().trim().url().max(1e3).nullable().optional(),
	ctaLabel: stringType().trim().max(40).nullable().optional(),
	ctaKind: ctaKindSchema.default("none"),
	ctaTarget: stringType().trim().max(1e3).nullable().optional(),
	priority: numberType().int().min(0).max(9999).default(0),
	isActive: booleanType().default(true),
	startsAt: stringType().datetime().nullable().optional(),
	endsAt: stringType().datetime().nullable().optional()
}).refine((d) => d.title.length > 0 || Boolean(d.imageUrl), { message: "A banner needs either an image or a title." }).parse(input)).handler(createSsrRpc("f591482d446e664b444330d0996206e27a146e2704100ede39945e2e09155f62"));
var deleteBanner = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(createSsrRpc("e022ed18b2ca50ab1a6eb7abc5a10e30fb9057a68ee897b093e93156d73c491f"));
/** Authenticated: on/off state for smart-banner templates (fail-open if table missing). */
var listSmartBannerSettings = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("bcd925c33377882596932acaf4012ad8bca8b802c759d68b35e75c1254303423"));
/** Admin: enable/disable a single smart-banner template. */
var setSmartBannerEnabled = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	templateKey: stringType().trim().min(1).max(100),
	enabled: booleanType()
}).parse(input)).handler(createSsrRpc("5af89718379d3f3a9acf31d0f2e9c51a0bd467c9def3698744f786a2c265a123"));
/**
* Admin-only signed upload URL for image artwork.
*
* Shared by the Banners and Offers admin forms via `target`, so there is one
* implementation and one bucket rather than a near-duplicate per form.
* `target: "banners"` keeps the original bucket-root paths.
*/
var requestBannerUploadUrl = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	filename: stringType().trim().min(1).max(120),
	target: enumType(["banners", "offers"]).default("banners")
}).parse(input)).handler(createSsrRpc("92a64a7fcf14c96725985bd6609acae86c66c8e3528a5cff8d4cdf201d9fe0dc"));
/**
* Registry of every known smart-banner template. The `key` is the stable
* identifier used both as the rendered banner `id` and as the
* `smart_banner_settings.template_key` used by admin on/off switches.
* Keep this in sync with the ids produced by `buildSmartBanners` below.
*/
var SMART_BANNER_TEMPLATES = [
	{
		key: "smart:home:new-user",
		section: "home",
		name: "Welcome (new user)"
	},
	{
		key: "smart:home:returning",
		section: "home",
		name: "Welcome back (returning user)"
	},
	{
		key: "smart:home:streak",
		section: "home",
		name: "Daily streak"
	},
	{
		key: "smart:home:hot-offer",
		section: "home",
		name: "High-paying offer live"
	},
	{
		key: "smart:offers:count",
		section: "offers",
		name: "Offers ready count"
	},
	{
		key: "smart:offers:high-value",
		section: "offers",
		name: "Big payout available"
	},
	{
		key: "smart:tasks:near-complete",
		section: "tasks",
		name: "Tasks almost done"
	},
	{
		key: "smart:tasks:in-progress",
		section: "tasks",
		name: "Tasks in progress"
	},
	{
		key: "smart:tasks:streak",
		section: "tasks",
		name: "Task streak reminder"
	},
	{
		key: "smart:offerwall:live",
		section: "offerwall",
		name: "Networks live"
	},
	{
		key: "smart:offerwall:empty",
		section: "offerwall",
		name: "New partners on the way"
	}
];
var STREAK_GOAL = 7;
function firstName(name) {
	return (name ?? "").trim().split(/\s+/)[0] || "there";
}
function buildSmartBanners(section, ctx) {
	const banners = [];
	const profile = ctx.profile;
	const isNew = !profile?.lifetime_earned || Number(profile.lifetime_earned) === 0;
	const streak = Number(profile?.streak_count ?? 0);
	if (section === "home") {
		if (isNew) banners.push({
			id: "smart:home:new-user",
			section,
			title: `Welcome, ${firstName(profile?.name)} 👋`,
			description: "Start with a Starter Quest — watch a few ads and earn your first $1.00 in minutes.",
			priority: 50,
			variant: "welcome",
			cta: {
				label: "Start earning",
				route: "/home"
			}
		});
		else banners.push({
			id: "smart:home:returning",
			section,
			title: `Welcome back, ${firstName(profile?.name)}!`,
			description: "Fresh offers and tasks are waiting to top up your wallet today.",
			priority: 20,
			variant: "welcome",
			cta: {
				label: "See what's new",
				route: "/offers"
			}
		});
		if (streak > 0) {
			const toGoal = Math.max(0, STREAK_GOAL - streak % STREAK_GOAL);
			banners.push({
				id: "smart:home:streak",
				section,
				title: `🔥 ${streak}-day streak`,
				description: toGoal === 0 ? "You just hit a streak bonus — nice one. Keep it rolling tomorrow." : `${toGoal} more ${toGoal === 1 ? "day" : "days"} until your next streak bonus.`,
				priority: 40,
				variant: "streak",
				cta: {
					label: "Earn today",
					route: "/special"
				}
			});
		}
		if (ctx.hasHighValueOffer) banners.push({
			id: "smart:home:hot-offer",
			section,
			title: "High-paying offer live",
			description: "A partner offer worth $1+ just landed. Grab it while it's up.",
			priority: 30,
			variant: "opportunity",
			cta: {
				label: "View offer",
				route: "/offers"
			}
		});
	}
	if (section === "offers") {
		if (ctx.offersCount > 0) banners.push({
			id: "smart:offers:count",
			section,
			title: `${ctx.offersCount} offer${ctx.offersCount === 1 ? "" : "s"} ready for you`,
			description: "Complete any and we'll credit your wallet after review.",
			priority: 20,
			variant: "opportunity",
			cta: {
				label: "Browse offers",
				route: "/offers"
			}
		});
		if (ctx.hasHighValueOffer) banners.push({
			id: "smart:offers:high-value",
			section,
			title: "Big payout available",
			description: "One of today's partner offers pays more than $1 — check it out first.",
			priority: 40,
			variant: "opportunity",
			cta: null
		});
	}
	if (section === "tasks") {
		if (ctx.tasksNearComplete > 0) banners.push({
			id: "smart:tasks:near-complete",
			section,
			title: `${ctx.tasksNearComplete} task${ctx.tasksNearComplete === 1 ? "" : "s"} almost done`,
			description: "Finish the last steps to unlock the rewards you've already earned.",
			priority: 50,
			variant: "progress",
			cta: {
				label: "Finish tasks",
				route: "/special"
			}
		});
		else if (ctx.tasksInProgress > 0) banners.push({
			id: "smart:tasks:in-progress",
			section,
			title: "Keep the momentum going",
			description: `You've started ${ctx.tasksInProgress} task${ctx.tasksInProgress === 1 ? "" : "s"} — a few more steps unlocks the payout.`,
			priority: 30,
			variant: "progress",
			cta: null
		});
		if (streak > 0) banners.push({
			id: "smart:tasks:streak",
			section,
			title: `Day ${streak} of your streak`,
			description: "Complete at least one task today to keep the streak alive.",
			priority: 20,
			variant: "streak",
			cta: null
		});
	}
	if (section === "offerwall") {
		if (ctx.activeOfferwallCount > 0) banners.push({
			id: "smart:offerwall:live",
			section,
			title: `${ctx.activeOfferwallCount} network${ctx.activeOfferwallCount === 1 ? "" : "s"} live`,
			description: "Games, surveys and downloads — each partner pays into the same wallet.",
			priority: 20,
			variant: "opportunity",
			cta: {
				label: "Browse networks",
				route: "/offerwall"
			}
		});
		else banners.push({
			id: "smart:offerwall:empty",
			section,
			title: "New partners on the way",
			description: "We're onboarding new offerwall networks. Check back soon.",
			priority: 10,
			variant: "info",
			cta: null
		});
	}
	return banners;
}
var ROTATION_INTERVAL_MS = 6e3;
/** Crossfade length. Must match the .banner-fade-out animation in styles.css. */
var BANNER_FADE_MS = 350;
var LAST_SHOWN_STORAGE_PREFIX = "cashgpt.banner_last:";
function unifiedId(b) {
	return b.kind === "custom" ? `db:${b.data.id}` : b.data.id;
}
function unifiedPriority(b) {
	return b.kind === "custom" ? b.data.priority : b.data.priority;
}
function pickStartIndex(section, sortedIds) {
	if (sortedIds.length <= 1) return 0;
	if (typeof window === "undefined") return 0;
	const key = LAST_SHOWN_STORAGE_PREFIX + section;
	const last = safeStorage.getItem(key);
	if (!last) return 0;
	const idx = sortedIds.indexOf(last);
	if (idx === -1) return 0;
	return (idx + 1) % sortedIds.length;
}
/**
* SectionBanner
* - Loads DB-backed custom + scheduled banners for the section.
* - Builds smart banners from live user/app data (never DB-cached).
* - Merges by priority DESC, then round-robins visits within equal priority
*   using localStorage so the same one doesn't repeat.
*/
function SectionBanner({ section }) {
	const { session, profile } = useAuth();
	const fetchDb = useServerFn(listEligibleBanners);
	const fetchSmartSettings = useServerFn(listSmartBannerSettings);
	const dbQuery = useQuery({
		queryKey: ["banners", section],
		queryFn: () => fetchDb({ data: { section } }),
		staleTime: 6e4
	});
	const smartSettingsQuery = useQuery({
		queryKey: ["smart-banner-settings"],
		enabled: Boolean(session) && section !== "home",
		queryFn: () => fetchSmartSettings({}),
		staleTime: 6e4
	});
	const offersQ = useQuery({
		queryKey: ["banner-offers-count"],
		enabled: Boolean(session) && (section === "home" || section === "offers"),
		queryFn: async () => {
			const { data } = await supabase.from("offers").select("id, reward_amount, is_active").eq("is_active", true).limit(200);
			const rows = data ?? [];
			return {
				count: rows.length,
				hasHighValue: rows.some((r) => Number(r.reward_amount) >= 1)
			};
		},
		staleTime: 6e4
	});
	const tasksQ = useQuery({
		queryKey: ["banner-tasks-progress", session?.user.id],
		enabled: Boolean(session) && (section === "home" || section === "tasks"),
		queryFn: async () => {
			const { data } = await supabase.from("user_tasks").select("progress, target, status");
			const rows = data ?? [];
			return {
				inProgress: rows.filter((r) => r.status !== "completed").length,
				nearComplete: rows.filter((r) => r.status !== "completed" && Number(r.target ?? 0) > 0 && Number(r.progress ?? 0) / Number(r.target) >= .7).length
			};
		},
		staleTime: 6e4
	});
	const offerwallQ = useQuery({
		queryKey: ["banner-offerwall-count"],
		enabled: Boolean(session) && (section === "home" || section === "offerwall"),
		queryFn: async () => {
			const { data } = await supabase.from("sdk_offerwall_providers").select("id, enabled, status").eq("enabled", true);
			return (data ?? []).filter((r) => r.status !== "disabled").length;
		},
		staleTime: 6e4
	});
	const smart = (0, import_react.useMemo)(() => buildSmartBanners(section, {
		profile: profile ?? null,
		offersCount: offersQ.data?.count ?? 0,
		hasHighValueOffer: offersQ.data?.hasHighValue ?? false,
		tasksInProgress: tasksQ.data?.inProgress ?? 0,
		tasksNearComplete: tasksQ.data?.nearComplete ?? 0,
		activeOfferwallCount: offerwallQ.data ?? 0
	}), [
		section,
		profile,
		offersQ.data,
		tasksQ.data,
		offerwallQ.data
	]);
	const smartEligible = (0, import_react.useMemo)(() => {
		if (section === "home") return [];
		const disabled = new Set((smartSettingsQuery.data ?? []).filter((s) => !s.enabled).map((s) => s.template_key));
		return smart.filter((b) => !disabled.has(b.id));
	}, [
		section,
		smart,
		smartSettingsQuery.data
	]);
	const merged = (0, import_react.useMemo)(() => {
		return [...(dbQuery.data ?? []).map((b) => ({
			kind: "custom",
			data: b
		})), ...smartEligible.map((b) => ({
			kind: "smart",
			data: b
		}))].sort((a, b) => {
			const pa = unifiedPriority(a);
			const pb = unifiedPriority(b);
			if (pa !== pb) return pb - pa;
			return unifiedId(a).localeCompare(unifiedId(b));
		});
	}, [dbQuery.data, smartEligible]);
	const [index, setIndex] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		if (!merged.length) {
			setIndex(0);
			return;
		}
		const ids = merged.map(unifiedId);
		setIndex(pickStartIndex(section, ids));
	}, [section, merged]);
	const current = merged.length ? merged[Math.min(index, merged.length - 1)] : void 0;
	const currentId = current ? unifiedId(current) : null;
	/** Identity of the banner SET, so a refetch/reorder isn't mistaken for a rotation. */
	const setSignature = (0, import_react.useMemo)(() => merged.map(unifiedId).join("|"), [merged]);
	/**
	* The banner that was on screen before the current one. Held as the banner
	* OBJECT rather than an index so a refetch that reorders or shortens the list
	* can never leave the overlay pointing at the wrong entry.
	*/
	const [outgoing, setOutgoing] = (0, import_react.useState)(null);
	const shownRef = (0, import_react.useRef)(null);
	const setSignatureRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!current || !currentId) {
			shownRef.current = null;
			setOutgoing(null);
			return;
		}
		const previouslyShown = shownRef.current;
		shownRef.current = {
			id: currentId,
			banner: current
		};
		if (setSignatureRef.current !== setSignature) {
			setSignatureRef.current = setSignature;
			setOutgoing(null);
			return;
		}
		if (!previouslyShown || previouslyShown.id === currentId) return;
		setOutgoing(previouslyShown.banner);
		const t = setTimeout(() => setOutgoing(null), BANNER_FADE_MS);
		return () => clearTimeout(t);
	}, [
		current,
		currentId,
		setSignature
	]);
	/**
	* Warm the browser cache for EVERY banner image as soon as the list is known,
	* so rotating to one paints instantly. Without this the next banner's image
	* only starts downloading when its element mounts, which is what produced the
	* blank frame mid-transition.
	*/
	(0, import_react.useEffect)(() => {
		if (typeof window === "undefined") return;
		for (const banner of merged) {
			if (banner.kind !== "custom") continue;
			const url = banner.data.image_url;
			if (!url) continue;
			const img = new Image();
			img.decoding = "async";
			img.src = url;
		}
	}, [merged]);
	(0, import_react.useEffect)(() => {
		if (!merged.length || typeof window === "undefined") return;
		const id = unifiedId(merged[index] ?? merged[0]);
		safeStorage.setItem(LAST_SHOWN_STORAGE_PREFIX + section, id);
	}, [
		section,
		index,
		merged
	]);
	(0, import_react.useEffect)(() => {
		if (merged.length < 2) return;
		const t = setInterval(() => {
			setIndex((i) => (i + 1) % merged.length);
		}, ROTATION_INTERVAL_MS);
		return () => clearInterval(t);
	}, [merged.length]);
	const isLoading = dbQuery.isLoading;
	if (!isLoading && !merged.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mb-4 mt-3",
		"aria-label": `${section} banner`,
		"data-testid": `section-banner-${section}`,
		children: [isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "surface-card aspect-[2/1] w-full animate-pulse bg-muted shadow-lift",
			"aria-label": "Loading banner"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BannerCard, { banner: current }), outgoing && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "banner-fade-out pointer-events-none absolute inset-0 [&>article]:h-full [&>article]:w-full",
				"data-testid": `section-banner-outgoing-${section}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BannerCard, { banner: outgoing })
			})]
		}) }), !isLoading && merged.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2 flex justify-center gap-1.5",
			children: merged.map((b, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-label": `Show banner ${i + 1}`,
				onClick: () => setIndex(i),
				className: `h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-primary" : "w-1.5 bg-primary/30"}`,
				"data-testid": `section-banner-dot-${section}-${i}`
			}, unifiedId(b)))
		})]
	});
}
function BannerCard({ banner }) {
	if (banner.kind === "custom") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomBannerCard, { b: banner.data });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SmartBannerCard, { b: banner.data });
}
function CustomBannerCard({ b }) {
	const cta = b.cta_resolved;
	const hasImage = Boolean(b.image_url);
	const hasText = Boolean(b.title) || Boolean(b.description) || Boolean(cta);
	const pureImage = hasImage && !hasText;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: hasImage ? `surface-card relative aspect-[2/1] w-full overflow-hidden text-center shadow-lift` : `surface-card relative overflow-hidden p-5 text-center shadow-lift bg-jade-gradient text-primary-foreground`,
		"data-testid": `banner-custom-${b.id}`,
		children: [
			hasImage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: b.image_url,
				alt: b.title || "Banner",
				width: 1200,
				height: 600,
				loading: "eager",
				fetchPriority: "high",
				decoding: "async",
				className: "absolute inset-0 size-full object-cover"
			}),
			hasImage && hasText && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				"aria-hidden": true,
				className: "absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/40 to-transparent"
			}),
			!pureImage && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `relative flex h-full flex-col items-center justify-end gap-2 p-5 ${hasImage ? "text-primary-foreground" : ""}`,
				children: [
					b.title && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-xl leading-tight",
						children: b.title
					}),
					b.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "max-w-xs text-sm leading-snug opacity-90",
						children: b.description
					}),
					cta && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BannerCta, {
						cta,
						testid: `banner-custom-cta-${b.id}`
					})
				]
			})
		]
	});
}
var VARIANT_ICON = {
	welcome: Sparkles,
	streak: Flame,
	progress: ListChecks,
	opportunity: Gift,
	info: Sparkles
};
var VARIANT_ACCENT = {
	welcome: "bg-jade-gradient text-primary-foreground",
	streak: "bg-gold-gradient text-gold-foreground",
	progress: "bg-mint-gradient text-primary-foreground",
	opportunity: "bg-jade-gradient text-primary-foreground",
	info: "bg-background-alt text-foreground"
};
function SmartBannerCard({ b }) {
	const Icon = VARIANT_ICON[b.variant];
	const accent = VARIANT_ACCENT[b.variant];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
		className: `surface-card overflow-hidden p-5 text-center shadow-lift ${accent}`,
		"data-testid": `banner-smart-${b.id}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-10 place-items-center rounded-full bg-white/20 backdrop-blur-sm",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-display text-xl leading-tight",
					children: b.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "max-w-xs text-sm leading-snug opacity-90",
					children: b.description
				}),
				b.cta && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BannerCta, {
					cta: {
						route: b.cta.route,
						label: b.cta.label
					},
					testid: `banner-smart-cta-${b.id}`
				})
			]
		})
	});
}
function BannerCta({ cta, testid }) {
	const className = "mt-3 inline-flex items-center gap-1 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-inherit shadow-soft backdrop-blur-sm transition-colors hover:bg-white/30";
	if (cta.url) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
		href: cta.url,
		target: "_blank",
		rel: "noopener noreferrer",
		className,
		"data-testid": testid,
		children: [cta.label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: cta.route ?? "/home",
		className,
		"data-testid": testid,
		children: [cta.label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
	});
}
//#endregion
export { listSmartBannerSettings as a, setSmartBannerEnabled as c, listAdminBanners as i, SectionBanner as n, requestBannerUploadUrl as o, deleteBanner as r, saveBanner as s, SMART_BANNER_TEMPLATES as t };
