import { Flame, Star, TrendingUp, Zap, Tag } from "lucide-react";

/**
 * Small inline row of coloured badges rendered above the offer title.
 * `deal` is auto-derived from `is_limited_deal`; the other four come from
 * the offer's `tags` array (admin-set or server-auto-computed).
 */
export type OfferTag = "Hot" | "Trending" | "Easy" | "Popular";

const CONFIG: Record<
  "Deal" | OfferTag,
  { icon: typeof Flame; label: string; className: string }
> = {
  Deal: {
    icon: Tag,
    label: "Deal",
    className: "bg-gold-gradient text-gold-foreground shadow-gold",
  },
  Hot: {
    icon: Flame,
    label: "Hot",
    className: "bg-red-500/15 text-red-600",
  },
  Trending: {
    icon: TrendingUp,
    label: "Trending",
    className: "bg-primary/15 text-primary",
  },
  Easy: {
    icon: Zap,
    label: "Easy",
    className: "bg-mint/25 text-primary",
  },
  Popular: {
    icon: Star,
    label: "Popular",
    className: "bg-gold/20 text-gold-dark",
  },
};

export function OfferTagRow({
  tags,
  isDeal,
  className = "",
  size = "sm",
}: {
  tags: OfferTag[];
  isDeal?: boolean;
  className?: string;
  size?: "xs" | "sm";
}) {
  const items: ("Deal" | OfferTag)[] = [];
  if (isDeal) items.push("Deal");
  for (const t of tags) if (!items.includes(t)) items.push(t);
  if (!items.length) return null;
  const px = size === "xs" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]";
  return (
    <div className={`flex flex-wrap gap-1 ${className}`} data-testid="offer-tag-row">
      {items.map((key) => {
        const c = CONFIG[key];
        const Icon = c.icon;
        return (
          <span
            key={key}
            className={`inline-flex items-center gap-0.5 rounded-full font-bold uppercase tracking-wide ${px} ${c.className}`}
            data-testid={`offer-tag-${key.toLowerCase()}`}
          >
            <Icon className={size === "xs" ? "size-2.5" : "size-3"} />
            {c.label}
          </span>
        );
      })}
    </div>
  );
}
