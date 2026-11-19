import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { Kt as ChartColumn, h as TrendingDown, p as TriangleAlert } from "../_libs/lucide-react.mjs";
import { t as Skeleton } from "./skeleton-D9W9wFsj.mjs";
import { i as createServerFn } from "./server-CpGMOUrW.mjs";
import { t as createSsrRpc } from "./createSsrRpc-Bbq2Yr9O.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Br_KWlRY.mjs";
import { l as stringType, o as numberType, s as objectType } from "../_libs/zod.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { d as AppShell, nr as useServerFn, tr as useAuth } from "./router-sXMnYegW.mjs";
import { r as SectionTitle } from "./States-Cg9ELwgo.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Dg1urBTx.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/analytics-BZ2ynWGq.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Analytics server functions for admin dashboard
*/
/** Get funnel analysis for admin dashboard */
var getFunnelAnalytics = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	fromDate: stringType(),
	toDate: stringType(),
	country: stringType().optional().nullable()
}).parse(input)).handler(createSsrRpc("9371b0f660deda1fe1d2f77f3d80d6162fc61d7f56a924c31ce505280821d431"));
/** Get top client errors for admin dashboard */
var getTopClientErrors = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	fromDate: stringType(),
	toDate: stringType(),
	country: stringType().optional().nullable(),
	limit: numberType().min(1).max(50).optional()
}).parse(input)).handler(createSsrRpc("3f35e3ea3795d3fbf1d561595252fa4e9466aca2a3abd2ce032f1aecc822f7a3"));
/** Get top proof errors for admin dashboard */
var getTopProofErrors = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	fromDate: stringType(),
	toDate: stringType(),
	country: stringType().optional().nullable(),
	limit: numberType().min(1).max(50).optional()
}).parse(input)).handler(createSsrRpc("da851d027e9d9d76aa9b2fd9a7cb9d5e28f9c6134bdf28b26397cb4c41206539"));
function AnalyticsPage() {
	const { profile } = useAuth();
	const [dateRange, setDateRange] = (0, import_react.useState)("7d");
	const [country, setCountry] = (0, import_react.useState)("all");
	const [customFrom, setCustomFrom] = (0, import_react.useState)("");
	const [customTo, setCustomTo] = (0, import_react.useState)("");
	const fetchFunnel = useServerFn(getFunnelAnalytics);
	const fetchClientErrors = useServerFn(getTopClientErrors);
	const fetchProofErrors = useServerFn(getTopProofErrors);
	const { fromDate, toDate } = (0, import_react.useMemo)(() => {
		const now = /* @__PURE__ */ new Date();
		const to = now.toISOString();
		let from;
		if (dateRange === "custom" && customFrom && customTo) {
			from = new Date(customFrom).toISOString();
			return {
				fromDate: from,
				toDate: new Date(customTo).toISOString()
			};
		}
		switch (dateRange) {
			case "7d":
				from = (/* @__PURE__ */ new Date(now.getTime() - 6048e5)).toISOString();
				break;
			case "15d":
				from = (/* @__PURE__ */ new Date(now.getTime() - 1296e6)).toISOString();
				break;
			case "30d":
				from = (/* @__PURE__ */ new Date(now.getTime() - 2592e6)).toISOString();
				break;
			default: from = (/* @__PURE__ */ new Date(now.getTime() - 6048e5)).toISOString();
		}
		return {
			fromDate: from,
			toDate: to
		};
	}, [
		dateRange,
		customFrom,
		customTo
	]);
	const funnel = useQuery({
		queryKey: [
			"admin-funnel",
			fromDate,
			toDate,
			country
		],
		queryFn: () => fetchFunnel({ data: {
			fromDate,
			toDate,
			country: country === "all" ? null : country
		} }),
		enabled: Boolean(profile?.roles?.includes("admin"))
	});
	const clientErrors = useQuery({
		queryKey: [
			"admin-client-errors",
			fromDate,
			toDate,
			country
		],
		queryFn: () => fetchClientErrors({ data: {
			fromDate,
			toDate,
			country: country === "all" ? null : country,
			limit: 10
		} }),
		enabled: Boolean(profile?.roles?.includes("admin"))
	});
	const proofErrors = useQuery({
		queryKey: [
			"admin-proof-errors",
			fromDate,
			toDate,
			country
		],
		queryFn: () => fetchProofErrors({ data: {
			fromDate,
			toDate,
			country: country === "all" ? null : country,
			limit: 10
		} }),
		enabled: Boolean(profile?.roles?.includes("admin"))
	});
	if (!profile?.roles?.includes("admin")) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-[60vh] items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-muted-foreground",
			children: "Admin access required"
		})
	}) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
			icon: ChartColumn,
			children: "Analytics & Funnel"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "surface-card space-y-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 gap-4 md:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "mb-1.5 block text-sm font-medium",
						children: "Date Range"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: dateRange,
						onValueChange: (v) => setDateRange(v),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "7d",
								children: "Last 7 days"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "15d",
								children: "Last 15 days"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "30d",
								children: "Last 30 days"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "custom",
								children: "Custom"
							})
						] })]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "mb-1.5 block text-sm font-medium",
						children: "Country"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: country,
						onValueChange: setCountry,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "all",
								children: "All Countries"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "IN",
								children: "India"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "US",
								children: "United States"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "GB",
								children: "United Kingdom"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "PH",
								children: "Philippines"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "PK",
								children: "Pakistan"
							})
						] })]
					})] }),
					dateRange === "custom" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "md:col-span-3 grid grid-cols-2 gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "mb-1.5 block text-sm font-medium",
							children: "From Date"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "date",
							value: customFrom,
							onChange: (e) => setCustomFrom(e.target.value),
							className: "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "mb-1.5 block text-sm font-medium",
							children: "To Date"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "date",
							value: customTo,
							onChange: (e) => setCustomTo(e.target.value),
							className: "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
						})] })]
					})
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "surface-card space-y-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-semibold",
				children: "User Funnel"
			}), funnel.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2",
				children: [
					0,
					1,
					2,
					3,
					4
				].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-12 w-full" }, i))
			}) : funnel.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border text-left",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "pb-2 font-medium",
								children: "Step"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "pb-2 text-right font-medium",
								children: "Users"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "pb-2 text-right font-medium",
								children: "Conversion"
							})
						]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: funnel.data.steps.map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border/50",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-xs",
									children: step.step
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-3 text-right font-semibold",
								children: step.count.toLocaleString()
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-3 text-right",
								children: step.conversionRate !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: step.conversionRate < 50 ? "text-destructive" : step.conversionRate < 75 ? "text-amber-500" : "text-green-600",
									children: [step.conversionRate.toFixed(1), "%"]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "—"
								})
							})
						]
					}, step.step)) })]
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "No funnel data available"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-1 gap-4 md:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
					className: "flex items-center gap-2 font-semibold",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-4 text-destructive" }), "Top Client Errors"]
				}), clientErrors.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-2",
					children: [
						0,
						1,
						2
					].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-10 w-full" }, i))
				}) : clientErrors.data && clientErrors.data.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-2",
					children: clientErrors.data.map((error, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between rounded-lg border border-border p-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-xs text-muted-foreground",
							children: error.route
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold text-destructive",
							children: error.count
						})]
					}, index))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "No client errors recorded"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
					className: "flex items-center gap-2 font-semibold",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingDown, { className: "size-4 text-amber-500" }), "Top Proof Errors"]
				}), proofErrors.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-2",
					children: [
						0,
						1,
						2
					].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-10 w-full" }, i))
				}) : proofErrors.data && proofErrors.data.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-2",
					children: proofErrors.data.map((error, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between rounded-lg border border-border p-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-xs",
							children: error.error_code
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold text-amber-500",
							children: error.count
						})]
					}, index))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "No proof errors recorded"
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "surface-card",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: "Data is collected from client-side events and server-side validations. Events older than 90 days are automatically deleted. User identifiers use anonymous IDs for non-logged-in users."
			})
		})
	] });
}
//#endregion
export { AnalyticsPage as component };
