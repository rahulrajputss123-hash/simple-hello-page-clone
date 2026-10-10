import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PlusCircle, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { BackLink } from "@/components/marketplace/Preview";
import { createCampaign } from "@/lib/marketplace.functions";
import { useRole } from "@/lib/marketplace/role";

export const Route = createFileRoute("/_authenticated/advertiser/create")({
  head: () => ({ meta: [{ title: "Create Campaign — CashGPT" }] }),
  component: CreateCampaignPage,
});

const COUNTRIES = ["Worldwide", "United States", "India", "United Kingdom", "Canada", "Brazil", "Germany"];

type Verification = "auto" | "proof";

function CreateCampaignPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { overview, refreshOverview } = useRole();
  const createFn = useServerFn(createCampaign);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [verification, setVerification] = useState<Verification>("proof");
  const [reward, setReward] = useState("0.50");
  const [budget, setBudget] = useState("100");
  const [country, setCountry] = useState("Worldwide");
  const [featured, setFeatured] = useState(false);
  const [featuredDays, setFeaturedDays] = useState("7");

  const rewardNum = Number(reward) || 0;
  const budgetNum = Number(budget) || 0;
  const conversions = Math.floor(budgetNum / (rewardNum || 1));
  const featuredFee = useMemo(() => featured ? Number(featuredDays) * 2 : 0, [featured, featuredDays]);

  const account = overview?.account;
  const canCreate = account?.status === "active" && account.spendable >= budgetNum;

  const mutation = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          title: title.trim(),
          description: description.trim(),
          verification,
          reward: rewardNum,
          budget: budgetNum,
          countries: country === "Worldwide" ? ["*"] : [country],
        },
      }),
    onSuccess: async (result) => {
      await Promise.all([
        refreshOverview(),
        queryClient.invalidateQueries({ queryKey: ["my-campaigns"] }),
      ]);
      toast.success("Campaign created! Submit it for approval when ready.");
      navigate({ to: "/advertiser/campaigns" });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message.replace(/^[A-Z_]+: /, "") : "Something went wrong";
      toast.error("Couldn't create campaign", { description: msg });
    },
  });

  return (
    <AppShell subtitle="Advertiser" mainClass="page-fade-in">
      <BackLink to="/home" label="Back to dashboard" />
      <SectionHeading
        variant="ribbon"
        size="page"
        icon={PlusCircle}
        iconSrc="/icons/icon-create-campaign.png"
        title="Create Campaign"
        subtitle="Describe the task publishers will complete."
        className="mb-2"
      />

      <form
        className="surface-card mt-3 space-y-4 p-4"
        data-testid="create-campaign-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canCreate) {
            toast.error("Add funds first", {
              description: `You need at least $${budgetNum.toFixed(2)} in your Campaign Balance.`,
            });
            return;
          }
          mutation.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="c-title">Campaign title</Label>
          <Input
            id="c-title"
            maxLength={80}
            placeholder="e.g. Install & open Coin Rush"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-desc">Description & steps</Label>
          <Textarea
            id="c-desc"
            rows={4}
            maxLength={1000}
            placeholder="What should the publisher do, step by step?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
                  verification === value ? "border-primary bg-primary/10" : "border-border bg-card"
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
              required
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
              required
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
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {COUNTRIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-gold/40 bg-gold/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Star className="size-4 fill-gold text-gold-dark" />
              <div>
                <Label htmlFor="c-featured">Featured placement</Label>
                <p className="text-[11px] text-muted-foreground">Get more visibility in the marketplace.</p>
              </div>
            </div>
            <Switch id="c-featured" checked={featured} onCheckedChange={setFeatured} aria-label="Enable featured placement" />
          </div>
          {featured && (
            <div className="mt-3 grid grid-cols-2 items-end gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-featured-days">Featured days</Label>
                <Input
                  id="c-featured-days"
                  type="number"
                  min={1}
                  max={30}
                  value={featuredDays}
                  onChange={(e) => setFeaturedDays(e.target.value)}
                />
              </div>
              <p className="rounded-xl bg-card px-3 py-2 text-xs text-gold-dark">
                +${featuredFee.toFixed(2)} placement fee
              </p>
            </div>
          )}
        </div>

        {!canCreate && account && (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Not enough Campaign Balance. You have ${account.spendable.toFixed(2)}, need ${budgetNum.toFixed(2)}.
          </p>
        )}

        <Button
          type="submit"
          variant="jade"
          size="lg"
          className="w-full"
          data-testid="create-campaign-submit"
          disabled={mutation.isPending || !canCreate}
        >
          {mutation.isPending ? "Creating..." : "Create campaign"}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          Campaign starts as a draft. You can edit it, then submit for review to go live.
        </p>
      </form>
    </AppShell>
  );
}
