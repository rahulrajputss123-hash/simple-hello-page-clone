import type { CSSProperties } from "react";

/**
 * Small one-shot particle burst for reward moments (offer claimed, withdrawal
 * requested). Purely decorative: it plays once, is not full-screen, and is
 * disabled entirely under prefers-reduced-motion.
 *
 * The parent must be `position: relative` and should mount this with a changing
 * `key` (and unmount it after ~900ms) so the animation replays per event.
 */
const PARTICLES: { x: string; y: string; color: string }[] = [
  { x: "-34px", y: "-26px", color: "var(--color-gold)" },
  { x: "-14px", y: "-40px", color: "var(--color-mint)" },
  { x: "12px", y: "-42px", color: "var(--color-gold)" },
  { x: "34px", y: "-24px", color: "var(--color-primary)" },
  { x: "-40px", y: "2px", color: "var(--color-mint)" },
  { x: "40px", y: "4px", color: "var(--color-gold)" },
  { x: "-24px", y: "26px", color: "var(--color-primary)" },
  { x: "22px", y: "28px", color: "var(--color-mint)" },
];

export function SuccessBurst({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-20 grid place-items-center ${className}`}
      data-testid="success-burst"
    >
      {PARTICLES.map((particle, index) => (
        <span
          key={`${particle.x}-${particle.y}`}
          className="success-burst-dot"
          style={
            {
              background: particle.color,
              animationDelay: `${index * 14}ms`,
              "--burst-x": particle.x,
              "--burst-y": particle.y,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}
