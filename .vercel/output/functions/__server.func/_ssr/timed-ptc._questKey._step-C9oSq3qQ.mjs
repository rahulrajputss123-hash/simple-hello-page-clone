import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { C as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { Ft as CircleX, et as LoaderCircle, pt as House, zt as CircleCheck } from "../_libs/lucide-react.mjs";
import { i as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { Et as startTimedPtcStep, H as formatReward, Ot as Button, Q as isNativePlatform, d as AppShell, n as Route$6, nr as useServerFn, ot as completeTimedPtcStep, tr as useAuth } from "./router-sXMnYegW.mjs";
import { t as Progress } from "./progress-CLTZxRUB.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/timed-ptc._questKey._step-C9oSq3qQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Get the ad network script configuration for the given network ID.
* @throws Error if the network is not configured
*/
function getAdNetworkScript(networkId) {
	switch (networkId.toLowerCase()) {
		case "monetag": return {
			src: "https://quge5.com/88/tag.min.js",
			attributes: {
				"data-zone": "303885",
				async: "true",
				"data-cfasync": "false"
			}
		};
		case "propush":
		case "rollerads":
		case "evadav":
		case "adsterra":
		case "hilltopads": throw new Error(`Ad network "${networkId}" is not configured yet.`);
		default: throw new Error(`Unknown ad network: "${networkId}"`);
	}
}
/**
* Inject an ad network script into the document head.
* Returns a cleanup function to remove the script.
*/
function injectAdNetworkScript(networkId) {
	try {
		const config = getAdNetworkScript(networkId);
		const script = document.createElement("script");
		script.src = config.src;
		if (config.attributes) Object.entries(config.attributes).forEach(([key, value]) => {
			script.setAttribute(key, value);
		});
		document.head.appendChild(script);
		return () => {
			if (script.parentNode) script.parentNode.removeChild(script);
		};
	} catch (error) {
		console.error("Failed to inject ad network script:", error);
		return () => {};
	}
}
/**
* Timed PTC step page.
* Shows a countdown timer with periodic checkpoints that require ad interactions.
*/
function TimedPtcPage() {
	const { questKey, step } = Route$6.useParams();
	const navigate = useNavigate();
	const start = useServerFn(startTimedPtcStep);
	const complete = useServerFn(completeTimedPtcStep);
	const [state, setState] = (0, import_react.useState)({ kind: "loading" });
	const queryClient = useQueryClient();
	const { session } = useAuth();
	const stepNum = Number(step);
	const startTimeRef = (0, import_react.useRef)(0);
	const pausedAtRef = (0, import_react.useRef)(0);
	const accumulatedRef = (0, import_react.useRef)(0);
	const rafRef = (0, import_react.useRef)(0);
	const [currentTime, setCurrentTime] = (0, import_react.useState)(0);
	const checkpointsDoneRef = (0, import_react.useRef)(0);
	const failedTapsRef = (0, import_react.useRef)(0);
	const interactionWindowRef = (0, import_react.useRef)(null);
	const cleanupAdScriptRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (isNativePlatform()) navigate({ to: "/" });
	}, [navigate]);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		(async () => {
			try {
				const result = await start({ data: {
					questKey,
					step: stepNum,
					isNative: false
				} });
				if (cancelled) return;
				if ("unavailable" in result) {
					setState({
						kind: "error",
						message: "This quest step is not available yet. Please check back later."
					});
					return;
				}
				const total = result.step;
				setState({
					kind: "running",
					sessionId: result.sessionId,
					step: result.step,
					total,
					adNetwork: result.adNetwork,
					timedStepSeconds: result.timedStepSeconds,
					timedCheckpointSeconds: result.timedCheckpointSeconds,
					timedMaxFailedTaps: result.timedMaxFailedTaps
				});
				startTimeRef.current = Date.now();
				accumulatedRef.current = 0;
				checkpointsDoneRef.current = 0;
				failedTapsRef.current = 0;
			} catch (err) {
				if (cancelled) return;
				const message = err instanceof Error ? err.message : "Could not start this step. Please try again.";
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
		start,
		questKey,
		stepNum
	]);
	(0, import_react.useEffect)(() => {
		if (state.kind !== "running") {
			cancelAnimationFrame(rafRef.current);
			return;
		}
		const tick = () => {
			if (document.hidden) {
				if (!pausedAtRef.current) pausedAtRef.current = Date.now();
			} else {
				if (pausedAtRef.current) {
					accumulatedRef.current += pausedAtRef.current - startTimeRef.current;
					startTimeRef.current = Date.now();
					pausedAtRef.current = 0;
				}
				const elapsed = Math.floor((Date.now() - startTimeRef.current + accumulatedRef.current) / 1e3);
				setCurrentTime(elapsed);
				const remaining = state.timedStepSeconds - elapsed;
				if (elapsed >= (checkpointsDoneRef.current + 1) * state.timedCheckpointSeconds && remaining > 0) {
					pausedAtRef.current = Date.now();
					setState({
						kind: "checkpoint",
						sessionId: state.sessionId,
						step: state.step,
						total: state.total,
						adNetwork: state.adNetwork,
						remainingSeconds: remaining,
						checkpointsDone: checkpointsDoneRef.current,
						failedTaps: failedTapsRef.current,
						timedMaxFailedTaps: state.timedMaxFailedTaps,
						timedCheckpointSeconds: state.timedCheckpointSeconds
					});
					return;
				}
				if (remaining <= 0) {
					handleComplete();
					return;
				}
			}
			rafRef.current = requestAnimationFrame(tick);
		};
		rafRef.current = requestAnimationFrame(tick);
		return () => {
			cancelAnimationFrame(rafRef.current);
		};
	}, [state]);
	(0, import_react.useEffect)(() => {
		if (state.kind === "checkpoint" && state.adNetwork && !cleanupAdScriptRef.current) cleanupAdScriptRef.current = injectAdNetworkScript(state.adNetwork);
	}, [state]);
	(0, import_react.useEffect)(() => {
		return () => {
			if (cleanupAdScriptRef.current) {
				cleanupAdScriptRef.current();
				cleanupAdScriptRef.current = null;
			}
		};
	}, []);
	(0, import_react.useEffect)(() => {
		const handleVisibilityChange = () => {
			if (interactionWindowRef.current && document.hidden) interactionWindowRef.current.hadHidden = true;
		};
		const handleBlur = () => {
			if (interactionWindowRef.current) interactionWindowRef.current.hadBlur = true;
		};
		document.addEventListener("visibilitychange", handleVisibilityChange);
		window.addEventListener("blur", handleBlur);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			window.removeEventListener("blur", handleBlur);
		};
	}, []);
	const handleCheckpointTap = () => {
		if (state.kind !== "checkpoint") return;
		interactionWindowRef.current = {
			start: Date.now(),
			hadBlur: false,
			hadHidden: false
		};
		setTimeout(() => {
			if (!interactionWindowRef.current) return;
			if (interactionWindowRef.current.hadBlur || interactionWindowRef.current.hadHidden) {
				checkpointsDoneRef.current++;
				failedTapsRef.current = 0;
				const resumeWhenVisible = () => {
					if (!document.hidden) resumeTimer(state);
					else setTimeout(resumeWhenVisible, 100);
				};
				resumeWhenVisible();
			} else {
				failedTapsRef.current++;
				if (failedTapsRef.current >= state.timedMaxFailedTaps) {
					failedTapsRef.current = 0;
					resumeTimer(state);
				} else setState({
					...state,
					failedTaps: failedTapsRef.current,
					error: "Ad open nahi hua, dobara tap karo"
				});
			}
			interactionWindowRef.current = null;
		}, 2e3);
	};
	const resumeTimer = (checkpointState) => {
		if (state.kind !== "checkpoint") return;
		startTimeRef.current = Date.now();
		pausedAtRef.current = 0;
		setState({
			kind: "running",
			sessionId: checkpointState.sessionId,
			step: checkpointState.step,
			total: checkpointState.total,
			adNetwork: checkpointState.adNetwork,
			timedStepSeconds: checkpointState.remainingSeconds + (checkpointState.checkpointsDone + 1) * checkpointState.timedCheckpointSeconds,
			timedCheckpointSeconds: checkpointState.timedCheckpointSeconds,
			timedMaxFailedTaps: checkpointState.timedMaxFailedTaps
		});
	};
	const handleComplete = async () => {
		if (state.kind !== "running") return;
		setState({
			kind: "completing",
			step: state.step,
			total: state.total,
			checkpointsDone: checkpointsDoneRef.current,
			failedTaps: failedTapsRef.current
		});
		try {
			const result = await complete({ data: {
				questKey,
				step: stepNum,
				checkpointsDone: checkpointsDoneRef.current,
				isNative: false
			} });
			queryClient.invalidateQueries({ queryKey: ["quest-sessions", session?.user.id] });
			if (result.completed) {
				queryClient.invalidateQueries({ queryKey: ["profile"] });
				queryClient.invalidateQueries({ queryKey: ["quests-active"] });
				queryClient.invalidateQueries({ queryKey: ["transactions"] });
				queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
				setState({
					kind: "quest-complete",
					reward: result.reward,
					total: result.total
				});
			} else setState({
				kind: "step-complete",
				step: result.step,
				total: result.total,
				reward: result.reward,
				nextStep: result.nextStep,
				nextAdNetwork: result.nextAdNetwork
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : "Could not complete this step. Please try again.";
			setState({
				kind: "error",
				message
			});
		}
	};
	const goHome = () => navigate({ to: "/home" });
	const goToNextStep = () => {
		if (state.kind !== "step-complete" || !state.nextStep) return;
		navigate({
			to: "/timed-ptc/$questKey/$step",
			params: {
				questKey,
				step: String(state.nextStep)
			}
		});
	};
	const progress = state.kind === "running" || state.kind === "checkpoint" ? currentTime / (state.kind === "running" ? state.timedStepSeconds : state.remainingSeconds + currentTime) * 100 : 0;
	const remainingSeconds = state.kind === "running" ? Math.max(0, state.timedStepSeconds - currentTime) : state.kind === "checkpoint" ? state.remainingSeconds : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		subtitle: "Timed PTC Quest",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 flex flex-col items-center gap-4 text-center",
			"data-testid": `timed-ptc-page-${questKey}-${stepNum}`,
			children: [
				state.kind === "loading" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-10 animate-spin text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted-foreground",
					children: [
						"Loading step ",
						stepNum,
						"…"
					]
				})] }),
				state.kind === "error" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, {
						className: "size-10 text-destructive",
						"data-testid": "timed-ptc-error-icon"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-lg font-semibold",
						children: "Error"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						"data-testid": "timed-ptc-error-message",
						children: state.message
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "jade",
						onClick: goHome,
						"data-testid": "timed-ptc-back-home",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { className: "mr-1 size-4" }), " Back to home"]
					})
				] }),
				(state.kind === "running" || state.kind === "checkpoint") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-md space-y-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm font-medium text-muted-foreground",
								children: [
									"Step ",
									state.kind === "running" ? state.step : state.step,
									" of",
									" ",
									state.kind === "running" ? state.total : state.total
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 text-6xl font-bold tabular-nums",
								"data-testid": "timed-ptc-countdown",
								children: [
									Math.floor(remainingSeconds / 60),
									":",
									String(remainingSeconds % 60).padStart(2, "0")
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
							value: progress,
							className: "h-3",
							"data-testid": "timed-ptc-progress"
						}),
						state.kind === "checkpoint" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4 rounded-lg border bg-card p-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-lg font-semibold",
									children: ["Checkpoint ", state.checkpointsDone + 1]
								}),
								state.error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-destructive",
									"data-testid": "timed-ptc-checkpoint-error",
									children: state.error
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "jade",
									size: "lg",
									className: "w-full",
									onClick: handleCheckpointTap,
									"data-testid": "timed-ptc-checkpoint-button",
									children: "Continue"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: [
										"Failed taps: ",
										state.failedTaps,
										" / ",
										state.timedMaxFailedTaps
									]
								})
							]
						}),
						state.kind === "running" && document.hidden && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-yellow-600 dark:text-yellow-400",
								children: "Timer paused while tab is hidden"
							})
						})
					]
				}) }),
				state.kind === "completing" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-10 animate-spin text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted-foreground",
					children: [
						"Verifying step ",
						state.step,
						"…"
					]
				})] }),
				state.kind === "step-complete" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "success-pop size-10 text-primary" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-lg font-semibold",
						children: [
							"Step ",
							state.step,
							" done"
						]
					}),
					state.reward > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-amount text-primary",
						children: [formatReward(state.reward), " credited"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"data-push-optin-slot": "true",
						"data-network-id": state.nextAdNetwork || ""
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
							onClick: goToNextStep,
							"data-testid": "timed-ptc-next-step",
							children: ["Continue to Step ", state.nextStep]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							onClick: goHome,
							"data-testid": "timed-ptc-back-home",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { className: "mr-1 size-4" }), " Home"]
						})]
					})
				] }),
				state.kind === "quest-complete" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "success-pop text-5xl",
						role: "img",
						"aria-label": "party",
						children: "🎉"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-lg font-semibold",
						"data-testid": "timed-ptc-quest-completed",
						children: "Quest completed!"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-amount text-gold-dark",
						children: [formatReward(state.reward), " credited to your wallet."]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { "data-push-optin-slot": "true" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "jade",
						onClick: goHome,
						"data-testid": "timed-ptc-back-home",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { className: "mr-1 size-4" }), " Back to home"]
					})
				] })
			]
		})
	});
}
//#endregion
export { TimedPtcPage as component };
