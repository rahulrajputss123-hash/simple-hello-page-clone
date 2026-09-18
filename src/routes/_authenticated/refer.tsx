import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, FileText, Gift, Info, Lock, Share2, Users, Wallet } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  REFERRAL_MAX_BONUS,
  REFERRAL_MILESTONE_BONUS,
  formatDate,
  formatMoney,
} from "@/lib/coinquest";
import {
  deriveReferralProgress,
  sumReferralTotals,
  type ReferralRewardState,
} from "@/lib/referral-progress";

export const Route = createFileRoute("/_authenticated/refer")({
  head: () => ({
    meta: [
      { title: "Refer & earn — CashGPT" },
      { name: "description", content: "Invite friends to CashGPT and earn up to $3 per friend." },
      { property: "og:title", content: "Refer & earn — CashGPT" },
      {
        property: "og:description",
        content: "Invite friends to CashGPT and earn up to $3 per friend.",
      },
    ],
  }),
  component: ReferPage,
});

type ReferralRow = Database["public"]["Tables"]["referrals"]["Row"];

const MILESTONES = [
  {
    key: "signup_credited_at",
    emoji: "🎉",
    short: "Signup",
    label: "Friend signs up",
    detail: "Counted when they successfully sign up with your code",
  },
  {
    key: "earning_credited_at",
    emoji: "🎯",
    short: "First earning",
    label: "Friend completes their first Task, Offer or Quest",
    detail: "Any qualifying first earning from a Task, Offer or Quest counts",
  },
  {
    key: "withdrawal_credited_at",
    emoji: "💸",
    short: "First withdrawal",
    label: "Friend completes their first withdrawal",
    detail: "Counted when their first withdrawal is approved — this releases the reward",
  },
] as const;

/** Simplified brand mark, filled currentColor so it tints with the button background. */
function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.94L2 22l5.3-1.39a9.86 9.86 0 0 0 4.74 1.21h.005c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.12-2.9-6.99A9.82 9.82 0 0 0 12.04 2Zm0 1.67c2.19 0 4.25.85 5.8 2.4a8.2 8.2 0 0 1 2.41 5.83c0 4.55-3.7 8.24-8.25 8.24a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-2.96.78.79-2.88-.2-.3a8.16 8.16 0 0 1-1.26-4.36c0-4.55 3.7-8.24 8.16-8.38Zm-3.2 4.32c-.16 0-.42.06-.6.28-.2.24-.78.76-.78 1.86 0 1.1.8 2.16 1.9 3.4 1.1 1.24 2.6 2.28 3.7 2.7.94.36 1.44.18 1.72-.08.32-.3.9-.98 1.08-1.32.18-.34.02-.6-.14-.76-.16-.16-1.02-.5-1.18-.56-.16-.06-.28-.1-.4.08-.12.18-.46.58-.56.7-.1.12-.2.14-.36.06-.5-.22-1.36-.66-2.06-1.34-.6-.56-1-1.24-1.12-1.44-.12-.2 0-.32.08-.42.08-.1.28-.34.36-.46.08-.12.04-.24 0-.34-.06-.1-.5-1.22-.68-1.62-.14-.32-.28-.28-.4-.28Z" />
    </svg>
  );
}
function TelegramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M21.7 3.3 2.9 10.9c-1.05.42-1.03 1.02-.2 1.29l4.6 1.43 10.6-6.68c.5-.3.96-.15.58.18L9.8 15.4l-.34 4.65c.38 0 .55-.16.76-.36l2-1.94 4.16 3.08c.76.42 1.3.2 1.5-.7l2.7-12.8c.3-1.13-.42-1.64-1.1-1.03Z" />
    </svg>
  );
}

const REWARD_STATE_STYLE: Record<ReferralRewardState, { label: string; className: string }> = {
  in_progress: {
    label: "Pending",
    className: "bg-gold/20 text-gold-dark",
  },
  unlocked: {
    label: "Unlocked",
    className: "bg-mint/25 text-primary",
  },
  credited: {
    label: "Credited",
    className: "bg-mint/25 text-primary",
  },
  expired: {
    label: "Expired",
    className: "bg-muted text-muted-foreground",
  },
};

/**
 * Privacy-safe friend label. Mirrors the existing approach on this screen, which
 * derives a badge from the referral id — a referrer cannot read the friend's
 * profile (RLS is self-only) and nothing here loosens that.
 */
function friendLabel(referralId: string): string {
  return `Friend #${String(referralId).replace(/-/g, "").slice(0, 4).toUpperCase()}`;
}

/** Per-referral reward line: how much is locked, and what unlocks it. */
function ReferralRewardLine({ referral }: { referral: ReferralRow }) {
  const progress = deriveReferralProgress(referral);
  const badge = REWARD_STATE_STYLE[progress.state];
  const amount =
    progress.state === "credited"
      ? progress.creditedAmount
      : progress.state === "expired"
        ? 0
        : progress.pendingAmount;

  return (
    <div
      className="flex items-center justify-between gap-2"
      data-testid={`refer-reward-state-${referral.id}`}
    >
      <p className="text-xs text-muted-foreground">
        Progress{" "}
        <span className="font-semibold text-foreground [font-variant-numeric:tabular-nums]">
          {progress.completed}/{progress.total}
        </span>
        {progress.state === "in_progress" && progress.daysRemaining <= 30 ? (
          <span className="text-destructive"> · {progress.daysRemaining}d left</span>
        ) : null}
      </p>
      <span className="flex items-center gap-1.5">
        <span className="text-amount text-sm text-foreground">{formatMoney(amount)}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.className}`}
        >
          {badge.label}
        </span>
      </span>
    </div>
  );
}

/** Horizontal 3-dot stepper for a single referral's signup → earning → withdrawal progress. */
function MilestoneStepper({ referral }: { referral: ReferralRow }) {
  return (
    <div data-testid={`refer-milestone-stepper-${referral.id}`}>
      <div className="flex items-center">
        {MILESTONES.map((milestone, index) => {
          const done = Boolean(referral[milestone.key]);
          return (
            <div key={milestone.key} className="flex flex-1 items-center last:flex-none">
              <span
                aria-hidden
                className={
                  done
                    ? "grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
                    : "grid size-7 shrink-0 place-items-center rounded-full border-2 border-border text-muted-foreground"
                }
              >
                {done ? (
                  <Check className="size-3.5" />
                ) : (
                  <span className="size-1.5 rounded-full bg-border" />
                )}
              </span>
              {index < MILESTONES.length - 1 && (
                <span className={`h-0.5 flex-1 ${done ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        {MILESTONES.map((milestone) => {
          const done = Boolean(referral[milestone.key]);
          return (
            <div key={milestone.key}>
              <p
                className={`text-[11px] font-semibold ${done ? "text-primary" : "text-muted-foreground"}`}
              >
                {milestone.short}
              </p>
              <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
                {milestone.detail}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReferPage() {
  const { session, profile } = useAuth();
  const code = profile?.referral_code ?? "";
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/auth?ref=${code}`;

  const referrals = useQuery({
    queryKey: ["referrals", session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      const { data } = await supabase
        .from("referrals")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const mine = referrals.data?.filter((r) => r.referrer_id === session?.user.id) ?? [];
  // Pending vs credited both come from the shared derivation the server uses to
  // decide the release, so the screen can never disagree with the wallet.
  const totals = sumReferralTotals(mine);
  const referralEarnings = totals.credited;
  const potentialEarnings = mine.length * REFERRAL_MAX_BONUS;
  const shareMessage = "Join me on CashGPT and start earning!";

  return (
    <AppShell subtitle="Refer">
      <div className="refer-page-bg">
        <SectionHeading
          size="page"
          icon={Users}
          iconSrc="/icons/icon-referral.png"
          title="Refer & Earn"
          subtitle="Invite friends, get rewarded together"
          className="mb-4"
        />

        <section className="premium-step-in rounded-3xl bg-jade-gradient p-5 text-primary-foreground shadow-lift">
          <h2 className="text-xl">Invite friends, earn more</h2>
          <p className="mt-1 text-sm opacity-80">
            Earn up to {formatMoney(REFERRAL_MAX_BONUS)} per friend.
          </p>
          <p className="mt-1 text-xs opacity-60">Join thousands of users earning together.</p>

          <p className="mt-5 text-[11px] font-semibold uppercase tracking-widest opacity-70">
            Your code
          </p>
          <p className="text-amount mt-1.5 rounded-2xl border border-dashed border-primary-foreground/40 bg-primary-foreground/10 px-4 py-3 text-center text-2xl tracking-[0.3em]">
            {code || "—"}
          </p>

          <div className="mt-4 flex gap-2">
            <Button
              variant="gold"
              className="flex-1 gap-2"
              data-testid="refer-copy-code-btn"
              onClick={async () => {
                await navigator.clipboard.writeText(link);
                toast.success("Invite link copied");
              }}
            >
              <Copy className="size-4" /> Copy Code
            </Button>
            <Button
              variant="mint"
              className="refer-share-glow flex-1 gap-2"
              data-testid="refer-share-invite-btn"
              onClick={async () => {
                if (navigator.share) await navigator.share({ title: "CashGPT", url: link });
                else {
                  await navigator.clipboard.writeText(link);
                  toast.success("Invite link copied");
                }
              }}
            >
              <Share2 className="size-4" /> Share Invite
            </Button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${shareMessage} ${link}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on WhatsApp"
              data-testid="refer-share-whatsapp-btn"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-[#25D366] text-white shadow-soft transition-transform hover:scale-105 active:scale-95"
            >
              <WhatsAppIcon className="size-4.5" />
            </a>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on Telegram"
              data-testid="refer-share-telegram-btn"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-[#26A5E4] text-white shadow-soft transition-transform hover:scale-105 active:scale-95"
            >
              <TelegramIcon className="size-4.5" />
            </a>
            <span className="text-xs opacity-70">Quick share</span>
          </div>

          {link ? (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-primary-foreground/10 p-3">
              <div className="shrink-0 rounded-xl bg-white p-1.5" data-testid="refer-qr-code">
                <QRCodeSVG value={link} size={64} bgColor="#ffffff" fgColor="#0f3d3a" />
              </div>
              <p className="text-xs opacity-80">
                Scan to open your invite link — great for sharing in person.
              </p>
            </div>
          ) : null}
        </section>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div
            className="surface-card premium-step-in p-4"
            style={{ animationDelay: "80ms" }}
            data-testid="refer-stat-friends"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-primary/10">
              <Users className="size-4 text-primary" />
            </span>
            <p className="text-amount mt-3 text-2xl leading-none">{mine.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Friends Invited</p>
          </div>
          <div
            className="surface-card premium-step-in p-4"
            style={{ animationDelay: "140ms" }}
            data-testid="refer-stat-earnings"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-gold/20">
              <Gift className="size-4 text-gold-dark" />
            </span>
            <p className="text-amount mt-3 text-2xl leading-none text-gold-dark">
              {formatMoney(referralEarnings)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Credited to Wallet</p>
            {potentialEarnings > 0 && (
              <>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background-alt">
                  <div
                    className="h-full rounded-full bg-gold-gradient"
                    style={{
                      width: `${Math.min(100, (referralEarnings / potentialEarnings) * 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {formatMoney(referralEarnings)} earned of {formatMoney(potentialEarnings)}{" "}
                  potential
                </p>
              </>
            )}
          </div>
        </div>

        <SectionHeading icon={Wallet} iconSrc="/icons/icon-wallet.png" title="Referral Earnings" />
        <div className="surface-card p-4" data-testid="refer-earnings-summary">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-gold/10 p-3" data-testid="refer-earnings-pending">
              <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gold-dark">
                <Lock className="size-3" /> Pending
              </p>
              <p className="text-amount mt-1 text-xl leading-none text-gold-dark">
                {formatMoney(totals.pending)}
              </p>
              <p className="mt-1 text-[10px] leading-tight text-muted-foreground">
                Locked — not in your wallet yet
              </p>
            </div>
            <div className="rounded-2xl bg-mint/15 p-3" data-testid="refer-earnings-credited">
              <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                <Check className="size-3" /> Credited
              </p>
              <p className="text-amount mt-1 text-xl leading-none text-primary">
                {formatMoney(totals.credited)}
              </p>
              <p className="mt-1 text-[10px] leading-tight text-muted-foreground">
                Released to your main wallet
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <p className="text-xs font-semibold">Total referral earnings</p>
            <p className="text-amount text-base" data-testid="refer-earnings-total">
              {formatMoney(totals.total)}
            </p>
          </div>

          <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Pending referral earnings are <strong>not</strong> part of your wallet balance and
              can&apos;t be withdrawn yet. The full {formatMoney(REFERRAL_MAX_BONUS)} for a friend
              is released to your main wallet only once that friend completes all 3 milestones.
            </span>
          </p>
        </div>

        <SectionHeading
          icon={Gift}
          iconSrc="/icons/icon-how-you-earn.png"
          title={`How you earn ${formatMoney(REFERRAL_MAX_BONUS)}`}
        />
        <ol className="surface-card space-y-1 p-4">
          {MILESTONES.map((milestone, index) => (
            <li key={milestone.key} className="relative flex gap-3 pb-4 last:pb-0">
              {index < MILESTONES.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-5 top-11 h-[calc(100%-2.25rem)] w-px bg-border"
                />
              )}
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-background-alt text-lg">
                {milestone.emoji}
              </span>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-semibold">
                  {index === 0 ? "" : "+"}
                  {formatMoney(REFERRAL_MILESTONE_BONUS)} — {milestone.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{milestone.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <SectionHeading
          icon={Users}
          iconSrc="/icons/icon-your-referrals.png"
          title="Your referrals"
        />
        {mine.length > 0 && (
          <div className="mb-3 flex items-center gap-3" data-testid="refer-friends-row">
            <div className="flex -space-x-2">
              {mine.slice(0, 5).map((referral, index) => (
                <span
                  key={referral.id}
                  aria-hidden
                  className="grid size-8 place-items-center rounded-full border-2 border-card bg-jade-gradient text-xs font-bold text-primary-foreground"
                  style={{ zIndex: mine.length - index }}
                >
                  {String(referral.id ?? "?")
                    .slice(0, 1)
                    .toUpperCase()}
                </span>
              ))}
              {mine.length > 5 && (
                <span
                  aria-hidden
                  className="grid size-8 place-items-center rounded-full border-2 border-card bg-background-alt text-[10px] font-bold text-muted-foreground"
                >
                  +{mine.length - 5}
                </span>
              )}
            </div>
            <p
              className="text-xs font-semibold text-muted-foreground"
              data-testid="refer-friends-count"
            >
              {mine.length} friend{mine.length === 1 ? "" : "s"} joined
            </p>
          </div>
        )}
        {!mine.length ? (
          <div
            className="surface-card flex flex-col items-center gap-3 px-6 py-10 text-center"
            data-testid="refer-empty-state"
          >
            <span
              aria-hidden
              className="grid size-14 place-items-center rounded-2xl bg-background-alt"
              style={{ animation: "premium-art-float 4s ease-in-out infinite" }}
            >
              <Users className="size-6 text-muted-foreground" />
            </span>
            <h3 className="text-base">No referrals yet</h3>
            <p className="max-w-xs text-sm text-muted-foreground">
              Share your code above — every friend who joins shows up here, along with what you've
              earned from them.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {mine.map((referral) => (
              <li key={referral.id} className="surface-card space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden
                      className="grid size-8 shrink-0 place-items-center rounded-full bg-jade-gradient text-xs font-bold text-primary-foreground"
                    >
                      {String(referral.id).slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <p className="truncate text-sm font-semibold">{friendLabel(referral.id)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Joined {formatDate(referral.created_at)}
                      </p>
                    </span>
                  </span>
                  <span className="text-amount shrink-0 text-gold-dark">
                    {formatMoney(referral.bonus_amount)} / {formatMoney(REFERRAL_MAX_BONUS)}
                  </span>
                </div>
                <MilestoneStepper referral={referral} />
                <ReferralRewardLine referral={referral} />
              </li>
            ))}
          </ul>
        )}

        <SectionHeading
          icon={FileText}
          iconSrc="/icons/icon-terms-conditions.png"
          title="Terms & conditions"
        />
        <details className="surface-card p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Referral terms &amp; conditions
          </summary>
          <div className="mt-2 space-y-2 text-xs text-muted-foreground">
            <p>
              Each referred friend can earn you up to {formatMoney(REFERRAL_MAX_BONUS)} in total —{" "}
              {formatMoney(REFERRAL_MILESTONE_BONUS)} per milestone, counted once per referral.
            </p>
            <p>
              Milestones unlock referral earnings as <strong>pending</strong>. Pending referral
              earnings are not part of your wallet balance and cannot be withdrawn. The full{" "}
              {formatMoney(REFERRAL_MAX_BONUS)} is released into your main wallet only once that
              friend has completed all 3 milestones.
            </p>
            <p>
              All 3 milestones must be completed within 1 year of your friend's signup. If they are
              not, that referral expires and its pending earnings are not released.
            </p>
            <p>
              Self-referrals, duplicate accounts and fraudulent activity void all referral rewards.
            </p>
          </div>
        </details>
      </div>
    </AppShell>
  );
}
