import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Layers, Star, Tag } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { FeaturedOffers } from "@/components/FeaturedOffers";
import { OfferFilterButton, type OfferFilter } from "@/components/OfferFilterButton";
import { OfferwallSlot } from "@/components/OfferwallSlot";
import { SectionBanner } from "@/components/SectionBanner";
import { SectionHeading } from "@/components/SectionHeading";

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
  return (
    <AppShell subtitle="Offers">
      <SectionHeading
        size="page"
        icon={Tag}
        title="Offers"
        subtitle="Complete partner offers for bigger payouts."
      />

      <SectionBanner section="offers" />

      <SectionHeading
        icon={Star}
        title="Featured Offers"
        className="!mt-4"
        action={<OfferFilterButton value={filter} onChange={setFilter} />}
      />
      <FeaturedOffers scope="home" filter={filter} />
      <div className="mt-3 flex justify-center">
        <ViewAllLink to="/featured" testid="offers-view-all-featured" />
      </div>

      <SectionHeading icon={Layers} title="Offerwall" />
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
