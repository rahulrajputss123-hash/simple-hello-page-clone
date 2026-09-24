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

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [shown, threshold]);

  return { ref, shown };
}
