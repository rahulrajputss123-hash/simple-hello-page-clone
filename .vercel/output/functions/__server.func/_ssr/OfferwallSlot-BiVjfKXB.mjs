import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { Et as ExternalLink, st as Layers } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { Ot as Button, St as startActiveTimeGrace, nr as useServerFn, tr as useAuth } from "./router-sXMnYegW.mjs";
import { i as getToroxWallUrl, n as getOfferwallMeSignedUrl, r as getTheoremReachSignedUrl, s as listSdkOfferwallProviders } from "./sdk-offerwall.functions-qLMu5QL8.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/OfferwallSlot-BiVjfKXB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function buildOfferwallUrl(slug, appId, userId) {
	if (userId.startsWith("q_")) {
		console.error(`[offerwall] Quest token blocked in normal offerwall URL: ${userId.slice(0, 10)}...`);
		return null;
	}
	if (slug === "mooffers") return `https://wall.mooffers.com/offerwall/${appId}?uid=${encodeURIComponent(userId)}`;
	if (slug === "affike") return `https://affike.com/offerwall/${appId}/${encodeURIComponent(userId)}`;
	if (slug === "revtoo") return `https://revtoo.com/offerwall/${appId}/${encodeURIComponent(userId)}`;
	if (slug === "offerwallme") return "signed-url-required";
	if (slug === "theoremreach") return "signed-url-required";
	if (slug === "torox") return "signed-url-required";
	if (slug === "gemiad") return `https://gemiwall.com/${appId}/${encodeURIComponent(userId)}`;
	if (slug === "timewall") return `https://timewall.io/users/login?oid=${appId}&uid=${encodeURIComponent(userId)}`;
	if (slug === "cpxresearch") return `https://offers.cpx-research.com/index.php?app_id=${appId}&ext_user_id=${encodeURIComponent(userId)}`;
	if (slug === "adswedmedia") return `https://adswedmedia.com/offer/${appId}/${encodeURIComponent(userId)}`;
	return null;
}
var OfferwallCard = (0, import_react.memo)(function OfferwallCard({ provider, url, slug, onImageError, activeTimeQuestKey }) {
	const [broken, setBroken] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const fetchOfferwallMeUrl = useServerFn(getOfferwallMeSignedUrl);
	const fetchTheoremReachUrl = useServerFn(getTheoremReachSignedUrl);
	const fetchToroxUrl = useServerFn(getToroxWallUrl);
	const startGrace = useServerFn(startActiveTimeGrace);
	const handleError = (0, import_react.useCallback)(() => {
		setBroken(true);
		onImageError(provider.id);
	}, [provider.id, onImageError]);
	const handleSignedUrlClick = (0, import_react.useCallback)(async (providerSlug) => {
		if (loading) return;
		setLoading(true);
		if (activeTimeQuestKey) startGrace({ data: {
			questKey: activeTimeQuestKey,
			offerId: provider.id
		} }).catch((err) => {
			console.warn("[active-time] Failed to start grace period:", err);
		});
		const tab = window.open("", "_blank");
		try {
			let signedUrl;
			if (providerSlug === "offerwallme") signedUrl = await fetchOfferwallMeUrl({});
			else if (providerSlug === "theoremreach") signedUrl = await fetchTheoremReachUrl({});
			else if (providerSlug === "torox") signedUrl = await fetchToroxUrl({});
			else throw new Error("Unknown signed URL provider");
			if (tab) tab.location.href = signedUrl;
		} catch (err) {
			if (tab) tab.close();
			toast.error(err instanceof Error ? err.message : `Failed to open ${providerSlug}`);
		} finally {
			setLoading(false);
		}
	}, [
		fetchOfferwallMeUrl,
		fetchTheoremReachUrl,
		fetchToroxUrl,
		loading,
		activeTimeQuestKey,
		startGrace,
		provider.id
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "surface-card flex flex-col overflow-hidden !p-0 shadow-soft transition-[transform,box-shadow] duration-200 active:scale-[0.98]",
		style: {
			contentVisibility: "auto",
			containIntrinsicSize: "0 200px"
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "relative aspect-[16/9] w-full overflow-hidden bg-background-alt",
			children: provider.logoUrl && !broken ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: provider.logoUrl,
				alt: `${provider.name} banner`,
				loading: "lazy",
				decoding: "async",
				onError: handleError,
				className: "size-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid size-full place-items-center bg-jade-gradient text-primary-foreground",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "size-7" })
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-1 flex-col gap-2 p-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-semibold leading-tight",
				children: provider.name
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: provider.tagline
			})] }), url ? slug === "offerwallme" || slug === "theoremreach" || slug === "torox" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				variant: "jade",
				className: "mt-auto gap-1",
				onClick: () => handleSignedUrlClick(slug),
				disabled: loading,
				children: [
					loading ? "Opening…" : "Open",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3.5" })
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "jade",
				className: "mt-auto gap-1",
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: url,
					target: "_blank",
					rel: "noopener noreferrer",
					children: ["Open ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3.5" })]
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				variant: "outline",
				className: "mt-auto gap-1",
				disabled: true,
				children: ["Mobile app only ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3.5" })]
			})]
		})]
	});
});
function OfferwallSlot({ limit, activeTimeQuestKey }) {
	const { session } = useAuth();
	const fetchProviders = useServerFn(listSdkOfferwallProviders);
	const providers = useQuery({
		queryKey: ["sdk-offerwall-public", limit ?? "all"],
		queryFn: () => fetchProviders({ data: limit ? { limit } : {} }),
		staleTime: 3e5,
		gcTime: 6e5
	});
	const handleImageError = (0, import_react.useCallback)((_id) => {}, []);
	if (providers.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted-foreground",
		children: "Loading offerwalls…"
	});
	if (!providers.data?.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted-foreground",
		children: "No offerwall networks are active yet. Check back soon."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "stagger-children grid grid-cols-2 gap-3",
		children: providers.data.map((provider) => {
			const url = provider.integrationType === "web_sdk" && provider.appId && session?.user.id ? buildOfferwallUrl(provider.slug, provider.appId, session.user.id) : null;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfferwallCard, {
				provider,
				url,
				slug: provider.slug,
				onImageError: handleImageError,
				activeTimeQuestKey
			}, provider.id);
		})
	});
}
//#endregion
export { OfferwallSlot as t };
