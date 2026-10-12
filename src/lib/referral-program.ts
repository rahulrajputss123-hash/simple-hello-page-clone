import { REFERRAL_MILESTONE_BONUS, REFERRAL_MAX_BONUS, REFERRAL_WINDOW_DAYS, formatMoney } from "@/lib/coinquest";

export const ADVERTISER_REFERRAL_PERCENT = 50;
export const ADVERTISER_REFERRAL_CAP_USD = 100;
export const ADVERTISER_REFERRAL_HOLD_DAYS = 7;
export const REFERRAL_HEADLINE_MAX = 100;
// TODO: read min_deposit_usd from settings.
export const ADVERTISER_REFERRAL_MIN_DEPOSIT_USD = 10;

export const PUBLISHER_REFERRAL_RULES = [
  `Each referred friend is worth up to ${formatMoney(REFERRAL_MAX_BONUS)} — one ${formatMoney(REFERRAL_MILESTONE_BONUS)} milestone for each of the 3 steps above, counted once per friend.`,
  `Milestones unlock referral earnings as pending. Nothing is credited milestone by milestone — pending earnings are not part of your wallet balance and cannot be withdrawn. The full ${formatMoney(REFERRAL_MAX_BONUS)} is released into your main wallet in one go, only once that friend has completed all 3 milestones.`,
  `All 3 milestones must be completed within ${REFERRAL_WINDOW_DAYS} days of your friend's signup, or that referral expires and its pending earnings are not released. Self-referrals, duplicate accounts and fraudulent activity void all referral rewards.`,
] as const;

export const ADVERTISER_REFERRAL_RULES = [
  "Your invite link works for two separate programs: publisher referral and advertiser referral. Advertiser rewards are added on top of publisher rewards.",
  `When a friend you invited becomes an advertiser and makes a deposit of at least ${formatMoney(ADVERTISER_REFERRAL_MIN_DEPOSIT_USD)}, you earn ${ADVERTISER_REFERRAL_PERCENT}% of that deposit.`,
  `Example: if your friend deposits $100, you earn ${formatMoney(100 * ADVERTISER_REFERRAL_PERCENT / 100)}.`,
  `You can earn up to ${formatMoney(ADVERTISER_REFERRAL_CAP_USD)} in total per referred advertiser. Deposits beyond that earn no extra bonus.`,
  `The bonus shows as Pending for ${ADVERTISER_REFERRAL_HOLD_DAYS} days after the deposit clears, then it is Credited to your main wallet.`,
  "If a deposit is refunded, reversed or charged back, the related bonus is cancelled, and deducted if it was already credited.",
  "Bonuses are paid only on real, successful deposits, not on promotional or bonus credit.",
  "Self-referrals, duplicate or linked accounts, and fraudulent activity void the bonus.",
  "Program rules may change; changes apply to new deposits only.",
] as const;

export const ADVERTISER_REFERRAL = {
  ADVERTISER_REFERRAL_PERCENT,
  ADVERTISER_REFERRAL_CAP_USD,
  ADVERTISER_REFERRAL_HOLD_DAYS,
  REFERRAL_HEADLINE_MAX,
};

export const formatAdvertiserReferralHeadline = () => `Invite friends, earn up to $${REFERRAL_HEADLINE_MAX}`;

export const formatAdvertiserReferralLine = (publisherBonus: number) =>
  `Earn ${formatMoney(publisherBonus)} per friend who completes all 3 publisher milestones, plus ${ADVERTISER_REFERRAL_PERCENT}% of an advertiser friend's deposit (up to ${formatMoney(ADVERTISER_REFERRAL_CAP_USD)}).`;
