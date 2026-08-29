import { createFileRoute } from "@tanstack/react-router";

import { LI, P, PolicyLayout, Strong, UL, type PolicySection } from "./-policy-layout";

export const Route = createFileRoute("/legal/referral-terms")({
  head: () => ({
    meta: [
      { title: "Referral Program Terms — CashGPT" },
      {
        name: "description",
        content:
          "How the CashGPT referral program works, eligibility, fraud rules and reward timing.",
      },
      { property: "og:title", content: "Referral Program Terms — CashGPT" },
      {
        property: "og:description",
        content: "Rules of the CashGPT referral program.",
      },
    ],
  }),
  component: ReferralPage,
});

const LAST_UPDATED = "January 15, 2026";

const SIBLINGS = [
  { href: "/legal/terms", label: "Terms of Service" },
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/withdrawal-policy", label: "Withdrawal & Payout Policy" },
];

const SECTIONS: PolicySection[] = [
  {
    id: "how-it-works",
    title: "How the referral program works",
    body: (
      <>
        <P>
          Every CashGPT user gets a personal referral code and referral link inside the app.
          When someone new joins CashGPT using your code or link and later completes a
          qualifying action, both you and your friend can earn a referral reward.
        </P>
        <P>
          Reward amounts, trigger conditions and milestones are shown inside the app on the
          Refer &amp; Earn screen and may change over time. Your currently-visible amounts
          are the source of truth for your account.
        </P>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Eligibility",
    body: (
      <>
        <P>To be eligible for referral rewards:</P>
        <UL>
          <LI>The referrer and the referred user must be two <Strong>genuinely different, real people</Strong>.</LI>
          <LI>The referred user must not already have (or have previously had) a CashGPT account.</LI>
          <LI>Self-referrals are not permitted. Referring another account you control — including alternate accounts, family members you have manufactured, or accounts on the same device — is prohibited unless disclosed to and approved by us in writing.</LI>
          <LI>Both accounts must comply with the Terms of Service at the time the reward would be credited.</LI>
        </UL>
      </>
    ),
  },
  {
    id: "reward-timing",
    title: "Reward timing and conditions",
    body: (
      <>
        <P>
          Referral rewards are milestone-based. A milestone reward is only released once the
          referred user completes the qualifying action associated with that milestone (for
          example, signing up, completing their first task or offer, or completing their
          first successful withdrawal).
        </P>
        <P>
          If the referred user does not reach a milestone within the time window shown in the
          app for that milestone, the corresponding reward will not be paid; where the app
          notes a clawback window, previously-credited rewards may be reversed.
        </P>
      </>
    ),
  },
  {
    id: "fraud",
    title: "Referral fraud — zero tolerance",
    body: (
      <>
        <P>
          The following practices are strictly prohibited and will result in the removal of
          all referral rewards from the affected accounts, and may lead to permanent
          suspension of the referrer's account:
        </P>
        <UL>
          <LI>Creating fake, throwaway, bot-generated or purchased CashGPT accounts to inflate referral counts.</LI>
          <LI>Using incentivised or paid traffic whose sole intent is to generate referral rewards (for example, paid clickers, GPT ads, "sign up and abandon" services).</LI>
          <LI>Bulk or automated registrations from a single device, IP address, or fingerprint cluster.</LI>
          <LI>Using promises, giveaways, kickbacks or misleading claims about CashGPT to induce sign-ups.</LI>
          <LI>Using VPN / proxy / emulator networks to disguise coordinated referral farming.</LI>
        </UL>
        <P>
          <Strong>Clawback rights.</Strong> We may reverse and remove referral rewards at any
          time — even if they were previously credited to your wallet or withdrawn — if we
          later detect that they were obtained through the practices above. Suspected fraud
          may also freeze pending payouts pending investigation.
        </P>
      </>
    ),
  },
  {
    id: "program-changes",
    title: "Program changes",
    body: (
      <P>
        We may adjust reward amounts, milestone conditions, time windows, geo-availability or
        cap the number of rewarded referrals per account, and we may suspend or end the
        referral program entirely, at any time and for any reason. Where possible we will
        communicate material changes in advance inside the app.
      </P>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <P>
        Questions about referral rewards, or think a legitimate reward was missed? Contact{" "}
        <Strong>[SUPPORT EMAIL]</Strong> from the email associated with the account.
      </P>
    ),
  },
];

function ReferralPage() {
  return (
    <PolicyLayout
      title="Referral Program Terms"
      subtitle="Invite real people. Earn real rewards. Zero tolerance for fake sign-ups."
      lastUpdated={LAST_UPDATED}
      sections={SECTIONS}
      siblings={SIBLINGS}
      intro={
        <>
          The referral program is designed to reward genuine word-of-mouth growth. Please
          read the eligibility and fraud sections carefully before sharing your code.
        </>
      }
      footer={
        <>
          This is a professional draft, not legal advice. Please have it reviewed by a
          qualified lawyer before public release.
        </>
      }
    />
  );
}
