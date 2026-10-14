/**
 * PotentialCalculator — 100% client-side interactive earning/campaign simulator.
 * Earner View: quests-per-day slider → daily/monthly reward projection.
 * Advertiser View: budget slider → estimated completions + reach.
 */

import { useState, useMemo } from "react";
import type { Role } from "./RoleSwitcher";

/* -------------------------------------------------------------------------- */
/* Earner constants                                                            */
/* -------------------------------------------------------------------------- */
const AVG_REWARD_PER_QUEST = 38; // ₹ per quest (weighted avg)
const STREAK_THRESHOLD = 7; // quests/day to unlock streak bonus
const STREAK_BONUS_MULTIPLIER = 1.25;

/* -------------------------------------------------------------------------- */
/* Advertiser constants                                                        */
/* -------------------------------------------------------------------------- */
const CPT = 12.5; // cost per task ₹
const AVG_REACH_MULTIPLIER = 34; // estimated reach per completion

interface Props {
  role: Role;
}

export function PotentialCalculator({ role }: Props) {
  const [questsPerDay, setQuestsPerDay] = useState(5);
  const [budget, setBudget] = useState(5000);

  const earnerStats = useMemo(() => {
    const hasStreak = questsPerDay >= STREAK_THRESHOLD;
    const multiplier = hasStreak ? STREAK_BONUS_MULTIPLIER : 1;
    const daily = Math.round(questsPerDay * AVG_REWARD_PER_QUEST * multiplier);
    const monthly = daily * 30;
    return { daily, monthly, hasStreak };
  }, [questsPerDay]);

  const advertiserStats = useMemo(() => {
    const completions = Math.floor(budget / CPT);
    const reach = completions * AVG_REACH_MULTIPLIER;
    return { completions, reach };
  }, [budget]);

  return (
    <section
      id="calculator"
      aria-labelledby="calc-heading"
      className="mx-auto w-full max-w-2xl"
      data-testid="potential-calculator"
    >
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF2FF] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#4F46E5]">
            {role === "earner" ? "⚡ Earning Simulator" : "📊 Campaign Estimator"}
          </span>
          <h2
            id="calc-heading"
            className="mt-2 font-bold tracking-tight text-[#0F172A] text-2xl"
          >
            {role === "earner"
              ? "How Much Could You Earn?"
              : "Estimate Your Campaign Results"}
          </h2>
          <p className="mt-1 text-sm text-[#475569]">
            {role === "earner"
              ? "Adjust quests per day to see your projected income."
              : "Set your campaign budget and see simulated reach."}
          </p>
        </div>

        {role === "earner" ? (
          <EarnerCalculator
            questsPerDay={questsPerDay}
            onQuestsChange={setQuestsPerDay}
            stats={earnerStats}
          />
        ) : (
          <AdvertiserCalculator
            budget={budget}
            onBudgetChange={setBudget}
            stats={advertiserStats}
          />
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Earner sub-view                                                             */
/* -------------------------------------------------------------------------- */
function EarnerCalculator({
  questsPerDay,
  onQuestsChange,
  stats,
}: {
  questsPerDay: number;
  onQuestsChange: (v: number) => void;
  stats: { daily: number; monthly: number; hasStreak: boolean };
}) {
  return (
    <div className="space-y-6">
      {/* Slider */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="quests-slider" className="text-sm font-semibold text-[#0F172A]">
            Quests Completed Per Day
          </label>
          <span className="rounded-xl bg-[#ECFDF5] px-3 py-0.5 text-sm font-bold text-[#10B981] tabular-nums">
            {questsPerDay}
          </span>
        </div>
        <input
          id="quests-slider"
          type="range"
          min={1}
          max={15}
          value={questsPerDay}
          onChange={(e) => onQuestsChange(Number(e.target.value))}
          className="w-full accent-[#10B981]"
          aria-label="Quests completed per day"
        />
        <div className="mt-1 flex justify-between text-[11px] text-[#475569]">
          <span>1 quest/day</span>
          <span>15 quests/day</span>
        </div>
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#ECFDF5] p-4 text-center">
          <p className="text-xs font-medium text-[#475569]">Simulated Daily</p>
          <p
            className="mt-1 text-3xl font-bold text-[#10B981] tabular-nums"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            ₹{stats.daily.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-[#475569]">avg estimate</p>
        </div>
        <div className="rounded-2xl bg-[#FFFBEB] p-4 text-center">
          <p className="text-xs font-medium text-[#475569]">Simulated Monthly</p>
          <p
            className="mt-1 text-3xl font-bold text-[#F59E0B] tabular-nums"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            ₹{stats.monthly.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-[#475569]">30-day projection</p>
        </div>
      </div>

      {/* Streak bonus pill */}
      <div
        className={[
          "flex items-center gap-2 rounded-2xl border p-3 transition-all duration-500",
          stats.hasStreak
            ? "border-amber-200 bg-[#FFFBEB] text-amber-700"
            : "border-slate-200 bg-slate-50 text-[#475569]",
        ].join(" ")}
        aria-live="polite"
        aria-label={
          stats.hasStreak ? "Streak bonus unlocked!" : "Complete 7+ quests/day to unlock streak bonus"
        }
      >
        <img
          src="/icons/icon-bonus-gift.png"
          alt=""
          width={24}
          height={24}
          loading="lazy"
          className="shrink-0 object-contain"
        />
        <div>
          <p className="text-sm font-semibold">
            {stats.hasStreak ? "🔥 Streak Bonus Unlocked!" : "Streak Bonus Available"}
          </p>
          <p className="text-xs">
            {stats.hasStreak
              ? "+25% multiplier applied to your rewards"
              : "Complete 7+ quests/day for a ×1.25 earnings boost"}
          </p>
        </div>
        {stats.hasStreak && (
          <span className="ml-auto shrink-0 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800">
            ×1.25
          </span>
        )}
      </div>

      <p className="text-center text-[11px] text-[#475569]">
        * Simulated estimates based on platform averages. Actual earnings vary by task and region.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Advertiser sub-view                                                        */
/* -------------------------------------------------------------------------- */
function AdvertiserCalculator({
  budget,
  onBudgetChange,
  stats,
}: {
  budget: number;
  onBudgetChange: (v: number) => void;
  stats: { completions: number; reach: number };
}) {
  return (
    <div className="space-y-6">
      {/* Slider */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="budget-slider" className="text-sm font-semibold text-[#0F172A]">
            Campaign Budget
          </label>
          <span className="rounded-xl bg-[#EEF2FF] px-3 py-0.5 text-sm font-bold text-[#4F46E5] tabular-nums">
            ₹{budget.toLocaleString("en-IN")}
          </span>
        </div>
        <input
          id="budget-slider"
          type="range"
          min={500}
          max={50000}
          step={500}
          value={budget}
          onChange={(e) => onBudgetChange(Number(e.target.value))}
          className="w-full accent-[#4F46E5]"
          aria-label="Campaign budget in rupees"
        />
        <div className="mt-1 flex justify-between text-[11px] text-[#475569]">
          <span>₹500</span>
          <span>₹50,000</span>
        </div>
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#EEF2FF] p-4 text-center">
          <p className="text-xs font-medium text-[#475569]">Est. Completions</p>
          <p
            className="mt-1 text-3xl font-bold text-[#4F46E5] tabular-nums"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {stats.completions.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-[#475569]">real users</p>
        </div>
        <div className="rounded-2xl bg-[#ECFDF5] p-4 text-center">
          <p className="text-xs font-medium text-[#475569]">Est. Reach</p>
          <p
            className="mt-1 text-3xl font-bold text-[#10B981] tabular-nums"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {stats.reach.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-[#475569]">impressions</p>
        </div>
      </div>

      {/* Trust note */}
      <div className="flex items-center gap-2 rounded-2xl border border-[#10B981]/20 bg-[#ECFDF5] p-3">
        <img
          src="/icons/icon-deposit-refund.webp"
          alt=""
          width={24}
          height={24}
          loading="lazy"
          className="shrink-0 object-contain"
        />
        <p className="text-xs text-[#10B981] font-medium">
          100% safe deposit — unused budget is fully refundable at any time.
        </p>
      </div>

      <p className="text-center text-[11px] text-[#475569]">
        * Estimates based on ₹{CPT} avg cost per task. Results vary by task type and targeting.
      </p>
    </div>
  );
}
