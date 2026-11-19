import { i as __toESM } from "../_runtime.mjs";
import { o as formatMoney } from "./referral-progress-DmJLJmiB.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { Ft as CircleX, Mt as Clock, vt as Gavel, zt as CircleCheck } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as formatShortDate, t as BackLink } from "./Preview-MVZOUW8x.mjs";
import { t as Skeleton } from "./skeleton-D9W9wFsj.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { E as Label, M as SectionHeading, Mt as appealSubmission, Ot as Button, d as AppShell, nr as useServerFn, qt as listMySubmissions, tr as useAuth } from "./router-sXMnYegW.mjs";
import { t as Textarea } from "./textarea-kko37XEX.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/my-submissions-GBCQnpBB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STATUS = {
	pending: {
		label: "In review",
		className: "bg-gold/15 text-gold-dark",
		icon: Clock
	},
	approved: {
		label: "Approved",
		className: "bg-mint/20 text-primary",
		icon: CircleCheck
	},
	rejected: {
		label: "Rejected",
		className: "bg-destructive/10 text-destructive",
		icon: CircleX
	},
	appealed: {
		label: "Appeal pending",
		className: "bg-primary/15 text-primary",
		icon: Gavel
	}
};
function SubmissionCard({ s }) {
	const queryClient = useQueryClient();
	const appealFn = useServerFn(appealSubmission);
	const meta = STATUS[s.status];
	const Icon = meta.icon;
	const [appealing, setAppealing] = (0, import_react.useState)(false);
	const [reason, setReason] = (0, import_react.useState)("");
	const mutation = useMutation({
		mutationFn: () => appealFn({ data: {
			submissionId: s.id,
			appealText: reason.trim()
		} }),
		onSuccess: () => {
			toast.success("Appeal submitted — we'll review it soon.");
			setAppealing(false);
			setReason("");
			queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
		},
		onError: (err) => {
			const msg = err instanceof Error ? err.message.replace(/^[A-Z_]+: /, "") : "Something went wrong";
			toast.error("Couldn't submit appeal", { description: msg });
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "surface-card p-4",
		"data-testid": `submission-${s.id}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1.5 truncate font-semibold",
						children: s.campaignTitle
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground",
						children: ["Submitted ", formatShortDate(s.submittedAt)]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "shrink-0 text-right",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-amount text-sm text-gold-dark",
						children: formatMoney(s.reward)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: `mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.className}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3" }),
							" ",
							meta.label
						]
					})]
				})]
			}),
			s.status === "rejected" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 rounded-2xl bg-destructive/5 p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] font-semibold uppercase tracking-wide text-destructive",
						children: "Reason for rejection"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm",
						children: s.rejectionReason
					}),
					appealing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "mt-3 space-y-2",
						"data-testid": "appeal-form",
						onSubmit: (e) => {
							e.preventDefault();
							mutation.mutate();
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: `appeal-${s.id}`,
								className: "text-xs",
								children: "Tell us why this decision should be reviewed"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								id: `appeal-${s.id}`,
								rows: 3,
								maxLength: 500,
								placeholder: "e.g. The full screenshot was attached — the 'Following' button is visible at the top.",
								value: reason,
								onChange: (e) => setReason(e.target.value)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									size: "sm",
									variant: "outline",
									onClick: () => setAppealing(false),
									disabled: mutation.isPending,
									children: "Cancel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "submit",
									size: "sm",
									variant: "jade",
									className: "flex-1",
									disabled: reason.trim().length < 10 || mutation.isPending,
									"data-testid": "appeal-submit",
									children: mutation.isPending ? "Submitting..." : "Submit appeal"
								})]
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: "outline",
						className: "mt-3 w-full",
						"data-testid": "appeal-btn",
						onClick: () => setAppealing(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gavel, { className: "size-4" }), " Appeal this decision"]
					})
				]
			}),
			s.status === "appealed" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gavel, { className: "size-3.5" }), " Appeal submitted — we'll review it again."]
			})
		]
	});
}
function MySubmissionsPage() {
	const { session } = useAuth();
	const fetchSubmissions = useServerFn(listMySubmissions);
	const submissions = useQuery({
		queryKey: ["my-submissions", session?.user.id],
		queryFn: () => fetchSubmissions({}),
		enabled: Boolean(session)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		subtitle: "Tasks",
		mainClass: "page-fade-in",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BackLink, {
				to: "/task",
				label: "Back to Microtasks"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				size: "page",
				icon: Clock,
				iconSrc: "/icons/icon-submission-review.webp",
				title: "My Submissions",
				subtitle: "Track proof you've sent for review.",
				className: "mb-2"
			}),
			submissions.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-32 rounded-2xl" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-32 rounded-2xl" })]
			}) : submissions.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "surface-card mt-3 p-4 text-sm text-destructive",
				children: "Couldn't load your submissions."
			}) : submissions.data.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "surface-card mt-3 p-4 text-center text-sm text-muted-foreground",
				children: "No submissions yet. Complete a microtask to get started!"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "stagger-children mt-3 space-y-3",
				children: submissions.data.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SubmissionCard, { s }, s.id))
			})
		]
	});
}
//#endregion
export { MySubmissionsPage as component };
