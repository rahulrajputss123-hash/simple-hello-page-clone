import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock, Gavel, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BackLink, VerificationBadge, formatShortDate } from "@/components/marketplace/Preview";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/coinquest";
import { appealSubmission, listMySubmissions } from "@/lib/marketplace.functions";
import type { SubmissionView } from "@/lib/marketplace/publisher.server";

export const Route = createFileRoute("/_authenticated/my-submissions")({
  head: () => ({ meta: [{ title: "My Submissions — CashGPT" }] }),
  component: MySubmissionsPage,
});

const STATUS: Record<
  SubmissionView["status"],
  { label: string; className: string; icon: typeof Clock }
> = {
  pending: { label: "In review", className: "bg-gold/15 text-gold-dark", icon: Clock },
  approved: { label: "Approved", className: "bg-mint/20 text-primary", icon: CheckCircle2 },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive", icon: XCircle },
  appealed: { label: "Appeal pending", className: "bg-primary/15 text-primary", icon: Gavel },
};

function SubmissionCard({ s }: { s: SubmissionView }) {
  const queryClient = useQueryClient();
  const appealFn = useServerFn(appealSubmission);
  const meta = STATUS[s.status];
  const Icon = meta.icon;
  const [appealing, setAppealing] = useState(false);
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: () => appealFn({ data: { submissionId: s.id, appealText: reason.trim() } }),
    onSuccess: () => {
      toast.success("Appeal submitted — we'll review it soon.");
      setAppealing(false);
      setReason("");
      void queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message.replace(/^[A-Z_]+: /, "") : "Something went wrong";
      toast.error("Couldn't submit appeal", { description: msg });
    },
  });

  return (
    <li className="surface-card p-4" data-testid={`submission-${s.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mt-1.5 truncate font-semibold">{s.campaignTitle}</p>
          <p className="text-xs text-muted-foreground">Submitted {formatShortDate(s.submittedAt)}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-amount text-sm text-gold-dark">{formatMoney(s.reward)}</p>
          <span
            className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.className}`}
          >
            <Icon className="size-3" /> {meta.label}
          </span>
        </div>
      </div>

      {s.status === "rejected" && (
        <div className="mt-3 rounded-2xl bg-destructive/5 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-destructive">
            Reason for rejection
          </p>
          <p className="mt-1 text-sm">{s.rejectionReason}</p>

          {appealing ? (
            <form
              className="mt-3 space-y-2"
              data-testid="appeal-form"
              onSubmit={(e) => {
                e.preventDefault();
                mutation.mutate();
              }}
            >
              <Label htmlFor={`appeal-${s.id}`} className="text-xs">
                Tell us why this decision should be reviewed
              </Label>
              <Textarea
                id={`appeal-${s.id}`}
                rows={3}
                maxLength={500}
                placeholder="e.g. The full screenshot was attached — the 'Following' button is visible at the top."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setAppealing(false)} disabled={mutation.isPending}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  variant="jade"
                  className="flex-1"
                  disabled={reason.trim().length < 10 || mutation.isPending}
                  data-testid="appeal-submit"
                >
                  {mutation.isPending ? "Submitting..." : "Submit appeal"}
                </Button>
              </div>
            </form>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full"
              data-testid="appeal-btn"
              onClick={() => setAppealing(true)}
            >
              <Gavel className="size-4" /> Appeal this decision
            </Button>
          )}
        </div>
      )}

      {s.status === "appealed" && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
          <Gavel className="size-3.5" /> Appeal submitted — we'll review it again.
        </p>
      )}
    </li>
  );
}

function MySubmissionsPage() {
  const { session } = useAuth();
  const fetchSubmissions = useServerFn(listMySubmissions);

  const submissions = useQuery({
    queryKey: ["my-submissions", session?.user.id],
    queryFn: () => fetchSubmissions({}),
    enabled: Boolean(session),
  });

  return (
    <AppShell subtitle="Tasks" mainClass="page-fade-in">
      <BackLink to="/task" label="Back to Microtasks" />
      <SectionHeading
        variant="ribbon"
        size="page"
        icon={Clock}
        iconSrc="/icons/icon-submission-review.png"
        title="My Submissions"
        subtitle="Track proof you've sent for review."
        className="mb-2"
      />

      {submissions.isPending ? (
        <div className="mt-3 space-y-3">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      ) : submissions.isError ? (
        <p className="surface-card mt-3 p-4 text-sm text-destructive">Couldn't load your submissions.</p>
      ) : submissions.data.length === 0 ? (
        <p className="surface-card mt-3 p-4 text-center text-sm text-muted-foreground">
          No submissions yet. Complete a microtask to get started!
        </p>
      ) : (
        <ul className="stagger-children mt-3 space-y-3">
          {submissions.data.map((s) => (
            <SubmissionCard key={s.id} s={s} />
          ))}
        </ul>
      )}
    </AppShell>
  );
}
