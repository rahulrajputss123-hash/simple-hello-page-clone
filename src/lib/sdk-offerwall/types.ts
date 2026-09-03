// Provider-agnostic SDK Offerwall contracts.
// Completely separate from the Offer Feed provider system (src/lib/offers/*).
// No real SDK is integrated yet — this is the configuration + adapter contract.

export type SdkIntegrationType = "placeholder" | "native_sdk" | "web_sdk" | "hybrid" | "api";
export type SdkProviderStatus = "draft" | "configured" | "testing" | "live" | "disabled";
export type SdkPlatform = "android" | "ios" | "web";
export type SdkRoundingMode = "floor" | "ceil" | "nearest";
export type SdkIdentityMode = "user_uuid" | "hashed_uuid" | "referral_code" | "custom";
export type SdkDedupeStrategy = "transaction_id" | "transaction_id_and_user" | "payload_hash";
export type SdkPostbackAuthMode = "none" | "signature" | "ip_allowlist" | "signature_and_ip";
export type SdkConversionStatus = "pending" | "credited" | "rejected" | "duplicate" | "reversed";

/** JSON-serializable config blob (safe to cross the server-fn boundary). */
export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
export type JsonObject = { [key: string]: Json };

/** Full admin-facing provider configuration row. */
export type SdkOfferwallProvider = {
  id: string;
  slug: string;
  lock_type: "none" | "time" | "earning";
  unlock_at: string | null;
  required_lifetime_earned: number | null;
  name: string;
  logo_url: string | null;
  tagline: string;
  enabled: boolean;
  display_order: number;
  platforms: string[];
  integration_type: string;
  sdk_version: string | null;
  app_id: string | null;
  placement_id: string | null;
  publisher_id: string | null;
  extra_config: JsonObject;
  /** Names of secrets (never the values themselves). */
  secret_refs: JsonObject;
  currency_name: string;
  currency_per_usd: number;
  reward_multiplier: number;
  min_reward: number;
  max_reward: number | null;
  rounding_mode: string;
  postback_path: string | null;
  postback_auth_mode: string;
  postback_signature_secret_ref: string | null;
  postback_ip_allowlist: string[];
  transaction_id_param: string;
  user_id_param: string;
  reward_param: string;
  user_identity_mode: string;
  user_identity_salt_ref: string | null;
  dedupe_strategy: string;
  dedupe_window_hours: number;
  status: string;
  notes: string;
  metadata: JsonObject;
  created_at: string;
  updated_at: string;
};

/** Safe projection sent to the app UI — never includes config or secret references. */
export type PublicSdkOfferwallProvider = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  logoUrl: string | null;
  platforms: string[];
  integrationType: string;
  status: string;
  displayOrder: number;
  lockType: "none" | "time" | "earning";
  unlockAt: string | null;
  requiredLifetimeEarned: number | null;
  isLocked: boolean;
  unlockReason:
    | { type: "time"; unlocksAt: string }
    | { type: "earning"; required: number; current: number }
    | null;
};

export type SdkProviderInput = {
  id?: string | undefined;
  slug: string;
  name: string;
  tagline: string;
  lockType: "none" | "time" | "earning";
  unlockAt?: string | null | undefined;
  requiredLifetimeEarned?: number | null | undefined;
  logoUrl?: string | null | undefined;
  enabled: boolean;
  displayOrder: number;
  platforms: string[];
  integrationType: SdkIntegrationType;
  sdkVersion?: string | null | undefined;
  appId?: string | null | undefined;
  placementId?: string | null | undefined;
  publisherId?: string | null | undefined;
  extraConfig: JsonObject;
  secretRefs: JsonObject;
  currencyName: string;
  currencyPerUsd: number;
  rewardMultiplier: number;
  minReward: number;
  maxReward?: number | null | undefined;
  roundingMode: SdkRoundingMode;
  postbackPath?: string | null | undefined;
  postbackAuthMode: SdkPostbackAuthMode;
  postbackSignatureSecretRef?: string | null | undefined;
  postbackIpAllowlist: string[];
  transactionIdParam: string;
  userIdParam: string;
  rewardParam: string;
  userIdentityMode: SdkIdentityMode;
  userIdentitySaltRef?: string | null | undefined;
  dedupeStrategy: SdkDedupeStrategy;
  dedupeWindowHours: number;
  status: SdkProviderStatus;
  notes: string;
  metadata: JsonObject;
};

/**
 * Contract a future SDK adapter must satisfy. One file per network under
 * `src/lib/sdk-offerwall/adapters/`. Nothing implements this yet on purpose.
 */
export type SdkOfferwallAdapter = {
  slug: string;
  integrationType: SdkIntegrationType;
  /** Validate provider configuration before it can be marked live. */
  validateConfig?: (provider: SdkOfferwallProvider) => string | null;
  /** Build the launch payload the mobile shell needs to open the wall. */
  buildLaunchPayload?: (
    provider: SdkOfferwallProvider,
    identity: { userRef: string },
  ) => JsonObject;
  /** Normalize an inbound postback into our common conversion shape. */
  parsePostback?: (
    provider: SdkOfferwallProvider,
    payload: JsonObject,
  ) => NormalizedSdkConversion;
  /** Verify signature / caller authenticity for a postback. */
  verifyPostback?: (
    provider: SdkOfferwallProvider,
    input: { rawBody: string; headers: Record<string, string>; sourceIp: string | null },
  ) => Promise<boolean> | boolean;
};

export type NormalizedSdkConversion = {
  providerTransactionId: string;
  providerUserRef: string;
  providerOfferId?: string | undefined;
  currencyAmount: number;
  raw: JsonObject;
};

/** Provider currency -> USD wallet amount. Pure helper; no wallet writes here. */
export function convertSdkCurrency(
  provider: Pick<
    SdkOfferwallProvider,
    "currency_per_usd" | "reward_multiplier" | "min_reward" | "max_reward" | "rounding_mode"
  >,
  currencyAmount: number,
): number {
  const perUsd = Number(provider.currency_per_usd) || 1;
  const raw = (currencyAmount / perUsd) * (Number(provider.reward_multiplier) || 1);
  const cents = raw * 100;
  const rounded =
    provider.rounding_mode === "floor"
      ? Math.floor(cents)
      : provider.rounding_mode === "ceil"
        ? Math.ceil(cents)
        : Math.round(cents);
  let value = rounded / 100;
  if (value < Number(provider.min_reward)) value = Number(provider.min_reward);
  if (provider.max_reward != null && value > Number(provider.max_reward)) {
    value = Number(provider.max_reward);
  }
  return Math.max(0, Math.round(value * 100) / 100);
}

export function compareSdkProviders(
  a: Pick<SdkOfferwallProvider, "display_order" | "name">,
  b: Pick<SdkOfferwallProvider, "display_order" | "name">,
): number {
  const order = a.display_order - b.display_order;
  return order !== 0 ? order : a.name.localeCompare(b.name);
}
