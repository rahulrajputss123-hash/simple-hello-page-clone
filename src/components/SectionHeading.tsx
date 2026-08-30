import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

/**
 * Reusable main-section heading: a compact light-green icon badge on the left,
 * emerald premium title with a subtle brush accent + tasteful sparkle, and an
 * optional subtitle / right-aligned action. Left-aligned, mobile-first.
 */
export function SectionHeading({
  icon: Icon,
  title,
  subtitle,
  action,
  size = "section",
  className = "",
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  size?: "section" | "page";
  className?: string;
}) {
  const isPage = size === "page";
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return (
    <div
      data-testid={`section-heading-${slug}`}
      className={`flex items-center justify-between gap-3 ${isPage ? "mt-2 mb-3" : "mt-6 mb-3"} ${className}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className={`relative grid shrink-0 place-items-center rounded-full bg-mint/15 text-primary shadow-soft ring-1 ring-inset ring-mint/30 ${
            isPage ? "size-11" : "size-10"
          }`}
        >
          <Icon className={isPage ? "size-5" : "size-[1.15rem]"} strokeWidth={2.25} />
        </span>

        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5">
            <span className="relative inline-block">
              <h2
                className={`font-display leading-tight text-foreground ${isPage ? "text-xl" : "text-lg"}`}
              >
                {title}
              </h2>
              {/* subtle curved brush accent under the title */}
              <svg
                aria-hidden
                viewBox="0 0 120 12"
                fill="none"
                preserveAspectRatio="none"
                className="pointer-events-none absolute -bottom-1 left-0 h-2 w-full text-mint/40"
              >
                <path
                  d="M2 8C28 3 62 3 118 6"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <Sparkles className="size-3.5 shrink-0 text-gold" aria-hidden />
          </span>
          {subtitle ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
