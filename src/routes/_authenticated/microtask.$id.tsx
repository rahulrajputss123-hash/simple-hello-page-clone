import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Camera, Check, Globe, ImagePlus, Info, ListOrdered, Smartphone, X } from "lucide-react";
import { toast } from "sonner";
import { useRef, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BackLink, VerificationBadge } from "@/components/marketplace/Preview";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/coinquest";
import { listActiveCampaigns, recordClick, submitProofForCampaign } from "@/lib/marketplace.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/microtask/$id")({
  head: () => ({ meta: [{ title: "Task details — CashGPT" }] }),
  component: MicrotaskDetailPage,
});

// Helper to make URLs in text clickable
function renderTextWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="text-primary underline hover:text-primary/80"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

function MicrotaskDetailPage() {
  const { id } = Route.useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const fetchCampaigns = useServerFn(listActiveCampaigns);
  const clickFn = useServerFn(recordClick);
  const submitProofFn = useServerFn(submitProofForCampaign);

  const campaigns = useQuery({
    queryKey: ["active-campaigns", session?.user.id],
    queryFn: () => fetchCampaigns({}),
    enabled: Boolean(session),
  });

  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);

  // Proof submission state
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clickMutation = useMutation({
    mutationFn: () =>
      clickFn({
        data: {
          campaignId: id,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        },
      }),
    onSuccess: (result) => {
      setRedirectUrl(result.redirectUrl ?? null);
      if (result.redirectUrl) {
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.location.href = result.redirectUrl;
        } else {
          window.location.href = result.redirectUrl;
        }
        toast.success("Offer opened. Complete it to earn your reward.");
      } else {
        toast.success("Task started! Complete it and your reward will be credited automatically.");
      }
    },
    onError: (err) => {
      popupRef.current?.close();
      popupRef.current = null;
      const msg = err instanceof Error ? err.message : "Something went wrong";
      const detail = msg.match(/detail[=: ]+([a-z_]+)/i)?.[1]?.toLowerCase();
      const description = msg.includes("MKT_NOT_AVAILABLE")
        ? "This campaign is no longer available."
        : msg.includes("MKT_NOT_ELIGIBLE") && detail === "country"
          ? "This campaign is not available in your country."
          : msg.includes("MKT_NOT_ELIGIBLE") && detail === "device"
            ? "This campaign does not support your device."
            : msg.includes("MKT_NOT_ELIGIBLE") && detail === "age"
              ? "You are not eligible for this campaign's age requirements."
              : msg.includes("MKT_NOT_ELIGIBLE") && detail === "linked"
                ? "You are not eligible for this campaign because of an account link."
                : msg.includes("MKT_NO_SLOTS")
                  ? "This task is full. All slots have been taken."
                  : msg.includes("MKT_ALREADY_DONE")
                    ? "You already completed this task."
                    : "We couldn't start this task. Please try again.";
      toast.error("Couldn't start task", { description });
    },
  });

  const proofMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user.id) throw new Error("Please sign in to submit proof.");

      const c = campaigns.data?.find((campaign) => campaign.id === id);
      if (!c) throw new Error("Task not found.");

      return submitProofFn({
        data: {
          campaignId: id,
          files,
          fieldValues,
          userNote: notes,
        },
      });
    },
    onSuccess: () => {
      toast.success("Proof submitted! We'll review it soon.");
      navigate({ to: "/my-submissions" });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Could not submit proof";
      const detail = msg.match(/detail[=: ]+([a-z_]+)/i)?.[1]?.toLowerCase();
      
      const description = msg.includes("MKT_NO_SLOTS")
        ? "This task is full. All slots have been taken."
        : msg.includes("MKT_ALREADY_DONE")
          ? "You already completed this task."
          : msg.includes("MKT_NOT_ELIGIBLE") && detail === "country"
            ? "This campaign is not available in your country."
            : msg.includes("MKT_NOT_ELIGIBLE") && detail === "device"
              ? "This campaign does not support your device."
              : msg.includes("MKT_NOT_ELIGIBLE") && detail === "age"
                ? "You are not eligible for this campaign's age requirements."
                : msg.includes("MKT_NOT_ELIGIBLE") && detail === "linked"
                  ? "You are not eligible because of an account link."
                  : msg.includes("MKT_NOT_AVAILABLE")
                    ? "This campaign is no longer available."
                    : msg.includes("MKT_INVALID_PROOF")
                      ? msg.replace(/^[A-Z_]+: /, "")
                      : msg;
      
      setErrorMessage(description);
      toast.error("Couldn't submit proof", { description });
    },
  });

  const c = campaigns.data?.find((campaign) => campaign.id === id);

  if (campaigns.isPending) {
    return (
      <AppShell subtitle="Tasks" mainClass="page-fade-in">
        <BackLink to="/task" label="Back to Microtasks" />
        <Skeleton className="mt-3 h-48 rounded-3xl" />
        <Skeleton className="mt-3 h-32 rounded-2xl" />
      </AppShell>
    );
  }

  if (!c) {
    return (
      <AppShell subtitle="Tasks">
        <BackLink to="/task" label="Back to Microtasks" />
        <p className="mt-8 text-center text-sm text-muted-foreground">That task isn't available.</p>
      </AppShell>
    );
  }

  const proof = c.verification === "proof";
  const countryFlag = c.countries.length === 0 ? "🌍" : "🇺🇸";
  const countryLabel = c.countries.length === 0 ? "Worldwide" : c.countries.join(", ");

  // Derive proof_mode for old campaigns
  const proofMode = c.proofMode || null;
  const proofFields = c.proofFields ?? [];
  const minImages = c.proofMinImages ?? 1;
  const maxImages = c.proofMaxImages ?? 3;
  
  let derivedMode = proofMode;
  if (!derivedMode && proof) {
    const hasRequiredFields = proofFields.some((f: any) => f.required);
    if (minImages >= 1 && !hasRequiredFields) {
      derivedMode = "screenshot";
    } else if (minImages === 0 && proofFields.length > 0) {
      derivedMode = "text";
    } else {
      derivedMode = "both";
    }
  }

  const showImages = proof && derivedMode !== "text";
  const showFields = proof && derivedMode !== "screenshot";

  // Handle proof form submission
  const handleProofSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate based on proof_mode
    const hasImages = files.length > 0;
    const hasFieldValues = proofFields.some((field: any) => fieldValues[field.key]?.trim());

    if (derivedMode === "either") {
      if (!hasImages && !hasFieldValues) {
        setErrorMessage("Please provide either a screenshot or fill in the details below.");
        return;
      }
    } else if (derivedMode === "both") {
      if (files.length < minImages) {
        setErrorMessage(`Please upload at least ${minImages} image${minImages === 1 ? "" : "s"}.`);
        return;
      }
      for (const field of proofFields) {
        if (field.required && !fieldValues[field.key]?.trim()) {
          setErrorMessage(`${field.label} is required.`);
          return;
        }
      }
    } else if (derivedMode === "screenshot") {
      if (files.length < minImages) {
        setErrorMessage(`Please upload at least ${minImages} image${minImages === 1 ? "" : "s"}.`);
        return;
      }
    } else if (derivedMode === "text") {
      for (const field of proofFields) {
        if (field.required && !fieldValues[field.key]?.trim()) {
          setErrorMessage(`${field.label} is required.`);
          return;
        }
      }
    }

    // Validate max images
    if (files.length > maxImages) {
      setErrorMessage(`Maximum ${maxImages} images allowed.`);
      return;
    }

    // Validate field lengths
    for (const field of proofFields) {
      const value = fieldValues[field.key] || "";
      if (value.length > field.maxLen) {
        setErrorMessage(`${field.label} must be ${field.maxLen} characters or less.`);
        return;
      }
    }

    proofMutation.mutate();
  };

  return (
    <AppShell subtitle="Tasks" mainClass="page-fade-in">
      <BackLink to="/task" label="Back to Microtasks" />

      <section className="premium-step-in mt-3 rounded-3xl bg-jade-gradient p-5 text-primary-foreground shadow-lift">
        <VerificationBadge verification={c.verification} size="md" />
        <h1 className="mt-3 text-xl leading-tight">{c.title}</h1>
        <p className="text-amount mt-2 text-3xl leading-none text-gold">{formatMoney(c.reward)}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <p className="inline-flex items-center gap-1.5 rounded-xl bg-primary-foreground/10 px-3 py-2">
            <Globe className="size-3.5" /> {countryFlag} {countryLabel}
          </p>
          <p className="inline-flex items-center gap-1.5 rounded-xl bg-primary-foreground/10 px-3 py-2">
            <Smartphone className="size-3.5" /> {proof ? "Mobile" : "Any device"}
          </p>
        </div>
        {c.slotsLeft !== null && c.slotsLeft > 0 && (
          <p className="mt-3 text-xs opacity-90">
            {c.slotsLeft} slot{c.slotsLeft === 1 ? "" : "s"} left
          </p>
        )}
      </section>

      <SectionHeading
        variant="ribbon"
        icon={Info}
        iconSrc="/icons/icon-document-info.webp"
        title="About This Task"
      />
      <div className="surface-card p-4 text-sm leading-relaxed text-foreground whitespace-pre-line">
        {renderTextWithLinks(c.description)}
      </div>

      {proof ? (
        <div className="mt-3">
          <SectionHeading
            variant="ribbon"
            icon={Camera}
            iconSrc="/icons/icon-cloud-upload.webp"
            title="Submit Your Proof"
          />
          <form className="surface-card space-y-4 p-4" onSubmit={handleProofSubmit}>
            {c.proofDescription && (
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">What to submit</Label>
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-primary whitespace-pre-line">
                  {renderTextWithLinks(c.proofDescription)}
                </div>
              </div>
            )}

            {derivedMode === "either" && (
              <div className="rounded-xl border border-gold/30 bg-gold/10 p-3 text-sm text-gold-dark">
                Upload a screenshot <strong>OR</strong> fill the details below. One of them is enough.
              </div>
            )}

            {c.proofExampleUrl && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Example of a good proof:</Label>
                <div className="overflow-hidden rounded-xl border border-border">
                  <img
                    src={c.proofExampleUrl}
                    alt="Proof example"
                    className="w-full object-contain bg-background-alt"
                  />
                </div>
              </div>
            )}

            {showImages && maxImages > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="proof-file">
                  Screenshot{minImages > 1 ? "s" : ""}{" "}
                  {minImages > 0 && `(${minImages}-${maxImages} required)`}
                </Label>
                {preview ? (
                  <div className="relative overflow-hidden rounded-2xl border border-border">
                    <img
                      src={preview}
                      alt="Proof preview"
                      className="max-h-72 w-full object-contain bg-background-alt"
                    />
                    <button
                      type="button"
                      aria-label="Remove screenshot"
                      className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-card shadow-soft"
                      onClick={() => {
                        setPreview(null);
                        setFiles([]);
                      }}
                    >
                      <X className="size-4" />
                    </button>
                    {files.length > 1 && (
                      <div className="absolute bottom-2 right-2 rounded-full bg-card px-2 py-1 text-xs font-semibold">
                        +{files.length - 1} more
                      </div>
                    )}
                  </div>
                ) : (
                  <label
                    htmlFor="proof-file"
                    data-testid="proof-upload"
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border bg-background-alt px-4 py-8 text-center"
                  >
                    <ImagePlus className="size-7 text-primary" />
                    <span className="text-sm font-semibold">
                      Tap to add screenshot{maxImages > 1 ? "s" : ""}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PNG, JPG or WebP · up to {maxImages} images, 5 MB each
                    </span>
                  </label>
                )}
                <input
                  id="proof-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple={maxImages > 1}
                  className="sr-only"
                  onChange={(e) => {
                    const selected = Array.from(e.target.files ?? []);
                    const valid = selected
                      .filter(
                        (file) =>
                          ["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
                          file.size <= 5 * 1024 * 1024,
                      )
                      .slice(0, maxImages);
                    if (valid.length !== selected.length || selected.length > maxImages) {
                      setErrorMessage(
                        `Use up to ${maxImages} JPEG, PNG, or WebP images, each no larger than 5 MB.`,
                      );
                    }
                    setFiles(valid);
                    setPreview(valid[0] ? URL.createObjectURL(valid[0]) : null);
                  }}
                />
              </div>
            )}

            {showFields && proofFields.length > 0 && (
              <div className="space-y-3">
                {proofFields.map((field: any) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label htmlFor={`field-${field.key}`}>
                      {field.label} {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                      id={`field-${field.key}`}
                      maxLength={field.maxLen}
                      placeholder={field.label}
                      value={fieldValues[field.key] || ""}
                      onChange={(e) => setFieldValues({ ...fieldValues, [field.key]: e.target.value })}
                      required={field.required}
                    />
                    <p className="text-[11px] text-muted-foreground">Max {field.maxLen} characters</p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="proof-notes">Notes (optional)</Label>
              <Textarea
                id="proof-notes"
                rows={3}
                maxLength={500}
                placeholder="Anything the reviewer should know?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {errorMessage && (
              <p className="text-sm text-destructive">{errorMessage}</p>
            )}

            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full"
              disabled={proofMutation.isPending}
              data-testid="proof-submit"
            >
              {proofMutation.isPending ? "Submitting..." : "Submit proof"}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              Your reward is credited after approval, usually within 48 hours.
            </p>
          </form>
        </div>
      ) : (
        <div className="mt-6">
          <Button
            variant="jade"
            size="lg"
            className="w-full"
            data-testid="start-task-btn"
            onClick={() => {
              popupRef.current =
                c.verification === "auto" ? window.open("about:blank", "_blank") : null;
              clickMutation.mutate();
            }}
            disabled={clickMutation.isPending}
          >
            {clickMutation.isPending ? "Starting..." : "Start Task"}
          </Button>
          {redirectUrl && (
            <a
              href={redirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-center text-sm font-semibold text-primary underline"
            >
              Open offer
            </a>
          )}
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Your reward is credited automatically after you finish.
          </p>
        </div>
      )}

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        Have a submission that was rejected?{" "}
        <Link to="/my-submissions" className="font-semibold text-primary">
          See My Submissions
        </Link>
      </p>
    </AppShell>
  );
}
