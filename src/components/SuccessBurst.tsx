import { useEffect, useRef, useState } from "react";

/**
 * Small, one-shot confetti/burst placed near a claim/withdraw button on a
 * successful reward moment. Not looping, not full-screen — a handful of
 * jade/mint/gold-tinted pieces that burst outward and fade once, then
 * unmount themselves. Purely decorative (absolutely positioned over its
 * relative parent) and respects `prefers-reduced-motion` (renders nothing).
 *
 * Usage: render `<SuccessBurst trigger={signal} />` inside a
 * `position: relative` wrapper around the button/element the burst should
 * appear near, where `signal` is any value that *changes* on every success
 * (e.g. a counter incremented in the mutation's `onSuccess`). The burst
 * fires once per change — it intentionally does not fire on initial mount.
 */
const PIECE_COLORS = [
  "var(--color-primary)",
  "var(--color-mint)",
  "var(--color-gold)",
  "var(--color-gold-dark)",
];

const PIECES = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2;
  const distance = 28 + (i % 3) * 10;
  return {
    x: Math.round(Math.cos(angle) * distance),
    y: Math.round(Math.sin(angle) * distance - 8),
    r: Math.round((i % 2 === 0 ? 1 : -1) * (90 + i * 20)),
    color: PIECE_COLORS[i % PIECE_COLORS.length]!,
    delay: i * 18,
  };
});

export function SuccessBurst({ trigger }: { trigger: number | string }) {
  const [active, setActive] = useState(false);
  const [reduced, setReduced] = useState(false);
  const seen = useRef(trigger);
  const firstRun = useRef(true);

  useEffect(() => {
    setReduced(
      typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  useEffect(() => {
    // Skip the initial mount — only fire when `trigger` actually changes.
    if (firstRun.current) {
      firstRun.current = false;
      seen.current = trigger;
      return;
    }
    if (trigger === seen.current || reduced) return;
    seen.current = trigger;
    setActive(true);
    const t = setTimeout(() => setActive(false), 700);
    return () => clearTimeout(t);
  }, [trigger, reduced]);

  if (!active || reduced) return null;

  return (
    <div aria-hidden className="confetti-burst" data-testid="success-burst">
      {PIECES.map((piece, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}ms`,
            ["--confetti-x" as string]: `${piece.x}px`,
            ["--confetti-y" as string]: `${piece.y}px`,
            ["--confetti-r" as string]: `${piece.r}deg`,
          }}
        />
      ))}
    </div>
  );
}
