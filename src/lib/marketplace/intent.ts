import { safeStorage } from "@/lib/safe-storage";

/**
 * Set by the landing page's advertiser promo so that, after the visitor's first
 * sign-in, the app can open "Become an Advertiser" for them.
 */
const ADVERTISER_INTENT_KEY = "cashgpt.intent";

export function rememberAdvertiserIntent(): void {
  safeStorage.setItem(ADVERTISER_INTENT_KEY, "advertiser");
}

export function hasAdvertiserIntent(): boolean {
  return safeStorage.getItem(ADVERTISER_INTENT_KEY) === "advertiser";
}

export function clearAdvertiserIntent(): void {
  safeStorage.removeItem(ADVERTISER_INTENT_KEY);
}
