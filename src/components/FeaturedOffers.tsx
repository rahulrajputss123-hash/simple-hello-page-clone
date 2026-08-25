import { ArrowUpRight, Check, Clock, Gift } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/States";
import { OfferDetailsDialog, type OfferDetailsPayload } from "@/components/OfferDetailsDialog";
import { formatMoney } from "@/lib/coinquest";
import { claimOffer } from "@/lib/coinquest.functions";
import { getFeaturedFeed } from "@/lib/offers.functions";
import { useOfferClaims } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";

export function FeaturedOffers({
  scope = "home",
}: {
  /** "home" = top featured slots (geo + ranked); "all" = full ranked list for the browse page. */
  scope?: "home" | "all";
}) {
  const fetchFeed = useServerFn(getFeaturedFeed);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["featured-feed", scope],
    queryFn: () => fetchFeed({ data: { scope } }),
  });
  const claims = useOfferClaims();
  const queryClient = useQueryClient();
  const claim = useServerFn(claimOffer);
  const [pending, setPending] = useState<OfferDetailsPayload | null>(null);

  const mutation = useMutation({
    mutationFn: async (offerId: string) => claim({ data: { offerId } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["offer-claims"] });
      toast.success("Claim submitted — an admin will review it shortly.");
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not submit that claim. Try again."),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3" data-testid="featured-offers-loading">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-2xl" />
        ))}
      </div>
    );
  }
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  const offers = data?.offers ?? [];
  if (!offers.length) {
    return (
      <EmptyState
        icon={Gift}
        title="No offers available right now"
        description="Check back soon — new partner offers land every day."
      />
    );
  }

  const handleContinue = () => {
    if (!pending) return;
    if (pending.click_url) {
      window.open(pending.click_url, "_blank", "noopener,noreferrer");
    }
    mutation.mutate(pending.id);
    setPending(null);
  };

  return (
    <>
      <ul className="grid grid-cols-3 gap-3" data-testid="featured-offers-list">
        {offers.map((offer) => {
          const existing = (claims.data ?? []).find((c) => c.offer_id === offer.id);
          const isPending = mutation.isPending && mutation.variables === offer.id;
          return (
            <li
              key={offer.id}
              className="surface-card flex flex-col gap-2 p-3"
              data-testid={`featured-offer-${offer.id}`}
            >
              <span className="grid size-9 place-items-center rounded-xl bg-background-alt">
                <Gift className="size-4 text-primary" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight">{offer.title}</p>
                <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                  {offer.description}
                </p>
              </div>
              <span className="text-amount text-sm text-gold-dark">
                {formatMoney(offer.reward_amount)}
              </span>
              {existing ? (
                <span className="mt-auto flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                  {existing.status === "approved" ? (
                    <>
                      <Check className="size-3.5 text-primary" /> Approved
                    </>
                  ) : existing.status === "rejected" ? (
                    <>Rejected</>
                  ) : (
                    <>
                      <Clock className="size-3.5" /> In review
                    </>
                  )}
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="mint"
                  className="mt-auto w-full gap-1 px-2 text-xs"
                  data-testid={`featured-offer-claim-${offer.id}`}
                  disabled={isPending}
                  onClick={() =>
                    setPending({
                      id: offer.id,
                      title: offer.title,
                      description: offer.description,
                      requirements: offer.requirements,
                      not_allowed: offer.not_allowed,
                      reward_amount: offer.reward_amount,
                      click_url: offer.click_url,
                    })
                  }
                >
                  {isPending ? "Sending…" : "Claim"} <ArrowUpRight className="size-3.5" />
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      <OfferDetailsDialog
        offer={pending}
        open={Boolean(pending)}
        onOpenChange={(open) => !open && setPending(null)}
        onContinue={handleContinue}
        isSubmitting={mutation.isPending}
      />
    </>
  );
}
