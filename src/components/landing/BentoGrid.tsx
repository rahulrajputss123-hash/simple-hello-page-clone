/**
 * BentoGrid — asymmetric 4-card feature grid with pastel tints & floating 3D icons.
 *
 * Card 1 (Large Mint): How You Earn in 3 Steps
 * Card 2 (Compact Amber): Simulated Live Activity Pulse
 * Card 3 (Large Lavender): Built for Smart Advertisers
 * Card 4 (Clean Slate): Transparent FAQ & Support
 */

import { useEffect, useState, useCallback } from "react";

/* -------------------------------------------------------------------------- */
/* Live Activity Ticker data (simulated, no backend)                          */
/* -------------------------------------------------------------------------- */
const MASKED_NAMES = [
  "Aarav M.", "Priya S.", "Rahul K.", "Neha J.", "Amit T.",
  "Sunita R.", "Vijay P.", "Deepa N.", "Karan V.", "Meena L.",
  "Raj G.", "Ananya B.", "Suresh D.", "Kavya A.", "Ravi C.",
];

const ACTIVITIES = [
  { type: "quest", text: "completed a Featured Quest", amount: "₹50", icon: "🏆" },
  { type: "quest", text: "finished a Bonus Gift task", amount: "₹25", icon: "🎁" },
  { type: "campaign", text: "launched a new campaign", amount: "500 slots", icon: "🚀" },
  { type: "quest", text: "earned from an App Install offer", amount: "₹75", icon: "📱" },
  { type: "quest", text: "completed a Survey task", amount: "₹30", icon: "📋" },
  { type: "campaign", text: "topped up campaign balance", amount: "₹5,000", icon: "💳" },
  { type: "quest", text: "redeemed UPI payout", amount: "₹200", icon: "💸" },
  { type: "quest", text: "unlocked Streak Bonus", amount: "+25%", icon: "🔥" },
];

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function generateActivity() {
  const name = randomItem(MASKED_NAMES);
  const activity = randomItem(ACTIVITIES);
  return { id: `${Date.now()}-${Math.random()}`, name, ...activity };
}

/* -------------------------------------------------------------------------- */
/* Bento Card 2: Live Activity Pulse                                          */
/* -------------------------------------------------------------------------- */
function LiveActivityPulse() {
  const [items, setItems] = useState(() => [generateActivity(), generateActivity(), generateActivity()]);

  useEffect(() => {
    const id = setInterval(() => {
      setItems((prev) => [generateActivity(), ...prev.slice(0, 4)]);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="rounded-3xl border border-amber-100 bg-[#FFFBEB] p-5"
      data-testid="bento-live-activity"
      aria-label="Simulated platform activity"
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-2xl bg-white shadow-sm">
          <img
            src="/icons/icon-live-right-now-v2.png"
            alt="Live activity"
            width={24}
            height={24}
            loading="lazy"
            className="object-contain"
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="relative inline-flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
            </span>
            <span className="text-xs font-bold text-[#0F172A]">Live Right Now</span>
          </div>
          <p className="text-[11px] text-[#475569]">Platform activity pulse</p>
        </div>
      </div>

      <ul className="space-y-2" aria-live="polite" aria-atomic="false">
        {items.map((item, i) => (
          <li
            key={item.id}
            className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs transition-opacity duration-500"
            style={{ opacity: 1 - i * 0.18 }}
          >
            <span className="text-base" aria-hidden>{item.icon}</span>
            <p className="flex-1 text-[#0F172A]">
              <span className="font-semibold">{item.name}</span>{" "}
              <span className="text-[#475569]">{item.text}</span>
            </p>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 font-bold tabular-nums"
              style={{
                backgroundColor: item.type === "campaign" ? "#EEF2FF" : "#ECFDF5",
                color: item.type === "campaign" ? "#4F46E5" : "#10B981",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {item.amount}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-center text-[10px] text-[#475569]">
        Usernames masked for privacy • Simulated activity
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Bento Card 4: FAQ Accordion                                                */
/* -------------------------------------------------------------------------- */
const BENTO_FAQ = [
  {
    q: "How fast do I get paid?",
    a: "Most UPI/wallet payouts process within 24 hours. Instant for many popular methods.",
  },
  {
    q: "Is my deposit safe as an advertiser?",
    a: "Absolutely. Unused campaign balance is fully refundable at any time — zero risk.",
  },
  {
    q: "What types of tasks can I earn from?",
    a: "App installs, surveys, video views, game quests, deals, referrals, and more.",
  },
  {
    q: "How are completions verified?",
    a: "Auto-verified via postback tracking or manual screenshot review — your choice.",
  },
];

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  const toggle = useCallback((i: number) => {
    setOpen((prev) => (prev === i ? null : i));
  }, []);

  return (
    <div className="space-y-2">
      {BENTO_FAQ.map((item, i) => (
        <div
          key={item.q}
          className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white"
        >
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-[#0F172A] hover:bg-slate-50 transition-colors"
            onClick={() => toggle(i)}
            aria-expanded={open === i}
            aria-controls={`bento-faq-${i}`}
          >
            <span>{item.q}</span>
            <span
              className="grid size-5 shrink-0 place-items-center rounded-full bg-slate-100 text-[#475569] transition-transform duration-200"
              style={{ transform: open === i ? "rotate(45deg)" : "rotate(0deg)" }}
              aria-hidden
            >
              +
            </span>
          </button>
          <div
            id={`bento-faq-${i}`}
            role="region"
            className="overflow-hidden transition-all duration-300"
            style={{ maxHeight: open === i ? "200px" : "0px" }}
          >
            <p className="px-4 pb-3 text-xs leading-relaxed text-[#475569]">{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main BentoGrid                                                             */
/* -------------------------------------------------------------------------- */
export function BentoGrid() {
  return (
    <section
      aria-labelledby="bento-heading"
      className="mx-auto w-full max-w-5xl"
      data-testid="bento-grid"
    >
      <div className="mb-8 text-center">
        <h2
          id="bento-heading"
          className="font-bold tracking-tight text-[#0F172A] text-3xl sm:text-4xl"
        >
          Everything in one{" "}
          <span className="text-[#10B981]">platform</span>
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#475569]">
          Built for earners who want more and advertisers who demand results.
        </p>
      </div>

      {/* Asymmetric bento layout */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: How You Earn — Large Mint, spans 2 cols on desktop */}
        <div
          className="rounded-3xl border border-emerald-100 bg-[#ECFDF5] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:col-span-2"
          data-testid="bento-how-earn"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm">
              <img
                src="/icons/icon-how-you-earn.webp"
                alt="How you earn"
                width={32}
                height={32}
                loading="lazy"
                className="object-contain"
              />
            </div>
            <div>
              <h3 className="font-bold text-[#0F172A] text-lg">How You Earn in 3 Steps</h3>
              <p className="text-xs text-[#475569]">Simple, transparent, rewarding</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                step: "01",
                icon: "/icons/icon-featured-offers.webp",
                title: "Pick a 3D Quest",
                desc: "Browse featured offers, bonus gifts, and daily quests tailored for you.",
                color: "#10B981",
              },
              {
                step: "02",
                icon: "/icons/icon-how-you-earn.webp",
                title: "Complete Action",
                desc: "Install, watch, survey, or follow — each task verified automatically.",
                color: "#F59E0B",
              },
              {
                step: "03",
                icon: "/icons/icon-bonus-gift.png",
                title: "Instant Wallet Payout",
                desc: "Your reward lands in your UPI/wallet the moment the task is confirmed.",
                color: "#4F46E5",
              },
            ].map((step) => (
              <div
                key={step.step}
                className="relative flex flex-col gap-2 rounded-2xl border border-white/80 bg-white/60 p-4 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex size-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: step.color }}
                    aria-hidden
                  >
                    {step.step}
                  </span>
                  <div
                    className="flex size-8 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${step.color}18` }}
                  >
                    <img
                      src={step.icon}
                      alt={step.title}
                      width={20}
                      height={20}
                      loading="lazy"
                      className="object-contain"
                    />
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-[#0F172A]">{step.title}</h4>
                <p className="text-xs leading-relaxed text-[#475569]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Live Activity Pulse — Compact Amber, 1 col */}
        <div className="lg:col-span-1">
          <LiveActivityPulse />
        </div>

        {/* Card 3: Smart Advertisers — Large Lavender, 2 cols */}
        <div
          className="rounded-3xl border border-indigo-100 bg-[#EEF2FF] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:col-span-2 lg:col-span-2"
          data-testid="bento-advertisers"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm">
              <img
                src="/icons/icon-adv-quick-actions-v2.webp"
                alt="Smart advertisers"
                width={32}
                height={32}
                loading="lazy"
                className="object-contain"
              />
            </div>
            <div>
              <h3 className="font-bold text-[#0F172A] text-lg">Built for Smart Advertisers</h3>
              <p className="text-xs text-[#475569]">Launch in 2 minutes. Pay only for results.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                icon: "/icons/icon-advertiser-revenue.png",
                title: "Pay Per Completion",
                desc: "Only charged when a real user completes your task. Zero wasted spend.",
                accent: "#4F46E5",
                bg: "#EEF2FF",
              },
              {
                icon: "/icons/icon-deposit-refund.webp",
                title: "100% Safe Deposit",
                desc: "Unused campaign budget is fully refundable — your money stays yours.",
                accent: "#10B981",
                bg: "#ECFDF5",
              },
              {
                icon: "/icons/icon-adv-campaign-statistics-v2.webp",
                title: "Transparent Stats",
                desc: "Real-time postback tracking and a live dashboard with conversion data.",
                accent: "#F59E0B",
                bg: "#FFFBEB",
              },
              {
                icon: "/icons/icon-advertiser-referral-v2.webp",
                title: "Referral Bonuses",
                desc: "Earn rewards for every advertiser you bring to the CashGPT platform.",
                accent: "#0284C7",
                bg: "#F0F9FF",
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className="flex items-start gap-3 rounded-2xl border border-white/80 bg-white/60 p-4"
              >
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: feat.bg }}
                >
                  <img
                    src={feat.icon}
                    alt={feat.title}
                    width={22}
                    height={22}
                    loading="lazy"
                    className="object-contain"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#0F172A]">{feat.title}</h4>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#475569]">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: FAQ & Support — Slate, 1 col */}
        <div
          className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:col-span-2 lg:col-span-1"
          data-testid="bento-faq"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-50 shadow-sm">
              <img
                src="/icons/icon-faq.webp"
                alt="FAQ"
                width={32}
                height={32}
                loading="lazy"
                className="object-contain"
              />
            </div>
            <div>
              <h3 className="font-bold text-[#0F172A] text-lg">Quick Answers</h3>
              <p className="text-xs text-[#475569]">Top questions, answered clearly.</p>
            </div>
          </div>
          <FaqAccordion />
          <p className="mt-3 text-center text-xs text-[#475569]">
            More questions?{" "}
            <a
              href="mailto:support@cashgpt.in"
              className="font-semibold text-[#4F46E5] underline-offset-2 hover:underline"
            >
              support@cashgpt.in
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
