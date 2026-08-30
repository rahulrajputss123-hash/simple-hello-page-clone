import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { FeaturedOffers } from "@/components/FeaturedOffers";
import { SectionHeading } from "@/components/SectionHeading";

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
      <SectionHeading size="page" icon={Star} title="Featured Offers" />
      <FeaturedOffers scope="all" />
    </AppShell>
  );
}
