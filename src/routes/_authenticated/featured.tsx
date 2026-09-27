import { createFileRoute } from "@tanstack/react-router";
import { LayoutGrid } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { FeaturedOffers } from "@/components/FeaturedOffers";
import { SectionHeading } from "@/components/SectionHeading";

export const Route = createFileRoute("/_authenticated/featured")({
  head: () => ({
    meta: [
      { title: "All Offers — CashGPT" },
      {
        name: "description",
        content: "Browse every partner offer and claim your rewards.",
      },
      { property: "og:title", content: "All Offers — CashGPT" },
      {
        property: "og:description",
        content: "Browse every partner offer and claim your rewards.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FeaturedPage,
});

function FeaturedPage() {
  return (
    <AppShell subtitle="All offers" mainClass="page-fade-in">
      {/* Same heading/icon as the Offers page section — both render scope="all". */}
      <SectionHeading variant="ribbon" size="page" icon={LayoutGrid} title="All Offers" />
      <FeaturedOffers scope="all" />
    </AppShell>
  );
}
