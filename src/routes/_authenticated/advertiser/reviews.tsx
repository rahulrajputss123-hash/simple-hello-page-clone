import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { BackLink } from "@/components/marketplace/Preview";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/coinquest";
import { listPendingReviews, reviewSubmission } from "@/lib/marketplace.functions";

export const Route = createFileRoute("/_authenticated/advertiser/reviews")({
  head: () => ({ meta: [{ title: "Review Submissions — CashGPT" }] }),
  component: ReviewsPage,
});

function ReviewsPage() {
  const queryClient = useQueryClient();
  const {
    data: submissions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["pending-reviews"],
    queryFn: () => listPendingReviews({}),
    refetchInterval: 30000, // Refresh every 30s
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const reviewMutation = useMutation({
    mutationFn: ({
      submissionId,
      decision,
      reason,
    }: {
      submissionId: string;
      decision: "approved" | "rejected";
      reason?: string;
    }) => reviewSubmission({ data: { submissionId, decision, reason } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pending-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["my-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["advertiser-overview"] });

      if (variables.decision === "approved") {
        toast.success("Submission approved — earner will be paid");
      } else {
        toast.success("Submission rejected — earner can appeal");
      }

      setExpandedId(null);
      setRejectReason("");
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Could not process review";
      if (msg.includes("ADMIN_REVIEW_REQUIRED")) {
        toast.error("Admin review required", {
          description: "This submission requires admin review and cannot be decided by you.",
        });
      } else if (msg.includes("ALREADY_DECIDED")) {
        toast.error("Already reviewed", {
          description: "This submission has already been reviewed.",
        });
      } else {
        toast.error(msg);
      }
    },
  });

  const getTimeRemaining = (autoApproveAt: string) => {
    const now = new Date();
    const target = new Date(autoApproveAt);
    const diffMs = target.getTime() - now.getTime();

    if (diffMs <= 0) return "Auto-approving soon";

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `Auto-approves in ${hours}h ${minutes}m`;
    }
    return `Auto-approves in ${minutes}m`;
  };

  if (isLoading) {
    return (
      <AppShell subtitle="Advertiser">
        <BackLink to="/advertiser/campaigns" label="Back to Campaigns" />
        <div className="mt-4 space-y-3">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell subtitle="Advertiser">
        <BackLink to="/advertiser/campaigns" label="Back to Campaigns" />
        <p className="mt-8 text-center text-sm text-destructive">Could not load reviews.</p>
      </AppShell>
    );
  }

  return (
    <AppShell subtitle="Advertiser" mainClass="page-fade-in">
      <BackLink to="/advertiser/campaigns" label="Back to Campaigns" />

      <SectionHeading
        variant="ribbon"
        size="page"
        icon={Clock}
        iconSrc="/icons/icon-submission-review.webp"
        title="Pending Reviews"
        subtitle="Review proof submissions from publishers and approve or reject them."
        className="mb-2"
      />

      <div className="surface-card mt-3 rounded-xl border border-gold/40 bg-gold/10 p-3 text-xs text-gold-dark">
        <AlertTriangle className="mb-1 inline size-3.5" /> <strong>Review guidelines:</strong>{" "}
        Rejections can be appealed by the earner and reviewed by admin. Be fair and provide clear
        reasons for rejection. If you do not review a submission within the time window, it will be
        auto-approved and the earner will be paid.
      </div>

      {!submissions || submissions.length === 0 ? (
        <div className="surface-card mt-4 p-8 text-center">
          <CheckCircle className="mx-auto size-12 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold">No pending reviews</p>
          <p className="mt-1 text-xs text-muted-foreground">
            All submissions have been reviewed or auto-approved.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {submissions.map((sub: any) => {
            const isExpanded = expandedId === sub.id;

            return (
              <div key={sub.id} className="surface-card overflow-hidden p-0">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{sub.campaignName}</p>
                      <p className="text-amount text-sm text-gold-dark">
                        {formatMoney(sub.publisherReward)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        <Clock className="mr-1 inline size-3" />
                        {getTimeRemaining(sub.autoApproveAt)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                    >
                      {isExpanded ? "Hide" : "Review"}
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border p-4 space-y-4">
                    {/* Proof Images */}
                    {sub.proofUrls && sub.proofUrls.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs">Screenshot proof</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {sub.proofUrls.map((url: string, idx: number) => (
                            <img
                              key={idx}
                              src={url}
                              alt={`Proof ${idx + 1}`}
                              className="rounded-xl border border-border object-contain max-h-48 w-full bg-background-alt"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Field Values */}
                    {sub.proofFields &&
                      sub.proofFields.length > 0 &&
                      Object.keys(sub.fieldValues).length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs">Submitted information</Label>
                          <div className="space-y-1 rounded-xl border border-border bg-background-alt p-3">
                            {sub.proofFields.map((field: any) => {
                              const value = sub.fieldValues[field.key];
                              if (!value) return null;

                              return (
                                <div key={field.key} className="flex justify-between gap-2 text-sm">
                                  <span className="text-muted-foreground">{field.label}:</span>
                                  <span className="font-medium">{value}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    {/* User Note */}
                    {sub.userNote && (
                      <div className="space-y-2">
                        <Label className="text-xs">Publisher note</Label>
                        <p className="rounded-xl border border-border bg-background-alt p-3 text-sm">
                          {sub.userNote}
                        </p>
                      </div>
                    )}

                    {/* Reject Reason Input */}
                    <div className="space-y-2">
                      <Label htmlFor={`reason-${sub.id}`}>Rejection reason (if rejecting)</Label>
                      <Textarea
                        id={`reason-${sub.id}`}
                        rows={3}
                        minLength={10}
                        maxLength={500}
                        placeholder="Explain why this submission doesn't meet requirements (min 10 characters)..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (!rejectReason.trim() || rejectReason.length < 10) {
                            toast.error("Rejection reason must be at least 10 characters");
                            return;
                          }
                          reviewMutation.mutate({
                            submissionId: sub.id,
                            decision: "rejected",
                            reason: rejectReason,
                          });
                        }}
                        disabled={reviewMutation.isPending}
                      >
                        <XCircle className="mr-2 size-4" />
                        Not satisfied
                      </Button>
                      <Button
                        variant="jade"
                        className="flex-1"
                        onClick={() => {
                          reviewMutation.mutate({
                            submissionId: sub.id,
                            decision: "approved",
                          });
                        }}
                        disabled={reviewMutation.isPending}
                      >
                        <CheckCircle className="mr-2 size-4" />
                        Satisfied
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
