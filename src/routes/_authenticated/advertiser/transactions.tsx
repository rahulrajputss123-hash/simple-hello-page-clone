import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDownLeft, ArrowUpRight, Gift, Lock, Receipt, RotateCcw } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Skeleton } from "@/components/ui/skeleton";
import { BackLink, formatShortDate } from "@/components/marketplace/Preview";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/coinquest";
import { listAdvertiserTransactions } from "@/lib/marketplace.functions";
import type { TransactionView } from "@/lib/marketplace/advertiser.server";

export const Route = createFileRoute("/_authenticated/advertiser/transactions")({
  head: () => ({ meta: [{ title: "Advertiser Transactions — CashGPT" }] }),
  component: TransactionsPage,
});

function iconFor(t: TransactionView) {
  switch (t.kind) {
    case "first_deposit_bonus":
    case "bonus_unlock":
      return Gift;
    case "deposit_reversal":
    case "first_deposit_bonus_reversal":
    case "bonus_forfeit":
      return RotateCcw;
    case "campaign_allocation":
      return Lock;
    default:
      return t.amount >= 0 ? ArrowDownLeft : ArrowUpRight;
  }
}

const BUCKET_LABEL = { deposit: "", bonus_locked: "Locked bonus", bonus_available: "Bonus" } as const;

function TransactionsPage() {
  const { session } = useAuth();
  const list = useServerFn(listAdvertiserTransactions);
  const tx = useQuery({
    queryKey: ["advertiser-transactions", session?.user.id],
    queryFn: () => list(),
    enabled: Boolean(session),
    staleTime: 0,
    refetchOnMount: "always",
  });

  return (
    <AppShell subtitle="Advertiser" mainClass="page-fade-in">
      <BackLink to="/home" label="Back to dashboard" />
      <SectionHeading
        variant="ribbon"
        size="page"
        icon={Receipt}
        iconSrc="/icons/icon-wallet-transactions.png"
        title="Transactions"
        subtitle="Every movement on your Campaign Balance."
        className="mb-2"
      />

      {tx.isPending ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      ) : tx.isError ? (
        <p className="surface-card mt-3 p-4 text-sm text-destructive">Couldn't load transactions.</p>
      ) : tx.data.length === 0 ? (
        <div className="surface-card mt-3 p-5 text-center">
          <p className="text-sm font-semibold">No transactions yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Your first deposit will show up here once the payment is confirmed.
          </p>
        </div>
      ) : (
        <ul className="surface-card mt-3 divide-y divide-border" data-testid="advertiser-transactions">
          {tx.data.map((t) => {
            const positive = t.amount > 0;
            const zero = t.amount === 0;
            const Icon = iconFor(t);
            const bucket = BUCKET_LABEL[t.bucket];
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
                  <p className="truncate text-sm font-semibold">
                    {t.label}
                    {bucket ? <span className="ml-1.5 text-[10px] font-semibold uppercase text-gold-dark">{bucket}</span> : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatShortDate(t.createdAt)}
                    {t.campaignName ? ` · ${t.campaignName}` : t.description ? ` · ${t.description}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-amount text-sm ${positive ? "text-primary" : ""}`}>
                    {zero ? "" : positive ? "+" : "−"}
                    {formatMoney(Math.abs(t.amount))}
                  </p>
                  <span className="text-[10px] font-semibold text-muted-foreground">completed</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
