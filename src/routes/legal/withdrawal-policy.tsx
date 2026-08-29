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

export const Route = createFileRoute("/legal/withdrawal-policy")({
  head: () => ({
    meta: [
      { title: "Withdrawal & Payout Policy — CashGPT" },
      {
        name: "description",
        content:
          "CashGPT withdrawal thresholds, processing timelines, payout methods, rejections and fees.",
      },
      { property: "og:title", content: "Withdrawal & Payout Policy — CashGPT" },
      {
        property: "og:description",
        content: "How CashGPT payouts work — limits, timelines, methods and fees.",
      },
    ],
  }),
  component: WithdrawalPage,
});

const LAST_UPDATED = "January 15, 2026";

const SIBLINGS = [
  { href: "/legal/terms", label: "Terms of Service" },
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/referral-terms", label: "Referral Terms" },
];

const SECTIONS: PolicySection[] = [
  {
    id: "limits",
    title: "Withdrawal limits &amp; eligibility",
    body: (
      <UL>
        <LI>
          Minimum withdrawal amounts range from <Strong>$5 to $35</Strong> depending on
          regional dynamics and geo-location settings.
        </LI>
        <LI>
          Users must reach the exact minimum threshold visible in their personal app
          dashboard to unlock the cashout request button.
        </LI>
        <LI>
          Daily maximum withdrawal limit is capped at <Strong>$100 per user account</Strong>.
        </LI>
      </UL>
    ),
  },
  {
    id: "timelines",
    title: "Processing timelines &amp; status",
    body: (
      <>
        <P>
          Standard Payouts are <Strong>INSTANTLY</Strong> processed directly to your account.
          In cases of high network traffic or server load, processing may take up to{" "}
          <Strong>24 hours</Strong>.
        </P>
        <P>Status meanings:</P>
        <UL>
          <LI>
            <Strong>Instant / Processing</Strong> — System routing transaction to your
            account.
          </LI>
          <LI>
            <Strong>Queued / Pending</Strong> — Delayed due to high server traffic
            (resolves within 24 hours).
          </LI>
          <LI>
            <Strong>Completed</Strong> — Funds successfully transferred.
          </LI>
          <LI>
            <Strong>Rejected</Strong> — Account flagged for policy violation or invalid
            wallet / email details.
          </LI>
        </UL>
      </>
    ),
  },
  {
    id: "methods",
    title: "Supported payout methods",
    body: (
      <UL>
        <LI>
          <Strong>PayPal</Strong> — Minimum $5 - $35 (depends on region). Account email must
          match payout email.
        </LI>
        <LI>
          <Strong>Crypto (USDT / Litecoin)</Strong> — Minimum $10 - $35. Network transaction
          fees may be deducted automatically.
        </LI>
        <LI>
          <Strong>Gift Cards (Amazon, Google Play)</Strong> — Minimum $5 - $25 (subject to
          regional inventory availability).
        </LI>
      </UL>
    ),
  },
  {
    id: "rejections",
    title: "Payout rejections &amp; disqualifications",
    body: (
      <UL>
        <LI>
          Payouts will fail or be permanently cancelled if the user&apos;s account is
          detected using <Strong>VPN, Proxy, Emulators, or Multiple Accounts</Strong> on a
          single device.
        </LI>
        <LI>
          Incorrect payment details (e.g., wrong PayPal email or invalid crypto address) will
          result in payment failure, and fees may not be refundable.
        </LI>
        <LI>
          Unclaimed gift card codes expire after <Strong>30 days</Strong> of issuance.
        </LI>
      </UL>
    ),
  },
  {
    id: "fees",
    title: "Fees",
    body: (
      <>
        <Callout tone="warn">
          <P>
            <Strong>Platform fee.</Strong> A <Strong>10% platform fee</Strong> is deducted
            from each withdrawal / payout. The amount you receive is therefore 90% of your
            requested payout, before any additional method-specific fees below.
          </P>
        </Callout>
        <P>
          <Strong>Instant withdrawal processing fee.</Strong> An additional fee of{" "}
          <Strong>[INSTANT WITHDRAWAL FEE]</Strong> applies for the faster instant-processing
          option. Choosing the standard timeline instead avoids this specific fee.
        </P>
        <P>
          <Strong>Region and network fees.</Strong> Additional transaction fees or taxes may
          apply depending on your region and the specific payout method&apos;s network
          requirements — for example, blockchain gas / miner fees for crypto payouts, or
          local payment-processor surcharges. These vary by location and payout method and
          are outside [COMPANY NAME]&apos;s control; they are deducted by the underlying
          network / processor, not by us.
        </P>
        <P>
          These fees are separate from any personal income taxes you may owe on your
          earnings — see the &quot;Taxes on your earnings&quot; section of the{" "}
          <Strong>Terms of Service</Strong>.
        </P>
      </>
    ),
  },
];

function WithdrawalPage() {
  return (
    <PolicyLayout
      title="Withdrawal & Payout Policy"
      subtitle="How and when your CashGPT wallet turns into real money."
      lastUpdated={LAST_UPDATED}
      sections={SECTIONS}
      siblings={SIBLINGS}
      intro={
        <>
          These rules apply to every payout regardless of the method you choose. Please
          double-check your payout details — mistakes here are the #1 cause of failed
          payments.
        </>
      }
      footer={
        <>
          This is a professional draft, not legal advice. Given real-money payouts across
          multiple regions, please have this reviewed by a qualified lawyer before public
          release.
        </>
      }
    />
  );
}
