import { CroppedArt } from "@/components/landing/CroppedArt";
import { EARN_WAYS } from "@/components/landing/landing-data";

/**
 * "8 Ways to Earn" — the uploaded tiles shown on a jade panel.
 *
 * The artwork already contains its own number badge, title and subtitle, so this
 * section deliberately renders no captions over or under the tiles; the labels
 * ride along as alt text instead.
 *
 * Each tile is cropped to its measured artwork bounds, then `mix-blend-lighten`
 * folds the artwork's own drop shadow (drawn onto black in the source) into the
 * jade behind it.
 *
 * The blend needs a predictable backdrop, so nothing between this section and the
 * `<img>` may create a stacking context — no transforms, filters, opacity or
 * `isolation` on the `<ul>`/`<li>`. Adding a hover-lift to the tiles would break
 * the blend mid-hover.
 */
export function EarnWaysSection() {
  return (
    <section
      className="rise-in relative isolate overflow-hidden rounded-[1.75rem] bg-jade-gradient px-4 py-9 shadow-lift sm:px-8 sm:py-12"
      data-testid="earn-ways-section"
      aria-labelledby="earn-ways-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--color-gold), transparent)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-16 size-56 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--color-mint), transparent)" }}
      />

      <div className="relative text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-gold-foreground shadow-gold">
          Earning methods
        </span>
        <h2
          id="earn-ways-heading"
          className="mt-4 font-display text-[2.1rem] leading-none text-primary-foreground sm:text-[2.75rem]"
        >
          <span className="text-gold">8</span> Ways to Earn
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-primary-foreground/70 sm:text-base">
          Explore all 8 ways and turn your time into real money!
        </p>
      </div>

      <ul
        className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
        data-testid="earn-ways-grid"
      >
        {EARN_WAYS.map((way) => (
          <li
            key={way.number}
            className="relative aspect-square overflow-hidden rounded-2xl"
            data-testid={`earn-way-${way.number}`}
          >
            <CroppedArt
              src={way.image}
              alt={`${way.title} — ${way.subtitle}`}
              crop={way.crop}
              blend
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
