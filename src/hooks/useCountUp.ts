import { useEffect, useState } from "react";

/**
 * Animates a number counting up from 0 to `target` on mount/when `target`
 * changes, using the same eased-raf technique already used inline for the
 * Home "Paid Out This Week" strip. Respects `prefers-reduced-motion` by
 * snapping straight to the target. Visual-only — does not affect any
 * underlying balance/data logic.
 */
export function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}
