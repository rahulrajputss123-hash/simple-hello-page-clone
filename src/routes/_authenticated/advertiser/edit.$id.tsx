import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Edit, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { BackLink } from "@/components/marketplace/Preview";
import { editCampaign, getCampaignForEdit, listCategories } from "@/lib/marketplace.functions";
import { useRole } from "@/lib/marketplace/role";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/advertiser/edit/$id")({
  head: () => ({ meta: [{ title: "Edit Campaign — CashGPT" }] }),
  component: EditCampaignPage,
});

type ProofField = { key: string; label: string; required: boolean; maxLen: number };

function EditCampaignPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { overview, refreshOverview } = useRole();
  const editFn = useServerFn(editCampaign);
  const getCampaign = useServerFn(getCampaignForEdit);
  const categoriesFn = useServerFn(listCategories);

  const campaign = useQuery({
    queryKey: ["campaign-edit", id],
    queryFn: () => getCampaign({ data: { campaignId: id } }),
  });

  const categories = useQuery({
    queryKey: ["marketplace-categories"],
    queryFn: () => categoriesFn({}),
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [proofDescription, setProofDescription] = useState("");
  const [proofMode, setProofMode] = useState<"screenshot" | "text" | "both" | "either" | null>(null);
  const [proofMinImages, setProofMinImages] = useState(1);
  const [proofMaxImages, setProofMaxImages] = useState(3);
  const [proofFields, setProofFields] = useState<ProofField[]>([]);
  const [reward, setReward] = useState("0.50");
  const [slots, setSlots] = useState("50");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [landingUrl, setLandingUrl] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [proofExampleUrl, setProofExampleUrl] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [eligibilityNote, setEligibilityNote] = useState("");
  const [dailyLimit, setDailyLimit] = useState("");
  const [reviewWindow, setReviewWindow] = useState(24);
  const [devices, setDevices] = useState<string[]>([]);
  const [allDevices, setAllDevices] = useState(false);
  const [resubmit, setResubmit] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [minSlots, setMinSlots] = useState(15);

  const isDraft = campaign.data?.status === "draft";
  const isRejected = campaign.data?.status === "rejected";
  const isPaused = campaign.data?.status === "paused";
  const canEdit = isDraft || isRejected || isPaused;

  // Pre-fill form when campaign data loads
  useEffect(() => {
    if (campaign.data) {
      const c = campaign.data;
      setTitle(c.name || "");
      setDescription(c.description || "");
      setProofDescription(c.proofDescription || "");
      setProofMinImages(c.proofMinImages || 1);
      setProofMaxImages(c.proofMaxImages || 3);
      setProofFields(c.proofFields || []);
      
      // Set proofMode from campaign_options, or derive it from existing fields
      if (c.proofMode) {
        setProofMode(c.proofMode as "screenshot" | "text" | "both" | "either");
      } else {
        // Derive for old campaigns without proof_mode
        const minImg = c.proofMinImages || 1;
        const hasFields = (c.proofFields || []).length > 0;
        const hasRequiredFields = (c.proofFields || []).some((f: any) => f.required);
        
        if (minImg >= 1 && !hasRequiredFields) {
          setProofMode("screenshot");
        } else if (minImg === 0 && hasFields) {
          setProofMode("text");
        } else if (minImg >= 1 && hasRequiredFields) {
          setProofMode("both");
        } else {
          setProofMode("screenshot"); // fallback
        }
      }
      
      setReward(c.publisherReward?.toString() || "0.50");
      setSlots(c.maxCompletions?.toString() || "50");
      setCategoryId(c.categoryId || "");
      setSubcategoryId(c.subcategoryId || "");
      setLandingUrl(c.landingUrl || "");
      setEstimatedMinutes(c.estimatedMinutes?.toString() || "");
      setProofExampleUrl(c.proofExampleUrl || "");
      setTrackingUrl(c.trackingUrl || "");
      setEligibilityNote(c.eligibilityNotes || "");
      setDailyLimit(c.dailyLimit?.toString() || "");
      setReviewWindow(c.reviewWindowHours || 24);
      
      // Set devices - if empty array, show all three as selected
      const campaignDevices = c.devices || [];
      if (campaignDevices.length === 0) {
        setDevices(["android", "ios", "desktop"]);
        setAllDevices(true);
      } else {
        setDevices(campaignDevices);
        setAllDevices(campaignDevices.length === 3);
      }
    }
  }, [campaign.data]);

  // Check if user is admin and calculate minimum slots
  useEffect(() => {
    async function checkAdminAndMinSlots() {
      if (!overview?.account?.userId || !campaign.data) return;
      
      // Check if user has admin role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", overview.account.userId)
        .eq("role", "admin")
        .maybeSingle();
      
      setIsAdmin(!!roleData);
      
      // Calculate minimum slots (used + reserved)
      const { data: minSlotsData } = await supabase.rpc("mkt_campaign_slot_usage", {
        p_campaign_id: campaign.data.id,
      });
      
      const calculatedMin = minSlotsData || 15;
      setMinSlots(Math.max(15, calculatedMin));
    }
    
    void checkAdminAndMinSlots();
  }, [campaign.data, overview?.account?.userId]);

  const selectedCategory = useMemo(
    () => categories.data?.find((c) => c.id === categoryId),
    [categories.data, categoryId],
  );

  const generateFieldKey = (label: string): string => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50);
  };

  const addProofField = () => {
    if (proofFields.length >= 5) {
      toast.error("Maximum 5 fields allowed");
      return;
    }
    setProofFields([...proofFields, { key: "", label: "", required: false, maxLen: 80 }]);
  };

  const updateProofField = (index: number, updates: Partial<ProofField>) => {
    const newFields = [...proofFields];
    newFields[index] = { ...newFields[index], ...updates };
    if (updates.label !== undefined) {
      newFields[index].key = generateFieldKey(updates.label);
    }
    setProofFields(newFields);
  };

  const removeProofField = (index: number) => {
    setProofFields(proofFields.filter((_, i) => i !== index));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const updates: Record<string, any> = { campaignId: id };

      // Helper to check if a value changed (treat null, undefined, and "" as equal)
      const normalize = (val: any) => (val === null || val === undefined || val === "" ? null : val);
      const changed = (newVal: any, oldVal: any) => normalize(newVal) !== normalize(oldVal);

      // Only include changed fields
      if (changed(title, campaign.data?.name)) updates.title = title.trim();
      if (changed(description, campaign.data?.description)) updates.description = description.trim();
      if (changed(landingUrl, campaign.data?.landingUrl)) updates.landingUrl = landingUrl.trim();

      const estMin = estimatedMinutes ? Number(estimatedMinutes) : null;
      if (changed(estMin, campaign.data?.estimatedMinutes)) {
        updates.estimatedMinutes = estMin;
      }

      if (changed(proofDescription, campaign.data?.proofDescription)) {
        updates.proofDescription = proofDescription.trim();
      }
      if (proofMode !== campaign.data?.proofMode) {
        updates.proofMode = proofMode;
      }
      if (proofMinImages !== campaign.data?.proofMinImages) {
        updates.proofMinImages = proofMinImages;
      }
      if (proofMaxImages !== campaign.data?.proofMaxImages) {
        updates.proofMaxImages = proofMaxImages;
      }
      if (JSON.stringify(proofFields) !== JSON.stringify(campaign.data?.proofFields || [])) {
        updates.proofFields = proofFields;
      }
      if (changed(proofExampleUrl, campaign.data?.proofExampleUrl)) {
        updates.proofExampleUrl = proofExampleUrl || null;
      }
      if (changed(trackingUrl, campaign.data?.trackingUrl)) {
        updates.trackingUrl = trackingUrl.trim() || null;
      }
      if (changed(eligibilityNote, campaign.data?.eligibilityNotes)) {
        updates.eligibilityNote = eligibilityNote.trim() || null;
      }

      const dayLim = dailyLimit ? Number(dailyLimit) : null;
      if (changed(dayLim, campaign.data?.dailyLimit)) {
        updates.dailyLimit = dayLim;
      }

      if (reviewWindow !== campaign.data?.reviewWindowHours) {
        updates.reviewWindow = reviewWindow;
      }

      // Devices - send empty array if all three selected, otherwise send selected devices
      const campaignDevices = campaign.data?.devices || [];
      const normalizedCampaignDevices = campaignDevices.length === 0 ? ["android", "ios", "desktop"] : campaignDevices;
      const normalizedCurrentDevices = devices.length === 3 ? [] : devices;
      const normalizedOriginalDevices = normalizedCampaignDevices.length === 3 ? [] : normalizedCampaignDevices;
      
      if (JSON.stringify(normalizedCurrentDevices.sort()) !== JSON.stringify(normalizedOriginalDevices.sort())) {
        updates.devices = normalizedCurrentDevices;
      }

      // Category and subcategory are read-only in edit mode (never sent)
      // The database guard rejects them anyway

      // Budget fields - only for draft campaigns
      if (isDraft) {
        const rewardNum = Number(reward);
        const slotsNum = Number(slots);
        if (rewardNum !== campaign.data?.publisherReward) {
          updates.reward = rewardNum;
        }
        if (slotsNum !== campaign.data?.maxCompletions) {
          updates.slots = slotsNum;
        }
      }

      updates.resubmit = resubmit;

      return editFn({ data: updates });
    },
    onSuccess: async () => {
      await Promise.all([
        refreshOverview(),
        queryClient.invalidateQueries({ queryKey: ["my-campaigns"] }),
        queryClient.invalidateQueries({ queryKey: ["campaign-edit", id] }),
      ]);
      toast.success(resubmit ? "Campaign updated and submitted for review" : "Campaign updated");
      navigate({ to: "/advertiser/campaigns" });
    },
    onError: (err) => {
      const msg =
        err instanceof Error ? err.message.replace(/^[A-Z_]+: /, "") : "Something went wrong";
      toast.error("Couldn't update campaign", { description: msg });
    },
  });

  if (campaign.isPending || categories.isPending) {
    return (
      <AppShell subtitle="Advertiser" mainClass="page-fade-in">
        <BackLink to="/advertiser/campaigns" label="Back to campaigns" />
        <SectionHeading
          variant="ribbon"
          size="page"
          icon={Edit}
          iconSrc="/icons/icon-create-campaign-v2.webp"
          title="Edit Campaign"
          subtitle="Loading..."
          className="mb-2"
        />
        <div className="surface-card mt-3 space-y-4 p-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </AppShell>
    );
  }

  if (campaign.isError || !campaign.data) {
    return (
      <AppShell subtitle="Advertiser" mainClass="page-fade-in">
        <BackLink to="/advertiser/campaigns" label="Back to campaigns" />
        <div className="surface-card mt-3 p-4 text-center text-destructive">
          Campaign not found or you don't have permission to edit it.
        </div>
      </AppShell>
    );
  }

  if (!canEdit) {
    return (
      <AppShell subtitle="Advertiser" mainClass="page-fade-in">
        <BackLink to="/advertiser/campaigns" label="Back to campaigns" />
        <div className="surface-card mt-3 p-4 text-center">
          <p className="font-semibold">Cannot edit this campaign</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Only draft, rejected, or paused campaigns can be edited.
          </p>
          <p className="mt-2 text-sm">
            Status: <span className="font-medium">{campaign.data.status}</span>
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell subtitle="Advertiser" mainClass="page-fade-in">
      <BackLink to="/advertiser/campaigns" label="Back to campaigns" />
      <SectionHeading
        variant="ribbon"
        size="page"
        icon={Edit}
        iconSrc="/icons/icon-create-campaign-v2.webp"
        title="Edit Campaign"
        subtitle={
          isDraft
            ? "Edit any field, including slots and reward."
            : isRejected
              ? "Make changes and resubmit for review."
              : "Edit content fields only. Pause to edit slots/reward requires draft status."
        }
        className="mb-2"
      />

      <form
        className="surface-card mt-3 space-y-4 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!landingUrl.trim()) {
            toast.error("Enter a destination URL");
            return;
          }
          if (campaign.data?.verificationMode === "auto" && !trackingUrl.trim()) {
            toast.error("Enter tracking URL for auto verification");
            return;
          }
          if (campaign.data?.verificationMode === "proof") {
            if (!proofDescription.trim() || proofDescription.length < 10) {
              toast.error("Proof instructions required (at least 10 characters)");
              return;
            }
            if (devices.length === 0) {
              toast.error("Select at least one device");
              return;
            }
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
            <Label htmlFor="c-category">Category (read-only)</Label>
            <div className="flex h-11 items-center rounded-xl border border-border bg-muted px-3 text-sm text-muted-foreground">
              {selectedCategory?.name || "—"}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-subcategory">Subcategory (read-only)</Label>
            <div className="flex h-11 items-center rounded-xl border border-border bg-muted px-3 text-sm text-muted-foreground">
              {subcategoryId
                ? selectedCategory?.subcategories?.find((s) => s.id === subcategoryId)?.name || "—"
                : "None"}
            </div>
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
        </div>

        {isDraft && (
          <div className="space-y-3 rounded-xl border border-gold/40 bg-gold/10 p-4">
            <p className="text-sm font-semibold text-gold-dark">
              ⚠️ Slots and reward can only be edited in draft status
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-reward">Reward per completion ($)</Label>
                <Input
                  id="c-reward"
                  type="number"
                  step="0.01"
                  min={0.05}
                  max={1000}
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-slots">Number of slots</Label>
                <Input
                  id="c-slots"
                  type="number"
                  min={isAdmin ? minSlots : campaign.data.maxCompletions}
                  max={100000}
                  value={slots}
                  onChange={(e) => setSlots(e.target.value)}
                  required
                />
                {isAdmin && minSlots > 15 && (
                  <p className="text-[11px] text-muted-foreground">
                    Minimum {minSlots} slots (campaign has {minSlots} already consumed or reserved)
                  </p>
                )}
                {!isAdmin && (
                  <p className="text-[11px] text-muted-foreground">
                    You can only increase slots. Admins can decrease their own campaigns.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {!isDraft && (
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">
              Reward: <span className="font-medium">${campaign.data.publisherReward}</span> •
              Slots: <span className="font-medium">{campaign.data.maxCompletions}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Slots and reward cannot be changed in {campaign.data.status} status.
            </p>
          </div>
        )}

        {campaign.data?.verificationMode === "proof" && (
          <div className="space-y-3 rounded-xl border border-gold/40 bg-gold/10 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="c-proof-instructions">Instructions for proof *</Label>
              <Textarea
                id="c-proof-instructions"
                rows={2}
                minLength={10}
                maxLength={500}
                placeholder="e.g. Upload a screenshot showing the app installed"
                value={proofDescription}
                onChange={(e) => setProofDescription(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-proof-min-images">Min images</Label>
                <Input
                  id="c-proof-min-images"
                  type="number"
                  min={0}
                  max={5}
                  value={proofMinImages}
                  onChange={(e) => setProofMinImages(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-proof-max-images">Max images</Label>
                <Input
                  id="c-proof-max-images"
                  type="number"
                  min={Math.max(1, proofMinImages)}
                  max={5}
                  value={proofMaxImages}
                  onChange={(e) => setProofMaxImages(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Custom fields</Label>
                {proofFields.length < 5 && (
                  <Button type="button" variant="outline" size="sm" onClick={addProofField}>
                    + Add field
                  </Button>
                )}
              </div>
              {proofFields.map((field, index) => (
                <div key={index} className="space-y-2 rounded-lg border border-border bg-card p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Field label (e.g. Username, Order ID)"
                        value={field.label}
                        maxLength={60}
                        onChange={(e) => updateProofField(index, { label: e.target.value })}
                        required
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          min={10}
                          max={500}
                          placeholder="Max length"
                          value={field.maxLen}
                          onChange={(e) =>
                            updateProofField(index, { maxLen: Number(e.target.value) })
                          }
                        />
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) =>
                              updateProofField(index, { required: e.target.checked })
                            }
                          />
                          Required
                        </label>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProofField(index)}
                      className="shrink-0 text-destructive hover:text-destructive/80"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-review-window">Review within *</Label>
              <select
                id="c-review-window"
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                value={reviewWindow}
                onChange={(e) => setReviewWindow(Number(e.target.value))}
                required
              >
                <option value={6}>6 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours (recommended)</option>
                <option value={48}>48 hours</option>
                <option value={72}>72 hours</option>
                <option value={168}>7 days</option>
              </select>
              <p className="text-[11px] text-muted-foreground">
                If you do not review a submission in this time, it is approved automatically and
                the earner is paid.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Devices *</Label>
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card p-3">
                  <span className="text-sm font-medium">All devices</span>
                  <input
                    type="checkbox"
                    checked={allDevices}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setAllDevices(checked);
                      if (checked) {
                        setDevices(["android", "ios", "desktop"]);
                      }
                    }}
                    className="size-4"
                  />
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["android", "ios", "desktop"] as const).map((device) => (
                    <label
                      key={device}
                      className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-colors ${
                        devices.includes(device)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={devices.includes(device)}
                        onChange={(e) => {
                          let newDevices: string[];
                          if (e.target.checked) {
                            newDevices = [...devices, device];
                          } else {
                            newDevices = devices.filter((d) => d !== device);
                          }
                          setDevices(newDevices);
                          // Update "All devices" toggle
                          setAllDevices(newDevices.length === 3);
                        }}
                        className="hidden"
                      />
                      {device === "android" ? "Android" : device === "ios" ? "iOS" : "Desktop"}
                    </label>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Select at least one device. If all three are selected, the offer will be available on all devices.
              </p>
            </div>
          </div>
        )}

        {(isDraft || isRejected) && (
          <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <input
              type="checkbox"
              id="resubmit"
              checked={resubmit}
              onChange={(e) => setResubmit(e.target.checked)}
              className="size-4"
            />
            <Label htmlFor="resubmit" className="text-sm">
              Submit for review after saving changes
            </Label>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: "/advertiser/campaigns" })}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="jade"
            className="flex-1"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {resubmit ? "Save & Submit" : "Save Changes"}
          </Button>
        </div>
      </form>
    </AppShell>
  );
}
