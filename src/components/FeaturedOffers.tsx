import { ArrowUpRight, Gift } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, ErrorState } from "@/components/States";
import { OfferDetailsDialog, type OfferDetailsPayload } from "@/components/OfferDetailsDialog";
import { OfferTagRow } from "@/components/OfferTagRow";
import { offerMatchesFilter, type OfferFilter } from "@/components/OfferFilterButton";
import { formatMoney } from "@/lib/coinquest";
import { claimOffer } from "@/lib/coinquest.functions";
import { getFeaturedFeed, trackOfferClick } from "@/lib/offers.functions";
import { useAuth } from "@/lib/auth";
import { appendAffSub4 } from "@/lib/offers/click-url";
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
  const queryClient = useQueryClient();
  const claim = useServerFn(claimOffer);
  const [pending, setPending] = useState<OfferDetailsPayload | null>(null);
  const [broken, setBroken] = useState<Record<string, boolean>>({});

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
    },
    onError: (err: Error) =>
      toast.error(err.message || "Could not submit that claim. Try again."),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3" data-testid="featured-offers-loading">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="aspect-[3/4] w-full rounded-[1.25rem]" />
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

  const openOffer = (offer: (typeof offers)[number]) =>
    setPending({
      id: offer.id,
      external_offer_id: offer.external_offer_id,
      title: offer.title,
      description: offer.description,
      requirements: offer.requirements,
      not_allowed: offer.not_allowed,
      reward_amount: offer.reward_amount,
      click_url: offer.click_url,
      provider_slug: offer.provider_slug,
      is_limited_deal: offer.is_limited_deal,
      payout_mode: offer.payout_mode,
    });

  const handleContinue = (payload: { proofPath?: string | null }) => {
    if (!pending) return;
    // Fire-and-forget click event for the Popular/Trending tag engine.
    void trackClick({ data: { offerId: pending.id } }).catch(() => {});
    const clickUrl = appendAffSub4(
      pending.click_url,
      pending.provider_slug,
      session?.user.id,
      pending.external_offer_id,
    );
    if (clickUrl) window.open(clickUrl, "_blank", "noopener,noreferrer");
    if (pending.payout_mode !== "auto_postback") {
      mutation.mutate({ offerId: pending.id, proofUrl: payload.proofPath ?? null });
    }
    setPending(null);
  };

  return (
    <>
      <ul className="grid grid-cols-3 gap-3" data-testid="featured-offers-list">
        {offers.map((offer) => {
          const showImage = Boolean(offer.image_url) && !broken[offer.id];
          return (
            <li
              key={offer.id}
              role="button"
              tabIndex={0}
              onClick={() => openOffer(offer)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openOffer(offer);
                }
              }}
              className="surface-card group relative flex cursor-pointer flex-col overflow-hidden !p-0 shadow-soft outline-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-gold focus-visible:ring-2 focus-visible:ring-primary/50 active:translate-y-0"
              data-testid={`featured-offer-${offer.id}`}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-background-alt">
                {showImage ? (
                  <img
                    src={offer.image_url!}
                    alt={offer.title}
                    loading="lazy"
                    onError={() => setBroken((b) => ({ ...b, [offer.id]: true }))}
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <span className="grid size-full place-items-center bg-jade-gradient text-primary-foreground">
                    <Gift className="size-7" />
                  </span>
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/25 to-transparent" />
                <OfferTagRow
                  tags={offer.tags ?? []}
                  isDeal={offer.is_limited_deal}
                  size="xs"
                  className="absolute left-1.5 top-1.5"
                />
                <span
                  className="absolute bottom-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-card/90 text-primary shadow-soft backdrop-blur-sm transition-transform duration-200 group-hover:scale-110"
                  data-testid={`featured-offer-claim-${offer.id}`}
                >
                  <ArrowUpRight className="size-3.5" />
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-0.5 p-2.5">
                <p className="truncate text-[13px] font-semibold leading-tight">{offer.title}</p>
                <p className="truncate text-[11px] leading-snug text-muted-foreground">
                  {offer.description}
                </p>
                <span className="text-amount mt-auto pt-1 text-base leading-none text-gold-dark">
                  {formatMoney(offer.reward_amount)}
                </span>
              </div>
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
