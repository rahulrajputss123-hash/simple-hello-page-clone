import { Link } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Coins, Megaphone, ShieldCheck, Wallet } from "lucide-react";

import {
  ADVERTISER_ANCHOR_ID,
  AdvertiserSection,
} from "@/components/landing/AdvertiserSection";
import { AuthCard } from "@/components/landing/AuthCard";
import { AppPreviewSection } from "@/components/landing/HeroPhone";
import { EarnWaysSection } from "@/components/landing/EarnWaysSection";
const LiveEarningsFeed = lazy(() =>
  import("@/components/landing/LiveEarningsFeed").then((mod) => ({
    default: mod.LiveEarningsFeed,
  }))
);
import { OffersShowcase } from "@/components/landing/OffersShowcase";
import { Reveal } from "@/components/landing/Reveal";
import { RotatingPhrase } from "@/components/landing/RotatingPhrase";
import { TrustSection } from "@/components/landing/TrustSection";
import {
  FAQ_ITEMS,
  LANDING_DESCRIPTION,
  SHOWCASE_OFFERS,
  WEB_HOW_IT_WORKS,
} from "@/components/landing/landing-data";
import { SocialLinks } from "@/components/SocialLinks";
import { Button } from "@/components/ui/button";
import { useAuthForm, type AuthMode } from "@/hooks/useAuthForm";
import { rememberAdvertiserIntent } from "@/lib/marketplace/intent";

const AUTH_ANCHOR_ID = "auth";

/** FAQ rich-result markup. Answers are in the DOM regardless, via <details>. */
function faqJsonLd() {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  });
}

/**
 * Public marketing + signup page for cashgpt.in.
 *
 * Rendered only on the web — `src/routes/index.tsx` keeps the native Capacitor
 * shell on its original splash → redirect path. Signup/login is inline in the hero
 * rather than on a separate screen, and runs through the same `useAuthForm` hook
 * the /auth route uses, so there is one implementation of the Supabase calls.
 */
export function WebLanding() {
  // Owned here (not inside AuthCard) so the sticky header can switch modes without
  // remounting the form and losing what the visitor already typed.
  const auth = useAuthForm({ initialMode: "signup", collectName: false });

  const authSectionRef = useRef<HTMLDivElement | null>(null);
  const [authInView, setAuthInView] = useState(true);

  const liveEarningsRef = useRef<HTMLDivElement | null>(null);
  const [showLiveEarnings, setShowLiveEarnings] = useState(false);

  // The sticky mobile CTA must never cover the form or its heading.
  useEffect(() => {
    const node = authSectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => setAuthInView(Boolean(entries[0]?.isIntersecting)),
      { threshold: 0.01 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Lazy-load LiveEarningsFeed when near viewport
  useEffect(() => {
    const node = liveEarningsRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShowLiveEarnings(true);
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /**
   * Header/CTA handler. On desktop the auth card sits in the hero's right column
   * and is already on screen, so the mode switches in place with no scrolling. On
   * narrower screens the form is below the fold, so it smooth-scrolls to it.
   */
  const goToAuth = useCallback(
    (mode: AuthMode) => {
      auth.setMode(mode);
      const node = authSectionRef.current;
      if (!node) return;

      const desktop = window.matchMedia("(min-width: 1024px)").matches;
      const rect = node.getBoundingClientRect();
      const onScreen = rect.top < window.innerHeight * 0.85 && rect.bottom > 0;
      if (desktop && onScreen) return;

      node.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [auth],
  );

  const startAsAdvertiser = useCallback(() => {
    rememberAdvertiserIntent();
    goToAuth("signup");
  }, [goToAuth]);

  return (
    // data-web-only lets the native shell hide this pre-hydration (see __root.tsx).
    <div className="min-h-screen bg-background" data-web-only>
      {/* ------------------------------------------------------------------ */}
      {/* 1 — Sticky header                                                   */}
      {/* ------------------------------------------------------------------ */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <Link to="/" aria-label="CashGPT home" className="shrink-0">
            <img
              src="/logo-horizontal-light.webp"
              alt="CashGPT"
              width={150}
              height={36}
              className="h-8 w-auto select-none sm:h-9"
              draggable={false}
            />
          </Link>

          <nav
            className="hidden items-center gap-1 text-sm font-semibold text-muted-foreground md:flex"
            aria-label="Sections"
          >
            <a href="#how-it-works" className="rounded-lg px-3 py-2 hover:text-foreground">
              How it works
            </a>
            <a
              href={`#${ADVERTISER_ANCHOR_ID}`}
              className="rounded-lg px-3 py-2 hover:text-foreground"
              data-testid="header-advertisers"
            >
              For advertisers
            </a>
            <a href="#faq" className="rounded-lg px-3 py-2 hover:text-foreground">
              FAQ
            </a>
          </nav>

          <nav className="flex items-center gap-2" aria-label="Account">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3"
              onClick={() => goToAuth("signin")}
              data-testid="header-login"
            >
              Log in
            </Button>
            <Button
              variant="gold"
              size="sm"
              className="h-9 px-4"
              onClick={() => goToAuth("signup")}
              data-testid="header-signup"
            >
              Sign up
            </Button>
          </nav>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* 2 — Hero: headline + offers on the left, inline auth on the right    */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative isolate overflow-hidden" aria-labelledby="landing-h1">
        {/* Ambient background: soft jade/gold glow. Decorative only. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div
            className="absolute -left-24 -top-32 size-[28rem] rounded-full opacity-[0.18]"
            style={{
              background: "radial-gradient(closest-side, var(--color-mint), transparent)",
            }}
          />
          <div
            className="absolute -right-28 top-10 size-[30rem] rounded-full opacity-[0.16]"
            style={{
              background: "radial-gradient(closest-side, var(--color-gold), transparent)",
            }}
          />
          <Coins className="absolute left-[12%] top-[38%] size-8 text-gold opacity-20" />
          <Coins className="absolute right-[8%] top-[22%] size-6 text-gold opacity-[0.15]" />
          <Coins className="absolute left-[62%] bottom-[12%] size-7 text-gold opacity-[0.12] lg:left-[46%]" />
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-5 sm:px-6 sm:pb-14 sm:pt-12">
          <div className="grid items-center gap-5 lg:grid-cols-[1.05fr_minmax(350px,400px)] lg:gap-12">
            {/* Left column */}
            <div>
              {/* Small door for the other audience, without competing with the signup. */}
              <a
                href={`#${ADVERTISER_ANCHOR_ID}`}
                data-testid="hero-advertiser-pill"
                className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold text-sky-700 transition-colors hover:bg-sky-500/15 sm:mb-4 sm:text-xs"
              >
                <Megaphone className="size-3.5" aria-hidden />
                Run a brand or app? Advertise on CashGPT
                <ArrowRight className="size-3" aria-hidden />
              </a>
              <h1
                id="landing-h1"
                className="font-display text-[1.72rem] leading-[1.12] text-foreground sm:text-[2.6rem] lg:text-[3.1rem]"
              >
                {/* Static text for screen readers and SEO */}
                <span className="sr-only">
                  Earn real money online by completing tasks, unlocking lockers, claiming deals,
                  visiting shortlinks, watching ads, taking surveys, installing apps and playing
                  games
                </span>
                {/* Visible headline with rotating phrase */}
                <span aria-hidden="true">
                  Earn real money online{" "}
                  <RotatingPhrase
                    phrases={[
                      "by completing tasks",
                      "by unlocking lockers",
                      "by claiming deals",
                      "by visiting shortlinks",
                      "by watching ads",
                      "by taking surveys",
                      "by installing apps",
                      "by playing games",
                    ]}
                    className="text-gold-dark"
                  />
                </span>
              </h1>
              <p className="mt-2 max-w-xl text-[13px] leading-snug text-muted-foreground sm:mt-3 sm:text-base sm:leading-relaxed">
                Free offers, surveys and games — cash out from just $5.
              </p>

              <h2 className="sr-only">Featured paid offers</h2>
              <OffersShowcase variant="compact" className="mt-4 sm:mt-7" />

              {/* Trust badges - shown on all screen sizes */}
              <ul className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-primary" aria-hidden /> Free to join
                </li>
                <li className="flex items-center gap-1.5">
                  <Wallet className="size-3.5 text-primary" aria-hidden /> $5 minimum payout
                </li>
                <li className="flex items-center gap-1.5">
                  <Coins className="size-3.5 text-primary" aria-hidden /> No card details
                </li>
              </ul>
            </div>

            {/* Right column — inline auth. Sticky on desktop so it follows the read. */}
            <div ref={authSectionRef} className="lg:sticky lg:top-24">
              <AuthCard auth={auth} id={AUTH_ANCHOR_ID} />
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl space-y-16 px-4 pb-16 sm:space-y-20 sm:px-6 sm:pb-20">
        {/* 4 — Inside the app (animated phone preview) */}
        <Reveal className="content-visible-auto">
          <AppPreviewSection />
        </Reveal>

        {/* 5 — 8 ways to earn */}
        <Reveal className="content-visible-auto">
          <EarnWaysSection />
        </Reveal>

        {/* 6 — How it works */}
        <div className="content-visible-auto">
          <HowItWorks />
        </div>

        {/* 7 — Advertisers: the other side of the marketplace */}
        <Reveal className="content-visible-auto">
          <AdvertiserSection onStart={startAsAdvertiser} />
        </Reveal>

        {/* 8 — Trust + testimonials (moved from the top, sits right before the FAQ) */}
        <Reveal className="content-visible-auto">
          <TrustSection />
        </Reveal>

        {/* 9 — FAQ */}
        <div className="content-visible-auto">
          <Faq />
        </div>

        {/* 10 — Live earnings (kept directly before the final CTA) */}
        <div ref={liveEarningsRef} className="content-visible-auto" style={{ minHeight: "600px" }}>
          {showLiveEarnings ? (
            <Suspense
              fallback={
                <div className="flex min-h-[600px] items-center justify-center">
                  <div className="text-sm text-muted-foreground">Loading live earnings...</div>
                </div>
              }
            >
              <Reveal>
                <LiveEarningsFeed />
              </Reveal>
            </Suspense>
          ) : null}
        </div>

        {/* 11 — Final CTA */}
        <Reveal className="content-visible-auto">
          <FinalCta onStart={() => goToAuth("signup")} onAdvertise={startAsAdvertiser} />
        </Reveal>
      </main>

      <Footer />

      {/* Sticky mobile CTA — hidden whenever the auth card is on screen. */}
      <div
        data-testid="sticky-start-bar"
        aria-hidden={authInView}
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 px-4 py-3 shadow-lift transition-transform duration-300 lg:hidden ${
          authInView ? "pointer-events-none translate-y-full" : "translate-y-0"
        }`}
      >
        <Button
          variant="gold"
          size="lg"
          className="w-full"
          onClick={() => goToAuth("signup")}
          data-testid="sticky-start-btn"
        >
          Start earning free
        </Button>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd() }} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  How it works                                                              */
/* -------------------------------------------------------------------------- */

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      data-testid="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="scroll-mt-20"
    >
      <div className="text-center">
        <h2
          id="how-it-works-heading"
          className="font-display text-[1.6rem] leading-tight text-foreground sm:text-[2rem]"
        >
          How it <span className="text-gold-dark">works</span>
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Three steps from signup to payout. No invites and no subscriptions.
        </p>
      </div>

      <Reveal stagger className="mt-7 grid gap-4 sm:grid-cols-3">
        {WEB_HOW_IT_WORKS.map((step) => (
          <StepCard key={step.number} step={step} />
        ))}
      </Reveal>
    </section>
  );
}

function StepCard({ step }: { step: (typeof WEB_HOW_IT_WORKS)[number] }) {
  return (
    <div
      className="surface-card flex flex-col gap-2 p-5 pt-6"
      data-testid={`how-it-works-step-${step.number}`}
    >
      <span
        aria-hidden
        className="text-amount grid size-11 place-items-center rounded-2xl bg-jade-gradient text-lg text-primary-foreground shadow-lift"
      >
        {step.number}
      </span>
      <h3 className="mt-1 font-display text-lg leading-tight text-foreground">{step.title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  FAQ                                                                       */
/* -------------------------------------------------------------------------- */

function Faq() {
  return (
    <section id="faq" data-testid="faq" aria-labelledby="faq-heading" className="scroll-mt-20">
      <div className="text-center">
        <h2
          id="faq-heading"
          className="font-display text-[1.6rem] leading-tight text-foreground sm:text-[2rem]"
        >
          Questions, <span className="text-gold-dark">answered</span>
        </h2>
      </div>

      {/* <details> keeps every answer in the DOM whether open or not, so the text is
          indexable and works with JavaScript disabled. */}
      <Reveal className="mx-auto mt-6 max-w-2xl space-y-3">
        {FAQ_ITEMS.map((item) => (
          <details
            key={item.question}
            className="surface-card group overflow-hidden p-0 [&_summary::-webkit-details-marker]:hidden"
            data-testid="faq-item"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-3 p-4 text-left text-sm font-semibold text-foreground">
              <h3 className="font-sans text-sm font-semibold tracking-normal">{item.question}</h3>
              <span
                aria-hidden
                className="grid size-6 shrink-0 place-items-center rounded-full bg-background-alt text-primary transition-transform duration-200 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </Reveal>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Final CTA + footer                                                        */
/* -------------------------------------------------------------------------- */

function FinalCta({ onStart, onAdvertise }: { onStart: () => void; onAdvertise: () => void }) {
  return (
    <section
      data-testid="final-cta"
      aria-labelledby="final-cta-heading"
      className="relative isolate overflow-hidden rounded-[1.75rem] bg-jade-gradient px-5 py-10 text-center shadow-lift sm:px-10 sm:py-14"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-20 size-56 rounded-full opacity-40"
        style={{ background: "radial-gradient(closest-side, var(--color-gold), transparent)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-16 size-56 rounded-full opacity-30"
        style={{ background: "radial-gradient(closest-side, var(--color-mint), transparent)" }}
      />

      <div className="relative">
        <h2
          id="final-cta-heading"
          className="font-display text-[1.9rem] leading-tight text-primary-foreground sm:text-[2.5rem]"
        >
          Start earning in <span className="text-gold">the next five minutes</span>
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-primary-foreground/75 sm:text-base">
          Create a free account, finish a task or two, and withdraw as soon as you reach $5.
        </p>
        <Button
          variant="gold"
          size="lg"
          className="mt-7 px-8"
          onClick={onStart}
          data-testid="final-cta-btn"
        >
          Create my free account
          <ArrowRight className="size-4" />
        </Button>
        <p className="mt-5 text-xs text-primary-foreground/70">
          Promoting an app or brand?{" "}
          <button
            type="button"
            onClick={onAdvertise}
            data-testid="final-cta-advertise"
            className="font-semibold text-gold underline-offset-2 hover:underline"
          >
            Start advertising
          </button>
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/70 bg-background-alt px-4 py-8 pb-24 sm:px-6 lg:pb-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5 text-center">
        <img
          src="/logo-horizontal-light.webp"
          alt="CashGPT"
          width={140}
          height={34}
          loading="lazy"
          className="h-7 w-auto select-none"
          draggable={false}
        />

        <SocialLinks />

        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <Link to="/legal/privacy" className="transition-colors hover:text-foreground">
            Privacy
          </Link>
          <Link to="/legal/terms" className="transition-colors hover:text-foreground">
            Terms
          </Link>
          <Link to="/legal/withdrawal-policy" className="transition-colors hover:text-foreground">
            Withdrawal Policy
          </Link>
          <Link to="/legal/referral-terms" className="transition-colors hover:text-foreground">
            Referral Terms
          </Link>
          <a href={`#${ADVERTISER_ANCHOR_ID}`} className="transition-colors hover:text-foreground">
            Advertise with us
          </a>
          <Link to="/app" className="transition-colors hover:text-foreground">
            Get the app
          </Link>
        </nav>

        <p className="text-xs text-muted-foreground">
          Support:{" "}
          <a href="mailto:support@cashgpt.in" className="underline-offset-2 hover:underline">
            support@cashgpt.in
          </a>
        </p>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} CashGPT. All rights reserved.
        </p>

        <p className="sr-only">{LANDING_DESCRIPTION}</p>
      </div>
    </footer>
  );
}
