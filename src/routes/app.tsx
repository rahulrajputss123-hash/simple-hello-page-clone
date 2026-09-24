import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Coins, ShieldCheck, Sparkles, Wallet } from "lucide-react";

import { EarnWaysSection } from "@/components/landing/EarnWaysSection";
import { OffersShowcase } from "@/components/landing/OffersShowcase";
import { TrustSection } from "@/components/landing/TrustSection";
import { StoreButtons, StoreDialog } from "@/components/landing/StoreButtons";
import { useStoreDialog } from "@/components/landing/useStoreDialog";
import { HOW_IT_WORKS, type StoreKey } from "@/components/landing/landing-data";

const PAGE_TITLE = "Download CashGPT — Get paid for ads, offers & games";
const PAGE_DESCRIPTION =
  "Install CashGPT and earn real cash 8 different ways — ads, shortlinks, surveys, games and more. Cash out to PayPal, crypto or gift cards from just $1.";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESCRIPTION },
    ],
  }),
  component: AppLandingPage,
});

/** True once the window has scrolled past `offset` px. Drives the sticky mobile bar. */
function useScrolledPast(offset: number) {
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    const onScroll = () => setPassed(window.scrollY > offset);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [offset]);

  return passed;
}

function AppLandingPage() {
  const storeDialog = useStoreDialog();
  const showStickyBar = useScrolledPast(480);

  return (
    <div className="page-fade-in min-h-screen bg-background">
      {/* ------------------------------------------------------------------ */}
      {/* 1 — Hero                                                            */}
      {/* ------------------------------------------------------------------ */}
      <header className="relative isolate overflow-hidden bg-jade-gradient">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(closest-side, var(--color-gold), transparent)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-24 size-80 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(closest-side, var(--color-mint), transparent)" }}
        />

        <div className="relative mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8">
          <img
            src="/logo-horizontal-dark.png"
            alt="CashGPT — Earn · Complete · Cashout"
            className="h-9 w-auto select-none sm:h-10"
            draggable={false}
            decoding="async"
          />

          <div className="mt-12 max-w-2xl sm:mt-16">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-gold-foreground shadow-gold">
              <Sparkles className="size-3.5" /> Free to install
            </span>

            <h1 className="mt-5 font-display text-[2.4rem] leading-[1.05] text-primary-foreground sm:text-[3.5rem]">
              Get paid for the time you're <span className="text-gold">already spending</span>.
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-primary-foreground/75 sm:text-lg">
              Watch, play, survey and claim offers — then cash out to PayPal, crypto or gift cards
              from just $1. Eight ways to earn, one app.
            </p>

            <StoreButtons onSelect={storeDialog.select} tone="dark" className="mt-8" />

            <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-primary-foreground/60">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-mint" /> No hidden charges
              </li>
              <li className="flex items-center gap-1.5">
                <Wallet className="size-3.5 text-mint" /> Withdraw from $1
              </li>
              <li className="flex items-center gap-1.5">
                <Coins className="size-3.5 text-mint" /> Paid in real currency
              </li>
            </ul>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl space-y-16 px-4 py-14 sm:space-y-20 sm:px-6 sm:py-20">
        {/* 2 — 8 Ways to Earn */}
        <EarnWaysSection />

        {/* 3 — Featured offers showcase */}
        <OffersShowcase />

        {/* 4 — How it works */}
        <HowItWorks />

        {/* 5 — Trust */}
        <TrustSection />

        {/* 6 — Final CTA */}
        <FinalCta onSelect={storeDialog.select} />
      </main>

      {/* 8 — Minimal footer. Extra bottom padding clears the sticky mobile bar. */}
      <footer className="bg-jade-gradient px-4 py-8 pb-28 sm:px-6 md:pb-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-3 text-center">
          <img
            src="/logo-horizontal-dark.png"
            alt="CashGPT"
            className="h-8 w-auto select-none"
            draggable={false}
            decoding="async"
          />
          <p className="text-xs text-primary-foreground/60">
            © {new Date().getFullYear()} CashGPT. All rights reserved.
          </p>
        </div>
      </footer>

      {/* 7 — Sticky install bar, mobile only */}
      <div
        data-testid="sticky-install-bar"
        aria-hidden={!showStickyBar}
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-4 py-3 shadow-lift backdrop-blur-md transition-transform duration-300 md:hidden ${
          showStickyBar ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
      >
        <div className="mx-auto flex w-full max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm leading-tight text-foreground">
              Start earning today
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              Free install · Payouts from $1
            </p>
          </div>
          <StoreButtons
            onSelect={storeDialog.select}
            tone="light"
            compact
            primaryOnly
            className="shrink-0"
          />
        </div>
      </div>

      <StoreDialog
        store={storeDialog.store}
        open={storeDialog.open}
        onOpenChange={storeDialog.setOpen}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  4 — How it works                                                          */
/* -------------------------------------------------------------------------- */

function HowItWorks() {
  return (
    <section data-testid="how-it-works" aria-labelledby="how-it-works-heading">
      <div className="text-center">
        <h2
          id="how-it-works-heading"
          className="font-display text-[1.6rem] leading-tight text-foreground sm:text-[2rem]"
        >
          How it <span className="text-gold-dark">works</span>
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Three steps from install to payout. No invites, no subscriptions.
        </p>
      </div>

      <ol
        className="stagger-children mt-7 grid gap-4 sm:grid-cols-3"
        data-testid="how-it-works-steps"
      >
        {HOW_IT_WORKS.map((step) => (
          <li
            key={step.number}
            className="surface-card relative flex flex-col gap-2 p-5 pt-6"
            data-testid={`how-it-works-step-${step.number}`}
          >
            <span
              aria-hidden
              className="text-amount grid size-11 place-items-center rounded-2xl bg-jade-gradient text-lg text-primary-foreground shadow-lift"
            >
              {step.number}
            </span>
            <p className="mt-1 font-display text-lg leading-tight text-foreground">{step.title}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  6 — Final CTA                                                             */
/* -------------------------------------------------------------------------- */

function FinalCta({ onSelect }: { onSelect: (store: StoreKey) => void }) {
  return (
    <section
      data-testid="final-cta"
      aria-labelledby="final-cta-heading"
      className="relative isolate overflow-hidden rounded-[1.75rem] bg-jade-gradient px-5 py-10 text-center shadow-lift sm:px-10 sm:py-14"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-20 size-56 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--color-gold), transparent)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-16 size-56 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--color-mint), transparent)" }}
      />

      <div className="relative">
        <h2
          id="final-cta-heading"
          className="font-display text-[1.9rem] leading-tight text-primary-foreground sm:text-[2.5rem]"
        >
          Your first payout is <span className="text-gold">minutes away</span>
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-primary-foreground/75 sm:text-base">
          Install CashGPT, finish a task or two, and withdraw as soon as you hit $1.
        </p>

        <StoreButtons
          onSelect={onSelect}
          tone="dark"
          className="mt-8 justify-center sm:justify-center"
        />
      </div>
    </section>
  );
}
