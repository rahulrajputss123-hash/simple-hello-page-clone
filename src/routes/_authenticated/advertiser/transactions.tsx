import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Gift, Receipt } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { BackLink, PreviewNotice, formatShortDate } from "@/components/marketplace/Preview";
import { formatMoney } from "@/lib/coinquest";
import { ADVERTISER_TRANSACTIONS } from "@/lib/marketplace/data";

export const Route = createFileRoute("/_authenticated/advertiser/transactions")({
  head: () => ({ meta: [{ title: "Advertiser Transactions — CashGPT" }] }),
  component: TransactionsPage,
});

function TransactionsPage() {
  return (
    <AppShell subtitle="Advertiser" mainClass="page-fade-in">
      <BackLink to="/home" label="Back to dashboard" />
      <SectionHeading
        variant="ribbon"
        size="page"
        icon={Receipt}
        title="Transactions"
        subtitle="Deposits, campaign spend and charges."
        className="mb-2"
      />
      <PreviewNotice />
      <ul className="surface-card mt-3 divide-y divide-border" data-testid="advertiser-transactions">
        {ADVERTISER_TRANSACTIONS.map((t) => {
          const positive = t.amount > 0;
          const Icon = t.type === "Advertiser Referral Bonus" ? Gift : positive ? ArrowDownLeft : ArrowUpRight;
          return (
            <li key={t.id} className="flex items-center gap-3 p-3.5">
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                  positive ? "bg-mint/20 text-primary" : "bg-background-alt text-muted-foreground"
                }`}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{t.type}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatShortDate(t.date)}
                  {t.campaign ? ` · ${t.campaign}` : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className={`text-amount text-sm ${positive ? "text-primary" : ""}`}>
                  {positive ? "+" : "−"}
                  {formatMoney(Math.abs(t.amount))}
                </p>
                <span
                  className={`text-[10px] font-semibold capitalize ${
                    t.status === "pending" ? "text-gold-dark" : "text-muted-foreground"
                  }`}
                >
                  {t.status}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}