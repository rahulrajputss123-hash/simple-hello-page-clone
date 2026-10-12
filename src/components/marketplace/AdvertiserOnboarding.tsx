import { ArrowLeft, ArrowRight, Check, CircleDollarSign, MapPin, MousePointer2, Sparkles, Target } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { BrandMark } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { safeStorage } from "@/lib/safe-storage";
import { advertiserOnboardingStorageKey, getAdvertiserOnboardingContent } from "@/lib/marketplace/advertiser-onboarding";
import type { AdvertiserOverview } from "@/lib/marketplace/advertiser.server";

const screens = [
  { title: "Welcome to CashGPT", description: "Grow your brand with campaigns that reward real actions.", image: "/images/advertiser-onboarding/01-welcome.webp", alt: "CashGPT advertiser welcome illustration", chips: [[MousePointer2, "Real actions"], [Target, "Pay per result"]] },
  { title: "Promote Your Brand", description: "Create campaigns with proof-based or automatically verified actions, set rewards and slots, and reach CashGPT members without changing your existing campaign rules.", image: "/images/advertiser-onboarding/02-promote.webp", alt: "CashGPT advertiser campaign promotion illustration", chips: [[MapPin, "Country targeting"], [CircleDollarSign, "Set rewards"]] },
] as const;

export function advertiserOnboardingSeen(userId: string) {
  return safeStorage.getItem(advertiserOnboardingStorageKey(userId)) === "seen";
}

export function AdvertiserOnboarding({ userId, overview, onComplete }: { userId: string; overview: AdvertiserOverview | null; onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const [burst, setBurst] = useState(false);
  const [count, setCount] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const content = useMemo(() => getAdvertiserOnboardingContent({ promoActive: overview?.settings.promoActive ?? false, lifetimeDeposited: overview?.account?.lifetimeDeposited ?? 0, userBonusPercent: overview?.userBonusPercent ?? 0, minDepositUsd: overview?.settings.minDepositUsd ?? 0, maxDepositUsd: overview?.settings.maxDepositUsd ?? 0, promoEndsAt: overview?.settings.promoEndsAt ?? null }), [overview]);
  const isFinal = index === 2;
  const exampleDeposit = Math.max(0, overview?.settings.minDepositUsd ?? 0);
  const exampleBonus = Math.round(exampleDeposit * (content.percent / 100) * 100) / 100;
  const screen = isFinal ? { title: content.title, description: content.description, image: content.bonusEligible ? "/images/advertiser-onboarding/03-bonus.webp" : "/images/advertiser-onboarding/04-benefits.webp", alt: content.bonusEligible ? "CashGPT advertiser bonus illustration" : "CashGPT advertiser benefits illustration", chips: [] as readonly (readonly [typeof Check, string])[] } : screens[index]!;

  useEffect(() => { closeButtonRef.current?.focus(); }, []);
  useEffect(() => {
    if (!isFinal || !content.bonusEligible) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setCount(content.percent); return; }
    let frame = 0; const start = performance.now();
    const tick = (now: number) => { const progress = Math.min(1, (now - start) / 650); setCount(Math.round(content.percent * progress)); if (progress < 1) frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [content.bonusEligible, content.percent, isFinal]);
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") event.preventDefault(); }; document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey); }, []);

  const finish = () => { setBurst(true); window.setTimeout(() => { safeStorage.setItem(advertiserOnboardingStorageKey(userId), "seen"); onComplete(); }, 500); };
  const next = () => isFinal ? finish() : setIndex((value) => value + 1);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#061f1d]/45 p-0 sm:p-5" role="dialog" aria-modal="true" aria-labelledby="advertiser-onboarding-title">
      <section className="relative flex h-[100dvh] min-h-[560px] w-full max-w-md flex-col overflow-hidden bg-[#faf7ef] text-[#0b2b28] shadow-2xl sm:h-[min(760px,calc(100vh-2.5rem))] sm:rounded-[2rem] sm:border sm:border-[#d4af37]/30">
        <header className="flex items-center justify-between px-6 pb-3 pt-5"><div className="flex items-center gap-2.5"><BrandMark className="size-8 rounded-xl" /><div><p className="font-display text-sm font-bold">CashGPT</p><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a37d1d]">CashGPT advertiser</p></div></div><span className="text-xs font-bold text-[#667a74]">{index + 1} / 3</span></header>
        <div className="flex gap-1.5 px-6" aria-label={`Step ${index + 1} of 3`}>{[0, 1, 2].map((step) => <span key={step} className={`h-1.5 flex-1 rounded-full ${step === index ? "bg-[#d4af37]" : "bg-[#d4af37]/20"}`} />)}</div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5 pt-4 text-center"><div className="onboarding-art relative mx-auto flex h-[42vh] min-h-[250px] max-h-[350px] items-center justify-center overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_50%_40%,#e5f5ec_0%,#f7ecd0_52%,#faf7ef_78%)]"><span className="absolute inset-8 rounded-full border border-[#d4af37]/20" />{["left-1/4 top-1/4", "right-1/4 top-1/3", "left-1/3 bottom-1/4"].map((position) => <Sparkles key={position} className={`absolute ${position} size-3 text-[#d4af37]/70`} />)}<img src={screen.image} alt={screen.alt} width={800} height={800} loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} decoding="async" className="relative h-full w-full object-contain mix-blend-multiply" /></div><div className="mx-auto mt-5 max-w-sm"><h1 id="advertiser-onboarding-title" className="font-display text-[2rem] font-extrabold leading-tight tracking-[-0.04em] text-[#0b2b28]">{screen.title}</h1><p className="mt-3 text-sm leading-7 text-[#667a74]">{screen.description}</p>{!isFinal && <div className="mt-4 flex flex-wrap justify-center gap-2">{screen.chips.map(([Icon, label]) => <span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-[#dff4e9] px-3 py-1.5 text-xs font-bold text-[#165c50]"><Icon className="size-3.5" />{label}</span>)}</div>}{isFinal && (content.bonusEligible ? <div className="mt-4 rounded-2xl border border-[#d4af37] bg-[#dff4e9] p-4 text-left"><p className="text-xs font-bold uppercase tracking-widest text-[#a37d1d]">Campaign credit</p><p className="mt-1 font-display text-4xl font-extrabold text-[#0b2b28]">{count}%</p><p className="text-sm text-[#496c64]">Unlocks as you spend.</p><p className="mt-2 text-sm font-semibold text-[#165c50]">Example: ${exampleDeposit.toFixed(2)} deposit → ${exampleBonus.toFixed(2)} credit</p></div> : <div className="mt-4 space-y-2 rounded-2xl bg-[#eef6f0] p-4 text-left text-sm font-semibold text-[#165c50]">{["Proof-based campaign actions", "Flexible rewards and slots", "Clear campaign reporting"].map((item) => <p key={item} className="flex items-center gap-2"><Check className="size-4 text-[#a37d1d]" />{item}</p>)}</div>)}</div></div>
        <footer className="relative flex items-center gap-3 border-t border-[#d4af37]/20 bg-[#faf7ef] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">{index > 0 && <Button type="button" variant="ghost" className="text-[#667a74]" onClick={() => setIndex((value) => value - 1)} aria-label="Back"><ArrowLeft className="mr-1 size-4" />Back</Button>}<Button ref={closeButtonRef} type="button" variant="jade" size="lg" className="h-[52px] flex-1 rounded-full bg-[#d4af37] text-[#0b2b28] shadow-[0_8px_20px_rgba(163,125,29,.18)] hover:bg-[#e0bd48] active:translate-y-px" onClick={next}>{isFinal ? "Get Started" : "Next"}<ArrowRight className="ml-2 size-4" />{burst && <span className="sparkle-burst" aria-hidden="true">✦</span>}</Button></footer>
      </section>
    </div>
  );
}

export default AdvertiserOnboarding;
