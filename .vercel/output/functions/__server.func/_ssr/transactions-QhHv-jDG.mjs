import { o as formatMoney } from "./referral-progress-DmJLJmiB.mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { L as Receipt, P as RotateCcw, Q as Lock, _t as Gift, rn as ArrowUpRight, un as ArrowDownLeft } from "../_libs/lucide-react.mjs";
import { a as formatShortDate, t as BackLink } from "./Preview-MVZOUW8x.mjs";
import { t as Skeleton } from "./skeleton-D9W9wFsj.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { M as SectionHeading, Wt as listAdvertiserTransactions, d as AppShell, nr as useServerFn, tr as useAuth } from "./router-sXMnYegW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/transactions-QhHv-jDG.js
var import_jsx_runtime = require_jsx_runtime();
function iconFor(t) {
	switch (t.kind) {
		case "first_deposit_bonus":
		case "bonus_unlock": return Gift;
		case "deposit_reversal":
		case "first_deposit_bonus_reversal":
		case "bonus_forfeit": return RotateCcw;
		case "campaign_allocation": return Lock;
		default: return t.amount >= 0 ? ArrowDownLeft : ArrowUpRight;
	}
}
var BUCKET_LABEL = {
	deposit: "",
	bonus_locked: "Locked bonus",
	bonus_available: "Bonus"
};
function TransactionsPage() {
	const { session } = useAuth();
	const list = useServerFn(listAdvertiserTransactions);
	const tx = useQuery({
		queryKey: ["advertiser-transactions", session?.user.id],
		queryFn: () => list(),
		enabled: Boolean(session),
		staleTime: 0,
		refetchOnMount: "always"
	});
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
				icon: Receipt,
				iconSrc: "/icons/icon-wallet-transactions.webp",
				title: "Transactions",
				subtitle: "Every movement on your Campaign Balance.",
				className: "mb-2"
			}),
			tx.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-16 rounded-2xl" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-16 rounded-2xl" })]
			}) : tx.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "surface-card mt-3 p-4 text-sm text-destructive",
				children: "Couldn't load transactions."
			}) : tx.data.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card mt-3 p-5 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-semibold",
					children: "No transactions yet"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted-foreground",
					children: "Your first deposit will show up here once the payment is confirmed."
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "surface-card mt-3 divide-y divide-border",
				"data-testid": "advertiser-transactions",
				children: tx.data.map((t) => {
					const positive = t.amount > 0;
					const zero = t.amount === 0;
					const Icon = iconFor(t);
					const bucket = BUCKET_LABEL[t.bucket];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-3 p-3.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `grid size-10 shrink-0 place-items-center rounded-xl ${positive ? "bg-mint/20 text-primary" : "bg-background-alt text-muted-foreground"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "truncate text-sm font-semibold",
									children: [t.label, bucket ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "ml-1.5 text-[10px] font-semibold uppercase text-gold-dark",
										children: bucket
									}) : null]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "truncate text-xs text-muted-foreground",
									children: [formatShortDate(t.createdAt), t.campaignName ? ` · ${t.campaignName}` : t.description ? ` · ${t.description}` : ""]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "shrink-0 text-right",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: `text-amount text-sm ${positive ? "text-primary" : ""}`,
									children: [zero ? "" : positive ? "+" : "−", formatMoney(Math.abs(t.amount))]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] font-semibold text-muted-foreground",
									children: "completed"
								})]
							})
						]
					}, t.id);
				})
			})
		]
	});
}
//#endregion
export { TransactionsPage as component };
