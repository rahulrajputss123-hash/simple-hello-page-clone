/**
 * Static content for the public /app download landing page.
 *
 * Marketing copy + asset paths only — this module intentionally has no imports
 * and no runtime dependencies so the landing page stays isolated from the
 * authenticated app's auth / offers / wallet logic.
 *
 * Image paths are root-relative into `public/`. The uploaded landing assets are
 * JPEGs, hence the `.jpg` extensions.
 */

import type { ImageCrop } from "@/components/landing/CroppedArt";

/**
 * Fallback APK served when a store listing is unavailable.
 *
 * Drop the signed build at `public/cashgpt-latest.apk` (or point this at the
 * CDN/GitHub release URL) — nothing else needs to change.
 */
export const APK_DOWNLOAD_URL = "/cashgpt-latest.apk";

export type EarnWay = {
  /** Display number, matching the badge already drawn into the artwork. */
  number: string;
  /** Root-relative path to the uploaded icon art. */
  image: string;
  title: string;
  subtitle: string;
  /** Crop window isolating the tile artwork from its black letterboxing. */
  crop: ImageCrop;
};

/**
 * The 8 earning methods, in the order they appear in the app.
 *
 * Each `image` is already a finished tile — the number badge, title and subtitle
 * are part of the artwork — so the UI must not draw those a second time.
 * `title`/`subtitle` are kept here for alt text.
 *
 * `crop` values are derived from the measured artwork bounds in each file. The
 * 1280x714 uploads carry a wide black border; the 579x580 ones are already tight
 * (hence the pass-through 100 / 0 / 0).
 */
export const EARN_WAYS: EarnWay[] = [
  {
    number: "01",
    image: "/landing/earn-icons/01-ads.jpg",
    title: "Ads",
    subtitle: "Watch & Earn",
    crop: { widthPct: 238.36, leftPct: -70.76, topPct: -17.32 },
  },
  {
    number: "02",
    image: "/landing/earn-icons/02-shortlinks.jpg",
    title: "Shortlinks",
    subtitle: "Visit & Earn",
    crop: { widthPct: 100, leftPct: 0, topPct: 0 },
  },
  {
    number: "03",
    image: "/landing/earn-icons/03-locker.jpg",
    title: "Locker",
    subtitle: "Unlock & Earn",
    crop: { widthPct: 100, leftPct: 0, topPct: 0 },
  },
  {
    number: "04",
    image: "/landing/earn-icons/04-survey.jpg",
    title: "Survey",
    subtitle: "Share & Earn",
    crop: { widthPct: 100, leftPct: 0, topPct: 0 },
  },
  {
    number: "05",
    image: "/landing/earn-icons/05-appinstall.jpg",
    title: "App Install",
    subtitle: "Install & Earn",
    crop: { widthPct: 237.92, leftPct: -70.63, topPct: -17.29 },
  },
  {
    number: "06",
    image: "/landing/earn-icons/06-task.jpg",
    title: "Task",
    subtitle: "Complete & Earn",
    crop: { widthPct: 100, leftPct: 0, topPct: 0 },
  },
  {
    number: "07",
    image: "/landing/earn-icons/07-deal.jpg",
    title: "Deal offer",
    subtitle: "Claim & Earn",
    crop: { widthPct: 238.36, leftPct: -70.95, topPct: -17.69 },
  },
  {
    number: "08",
    image: "/landing/earn-icons/08-games.jpg",
    title: "Games",
    subtitle: "Play & Earn",
    crop: { widthPct: 242.42, leftPct: -67.42, topPct: -14.96 },
  },
];

export type ShowcaseOffer = {
  id: string;
  /** Root-relative path to the uploaded offer card art. */
  image: string;
  title: string;
  description: string;
  /** Pre-formatted payout label. */
  payout: string;
  /** Same figure as a number, so the simulated activity feed can format it itself. */
  rewardAmount: number;
  /**
   * Crop window isolating just the artwork panel at the top of each uploaded
   * card, so the title / description / amount can be rendered as real text
   * instead of showing the truncated copy baked into the image.
   * `topPct` is relative to the container height, so it assumes the 5/4 box
   * used by OffersShowcase.
   */
  crop: ImageCrop;
};

/** Sample payouts shown on the landing page. Static art, not the live offer feed. */
export const SHOWCASE_OFFERS: ShowcaseOffer[] = [
  {
    id: "virtual-number",
    image: "/landing/offers/virtual-number.jpg",
    title: "Virtual Number",
    description: "Verify a number, get paid",
    payout: "$5",
    rewardAmount: 5,
    crop: { widthPct: 123.83, leftPct: -12.18, topPct: -15.38 },
  },
  {
    id: "netflix",
    image: "/landing/offers/netflix.jpg",
    title: "Netflix Trial",
    description: "Start a free trial, keep the cash",
    payout: "$5",
    rewardAmount: 5,
    crop: { widthPct: 100, leftPct: 0, topPct: -0.17 },
  },
  {
    id: "ai-tool",
    image: "/landing/offers/ai-tool.jpg",
    title: "AI Tool Signup",
    description: "Sign up free, earn in minutes",
    payout: "$7",
    rewardAmount: 7,
    crop: { widthPct: 125.95, leftPct: -13.05, topPct: -23.28 },
  },
];

export type HowItWorksStep = {
  number: string;
  title: string;
  description: string;
};

export const HOW_IT_WORKS: HowItWorksStep[] = [
  {
    number: "1",
    title: "Download",
    description: "Install CashGPT and create your account in under a minute. No fees, ever.",
  },
  {
    number: "2",
    title: "Complete Tasks",
    description: "Watch, play, survey or claim offers. Rewards land in your wallet as you go.",
  },
  {
    number: "3",
    title: "Cash Out",
    description: "Withdraw to PayPal, crypto or gift cards from just $1. Your money, your way.",
  },
];

export type Testimonial = {
  /** Matches an `id` in AVATAR_OPTIONS so the illustrated avatar is reused. */
  avatarId: string;
  name: string;
  quote: string;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    avatarId: "sunny",
    name: "Aarav M.",
    quote:
      "Cleared my first $12 in about a week, mostly on surveys during my commute. PayPal payout landed the same evening.",
  },
  {
    avatarId: "ribbit",
    name: "Leah K.",
    quote:
      "I was fully expecting the withdrawal to be a hassle. It wasn't — $5 to my UPI, no questions asked.",
  },
  {
    avatarId: "byte",
    name: "Daniel O.",
    quote:
      "The game offers are the ones that stuck for me. Genuinely fun, and the payouts are bigger than I assumed.",
  },
];

export type StoreKey = "play" | "appstore";

export type StoreCopy = {
  /** Modal heading. */
  title: string;
  /** Modal body — friendly, store-specific, non-repeating. */
  message: string;
};

/**
 * Per-store modal copy. Deliberately worded differently for each store so the
 * two popups don't read like the same canned message.
 */
export const STORE_COPY: Record<StoreKey, StoreCopy> = {
  play: {
    title: "Play Store listing is under review",
    message:
      "Our Google Play page is going through a routine review right now, so the install button is paused for a short while. It should be live again within a day or two — thanks for bearing with us. In the meantime you can install the same build directly below.",
  },
  appstore: {
    title: "iOS app is almost here",
    message:
      "The App Store build is still with Apple's review team, so there's nothing to tap through to just yet. We'll flip it on the moment it clears. If you're on Android, the direct download below gets you earning today.",
  },
};

/* -------------------------------------------------------------------------- */
/*  Web landing page (cashgpt.in "/")                                          */
/* -------------------------------------------------------------------------- */

export const LANDING_TITLE = "CashGPT — Earn Real Money Online With Free Tasks & Offers";
export const LANDING_DESCRIPTION =
  "Earn real cash online with CashGPT. Complete free offers, surveys, games and app installs, then withdraw to PayPal, UPI, crypto or gift cards from just $1. Free to join.";

/**
 * How it works on the web, where the first step is signing up rather than
 * installing. The app page keeps its own download-first wording in HOW_IT_WORKS.
 */
export const WEB_HOW_IT_WORKS: HowItWorksStep[] = [
  {
    number: "1",
    title: "Sign up",
    description:
      "Create a free account with your email in under a minute. No fees and no card details, ever.",
  },
  {
    number: "2",
    title: "Complete tasks",
    description:
      "Pick from offers, surveys, games, app installs and more. Every completed task credits your wallet.",
  },
  {
    number: "3",
    title: "Withdraw to your wallet",
    description:
      "Cash out to PayPal, UPI, crypto or gift cards once you reach the $1 minimum. Your balance, your choice.",
  },
];

export type FaqItem = {
  question: string;
  answer: string;
};

/** Short FAQ covering the questions that actually block signups. */
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How do I get paid?",
    answer:
      "You choose. CashGPT pays out to PayPal, UPI, crypto (USDT or Litecoin) and gift cards. Your balance is held in your in-app wallet until you request a withdrawal.",
  },
  {
    question: "How long does a withdrawal take?",
    answer:
      "Most payouts are processed within 24 hours of your request. Some methods clear sooner; larger amounts can take a little longer if they need a manual review.",
  },
  {
    question: "Is CashGPT free to use?",
    answer:
      "Yes. Creating an account and completing tasks is completely free, and we never take a cut of what you earn. You only ever need to cover the payment provider's own fees, if any apply to your chosen method.",
  },
  {
    question: "Is it safe to use?",
    answer:
      "We never ask for your bank login or card details, and you only share what a given offer needs. Accounts are secured through Supabase authentication, and you can read exactly how your data is handled in our privacy policy.",
  },
  {
    question: "What is the minimum payout?",
    answer:
      "$1. We keep the threshold deliberately low so you can test a real withdrawal early instead of grinding towards a large minimum.",
  },
];
