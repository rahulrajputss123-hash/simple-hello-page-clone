import { CroppedArt } from "@/components/landing/CroppedArt";
import { SHOWCASE_OFFERS, type ShowcaseOffer } from "@/components/landing/landing-data";

/**
 * One offer card. Each upload is a full offer card whose own caption text is
 * truncated mid-word, so only its artwork panel is used and the title /
 * description / gold amount are rendered as real text underneath.
 *
 * No overlay chip is drawn on the art: each panel already carries its own circular
 * badge in the lower-right corner.
 */
function OfferCard({ offer, compact }: { offer: ShowcaseOffer; compact: boolean }) {
  return (
    <li
      className={`surface-card press-feedback group relative flex flex-col overflow-hidden !p-0 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-gold ${
        compact ? "w-[70%] shrink-0 snap-start lg:w-auto" : ""
      }`}
      data-testid={`showcase-offer-${offer.id}`}
    >
      {/* 5/4 keeps almost all of each art panel visible — the panels run
          ~1.17-1.27 wide, so a 4/3 box would clip their lower edge. */}
      <div className="relative aspect-[5/4] w-full overflow-hidden bg-background-alt">
        <CroppedArt src={offer.image} alt={offer.title} crop={offer.crop} />
      </div>

      <div className="flex flex-1 flex-col gap-0.5 p-2.5">
        <p className="truncate text-[13px] font-semibold leading-tight">{offer.title}</p>
        <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
          {offer.description}
        </p>
        <span className="text-amount mt-auto pt-1 text-base leading-none text-gold-dark">
          {offer.payout}
        </span>
      </div>
    </li>
  );
}

/**
 * Featured offers showcase — the three uploaded offer images.
 *
 * Grid, radius and hover mirror `FeaturedOffers.tsx`.
 *
 * @param variant
 *   `"section"` (default) renders a headed section, used by the /app page.
 *   `"compact"` drops the heading and, below `lg`, becomes a horizontal
 *   snap-scroll strip with each card at 70% width so the next one peeks in —
 *   used inside the web landing hero where vertical space is scarce.
 */
export function OffersShowcase({
  variant = "section",
  className = "",
}: {
  variant?: "section" | "compact";
  className?: string;
}) {
  const compact = variant === "compact";

  const list = (
    <ul
      className={
        compact
          ? "-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
          : "stagger-children mt-6 grid grid-cols-3 gap-3 sm:gap-4"
      }
      data-testid="offers-showcase-list"
    >
      {SHOWCASE_OFFERS.map((offer) => (
        <OfferCard key={offer.id} offer={offer} compact={compact} />
      ))}
    </ul>
  );

  if (compact) {
    return (
      <div className={className} data-testid="offers-showcase-compact">
        {list}
      </div>
    );
  }

  return (
    <section
      data-testid="offers-showcase"
      aria-labelledby="offers-showcase-heading"
      className={className}
    >
      <div className="text-center">
        <h2
          id="offers-showcase-heading"
          className="font-display text-[1.6rem] leading-tight text-foreground sm:text-[2rem]"
        >
          Real offers, <span className="text-gold-dark">real payouts</span>
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          A snapshot of what's live in the app right now. New partner offers land every day.
        </p>
      </div>
      {list}
    </section>
  );
}
