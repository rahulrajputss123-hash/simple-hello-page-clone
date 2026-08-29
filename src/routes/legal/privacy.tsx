import { createFileRoute } from "@tanstack/react-router";

import { LI, P, PolicyLayout, Strong, UL, type PolicySection } from "./-policy-layout";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — CashGPT" },
      {
        name: "description",
        content:
          "How CashGPT collects, uses and shares data — including third-party offer network requirements.",
      },
      { property: "og:title", content: "Privacy Policy — CashGPT" },
      {
        property: "og:description",
        content: "Learn what data CashGPT collects and how it is used.",
      },
    ],
  }),
  component: PrivacyPage,
});

const LAST_UPDATED = "January 15, 2026";

const SIBLINGS = [
  { href: "/legal/terms", label: "Terms of Service" },
  { href: "/legal/referral-terms", label: "Referral Terms" },
  { href: "/legal/withdrawal-policy", label: "Withdrawal & Payout Policy" },
];

const SECTIONS: PolicySection[] = [
  {
    id: "data-collected",
    title: "What data we collect",
    body: (
      <>
        <P>To provide the CashGPT service we collect the following:</P>
        <UL>
          <LI>
            <Strong>Account information</Strong> — your email address, chosen name and any
            profile details you provide.
          </LI>
          <LI>
            <Strong>Device information</Strong> — device model, operating system version, app
            version and language.
          </LI>
          <LI>
            <Strong>Network information</Strong> — your IP address and approximate location
            derived from it, used for geo-targeting offers and for anti-fraud checks.
          </LI>
          <LI>
            <Strong>Usage and analytics data</Strong> — screens visited, offers viewed and
            claimed, ads watched, taps on rewarded elements, session timing.
          </LI>
          <LI>
            <Strong>Offer-completion data</Strong> — a unique user identifier, the offer id,
            the reward amount and, where relevant, a proof file that you upload yourself.
          </LI>
          <LI>
            <Strong>Payout details</Strong> — the payout method you choose (PayPal email,
            crypto wallet address or gift-card recipient) and payout history.
          </LI>
          <LI>
            <Strong>Device fingerprinting data</Strong> for fraud prevention — including but
            not limited to hashed hardware identifiers, screen and locale fingerprint,
            emulator / VPN / proxy signals and behavioural patterns. This data is used only
            to protect the reward economy and never sold.
          </LI>
        </UL>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "How we use your data",
    body: (
      <UL>
        <LI>Providing and improving the service, including personalising offers you see.</LI>
        <LI>Verifying that offers were completed genuinely and crediting the correct reward.</LI>
        <LI>Detecting and preventing fraud, multi-accounting, VPN/emulator abuse and reward manipulation.</LI>
        <LI>Communicating with you about your account, rewards, security notices and (with your consent) marketing.</LI>
        <LI>Complying with legal obligations and resolving disputes.</LI>
      </UL>
    ),
  },
  {
    id: "third-parties",
    title: "Third-party sharing (functionally required)",
    body: (
      <>
        <P>
          <Strong>
            Completing an offer requires that we share a user identifier and completion data
            with the relevant third-party offer or ad network.
          </Strong>{" "}
          This is how the network verifies the completion and tells us to credit your reward.
          It is functionally necessary — not optional — for offer-based earning to work. The
          networks we currently work with include AdBlueMedia, Mooffers, Affike, BitcoTasks,
          Revtoo and other partners we may add or remove over time.
        </P>
        <P>
          We may also share limited data with:
        </P>
        <UL>
          <LI>Payout providers (PayPal, crypto networks, gift-card issuers) so they can deliver your money.</LI>
          <LI>Cloud infrastructure and analytics providers acting on our behalf under confidentiality obligations.</LI>
          <LI>Authorities where required by law.</LI>
        </UL>
        <P>We do not sell your personal data.</P>
      </>
    ),
  },
  {
    id: "retention",
    title: "Data retention",
    body: (
      <P>
        We retain your account and transaction data for as long as your account is active and
        for a reasonable period after closure to comply with legal, tax, anti-fraud and
        dispute-resolution obligations. Anonymised analytics may be kept for longer to help
        us improve the service.
      </P>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <P>You may:</P>
        <UL>
          <LI>Access the personal data we hold about you.</LI>
          <LI>Correct inaccurate information in your profile.</LI>
          <LI>Request deletion of your account and associated personal data, subject to legal record-keeping obligations.</LI>
          <LI>Withdraw consent for optional marketing communications at any time.</LI>
        </UL>
        <P>
          To exercise any of these rights, email <Strong>[SUPPORT EMAIL]</Strong> from the
          address associated with your account.
        </P>
      </>
    ),
  },
  {
    id: "children",
    title: "Children's privacy",
    body: (
      <P>
        CashGPT is not intended for users under [MIN AGE] years old. We do not knowingly
        collect data from anyone below that age. If you believe a minor has created an
        account, please contact [SUPPORT EMAIL] and we will remove it.
      </P>
    ),
  },
  {
    id: "security",
    title: "Security measures",
    body: (
      <P>
        We use industry-standard technical and organisational measures — including encryption
        in transit, restricted internal access and continuous monitoring — to protect your
        data. No online service can guarantee absolute security, so please use a strong
        password and notify us of anything suspicious.
      </P>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and tracking",
    body: (
      <P>
        The CashGPT app and its web surfaces use cookies, local storage and similar
        technologies for authentication, session management, remembering preferences and
        basic analytics. You can clear these at any time from your device settings; doing so
        may sign you out of the app.
      </P>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <P>
        We may update this Privacy Policy from time to time. The &quot;Last updated&quot;
        date at the top of the page reflects the most recent change. Material updates will
        be highlighted inside the app.
      </P>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <P>
        Questions or requests about this Privacy Policy? Reach us at{" "}
        <Strong>[SUPPORT EMAIL]</Strong>.
      </P>
    ),
  },
];

function PrivacyPage() {
  return (
    <PolicyLayout
      title="Privacy Policy"
      subtitle="What we collect, why we collect it, and who we share it with."
      lastUpdated={LAST_UPDATED}
      sections={SECTIONS}
      siblings={SIBLINGS}
      intro={
        <>
          Your data powers the rewards you earn on CashGPT. We keep the collection focused,
          the sharing minimal, and the fraud-prevention strict.
        </>
      }
      footer={
        <>
          This is a professional draft, not legal advice. Please have it reviewed by a
          qualified lawyer familiar with your target jurisdictions before publishing.
        </>
      }
    />
  );
}
