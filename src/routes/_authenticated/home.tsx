import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Flame, Sparkles } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { BannerCarousel } from "@/components/BannerCarousel";
import { FeaturedOffers } from "@/components/FeaturedOffers";
import { OfferwallSlot } from "@/components/OfferwallSlot";
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

      <SectionTitle>Starter Quests</SectionTitle>
      <StarterQuests />

      <SectionTitle>Featured Offers</SectionTitle>
      <FeaturedOffers scope="home" />
      <div className="mt-3 flex justify-center">
        <Link
          to="/featured"
          className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
        >
          View All
        </Link>
      </div>

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

      <div className="mt-8 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          About Us
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        A quick look at what CashGPT offers and how you can earn.
      </p>

      <ul className="mt-4 grid grid-cols-2 gap-3">
        <li className="surface-card p-4">
          <span className="grid size-10 place-items-center rounded-xl bg-background-alt text-xl">
            💰
          </span>
          <p className="mt-3 font-semibold">Ways to Earn</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Watch ads, complete quests, and finish partner offers to grow your balance.
          </p>
        </li>
        <li className="surface-card p-4">
          <span className="grid size-10 place-items-center rounded-xl bg-background-alt text-xl">
            ⚡
          </span>
          <p className="mt-3 font-semibold">Instant Payout Guarantee</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Every completed quest reflects in your wallet once it's verified.
          </p>
        </li>
        <li className="surface-card p-4">
          <span className="grid size-10 place-items-center rounded-xl bg-background-alt text-xl">
            🎁
          </span>
          <p className="mt-3 font-semibold">More Offers, Better Rewards</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Discover different offer types with competitive payout rates.
          </p>
        </li>
        <li className="surface-card p-4">
          <span className="grid size-10 place-items-center rounded-xl bg-background-alt text-xl">
            🆘
          </span>
          <p className="mt-3 font-semibold">Need Help?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Our support team is here to help when you need it.
          </p>
          <Button size="sm" variant="jade" className="mt-3" asChild>
            <Link to="/support">Get Help</Link>
          </Button>
        </li>
      </ul>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <Link to="/legal/terms" className="hover:text-foreground hover:underline">
          Terms
        </Link>
        <Link to="/legal/terms" className="hover:text-foreground hover:underline">
          Privacy
        </Link>
        <Link to="/legal/terms" className="hover:text-foreground hover:underline">
          Payout Policy
        </Link>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">CashGPT © 2026 • v1.0.0</p>
    </AppShell>
  );
}
