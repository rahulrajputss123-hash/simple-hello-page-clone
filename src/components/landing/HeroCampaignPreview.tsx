/**
 * HeroCampaignPreview — animated campaign command card for Advertiser hero mode.
 * Flips/morphs with smooth CSS transitions when switching from EarnerQuestStack.
 */

import { useState, useEffect } from "react";

const SIMULATED_STATS = {
  conversions: 1247,
  cpr: 12.5,
  reach: 42800,
  completionRate: 89,
};

export function HeroCampaignPreview() {
  const [tick, setTick] = useState(0);
  const [liveConversions, setLiveConversions] = useState(SIMULATED_STATS.conversions);

  // Slowly tick up conversions to simulate live activity
  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
      if (Math.random() > 0.6) {
        setLiveConversions((c) => c + Math.floor(Math.random() * 3) + 1);
      }
    }, 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      {/* Soft lavender glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] opacity-60 blur-2xl"
        style={{ background: "radial-gradient(ellipse at 50% 50%, #EEF2FF 0%, transparent 70%)" }}
      />

      {/* Main card */}
      <div
        className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
        aria-label="Sample campaign preview"
        data-testid="advertiser-campaign-preview"
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/icons/icon-create-campaign-v2.webp"
              alt="Campaign"
              width={28}
              height={28}
              fetchPriority="high"
              className="object-contain"
              draggable={false}
            />
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#4F46E5]">
                Campaign Live
              </p>
              <p className="text-[11px] text-[#475569]">Install & Open App</p>
            </div>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-[#ECFDF5] px-2.5 py-0.5 text-[11px] font-semibold text-[#10B981] ring-1 ring-inset ring-[#10B981]/20">
            <span className="relative inline-flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-[#10B981]" />
            </span>
            Active
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="rounded-2xl bg-[#EEF2FF] p-3">
            <p className="text-[11px] text-[#475569]">Conversions</p>
            <p
              className="text-xl font-bold text-[#4F46E5] tabular-nums"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {liveConversions.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-2xl bg-[#FFFBEB] p-3">
            <p className="text-[11px] text-[#475569]">Cost/Task</p>
            <p className="text-xl font-bold text-[#F59E0B] tabular-nums">
              ₹{SIMULATED_STATS.cpr}
            </p>
          </div>
          <div className="rounded-2xl bg-[#ECFDF5] p-3">
            <p className="text-[11px] text-[#475569]">Est. Reach</p>
            <p className="text-xl font-bold text-[#10B981] tabular-nums">
              {SIMULATED_STATS.reach.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-2xl bg-[#F0F9FF] p-3">
            <p className="text-[11px] text-[#475569]">Completion</p>
            <p className="text-xl font-bold text-[#0284C7] tabular-nums">
              {SIMULATED_STATS.completionRate}%
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-semibold text-[#0F172A]">Slots filled</span>
            <span className="font-bold tabular-nums text-[#4F46E5]">
              {Math.min(100, 68 + tick * 1)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#EEF2FF]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, 68 + tick * 1)}%`,
                background: "linear-gradient(90deg, #4F46E5, #6366F1)",
              }}
            />
          </div>
        </div>

        {/* Adv stat icons row */}
        <div className="mt-4 flex items-center justify-around border-t border-slate-100 pt-3">
          {[
            { icon: "/icons/icon-adv-campaign-statistics-v2.webp", label: "Stats" },
            { icon: "/icons/icon-adv-quick-actions-v2.webp", label: "Actions" },
            { icon: "/icons/icon-deposit-refund.webp", label: "Refund Safe" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1">
              <div className="flex size-8 items-center justify-center rounded-xl bg-slate-50">
                <img
                  src={item.icon}
                  alt={item.label}
                  width={20}
                  height={20}
                  loading="lazy"
                  className="object-contain"
                />
              </div>
              <span className="text-[10px] text-[#475569]">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
