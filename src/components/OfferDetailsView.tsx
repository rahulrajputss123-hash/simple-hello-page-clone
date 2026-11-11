import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  ExternalLink,
  Gift,
  Info,
  ListChecks,
  MessageCircle,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import { formatReward } from "@/lib/format-reward";
import { offerDisplayBadge } from "@/lib/offers/display-badge";
import { requestProofUploadUrl } from "@/lib/offers.functions";
import { useViewedOffer } from "@/lib/viewed-offer";
import { useOfferActions, type OfferActionData } from "@/lib/offers/useOfferActions";

/**
 * Offer details view supporting 3 types:
 * 1. AUTO (auto_postback + URL): open URL, auto-credited
 * 2. URL + PROOF (manual_proof + URL): start -> open URL -> upload proof -> submit
 * 3. TASK WITHOUT URL (manual_proof, no URL): upload proof -> submit
 */

const DEFAULT_NOT_ALLOWED =
  "No VPN, no multiple accounts, no fake data, no emulators. Violations forfeit rewards and may lead to account bans.";

const MAX_PROOF_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Format step reward: 2 decimals normally, 3 decimals if under $0.01
 */
function formatStepReward(usd: number): string {
  if (usd < 0.01) {
    return `$${usd.toFixed(3)}`;
  }
  return `$${usd.toFixed(2)}`;
}

/**
 * Split a long step text into multiple numbered parts if it contains patterns like:
 * "1. ... 2. ..." or "... → ..."
 * Returns array of split parts, or original single item if no split pattern found.
 */
function splitStepText(label: string): string[] {
  // Clean up stray punctuation before numbers (e.g., "email., 2." -> "email. 2.")
  const cleaned = label.replace(/([a-z]),\s*(\d+\.)/gi, "$1. $2");
  
  // Split on numbered patterns like "1. " or on arrow "→"
  const parts = cleaned.split(/(?=\d+\.\s)|→/).map(s => s.trim()).filter(Boolean);
  
  // If split gives only 1 part or no parts, return original
  if (parts.length <= 1) return [label];
  
  return parts;
}

/**
 * Normalize device for display: treat "desktop" as "web", capitalize first letter
 */
function displayDevice(device: string): string {
  const normalized = device.toLowerCase() === "desktop" ? "web" : device.toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/**
 * Get platform icon SVG for a device label
 */
function getPlatformIcon(device: string): JSX.Element | null {
  const lower = device.toLowerCase();
  
  if (lower === "android") {
    return (
      <svg className="inline size-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24a11.5 11.5 0 0 0-8.94 0L5.65 5.67c-.19-.28-.54-.37-.83-.22-.3.16-.42.54-.26.85l1.84 3.18C4.3 11.36 2.84 14.4 3 17.5h18c.16-3.1-1.3-6.14-3.4-8.02M7.5 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2m9 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/>
      </svg>
    );
  }
  
  if (lower === "ios") {
    return (
      <svg className="inline size-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01M12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25"/>
      </svg>
    );
  }
  
  if (lower === "web") {
    return (
      <svg className="inline size-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        <path d="M2 12h20"/>
      </svg>
    );
  }
  
  return null;
}

export type OfferDetailsData = {
  id: string;
  external_offer_id?: string | null;
  title: string;
  description?: string | null;
  requirements?: string | null;
  not_allowed?: string | null;
  reward_amount: number;
  click_url?: string | null;
  provider_slug?: string | null;
  provider_name?: string | null;
  devices?: string[];
  category?: string | null;
  is_limited_deal?: boolean;
  payout_mode?: "manual" | "manual_proof" | "auto_postback";
  image_url?: string | null;
  display_price?: string | null;
  display_percent?: number | null;
  // Claim status if user has one
  claim_status?: "started" | "pending" | "approved" | "rejected" | null;
  claim_reject_reason?: string | null;
  // Steps extracted from raw_payload (affike/revtoo/torox/gemiad)
  steps?: Array<{ label: string; usd: number }>;
  // Difficulty level (adswedmedia)
  difficulty?: string;
};

export function OfferDetailsView({ offer }: { offer: OfferDetailsData }) {
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [showAllSteps, setShowAllSteps] = useState(false);
  const showImage = Boolean(offer?.image_url) && !brokenImages[offer?.id ?? ""];

  const notAllowed = (offer?.not_allowed ?? "").trim() || DEFAULT_NOT_ALLOWED;
  const hasClickUrl = Boolean(offer?.click_url?.trim());
  const autoPostback = offer?.payout_mode === "auto_postback";
  const manualProof = offer?.payout_mode === "manual_proof";
  const plainManual = offer?.payout_mode === "manual";

  // Type 2: URL + proof (has URL and manual_proof)
  const isType2 = manualProof && hasClickUrl;
  // Type 3: Task without URL (no URL and manual_proof)
  const isType3 = manualProof && !hasClickUrl;

  const claimStatus = offer?.claim_status;
  const hasStarted = claimStatus === "started";
  const isPending = claimStatus === "pending";
  const isApproved = claimStatus === "approved";
  const isRejected = claimStatus === "rejected";

  // Steps display logic
  const steps = offer?.steps ?? [];
  const hasSteps = steps.length > 0;
  
  // Split long steps if needed (for single-step offers with embedded lists)
  const expandedSteps = hasSteps && steps.length === 1 
    ? splitStepText(steps[0].label).map((label, i) => ({
        label,
        // Only show reward on first split part
        usd: i === 0 ? steps[0].usd : 0,
      }))
    : steps;
  
  const MAX_VISIBLE_STEPS = 8;
  const hasMoreSteps = expandedSteps.length > MAX_VISIBLE_STEPS;
  const visibleSteps = hasMoreSteps && !showAllSteps ? expandedSteps.slice(0, MAX_VISIBLE_STEPS) : expandedSteps;

  // Device labels: show "All devices" if empty, otherwise show chips
  const devices = offer?.devices ?? [];
  const deviceLabels = devices.length === 0 ? ["All devices"] : devices.map(displayDevice);

  const [proofPath, setProofPath] = useState<string | null>(null);
  const [proofName, setProofName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestUpload = useServerFn(requestProofUploadUrl);
  const navigate = useNavigate();
  const { setViewedOffer, requestAssistantOpen } = useViewedOffer();

  const { startClaim, submitProof, claimOffer, isSubmitting } = useOfferActions();

  useEffect(() => {
    if (offer) setViewedOffer({ id: offer.id, title: offer.title });
  }, [offer, setViewedOffer]);

  const reset = () => {
    setProofPath(null);
    setProofName(null);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = async (file: File) => {
    if (!offer) return;
    if (file.size > MAX_PROOF_BYTES) {
      toast.error("File must be under 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const { path, uploadUrl, token } = await requestUpload({
        data: { offerId: offer.id, filename: file.name.slice(0, 120) },
      });
      const putUrl = uploadUrl || `${path}?token=${encodeURIComponent(token)}`;
      const res = await fetch(putUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "cache-control": "max-age=31536000",
          ...(token ? { "x-upsert": "false", Authorization: `Bearer ${token}` } : {}),
        },
        body: file,
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      setProofPath(path);
      setProofName(file.name);
      toast.success("Proof uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handlePrimaryAction = () => {
    if (!offer) return;

    // Type 2, not started: start claim and open URL
    if (isType2 && !hasStarted && !isPending && !isApproved) {
      const actionData: OfferActionData = {
        id: offer.id,
        click_url: offer.click_url,
        provider_slug: offer.provider_slug,
        external_offer_id: offer.external_offer_id,
        payout_mode: offer.payout_mode,
      };
      startClaim.mutate(actionData);
      return;
    }

    // Type 2, started: submit proof
    if (isType2 && hasStarted && proofPath) {
      submitProof.mutate({ offerId: offer.id, proofPath });
      return;
    }

    // Type 3: submit proof
    if (isType3 && proofPath) {
      submitProof.mutate({ offerId: offer.id, proofPath });
      return;
    }

    // Legacy: plain manual or auto_postback
    claimOffer.mutate({
      offerId: offer.id,
      proofUrl: proofPath,
      hasClickUrl,
      clickUrl: offer.click_url,
      provider_slug: offer.provider_slug,
      external_offer_id: offer.external_offer_id,
    });
  };

  const handleOpenOffer = () => {
    if (offer?.click_url) {
      window.open(offer.click_url, "_blank", "noopener,noreferrer");
    }
  };

  // Show proof section for: Type 2 (started), Type 3 (always), or limited deals
  const showProofSection =
    (isType2 && hasStarted) || isType3 || (offer?.is_limited_deal && !autoPostback);

  // Button state
  const canSubmitProof = Boolean(proofPath);
  const buttonDisabled =
    isSubmitting || !offer || (showProofSection && !canSubmitProof) || isPending || isApproved;

  let buttonText = "I Understand, Continue";
  if (isSubmitting) {
    buttonText = isType2 && hasStarted ? "Submitting…" : isType3 ? "Submitting…" : "Opening…";
  } else if (autoPostback) {
    buttonText = "Open Offer";
  } else if (isType2 && hasStarted) {
    buttonText = "Submit proof";
  } else if (isType3) {
    buttonText = "Submit for review";
  } else if (isPending) {
    buttonText = "Pending review";
  } else if (isApproved) {
    buttonText = "Approved";
  }

  // Show status badge
  const showStatusBadge = hasStarted || isPending || isApproved || isRejected;
  const statusText = hasStarted
    ? "In progress"
    : isPending
      ? "Pending review"
      : isApproved
        ? "Approved"
        : "Rejected";
  const statusColor = hasStarted
    ? "bg-primary/10 text-primary border-primary/30"
    : isPending
      ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
      : isApproved
        ? "bg-jade/10 text-jade-dark border-jade/30"
        : "bg-destructive/10 text-destructive border-destructive/30";

  return (
    <div className="flex flex-col pb-28" data-testid="offer-details-page">
      {/* Header */}
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-background-alt">
          {showImage ? (
            <img
              src={offer!.image_url!}
              alt=""
              aria-hidden
              loading="lazy"
              decoding="async"
              onError={() => setBrokenImages((b) => ({ ...b, [offer!.id]: true }))}
              className="size-full object-cover"
              data-testid="offer-details-image"
            />
          ) : (
            <Gift className="size-7 text-primary" data-testid="offer-details-icon" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold" data-testid="offer-details-title">
            {offer?.title ?? "Offer"}
          </h1>
          {offer && (
            <p className="text-amount text-base text-gold-dark" data-testid="offer-details-amount">
              {offerDisplayBadge(offer) ?? formatReward(offer.reward_amount)}
            </p>
          )}
          
          {/* Provider, Category, and Devices */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {offer?.provider_name && (
              <span
                className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary"
                data-testid="offer-details-provider"
              >
                {offer.provider_name}
              </span>
            )}
            {offer?.category && (
              <span
                className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent-foreground"
                data-testid="offer-details-category"
              >
                {offer.category}
              </span>
            )}
            {deviceLabels.map((device) => (
              <span
                key={device}
                className="rounded-full border border-border bg-background-alt px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                data-testid="offer-details-device"
              >
                {device}
              </span>
            ))}
          </div>
          
          {offer?.is_limited_deal && (
            <span
              data-testid="offer-details-deal-badge"
              className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-gold-gradient px-2 py-0.5 text-[10px] font-bold uppercase text-gold-foreground shadow-gold"
            >
              Limited deal · one-time only
            </span>
          )}
          {offer?.difficulty && (
            <span
              data-testid="offer-details-difficulty"
              className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary"
            >
              {offer.difficulty}
            </span>
          )}
          {showStatusBadge && (
            <span
              className={`mt-2 inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusColor}`}
            >
              {statusText}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Read-only states */}
        {isPending && (
          <section className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
            We're reviewing your proof. You'll be notified once it's approved.
          </section>
        )}

        {isRejected && (
          <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-sm font-semibold text-destructive">Claim rejected</p>
            {offer?.claim_reject_reason && (
              <p className="mt-1 text-xs text-destructive/80">{offer.claim_reject_reason}</p>
            )}
          </section>
        )}

        {offer?.description && (
          <section className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              About this offer
            </p>
            <p className="text-sm leading-relaxed" data-testid="offer-details-description">
              {offer.description}
            </p>
          </section>
        )}

        {/* Offer Info Section - Network, Category, Devices, Level */}
        {(offer?.provider_name || offer?.category || deviceLabels.length > 0 || offer?.difficulty) && (
          <section className="space-y-2 rounded-xl border border-border bg-background-alt p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Info className="mr-1 inline size-3.5" />
              Offer Details
            </p>
            <div className="space-y-1.5 text-sm">
              {offer?.provider_name && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Network:</span>
                  <span className="font-semibold">{offer.provider_name}</span>
                </div>
              )}
              {offer?.category && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-semibold">{offer.category}</span>
                </div>
              )}
              {deviceLabels.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Devices:</span>
                  <span className="font-semibold flex items-center gap-2">
                    {deviceLabels.map((device, i) => (
                      <span key={device} className="inline-flex items-center">
                        {i > 0 && <span className="mr-2">,</span>}
                        {getPlatformIcon(device)}
                        {device}
                      </span>
                    ))}
                  </span>
                </div>
              )}
              {offer?.difficulty && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Level:</span>
                  <span className="font-semibold">{offer.difficulty}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {offer?.requirements && !hasSteps && (
          <section className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <ListChecks className="mr-1 inline size-3.5" />
              How to complete
            </p>
            <p
              className="whitespace-pre-line text-sm leading-relaxed"
              data-testid="offer-details-requirements"
            >
              {offer.requirements}
            </p>
          </section>
        )}

        {hasSteps && (
          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <ListChecks className="mr-1 inline size-3.5" />
              How to complete
            </p>
            <div className="space-y-1.5" data-testid="offer-details-steps">
              {visibleSteps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-2.5 text-sm"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed">{step.label}</span>
                  </div>
                  {step.usd > 0 && (
                    <span className="shrink-0 rounded-full bg-gold-gradient px-2 py-0.5 text-[11px] font-bold text-gold-foreground shadow-sm">
                      {formatStepReward(step.usd)}
                    </span>
                  )}
                </div>
              ))}
            </div>
            {hasMoreSteps && !showAllSteps && (
              <button
                type="button"
                onClick={() => setShowAllSteps(true)}
                className="w-full rounded-lg border border-primary/25 bg-primary/5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                data-testid="offer-show-all-steps"
              >
                Show all {expandedSteps.length} steps
              </button>
            )}
          </section>
        )}

        <section
          className="space-y-1 rounded-xl border border-destructive/30 bg-destructive/5 p-3"
          data-testid="offer-details-warning"
        >
          <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-destructive">
            <AlertTriangle className="size-3.5" />
            What NOT to do
          </p>
          <p className="whitespace-pre-line text-sm leading-relaxed text-destructive">
            {notAllowed}
          </p>
        </section>

        {/* Type 2: Show "open offer again" link when started */}
        {isType2 && hasStarted && (
          <button
            type="button"
            onClick={handleOpenOffer}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/25 bg-primary/5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            <ExternalLink className="size-3.5" />
            Open offer again
          </button>
        )}

        {/* Proof section for types 2 (started) and 3 */}
        {showProofSection && !isPending && !isApproved && (
          <section className="space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
            <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-primary">
              <Upload className="size-3.5" />
              Proof required
            </p>
            <p className="text-xs text-muted-foreground">
              Upload a screenshot (max 5 MB).{" "}
              {!canSubmitProof && "Upload a screenshot to enable submit."}
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              data-testid="offer-proof-file-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
            {proofPath ? (
              <div
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-2 text-xs"
                data-testid="offer-proof-uploaded"
              >
                <span className="truncate">{proofName}</span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={reset}
                  aria-label="Remove proof"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                disabled={uploading}
                data-testid="offer-proof-upload-btn"
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? "Uploading…" : "Choose file"}
                <Upload className="ml-1 size-3.5" />
              </Button>
            )}
          </section>
        )}

        {autoPostback && (
          <section className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-primary">
            <Info className="size-4 shrink-0" />
            <span>
              Complete the offer on the partner page — your wallet will be credited automatically
              when the network confirms it. No manual submission needed.
            </span>
          </section>
        )}

        <button
          type="button"
          onClick={() => {
            requestAssistantOpen();
            void navigate({ to: "/support" });
          }}
          data-testid="offer-details-ask-assistant"
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/25 bg-primary/5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          <MessageCircle className="size-3.5" />
          Ask the assistant about this offer
        </button>

        {(isPending || isApproved || isRejected) && (
          <Link
            to="/offers"
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/25 bg-primary/5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            Back to offers
          </Link>
        )}
      </div>

      {/* Sticky bottom action bar */}
      <div
        className="fixed inset-x-0 bottom-0 border-t bg-background p-4"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto max-w-lg">
          <Button
            variant="jade"
            onClick={handlePrimaryAction}
            disabled={buttonDisabled}
            data-testid="offer-details-continue"
            className="w-full"
          >
            {buttonText}
            {!isType3 && !hasStarted && !isPending && !isApproved && (
              <ArrowUpRight className="ml-1 size-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
