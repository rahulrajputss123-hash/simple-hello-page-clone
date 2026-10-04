import { createFileRoute, Link } from "@tanstack/react-router";
import { Link2, Users } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { BackLink, PreviewNotice, StatTile } from "@/components/marketplace/Preview";
import { formatMoney } from "@/lib/coinquest";
import { ADVERTISER_REFERRAL } from "@/lib/marketplace/data";

export const Route = createFileRoute("/_authenticated/advertiser/referral")({
  head: () => ({ meta: [{ title: "Advertiser Referral — CashGPT" }] }),
  component: AdvertiserReferralPage,
});

function AdvertiserReferralPage() {
  const r = ADVERTISER_REFERRAL;
  return (
    <AppShell subtitle="Advertiser" mainClass="page-fade-in">
      <BackLink to="/home" label="Back to dashboard" />
      <SectionHeading
        variant="ribbon"
        size="page"
        icon={Users}
        iconSrc="/icons/icon-referral.png"
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

      <SectionHeading variant="ribbon" icon={Users} title="Your advertiser referrals" />
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Referred advertisers" value={String(r.referredAdvertisers)} />
        <StatTile label="Qualifying activations" value={String(r.qualifyingActivations)} hint="Funded a first campaign" tone="mint" />
        <StatTile label="Rewards earned" value={formatMoney(r.rewardsEarned)} tone="gold" />
        <StatTile label="Per activation" value={formatMoney(r.rewardPerActivation)} />
      </div>
    </AppShell>
  );
}