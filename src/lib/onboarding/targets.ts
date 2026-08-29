/**
 * Source of truth for valid onboarding-tour spotlight targets.
 *
 * A target is only usable if:
 *   1. The target element is present on the home screen at render time.
 *   2. That element carries the exact matching `id` attribute in the DOM.
 *
 * To add a new spotlight-able element:
 *   a. Add its `id` attribute to the JSX element on the home screen (or any
 *      screen the tour runs on).
 *   b. Register the id + human label + short "where it lives" hint here.
 *   c. Admins will then see it as a choice in the Onboarding admin form.
 */

export type OnboardingTarget = {
  id: string;
  label: string;
  location: string;
};

export const ONBOARDING_TARGETS: OnboardingTarget[] = [
  {
    id: "tour-wallet-balance",
    label: "Wallet balance pill (header)",
    location: "AppHeader — links to /wallet, shows the live balance in gold.",
  },
  {
    id: "tour-starter-quests",
    label: "Starter Quests section (home)",
    location: "Home page — the ads-for-cash Starter Quests row above Featured Offers.",
  },
  {
    id: "tour-featured-offers",
    label: "Featured Offers section (home)",
    location: "Home page — the featured offer cards below the Starter Quests.",
  },
];

export const ONBOARDING_TARGET_IDS: readonly string[] = ONBOARDING_TARGETS.map(
  (t) => t.id,
);

export function isValidTargetId(id: string): boolean {
  return (ONBOARDING_TARGET_IDS as readonly string[]).includes(id);
}
