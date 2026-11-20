/**
 * Surveys Section - Home Page
 * 
 * Displays survey cards from CPX Research, TheoremReach, and Timewall.
 * Horizontal scroll row showing SURVEY_CARDS_VISIBLE cards with peek.
 */

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useInView } from "react-intersection-observer";
import { Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/States";
import { Link } from "@tanstack/react-router";
import { SectionHeading } from "@/components/SectionHeading";
import { fetchSurveysList } from "@/lib/surveys/surveys-home.functions";
import { 
  SURVEY_CARDS_VISIBLE, 
  SURVEY_PROVIDER_IMAGES,
  SURVEY_PROVIDER_NAMES 
} from "@/lib/surveys/survey-ui-config";
import { useState } from "react";

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

  const { data, isLoading } = useQuery({
    queryKey: ["surveys-home-feed"],
    queryFn: () => fetchSurveys({ data: {} as never }),
    enabled: inView,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const surveys = data?.surveys ?? [];
  const displaySurveys = surveys.slice(0, 8); // Max 8 on home

  return (
    <section ref={ref} className="space-y-3">
      <SectionHeading
        variant="ribbon"
        iconSrc="/icons/icon-survey.png"
        icon={Star}
        title="Featured Surveys"
        action={
          surveys.length > 0 ? (
            <Link
              to="/surveys"
              className="text-sm font-medium text-primary hover:underline"
            >
              See all
            </Link>
          ) : null
        }
      />

      {isLoading && <SurveysSkeleton />}

      {!isLoading && surveys.length === 0 && (
        <EmptyState
          icon={Star}
          title="No surveys available"
          description="Check back later for new surveys"
        />
      )}

      {!isLoading && surveys.length > 0 && (
        <div className="relative -mx-4 overflow-x-auto px-4">
          <div className="flex gap-3" style={{ width: "max-content" }}>
            {displaySurveys.map((survey: Survey) => (
              <div
                key={survey.id}
                style={{
                  width: `calc((100vw - 2rem - ${(SURVEY_CARDS_VISIBLE - 0.5) * 0.75}rem) / ${SURVEY_CARDS_VISIBLE})`,
                  minWidth: "140px",
                  maxWidth: "200px",
                }}
              >
                <SurveyCard survey={survey} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function SurveyCard({ survey }: { survey: Survey }) {
  const [imageBroken, setImageBroken] = useState(false);

  const handleClick = () => {
    window.open(survey.entryLink, "_blank", "noopener,noreferrer");
  };

  const providerImage = SURVEY_PROVIDER_IMAGES[survey.network];
  const providerName = SURVEY_PROVIDER_NAMES[survey.network] || survey.network;

  // Timewall wall card
  if (survey.network === "timewall" && survey.id === "timewall-wall") {
    return (
      <button
        onClick={handleClick}
        className="group relative flex h-full min-h-[180px] flex-col gap-2.5 rounded-2xl border bg-card p-3 text-left transition-transform active:scale-[0.98]"
      >
        {/* Provider chip - top right */}
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-white px-1.5 py-0.5 shadow-sm">
          {providerImage && !imageBroken ? (
            <img
              src={providerImage}
              alt={providerName}
              className="h-5 w-5 object-contain"
              onError={() => setImageBroken(true)}
            />
          ) : (
            <span className="text-[9px] font-semibold text-foreground">{providerName}</span>
          )}
        </div>

        {/* Content */}
        <div className="mt-4 flex flex-1 flex-col">
          <div className="text-sm font-medium">Browse surveys</div>
          
          {/* Open button */}
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
      className="group relative flex h-full min-h-[180px] flex-col gap-2 rounded-2xl border bg-card p-3 text-left transition-transform active:scale-[0.98]"
    >
      {/* Provider chip - top right with logo + name */}
      <div className="absolute right-2 top-2 flex max-w-[calc(100%-1rem)] items-center gap-1 rounded-full bg-white px-1.5 py-0.5 shadow-sm">
        {providerImage && !imageBroken ? (
          <>
            <img
              src={providerImage}
              alt={providerName}
              className="h-5 w-5 shrink-0 object-contain"
              onError={() => setImageBroken(true)}
            />
            <span className="truncate text-[9px] font-semibold text-foreground">{providerName}</span>
          </>
        ) : (
          <span className="truncate text-[9px] font-semibold text-foreground">{providerName}</span>
        )}
      </div>

      {/* Content */}
      <div className="mt-6 flex flex-1 flex-col gap-2">
        {/* Reward - large and prominent */}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold leading-none text-primary">
            {survey.payoutCoins}
          </span>
          <span className="text-xs text-muted-foreground">coins</span>
        </div>

        {/* Meta: LOI and Rating */}
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

        {/* Start button */}
        <Button size="sm" className="mt-auto w-full text-xs">
          Start
          <ExternalLink className="ml-1 h-3 w-3" />
        </Button>
      </div>
    </button>
  );
}

function SurveysSkeleton() {
  return (
    <div className="relative -mx-4 overflow-x-auto px-4">
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton
            key={i}
            className="h-40 shrink-0 rounded-2xl"
            style={{
              width: `calc((100vw - 2rem - ${(SURVEY_CARDS_VISIBLE - 0.5) * 0.75}rem) / ${SURVEY_CARDS_VISIBLE})`,
              minWidth: "140px",
              maxWidth: "200px",
            }}
          />
        ))}
      </div>
    </div>
  );
}
