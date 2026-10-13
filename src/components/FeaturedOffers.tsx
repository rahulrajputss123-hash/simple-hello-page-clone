import { Gift } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import { EmptyState, ErrorState } from "@/components/States";
import { OfferCard } from "@/components/OfferCard";
import { offerMatchesFilter, type OfferFilter } from "@/components/OfferFilterButton";
import { getFeaturedFeed } from "@/lib/offers.functions";
import { Skeleton } from "@/components/ui/skeleton";

const INITIAL_RENDER = 18; // First 6 rows of 3
const LOAD_MORE = 18; // Append 6 more rows each time

// Store visible count per scope in module-level Map for scroll restoration
const visibleCountStore = new Map<string, number>();

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
  const queryClient = useQueryClient();
  
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["featured-feed", scope],
    queryFn: () => fetchFeed({ data: { scope } }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });

  // Restore or initialize visible count
  const [visibleCount, setVisibleCount] = useState(() => {
    const stored = visibleCountStore.get(scope);
    return stored ?? INITIAL_RENDER;
  });

  // Save visible count when it changes
  useEffect(() => {
    visibleCountStore.set(scope, visibleCount);
  }, [scope, visibleCount]);

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

  // Use deferred value for filtering to avoid blocking during filter changes
  const deferredFilter = useDeferredValue(filter);

  // Memoize filtered offers
  const offers = useMemo(() => {
    const rawOffers = data?.offers ?? [];
    return deferredFilter && deferredFilter !== "All"
      ? rawOffers.filter((o) => offerMatchesFilter(deferredFilter, o))
      : rawOffers;
  }, [data?.offers, deferredFilter]);

  // Memoize visible offers
  const visibleOffers = useMemo(
    () => offers.slice(0, visibleCount),
    [offers, visibleCount]
  );

  // Prefetch offer data on card hover/touch
  const handleCardPrefetch = (offer: typeof offers[number]) => {
    // Set offer data in cache so the page loads instantly
    queryClient.setQueryData(["offer", offer.id], offer);
  };

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
            claim_status={offer.claim_status}
            onPrefetch={() => handleCardPrefetch(offer)}
            isEager={index < 6}
            isPriority={index < 3}
          />
        ))}
      </ul>
      
      {/* Sentinel for progressive loading - only render if more offers available */}
      {visibleCount < offers.length && (
        <div ref={sentinelRef} className="h-px" aria-hidden="true" />
      )}
    </>
  );
}
