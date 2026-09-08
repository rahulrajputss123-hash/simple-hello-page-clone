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
};

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: "nova", name: "Nova", shortName: "NO", symbol: "✦", tone: "from-[#d8b65a] to-[#8e6a1d]" },
  { id: "atlas", name: "Atlas", shortName: "AT", symbol: "◈", tone: "from-[#6cb8a5] to-[#0b4b43]" },
  { id: "luna", name: "Luna", shortName: "LU", symbol: "☾", tone: "from-[#e6c6a8] to-[#8c5546]" },
  { id: "orbit", name: "Orbit", shortName: "OR", symbol: "◎", tone: "from-[#73b7c6] to-[#1b5365]" },
  { id: "sage", name: "Sage", shortName: "SA", symbol: "✺", tone: "from-[#b5c86c] to-[#3a6a48]" },
  { id: "ember", name: "Ember", shortName: "EM", symbol: "◆", tone: "from-[#ef9a6f] to-[#8a3e31]" },
  { id: "halo", name: "Halo", shortName: "HA", symbol: "●", tone: "from-[#e6e0d0] to-[#8c8a77]" },
  { id: "zenith", name: "Zenith", shortName: "ZE", symbol: "▲", tone: "from-[#b1a1da] to-[#534a91]" },
  { id: "rio", name: "Rio", shortName: "RI", symbol: "⌁", tone: "from-[#e4bb75] to-[#a45e23]" },
];

export const DEFAULT_PREMIUM_STEPS: PremiumOnboardingStep[] = [
  {
    id: "premium-welcome",
    step_key: "welcome",
    title: "Welcome to CashGPT",
    subtitle: "A smarter way to earn on your time",
    description: "Meet your new earning suite for quests, offers, videos, and referral rewards — all in one calm, guided start.",
    step_type: "welcome",
    cta_text: "Let's Get Started →",
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
    title: "Features Offers",
    subtitle: "Find the right way to earn",
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