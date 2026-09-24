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
function RibbonLeaves({ isPage }: { isPage: boolean }) {
  return (
    <svg
      viewBox="0 0 30 24"
      className={`shrink-0 ${isPage ? "h-6 w-[1.9rem]" : "h-5 w-[1.6rem]"}`}
      aria-hidden
    >
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
    // size="page" gets the same ribbon one step larger, so a page title still
    // outranks the section headings sitting beneath it.
    const bubbleSize = isPage ? "size-14" : "size-12";
    const bubbleImgSize = isPage ? "size-12" : "size-10";
    const bubbleIconSize = isPage ? "size-[1.6rem]" : "size-[1.35rem]";
    const ribbonTuck = isPage ? "-ml-6" : "-ml-5";
    const ribbonPad = isPage ? "py-2.5 pl-8 pr-6" : "py-2 pl-7 pr-5";
    const titleSize = isPage ? "text-[17px]" : "text-[15px]";
    const leafTuck = isPage ? "-ml-2.5" : "-ml-2";
    // Lines the subtitle up with the title inside the ribbon:
    // page  = 56px bubble - 24px tuck + 32px ribbon padding = 64px (pl-16)
    // block = 48px bubble - 20px tuck + 28px ribbon padding = 56px (pl-14)
    const subtitleIndent = isPage ? "pl-16" : "pl-14";

    return (
      <div
        data-testid={`section-heading-${slug}`}
        className={`${isPage ? "mb-3 mt-2" : "mb-3 mt-6"} ${className}`}
      >
        {/* flex-wrap plus a basis on the heading group lets a trailing action
            drop onto its own line on very narrow phones instead of squeezing
            the ribbon title down to a couple of characters. With no action the
            group has no basis, so single-child rows are unaffected. */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          {/* min-w-0 lets the ribbon truncate instead of pushing the row wider. */}
          <div
            className={`flex min-w-0 items-center ${action ? "flex-1 basis-[13.5rem]" : ""}`.trim()}
          >
            {/* Icon bubble sits above the ribbon so the ribbon reads as
                emerging from underneath it. */}
            <span
              aria-hidden
              data-testid={`section-heading-${slug}-icon`}
              className={`relative z-20 grid ${bubbleSize} shrink-0 place-items-center rounded-full bg-card shadow-soft ring-1 ring-inset ring-mint/35`}
            >
              {iconSrc ? (
                <img
                  src={iconSrc}
                  alt=""
                  className={`${bubbleImgSize} object-contain`}
                  decoding="async"
                />
              ) : (
                <Icon className={`${bubbleIconSize} text-primary`} strokeWidth={2.25} />
              )}
            </span>

            {/* Ribbon — negative margin tucks its rounded left end behind the icon. */}
            <span
              className={`section-ribbon relative z-10 ${ribbonTuck} inline-flex min-w-0 items-center overflow-hidden rounded-full bg-jade-gradient ${ribbonPad}`}
            >
              <h2
                className={`truncate font-display ${titleSize} uppercase leading-none tracking-[0.03em] text-primary-foreground`}
              >
                {title}
              </h2>
            </span>

            <span className={`${leafTuck} shrink-0`}>
              <RibbonLeaves isPage={isPage} />
            </span>
          </div>

          {/* ms-auto keeps the action right-aligned both inline and once wrapped. */}
          {action ? <div className="ms-auto shrink-0">{action}</div> : null}
        </div>

        {/* Subtitle sits outside the ribbon and wraps freely rather than
            truncating, so long copy stays readable. */}
        {subtitle ? (
          <p className={`mt-2 ${subtitleIndent} text-xs leading-snug text-muted-foreground`}>
            {subtitle}
          </p>
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
            decoding="async"
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
