import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Layers, LayoutGrid, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { AppShell } from "@/components/AppShell";
import { FeaturedOffers } from "@/components/FeaturedOffers";
import { OfferFilterButton, type OfferFilter } from "@/components/OfferFilterButton";
import { OfferwallSlot } from "@/components/OfferwallSlot";
import { SectionBanner } from "@/components/SectionBanner";
import { SectionHeading } from "@/components/SectionHeading";
import { getFeaturedFeed } from "@/lib/offers.functions";

export const Route = createFileRoute("/_authenticated/offers")({
  head: () => ({
    meta: [
      { title: "Offers — CashGPT" },
      { name: "description", content: "Featured partner offers and offerwall networks." },
      { property: "og:title", content: "Offers — CashGPT" },
      { property: "og:description", content: "Featured partner offers and offerwall networks." },
    ],
  }),
  component: OffersPage,
});

function OffersPage() {
  const [filter, setFilter] = useState<OfferFilter>("All");
  const queryClient = useQueryClient();
  const fetchFeed = useServerFn(getFeaturedFeed);

  // Prefetch offerwall when the page mounts
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ["sdk-offerwall-public", "all"],
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);

  return (
    <AppShell subtitle="Offers" mainClass="page-fade-in">
      <SectionHeading
        variant="ribbon"
        size="page"
        icon={Tag}
        iconSrc="/icons/icon-offers.png"
        title="Offers"
        subtitle="Complete partner offers for bigger payouts."
      />

      <SectionBanner section="offers" />

      {/* scope="all" is the complete, unsliced feed (scope="home" slices to
          settings.featuredSlots — that's the Home teaser, not this page). No
          "View All" link here: it pointed at /featured, which renders the same
          scope="all" list, so it led nowhere new. /featured is still reachable
          from the Home screen's Featured Offers teaser. */}
      <SectionHeading
        variant="ribbon"
        icon={LayoutGrid}
        title="All Offers"
        className="!mt-4"
        action={<OfferFilterButton value={filter} onChange={setFilter} />}
      />
      <FeaturedOffers scope="all" filter={filter} />

      <SectionHeading
        variant="ribbon"
        icon={Layers}
        iconSrc="/icons/icon-offerwall.png"
        title="Offerwall"
      />
      <OfferwallSlot limit={6} />
      <div className="mt-3 flex justify-center">
        <ViewAllLink to="/offerwall" testid="offers-view-all-offerwall" />
      </div>
    </AppShell>
  );
}

function ViewAllLink({ to, testid }: { to: string; testid: string }) {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Link
      to={to as any}
      data-testid={testid}
      className="group inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-card px-4 py-1.5 text-xs font-semibold text-primary shadow-soft transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
    >
      View All
      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
