import { createFileRoute } from "@tanstack/react-router";
import { PlusCircle } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BackLink, PreviewNotice, previewOnly } from "@/components/marketplace/Preview";
import type { Verification } from "@/lib/marketplace/data";

export const Route = createFileRoute("/_authenticated/advertiser/create")({
  head: () => ({ meta: [{ title: "Create Campaign — CashGPT" }] }),
  component: CreateCampaignPage,
});

const COUNTRIES = ["Worldwide", "United States", "India", "United Kingdom", "Canada", "Brazil", "Germany"];

function CreateCampaignPage() {
  const [verification, setVerification] = useState<Verification>("proof");
  const [reward, setReward] = useState("0.50");
  const [budget, setBudget] = useState("100");
  const conversions = Math.floor((Number(budget) || 0) / (Number(reward) || 1));

  return (
    <AppShell subtitle="Advertiser" mainClass="page-fade-in">
      <BackLink to="/home" label="Back to dashboard" />
      <SectionHeading
        variant="ribbon"
        size="page"
        icon={PlusCircle}
        title="Create Campaign"
        subtitle="Describe the task publishers will complete."
        className="mb-2"
      />
      <PreviewNotice />

      <form
        className="surface-card mt-3 space-y-4 p-4"
        data-testid="create-campaign-form"
        onSubmit={(e) => {
          e.preventDefault();
          previewOnly("Your campaign would be submitted for approval here.");
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="c-title">Campaign title</Label>
          <Input id="c-title" maxLength={80} placeholder="e.g. Install & open Coin Rush" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-desc">Description & steps</Label>
          <Textarea
            id="c-desc"
            rows={4}
            maxLength={1000}
            placeholder="What should the publisher do, step by step?"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label>Verification</Label>
          <div className="grid grid-cols-2 gap-2" role="radiogroup">
            {(
              [
                ["proof", "🟡 Manual Proof", "Publishers upload a screenshot you review"],
                ["auto", "🟢 Auto Verified", "Completion is detected automatically"],
              ] as const
            ).map(([value, label, hint]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={verification === value}
                data-testid={`verification-${value}`}
                onClick={() => setVerification(value)}
                className={`rounded-2xl border p-3 text-left ${
                  verification === value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card"
                }`}
              >
                <span className="block text-sm font-semibold">{label}</span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">{hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="c-reward">Reward per completion</Label>
            <Input
              id="c-reward"
              type="number"
              min={0.05}
              step={0.05}
              inputMode="decimal"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-budget">Total budget</Label>
            <Input
              id="c-budget"
              type="number"
              min={10}
              step={5}
              inputMode="decimal"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>
        </div>
        <p className="rounded-xl bg-mint/15 px-3 py-2 text-xs text-primary">
          ≈ <strong>{conversions.toLocaleString()}</strong> completions at this reward.
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="c-country">Country targeting</Label>
          <select
            id="c-country"
            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
            defaultValue="Worldwide"
          >
            {COUNTRIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <Button type="submit" variant="jade" size="lg" className="w-full" data-testid="create-campaign-submit">
          Submit for approval
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          Campaigns are reviewed by the CashGPT team before they go live.
        </p>
      </form>
    </AppShell>
  );
}