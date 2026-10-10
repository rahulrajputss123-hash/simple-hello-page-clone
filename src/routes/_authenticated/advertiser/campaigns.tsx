import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChevronRight, Loader2, Megaphone, Pause, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BackLink, VerificationBadge } from "@/components/marketplace/Preview";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/coinquest";
import { campaignAction, listMyCampaigns } from "@/lib/marketplace.functions";
import type { CampaignView } from "@/lib/marketplace/advertiser.server";
import { useRole } from "@/lib/marketplace/role";

export const Route = createFileRoute("/_authenticated/advertiser/campaigns")({
  head: () => ({ meta: [{ title: "My Campaigns — CashGPT" }] }),
  component: MyCampaignsPage,
});

type Group = CampaignView["group"];

const TABS: [Group, string][] = [
  ["active", "Active"],
  ["paused", "Paused"],
  ["draft", "Draft"],
  ["completed", "Completed"],
];

const STATUS_LABEL: Record<CampaignView["status"], string> = {
  draft: "Draft",
  pending_review: "In review",
  active: "Active",
  paused: "Paused",
  budget_exhausted: "Budget used",
  completed: "Completed",
  rejected: "Rejected",
  archived: "Archived",
};

const STATUS_STYLE: Record<Group, string> = {
  active: "bg-mint/20 text-primary",
  paused: "bg-gold/15 text-gold-dark",
  draft: "bg-background-alt text-muted-foreground",
  completed: "bg-primary/10 text-primary",
};

function MyCampaignsPage() {
  const { session } = useAuth();
  const { refreshOverview } = useRole();
  const queryClient = useQueryClient();
  const list = useServerFn(listMyCampaigns);
  const act = useServerFn(campaignAction);
  const [tab, setTab] = useState<Group>("active");

  const key = ["my-campaigns", session?.user.id];
  const campaigns = useQuery({
    queryKey: key,
    queryFn: () => list(),
    enabled: Boolean(session),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const mutation = useMutation({
    mutationFn: (input: { campaignId: string; action: "pause" | "resume" | "submit" | "complete" | "archive" }) =>
      act({ data: input }),
    onSuccess: async (res, input) => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: key }), refreshOverview()]);
      const msg =
        input.action === "submit"
          ? "Submitted for review"
          : input.action === "pause"
            ? "Campaign paused — unspent budget returned to your balance"
            : input.action === "resume"
              ? res.status === "pending_review"
                ? "Resumed — it was edited while paused, so it goes through review again"
                : "Campaign is live again"
              : "Done";
      toast.success(msg);
    },
    onError: (err) =>
      toast.error("Couldn't update the campaign", {
        description: err instanceof Error ? err.message.replace(/^[A-Z_]+: /, "") : undefined,
      }),
  });

  const all = campaigns.data ?? [];
  const visible = all.filter((c) => c.group === tab);

  return (
    <AppShell subtitle="Advertiser" mainClass="page-fade-in">
      <BackLink to="/home" label="Back to dashboard" />
      <SectionHeading
        variant="ribbon"
        size="page"
        icon={Megaphone}
        iconSrc="/icons/icon-my-campaign.png"
        title="My Campaigns"
        subtitle="Tap a campaign to see its results."
        className="mb-2"
        action={
          <Link
            to="/advertiser/create"
            className="rounded-full bg-jade-gradient px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft"
          >
            + New
          </Link>
        }
      />

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist">
        {TABS.map(([k, label]) => {
          const count = all.filter((c) => c.group === k).length;
          return (
            <Button
              key={k}
              size="sm"
              role="tab"
              aria-selected={tab === k}
              variant={tab === k ? "jade" : "outline"}
              onClick={() => setTab(k)}
              data-testid={`campaign-tab-${k}`}
            >
              {label} ({count})
            </Button>
          );
        })}
      </div>

      {campaigns.isPending ? (
        <div className="mt-3 space-y-3">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      ) : campaigns.isError ? (
        <p className="surface-card mt-3 p-4 text-sm text-destructive">Couldn't load your campaigns.</p>
      ) : visible.length === 0 ? (
        <div className="surface-card mt-3 p-5 text-center">
          <p className="text-sm font-semibold">Nothing here yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {all.length === 0 ? "Create your first campaign to get started." : `No ${tab} campaigns.`}
          </p>
          {all.length === 0 && (
            <Link
              to="/advertiser/create"
              className="mt-3 inline-flex rounded-full bg-jade-gradient px-4 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              Create campaign
            </Link>
          )}
        </div>
      ) : (
        <ul className="stagger-children mt-3 space-y-3">
          {visible.map((c) => {
            const pct = c.budget ? Math.min(100, Math.round((c.spent / c.budget) * 100)) : 0;
            const pending = mutation.isPending && mutation.variables?.campaignId === c.id;
            return (
              <li key={c.id} className="surface-card p-4" data-testid={`my-campaign-${c.id}`}>
                <Link to="/advertiser/results/$id" params={{ id: c.id }} className="block">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <VerificationBadge verification={c.verification} />
                      <p className="mt-1.5 truncate font-semibold">{c.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.countries.length ? c.countries.slice(0, 3).join(", ") : "All countries"} ·{" "}
                        {formatMoney(c.reward)} per completion
                        {c.costPerCompletion ? ` (you pay ${formatMoney(c.costPerCompletion)})` : ""}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[c.group]}`}>
                      {STATUS_LABEL[c.status]}
                    </span>
                  </div>
                  {c.status === "rejected" && c.reviewNote && (
                    <p className="mt-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">{c.reviewNote}</p>
                  )}
                  {c.pausedBy === "admin" && (
                    <p className="mt-2 rounded-lg bg-gold/10 p-2 text-xs text-gold-dark">
                      Paused by CashGPT — contact support to resume.
                    </p>
                  )}
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-background-alt">
                    <div className="h-full rounded-full bg-jade-gradient" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      {c.completions} / {c.maxCompletions} completed
                      {c.pendingReviews ? ` · ${c.pendingReviews} to review` : ""}
                    </span>
                    <span>
                      {formatMoney(c.spent)} / {formatMoney(c.budget)}
                    </span>
                  </div>
                </Link>
                <div className="mt-3 flex gap-2">
                  {(c.status === "active" || c.status === "budget_exhausted") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      disabled={pending}
                      data-testid={`pause-${c.id}`}
                      onClick={() => mutation.mutate({ campaignId: c.id, action: "pause" })}
                    >
                      {pending ? <Loader2 className="size-4 animate-spin" /> : <Pause className="size-4" />} Pause
                    </Button>
                  )}
                  {c.status === "paused" && c.pausedBy !== "admin" && (
                    <Button
                      size="sm"
                      variant="mint"
                      className="flex-1"
                      disabled={pending}
                      onClick={() => mutation.mutate({ campaignId: c.id, action: "resume" })}
                    >
                      {pending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />} Resume
                    </Button>
                  )}
                  {(c.status === "draft" || c.status === "rejected") && (
                    <Button
                      size="sm"
                      variant="jade"
                      className="flex-1"
                      disabled={pending}
                      onClick={() => mutation.mutate({ campaignId: c.id, action: "submit" })}
                    >
                      {pending ? <Loader2 className="size-4 animate-spin" /> : null} Submit for approval
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" asChild>
                    <Link to="/advertiser/results/$id" params={{ id: c.id }}>
                      Results <ChevronRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
