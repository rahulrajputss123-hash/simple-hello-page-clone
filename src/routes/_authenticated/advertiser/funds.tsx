import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, Wallet } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackLink, PreviewNotice, previewOnly } from "@/components/marketplace/Preview";
import { formatMoney } from "@/lib/coinquest";
import { ADVERTISER } from "@/lib/marketplace/data";

export const Route = createFileRoute("/_authenticated/advertiser/funds")({
  head: () => ({ meta: [{ title: "Add Campaign Funds — CashGPT" }] }),
  component: FundsPage,
});

const PRESETS = [25, 50, 100, 250];

function FundsPage() {
  const [amount, setAmount] = useState("50");
  return (
    <AppShell subtitle="Advertiser" mainClass="page-fade-in">
      <BackLink to="/home" label="Back to dashboard" />
      <SectionHeading
        variant="ribbon"
        size="page"
        icon={Wallet}
        iconSrc="/icons/icon-wallet.png"
        title="Add Campaign Funds"
        subtitle="Top up the balance your campaigns spend from."
        className="mb-2"
      />
      <PreviewNotice />

      <div className="surface-card mt-3 flex items-center justify-between p-4">
        <div>
          <p className="text-xs text-muted-foreground">Available Campaign Balance</p>
          <p className="text-amount text-2xl">{formatMoney(ADVERTISER.campaignBalance)}</p>
        </div>
        <span className="grid size-11 place-items-center rounded-xl bg-primary/10">
          <CreditCard className="size-5 text-primary" />
        </span>
      </div>

      <form
        className="surface-card mt-3 space-y-4 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          previewOnly(`A ${formatMoney(Number(amount) || 0)} deposit would be processed here.`);
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="fund-amount">Amount (USD)</Label>
          <Input
            id="fund-amount"
            type="number"
            min={10}
            step={5}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setAmount(String(p))}
              className={`rounded-xl border px-2 py-2 text-sm font-semibold ${
                amount === String(p)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card"
              }`}
            >
              ${p}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Campaign Funds are spent only when a publisher completes your task. Unused funds stay
          in your Campaign Balance.
        </p>
        <Button type="submit" variant="jade" size="lg" className="w-full" data-testid="add-funds-submit">
          Add {formatMoney(Number(amount) || 0)} to Campaign Balance
        </Button>
      </form>
    </AppShell>
  );
}