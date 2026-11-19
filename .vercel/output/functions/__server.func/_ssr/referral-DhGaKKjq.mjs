import { o as formatMoney } from "./referral-progress-DmJLJmiB.mjs";
import { x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { rt as Link2, s as Users } from "../_libs/lucide-react.mjs";
import { n as PreviewNotice, r as StatTile, t as BackLink } from "./Preview-MVZOUW8x.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { M as SectionHeading, d as AppShell, nr as useServerFn, tr as useAuth, u as getAdvertiserReferralStats } from "./router-sXMnYegW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/referral-DhGaKKjq.js
var import_jsx_runtime = require_jsx_runtime();
function AdvertiserReferralPage() {
	const { session } = useAuth();
	const fetchAdvertiserStats = useServerFn(getAdvertiserReferralStats);
	const r = useQuery({
		queryKey: ["advertiser-referral-stats", session?.user.id],
		enabled: Boolean(session?.user.id),
		queryFn: () => fetchAdvertiserStats({ data: { userId: session.user.id } })
	}).data ?? {
		referredAdvertisers: 0,
		totalDeposits: 0,
		rewardsEarned: 0,
		referralPercent: 50
	};
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
				icon: Users,
				iconSrc: "/icons/icon-advertiser-referral-v2.webp",
				title: "Advertiser Referral",
				subtitle: "Earn when people you invite run campaigns.",
				className: "mb-2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewNotice, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 rounded-2xl border border-primary/25 bg-primary/5 p-3 text-xs text-primary",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "flex items-start gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "mt-0.5 size-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Same link, two ways to earn." }), " This uses your existing CashGPT referral link — there is no separate advertiser link. If someone you invite becomes an advertiser and funds their first campaign, you earn an advertiser bonus on top of the regular publisher rewards."] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/refer",
					className: "mt-2 inline-block font-semibold underline-offset-4 hover:underline",
					children: "Open my referral link →"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				icon: Users,
				iconSrc: "/icons/icon-user-referrals.webp",
				title: "Your advertiser referrals"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
						label: "Referred advertisers",
						value: String(r.referredAdvertisers)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
						label: "Qualifying activations",
						value: String(r.totalDeposits),
						hint: "Funded a first campaign",
						tone: "mint"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
						label: "Rewards earned",
						value: formatMoney(r.rewardsEarned),
						tone: "gold"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
						label: "Per activation",
						value: `${r.referralPercent}%`
					})
				]
			})
		]
	});
}
//#endregion
export { AdvertiserReferralPage as component };
