import { Gift } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { EmptyState, ErrorState } from "@/components/States";
import { OfferCard } from "@/components/OfferCard";
import { OfferDetailsDialog, type OfferDetailsPayload } from "@/components/OfferDetailsDialog";
import { offerMatchesFilter, type OfferFilter } from "@/components/OfferFilterButton";
import { claimOffer } from "@/lib/coinquest.functions";
import { getFeaturedFeed, trackOfferClick } from "@/lib/offers.functions";
import { useAuth } from "@/lib/auth";
import { appendAffSub4 } from "@/lib/offers/click-url";
import { Skeleton } from "@/components/ui/skeleton";

const INITIAL_RENDER = 18; // First 6 rows of 3
const LOAD_MORE = 18; // Append 6 more rows each time

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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
  
  const queryClient = useQueryClient();
  const claim = useServerFn(claimOffer);
  const [pending, setPending] = useState<OfferDetailsPayload | null>(null);
  const [burstOfferId, setBurstOfferId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_RENDER);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Prefetch the "all" feed when "home" scope mounts - delayed to avoid competing with first load
  useEffect(() => {
    if (scope === "home") {
      const prefetch = () => {
        queryClient.prefetchQuery({
          queryKey: ["featured-feed", "all"],
          queryFn: () => fetchFeed({ data: { scope: "all" } }),
          staleTime: 5 * 60 * 1000,
        });
      };

      // Use requestIdleCallback with setTimeout fallback
      if (typeof requestIdleCallback !== "undefined") {
        const id = requestIdleCallback(prefetch);
        return () => cancelIdleCallback(id);
      } else {
        const timeout = setTimeout(prefetch, 2500);
        return () => clearTimeout(timeout);
      }
    }
  }, [scope, queryClient, fetchFeed]);

  // Progressive loading with IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => prev + LOAD_MORE);
        }
      },
      { rootMargin: "600px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const mutation = useMutation({
    mutationFn: async (input: { offerId: string; proofUrl: string | null }) =>
      claim({
        data: {
          offerId: input.offerId,
          ...(input.proofUrl ? { proofUrl: input.proofUrl } : {}),
        },
      }),
    onSuccess: async (_result, input) => {
      setBurstOfferId(input.offerId);
      window.setTimeout(() => setBurstOfferId(null), 900);
      await queryClient.invalidateQueries({ queryKey: ["offer-claims"] });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err: Error) => toast.error(err.message || "Could not submit that claim. Try again."),
  });

  // Memoize filtered offers
  const offers = useMemo(() => {
    const rawOffers = data?.offers ?? [];
    return filter && filter !== "All" 
      ? rawOffers.filter((o) => offerMatchesFilter(filter, o))
      : rawOffers;
  }, [data?.offers, filter]);

  // Memoize visible offers
  const visibleOffers = useMemo(
    () => offers.slice(0, visibleCount),
    [offers, visibleCount]
  );

  const openOffer = useCallback((offer: typeof offers[number]) => {
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
      image_url: offer.image_url,
      display_price: offer.display_price,
      display_percent: offer.display_percent,
    });
  }, []);

  const handleContinue = useCallback((payload: { proofPath?: string | null }) => {
    if (!pending) return;
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
  }, [pending, mutation, session?.user.id, trackClick]);

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
  
  if (!offers.length) {
    return (
      <EmptyState
        icon={Gift}
        title={
          filter && filter !== "All"
            ? `No ${filter} offers right now`
            : "No offers available right now"
        }
        description="Check back soon — new partner offers land every day."
      />
    );
  }

  return (
    <>
      <ul className="grid grid-cols-3 gap-3" data-testid="featured-offers-list">
        {visibleOffers.map((offer, index) => (
          <OfferCard
            key={offer.id}
            id={offer.id}
            title={offer.title}
            description={offer.description}
            reward_amount={offer.reward_amount}
            image_url={offer.image_url}
            tags={offer.tags}
            is_limited_deal={offer.is_limited_deal}
            display_price={offer.display_price}
            display_percent={offer.display_percent}
            onOpen={() => openOffer(offer)}
            showBurst={burstOfferId === offer.id}
            isEager={index < 6}
            isPriority={index < 3}
          />
        ))}
      </ul>
      
      {/* Sentinel for progressive loading - only render if more offers available */}
      {visibleCount < offers.length && (
        <div ref={sentinelRef} className="h-px" aria-hidden="true" />
      )}

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
