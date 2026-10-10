import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link2, Users } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { BackLink, PreviewNotice, StatTile } from "@/components/marketplace/Preview";
import { formatMoney } from "@/lib/coinquest";
import { getAdvertiserReferralStats } from "@/lib/marketplace/advertiser-referral.server";
import { useAuth } from "@/lib/auth";
import { ADVERTISER_REFERRAL_PERCENT } from "@/lib/referral-program";

export const Route = createFileRoute("/_authenticated/advertiser/referral")({
  head: () => ({ meta: [{ title: "Advertiser Referral — CashGPT" }] }),
  component: AdvertiserReferralPage,
});

function AdvertiserReferralPage() {
  const { session } = useAuth();
  const fetchAdvertiserStats = useServerFn(getAdvertiserReferralStats);

  const advertiserStats = useQuery({
    queryKey: ["advertiser-referral-stats", session?.user.id],
    enabled: Boolean(session?.user.id),
    queryFn: () => fetchAdvertiserStats({ data: { userId: session!.user.id } }),
  });

  const r = advertiserStats.data ?? {
    referredAdvertisers: 0,
    totalDeposits: 0,
    rewardsEarned: 0,
    referralPercent: ADVERTISER_REFERRAL_PERCENT,
  };

  return (
    <AppShell subtitle="Advertiser" mainClass="page-fade-in">
      <BackLink to="/home" label="Back to dashboard" />
      <SectionHeading
        variant="ribbon"
        size="page"
        icon={Users}
        iconSrc="/icons/icon-advertiser-referral-v2.png"
        title="Advertiser Referral"
        subtitle="Earn when people you invite run campaigns."
        className="mb-2"
      />
      <PreviewNotice />

      <div className="mt-3 rounded-2xl border border-primary/25 bg-primary/5 p-3 text-xs text-primary">
        <p className="flex items-start gap-2">
          <Link2 className="mt-0.5 size-4 shrink-0" />
          <span>
            <strong>Same link, two ways to earn.</strong> This uses your existing CashGPT referral
            link — there is no separate advertiser link. If someone you invite becomes an advertiser
            and funds their first campaign, you earn an advertiser bonus on top of the regular
            publisher rewards.
          </span>
        </p>
        <Link to="/refer" className="mt-2 inline-block font-semibold underline-offset-4 hover:underline">
          Open my referral link →
        </Link>
      </div>

      <SectionHeading
          variant="ribbon"
          icon={Users}
          iconSrc="/icons/icon-user-referrals.png"
          title="Your advertiser referrals"
        />
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Referred advertisers" value={String(r.referredAdvertisers)} />
        <StatTile label="Qualifying activations" value={String(r.totalDeposits)} hint="Funded a first campaign" tone="mint" />
        <StatTile label="Rewards earned" value={formatMoney(r.rewardsEarned)} tone="gold" />
        <StatTile label="Per activation" value={`${r.referralPercent}%`} />
      </div>
    </AppShell>
  );
}
