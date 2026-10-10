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
import { PostbackSecretModal } from "@/components/marketplace/PostbackSecretModal";
import { createCampaign, listCategories } from "@/lib/marketplace.functions";
import { useRole } from "@/lib/marketplace/role";
import { campaignTotals } from "@/lib/marketplace/pricing";

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
  const [slots, setSlots] = useState("50"); // Slots instead of budget
  const [country, setCountry] = useState("Worldwide");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [landingUrl, setLandingUrl] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [featured, setFeatured] = useState(false);
  const [featuredDays, setFeaturedDays] = useState("7");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [ipAllowlist, setIpAllowlist] = useState("");
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [showPostback, setShowPostback] = useState(false);
  const [postbackInfo, setPostbackInfo] = useState<{ url: string; secret: string } | null>(null);

  const selectedCategory = useMemo(
    () => categories.data?.find((c) => c.id === categoryId),
    [categories.data, categoryId]
  );

  const rewardNum = Number(reward) || 0;
  const slotsNum = Number(slots) || 0;
  const platformFeePercent = overview?.settings?.platformFeePercent ?? 5;
  const featuredPricePerDay = overview?.settings?.featuredPricePerDay ?? 2;
  const feesEnabled = overview?.settings?.feesEnabled ?? false;
  const campaignFeeUsd = overview?.settings?.campaignFeeUsd ?? 0.5;
  const campaignFeeType = overview?.settings?.campaignFeeType ?? "per_campaign";
  
  const featuredDaysNum = Number(featuredDays) || 0;
  const featuredFee = featured && featuredDaysNum > 0 ? featuredDaysNum * featuredPricePerDay : 0;
  
  // Use pricing module for calculations
  const totals = useMemo(
    () =>
      campaignTotals({
        slots: slotsNum,
        reward: rewardNum,
        feePercent: platformFeePercent,
        feesEnabled,
        feeUsd: campaignFeeUsd,
        feeType: campaignFeeType,
        featuredFee,
      }),
    [slotsNum, rewardNum, platformFeePercent, feesEnabled, campaignFeeUsd, campaignFeeType, featuredFee]
  );

  const account = overview?.account;
  const canCreate = account?.status === "active" && account.spendable >= totals.total && slotsNum >= 15 && rulesAccepted;

  const mutation = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          title: title.trim(),
          description: description.trim(),
          verification,
          reward: rewardNum,
          slots: slotsNum,
          countries: country === "Worldwide" ? ["*"] : [country],
          categoryId,
          subcategoryId: subcategoryId || undefined,
          landingUrl: landingUrl.trim(),
          estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
          featured: featured,
          featuredDays: featured ? Number(featuredDays) : undefined,
          trackingUrl: verification === "auto" && trackingUrl ? trackingUrl.trim() : undefined,
          ipAllowlist: ipAllowlist ? ipAllowlist.split(",").map((ip) => ip.trim()).filter(Boolean) : undefined,
          rulesAccepted,
        },
      }),
    onSuccess: async (result) => {
      await Promise.all([refreshOverview(), queryClient.invalidateQueries({ queryKey: ["my-campaigns"] })]);
      
      // Store postback info if returned
      if (result.postbackUrl && result.postbackSecret) {
        setPostbackInfo({ url: result.postbackUrl, secret: result.postbackSecret });
        setShowPostback(true);
      }
      
      // Handle featured placement result
      if (result.featuredApplied === false && result.featuredError) {
        toast.warning(`Campaign submitted. Featured placement wasn't applied: ${result.featuredError}`);
      } else if (result.featuredApplied === true) {
        toast.success("Campaign submitted for review with featured placement");
      } else {
        toast.success("Campaign submitted for review");
      }
      
      // Don't navigate if showing postback info
      if (!result.postbackUrl) {
        navigate({ to: "/advertiser/campaigns" });
      }
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
        iconSrc="/icons/icon-create-campaign-v2.png"
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
            if (slotsNum < 15) {
              toast.error("Minimum 15 slots required");
              return;
            }
            if (!rulesAccepted) {
              toast.error("Accept offer rules to continue");
              return;
            }
            toast.error("Add funds first", {
              description: `You need at least $${totals.total.toFixed(2)} in your Campaign Balance.`,
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
          if (verification === "auto" && !trackingUrl.trim()) {
            toast.error("Enter tracking URL for auto verification");
            return;
          }
          if (verification === "auto" && !trackingUrl.includes("{click_id}")) {
            toast.error("Tracking URL must contain {click_id} placeholder");
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

        {verification === "auto" && (
          <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="c-tracking-url">Tracking URL *</Label>
              <Input
                id="c-tracking-url"
                type="url"
                maxLength={2048}
                placeholder="https://yoursite.com/track?click_id={click_id}"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Must be HTTPS and include <code className="rounded bg-muted px-1">{"click_id"}</code> placeholder
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-ip-allowlist">IP Allowlist (optional)</Label>
              <Input
                id="c-ip-allowlist"
                placeholder="192.168.1.1, 10.0.0.1"
                value={ipAllowlist}
                onChange={(e) => setIpAllowlist(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">Comma-separated IPs that can send postbacks</p>
            </div>
          </div>
        )}

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
            <Label htmlFor="c-slots">Number of slots</Label>
            <div className="flex gap-2 mb-2">
              {[15, 50, 100, 500].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSlots(preset.toString())}
                  className={`flex-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
                    Number(slots) === preset
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <Input
              id="c-slots"
              type="number"
              min={15}
              step={1}
              inputMode="numeric"
              value={slots}
              onChange={(e) => setSlots(e.target.value)}
              required
            />
            <p className="text-[11px] text-muted-foreground">Minimum 15 slots</p>
          </div>
        </div>
        <div className="rounded-xl bg-mint/15 px-3 py-2 text-xs text-primary space-y-1">
          <div className="flex justify-between">
            <span>Slots × Reward:</span>
            <strong>${(slotsNum * rewardNum).toFixed(2)}</strong>
          </div>
          <div className="flex justify-between">
            <span>Platform fee ({platformFeePercent}%):</span>
            <strong>${((slotsNum * rewardNum * platformFeePercent) / 100).toFixed(2)}</strong>
          </div>
          <div className="flex justify-between border-t border-primary/20 pt-1 mt-1">
            <span>Campaign budget:</span>
            <strong>${totals.allocation.toFixed(2)}</strong>
          </div>
          {totals.campaignFee > 0 && (
            <div className="flex justify-between">
              <span>Campaign fee ({campaignFeeType === "per_campaign" ? "one-time" : `${slotsNum} slots`}):</span>
              <strong>${totals.campaignFee.toFixed(2)}</strong>
            </div>
          )}
          {totals.featuredFee > 0 && (
            <div className="flex justify-between">
              <span>Featured placement ({featuredDaysNum}d):</span>
              <strong>${totals.featuredFee.toFixed(2)}</strong>
            </div>
          )}
          {(totals.campaignFee > 0 || totals.featuredFee > 0) && (
            <div className="flex justify-between border-t border-primary/20 pt-1 mt-1 font-semibold">
              <span>Total cost:</span>
              <strong>${totals.total.toFixed(2)}</strong>
            </div>
          )}
        </div>

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

        <div className="space-y-3 rounded-xl border border-muted-foreground/20 bg-muted/30 p-4">
          <div>
            <h3 className="text-sm font-semibold mb-2">Offer Rules</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">✅ Allowed:</p>
                <p>App install, signup, website visit, free/paid trial, purchase, lead form, survey, video watch, social actions with proof, app testing.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">❌ Not allowed:</p>
                <p>Requests for card/ID/OTP, crypto wallet connect/seed phrase, adult/illegal/misleading offers, phishing/malware, APKs outside stores, fake reviews, impersonation.</p>
              </div>
            </div>
          </div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rulesAccepted}
              onChange={(e) => setRulesAccepted(e.target.checked)}
              className="mt-0.5"
              required
            />
            <span className="text-xs text-muted-foreground">
              I have read and agree to follow the offer rules above
            </span>
          </label>
        </div>

        {!canCreate && account && (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Not enough Campaign Balance. You have ${account.spendable.toFixed(2)}, need ${totals.total.toFixed(2)}
            {(totals.campaignFee > 0 || totals.featuredFee > 0) && ` ($${totals.allocation.toFixed(2)} budget${totals.campaignFee > 0 ? ` + $${totals.campaignFee.toFixed(2)} fee` : ""}${totals.featuredFee > 0 ? ` + $${totals.featuredFee.toFixed(2)} featured` : ""})`}.
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

      {/* Postback Info Modal */}
      <PostbackSecretModal
        open={showPostback && postbackInfo !== null}
        onClose={() => {
          setShowPostback(false);
          navigate({ to: "/advertiser/campaigns" });
        }}
        postbackUrl={postbackInfo?.url || ""}
        postbackSecret={postbackInfo?.secret || ""}
      />
    </AppShell>
  );
}
