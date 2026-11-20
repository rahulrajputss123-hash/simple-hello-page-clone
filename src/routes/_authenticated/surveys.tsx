/**
 * Surveys Page - See All
 * 
 * 3-column grid showing all available surveys with load more pagination.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Star, ExternalLink, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/States";
import { Link } from "@tanstack/react-router";
import { fetchSurveysList } from "@/lib/surveys/surveys-home.functions";
import { SURVEY_PROVIDER_IMAGES } from "@/lib/surveys/survey-ui-config";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/surveys")({
  component: SurveysPage,
});

type Survey = {
  id: string;
  network: "cpxresearch" | "theoremreach" | "timewall";
  title: string;
  payoutCoins: number;
  loi: number;
  rating?: number | undefined;
  entryLink: string;
};

function SurveysPage() {
  const fetchSurveys = useServerFn(fetchSurveysList);
  const [visibleCount, setVisibleCount] = useState(9); // 3x3 grid

  const { data, isLoading } = useQuery({
    queryKey: ["surveys-all"],
    queryFn: () => fetchSurveys({ data: {} as never }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const surveys = data?.surveys ?? [];
  const displaySurveys = surveys.slice(0, visibleCount);
  const hasMore = visibleCount < surveys.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 9);
  };

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/home">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Surveys</h1>
          {surveys.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {surveys.length} surveys available
            </p>
          )}
        </div>
      </div>

      {/* Grid */}
      {isLoading && <SurveyGridSkeleton />}

      {!isLoading && surveys.length === 0 && (
        <EmptyState
          icon={Star}
          title="No surveys available"
          description="Check back later for new surveys"
        />
      )}

      {!isLoading && surveys.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {displaySurveys.map((survey: Survey) => (
              <SurveyGridCard key={survey.id} survey={survey} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button onClick={handleLoadMore} variant="outline">
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SurveyGridCard({ survey }: { survey: Survey }) {
  const [imageBroken, setImageBroken] = useState(false);

  const handleClick = () => {
    window.open(survey.entryLink, "_blank", "noopener,noreferrer");
  };

  const providerImage = SURVEY_PROVIDER_IMAGES[survey.network];
  const providerName =
    survey.network === "cpxresearch"
      ? "CPX"
      : survey.network === "theoremreach"
        ? "TheoremReach"
        : "Timewall";

  // Timewall wall card
  if (survey.network === "timewall" && survey.id === "timewall-wall") {
    return (
      <button
        onClick={handleClick}
        className="group relative flex h-full flex-col gap-2 rounded-2xl border bg-card p-3 text-left transition-transform active:scale-[0.98]"
      >
        {/* Provider chip */}
        <div className="absolute right-2 top-2 h-6 w-6 overflow-hidden rounded-full bg-white">
          {providerImage && !imageBroken ? (
            <img
              src={providerImage}
              alt={providerName}
              className="h-full w-full object-contain"
              onError={() => setImageBroken(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[8px] font-bold">
              {providerName}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-1 flex-col gap-2">
          <div className="text-sm font-medium">Browse surveys</div>
          
          <Button size="sm" className="mt-auto w-full text-xs">
            Open
            <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </button>
    );
  }

  // Regular survey card
  return (
    <button
      onClick={handleClick}
      className="group relative flex h-full flex-col gap-2 rounded-2xl border bg-card p-3 text-left transition-transform active:scale-[0.98]"
    >
      {/* Provider chip */}
      <div className="absolute right-2 top-2 h-6 w-6 overflow-hidden rounded-full bg-white">
        {providerImage && !imageBroken ? (
          <img
            src={providerImage}
            alt={providerName}
            className="h-full w-full object-contain"
            onError={() => setImageBroken(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[8px] font-bold text-foreground">
            {providerName}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-1 flex-col gap-2">
        {/* Reward */}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-primary">
            {survey.payoutCoins}
          </span>
          <span className="text-xs text-muted-foreground">coins</span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
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

        {/* Button */}
        <Button size="sm" className="mt-auto w-full text-xs">
          Start
          <ExternalLink className="ml-1 h-3 w-3" />
        </Button>
      </div>
    </button>
  );
}

function SurveyGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Skeleton key={i} className="h-40 w-full rounded-2xl" />
      ))}
    </div>
  );
}
