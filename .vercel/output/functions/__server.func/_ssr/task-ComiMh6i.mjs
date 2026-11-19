import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { D as Shield, Gt as Check, H as Phone, Ht as ChevronRight, O as ShieldCheck, T as SlidersHorizontal, V as Plane, cn as ArrowDownUp, ht as Grid2x2, nt as ListChecks, x as Star } from "../_libs/lucide-react.mjs";
import { t as Skeleton } from "./skeleton-D9W9wFsj.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { H as formatReward, M as SectionHeading, Ot as Button, Ut as listActiveCampaigns, d as AppShell, nr as useServerFn, qt as listMySubmissions, rr as cn, tr as useAuth } from "./router-sXMnYegW.mjs";
import { t as AppBottomSheet } from "./AppBottomSheet-EBwDVG7Y.mjs";
import { t as Switch } from "./switch-Cn1w-cIH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/task-ComiMh6i.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function mapCampaignToDisplay(c) {
	const normalizedCountries = (c.countries ?? []).some((value) => [
		"*",
		"ALL",
		"WW"
	].includes(value.toUpperCase())) ? [] : c.countries ?? [];
	const countryFlag = normalizedCountries.length === 0 ? "🌍" : "🇺🇸";
	const countryLabel = normalizedCountries.length === 0 ? "Worldwide" : normalizedCountries.join(", ");
	let estimatedTime = "5-10 min";
	if (c.estimatedMinutes) estimatedTime = c.estimatedMinutes < 60 ? `${c.estimatedMinutes} min` : `${Math.round(c.estimatedMinutes / 60)} hr`;
	return {
		id: c.id,
		title: c.title,
		description: c.description,
		reward: c.reward,
		verification: c.verification,
		featured: c.featured || false,
		estimatedTime,
		countryFlag,
		country: countryLabel,
		device: c.verification === "auto" ? "Any device" : "Mobile",
		slotsLeft: c.slotsRemaining,
		category: c.category || "General",
		countries: normalizedCountries
	};
}
var TaskCard = (0, import_react.memo)(function TaskCard({ campaign }) {
	const VerificationIcon = campaign.verification === "auto" ? ShieldCheck : Shield;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/microtask/$id",
		params: { id: campaign.id },
		"data-testid": `microtask-card-${campaign.id}`,
		className: "surface-card hover-lift press-feedback block p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 flex-wrap gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: cn("inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold", campaign.verification === "auto" ? "bg-mint/20 text-primary" : "bg-gold/15 text-gold-dark"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VerificationIcon, { className: "size-3" }), campaign.verification === "auto" ? "Auto Verified" : "Proof Required"]
					}), campaign.featured && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex items-center gap-1 rounded-full bg-violet-600 px-2 py-1 text-[10px] font-bold text-white",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "size-3 fill-current" }), " Featured"]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "shrink-0 text-right",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-amount text-xl leading-none text-gold-dark",
						children: formatReward(campaign.reward)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-[10px] text-muted-foreground",
						children: campaign.estimatedTime
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-bold",
					children: campaign.title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-0.5 truncate text-xs text-muted-foreground",
					children: campaign.description
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex items-center gap-3 text-xs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex min-w-0 items-center gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": "true",
							children: campaign.countryFlag
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "truncate",
							children: campaign.country
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex min-w-0 items-center gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "size-3.5 shrink-0 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "truncate",
							children: campaign.device
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ml-auto shrink-0 rounded-full bg-background-alt px-2.5 py-1 text-[10px] font-semibold text-muted-foreground",
						children: campaign.slotsLeft === null ? "Unlimited slots" : `${campaign.slotsLeft} slots left`
					})
				]
			})
		]
	});
});
function MicrotasksPage() {
	const { session } = useAuth();
	const fetchCampaigns = useServerFn(listActiveCampaigns);
	const fetchSubmissions = useServerFn(listMySubmissions);
	const campaigns = useQuery({
		queryKey: ["active-campaigns", session?.user.id],
		queryFn: () => fetchCampaigns({}),
		enabled: Boolean(session)
	});
	const submissions = useQuery({
		queryKey: ["my-submissions", session?.user.id],
		queryFn: () => fetchSubmissions({}),
		enabled: Boolean(session)
	});
	const listRef = (0, import_react.useRef)(null);
	const isFirstMountRef = (0, import_react.useRef)(true);
	const [sort, setSort] = (0, import_react.useState)("all");
	const [open, setOpen] = (0, import_react.useState)(false);
	const [featured, setFeatured] = (0, import_react.useState)(false);
	const [verification, setVerification] = (0, import_react.useState)(null);
	const [selectedCategories, setSelectedCategories] = (0, import_react.useState)([]);
	const [selectedCountries, setSelectedCountries] = (0, import_react.useState)([]);
	const [selectedDevices, setSelectedDevices] = (0, import_react.useState)([]);
	const displayCampaigns = (0, import_react.useMemo)(() => {
		return (campaigns.data || []).map(mapCampaignToDisplay);
	}, [campaigns.data]);
	const categories = (0, import_react.useMemo)(() => [...new Set(displayCampaigns.map((task) => task.category))], [displayCampaigns]);
	const countries = (0, import_react.useMemo)(() => [...new Set(displayCampaigns.flatMap((task) => task.countries))], [displayCampaigns]);
	const devices = [
		"Any",
		"Android",
		"iOS",
		"Desktop"
	];
	const pending = (submissions.data ?? []).filter((s) => s.status === "pending" || s.status === "appealed").length;
	const statusCounts = {
		pending,
		approved: (submissions.data ?? []).filter((s) => s.status === "approved").length,
		rejected: (submissions.data ?? []).filter((s) => s.status === "rejected").length
	};
	const filtered = (0, import_react.useMemo)(() => {
		return [...displayCampaigns.filter((task) => (!featured || task.featured) && (!verification || task.verification === verification) && (!selectedCategories.length || selectedCategories.includes(task.category)) && (!selectedCountries.length || task.countries.length === 0 || task.countries.some((country) => selectedCountries.includes(country))) && (!selectedDevices.length || selectedDevices.includes("Any") || selectedDevices.includes(task.device) || selectedDevices.includes("Any") && task.device !== "iOS"))].sort((a, b) => {
			if (sort === "reward") return b.reward - a.reward;
			if (sort === "featured") return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
			return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
		});
	}, [
		displayCampaigns,
		sort,
		featured,
		verification,
		selectedCategories,
		selectedCountries,
		selectedDevices
	]);
	const deferredFiltered = (0, import_react.useDeferredValue)(filtered);
	const activeFilters = Number(featured) + Number(Boolean(verification)) + selectedCategories.length + selectedCountries.length + selectedDevices.length;
	const applyFilters = (newFeatured, newVerification, newCategories, newCountries, newDevices) => {
		setOpen(false);
		setTimeout(() => {
			(0, import_react.startTransition)(() => {
				setFeatured(newFeatured);
				setVerification(newVerification);
				setSelectedCategories(newCategories);
				setSelectedCountries(newCountries);
				setSelectedDevices(newDevices);
				isFirstMountRef.current = false;
			});
		}, 200);
	};
	const resetFilters = () => {
		setOpen(false);
		setTimeout(() => {
			(0, import_react.startTransition)(() => {
				setFeatured(false);
				setVerification(null);
				setSelectedCategories([]);
				setSelectedCountries([]);
				setSelectedDevices([]);
			});
		}, 200);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		subtitle: "Tasks",
		mainClass: "page-fade-in",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				size: "page",
				icon: Grid2x2,
				iconSrc: "/icons/icon-your-task.webp",
				title: "Microtasks",
				subtitle: "Complete simple tasks posted by advertisers and earn rewards.",
				className: "mb-2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid grid-cols-2 divide-x divide-primary-foreground/15 rounded-3xl bg-jade-gradient p-2 text-primary-foreground shadow-lift",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					className: "flex min-w-0 items-center gap-2 rounded-2xl p-3 text-left transition-transform active:scale-[0.98]",
					onClick: () => listRef.current?.scrollIntoView({ behavior: "smooth" }),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-9 shrink-0 place-items-center rounded-full bg-gold/20 text-gold",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListChecks, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
								className: "block truncate whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider opacity-75",
								children: "Available"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate whitespace-nowrap text-lg font-extrabold",
								children: campaigns.isPending ? "..." : filtered.length
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4 shrink-0 text-primary-foreground/60" })
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/my-submissions",
					className: "flex min-w-0 items-center gap-2 rounded-2xl p-3 transition-transform active:scale-[0.98]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-9 shrink-0 place-items-center rounded-full bg-gold/20 text-gold",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
								className: "block truncate whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider opacity-75",
								children: "My submissions"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1.5 whitespace-nowrap text-lg font-extrabold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: submissions.isPending ? "..." : pending }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded-full bg-gold/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gold",
									children: "pending"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4 shrink-0 text-primary-foreground/60" })
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex min-w-0 flex-1 rounded-full bg-background-alt p-1",
					children: [
						[
							"all",
							Grid2x2,
							"All tasks"
						],
						[
							"reward",
							ArrowDownUp,
							"Highest reward"
						],
						[
							"featured",
							Star,
							"Featured"
						]
					].map(([value, Icon, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setSort(value),
						className: cn("flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full px-2 py-2 text-[11px] font-semibold", sort === value && "bg-primary text-primary-foreground"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "truncate",
							children: label
						})]
					}, value))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					"aria-label": "Open filters",
					onClick: () => setOpen(true),
					className: "relative grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-card",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, { className: "size-4" }), activeFilters > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-gold text-[10px] font-bold text-gold-foreground",
						children: activeFilters
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				ref: listRef,
				className: "mt-5 flex items-end justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
					variant: "ribbon",
					icon: ListChecks,
					iconSrc: "/icons/icon-task-checklist.webp",
					title: "Available Tasks"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "mb-3 text-xs text-muted-foreground",
					children: [campaigns.isPending ? "..." : filtered.length, " tasks"]
				})]
			}),
			campaigns.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-32 rounded-2xl" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-32 rounded-2xl" })]
			}) : campaigns.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "surface-card mt-3 p-4 text-sm text-destructive",
				children: "Couldn't load campaigns."
			}) : filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "surface-card mt-3 p-4 text-center text-sm text-muted-foreground",
				children: "No tasks match your filters. Try adjusting your search."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
				className: cn("space-y-3", isFirstMountRef.current && "stagger-children"),
				"data-testid": "microtask-list",
				children: [deferredFiltered.map((campaign) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaskCard, { campaign }) }, campaign.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/advertiser/create",
					className: "surface-card flex items-center gap-3 p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-10 place-items-center rounded-xl bg-jade-gradient text-primary-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
								className: "block text-sm",
								children: "Want your offer here?"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted-foreground",
								children: "Become an advertiser"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4 text-muted-foreground" })
					]
				}) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/my-submissions",
				className: "surface-card mt-4 flex items-center gap-3 p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-10 place-items-center rounded-xl bg-gold/15 text-gold-dark",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plane, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
							className: "block",
							children: "My Submissions"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs text-muted-foreground",
							children: [
								statusCounts.pending,
								" pending • ",
								statusCounts.approved,
								" approved •",
								" ",
								statusCounts.rejected,
								" rejected"
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "ml-auto size-4 text-muted-foreground" })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaskFilterSheet, {
				open,
				onOpenChange: setOpen,
				featured,
				verification,
				selectedCategories,
				selectedCountries,
				selectedDevices,
				categories,
				countries,
				devices,
				filteredCount: filtered.length,
				onApply: applyFilters,
				onReset: resetFilters
			})
		]
	});
}
function FilterRow({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-sm font-semibold",
			children: label
		}), children]
	});
}
function ChipGroup({ label, options, selected, toggle }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mb-2 text-sm font-semibold",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-wrap gap-2",
		children: options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			onClick: () => toggle(option),
			className: cn("rounded-full border border-border px-3 py-1.5 text-xs transition-colors", selected.includes(option) && "border-primary bg-primary text-primary-foreground"),
			children: option
		}, option))
	})] });
}
function TaskFilterSheet({ open, onOpenChange, featured: initialFeatured, verification: initialVerification, selectedCategories: initialCategories, selectedCountries: initialCountries, selectedDevices: initialDevices, categories, countries, devices, filteredCount, onApply, onReset }) {
	const [draftFeatured, setDraftFeatured] = (0, import_react.useState)(initialFeatured);
	const [draftVerification, setDraftVerification] = (0, import_react.useState)(initialVerification);
	const [draftCategories, setDraftCategories] = (0, import_react.useState)(initialCategories);
	const [draftCountries, setDraftCountries] = (0, import_react.useState)(initialCountries);
	const [draftDevices, setDraftDevices] = (0, import_react.useState)(initialDevices);
	(0, import_react.useMemo)(() => {
		setDraftFeatured(initialFeatured);
		setDraftVerification(initialVerification);
		setDraftCategories(initialCategories);
		setDraftCountries(initialCountries);
		setDraftDevices(initialDevices);
	}, [
		initialFeatured,
		initialVerification,
		initialCategories,
		initialCountries,
		initialDevices
	]);
	const toggle = (value, current, setter) => setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
	const handleApply = () => {
		onApply(draftFeatured, draftVerification, draftCategories, draftCountries, draftDevices);
	};
	const handleReset = () => {
		setDraftFeatured(false);
		setDraftVerification(null);
		setDraftCategories([]);
		setDraftCountries([]);
		setDraftDevices([]);
		onReset();
	};
	const handleOpenChange = (newOpen) => {
		if (!newOpen) {
			setDraftFeatured(initialFeatured);
			setDraftVerification(initialVerification);
			setDraftCategories(initialCategories);
			setDraftCountries(initialCountries);
			setDraftDevices(initialDevices);
		}
		onOpenChange(newOpen);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppBottomSheet, {
		open,
		onOpenChange: handleOpenChange,
		title: "Filter tasks",
		footer: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex w-full gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				onClick: handleReset,
				children: "Reset"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "jade",
				className: "flex-1",
				onClick: handleApply,
				children: [
					"Show ",
					filteredCount,
					" tasks"
				]
			})]
		}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterRow, {
					label: "Featured tasks",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
						checked: draftFeatured,
						onCheckedChange: setDraftFeatured
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterRow, {
					label: "Auto verified",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
						checked: draftVerification === "auto",
						onCheckedChange: (checked) => setDraftVerification(checked ? "auto" : null)
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterRow, {
					label: "Proof required",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
						checked: draftVerification === "proof",
						onCheckedChange: (checked) => setDraftVerification(checked ? "proof" : null)
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChipGroup, {
					label: "Categories",
					options: categories,
					selected: draftCategories,
					toggle: (v) => toggle(v, draftCategories, setDraftCategories)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChipGroup, {
					label: "Countries",
					options: countries,
					selected: draftCountries,
					toggle: (v) => toggle(v, draftCountries, setDraftCountries)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChipGroup, {
					label: "Devices",
					options: devices,
					selected: draftDevices,
					toggle: (v) => toggle(v, draftDevices, setDraftDevices)
				})
			]
		})
	});
}
//#endregion
export { MicrotasksPage as component };
