import { Star } from "lucide-react";

import { useCountUpOnVisible } from "@/hooks/useCountUp";
import { AVATAR_OPTIONS, avatarById } from "@/lib/onboarding/premium";
import { TESTIMONIALS } from "@/components/landing/landing-data";

/** Same five illustrated avatars the app's Live Community block uses. */
const COMMUNITY_AVATARS = AVATAR_OPTIONS.slice(0, 5);

function StarRow({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-0.5 text-gold-dark ${className}`} aria-hidden>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} className="size-3.5 fill-current" />
      ))}
    </span>
  );
}

/**
 * Social proof: the animated community counter, an avatar-stack review badge and
 * three short testimonials.
 *
 * Reuses `useCountUpOnVisible` (the same scroll-triggered counter behind the app's
 * Live Community stat) and the illustrated `AVATAR_OPTIONS` from onboarding, so
 * the faces here are the same ones users meet in the product.
 */
export function TrustSection() {
  const communityStat = useCountUpOnVisible(50000);

  return (
    <section data-testid="trust-section" aria-labelledby="trust-heading">
      <div className="text-center">
        <h2
          id="trust-heading"
          className="font-display text-[1.6rem] leading-tight text-foreground sm:text-[2rem]"
        >
          Trusted by <span className="text-gold-dark">earners worldwide</span>
        </h2>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {/* Part A — Live Community counter */}
        <section
          ref={communityStat.ref}
          data-testid="landing-live-community"
          className="surface-card relative overflow-hidden p-5"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-mint/10 blur-2xl"
          />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary ring-1 ring-inset ring-mint/25">
            <span className="relative grid size-1.5 place-items-center">
              <span className="payout-live-dot absolute inset-0 rounded-full bg-primary" />
              <span className="size-1.5 rounded-full bg-primary" />
            </span>
            Live Community
          </span>

          <div className="relative mt-3">
            <p
              className="text-amount font-display text-3xl leading-none text-foreground"
              data-testid="landing-live-community-stat"
            >
              {communityStat.value.toLocaleString()}+
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Users earning with us</p>
          </div>
        </section>

        {/* Part B — Reviews trust badge */}
        <section
          data-testid="landing-review-badge"
          className="surface-card relative overflow-hidden p-5"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -left-10 -bottom-12 size-40 rounded-full bg-gold/10 blur-2xl"
          />
          <div className="relative flex items-center gap-3">
            <div
              className="flex shrink-0 -space-x-3"
              aria-hidden
              data-testid="landing-avatar-stack"
            >
              {COMMUNITY_AVATARS.map((avatar, index) => (
                <img
                  key={avatar.id}
                  src={avatar.imageUrl}
                  alt=""
                  loading="lazy"
                  style={{ zIndex: COMMUNITY_AVATARS.length - index }}
                  className="size-11 rounded-full border-2 border-card object-cover shadow-soft"
                />
              ))}
            </div>
            <div className="min-w-0">
              <p className="font-display text-lg leading-tight text-foreground">
                1,000+ Happy Earners
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <StarRow />
                <span className="text-sm font-semibold text-foreground">4.8</span>
                <span className="text-xs text-muted-foreground">average rating</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Part C — Testimonials */}
      <ul
        className="stagger-children mt-4 grid gap-4 sm:grid-cols-3"
        data-testid="landing-testimonials"
      >
        {TESTIMONIALS.map((testimonial) => {
          const avatar = avatarById(testimonial.avatarId);
          return (
            <li
              key={testimonial.avatarId}
              className="surface-card flex flex-col gap-3 p-5"
              data-testid={`landing-testimonial-${testimonial.avatarId}`}
            >
              <StarRow />
              <blockquote className="flex-1 text-sm leading-relaxed text-foreground">
                "{testimonial.quote}"
              </blockquote>
              <div className="flex items-center gap-2.5">
                <img
                  src={avatar.imageUrl}
                  alt=""
                  loading="lazy"
                  className="size-9 shrink-0 rounded-full object-cover shadow-soft ring-1 ring-border"
                />
                <span className="text-sm font-semibold text-foreground">{testimonial.name}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
