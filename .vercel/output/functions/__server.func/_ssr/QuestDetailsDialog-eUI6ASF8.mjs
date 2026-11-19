import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { Et as ExternalLink, G as Pause, Gt as Check, Mt as Clock, et as LoaderCircle, lt as Info, p as TriangleAlert, rn as ArrowUpRight } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { H as formatReward, Ot as Button, Tt as startSurveyQuest, _t as openQuestNetwork, dt as getNetworkQuestProgress, lt as fetchSurveyFeed, nr as useServerFn, pt as getSurveyQuestProgress, rt as useCheckinHeartbeat, tr as useAuth } from "./router-sXMnYegW.mjs";
import { i as deriveQuestView, r as QUEST_ACCENTS } from "./home-Aobq8Gh7.mjs";
import { t as AppBottomSheet } from "./AppBottomSheet-EBwDVG7Y.mjs";
import { t as Progress } from "./progress-CLTZxRUB.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/QuestDetailsDialog-eUI6ASF8.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Progress bar for active time quests.
* Shows minutes completed / target with optional daily cap indicator.
*/
function ActiveTimeProgress({ totalMinutes, targetMinutes, todayMinutes, dailyCapMinutes, isPaused = false }) {
	const progressPercent = Math.min(100, totalMinutes / targetMinutes * 100);
	const isComplete = totalMinutes >= targetMinutes;
	const isDailyCapped = todayMinutes !== void 0 && dailyCapMinutes !== void 0 && todayMinutes >= dailyCapMinutes;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-4 w-4 text-muted-foreground" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-muted-foreground",
							children: [
								Math.floor(totalMinutes),
								" / ",
								targetMinutes,
								" min"
							]
						}),
						isPaused && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1 text-xs text-orange-500",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "h-3 w-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Paused" })]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm font-medium",
					children: isComplete ? "Ready to claim!" : `${Math.floor(progressPercent)}%`
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
				value: progressPercent,
				className: "h-2"
			}),
			isDailyCapped && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-orange-500",
				children: [
					"Daily cap reached (",
					dailyCapMinutes,
					" min). Progress will resume tomorrow."
				]
			}),
			todayMinutes !== void 0 && dailyCapMinutes !== void 0 && !isDailyCapped && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted-foreground",
				children: [
					"Today: ",
					Math.floor(todayMinutes),
					" / ",
					dailyCapMinutes,
					" min"
				]
			})
		]
	});
}
/**
* Pre-start confirmation sheet for Starter Quests.
*
* Quest cards used to fire the mutation (and open the external URL) straight
* from the card tap. This gates that behind an explicit Continue, mirroring how
* Featured Offers gate on OfferDetailsDialog. Nothing external happens until
* `onContinue` runs.
*/
function QuestDetailsDialog({ quest, active, credited = false, open, onOpenChange, onContinue, isSubmitting, activeTimeQuestKey, activeTimeProgress }) {
	const accent = quest ? QUEST_ACCENTS[quest.quest_type] ?? QUEST_ACCENTS.ads : null;
	const view = quest ? deriveQuestView(quest, active, credited, activeTimeProgress) : null;
	const started = Boolean(view && view.progress > 0);
	const [checkinSubmitting, setCheckinSubmitting] = (0, import_react.useState)(false);
	const isCheckin = quest?.quest_type === "checkin";
	const todayIncomplete = isCheckin && active && !credited && (() => {
		const completedDays = active.checkin_days?.filter((d) => d.completed_at) ?? [];
		return !(active.checkin_days?.find((d, idx) => idx === completedDays.length))?.completed_at;
	})();
	const heartbeat = useCheckinHeartbeat({
		questKey: quest?.key ?? "",
		enabled: Boolean(isCheckin && open && todayIncomplete),
		onDayComplete: () => {
			onOpenChange(false);
		}
	});
	const ctaLabel = !quest ? "Start Quest" : isSubmitting ? "Opening…" : checkinSubmitting ? "Checking In…" : quest.quest_type === "ads" ? "Watch Ads" : quest.quest_type === "survey" ? started ? "View Surveys" : "Start Quest" : quest.quest_type === "shortlink" ? started ? "Continue" : "Start Quest" : quest.quest_type === "checkin" ? quest.required_active_seconds === 0 ? "Check In" : "Keep App Open" : quest.quest_type === "feed_ptc" || quest.quest_type === "feed_shortlink" || quest.quest_type === "feed_article" ? "Start" : quest.quest_type === "active_time" ? credited ? "Reward Credited" : "Claim Reward" : "Complete Locker";
	if (!open || !quest) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppBottomSheet, {
		open,
		onOpenChange,
		title: quest.label,
		footer: quest?.quest_type === "network" || quest?.quest_type === "active_time" || quest?.quest_type === "checkin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			variant: "outline",
			onClick: () => onOpenChange(false),
			className: "w-full",
			"data-testid": "quest-details-close",
			children: "Close"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex w-full gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				onClick: () => onOpenChange(false),
				"data-testid": "quest-details-cancel",
				children: "Cancel"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "jade",
				className: "flex-1",
				onClick: onContinue,
				disabled: isSubmitting || !quest,
				"data-testid": "quest-details-continue",
				children: [ctaLabel, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "ml-1 size-3.5" })]
			})]
		}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			"data-testid": "quest-details-dialog",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-3",
					children: [accent && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-hidden": true,
						className: "grid size-10 shrink-0 place-items-center rounded-xl text-white",
						style: {
							background: accent.tile,
							boxShadow: `0 6px 14px -4px ${accent.tileShadow}`
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(accent.icon, {
							className: "size-5",
							strokeWidth: 2
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1 text-left",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-amount text-sm text-gold-dark",
							"data-testid": "quest-details-reward",
							children: (() => {
								if (quest.quest_type === "ads") return formatReward(quest.reward_amount);
								if (quest.quest_type === "survey") return (quest.required_surveys ?? 5) * (quest.step_reward ?? 0) + quest.reward_amount;
								if (quest.quest_type === "network") {
									const requiredCount = quest.required_count ?? 3;
									const baseReward = quest.step_reward ?? 0;
									const customRewards = quest.step_rewards ?? [];
									let totalStepRewards = 0;
									for (let i = 0; i < requiredCount; i++) totalStepRewards += customRewards[i] !== void 0 ? customRewards[i] : baseReward;
									return formatReward(totalStepRewards + quest.reward_amount);
								}
								if (quest.quest_type === "feed_ptc" || quest.quest_type === "feed_shortlink" || quest.quest_type === "feed_article") {
									const stepsCount = quest.steps_count ?? 10;
									const baseReward = quest.step_reward ?? 0;
									const customRewards = quest.step_rewards ?? [];
									let totalStepRewards = 0;
									for (let i = 0; i < stepsCount; i++) totalStepRewards += customRewards[i] !== void 0 ? customRewards[i] : baseReward;
									return formatReward(totalStepRewards + quest.reward_amount);
								}
								const stepCount = quest.quest_type === "shortlink" ? quest.shortlink_steps.length : quest.quest_type === "checkin" ? quest.total_days ?? 3 : quest.locker_urls.length;
								const baseReward = quest.step_reward ?? 0;
								const customRewards = quest.step_rewards ?? [];
								let totalStepRewards = 0;
								for (let i = 0; i < stepCount; i++) totalStepRewards += customRewards[i] !== void 0 ? customRewards[i] : baseReward;
								return formatReward(totalStepRewards + quest.reward_amount);
							})()
						}), accent && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"data-testid": "quest-details-badge",
							className: "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.07em]",
							style: {
								background: accent.badgeBg,
								color: accent.badgeInk
							},
							children: accent.label
						})]
					})]
				}),
				view && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "space-y-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
						children: "About this quest"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-relaxed",
						"data-testid": "quest-details-description",
						children: view.description
					})]
				}),
				view && (quest.quest_type === "shortlink" || quest.quest_type === "locker" || quest.quest_type === "feed_ptc" || quest.quest_type === "feed_shortlink" || quest.quest_type === "feed_article") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "space-y-2",
					"data-testid": "quest-details-rewards",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
						children: "Rewards"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "space-y-1.5",
							children: (() => {
								const stepCount = quest.quest_type === "feed_ptc" || quest.quest_type === "feed_shortlink" || quest.quest_type === "feed_article" ? quest.steps_count ?? 10 : view.total;
								const baseReward = quest.step_reward ?? 0;
								const customRewards = quest.step_rewards ?? [];
								const completionBonus = quest.reward_amount;
								const currentProgress = view.progress;
								const steps = Array.from({ length: stepCount }, (_, i) => {
									const stepNum = i + 1;
									return {
										stepNum,
										stepReward: customRewards[i] !== void 0 ? customRewards[i] : baseReward,
										isCompleted: stepNum <= currentProgress
									};
								});
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									steps.map(({ stepNum, stepReward, isCompleted }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center justify-between gap-2",
										"data-testid": `quest-reward-step-${stepNum}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: isCompleted ? "text-muted-foreground line-through" : "",
											children: ["Step ", stepNum]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-1.5 font-semibold tabular-nums",
											children: [isCompleted && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs text-primary",
												children: "✓"
											}), formatReward(stepReward)]
										})]
									}, stepNum)),
									completionBonus > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center justify-between gap-2 border-t border-primary/20 pt-1.5",
										"data-testid": "quest-reward-completion",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: credited ? "text-muted-foreground line-through" : "",
											children: "Completion bonus"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-1.5 font-semibold tabular-nums",
											children: [credited && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs text-primary",
												children: "✓"
											}), formatReward(completionBonus)]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center justify-between gap-2 border-t border-primary/30 pt-1.5 text-base font-bold text-primary",
										"data-testid": "quest-reward-total",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Total" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "tabular-nums",
											children: formatReward(steps.reduce((sum, s) => sum + s.stepReward, 0) + completionBonus)
										})]
									})
								] });
							})()
						})
					})]
				}),
				view && quest.quest_type === "checkin" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "space-y-2",
					"data-testid": "quest-details-checkin-rewards",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
						children: "Daily Rewards"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "space-y-1.5",
							children: (() => {
								const totalDays = view.total;
								const baseReward = quest.step_reward ?? 0;
								const customRewards = quest.step_rewards ?? [];
								const completionBonus = quest.reward_amount;
								const completedDays = active?.checkin_days?.filter((d) => d.completed_at) ?? [];
								const days = Array.from({ length: totalDays }, (_, i) => {
									return {
										dayNum: i + 1,
										dayReward: customRewards[i] !== void 0 ? customRewards[i] : baseReward,
										isCompleted: i < completedDays.length
									};
								});
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									days.map(({ dayNum, dayReward, isCompleted }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center justify-between gap-2",
										"data-testid": `quest-reward-day-${dayNum}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: isCompleted ? "text-muted-foreground line-through" : "",
											children: ["Day ", dayNum]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-1.5 font-semibold tabular-nums",
											children: [isCompleted && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs text-primary",
												children: "✓"
											}), formatReward(dayReward)]
										})]
									}, dayNum)),
									completionBonus > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center justify-between gap-2 border-t border-primary/20 pt-1.5",
										"data-testid": "quest-reward-completion",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: credited ? "text-muted-foreground line-through" : "",
											children: "Completion bonus"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-1.5 font-semibold tabular-nums",
											children: [credited && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs text-primary",
												children: "✓"
											}), formatReward(completionBonus)]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center justify-between gap-2 border-t border-primary/30 pt-1.5 text-base font-bold text-primary",
										"data-testid": "quest-reward-total",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Total" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "tabular-nums",
											children: formatReward(days.reduce((sum, d) => sum + d.dayReward, 0) + completionBonus)
										})]
									})
								] });
							})()
						})
					})]
				}),
				view && started && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "space-y-1",
					"data-testid": "quest-details-progress",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
						children: "Your progress"
					}), quest.quest_type === "active_time" && activeTimeProgress ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActiveTimeProgress, {
						totalMinutes: activeTimeProgress.total_seconds / 60,
						targetMinutes: quest.target_minutes ?? 30,
						todayMinutes: activeTimeProgress.today_seconds / 60,
						dailyCapMinutes: quest.daily_cap_minutes ?? 120,
						isPaused: false
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm leading-relaxed",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-semibold [font-variant-numeric:tabular-nums]",
								children: [
									view.progress,
									" / ",
									view.total
								]
							}),
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-muted-foreground",
								children: [
									"complete — ",
									view.remaining,
									" more to finish."
								]
							})
						]
					})]
				}),
				quest.quest_type === "shortlink" && view && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-primary",
					"data-testid": "quest-details-step",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "size-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"You're about to start ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: ["step ", view.nextStep] }),
						" of ",
						view.total,
						". Stay on the page for at least ",
						quest.min_seconds_per_step,
						" seconds, then you'll be sent back automatically."
					] })]
				}),
				quest.quest_type === "checkin" && view && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-primary",
					"data-testid": "quest-details-checkin-info",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "size-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: quest.required_active_seconds === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						"Tap ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Check In" }),
						" once each day to maintain your streak. Come back daily to earn rewards!"
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						"Keep the app open and focused for ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [quest.required_active_seconds, "s"] }),
						" ",
						"each day. We track your active time automatically. Your progress:",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
							Math.floor(heartbeat.activeSeconds),
							"s / ",
							heartbeat.requiredSeconds,
							"s"
						] })
					] }) })]
				}),
				quest.quest_type === "network" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkQuestProviderGrid, {
					quest,
					active,
					credited,
					open
				}),
				quest.quest_type === "survey" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SurveyQuestFeed, {
					quest,
					active,
					credited,
					open
				}),
				quest.quest_type === "active_time" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					activeTimeProgress && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-2",
						"data-testid": "quest-details-active-time-progress",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
							children: "Your Progress"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActiveTimeProgress, {
							totalMinutes: activeTimeProgress.total_seconds / 60,
							targetMinutes: quest.target_minutes ?? 30,
							todayMinutes: activeTimeProgress.today_seconds / 60,
							dailyCapMinutes: quest.daily_cap_minutes ?? 120
						})]
					}),
					activeTimeQuestKey && !credited && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-xl border border-primary/30 bg-primary/5 p-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "flex items-center gap-2 text-sm font-medium text-primary",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Timer, { className: "size-4" }), "Tracking is on"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-primary/80",
							children: "Time is being counted while you use the app"
						})]
					}),
					view && view.progress >= view.total && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-xl border border-primary/30 bg-primary/5 p-3 text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold text-primary",
							children: credited ? "Reward Credited!" : "Ready to Claim"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-primary/80",
							children: credited ? `You earned ${formatReward(quest.reward_amount)}` : `${formatReward(quest.reward_amount)} waiting for you`
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-primary",
						"data-testid": "quest-details-active-time-info",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "size-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							"Keep the app open and active. Time keeps counting for",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [quest.grace_minutes ?? 10, " minutes"] }),
							" after you open an offer. VPN, multiple accounts or emulators may get the reward withheld."
						] })]
					})
				] }),
				quest.quest_type !== "active_time" && quest.quest_type !== "checkin" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "space-y-1 rounded-xl border border-destructive/30 bg-destructive/5 p-3",
					"data-testid": "quest-details-rules",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-destructive",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-3.5" }), "Before you start"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-relaxed text-destructive",
						children: "Complete the required action fully — closing early won't count. No VPN, no multiple accounts and no emulators, or the reward may be withheld."
					})]
				})
			]
		})
	});
}
/**
* Network quest provider grid component.
* Shows providers with completion status, handles opening offerwalls, and polls for updates.
*/
function NetworkQuestProviderGrid({ quest, active, credited, open }) {
	useQueryClient();
	const fetchProgress = useServerFn(getNetworkQuestProgress);
	const openNetwork = useServerFn(openQuestNetwork);
	const [opening, setOpening] = (0, import_react.useState)(null);
	const openedWindowRef = (0, import_react.useRef)(null);
	const { data: progress, refetch } = useQuery({
		queryKey: ["network-quest-progress", quest.key],
		queryFn: () => fetchProgress({ data: { questKey: quest.key } }),
		enabled: open && !credited,
		refetchInterval: 5e3
	});
	(0, import_react.useEffect)(() => {
		if (!open || credited) return;
		const handleFocus = () => {
			refetch();
		};
		window.addEventListener("focus", handleFocus);
		return () => window.removeEventListener("focus", handleFocus);
	}, [
		open,
		credited,
		refetch
	]);
	const handleProviderClick = async (providerId) => {
		if (opening || credited) return;
		setOpening(providerId);
		try {
			const newWindow = window.open("about:blank", "_blank");
			openedWindowRef.current = newWindow;
			const result = await openNetwork({ data: {
				questKey: quest.key,
				providerId
			} });
			if ("url" in result && result.url) {
				if (newWindow) newWindow.location.href = result.url;
			} else {
				newWindow?.close();
				const errorMsg = "error" in result ? result.error : "Failed to open network";
				toast.error(errorMsg);
			}
			setTimeout(() => {
				refetch();
			}, 1e3);
		} catch (error) {
			openedWindowRef.current?.close();
			toast.error(error instanceof Error ? error.message : "Unknown error");
		} finally {
			setOpening(null);
		}
	};
	const requiredCount = quest.required_count ?? 3;
	const baseReward = quest.step_reward ?? 0;
	const customRewards = quest.step_rewards ?? [];
	let totalStepRewards = 0;
	for (let i = 0; i < requiredCount; i++) totalStepRewards += customRewards[i] !== void 0 ? customRewards[i] : baseReward;
	const completionBonus = quest.reward_amount;
	const totalReward = totalStepRewards + completionBonus;
	const providers = progress?.providers ?? [];
	const doneCount = progress?.done ?? 0;
	const required = progress?.required ?? requiredCount;
	const totalNetworks = providers.length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "space-y-2",
			"data-testid": "quest-details-network-providers",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
					children: [
						"Complete 1 offer in any ",
						required,
						" ",
						required === 1 ? "network" : "networks"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 gap-2",
					children: providers.map((provider) => {
						const isDone = provider.done;
						const isOpening = opening === provider.providerId;
						const isNotNeeded = !isDone && doneCount >= required;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => !isDone && !isNotNeeded && handleProviderClick(provider.providerId),
							disabled: isDone || isOpening || credited || isNotNeeded,
							className: `
                  relative flex min-h-[80px] flex-col items-center justify-center gap-2 rounded-xl border p-3 transition-all
                  ${isDone ? "border-primary/30 bg-primary/10 opacity-80 cursor-default" : isNotNeeded ? "border-border/50 bg-muted/30 opacity-40 cursor-default" : "border-primary/20 bg-background hover:border-primary/40 hover:bg-primary/5 cursor-pointer"}
                  ${isOpening ? "opacity-50" : ""}
                `,
							"data-testid": `network-provider-${provider.providerId}`,
							children: [
								provider.logoUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: provider.logoUrl,
									alt: provider.name,
									className: "h-8 w-auto object-contain"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary",
									children: provider.name.substring(0, 2).toUpperCase()
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-center text-xs font-medium",
									children: provider.name
								}),
								isDone && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
										className: "h-3 w-3",
										strokeWidth: 3
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "absolute bottom-1 text-[10px] font-semibold text-primary",
									children: "Done"
								})] }),
								isNotNeeded && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "absolute bottom-1 text-[10px] font-medium text-muted-foreground",
									children: "Not needed"
								}),
								isOpening && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "absolute inset-0 flex items-center justify-center rounded-xl bg-background/80",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-5 w-5 animate-spin text-primary" })
								})
							]
						}, provider.providerId);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-center text-xs text-muted-foreground",
					children: [
						"Pick any ",
						required,
						" of these ",
						totalNetworks,
						" ",
						totalNetworks === 1 ? "network" : "networks",
						". 1 completed offer per network counts."
					]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "space-y-2",
			"data-testid": "quest-details-network-rewards",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
				children: "Rewards"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "space-y-1.5",
					children: [
						baseReward > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Per-network reward" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-semibold tabular-nums",
								children: [
									formatReward(baseReward),
									" × ",
									required
								]
							})]
						}),
						completionBonus > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: `flex items-center justify-between gap-2 ${baseReward > 0 ? "border-t border-primary/20 pt-1.5" : ""}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Completion bonus" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold tabular-nums",
								children: formatReward(completionBonus)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center justify-between gap-2 border-t border-primary/30 pt-1.5 text-base font-bold text-primary",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Total" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular-nums",
								children: formatReward(totalReward)
							})]
						})
					]
				})
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-primary",
			"data-testid": "quest-details-network-info",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "size-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
				"Tap a network above to open its offerwall. Complete an ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "offer, survey, or task" }),
				" inside the network.",
				quest.min_qualifying_usd > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					" Choose an offer that pays at least ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: ["$", quest.min_qualifying_usd.toFixed(2)] }),
					" so it counts."
				] })
			] })]
		})
	] });
}
/**
* Survey quest feed component.
* Shows mixed surveys from CPX Research, TheoremReach, and Timewall.
*/
function SurveyQuestFeed({ quest, active, credited, open }) {
	useQueryClient();
	const { session } = useAuth();
	const fetchFeed = useServerFn(fetchSurveyFeed);
	const startQuest = useServerFn(startSurveyQuest);
	const fetchProgress = useServerFn(getSurveyQuestProgress);
	const [sessionId, setSessionId] = (0, import_react.useState)(null);
	const [opening, setOpening] = (0, import_react.useState)(null);
	const openedWindowRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (open && !credited && !sessionId) startQuest({ data: { questKey: quest.key } }).then((result) => setSessionId(result.sessionId)).catch((err) => console.error("Failed to start survey quest:", err));
	}, [
		open,
		credited,
		sessionId,
		quest.key,
		startQuest
	]);
	const { data: feedData, refetch: refetchFeed, isLoading, error: feedError } = useQuery({
		queryKey: [
			"survey-feed",
			quest.key,
			sessionId
		],
		queryFn: () => fetchFeed({ data: {
			questKey: quest.key,
			sessionId
		} }),
		enabled: open && !credited && Boolean(sessionId),
		staleTime: 12e4,
		refetchInterval: 12e4
	});
	const { data: progress, refetch: refetchProgress } = useQuery({
		queryKey: ["survey-progress", quest.key],
		queryFn: () => fetchProgress({ data: { questKey: quest.key } }),
		enabled: open && !credited,
		refetchInterval: 1e4
	});
	(0, import_react.useEffect)(() => {
		if (!open || credited) return;
		const handleVisibilityChange = () => {
			if (!document.hidden) refetchProgress();
		};
		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
	}, [
		open,
		credited,
		refetchProgress
	]);
	(0, import_react.useEffect)(() => {
		if (!openedWindowRef.current) return;
		const interval = setInterval(() => {
			if (openedWindowRef.current?.closed) {
				openedWindowRef.current = null;
				setOpening(null);
				refetchProgress();
			}
		}, 1e3);
		return () => clearInterval(interval);
	}, [refetchProgress]);
	const handleSurveyClick = (survey) => {
		if (opening || credited) return;
		setOpening(survey.id);
		const newWindow = window.open(survey.entryLink, "_blank", "noopener,noreferrer");
		openedWindowRef.current = newWindow;
		setTimeout(() => {
			if (opening === survey.id) setOpening(null);
		}, 2e3);
	};
	const surveys = feedData?.surveys ?? [];
	const networks = feedData?.networks ?? [];
	const completed = progress?.completed ?? 0;
	const required = progress?.required ?? quest.required_surveys ?? 5;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "space-y-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm font-medium",
					children: "Survey Progress"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-xs text-muted-foreground",
					children: [
						completed,
						" / ",
						required,
						" completed"
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-2 overflow-hidden rounded-full bg-muted",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-full bg-primary transition-all duration-300",
					style: { width: `${Math.min(100, completed / required * 100)}%` }
				})
			})]
		}),
		networks.length > 0 && networks.some((n) => !n.ok || n.reason) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "space-y-1",
			children: networks.map((network) => network.reason && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-xs text-muted-foreground",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "capitalize",
						children: network.network
					}),
					": ",
					network.reason
				]
			}, network.network))
		}),
		feedError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "rounded-lg border border-destructive/50 bg-destructive/10 p-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-destructive",
				children: feedError instanceof Error ? feedError.message : "Failed to load surveys"
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "space-y-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-sm font-semibold",
				children: "Available Surveys"
			}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center justify-center py-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-6 animate-spin text-muted-foreground" })
			}) : surveys.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "size-8 text-muted-foreground mb-2" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "No surveys available right now"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground mt-1",
						children: "Check back in a few minutes"
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2",
				children: surveys.map((survey) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => handleSurveyClick(survey),
					disabled: opening === survey.id || credited,
					className: "w-full flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-2 mb-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium text-sm line-clamp-1",
								children: survey.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "shrink-0 font-semibold text-primary",
								children: ["+$", survey.payoutUsd.toFixed(2)]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3 text-xs text-muted-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [survey.loi, " min"] }),
								survey.rating && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["★ ", survey.rating.toFixed(1)] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "capitalize",
									children: survey.network.replace("research", "")
								})
							]
						})]
					}), opening === survey.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 shrink-0 animate-spin text-primary mt-0.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-4 shrink-0 text-muted-foreground mt-0.5" })]
				}, `${survey.network}-${survey.id}`))
			})]
		}),
		quest.allowed_networks?.includes("timewall") && session?.user?.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			onClick: () => {
				const timewallAppId = "b6537df755dd96d2";
				const userId = session.user.id;
				const timewallUrl = `https://timewall.io/users/login?oid=${timewallAppId}&uid=${encodeURIComponent(userId)}`;
				window.open(timewallUrl, "_blank", "noopener,noreferrer");
				toast.success("Timewall opened in new tab");
			},
			className: "w-full flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3 transition-colors hover:bg-primary/10",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-medium text-sm",
				children: "Timewall Surveys"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: "Browse more surveys"
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-5 text-primary" })]
		}) }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-primary",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "size-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
				"Complete surveys from the list above. You'll earn ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "80% of the survey payout" }),
				" ",
				"plus a ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
					"$",
					(quest.step_reward ?? 0).toFixed(2),
					" step reward"
				] }),
				" per survey. After completing all ",
				required,
				" surveys, you'll receive a",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
					"$",
					quest.reward_amount.toFixed(2),
					" completion bonus"
				] }),
				"."
			] })]
		})
	] });
}
//#endregion
export { QuestDetailsDialog };
