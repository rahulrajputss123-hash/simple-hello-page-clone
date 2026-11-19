import { o as formatMoney } from "./referral-progress-DmJLJmiB.mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { B as Play, Ft as CircleX, Kt as ChartColumn, Mt as Clock, q as MousePointerClick, zt as CircleCheck } from "../_libs/lucide-react.mjs";
import { i as VerificationBadge, r as StatTile, t as BackLink } from "./Preview-MVZOUW8x.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { M as SectionHeading, Vt as getCampaignResults, d as AppShell, i as Route$9 } from "./router-sXMnYegW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/results._id-CzWP99Bw.js
var import_jsx_runtime = require_jsx_runtime();
function ResultsPage() {
	const { id } = Route$9.useParams();
	const { data: c, isLoading, error } = useQuery({
		queryKey: ["campaign-results", id],
		queryFn: () => getCampaignResults({ data: { campaignId: id } })
	});
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		subtitle: "Advertiser",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-8 text-center text-sm text-muted-foreground",
			children: "Loading results…"
		})
	});
	if (error || !c) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		subtitle: "Advertiser",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BackLink, {
			to: "/advertiser/campaigns",
			label: "Back to My Campaigns"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-8 text-center text-sm text-muted-foreground",
			children: "Campaign not found."
		})]
	});
	const r = c.funnel;
	const remaining = c.budget_remaining;
	const conversion = r.clicks ? Math.round(r.completed / r.clicks * 1e3) / 10 : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		subtitle: "Advertiser",
		mainClass: "page-fade-in",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BackLink, {
				to: "/advertiser/campaigns",
				label: "Back to My Campaigns"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "premium-step-in mt-3 rounded-3xl bg-jade-gradient p-5 text-primary-foreground shadow-lift",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VerificationBadge, {
						verification: c.verification_mode === "auto" ? "auto" : "proof",
						size: "md"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-3 text-xl leading-tight",
						children: c.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-xs opacity-75",
						children: [
							c.countries,
							" · ",
							formatMoney(c.publisher_reward),
							" per completion · ",
							c.status
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl bg-primary-foreground/10 p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] uppercase tracking-wide opacity-70",
								children: "Spend"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-amount text-xl",
								children: formatMoney(c.budget_spent)
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl bg-primary-foreground/10 p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] uppercase tracking-wide opacity-70",
								children: "Remaining budget"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-amount text-xl",
								children: formatMoney(remaining)
							})]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				icon: ChartColumn,
				iconSrc: "/icons/icon-adv-campaign-statistics-v2.webp",
				title: "Funnel"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-3 gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
						label: "Clicks",
						value: r.clicks.toLocaleString()
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
						label: "Started",
						value: r.started.toLocaleString()
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
						label: "Completed",
						value: r.completed.toLocaleString(),
						tone: "mint"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-center text-xs text-muted-foreground",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MousePointerClick, { className: "mr-1 inline size-3.5" }),
					conversion,
					"% of clicks completed the task"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				icon: CircleCheck,
				iconSrc: "/icons/icon-submission-review.webp",
				title: "Submissions"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "surface-card divide-y divide-border",
				children: [
					{
						icon: CircleCheck,
						label: "Approved",
						value: c.submissions.approved,
						cls: "text-primary"
					},
					{
						icon: CircleX,
						label: "Rejected",
						value: c.submissions.rejected,
						cls: "text-destructive"
					},
					{
						icon: Clock,
						label: "Pending review",
						value: c.submissions.pending,
						cls: "text-gold-dark"
					},
					{
						icon: Play,
						label: "Started, not completed",
						value: r.started - r.completed,
						cls: "text-muted-foreground"
					}
				].map(({ icon: Icon, label, value, cls }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between p-3.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: `inline-flex items-center gap-2 text-sm ${cls}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }),
							" ",
							label
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-amount text-base",
						children: value.toLocaleString()
					})]
				}, label))
			})
		]
	});
}
//#endregion
export { ResultsPage as component };
