import { ArrowUpRight, Gift } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { Link } from "@tanstack/react-router";

import { OfferTagRow, type OfferTag } from "@/components/OfferTagRow";
import { formatReward } from "@/lib/format-reward";
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
  claim_status?: "started" | "pending" | "approved" | "rejected" | null;
  provider_name?: string | null;
  devices?: string[];
  category?: string | null;
  onPrefetch: () => void;
  isEager?: boolean; // First 6 cards
  isPriority?: boolean; // First 3 cards
}

/**
 * Normalize device for display: treat "desktop" as "web", capitalize first letter
 */
function displayDevice(device: string): string {
  const normalized = device.toLowerCase() === "desktop" ? "web" : device.toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/**
 * Memoized offer card with internal image error state.
 * Renders as a Link to prevent re-renders when other cards change.
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
  claim_status,
  provider_name,
  devices = [],
  category,
  onPrefetch,
  isEager = false,
  isPriority = false,
}: OfferCardProps) {
  const [broken, setBroken] = useState(false);
  const handleImageError = useCallback(() => setBroken(true), []);
  const showImage = Boolean(image_url) && !broken;

  // Generate optimized image URL if from Supabase Storage
  const imageSrc =
    image_url && image_url.includes("supabase.co/storage")
      ? `${image_url}?width=360&quality=70`
      : image_url;

  const displayBadge = offerDisplayBadge({ display_price, display_percent });

  // Show status badge if claim exists
  const showStatusBadge = claim_status === "started" || claim_status === "pending";
  const statusText = claim_status === "started" ? "In progress" : "Pending";
  const statusColor =
    claim_status === "started" ? "bg-primary text-primary-foreground" : "bg-amber-500 text-white";

  // Device labels: show "All devices" if empty, otherwise show chips
  const deviceLabels = devices.length === 0 ? ["All devices"] : devices.map(displayDevice);

  return (
    <li
      className="surface-card group relative flex cursor-pointer flex-col overflow-hidden !p-0 shadow-soft outline-none transition-[transform,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.98]"
      style={{ contentVisibility: "auto", containIntrinsicSize: "0 250px" }}
      data-testid={`featured-offer-${id}`}
    >
      <Link
        to="/offer/$offerId"
        params={{ offerId: id }}
        preload="intent"
        className="flex flex-1 flex-col"
        onPointerDown={onPrefetch}
        onMouseEnter={onPrefetch}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-background-alt">
          {showImage ? (
            <img
              src={imageSrc!}
              alt={title}
              width={360}
              height={270}
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
          {showStatusBadge && (
            <span
              className={`absolute right-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor}`}
            >
              {statusText}
            </span>
          )}
          <span
            className="absolute bottom-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-card/95 text-primary shadow-soft transition-transform duration-200"
            data-testid={`featured-offer-claim-${id}`}
          >
            <ArrowUpRight className="size-3.5" />
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-0.5 p-2.5">
          {/* Provider name + category chips */}
          {(provider_name || category) && (
            <div className="mb-1 flex flex-wrap items-center gap-1">
              {provider_name && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {provider_name}
                </span>
              )}
              {category && (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                  {category}
                </span>
              )}
            </div>
          )}
          
          <p className="truncate text-[13px] font-semibold leading-tight">{title}</p>
          <p className="truncate text-[11px] leading-snug text-muted-foreground">{description}</p>
          
          {/* Device chips */}
          <div className="mt-1 flex flex-wrap gap-1">
            {deviceLabels.map((device) => (
              <span
                key={device}
                className="rounded-full border border-border bg-background-alt px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground"
              >
                {device}
              </span>
            ))}
          </div>
          
          <span
            className="text-amount mt-auto pt-1 text-base leading-none text-gold-dark"
            data-testid={`featured-offer-amount-${id}`}
          >
            {displayBadge ?? formatReward(reward_amount)}
          </span>
        </div>
      </Link>
    </li>
  );
});
