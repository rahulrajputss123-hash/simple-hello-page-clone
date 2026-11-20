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
 * Maps network slugs to their logo image paths.
 * Falls back to provider name if image doesn't exist.
 */
export const SURVEY_PROVIDER_IMAGES: Record<string, string | null> = {
  cpxresearch: null, // Will fallback to "CPX" text
  theoremreach: null, // Will fallback to "TheoremReach" text
  timewall: null, // Will fallback to "Timewall" text
};
