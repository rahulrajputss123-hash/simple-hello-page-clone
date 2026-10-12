import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarClock,
  EyeOff,
  LifeBuoy,
  ListChecks,
  Lock,
  RefreshCw,
  Share2,
  ShieldAlert,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import {
  REFERRAL_MAX_BONUS,
  REFERRAL_MILESTONE_BONUS,
  REFERRAL_WINDOW_DAYS,
  formatMoney,
} from "@/lib/coinquest";
import { REFERRAL_MILESTONE_COUNT } from "@/lib/referral-progress";

/**
 * In-app Referral Program Rules.
 *
 * Every figure comes from the shared constants and REFERRAL_MILESTONE_COUNT, so
 * this page, the Refer screen, the pending-earnings display and the server-side
 * release logic can never describe different amounts.
 *
 * The reward model described here is the ONLY one: the three milestones unlock
 * earnings as *pending*, nothing is credited per milestone, and the full
 * REFERRAL_MAX_BONUS is released to the main wallet once all three are complete.
 */
export const Route = createFileRoute("/_authenticated/referral-rules")({
  head: () => ({
    meta: [
      { title: "Referral program rules — CashGPT" },
      {
        name: "description",
        content: `How CashGPT referral rewards work: ${REFERRAL_MILESTONE_COUNT} milestones, then ${formatMoney(REFERRAL_MAX_BONUS)} released to your wallet.`,
      },
    ],
  }),
  component: ReferralRulesPage,
});

/** One numbered rule card: jade number badge, mint icon, concise body. */
function Rule({
  index,
  icon: Icon,
  title,
  children,
}: {
  index: number;
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card p-4" data-testid={`referral-rule-${index}`}>
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="grid size-7 shrink-0 place-items-center rounded-full bg-jade-gradient text-[12px] font-bold text-primary-foreground shadow-soft"
        >
          {index}
        </span>
        <span
          aria-hidden
          className="grid size-7 shrink-0 place-items-center rounded-full bg-mint/15 text-primary ring-1 ring-inset ring-mint/25"
        >
          <Icon className="size-3.5" />
        </span>
        <h2 className="min-w-0 flex-1 font-display text-[15px] leading-tight text-primary">
          {title}
        </h2>
      </div>
      <div className="mt-2.5 space-y-2 border-t border-border pt-2.5 text-xs leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

/** Compact bullet list — short lines keep the page scannable on a phone. */
function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-mint" />
          <span className="min-w-0 flex-1">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Amount({ children }: { children: React.ReactNode }) {
  return <strong className="text-amount text-gold-dark">{children}</strong>;
}

/** Exported so the no-login preview route can render the real page. */
export function ReferralRulesPage() {
  const full = formatMoney(REFERRAL_MAX_BONUS);
  const per = formatMoney(REFERRAL_MILESTONE_BONUS);

  return (
    <AppShell subtitle="Referral rules">
      <Link
        to="/refer"
        className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-card px-3 py-1.5 text-xs font-semibold text-primary shadow-soft transition-colors hover:bg-primary hover:text-primary-foreground"
        data-testid="referral-rules-back"
      >
        <ArrowLeft className="size-3.5" />
        Back to Refer &amp; Earn
      </Link>

      {/* Headline: the one thing to understand about payout timing. */}
      <div
        className="mt-4 rounded-3xl bg-jade-gradient p-4 text-primary-foreground shadow-lift"
        data-testid="referral-rules-hero"
      >
        <h1 className="font-display text-lg leading-tight">Referral program rules</h1>
        <p className="mt-1.5 text-xs leading-relaxed opacity-90">
          Invite a friend and earn up to <strong>{full}</strong> for each one. The{" "}
          {REFERRAL_MILESTONE_COUNT} milestones build up as <strong>pending</strong> earnings — the
          full {full} lands in your main wallet once your friend completes all{" "}
          {REFERRAL_MILESTONE_COUNT}.
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <Rule index={1} icon={Share2} title="How it works">
          <Bullets
            items={[
              "Share your personal referral code or link from the Refer & Earn screen.",
              "Your friend signs up with it and starts using CashGPT.",
              <>
                As they hit each milestone, your referral earnings grow — up to{" "}
                <Amount>{full}</Amount> per friend.
              </>,
            ]}
          />
        </Rule>

        <Rule index={2} icon={ListChecks} title={`The ${REFERRAL_MILESTONE_COUNT} milestones`}>
          <Bullets
            items={[
              <>
                <strong>Signup</strong> — your friend creates an account with your code.
              </>,
              <>
                <strong>First earning</strong> — they complete their first Task, Offer or Quest.
              </>,
              <>
                <strong>First withdrawal</strong> — their first withdrawal is approved.
              </>,
            ]}
          />
          <p>
            Each milestone is worth <Amount>{per}</Amount> and counts once per friend.
          </p>
        </Rule>

        <Rule index={3} icon={Lock} title="When you actually get paid">
          <p className="rounded-xl bg-gold/10 p-2.5 text-[11px] leading-relaxed text-gold-dark">
            Milestones unlock earnings as <strong>pending</strong>. Pending earnings are{" "}
            <strong>not</strong> part of your wallet balance and cannot be withdrawn.
          </p>
          <Bullets
            items={[
              <>
                Nothing is credited to your wallet milestone by milestone — not even the first{" "}
                <Amount>{per}</Amount>.
              </>,
              <>
                The full <Amount>{full}</Amount> is released to your main wallet in one go, once all{" "}
                {REFERRAL_MILESTONE_COUNT} milestones are complete.
              </>,
              "Once released, it behaves like any other wallet balance and can be withdrawn.",
            ]}
          />
          <p>
            The Refer &amp; Earn screen shows <strong>Pending</strong> and <strong>Credited</strong>{" "}
            separately, so you always know which is which.
          </p>
        </Rule>

        <Rule index={4} icon={CalendarClock} title="The time limit">
          <Bullets
            items={[
              <>
                All {REFERRAL_MILESTONE_COUNT} milestones must be completed within{" "}
                <strong>{REFERRAL_WINDOW_DAYS} days</strong> of your friend&apos;s signup.
              </>,
              <>
                If the window closes first, that referral expires and its pending earnings are{" "}
                <strong>not</strong> released.
              </>,
              "Expired referrals do not affect your other referrals.",
            ]}
          />
        </Rule>

        <Rule index={5} icon={UserCheck} title="Who is eligible">
          <Bullets
            items={[
              "You and your friend must be two genuinely different, real people.",
              "Your friend must be new to CashGPT — one account per person.",
              "Both accounts must be in good standing when the reward is released.",
            ]}
          />
        </Rule>

        <Rule index={6} icon={ShieldAlert} title="Not allowed">
          <Bullets
            items={[
              "Self-referrals, duplicate accounts or accounts you control yourself.",
              "Fake, bot-generated or purchased sign-ups.",
              "Bulk registrations from one device, IP or fingerprint.",
              "VPN, proxy or emulator networks used to disguise referral farming.",
              "Misleading claims or paid “sign up and abandon” traffic.",
            ]}
          />
          <p>
            Breaking these voids all referral rewards on the accounts involved — including earnings
            already released — and may lead to suspension.
          </p>
        </Rule>

        <Rule index={7} icon={EyeOff} title="Privacy — what you can and cannot see">
          <p>
            The referral details we show you are limited to what you are allowed to see about
            someone who joined with your code. That is:
          </p>
          <Bullets
            items={[
              "A masked display name and avatar.",
              "The date they joined.",
              <>Their milestone progress ({REFERRAL_MILESTONE_COUNT} steps) and nothing more.</>,
            ]}
          />
          <p className="rounded-xl bg-mint/10 p-2.5 text-[11px] leading-relaxed">
            You will <strong>never</strong> see your friend&apos;s account details, wallet balance,
            transactions, withdrawals, earnings amounts, email, phone number or any other personal
            information. The same protection applies to your data when someone else refers you.
          </p>
        </Rule>

        <Rule index={8} icon={RefreshCw} title="Program changes">
          <Bullets
            items={[
              "CashGPT may update the referral rules when necessary — reward amounts, milestone conditions, time windows, availability or caps.",
              "The program may also be paused or ended.",
              <>
                The rules <strong>currently shown in the app</strong> are the ones that apply to
                your account — always check this page for the latest version.
              </>,
            ]}
          />
        </Rule>

        <Rule index={9} icon={LifeBuoy} title="Questions">
          <p>
            Think a reward was missed, or something looks wrong? Open a support ticket from the{" "}
            <Link to="/support" className="font-semibold text-primary hover:underline">
              Support
            </Link>{" "}
            tab and our team will check your account.
          </p>
        </Rule>
      </div>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
        For the full legal version, see the{" "}
        <Link to="/legal/referral-terms" className="font-semibold text-primary hover:underline">
          Referral Program Terms
        </Link>
        .
      </p>
    </AppShell>
  );
}
