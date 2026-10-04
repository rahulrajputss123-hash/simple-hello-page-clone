import { createFileRoute, Link } from "@tanstack/react-router";
import { HelpCircle, LifeBuoy, Mail } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BackLink, PreviewNotice } from "@/components/marketplace/Preview";

export const Route = createFileRoute("/_authenticated/advertiser/help")({
  head: () => ({ meta: [{ title: "Advertiser Help — CashGPT" }] }),
  component: AdvertiserHelpPage,
});

const FAQ: [string, string][] = [
  [
    "How do campaigns get approved?",
    "Every new campaign is reviewed by the CashGPT team, usually within one business day. You'll see it under My Campaigns → Active once it's live.",
  ],
  [
    "When is my Campaign Balance charged?",
    "Only when a publisher completes your task — on auto-verified completion, or when you approve a proof submission. Clicks and starts are free.",
  ],
  [
    "Manual Proof vs Auto Verified — which should I pick?",
    "Auto Verified is best for installs, video views and surveys we can detect automatically. Manual Proof fits sign-ups, follows and reviews where a screenshot is the evidence.",
  ],
  [
    "Can I pause a campaign?",
    "Yes. Pausing stops new publishers from starting your task. Anyone who already started can still finish and be paid.",
  ],
  [
    "What happens to unused Campaign Funds?",
    "They stay in your Campaign Balance and can be used for any future campaign.",
  ],
];

function AdvertiserHelpPage() {
  return (
    <AppShell subtitle="Advertiser" mainClass="page-fade-in">
      <BackLink to="/home" label="Back to dashboard" />
      <SectionHeading
        variant="ribbon"
        size="page"
        icon={LifeBuoy}
        iconSrc="/icons/icon-support.png"
        title="Advertiser Help"
        className="mb-2"
      />
      <PreviewNotice />

      <SectionHeading variant="ribbon" icon={HelpCircle} iconSrc="/icons/icon-faq.png" title="FAQ" />
      <div className="surface-card px-4">
        <Accordion type="single" collapsible>
          {FAQ.map(([q, a]) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger className="text-left text-sm">{q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <SectionHeading variant="ribbon" icon={Mail} iconSrc="/icons/icon-contact-us.png" title="Contact us" />
      <div className="surface-card p-4 text-sm text-muted-foreground">
        Need help with a campaign? Our regular support team handles advertiser questions too.
        <Link to="/support" className="mt-2 block font-semibold text-primary">
          Open Help centre →
        </Link>
      </div>
    </AppShell>
  );
}