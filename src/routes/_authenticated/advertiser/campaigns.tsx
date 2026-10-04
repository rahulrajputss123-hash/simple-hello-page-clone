import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Megaphone, Pause, Play } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { BackLink, PreviewNotice, VerificationBadge, previewOnly } from "@/components/marketplace/Preview";
import { formatMoney } from "@/lib/coinquest";
import { MY_CAMPAIGNS, type CampaignStatus } from "@/lib/marketplace/data";

export const Route = createFileRoute("/_authenticated/advertiser/campaigns")({
  head: () => ({ meta: [{ title: "My Campaigns — CashGPT" }] }),
  component: MyCampaignsPage,
});

const TABS: [CampaignStatus, string][] = [
  ["active", "Active"],
  ["paused", "Paused"],
  ["draft", "Draft"],
  ["completed", "Completed"],
];

const STATUS_STYLE: Record<CampaignStatus, string> = {
  active: "bg-mint/20 text-primary",
  paused: "bg-gold/15 text-gold-dark",
  draft: "bg-background-alt text-muted-foreground",
  completed: "bg-primary/10 text-primary",
};

function MyCampaignsPage() {
  const [tab, setTab] = useState<CampaignStatus>("active");
  const list = MY_CAMPAIGNS.filter((c) => c.status === tab);

  return (
    <AppShell subtitle="Advertiser" mainClass="page-fade-in">
      <BackLink to="/home" label="Back to dashboard" />
      <SectionHeading
        variant="ribbon"
        size="page"
        icon={Megaphone}
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
      <PreviewNotice />

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist">
        {TABS.map(([key, label]) => {
          const count = MY_CAMPAIGNS.filter((c) => c.status === key).length;
          return (
            <Button
              key={key}
              size="sm"
              role="tab"
              aria-selected={tab === key}
              variant={tab === key ? "jade" : "outline"}
              onClick={() => setTab(key)}
              data-testid={`campaign-tab-${key}`}
            >
              {label} ({count})
            </Button>
          );
        })}
      </div>

      <ul className="stagger-children mt-3 space-y-3">
        {list.map((c) => {
          const pct = c.budget ? Math.min(100, Math.round((c.spent / c.budget) * 100)) : 0;
          return (
            <li key={c.id} className="surface-card p-4" data-testid={`my-campaign-${c.id}`}>
              <Link to="/advertiser/results/$id" params={{ id: c.id }} className="block">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <VerificationBadge verification={c.verification} />
                    <p className="mt-1.5 truncate font-semibold">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.country} · {formatMoney(c.reward)} per completion
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLE[c.status]}`}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-background-alt">
                  <div className="h-full rounded-full bg-jade-gradient" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{c.results.completed} completed</span>
                  <span>
                    {formatMoney(c.spent)} / {formatMoney(c.budget)}
                  </span>
                </div>
              </Link>
              <div className="mt-3 flex gap-2">
                {c.status === "active" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    data-testid={`pause-${c.id}`}
                    onClick={() => previewOnly("This campaign would be paused here.")}
                  >
                    <Pause className="size-4" /> Pause
                  </Button>
                )}
                {c.status === "paused" && (
                  <Button
                    size="sm"
                    variant="mint"
                    className="flex-1"
                    onClick={() => previewOnly("This campaign would resume here.")}
                  >
                    <Play className="size-4" /> Resume
                  </Button>
                )}
                {c.status === "draft" && (
                  <Button
                    size="sm"
                    variant="jade"
                    className="flex-1"
                    onClick={() => previewOnly("This draft would be submitted for approval here.")}
                  >
                    Submit for approval
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
    </AppShell>
  );
}