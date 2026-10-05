import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  LifeBuoy,
  Lock,
  Megaphone,
  PlusCircle,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { SectionHeading } from "@/components/SectionHeading";
import { StatTile } from "@/components/marketplace/Preview";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/coinquest";
import { useRole } from "@/lib/marketplace/role";

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

/** Home screen content while the role switcher is on "Advertiser". Real account data. */
export function AdvertiserDashboard() {
  const { overview, overviewLoading } = useRole();
  const account = overview?.account ?? null;

  if (overviewLoading || !account) {
    return (
      <div className="mt-3 space-y-3" data-testid="advertiser-dashboard-loading">
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    );
  }

  const stats = overview?.stats ?? { activeCampaigns: 0, completedConversions: 0, pendingReviews: 0 };
  const live = overview?.liveCampaigns ?? [];
  const pendingDeposit = overview?.recentDeposits.find((d) => d.status === "pending" && d.gatewayPaymentId);

  return (
    <div className="page-fade-in" data-testid="advertiser-dashboard">
      {account.status !== "active" && (
        <p className="mt-2 rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive">
          Your advertiser account is {account.status}.{" "}
          {account.statusReason ? `${account.statusReason} ` : ""}Contact support to resolve this.
        </p>
      )}

      <section className="premium-step-in mt-3 rounded-3xl bg-jade-gradient p-5 text-primary-foreground shadow-lift">
        <p className="text-[11px] font-semibold uppercase tracking-widest opacity-70">
          Available Campaign Balance
        </p>
        <p className="text-amount mt-1 text-4xl leading-none" data-testid="campaign-balance">
          {formatMoney(account.spendable)}
        </p>
        <div className="mt-4 space-y-1.5 border-t border-primary-foreground/15 pt-3 text-xs">
          {account.bonusAvailable > 0 && (
            <div className="flex items-center justify-between">
              <span className="opacity-75">incl. bonus available</span>
              <span className="text-amount text-sm">{formatMoney(account.bonusAvailable)}</span>
            </div>
          )}
          {account.bonusLocked > 0 && (
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 opacity-75">
                <Lock className="size-3" /> Bonus unlocking as you spend
              </span>
              <span className="text-amount text-sm">{formatMoney(account.bonusLocked)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="opacity-75">Total spent</span>
            <span className="text-amount text-sm">{formatMoney(account.lifetimeSpent)}</span>
          </div>
        </div>
        {pendingDeposit && (
          <p className="mt-3 rounded-xl bg-primary-foreground/10 px-3 py-2 text-xs">
            <Clock className="mr-1 inline size-3" /> {formatMoney(pendingDeposit.amountUsd)} deposit is being
            confirmed by the payment gateway — it'll show up here in a moment.
          </p>
        )}
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
        <StatTile label="Active campaigns" value={String(stats.activeCampaigns)} />
        <StatTile
          label="Completed conversions"
          value={stats.completedConversions.toLocaleString()}
          tone="mint"
        />
        <StatTile
          label="Pending reviews"
          value={String(stats.pendingReviews)}
          hint="Proof submissions awaiting your decision"
          tone="gold"
        />
        <StatTile label="Lifetime deposited" value={formatMoney(account.lifetimeDeposited)} />
      </div>

      <SectionHeading variant="ribbon" icon={Megaphone} title="Quick Actions" />
      <div className="stagger-children space-y-2.5">
        <QuickAction to="/advertiser/funds" icon={Wallet} label="Add Funds" hint="Top up your campaign balance" testId="qa-add-funds" />
        <QuickAction to="/advertiser/create" icon={PlusCircle} label="Create Campaign" hint="Launch a new task for publishers" testId="qa-create-campaign" />
        <QuickAction to="/advertiser/campaigns" icon={Megaphone} label="My Campaigns" hint="Active, paused, draft and completed" testId="qa-my-campaigns" />
        <QuickAction to="/advertiser/campaigns" icon={BarChart3} label="Campaign Results" hint="Clicks, completions and spend" testId="qa-campaign-results" />
        <QuickAction to="/advertiser/transactions" icon={Receipt} label="Transactions" hint="Deposits, spend and charges" testId="qa-transactions" />
        <QuickAction to="/advertiser/referral" icon={Users} label="Advertiser Referral" hint="Same link, extra rewards" testId="qa-referral" />
        <QuickAction to="/advertiser/help" icon={LifeBuoy} label="Advertiser Help" hint="FAQ for campaign owners" testId="qa-help" />
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
      {live.length === 0 ? (
        <div className="surface-card p-4 text-center">
          <p className="text-sm font-semibold">No live campaigns yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {account.spendable > 0
              ? "Create a campaign and submit it for review to go live."
              : "Add Campaign Funds, then create your first campaign."}
          </p>
          <Link
            to={(account.spendable > 0 ? "/advertiser/create" : "/advertiser/funds") as any}
            className="mt-3 inline-flex items-center gap-1 rounded-full bg-jade-gradient px-4 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            {account.spendable > 0 ? "Create campaign" : "Add funds"} <ArrowRight className="size-3" />
          </Link>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {live.map((c) => {
            const pct = c.budget ? Math.min(100, Math.round((c.spent / c.budget) * 100)) : 0;
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
                      {c.status === "budget_exhausted" ? "Budget used" : "Active"}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-background-alt">
                    <div className="h-full rounded-full bg-jade-gradient" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" /> {c.completions} / {c.maxCompletions} completed
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
      )}
    </div>
  );
}