import { useEffect, useState, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Home, Loader2, XCircle } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { startTimedPtcStep, completeTimedPtcStep } from "@/lib/quests.functions";
import { formatReward } from "@/lib/format-reward";
import { useAuth } from "@/lib/auth";
import { isNativePlatform } from "@/lib/platform";
import { injectAdNetworkScript } from "@/lib/ad-networks";

/**
 * Timed PTC step page.
 * Shows a countdown timer with periodic checkpoints that require ad interactions.
 */
export const Route = createFileRoute("/_authenticated/timed-ptc/$questKey/$step")({
  head: () => ({
    meta: [
      { title: "Timed PTC Quest — CashGPT" },
      { name: "description", content: "Complete timed PTC quest step with ad checkpoints." },
    ],
  }),
  component: TimedPtcPage,
});

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | {
      kind: "running";
      sessionId: string;
      step: number;
      total: number;
      adNetwork: string | null;
      timedStepSeconds: number;
      timedCheckpointSeconds: number;
      timedMaxFailedTaps: number;
    }
  | {
      kind: "checkpoint";
      sessionId: string;
      step: number;
      total: number;
      adNetwork: string | null;
      remainingSeconds: number;
      checkpointsDone: number;
      failedTaps: number;
      timedMaxFailedTaps: number;
      timedCheckpointSeconds: number;
      error?: string;
    }
  | {
      kind: "completing";
      step: number;
      total: number;
      checkpointsDone: number;
      failedTaps: number;
    }
  | {
      kind: "step-complete";
      step: number;
      total: number;
      reward: number;
      nextStep: number | null;
      nextAdNetwork: string | null;
    }
  | {
      kind: "quest-complete";
      reward: number;
      total: number;
    };

function TimedPtcPage() {
  const { questKey, step } = Route.useParams();
  const navigate = useNavigate();
  const start = useServerFn(startTimedPtcStep);
  const complete = useServerFn(completeTimedPtcStep);
  const [state, setState] = useState<State>({ kind: "loading" });
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const stepNum = Number(step);

  // Timer state
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const checkpointsDoneRef = useRef<number>(0);
  const failedTapsRef = useRef<number>(0);

  // Ad interaction detection
  const interactionWindowRef = useRef<{
    start: number;
    hadBlur: boolean;
    hadHidden: boolean;
  } | null>(null);
  const cleanupAdScriptRef = useRef<(() => void) | null>(null);

  // Redirect if native
  useEffect(() => {
    if (isNativePlatform()) {
      navigate({ to: "/" });
    }
  }, [navigate]);

  // Start the step on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await start({
          data: { questKey, step: stepNum, isNative: false },
        });

        if (cancelled) return;

        if ("unavailable" in result) {
          setState({
            kind: "error",
            message: "This quest step is not available yet. Please check back later.",
          });
          return;
        }

        const total = result.step; // Server doesn't return total, use step as fallback
        setState({
          kind: "running",
          sessionId: result.sessionId,
          step: result.step,
          total,
          adNetwork: result.adNetwork,
          timedStepSeconds: result.timedStepSeconds,
          timedCheckpointSeconds: result.timedCheckpointSeconds,
          timedMaxFailedTaps: result.timedMaxFailedTaps,
        });

        // Initialize timer
        startTimeRef.current = Date.now();
        accumulatedRef.current = 0;
        checkpointsDoneRef.current = 0;
        failedTapsRef.current = 0;
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Could not start this step. Please try again.";
        setState({ kind: "error", message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [start, questKey, stepNum]);

  // Timer tick
  useEffect(() => {
    if (state.kind !== "running") {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const tick = () => {
      if (document.hidden) {
        // Pause while hidden
        if (!pausedAtRef.current) {
          pausedAtRef.current = Date.now();
        }
      } else {
        // Resume when visible
        if (pausedAtRef.current) {
          accumulatedRef.current += pausedAtRef.current - startTimeRef.current;
          startTimeRef.current = Date.now();
          pausedAtRef.current = 0;
        }

        const elapsed = Math.floor(
          (Date.now() - startTimeRef.current + accumulatedRef.current) / 1000,
        );
        setCurrentTime(elapsed);

        const remaining = state.timedStepSeconds - elapsed;

        // Check if we need a checkpoint
        const nextCheckpointAt = (checkpointsDoneRef.current + 1) * state.timedCheckpointSeconds;

        if (elapsed >= nextCheckpointAt && remaining > 0) {
          // Pause for checkpoint
          pausedAtRef.current = Date.now();
          setState({
            kind: "checkpoint",
            sessionId: state.sessionId,
            step: state.step,
            total: state.total,
            adNetwork: state.adNetwork,
            remainingSeconds: remaining,
            checkpointsDone: checkpointsDoneRef.current,
            failedTaps: failedTapsRef.current,
            timedMaxFailedTaps: state.timedMaxFailedTaps,
            timedCheckpointSeconds: state.timedCheckpointSeconds,
          });
          return;
        }

        // Check if timer is complete
        if (remaining <= 0) {
          handleComplete();
          return;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Inject ad script when checkpoint state is active
  useEffect(() => {
    if (state.kind === "checkpoint" && state.adNetwork && !cleanupAdScriptRef.current) {
      cleanupAdScriptRef.current = injectAdNetworkScript(state.adNetwork);
    }
  }, [state]);

  // Cleanup ad script on unmount
  useEffect(() => {
    return () => {
      if (cleanupAdScriptRef.current) {
        cleanupAdScriptRef.current();
        cleanupAdScriptRef.current = null;
      }
    };
  }, []);

  // Visibility change listener for ad interaction detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (interactionWindowRef.current && document.hidden) {
        interactionWindowRef.current.hadHidden = true;
      }
    };

    const handleBlur = () => {
      if (interactionWindowRef.current) {
        interactionWindowRef.current.hadBlur = true;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  const handleCheckpointTap = () => {
    if (state.kind !== "checkpoint") return;

    // Start interaction window
    interactionWindowRef.current = {
      start: Date.now(),
      hadBlur: false,
      hadHidden: false,
    };

    // Wait 2 seconds to check for ad interaction
    setTimeout(() => {
      if (!interactionWindowRef.current) return;

      const hadInteraction =
        interactionWindowRef.current.hadBlur || interactionWindowRef.current.hadHidden;

      if (hadInteraction) {
        // Success: count checkpoint as done
        checkpointsDoneRef.current++;
        failedTapsRef.current = 0; // Reset failed taps counter

        // Wait for page to become visible again before resuming
        const resumeWhenVisible = () => {
          if (!document.hidden) {
            resumeTimer(state);
          } else {
            // Check again in 100ms
            setTimeout(resumeWhenVisible, 100);
          }
        };
        resumeWhenVisible();
      } else {
        // Failed: increment failed taps
        failedTapsRef.current++;

        if (failedTapsRef.current >= state.timedMaxFailedTaps) {
          // Max failed taps reached: resume anyway (no-fill fallback)
          failedTapsRef.current = 0; // Reset for next checkpoint
          resumeTimer(state);
        } else {
          // Show error and keep paused
          setState({
            ...state,
            failedTaps: failedTapsRef.current,
            error: "Ad open nahi hua, dobara tap karo",
          });
        }
      }

      interactionWindowRef.current = null;
    }, 2000);
  };

  const resumeTimer = (checkpointState: Extract<State, { kind: "checkpoint" }>) => {
    if (state.kind !== "checkpoint") return;

    // Resume from where we paused
    startTimeRef.current = Date.now();
    pausedAtRef.current = 0;

    setState({
      kind: "running",
      sessionId: checkpointState.sessionId,
      step: checkpointState.step,
      total: checkpointState.total,
      adNetwork: checkpointState.adNetwork,
      timedStepSeconds:
        checkpointState.remainingSeconds +
        (checkpointState.checkpointsDone + 1) * checkpointState.timedCheckpointSeconds,
      timedCheckpointSeconds: checkpointState.timedCheckpointSeconds,
      timedMaxFailedTaps: checkpointState.timedMaxFailedTaps,
    });
  };

  const handleComplete = async () => {
    if (state.kind !== "running") return;

    setState({
      kind: "completing",
      step: state.step,
      total: state.total,
      checkpointsDone: checkpointsDoneRef.current,
      failedTaps: failedTapsRef.current,
    });

    try {
      const result = await complete({
        data: {
          questKey,
          step: stepNum,
          checkpointsDone: checkpointsDoneRef.current,
          isNative: false,
        },
      });

      // Invalidate queries
      void queryClient.invalidateQueries({ queryKey: ["quest-sessions", session?.user.id] });

      if (result.completed) {
        void queryClient.invalidateQueries({ queryKey: ["profile"] });
        void queryClient.invalidateQueries({ queryKey: ["quests-active"] });
        void queryClient.invalidateQueries({ queryKey: ["transactions"] });
        void queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });

        setState({
          kind: "quest-complete",
          reward: result.reward,
          total: result.total,
        });
      } else {
        setState({
          kind: "step-complete",
          step: result.step,
          total: result.total,
          reward: result.reward,
          nextStep: result.nextStep,
          nextAdNetwork: result.nextAdNetwork,
        });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not complete this step. Please try again.";
      setState({ kind: "error", message });
    }
  };

  const goHome = () => navigate({ to: "/home" });
  const goToNextStep = () => {
    if (state.kind !== "step-complete" || !state.nextStep) return;
    navigate({
      to: "/timed-ptc/$questKey/$step",
      params: { questKey, step: String(state.nextStep) },
    });
  };

  // Calculate progress
  const progress =
    state.kind === "running" || state.kind === "checkpoint"
      ? (currentTime /
          (state.kind === "running"
            ? state.timedStepSeconds
            : state.remainingSeconds + currentTime)) *
        100
      : 0;

  const remainingSeconds =
    state.kind === "running"
      ? Math.max(0, state.timedStepSeconds - currentTime)
      : state.kind === "checkpoint"
        ? state.remainingSeconds
        : 0;

  return (
    <AppShell subtitle="Timed PTC Quest">
      <div
        className="mt-6 flex flex-col items-center gap-4 text-center"
        data-testid={`timed-ptc-page-${questKey}-${stepNum}`}
      >
        {state.kind === "loading" && (
          <>
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading step {stepNum}…</p>
          </>
        )}

        {state.kind === "error" && (
          <>
            <XCircle className="size-10 text-destructive" data-testid="timed-ptc-error-icon" />
            <p className="text-lg font-semibold">Error</p>
            <p className="text-sm text-muted-foreground" data-testid="timed-ptc-error-message">
              {state.message}
            </p>
            <Button variant="jade" onClick={goHome} data-testid="timed-ptc-back-home">
              <Home className="mr-1 size-4" /> Back to home
            </Button>
          </>
        )}

        {(state.kind === "running" || state.kind === "checkpoint") && (
          <>
            <div className="w-full max-w-md space-y-6">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  Step {state.kind === "running" ? state.step : state.step} of{" "}
                  {state.kind === "running" ? state.total : state.total}
                </p>
                <div
                  className="mt-4 text-6xl font-bold tabular-nums"
                  data-testid="timed-ptc-countdown"
                >
                  {Math.floor(remainingSeconds / 60)}:
                  {String(remainingSeconds % 60).padStart(2, "0")}
                </div>
              </div>

              <Progress value={progress} className="h-3" data-testid="timed-ptc-progress" />

              {state.kind === "checkpoint" && (
                <div className="space-y-4 rounded-lg border bg-card p-6">
                  <p className="text-lg font-semibold">Checkpoint {state.checkpointsDone + 1}</p>
                  {state.error && (
                    <p
                      className="text-sm text-destructive"
                      data-testid="timed-ptc-checkpoint-error"
                    >
                      {state.error}
                    </p>
                  )}
                  <Button
                    variant="jade"
                    size="lg"
                    className="w-full"
                    onClick={handleCheckpointTap}
                    data-testid="timed-ptc-checkpoint-button"
                  >
                    Continue
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Failed taps: {state.failedTaps} / {state.timedMaxFailedTaps}
                  </p>
                </div>
              )}

              {state.kind === "running" && document.hidden && (
                <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    Timer paused while tab is hidden
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {state.kind === "completing" && (
          <>
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verifying step {state.step}…</p>
          </>
        )}

        {state.kind === "step-complete" && (
          <>
            <CheckCircle2 className="success-pop size-10 text-primary" />
            <p className="text-lg font-semibold">Step {state.step} done</p>
            {state.reward > 0 && (
              <p className="text-amount text-primary">{formatReward(state.reward)} credited</p>
            )}

            {/* Slot for PushOptInCard - to be added in Prompt 4 */}
            <div data-push-optin-slot="true" data-network-id={state.nextAdNetwork || ""} />

            <p className="text-sm text-muted-foreground">
              Continue to step {state.nextStep} to keep going.
            </p>
            <div className="flex gap-2">
              <Button variant="jade" onClick={goToNextStep} data-testid="timed-ptc-next-step">
                Continue to Step {state.nextStep}
              </Button>
              <Button variant="outline" onClick={goHome} data-testid="timed-ptc-back-home">
                <Home className="mr-1 size-4" /> Home
              </Button>
            </div>
          </>
        )}

        {state.kind === "quest-complete" && (
          <>
            <div className="success-pop text-5xl" role="img" aria-label="party">
              🎉
            </div>
            <p className="text-lg font-semibold" data-testid="timed-ptc-quest-completed">
              Quest completed!
            </p>
            <p className="text-amount text-gold-dark">
              {formatReward(state.reward)} credited to your wallet.
            </p>

            {/* Slot for PushOptInCard - to be added in Prompt 4 */}
            <div data-push-optin-slot="true" />

            <Button variant="jade" onClick={goHome} data-testid="timed-ptc-back-home">
              <Home className="mr-1 size-4" /> Back to home
            </Button>
          </>
        )}
      </div>
    </AppShell>
  );
}
