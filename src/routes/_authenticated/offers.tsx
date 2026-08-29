import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { FeaturedOffers } from "@/components/FeaturedOffers";
import { OfferFilterButton, type OfferFilter } from "@/components/OfferFilterButton";
import { OfferwallSlot } from "@/components/OfferwallSlot";
import { SectionBanner } from "@/components/SectionBanner";
import { SectionTitle } from "@/components/States";

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
      <h1 className="mt-2 text-2xl">Offers</h1>
      <p className="text-sm text-muted-foreground">Complete partner offers for bigger payouts.</p>

      <SectionBanner section="offers" />

      <div className="mt-4 flex items-center justify-between gap-2">
        <SectionTitle className="!m-0">Featured Offers</SectionTitle>
        <OfferFilterButton value={filter} onChange={setFilter} />
      </div>
      <FeaturedOffers scope="home" filter={filter} />
      <div className="mt-3 flex justify-center">
        <ViewAllLink to="/featured" testid="offers-view-all-featured" />
      </div>

      <SectionTitle>Offerwall</SectionTitle>
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
