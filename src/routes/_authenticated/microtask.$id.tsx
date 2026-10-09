import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Camera, Check, Globe, Info, ListOrdered, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BackLink, VerificationBadge } from "@/components/marketplace/Preview";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/coinquest";
import { listActiveCampaigns, recordClick } from "@/lib/marketplace.functions";

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
  const { session } = useAuth();
  const navigate = useNavigate();
  const fetchCampaigns = useServerFn(listActiveCampaigns);
  const clickFn = useServerFn(recordClick);

  const campaigns = useQuery({
    queryKey: ["active-campaigns", session?.user.id],
    queryFn: () => fetchCampaigns({}),
    enabled: Boolean(session),
  });

  const clickMutation = useMutation({
    mutationFn: () =>
      clickFn({
        data: {
          campaignId: id,
          ipAddress: "0.0.0.0", // Server will hash this
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        },
      }),
    onSuccess: (result) => {
      // For auto-verified, the advertiser's tracking URL would include this click_id
      // In a real implementation, open the advertiser's landing page with ?click_id=...
      // For now, show a success message
      toast.success("Task started! Complete it and your reward will be credited automatically.");
      // TODO: Navigate to advertiser's landing page with click_id
      console.log("[microtask] click_id:", result.clickId);
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error("Couldn't start task", { description: msg });
    },
  });

  const c = campaigns.data?.find((campaign) => campaign.id === id);

  if (campaigns.isPending) {
    return (
      <AppShell subtitle="Tasks" mainClass="page-fade-in">
        <BackLink to="/task" label="Back to Microtasks" />
        <Skeleton className="mt-3 h-48 rounded-3xl" />
        <Skeleton className="mt-3 h-32 rounded-2xl" />
      </AppShell>
    );
  }

  if (!c) {
    return (
      <AppShell subtitle="Tasks">
        <BackLink to="/task" label="Back to Microtasks" />
        <p className="mt-8 text-center text-sm text-muted-foreground">That task isn't available.</p>
      </AppShell>
    );
  }

  const proof = c.verification === "proof";
  const countryFlag = c.countries[0] === "*" ? "🌍" : "🇺🇸";
  const countryLabel = c.countries[0] === "*" ? "Worldwide" : c.countries.join(", ");

  return (
    <AppShell subtitle="Tasks" mainClass="page-fade-in">
      <BackLink to="/task" label="Back to Microtasks" />

      <section className="premium-step-in mt-3 rounded-3xl bg-jade-gradient p-5 text-primary-foreground shadow-lift">
        <VerificationBadge verification={c.verification} size="md" />
        <h1 className="mt-3 text-xl leading-tight">{c.title}</h1>
        <p className="text-amount mt-2 text-3xl leading-none text-gold">{formatMoney(c.reward)}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <p className="inline-flex items-center gap-1.5 rounded-xl bg-primary-foreground/10 px-3 py-2">
            <Globe className="size-3.5" /> {countryFlag} {countryLabel}
          </p>
          <p className="inline-flex items-center gap-1.5 rounded-xl bg-primary-foreground/10 px-3 py-2">
            <Smartphone className="size-3.5" /> {proof ? "Mobile" : "Any device"}
          </p>
        </div>
      </section>

      <SectionHeading
          variant="ribbon"
          icon={Info}
          iconSrc="/icons/icon-document-info.png"
          title="About This Task"
        />
      <div className="surface-card p-4 text-sm leading-relaxed text-muted-foreground">{c.description}</div>

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
            onClick={() => clickMutation.mutate()}
            disabled={clickMutation.isPending}
          >
            {clickMutation.isPending ? "Starting..." : "Start Task"}
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
