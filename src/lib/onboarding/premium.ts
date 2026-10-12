export type PremiumStepType = "welcome" | "avatar" | "profile" | "showcase" | "celebration";

export type PremiumOnboardingStep = {
  id: string;
  step_key: string;
  title: string;
  subtitle: string;
  description: string;
  step_type: PremiumStepType;
  cta_text: string;
  enabled: boolean;
  display_order: number;
  accent_style: "gold" | "jade";
  position: "center" | "bottom";
  illustration: string | null;
  icon: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AvatarOption = {
  id: string;
  name: string;
  shortName: string;
  symbol: string;
  tone: string;
  imageUrl: string;
};

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: "sunny",
    name: "Sunny",
    shortName: "SU",
    symbol: "😎",
    tone: "from-[#f3ead9] to-[#e7d9bd]",
    imageUrl:
      "https://static.prod-images.emergentagent.com/jobs/c6d9e5e1-b9d3-4103-8af7-1f4fa4f53897/images/a87f30d649d4962d13bedd995408f334cb5bfce72833b31b229b7150e2bc75c2.jpeg",
  },
  {
    id: "star",
    name: "Star",
    shortName: "ST",
    symbol: "🧢",
    tone: "from-[#f3ead9] to-[#e7d9bd]",
    imageUrl:
      "https://static.prod-images.emergentagent.com/jobs/c6d9e5e1-b9d3-4103-8af7-1f4fa4f53897/images/86eb504d33769ac6a43997cf9d5a3bc24f2f177b2a8c37d1eae46679b458193b.jpeg",
  },
  {
    id: "shadow",
    name: "Shadow",
    shortName: "SH",
    symbol: "🫥",
    tone: "from-[#f3ead9] to-[#e7d9bd]",
    imageUrl:
      "https://static.prod-images.emergentagent.com/jobs/c6d9e5e1-b9d3-4103-8af7-1f4fa4f53897/images/c410b4cea50088d47dcbcf084770a47d6d860238d489bdbc30aad1115f3b522b.jpeg",
  },
  {
    id: "beat",
    name: "Beat",
    shortName: "BE",
    symbol: "🐯",
    tone: "from-[#f3ead9] to-[#e7d9bd]",
    imageUrl:
      "https://static.prod-images.emergentagent.com/jobs/c6d9e5e1-b9d3-4103-8af7-1f4fa4f53897/images/231f6577abb92a9b039144ec86385b61583dd2e8816fdad4bd712dce3be99cf4.jpeg",
  },
  {
    id: "rusty",
    name: "Rusty",
    shortName: "RU",
    symbol: "🦊",
    tone: "from-[#f3ead9] to-[#e7d9bd]",
    imageUrl:
      "https://static.prod-images.emergentagent.com/jobs/c6d9e5e1-b9d3-4103-8af7-1f4fa4f53897/images/118080fac6a15c9dbd20497943607bfcba8178d06e9bab67aab48b3acfd02402.jpeg",
  },
  {
    id: "chief",
    name: "Chief",
    shortName: "CH",
    symbol: "🐻",
    tone: "from-[#f3ead9] to-[#e7d9bd]",
    imageUrl:
      "https://static.prod-images.emergentagent.com/jobs/c6d9e5e1-b9d3-4103-8af7-1f4fa4f53897/images/d3c8dfcce5cb63af7daccab19bda5e936d086a00f19599d68abfc7c74427400e.jpeg",
  },
  {
    id: "bamboo",
    name: "Bamboo",
    shortName: "BA",
    symbol: "🐼",
    tone: "from-[#f3ead9] to-[#e7d9bd]",
    imageUrl:
      "https://static.prod-images.emergentagent.com/jobs/c6d9e5e1-b9d3-4103-8af7-1f4fa4f53897/images/0f0016d97129112dc59361d5eef05bab9fc5d9708c9ec2fa602f19761ef28eae.jpeg",
  },
  {
    id: "ribbit",
    name: "Ribbit",
    shortName: "RI",
    symbol: "🐸",
    tone: "from-[#f3ead9] to-[#e7d9bd]",
    imageUrl:
      "https://static.prod-images.emergentagent.com/jobs/c6d9e5e1-b9d3-4103-8af7-1f4fa4f53897/images/7ac7627103f02d4a5e32253d0506ab81004e940aa2e3f0c676cc823cad69730a.jpeg",
  },
  {
    id: "byte",
    name: "Byte",
    shortName: "BY",
    symbol: "🤖",
    tone: "from-[#f3ead9] to-[#e7d9bd]",
    imageUrl:
      "https://static.prod-images.emergentagent.com/jobs/c6d9e5e1-b9d3-4103-8af7-1f4fa4f53897/images/69ccb6b1fa7c622eb4e595c9d099a902b4eafe7482af8b386fde3aefc383e12c.jpeg",
  },
  {
    id: "midnight",
    name: "Midnight",
    shortName: "MI",
    symbol: "🐺",
    tone: "from-[#f3ead9] to-[#e7d9bd]",
    imageUrl:
      "https://static.prod-images.emergentagent.com/jobs/c6d9e5e1-b9d3-4103-8af7-1f4fa4f53897/images/47670ade4f9809b30ab8b96ab0b23ad3486efc4be814affb30930d3d6d3d41fa.jpeg",
  },
  {
    id: "denim",
    name: "Denim",
    shortName: "DE",
    symbol: "🐱",
    tone: "from-[#f3ead9] to-[#e7d9bd]",
    imageUrl:
      "https://static.prod-images.emergentagent.com/jobs/c6d9e5e1-b9d3-4103-8af7-1f4fa4f53897/images/c41c99b7df4d8e34b9123cec1eb1f859645324bff8340a985638173941f26fca.jpeg",
  },
  {
    id: "shiba",
    name: "Shiba",
    shortName: "SB",
    symbol: "🐕",
    tone: "from-[#f3ead9] to-[#e7d9bd]",
    imageUrl:
      "https://static.prod-images.emergentagent.com/jobs/c6d9e5e1-b9d3-4103-8af7-1f4fa4f53897/images/6d7565bcab4d8eb0e9bc7b9b8fc0331e181b720d32b36e36db1e2d9b71a04cdf.jpeg",
  },
];

export const ONBOARDING_ARTWORK: Record<string, string> = {
  welcome:
    "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/3b3357ff30b9994fcb2b932187704e97212b6436b43b71f272e289f8ab54dbef.jpeg",
  features_offers:
    "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/8cb5716e3bc5550a4198fd21b7ca7911a8f49f10846ac972f50e98428fdb7876.jpeg",
  quest:
    "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/4eb18eae0bfd34070ecebffa2cfb8cc7849768f0f68d94139e4490094a2a4212.jpeg",
  watch_earn:
    "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/096e79a603f8b428971cc798c9ff4048d2ca743ba87c785647511eb4c480e497.jpeg",
  offerwall:
    "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/0cb23a00dd5dde5d4d05045b12a660a0e5a6ded3ab53f58eafac7d4d444dfa7e.jpeg",
  refer_earn:
    "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/453964c7d40a6c9199480d0829e3a9c0a778a52c85fe4ab988bb81b723e1f4e0.jpeg",
  youre_ready:
    "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/cea1dbfc90024f31ab6ff5adc1243e78fecc2b3bb2162ef81732b1aeb1917bec.jpeg",
};

export const DEFAULT_PREMIUM_STEPS: PremiumOnboardingStep[] = [
  {
    id: "premium-welcome",
    step_key: "welcome",
    title: "Welcome to CashGPT",
    subtitle: "4 ways to earn. One app.",
    description:
      "Meet your new earning suite for quests, offers, videos, and referral rewards — all in one calm, guided start.",
    step_type: "welcome",
    cta_text: "Let's Get Started",
    enabled: true,
    display_order: 1,
    accent_style: "gold",
    position: "center",
    illustration: "spark",
    icon: "sparkles",
  },
  {
    id: "premium-avatar",
    step_key: "choose_avatar",
    title: "Choose your avatar",
    subtitle: "Make your profile feel like yours",
    description:
      "Pick a fixed CashGPT persona to represent you across your profile and rewards journey.",
    step_type: "avatar",
    cta_text: "Next →",
    enabled: true,
    display_order: 2,
    accent_style: "gold",
    position: "bottom",
    illustration: "avatars",
    icon: "user",
  },
  {
    id: "premium-profile",
    step_key: "profile",
    title: "Set up your profile",
    subtitle: "A few details, a more personal experience",
    description: "Your profile stays editable from Settings whenever you need it.",
    step_type: "profile",
    cta_text: "Continue →",
    enabled: true,
    display_order: 3,
    accent_style: "jade",
    position: "bottom",
    illustration: "profile",
    icon: "user-round",
  },
  {
    id: "premium-offers",
    step_key: "features_offers",
    title: "Deal Offers",
    subtitle: "Find special deals and high-paying offers.",
    description:
      "Explore tasks, app installs, surveys, and deals. This quick look is educational — live offers stay in the main app.",
    step_type: "showcase",
    cta_text: "Next →",
    enabled: true,
    display_order: 4,
    accent_style: "gold",
    position: "bottom",
    illustration: "offers",
    icon: "clipboard",
  },
  {
    id: "premium-quest",
    step_key: "quest",
    title: "Quest",
    subtitle: "Unlock more ways to earn",
    description:
      "Daily quests turn small actions into satisfying progress, with lockers, shortlinks, and special challenges.",
    step_type: "showcase",
    cta_text: "Next →",
    enabled: true,
    display_order: 5,
    accent_style: "jade",
    position: "bottom",
    illustration: "quest",
    icon: "lock",
  },
  {
    id: "premium-watch",
    step_key: "watch_earn",
    title: "Watch & Earn",
    subtitle: "Watch available ads and complete earning goals",
    description:
      "Short videos and clear goals make it easy to build a rhythm. Real earning sessions begin from Home.",
    step_type: "showcase",
    cta_text: "Next →",
    enabled: true,
    display_order: 6,
    accent_style: "gold",
    position: "bottom",
    illustration: "watch",
    icon: "play",
  },
  {
    id: "premium-offerwall",
    step_key: "offerwall",
    title: "Offerwall",
    subtitle: "Explore more earning opportunities",
    description:
      "Browse app, survey, game, and partner opportunities when you are ready to go deeper.",
    step_type: "showcase",
    cta_text: "Next →",
    enabled: true,
    display_order: 7,
    accent_style: "jade",
    position: "bottom",
    illustration: "offerwall",
    icon: "layers",
  },
  {
    id: "premium-referrals",
    step_key: "refer_earn",
    title: "Refer & Earn",
    subtitle: "Invite friends and grow together",
    description:
      "Share your referral link, help a friend get started, and earn referral rewards from their activity.",
    step_type: "showcase",
    cta_text: "Finish →",
    enabled: true,
    display_order: 8,
    accent_style: "gold",
    position: "bottom",
    illustration: "referrals",
    icon: "users",
  },
  {
    id: "premium-ready",
    step_key: "youre_ready",
    title: "You're Ready!",
    subtitle: "Your CashGPT journey starts here",
    description: "Now you know how CashGPT works. Start earning whenever you're ready.",
    step_type: "celebration",
    cta_text: "Start Earning →",
    enabled: true,
    display_order: 9,
    accent_style: "gold",
    position: "center",
    illustration: "celebration",
    icon: "party-popper",
  },
];

export const PREMIUM_FEATURE_KEYS = [
  "features_offers",
  "quest",
  "watch_earn",
  "offerwall",
  "refer_earn",
] as const;

export function avatarById(id: string | null | undefined): AvatarOption {
  return AVATAR_OPTIONS.find((avatar) => avatar.id === id) ?? AVATAR_OPTIONS[0]!;
}
