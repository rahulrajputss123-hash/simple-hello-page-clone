/**
 * Surveys Section - Home Page
 * 
 * Displays survey cards from CPX Research, TheoremReach, and Timewall.
 */

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useInView } from "react-intersection-observer";
import { Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/States";
import { Link } from "@tanstack/react-router";
import { fetchSurveysList } from "@/lib/surveys/surveys-home.functions";

type Survey = {
  id: string;
  network: "cpxresearch" | "theoremreach" | "timewall";
  title: string;
  payoutCoins: number; // Already converted with multiplier
  loi: number; // Minutes
  rating?: number | undefined; // 0-5, explicit undefined for exactOptionalPropertyTypes
  entryLink: string;
};

type NetworkStatus = {
  network: string;
  ok: boolean;
  count: number;
  reason?: string;
  httpStatus?: number;
};

export function SurveysSection() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: "200px",
  });

  const fetchSurveys = useServerFn(fetchSurveysList);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["surveys-home-feed"],
    queryFn: () => fetchSurveys({ data: {} as never }), // Empty input for now
    enabled: inView, // Only fetch when section is visible
    staleTime: 5 * 60 * 1000, // 5 minutes client-side
    gcTime: 10 * 60 * 1000,
  });

  const surveys = data?.surveys ?? [];
  const networks = data?.networks ?? [];
  const hasError = networks.some((n: NetworkStatus) => !n.ok && n.reason);

  return (
    <section ref={ref} className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Surveys</h2>
          {surveys.length > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
              {surveys.length}
            </span>
          )}
        </div>
        {surveys.length > 0 && (
          <Link
            to="/featured"
            className="text-sm font-medium text-primary hover:underline"
          >
            See all
          </Link>
        )}
      </div>

      {isLoading && <SurveysSkeleton />}

      {!isLoading && surveys.length === 0 && (
        <EmptyState
          icon={Star}
          title="Abhi koi survey nahi"
          description="Thodi der baad check karein"
        />
      )}

      {!isLoading && surveys.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {surveys.slice(0, 9).map((survey: Survey) => (
              <SurveyCard key={survey.id} survey={survey} />
            ))}
          </div>

          {/* Network status - show errors as muted text */}
          {hasError && (
            <div className="space-y-1">
              {networks
                .filter((n: NetworkStatus) => !n.ok && n.reason)
                .map((n: NetworkStatus) => (
                  <div
                    key={n.network}
                    className="text-xs text-muted-foreground"
                  >
                    {n.network}: {n.reason}
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function SurveyCard({ survey }: { survey: Survey }) {
  const handleClick = () => {
    // Open synchronously to avoid popup blockers
    window.open(survey.entryLink, "_blank", "noopener,noreferrer");
  };

  // Special card for Timewall wall
  if (survey.network === "timewall" && survey.id === "timewall-wall") {
    return (
      <button
        onClick={handleClick}
        className="group relative flex flex-col gap-2 rounded-2xl border bg-card p-3 text-left transition-transform active:scale-[0.98]"
      >
        {/* Network chip */}
        <div className="absolute right-2 top-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
          Timewall
        </div>

        {/* Badge */}
        <div className="w-fit rounded-lg bg-purple-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400">
          Survey
        </div>

        {/* Title */}
        <div className="min-h-[2.5rem] text-sm font-medium line-clamp-2">
          Timewall Surveys
        </div>

        {/* Description */}
        <div className="text-xs text-muted-foreground">Browse surveys</div>

        {/* Start button */}
        <Button size="sm" className="mt-auto w-full">
          Browse
          <ExternalLink className="ml-1 h-3 w-3" />
        </Button>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="group relative flex flex-col gap-2 rounded-2xl border bg-card p-3 text-left transition-transform active:scale-[0.98]"
    >
      {/* Network chip */}
      <div className="absolute right-2 top-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
        {survey.network === "cpxresearch"
          ? "CPX"
          : survey.network === "theoremreach"
            ? "TheoremReach"
            : "Timewall"}
      </div>

      {/* Badge */}
      <div className="w-fit rounded-lg bg-purple-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400">
        Survey
      </div>

      {/* Title */}
      <div className="min-h-[2.5rem] text-sm font-medium line-clamp-2">
        {survey.title}
      </div>

      {/* Reward */}
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold text-primary">
          {survey.payoutCoins}
        </span>
        <span className="text-xs text-muted-foreground">coins</span>
      </div>

      {/* LOI and Rating */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{survey.loi} min</span>
        {survey.rating != null && survey.rating > 0 && (
          <>
            <span>•</span>
            <div className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{survey.rating.toFixed(1)}</span>
            </div>
          </>
        )}
      </div>

      {/* Start button */}
      <Button size="sm" className="mt-1 w-full">
        Start
        <ExternalLink className="ml-1 h-3 w-3" />
      </Button>
    </button>
  );
}

function SurveysSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="aspect-[3/4] w-full rounded-2xl" />
      ))}
    </div>
  );
}
