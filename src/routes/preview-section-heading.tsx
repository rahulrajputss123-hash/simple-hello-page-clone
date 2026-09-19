/**
 * TEMPORARY preview-only route for visually reviewing the ribbon SectionHeading
 * rollout without Supabase auth (every real screen is behind /_authenticated).
 *
 * Renders the real component with the real props from each screen, so what you
 * see here is what those screens render. Safe to delete once approved.
 */
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  Bell,
  FileText,
  Gift,
  HelpCircle,
  Layers,
  LifeBuoy,
  ListChecks,
  Mail,
  Plus,
  Receipt,
  Rocket,
  Settings,
  Star,
  Tag,
  Ticket,
  Users,
  Wallet,
} from "lucide-react";

import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/preview-section-heading")({
  ssr: false,
  component: PreviewSectionHeading,
});

function Filler() {
  return <div className="h-10 rounded-2xl border border-dashed border-primary/20" />;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 mt-8 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

function PreviewSectionHeading() {
  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto w-full max-w-[420px]">
        <p className="text-xs text-muted-foreground">
          Preview only — not a real app route. Every heading below uses the real component.
        </p>

        <Label>Hierarchy: page ribbon (larger) vs section ribbons</Label>
        <SectionHeading
          variant="ribbon"
          size="page"
          icon={Tag}
          iconSrc="/icons/icon-offers.png"
          title="Offers"
          subtitle="Complete partner offers for bigger payouts."
        />
        <SectionHeading
          variant="ribbon"
          icon={Star}
          iconSrc="/icons/icon-featured-offers.png"
          title="Featured Offers"
        />
        <Filler />
        <SectionHeading
          variant="ribbon"
          icon={Layers}
          iconSrc="/icons/icon-offerwall.png"
          title="Offerwall"
        />
        <Filler />

        <Label>Home (approved reference — must look unchanged)</Label>
        <SectionHeading
          variant="ribbon"
          icon={Rocket}
          iconSrc="/icons/icon-starter-quest.png"
          title="Starter Quests"
          subtitle="Complete simple quests and earn rewards!"
        />
        <Filler />

        <Label>With an action button — fits inline at this width</Label>
        <SectionHeading
          variant="ribbon"
          icon={Wallet}
          iconSrc="/icons/icon-wallet.png"
          title="Withdraw"
          action={
            <Button size="sm" variant="outline" className="gap-1">
              <Plus className="size-3.5" /> Method
            </Button>
          }
        />
        <Filler />

        <Label>Same heading at 300px — action should drop to its own line</Label>
        <div className="w-[300px] border-l-2 border-dashed border-destructive/30 pl-1">
          <SectionHeading
            variant="ribbon"
            icon={Wallet}
            iconSrc="/icons/icon-wallet.png"
            title="Withdraw"
            action={
              <Button size="sm" variant="outline" className="gap-1">
                <Plus className="size-3.5" /> Method
              </Button>
            }
          />
        </div>

        <Label>Long subtitle wraps to 2 lines, never truncated</Label>
        <SectionHeading
          variant="ribbon"
          size="page"
          icon={ListChecks}
          iconSrc="/icons/icon-your-task.png"
          title="Your tasks"
          subtitle="Work through the list to unlock rewards. This subtitle is deliberately long so you can confirm it wraps cleanly instead of being cut off."
        />
        <Filler />

        <Label>Longest real title + a templated title</Label>
        <SectionHeading
          variant="ribbon"
          size="page"
          icon={Users}
          iconSrc="/icons/icon-referral.png"
          title="Refer & Earn"
          subtitle="Invite friends, get rewarded together"
        />
        <SectionHeading
          variant="ribbon"
          icon={Gift}
          iconSrc="/icons/icon-how-you-earn.png"
          title="How you earn $3.00"
        />
        <Filler />

        <Label>Icon-only headings (no iconSrc artwork)</Label>
        <SectionHeading variant="ribbon" size="page" icon={Bell} title="Notifications" />
        <SectionHeading variant="ribbon" icon={ArrowDownToLine} title="Withdrawals" />
        <SectionHeading variant="ribbon" icon={Receipt} title="Transactions" />
        <Filler />

        <Label>Remaining real headings</Label>
        <SectionHeading
          variant="ribbon"
          size="page"
          icon={LifeBuoy}
          iconSrc="/icons/icon-support.png"
          title="Help centre"
        />
        <SectionHeading
          variant="ribbon"
          icon={HelpCircle}
          iconSrc="/icons/icon-faq.png"
          title="FAQ"
        />
        <SectionHeading
          variant="ribbon"
          icon={Mail}
          iconSrc="/icons/icon-contact-us.png"
          title="Contact us"
        />
        <SectionHeading
          variant="ribbon"
          icon={Ticket}
          iconSrc="/icons/icon-your-tickets.png"
          title="Your tickets"
        />
        <SectionHeading
          variant="ribbon"
          icon={Settings}
          iconSrc="/icons/icon-profile.png"
          title="Settings"
        />
        <SectionHeading
          variant="ribbon"
          icon={FileText}
          iconSrc="/icons/icon-terms-conditions.png"
          title="Terms & conditions"
        />
        <Filler />

        <Label>320px stress test — title truncates, nothing overflows</Label>
        <div className="w-[320px] border-l-2 border-dashed border-destructive/30 pl-1">
          <SectionHeading
            variant="ribbon"
            size="page"
            icon={Layers}
            title="A Deliberately Very Long Section Title"
            subtitle="Subtitle stays readable and wraps below the ribbon."
          />
        </div>

        <Label>Old default variant, kept for comparison (still in the code)</Label>
        <SectionHeading
          icon={Rocket}
          iconSrc="/icons/icon-starter-quest.png"
          title="Starter Quests"
          subtitle="Complete simple quests and earn rewards!"
        />
        <Filler />
      </div>
    </div>
  );
}
