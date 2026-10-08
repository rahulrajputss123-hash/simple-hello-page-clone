import { useEffect, useReducer, useRef } from "react";

interface RotatingPhraseProps {
  phrases: string[];
  className?: string;
}

/**
 * Displays phrases one at a time in a continuous rotation. Each phrase stays
 * visible for 2.5s, then transitions out (fade + slide up 8px) while the next
 * phrase transitions in (fade + slide from 8px below). Layout is stable: all
 * phrases occupy the same space using CSS grid layering.
 *
 * Pauses when the browser tab is hidden. Respects prefers-reduced-motion by
 * showing only the first phrase with no rotation.
 */
export function RotatingPhrase({ phrases, className = "" }: RotatingPhraseProps) {
  const [activeIndex, cyclePhrase] = useReducer((i: number) => (i + 1) % phrases.length, 0);
  const timerRef = useRef<number | null>(null);
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (prefersReducedMotion || phrases.length <= 1) return;

    const schedule = () => {
      timerRef.current = window.setTimeout(() => {
        cyclePhrase();
        schedule();
      }, 2500);
    };

    // Pause when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timerRef.current) clearTimeout(timerRef.current);
      } else {
        schedule();
      }
    };

    schedule();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [phrases.length, prefersReducedMotion]);

  // Static display for reduced motion
  if (prefersReducedMotion) {
    return <span className={className}>{phrases[0]}</span>;
  }

  return (
    <span
      className={`inline-grid ${className}`}
      style={{ gridTemplateColumns: "1fr", gridTemplateRows: "1fr" }}
      aria-hidden="true"
    >
      {phrases.map((phrase, i) => (
        <span
          key={i}
          className="col-start-1 row-start-1 transition-all duration-400 ease-out"
          style={{
            opacity: i === activeIndex ? 1 : 0,
            transform: i === activeIndex ? "translateY(0)" : "translateY(8px)",
            visibility: i === activeIndex ? "visible" : "hidden",
          }}
        >
          {phrase}
        </span>
      ))}
    </span>
  );
}
