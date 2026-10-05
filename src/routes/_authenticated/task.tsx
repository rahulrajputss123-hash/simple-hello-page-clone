import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Clock, ListChecks, MapPin, Smartphone } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { PreviewNotice, VerificationBadge } from "@/components/marketplace/Preview";
import { formatMoney } from "@/lib/coinquest";
import { CAMPAIGNS, MY_SUBMISSIONS } from "@/lib/marketplace/data";

/**
 * Microtasks marketplace (publisher-facing). The original quest/task system
 * now lives under /special, unchanged.
 */
export const Route = createFileRoute("/_authenticated/task")({
  head: () => ({
    meta: [
      { title: "Microtasks — CashGPT" },
      { name: "description", content: "Short tasks from advertisers that pay into your wallet." },
      { property: "og:title", content: "Microtasks — CashGPT" },
      {
        property: "og:description",
        content: "Short tasks from advertisers that pay into your wallet.",
      },
    ],
  }),
  component: MicrotasksPage,
});

function MicrotasksPage() {
  const pending = MY_SUBMISSIONS.filter((s) => s.status !== "approved").length;
  return (
    <AppShell subtitle="Tasks" mainClass="page-fade-in">
      <SectionHeading
        variant="ribbon"
        size="page"
        icon={ListChecks}
        iconSrc="/icons/icon-your-task.png"
        title="Microtasks"
        subtitle="Quick tasks from advertisers — earn in minutes."
        className="mb-2"
      />
      <PreviewNotice />

      <Link
        to="/my-submissions"
        data-testid="my-submissions-link"
        className="surface-card mt-3 flex items-center justify-between gap-3 p-3.5"
      >
        <span className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-gold/15">
            <Clock className="size-4 text-gold-dark" />
          </span>
          <span>
            <span className="block text-sm font-semibold">My Submissions</span>
            <span className="block text-xs text-muted-foreground">
              {pending} awaiting review or action
            </span>
          </span>
        </span>
        <ChevronRight className="size-4 text-muted-foreground" />
      </Link>

      <SectionHeading variant="ribbon" icon={ListChecks} title="Available tasks" />
      <ol className="stagger-children space-y-3" data-testid="microtask-list">
        {CAMPAIGNS.map((c) => (
          <li key={c.id}>
            <Link
              to="/microtask/$id"
              params={{ id: c.id }}
              data-testid={`microtask-card-${c.id}`}
              className="surface-card hover-lift press-feedback block p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <VerificationBadge verification={c.verification} />
                  <p className="mt-1.5 truncate font-semibold">{c.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.description}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-amount text-lg leading-none text-gold-dark">
                    {formatMoney(c.reward)}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{c.estimatedTime}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" /> {c.countryFlag} {c.country}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Smartphone className="size-3" /> {c.device}
                </span>
                {c.slotsLeft !== null && (
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 font-semibold ${
                      c.slotsLeft < 20 ? "bg-destructive/10 text-destructive" : "bg-background-alt"
                    }`}
                  >
                    {c.slotsLeft} slots left
                  </span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </AppShell>
  );
}