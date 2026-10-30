import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, Home, Loader2, XCircle } from "lucide-react";
import { z } from "zod";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { completeLockerQuest, startLockerQuest } from "@/lib/quests.functions";
import { formatReward } from "@/lib/format-reward";
import { useAuth } from "@/lib/auth";
import { isNativePlatform } from "@/lib/platform";

/**
 * Return page for Content Locker quests.
 *
 * AdBlueMedia's static "Redirect URL" must be set (once, in their dashboard) to:
 *   https://<your-domain>/go/locker/return?questKey=<your-quest-key>
 *
 * Because AdBlueMedia does not support per-session macros in the Redirect URL
 * field, we identify the session by matching the currently authenticated user's
 * most recent 'started' locker session for the given questKey.
 * See completeLockerQuestImpl in quests.server.ts for the known limitation
 * around concurrent sessions on multiple tabs/devices.
 */
export const Route = createFileRoute("/_authenticated/go/locker/return")({
  validateSearch: z.object({
    questKey: z.string().min(1).max(40).optional(),
  }),
  head: () => ({
    meta: [
      { title: "Reward — CashGPT" },
      { name: "description", content: "Content locker quest return page." },
    ],
  }),
  component: LockerReturnPage,
});

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  /** One locker in a multi-locker chain finished; show "Open Locker N+1" button. */
  | { kind: "advancing"; step: number; total: number; nextStep: number; nextUrl: string }
  | { kind: "success"; reward: number };

function LockerReturnPage() {
  const { questKey } = useSearch({ from: "/_authenticated/go/locker/return" });
  const navigate = useNavigate();
  const complete = useServerFn(completeLockerQuest);
  const openNext = useServerFn(startLockerQuest);
  const [state, setState] = useState<State>({ kind: "loading" });
  const [openingNext, setOpeningNext] = useState(false);
  const queryClient = useQueryClient();
  const { session } = useAuth();

  useEffect(() => {
    if (!questKey) {
      setState({ kind: "error", message: "Missing questKey parameter in the redirect URL." });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const result = await complete({ data: { questKey, isNative: isNativePlatform() } });
        if (cancelled) return;

        // Multi-locker chain: more lockers to go. Show "Locker N done" and "Open Locker N+1" button
        // instead of auto-redirecting, matching the shortlink UX.
        if (!result.completed && result.nextUrl) {
          setState({
            kind: "advancing",
            step: result.step,
            total: result.total,
            nextStep: result.nextStep as number,
            nextUrl: result.nextUrl,
          });
          // Invalidate to show progress immediately
          void queryClient.invalidateQueries({ queryKey: ["quest-sessions", session?.user.id] });
          return;
        }

        // Chain finished (or a single-locker quest) — reward is credited.
        if (!result.completed) {
          setState({
            kind: "error",
            message: "That locker is done, but the next one is not configured. Contact support.",
          });
          return;
        }

        setState({ kind: "success", reward: result.reward });

        // Invalidate queries to show wallet credit immediately
        void queryClient.invalidateQueries({ queryKey: ["profile"] });
        void queryClient.invalidateQueries({ queryKey: ["quest-sessions", session?.user.id] });
        void queryClient.invalidateQueries({ queryKey: ["quests-active"] });
        void queryClient.invalidateQueries({ queryKey: ["transactions"] });
        void queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });

        // Auto-redirect to home after 3 seconds.
        setTimeout(() => {
          if (!cancelled) void navigate({ to: "/home" });
        }, 3000);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error
            ? err.message
            : "Could not verify your locker completion. Please try again.";
        setState({ kind: "error", message });
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questKey]);

  const goHome = () => void navigate({ to: "/home" });

  const handleOpenNext = async () => {
    if (state.kind !== "advancing" || !questKey) return;
    setOpeningNext(true);
    try {
      const result = await openNext({ data: { questKey, isNative: isNativePlatform() } });
      if (!("unavailable" in result) && result.lockerUrl) {
        window.open(result.lockerUrl, "_blank", "noopener,noreferrer");
      }
      goHome();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not open the next locker.";
      setState({ kind: "error", message });
    } finally {
      setOpeningNext(false);
    }
  };

  return (
    <AppShell subtitle="Quest reward">
      <div
        className="mt-6 flex flex-col items-center gap-4 text-center"
        data-testid="locker-return-page"
      >
        {state.kind === "loading" && (
          <>
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verifying your completion…</p>
          </>
        )}

        {state.kind === "advancing" && (
          <>
            <CheckCircle2 className="success-pop size-10 text-primary" />
            <p className="text-lg font-semibold" data-testid="locker-step-done">
              Locker {state.step} of {state.total} done
            </p>
            <p className="text-sm text-muted-foreground">
              Continue to locker {state.nextStep} to keep going.
            </p>
            <p className="text-xs text-muted-foreground">
              Your reward is credited once all {state.total} lockers are complete.
            </p>
            <div className="flex gap-2">
              <Button
                variant="jade"
                disabled={openingNext}
                onClick={handleOpenNext}
                data-testid="locker-open-next"
              >
                {openingNext ? "Opening…" : `Open Locker ${state.nextStep}`}
                <ExternalLink className="ml-1 size-4" />
              </Button>
              <Button variant="outline" onClick={goHome} data-testid="locker-back-home">
                <Home className="mr-1 size-4" /> Home
              </Button>
            </div>
          </>
        )}

        {state.kind === "error" && (
          <>
            <XCircle className="size-10 text-destructive" data-testid="locker-error-icon" />
            <p className="text-lg font-semibold">Could not credit reward</p>
            <p className="text-sm text-muted-foreground" data-testid="locker-error-message">
              {state.message}
            </p>
            <Button variant="jade" onClick={goHome} data-testid="locker-back-home">
              <Home className="mr-1 size-4" /> Back to home
            </Button>
          </>
        )}

        {state.kind === "success" && (
          <>
            <div className="text-5xl" role="img" aria-label="party">
              🎉
            </div>
            <CheckCircle2 className="success-pop size-10 text-primary" />
            <p className="text-lg font-semibold" data-testid="locker-quest-completed">
              Quest completed!
            </p>
            <p className="text-amount text-gold-dark">
              {formatReward(state.reward)} credited to your wallet.
            </p>
            <p className="text-xs text-muted-foreground">Redirecting you home…</p>
            <Button variant="jade" onClick={goHome} data-testid="locker-back-home">
              <Home className="mr-1 size-4" /> Back to home
            </Button>
          </>
        )}
      </div>
    </AppShell>
  );
}
