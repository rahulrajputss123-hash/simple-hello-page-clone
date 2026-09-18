import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

/**
 * Reusable main-section heading: a compact light-green icon badge on the left,
 * emerald premium title with a subtle brush accent + tasteful sparkle, and an
 * optional subtitle / right-aligned action. Left-aligned, mobile-first.
 */
/**
 * Layered mint leaf accent that finishes the ribbon's right tip. Purely
 * decorative; sized in the flex row so it can never overflow a narrow screen.
 */
function RibbonLeaves() {
  return (
    <svg viewBox="0 0 30 24" className="h-5 w-[1.6rem] shrink-0" aria-hidden>
      <path d="M2 13C8 3 18 1.5 27 4.5C21 13 10.5 16.5 2 13Z" fill="var(--mint)" opacity="0.95" />
      <path
        d="M4.5 19.5C9.5 13 17 12 23 14C18 20 10 22.5 4.5 19.5Z"
        fill="var(--mint)"
        opacity="0.55"
      />
    </svg>
  );
}

export function SectionHeading({
  icon: Icon,
  iconSrc,
  title,
  subtitle,
  action,
  size = "section",
  variant = "default",
  className = "",
}: {
  icon: LucideIcon;
  iconSrc?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  size?: "section" | "page";
  /**
   * "ribbon" is the Home-screen treatment: a jade ribbon emerging from behind
   * the icon with the title inside it. Every other screen keeps "default", so
   * this is purely additive.
   */
  variant?: "default" | "ribbon";
  className?: string;
}) {
  const isPage = size === "page";
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  if (variant === "ribbon") {
    return (
      <div
        data-testid={`section-heading-${slug}`}
        className={`${isPage ? "mb-3 mt-2" : "mb-3 mt-6"} ${className}`}
      >
        <div className="flex items-center justify-between gap-3">
          {/* min-w-0 lets the ribbon truncate instead of pushing the row wider. */}
          <div className="flex min-w-0 items-center">
            {/* Icon bubble sits above the ribbon so the ribbon reads as
                emerging from underneath it. */}
            <span
              aria-hidden
              data-testid={`section-heading-${slug}-icon`}
              className="relative z-20 grid size-12 shrink-0 place-items-center rounded-full bg-card shadow-soft ring-1 ring-inset ring-mint/35"
            >
              {iconSrc ? (
                <img src={iconSrc} alt="" className="size-10 object-contain" />
              ) : (
                <Icon className="size-[1.35rem] text-primary" strokeWidth={2.25} />
              )}
            </span>

            {/* Ribbon — negative margin tucks its rounded left end behind the icon. */}
            <span className="section-ribbon relative z-10 -ml-5 inline-flex min-w-0 items-center overflow-hidden rounded-full bg-jade-gradient py-2 pl-7 pr-5">
              <h2 className="truncate font-display text-[15px] uppercase leading-none tracking-[0.03em] text-primary-foreground">
                {title}
              </h2>
            </span>

            <span className="-ml-2 shrink-0">
              <RibbonLeaves />
            </span>
          </div>

          {action ? <div className="shrink-0">{action}</div> : null}
        </div>

        {/* Subtitle sits outside the ribbon, indented to line up with the title
            (icon 48px - 20px overlap + 28px ribbon padding = 56px). */}
        {subtitle ? (
          <p className="mt-2 pl-14 text-xs leading-snug text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      data-testid={`section-heading-${slug}`}
      className={`flex items-center justify-between gap-3 ${isPage ? "mt-2 mb-3" : "mt-6 mb-3"} ${className}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {iconSrc ? (
          <img
            src={iconSrc}
            alt=""
            aria-hidden
            data-testid={`section-heading-${slug}-icon`}
            className={`shrink-0 object-contain ${isPage ? "size-12" : "size-11"}`}
          />
        ) : (
          <span
            aria-hidden
            className={`relative grid shrink-0 place-items-center rounded-full bg-mint/15 text-primary shadow-soft ring-1 ring-inset ring-mint/30 ${
              isPage ? "size-11" : "size-10"
            }`}
          >
            <Icon className={isPage ? "size-5" : "size-[1.15rem]"} strokeWidth={2.25} />
          </span>
        )}

        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5">
            <span className="relative inline-block">
              <h2
                className={`font-display leading-tight text-primary ${isPage ? "text-xl" : "text-lg"}`}
              >
                {title}
              </h2>
              {/* mint→gold brush accent under the title (reserved for section headings) */}
              <svg
                aria-hidden
                viewBox="0 0 120 12"
                fill="none"
                preserveAspectRatio="none"
                className="pointer-events-none absolute -bottom-1 left-0 h-2.5 w-full"
              >
                <defs>
                  <linearGradient id={`sh-underline-${slug}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--mint)" />
                    <stop offset="55%" stopColor="var(--mint)" />
                    <stop offset="100%" stopColor="var(--gold-dark)" />
                  </linearGradient>
                </defs>
                <path
                  d="M2 8C28 3 62 3 118 6"
                  stroke={`url(#sh-underline-${slug})`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <Sparkles
              className="size-4 shrink-0 text-gold-dark drop-shadow-[0_1px_1px_rgba(0,0,0,0.12)]"
              style={{ animation: "sh-sparkle 2.4s ease-in-out infinite" }}
              aria-hidden
            />
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
