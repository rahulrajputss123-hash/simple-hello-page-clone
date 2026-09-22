import { useEffect, useRef, useState } from "react";

/** Tracks which one-shot keys have already animated during this page load. */
const playedKeys = new Set<string>();

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Animates a number from 0 up to `target` the first time a real value arrives.
 *
 * Display-only: the returned value is purely for rendering and never feeds back
 * into state or requests. Later changes to `target` are reflected immediately
 * without re-animating, so a balance update never replays the count-up.
 *
 * @param target The real value to land on.
 * @param options.durationMs Animation length. Default 900ms.
 * @param options.onceKey When set, the count-up plays only once per page load
 *   for that key — used for the shared header balance so it doesn't replay on
 *   every route change.
 */
export function useCountUp(
  target: number,
  options: { durationMs?: number; onceKey?: string } = {},
): number {
  const { durationMs = 900, onceKey } = options;
  const [value, setValue] = useState(target);
  const startedRef = useRef(false);

  useEffect(() => {
    // Already animated (or not eligible) — track the real value directly.
    if (startedRef.current || !Number.isFinite(target) || target <= 0) {
      setValue(target);
      return;
    }
    if (onceKey && playedKeys.has(onceKey)) {
      setValue(target);
      return;
    }

    startedRef.current = true;
    if (onceKey) playedKeys.add(onceKey);

    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      if (progress < 1) {
        setValue(target * eased);
        frame = requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, onceKey]);

  return value;
}

/**
 * Counts up from 0 to `target` once the attached element first scrolls into view.
 *
 * Display-only, one-shot per mount: the observer disconnects after the first
 * intersection so scrolling back up never replays it. Attach the returned `ref`
 * to the element that should trigger the animation.
 *
 * Unlike {@link useCountUp}, this starts at 0 and is driven by visibility rather
 * than by an async value arriving — use it for static marketing/stat figures.
 *
 * @param target The value to land on.
 * @param duration Animation length in ms. Default 1400ms.
 */
export function useCountUpOnVisible(target: number, duration = 1400) {
  const ref = useRef<HTMLElement | null>(null);
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || startedRef.current) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      startedRef.current = true;
      setValue(target);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry || !entry.isIntersecting || startedRef.current) return;
        startedRef.current = true;
        observer.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / duration);
          const eased = 1 - (1 - progress) ** 3;
          setValue(Math.round(target * eased));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [target, duration]);

  return { ref, value };
}
