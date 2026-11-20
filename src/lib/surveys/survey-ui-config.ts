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
 * Provider display names for chip (short versions).
 */
export const SURVEY_PROVIDER_NAMES: Record<string, string> = {
  cpxresearch: "CPX",
  theoremreach: "TheoremReach",
  timewall: "Timewall",
};

/**
 * Provider colors for card backgrounds and borders.
 */
export const SURVEY_PROVIDER_COLORS: Record<string, { bg: string; border: string }> = {
  cpxresearch: {
    bg: "rgba(8, 184, 136, 0.10)", // Green tint
    border: "rgba(8, 184, 136, 0.20)",
  },
  theoremreach: {
    bg: "rgba(136, 24, 248, 0.10)", // Purple tint
    border: "rgba(136, 24, 248, 0.20)",
  },
  timewall: {
    bg: "rgba(8, 152, 248, 0.10)", // Blue tint
    border: "rgba(8, 152, 248, 0.20)",
  },
};
