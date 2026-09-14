import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Home, Loader2, XCircle } from "lucide-react";
import { z } from "zod";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { completeLockerQuest } from "@/lib/quests.functions";
import { formatMoney } from "@/lib/coinquest";

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
  { kind: "loading" } | { kind: "error"; message: string } | { kind: "success"; reward: number };

function LockerReturnPage() {
  const { questKey } = useSearch({ from: "/_authenticated/go/locker/return" });
  const navigate = useNavigate();
  const complete = useServerFn(completeLockerQuest);
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!questKey) {
      setState({ kind: "error", message: "Missing questKey parameter in the redirect URL." });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const result = await complete({ data: { questKey } });
        if (cancelled) return;
        setState({ kind: "success", reward: result.reward });
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
            <CheckCircle2 className="size-10 text-primary" />
            <p className="text-lg font-semibold" data-testid="locker-quest-completed">
              Quest completed!
            </p>
            <p className="text-amount text-gold-dark">
              {formatMoney(state.reward)} credited to your wallet.
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
