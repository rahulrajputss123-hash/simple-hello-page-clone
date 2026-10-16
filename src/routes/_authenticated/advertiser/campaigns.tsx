import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChevronRight, Edit, Key, Loader2, Megaphone, Pause, Play, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BackLink, VerificationBadge } from "@/components/marketplace/Preview";
import { PostbackSecretModal } from "@/components/marketplace/PostbackSecretModal";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/coinquest";
import {
  addCampaignBudget,
  campaignAction,
  editCampaign,
  listMyCampaigns,
  rotateCampaignSecret,
} from "@/lib/marketplace.functions";
import type { CampaignView } from "@/lib/marketplace/advertiser.server";
import { useRole } from "@/lib/marketplace/role";

export const Route = createFileRoute("/_authenticated/advertiser/campaigns")({
  head: () => ({ meta: [{ title: "My Campaigns — CashGPT" }] }),
  component: MyCampaignsPage,
});

type Group = CampaignView["group"];

function relativeTime(value: string) {
  const seconds = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function maskedClickId(value: string | null) {
  return value ? `${value.slice(0, 8)}…` : "—";
}

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
  const { refreshOverview, overview } = useRole();
  const queryClient = useQueryClient();
  const list = useServerFn(listMyCampaigns);
  const act = useServerFn(campaignAction);
  const rotate = useServerFn(rotateCampaignSecret);
  const addBudget = useServerFn(addCampaignBudget);
  const [tab, setTab] = useState<Group>("active");
  const [showRotateModal, setShowRotateModal] = useState(false);
  const [rotatedInfo, setRotatedInfo] = useState<{ url: string; secret: string } | null>(null);
  const [showAddSlotsModal, setShowAddSlotsModal] = useState(false);
  const [addSlotsCampaign, setAddSlotsCampaign] = useState<CampaignView | null>(null);
  const [additionalSlots, setAdditionalSlots] = useState("");
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [pauseCampaign, setPauseCampaign] = useState<CampaignView | null>(null);

  const key = ["my-campaigns", session?.user.id];
  const campaigns = useQuery({
    queryKey: key,
    queryFn: () => list(),
    enabled: Boolean(session),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const mutation = useMutation({
    mutationFn: (input: {
      campaignId: string;
      action: "pause" | "resume" | "submit" | "complete" | "archive";
    }) => act({ data: input }),
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

  const rotateMutation = useMutation({
    mutationFn: (campaignId: string) => rotate({ data: { campaignId } }),
    onSuccess: (result) => {
      setRotatedInfo({ url: result.url, secret: result.secret });
      setShowRotateModal(true);
      toast.success("Secret rotated successfully");
    },
    onError: (err) =>
      toast.error("Couldn't rotate secret", {
        description: err instanceof Error ? err.message.replace(/^[A-Z_]+: /, "") : undefined,
      }),
  });

  const addBudgetMutation = useMutation({
    mutationFn: (input: { campaignId: string; additionalSlots: number }) =>
      addBudget({ data: input }),
    onSuccess: async () => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: key }), refreshOverview()]);
      setShowAddSlotsModal(false);
      setAddSlotsCampaign(null);
      setAdditionalSlots("10");
      toast.success("Budget added successfully");
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message.replace(/^[A-Z_]+: /, "") : "Failed to add budget";
      // Map common errors to friendly messages
      const friendlyMsg = msg.includes("INSUFFICIENT_FUNDS") || msg.includes("Not enough balance")
        ? "Not enough balance. Add funds first."
        : msg.includes("NOT_OWNER")
          ? "You don't own this campaign."
          : msg.includes("WRONG_STATUS")
            ? "Campaign must be active or paused to add budget."
            : msg;
      toast.error("Couldn't add budget", { description: friendlyMsg });
    },
  });

  const handleAddSlots = (campaign: CampaignView) => {
    setAddSlotsCampaign(campaign);
    setAdditionalSlots("10");
    setShowAddSlotsModal(true);
  };

  const handlePause = (campaign: CampaignView) => {
    setPauseCampaign(campaign);
    setShowPauseConfirm(true);
  };

  const confirmPause = () => {
    if (!pauseCampaign) return;
    mutation.mutate({ campaignId: pauseCampaign.id, action: "pause" });
    setShowPauseConfirm(false);
    setPauseCampaign(null);
  };

  const confirmAddSlots = () => {
    if (!addSlotsCampaign) return;
    const slots = Number(additionalSlots);
    if (!slots || slots < 1) {
      toast.error("Enter a valid number of slots (minimum 1)");
      return;
    }
    addBudgetMutation.mutate({ campaignId: addSlotsCampaign.id, additionalSlots: slots });
  };

  // Calculate cost for add slots
  const platformFeePercent = overview?.settings?.platformFeePercent ?? 5;
  const slotsNum = Number(additionalSlots) || 0;
  const costPerSlot = addSlotsCampaign
    ? addSlotsCampaign.costPerCompletion || addSlotsCampaign.reward * (1 + platformFeePercent / 100)
    : 0;
  const totalCost = slotsNum * costPerSlot;
  const spendable = overview?.account?.spendable ?? 0;

  const all = campaigns.data ?? [];
  const visible = all.filter((c) => c.group === tab);

  return (
    <AppShell subtitle="Advertiser" mainClass="page-fade-in">
      <BackLink to="/home" label="Back to dashboard" />
      <SectionHeading
        variant="ribbon"
        size="page"
        icon={Megaphone}
        iconSrc="/icons/icon-my-campaign-v2.webp"
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
        <p className="surface-card mt-3 p-4 text-sm text-destructive">
          Couldn't load your campaigns.
        </p>
      ) : visible.length === 0 ? (
        <div className="surface-card mt-3 p-5 text-center">
          <p className="text-sm font-semibold">Nothing here yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {all.length === 0
              ? "Create your first campaign to get started."
              : `No ${tab} campaigns.`}
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
                        {c.countries.length ? c.countries.slice(0, 3).join(", ") : "All countries"}{" "}
                        · {formatMoney(c.reward)} per completion
                        {c.costPerCompletion
                          ? ` (you pay ${formatMoney(c.costPerCompletion)})`
                          : ""}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[c.group]}`}
                    >
                      {STATUS_LABEL[c.status]}
                    </span>
                  </div>
                  {c.status === "rejected" && c.reviewNote && (
                    <p className="mt-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                      {c.reviewNote}
                    </p>
                  )}
                  {c.pausedBy === "admin" && (
                    <p className="mt-2 rounded-lg bg-gold/10 p-2 text-xs text-gold-dark">
                      Paused by CashGPT — contact support to resume.
                    </p>
                  )}
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-background-alt">
                    <div
                      className="h-full rounded-full bg-jade-gradient"
                      style={{ width: `${pct}%` }}
                    />
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
                {c.verification === "auto" && (
                  <div className="mt-3 rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs">
                    <p className="font-semibold text-foreground">Postback status</p>
                    <p className="mt-1 text-muted-foreground">
                      {c.postbackLogs?.[0]
                        ? `Last postback: ${relativeTime(c.postbackLogs[0].receivedAt)} - ${c.postbackLogs[0].result}`
                        : "No postback received yet"}
                    </p>
                    <div className="mt-2 space-y-1 text-muted-foreground">
                      <p>
                        ✓ Tracking URL contains{" "}
                        <code className="rounded bg-muted px-1">{"{click_id}"}</code>
                      </p>
                      <p>{c.postbackLogs?.length ? "✓" : "○"} Postback received at least once</p>
                    </div>
                    {c.postbackLogs?.length ? (
                      <div className="mt-2 space-y-1 border-t border-primary/10 pt-2">
                        {c.postbackLogs.slice(0, 20).map((log, index) => (
                          <div
                            key={`${log.receivedAt}-${index}`}
                            className="flex items-center gap-2 text-[11px]"
                          >
                            <span className="w-12 shrink-0 text-muted-foreground">
                              {relativeTime(log.receivedAt)}
                            </span>
                            <span className="rounded-full bg-background px-1.5 py-0.5 font-semibold">
                              {log.result}
                            </span>
                            <code>{maskedClickId(log.clickId)}</code>
                            <span className="truncate text-muted-foreground">
                              {log.txnId || "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async (e) => {
                          e.preventDefault();
                          const testUrl = `${c.postbackUrl || "/api/public/marketplace-postback"}?test=1&campaign_id=${encodeURIComponent(c.id)}&token=SECRET`;
                          await navigator.clipboard.writeText(testUrl);
                          toast.success("Test URL copied");
                        }}
                      >
                        Copy test URL
                      </Button>
                      <span className="self-center text-[11px] text-muted-foreground">
                        Use your secret; it was shown only at creation.
                      </span>
                    </div>
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  {(c.status === "active" || c.status === "budget_exhausted") && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled={pending}
                        data-testid={`pause-${c.id}`}
                        onClick={() => handlePause(c)}
                      >
                        {pending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Pause className="size-4" />
                        )}{" "}
                        Pause
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => handleAddSlots(c)}
                        title="Add more slots"
                      >
                        <Plus className="size-4" /> Slots
                      </Button>
                    </>
                  )}
                  {c.status === "paused" && c.pausedBy !== "admin" && (
                    <>
                      <Button
                        size="sm"
                        variant="mint"
                        className="flex-1"
                        disabled={pending}
                        onClick={() => mutation.mutate({ campaignId: c.id, action: "resume" })}
                      >
                        {pending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Play className="size-4" />
                        )}{" "}
                        Resume
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => handleAddSlots(c)}
                        title="Add more slots"
                      >
                        <Plus className="size-4" /> Slots
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/advertiser/edit/$id" params={{ id: c.id }}>
                          <Edit className="size-4" /> Edit
                        </Link>
                      </Button>
                    </>
                  )}
                  {(c.status === "draft" || c.status === "rejected") && (
                    <>
                      <Button
                        size="sm"
                        variant="jade"
                        className="flex-1"
                        disabled={pending}
                        onClick={() => mutation.mutate({ campaignId: c.id, action: "submit" })}
                      >
                        {pending ? <Loader2 className="size-4 animate-spin" /> : null} Submit for
                        approval
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/advertiser/edit/$id" params={{ id: c.id }}>
                          <Edit className="size-4" /> Edit
                        </Link>
                      </Button>
                    </>
                  )}
                  {c.verification === "auto" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={rotateMutation.isPending && rotateMutation.variables === c.id}
                      onClick={(e) => {
                        e.preventDefault();
                        rotateMutation.mutate(c.id);
                      }}
                      title="Rotate postback secret"
                    >
                      {rotateMutation.isPending && rotateMutation.variables === c.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Key className="size-4" />
                      )}
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

      <PostbackSecretModal
        open={showRotateModal && rotatedInfo !== null}
        onClose={() => {
          setShowRotateModal(false);
          setRotatedInfo(null);
        }}
        postbackUrl={rotatedInfo?.url || ""}
        postbackSecret={rotatedInfo?.secret || ""}
        isRotation={true}
      />

      <Dialog open={showAddSlotsModal} onOpenChange={setShowAddSlotsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Slots</DialogTitle>
            <DialogDescription>
              Add more slots to {addSlotsCampaign?.title || "this campaign"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {addSlotsCampaign && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current slots:</span>
                  <span className="font-medium">
                    {addSlotsCampaign.maxCompletions} ({addSlotsCampaign.completions} completed,{" "}
                    {addSlotsCampaign.maxCompletions - addSlotsCampaign.completions} open)
                  </span>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="additional-slots">Extra slots to add</Label>
              <Input
                id="additional-slots"
                type="number"
                min="1"
                max="10000"
                value={additionalSlots}
                onChange={(e) => setAdditionalSlots(e.target.value)}
                placeholder="e.g. 10"
              />
              <p className="text-xs text-muted-foreground">
                Each slot allows one more person to complete this campaign.
              </p>
            </div>

            {slotsNum > 0 && addSlotsCampaign && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New total:</span>
                  <span className="font-medium">
                    {addSlotsCampaign.maxCompletions} + {slotsNum} = {addSlotsCampaign.maxCompletions + slotsNum}
                  </span>
                </div>
                
                {addSlotsCampaign.status === "active" ? (
                  <>
                    <div className="mt-2 flex justify-between border-t border-border pt-2">
                      <span className="font-semibold">Cost now:</span>
                      <span className="font-semibold text-primary">
                        {slotsNum} × {formatMoney(costPerSlot)} = {formatMoney(totalCost)}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Your balance: {formatMoney(spendable)}
                      {totalCost > spendable && (
                        <span className="ml-1 text-destructive">(insufficient)</span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="mt-2 space-y-2 border-t border-border pt-2">
                    <p className="text-xs font-semibold text-gold-dark">
                      ⚠️ This campaign is paused
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Pausing returned the unspent budget to your balance, and resuming will reserve
                      budget for ALL open slots (current open slots + the new ones).
                    </p>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Resume will reserve:</span>
                      <span className="font-medium">
                        {addSlotsCampaign.maxCompletions - addSlotsCampaign.completions + slotsNum} ×{" "}
                        {formatMoney(costPerSlot)} = {formatMoney((addSlotsCampaign.maxCompletions - addSlotsCampaign.completions + slotsNum) * costPerSlot)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Your balance: {formatMoney(spendable)}
                      {(addSlotsCampaign.maxCompletions - addSlotsCampaign.completions + slotsNum) * costPerSlot > spendable && (
                        <span className="ml-1 text-destructive">(insufficient for resume)</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddSlotsModal(false)}
              disabled={addBudgetMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="jade"
              onClick={confirmAddSlots}
              disabled={
                addBudgetMutation.isPending ||
                slotsNum < 1 ||
                (addSlotsCampaign?.status === "active" && totalCost > spendable)
              }
            >
              {addBudgetMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Add {slotsNum} Slot{slotsNum !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPauseConfirm} onOpenChange={setShowPauseConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pause Campaign?</DialogTitle>
            <DialogDescription>
              Pausing {pauseCampaign?.title || "this campaign"} will stop accepting new completions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {pauseCampaign && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <p className="text-muted-foreground">
                  Unspent budget ({formatMoney(pauseCampaign.remaining || 0)}) will be returned to
                  your Campaign Balance; resuming reserves it again.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPauseConfirm(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmPause} disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Pause Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
