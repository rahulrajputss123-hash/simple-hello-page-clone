import type { ReactNode } from "react";

import { useScrollReveal } from "@/hooks/useScrollReveal";

/**
 * Wraps content in a one-shot fade + rise as it scrolls into view.
 *
 * @param stagger Cascades the wrapper's direct children instead of moving the
 *   wrapper as one block — use for card grids.
 */
export function Reveal({
  children,
  className = "",
  stagger = false,
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
  delayMs?: number;
}) {
  const { ref, shown } = useScrollReveal<HTMLDivElement>();

  if (stagger) {
    // The wrapper observes; CSS cascades its direct children via transition-delay.
    return (
      <div ref={ref} className={`reveal-stagger ${shown ? "reveal-in" : ""} ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={`reveal ${shown ? "reveal-in" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
