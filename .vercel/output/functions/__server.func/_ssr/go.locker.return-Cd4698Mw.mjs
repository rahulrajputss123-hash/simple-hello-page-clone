import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { C as useNavigate, w as useSearch } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { Et as ExternalLink, Ft as CircleX, et as LoaderCircle, pt as House, zt as CircleCheck } from "../_libs/lucide-react.mjs";
import { i as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { Ct as startLockerQuest, H as formatReward, Ot as Button, Q as isNativePlatform, d as AppShell, it as completeLockerQuest, nr as useServerFn, tr as useAuth } from "./router-sXMnYegW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/go.locker.return-Cd4698Mw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function LockerReturnPage() {
	const { questKey } = useSearch({ from: "/_authenticated/go/locker/return" });
	const navigate = useNavigate();
	const complete = useServerFn(completeLockerQuest);
	const openNext = useServerFn(startLockerQuest);
	const [state, setState] = (0, import_react.useState)({ kind: "loading" });
	const [openingNext, setOpeningNext] = (0, import_react.useState)(false);
	const queryClient = useQueryClient();
	const { session } = useAuth();
	(0, import_react.useEffect)(() => {
		if (!questKey) {
			setState({
				kind: "error",
				message: "Missing questKey parameter in the redirect URL."
			});
			return;
		}
		let cancelled = false;
		(async () => {
			try {
				const result = await complete({ data: {
					questKey,
					isNative: isNativePlatform()
				} });
				if (cancelled) return;
				if (!result.completed && result.nextUrl) {
					setState({
						kind: "advancing",
						step: result.step,
						total: result.total,
						nextStep: result.nextStep,
						nextUrl: result.nextUrl
					});
					queryClient.invalidateQueries({ queryKey: ["quest-sessions", session?.user.id] });
					return;
				}
				if (!result.completed) {
					setState({
						kind: "error",
						message: "That locker is done, but the next one is not configured. Contact support."
					});
					return;
				}
				setState({
					kind: "success",
					reward: result.reward
				});
				queryClient.invalidateQueries({ queryKey: ["profile"] });
				queryClient.invalidateQueries({ queryKey: ["quest-sessions", session?.user.id] });
				queryClient.invalidateQueries({ queryKey: ["quests-active"] });
				queryClient.invalidateQueries({ queryKey: ["transactions"] });
				queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
				setTimeout(() => {
					if (!cancelled) navigate({ to: "/home" });
				}, 3e3);
			} catch (err) {
				if (cancelled) return;
				const message = err instanceof Error ? err.message : "Could not verify your locker completion. Please try again.";
				setState({
					kind: "error",
					message
				});
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [questKey]);
	const goHome = () => void navigate({ to: "/home" });
	const handleOpenNext = async () => {
		if (state.kind !== "advancing" || !questKey) return;
		setOpeningNext(true);
		try {
			const result = await openNext({ data: {
				questKey,
				isNative: isNativePlatform()
			} });
			if (!("unavailable" in result) && result.lockerUrl) window.open(result.lockerUrl, "_blank", "noopener,noreferrer");
			goHome();
		} catch (err) {
			const message = err instanceof Error ? err.message : "Could not open the next locker.";
			setState({
				kind: "error",
				message
			});
		} finally {
			setOpeningNext(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		subtitle: "Quest reward",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 flex flex-col items-center gap-4 text-center",
			"data-testid": "locker-return-page",
			children: [
				state.kind === "loading" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-10 animate-spin text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Verifying your completion…"
				})] }),
				state.kind === "advancing" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "success-pop size-10 text-primary" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-lg font-semibold",
						"data-testid": "locker-step-done",
						children: [
							"Locker ",
							state.step,
							" of ",
							state.total,
							" done"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted-foreground",
						children: [
							"Continue to locker ",
							state.nextStep,
							" to keep going."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground",
						children: [
							"Your reward is credited once all ",
							state.total,
							" lockers are complete."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "jade",
							disabled: openingNext,
							onClick: handleOpenNext,
							"data-testid": "locker-open-next",
							children: [openingNext ? "Opening…" : `Open Locker ${state.nextStep}`, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "ml-1 size-4" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							onClick: goHome,
							"data-testid": "locker-back-home",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { className: "mr-1 size-4" }), " Home"]
						})]
					})
				] }),
				state.kind === "error" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, {
						className: "size-10 text-destructive",
						"data-testid": "locker-error-icon"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-lg font-semibold",
						children: "Could not credit reward"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						"data-testid": "locker-error-message",
						children: state.message
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "jade",
						onClick: goHome,
						"data-testid": "locker-back-home",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { className: "mr-1 size-4" }), " Back to home"]
					})
				] }),
				state.kind === "success" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-5xl",
						role: "img",
						"aria-label": "party",
						children: "🎉"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "success-pop size-10 text-primary" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-lg font-semibold",
						"data-testid": "locker-quest-completed",
						children: "Quest completed!"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-amount text-gold-dark",
						children: [formatReward(state.reward), " credited to your wallet."]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "Redirecting you home…"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "jade",
						onClick: goHome,
						"data-testid": "locker-back-home",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { className: "mr-1 size-4" }), " Back to home"]
					})
				] })
			]
		})
	});
}
//#endregion
export { LockerReturnPage as component };
