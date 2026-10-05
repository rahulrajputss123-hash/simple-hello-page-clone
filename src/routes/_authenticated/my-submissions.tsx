import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, Gavel, XCircle } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BackLink,
  PreviewNotice,
  VerificationBadge,
  formatShortDate,
  previewOnly,
} from "@/components/marketplace/Preview";
import { formatMoney } from "@/lib/coinquest";
import { MY_SUBMISSIONS, campaignById, type Submission } from "@/lib/marketplace/data";

export const Route = createFileRoute("/_authenticated/my-submissions")({
  head: () => ({ meta: [{ title: "My Submissions — CashGPT" }] }),
  component: MySubmissionsPage,
});

const STATUS: Record<
  Submission["status"],
  { label: string; className: string; icon: typeof Clock }
> = {
  pending: { label: "In review", className: "bg-gold/15 text-gold-dark", icon: Clock },
  approved: { label: "Approved", className: "bg-mint/20 text-primary", icon: CheckCircle2 },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive", icon: XCircle },
};

function SubmissionCard({ s }: { s: Submission }) {
  const c = campaignById(s.campaignId);
  const meta = STATUS[s.status];
  const Icon = meta.icon;
  const [appealing, setAppealing] = useState(false);
  const [reason, setReason] = useState("");
  const [appealed, setAppealed] = useState(false);

  return (
    <li className="surface-card p-4" data-testid={`submission-${s.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {c && <VerificationBadge verification={c.verification} />}
          <p className="mt-1.5 truncate font-semibold">{c?.title ?? "Task"}</p>
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

          {appealed ? (
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Gavel className="size-3.5" /> Appeal submitted — we'll get back to you.
            </p>
          ) : appealing ? (
            <form
              className="mt-3 space-y-2"
              data-testid="appeal-form"
              onSubmit={(e) => {
                e.preventDefault();
                previewOnly("Your appeal would be sent to the review team here.");
                setAppealed(true);
                setAppealing(false);
              }}
            >
              <Label htmlFor={`appeal-${s.id}`} className="text-xs">
                Tell us why this decision should be reviewed
              </Label>
              <Textarea
                id={`appeal-${s.id}`}
                rows={3}
                maxLength={600}
                placeholder="e.g. The full screenshot was attached — the 'Following' button is visible at the top."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setAppealing(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  variant="jade"
                  className="flex-1"
                  disabled={reason.trim().length < 10}
                  data-testid="appeal-submit"
                >
                  Submit appeal
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
    </li>
  );
}

function MySubmissionsPage() {
  return (
    <AppShell subtitle="Tasks" mainClass="page-fade-in">
      <BackLink to="/task" label="Back to Microtasks" />
      <SectionHeading
        variant="ribbon"
        size="page"
        icon={Clock}
        iconSrc="/icons/icon-your-task.png"
        title="My Submissions"
        subtitle="Track proof you've sent for review."
        className="mb-2"
      />
      <PreviewNotice />
      <ul className="stagger-children mt-3 space-y-3">
        {MY_SUBMISSIONS.map((s) => (
          <SubmissionCard key={s.id} s={s} />
        ))}
      </ul>
    </AppShell>
  );
}