/**
 * Survey UI Configuration
 * 
 * Centralized config for survey card display across home and /surveys pages.
 */

/**
 * Number of survey cards visible in home row.
 * - 2.5 shows 2.5 cards, peeking the 3rd to indicate scroll
 * - 3 shows exactly 3 cards
 * This affects card width on home only, NOT the /surveys grid.
 */
export const SURVEY_CARDS_VISIBLE = 2.5;

/**
 * Provider image mapping.
 * Maps network slugs to their logo image paths in /images/providers/
 */
export const SURVEY_PROVIDER_IMAGES: Record<string, string> = {
  cpxresearch: "/images/providers/cpxresearch.png",
  theoremreach: "/images/providers/theoremreach.png",
  timewall: "/images/providers/timewall.png",
};

/**
 * Provider display names for fallback when image fails to load.
 */
export const SURVEY_PROVIDER_NAMES: Record<string, string> = {
  cpxresearch: "CPX Research",
  theoremreach: "TheoremReach",
  timewall: "Timewall",
};
