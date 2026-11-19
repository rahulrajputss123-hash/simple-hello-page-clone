import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { C as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { Et as ExternalLink, Ft as CircleX, et as LoaderCircle, pt as House, zt as CircleCheck } from "../_libs/lucide-react.mjs";
import { i as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { H as formatReward, Ot as Button, Q as isNativePlatform, at as completeShortlinkStep, d as AppShell, nr as useServerFn, r as Route$8, tr as useAuth, wt as startShortlinkStep } from "./router-sXMnYegW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/go._questKey._step-CNEmfOTv.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Return page from a shortlink network. Auto-runs completeShortlinkStep on mount.
* If the step is not final, offers a button to open the next shortlink.
* If final, shows a success screen with the credited reward.
*/
function GoPage() {
	const { questKey, step } = Route$8.useParams();
	const navigate = useNavigate();
	const complete = useServerFn(completeShortlinkStep);
	const openNext = useServerFn(startShortlinkStep);
	const [state, setState] = (0, import_react.useState)({ kind: "loading" });
	const [openingNext, setOpeningNext] = (0, import_react.useState)(false);
	const queryClient = useQueryClient();
	const { session } = useAuth();
	const stepNum = Number(step);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		(async () => {
			try {
				const result = await complete({ data: {
					questKey,
					step: stepNum,
					isNative: isNativePlatform()
				} });
				if (cancelled) return;
				setState({
					kind: "success",
					...result
				});
				queryClient.invalidateQueries({ queryKey: ["quest-sessions", session?.user.id] });
				if (result.completed && result.credited) {
					queryClient.invalidateQueries({ queryKey: ["profile"] });
					queryClient.invalidateQueries({ queryKey: ["quests-active"] });
					queryClient.invalidateQueries({ queryKey: ["transactions"] });
					queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
				}
			} catch (err) {
				if (cancelled) return;
				const message = err instanceof Error ? err.message : "Could not verify this step. Please try again.";
				setState({
					kind: "error",
					message
				});
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [
		complete,
		questKey,
		stepNum,
		queryClient,
		session?.user.id
	]);
	const goHome = () => navigate({ to: "/home" });
	const handleOpenNext = async () => {
		if (state.kind !== "success" || state.nextStep == null) return;
		setOpeningNext(true);
		try {
			const result = await openNext({ data: {
				questKey,
				step: state.nextStep,
				isNative: isNativePlatform()
			} });
			if (!("unavailable" in result) && result.url) window.open(result.url, "_blank", "noopener,noreferrer");
			goHome();
		} catch (err) {
			const message = err instanceof Error ? err.message : "Could not open the next step.";
			setState({
				kind: "error",
				message
			});
		} finally {
			setOpeningNext(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		subtitle: "Quest step",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 flex flex-col items-center gap-4 text-center",
			"data-testid": `go-page-${questKey}-${stepNum}`,
			children: [
				state.kind === "loading" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-10 animate-spin text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted-foreground",
					children: [
						"Verifying step ",
						stepNum,
						"…"
					]
				})] }),
				state.kind === "error" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, {
						className: "size-10 text-destructive",
						"data-testid": "go-error-icon"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-lg font-semibold",
						children: "Step could not be verified"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						"data-testid": "go-error-message",
						children: state.message
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "jade",
						onClick: goHome,
						"data-testid": "go-back-home",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { className: "mr-1 size-4" }), " Back to home"]
					})
				] }),
				state.kind === "success" && state.completed && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "success-pop text-5xl",
						role: "img",
						"aria-label": "party",
						children: "🎉"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-lg font-semibold",
						"data-testid": "go-quest-completed",
						children: "Quest completed!"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-amount text-gold-dark",
						children: [formatReward(state.reward), " credited to your wallet."]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "jade",
						onClick: goHome,
						"data-testid": "go-back-home",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { className: "mr-1 size-4" }), " Back to home"]
					})
				] }),
				state.kind === "success" && !state.completed && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "success-pop size-10 text-primary" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-lg font-semibold",
						children: [
							"Step ",
							stepNum,
							" done"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted-foreground",
						children: [
							"Continue to step ",
							state.nextStep,
							" to keep going."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "jade",
							disabled: openingNext || !state.nextStep,
							onClick: handleOpenNext,
							"data-testid": "go-open-next",
							children: [openingNext ? "Opening…" : `Open Step ${state.nextStep}`, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "ml-1 size-4" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							onClick: goHome,
							"data-testid": "go-back-home",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { className: "mr-1 size-4" }), " Home"]
						})]
					})
				] })
			]
		})
	});
}
//#endregion
export { GoPage as component };
