import {
  ArrowRight,
  BadgeCheck,
  Megaphone,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export const ADVERTISER_ANCHOR_ID = "advertisers";

const BENEFITS = [
  {
    icon: Wallet,
    title: "Pay only for completions",
    text: "Clicks and starts are free. Your Campaign Balance is charged when a member completes your task.",
  },
  {
    icon: BadgeCheck,
    title: "Auto-verified or manual proof",
    text: "Let installs, views and surveys verify themselves, or review screenshots for sign-ups and follows.",
  },
  {
    icon: ShieldCheck,
    title: "Every campaign is reviewed",
    text: "New campaigns are checked by the CashGPT team, usually within one business day, before going live.",
  },
  {
    icon: Sparkles,
    title: "Featured placement",
    text: "Put your campaign at the top of the member feed when you want extra visibility.",
  },
] as const;

const STEPS = [
  { title: "Add campaign funds", text: "Top up your Campaign Balance. Unused funds stay yours for the next campaign." },
  { title: "Create your task", text: "Set the reward, number of slots and how completions are verified." },
  { title: "Members complete it", text: "Track results live, approve proofs and pause any time." },
] as const;

/**
 * Preview of the advertiser dashboard. Illustrative only — it is labelled as a
 * sample so no figure on it reads as a real result.
 */
function CampaignPreview() {
  const filled = 68;
  return (
    <div
      className="relative mx-auto w-full max-w-sm"
      aria-label="Sample campaign preview"
      data-testid="advertiser-preview"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-sky-500/10 blur-2xl"
      />

      <div className="surface-card overflow-hidden shadow-lift">
        <div className="flex items-center justify-between border-b border-border/70 bg-background-alt px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-sky-700">
            <Megaphone className="size-3.5" aria-hidden /> Campaign
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary ring-1 ring-inset ring-mint/25">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden /> Active
          </span>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <p className="font-display text-base leading-tight text-foreground">
              Install &amp; open the app
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Auto-verified · App install</p>
          </div>

          <div>
            <div className="flex items-end justify-between text-xs">
              <span className="font-semibold text-foreground">Slots completed</span>
              <span className="text-amount text-foreground">{filled}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-background-alt">
              <div
                className="h-full rounded-full bg-mint-gradient"
                style={{ width: `${filled}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Completed", value: "340" },
              { label: "Pending", value: "12" },
              { label: "Slots left", value: "160" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-background-alt px-2 py-2.5">
                <p className="text-amount text-lg leading-none text-foreground">{stat.value}</p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        Illustrative preview — not a real campaign.
      </p>
    </div>
  );
}

/**
 * Landing-page promo for the advertiser side of the marketplace.
 *
 * Everything claimed here comes from how the advertiser flow already works
 * (pay on completion, auto/manual verification, review before launch, featured
 * placement, funds stay in balance). Pricing numbers are left out on purpose:
 * they are admin-configurable.
 */
export function AdvertiserSection({ onStart }: { onStart: () => void }) {
  return (
    <section
      id={ADVERTISER_ANCHOR_ID}
      data-testid="advertiser-section"
      aria-labelledby="advertiser-heading"
      className="relative isolate scroll-mt-20 overflow-hidden rounded-[1.75rem] border border-border/70 bg-card px-4 py-9 shadow-card sm:px-8 sm:py-12"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 -z-10 size-72 rounded-full bg-sky-500/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-20 -z-10 size-72 rounded-full bg-gold/10 blur-3xl"
      />

      <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-sky-700 ring-1 ring-inset ring-sky-500/25">
            <Target className="size-3.5" aria-hidden /> For advertisers
          </span>
          <h2
            id="advertiser-heading"
            className="mt-4 font-display text-[1.75rem] leading-[1.12] text-foreground sm:text-[2.4rem]"
          >
            Got an app, offer or brand?{" "}
            <span className="text-gold-dark">Get real people to complete it.</span>
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Launch a campaign on CashGPT and our members do the task for you. You only pay when a
            task is completed — never for clicks or starts.
          </p>

          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="flex gap-3 rounded-2xl border border-border/70 bg-background/60 p-3.5"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-700">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight text-foreground">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              variant="jade"
              size="lg"
              className="px-7"
              onClick={onStart}
              data-testid="advertiser-cta"
            >
              Start advertising
              <ArrowRight className="size-4" />
            </Button>
            <p className="text-xs text-muted-foreground sm:max-w-[16rem]">
              Create a free account, then switch to <strong>Advertise</strong> mode in the app.
            </p>
          </div>
        </div>

        <CampaignPreview />
      </div>

      {/* How it works for advertisers */}
      <ol className="mt-10 grid gap-3 sm:grid-cols-3" data-testid="advertiser-steps">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="flex items-start gap-3 rounded-2xl bg-background-alt p-4"
          >
            <span
              aria-hidden
              className="text-amount grid size-8 shrink-0 place-items-center rounded-xl bg-jade-gradient text-sm text-primary-foreground"
            >
              {index + 1}
            </span>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                {step.title}
                {index === 2 && <MousePointerClick className="size-3.5 text-sky-700" aria-hidden />}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
