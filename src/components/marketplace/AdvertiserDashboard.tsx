import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  LifeBuoy,
  Megaphone,
  PlusCircle,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { SectionHeading } from "@/components/SectionHeading";
import { PreviewNotice, StatTile } from "@/components/marketplace/Preview";
import { formatMoney } from "@/lib/coinquest";
import { ADVERTISER, MY_CAMPAIGNS } from "@/lib/marketplace/data";

/* eslint-disable @typescript-eslint/no-explicit-any */
function QuickAction({
  to,
  icon: Icon,
  label,
  hint,
  testId,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  hint: string;
  testId: string;
}) {
  return (
    <Link
      to={to as any}
      data-testid={testId}
      className="surface-card hover-lift press-feedback flex items-center gap-3 p-3.5"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10">
        <Icon className="size-5 text-primary" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block truncate text-xs text-muted-foreground">{hint}</span>
      </span>
      <ArrowRight className="size-4 text-muted-foreground" />
    </Link>
  );
}

/** Home screen content while the role switcher is on "Advertiser". Sample data. */
export function AdvertiserDashboard() {
  const active = MY_CAMPAIGNS.filter((c) => c.status === "active").slice(0, 2);
  return (
    <div className="page-fade-in" data-testid="advertiser-dashboard">
      <PreviewNotice className="mt-1" />

      <section className="premium-step-in mt-3 rounded-3xl bg-jade-gradient p-5 text-primary-foreground shadow-lift">
        <p className="text-[11px] font-semibold uppercase tracking-widest opacity-70">
          Available Campaign Balance
        </p>
        <p className="text-amount mt-1 text-4xl leading-none">
          {formatMoney(ADVERTISER.campaignBalance)}
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-primary-foreground/15 pt-3 text-xs">
          <span className="opacity-75">Total spent</span>
          <span className="text-amount text-sm">{formatMoney(ADVERTISER.totalSpent)}</span>
        </div>
        <Link
          to={"/advertiser/funds" as any}
          data-testid="dashboard-add-funds"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient px-4 py-2.5 text-sm font-semibold text-gold-foreground shadow-gold active:scale-[0.98]"
        >
          <Wallet className="size-4" /> Add Campaign Funds
        </Link>
      </section>

      <SectionHeading variant="ribbon" icon={BarChart3} title="Campaign Statistics" />
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Active campaigns" value={String(ADVERTISER.stats.activeCampaigns)} />
        <StatTile
          label="Completed conversions"
          value={ADVERTISER.stats.completedConversions.toLocaleString()}
          tone="mint"
        />
        <StatTile
          label="Pending reviews"
          value={String(ADVERTISER.stats.pendingReviews)}
          hint="Proof submissions awaiting a decision"
          tone="gold"
        />
        <StatTile label="Total spent" value={formatMoney(ADVERTISER.totalSpent)} />
      </div>

      <SectionHeading variant="ribbon" icon={Megaphone} title="Quick Actions" />
      <div className="stagger-children space-y-2.5">
        <QuickAction
          to="/advertiser/funds"
          icon={Wallet}
          label="Add Funds"
          hint="Top up your campaign balance"
          testId="qa-add-funds"
        />
        <QuickAction
          to="/advertiser/create"
          icon={PlusCircle}
          label="Create Campaign"
          hint="Launch a new task for publishers"
          testId="qa-create-campaign"
        />
        <QuickAction
          to="/advertiser/campaigns"
          icon={Megaphone}
          label="My Campaigns"
          hint="Active, paused, draft and completed"
          testId="qa-my-campaigns"
        />
        <QuickAction
          to="/advertiser/campaigns"
          icon={BarChart3}
          label="Campaign Results"
          hint="Clicks, completions and spend"
          testId="qa-campaign-results"
        />
        <QuickAction
          to="/advertiser/transactions"
          icon={Receipt}
          label="Transactions"
          hint="Deposits, spend and charges"
          testId="qa-transactions"
        />
        <QuickAction
          to="/advertiser/referral"
          icon={Users}
          label="Advertiser Referral"
          hint="Same link, extra rewards"
          testId="qa-referral"
        />
        <QuickAction
          to="/advertiser/help"
          icon={LifeBuoy}
          label="Advertiser Help"
          hint="FAQ for campaign owners"
          testId="qa-help"
        />
      </div>

      <SectionHeading
        variant="ribbon"
        icon={CheckCircle2}
        title="Live right now"
        action={
          <Link
            to={"/advertiser/campaigns" as any}
            className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
          >
            View all
          </Link>
        }
      />
      <ul className="space-y-2.5">
        {active.map((c) => {
          const pct = Math.min(100, Math.round((c.spent / c.budget) * 100));
          return (
            <li key={c.id}>
              <Link
                to={"/advertiser/results/$id" as any}
                params={{ id: c.id } as any}
                className="surface-card block p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-semibold">{c.title}</p>
                  <span className="rounded-full bg-mint/20 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    Active
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-background-alt">
                  <div className="h-full rounded-full bg-jade-gradient" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" /> {c.results.completed} completed
                  </span>
                  <span>
                    {formatMoney(c.spent)} of {formatMoney(c.budget)} used
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}