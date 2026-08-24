import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { FeaturedOffers } from "@/components/FeaturedOffers";

export const Route = createFileRoute("/_authenticated/featured")({
  head: () => ({
    meta: [
      { title: "Featured Offers — CashGPT" },
      { name: "description", content: "Browse every featured partner offer and claim your rewards." },
      { property: "og:title", content: "Featured Offers — CashGPT" },
      {
        property: "og:description",
        content: "Browse every featured partner offer and claim your rewards.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FeaturedPage,
});

function FeaturedPage() {
  return (
    <AppShell subtitle="Featured offers">
      <h1 className="mb-3 mt-2 text-2xl">Featured Offers</h1>
      <FeaturedOffers scope="all" />
    </AppShell>
  );
}
