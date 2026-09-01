import { useRef, useState } from "react";
import { AlertTriangle, ArrowUpRight, Gift, Info, ListChecks, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMoney } from "@/lib/coinquest";
import { requestProofUploadUrl } from "@/lib/offers.functions";

/**
 * Pre-redirect confirmation dialog. When the offer's payout mode is
 * `manual_proof` or `is_limited_deal=true`, the user must upload a proof file
 * before Continue is enabled — the file is uploaded directly to Supabase
 * Storage using a short-lived signed URL, and only the resulting storage
 * `path` is returned to the parent (offer_claims has no UPDATE grant, so the
 * path is inserted in the same claim submission).
 */

const DEFAULT_NOT_ALLOWED =
  "No VPN, no multiple accounts, no fake data, no emulators. Violations forfeit rewards and may lead to account bans.";

const MAX_PROOF_BYTES = 5 * 1024 * 1024; // 5 MB

export type OfferDetailsPayload = {
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
};

export function OfferDetailsDialog({
  offer,
  open,
  onOpenChange,
  onContinue,
  isSubmitting,
}: {
  offer: OfferDetailsPayload | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: (payload: { proofPath?: string | null }) => void;
  isSubmitting?: boolean;
}) {
  const notAllowed = (offer?.not_allowed ?? "").trim() || DEFAULT_NOT_ALLOWED;
  const proofRequired =
    Boolean(offer?.is_limited_deal) || offer?.payout_mode === "manual_proof";
  const autoPostback = offer?.payout_mode === "auto_postback";

  const [proofPath, setProofPath] = useState<string | null>(null);
  const [proofName, setProofName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestUpload = useServerFn(requestProofUploadUrl);

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
      // Supabase createSignedUploadUrl returns a URL that accepts PUT with the token.
      const putUrl = uploadUrl || `${path}?token=${encodeURIComponent(token)}`;
      const res = await fetch(putUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
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

  const canContinue = !autoPostback && (!proofRequired || Boolean(proofPath));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent
        className="max-h-[90vh] overflow-y-auto"
        data-testid="offer-details-dialog"
      >
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-background-alt">
              <Gift className="size-5 text-primary" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-left text-base" data-testid="offer-details-title">
                {offer?.title ?? "Offer"}
              </DialogTitle>
              {offer && (
                <p className="text-amount text-sm text-gold-dark">
                  {formatMoney(offer.reward_amount)}
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
            </div>
          </div>
        </DialogHeader>

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

        {proofRequired && !autoPostback && (
          <section className="space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
            <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-primary">
              <Upload className="size-3.5" />
              Proof required
            </p>
            <p className="text-xs text-muted-foreground">
              Upload a screenshot / receipt (max 5 MB). We'll review and credit after approval.
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
          <section
            className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-primary"
            data-testid="offer-details-auto-postback"
          >
            <Info className="size-4 shrink-0" />
            <span>
              Complete the offer on the partner page — your wallet will be credited
              automatically when the network confirms it. No manual submission needed.
            </span>
          </section>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="offer-details-cancel">
            Cancel
          </Button>
          <Button
            variant="jade"
            onClick={() => onContinue({ proofPath })}
            disabled={isSubmitting || !offer || !canContinue}
            data-testid="offer-details-continue"
          >
            {autoPostback
              ? "Open Offer"
              : isSubmitting
                ? "Opening…"
                : "I Understand, Continue"}
            <ArrowUpRight className="ml-1 size-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
