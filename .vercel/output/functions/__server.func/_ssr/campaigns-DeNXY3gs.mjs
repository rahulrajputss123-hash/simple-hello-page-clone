import { i as __toESM } from "../_runtime.mjs";
import { o as formatMoney } from "./referral-progress-DmJLJmiB.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { B as Play, G as Pause, Ht as ChevronRight, S as SquarePen, X as Megaphone, ct as Key, et as LoaderCircle, z as Plus } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as VerificationBadge, t as BackLink } from "./Preview-MVZOUW8x.mjs";
import { t as Skeleton } from "./skeleton-D9W9wFsj.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { A as Dialog, D as Input, E as Label, G as DialogDescription, J as DialogTitle, K as DialogFooter, Kt as listMyCampaigns, M as SectionHeading, Nt as campaignAction, Ot as Button, W as DialogContent, d as AppShell, jt as addCampaignBudget, nr as useServerFn, q as DialogHeader, rn as useRole, tn as rotateCampaignSecret, tr as useAuth } from "./router-sXMnYegW.mjs";
import { t as PostbackSecretModal } from "./PostbackSecretModal-f06SxCE8.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/campaigns-DeNXY3gs.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function relativeTime(value) {
	const seconds = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 1e3));
	if (seconds < 60) return `${seconds}s ago`;
	const minutes = Math.round(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	return `${Math.round(hours / 24)}d ago`;
}
function maskedClickId(value) {
	return value ? `${value.slice(0, 8)}…` : "—";
}
var TABS = [
	["active", "Active"],
	["paused", "Paused"],
	["draft", "Draft"],
	["completed", "Completed"]
];
var STATUS_LABEL = {
	draft: "Draft",
	pending_review: "In review",
	active: "Active",
	paused: "Paused",
	budget_exhausted: "Budget used",
	completed: "Completed",
	rejected: "Rejected",
	archived: "Archived"
};
var STATUS_STYLE = {
	active: "bg-mint/20 text-primary",
	paused: "bg-gold/15 text-gold-dark",
	draft: "bg-background-alt text-muted-foreground",
	completed: "bg-primary/10 text-primary"
};
function MyCampaignsPage() {
	const { session } = useAuth();
	const { refreshOverview, overview } = useRole();
	const queryClient = useQueryClient();
	const list = useServerFn(listMyCampaigns);
	const act = useServerFn(campaignAction);
	const rotate = useServerFn(rotateCampaignSecret);
	const addBudget = useServerFn(addCampaignBudget);
	const [tab, setTab] = (0, import_react.useState)("active");
	const [showRotateModal, setShowRotateModal] = (0, import_react.useState)(false);
	const [rotatedInfo, setRotatedInfo] = (0, import_react.useState)(null);
	const [showAddSlotsModal, setShowAddSlotsModal] = (0, import_react.useState)(false);
	const [addSlotsCampaign, setAddSlotsCampaign] = (0, import_react.useState)(null);
	const [additionalSlots, setAdditionalSlots] = (0, import_react.useState)("");
	const [showPauseConfirm, setShowPauseConfirm] = (0, import_react.useState)(false);
	const [pauseCampaign, setPauseCampaign] = (0, import_react.useState)(null);
	const key = ["my-campaigns", session?.user.id];
	const campaigns = useQuery({
		queryKey: key,
		queryFn: () => list(),
		enabled: Boolean(session),
		staleTime: 0,
		refetchOnMount: "always"
	});
	const mutation = useMutation({
		mutationFn: (input) => act({ data: input }),
		onSuccess: async (res, input) => {
			await Promise.all([queryClient.invalidateQueries({ queryKey: key }), refreshOverview()]);
			const msg = input.action === "submit" ? "Submitted for review" : input.action === "pause" ? "Campaign paused — unspent budget returned to your balance" : input.action === "resume" ? res.status === "pending_review" ? "Resumed — it was edited while paused, so it goes through review again" : "Campaign is live again" : "Done";
			toast.success(msg);
		},
		onError: (err) => toast.error("Couldn't update the campaign", { description: err instanceof Error ? err.message.replace(/^[A-Z_]+: /, "") : void 0 })
	});
	const rotateMutation = useMutation({
		mutationFn: (campaignId) => rotate({ data: { campaignId } }),
		onSuccess: (result) => {
			setRotatedInfo({
				url: result.url,
				secret: result.secret
			});
			setShowRotateModal(true);
			toast.success("Secret rotated successfully");
		},
		onError: (err) => toast.error("Couldn't rotate secret", { description: err instanceof Error ? err.message.replace(/^[A-Z_]+: /, "") : void 0 })
	});
	const addBudgetMutation = useMutation({
		mutationFn: (input) => addBudget({ data: input }),
		onSuccess: async () => {
			await Promise.all([queryClient.invalidateQueries({ queryKey: key }), refreshOverview()]);
			setShowAddSlotsModal(false);
			setAddSlotsCampaign(null);
			setAdditionalSlots("10");
			toast.success("Budget added successfully");
		},
		onError: (err) => {
			const msg = err instanceof Error ? err.message.replace(/^[A-Z_]+: /, "") : "Failed to add budget";
			const friendlyMsg = msg.includes("INSUFFICIENT_FUNDS") || msg.includes("Not enough balance") ? "Not enough balance. Add funds first." : msg.includes("NOT_OWNER") ? "You don't own this campaign." : msg.includes("WRONG_STATUS") ? "Campaign must be active or paused to add budget." : msg;
			toast.error("Couldn't add budget", { description: friendlyMsg });
		}
	});
	const handleAddSlots = (campaign) => {
		setAddSlotsCampaign(campaign);
		setAdditionalSlots("10");
		setShowAddSlotsModal(true);
	};
	const handlePause = (campaign) => {
		setPauseCampaign(campaign);
		setShowPauseConfirm(true);
	};
	const confirmPause = () => {
		if (!pauseCampaign) return;
		mutation.mutate({
			campaignId: pauseCampaign.id,
			action: "pause"
		});
		setShowPauseConfirm(false);
		setPauseCampaign(null);
	};
	const confirmAddSlots = () => {
		if (!addSlotsCampaign) return;
		const slots = Number(additionalSlots);
		if (!slots || slots < 1) {
			toast.error("Enter a valid number of slots (minimum 1)");
			return;
		}
		addBudgetMutation.mutate({
			campaignId: addSlotsCampaign.id,
			additionalSlots: slots
		});
	};
	const platformFeePercent = overview?.settings?.platformFeePercent ?? 5;
	const slotsNum = Number(additionalSlots) || 0;
	const costPerSlot = addSlotsCampaign ? addSlotsCampaign.costPerCompletion || addSlotsCampaign.reward * (1 + platformFeePercent / 100) : 0;
	const totalCost = slotsNum * costPerSlot;
	const spendable = overview?.account?.spendable ?? 0;
	const all = campaigns.data ?? [];
	const visible = all.filter((c) => c.group === tab);
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
				icon: Megaphone,
				iconSrc: "/icons/icon-my-campaign-v2.webp",
				title: "My Campaigns",
				subtitle: "Tap a campaign to see its results.",
				className: "mb-2",
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/advertiser/create",
					className: "rounded-full bg-jade-gradient px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft",
					children: "+ New"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 flex gap-2 overflow-x-auto pb-1",
				role: "tablist",
				children: TABS.map(([k, label]) => {
					const count = all.filter((c) => c.group === k).length;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						role: "tab",
						"aria-selected": tab === k,
						variant: tab === k ? "jade" : "outline",
						onClick: () => setTab(k),
						"data-testid": `campaign-tab-${k}`,
						children: [
							label,
							" (",
							count,
							")"
						]
					}, k);
				})
			}),
			campaigns.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-32 rounded-2xl" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-32 rounded-2xl" })]
			}) : campaigns.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "surface-card mt-3 p-4 text-sm text-destructive",
				children: "Couldn't load your campaigns."
			}) : visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card mt-3 p-5 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-semibold",
						children: "Nothing here yet"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted-foreground",
						children: all.length === 0 ? "Create your first campaign to get started." : `No ${tab} campaigns.`
					}),
					all.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/advertiser/create",
						className: "mt-3 inline-flex rounded-full bg-jade-gradient px-4 py-1.5 text-xs font-semibold text-primary-foreground",
						children: "Create campaign"
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "stagger-children mt-3 space-y-3",
				children: visible.map((c) => {
					const pct = c.budget ? Math.min(100, Math.round(c.spent / c.budget * 100)) : 0;
					const pending = mutation.isPending && mutation.variables?.campaignId === c.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "surface-card p-4",
						"data-testid": `my-campaign-${c.id}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/advertiser/results/$id",
								params: { id: c.id },
								className: "block",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start justify-between gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VerificationBadge, { verification: c.verification }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-1.5 truncate font-semibold",
													children: c.title
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-xs text-muted-foreground",
													children: [
														c.countries.length ? c.countries.slice(0, 3).join(", ") : "All countries",
														" ",
														"· ",
														formatMoney(c.reward),
														" per completion",
														c.costPerCompletion ? ` (you pay ${formatMoney(c.costPerCompletion)})` : ""
													]
												})
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[c.group]}`,
											children: STATUS_LABEL[c.status]
										})]
									}),
									c.status === "rejected" && c.reviewNote && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive",
										children: c.reviewNote
									}),
									c.pausedBy === "admin" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 rounded-lg bg-gold/10 p-2 text-xs text-gold-dark",
										children: "Paused by CashGPT — contact support to resume."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-3 h-2 overflow-hidden rounded-full bg-background-alt",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-full rounded-full bg-jade-gradient",
											style: { width: `${pct}%` }
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
											c.completions,
											" / ",
											c.maxCompletions,
											" completed",
											c.pendingReviews ? ` · ${c.pendingReviews} to review` : ""
										] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
											formatMoney(c.spent),
											" / ",
											formatMoney(c.budget)
										] })]
									})
								]
							}),
							c.verification === "auto" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-semibold text-foreground",
										children: "Postback status"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-muted-foreground",
										children: c.postbackLogs?.[0] ? `Last postback: ${relativeTime(c.postbackLogs[0].receivedAt)} - ${c.postbackLogs[0].result}` : "No postback received yet"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-2 space-y-1 text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
											"✓ Tracking URL contains",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
												className: "rounded bg-muted px-1",
												children: "{click_id}"
											})
										] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [c.postbackLogs?.length ? "✓" : "○", " Postback received at least once"] })]
									}),
									c.postbackLogs?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-2 space-y-1 border-t border-primary/10 pt-2",
										children: c.postbackLogs.slice(0, 20).map((log, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 text-[11px]",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "w-12 shrink-0 text-muted-foreground",
													children: relativeTime(log.receivedAt)
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "rounded-full bg-background px-1.5 py-0.5 font-semibold",
													children: log.result
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: maskedClickId(log.clickId) }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "truncate text-muted-foreground",
													children: log.txnId || "—"
												})
											]
										}, `${log.receivedAt}-${index}`))
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-3 flex flex-wrap gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "outline",
											onClick: async (e) => {
												e.preventDefault();
												const testUrl = `${c.postbackUrl || "/api/public/marketplace-postback"}?test=1&campaign_id=${encodeURIComponent(c.id)}&token=SECRET`;
												await navigator.clipboard.writeText(testUrl);
												toast.success("Test URL copied");
											},
											children: "Copy test URL"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "self-center text-[11px] text-muted-foreground",
											children: "Use your secret; it was shown only at creation."
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex gap-2",
								children: [
									(c.status === "active" || c.status === "budget_exhausted") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										variant: "outline",
										className: "flex-1",
										disabled: pending,
										"data-testid": `pause-${c.id}`,
										onClick: () => handlePause(c),
										children: [
											pending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-4" }),
											" ",
											"Pause"
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										variant: "outline",
										disabled: pending,
										onClick: () => handleAddSlots(c),
										title: "Add more slots",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), " Slots"]
									})] }),
									c.status === "paused" && c.pausedBy !== "admin" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "sm",
											variant: "mint",
											className: "flex-1",
											disabled: pending,
											onClick: () => mutation.mutate({
												campaignId: c.id,
												action: "resume"
											}),
											children: [
												pending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" }),
												" ",
												"Resume"
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "sm",
											variant: "outline",
											disabled: pending,
											onClick: () => handleAddSlots(c),
											title: "Add more slots",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), " Slots"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "outline",
											asChild: true,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
												to: "/advertiser/edit/$id",
												params: { id: c.id },
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquarePen, { className: "size-4" }), " Edit"]
											})
										})
									] }),
									(c.status === "draft" || c.status === "rejected") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										variant: "jade",
										className: "flex-1",
										disabled: pending,
										onClick: () => mutation.mutate({
											campaignId: c.id,
											action: "submit"
										}),
										children: [pending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : null, " Submit for approval"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "outline",
										asChild: true,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/advertiser/edit/$id",
											params: { id: c.id },
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquarePen, { className: "size-4" }), " Edit"]
										})
									})] }),
									c.verification === "auto" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "outline",
										disabled: rotateMutation.isPending && rotateMutation.variables === c.id,
										onClick: (e) => {
											e.preventDefault();
											rotateMutation.mutate(c.id);
										},
										title: "Rotate postback secret",
										children: rotateMutation.isPending && rotateMutation.variables === c.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Key, { className: "size-4" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "ghost",
										asChild: true,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/advertiser/results/$id",
											params: { id: c.id },
											children: ["Results ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })]
										})
									})
								]
							})
						]
					}, c.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PostbackSecretModal, {
				open: showRotateModal && rotatedInfo !== null,
				onClose: () => {
					setShowRotateModal(false);
					setRotatedInfo(null);
				},
				postbackUrl: rotatedInfo?.url || "",
				postbackSecret: rotatedInfo?.secret || "",
				isRotation: true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: showAddSlotsModal,
				onOpenChange: setShowAddSlotsModal,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Add Slots" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
						"Add more slots to ",
						addSlotsCampaign?.title || "this campaign",
						"."
					] })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4 py-4",
						children: [
							addSlotsCampaign && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-lg border border-border bg-muted/30 p-3 text-sm",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Current slots:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-medium",
										children: [
											addSlotsCampaign.maxCompletions,
											" (",
											addSlotsCampaign.completions,
											" completed,",
											" ",
											addSlotsCampaign.maxCompletions - addSlotsCampaign.completions,
											" open)"
										]
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "additional-slots",
										children: "Extra slots to add"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "additional-slots",
										type: "number",
										min: "1",
										max: "10000",
										value: additionalSlots,
										onChange: (e) => setAdditionalSlots(e.target.value),
										placeholder: "e.g. 10"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground",
										children: "Each slot allows one more person to complete this campaign."
									})
								]
							}),
							slotsNum > 0 && addSlotsCampaign && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg border border-border bg-muted/30 p-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "New total:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-medium",
										children: [
											addSlotsCampaign.maxCompletions,
											" + ",
											slotsNum,
											" = ",
											addSlotsCampaign.maxCompletions + slotsNum
										]
									})]
								}), addSlotsCampaign.status === "active" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 flex justify-between border-t border-border pt-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold",
										children: "Cost now:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-semibold text-primary",
										children: [
											slotsNum,
											" × ",
											formatMoney(costPerSlot),
											" = ",
											formatMoney(totalCost)
										]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 text-xs text-muted-foreground",
									children: [
										"Your balance: ",
										formatMoney(spendable),
										totalCost > spendable && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "ml-1 text-destructive",
											children: "(insufficient)"
										})
									]
								})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 space-y-2 border-t border-border pt-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-semibold text-gold-dark",
											children: "⚠️ This campaign is paused"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-muted-foreground",
											children: "Pausing returned the unspent budget to your balance, and resuming will reserve budget for ALL open slots (current open slots + the new ones)."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between text-xs",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-muted-foreground",
												children: "Resume will reserve:"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "font-medium",
												children: [
													addSlotsCampaign.maxCompletions - addSlotsCampaign.completions + slotsNum,
													" ×",
													" ",
													formatMoney(costPerSlot),
													" = ",
													formatMoney((addSlotsCampaign.maxCompletions - addSlotsCampaign.completions + slotsNum) * costPerSlot)
												]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-xs text-muted-foreground",
											children: [
												"Your balance: ",
												formatMoney(spendable),
												(addSlotsCampaign.maxCompletions - addSlotsCampaign.completions + slotsNum) * costPerSlot > spendable && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "ml-1 text-destructive",
													children: "(insufficient for resume)"
												})
											]
										})
									]
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => setShowAddSlotsModal(false),
						disabled: addBudgetMutation.isPending,
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "jade",
						onClick: confirmAddSlots,
						disabled: addBudgetMutation.isPending || slotsNum < 1 || addSlotsCampaign?.status === "active" && totalCost > spendable,
						children: [
							addBudgetMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : null,
							"Add ",
							slotsNum,
							" Slot",
							slotsNum !== 1 ? "s" : ""
						]
					})] })
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: showPauseConfirm,
				onOpenChange: setShowPauseConfirm,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Pause Campaign?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
						"Pausing ",
						pauseCampaign?.title || "this campaign",
						" will stop accepting new completions."
					] })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "py-4",
						children: pauseCampaign && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "rounded-lg border border-border bg-muted/30 p-3 text-sm",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-muted-foreground",
								children: [
									"Unspent budget (",
									formatMoney(pauseCampaign.remaining || 0),
									") will be returned to your Campaign Balance; resuming reserves it again."
								]
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => setShowPauseConfirm(false),
						disabled: mutation.isPending,
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "destructive",
						onClick: confirmPause,
						disabled: mutation.isPending,
						children: [mutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : null, "Pause Campaign"]
					})] })
				] })
			})
		]
	});
}
//#endregion
export { MyCampaignsPage as component };
