import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Check, ImageIcon, TrendingUp, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SectionTitle } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { VerificationBadge, formatShortDate } from "@/components/marketplace/Preview";
import { formatMoney } from "@/lib/coinquest";
import {
  listPendingCampaigns,
  listPendingProofs,
  reviewCampaign,
  reviewProof,
} from "@/lib/marketplace.functions";
import { getFinancialOverview } from "@/lib/marketplace/admin-financial.server";
import { listAdvertisers, setAdvertiserStatus } from "@/lib/marketplace/admin-advertisers.server";
import { useAuth } from "@/lib/auth";

/**
 * Admin screens for the marketplace (real data from Phase 1 schema). Campaign
 * approvals, proof reviews with atomicbudget checks enforced server-side.
 */

function RejectBox({
  id,
  onCancel,
  onConfirm,
  isPending,
}: {
  id: string;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState("");
  const valid = reason.trim().length >= 8;
  return (
    <div className="mt-3 space-y-2 rounded-2xl bg-destructive/5 p-3">
      <label htmlFor={`reject-${id}`} className="text-xs font-semibold text-destructive">
        Rejection reason (required)
      </label>
      <Textarea
        id={`reject-${id}`}
        rows={2}
        maxLength={500}
        placeholder="Explain clearly — this is shown to the other party."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        disabled={isPending}
      />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="flex-1"
          disabled={!valid || isPending}
          data-testid={`confirm-reject-${id}`}
          onClick={() => onConfirm(reason.trim())}
        >
          {isPending ? "Rejecting..." : "Confirm rejection"}
        </Button>
      </div>
    </div>
  );
}

function ApproveReject({
  id,
  onApprove,
  onReject,
  isPending,
}: {
  id: string;
  onApprove: () => void;
  onReject: (reason: string) => void;
  isPending: boolean;
}) {
  const [rejecting, setRejecting] = useState(false);
  return (
    <>
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          variant="mint"
          className="flex-1"
          data-testid={`approve-${id}`}
          onClick={onApprove}
          disabled={isPending}
        >
          <Check className="size-4" /> Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          data-testid={`reject-${id}`}
          onClick={() => setRejecting(true)}
          disabled={isPending}
        >
          <X className="size-4" /> Reject
        </Button>
      </div>
      {rejecting && (
        <RejectBox
          id={id}
          onCancel={() => setRejecting(false)}
          onConfirm={(reason) => {
            setRejecting(false);
            onReject(reason);
          }}
          isPending={isPending}
        />
      )}
    </>
  );
}

export function CampaignApprovals() {
  const queryClient = useQueryClient();
  const fetchCampaigns = useServerFn(listPendingCampaigns);
  const reviewFn = useServerFn(reviewCampaign);

  const campaigns = useQuery({
    queryKey: ["admin-pending-campaigns"],
    queryFn: () => fetchCampaigns({}),
  });

  const mutation = useMutation({
    mutationFn: (input: { campaignId: string; decision: "approved" | "rejected"; note: string }) =>
      reviewFn({ data: input }),
    onSuccess: (_, vars) => {
      toast.success(vars.decision === "approved" ? "Campaign approved — now live." : "Campaign rejected.");
      void queryClient.invalidateQueries({ queryKey: ["admin-pending-campaigns"] });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message.replace(/^[A-Z_]+: /, "") : "Something went wrong";
      toast.error("Couldn't review campaign", { description: msg });
    },
  });

  return (
    <>
      <SectionTitle>Campaign approvals</SectionTitle>
      {campaigns.isPending ? (
        <div className="mt-3 space-y-3">
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      ) : campaigns.isError ? (
        <p className="surface-card mt-3 p-4 text-sm text-destructive">Couldn't load campaigns.</p>
      ) : campaigns.data.length === 0 ? (
        <p className="surface-card mt-3 p-4 text-center text-sm text-muted-foreground">No campaigns pending approval.</p>
      ) : (
        <ul className="space-y-3" data-testid="admin-campaign-approvals">
          {campaigns.data.map((c) => (
            <li key={c.id} className="surface-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <VerificationBadge verification={c.verification} />
                  <p className="mt-1.5 truncate font-semibold">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    by {c.advertiserName} · {c.countries.join(", ")} · submitted {formatShortDate(c.submittedAt)}
                  </p>
                </div>
                <div className="shrink-0 text-right text-xs">
                  <p className="text-amount text-sm text-gold-dark">{formatMoney(c.reward)}</p>
                  <p className="text-muted-foreground">of {formatMoney(c.budget)} budget</p>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{c.summary}</p>
              <ApproveReject
                id={c.id}
                onApprove={() => mutation.mutate({ campaignId: c.id, decision: "approved", note: "Campaign approved for launch" })}
                onReject={(reason) => mutation.mutate({ campaignId: c.id, decision: "rejected", note: reason })}
                isPending={mutation.isPending && mutation.variables?.campaignId === c.id}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function ProofReviews() {
  const queryClient = useQueryClient();
  const fetchProofs = useServerFn(listPendingProofs);
  const reviewFn = useServerFn(reviewProof);

  const proofs = useQuery({
    queryKey: ["admin-pending-proofs"],
    queryFn: () => fetchProofs({}),
  });

  const mutation = useMutation({
    mutationFn: (input: { submissionId: string; role?: "admin" | "advertiser"; decision: "approved" | "rejected"; reason: string | null }) =>
      reviewFn({ data: { role: "admin", ...input } }),
    onSuccess: (_, vars) => {
      toast.success(
        vars.decision === "approved" ? "Proof approved — publisher rewarded." : "Proof rejected — publisher notified.",
      );
      void queryClient.invalidateQueries({ queryKey: ["admin-pending-proofs"] });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message.replace(/^[A-Z_]+: /, "") : "Something went wrong";
      toast.error("Couldn't review proof", { description: msg });
    },
  });

  return (
    <>
      <SectionTitle>Proof submissions</SectionTitle>
      <p className="mb-3 text-xs text-muted-foreground">
        Rejection reasons are shown to the publisher and can be appealed from their My Submissions screen.
      </p>

      {proofs.isPending ? (
        <div className="mt-3 space-y-3">
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      ) : proofs.isError ? (
        <p className="surface-card mt-3 p-4 text-sm text-destructive">Couldn't load proofs.</p>
      ) : proofs.data.length === 0 ? (
        <p className="surface-card mt-3 p-4 text-center text-sm text-muted-foreground">No proofs pending review.</p>
      ) : (
        <ul className="space-y-3" data-testid="admin-proof-reviews">
          {proofs.data.map((p) => (
            <li key={p.id} className="surface-card p-4">
              <div className="flex gap-3">
                {p.proofPaths && p.proofPaths.length > 0 ? (
                  <img
                    src={p.proofPaths[0]}
                    alt="Proof screenshot"
                    className="h-28 w-20 shrink-0 rounded-xl border border-border object-cover"
                  />
                ) : (
                  <span
                    aria-label="No screenshot uploaded"
                    className="grid h-28 w-20 shrink-0 place-items-center rounded-xl border border-dashed border-border bg-background-alt text-muted-foreground"
                  >
                    <ImageIcon className="size-6" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.campaignTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    Publisher <strong>{p.publisherName}</strong> · {formatShortDate(p.submittedAt)} · {formatMoney(p.reward)}
                  </p>
                  {p.appealText && (
                    <p className="mt-2 rounded-xl bg-primary/10 p-2 text-xs">
                      <span className="font-semibold">Appeal: </span>
                      {p.appealText}
                    </p>
                  )}
                  {p.userNote && (
                    <p className="mt-2 rounded-xl bg-background-alt p-2 text-xs">
                      {p.userNote ? `"${p.userNote}"` : <em className="text-muted-foreground">No notes</em>}
                    </p>
                  )}
                </div>
              </div>
              <ApproveReject
                id={p.id}
                onApprove={() => mutation.mutate({ submissionId: p.id, decision: "approved", reason: null })}
                onReject={(reason) => mutation.mutate({ submissionId: p.id, decision: "rejected", reason })}
                isPending={mutation.isPending && mutation.variables?.submissionId === p.id}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function AdvertisersList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fetchAdvertisers = useServerFn(listAdvertisers);
  const setStatus = useServerFn(setAdvertiserStatus);

  const advertisers = useQuery({
    queryKey: ["admin-advertisers"],
    queryFn: () => fetchAdvertisers({}),
  });

  const statusMutation = useMutation({
    mutationFn: (input: { advertiserId: string; status: "active" | "restricted" | "suspended"; reason: string }) =>
      setStatus({ data: { ...input, adminId: user?.id ?? "" } }),
    onSuccess: (_, vars) => {
      toast.success(`Advertiser ${vars.status === "active" ? "activated" : vars.status}.`);
      void queryClient.invalidateQueries({ queryKey: ["admin-advertisers"] });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message.replace(/^[A-Z_]+: /, "") : "Something went wrong";
      toast.error("Couldn't update advertiser status", { description: msg });
    },
  });

  return (
    <>
      <SectionTitle>Advertisers</SectionTitle>
      {advertisers.isPending ? (
        <div className="mt-3 space-y-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      ) : advertisers.isError ? (
        <p className="surface-card mt-3 p-4 text-sm text-destructive">Couldn't load advertisers.</p>
      ) : advertisers.data.length === 0 ? (
        <p className="surface-card mt-3 p-4 text-center text-sm text-muted-foreground">No advertisers yet.</p>
      ) : (
        <ul className="space-y-3">
          {advertisers.data.map((adv) => (
            <li key={adv.user_id} className="surface-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{adv.display_name}</p>
                    {adv.flagged_for_review && (
                      <AlertTriangle className="size-4 shrink-0 text-destructive" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {adv.contact_email} · {adv.campaign_count} campaigns · joined {formatShortDate(adv.created_at)}
                  </p>
                  <div className="mt-2 flex gap-4 text-xs">
                    <div>
                      <p className="text-muted-foreground">Balance</p>
                      <p className="font-mono text-sm font-semibold">{formatMoney(adv.deposit_balance)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Deposited</p>
                      <p className="font-mono text-sm font-semibold">{formatMoney(adv.lifetime_deposited)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Spent</p>
                      <p className="font-mono text-sm font-semibold">{formatMoney(adv.lifetime_spent)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Active</span>
                    <Switch
                      checked={adv.status === "active"}
                      onCheckedChange={(checked) => {
                        if (!user?.id) {
                          toast.error("You must be logged in to change status");
                          return;
                        }
                        const newStatus = checked ? "active" : "restricted";
                        const reason = checked
                          ? "Access restored by admin"
                          : "Access restricted by admin";
                        statusMutation.mutate({
                          advertiserId: adv.user_id,
                          status: newStatus,
                          reason,
                        });
                      }}
                      disabled={statusMutation.isPending}
                    />
                  </div>
                  {adv.status !== "active" && (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                      {adv.status}
                    </span>
                  )}
                </div>
              </div>
              {adv.status_reason && (
                <p className="mt-2 rounded-xl bg-background-alt p-2 text-xs text-muted-foreground">
                  <strong>Reason: </strong>{adv.status_reason}
                </p>
              )}
              {adv.flagged_for_review && adv.flag_reason && (
                <p className="mt-2 rounded-xl bg-destructive/10 p-2 text-xs text-destructive">
                  <strong>Flagged: </strong>{adv.flag_reason}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function FinancialOverview() {
  const fetchOverview = useServerFn(getFinancialOverview);

  const overview = useQuery({
    queryKey: ["admin-financial-overview"],
    queryFn: () => fetchOverview({}),
  });

  if (overview.isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
    );
  }

  if (overview.isError) {
    return <p className="surface-card p-4 text-sm text-destructive">Couldn't load financial overview.</p>;
  }

  const data = overview.data;

  return (
    <>
      <SectionTitle>Financial Overview</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <div className="surface-card p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-green-600" />
            <p className="text-xs text-muted-foreground">Total Deposits</p>
          </div>
          <p className="mt-1 text-2xl font-bold">{formatMoney(data.totalDeposits)}</p>
        </div>
        <div className="surface-card p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-blue-600" />
            <p className="text-xs text-muted-foreground">Campaign Spend</p>
          </div>
          <p className="mt-1 text-2xl font-bold">{formatMoney(data.totalCampaignSpend)}</p>
        </div>
        <div className="surface-card p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-purple-600" />
            <p className="text-xs text-muted-foreground">Publisher Payouts</p>
          </div>
          <p className="mt-1 text-2xl font-bold">{formatMoney(data.totalPublisherPayouts)}</p>
        </div>
        <div className="surface-card p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-gold-dark" />
            <p className="text-xs text-muted-foreground">Platform Fee</p>
          </div>
          <p className="mt-1 text-2xl font-bold">{formatMoney(data.platformFeeCollected)}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div className="surface-card p-3">
          <p className="text-xs text-muted-foreground">Active Advertisers</p>
          <p className="mt-1 text-xl font-semibold">{data.activeAdvertisers}</p>
        </div>
        <div className="surface-card p-3">
          <p className="text-xs text-muted-foreground">Active Campaigns</p>
          <p className="mt-1 text-xl font-semibold">{data.activeCampaigns}</p>
        </div>
        <div className="surface-card p-3">
          <p className="text-xs text-muted-foreground">Pending Reviews</p>
          <p className="mt-1 text-xl font-semibold">{data.pendingSubmissions}</p>
        </div>
      </div>
    </>
  );
}
