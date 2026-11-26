import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Award,
  BadgeCheck,
  Banknote,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clapperboard,
  Coins,
  Film,
  Flame,
  Gamepad2,
  Gift,
  Layers,
  Link2,
  ListChecks,
  Lock,
  LockKeyhole,
  Megaphone,
  Play,
  Rocket,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Star,
  Tag,
  Target,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
  Video,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { EmptyState, ErrorState } from "@/components/States";
import { SectionHeading } from "@/components/SectionHeading";
import { SectionBanner } from "@/components/SectionBanner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { computeLockState, formatLockReason } from "@/lib/lock-state";
import { formatReward } from "@/lib/format-reward";
import { completeTask } from "@/lib/coinquest.functions";
import { tasksQuery, userTasksQuery } from "@/lib/queries";
import { refreshMyTasks } from "@/lib/tasks.functions";

/**
 * Format USD amount for earning task display.
 * Uses 2 decimals for amounts >= $0.01, otherwise up to 4 decimals.
 */
export function formatEarningAmount(amount: number): string {
  if (amount >= 0.01) {
    return `$${amount.toFixed(2)}`;
  }
  // For sub-cent amounts, remove trailing zeros
  return `$${amount.toFixed(4).replace(/\.?0+$/, "")}`;
}

/**
 * Compute progress percentage for display.
 */
export function computeTaskProgress(
  progress: number,
  target: number,
  taskType?: string,
  earningTarget?: number | null,
): { progress: number; target: number; percentage: number } {
  // For offerwall_earning tasks, use earning_target if available
  if (taskType === "offerwall_earning" && earningTarget != null) {
    const actualTarget = Number(earningTarget);
    const actualProgress = Number(progress);
    return {
      progress: actualProgress,
      target: actualTarget,
      percentage: Math.min(100, (actualProgress / actualTarget) * 100),
    };
  }
  // For all other tasks, use the provided target
  return {
    progress: Number(progress),
    target: Number(target),
    percentage: Math.min(100, (Number(progress) / Number(target)) * 100),
  };
}

/**
 * Admin-configurable `tasks.icon` names mapped to lucide components. Curated
 * rather than a namespace import so the icon set stays tree-shakeable.
 */
const TASK_ICONS: Record<string, LucideIcon> = {
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
  "check-circle-2": CheckCircle2,
  zap: Zap,
  flame: Flame,
  rocket: Rocket,
  layers: Layers,
  tag: Tag,
  "trending-up": TrendingUp,
  "gamepad-2": Gamepad2,
  bell: Bell,
};

/** Resolves a stored icon name (any casing / spacing) to a lucide component. */
function taskIcon(name: string | null | undefined): LucideIcon {
  const key = (name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
  return TASK_ICONS[key] ?? Target;
}

export const Route = createFileRoute("/_authenticated/special")({
  head: () => ({
    meta: [
      { title: "Special — CashGPT" },
      { name: "description", content: "Step-by-step tasks that pay into your CashGPT wallet." },
      { property: "og:title", content: "Special — CashGPT" },
      {
        property: "og:description",
        content: "Step-by-step tasks that pay into your CashGPT wallet.",
      },
    ],
  }),
  component: TaskPage,
});

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
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  useQuery({
    queryKey: ["task-sync", session?.user.id],
    enabled: Boolean(session?.user.id),
    staleTime: 60_000, // Run at most once per minute
    refetchOnMount: true,
    refetchOnWindowFocus: false, // Don't refetch on every focus
    queryFn: async () => {
      const result = await refresh({});
      await queryClient.invalidateQueries({ queryKey: ["user-tasks"] });
      return result;
    },
  });

  const advance = useMutation({
    mutationFn: (taskId: string) => complete({ data: { taskId } }),
    onSuccess: (result) => {
      toast.success(result.completed ? "Task completed — reward added!" : "Progress saved.");
      void queryClient.invalidateQueries({ queryKey: ["user-tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (error: Error) => toast.error(error.message || "Couldn't update that task."),
  });

  return (
    <AppShell subtitle="Tasks" mainClass="page-fade-in">
      <SectionHeading
        variant="ribbon"
        size="page"
        icon={ListChecks}
        iconSrc="/icons/icon-your-task.webp"
        title="Your milestones"
        subtitle="Work through the list to unlock rewards."
        className="mb-4"
      />

      <SectionBanner section="tasks" />

      {tasks.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : tasks.isError ? (
        <ErrorState onRetry={() => void tasks.refetch()} />
      ) : !tasks.data?.length ? (
        <EmptyState
          icon={ListChecks}
          title="No tasks available right now"
          description="New tasks drop daily — check back soon."
        />
      ) : (
        <ol className="stagger-children space-y-3">
          {tasks.data.map((task, index) => {
            const mine = userTasks.data?.find((t) => t.task_id === task.id);
            const rawProgress = mine?.progress ?? 0;
            const done = mine?.status === "completed";
            const automated = (task as { task_type?: string }).task_type !== "manual";
            const rawTarget = automated
              ? ((task as { target?: number }).target ?? 1)
              : task.steps_total;
            
            // Compute actual progress and target for display
            const taskType = (task as { task_type?: string }).task_type;
            const earningTarget = (task as { earning_target?: number | null }).earning_target;
            const { progress, target, percentage } = computeTaskProgress(
              rawProgress,
              rawTarget,
              taskType,
              earningTarget,
            );
            
            // Check if this is an earning task for special formatting
            const isEarningTask = taskType === "offerwall_earning" && earningTarget != null;
            
            // Progress bar: min 2% width for non-zero progress so it's visibly non-empty
            const displayPercentage = rawProgress > 0 && percentage < 2 ? 2 : percentage;
            
            // Pre-existing "ease new users in" heuristic — unrelated to the
            // admin-configured lock below, kept as-is.
            const gatedForNewUser =
              index > 0 && !done && (userTasks.data ?? []).length === 0 && index > 2;
            // Admin-configured lock. Server-enforced in tasks/engine.server.ts and
            // completeTaskImpl; this is the matching visual state.
            const raw = task as { lock_type?: string | null; unlock_at?: string | null };
            const lockState = computeLockState(
              raw.lock_type ?? "none",
              raw.unlock_at ?? null,
              null,
              0,
              lifetimeWithdrawn,
            );
            const configLocked = lockState.is_locked && !done;
            const lockLabel = configLocked ? formatLockReason(lockState.unlock_reason) : null;
            const locked = gatedForNewUser || configLocked;
            const imageUrl = (task as { image_url?: string | null }).image_url ?? null;
            const showImage = Boolean(imageUrl) && !brokenImages[task.id];
            const TaskIcon = taskIcon((task as { icon?: string | null }).icon);
            return (
              <li key={task.id} className="surface-card p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-background-alt">
                    {showImage ? (
                      <img
                        src={imageUrl!}
                        alt=""
                        aria-hidden
                        loading="lazy"
                        decoding="async"
                        onError={() => setBrokenImages((b) => ({ ...b, [task.id]: true }))}
                        className="size-full object-cover"
                      />
                    ) : (
                      <TaskIcon className="size-5 text-primary" strokeWidth={2} aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold">{task.title}</p>
                      <span className="text-amount text-sm text-gold-dark">
                        {formatReward(task.reward)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{task.description}</p>
                    {(automated || task.steps_total > 1) && (
                      <div className="mt-2">
                        <Progress value={displayPercentage} className="h-2" />
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {isEarningTask
                            ? `${formatEarningAmount(progress)} of ${formatEarningAmount(target)} earned`
                            : `${progress} of ${target} ${automated ? "completed" : "steps"}`}
                        </p>
                      </div>
                    )}
                    <div className="mt-3">
                      {done ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-mint-foreground">
                          <CheckCircle2 className="success-pop size-4 text-accent" /> Completed
                        </span>
                      ) : /* A locked task must not claim it "tracks automatically" —
                            the lock is checked before the automated branch. */
                      locked ? (
                        <span
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                          data-testid={`task-locked-${task.id}`}
                        >
                          <LockKeyhole className="size-3.5" /> {lockLabel ?? "Locked"}
                        </span>
                      ) : automated ? (
                        <span className="text-xs text-muted-foreground">
                          {isEarningTask
                            ? `Tracks automatically — reward pays out at ${formatEarningAmount(target)}.`
                            : `Tracks automatically — reward pays out at ${target}.`}
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="mint"
                          disabled={advance.isPending}
                          onClick={() => advance.mutate(task.id)}
                        >
                          {task.steps_total > 1 ? "Log a step" : "Mark done"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </AppShell>
  );
}
