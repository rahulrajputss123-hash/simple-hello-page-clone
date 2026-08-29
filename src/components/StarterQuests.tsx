import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Play, Loader2, Check, Link as LinkIcon, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/coinquest";
import { playRewardedAd } from "@/lib/ads";
import { reportAdWatched, startQuest } from "@/lib/coinquest.functions";
import { listActiveQuests, startShortlinkStep } from "@/lib/quests.functions";

type QuestSession = {
  id: string;
  quest_key: string;
  status: string;
  ads_watched: number;
  current_step?: number;
};

function Dial({ value, total }: { value: number; total: number }) {
  const pct = total ? Math.min(100, (value / total) * 100) : 0;
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg viewBox="0 0 64 64" className="size-16">
      <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--muted)" strokeWidth="7" />
      <circle
        cx="32"
        cy="32"
        r={radius}
        fill="none"
        stroke="var(--mint)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - (circumference * pct) / 100}
        transform="rotate(-90 32 32)"
        style={{ transition: "stroke-dashoffset 400ms ease" }}
      />
      <text
        x="32"
        y="36"
        textAnchor="middle"
        className="text-amount"
        fontSize="15"
        fill="var(--foreground)"
      >
        {value}/{total}
      </text>
    </svg>
  );
}

export function StarterQuests() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const start = useServerFn(startQuest);
  const report = useServerFn(reportAdWatched);
  const fetchQuests = useServerFn(listActiveQuests);
  const openStep = useServerFn(startShortlinkStep);

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
      return (data ?? []) as unknown as QuestSession[];
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

  if (quests.isLoading) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="quests-loading">
        Loading quests…
      </p>
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
      className="flex gap-3 overflow-x-auto pb-2"
      data-testid="starter-quests-scroll"
    >
      {quests.data.map((quest) => {
        const active = sessions.data?.find(
          (s) => s.quest_key === quest.key && s.status === "started",
        );
        const credited = sessions.data?.some(
          (s) => s.quest_key === quest.key && s.status === "credited",
        );
        const isBusy = busy === quest.key;

        if (quest.quest_type === "shortlink") {
          const total = quest.shortlink_steps.length || 3;
          const currentStep = Number(active?.current_step ?? 0);
          const nextStep = credited ? total : Math.min(currentStep + 1, total);
          return (
            <article
              key={quest.key}
              className="surface-card flex min-w-[160px] max-w-[160px] shrink-0 flex-col items-center gap-2 p-3 text-center"
              data-testid={`quest-card-${quest.key}`}
            >
              <span className="grid size-10 place-items-center rounded-full bg-background-alt">
                <LinkIcon className="size-5 text-primary" />
              </span>
              <p className="text-xs font-semibold">{quest.label}</p>
              <p className="text-amount text-sm text-gold-dark">
                {formatMoney(quest.reward_amount)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {credited ? `Done ${total}/${total}` : `Step ${nextStep} of ${total}`}
              </p>
              <Button
                size="sm"
                variant={credited ? "outline" : "jade"}
                className="w-full gap-1"
                disabled={isBusy || Boolean(credited)}
                data-testid={`quest-open-${quest.key}`}
                onClick={() => {
                  if (credited) return;
                  setBusy(quest.key);
                  runShortlink.mutate({ questKey: quest.key, step: nextStep });
                }}
              >
                {credited ? (
                  <>
                    <Check className="size-3.5" /> Done
                  </>
                ) : isBusy ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Opening
                  </>
                ) : currentStep > 0 ? (
                  <>
                    <ExternalLink className="size-3.5" /> Continue
                  </>
                ) : (
                  <>
                    <ExternalLink className="size-3.5" /> Start
                  </>
                )}
              </Button>
            </article>
          );
        }

        const watched = active?.ads_watched ?? (credited ? quest.ads_required : 0);
        return (
          <article
            key={quest.key}
            className="surface-card flex min-w-[160px] max-w-[160px] shrink-0 flex-col items-center gap-2 p-3 text-center"
            data-testid={`quest-card-${quest.key}`}
          >
            <Dial value={watched} total={quest.ads_required} />
            <p className="text-xs font-semibold">{quest.label}</p>
            <p className="text-amount text-sm text-gold-dark">
              {formatMoney(quest.reward_amount)}
            </p>
            <Button
              size="sm"
              variant={credited ? "outline" : "gold"}
              className="w-full gap-1"
              disabled={isBusy || Boolean(credited)}
              data-testid={`quest-watch-${quest.key}`}
              onClick={() => {
                setBusy(quest.key);
                runAd.mutate(quest.key);
              }}
            >
              {credited ? (
                <>
                  <Check className="size-3.5" /> Done
                </>
              ) : isBusy ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Ad
                </>
              ) : (
                <>
                  <Play className="size-3.5" /> Watch
                </>
              )}
            </Button>
          </article>
        );
      })}
    </div>
  );
}
