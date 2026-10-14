import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

import {
  ADVERTISER_ANCHOR_ID,
} from "@/components/landing/AdvertiserSection";
import { AuthCard } from "@/components/landing/AuthCard";
import { BentoGrid } from "@/components/landing/BentoGrid";
import { HeroCampaignPreview } from "@/components/landing/HeroCampaignPreview";
import { HeroQuestStack } from "@/components/landing/HeroQuestStack";
import { PotentialCalculator } from "@/components/landing/PotentialCalculator";
import { Reveal } from "@/components/landing/Reveal";
import { RoleSwitcher, type Role } from "@/components/landing/RoleSwitcher";
import {
  FAQ_ITEMS,
  LANDING_DESCRIPTION,
  WEB_HOW_IT_WORKS,
} from "@/components/landing/landing-data";
import { SocialLinks } from "@/components/SocialLinks";
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
 * Public marketing + signup page for cashgpt.in — Daylight Gamified Fintech redesign.
 *
 * Rendered only on the web — `src/routes/index.tsx` keeps the native Capacitor
 * shell on its original splash → redirect path. Signup/login is inline in the hero
 * rather than on a separate screen, and runs through the same `useAuthForm` hook
 * the /auth route uses, so there is one implementation of the Supabase calls.
 *
 * Role switching (Earner ↔ Advertiser) is purely client-side state — no backend
 * listeners or real-time subscriptions on this public page.
 */
export function WebLanding() {
  // Owned here (not inside AuthCard) so the sticky header can switch modes without
  // remounting the form and losing what the visitor already typed.
  const auth = useAuthForm({ initialMode: "signup", collectName: false });

  // Role switcher state — drives the Hero, Calculator, and CTA copy.
  const [role, setRole] = useState<Role>("earner");

  const authSectionRef = useRef<HTMLDivElement | null>(null);
  const [authInView, setAuthInView] = useState(true);

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

  const handleRoleChange = useCallback(
    (newRole: Role) => {
      setRole(newRole);
      if (newRole === "advertiser") {
        rememberAdvertiserIntent();
      }
    },
    [],
  );

  return (
    // data-web-only lets the native shell hide this pre-hydration (see __root.tsx).
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#F8FAFC" }}
      data-web-only
    >
      {/* ------------------------------------------------------------------ */}
      {/* 1 — Sticky header                                                   */}
      {/* ------------------------------------------------------------------ */}
      <header
        className="sticky top-0 z-40 border-b border-slate-200/70 backdrop-blur-md"
        style={{ backgroundColor: "rgba(248,250,252,0.88)" }}
      >
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
            className="hidden items-center gap-1 text-sm font-semibold text-[#475569] md:flex"
            aria-label="Sections"
          >
            <a
              href="#how-it-works"
              className="rounded-xl px-3 py-2 transition-colors hover:bg-white hover:text-[#0F172A]"
            >
              How it works
            </a>
            <a
              href="#calculator"
              className="rounded-xl px-3 py-2 transition-colors hover:bg-white hover:text-[#0F172A]"
            >
              Simulator
            </a>
            <a
              href={`#${ADVERTISER_ANCHOR_ID}`}
              className="rounded-xl px-3 py-2 transition-colors hover:bg-white hover:text-[#0F172A]"
              data-testid="header-advertisers"
            >
              For advertisers
            </a>
            <a
              href="#faq"
              className="rounded-xl px-3 py-2 transition-colors hover:bg-white hover:text-[#0F172A]"
            >
              FAQ
            </a>
          </nav>

          <nav className="flex items-center gap-2" aria-label="Account">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3 text-[#475569] hover:text-[#0F172A]"
              onClick={() => goToAuth("signin")}
              data-testid="header-login"
            >
              Log in
            </Button>
            <button
              type="button"
              onClick={() => goToAuth("signup")}
              data-testid="header-signup"
              className="rounded-xl border-b-[3px] border-[#0ea576] bg-[#10B981] px-4 py-2 text-sm font-bold text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)] transition-all hover:bg-[#0ea576] active:translate-y-0.5 active:border-b"
            >
              Start Earning Free
            </button>
          </nav>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* 2 — Hero: Role Switcher + dynamic 50/50 split                       */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="relative isolate overflow-hidden"
        aria-labelledby="landing-h1"
        style={{ background: "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)" }}
      >
        {/* Ambient background blobs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div
            className="absolute -left-24 -top-32 size-[28rem] rounded-full opacity-[0.15] blur-3xl"
            style={{ background: "radial-gradient(closest-side, #10B981, transparent)" }}
          />
          <div
            className="absolute -right-28 top-10 size-[30rem] rounded-full opacity-[0.12] blur-3xl"
            style={{ background: "radial-gradient(closest-side, #F59E0B, transparent)" }}
          />
          <div
            className="absolute bottom-0 left-1/2 size-[20rem] -translate-x-1/2 rounded-full opacity-[0.08] blur-3xl"
            style={{ background: "radial-gradient(closest-side, #4F46E5, transparent)" }}
          />
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-10">
          {/* Role switcher pill — centered above everything */}
          <div className="mb-8 flex justify-center">
            <RoleSwitcher role={role} onChange={handleRoleChange} />
          </div>

          {/* 50/50 hero grid */}
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
            {/* LEFT: copy + CTA */}
            <div>
              {/* Mascot badge — Earner only */}
              {role === "earner" && (
                <div className="mb-4 inline-flex items-center gap-2.5 rounded-2xl border border-emerald-100 bg-[#ECFDF5] px-3 py-2 shadow-sm">
                  <img
                    src="/assistant-mascot.webp"
                    alt="CashGPT mascot"
                    width={28}
                    height={28}
                    fetchPriority="high"
                    className="rounded-full object-cover"
                    draggable={false}
                  />
                  <span className="text-xs font-semibold text-[#10B981]">
                    Hi! Ready to earn today? 👋
                  </span>
                </div>
              )}

              {/* Advertiser badge */}
              {role === "advertiser" && (
                <div className="mb-4 inline-flex items-center gap-2 rounded-2xl border border-indigo-100 bg-[#EEF2FF] px-3 py-2 shadow-sm">
                  <span className="text-base" aria-hidden>🚀</span>
                  <span className="text-xs font-semibold text-[#4F46E5]">
                    Launch your next campaign in 2 minutes
                  </span>
                </div>
              )}

              <h1
                id="landing-h1"
                className="font-bold tracking-tight text-[#0F172A]"
                style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", lineHeight: "1.15" }}
              >
                {role === "earner" ? (
                  <>
                    Complete fun daily{" "}
                    <span
                      className="relative inline-block"
                      style={{
                        background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      quests
                    </span>{" "}
                    &amp; get instant UPI rewards
                  </>
                ) : (
                  <>
                    Launch high-conversion{" "}
                    <span
                      className="relative inline-block"
                      style={{
                        background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      campaigns
                    </span>{" "}
                    with real users
                  </>
                )}
              </h1>

              <p className="mt-4 max-w-lg text-base leading-relaxed text-[#475569]">
                {role === "earner"
                  ? "Browse offers, install apps, complete surveys and video tasks. Rewards hit your UPI or wallet the moment each task is verified — no wait, no fuss."
                  : "Reach thousands of motivated users via CashGPT's quest marketplace. Transparent postback tracking, pay only for real completions, with full deposit protection."}
              </p>

              {/* CTA buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {role === "earner" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => goToAuth("signup")}
                      data-testid="hero-earner-cta"
                      className="rounded-2xl border-b-[4px] border-[#0ea576] bg-[#10B981] px-6 py-3 font-bold text-white shadow-[0_6px_18px_rgba(16,185,129,0.30)] transition-all hover:bg-[#0ea576] active:translate-y-0.5 active:border-b-2"
                    >
                      Start Earning Free →
                    </button>
                    <a
                      href="#how-it-works"
                      className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#0F172A] shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                    >
                      How it works
                    </a>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={startAsAdvertiser}
                      data-testid="hero-advertiser-cta"
                      className="rounded-2xl border-b-[4px] border-[#3730a3] bg-[#4F46E5] px-6 py-3 font-bold text-white shadow-[0_6px_18px_rgba(79,70,229,0.30)] transition-all hover:bg-[#4338CA] active:translate-y-0.5 active:border-b-2"
                    >
                      Launch My Campaign →
                    </button>
                    <a
                      href={`#${ADVERTISER_ANCHOR_ID}`}
                      className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#0F172A] shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                    >
                      See how it works
                    </a>
                  </>
                )}
              </div>

              {/* Trust microcopy */}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                {role === "earner" ? (
                  <>
                    <span className="flex items-center gap-1 text-xs text-[#475569]">
                      <span className="text-[#10B981]">✓</span> Free to join
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[#475569]">
                      <span className="text-[#10B981]">✓</span> Instant UPI payout
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[#475569]">
                      <span className="text-[#10B981]">✓</span> No hidden fees
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-1 text-xs text-[#475569]">
                      <span className="text-[#4F46E5]">✓</span> Pay per completion only
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[#475569]">
                      <span className="text-[#4F46E5]">✓</span> 100% deposit refundable
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[#475569]">
                      <span className="text-[#4F46E5]">✓</span> Live postback tracking
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* RIGHT: interactive 3D visual + auth card */}
            <div className="flex flex-col items-center gap-6">
              {/* 3D visual — smoothly transitions via opacity/transform */}
              <div
                className="w-full transition-all duration-500"
                style={{ opacity: 1, transform: "translateY(0)" }}
              >
                {role === "earner" ? <HeroQuestStack /> : <HeroCampaignPreview />}
              </div>

              {/* Auth card */}
              <div
                ref={authSectionRef}
                id={AUTH_ANCHOR_ID}
                className="w-full max-w-[400px]"
              >
                <AuthCard auth={auth} id={AUTH_ANCHOR_ID} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3 — Interactive Potential Calculator                                */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="px-4 py-12 sm:px-6 sm:py-16"
        style={{ background: "linear-gradient(180deg, #F1F5F9 0%, #F8FAFC 100%)" }}
      >
        <Reveal>
          <PotentialCalculator role={role} />
        </Reveal>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4 — How It Works                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section
        id="how-it-works"
        data-testid="how-it-works"
        aria-labelledby="how-it-works-heading"
        className="scroll-mt-20 px-4 py-12 sm:px-6 sm:py-16"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <h2
              id="how-it-works-heading"
              className="font-bold tracking-tight text-[#0F172A] text-3xl sm:text-4xl"
            >
              How it{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #F59E0B, #D97706)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                works
              </span>
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#475569]">
              Three steps from signup to payout. No invites and no subscriptions.
            </p>
          </div>

          <Reveal stagger className="grid gap-4 sm:grid-cols-3">
            {WEB_HOW_IT_WORKS.map((step) => (
              <HowItWorksCard key={step.number} step={step} />
            ))}
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 5 — Asymmetric Bento Grid                                           */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="px-4 py-12 sm:px-6 sm:py-16"
        style={{ background: "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)" }}
      >
        <Reveal>
          <BentoGrid />
        </Reveal>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 6 — FAQ (full, for SEO rich results)                                */}
      {/* ------------------------------------------------------------------ */}
      <section
        id="faq"
        data-testid="faq"
        aria-labelledby="faq-heading"
        className="scroll-mt-20 px-4 py-12 sm:px-6 sm:py-16"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <h2
              id="faq-heading"
              className="font-bold tracking-tight text-[#0F172A] text-3xl sm:text-4xl"
            >
              Questions,{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #F59E0B, #D97706)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                answered
              </span>
            </h2>
          </div>

          <Reveal className="mx-auto max-w-2xl space-y-3">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.question}
                className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-0 shadow-sm [&_summary::-webkit-details-marker]:hidden"
                data-testid="faq-item"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-3 p-4 text-left text-sm font-semibold text-[#0F172A]">
                  <h3 className="text-sm font-semibold">{item.question}</h3>
                  <span
                    aria-hidden
                    className="grid size-6 shrink-0 place-items-center rounded-full bg-slate-100 text-[#475569] transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="px-4 pb-4 text-sm leading-relaxed text-[#475569]">{item.answer}</p>
              </details>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 7 — Final CTA                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className="px-4 py-12 sm:px-6 sm:py-16" style={{ backgroundColor: "#F1F5F9" }}>
        <div className="mx-auto max-w-6xl">
          <FinalCta
            role={role}
            onStart={() => goToAuth("signup")}
            onAdvertise={startAsAdvertiser}
          />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 8 — Footer                                                          */}
      {/* ------------------------------------------------------------------ */}
      <Footer />

      {/* Sticky mobile CTA — hidden when the auth form is visible */}
      <div
        className={[
          "fixed inset-x-0 bottom-0 z-30 flex items-center justify-center border-t border-slate-200/70 px-4 py-3 backdrop-blur-md transition-transform duration-300 lg:hidden",
          authInView ? "translate-y-full" : "translate-y-0",
        ].join(" ")}
        style={{ backgroundColor: "rgba(248,250,252,0.92)" }}
        aria-hidden={authInView}
      >
        <button
          type="button"
          onClick={() => goToAuth("signup")}
          data-testid="sticky-start-btn"
          className="w-full max-w-xs rounded-2xl border-b-[4px] border-[#0ea576] bg-[#10B981] py-3 font-bold text-white shadow-[0_4px_14px_rgba(16,185,129,0.3)] transition-all active:translate-y-0.5 active:border-b-2"
        >
          Start earning free
        </button>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd() }} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  How it works card                                                          */
/* -------------------------------------------------------------------------- */
const STEP_COLORS = ["#10B981", "#F59E0B", "#4F46E5"] as const;
const STEP_BG = ["#ECFDF5", "#FFFBEB", "#EEF2FF"] as const;

function HowItWorksCard({ step }: { step: (typeof WEB_HOW_IT_WORKS)[number] }) {
  const i = Number(step.number) - 1;
  const accent = STEP_COLORS[i] ?? "#10B981";
  const bg = STEP_BG[i] ?? "#ECFDF5";
  return (
    <div
      className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white p-5 pt-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_12px_40px_rgb(0,0,0,0.07)] hover:-translate-y-1"
      data-testid={`how-it-works-step-${step.number}`}
    >
      <span
        aria-hidden
        className="grid size-11 place-items-center rounded-2xl text-lg font-bold text-white shadow-md"
        style={{ backgroundColor: accent }}
      >
        {step.number}
      </span>
      <h3 className="font-bold text-lg text-[#0F172A]">{step.title}</h3>
      <p className="text-sm leading-relaxed text-[#475569]">{step.description}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Final CTA banner                                                          */
/* -------------------------------------------------------------------------- */
function FinalCta({
  role,
  onStart,
  onAdvertise,
}: {
  role: Role;
  onStart: () => void;
  onAdvertise: () => void;
}) {
  const isEarner = role === "earner";
  return (
    <section
      data-testid="final-cta"
      aria-labelledby="final-cta-heading"
      className="relative isolate overflow-hidden rounded-3xl px-5 py-10 text-center shadow-[0_16px_50px_rgba(15,23,42,0.10)] sm:px-10 sm:py-14"
      style={{
        background: isEarner
          ? "linear-gradient(135deg, #0F172A 0%, #1e3a34 100%)"
          : "linear-gradient(135deg, #0F172A 0%, #1e1b4b 100%)",
      }}
    >
      {/* Ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-20 size-56 rounded-full opacity-40 blur-3xl"
        style={{
          background: isEarner
            ? "radial-gradient(closest-side, #10B981, transparent)"
            : "radial-gradient(closest-side, #4F46E5, transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-16 size-56 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(closest-side, #F59E0B, transparent)" }}
      />

      <div className="relative">
        <h2
          id="final-cta-heading"
          className="font-bold tracking-tight text-white text-3xl sm:text-4xl"
        >
          {isEarner ? (
            <>
              Start earning in{" "}
              <span style={{ color: "#10B981" }}>the next five minutes</span>
            </>
          ) : (
            <>
              Your campaign could be{" "}
              <span style={{ color: "#818CF8" }}>live in 2 minutes</span>
            </>
          )}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-white/70 sm:text-base">
          {isEarner
            ? "Create a free account, finish a task or two, and withdraw to UPI/wallet as soon as you reach ₹200."
            : "Create a free account, top up your campaign balance, and go live with real user completions."}
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {isEarner ? (
            <button
              type="button"
              onClick={onStart}
              data-testid="final-cta-btn"
              className="inline-flex items-center gap-2 rounded-2xl border-b-[4px] border-[#0ea576] bg-[#10B981] px-8 py-3.5 font-bold text-white shadow-[0_6px_20px_rgba(16,185,129,0.35)] transition-all hover:bg-[#0ea576] active:translate-y-0.5 active:border-b-2"
            >
              Create my free account
              <ArrowRight className="size-4" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={onAdvertise}
              data-testid="final-cta-btn"
              className="inline-flex items-center gap-2 rounded-2xl border-b-[4px] border-[#3730a3] bg-[#4F46E5] px-8 py-3.5 font-bold text-white shadow-[0_6px_20px_rgba(79,70,229,0.35)] transition-all hover:bg-[#4338CA] active:translate-y-0.5 active:border-b-2"
            >
              Launch my campaign
              <ArrowRight className="size-4" aria-hidden />
            </button>
          )}
        </div>

        <p className="mt-5 text-xs text-white/60">
          {isEarner ? (
            <>
              Promoting an app or brand?{" "}
              <button
                type="button"
                onClick={onAdvertise}
                data-testid="final-cta-advertise"
                className="font-semibold text-[#818CF8] underline-offset-2 hover:underline"
              >
                Start advertising
              </button>
            </>
          ) : (
            <>
              Want to earn instead?{" "}
              <button
                type="button"
                onClick={onStart}
                className="font-semibold text-[#10B981] underline-offset-2 hover:underline"
              >
                Start earning free
              </button>
            </>
          )}
        </p>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Footer                                                                    */
/* -------------------------------------------------------------------------- */
function Footer() {
  return (
    <footer
      className="border-t border-slate-200/70 px-4 py-8 pb-24 sm:px-6 lg:pb-8"
      style={{ backgroundColor: "#F1F5F9" }}
    >
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

        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#475569]">
          <Link to="/legal/privacy" className="transition-colors hover:text-[#0F172A]">
            Privacy
          </Link>
          <Link to="/legal/terms" className="transition-colors hover:text-[#0F172A]">
            Terms
          </Link>
          <Link to="/legal/withdrawal-policy" className="transition-colors hover:text-[#0F172A]">
            Withdrawal Policy
          </Link>
          <Link to="/legal/referral-terms" className="transition-colors hover:text-[#0F172A]">
            Referral Terms
          </Link>
          <a href={`#${ADVERTISER_ANCHOR_ID}`} className="transition-colors hover:text-[#0F172A]">
            Advertise with us
          </a>
          <Link to="/app" className="transition-colors hover:text-[#0F172A]">
            Get the app
          </Link>
        </nav>

        <p className="text-xs text-[#475569]">
          Support:{" "}
          <a href="mailto:support@cashgpt.in" className="underline-offset-2 hover:underline">
            support@cashgpt.in
          </a>
        </p>

        <p className="text-xs text-[#475569]">
          © {new Date().getFullYear()} CashGPT. All rights reserved.
        </p>

        <p className="sr-only">{LANDING_DESCRIPTION}</p>
      </div>
    </footer>
  );
}
