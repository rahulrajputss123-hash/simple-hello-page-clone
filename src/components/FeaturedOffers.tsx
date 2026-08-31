import { ArrowUpRight, Check, Clock, Gift, Sparkles } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/States";
import { OfferDetailsDialog, type OfferDetailsPayload } from "@/components/OfferDetailsDialog";
import { OfferTagRow } from "@/components/OfferTagRow";
import { offerMatchesFilter, type OfferFilter } from "@/components/OfferFilterButton";
import { formatMoney } from "@/lib/coinquest";
import { claimOffer } from "@/lib/coinquest.functions";
import { getFeaturedFeed, trackOfferClick } from "@/lib/offers.functions";
import { useAuth } from "@/lib/auth";
import { appendAffSub4 } from "@/lib/offers/click-url";
import { useOfferClaims } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";

export function FeaturedOffers({
  scope = "home",
  filter,
}: {
  /** "home" = top featured slots (geo + ranked); "all" = full ranked list for the browse page. */
  scope?: "home" | "all";
  /** Optional category filter (used only on the Offers page). Undefined → no filter. */
  filter?: OfferFilter;
}) {
  const fetchFeed = useServerFn(getFeaturedFeed);
  const trackClick = useServerFn(trackOfferClick);
  const { session } = useAuth();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["featured-feed", scope],
    queryFn: () => fetchFeed({ data: { scope } }),
  });
  const claims = useOfferClaims();
  const queryClient = useQueryClient();
  const claim = useServerFn(claimOffer);
  const [pending, setPending] = useState<OfferDetailsPayload | null>(null);

  const mutation = useMutation({
    mutationFn: async (input: { offerId: string; proofUrl: string | null }) =>
      claim({
        data: {
          offerId: input.offerId,
          ...(input.proofUrl ? { proofUrl: input.proofUrl } : {}),
        },
      }),
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
  const rawOffers = data?.offers ?? [];
  const offers =
    filter && filter !== "All"
      ? rawOffers.filter((o) => offerMatchesFilter(filter, o))
      : rawOffers;
  if (!offers.length) {
    return (
      <EmptyState
        icon={Gift}
        title={filter && filter !== "All" ? `No ${filter} offers right now` : "No offers available right now"}
        description="Check back soon — new partner offers land every day."
      />
    );
  }

  const handleContinue = (payload: { proofPath?: string | null }) => {
    if (!pending) return;
    // Fire-and-forget click event for the Popular/Trending tag engine.
    void trackClick({ data: { offerId: pending.id } }).catch(() => {});
    if (pending.click_url) {
      const url = appendAffSub4(pending.click_url, pending.provider_slug, session?.user.id);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    }
    if (pending.payout_mode !== "auto_postback") {
      mutation.mutate({ offerId: pending.id, proofUrl: payload.proofPath ?? null });
    }
    setPending(null);
  };

  return (
    <>
      <ul className="grid grid-cols-3 gap-3" data-testid="featured-offers-list">
        {offers.map((offer) => {
          const existing = (claims.data ?? []).find((c) => c.offer_id === offer.id);
          const isPending = mutation.isPending && mutation.variables?.offerId === offer.id;
          return (
            <li
              key={offer.id}
              className="surface-card relative flex flex-col gap-2 p-3"
              data-testid={`featured-offer-${offer.id}`}
            >
              <span className="grid size-9 place-items-center rounded-xl bg-background-alt">
                <Gift className="size-4 text-primary" />
              </span>
              <OfferTagRow
                tags={offer.tags ?? []}
                isDeal={offer.is_limited_deal}
                size="xs"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight">{offer.title}</p>
                <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                  {offer.description}
                </p>
                {offer.is_limited_deal && (
                  <p className="mt-0.5 text-[10px] font-semibold uppercase text-gold-dark">
                    One-time only
                  </p>
                )}
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
                      provider_slug: offer.provider_slug,
                      is_limited_deal: offer.is_limited_deal,
                      payout_mode: offer.payout_mode,
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
