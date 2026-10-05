/**
 * Sample data for the Microtasks / Advertiser marketplace preview.
 *
 * Everything in this file is hardcoded dummy data. There are no tables, queries
 * or server functions behind it — this pass is UI only.
 */

export type Verification = "auto" | "proof";

export type Campaign = {
  id: string;
  title: string;
  description: string;
  about: string;
  reward: number;
  verification: Verification;
  country: string;
  countryFlag: string;
  device: string;
  slotsLeft: number | null;
  slotsTotal: number | null;
  steps: string[];
  rules: string[];
  proofRequirements?: string[];
  estimatedTime: string;
};

export const VERIFICATION_LABEL: Record<Verification, string> = {
  auto: "Auto Verified",
  proof: "Proof Required",
};

export const CAMPAIGNS: Campaign[] = [
  {
    id: "coin-rush-install",
    title: "Install & open Coin Rush",
    description: "Download the game and reach level 3.",
    about:
      "Coin Rush is a casual match-3 game. Install it from the official store link, open it, and play until you clear level 3. Your reward is credited automatically once the game confirms you reached level 3.",
    reward: 0.45,
    verification: "auto",
    country: "United States",
    countryFlag: "🇺🇸",
    device: "Android",
    slotsLeft: 118,
    slotsTotal: 500,
    estimatedTime: "~6 min",
    steps: [
      "Tap Start Task to open the store page.",
      "Install Coin Rush and open it.",
      "Play through the tutorial and clear level 3.",
      "Come back to CashGPT — your reward lands within a few minutes.",
    ],
    rules: [
      "New installs only — reinstalls on the same device won't count.",
      "Keep the app installed for at least 24 hours.",
      "One reward per CashGPT account.",
    ],
  },
  {
    id: "travelpay-signup",
    title: "Sign up for TravelPay wallet",
    description: "Create a free account and verify your email.",
    about:
      "TravelPay is a travel-focused digital wallet. Create an account with a real email address, confirm it, and take a screenshot of the welcome screen that shows your account was created.",
    reward: 1.2,
    verification: "proof",
    country: "United States, Canada",
    countryFlag: "🇺🇸",
    device: "Any device",
    slotsLeft: 42,
    slotsTotal: 150,
    estimatedTime: "~5 min",
    steps: [
      "Tap Start & Complete to open TravelPay.",
      "Sign up with your email and set a password.",
      "Confirm the verification email.",
      "Screenshot the welcome screen showing your name or email.",
      "Upload the screenshot here and submit.",
    ],
    rules: [
      "Use a real, active email address.",
      "Proof is reviewed within 48 hours.",
      "Duplicate or edited screenshots are rejected.",
    ],
    proofRequirements: [
      "Screenshot required — full screen, not cropped.",
      "No edited or annotated screenshots.",
      "One submission per user.",
    ],
  },
  {
    id: "demo-clips",
    title: "Watch 3 product demo clips",
    description: "Watch three short clips to the end.",
    about:
      "Watch three 30-second product demos from our partner. Each clip must play to the end with sound on. Completion is detected automatically — no screenshots needed.",
    reward: 0.3,
    verification: "auto",
    country: "Worldwide",
    countryFlag: "🌍",
    device: "Any device",
    slotsLeft: null,
    slotsTotal: null,
    estimatedTime: "~2 min",
    steps: [
      "Tap Start Task to open the player.",
      "Watch all three clips without skipping.",
      "Your reward is credited when the last clip finishes.",
    ],
    rules: ["Clips must play in the foreground.", "One completion per account per day."],
  },
  {
    id: "instagram-follow",
    title: "Follow & screenshot our Instagram",
    description: "Follow @cashgpt.official and send proof.",
    about:
      "Follow the official CashGPT Instagram account and take a screenshot showing the Following button. This helps us grow the community — thank you!",
    reward: 0.6,
    verification: "proof",
    country: "India",
    countryFlag: "🇮🇳",
    device: "Mobile",
    slotsLeft: 9,
    slotsTotal: 200,
    estimatedTime: "~1 min",
    steps: [
      "Tap Start & Complete to open Instagram.",
      "Follow @cashgpt.official.",
      "Screenshot the profile showing 'Following'.",
      "Upload the screenshot here and submit.",
    ],
    rules: [
      "Account must be older than 30 days.",
      "Unfollowing before approval voids the reward.",
    ],
    proofRequirements: [
      "Screenshot required showing the 'Following' state.",
      "No edited screenshots.",
      "One submission per user.",
    ],
  },
];

export function campaignById(id: string): Campaign | undefined {
  return CAMPAIGNS.find((c) => c.id === id);
}

/* ---------------------------------------------------------------- submissions */

export type SubmissionStatus = "pending" | "approved" | "rejected";

export type Submission = {
  id: string;
  campaignId: string;
  submittedAt: string;
  status: SubmissionStatus;
  rejectionReason?: string;
  reward: number;
};

export const MY_SUBMISSIONS: Submission[] = [
  {
    id: "sub-1",
    campaignId: "travelpay-signup",
    submittedAt: "2026-10-03T14:20:00Z",
    status: "pending",
    reward: 1.2,
  },
  {
    id: "sub-2",
    campaignId: "instagram-follow",
    submittedAt: "2026-10-01T09:05:00Z",
    status: "rejected",
    rejectionReason:
      "Screenshot was cropped and doesn't show the 'Following' button. Please upload the full profile screen.",
    reward: 0.6,
  },
  {
    id: "sub-3",
    campaignId: "coin-rush-install",
    submittedAt: "2026-09-28T18:40:00Z",
    status: "approved",
    reward: 0.45,
  },
];

/* ------------------------------------------------------------- advertiser side */

export const ADVERTISER = {
  campaignBalance: 240.0,
  totalSpent: 1185.5,
  stats: {
    activeCampaigns: 3,
    completedConversions: 412,
    pendingReviews: 7,
  },
};

export type CampaignStatus = "active" | "paused" | "draft" | "completed";

export type MyCampaign = {
  id: string;
  title: string;
  status: CampaignStatus;
  verification: Verification;
  reward: number;
  budget: number;
  spent: number;
  country: string;
  results: {
    clicks: number;
    started: number;
    completed: number;
    approved: number;
    rejected: number;
    pending: number;
  };
};

export const MY_CAMPAIGNS: MyCampaign[] = [
  {
    id: "mc-1",
    title: "Install & open Coin Rush",
    status: "active",
    verification: "auto",
    reward: 0.45,
    budget: 225,
    spent: 171.9,
    country: "🇺🇸 US",
    results: { clicks: 2140, started: 611, completed: 382, approved: 382, rejected: 0, pending: 0 },
  },
  {
    id: "mc-2",
    title: "TravelPay wallet signup",
    status: "active",
    verification: "proof",
    reward: 1.2,
    budget: 180,
    spent: 129.6,
    country: "🇺🇸 US · 🇨🇦 CA",
    results: { clicks: 980, started: 240, completed: 131, approved: 108, rejected: 16, pending: 7 },
  },
  {
    id: "mc-3",
    title: "Follow @cashgpt.official",
    status: "active",
    verification: "proof",
    reward: 0.6,
    budget: 120,
    spent: 114.6,
    country: "🇮🇳 IN",
    results: { clicks: 1322, started: 402, completed: 198, approved: 191, rejected: 7, pending: 0 },
  },
  {
    id: "mc-4",
    title: "Summer survey — 10 questions",
    status: "paused",
    verification: "auto",
    reward: 0.35,
    budget: 70,
    spent: 24.5,
    country: "🌍 Worldwide",
    results: { clicks: 540, started: 120, completed: 70, approved: 70, rejected: 0, pending: 0 },
  },
  {
    id: "mc-5",
    title: "Rate us on the Play Store",
    status: "paused",
    verification: "proof",
    reward: 0.5,
    budget: 100,
    spent: 41,
    country: "🇧🇷 BR",
    results: { clicks: 310, started: 110, completed: 86, approved: 82, rejected: 4, pending: 0 },
  },
  {
    id: "mc-6",
    title: "Try the new checkout flow",
    status: "draft",
    verification: "auto",
    reward: 0.8,
    budget: 400,
    spent: 0,
    country: "🇺🇸 US",
    results: { clicks: 0, started: 0, completed: 0, approved: 0, rejected: 0, pending: 0 },
  },
  {
    id: "mc-7",
    title: "Newsletter signup",
    status: "draft",
    verification: "proof",
    reward: 0.25,
    budget: 50,
    spent: 0,
    country: "🇬🇧 UK",
    results: { clicks: 0, started: 0, completed: 0, approved: 0, rejected: 0, pending: 0 },
  },
  {
    id: "mc-8",
    title: "Spring app install push",
    status: "completed",
    verification: "auto",
    reward: 0.4,
    budget: 200,
    spent: 200,
    country: "🇺🇸 US",
    results: { clicks: 3100, started: 920, completed: 500, approved: 500, rejected: 0, pending: 0 },
  },
  {
    id: "mc-9",
    title: "Beta feedback form",
    status: "completed",
    verification: "proof",
    reward: 1.0,
    budget: 150,
    spent: 150,
    country: "🇩🇪 DE",
    results: { clicks: 760, started: 210, completed: 162, approved: 150, rejected: 12, pending: 0 },
  },
];

export function myCampaignById(id: string): MyCampaign | undefined {
  return MY_CAMPAIGNS.find((c) => c.id === id);
}

export type AdvertiserTransaction = {
  id: string;
  type: "Campaign Deposit" | "Campaign Spend" | "Conversion Charge" | "Advertiser Referral Bonus";
  date: string;
  amount: number;
  campaign: string | null;
  status: "completed" | "pending";
};

export const ADVERTISER_TRANSACTIONS: AdvertiserTransaction[] = [
  { id: "tx-1", type: "Campaign Deposit", date: "2026-10-03T10:12:00Z", amount: 200, campaign: null, status: "completed" },
  { id: "tx-2", type: "Conversion Charge", date: "2026-10-03T09:48:00Z", amount: -1.2, campaign: "TravelPay wallet signup", status: "completed" },
  { id: "tx-3", type: "Campaign Spend", date: "2026-10-02T21:30:00Z", amount: -18.45, campaign: "Install & open Coin Rush", status: "completed" },
  { id: "tx-4", type: "Advertiser Referral Bonus", date: "2026-10-01T16:05:00Z", amount: 5, campaign: null, status: "pending" },
  { id: "tx-5", type: "Conversion Charge", date: "2026-09-30T12:14:00Z", amount: -0.6, campaign: "Follow @cashgpt.official", status: "completed" },
  { id: "tx-6", type: "Campaign Deposit", date: "2026-09-25T08:00:00Z", amount: 150, campaign: null, status: "completed" },
];

export const ADVERTISER_REFERRAL = {
  referredAdvertisers: 4,
  qualifyingActivations: 2,
  rewardsEarned: 10,
  rewardPerActivation: 5,
};

/* --------------------------------------------------------------------- admin */

export type PendingCampaign = {
  id: string;
  title: string;
  advertiser: string;
  reward: number;
  budget: number;
  verification: Verification;
  country: string;
  submittedAt: string;
};

export const ADMIN_PENDING_CAMPAIGNS: PendingCampaign[] = [
  { id: "pc-1", title: "Install FitTrack & log a workout", advertiser: "FitTrack Labs", reward: 0.55, budget: 275, verification: "auto", country: "🇺🇸 US", submittedAt: "2026-10-04T07:30:00Z" },
  { id: "pc-2", title: "Join our Telegram community", advertiser: "NovaCoin", reward: 0.2, budget: 60, verification: "proof", country: "🌍 Worldwide", submittedAt: "2026-10-03T22:10:00Z" },
  { id: "pc-3", title: "Complete a 2-min shopping survey", advertiser: "ShopSense", reward: 0.4, budget: 120, verification: "auto", country: "🇬🇧 UK · 🇮🇪 IE", submittedAt: "2026-10-03T15:45:00Z" },
];

export type PendingProof = {
  id: string;
  campaign: string;
  publisher: string;
  submittedAt: string;
  notes: string | null;
};

export const ADMIN_PENDING_PROOFS: PendingProof[] = [
  { id: "pp-1", campaign: "TravelPay wallet signup", publisher: "aarav.k", submittedAt: "2026-10-04T05:20:00Z", notes: "Signed up with my gmail, welcome screen attached." },
  { id: "pp-2", campaign: "Follow @cashgpt.official", publisher: "mia_rose", submittedAt: "2026-10-03T19:02:00Z", notes: null },
  { id: "pp-3", campaign: "Rate us on the Play Store", publisher: "carlos.m", submittedAt: "2026-10-03T11:40:00Z", notes: "5 stars left, screenshot shows my review." },
];

export type AdminAdvertiser = {
  id: string;
  name: string;
  email: string;
  balance: number;
  campaigns: number;
  approved: boolean;
};

export const ADMIN_ADVERTISERS: AdminAdvertiser[] = [
  { id: "adv-1", name: "FitTrack Labs", email: "ads@fittrack.app", balance: 240, campaigns: 3, approved: true },
  { id: "adv-2", name: "NovaCoin", email: "growth@novacoin.io", balance: 85.5, campaigns: 1, approved: true },
  { id: "adv-3", name: "ShopSense", email: "marketing@shopsense.co", balance: 0, campaigns: 1, approved: false },
];