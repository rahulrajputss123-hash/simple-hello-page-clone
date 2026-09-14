import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { QuestCard, type QuestCardQuest, type QuestSessionView } from "@/components/QuestCard";
import { ErrorState } from "@/components/States";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { playRewardedAd } from "@/lib/ads";
import { reportAdWatched, startQuest } from "@/lib/coinquest.functions";
import { listActiveQuests, startLockerQuest, startShortlinkStep } from "@/lib/quests.functions";
import { formatTimeLockReason, formatEarningLockReason } from "@/lib/lock-state";

export function StarterQuests() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const start = useServerFn(startQuest);
  const report = useServerFn(reportAdWatched);
  const fetchQuests = useServerFn(listActiveQuests);
  const openStep = useServerFn(startShortlinkStep);
  const openLocker = useServerFn(startLockerQuest);

  const quests = useQuery({
    queryKey: ["quests-active"],
    enabled: Boolean(session),
    queryFn: () => fetchQuests({}),
  });

  const sessions = useQuery({
    queryKey: ["quest-sessions", session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      const { data } = await supabase
        .from("quest_sessions")
        .select("*")
        .order("started_at", { ascending: false });
      return (data ?? []) as unknown as QuestSessionView[];
    },
  });

  const runAd = useMutation({
    mutationFn: async (questKey: string) => {
      const questSession = await start({ data: { questKey } });
      const result = await playRewardedAd();
      if (!result.completed) throw new Error("Ad was closed early.");
      return report({ data: { sessionId: (questSession as { id: string }).id } });
    },
    onSuccess: (result: unknown) => {
      const r = result as { credited?: boolean };
      if (r.credited) toast.success("Quest complete — wallet credited!");
      else toast.success("Ad verified. Keep going!");
      void queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message || "That ad couldn't be verified."),
    onSettled: () => setBusy(null),
  });

  const runShortlink = useMutation({
    mutationFn: async ({ questKey, step }: { questKey: string; step: number }) => {
      await start({ data: { questKey } });
      return openStep({ data: { questKey, step } });
    },
    onSuccess: (result) => {
      if (result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
        toast.info(`Complete the step — you'll be sent back automatically.`);
      } else {
        toast.error("This step has no URL configured.");
      }
      void queryClient.invalidateQueries({ queryKey: ["quest-sessions"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not start this step."),
    onSettled: () => setBusy(null),
  });

  const runLocker = useMutation({
    mutationFn: async (questKey: string) => openLocker({ data: { questKey } }),
    onSuccess: (result) => {
      if (result.lockerUrl) {
        window.open(result.lockerUrl, "_blank", "noopener,noreferrer");
        toast.info("Complete the partner challenge, then return to CashGPT.");
      } else {
        toast.error("This locker has no URL configured.");
      }
      void queryClient.invalidateQueries({ queryKey: ["quest-sessions"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not open this locker."),
    onSettled: () => setBusy(null),
  });

  if (quests.isLoading || sessions.isLoading) {
    return (
      <div className="flex gap-4 overflow-hidden pb-2" data-testid="quests-loading">
        {[0, 1].map((item) => (
          <Skeleton key={item} className="h-[390px] w-[248px] min-w-[248px] rounded-[20px]" />
        ))}
      </div>
    );
  }
  if (quests.isError || sessions.isError) {
    return (
      <ErrorState
        onRetry={() => {
          void quests.refetch();
          void sessions.refetch();
        }}
      />
    );
  }
  if (!quests.data?.length) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="quests-empty">
        No quests configured yet.
      </p>
    );
  }

  return (
    <div
      className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 pr-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      data-testid="starter-quests-scroll"
    >
      {quests.data.map((quest) => {
        const q = quest as QuestCardQuest;
        const isLocked: boolean = Boolean(q.is_locked);
        const unlockReason = q.unlock_reason ?? null;

        const lockLabel = isLocked
          ? unlockReason?.type === "time"
            ? formatTimeLockReason(unlockReason.unlocksAt)
            : unlockReason?.type === "earning"
              ? formatEarningLockReason(unlockReason.required, unlockReason.current)
              : "Locked"
          : null;

        const active = sessions.data?.find(
          (s) => s.quest_key === quest.key && s.status === "started",
        );
        const credited = sessions.data?.some(
          (s) => s.quest_key === quest.key && s.status === "credited",
        );
        const isBusy = busy === quest.key;
        const total =
          quest.quest_type === "shortlink" ? Math.max(1, quest.shortlink_steps.length) : 1;
        const currentStep = Number(active?.current_step ?? 0);
        const nextStep = credited ? total : Math.min(currentStep + 1, total);

        return (
          <QuestCard
            key={quest.key}
            quest={q}
            active={active}
            credited={Boolean(credited)}
            busy={isBusy}
            lockLabel={lockLabel}
            onLocked={() => {
              toast.info(
                lockLabel
                  ? `This quest is locked. ${lockLabel}.`
                  : "This quest is currently locked.",
              );
            }}
            onAction={() => {
              if (isLocked || credited) return;
              setBusy(quest.key);
              if (quest.quest_type === "shortlink") {
                runShortlink.mutate({ questKey: quest.key, step: nextStep });
              } else if (quest.quest_type === "locker") {
                runLocker.mutate(quest.key);
              } else {
                setBusy(quest.key);
                runAd.mutate(quest.key);
              }
            }}
          />
        );
      })}
    </div>
  );
}
