/**
 * HeroQuestStack — interactive 3D quest card stack for the Earner hero.
 * Visitors can simulate claiming a ₹50 reward, which ticks up a balance counter.
 */

import { useState, useCallback } from "react";

const INITIAL_BALANCE = 340;
const CLAIM_AMOUNT = 50;

const QUEST_CARDS = [
  {
    id: "featured",
    icon: "/icons/icon-featured-offers.webp",
    title: "Featured Quest",
    subtitle: "Complete & Earn",
    reward: "₹50",
    color: "#ECFDF5", // Soft Mint
    accent: "#10B981",
    badge: "🏆 Hot",
  },
  {
    id: "bonus",
    icon: "/icons/icon-bonus-gift.png",
    title: "Bonus Reward",
    subtitle: "Daily Gift",
    reward: "₹25",
    color: "#FFFBEB", // Warm Amber
    accent: "#F59E0B",
    badge: "🎁 Daily",
  },
  {
    id: "starter",
    icon: "/icons/icon-how-you-earn.webp",
    title: "Starter Quest",
    subtitle: "Earn Today",
    reward: "₹15",
    color: "#EEF2FF", // Soft Indigo
    accent: "#4F46E5",
    badge: "⚡ Easy",
  },
] as const;

export function HeroQuestStack() {
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [claimed, setClaimed] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [streakActive, setStreakActive] = useState(false);

  const handleClaim = useCallback(() => {
    if (animating) return;
    setAnimating(true);
    setClaimed(true);
    // Animate counter tick-up
    let current = balance;
    const target = balance + CLAIM_AMOUNT;
    const interval = setInterval(() => {
      current += 5;
      setBalance(current);
      if (current >= target) {
        clearInterval(interval);
        setBalance(target);
        setAnimating(false);
        setStreakActive(true);
      }
    }, 40);
  }, [animating, balance]);

  const handleReset = useCallback(() => {
    setClaimed(false);
    setStreakActive(false);
  }, []);

  return (
    <div className="relative flex flex-col items-center gap-4">
      {/* Balance Badge */}
      <div
        className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-4 py-2.5 shadow-[0_4px_16px_rgba(15,23,42,0.07)]"
        aria-live="polite"
        aria-label={`Your wallet balance: ₹${balance}`}
      >
        <span className="text-base" aria-hidden>💰</span>
        <span className="font-sans text-sm text-slate-500">Your Wallet</span>
        <span
          className="font-bold tabular-nums text-[#10B981] transition-all duration-300"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          ₹{balance.toLocaleString("en-IN")}
        </span>
        {animating && (
          <span className="animate-bounce text-[#10B981] text-xs font-bold">+₹{CLAIM_AMOUNT}</span>
        )}
      </div>

      {/* Stacked Cards */}
      <div className="relative h-[220px] w-[300px]" aria-label="Quest cards stack">
        {QUEST_CARDS.map((card, i) => {
          const isTop = i === 0;
          const offset = i * 8;
          const scale = 1 - i * 0.04;
          const zIndex = QUEST_CARDS.length - i;
          return (
            <div
              key={card.id}
              className="absolute left-0 right-0 mx-auto w-[280px] rounded-3xl border border-slate-200/80 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
              style={{
                top: `${offset}px`,
                transform: `scale(${scale}) translateY(${isTop && claimed ? "-6px" : "0px"})`,
                zIndex,
                backgroundColor: card.color,
                transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
                borderBottom: `4px solid ${card.accent}22`,
              }}
              aria-hidden={!isTop}
            >
              {isTop && (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex size-11 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: `${card.accent}18` }}
                      >
                        <img
                          src={card.icon}
                          alt={card.title}
                          width={28}
                          height={28}
                          fetchPriority="high"
                          className="object-contain"
                          draggable={false}
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-[#0F172A] text-sm leading-tight">
                          {card.title}
                        </p>
                        <p className="text-xs text-[#475569]">{card.subtitle}</p>
                      </div>
                    </div>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                      style={{ backgroundColor: `${card.accent}18`, color: card.accent }}
                    >
                      {card.badge}
                    </span>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-xs text-[#475569]">Reward</p>
                      <p
                        className="text-2xl font-bold tabular-nums"
                        style={{ color: card.accent, fontVariantNumeric: "tabular-nums" }}
                      >
                        {card.reward}
                      </p>
                    </div>
                    {claimed ? (
                      <button
                        onClick={handleReset}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-all active:translate-y-0.5"
                      >
                        ↺ Reset
                      </button>
                    ) : (
                      <button
                        onClick={handleClaim}
                        disabled={animating}
                        className="rounded-2xl border-b-4 border-[#0ea576] bg-[#10B981] px-4 py-2 text-xs font-bold text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)] transition-all active:translate-y-0.5 active:border-b-2 hover:bg-[#0ea576] disabled:opacity-60"
                        aria-label="Simulate claiming ₹50 reward"
                      >
                        Simulate Claim +₹50
                      </button>
                    )}
                  </div>
                </>
              )}
              {!isTop && (
                <div className="h-[80px] flex items-center px-1 opacity-60">
                  <div
                    className="flex size-8 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${card.accent}18` }}
                  >
                    <img
                      src={card.icon}
                      alt=""
                      width={20}
                      height={20}
                      loading="lazy"
                      className="object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Streak Bonus Pill */}
      {streakActive && (
        <div className="flex items-center gap-1.5 rounded-2xl border border-amber-200 bg-[#FFFBEB] px-3 py-1.5 text-xs font-semibold text-amber-700 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          <img
            src="/icons/icon-bonus-gift.png"
            alt=""
            width={16}
            height={16}
            loading="lazy"
            className="object-contain"
          />
          🔥 Day Streak Bonus Unlocked!
        </div>
      )}
    </div>
  );
}
