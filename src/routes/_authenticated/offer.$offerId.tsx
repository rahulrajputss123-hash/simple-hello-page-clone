import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";

import { AppShell } from "@/components/AppShell";
import { OfferDetailsView } from "@/components/OfferDetailsView";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/States";
import { getOfferById } from "@/lib/offers.functions";
import type { FeaturedOffer } from "@/lib/offers/feed-cache.server";

export const Route = createFileRoute("/_authenticated/offer/$offerId")({
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Offer"} — CashGPT` },
      { name: "description", content: loaderData?.description ?? "Complete this offer to earn rewards." },
    ],
  }),
  component: OfferDetailsPage,
});

function OfferDetailsPage() {
  const { offerId } = Route.useParams();
  const queryClient = useQueryClient();
  const router = useRouter();
  const navigate = useNavigate();
  const fetchOffer = useServerFn(getOfferById);

  // Try to get from cache first (search all featured-feed queries)
  const cachedOffer = queryClient
    .getQueriesData<{ offers: FeaturedOffer[] }>({ queryKey: ["featured-feed"] })
    .flatMap(([_key, data]) => data?.offers ?? [])
    .find((o) => o.id === offerId);

  // If found in cache, set it immediately
  useEffect(() => {
    if (cachedOffer) {
      queryClient.setQueryData(["offer", offerId], cachedOffer);
    }
  }, [cachedOffer, offerId, queryClient]);

  const { data: offer, isLoading, isError } = useQuery({
    queryKey: ["offer", offerId],
    queryFn: () => fetchOffer({ data: { offerId } }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Start with cached data if available
    initialData: cachedOffer,
  });

  const handleBack = () => {
    if (router.history.length > 1) {
      router.history.back();
    } else {
      void navigate({ to: "/offers" });
    }
  };

  if (isLoading) {
    return (
      <AppShell hideNav>
        <div className="mb-4">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex gap-3">
            <Skeleton className="size-16 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AppShell>
    );
  }

  if (isError || !offer) {
    return (
      <AppShell hideNav>
        <div className="mb-4">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
        </div>
        <EmptyState
          icon={ArrowLeft}
          title="Offer not available"
          description="This offer may have been removed or is no longer active."
        />
        <div className="mt-6">
          <Link
            to="/offers"
            className="mx-auto block w-fit rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to offers
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell hideNav>
      <div className="mb-4">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
          data-testid="offer-details-back"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
      </div>
      <OfferDetailsView offer={offer} />
    </AppShell>
  );
}
