import { ArrowLeft, ArrowRight, CheckCircle2, Megaphone } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { safeStorage } from "@/lib/safe-storage";
import {
  advertiserOnboardingStorageKey,
  getAdvertiserOnboardingContent,
} from "@/lib/marketplace/advertiser-onboarding";
import type { AdvertiserOverview } from "@/lib/marketplace/advertiser.server";

const screens = [
  {
    title: "Welcome to CashGPT",
    description: "Grow your brand with campaigns that reward real actions.",
    image: "/images/advertiser-onboarding/01-welcome-brand-growth.svg",
    alt: "Glossy jade gift box with gold coins and a growth arrow",
  },
  {
    title: "Promote Your Brand",
    description:
      "Create campaigns with proof-based or automatically verified actions, set rewards and slots, and reach CashGPT members without changing your existing campaign rules.",
    image: "/images/advertiser-onboarding/02-promote-your-brand.svg",
    alt: "Jade megaphone with rising campaign analytics and gold engagement tokens",
  },
] as const;

// Re-export util for backwards compatibility
export { advertiserOnboardingSeen } from "@/lib/marketplace/advertiser-onboarding-utils";

export function AdvertiserOnboarding({
  userId,
  overview,
  onComplete,
}: {
  userId: string;
  overview: AdvertiserOverview | null;
  onComplete: () => void;
}) {
  const [index, setIndex] = useState(0);
  const content = useMemo(
    () =>
      getAdvertiserOnboardingContent({
        promoActive: overview?.settings.promoActive ?? false,
        lifetimeDeposited: overview?.account?.lifetimeDeposited ?? 0,
        userBonusPercent: overview?.userBonusPercent ?? 0,
        minDepositUsd: overview?.settings.minDepositUsd ?? 0,
        maxDepositUsd: overview?.settings.maxDepositUsd ?? 0,
        promoEndsAt: overview?.settings.promoEndsAt ?? null,
      }),
    [overview],
  );
  const isFinal = index === 2;
  const screen = isFinal
    ? {
        title: content.title,
        description: content.description,
        image: "/images/advertiser-onboarding/03-first-deposit-bonus.svg",
        alt: "Jade campaign wallet with a gold gift and bonus medallion",
      }
    : screens[index]!;

  const finish = () => {
    safeStorage.setItem(advertiserOnboardingStorageKey(userId), "seen");
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#061f1d]/70 p-0 backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true" aria-labelledby="advertiser-onboarding-title">
      <section className="relative flex h-[100dvh] min-h-[560px] w-full max-w-md flex-col overflow-hidden bg-[#faf7ef] shadow-2xl sm:h-[min(760px,calc(100vh-2.5rem))] sm:rounded-[2rem] sm:border sm:border-[#d4af37]/30">
        <div className="h-1.5 bg-[#d4af37]/20" aria-hidden="true">
          <div className="h-full bg-[#d4af37] transition-[width] duration-300" style={{ width: `${((index + 1) / 3) * 100}%` }} />
        </div>
        <header className="flex items-center justify-between px-5 py-4 text-[#0b2b28]">
          <span className="flex items-center gap-2 font-display text-sm font-semibold"><Megaphone className="size-4 text-[#a37d1d]" /> CashGPT for brands</span>
          <span className="text-xs font-semibold text-[#667a74]">{index + 1} of 3</span>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 text-center">
          <div className="mx-auto flex h-[42vh] min-h-[250px] max-h-[350px] items-center justify-center rounded-[2rem] bg-[radial-gradient(circle_at_50%_35%,#dff4e9_0%,#b9d5ce_45%,#0b2b28_100%)] p-6 shadow-inner">
            <img src={screen.image} alt={screen.alt} className="h-full w-full object-contain" />
          </div>
          <div className="mx-auto mt-5 max-w-sm">
            <h1 id="advertiser-onboarding-title" className="text-3xl font-extrabold tracking-[-0.035em] text-[#0b2b28]">{screen.title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#667a74]">{screen.description}</p>
            {isFinal && content.bonusEligible && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#f4cf56]/20 px-3 py-1 text-xs font-bold text-[#7f6114]"><CheckCircle2 className="size-4" /> {content.percent}% live campaign credit rate</p>
            )}
          </div>
        </div>
        <footer className="flex items-center gap-3 border-t border-[#d4af37]/20 bg-[#faf7ef]/95 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {index > 0 && <Button type="button" variant="ghost" size="icon" onClick={() => setIndex((value) => value - 1)} aria-label="Previous screen"><ArrowLeft className="size-5" /></Button>}
          <Button type="button" variant="jade" size="lg" className="flex-1" onClick={() => (isFinal ? finish() : setIndex((value) => value + 1))}>{isFinal ? "Get Started" : "Next"}{!isFinal && <ArrowRight className="ml-2 size-4" />}</Button>
        </footer>
      </section>
    </div>
  );
}
