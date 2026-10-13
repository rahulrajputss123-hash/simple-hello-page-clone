const ADVERTISER_INTENT_KEY = "cashgpt.advertiser_intent";

export function hasAdvertiserIntent(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(ADVERTISER_INTENT_KEY) === "1";
}

export function clearAdvertiserIntent(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(ADVERTISER_INTENT_KEY);
  }
}

export function setAdvertiserIntent(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(ADVERTISER_INTENT_KEY, "1");
  }
}
