import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronLeft,
  ClipboardList,
  Coins,
  Gift,
  Layers3,
  Link2,
  LockKeyhole,
  Play,
  Rocket,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Trophy,
  UserRound,
  Users,
  Video,
  WalletCards,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { BrandMark } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/coinquest";
import {
  AVATAR_OPTIONS,
  DEFAULT_PREMIUM_STEPS,
  PREMIUM_FEATURE_KEYS,
  avatarById,
  type PremiumOnboardingStep,
} from "@/lib/onboarding/premium";
import {
  completePremiumOnboarding,
  listPremiumOnboardingSteps,
} from "@/lib/onboarding/functions";

const FEATURE_NUMBER: Record<string, number> = {
  features_offers: 1,
  quest: 2,
  watch_earn: 3,
  offerwall: 4,
  refer_earn: 5,
};

type ProfileDraft = {
  name: string;
  avatarId: string;
  gender: "female" | "male" | "non_binary" | "prefer_not_to_say" | "";
  dateOfBirth: string;
};

export function PremiumOnboarding() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchSteps = useServerFn(listPremiumOnboardingSteps);
  const finish = useServerFn(completePremiumOnboarding);
  const preview = typeof window !== "undefined" && window.location.search.includes("preview=1");
  const [index, setIndex] = useState(0);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>({
    name: profile?.name ?? "",
    avatarId: profile?.avatar_url ?? "nova",
    gender: ((profile as { gender?: ProfileDraft["gender"] } | null)?.gender ?? "") as ProfileDraft["gender"],
    dateOfBirth: (profile as { date_of_birth?: string | null } | null)?.date_of_birth ?? "",
  });

  const stepsQuery = useQuery({
    queryKey: ["premium-onboarding-steps"],
    queryFn: () => fetchSteps({}),
    staleTime: 5 * 60_000,
  });
  const steps = useMemo(
    () => (stepsQuery.data?.length ? stepsQuery.data : DEFAULT_PREMIUM_STEPS).filter((step) => step.enabled),
    [stepsQuery.data],
  );
  const current = steps[Math.min(index, Math.max(steps.length - 1, 0))] ?? DEFAULT_PREMIUM_STEPS[0]!;

  useEffect(() => {
    setProfileDraft((previous) => ({
      ...previous,
      name: previous.name || profile?.name || "",
      avatarId: profile?.avatar_url || previous.avatarId,
      gender:
        previous.gender ||
        (((profile as { gender?: ProfileDraft["gender"] } | null)?.gender ?? "") as ProfileDraft["gender"]),
      dateOfBirth:
        previous.dateOfBirth || (profile as { date_of_birth?: string | null } | null)?.date_of_birth || "",
    }));
  }, [profile]);

  useEffect(() => {
    if (profile?.onboarded && !preview) void navigate({ to: "/home", replace: true });
  }, [profile?.onboarded, preview, navigate]);

  const complete = useMutation({
    mutationFn: () =>
      finish({
        data: {
          name: profileDraft.name.trim(),
          avatarId: profileDraft.avatarId,
          ...(profileDraft.gender ? { gender: profileDraft.gender } : {}),
          ...(profileDraft.dateOfBirth ? { dateOfBirth: profileDraft.dateOfBirth } : {}),
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Your CashGPT profile is ready.");
      if (!preview) void navigate({ to: "/home", replace: true });
    },
    onError: () => toast.error("Could not save your profile. Please try again."),
  });

  const isProfile = current.step_key === "profile";
  const isAvatar = current.step_key === "choose_avatar";
  const isReady = current.step_key === "youre_ready";
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  const next = () => {
    if (isProfile && profileDraft.name.trim().length < 2) {
      toast.error("Please add your display name first.");
      return;
    }
    if (isAvatar && !profileDraft.avatarId) {
      toast.error("Choose an avatar to continue.");
      return;
    }
    if (isLast) {
      if (preview) {
        toast.success("Preview complete — no profile changes were saved.");
        setIndex(0);
      } else {
        complete.mutate();
      }
      return;
    }
    setIndex((value) => Math.min(value + 1, steps.length - 1));
  };

  return (
    <main className="premium-shell min-h-screen overflow-hidden px-4 py-4 sm:py-8" data-testid="premium-onboarding-page">
      <div className="premium-frame relative mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-[#d4af37]/35 bg-[#faf8f5] shadow-2xl sm:min-h-[780px]">
        <div className="premium-orb premium-orb-one" aria-hidden />
        <div className="premium-orb premium-orb-two" aria-hidden />
        <header className="relative z-10 flex items-center justify-between px-5 pb-3 pt-5">
          <div className="flex items-center gap-2.5">
            <BrandMark className="size-9 rounded-xl" />
            <div>
              <p className="font-display text-sm leading-none text-[#0b2b28]">CashGPT</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b827c]">
                Concierge setup
              </p>
            </div>
          </div>
          <span className="rounded-full border border-[#d4af37]/35 bg-white/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a6b1f]">
            {String(index + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
          </span>
        </header>

        <div className="relative z-10 flex gap-1.5 px-5" data-testid="premium-onboarding-stepper">
          {steps.map((step, stepIndex) => (
            <span
              key={step.id}
              className={`h-1.5 flex-1 rounded-full transition-[background-color,box-shadow] duration-300 ${
                stepIndex <= index ? "bg-[#d4af37] shadow-[0_0_12px_rgba(212,175,55,0.55)]" : "bg-[#d8e1dc]"
              }`}
              data-testid={`premium-step-indicator-${stepIndex + 1}`}
            />
          ))}
        </div>

        <div className="relative z-10 flex-1 px-5 pb-5 pt-7">
          {PREMIUM_FEATURE_KEYS.includes(current.step_key as (typeof PREMIUM_FEATURE_KEYS)[number]) && (
            <div className="mb-5 flex items-center justify-between" data-testid="premium-feature-progress">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#8a6b1f]">
                Feature path
              </span>
              <span className="rounded-full bg-[#0b2b28] px-3 py-1 text-xs font-bold text-[#f3d068]">
                {FEATURE_NUMBER[current.step_key]}/5
              </span>
            </div>
          )}

          <div key={current.id} className="premium-step-in">
            <StepArtwork step={current} />
            <div className="mt-6">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#98751f]">
                {current.step_key === "youre_ready" ? "Milestone complete" : current.step_type === "showcase" ? "Static guide" : "CashGPT premium onboarding"}
              </p>
              <h1 className="mt-2 text-3xl font-extrabold leading-[1.05] tracking-[-0.04em] text-[#0b2b28]" data-testid="premium-step-title">
                {current.title}
              </h1>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-[#41615b]" data-testid="premium-step-subtitle">
                {current.subtitle}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#6a7d77]" data-testid="premium-step-description">
                {current.description}
              </p>
            </div>

            {isAvatar && (
              <div className="mt-5 grid grid-cols-3 gap-2.5" data-testid="premium-avatar-grid">
                {AVATAR_OPTIONS.map((avatar) => {
                  const selected = profileDraft.avatarId === avatar.id;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setProfileDraft((previous) => ({ ...previous, avatarId: avatar.id }))}
                      className={`premium-avatar-card relative flex flex-col items-center gap-2 rounded-2xl border p-2.5 text-center ${selected ? "premium-avatar-selected" : "border-[#d7e1dc] bg-white/75"}`}
                      data-testid={`premium-avatar-${avatar.id}`}
                      aria-pressed={selected}
                    >
                      <span className={`grid size-14 place-items-center rounded-[1.15rem] bg-gradient-to-br ${avatar.tone} text-2xl text-white shadow-lg`}>
                        {avatar.symbol}
                      </span>
                      <span className="text-[11px] font-extrabold text-[#274943]">{avatar.name}</span>
                      {selected && <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-[#d4af37] text-[#0b2b28]"><Check className="size-3.5" strokeWidth={3} /></span>}
                    </button>
                  );
                })}
              </div>
            )}

            {isProfile && (
              <div className="mt-5 space-y-3 rounded-3xl bg-[#0b2b28] p-4 text-white shadow-[0_18px_38px_rgba(11,43,40,0.22)]" data-testid="premium-profile-form">
                <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                  <span className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br ${avatarById(profileDraft.avatarId).tone} text-xl text-white`}>
                    {avatarById(profileDraft.avatarId).symbol}
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f3d068]">Your persona</p>
                    <p className="mt-1 text-sm font-bold">{avatarById(profileDraft.avatarId).name}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="premium-display-name" className="text-xs text-[#b8d0ca]">Display name</Label>
                  <Input id="premium-display-name" value={profileDraft.name} maxLength={80} onChange={(event) => setProfileDraft((previous) => ({ ...previous, name: event.target.value }))} placeholder="Your name" className="border-white/15 bg-white/10 text-white placeholder:text-white/40" data-testid="premium-profile-name-input" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="premium-gender" className="text-xs text-[#b8d0ca]">Gender</Label>
                    <select id="premium-gender" value={profileDraft.gender} onChange={(event) => setProfileDraft((previous) => ({ ...previous, gender: event.target.value as ProfileDraft["gender"] }))} className="h-10 w-full rounded-xl border border-white/15 bg-white/10 px-3 text-xs text-white" data-testid="premium-profile-gender-input">
                      <option value="" className="text-[#0b2b28]">Prefer not to say</option>
                      <option value="female" className="text-[#0b2b28]">Female</option>
                      <option value="male" className="text-[#0b2b28]">Male</option>
                      <option value="non_binary" className="text-[#0b2b28]">Non-binary</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="premium-dob" className="text-xs text-[#b8d0ca]">Date of birth</Label>
                    <Input id="premium-dob" type="date" value={profileDraft.dateOfBirth} onChange={(event) => setProfileDraft((previous) => ({ ...previous, dateOfBirth: event.target.value }))} className="border-white/15 bg-white/10 text-white [color-scheme:dark]" data-testid="premium-profile-dob-input" />
                  </div>
                </div>
              </div>
            )}

            {current.step_type === "showcase" && <ShowcaseContent stepKey={current.step_key} />}

            {isReady && (
              <div className="mt-6 rounded-3xl bg-[#0b2b28] p-5 text-white shadow-[0_20px_45px_rgba(11,43,40,0.25)]" data-testid="premium-ready-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#b9d2cb]">Current wallet balance</p>
                    <p className="mt-1 font-display text-3xl text-[#f3d068]" data-testid="premium-wallet-balance">{formatMoney(profile?.wallet_balance ?? 0)}</p>
                  </div>
                  <span className="grid size-14 place-items-center rounded-2xl bg-[#d4af37] text-[#0b2b28] shadow-[0_0_24px_rgba(212,175,55,0.35)]"><WalletCards className="size-7" /></span>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-[#b9d2cb]">
                  <span className="rounded-xl bg-white/10 px-2 py-2">Profile set</span>
                  <span className="rounded-xl bg-white/10 px-2 py-2">Path unlocked</span>
                  <span className="rounded-xl bg-white/10 px-2 py-2">Ready to earn</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="relative z-10 border-t border-[#d9e1dd] bg-white/55 px-5 pb-5 pt-4 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="ghost" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={isFirst} className="gap-1 text-[#56736c]" data-testid="premium-back-button">
              <ChevronLeft className="size-4" /> Back
            </Button>
            <Button type="button" onClick={next} disabled={complete.isPending} className="premium-cta min-w-[170px] gap-2 rounded-2xl border-0 bg-[#d4af37] px-5 py-6 font-extrabold text-[#0b2b28] shadow-[0_12px_25px_rgba(212,175,55,0.28)] hover:bg-[#e4c45e]" data-testid={`premium-cta-${current.step_key}`}>
              {complete.isPending ? "Saving…" : current.cta_text}
              {!isReady && <ArrowRight className="size-4" />}
            </Button>
          </div>
          {preview && <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#98751f]">Preview mode · changes are not saved</p>}
        </footer>
      </div>
    </main>
  );
}

function StepArtwork({ step }: { step: PremiumOnboardingStep }) {
  if (step.step_key === "choose_avatar") {
    return <div className="premium-artwork premium-avatar-artwork" aria-hidden><div className="premium-art-orbit premium-art-orbit-a" /><div className="premium-art-orbit premium-art-orbit-b" /><span className="grid size-24 place-items-center rounded-[2rem] bg-[#0b2b28] text-5xl text-[#f3d068] shadow-[0_0_34px_rgba(212,175,55,0.3)]">✦</span></div>;
  }
  const icon = step.step_key === "youre_ready" ? <Trophy /> : step.step_type === "welcome" ? <Sparkles /> : step.step_key === "profile" ? <UserRound /> : <Rocket />;
  return <div className={`premium-artwork ${step.step_key === "youre_ready" ? "premium-artwork-ready" : ""}`} aria-hidden><span className="premium-artwork-ring" /><span className="premium-artwork-icon">{icon}</span><span className="premium-artwork-coin premium-artwork-coin-a"><Coins /></span><span className="premium-artwork-coin premium-artwork-coin-b"><Sparkles /></span></div>;
}

function ShowcaseContent({ stepKey }: { stepKey: string }) {
  const cards: Record<string, { icon: React.ReactNode; label: string; note: string }[]> = {
    features_offers: [
      { icon: <ClipboardList />, label: "Tasks", note: "Simple actions" },
      { icon: <Smartphone />, label: "App install", note: "Try new apps" },
      { icon: <BarChart3 />, label: "Surveys", note: "Share your view" },
      { icon: <Gift />, label: "Deals", note: "Partner rewards" },
    ],
    quest: [
      { icon: <LockKeyhole />, label: "Locker", note: "Unlock a path" },
      { icon: <Link2 />, label: "Shortlink", note: "Complete steps" },
      { icon: <Trophy />, label: "Special quest", note: "Chase milestones" },
    ],
    watch_earn: [
      { icon: <Video />, label: "Watch", note: "Short partner videos" },
      { icon: <Play />, label: "Track goals", note: "See your progress" },
      { icon: <Zap />, label: "Build rhythm", note: "Small wins add up" },
    ],
    offerwall: [
      { icon: <Smartphone />, label: "Apps", note: "Discover partners" },
      { icon: <BarChart3 />, label: "Surveys", note: "Share feedback" },
      { icon: <Layers3 />, label: "Games", note: "Play & progress" },
    ],
    refer_earn: [
      { icon: <Users />, label: "Invite friend", note: "Share your link" },
      { icon: <ShieldCheck />, label: "Friend joins", note: "They get started" },
      { icon: <Coins />, label: "You earn", note: "Rewards follow activity" },
    ],
  };
  const items = cards[stepKey] ?? [];
  return <div className="mt-5 grid grid-cols-3 gap-2.5" data-testid={`premium-showcase-${stepKey}`}>
    {items.map((item) => <div key={item.label} className="rounded-2xl border border-[#dce5df] bg-white/80 p-3 shadow-[0_8px_20px_rgba(11,43,40,0.05)]"><span className="grid size-9 place-items-center rounded-xl bg-[#0b2b28] text-[#f3d068]">{item.icon}</span><p className="mt-3 text-xs font-extrabold text-[#244740]">{item.label}</p><p className="mt-1 text-[10px] leading-snug text-[#78908a]">{item.note}</p></div>)}
    {stepKey === "refer_earn" && <div className="col-span-3 flex items-center justify-between rounded-2xl bg-[#0b2b28] px-4 py-3 text-[10px] font-bold text-[#c4d8d2]"><span>Invite</span><ArrowRight className="size-3.5 text-[#f3d068]" /><span>They earn</span><ArrowRight className="size-3.5 text-[#f3d068]" /><span>You earn</span></div>}
  </div>;
}