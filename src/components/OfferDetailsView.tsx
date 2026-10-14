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
import { formatMoney } from "@/lib/coinquest";
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
  is_limited_deal?: boolean;
  payout_mode?: "manual" | "manual_proof" | "auto_postback";
  image_url?: string | null;
  display_price?: string | null;
  display_percent?: number | null;
  // Claim status if user has one
  claim_status?: "started" | "pending" | "approved" | "rejected" | null;
  claim_reject_reason?: string | null;
};

export function OfferDetailsView({ offer }: { offer: OfferDetailsData }) {
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
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
              {offerDisplayBadge(offer) ?? formatMoney(offer.reward_amount)}
            </p>
          )}
          {offer?.is_limited_deal && (
            <span
              data-testid="offer-details-deal-badge"
              className="mt-1 inline-flex items-center gap-1 rounded-full bg-gold-gradient px-2 py-0.5 text-[10px] font-bold uppercase text-gold-foreground shadow-gold"
            >
              Limited deal · one-time only
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

        {offer?.requirements && (
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
