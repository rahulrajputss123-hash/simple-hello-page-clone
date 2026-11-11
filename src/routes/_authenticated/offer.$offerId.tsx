import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfferDetailsView } from "@/components/OfferDetailsView";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/States";
import { getOfferById } from "@/lib/offers.functions";
import type { FeaturedOffer } from "@/lib/offers/feed-cache.server";

export const Route = createFileRoute("/_authenticated/offer/$offerId")({
  component: OfferDetailsPage,
  errorComponent: ({ error }) => {
    console.error("[OfferDetailsRoute] Error:", error);
    return (
      <ErrorBoundary>
        <AppShell hideNav>
          <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-4 text-center">
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-destructive/10">
                <ArrowLeft className="size-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold">Unable to load offer</h1>
              <p className="text-sm text-muted-foreground">
                This offer could not be loaded. Please try again or return to the offers page.
              </p>
              {process.env.NODE_ENV === "development" && error && (
                <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-left">
                  <p className="text-xs font-mono text-destructive">{error.message}</p>
                </div>
              )}
              <Link
                to="/offers"
                className="mx-auto block w-fit rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Back to offers
              </Link>
            </div>
          </div>
        </AppShell>
      </ErrorBoundary>
    );
  },
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

  const {
    data: offer,
    isLoading,
    isError,
    error,
    isFetching,
    fetchStatus,
    isPlaceholderData,
    status,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["offer", offerId],
    queryFn: () => fetchOffer({ data: { offerId } }),
    staleTime: 0,
    refetchOnMount: "always",
    // Use cached data as placeholder while fetching full details
    placeholderData: cachedOffer,
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
    <ErrorBoundary>
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
        
        {/* TEMP DEBUG - remove after verification */}
        <div className="mb-2 rounded bg-muted/50 p-2">
          <p className="text-[11px] opacity-60">
            DEBUG2: fetchStatus={fetchStatus} isFetching={isFetching.toString()} isPlaceholder={isPlaceholderData.toString()} status={status} dataUpdatedAt={dataUpdatedAt} steps={offer?.steps?.length ?? "undefined"} rawKeys={(offer as any)?.raw_payload ? Object.keys((offer as any).raw_payload).slice(0, 5).join(",") : "none"}
          </p>
        </div>
        
        <OfferDetailsView offer={offer} />
      </AppShell>
    </ErrorBoundary>
  );
}
