import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { C as useNavigate, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { $ as LockKeyhole, C as Sparkles, F as Rocket, Gt as Check, It as CircleQuestionMark, J as MessageSquare, K as Network, Mt as Clock, O as ShieldCheck, Pt as Clapperboard, Q as Lock, Xt as CalendarCheck, Zt as Bitcoin, _ as Timer, _t as Gift, et as LoaderCircle, i as Wallet, in as ArrowRight, rt as Link2, st as Layers, x as Star } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Skeleton } from "./skeleton-D9W9wFsj.mjs";
import { l as __exportAll } from "./server-CpGMOUrW.mjs";
import { n as supabase, t as safeStorage } from "./client-QOMq7HzS.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as AVATAR_OPTIONS } from "./premium-BIRn1NQB.mjs";
import { $ as advertiserAccountIsNew, Ct as startLockerQuest, Dt as updateUserTimezone, H as formatReward, M as SectionHeading, Mn as getDeviceId, Ot as Button, Q as isNativePlatform, Vn as playRewardedAd, Wn as reportAdWatched, Z as useCountUpOnVisible, Zn as startQuest, ct as ensureCheckinSession, d as AppShell, et as advertiserOnboardingActivationKey, f as BrandLogo, m as ActiveTimeStillHereDialog, mt as listActiveQuests, nr as useServerFn, rn as useRole, tr as useAuth, tt as advertiserOnboardingStorageKey, ut as getActiveTimeQuestKey, w as useActiveTime, wt as startShortlinkStep, yn as completeOnboarding } from "./router-sXMnYegW.mjs";
import { n as SimulatedLiveActivity } from "./SimulatedLiveActivity-DXX0vD52.mjs";
import { r as formatLockReason } from "./lock-state-BmOk6qOC.mjs";
import { n as ErrorState } from "./States-Cg9ELwgo.mjs";
import { n as SectionBanner } from "./SectionBanner-Cf6xDjCJ.mjs";
import { t as FeaturedOffers } from "./FeaturedOffers-pOqzVpyY.mjs";
import { t as OfferwallSlot } from "./OfferwallSlot-BiVjfKXB.mjs";
import { t as SocialLinks } from "./SocialLinks-CoNrBIJy.mjs";
import { n as StoreDialog, r as useStoreDialog, t as StoreButtons } from "./useStoreDialog-BOC_p28C.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/home-Aobq8Gh7.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var QUEST_ACCENTS = {
	ads: {
		label: "Easy",
		icon: Clapperboard,
		wash: "rgba(16,163,113,0.10)",
		badgeBg: "rgba(16,163,113,0.12)",
		badgeInk: "#0A6B4A",
		tile: "linear-gradient(145deg, #34D399 0%, #059669 100%)",
		tileShadow: "rgba(5,150,105,0.32)",
		bar: "linear-gradient(90deg, #34D399, #059669)"
	},
	shortlink: {
		label: "Challenge",
		icon: Link2,
		wash: "rgba(217,119,6,0.10)",
		badgeBg: "rgba(217,119,6,0.13)",
		badgeInk: "#92400E",
		tile: "linear-gradient(145deg, #FBBF24 0%, #D97706 100%)",
		tileShadow: "rgba(217,119,6,0.32)",
		bar: "linear-gradient(90deg, #FBBF24, #D97706)"
	},
	locker: {
		label: "Daily",
		icon: Lock,
		wash: "rgba(2,132,199,0.10)",
		badgeBg: "rgba(2,132,199,0.12)",
		badgeInk: "#075985",
		tile: "linear-gradient(145deg, #38BDF8 0%, #0369A1 100%)",
		tileShadow: "rgba(3,105,161,0.32)",
		bar: "linear-gradient(90deg, #38BDF8, #0369A1)"
	},
	checkin: {
		label: "Streak",
		icon: CalendarCheck,
		wash: "rgba(139,92,246,0.10)",
		badgeBg: "rgba(139,92,246,0.12)",
		badgeInk: "#5B21B6",
		tile: "linear-gradient(145deg, #A78BFA 0%, #7C3AED 100%)",
		tileShadow: "rgba(124,58,237,0.32)",
		bar: "linear-gradient(90deg, #A78BFA, #7C3AED)"
	},
	network: {
		label: "Network",
		icon: Network,
		wash: "rgba(236,72,153,0.10)",
		badgeBg: "rgba(236,72,153,0.12)",
		badgeInk: "#9F1239",
		tile: "linear-gradient(145deg, #F472B6 0%, #DB2777 100%)",
		tileShadow: "rgba(219,39,119,0.32)",
		bar: "linear-gradient(90deg, #F472B6, #DB2777)"
	},
	feed_ptc: {
		label: "PTC Feed",
		icon: Clapperboard,
		wash: "rgba(16,163,113,0.10)",
		badgeBg: "rgba(16,163,113,0.12)",
		badgeInk: "#0A6B4A",
		tile: "linear-gradient(145deg, #34D399 0%, #059669 100%)",
		tileShadow: "rgba(5,150,105,0.32)",
		bar: "linear-gradient(90deg, #34D399, #059669)"
	},
	feed_shortlink: {
		label: "Link Feed",
		icon: Link2,
		wash: "rgba(217,119,6,0.10)",
		badgeBg: "rgba(217,119,6,0.13)",
		badgeInk: "#92400E",
		tile: "linear-gradient(145deg, #FBBF24 0%, #D97706 100%)",
		tileShadow: "rgba(217,119,6,0.32)",
		bar: "linear-gradient(90deg, #FBBF24, #D97706)"
	},
	feed_article: {
		label: "Read Feed",
		icon: Link2,
		wash: "rgba(2,132,199,0.10)",
		badgeBg: "rgba(2,132,199,0.12)",
		badgeInk: "#075985",
		tile: "linear-gradient(145deg, #38BDF8 0%, #0369A1 100%)",
		tileShadow: "rgba(3,105,161,0.32)",
		bar: "linear-gradient(90deg, #38BDF8, #0369A1)"
	},
	survey: {
		label: "Survey",
		icon: MessageSquare,
		wash: "rgba(14,165,233,0.10)",
		badgeBg: "rgba(14,165,233,0.12)",
		badgeInk: "#0C4A6E",
		tile: "linear-gradient(145deg, #0EA5E9 0%, #0284C7 100%)",
		tileShadow: "rgba(2,132,199,0.32)",
		bar: "linear-gradient(90deg, #0EA5E9, #0284C7)"
	},
	timed_ptc: {
		label: "Timed PTC",
		icon: Timer,
		wash: "rgba(251,146,60,0.10)",
		badgeBg: "rgba(251,146,60,0.12)",
		badgeInk: "#9A3412",
		tile: "linear-gradient(145deg, #FB923C 0%, #EA580C 100%)",
		tileShadow: "rgba(234,88,12,0.32)",
		bar: "linear-gradient(90deg, #FB923C, #EA580C)"
	},
	active_time: {
		label: "Active Time",
		icon: Timer,
		wash: "rgba(99,102,241,0.10)",
		badgeBg: "rgba(99,102,241,0.12)",
		badgeInk: "#3730A3",
		tile: "linear-gradient(145deg, #818CF8 0%, #6366F1 100%)",
		tileShadow: "rgba(99,102,241,0.32)",
		bar: "linear-gradient(90deg, #818CF8, #6366F1)"
	}
};
var LOCKED_ACCENT = {
	label: "Locked",
	icon: LockKeyhole,
	wash: "rgba(100,116,139,0.07)",
	badgeBg: "rgba(100,116,139,0.11)",
	badgeInk: "#52616F",
	tile: "linear-gradient(145deg, #CBD5E1 0%, #94A3B8 100%)",
	tileShadow: "rgba(100,116,139,0.26)",
	bar: "linear-gradient(90deg, #CBD5E1, #94A3B8)"
};
var CREDITED_ACCENT = {
	...QUEST_ACCENTS.ads,
	label: "Completed",
	icon: ShieldCheck
};
/**
* Progress + copy derived from a quest and its active session.
*
* Shared by QuestCard and QuestDetailsDialog so the two can never disagree
* about how far along a quest is or which step comes next.
*/
function deriveQuestView(quest, active, credited, activeTimeProgress) {
	if (quest.quest_type === "survey") {
		const total = Math.max(1, quest.required_surveys ?? 5);
		const progress = credited ? total : active?.survey_completions_count ?? 0;
		return {
			total,
			progress,
			remaining: Math.max(0, total - progress),
			nextStep: Math.min(progress + 1, total),
			progressPercent: Math.min(100, Math.max(0, progress / Math.max(1, total) * 100)),
			description: `Complete ${total} ${total === 1 ? "survey" : "surveys"} and get rewarded!`
		};
	}
	if (quest.quest_type === "network") {
		const total = Math.max(1, quest.required_count ?? 3);
		const progress = credited ? total : active?.network_completions?.length ?? 0;
		return {
			total,
			progress,
			remaining: Math.max(0, total - progress),
			nextStep: Math.min(progress + 1, total),
			progressPercent: Math.min(100, Math.max(0, progress / Math.max(1, total) * 100)),
			description: `Complete offers from ${total} ${total === 1 ? "network" : "networks"} and get rewarded!`
		};
	}
	if (quest.quest_type === "feed_ptc" || quest.quest_type === "feed_shortlink" || quest.quest_type === "feed_article") {
		const total = Math.max(1, quest.steps_count ?? 10);
		const progress = credited ? total : active?.current_step ?? 0;
		const feedTypeName = quest.quest_type === "feed_ptc" ? "PTC campaign" : quest.quest_type === "feed_shortlink" ? "shortlink" : "article";
		return {
			total,
			progress,
			remaining: Math.max(0, total - progress),
			nextStep: Math.min(progress + 1, total),
			progressPercent: Math.min(100, Math.max(0, progress / Math.max(1, total) * 100)),
			description: total === 1 ? `Complete the ${feedTypeName} and get rewarded!` : `Complete ${total} ${feedTypeName}s and get rewarded!`
		};
	}
	if (quest.quest_type === "checkin") {
		const total = Math.max(1, quest.total_days ?? 3);
		const completedDays = active?.checkin_days?.filter((d) => d.completed_at) ?? [];
		const progress = credited ? total : completedDays.length;
		return {
			total,
			progress,
			remaining: Math.max(0, total - progress),
			nextStep: Math.min(progress + 1, total),
			progressPercent: Math.min(100, Math.max(0, progress / Math.max(1, total) * 100)),
			description: total === 1 ? "Check in today and get rewarded!" : `Check in for ${total} days and build your streak!`
		};
	}
	if (quest.quest_type === "active_time") {
		const total = Math.max(1, quest.target_minutes ?? 30);
		const progressMinutes = activeTimeProgress ? activeTimeProgress.total_seconds / 60 : 0;
		const progress = credited ? total : Math.min(total, Math.floor(progressMinutes));
		return {
			total,
			progress,
			remaining: Math.max(0, total - progress),
			nextStep: Math.min(progress + 1, total),
			progressPercent: Math.min(100, Math.max(0, progressMinutes / Math.max(1, total) * 100)),
			description: `Stay active in the app for ${total} ${total === 1 ? "minute" : "minutes"} to earn your reward!`
		};
	}
	if (quest.quest_type === "timed_ptc") {
		const total = Math.max(1, quest.timed_steps?.length ?? 1);
		const progress = credited ? total : active?.current_step ?? 0;
		return {
			total,
			progress,
			remaining: Math.max(0, total - progress),
			nextStep: Math.min(progress + 1, total),
			progressPercent: Math.min(100, Math.max(0, progress / Math.max(1, total) * 100)),
			description: total === 1 ? "Complete the timed step and get rewarded!" : `Complete ${total} timed steps and get rewarded!`
		};
	}
	const total = quest.quest_type === "ads" ? Math.max(1, quest.ads_required) : quest.quest_type === "shortlink" ? Math.max(1, quest.shortlink_steps.length) : Math.max(1, quest.locker_urls.length);
	const current = credited ? total : quest.quest_type === "ads" ? Number(active?.ads_watched ?? 0) : Number(active?.current_step ?? 0);
	const progress = Math.min(Math.max(0, current), total);
	return {
		total,
		progress,
		remaining: Math.max(0, total - progress),
		nextStep: Math.min(progress + 1, total),
		progressPercent: Math.min(100, Math.max(0, progress / Math.max(1, total) * 100)),
		description: quest.quest_type === "ads" ? `Watch ${total} ${total === 1 ? "video ad" : "video ads"} and get rewarded!` : quest.quest_type === "shortlink" ? `Visit ${total === 1 ? "the short link" : `${total} short links`} and get rewarded!` : total === 1 ? "Complete the locker challenge and unlock your reward!" : `Complete ${total} locker challenges and unlock your reward!`
	};
}
/**
* Check if advertiser onboarding has been completed for a user.
* Completion is intentionally device-local because this feature adds no database migration.
*/
function advertiserOnboardingSeen(userId) {
	return safeStorage.getItem(advertiserOnboardingStorageKey(userId)) === "seen";
}
/**
* Compact checkin day indicator - one row with colored dots and labels.
* Green = done, Orange = today, Grey = locked
*/
function CheckinDayDotsCompact({ totalDays, completedDays, currentDay }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex items-center justify-center gap-3",
		children: Array.from({ length: totalDays }, (_, i) => {
			const dayNum = i + 1;
			const isCompleted = dayNum <= completedDays;
			const isCurrent = dayNum === currentDay;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col items-center gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `size-2.5 rounded-full ${isCompleted ? "bg-emerald-500" : isCurrent ? "bg-amber-500" : "bg-gray-300"}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: `text-[10px] font-medium ${isCompleted ? "text-emerald-600" : isCurrent ? "text-amber-600" : "text-gray-400"}`,
					children: ["Day ", dayNum]
				})]
			}, i);
		})
	});
}
/**
* Compact timer for check-in and active_time cards.
* Shows mm:ss / target with thin progress bar below.
* Ticks locally every second for active_time quests.
*/
function CompactTimer({ currentSeconds, targetSeconds, status, isLive = false }) {
	const [localTick, setLocalTick] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		setLocalTick(0);
	}, [currentSeconds]);
	(0, import_react.useEffect)(() => {
		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") setLocalTick(0);
		};
		if (typeof document !== "undefined") {
			document.addEventListener("visibilitychange", handleVisibilityChange);
			return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
		}
	}, []);
	(0, import_react.useEffect)(() => {
		if (!isLive) return;
		const interval = setInterval(() => {
			if (typeof document !== "undefined" && document.visibilityState === "visible") setLocalTick((prev) => prev + 1);
		}, 1e3);
		return () => clearInterval(interval);
	}, [isLive]);
	const displaySeconds = isLive ? Math.min(currentSeconds + localTick, targetSeconds) : currentSeconds;
	const formatTime = (totalSeconds) => {
		return `${Math.floor(totalSeconds / 60)}:${(totalSeconds % 60).toString().padStart(2, "0")}`;
	};
	const progressPercent = Math.min(100, displaySeconds / targetSeconds * 100);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-center gap-1.5 text-xs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-3.5 text-emerald-600" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono font-semibold text-emerald-600",
						children: formatTime(displaySeconds)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-gray-400",
						children: "/"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-gray-600",
						children: formatTime(targetSeconds)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "relative h-1 overflow-hidden rounded-full bg-gray-100",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300",
					style: { width: `${progressPercent}%` }
				})
			}),
			status && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-center text-[10px] text-gray-500",
				children: status
			})
		]
	});
}
var CARD_W = 240;
/** Display font already loaded in __root.tsx — geometric, for premium onboarding only. */
var DISPLAY_FONT = "\"Manrope\", \"Inter\", ui-sans-serif, system-ui, sans-serif";
var INK = "#0B2B28";
var INK_SOFT = "#5F726F";
var INK_FAINT = "#94A4A1";
var HAIRLINE = "#EBE6DD";
var TRACK = "#EDF0EF";
/** Small flat gold coin. Restrained on purpose — no fake specular highlight. */
function CoinMark({ size = 14 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 16 16",
		width: size,
		height: size,
		"aria-hidden": true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
				id: "questCoin",
				x1: "0",
				y1: "0",
				x2: "0",
				y2: "1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
					offset: "0%",
					stopColor: "#F3D274"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
					offset: "100%",
					stopColor: "#D4AF37"
				})]
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "8",
				cy: "8",
				r: "7",
				fill: "url(#questCoin)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "8",
				cy: "8",
				r: "4.6",
				fill: "none",
				stroke: "#B8912A",
				strokeOpacity: "0.45"
			})
		]
	});
}
var QuestCard = (0, import_react.memo)(function QuestCard({ quest, active, credited, busy, lockLabel, onOpenDetails, onLocked, activeTimeProgress, activeTimeTracking }) {
	const locked = Boolean(quest.is_locked);
	const accent = locked ? LOCKED_ACCENT : credited ? CREDITED_ACCENT : QUEST_ACCENTS[quest.quest_type] ?? QUEST_ACCENTS.ads;
	const TileIcon = accent.icon;
	const { total, progress, remaining, nextStep, progressPercent, description } = deriveQuestView(quest, active, credited, activeTimeProgress);
	const displayReward = (() => {
		if (quest.quest_type === "ads") return quest.reward_amount;
		if (quest.quest_type === "survey") return (quest.required_surveys ?? 5) * (quest.step_reward ?? 0) + quest.reward_amount;
		if (quest.quest_type === "network") {
			const requiredCount = quest.required_count ?? 3;
			const baseReward = quest.step_reward ?? 0;
			const customRewards = quest.step_rewards ?? [];
			let totalStepRewards = 0;
			for (let i = 0; i < requiredCount; i++) totalStepRewards += customRewards[i] !== void 0 ? customRewards[i] : baseReward;
			return totalStepRewards + quest.reward_amount;
		}
		if (quest.quest_type === "feed_ptc" || quest.quest_type === "feed_shortlink" || quest.quest_type === "feed_article") {
			const stepsCount = quest.steps_count ?? 10;
			const baseReward = quest.step_reward ?? 0;
			const customRewards = quest.step_rewards ?? [];
			let totalStepRewards = 0;
			for (let i = 0; i < stepsCount; i++) totalStepRewards += customRewards[i] !== void 0 ? customRewards[i] : baseReward;
			return totalStepRewards + quest.reward_amount;
		}
		if (quest.quest_type === "checkin") {
			const totalDays = quest.total_days ?? 3;
			const baseReward = quest.step_reward ?? 0;
			const customRewards = quest.step_rewards ?? [];
			let totalStepRewards = 0;
			for (let i = 0; i < totalDays; i++) totalStepRewards += customRewards[i] !== void 0 ? customRewards[i] : baseReward;
			return totalStepRewards + quest.reward_amount;
		}
		if (quest.quest_type === "timed_ptc") {
			const timedSteps = quest.timed_steps?.length ?? 1;
			const baseReward = quest.step_reward ?? 0;
			const customRewards = quest.step_rewards ?? [];
			let totalStepRewards = 0;
			for (let i = 0; i < timedSteps; i++) totalStepRewards += customRewards[i] !== void 0 ? customRewards[i] : baseReward;
			return totalStepRewards + quest.reward_amount;
		}
		const stepCount = total;
		const baseReward = quest.step_reward ?? 0;
		const customRewards = quest.step_rewards ?? [];
		let totalStepRewards = 0;
		for (let i = 0; i < stepCount; i++) totalStepRewards += customRewards[i] !== void 0 ? customRewards[i] : baseReward;
		return totalStepRewards + quest.reward_amount;
	})();
	const detail = locked ? lockLabel ?? "This quest is currently locked" : credited ? "Reward verified and added to your wallet" : quest.quest_type === "ads" ? `${remaining} ${remaining === 1 ? "ad" : "ads"} left to verify` : quest.quest_type === "survey" ? `${remaining} ${remaining === 1 ? "survey" : "surveys"} remaining` : quest.quest_type === "shortlink" ? `Step ${nextStep} of ${total} · ${quest.min_seconds_per_step}s minimum` : quest.quest_type === "checkin" ? quest.streak_mode === "consecutive" ? `${remaining} more ${remaining === 1 ? "day" : "days"} to go` : `Check in ${remaining} more ${remaining === 1 ? "day" : "days"}` : quest.quest_type === "network" ? `Complete ${remaining} more ${remaining === 1 ? "network" : "networks"}` : quest.quest_type === "feed_ptc" || quest.quest_type === "feed_shortlink" || quest.quest_type === "feed_article" ? `Step ${nextStep} of ${total} · Top campaigns` : quest.quest_type === "timed_ptc" ? `Step ${nextStep} of ${total} · ${quest.timed_step_seconds ?? 60}s timer` : "Secure locker completion required";
	const summary = locked ? lockLabel ?? "Quest locked" : credited ? "Reward credited" : quest.quest_type === "ads" ? `Watch ${total} ${total === 1 ? "Ad" : "Ads"}` : quest.quest_type === "survey" ? `Complete ${total} ${total === 1 ? "Survey" : "Surveys"}` : quest.quest_type === "shortlink" ? `Visit ${total} ${total === 1 ? "Shortlink" : "Shortlinks"}` : quest.quest_type === "checkin" ? `Check in ${total} ${total === 1 ? "Day" : "Days"}` : quest.quest_type === "network" ? `Complete ${total} ${total === 1 ? "Network" : "Networks"}` : quest.quest_type === "feed_ptc" ? `Top ${total} PTC` : quest.quest_type === "feed_shortlink" ? `Top ${total} Shortlinks` : quest.quest_type === "feed_article" ? `Top ${total} Articles` : quest.quest_type === "timed_ptc" ? `${total} Timed ${total === 1 ? "Step" : "Steps"}` : "Complete Locker";
	const ctaText = locked ? "Locked" : credited ? "✓ Completed" : busy ? "Opening..." : quest.quest_type === "ads" ? "Watch Ads" : quest.quest_type === "survey" ? progress > 0 ? "Continue" : "Start Quest" : quest.quest_type === "shortlink" ? progress > 0 ? "Continue" : "Start Quest" : quest.quest_type === "checkin" ? "Tracking..." : quest.quest_type === "network" ? progress > 0 ? "Continue" : "Start Quest" : quest.quest_type === "active_time" ? "Tracking..." : quest.quest_type === "feed_ptc" || quest.quest_type === "feed_shortlink" || quest.quest_type === "feed_article" ? progress > 0 ? "Continue" : "Start Quest" : quest.quest_type === "timed_ptc" ? progress > 0 ? "Continue" : "Start Quest" : "Complete Locker";
	const actionTestId = quest.quest_type === "ads" ? `quest-watch-${quest.key}` : quest.quest_type === "survey" ? `quest-survey-${quest.key}` : quest.quest_type === "shortlink" ? `quest-open-${quest.key}` : quest.quest_type === "checkin" ? `quest-checkin-${quest.key}` : quest.quest_type === "network" ? `quest-network-${quest.key}` : quest.quest_type === "feed_ptc" || quest.quest_type === "feed_shortlink" || quest.quest_type === "feed_article" ? `quest-feed-${quest.key}` : quest.quest_type === "timed_ptc" ? `quest-timed-ptc-${quest.key}` : `quest-locker-${quest.key}`;
	const inactive = locked || credited;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "group relative shrink-0 snap-start overflow-hidden transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1",
		style: {
			width: CARD_W,
			minWidth: CARD_W,
			minHeight: 340,
			borderRadius: 18,
			background: "#FFFFFF",
			border: `1px solid ${HAIRLINE}`,
			boxShadow: "0 1px 2px rgba(11,43,40,0.04), 0 12px 28px -12px rgba(11,43,40,0.16)"
		},
		"data-testid": `quest-card-${quest.key}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-x-0 top-0",
				style: {
					height: 132,
					background: `linear-gradient(180deg, ${accent.wash} 0%, rgba(255,255,255,0) 100%)`
				},
				"aria-hidden": true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative flex h-full flex-col px-4 pb-4 pt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold uppercase leading-none tracking-[0.07em]",
							style: {
								background: accent.badgeBg,
								color: accent.badgeInk
							},
							"data-testid": `quest-type-${quest.key}`,
							children: [locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockKeyhole, { className: "size-3" }) : null, accent.label]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-right",
							"data-testid": `quest-reward-${quest.key}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-[9px] font-bold uppercase leading-none tracking-[0.11em]",
								style: { color: INK_FAINT },
								children: "Reward"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "mt-1 flex items-center justify-end gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoinMark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[17px] font-bold leading-none [font-variant-numeric:tabular-nums]",
									style: {
										color: INK,
										fontFamily: DISPLAY_FONT
									},
									children: formatReward(displayReward)
								})]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 shrink-0 grid place-items-center transition-transform duration-300 group-hover:scale-[1.04]",
						style: {
							width: 44,
							height: 44,
							borderRadius: 13,
							background: accent.tile,
							boxShadow: `0 6px 14px -4px ${accent.tileShadow}, inset 0 1px 0 rgba(255,255,255,0.45)`
						},
						"data-testid": `quest-icon-${quest.key}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TileIcon, {
							className: "size-5 text-white",
							strokeWidth: 2,
							"aria-hidden": true
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "mt-3.5 shrink-0 line-clamp-1 text-[17px] font-bold leading-tight tracking-[-0.01em]",
						style: {
							color: INK,
							fontFamily: DISPLAY_FONT
						},
						"data-testid": `quest-title-${quest.key}`,
						children: quest.label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1.5 shrink-0 line-clamp-2 text-[12px] leading-[1.45]",
						style: { color: INK_SOFT },
						"data-testid": `quest-description-${quest.key}`,
						children: description
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1" }),
					quest.quest_type === "checkin" && !credited && !locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 space-y-2",
						"data-testid": `quest-checkin-status-${quest.key}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckinDayDotsCompact, {
								totalDays: total,
								completedDays: progress,
								currentDay: progress + 1
							}),
							(() => {
								const todayDay = active?.checkin_days?.find((d, idx) => idx === progress);
								const todayRequired = quest.required_active_seconds ?? 0;
								if (todayDay?.completed_at && progress < total) {
									const completedAt = new Date(todayDay.completed_at);
									const nextDayUnlock = new Date(completedAt);
									nextDayUnlock.setDate(nextDayUnlock.getDate() + 1);
									nextDayUnlock.setHours(0, 0, 0, 0);
									const now = /* @__PURE__ */ new Date();
									if (now < nextDayUnlock) {
										const diff = nextDayUnlock.getTime() - now.getTime();
										const hours = Math.floor(diff / 36e5);
										const minutes = Math.floor(diff % 36e5 / 6e4);
										const nextDayNum = progress + 2;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-center text-[10px] text-gray-500",
											children: [
												"Day ",
												nextDayNum,
												" unlocks tonight at 12:00 AM (",
												hours,
												"h ",
												minutes,
												"m)"
											]
										});
									}
								}
								if (todayDay && !todayDay.completed_at && todayRequired > 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompactTimer, {
									currentSeconds: todayDay.active_seconds ?? 0,
									targetSeconds: todayRequired,
									status: void 0
								});
								return null;
							})(),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-center text-[10px] text-gray-600",
								children: [
									progress,
									" of ",
									total,
									" days"
								]
							})
						]
					}) : null,
					quest.quest_type === "active_time" && activeTimeProgress && !credited && !locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-3 space-y-2",
						"data-testid": `quest-active-time-status-${quest.key}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompactTimer, {
							currentSeconds: activeTimeProgress.total_seconds,
							targetSeconds: (quest.target_minutes ?? 30) * 60,
							isLive: true,
							status: activeTimeTracking?.isPaused ? "Paused" : activeTimeProgress.today_seconds >= (quest.daily_cap_minutes ?? 120) * 60 ? "Daily cap reached" : credited ? "Credited" : "Tracking"
						})
					}) : null,
					quest.quest_type !== "checkin" && quest.quest_type !== "active_time" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"data-testid": `quest-progress-${quest.key}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-[11px] font-semibold [font-variant-numeric:tabular-nums]",
								style: { color: INK },
								"data-testid": `quest-progress-text-${quest.key}`,
								children: [
									progress,
									" / ",
									total
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px] font-medium",
								style: { color: INK_FAINT },
								"data-testid": `quest-remaining-${quest.key}`,
								children: credited ? "Completed" : `${remaining} more`
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 h-1.5 w-full overflow-hidden rounded-full",
							style: { background: TRACK },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full rounded-full transition-[width] duration-500 ease-out",
								style: {
									width: `${progressPercent}%`,
									background: accent.bar
								}
							})
						})] })
					}),
					quest.quest_type !== "checkin" && quest.quest_type !== "active_time" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 line-clamp-1 text-[10px] leading-tight",
						style: { color: INK_FAINT },
						"data-testid": `quest-detail-${quest.key}`,
						children: [detail, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "sr-only",
							children: [" — ", summary]
						})]
					}),
					quest.quest_type === "checkin" || quest.quest_type === "active_time" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2.5 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg text-[11px] font-medium",
						style: {
							background: "rgba(16,163,113,0.08)",
							color: "#059669"
						},
						"data-testid": actionTestId,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-3.5" }), quest.quest_type === "checkin" ? "Tracking Progress" : "Tracking Active Time"]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "mt-2.5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[11px] text-[13px] font-semibold transition-[filter,background-color] duration-200 disabled:cursor-not-allowed enabled:hover:brightness-[1.12] [&_svg]:size-4",
						style: credited ? {
							background: "rgba(16,163,113,0.12)",
							color: "#0A6B4A"
						} : locked ? {
							background: "#F3F5F4",
							color: INK_FAINT
						} : {
							background: INK,
							color: "#FFFFFF",
							boxShadow: "0 1px 2px rgba(11,43,40,0.18)"
						},
						disabled: busy || credited,
						onClick: locked ? onLocked : onOpenDetails,
						"data-testid": actionTestId,
						children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "animate-spin" }) : locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockKeyhole, {}) : credited ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {}) : null, ctaText]
					})
				]
			}),
			inactive ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "pointer-events-none absolute inset-0 rounded-[18px] opacity-0 transition-opacity duration-300 group-hover:opacity-100",
				style: { boxShadow: `inset 0 0 0 1px ${accent.badgeBg}` },
				"aria-hidden": true
			})
		]
	});
});
var QuestDetailsDialog = (0, import_react.lazy)(() => import("./QuestDetailsDialog-eUI6ASF8.mjs").then((m) => ({ default: m.QuestDetailsDialog })));
function StarterQuests() {
	const { session } = useAuth();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [busy, setBusy] = (0, import_react.useState)(null);
	/** Quest awaiting confirmation in the details dialog. Nothing external runs until Continue. */
	const [pendingQuest, setPendingQuest] = (0, import_react.useState)(null);
	const start = useServerFn(startQuest);
	const report = useServerFn(reportAdWatched);
	const fetchQuests = useServerFn(listActiveQuests);
	const openStep = useServerFn(startShortlinkStep);
	const openLocker = useServerFn(startLockerQuest);
	const ensureSession = useServerFn(ensureCheckinSession);
	const setTimezone = useServerFn(updateUserTimezone);
	const fetchActiveTimeKey = useServerFn(getActiveTimeQuestKey);
	const quests = useQuery({
		queryKey: ["quests-active"],
		enabled: Boolean(session),
		queryFn: () => fetchQuests({ data: { isNative: isNativePlatform() } })
	});
	(0, import_react.useEffect)(() => {
		if (quests.data && quests.data.length > 0) quests.data.length;
	}, [quests.data]);
	const sessions = useQuery({
		queryKey: ["quest-sessions", session?.user.id],
		enabled: Boolean(session),
		queryFn: async () => {
			const { data } = await supabase.from("quest_sessions").select(`
          *,
          checkin_days:quest_checkin_days(local_date, active_seconds, last_ping_at, completed_at)
        `).order("started_at", { ascending: false });
			return data ?? [];
		}
	});
	const activeTimeQuestKey = useQuery({
		queryKey: ["active-time-quest-key", session?.user.id],
		enabled: Boolean(session),
		queryFn: () => fetchActiveTimeKey({}),
		staleTime: 3e4,
		select: (data) => data.questKey
	});
	useQuery({
		queryKey: ["active-time-progress", activeTimeQuestKey.data],
		enabled: Boolean(activeTimeQuestKey.data),
		queryFn: async () => {
			if (!activeTimeQuestKey.data) return null;
			const { data } = await supabase.from("quest_active_time_progress").select("last_ping_token, total_seconds, today_seconds").eq("user_id", session.user.id).eq("quest_key", activeTimeQuestKey.data).maybeSingle();
			return data;
		},
		staleTime: 1e4
	});
	const activeTime = useActiveTime();
	(0, import_react.useEffect)(() => {
		if (activeTimeQuestKey.data && !activeTime.state?.isTracking) activeTime.startTracking(activeTimeQuestKey.data);
	}, [activeTimeQuestKey.data, activeTime.state?.isTracking]);
	(0, import_react.useEffect)(() => {
		if (!session) return;
		const detectAndUpdateTimezone = async () => {
			try {
				const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
				if (browserTimezone) await setTimezone({ data: { timezone: browserTimezone } });
			} catch (err) {
				console.error("[timezone] Failed to detect/update:", err);
			}
		};
		detectAndUpdateTimezone();
	}, [session?.user.id]);
	(0, import_react.useEffect)(() => {
		if (!session || !quests.data) return;
		const initializeCheckinSessions = async () => {
			const checkinQuests = quests.data.filter((q) => q.quest_type === "checkin");
			for (const quest of checkinQuests) try {
				await ensureSession({ data: { questKey: quest.key } });
			} catch (err) {
				console.error(`[checkin] Failed to ensure session for ${quest.key}:`, err);
			}
			queryClient.invalidateQueries({ queryKey: ["quest-sessions", session.user.id] });
		};
		initializeCheckinSessions();
	}, [quests.data, session?.user.id]);
	const runAd = useMutation({
		mutationFn: async (questKey) => {
			const questSession = await start({ data: { questKey } });
			const result = await playRewardedAd();
			if (!result.completed) throw new Error("ADS_NOT_AVAILABLE");
			return report({ data: {
				sessionId: questSession.id,
				provider: result.provider
			} });
		},
		onSuccess: (result) => {
			if (result.credited) toast.success("Quest complete — wallet credited!");
			else toast.success("Ad verified. Keep going!");
			queryClient.invalidateQueries({ queryKey: ["quest-sessions", session?.user.id] });
			queryClient.invalidateQueries({ queryKey: ["quests-active"] });
			queryClient.invalidateQueries({ queryKey: ["profile"] });
			queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
			queryClient.invalidateQueries({ queryKey: ["offer-claims"] });
		},
		onError: (error) => {
			console.error(error);
			if (error.message === "ADS_NOT_AVAILABLE") toast.error("Ads are not available yet, try again later.");
			else toast.error(error.message || "That ad couldn't be verified.");
		},
		onSettled: () => setBusy(null)
	});
	const runShortlink = useMutation({
		mutationFn: async ({ questKey, step }) => {
			if (step === 1) (quests.data?.find((quest) => quest.key === questKey))?.quest_type;
			await start({ data: { questKey } });
			return openStep({ data: {
				questKey,
				step,
				isNative: isNativePlatform()
			} });
		},
		onSuccess: (result) => {
			if ("unavailable" in result) toast.info("Link coming soon — this quest isn't quite ready yet.");
			else if (result.url) {
				window.open(result.url, "_blank", "noopener,noreferrer");
				toast.info(`Complete the step — you'll be sent back automatically.`);
			} else toast.error("This step has no URL configured.");
			queryClient.invalidateQueries({ queryKey: ["quest-sessions", session?.user.id] });
		},
		onError: (error) => {
			console.error(error);
			toast.error(error.message || "Could not start this step.");
		},
		onSettled: () => setBusy(null)
	});
	const runLocker = useMutation({
		mutationFn: async (questKey) => {
			(quests.data?.find((quest) => quest.key === questKey))?.quest_type;
			return openLocker({ data: {
				questKey,
				isNative: isNativePlatform()
			} });
		},
		onSuccess: (result) => {
			if ("unavailable" in result) toast.info("Link coming soon — this quest isn't quite ready yet.");
			else if (result.lockerUrl) {
				window.open(result.lockerUrl, "_blank", "noopener,noreferrer");
				toast.info(result.total > 1 ? `Locker ${result.step} of ${result.total} — complete it, then return to CashGPT.` : "Complete the partner challenge, then return to CashGPT.");
			} else toast.error("This locker has no URL configured.");
			queryClient.invalidateQueries({ queryKey: ["quest-sessions", session?.user.id] });
		},
		onError: (error) => {
			console.error(error);
			toast.error(error.message || "Could not open this locker.");
		},
		onSettled: () => setBusy(null)
	});
	const runFeedQuest = useMutation({
		mutationFn: async ({ questKey, step }) => {
			const { startFeedQuest, openFeedQuestStep } = await import("../_libs/_.mjs").then((n) => n._);
			if (step === 1) (quests.data?.find((quest) => quest.key === questKey))?.quest_type;
			if (step === 1) {
				await startFeedQuest({ data: { questKey } });
				return openFeedQuestStep({ data: {
					questKey,
					step: 1
				} });
			}
			return openFeedQuestStep({ data: {
				questKey,
				step
			} });
		},
		onSuccess: (result) => {
			if (result.error) toast.error(result.error);
			else if (result.url) {
				window.open(result.url, "_blank", "noopener,noreferrer");
				toast.info("Complete the task — you'll be sent back automatically.");
			} else if (result.completed) toast.success("Feed quest complete!");
			else toast.error("No URL available for this step.");
			queryClient.invalidateQueries({ queryKey: ["quest-sessions", session?.user.id] });
		},
		onError: (error) => {
			console.error(error);
			if (error.message.includes("Not enough campaigns available")) toast.error("No campaigns available right now, try again later.");
			else toast.error(error.message || "Could not start this quest.");
		},
		onSettled: () => setBusy(null)
	});
	/**
	* Session-derived runtime bits for a quest, so the card and handleContinue
	* always agree on which step comes next.
	*/
	const questRuntime = (q) => {
		const active = sessions.data?.find((s) => s.quest_key === q.key && s.status === "started");
		const credited = sessions.data?.some((s) => s.quest_key === q.key && s.status === "credited") ?? false;
		const total = q.quest_type === "feed_ptc" || q.quest_type === "feed_shortlink" || q.quest_type === "feed_article" ? q.steps_count ?? 10 : q.quest_type === "shortlink" ? Math.max(1, q.shortlink_steps.length) : 1;
		const currentStep = Number(active?.current_step ?? 0);
		return {
			active,
			credited,
			nextStep: credited ? total : Math.min(currentStep + 1, total)
		};
	};
	const createOpenDetailsHandler = (0, import_react.useCallback)((questKey) => () => {
		const q = quests.data?.find((quest) => quest.key === questKey);
		if (q) setPendingQuest(q);
	}, [quests.data]);
	const createLockedHandler = (0, import_react.useCallback)((lockLabel) => () => {
		toast.info(lockLabel ? `This quest is locked. ${lockLabel}.` : "This quest is currently locked.");
	}, []);
	/**
	* Dispatches the real quest action. Only reachable from the details dialog's
	* Continue button — the card itself no longer triggers anything external.
	*/
	const handleContinue = () => {
		const q = pendingQuest;
		if (!q) return;
		const { credited, nextStep } = questRuntime(q);
		if (Boolean(q.is_locked) || credited) return;
		q.key, q.quest_type;
		setBusy(q.key);
		if (q.quest_type === "timed_ptc") {
			navigate({
				to: "/timed-ptc/$questKey/$step",
				params: {
					questKey: q.key,
					step: String(nextStep)
				}
			});
			setPendingQuest(null);
		} else if (q.quest_type === "shortlink") runShortlink.mutate({
			questKey: q.key,
			step: nextStep
		});
		else if (q.quest_type === "locker") runLocker.mutate(q.key);
		else if (q.quest_type === "feed_ptc" || q.quest_type === "feed_shortlink" || q.quest_type === "feed_article") runFeedQuest.mutate({
			questKey: q.key,
			step: nextStep
		});
		else runAd.mutate(q.key);
		setPendingQuest(null);
	};
	if (quests.isLoading || sessions.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex gap-4 overflow-hidden pb-2",
		"data-testid": "quests-loading",
		children: [0, 1].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-[340px] w-[240px] min-w-[240px] rounded-[18px]" }, item))
	});
	if (quests.isError || sessions.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, { onRetry: () => {
		quests.refetch();
		sessions.refetch();
	} });
	if (!quests.data?.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted-foreground",
		"data-testid": "quests-empty",
		children: "No quests configured yet."
	});
	const pendingRuntime = pendingQuest ? questRuntime(pendingQuest) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "stagger-children flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 pr-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
			"data-testid": "starter-quests-scroll",
			children: quests.data.filter((quest) => {
				if (quest.quest_type === "timed_ptc" && isNativePlatform()) return false;
				return true;
			}).map((quest) => {
				const q = quest;
				const isLocked = Boolean(q.is_locked);
				const unlockReason = q.unlock_reason ?? null;
				const lockLabel = isLocked ? formatLockReason(unlockReason) : null;
				const { active, credited } = questRuntime(q);
				const isBusy = busy === quest.key;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuestCard, {
					quest: q,
					active,
					credited: Boolean(credited),
					busy: isBusy,
					lockLabel,
					onLocked: createLockedHandler(lockLabel),
					onOpenDetails: createOpenDetailsHandler(quest.key),
					activeTimeQuestKey: activeTimeQuestKey.data,
					activeTimeProgress: quest.quest_type === "active_time" && activeTime.state ? {
						last_ping_token: "",
						total_seconds: activeTime.state.totalSeconds,
						today_seconds: activeTime.state.todaySeconds
					} : void 0,
					activeTimeTracking: quest.quest_type === "active_time" && activeTime.state ? {
						isTracking: activeTime.state.isTracking,
						isPaused: activeTime.state.isPaused,
						showStillHerePrompt: activeTime.state.showStillHerePrompt,
						lastPingAt: activeTime.state.lastServerSync,
						pingToken: null,
						error: activeTime.state.error
					} : void 0
				}, quest.key);
			})
		}),
		pendingQuest && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
			fallback: null,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuestDetailsDialog, {
				quest: pendingQuest,
				...pendingRuntime?.active ? { active: pendingRuntime.active } : {},
				credited: pendingRuntime?.credited ?? false,
				open: Boolean(pendingQuest),
				onOpenChange: (open) => !open && setPendingQuest(null),
				onContinue: handleContinue,
				isSubmitting: Boolean(pendingQuest) && busy === pendingQuest?.key,
				activeTimeQuestKey: activeTimeQuestKey.data,
				activeTimeProgress: pendingQuest?.quest_type === "active_time" && activeTime.state ? {
					last_ping_token: "",
					total_seconds: activeTime.state.totalSeconds,
					today_seconds: activeTime.state.todaySeconds
				} : void 0
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActiveTimeStillHereDialog, {
			open: activeTime.state?.showStillHerePrompt || false,
			onConfirm: activeTime.confirmStillHere
		})
	] });
}
/**
* Simulated "total paid out" figure for the Home payouts strip.
*
* UI SIMULATION ONLY. Nothing here reads from or writes to Supabase — no
* transactions, withdrawals, postbacks or database rows are created. The only
* state is a small seed in localStorage.
*
* Model:
*   - A random starting total in [$300,000, $400,000] and a random salt are
*     picked once and persisted, together with the UTC day they were picked.
*   - Every UTC day gets its own daily change in [$1,000, $1,500], derived
*     deterministically from the salt + day number, so a given day always shows
*     the same "+$X today" across reloads.
*   - total = start + every completed day's change + today's change accrued in
*     proportion to how much of the UTC day has elapsed.
*
* The result grows by roughly one daily change per day and never jumps to an
* unrelated number on refresh. If storage is unavailable (private mode, blocked
* storage) a seed is kept in memory instead, so it is stable for the page's life.
*/
var STORAGE_KEY = "cashgpt.payout-sim.v1";
var DAY_MS = 864e5;
var START_MIN = 3e5;
var START_MAX = 4e5;
var DAILY_MIN = 1e3;
/** Bounds the catch-up loop if a stored seed is very old. */
var MAX_DAYS = 3650;
var memorySeed = null;
function randInt(min, max) {
	return min + Math.floor(Math.random() * (max - min + 1));
}
function utcDay(ms) {
	return Math.floor(ms / DAY_MS);
}
function isValidSeed(value) {
	if (!value || typeof value !== "object") return false;
	const s = value;
	return typeof s.start === "number" && Number.isFinite(s.start) && s.start >= 3e5 && s.start <= 4e5 && typeof s.day0 === "number" && Number.isInteger(s.day0) && typeof s.salt === "number" && Number.isInteger(s.salt);
}
function newSeed(nowMs) {
	return {
		start: randInt(START_MIN, START_MAX),
		day0: utcDay(nowMs),
		salt: randInt(1, 2147483646)
	};
}
function loadSeed(nowMs) {
	try {
		const raw = safeStorage.getItem(STORAGE_KEY);
		if (raw) {
			const parsed = JSON.parse(raw);
			if (isValidSeed(parsed) && parsed.day0 <= utcDay(nowMs)) return parsed;
		}
		const seed = newSeed(nowMs);
		safeStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
		return seed;
	} catch {
		memorySeed ??= newSeed(nowMs);
		return memorySeed;
	}
}
/**
* Deterministic daily change for a given day, in [DAILY_MIN, DAILY_MAX].
* A mulberry32 step over (salt, day) — cheap, stable and well spread.
*/
function dailyChangeFor(salt, day) {
	let t = (salt ^ Math.imul(day, 2654435761)) >>> 0;
	t = t + 1831565813 >>> 0;
	let r = Math.imul(t ^ t >>> 15, t | 1);
	r ^= r + Math.imul(r ^ r >>> 7, r | 61);
	const unit = ((r ^ r >>> 14) >>> 0) / 4294967296;
	return DAILY_MIN + Math.floor(unit * 501);
}
/** Pure computation, split out so it can be checked without a browser. */
function computePayoutSnapshot(seed, nowMs) {
	const today = utcDay(nowMs);
	const firstDay = Math.max(seed.day0, today - MAX_DAYS);
	let total = seed.start;
	for (let day = firstDay; day < today; day++) total += dailyChangeFor(seed.salt, day);
	const todayChange = dailyChangeFor(seed.salt, today);
	const dayFraction = (nowMs - today * DAY_MS) / DAY_MS;
	total += Math.floor(todayChange * dayFraction);
	return {
		total,
		todayChange
	};
}
/** Current simulated total + today's change. Browser-only (uses localStorage). */
function simulatedPayoutSnapshot(nowMs = Date.now()) {
	return computePayoutSnapshot(loadSeed(nowMs), nowMs);
}
var home_exports = /* @__PURE__ */ __exportAll({ component: () => HomePage });
var AdvertiserDashboard = (0, import_react.lazy)(() => import("./AdvertiserDashboard-CQCetUu3.mjs").then((m) => ({ default: m.AdvertiserDashboard })));
var AdvertiserOnboarding = (0, import_react.lazy)(() => import("./AdvertiserOnboarding-Dj4-OFZg.mjs").then((m) => ({ default: m.AdvertiserOnboarding })));
var COMMUNITY_AVATARS = AVATAR_OPTIONS.slice(0, 5);
function HomePage() {
	const { profile, session } = useAuth();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const save = useServerFn(completeOnboarding);
	const autoOnboarded = (0, import_react.useRef)(false);
	const communityStat = useCountUpOnVisible(5e4);
	const storeDialog = useStoreDialog();
	const { role, overview: advertiserOverview } = useRole();
	const [showAdvertiserOnboarding, setShowAdvertiserOnboarding] = (0, import_react.useState)(false);
	const [advertiserBannerDismissed, setAdvertiserBannerDismissed] = (0, import_react.useState)(() => {
		if (typeof window === "undefined") return false;
		return safeStorage.getItem("coinquest.advertiser_banner_dismissed") === "true";
	});
	const dismissAdvertiserBanner = () => {
		setAdvertiserBannerDismissed(true);
		safeStorage.setItem("coinquest.advertiser_banner_dismissed", "true");
	};
	(0, import_react.useEffect)(() => {
		const userId = session?.user.id;
		const account = advertiserOverview?.account;
		if (role !== "advertiser" || !userId || !account || advertiserOnboardingSeen(userId)) return;
		const activationAt = safeStorage.getItem(advertiserOnboardingActivationKey(userId));
		if (advertiserAccountIsNew(activationAt) || advertiserAccountIsNew(account.createdAt)) setShowAdvertiserOnboarding(true);
	}, [
		advertiserOverview,
		role,
		session?.user.id
	]);
	(0, import_react.useEffect)(() => {
		if (!profile || profile.onboarded) return;
		if (autoOnboarded.current) return;
		let name = "";
		let phone;
		const raw = typeof window !== "undefined" ? safeStorage.getItem("coinquest.pending_onboarding") : null;
		if (raw) try {
			const parsed = JSON.parse(raw);
			name = (parsed.name ?? "").trim();
			if (parsed.phone?.trim()) phone = parsed.phone.trim();
		} catch {}
		if (name.length < 2) {
			const meta = session?.user?.user_metadata;
			name = (meta?.full_name ?? meta?.name ?? "").trim().slice(0, 80);
		}
		if (name.length >= 2) {
			autoOnboarded.current = true;
			save({ data: {
				name,
				...phone ? { phone } : {},
				deviceId: getDeviceId()
			} }).then(() => {
				safeStorage.removeItem("coinquest.pending_onboarding");
				queryClient.invalidateQueries({ queryKey: ["profile"] });
			}).catch(() => {
				navigate({
					to: "/onboarding",
					replace: true
				});
			});
			return;
		}
		navigate({
			to: "/onboarding",
			replace: true
		});
	}, [
		profile,
		session,
		navigate,
		queryClient,
		save
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		subtitle: "Earn as you go",
		bgClass: "home-page-bg",
		home: true,
		children: role === "advertiser" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Suspense, {
			fallback: null,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdvertiserDashboard, {}), showAdvertiserOnboarding && session?.user.id && advertiserOverview && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdvertiserOnboarding, {
				userId: session.user.id,
				overview: advertiserOverview,
				onComplete: () => setShowAdvertiserOnboarding(false)
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "home-orb home-orb-jade"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "home-orb home-orb-gold"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SimulatedLiveActivity, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBanner, { section: "home" }),
			!advertiserBannerDismissed && role === "publisher" && advertiserOverview?.settings.promoActive && !advertiserOverview?.account && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card relative mt-3 overflow-hidden p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: dismissAdvertiserBanner,
					className: "absolute right-3 top-3 text-muted-foreground hover:text-foreground",
					"aria-label": "Dismiss",
					children: "×"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex size-10 shrink-0 items-center justify-center rounded-full bg-jade-gradient",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-5 text-primary-foreground" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: "Run your own campaign"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-xs text-muted-foreground",
								children: [
									"First deposit bonus",
									" ",
									advertiserOverview?.userBonusPercent ?? advertiserOverview?.settings.firstDepositBonusPercent,
									"% · Launch your offer and reach thousands of earners"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/advertiser/create",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "jade",
									className: "mt-3",
									children: "Become Advertiser"
								})
							})
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "tour-starter-quests",
				className: "rise-in",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
					variant: "ribbon",
					icon: Rocket,
					iconSrc: "/icons/icon-starter-quest.webp",
					title: "Starter Quests",
					subtitle: "Complete simple quests and earn rewards!"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StarterQuests, {})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "tour-featured-offers",
				className: "rise-in",
				style: { animationDelay: "70ms" },
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
					variant: "ribbon",
					icon: Star,
					iconSrc: "/icons/icon-featured-offers.webp",
					title: "Featured Offers",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/featured",
						"data-testid": "home-view-all-featured",
						className: "flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary-soft",
						children: ["View all", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3.5" })]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeaturedOffers, { scope: "home" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				icon: Layers,
				iconSrc: "/icons/icon-offerwall.webp",
				title: "Offerwall"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfferwallSlot, { limit: 6 }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 flex justify-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/offerwall",
					className: "text-xs font-semibold text-primary underline-offset-4 hover:underline",
					children: "View All"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "relative mt-5 h-6 overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
					viewBox: "0 0 400 24",
					preserveAspectRatio: "none",
					className: "absolute inset-0 h-full w-full",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
						id: "live-community-divider",
						x1: "0",
						y1: "0",
						x2: "1",
						y2: "0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
								offset: "0%",
								stopColor: "var(--color-mint)",
								stopOpacity: "0"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
								offset: "50%",
								stopColor: "var(--color-gold)",
								stopOpacity: "0.55"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
								offset: "100%",
								stopColor: "var(--color-mint)",
								stopOpacity: "0"
							})
						]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M0 16 C100 0 300 0 400 16",
						stroke: "url(#live-community-divider)",
						strokeWidth: "2",
						fill: "none",
						strokeLinecap: "round"
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				ref: communityStat.ref,
				"data-testid": "live-community-section",
				className: "surface-card premium-step-in relative overflow-hidden p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"aria-hidden": true,
						className: "pointer-events-none absolute -right-10 -top-10 size-40 rounded-full",
						style: { background: "radial-gradient(circle, oklch(0.33 0.048 197.2 / 0.1), transparent 68%)" }
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex items-center gap-1.5 rounded-full bg-mint/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary ring-1 ring-inset ring-mint/25",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "relative grid size-1.5 place-items-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "payout-live-dot absolute inset-0 rounded-full bg-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-primary" })]
						}), "Live Community"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-amount font-display text-3xl leading-none text-foreground",
									"data-testid": "live-community-stat",
									children: [communityStat.value.toLocaleString(), "+"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs text-muted-foreground",
									children: "Users earning with us"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2.5 flex items-center gap-1.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "flex items-center gap-0.5 text-gold-dark",
											"aria-hidden": true,
											children: Array.from({ length: 5 }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "size-3.5 fill-current" }, index))
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-sm font-semibold text-foreground",
											children: "4.9/5"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs text-muted-foreground",
											children: "from 1,200+ reviews"
										})
									]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex shrink-0 -space-x-3",
							"aria-hidden": true,
							"data-testid": "live-community-avatars",
							children: [COMMUNITY_AVATARS.map((avatar, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: avatar.imageUrl,
								alt: "",
								style: { zIndex: COMMUNITY_AVATARS.length - index },
								className: "size-11 rounded-full border-2 border-card object-cover shadow-soft",
								loading: "lazy",
								decoding: "async"
							}, avatar.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid size-11 place-items-center rounded-full border-2 border-card bg-background-alt text-sm font-bold text-primary shadow-soft",
								children: "+"
							})]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				"data-testid": "cash-out-section",
				className: "relative mt-10 overflow-hidden rounded-[1.75rem] bg-jade-gradient p-5 shadow-lift",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"aria-hidden": true,
						className: "pointer-events-none absolute -right-14 -top-16 size-48 rounded-full",
						style: { background: "radial-gradient(circle, oklch(0.824 0.163 77.8 / 0.25), transparent 70%)" }
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"aria-hidden": true,
						className: "pointer-events-none absolute -bottom-20 -left-12 size-44 rounded-full",
						style: { background: "radial-gradient(circle, oklch(0.33 0.048 197.2 / 0.2), transparent 70%)" }
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-gold-foreground shadow-gold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-3.5" }), " Payouts"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "mt-3 font-display text-[1.7rem] leading-tight text-primary-foreground",
								children: ["Cash Out ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-gold",
									children: "Your Way"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-primary-foreground/70",
								children: "Real payouts, your choice — withdraw the moment you hit the minimum."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaidOutThisWeek, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-5 grid gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									"data-testid": "payout-method-paypal",
									style: { animationDelay: "60ms" },
									className: "payout-card relative flex items-center gap-4 overflow-hidden rounded-2xl bg-card/95 p-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "grid size-14 shrink-0 place-items-center rounded-2xl text-white shadow-lg",
											style: { background: "linear-gradient(135deg,#009cde,#003087)" },
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "size-7" })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0 flex-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-wrap items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-display text-lg text-foreground",
													children: "PayPal"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "rounded-full bg-mint/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary",
													children: "Most popular"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-0.5 text-xs text-muted-foreground",
												children: "Straight to your account — cash in hand, fast."
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "shrink-0 rounded-full bg-background-alt px-2.5 py-1 text-[11px] font-bold text-primary",
											children: "from $5"
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										"data-testid": "payout-method-crypto",
										style: { animationDelay: "140ms" },
										className: "payout-card relative overflow-hidden rounded-2xl bg-card/95 p-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "grid size-12 place-items-center rounded-2xl text-white shadow-lg",
												style: { background: "linear-gradient(135deg,#26a17b,#345d9d)" },
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bitcoin, { className: "size-6" })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-3 font-display text-base text-foreground",
												children: "Crypto"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-0.5 text-xs text-muted-foreground",
												children: "USDT · Litecoin"
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										"data-testid": "payout-method-giftcards",
										style: { animationDelay: "220ms" },
										className: "payout-card relative overflow-hidden rounded-2xl bg-card/95 p-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "grid size-12 place-items-center rounded-2xl text-white shadow-lg",
												style: { background: "linear-gradient(135deg,#ff9900,#ff5e3a)" },
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gift, { className: "size-6" })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-3 font-display text-base text-foreground",
												children: "Gift Cards"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-0.5 text-xs text-muted-foreground",
												children: "Amazon · Google Play"
											})
										]
									})]
								})]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				"data-testid": "need-help-card",
				className: "surface-card mt-4 flex items-center gap-4 p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-12 shrink-0 place-items-center rounded-2xl bg-mint/15 text-primary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleQuestionMark, { className: "size-6" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-semibold",
							children: "Need Help?"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 text-xs text-muted-foreground",
							children: "Our support team is here whenever you need it."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "jade",
						className: "shrink-0",
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/support",
							children: "Get Help"
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				"data-testid": "get-app-section",
				className: "rise-in mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card p-5 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl text-foreground",
							children: "Get the CashGPT app"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: "Earn faster on your phone."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreButtons, {
								onSelect: storeDialog.select,
								tone: "light",
								compact: true
							})
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "mt-8 flex flex-col items-center gap-4 pb-6 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandLogo, {
						variant: "light",
						className: "h-8 w-auto max-w-[140px]"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SocialLinks, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/legal/privacy",
								className: "hover:text-foreground hover:underline",
								children: "Privacy"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								"aria-hidden": true,
								children: "·"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/legal/terms",
								className: "hover:text-foreground hover:underline",
								children: "Terms"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								"aria-hidden": true,
								children: "·"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/legal/withdrawal-policy",
								className: "hover:text-foreground hover:underline",
								children: "Withdrawal Policy"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								"aria-hidden": true,
								children: "·"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/legal/referral-terms",
								className: "hover:text-foreground hover:underline",
								children: "Referral Terms"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "© 2026 CashGPT. All rights reserved."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreDialog, {
				store: storeDialog.store,
				open: storeDialog.open,
				onOpenChange: storeDialog.setOpen
			})
		] })
	});
}
var LIVE_TICK_MS = 6e4;
function PaidOutThisWeek() {
	const [value, setValue] = (0, import_react.useState)(0);
	const [todayChange, setTodayChange] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const initial = simulatedPayoutSnapshot();
		setTodayChange(initial.todayChange);
		let raf = 0;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setValue(initial.total);
		else {
			const duration = 1100;
			const start = performance.now();
			const tick = (now) => {
				const t = Math.min(1, (now - start) / duration);
				const eased = 1 - Math.pow(1 - t, 3);
				setValue(Math.round(initial.total * eased));
				if (t < 1) raf = requestAnimationFrame(tick);
			};
			raf = requestAnimationFrame(tick);
		}
		const interval = window.setInterval(() => {
			const next = simulatedPayoutSnapshot();
			setValue(next.total);
			setTodayChange(next.todayChange);
		}, LIVE_TICK_MS);
		return () => {
			cancelAnimationFrame(raf);
			window.clearInterval(interval);
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "payout-proof-strip",
		className: "mt-3 inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/10 py-1.5 pl-2.5 pr-3.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "relative grid size-2.5 place-items-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "payout-live-dot absolute inset-0 rounded-full bg-mint" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2.5 rounded-full bg-mint" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-xs text-primary-foreground/80",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-amount font-bold text-gold",
						children: ["$", value.toLocaleString("en-US")]
					}),
					" ",
					"total paid out"
				]
			}),
			todayChange !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "rounded-full bg-mint/20 px-1.5 py-0.5 text-[10px] font-bold text-mint",
				"data-testid": "payout-today-change",
				children: [
					"+$",
					todayChange.toLocaleString("en-US"),
					" today"
				]
			})
		]
	});
}
//#endregion
export { deriveQuestView as i, QUEST_ACCENTS as r, home_exports as t };
