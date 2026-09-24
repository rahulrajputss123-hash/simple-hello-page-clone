import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Copy,
  Gamepad2,
  Gift,
  Layers3,
  Link2,
  LockKeyhole,
  Play,
  Share2,
  Smartphone,
  Sparkles,
  Star,
  Trophy,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  ONBOARDING_ARTWORK,
  PREMIUM_FEATURE_KEYS,
  avatarById,
} from "@/lib/onboarding/premium";
import { completePremiumOnboarding, listPremiumOnboardingSteps } from "@/lib/onboarding/functions";

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
  const { profile, session } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchSteps = useServerFn(listPremiumOnboardingSteps);
  const finish = useServerFn(completePremiumOnboarding);
  const preview = typeof window !== "undefined" && window.location.search.includes("preview=1");
  const [index, setIndex] = useState(0);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>({
    name: profile?.name ?? "",
    avatarId: profile?.avatar_url ?? "nova",
    gender: ((profile as { gender?: ProfileDraft["gender"] } | null)?.gender ??
      "") as ProfileDraft["gender"],
    dateOfBirth: (profile as { date_of_birth?: string | null } | null)?.date_of_birth ?? "",
  });

  const stepsQuery = useQuery({
    queryKey: ["premium-onboarding-steps"],
    queryFn: () => fetchSteps({}),
    staleTime: 5 * 60_000,
  });
  const steps = useMemo(
    () =>
      (stepsQuery.data?.length ? stepsQuery.data : DEFAULT_PREMIUM_STEPS).filter(
        (step) => step.enabled,
      ),
    [stepsQuery.data],
  );
  const current =
    steps[Math.min(index, Math.max(steps.length - 1, 0))] ?? DEFAULT_PREMIUM_STEPS[0]!;
  const isWelcome = current.step_key === "welcome";
  const isAvatar = current.step_key === "choose_avatar";
  const isProfile = current.step_key === "profile";
  const isReady = current.step_key === "youre_ready";
  const featureNumber = FEATURE_NUMBER[current.step_key];
  const isFeature = typeof featureNumber === "number";
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;
  const referralCode =
    (profile as { referral_code?: string | null } | null)?.referral_code ?? "cashgpt";
  const referralUrl =
    typeof window === "undefined"
      ? `cashgpt.app/r/${referralCode}`
      : `${window.location.origin}/auth?ref=${referralCode}`;

  useEffect(() => {
    setProfileDraft((previous) => ({
      ...previous,
      name: previous.name || profile?.name || "",
      avatarId: profile?.avatar_url || previous.avatarId,
      gender:
        previous.gender ||
        (((profile as { gender?: ProfileDraft["gender"] } | null)?.gender ??
          "") as ProfileDraft["gender"]),
      dateOfBirth:
        previous.dateOfBirth ||
        (profile as { date_of_birth?: string | null } | null)?.date_of_birth ||
        "",
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

  const back = () => setIndex((value) => Math.max(0, value - 1));
  const goHome = () => void navigate({ to: "/home" });
  const copyReferral = async () => {
    await navigator.clipboard.writeText(referralUrl);
    toast.success("Referral link copied.");
  };
  const shareReferral = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Join me on CashGPT",
        text: "Earn rewards with me on CashGPT.",
        url: referralUrl,
      });
      return;
    }
    await copyReferral();
  };

  const dotIndex = isFeature ? featureNumber - 1 : isReady ? 4 : 0;
  const darkHeader = isWelcome || isFeature || isReady || isProfile;

  return (
    <main
      className="premium-shell min-h-screen overflow-hidden bg-[#efeade]"
      data-testid="premium-onboarding-page"
    >
      <div className="premium-frame relative mx-auto flex h-[100dvh] min-h-[700px] w-full max-w-md flex-col overflow-hidden bg-[#faf7ef] shadow-2xl sm:my-5 sm:h-[min(880px,calc(100vh-2.5rem))] sm:min-h-0 sm:rounded-[2rem] sm:border sm:border-[#d4af37]/30">
        <header
          className={`pointer-events-none absolute inset-x-0 top-0 z-30 flex h-16 items-center justify-between px-5 ${darkHeader ? "text-white" : "text-[#0b2b28]"}`}
        >
          {isWelcome ? (
            <div
              className="pointer-events-auto flex items-center gap-2.5"
              data-testid="onboarding-brand-lockup"
            >
              <BrandMark className="size-9 rounded-xl ring-1 ring-white/25" />
              <span className="font-display text-lg">CashGPT</span>
            </div>
          ) : isFeature ? (
            <span className="font-display text-sm" data-testid="premium-feature-counter">
              {featureNumber} / 5
            </span>
          ) : !isReady ? (
            <button
              type="button"
              onClick={back}
              disabled={isFirst}
              className="pointer-events-auto grid size-10 place-items-center rounded-full bg-black/10 backdrop-blur-sm disabled:opacity-0"
              aria-label="Go back"
              data-testid="premium-back-button"
            >
              <ArrowLeft className="size-5" />
            </button>
          ) : (
            <span />
          )}
          {isFeature ? (
            <button
              type="button"
              onClick={next}
              className="pointer-events-auto rounded-full px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white"
              data-testid={`premium-skip-${current.step_key}`}
            >
              Skip
            </button>
          ) : (
            <span />
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto pb-[118px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {isWelcome && (
            <section
              className="min-h-full bg-[radial-gradient(circle_at_50%_22%,#165c50_0%,#0b2b28_48%,#061f1d_100%)] px-5 pb-10 pt-16 text-center text-white"
              data-testid="onboarding-welcome-view"
            >
              <IllustrationPanel
                src={ONBOARDING_ARTWORK["welcome"]!}
                alt="Gift box overflowing with reward coins"
                className="mx-auto h-[48vh] min-h-[330px] max-h-[430px] w-full"
                testId="onboarding-artwork-welcome"
              />
              <ProgressDots current={dotIndex} dark />
              <h1
                className="mt-5 text-4xl font-extrabold leading-none tracking-[-0.04em]"
                data-testid="premium-step-title"
              >
                Welcome to <span className="text-[#f4cf56]">CashGPT</span>
              </h1>
              <p
                className="mt-3 text-lg font-extrabold text-white"
                data-testid="premium-step-subtitle"
              >
                4 ways to earn. One app.
              </p>
              <p
                className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-[#b9d5ce]"
                data-testid="premium-step-description"
              >
                Complete offers, unlock quests, watch ads, and refer friends to earn real rewards.
              </p>
            </section>
          )}

          {isAvatar && (
            <section className="px-5 pb-8 pt-20 text-center" data-testid="onboarding-avatar-view">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#a37d1d]">
                Make it yours
              </p>
              <h1
                className="mt-2 text-3xl font-extrabold tracking-[-0.035em] text-[#0b2b28]"
                data-testid="premium-step-title"
              >
                Choose Your Avatar
              </h1>
              <p className="mt-2 text-sm text-[#667a74]" data-testid="premium-step-subtitle">
                Pick a friendly character for your profile
              </p>
              <div
                className="mt-7 grid grid-cols-3 gap-x-3 gap-y-5"
                data-testid="premium-avatar-grid"
              >
                {AVATAR_OPTIONS.map((avatar) => {
                  const selected = profileDraft.avatarId === avatar.id;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() =>
                        setProfileDraft((previous) => ({ ...previous, avatarId: avatar.id }))
                      }
                      className="group relative flex flex-col items-center gap-1.5"
                      data-testid={`premium-avatar-${avatar.id}`}
                      aria-pressed={selected}
                    >
                      <span
                        className={`relative block aspect-square w-full max-w-[100px] overflow-hidden rounded-full bg-gradient-to-br ${avatar.tone} shadow-[0_10px_22px_rgba(11,43,40,.12)] ring-offset-4 ring-offset-[#faf7ef] transition-[transform,box-shadow] duration-200 group-hover:-translate-y-1 ${selected ? "ring-3 ring-[#18a878] shadow-[0_12px_26px_rgba(24,168,120,.24)]" : "ring-1 ring-[#d8dfd9]"}`}
                      >
                        <img
                          src={avatar.imageUrl}
                          alt={`${avatar.name} avatar`}
                          className="size-full object-cover"
                          decoding="async"
                        />
                        {selected && (
                          <span className="absolute right-0.5 top-0.5 grid size-6 place-items-center rounded-full border-2 border-white bg-[#18a878] text-white">
                            <Check className="size-3.5" strokeWidth={3} />
                          </span>
                        )}
                      </span>
                      <span
                        className={`text-[11px] font-bold ${selected ? "text-[#0b725e]" : "text-[#657a74]"}`}
                      >
                        {avatar.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              <ProgressDots current={dotIndex} />
            </section>
          )}

          {isProfile && (
            <section className="pb-8" data-testid="onboarding-profile-view">
              <div className="relative flex h-[225px] items-end justify-center overflow-hidden rounded-b-[52%_18%] bg-[radial-gradient(circle_at_50%_25%,#176052_0%,#0b2b28_62%,#061f1d_100%)] pb-7">
                <div className="relative">
                  <img
                    src={avatarById(profileDraft.avatarId).imageUrl}
                    alt="Selected profile avatar"
                    className="size-28 rounded-full border-4 border-[#f4cf56] object-cover shadow-[0_18px_38px_rgba(0,0,0,.3)]"
                    data-testid="premium-profile-avatar-preview"
                    decoding="async"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setIndex(
                        Math.max(
                          0,
                          steps.findIndex((step) => step.step_key === "choose_avatar"),
                        ),
                      )
                    }
                    className="absolute bottom-0 right-0 grid size-9 place-items-center rounded-full border-2 border-white bg-[#0f7d68] text-white shadow-lg"
                    aria-label="Edit avatar"
                    data-testid="premium-profile-avatar-edit"
                  >
                    <Camera className="size-4" />
                  </button>
                </div>
              </div>
              <div className="-mt-1 px-5 pt-5 text-center">
                <h1
                  className="text-3xl font-extrabold tracking-[-0.035em] text-[#0b2b28]"
                  data-testid="premium-step-title"
                >
                  Complete Your Profile
                </h1>
                <p className="mt-2 text-sm text-[#667a74]" data-testid="premium-step-subtitle">
                  Help us personalize your experience
                </p>
                <div className="mt-5 space-y-3 text-left" data-testid="premium-profile-form">
                  <ProfileField label="Name">
                    <Input
                      value={profileDraft.name}
                      maxLength={80}
                      onChange={(event) =>
                        setProfileDraft((previous) => ({ ...previous, name: event.target.value }))
                      }
                      placeholder="Your name"
                      className="h-12 rounded-2xl border-[#d8dfd9] bg-white px-4 shadow-none"
                      data-testid="premium-profile-name-input"
                    />
                  </ProfileField>
                  <ProfileField label="Email">
                    <Input
                      value={session?.user.email ?? ""}
                      readOnly
                      className="h-12 rounded-2xl border-[#d8dfd9] bg-[#f2f1eb] px-4 text-[#71817c] shadow-none"
                      data-testid="premium-profile-email-input"
                    />
                  </ProfileField>
                  <ProfileField label="Gender">
                    <select
                      value={profileDraft.gender}
                      onChange={(event) =>
                        setProfileDraft((previous) => ({
                          ...previous,
                          gender: event.target.value as ProfileDraft["gender"],
                        }))
                      }
                      className="h-12 w-full rounded-2xl border border-[#d8dfd9] bg-white px-4 text-sm text-[#274943] outline-none focus:border-[#178c73] focus:ring-2 focus:ring-[#178c73]/15"
                      data-testid="premium-profile-gender-input"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="non_binary">Non-binary</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </ProfileField>
                  <ProfileField label="Date of Birth">
                    <Input
                      type="date"
                      value={profileDraft.dateOfBirth}
                      onChange={(event) =>
                        setProfileDraft((previous) => ({
                          ...previous,
                          dateOfBirth: event.target.value,
                        }))
                      }
                      className="h-12 rounded-2xl border-[#d8dfd9] bg-white px-4 shadow-none"
                      data-testid="premium-profile-dob-input"
                    />
                  </ProfileField>
                </div>
                <ProgressDots current={dotIndex} />
              </div>
            </section>
          )}

          {isFeature && (
            <section className="min-h-full" data-testid={`onboarding-feature-${current.step_key}`}>
              <IllustrationPanel
                src={ONBOARDING_ARTWORK[current.step_key]!}
                alt={`${current.title} illustration`}
                className="h-[49vh] min-h-[350px] max-h-[440px] w-full rounded-none"
                testId={`onboarding-artwork-${current.step_key}`}
              />
              <div className="relative -mt-8 min-h-[360px] rounded-t-[2rem] bg-[#faf7ef] px-5 pb-8 pt-5 text-center shadow-[0_-12px_30px_rgba(3,32,29,.16)]">
                <ProgressDots current={dotIndex} />
                <h1
                  className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-[#0b2b28]"
                  data-testid="premium-step-title"
                >
                  {current.title}
                </h1>
                <p
                  className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#667a74]"
                  data-testid="premium-step-subtitle"
                >
                  {current.description}
                </p>
                <FeaturePreview
                  stepKey={current.step_key}
                  referralUrl={referralUrl}
                  onCopy={copyReferral}
                  onShare={shareReferral}
                />
              </div>
            </section>
          )}

          {isReady && (
            <section className="min-h-full" data-testid="onboarding-ready-view">
              <IllustrationPanel
                src={ONBOARDING_ARTWORK["youre_ready"]!}
                alt="CashGPT celebration"
                className="h-[48vh] min-h-[340px] max-h-[430px] w-full rounded-none"
                testId="onboarding-artwork-youre-ready"
              />
              <div className="relative -mt-9 min-h-[390px] rounded-t-[2rem] bg-[#faf7ef] px-5 pb-8 pt-6 text-center shadow-[0_-12px_30px_rgba(3,32,29,.16)]">
                <ProgressDots current={dotIndex} />
                <h1
                  className="mt-4 text-4xl font-extrabold tracking-[-0.04em] text-[#0b2b28]"
                  data-testid="premium-step-title"
                >
                  You're Ready!
                </h1>
                <p
                  className="mx-auto mt-2 max-w-xs text-sm text-[#667a74]"
                  data-testid="premium-step-subtitle"
                >
                  Now you know how to earn. Complete your first task to get started.
                </p>
                <div
                  className="mx-auto mt-6 flex max-w-sm items-center gap-4 rounded-3xl border border-[#e8cb68] bg-[linear-gradient(135deg,#fff7cf,#ffed9b)] p-4 text-left shadow-[0_14px_32px_rgba(212,175,55,.18)]"
                  data-testid="premium-ready-card"
                >
                  <span className="grid size-14 place-items-center rounded-2xl bg-[#0b2b28] text-[#f4cf56]">
                    <WalletCards className="size-7" />
                  </span>
                  <span>
                    <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#81671f]">
                      Your current balance
                    </span>
                    <span
                      className="mt-1 block font-display text-3xl text-[#0b2b28]"
                      data-testid="premium-wallet-balance"
                    >
                      {formatMoney(profile?.wallet_balance ?? 0)}
                    </span>
                  </span>
                </div>
              </div>
            </section>
          )}
        </div>

        <footer
          className={`absolute inset-x-0 bottom-0 z-40 px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 ${isWelcome ? "bg-gradient-to-t from-[#061f1d] via-[#061f1d] to-transparent" : "border-t border-[#e8e3d8] bg-[#faf7ef]/95 backdrop-blur-md"}`}
        >
          <Button
            type="button"
            onClick={next}
            disabled={complete.isPending}
            className={`h-13 w-full rounded-full border-0 text-base font-extrabold ${isWelcome || isReady || current.accent_style === "gold" ? "bg-[linear-gradient(180deg,#ffe478,#d4af37)] !text-[#0b2b28] shadow-[0_12px_28px_rgba(212,175,55,.3)] hover:brightness-105" : "bg-[linear-gradient(180deg,#13826d,#07584c)] !text-white shadow-[0_12px_28px_rgba(7,88,76,.24)] hover:brightness-110"}`}
            data-testid={`premium-cta-${current.step_key}`}
          >
            {complete.isPending ? "Saving…" : current.cta_text.replace(" →", "")}
            {!complete.isPending && <ArrowRight className="size-4" />}
          </Button>
          {isWelcome && (
            <button
              type="button"
              onClick={goHome}
              className="mt-2 w-full py-1 text-xs font-semibold text-white/70 hover:text-white"
              data-testid="premium-skip-for-now"
            >
              Skip for now
            </button>
          )}
          {isReady && (
            <button
              type="button"
              onClick={goHome}
              className="mt-2 w-full py-1 text-xs font-bold text-[#0b5b4d] hover:text-[#0b2b28]"
              data-testid="premium-explore-app"
            >
              Explore App
            </button>
          )}
          {preview && !isWelcome && !isReady && (
            <p className="mt-1 text-center text-[8px] font-bold uppercase tracking-[0.16em] text-[#9c8a5a]">
              Preview mode
            </p>
          )}
        </footer>
      </div>
    </main>
  );
}

function IllustrationPanel({
  src,
  alt,
  className,
  testId,
}: {
  src: string;
  alt: string;
  className: string;
  testId: string;
}) {
  return (
    <div
      className={`premium-illustration-panel relative overflow-hidden bg-[#0b2b28] ${className}`}
      data-testid={testId}
    >
      <img src={src} alt={alt} className="size-full object-cover" decoding="async" />
      <span className="premium-panel-glint premium-panel-glint-one" aria-hidden />
      <span className="premium-panel-glint premium-panel-glint-two" aria-hidden />
    </div>
  );
}

function ProgressDots({ current, dark = false }: { current: number; dark?: boolean }) {
  return (
    <div
      className="flex items-center justify-center gap-2"
      data-testid="premium-onboarding-stepper"
    >
      {[0, 1, 2, 3, 4].map((dot) => (
        <span
          key={dot}
          className={`rounded-full transition-[width,background-color,box-shadow] duration-300 ${dot === current ? "h-2 w-6 bg-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,.45)]" : `size-2 ${dark ? "bg-white/35" : "bg-[#cdd6d1]"}`}`}
          data-testid={`premium-feature-dot-${dot + 1}`}
        />
      ))}
    </div>
  );
}

function ProfileField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="ml-1 text-[11px] font-bold text-[#42615a]">{label}</Label>
      {children}
    </div>
  );
}

function FeaturePreview({
  stepKey,
  referralUrl,
  onCopy,
  onShare,
}: {
  stepKey: string;
  referralUrl: string;
  onCopy: () => void;
  onShare: () => void;
}) {
  if (stepKey === "features_offers") {
    return (
      <div
        className="mx-auto mt-5 flex max-w-sm items-center gap-3 rounded-2xl border border-[#dfe5dd] bg-white p-3 text-left shadow-[0_10px_24px_rgba(11,43,40,.08)]"
        data-testid="premium-offer-preview"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#0e6f5e] text-[#f4cf56]">
          <Gift className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-extrabold text-[#173f38]">Deal Offers</span>
          <span className="mt-1 block text-[10px] leading-snug text-[#71817c]">
            Grab limited-time deals and promotional offers with high rewards.
          </span>
        </span>
        <span className="rounded-full bg-[#f25d4b] px-2 py-1 text-[8px] font-black uppercase text-white">
          Hot
        </span>
      </div>
    );
  }
  if (stepKey === "quest") {
    const rows = [
      { icon: <LockKeyhole />, label: "Locker", note: "Complete offers & unlock" },
      { icon: <Link2 />, label: "Shortlink", note: "Visit & earn" },
      { icon: <Star />, label: "Special Quest", note: "Bonus rewards" },
    ];
    return (
      <div
        className="mx-auto mt-5 max-w-sm divide-y divide-[#e3e8e2] overflow-hidden rounded-2xl border border-[#dfe5dd] bg-white text-left shadow-[0_10px_24px_rgba(11,43,40,.08)]"
        data-testid="premium-quest-types"
      >
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3 p-3">
            <span className="grid size-9 place-items-center rounded-full bg-[#0e6f5e] text-[#f4cf56] [&_svg]:size-4">
              {row.icon}
            </span>
            <span>
              <span className="block text-xs font-extrabold text-[#173f38]">{row.label}</span>
              <span className="mt-0.5 block text-[10px] text-[#71817c]">{row.note}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  if (stepKey === "watch_earn") {
    return (
      <div
        className="mx-auto mt-5 flex max-w-sm items-center gap-3 rounded-2xl border border-[#dfe5dd] bg-white p-3 text-left shadow-[0_10px_24px_rgba(11,43,40,.08)]"
        data-testid="premium-watch-preview"
      >
        <span className="grid size-11 place-items-center rounded-full bg-[#0e6f5e] text-white">
          <Play className="size-5 fill-current" />
        </span>
        <span>
          <span className="block text-xs font-extrabold text-[#173f38]">Watch Ads</span>
          <span className="mt-1 block text-[10px] text-[#71817c]">
            Complete ad goals and earn rewards.
          </span>
        </span>
      </div>
    );
  }
  if (stepKey === "offerwall") {
    const rows = [
      { icon: <Smartphone />, label: "Apps" },
      { icon: <ClipboardCopy />, label: "Surveys" },
      { icon: <Gamepad2 />, label: "Games" },
      { icon: <Sparkles />, label: "And more…" },
    ];
    return (
      <div
        className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-2 rounded-2xl border border-[#dfe5dd] bg-white p-3 text-left shadow-[0_10px_24px_rgba(11,43,40,.08)]"
        data-testid="premium-offerwall-checklist"
      >
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center gap-2 rounded-xl bg-[#f1f7f3] px-3 py-2"
          >
            <CheckCircle2 className="size-4 text-[#0e7d66]" />
            <span className="text-xs font-bold text-[#274943]">{row.label}</span>
          </div>
        ))}
      </div>
    );
  }
  if (stepKey === "refer_earn") {
    return (
      <div
        className="mx-auto mt-5 max-w-sm rounded-2xl border border-[#dfe5dd] bg-white p-3 text-left shadow-[0_10px_24px_rgba(11,43,40,.08)]"
        data-testid="premium-referral-box"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#71817c]">
          Your referral link
        </p>
        <div
          className="mt-2 truncate rounded-xl bg-[#edf4ef] px-3 py-2.5 text-xs font-semibold text-[#31544d]"
          data-testid="premium-referral-url"
        >
          {referralUrl}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            type="button"
            size="sm"
            variant="jade"
            onClick={onCopy}
            className="rounded-full"
            data-testid="premium-copy-referral"
          >
            <Copy className="size-3.5" /> Copy
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onShare}
            className="rounded-full"
            data-testid="premium-share-referral"
          >
            <Share2 className="size-3.5" /> Share
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="mt-5 flex justify-center gap-3">
      <Layers3 className="size-5 text-[#0e7d66]" />
      <Trophy className="size-5 text-[#d4af37]" />
    </div>
  );
}
