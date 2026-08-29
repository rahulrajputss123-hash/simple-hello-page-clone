import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, ExternalLink, Home, Loader2, XCircle } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { completeShortlinkStep, startShortlinkStep } from "@/lib/quests.functions";
import { formatMoney } from "@/lib/coinquest";

/**
 * Return page from a shortlink network. Auto-runs completeShortlinkStep on mount.
 * If the step is not final, offers a button to open the next shortlink.
 * If final, shows a success screen with the credited reward.
 */
export const Route = createFileRoute("/_authenticated/go/$questKey/$step")({
  head: () => ({
    meta: [
      { title: "Quest step — CashGPT" },
      { name: "description", content: "Return page for the CashGPT shortlink chain quests." },
    ],
  }),
  component: GoPage,
});

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | {
      kind: "success";
      completed: boolean;
      credited: boolean;
      reward: number;
      nextStep: number | null;
      nextUrl?: string | null;
    };

function GoPage() {
  const { questKey, step } = Route.useParams();
  const navigate = useNavigate();
  const complete = useServerFn(completeShortlinkStep);
  const openNext = useServerFn(startShortlinkStep);
  const [state, setState] = useState<State>({ kind: "loading" });
  const [openingNext, setOpeningNext] = useState(false);
  const stepNum = Number(step);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await complete({ data: { questKey, step: stepNum } });
        if (cancelled) return;
        setState({ kind: "success", ...result });
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Could not verify this step. Please try again.";
        setState({ kind: "error", message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [complete, questKey, stepNum]);

  const goHome = () => navigate({ to: "/home" });

  const handleOpenNext = async () => {
    if (state.kind !== "success" || state.nextStep == null) return;
    setOpeningNext(true);
    try {
      const result = await openNext({
        data: { questKey, step: state.nextStep },
      });
      if (result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      }
      goHome();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not open the next step.";
      setState({ kind: "error", message });
    } finally {
      setOpeningNext(false);
    }
  };

  return (
    <AppShell subtitle="Quest step">
      <div
        className="mt-6 flex flex-col items-center gap-4 text-center"
        data-testid={`go-page-${questKey}-${stepNum}`}
      >
        {state.kind === "loading" && (
          <>
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verifying step {stepNum}…</p>
          </>
        )}

        {state.kind === "error" && (
          <>
            <XCircle className="size-10 text-destructive" data-testid="go-error-icon" />
            <p className="text-lg font-semibold">Step could not be verified</p>
            <p className="text-sm text-muted-foreground" data-testid="go-error-message">
              {state.message}
            </p>
            <Button variant="jade" onClick={goHome} data-testid="go-back-home">
              <Home className="mr-1 size-4" /> Back to home
            </Button>
          </>
        )}

        {state.kind === "success" && state.completed && (
          <>
            <div className="text-5xl" role="img" aria-label="party">
              🎉
            </div>
            <p className="text-lg font-semibold" data-testid="go-quest-completed">
              Quest completed!
            </p>
            <p className="text-amount text-gold-dark">
              {formatMoney(state.reward)} credited to your wallet.
            </p>
            <Button variant="jade" onClick={goHome} data-testid="go-back-home">
              <Home className="mr-1 size-4" /> Back to home
            </Button>
          </>
        )}

        {state.kind === "success" && !state.completed && (
          <>
            <CheckCircle2 className="size-10 text-primary" />
            <p className="text-lg font-semibold">Step {stepNum} done</p>
            <p className="text-sm text-muted-foreground">
              Continue to step {state.nextStep} to keep going.
            </p>
            <div className="flex gap-2">
              <Button
                variant="jade"
                disabled={openingNext || !state.nextStep}
                onClick={handleOpenNext}
                data-testid="go-open-next"
              >
                {openingNext ? "Opening…" : `Open Step ${state.nextStep}`}
                <ExternalLink className="ml-1 size-4" />
              </Button>
              <Button variant="outline" onClick={goHome} data-testid="go-back-home">
                <Home className="mr-1 size-4" /> Home
              </Button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
