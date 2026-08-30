import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Bitcoin, Flame, Gift, HelpCircle, Sparkles, Wallet } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { BannerCarousel } from "@/components/BannerCarousel";
import { FeaturedOffers } from "@/components/FeaturedOffers";
import { OfferwallSlot } from "@/components/OfferwallSlot";
import { OnboardingTour } from "@/components/OnboardingTour";
import { SectionBanner } from "@/components/SectionBanner";
import { StarterQuests } from "@/components/StarterQuests";
import { SectionTitle } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";
import { completeOnboarding } from "@/lib/coinquest.functions";
import { getDeviceId } from "@/lib/ads";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home — CashGPT" },
      { name: "description", content: "Your daily quests, featured offers and streak bonus." },
      { property: "og:title", content: "Home — CashGPT" },
      { property: "og:description", content: "Your daily quests, featured offers and streak bonus." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const save = useServerFn(completeOnboarding);
  const autoOnboarded = useRef(false);

  useEffect(() => {
    if (!profile || profile.onboarded) return;
    // Silent auto-onboarding from the signup-form fields captured pre-confirmation.
    const raw =
      typeof window !== "undefined"
        ? window.localStorage.getItem("coinquest.pending_onboarding")
        : null;
    if (raw && !autoOnboarded.current) {
      autoOnboarded.current = true;
      try {
        const parsed = JSON.parse(raw) as { name?: string; phone?: string };
        const name = (parsed.name ?? "").trim();
        if (name.length >= 2) {
          void save({
            data: {
              name,
              ...(parsed.phone?.trim() ? { phone: parsed.phone.trim() } : {}),
              deviceId: getDeviceId(),
            },
          })
            .then(() => {
              window.localStorage.removeItem("coinquest.pending_onboarding");
              void queryClient.invalidateQueries({ queryKey: ["profile"] });
            })
            .catch(() => {
              // Fall back to the onboarding screen if the silent save fails.
              void navigate({ to: "/onboarding", replace: true });
            });
          return;
        }
      } catch {
        /* fall through to fallback */
      }
    }
    // Fallback for edge cases (old accounts, cleared storage): keep old screen.
    void navigate({ to: "/onboarding", replace: true });
  }, [profile, navigate, queryClient, save]);
  const streak = profile?.streak_count ?? 0;
  const goal = 7;

  return (
    <AppShell subtitle="Earn as you go">
      <BannerCarousel
        banners={[
          {
            id: "earn-today",
            eyebrow: `Welcome back${profile?.name ? `, ${profile.name}` : ""}`,
            title: "Let's earn today",
            content: (
              <>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <Flame className="size-4 text-gold" />
                  <span className="font-semibold">{streak} day streak</span>
                  <span className="opacity-70">· {Math.max(0, goal - streak)} to bonus</span>
                </div>
                <Progress
                  value={(Math.min(streak, goal) / goal) * 100}
                  className="mt-2 h-2 bg-primary-foreground/20"
                />
                <div className="h-4" />
              </>
            ),
          },
        ]}
      />

      <SectionBanner section="home" />

      <section id="tour-starter-quests">
        <SectionTitle>Starter Quests</SectionTitle>
        <StarterQuests />
      </section>

      <section id="tour-featured-offers">
        <SectionTitle>Featured Offers</SectionTitle>
        <FeaturedOffers scope="home" />
        <div className="mt-3 flex justify-center">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Link
            to={"/featured" as any}
            data-testid="home-view-all-featured"
            className="group inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-card px-4 py-1.5 text-xs font-semibold text-primary shadow-soft transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            View All
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <OnboardingTour />

      <SectionTitle>
        <span className="flex items-center gap-2">
          Offerwall <Sparkles className="size-4 text-gold-dark" />
        </span>
      </SectionTitle>
      <OfferwallSlot limit={6} />
      <div className="mt-3 flex justify-center">
        <Link
          to="/offerwall"
          className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
        >
          View All
        </Link>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Partner networks activate in the mobile app.
      </p>

      {/* Cash Out Your Way — the bold, eye-catching highlight of the page */}
      <section
        data-testid="cash-out-section"
        className="relative mt-10 overflow-hidden rounded-[1.75rem] bg-jade-gradient p-5 shadow-lift"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-14 -top-16 size-48 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(closest-side, var(--color-gold), transparent)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-12 size-44 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(closest-side, var(--color-mint), transparent)" }}
        />

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-gold-foreground shadow-gold">
            <Sparkles className="size-3.5" /> Payouts
          </span>
          <h2 className="mt-3 font-display text-[1.7rem] leading-tight text-primary-foreground">
            Cash Out <span className="text-gold">Your Way</span>
          </h2>
          <p className="mt-1 text-sm text-primary-foreground/70">
            Real payouts, your choice — withdraw the moment you hit the minimum.
          </p>

          <PaidOutThisWeek />

          {/* Asymmetric layout: one hero method + two supporting */}
          <div className="mt-5 grid gap-3">
            <div
              data-testid="payout-method-paypal"
              style={{ animationDelay: "60ms" }}
              className="payout-card relative flex items-center gap-4 overflow-hidden rounded-2xl bg-card/95 p-4 backdrop-blur"
            >
              <span
                className="grid size-14 shrink-0 place-items-center rounded-2xl text-white shadow-lg"
                style={{ background: "linear-gradient(135deg,#009cde,#003087)" }}
              >
                <Wallet className="size-7" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-lg text-foreground">PayPal</p>
                  <span className="rounded-full bg-mint/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                    Most popular
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Straight to your account — cash in hand, fast.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-background-alt px-2.5 py-1 text-[11px] font-bold text-primary">
                from $1
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div
                data-testid="payout-method-crypto"
                style={{ animationDelay: "140ms" }}
                className="payout-card relative overflow-hidden rounded-2xl bg-card/95 p-4 backdrop-blur"
              >
                <span
                  className="grid size-12 place-items-center rounded-2xl text-white shadow-lg"
                  style={{ background: "linear-gradient(135deg,#26a17b,#345d9d)" }}
                >
                  <Bitcoin className="size-6" />
                </span>
                <p className="mt-3 font-display text-base text-foreground">Crypto</p>
                <p className="mt-0.5 text-xs text-muted-foreground">USDT · Litecoin</p>
              </div>

              <div
                data-testid="payout-method-giftcards"
                style={{ animationDelay: "220ms" }}
                className="payout-card relative overflow-hidden rounded-2xl bg-card/95 p-4 backdrop-blur"
              >
                <span
                  className="grid size-12 place-items-center rounded-2xl text-white shadow-lg"
                  style={{ background: "linear-gradient(135deg,#ff9900,#ff5e3a)" }}
                >
                  <Gift className="size-6" />
                </span>
                <p className="mt-3 font-display text-base text-foreground">Gift Cards</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Amazon · Google Play</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Need Help? — kept separately, still useful */}
      <div
        data-testid="need-help-card"
        className="surface-card mt-4 flex items-center gap-4 p-4"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-mint/15 text-primary">
          <HelpCircle className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Need Help?</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Our support team is here whenever you need it.
          </p>
        </div>
        <Button size="sm" variant="jade" className="shrink-0" asChild>
          <Link to="/support">Get Help</Link>
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {/* eslint-disable @typescript-eslint/no-explicit-any */}
        <Link to={"/legal/terms" as any} className="hover:text-foreground hover:underline">
          Terms
        </Link>
        <Link to={"/legal/privacy" as any} className="hover:text-foreground hover:underline">
          Privacy
        </Link>
        <Link
          to={"/legal/withdrawal-policy" as any}
          className="hover:text-foreground hover:underline"
        >
          Payout Policy
        </Link>
        <Link
          to={"/legal/referral-terms" as any}
          className="hover:text-foreground hover:underline"
        >
          Referral Terms
        </Link>
        {/* eslint-enable @typescript-eslint/no-explicit-any */}
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">CashGPT © 2026 • v1.0.0</p>
    </AppShell>
  );
}


// Subtle "paid out this week" trust strip. The figure is a display-only
// placeholder (MOCKED) — wire to a real aggregate when the endpoint exists.
const PAID_OUT_THIS_WEEK = 128540;

function PaidOutThisWeek() {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(PAID_OUT_THIS_WEEK);
      return;
    }
    const duration = 1100;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(PAID_OUT_THIS_WEEK * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      data-testid="payout-proof-strip"
      className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/10 py-1.5 pl-2.5 pr-3.5 backdrop-blur"
    >
      <span className="relative grid size-2.5 place-items-center">
        <span className="payout-live-dot absolute inset-0 rounded-full bg-mint" />
        <span className="size-2.5 rounded-full bg-mint" />
      </span>
      <span className="text-xs text-primary-foreground/80">
        <span className="text-amount font-bold text-gold">${value.toLocaleString("en-US")}</span>{" "}
        paid out this week
      </span>
    </div>
  );
}
