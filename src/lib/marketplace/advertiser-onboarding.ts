export type AdvertiserOnboardingOverview = {
  promoActive: boolean;
  lifetimeDeposited: number;
  userBonusPercent: number;
  minDepositUsd: number;
  maxDepositUsd: number;
  promoEndsAt: string | null;
};

export function getAdvertiserOnboardingContent(overview: AdvertiserOnboardingOverview) {
  const bonusEligible =
    overview.promoActive && overview.lifetimeDeposited === 0 && overview.userBonusPercent > 0;
  const percent = Math.max(0, overview.userBonusPercent);
  const exampleDeposit = Math.max(0, overview.minDepositUsd);
  const exampleBonus = Math.round(exampleDeposit * (percent / 100) * 100) / 100;
  const endsAt = overview.promoEndsAt && new Date(overview.promoEndsAt).getTime() > Date.now()
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(overview.promoEndsAt))
    : null;

  return bonusEligible
    ? {
        title: "Get More Campaign Credit",
        description: `Your first deposit may qualify for a ${percent}% campaign credit bonus. A ${exampleDeposit.toFixed(2)} deposit could become $${(exampleDeposit + exampleBonus).toFixed(2)} in campaign funds, subject to the live deposit rules. Bonus funds unlock as you spend and are not withdrawable cash.${endsAt ? ` Promotion ends ${endsAt}.` : ""}`,
        bonusEligible: true,
        percent,
      }
    : {
        title: "Build Your Next Campaign",
        description: "Create campaigns, reach CashGPT members, and manage your campaign funds from one advertiser dashboard.",
        bonusEligible: false,
        percent: 0,
      };
}

export function advertiserOnboardingStorageKey(userId: string) {
  return `cashgpt.advertiser_onboarding_seen.${userId}`;
}

export function advertiserOnboardingActivationKey(userId: string) {
  return `cashgpt.advertiser_onboarding_activation.${userId}`;
}

export function advertiserAccountIsNew(createdAt: string | null | undefined, now = Date.now()) {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  return Number.isFinite(created) && created <= now && now - created < 24 * 60 * 60 * 1000;
}
