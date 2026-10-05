import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Camera, Check, Globe, Info, ListOrdered, Smartphone } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { BackLink, PreviewNotice, VerificationBadge } from "@/components/marketplace/Preview";
import { formatMoney } from "@/lib/coinquest";
import { campaignById } from "@/lib/marketplace/data";

export const Route = createFileRoute("/_authenticated/microtask/$id")({
  head: () => ({ meta: [{ title: "Task details — CashGPT" }] }),
  component: MicrotaskDetailPage,
});

const AUTO_FLOW = ["Start", "Complete", "Conversion Detected", "Reward Credited"];
const PROOF_FLOW = ["Start", "Complete", "Submit Proof", "Review", "Approved", "Reward Credited"];

function Flow({ steps }: { steps: string[] }) {
  return (
    <ol className="mt-3 flex flex-wrap items-center gap-y-2" data-testid="conversion-flow">
      {steps.map((step, i) => (
        <li key={step} className="flex items-center text-[11px] font-semibold">
          <span
            className={`rounded-full px-2.5 py-1 ${
              i === 0 ? "bg-jade-gradient text-primary-foreground" : "bg-background-alt text-foreground"
            }`}
          >
            {step}
          </span>
          {i < steps.length - 1 && <span className="mx-1 text-muted-foreground">→</span>}
        </li>
      ))}
    </ol>
  );
}

function MicrotaskDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const c = campaignById(id);

  if (!c) {
    return (
      <AppShell subtitle="Tasks">
        <BackLink to="/task" label="Back to Microtasks" />
        <p className="mt-8 text-center text-sm text-muted-foreground">That task isn't available.</p>
      </AppShell>
    );
  }

  const proof = c.verification === "proof";

  return (
    <AppShell subtitle="Tasks" mainClass="page-fade-in">
      <BackLink to="/task" label="Back to Microtasks" />
      <PreviewNotice className="mt-3" />

      <section className="premium-step-in mt-3 rounded-3xl bg-jade-gradient p-5 text-primary-foreground shadow-lift">
        <VerificationBadge verification={c.verification} size="md" />
        <h1 className="mt-3 text-xl leading-tight">{c.title}</h1>
        <p className="text-amount mt-2 text-3xl leading-none text-gold">{formatMoney(c.reward)}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <p className="inline-flex items-center gap-1.5 rounded-xl bg-primary-foreground/10 px-3 py-2">
            <Globe className="size-3.5" /> {c.countryFlag} {c.country}
          </p>
          <p className="inline-flex items-center gap-1.5 rounded-xl bg-primary-foreground/10 px-3 py-2">
            <Smartphone className="size-3.5" /> {c.device}
          </p>
        </div>
      </section>

      <SectionHeading variant="ribbon" icon={Info} title="About This Task" />
      <div className="surface-card p-4 text-sm leading-relaxed text-muted-foreground">{c.about}</div>

      <SectionHeading variant="ribbon" icon={ListOrdered} title="Complete These Steps" />
      <ol className="surface-card space-y-3 p-4">
        {c.steps.map((step, i) => (
          <li key={step} className="flex gap-3 text-sm">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {i + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>

      <div className="surface-card mt-3 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          How you get paid
        </p>
        <Flow steps={proof ? PROOF_FLOW : AUTO_FLOW} />
        <p className="mt-3 text-xs text-muted-foreground">
          {proof
            ? "A reviewer checks your proof, usually within 48 hours. Approved rewards go straight to your wallet."
            : "No screenshots needed — completion is detected automatically and the reward is credited to your wallet."}
        </p>
      </div>

      <SectionHeading variant="ribbon" icon={AlertTriangle} title="Important Rules" />
      <ul className="surface-card space-y-2 p-4 text-sm">
        {c.rules.map((rule) => (
          <li key={rule} className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" /> <span>{rule}</span>
          </li>
        ))}
      </ul>

      {proof && c.proofRequirements && (
        <>
          <SectionHeading variant="ribbon" icon={Camera} title="Proof Requirements" />
          <ul className="surface-card space-y-2 border-gold/40 bg-gold/5 p-4 text-sm">
            {c.proofRequirements.map((req) => (
              <li key={req} className="flex gap-2">
                <Camera className="mt-0.5 size-4 shrink-0 text-gold-dark" /> <span>{req}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="sticky bottom-24 mt-6">
        {proof ? (
          <Button
            variant="gold"
            size="lg"
            className="w-full"
            data-testid="start-complete-btn"
            onClick={() => navigate({ to: "/microtask-proof/$id", params: { id: c.id } })}
          >
            Start & Complete
          </Button>
        ) : (
          <Button
            variant="jade"
            size="lg"
            className="w-full"
            data-testid="start-task-btn"
            onClick={() => navigate({ to: "/microtask-proof/$id", params: { id: c.id } })}
          >
            Start Task
          </Button>
        )}
      </div>

      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        Have a submission that was rejected?{" "}
        <Link to="/my-submissions" className="font-semibold text-primary">
          See My Submissions
        </Link>
      </p>
    </AppShell>
  );
}