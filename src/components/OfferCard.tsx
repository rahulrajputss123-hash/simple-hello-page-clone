import { ArrowUpRight, Gift } from "lucide-react";
import { memo, useCallback, useState } from "react";

import { OfferTagRow, type OfferTag } from "@/components/OfferTagRow";
import { SuccessBurst } from "@/components/SuccessBurst";
import { formatMoney } from "@/lib/coinquest";
import { offerDisplayBadge } from "@/lib/offers/display-badge";

interface OfferCardProps {
  id: string;
  title: string;
  description: string;
  reward_amount: number;
  image_url: string | null;
  tags: OfferTag[] | null;
  is_limited_deal: boolean;
  display_price: string | null;
  display_percent: number | null;
  onOpen: () => void;
  showBurst: boolean;
  isEager?: boolean; // First 6 cards
  isPriority?: boolean; // First 3 cards
}

/**
 * Memoized offer card with internal image error and burst state.
 * Prevents re-renders when other cards change.
 */
export const OfferCard = memo(function OfferCard({
  id,
  title,
  description,
  reward_amount,
  image_url,
  tags,
  is_limited_deal,
  display_price,
  display_percent,
  onOpen,
  showBurst,
  isEager = false,
  isPriority = false,
}: OfferCardProps) {
  const [broken, setBroken] = useState(false);
  const handleImageError = useCallback(() => setBroken(true), []);
  const showImage = Boolean(image_url) && !broken;

  // Generate optimized image URL if from Supabase Storage
  const imageSrc = image_url && image_url.includes('supabase.co/storage')
    ? `${image_url}?width=360&quality=70`
    : image_url;

  const displayBadge = offerDisplayBadge({ display_price, display_percent });

  return (
    <li
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="surface-card group relative flex cursor-pointer flex-col overflow-hidden !p-0 shadow-soft outline-none transition-[transform,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.98]"
      style={{ contentVisibility: "auto", containIntrinsicSize: "0 250px" }}
      data-testid={`featured-offer-${id}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-background-alt">
        {showImage ? (
          <img
            src={imageSrc!}
            alt={title}
            loading={isEager ? "eager" : "lazy"}
            fetchPriority={isPriority ? "high" : undefined}
            decoding="async"
            onError={handleImageError}
            className="size-full object-cover transition-transform duration-300"
          />
        ) : (
          <span className="grid size-full place-items-center bg-jade-gradient text-primary-foreground">
            <Gift className="size-7" />
          </span>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/25 to-transparent" />
        <OfferTagRow
          tags={tags ?? []}
          isDeal={is_limited_deal}
          size="xs"
          className="absolute left-1.5 top-1.5"
        />
        <span
          className="absolute bottom-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-card/95 text-primary shadow-soft transition-transform duration-200"
          data-testid={`featured-offer-claim-${id}`}
        >
          <ArrowUpRight className="size-3.5" />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-0.5 p-2.5">
        <p className="truncate text-[13px] font-semibold leading-tight">{title}</p>
        <p className="truncate text-[11px] leading-snug text-muted-foreground">
          {description}
        </p>
        <span
          className="text-amount mt-auto pt-1 text-base leading-none text-gold-dark"
          data-testid={`featured-offer-amount-${id}`}
        >
          {displayBadge ?? formatMoney(reward_amount)}
        </span>
      </div>

      {showBurst && <SuccessBurst />}
    </li>
  );
});
