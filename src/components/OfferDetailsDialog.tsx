import { AlertTriangle, ArrowUpRight, Gift, ListChecks } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMoney } from "@/lib/coinquest";

/**
 * Generic pre-redirect confirmation dialog shown before opening an offer's click_url.
 * Reused across Featured Offers, Offerwall list, and any offer surface.
 */

const DEFAULT_NOT_ALLOWED =
  "No VPN, no multiple accounts, no fake data, no emulators. Violations forfeit rewards and may lead to account bans.";

export type OfferDetailsPayload = {
  id: string;
  title: string;
  description?: string | null;
  requirements?: string | null;
  not_allowed?: string | null;
  reward_amount: number;
  click_url?: string | null;
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
  onContinue: () => void;
  isSubmitting?: boolean;
}) {
  const notAllowed = (offer?.not_allowed ?? "").trim() || DEFAULT_NOT_ALLOWED;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              <DialogTitle
                className="text-left text-base"
                data-testid="offer-details-title"
              >
                {offer?.title ?? "Offer"}
              </DialogTitle>
              {offer && (
                <p className="text-amount text-sm text-gold-dark">
                  {formatMoney(offer.reward_amount)}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        {offer?.description && (
          <section className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              About this offer
            </p>
            <p
              className="text-sm leading-relaxed"
              data-testid="offer-details-description"
            >
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

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="offer-details-cancel"
          >
            Cancel
          </Button>
          <Button
            variant="jade"
            onClick={onContinue}
            disabled={isSubmitting || !offer}
            data-testid="offer-details-continue"
          >
            {isSubmitting ? "Opening…" : "I Understand, Continue"}
            <ArrowUpRight className="ml-1 size-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
