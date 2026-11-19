import { o as formatMoney } from "./referral-progress-DmJLJmiB.mjs";
import { x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { Kt as ChartColumn, L as Receipt, Lt as CirclePlus, Mt as Clock, Q as Lock, X as Megaphone, at as LifeBuoy, i as Wallet, in as ArrowRight, s as Users, zt as CircleCheck } from "../_libs/lucide-react.mjs";
import { r as StatTile } from "./Preview-MVZOUW8x.mjs";
import { t as Skeleton } from "./skeleton-D9W9wFsj.mjs";
import { M as SectionHeading, rn as useRole } from "./router-sXMnYegW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/AdvertiserDashboard-CQCetUu3.js
var import_jsx_runtime = require_jsx_runtime();
function QuickAction({ to, icon: Icon, label, hint, testId }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		"data-testid": testId,
		className: "surface-card hover-lift press-feedback flex items-center gap-3 p-3.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5 text-primary" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block text-sm font-semibold",
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block truncate text-xs text-muted-foreground",
					children: hint
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4 text-muted-foreground" })
		]
	});
}
/** Home screen content while the role switcher is on "Advertiser". Real account data. */
function AdvertiserDashboard() {
	const { overview, overviewLoading } = useRole();
	const account = overview?.account ?? null;
	if (overviewLoading || !account) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-3 space-y-3",
		"data-testid": "advertiser-dashboard-loading",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-40 rounded-3xl" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-24 rounded-2xl" })]
	});
	const stats = overview?.stats ?? {
		activeCampaigns: 0,
		completedConversions: 0,
		pendingReviews: 0
	};
	const live = overview?.liveCampaigns ?? [];
	const pendingDeposit = overview?.recentDeposits.find((d) => d.status === "pending" && d.gatewayPaymentId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "page-fade-in",
		"data-testid": "advertiser-dashboard",
		children: [
			account.status !== "active" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive",
				children: [
					"Your advertiser account is ",
					account.status,
					".",
					" ",
					account.statusReason ? `${account.statusReason} ` : "",
					"Contact support to resolve this."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "premium-step-in mt-3 rounded-3xl bg-jade-gradient p-5 text-primary-foreground shadow-lift",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] font-semibold uppercase tracking-widest opacity-70",
						children: "Available Campaign Balance"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-amount mt-1 text-4xl leading-none",
						"data-testid": "campaign-balance",
						children: formatMoney(account.spendable)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 space-y-1.5 border-t border-primary-foreground/15 pt-3 text-xs",
						children: [
							account.bonusAvailable > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "opacity-75",
									children: "incl. bonus available"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-amount text-sm",
									children: formatMoney(account.bonusAvailable)
								})]
							}),
							account.bonusLocked > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1 opacity-75",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-3" }), " Bonus unlocking as you spend"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-amount text-sm",
									children: formatMoney(account.bonusLocked)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "opacity-75",
									children: "Total spent"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-amount text-sm",
									children: formatMoney(account.lifetimeSpent)
								})]
							})
						]
					}),
					pendingDeposit && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 rounded-xl bg-primary-foreground/10 px-3 py-2 text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "mr-1 inline size-3" }),
							" ",
							formatMoney(pendingDeposit.amountUsd),
							" deposit is being confirmed by the payment gateway — it'll show up here in a moment."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/advertiser/funds",
						"data-testid": "dashboard-add-funds",
						className: "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient px-4 py-2.5 text-sm font-semibold text-gold-foreground shadow-gold active:scale-[0.98]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "size-4" }), " Add Campaign Funds"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				icon: ChartColumn,
				iconSrc: "/icons/icon-adv-campaign-statistics-v2.webp",
				title: "Campaign Statistics"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
						label: "Active campaigns",
						value: String(stats.activeCampaigns)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
						label: "Completed conversions",
						value: stats.completedConversions.toLocaleString(),
						tone: "mint"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
						label: "Pending reviews",
						value: String(stats.pendingReviews),
						hint: "Proof submissions awaiting your decision",
						tone: "gold"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
						label: "Lifetime deposited",
						value: formatMoney(account.lifetimeDeposited)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				icon: Megaphone,
				iconSrc: "/icons/icon-adv-quick-actions-v2.webp",
				title: "Quick Actions"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "stagger-children space-y-2.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickAction, {
						to: "/advertiser/funds",
						icon: Wallet,
						label: "Add Funds",
						hint: "Top up your campaign balance",
						testId: "qa-add-funds"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickAction, {
						to: "/advertiser/create",
						icon: CirclePlus,
						label: "Create Campaign",
						hint: "Launch a new task for publishers",
						testId: "qa-create-campaign"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickAction, {
						to: "/advertiser/campaigns",
						icon: Megaphone,
						label: "My Campaigns",
						hint: "Active, paused, draft and completed",
						testId: "qa-my-campaigns"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickAction, {
						to: "/advertiser/transactions",
						icon: Receipt,
						label: "Transactions",
						hint: "Deposits, spend and charges",
						testId: "qa-transactions"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
						className: "surface-card overflow-hidden rounded-2xl",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", {
							className: "flex cursor-pointer items-center justify-between px-3.5 py-3 text-sm font-semibold",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "More" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground",
								children: "▾"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2.5 border-t border-border px-2 pb-2 pt-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickAction, {
								to: "/advertiser/referral",
								icon: Users,
								label: "Advertiser Referral",
								hint: "Same link, extra rewards",
								testId: "qa-referral"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickAction, {
								to: "/advertiser/help",
								icon: LifeBuoy,
								label: "Advertiser Help",
								hint: "FAQ for campaign owners",
								testId: "qa-help"
							})]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				icon: CircleCheck,
				iconSrc: "/icons/icon-live-right-now-v2.webp",
				title: "Live right now",
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/advertiser/campaigns",
					className: "text-xs font-semibold text-primary underline-offset-4 hover:underline",
					children: "View all"
				})
			}),
			live.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card p-4 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-semibold",
						children: "No live campaigns yet"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted-foreground",
						children: account.spendable > 0 ? "Create a campaign and submit it for review to go live." : "Add Campaign Funds, then create your first campaign."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: account.spendable > 0 ? "/advertiser/create" : "/advertiser/funds",
						className: "mt-3 inline-flex items-center gap-1 rounded-full bg-jade-gradient px-4 py-1.5 text-xs font-semibold text-primary-foreground",
						children: [
							account.spendable > 0 ? "Create campaign" : "Add funds",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3" })
						]
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-2.5",
				children: live.map((c) => {
					const pct = c.budget ? Math.min(100, Math.round(c.spent / c.budget * 100)) : 0;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/advertiser/results/$id",
						params: { id: c.id },
						className: "surface-card block p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate font-semibold",
									children: c.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded-full bg-mint/20 px-2 py-0.5 text-[11px] font-semibold text-primary",
									children: c.status === "budget_exhausted" ? "Budget used" : "Active"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 h-2 overflow-hidden rounded-full bg-background-alt",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-full rounded-full bg-jade-gradient",
									style: { width: `${pct}%` }
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-3" }),
										" ",
										c.completions,
										" / ",
										c.maxCompletions,
										" completed"
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									formatMoney(c.spent),
									" of ",
									formatMoney(c.budget),
									" used"
								] })]
							})
						]
					}) }, c.id);
				})
			})
		]
	});
}
//#endregion
export { AdvertiserDashboard };
