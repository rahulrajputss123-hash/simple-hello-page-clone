import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
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
import { createCampaign, listCategories } from "@/lib/marketplace.functions";
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
  const categoriesFn = useServerFn(listCategories);

  const categories = useQuery({
    queryKey: ["marketplace-categories"],
    queryFn: () => categoriesFn({}),
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [verification, setVerification] = useState<Verification>("proof");
  const [reward, setReward] = useState("0.50");
  const [budget, setBudget] = useState("100");
  const [country, setCountry] = useState("Worldwide");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [landingUrl, setLandingUrl] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [featured, setFeatured] = useState(false);
  const [featuredDays, setFeaturedDays] = useState("7");

  const selectedCategory = useMemo(
    () => categories.data?.find((c) => c.id === categoryId),
    [categories.data, categoryId]
  );

  const rewardNum = Number(reward) || 0;
  const budgetNum = Number(budget) || 0;
  const conversions = Math.floor(budgetNum / (rewardNum || 1));
  const featuredFee = useMemo(() => (featured ? Number(featuredDays) * 2 : 0), [featured, featuredDays]);

  const account = overview?.account;
  const totalCost = budgetNum + (featured ? featuredFee : 0);
  const canCreate = account?.status === "active" && account.spendable >= totalCost;

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
          categoryId,
          subcategoryId: subcategoryId || undefined,
          landingUrl: landingUrl.trim(),
          estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
          featured: featured,
          featuredDays: featured ? Number(featuredDays) : undefined,
        },
      }),
    onSuccess: async (result) => {
      await Promise.all([refreshOverview(), queryClient.invalidateQueries({ queryKey: ["my-campaigns"] })]);
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
          if (!categoryId) {
            toast.error("Select a category");
            return;
          }
          if (!landingUrl.trim()) {
            toast.error("Enter a destination URL");
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

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="c-category">Category</Label>
            <select
              id="c-category"
              className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setSubcategoryId(""); // Reset subcategory when category changes
              }}
              required
            >
              <option value="">Select category</option>
              {(categories.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-subcategory">Subcategory (optional)</Label>
            <select
              id="c-subcategory"
              className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              disabled={!selectedCategory}
            >
              <option value="">None</option>
              {(selectedCategory?.subcategories ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="c-landing-url">Destination URL</Label>
          <Input
            id="c-landing-url"
            type="url"
            maxLength={2048}
            placeholder="https://example.com/campaign-page"
            value={landingUrl}
            onChange={(e) => setLandingUrl(e.target.value)}
            required
          />
          <p className="text-[11px] text-muted-foreground">Must be an HTTPS URL</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="c-estimated-minutes">Estimated time (optional)</Label>
          <Input
            id="c-estimated-minutes"
            type="number"
            min={1}
            max={1440}
            placeholder="e.g. 10"
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">How many minutes to complete? (1-1440)</p>
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
            <Switch
              id="c-featured"
              checked={featured}
              onCheckedChange={setFeatured}
              aria-label="Enable featured placement"
            />
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
            Not enough Campaign Balance. You have ${account.spendable.toFixed(2)}, need ${totalCost.toFixed(2)}
            {featured && ` ($${budgetNum.toFixed(2)} budget + $${featuredFee.toFixed(2)} featured)`}.
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
