import { i as __toESM } from "../_runtime.mjs";
import { o as formatMoney } from "./referral-progress-DmJLJmiB.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { Bt as CircleCheckBig, Ft as CircleX, Mt as Clock, p as TriangleAlert } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as BackLink } from "./Preview-MVZOUW8x.mjs";
import { t as Skeleton } from "./skeleton-D9W9wFsj.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { E as Label, M as SectionHeading, Ot as Button, Xt as listPendingReviews, d as AppShell, en as reviewSubmission } from "./router-sXMnYegW.mjs";
import { t as Textarea } from "./textarea-kko37XEX.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/reviews-CRqEuxO_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ReviewsPage() {
	const queryClient = useQueryClient();
	const { data: submissions, isLoading, error } = useQuery({
		queryKey: ["pending-reviews"],
		queryFn: () => listPendingReviews({}),
		refetchInterval: 3e4
	});
	const [expandedId, setExpandedId] = (0, import_react.useState)(null);
	const [rejectReason, setRejectReason] = (0, import_react.useState)("");
	const reviewMutation = useMutation({
		mutationFn: ({ submissionId, decision, reason }) => reviewSubmission({ data: {
			submissionId,
			decision,
			reason
		} }),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["pending-reviews"] });
			queryClient.invalidateQueries({ queryKey: ["my-campaigns"] });
			queryClient.invalidateQueries({ queryKey: ["advertiser-overview"] });
			if (variables.decision === "approved") toast.success("Submission approved — earner will be paid");
			else toast.success("Submission rejected — earner can appeal");
			setExpandedId(null);
			setRejectReason("");
		},
		onError: (err) => {
			const msg = err instanceof Error ? err.message : "Could not process review";
			if (msg.includes("ADMIN_REVIEW_REQUIRED")) toast.error("Admin review required", { description: "This submission requires admin review and cannot be decided by you." });
			else if (msg.includes("ALREADY_DECIDED")) toast.error("Already reviewed", { description: "This submission has already been reviewed." });
			else toast.error(msg);
		}
	});
	const getTimeRemaining = (autoApproveAt) => {
		const now = /* @__PURE__ */ new Date();
		const diffMs = new Date(autoApproveAt).getTime() - now.getTime();
		if (diffMs <= 0) return "Auto-approving soon";
		const hours = Math.floor(diffMs / 36e5);
		const minutes = Math.floor(diffMs % 36e5 / 6e4);
		if (hours > 0) return `Auto-approves in ${hours}h ${minutes}m`;
		return `Auto-approves in ${minutes}m`;
	};
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		subtitle: "Advertiser",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BackLink, {
			to: "/advertiser/campaigns",
			label: "Back to Campaigns"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 space-y-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-48 rounded-2xl" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-48 rounded-2xl" })]
		})]
	});
	if (error) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		subtitle: "Advertiser",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BackLink, {
			to: "/advertiser/campaigns",
			label: "Back to Campaigns"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-8 text-center text-sm text-destructive",
			children: "Could not load reviews."
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		subtitle: "Advertiser",
		mainClass: "page-fade-in",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BackLink, {
				to: "/advertiser/campaigns",
				label: "Back to Campaigns"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				size: "page",
				icon: Clock,
				iconSrc: "/icons/icon-submission-review.webp",
				title: "Pending Reviews",
				subtitle: "Review proof submissions from publishers and approve or reject them.",
				className: "mb-2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card mt-3 rounded-xl border border-gold/40 bg-gold/10 p-3 text-xs text-gold-dark",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "mb-1 inline size-3.5" }),
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Review guidelines:" }),
					" ",
					"Rejections can be appealed by the earner and reviewed by admin. Be fair and provide clear reasons for rejection. If you do not review a submission within the time window, it will be auto-approved and the earner will be paid."
				]
			}),
			!submissions || submissions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card mt-4 p-8 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, { className: "mx-auto size-12 text-muted-foreground" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm font-semibold",
						children: "No pending reviews"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted-foreground",
						children: "All submissions have been reviewed or auto-approved."
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 space-y-3",
				children: submissions.map((sub) => {
					const isExpanded = expandedId === sub.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "surface-card overflow-hidden p-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-semibold",
											children: sub.campaignName
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-amount text-sm text-gold-dark",
											children: formatMoney(sub.publisherReward)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-1 text-xs text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "mr-1 inline size-3" }), getTimeRemaining(sub.autoApproveAt)]
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									size: "sm",
									onClick: () => setExpandedId(isExpanded ? null : sub.id),
									children: isExpanded ? "Hide" : "Review"
								})]
							})
						}), isExpanded && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "border-t border-border p-4 space-y-4",
							children: [
								sub.proofUrls && sub.proofUrls.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-xs",
										children: "Screenshot proof"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid grid-cols-2 gap-2",
										children: sub.proofUrls.map((url, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: url,
											alt: `Proof ${idx + 1}`,
											className: "rounded-xl border border-border object-contain max-h-48 w-full bg-background-alt"
										}, idx))
									})]
								}),
								sub.proofFields && sub.proofFields.length > 0 && Object.keys(sub.fieldValues).length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-xs",
										children: "Submitted information"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "space-y-1 rounded-xl border border-border bg-background-alt p-3",
										children: sub.proofFields.map((field) => {
											const value = sub.fieldValues[field.key];
											if (!value) return null;
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between gap-2 text-sm",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-muted-foreground",
													children: [field.label, ":"]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-medium",
													children: value
												})]
											}, field.key);
										})
									})]
								}),
								sub.userNote && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-xs",
										children: "Publisher note"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "rounded-xl border border-border bg-background-alt p-3 text-sm",
										children: sub.userNote
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: `reason-${sub.id}`,
										children: "Rejection reason (if rejecting)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
										id: `reason-${sub.id}`,
										rows: 3,
										minLength: 10,
										maxLength: 500,
										placeholder: "Explain why this submission doesn't meet requirements (min 10 characters)...",
										value: rejectReason,
										onChange: (e) => setRejectReason(e.target.value)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "outline",
										className: "flex-1 border-destructive text-destructive hover:bg-destructive/10",
										onClick: () => {
											if (!rejectReason.trim() || rejectReason.length < 10) {
												toast.error("Rejection reason must be at least 10 characters");
												return;
											}
											reviewMutation.mutate({
												submissionId: sub.id,
												decision: "rejected",
												reason: rejectReason
											});
										},
										disabled: reviewMutation.isPending,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "mr-2 size-4" }), "Not satisfied"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "jade",
										className: "flex-1",
										onClick: () => {
											reviewMutation.mutate({
												submissionId: sub.id,
												decision: "approved"
											});
										},
										disabled: reviewMutation.isPending,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, { className: "mr-2 size-4" }), "Satisfied"]
									})]
								})
							]
						})]
					}, sub.id);
				})
			})
		]
	});
}
//#endregion
export { ReviewsPage as component };
