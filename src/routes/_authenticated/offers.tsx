import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { FeaturedOffers } from "@/components/FeaturedOffers";
import { OfferwallSlot } from "@/components/OfferwallSlot";
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
  return (
    <AppShell subtitle="Offers">
      <h1 className="mt-2 text-2xl">Offers</h1>
      <p className="text-sm text-muted-foreground">Complete partner offers for bigger payouts.</p>

      <SectionTitle>Featured Offers</SectionTitle>
      <FeaturedOffers scope="home" />
      <div className="mt-3 flex justify-center">
        <Link
          to="/featured"
          className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
        >
          View All
        </Link>
      </div>

      <SectionTitle>Offerwall</SectionTitle>
      <OfferwallSlot limit={6} />
      <div className="mt-3 flex justify-center">
        <Link
          to="/offerwall"
          className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
        >
          View All
        </Link>
      </div>
    </AppShell>
  );
}
