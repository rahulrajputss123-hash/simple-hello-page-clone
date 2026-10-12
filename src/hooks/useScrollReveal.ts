import { useEffect, useRef, useState } from "react";

/**
 * One-shot "has this scrolled into view yet" flag for scroll-reveal animations.
 *
 * Attach `ref` to the element and apply the `reveal` / `reveal-in` classes from
 * styles.css based on `shown`. The observer disconnects after the first
 * intersection, so scrolling back up never replays the animation.
 *
 * Under `prefers-reduced-motion` it resolves to `true` immediately, which pairs
 * with the CSS override that renders `.reveal` at its final position.
 *
 * @param threshold How much of the element must be visible. Default 0.15.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (shown) return;
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }

    // Fail-safe: this hook hides content (opacity 0) until the observer fires. In
    // sandboxed previews or very old browsers the observer can be missing or never
    // call back, which would leave every revealed section permanently invisible.
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    let responded = false;
    const observer = new IntersectionObserver(
      (entries) => {
        // A working observer always reports once right after observe(), even when
        // the element is off-screen.
        responded = true;
        if (!entries[0]?.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    const fallback = window.setTimeout(() => {
      if (!responded) setShown(true);
    }, 1500);
    return () => {
      window.clearTimeout(fallback);
      observer.disconnect();
    };
  }, [shown, threshold]);

  return { ref, shown };
}
