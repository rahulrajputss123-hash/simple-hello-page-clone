import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, FileText, Gift, Share2, Users } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { EmptyState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  REFERRAL_MAX_BONUS,
  REFERRAL_MILESTONE_BONUS,
  formatDate,
  formatMoney,
} from "@/lib/coinquest";

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

const MILESTONES = [
  {
    key: "signup_credited_at",
    emoji: "🎉",
    label: "Friend signs up",
    detail: "Credited when they successfully sign up with your code",
  },
  {
    key: "earning_credited_at",
    emoji: "🎯",
    label: "Friend completes their first Task, Offer or Quest",
    detail: "Any qualifying first earning from a Task, Offer or Quest counts",
  },
  {
    key: "withdrawal_credited_at",
    emoji: "💸",
    label: "Friend completes their first withdrawal",
    detail: "Earned when they successfully complete their first withdrawal",
  },
] as const;

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
  const referralEarnings = mine.reduce((sum, r) => sum + Number(r.bonus_amount ?? 0), 0);

  return (
    <AppShell subtitle="Refer">
      <SectionHeading
        size="page"
        icon={Users}
        title="Refer & Earn"
        subtitle="Invite friends, get rewarded together"
        className="mb-4"
      />

      <section className="rounded-3xl bg-jade-gradient p-5 text-primary-foreground shadow-lift">
        <h2 className="text-xl">Invite friends, earn more</h2>
        <p className="mt-1 text-sm opacity-80">
          Earn up to {formatMoney(REFERRAL_MAX_BONUS)} per friend.
        </p>

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
            onClick={async () => {
              await navigator.clipboard.writeText(link);
              toast.success("Invite link copied");
            }}
          >
            <Copy className="size-4" /> Copy Code
          </Button>
          <Button
            variant="mint"
            className="flex-1 gap-2"
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
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="surface-card p-4">
          <span className="grid size-9 place-items-center rounded-xl bg-primary/10">
            <Users className="size-4 text-primary" />
          </span>
          <p className="text-amount mt-3 text-2xl leading-none">{mine.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">Friends Invited</p>
        </div>
        <div className="surface-card p-4">
          <span className="grid size-9 place-items-center rounded-xl bg-gold/20">
            <Gift className="size-4 text-gold-dark" />
          </span>
          <p className="text-amount mt-3 text-2xl leading-none text-gold-dark">
            {formatMoney(referralEarnings)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Referral Earnings</p>
        </div>
      </div>

      <SectionHeading icon={Gift} title={`How you earn ${formatMoney(REFERRAL_MAX_BONUS)}`} />
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

      <SectionHeading icon={Users} title="Your referrals" />
      {!mine.length ? (
        <EmptyState
          icon={Users}
          title="No referrals yet"
          description="Share your code above — every friend who joins shows up here, along with what you've earned from them."
        />
      ) : (
        <ul className="space-y-2">
          {mine.map((referral) => (
            <li key={referral.id} className="surface-card space-y-2 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Joined {formatDate(referral.created_at)}
                </p>
                <span className="text-amount text-gold-dark">
                  {formatMoney(referral.bonus_amount)} / {formatMoney(REFERRAL_MAX_BONUS)}
                </span>
              </div>
              <ul className="space-y-1.5">
                {MILESTONES.map((milestone) => {
                  const done = Boolean(referral[milestone.key]);
                  return (
                    <li
                      key={milestone.key}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="flex items-center gap-2">
                        <span className="grid size-7 place-items-center rounded-lg bg-background-alt">
                          {milestone.emoji}
                        </span>
                        <span className="text-muted-foreground">{milestone.label}</span>
                      </span>
                      <span
                        className={
                          done
                            ? "shrink-0 rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary"
                            : "shrink-0 rounded-full bg-muted px-2 py-0.5 font-semibold text-muted-foreground"
                        }
                      >
                        {done ? `Completed · ${formatMoney(REFERRAL_MILESTONE_BONUS)}` : "Pending"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <SectionHeading icon={FileText} title="Terms & conditions" />
      <details className="surface-card p-4">
        <summary className="cursor-pointer text-sm font-semibold">
          Referral terms &amp; conditions
        </summary>
        <div className="mt-2 space-y-2 text-xs text-muted-foreground">
          <p>
            Each referred friend can earn you up to {formatMoney(REFERRAL_MAX_BONUS)} in total —
            {" "}
            {formatMoney(REFERRAL_MILESTONE_BONUS)} per milestone, credited once per referral.
          </p>
          <p>
            Complete all 3 milestones within 1 year of your friend's signup to keep the referral
            rewards. If your referred friend does not complete their first withdrawal within 1 year
            of their signup, the first two {formatMoney(REFERRAL_MILESTONE_BONUS)} referral rewards
            credited for that referral will be reversed/removed from the referrer's balance.
          </p>
          <p>
            Self-referrals, duplicate accounts and fraudulent activity void all referral rewards.
          </p>
        </div>
      </details>
    </AppShell>
  );
}

