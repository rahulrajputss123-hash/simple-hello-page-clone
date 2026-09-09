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
  { id: "nova", name: "Fox", shortName: "FX", symbol: "🦊", tone: "from-[#8de8c4] to-[#47b98e]", imageUrl: "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/944c37567aeea379108d7c6fb10f2c83460b177efedc0481eb5720c976450eea.jpeg" },
  { id: "atlas", name: "Panda", shortName: "PA", symbol: "🐼", tone: "from-[#ffd6be] to-[#f39f72]", imageUrl: "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/a4b3444acdcd07fbee55aae208c65c7685afc43e0d5da4d9c200e35eb4ac0a8e.jpeg" },
  { id: "luna", name: "Robot", shortName: "RO", symbol: "🤖", tone: "from-[#d9ccff] to-[#9f83df]", imageUrl: "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/d0264866bd68cc4659e63d65500b6a8c7324990934fa555bedda5f142ab0a73d.jpeg" },
  { id: "orbit", name: "Frog", shortName: "FR", symbol: "🐸", tone: "from-[#bfe7ff] to-[#6db7e4]", imageUrl: "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/d76742a69b856996fa75f1fff206a078278f60b0d343b17395ba5c2670f351e8.jpeg" },
  { id: "sage", name: "Cat", shortName: "CA", symbol: "🐱", tone: "from-[#f3bdc8] to-[#d67b92]", imageUrl: "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/323ca8f9fe262cf3fee65ecebecb632f8b11eaecb44225ec39a3642e769b3684.jpeg" },
  { id: "ember", name: "Owl", shortName: "OW", symbol: "🦉", tone: "from-[#b8eed7] to-[#6bc39d]", imageUrl: "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/78b724c548930c78c9d21a0c93a4ac00eea14a6ad4eea00ddc54fd3a7873d759.jpeg" },
  { id: "halo", name: "Lion", shortName: "LI", symbol: "🦁", tone: "from-[#ffdb83] to-[#e7a52e]", imageUrl: "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/d6d89221ad7bf9594c1474759ab123aa6f110072f737708b1e9abc6699416488.jpeg" },
  { id: "zenith", name: "Astronaut", shortName: "AS", symbol: "🚀", tone: "from-[#b9dcff] to-[#6fa4d5]", imageUrl: "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/d59dfb96ce198b5fce46027799a5c98bf70d6077faa535b3ec40e361c4023659.jpeg" },
  { id: "rio", name: "Bunny", shortName: "BU", symbol: "🐰", tone: "from-[#d9c6f5] to-[#aa86d8]", imageUrl: "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/a0c63f91e8607d54e1e479f0279d3456b2cc1f9eb3021fd291a1beb3e426b566.jpeg" },
];

export const ONBOARDING_ARTWORK: Record<string, string> = {
  welcome: "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/3b3357ff30b9994fcb2b932187704e97212b6436b43b71f272e289f8ab54dbef.jpeg",
  features_offers: "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/8cb5716e3bc5550a4198fd21b7ca7911a8f49f10846ac972f50e98428fdb7876.jpeg",
  quest: "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/4eb18eae0bfd34070ecebffa2cfb8cc7849768f0f68d94139e4490094a2a4212.jpeg",
  watch_earn: "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/096e79a603f8b428971cc798c9ff4048d2ca743ba87c785647511eb4c480e497.jpeg",
  offerwall: "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/0cb23a00dd5dde5d4d05045b12a660a0e5a6ded3ab53f58eafac7d4d444dfa7e.jpeg",
  refer_earn: "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/453964c7d40a6c9199480d0829e3a9c0a778a52c85fe4ab988bb81b723e1f4e0.jpeg",
  youre_ready: "https://static.prod-images.emergentagent.com/jobs/da400b88-d0e2-43e8-b289-cca9ab2cc76c/images/cea1dbfc90024f31ab6ff5adc1243e78fecc2b3bb2162ef81732b1aeb1917bec.jpeg",
};

export const DEFAULT_PREMIUM_STEPS: PremiumOnboardingStep[] = [
  {
    id: "premium-welcome",
    step_key: "welcome",
    title: "Welcome to CashGPT",
    subtitle: "4 ways to earn. One app.",
    description: "Meet your new earning suite for quests, offers, videos, and referral rewards — all in one calm, guided start.",
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
    description: "Pick a fixed CashGPT persona to represent you across your profile and rewards journey.",
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
    description: "Explore tasks, app installs, surveys, and deals. This quick look is educational — live offers stay in the main app.",
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
    description: "Daily quests turn small actions into satisfying progress, with lockers, shortlinks, and special challenges.",
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
    description: "Short videos and clear goals make it easy to build a rhythm. Real earning sessions begin from Home.",
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
    description: "Browse app, survey, game, and partner opportunities when you are ready to go deeper.",
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
    description: "Share your referral link, help a friend get started, and earn referral rewards from their activity.",
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