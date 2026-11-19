import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { $ as LockKeyhole, $t as Banknote, A as Share2, B as Play, C as Sparkles, E as ShoppingCart, F as Rocket, Jt as CalendarDays, O as ShieldCheck, Pt as Clapperboard, Q as Lock, Qt as Bell, X as Megaphone, _t as Gift, b as Tag, bt as Flame, en as BadgeCheck, f as Trophy, i as Wallet, jt as Coins, l as UserPlus, m as TrendingUp, nt as ListChecks, o as Video, rt as Link2, s as Users, st as Layers, t as Zap, tn as Award, w as Smartphone, x as Star, xt as Film, y as Target, yt as Gamepad2, zt as CircleCheck } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Skeleton } from "./skeleton-D9W9wFsj.mjs";
import { n as supabase } from "./client-QOMq7HzS.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { H as formatReward, M as SectionHeading, Ot as Button, bn as completeTask, d as AppShell, nr as useServerFn, tr as useAuth } from "./router-sXMnYegW.mjs";
import { n as computeLockState, r as formatLockReason } from "./lock-state-BmOk6qOC.mjs";
import { n as ErrorState, t as EmptyState } from "./States-Cg9ELwgo.mjs";
import { n as SectionBanner } from "./SectionBanner-Cf6xDjCJ.mjs";
import { t as Progress } from "./progress-CLTZxRUB.mjs";
import { r as refreshMyTasks } from "./tasks.functions-Dooa45TF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/special-CjvUsyDB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var tasksQuery = () => ({
	queryKey: ["tasks"],
	queryFn: async () => {
		const { data, error } = await supabase.from("tasks").select("*").eq("is_active", true).order("sort_order");
		if (error) throw error;
		return data;
	}
});
var userTasksQuery = (userId) => ({
	queryKey: ["user-tasks", userId],
	enabled: Boolean(userId),
	queryFn: async () => {
		const { data, error } = await supabase.from("user_tasks").select("*");
		if (error) throw error;
		return data;
	}
});
/**
* Admin-configurable `tasks.icon` names mapped to lucide components. Curated
* rather than a namespace import so the icon set stays tree-shakeable.
*/
var TASK_ICONS = {
	target: Target,
	"list-checks": ListChecks,
	gift: Gift,
	users: Users,
	"user-plus": UserPlus,
	video: Video,
	play: Play,
	film: Film,
	clapperboard: Clapperboard,
	link: Link2,
	"link-2": Link2,
	lock: Lock,
	"lock-keyhole": LockKeyhole,
	star: Star,
	sparkles: Sparkles,
	trophy: Trophy,
	award: Award,
	coins: Coins,
	wallet: Wallet,
	banknote: Banknote,
	"shopping-cart": ShoppingCart,
	smartphone: Smartphone,
	"share-2": Share2,
	megaphone: Megaphone,
	"calendar-days": CalendarDays,
	"badge-check": BadgeCheck,
	"shield-check": ShieldCheck,
	"check-circle-2": CircleCheck,
	zap: Zap,
	flame: Flame,
	rocket: Rocket,
	layers: Layers,
	tag: Tag,
	"trending-up": TrendingUp,
	"gamepad-2": Gamepad2,
	bell: Bell
};
/** Resolves a stored icon name (any casing / spacing) to a lucide component. */
function taskIcon(name) {
	return TASK_ICONS[(name ?? "").trim().toLowerCase().replace(/[\s_]+/g, "-")] ?? Target;
}
function TaskPage() {
	const { session, profile } = useAuth();
	/**
	* Drives the 'first_withdrawal' lock. lifetime_withdrawn is incremented once per
	* approved withdrawal, so `> 0` means the user has withdrawn at least once.
	* Display only — the server re-checks before any progress or credit.
	*/
	const lifetimeWithdrawn = Number(profile?.lifetime_withdrawn ?? 0);
	const queryClient = useQueryClient();
	const tasks = useQuery(tasksQuery());
	const userTasks = useQuery(userTasksQuery(session?.user.id));
	const complete = useServerFn(completeTask);
	const refresh = useServerFn(refreshMyTasks);
	/** Task ids whose configured image failed to load — falls back to the icon. */
	const [brokenImages, setBrokenImages] = (0, import_react.useState)({});
	useQuery({
		queryKey: ["task-sync", session?.user.id],
		enabled: Boolean(session?.user.id),
		staleTime: 3e4,
		queryFn: async () => {
			const result = await refresh({});
			await queryClient.invalidateQueries({ queryKey: ["user-tasks"] });
			return result;
		}
	});
	const advance = useMutation({
		mutationFn: (taskId) => complete({ data: { taskId } }),
		onSuccess: (result) => {
			toast.success(result.completed ? "Task completed — reward added!" : "Progress saved.");
			queryClient.invalidateQueries({ queryKey: ["user-tasks"] });
			queryClient.invalidateQueries({ queryKey: ["profile"] });
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
		},
		onError: (error) => toast.error(error.message || "Couldn't update that task.")
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		subtitle: "Tasks",
		mainClass: "page-fade-in",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				size: "page",
				icon: ListChecks,
				iconSrc: "/icons/icon-your-task.webp",
				title: "Your milestones",
				subtitle: "Work through the list to unlock rewards.",
				className: "mb-4"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBanner, { section: "tasks" }),
			tasks.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-3",
				children: [
					0,
					1,
					2
				].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-24 w-full rounded-2xl" }, i))
			}) : tasks.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, { onRetry: () => void tasks.refetch() }) : !tasks.data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				icon: ListChecks,
				title: "No tasks available right now",
				description: "New tasks drop daily — check back soon."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "stagger-children space-y-3",
				children: tasks.data.map((task, index) => {
					const mine = userTasks.data?.find((t) => t.task_id === task.id);
					const progress = mine?.progress ?? 0;
					const done = mine?.status === "completed";
					const automated = task.task_type !== "manual";
					const target = automated ? task.target ?? 1 : task.steps_total;
					const gatedForNewUser = index > 0 && !done && (userTasks.data ?? []).length === 0 && index > 2;
					const raw = task;
					const lockState = computeLockState(raw.lock_type ?? "none", raw.unlock_at ?? null, null, 0, lifetimeWithdrawn);
					const configLocked = lockState.is_locked && !done;
					const lockLabel = configLocked ? formatLockReason(lockState.unlock_reason) : null;
					const locked = gatedForNewUser || configLocked;
					const imageUrl = task.image_url ?? null;
					const showImage = Boolean(imageUrl) && !brokenImages[task.id];
					const TaskIcon = taskIcon(task.icon);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "surface-card p-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-background-alt",
								children: showImage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: imageUrl,
									alt: "",
									"aria-hidden": true,
									loading: "lazy",
									decoding: "async",
									onError: () => setBrokenImages((b) => ({
										...b,
										[task.id]: true
									})),
									className: "size-full object-cover"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaskIcon, {
									className: "size-5 text-primary",
									strokeWidth: 2,
									"aria-hidden": true
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "truncate font-semibold",
											children: task.title
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-amount text-sm text-gold-dark",
											children: formatReward(task.reward)
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground",
										children: task.description
									}),
									(automated || task.steps_total > 1) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
											value: Math.min(100, progress / target * 100),
											className: "h-2"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-1 text-[11px] text-muted-foreground",
											children: [
												progress,
												" of ",
												target,
												" ",
												automated ? "completed" : "steps"
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-3",
										children: done ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center gap-1 text-xs font-semibold text-mint-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "success-pop size-4 text-accent" }), " Completed"]
										}) : locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center gap-1 text-xs text-muted-foreground",
											"data-testid": `task-locked-${task.id}`,
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockKeyhole, { className: "size-3.5" }),
												" ",
												lockLabel ?? "Locked"
											]
										}) : automated ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-xs text-muted-foreground",
											children: [
												"Tracks automatically — reward pays out at ",
												target,
												"."
											]
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "mint",
											disabled: advance.isPending,
											onClick: () => advance.mutate(task.id),
											children: task.steps_total > 1 ? "Log a step" : "Mark done"
										})
									})
								]
							})]
						})
					}, task.id);
				})
			})
		]
	});
}
//#endregion
export { TaskPage as component };
