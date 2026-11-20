/**
 * Surveys Page - See All
 * 
 * 3-column grid showing all available surveys with load more pagination.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/States";
import { SectionHeading } from "@/components/SectionHeading";
import { fetchSurveysList } from "@/lib/surveys/surveys-home.functions";
import { SURVEY_PROVIDER_IMAGES, SURVEY_PROVIDER_NAMES, SURVEY_PROVIDER_COLORS } from "@/lib/surveys/survey-ui-config";
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
    <div className="space-y-4 p-4">
      {/* Header */}
      <SectionHeading
        variant="ribbon"
        size="page"
        iconSrc="/icons/icon-survey.png"
        icon={Star}
        title="All Surveys"
      />

      {surveys.length > 0 && !isLoading && (
        <p className="text-sm text-muted-foreground">
          {surveys.length} {surveys.length === 1 ? "survey" : "surveys"} available
        </p>
      )}

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
  const providerName = SURVEY_PROVIDER_NAMES[survey.network] || survey.network;
  const providerColors = SURVEY_PROVIDER_COLORS[survey.network];

  // Timewall wall card
  if (survey.network === "timewall" && survey.id === "timewall-wall") {
    return (
      <button
        onClick={handleClick}
        className="group relative flex h-full min-h-[180px] flex-col gap-2.5 rounded-2xl p-3 text-left transition-transform active:scale-[0.98]"
        style={{
          background: `linear-gradient(to bottom, ${providerColors.bg}, white)`,
          border: `1px solid ${providerColors.border}`,
        }}
      >
        {/* Provider chip */}
        <div className="absolute right-2 top-2 flex max-w-[calc(100%-1rem)] items-center gap-1 rounded-full bg-white px-1.5 py-0.5 shadow-sm">
          {providerImage && !imageBroken ? (
            <>
              <img
                src={providerImage}
                alt={providerName}
                className="h-5 w-5 shrink-0 object-contain"
                onError={() => setImageBroken(true)}
              />
              <span 
                className="text-[9px] font-semibold text-foreground"
                style={{
                  maxWidth: "14ch",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {providerName}
              </span>
            </>
          ) : (
            <span 
              className="text-[9px] font-semibold text-foreground"
              style={{
                maxWidth: "14ch",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {providerName}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-1 flex-col">
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
      className="group relative flex h-full min-h-[180px] flex-col gap-2 rounded-2xl p-3 text-left transition-transform active:scale-[0.98]"
      style={{
        background: `linear-gradient(to bottom, ${providerColors.bg}, white)`,
        border: `1px solid ${providerColors.border}`,
      }}
    >
      {/* Provider chip with logo + short name */}
      <div className="absolute right-2 top-2 flex max-w-[calc(100%-1rem)] items-center gap-1 rounded-full bg-white px-1.5 py-0.5 shadow-sm">
        {providerImage && !imageBroken ? (
          <>
            <img
              src={providerImage}
              alt={providerName}
              className="h-5 w-5 shrink-0 object-contain"
              onError={() => setImageBroken(true)}
            />
            <span 
              className="text-[9px] font-semibold text-foreground"
              style={{
                maxWidth: "14ch",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {providerName}
            </span>
          </>
        ) : (
          <span 
            className="text-[9px] font-semibold text-foreground"
            style={{
              maxWidth: "14ch",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {providerName}
          </span>
        )}
      </div>

      <div className="mt-6 flex flex-1 flex-col gap-2">
        {/* Reward - dark color */}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold leading-none" style={{ color: "#0F3D3A" }}>
            {survey.payoutCoins}
          </span>
          <span className="text-xs text-muted-foreground">coins</span>
        </div>

        {/* Meta - no wrap */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground" style={{ whiteSpace: "nowrap" }}>
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
