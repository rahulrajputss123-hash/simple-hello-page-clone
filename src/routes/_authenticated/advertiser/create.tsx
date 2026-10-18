import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PlusCircle, Star, X, Upload, ChevronRight } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/advertiser/create")({
  head: () => ({ meta: [{ title: "Create Campaign — CashGPT" }] }),
  component: CreateCampaignPage,
});

const COUNTRIES = [
  "Worldwide",
  "United States",
  "India",
  "United Kingdom",
  "Canada",
  "Brazil",
  "Germany",
];

type Verification = "auto" | "proof";
type ProofMode = "screenshot" | "text" | "both" | "either";
type ProofField = { key: string; label: string; required: boolean; maxLen: number };

const PROOF_TEMPLATES: Record<
  string,
  {
    title: string;
    description: string;
    instructions: string;
    type: ProofMode;
    minImages: number;
    maxImages: number;
    fields: Omit<ProofField, "key">[];
  }
> = {
  "app-install": {
    title: "Install an app",
    description: "Users will submit a screenshot and their username",
    instructions: "Install the app, create an account, and upload a screenshot showing you're logged in with your username visible",
    type: "both",
    minImages: 1,
    maxImages: 2,
    fields: [{ label: "Username", required: true, maxLen: 80 }],
  },
  "social-follow": {
    title: "Follow or like on social media",
    description: "Users will submit a screenshot and their profile link",
    instructions: "Follow/like the page and upload a screenshot showing you completed the action. Also provide your profile link",
    type: "both",
    minImages: 1,
    maxImages: 2,
    fields: [{ label: "Your profile link", required: true, maxLen: 200 }],
  },
  survey: {
    title: "Fill a survey or form",
    description: "Users will submit a completion code",
    instructions: "Complete the survey or form and enter the completion code shown at the end",
    type: "text",
    minImages: 0,
    maxImages: 1,
    fields: [{ label: "Completion code", required: true, maxLen: 80 }],
  },
  purchase: {
    title: "Buy or sign up",
    description: "Users will submit a screenshot and order/account ID",
    instructions: "Complete the purchase or sign up, then upload a screenshot of your confirmation and provide your order or account ID",
    type: "both",
    minImages: 1,
    maxImages: 3,
    fields: [{ label: "Order or account ID", required: true, maxLen: 100 }],
  },
};

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
  const [proofMode, setProofMode] = useState<ProofMode>("screenshot");
  const [proofDescription, setProofDescription] = useState("");
  const [proofMinImages, setProofMinImages] = useState(1);
  const [proofMaxImages, setProofMaxImages] = useState(3);
  const [proofFields, setProofFields] = useState<ProofField[]>([]);
  const [reward, setReward] = useState("0.50");
  const [slots, setSlots] = useState("50"); // Slots instead of budget
  const [country, setCountry] = useState("Worldwide");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [landingUrl, setLandingUrl] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [reviewWindow, setReviewWindow] = useState(24); // Default 24h
  const [proofExampleFile, setProofExampleFile] = useState<File | null>(null);
  const [proofExampleUrl, setProofExampleUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("00:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("23:59");
  const [devices, setDevices] = useState<string[]>([]); // android, ios, desktop
  const [eligibilityNote, setEligibilityNote] = useState("");
  const [dailyLimit, setDailyLimit] = useState("");
  const [featured, setFeatured] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [featuredDays, setFeaturedDays] = useState("7");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [ipAllowlist, setIpAllowlist] = useState("");
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [showPostback, setShowPostback] = useState(false);
  const [postbackInfo, setPostbackInfo] = useState<{ url: string; secret: string } | null>(null);
  const [allDevices, setAllDevices] = useState(true); // "All devices" toggle

  const selectedCategory = useMemo(
    () => categories.data?.find((c) => c.id === categoryId),
    [categories.data, categoryId],
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
    [
      slotsNum,
      rewardNum,
      platformFeePercent,
      feesEnabled,
      campaignFeeUsd,
      campaignFeeType,
      featuredFee,
    ],
  );

  const account = overview?.account;
  const canCreate =
    account?.status === "active" &&
    account.spendable >= totals.total &&
    slotsNum >= 15 &&
    rulesAccepted;

  const generateFieldKey = (label: string): string => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50);
  };

  const applyTemplate = (templateKey: string) => {
    const template = PROOF_TEMPLATES[templateKey];
    if (!template) return;

    // Check if user has already entered proof settings
    const hasExistingSettings =
      proofDescription.trim().length > 0 || proofFields.length > 0;

    if (hasExistingSettings) {
      if (!confirm("This will replace your proof settings. Continue?")) {
        return;
      }
    }

    setProofDescription(template.instructions);
    setProofMode(template.type);
    setProofMinImages(template.minImages);
    setProofMaxImages(template.maxImages);
    setProofFields(template.fields.map((f) => ({ ...f, key: generateFieldKey(f.label) })));
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
    // Auto-generate key from label
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
      let uploadedExampleUrl: string | undefined;

      // Upload proof example if provided
      if (proofExampleFile) {
        const path = `${overview?.account?.userId}/${Date.now()}-${proofExampleFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("campaign-proof-examples")
          .upload(path, proofExampleFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Failed to upload proof example: ${uploadError.message}`);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("campaign-proof-examples").getPublicUrl(uploadData.path);

        uploadedExampleUrl = publicUrl;
      }

      // Build dates in UTC
      const startsAt =
        startDate && startTime ? new Date(`${startDate}T${startTime}`).toISOString() : undefined;
      const endsAt =
        endDate && endTime ? new Date(`${endDate}T${endTime}`).toISOString() : undefined;

      return createFn({
        data: {
          title: title.trim(),
          description: description.trim(),
          verification,
          reward: rewardNum,
          slots: slotsNum,
          countries:
            country === "Worldwide"
              ? []
              : [
                  {
                    "United States": "US",
                    India: "IN",
                    "United Kingdom": "GB",
                    Canada: "CA",
                    Brazil: "BR",
                    Germany: "DE",
                  }[country] ?? country,
                ],
          categoryId,
          subcategoryId: subcategoryId || undefined,
          landingUrl: landingUrl.trim(),
          estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
          featured: featured,
          featuredDays: featured ? Number(featuredDays) : undefined,
          trackingUrl: verification === "auto" && trackingUrl ? trackingUrl.trim() : undefined,
          ipAllowlist: ipAllowlist
            ? ipAllowlist
                .split(",")
                .map((ip) => ip.trim())
                .filter(Boolean)
            : undefined,
          // Proof fields
          proofDescription:
            verification === "proof" && proofDescription ? proofDescription.trim() : undefined,
          proofMode: verification === "proof" ? proofMode : undefined,
          proofMinImages: verification === "proof" ? proofMinImages : undefined,
          proofMaxImages: verification === "proof" ? proofMaxImages : undefined,
          proofFields: verification === "proof" && proofFields.length > 0 ? proofFields : undefined,
          // Required fields for proof verification
          reviewWindow: verification === "proof" ? reviewWindow : undefined,
          devices:
            verification === "proof"
              ? devices.length === 3
                ? [] // All devices selected = empty array
                : devices
              : undefined,
          // Advanced settings
          proofExampleUrl: uploadedExampleUrl || proofExampleUrl || undefined,
          startsAt,
          endsAt,
          eligibilityNote: eligibilityNote.trim() || undefined,
          dailyLimit: dailyLimit ? Number(dailyLimit) : undefined,
          rulesAccepted,
        },
      });
    },
    onSuccess: async (result) => {
      // Keep mutation in pending state during navigation
      await Promise.all([
        refreshOverview(),
        queryClient.invalidateQueries({ queryKey: ["my-campaigns"] }),
      ]);

      // Store postback info if returned
      if (result.postbackUrl && result.postbackSecret) {
        setPostbackInfo({ url: result.postbackUrl, secret: result.postbackSecret });
        setShowPostback(true);
      }

      // Handle featured placement result
      if (result.featuredApplied === false && result.featuredError) {
        toast.warning(
          `Campaign submitted. Featured placement wasn't applied: ${result.featuredError}`,
        );
      } else if (result.featuredApplied === true) {
        toast.success("Campaign submitted for review with featured placement");
      } else {
        toast.success("Campaign submitted for review");
      }

      // Don't navigate if showing postback info
      if (!result.postbackUrl) {
        // Navigation happens synchronously, keeping button disabled
        navigate({ to: "/advertiser/campaigns" });
      }
      // Button remains disabled until navigation completes or modal closes
    },
    onError: (err) => {
      const msg =
        err instanceof Error ? err.message.replace(/^[A-Z_]+: /, "") : "Something went wrong";
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
        iconSrc="/icons/icon-create-campaign-v2.webp"
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
          if (
            startDate &&
            endDate &&
            new Date(`${endDate}T${endTime}`) <= new Date(`${startDate}T${startTime}`)
          ) {
            toast.error("End date must be after start date");
            return;
          }
          if (dailyLimit && (Number(dailyLimit) < 1 || Number(dailyLimit) > slotsNum)) {
            toast.error(`Daily limit must be between 1 and ${slotsNum}`);
            return;
          }
          if (verification === "proof") {
            if (!proofDescription.trim() || proofDescription.length < 10) {
              toast.error("Proof instructions required (at least 10 characters)");
              return;
            }
            if (devices.length === 0) {
              toast.error("Select at least one device");
              return;
            }
            if (proofMode === "text" && proofFields.length === 0) {
              toast.error("Text proof requires at least one custom field");
              return;
            }
            if (proofMode === "screenshot" && proofMinImages < 1) {
              toast.error("Screenshot proof requires at least 1 image");
              return;
            }
            if (proofMode === "text" && proofMinImages === 0 && proofFields.length === 0) {
              toast.error("Text-only proof requires at least one field");
              return;
            }
            if ((proofMode === "either" || proofMode === "both") && proofMinImages === 0 && proofFields.length === 0) {
              toast.error("You must configure either images or custom fields");
              return;
            }
            // Check for duplicate field keys
            const keys = proofFields.map((f) => f.key);
            if (new Set(keys).size !== keys.length) {
              toast.error("Duplicate field labels detected - please use unique labels");
              return;
            }
            // Check required field labels
            for (const field of proofFields) {
              if (!field.label.trim() || field.label.length < 2) {
                toast.error("All field labels must be at least 2 characters");
                return;
              }
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
          <p className="text-[11px] text-muted-foreground">
            How many minutes to complete? (1-1440)
          </p>
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

        {verification === "proof" && (
          <div className="space-y-3 rounded-xl border border-gold/40 bg-gold/10 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="c-proof-instructions">Instructions for proof *</Label>
              <Textarea
                id="c-proof-instructions"
                rows={2}
                minLength={10}
                maxLength={500}
                placeholder="e.g. Upload a screenshot showing the app installed and opened with your username visible"
                value={proofDescription}
                onChange={(e) => setProofDescription(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Tell publishers exactly what proof they need to provide (10-500 chars)
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Proof type</Label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: "screenshot", label: "Screenshot only", desc: "Users must upload screenshots" },
                    { value: "text", label: "Text only", desc: "Users must fill the details you ask for" },
                    { value: "both", label: "Both required", desc: "Screenshot AND details" },
                    { value: "either", label: "Either one", desc: "Screenshot OR details, one is enough" },
                  ] as const
                ).map(({ value, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setProofMode(value);
                      if (value === "screenshot") {
                        setProofMinImages(1);
                        setProofMaxImages(3);
                        setProofFields([]);
                      } else if (value === "text") {
                        setProofMinImages(0);
                        setProofMaxImages(1);
                        if (proofFields.length === 0) {
                          setProofFields([
                            {
                              key: "completion_code",
                              label: "Completion code",
                              required: true,
                              maxLen: 80,
                            },
                          ]);
                        }
                      } else if (value === "both") {
                        setProofMinImages(1);
                        setProofMaxImages(3);
                        if (proofFields.length === 0) {
                          setProofFields([
                            { key: "username", label: "Username", required: true, maxLen: 80 },
                          ]);
                        }
                        // Set all fields to required for "both" mode
                        setProofFields((fields) => fields.map((f) => ({ ...f, required: true })));
                      } else if (value === "either") {
                        setProofMinImages(0);
                        setProofMaxImages(3);
                        if (proofFields.length === 0) {
                          setProofFields([
                            { key: "details", label: "Additional details", required: false, maxLen: 200 },
                          ]);
                        }
                        // Set all fields to optional for "either" mode
                        setProofFields((fields) => fields.map((f) => ({ ...f, required: false })));
                      }
                    }}
                    className={`rounded-xl border p-3 text-left ${
                      proofMode === value
                        ? "border-gold-dark bg-gold/20"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className={`text-sm font-medium ${proofMode === value ? "text-gold-dark" : ""}`}>
                      {label}
                    </div>
                    <div className={`mt-0.5 text-[11px] ${proofMode === value ? "text-gold-dark/80" : "text-muted-foreground"}`}>
                      {desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium hover:bg-background-alt"
              >
                <span>Need help? Use a ready-made template</span>
                <ChevronRight
                  className={`size-4 transition-transform ${showTemplates ? "rotate-90" : ""}`}
                />
              </button>

              {showTemplates && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {Object.entries(PROOF_TEMPLATES).map(([key, template]) => (
                    <div
                      key={key}
                      className="space-y-2 rounded-xl border border-border bg-card p-4"
                    >
                      <h3 className="font-semibold">{template.title}</h3>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => applyTemplate(key)}
                      >
                        Use this template
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {proofMode !== "text" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="c-proof-min-images">Min images</Label>
                  <Input
                    id="c-proof-min-images"
                    type="number"
                    min={proofMode === "text" ? 0 : proofMode === "either" ? 0 : 1}
                    max={5}
                    value={proofMinImages}
                    onChange={(e) =>
                      setProofMinImages(
                        Math.max(
                          proofMode === "text" ? 0 : proofMode === "either" ? 0 : 1,
                          Math.min(5, Number(e.target.value) || 1),
                        ),
                      )
                    }
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
                    onChange={(e) =>
                      setProofMaxImages(
                        Math.max(proofMinImages, Math.min(5, Number(e.target.value) || 3)),
                      )
                    }
                  />
                </div>
              </div>
            )}

            {proofMode !== "screenshot" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Custom fields</Label>
                  {proofFields.length < 5 && (
                    <Button type="button" variant="outline" size="sm" onClick={addProofField}>
                      + Add field
                    </Button>
                  )}
                </div>
                {proofFields.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    At least one field is required for text proof
                  </p>
                )}
                {proofFields.map((field, index) => (
                  <div
                    key={index}
                    className="space-y-2 rounded-lg border border-border bg-card p-3"
                  >
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
                              updateProofField(index, {
                                maxLen: Math.max(10, Math.min(500, Number(e.target.value) || 80)),
                              })
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
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {verification === "proof" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="c-review-window">Review within *</Label>
              <select
                id="c-review-window"
                className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
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
          </>
        )}

        {verification === "proof" && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 text-left text-sm font-semibold hover:bg-muted/50"
            >
              <span>Advanced settings</span>
              <span className="text-muted-foreground">{showAdvanced ? "−" : "+"}</span>
            </button>
            {showAdvanced && (
              <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                <div className="space-y-1.5">
                  <Label htmlFor="c-proof-example">Proof example (optional)</Label>
                  <div className="space-y-2">
                    {!proofExampleFile && !proofExampleUrl && (
                      <label
                        htmlFor="c-proof-example"
                        className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
                      >
                        <Upload className="size-4" />
                        <span>Upload example image (max 2 MB)</span>
                        <input
                          id="c-proof-example"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                toast.error("Image must be under 2 MB");
                                return;
                              }
                              setProofExampleFile(file);
                            }
                          }}
                        />
                      </label>
                    )}
                    {proofExampleFile && (
                      <div className="flex items-center justify-between rounded-xl border border-border bg-muted/50 p-3 text-sm">
                        <span className="truncate">{proofExampleFile.name}</span>
                        <button
                          type="button"
                          onClick={() => setProofExampleFile(null)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Show publishers an example of what a good proof looks like
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label>Start & end dates (optional)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        placeholder="Start date"
                      />
                    </div>
                    <div className="space-y-1">
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        placeholder="End date"
                        min={startDate || undefined}
                      />
                    </div>
                    <div className="space-y-1">
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Campaign will automatically complete at end date
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="c-eligibility-note">Eligibility note (optional)</Label>
                  <Textarea
                    id="c-eligibility-note"
                    rows={2}
                    maxLength={300}
                    placeholder="e.g. Must be a new user, Only for users 18+"
                    value={eligibilityNote}
                    onChange={(e) => setEligibilityNote(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Additional requirements or restrictions (max 300 chars)
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="c-daily-limit">Daily completion limit (optional)</Label>
                  <Input
                    id="c-daily-limit"
                    type="number"
                    min={1}
                    max={Number(slots) || 100}
                    placeholder="e.g. 20"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Max completions per rolling 24 hours (between 1 and {slots || "max"} slots)
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

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
                Must be HTTPS and include{" "}
                <code className="rounded bg-muted px-1">{"click_id"}</code> placeholder
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
              <p className="text-[11px] text-muted-foreground">
                Comma-separated IPs that can send postbacks
              </p>
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
              <span>
                Campaign fee (
                {campaignFeeType === "per_campaign" ? "one-time" : `${slotsNum} slots`}):
              </span>
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
                <p className="text-[11px] text-muted-foreground">
                  Get more visibility in the marketplace.
                </p>
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
                <p>
                  App install, signup, website visit, free/paid trial, purchase, lead form, survey,
                  video watch, social actions with proof, app testing.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">❌ Not allowed:</p>
                <p>
                  Requests for card/ID/OTP, crypto wallet connect/seed phrase,
                  adult/illegal/misleading offers, phishing/malware, APKs outside stores, fake
                  reviews, impersonation.
                </p>
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
            Not enough Campaign Balance. You have ${account.spendable.toFixed(2)}, need $
            {totals.total.toFixed(2)}
            {(totals.campaignFee > 0 || totals.featuredFee > 0) &&
              ` ($${totals.allocation.toFixed(2)} budget${totals.campaignFee > 0 ? ` + $${totals.campaignFee.toFixed(2)} fee` : ""}${totals.featuredFee > 0 ? ` + $${totals.featuredFee.toFixed(2)} featured` : ""})`}
            .
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
