import { Check, ListFilter } from "lucide-react";
import { startTransition, useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/**
 * Offer-type filter bottom sheet. Used only on the Offers page.
 * Selection is a single value; "All" means no filter.
 *
 * Controlled sheet with smooth animations: closes first, then applies filter
 * in startTransition to avoid blocking the animation.
 */

export type OfferFilter =
  "All" | "App Install" | "Trial" | "Deals" | "Survey" | "Games" | "Link Locker" | "Shortlink";

const FILTERS: OfferFilter[] = [
  "All",
  "App Install",
  "Trial",
  "Deals",
  "Survey",
  "Games",
  "Link Locker",
  "Shortlink",
];

export function OfferFilterButton({
  value,
  onChange,
}: {
  value: OfferFilter;
  onChange: (next: OfferFilter) => void;
}) {
  const [open, setOpen] = useState(false);

  const handleSelect = (filter: OfferFilter) => {
    // Close sheet first
    setOpen(false);
    // Apply filter after close animation (~180ms)
    setTimeout(() => {
      startTransition(() => {
        onChange(filter);
      });
    }, 180);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-full border-primary/30 bg-background pl-3 pr-4 shadow-soft"
          data-testid="offer-filter-btn"
        >
          <ListFilter className="size-4 text-primary" />
          <span className="text-xs font-semibold">{value === "All" ? "Filter" : value}</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] overflow-y-auto rounded-t-2xl"
        style={{
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
          animation: "slide-up 200ms ease-out",
        }}
        data-testid="offer-filter-sheet"
      >
        {/* Drag handle */}
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-muted" />

        <SheetHeader>
          <SheetTitle>Filter offers</SheetTitle>
        </SheetHeader>
        <ul className="mt-2 space-y-1 pb-4">
          {FILTERS.map((filter) => {
            const active = value === filter;
            return (
              <li key={filter}>
                <button
                  type="button"
                  onClick={() => handleSelect(filter)}
                  data-testid={`offer-filter-option-${filter.replace(/\s+/g, "-").toLowerCase()}`}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    active
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "border-border bg-card hover:bg-background-alt"
                  }`}
                >
                  <span>{filter === "All" ? "All Offers" : filter}</span>
                  {active && <Check className="size-4 text-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Matches an offer's category (may be null) against the currently-selected filter.
 * "All" matches everything. "Deals" matches EITHER category=Deals OR is_limited_deal=true
 * so the flagship cashback deals surface naturally under the filter.
 */
export function offerMatchesFilter(
  filter: OfferFilter,
  offer: { category?: string | null; is_limited_deal?: boolean },
): boolean {
  if (filter === "All") return true;
  if (filter === "Deals" && offer.is_limited_deal) return true;
  return offer.category === filter;
}
