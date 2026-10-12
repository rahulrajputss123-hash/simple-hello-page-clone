import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getCampaignResults } from "@/lib/marketplace.functions";
import { BarChart3, CheckCircle2, Clock, MousePointerClick, Play, XCircle } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { BackLink, StatTile, VerificationBadge } from "@/components/marketplace/Preview";
import { formatMoney } from "@/lib/coinquest";

export const Route = createFileRoute("/_authenticated/advertiser/results/$id")({
  head: () => ({ meta: [{ title: "Campaign Results — CashGPT" }] }),
  component: ResultsPage,
});

function ResultsPage() {
  const { id } = Route.useParams();
  const { data: c, isLoading, error } = useQuery({ queryKey: ["campaign-results", id], queryFn: () => getCampaignResults({ data: { campaignId: id } }) });

  if (isLoading) return <AppShell subtitle="Advertiser"><p className="mt-8 text-center text-sm text-muted-foreground">Loading results…</p></AppShell>;
  if (error || !c) {
    return (
      <AppShell subtitle="Advertiser">
        <BackLink to="/advertiser/campaigns" label="Back to My Campaigns" />
        <p className="mt-8 text-center text-sm text-muted-foreground">Campaign not found.</p>
      </AppShell>
    );
  }

  const r = c.funnel;
  const remaining = c.budget_remaining;
  const conversion = r.clicks ? Math.round((r.completed / r.clicks) * 1000) / 10 : 0;

  return (
    <AppShell subtitle="Advertiser" mainClass="page-fade-in">
      <BackLink to="/advertiser/campaigns" label="Back to My Campaigns" />
      <PreviewNotice className="mt-3" />

      <section className="premium-step-in mt-3 rounded-3xl bg-jade-gradient p-5 text-primary-foreground shadow-lift">
        <VerificationBadge verification={c.verification_mode === "auto" ? "auto" : "proof"} size="md" />
        <h1 className="mt-3 text-xl leading-tight">{c.title}</h1>
        <p className="mt-1 text-xs opacity-75">
          {c.countries} · {formatMoney(c.publisher_reward)} per completion · {c.status}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-primary-foreground/10 p-3">
            <p className="text-[10px] uppercase tracking-wide opacity-70">Spend</p>
            <p className="text-amount text-xl">{formatMoney(c.budget_spent)}</p>
          </div>
          <div className="rounded-xl bg-primary-foreground/10 p-3">
            <p className="text-[10px] uppercase tracking-wide opacity-70">Remaining budget</p>
            <p className="text-amount text-xl">{formatMoney(remaining)}</p>
          </div>
        </div>
      </section>

      <SectionHeading
        variant="ribbon"
        icon={BarChart3}
        iconSrc="/icons/icon-adv-campaign-statistics-v2.webp"
        title="Funnel"
      />
      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Clicks" value={r.clicks.toLocaleString()} />
        <StatTile label="Started" value={r.started.toLocaleString()} />
        <StatTile label="Completed" value={r.completed.toLocaleString()} tone="mint" />
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        <MousePointerClick className="mr-1 inline size-3.5" />
        {conversion}% of clicks completed the task
      </p>

      <SectionHeading
        variant="ribbon"
        icon={CheckCircle2}
        iconSrc="/icons/icon-submission-review.webp"
        title="Submissions"
      />
      <div className="surface-card divide-y divide-border">
        {[
          { icon: CheckCircle2, label: "Approved", value: c.submissions.approved, cls: "text-primary" },
          { icon: XCircle, label: "Rejected", value: c.submissions.rejected, cls: "text-destructive" },
          { icon: Clock, label: "Pending review", value: c.submissions.pending, cls: "text-gold-dark" },
          { icon: Play, label: "Started, not completed", value: r.started - r.completed, cls: "text-muted-foreground" },
        ].map(({ icon: Icon, label, value, cls }) => (
          <div key={label} className="flex items-center justify-between p-3.5">
            <span className={`inline-flex items-center gap-2 text-sm ${cls}`}>
              <Icon className="size-4" /> {label}
            </span>
            <span className="text-amount text-base">{value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
