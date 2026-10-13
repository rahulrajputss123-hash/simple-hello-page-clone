import { safeStorage } from "@/lib/safe-storage";
import { advertiserOnboardingStorageKey } from "./advertiser-onboarding";

/**
 * Check if advertiser onboarding has been completed for a user.
 * Completion is intentionally device-local because this feature adds no database migration.
 */
export function advertiserOnboardingSeen(userId: string) {
  return safeStorage.getItem(advertiserOnboardingStorageKey(userId)) === "seen";
}
