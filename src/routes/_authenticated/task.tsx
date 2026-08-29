import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, ListChecks, Lock } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { EmptyState, ErrorState } from "@/components/States";
import { SectionBanner } from "@/components/SectionBanner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/coinquest";
import { completeTask } from "@/lib/coinquest.functions";
import { tasksQuery, userTasksQuery } from "@/lib/queries";
import { refreshMyTasks } from "@/lib/tasks.functions";

export const Route = createFileRoute("/_authenticated/task")({
  head: () => ({
    meta: [
      { title: "Tasks — CashGPT" },
      { name: "description", content: "Step-by-step tasks that pay into your CashGPT wallet." },
      { property: "og:title", content: "Tasks — CashGPT" },
      { property: "og:description", content: "Step-by-step tasks that pay into your CashGPT wallet." },
    ],
  }),
  component: TaskPage,
});

function TaskPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const tasks = useQuery(tasksQuery());
  const userTasks = useQuery(userTasksQuery(session?.user.id));
  const complete = useServerFn(completeTask);
  const refresh = useServerFn(refreshMyTasks);

  useQuery({
    queryKey: ["task-sync", session?.user.id],
    enabled: Boolean(session?.user.id),
    staleTime: 30_000,
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
      void queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message || "Couldn't update that task."),
  });

  return (
    <AppShell subtitle="Tasks">
      <h1 className="mt-2 text-2xl">Your tasks</h1>
      <p className="mb-4 text-sm text-muted-foreground">Work through the list to unlock rewards.</p>

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
        <ol className="space-y-3">
          {tasks.data.map((task, index) => {
            const mine = userTasks.data?.find((t) => t.task_id === task.id);
            const progress = mine?.progress ?? 0;
            const done = mine?.status === "completed";
            const automated = (task as { task_type?: string }).task_type !== "manual";
            const target = automated
              ? ((task as { target?: number }).target ?? 1)
              : task.steps_total;
            const locked = index > 0 && !done && (userTasks.data ?? []).length === 0 && index > 2;
            return (
              <li key={task.id} className="surface-card p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-background-alt text-amount text-sm">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold">{task.title}</p>
                      <span className="text-amount text-sm text-gold-dark">
                        {formatMoney(task.reward)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{task.description}</p>
                    {(automated || task.steps_total > 1) && (
                      <div className="mt-2">
                        <Progress value={Math.min(100, (progress / target) * 100)} className="h-2" />
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {progress} of {target} {automated ? "completed" : "steps"}
                        </p>
                      </div>
                    )}
                    <div className="mt-3">
                      {done ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-mint-foreground">
                          <CheckCircle2 className="size-4 text-accent" /> Completed
                        </span>
                      ) : automated ? (
                        <span className="text-xs text-muted-foreground">
                          Tracks automatically — reward pays out at {target}.
                        </span>
                      ) : locked ? (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Lock className="size-3.5" /> Locked
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
