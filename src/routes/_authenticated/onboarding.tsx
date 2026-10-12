import { createFileRoute } from "@tanstack/react-router";

import { PremiumOnboarding } from "@/components/PremiumOnboarding";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Welcome to CashGPT" },
      { name: "description", content: "Discover the premium CashGPT earning experience." },
      { property: "og:title", content: "Welcome to CashGPT" },
      {
        property: "og:description",
        content: "Discover the premium CashGPT earning experience.",
      },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  return <PremiumOnboarding />;
}
