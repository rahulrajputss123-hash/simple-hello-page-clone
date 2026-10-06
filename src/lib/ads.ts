import { safeStorage } from "@/lib/safe-storage";

/**
 * INTEGRATION POINT — rewarded video ads.
 *
 * Real rewarded-video SDKs (AdMob, Unity Ads) require a native wrapper
 * (Capacitor) and cannot run as pure web components. This module is the seam:
 * replace `playRewardedAd` with the native bridge call once the wrapper exists.
 *
 * The wallet is NEVER credited from here — the client only reports that an ad
 * finished; the server verifies session timing and rate limits before crediting.
 */
export type AdResult = { completed: boolean; provider: string };

export async function playRewardedAd(): Promise<AdResult> {
  // Placeholder: simulates a short rewarded video.
  await new Promise((resolve) => setTimeout(resolve, 5200));
  return { completed: true, provider: "placeholder" };
}

/** Stable-ish device fingerprint used for the one-account-per-device rule. */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  const KEY = "coinquest.device_id";
  const existing = safeStorage.getItem(KEY);
  if (existing) return existing;
  const seed = [
    navigator.userAgent,
    navigator.language,
    String(screen.width),
    String(screen.height),
    String(new Date().getTimezoneOffset()),
    Math.random().toString(36).slice(2),
  ].join("|");
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const id = `dev_${Math.abs(hash).toString(36)}`;
  safeStorage.setItem(KEY, id);
  return id;
}
