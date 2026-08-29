import { createFileRoute } from "@tanstack/react-router";

import {
  Callout,
  LI,
  P,
  PolicyLayout,
  Strong,
  UL,
  type PolicySection,
} from "./-policy-layout";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — CashGPT" },
      {
        name: "description",
        content:
          "CashGPT Terms of Service — eligibility, acceptable use, third-party offers, liability and account rules.",
      },
      { property: "og:title", content: "Terms of Service — CashGPT" },
      {
        property: "og:description",
        content: "CashGPT Terms of Service — the rules of using the app.",
      },
    ],
  }),
  component: TermsPage,
});

const LAST_UPDATED = "January 15, 2026";

const SIBLINGS = [
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/referral-terms", label: "Referral Terms" },
  { href: "/legal/withdrawal-policy", label: "Withdrawal & Payout Policy" },
];

const SECTIONS: PolicySection[] = [
  {
    id: "acceptance",
    title: "Acceptance of terms",
    body: (
      <P>
        By creating a CashGPT account or otherwise using the app, you agree to these Terms of
        Service and to any policy referenced from them, including the Privacy Policy, the
        Referral Program Terms and the Withdrawal &amp; Payout Policy. If you do not agree,
        please stop using the service.
      </P>
    ),
  },
  {
    id: "eligibility",
    title: "Eligibility",
    body: (
      <>
        <P>To use CashGPT you must:</P>
        <UL>
          <LI>Be at least [MIN AGE] years old (or older if your local law requires).</LI>
          <LI>Have the legal capacity to enter into a binding agreement.</LI>
          <LI>Provide accurate, current and complete information about yourself.</LI>
          <LI>
            Maintain only one account per person. Duplicate accounts on the same device,
            household or identity may be permanently suspended and their balances forfeited.
          </LI>
        </UL>
      </>
    ),
  },
  {
    id: "service",
    title: "Description of the service",
    body: (
      <>
        <P>
          CashGPT lets you earn in-app credit by completing partner offers, watching rewarded
          ads, referring friends and finishing in-app tasks. Credit accumulates in your wallet
          and can be withdrawn subject to the Withdrawal &amp; Payout Policy.
        </P>
        <P>
          Available offers, tasks, rewards, minimum thresholds and payout methods can change at
          any time and may vary by region, device, network availability and partner rules.
        </P>
      </>
    ),
  },
  {
    id: "account",
    title: "Account registration and security",
    body: (
      <>
        <P>
          You are responsible for keeping your login credentials confidential and for every
          action taken from your account. Notify us immediately at [SUPPORT EMAIL] if you
          suspect unauthorised access.
        </P>
        <P>
          We may require you to verify your identity or ownership of a payout method before
          releasing funds.
        </P>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use and prohibited conduct",
    body: (
      <>
        <P>The following are prohibited and may result in immediate account termination and forfeiture of any balance:</P>
        <UL>
          <LI>Creating or operating more than one account, including household or same-device accounts, without written permission from us.</LI>
          <LI>Using automation, bots, scripts, click farms or any tool that simulates user activity.</LI>
          <LI>Using VPNs, proxies, emulators, virtual machines, GPS spoofers or similar tools to misrepresent your location, device or identity.</LI>
          <LI>Providing fake, stolen or third-party personal information; impersonating any person.</LI>
          <LI>Exploiting a bug, glitch or reward-callback flaw instead of reporting it to [SUPPORT EMAIL].</LI>
          <LI>Attempting to reverse engineer, resell access to, or interfere with the app or its infrastructure.</LI>
          <LI>Attempting to launder funds or use the service for any illegal purpose.</LI>
        </UL>
      </>
    ),
  },
  {
    id: "ip",
    title: "Intellectual property",
    body: (
      <P>
        The CashGPT app, its brand marks, layouts and content are owned by [COMPANY NAME] or
        its licensors. You receive a personal, non-transferable, revocable licence to use the
        app for its intended purpose. You may not copy, modify, distribute or create
        derivative works without written permission.
      </P>
    ),
  },
  {
    id: "third-parties",
    title: "Third-party offers, ads and shortlink networks",
    body: (
      <>
        <P>
          Offers, ads, surveys, tasks and content locker steps are delivered by independent
          third-party networks (for example AdBlueMedia, Mooffers, Affike, BitcoTasks, Revtoo
          and other partners we may add or remove at any time). We do not guarantee their
          availability, accuracy, reward, or that any specific offer will complete or credit
          successfully.
        </P>
        <P>
          <Strong>Shortlink / content-locker steps.</Strong> Some earning flows route through
          third-party ad-supported shortlink or content-locker networks that we do not control.
          Your interactions with those networks are governed by their own terms and privacy
          practices. We are not responsible for their content, ads, redirects or downtime.
        </P>
        <P>
          Any dispute about whether a third-party offer paid out correctly is ultimately
          decided by that third party's tracking system.
        </P>
      </>
    ),
  },
  {
    id: "limited-deal",
    title: "Limited-Deal cashback disclaimer",
    body: (
      <Callout tone="warn">
        <P>
          Some offers are marked as <Strong>Limited Deal</Strong>. These typically require you
          to pay a partner out of your own pocket first (for example, subscribing to a paid
          service or making a qualifying purchase) and then submit proof of completion to be
          reimbursed by us with an extra bonus.
        </P>
        <P>
          <Strong>
            Reimbursement of Limited-Deal offers is conditional on proof verification and is
            never guaranteed.
          </Strong>{" "}
          If your submitted proof is incomplete, unverifiable, appears manipulated, does not
          match the offer requirements, or if fraud is detected on the account, we may reject
          the reimbursement. In such cases, [COMPANY NAME] bears no liability for any
          out-of-pocket amount you spent with the partner. You accept this risk before
          committing your own money to any Limited-Deal offer.
        </P>
      </Callout>
    ),
  },
  {
    id: "taxes",
    title: "Taxes on your earnings",
    body: (
      <P>
        You are solely responsible for reporting and paying any personal income taxes, VAT or
        other levies that apply to the money you receive from CashGPT under the laws of your
        country of residence. This is separate from, and in addition to, any platform fees
        described in the Withdrawal &amp; Payout Policy. We may be required by law to provide
        tax documentation to authorities or to withhold amounts before payout in certain
        jurisdictions.
      </P>
    ),
  },
  {
    id: "warranty",
    title: "Disclaimer of warranties and limitation of liability",
    body: (
      <>
        <P>
          The service is provided <Strong>&quot;as is&quot;</Strong> and{" "}
          <Strong>&quot;as available&quot;</Strong> without warranties of any kind, whether
          express or implied. We do not warrant that the app will be uninterrupted,
          error-free, secure, or that any specific reward will be credited.
        </P>
        <P>
          To the maximum extent permitted by law, [COMPANY NAME] and its affiliates,
          directors, employees and agents will not be liable for any indirect, incidental,
          special, consequential or punitive damages, or for lost profits, goodwill or data,
          arising from your use of the service. Our total aggregate liability for any claim
          related to the service will not exceed the balance in your CashGPT wallet at the
          time the claim arose or USD $100, whichever is lower.
        </P>
      </>
    ),
  },
  {
    id: "suspension",
    title: "Suspension and termination",
    body: (
      <P>
        We may suspend, restrict or terminate your account at any time — with or without
        notice — if we reasonably believe you have breached these Terms, violated our anti-
        fraud rules, or created legal, security or reputational risk. In such cases any
        pending or accrued balance may be forfeited. You may close your account at any time
        by contacting [SUPPORT EMAIL].
      </P>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <P>
        We may update these Terms from time to time. The &quot;Last updated&quot; date at the
        top of this page tells you when the most recent change was made. Material changes will
        be highlighted in the app. Continuing to use CashGPT after a change takes effect means
        you accept the new Terms.
      </P>
    ),
  },
  {
    id: "law",
    title: "Governing law and disputes",
    body: (
      <P>
        These Terms are governed by the laws of [JURISDICTION], without regard to conflict-of-
        laws principles. Any dispute that cannot be resolved amicably will be brought before
        the competent courts of [JURISDICTION], unless mandatory local consumer-protection law
        provides otherwise.
      </P>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <P>
        Questions about these Terms? Reach us at{" "}
        <Strong>[SUPPORT EMAIL]</Strong>. For payout-specific questions please also review the
        Withdrawal &amp; Payout Policy.
      </P>
    ),
  },
];

function TermsPage() {
  return (
    <PolicyLayout
      title="Terms of Service"
      subtitle="The rules of using CashGPT."
      lastUpdated={LAST_UPDATED}
      sections={SECTIONS}
      siblings={SIBLINGS}
      intro={
        <>
          This is a plain-language summary of the rules for using CashGPT. Please read it
          carefully — by using the app you agree to be bound by these terms.
        </>
      }
      footer={
        <>
          This document is a professional draft, not legal advice. Given real-money payouts
          across multiple regions, [COMPANY NAME] should have this reviewed by a qualified
          lawyer before public release.
        </>
      }
    />
  );
}
