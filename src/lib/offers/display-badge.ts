/**
 * Display-only badge text for an offer card.
 *
 * `display_price` and `display_percent` are decorative: they are rendered
 * verbatim and never take part in reward maths or crediting. An offer's actual
 * reward is always `reward_amount`, which is what gets paid regardless of what
 * these say.
 *
 * Both optional and independent:
 *   both set  -> "$5 · 110%"
 *   one set   -> just that one
 *   neither   -> null, so callers fall back to formatMoney(reward_amount)
 */

export type DisplayBadgeInput = {
  display_price?: string | null | undefined;
  display_percent?: number | string | null | undefined;
};

/** Middle dot with hair spaces, matching how the app separates inline metadata. */
const SEPARATOR = " · ";

function cleanPrice(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanPercent(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  // Drop a trailing ".0" so 110 reads "110%" rather than "110.0%", but keep a
  // genuine decimal like 12.5.
  const formatted = Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
  return `${formatted}%`;
}

/**
 * The badge string, or null when neither field is set.
 * Returning null (rather than "") lets callers branch to the reward fallback.
 */
export function offerDisplayBadge(offer: DisplayBadgeInput): string | null {
  const price = cleanPrice(offer.display_price);
  const percent = cleanPercent(offer.display_percent);
  if (price && percent) return `${price}${SEPARATOR}${percent}`;
  return price ?? percent ?? null;
}

/** True when the admin has set at least one display field. */
export function hasOfferDisplayBadge(offer: DisplayBadgeInput): boolean {
  return offerDisplayBadge(offer) !== null;
}
