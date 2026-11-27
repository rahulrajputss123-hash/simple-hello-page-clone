import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  redeemSponsorHandoff,
  getSponsorState,
  startSponsorVisit,
  returnSponsorVisit,
  completeSponsorStep,
} from "@/lib/quests.functions";
import { PTC_CONTENT, type PtcContent } from "@/lib/ptc-content";
import { ProgressBlock } from "@/components/ptc-landing/ProgressBlock";
import { FeatureCard } from "@/components/ptc-landing/FeatureCard";
import { HowItWorksStep } from "@/components/ptc-landing/HowItWorksStep";
import { PushOptInCard } from "@/components/PushOptInCard";
import { Button } from "@/components/ui/button";
import type { PushNetwork } from "@/lib/push-networks";

const SESSION_STORAGE_KEY = "ptc-session-token";

type SponsorState = {
  content_key: "special_missions" | "marketplace" | "surveys_offers";
  smartlink_url: string;
  push_network: PushNetwork;
  visits: number;
  visit_seconds: number;
  visit_states: Array<{
    seconds_done: number;
    open_started_at: string | null;
    done: boolean;
  }>;
  current_visit_index: number;
  step_index: number;
  total_steps: number;
  step_reward: number;
  completion_bonus: number;
  completed: boolean;
};

export const Route = createFileRoute("/ptc")({
  head: () => ({
    meta: [
      { title: "CashGPT PTC Quest" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: PtcPage,
});

function PtcPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<SponsorState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buttonState, setButtonState] = useState<"open" | "reopen" | "wait">("open");
  const [statusText, setStatusText] = useState("");
  const [showPushCard, setShowPushCard] = useState(true);
  const [wasHiddenSinceTap, setWasHiddenSinceTap] = useState(false);
  const [tapTimestamp, setTapTimestamp] = useState<number | null>(null);

  const redeem = useServerFn(redeemSponsorHandoff);
  const getState = useServerFn(getSponsorState);
  const startVisit = useServerFn(startSponsorVisit);
  const returnVisit = useServerFn(returnSponsorVisit);
  const completeStep = useServerFn(completeSponsorStep);

  // Initialize - redeem handoff or load existing session
  useEffect(() => {
    const init = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("t");

        if (token) {
          // Redeem handoff token
          const requestHost = window.location.hostname;
          const result = await redeem({ data: { token, requestHost } });
          
          // Store session token
          sessionStorage.setItem(SESSION_STORAGE_KEY, result.sessionToken);
          
          // Remove token from URL
          window.history.replaceState({}, "", "/ptc");
          
          setState(result.state);
        } else {
          // Try to load existing session
          const sessionToken = sessionStorage.getItem(SESSION_STORAGE_KEY);
          if (!sessionToken) {
            setError("no-token");
            setLoading(false);
            return;
          }

          const result = await getState({ data: { sessionToken } });
          setState(result);
        }
      } catch (err) {
        console.error("PTC init error:", err);
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Listen for visibility changes
  useEffect(() => {
    if (!state) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // Page hidden
        setWasHiddenSinceTap(true);
      } else {
        // Page visible again
        if (wasHiddenSinceTap && tapTimestamp) {
          // User came back after hiding
          const sessionToken = sessionStorage.getItem(SESSION_STORAGE_KEY);
          if (!sessionToken) return;

          try {
            const result = await returnVisit({
              data: { sessionToken, wasHidden: true },
            });
            
            // Update state with new visit data
            const newState = await getState({ data: { sessionToken } });
            setState(newState);
            
            const currentVisit = newState.visit_states[newState.current_visit_index];
            if (currentVisit) {
              const remaining = newState.visit_seconds - currentVisit.seconds_done;
              setStatusText(`${currentVisit.seconds_done} / ${newState.visit_seconds} sec hue, ${remaining} sec baaki`);
            }
            
            setButtonState(result.all_done ? "wait" : "reopen");
            setWasHiddenSinceTap(false);
            setTapTimestamp(null);
          } catch (err) {
            console.error("Return visit error:", err);
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [state, wasHiddenSinceTap, tapTimestamp]);

  // Check if page never went hidden after tap (3 second timeout)
  useEffect(() => {
    if (!tapTimestamp) return;

    const timer = setTimeout(async () => {
      if (!wasHiddenSinceTap) {
        // Page never went hidden - sponsor didn't open
        const sessionToken = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (!sessionToken) return;

        try {
          await returnVisit({
            data: { sessionToken, wasHidden: false },
          });
          setStatusText("Sponsor page open nahi hua, dobara tap karo");
          setButtonState("reopen");
          setTapTimestamp(null);
        } catch (err) {
          console.error("Return visit error:", err);
        }
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [tapTimestamp, wasHiddenSinceTap]);

  // Complete step when all visits done
  useEffect(() => {
    if (!state || state.current_visit_index !== -1) return;

    const handleComplete = async () => {
      const sessionToken = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!sessionToken) return;

      try {
        // Get quest key from somewhere - for now we'll need to pass it
        // This is a limitation - we need questKey to complete
        // For now, just show completion message
        setStatusText(`PTC complete, +$${state.step_reward.toFixed(2)}`);
        setButtonState("wait");

        // Auto-redirect would happen here but we need nextUrl/finalUrl from completeSponsorStep
        // This requires passing questKey which we don't have here
        // UI should show a "Continue" button that calls completeSponsorStep
      } catch (err) {
        console.error("Complete step error:", err);
      }
    };

    handleComplete();
  }, [state]);

  const handleSponsorTap = async () => {
    if (!state) return;
    const sessionToken = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionToken) return;

    try {
      setButtonState("wait");
      
      // Start visit
      await startVisit({ data: { sessionToken } });
      
      // Open sponsor link
      if (state.smartlink_url) {
        window.open(state.smartlink_url, "_blank");
      }
      
      // Track tap timestamp and reset hidden state
      setTapTimestamp(Date.now());
      setWasHiddenSinceTap(false);
      setStatusText("Sponsor page khulega, wapas aao");
    } catch (err) {
      console.error("Start visit error:", err);
      setButtonState("open");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error === "no-token") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold">Ye quest CashGPT app se shuru hota hai</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Quest shuru karne ke liye CashGPT app open karo
          </p>
          <a
            href="https://cashgpt.in/"
            className="mt-4 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            CashGPT kholein
          </a>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold">Error</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!state) return null;

  const content: PtcContent = PTC_CONTENT[state.content_key];
  const currentVisit = state.visit_states[state.current_visit_index] || { seconds_done: 0, done: false, open_started_at: null };
  const allDone = state.current_visit_index === -1;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="text-sm font-semibold">CashGPT</div>
          <div className="text-xs text-muted-foreground">
            PTC {state.step_index} of {state.total_steps}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* Hero */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">{content.heroTitle}</h1>
          <p className="mt-2 text-muted-foreground">{content.heroBenefit}</p>
        </div>

        {/* Features */}
        <div className="grid gap-3 sm:grid-cols-2">
          {content.features.map((feature, idx) => (
            <FeatureCard key={idx} title={feature.title} description={feature.description} />
          ))}
        </div>

        {/* How it works */}
        <div>
          <h2 className="text-lg font-bold mb-4">Kaise kaam karta hai</h2>
          <div className="space-y-4">
            {content.howItWorks.map((step, idx) => (
              <HowItWorksStep
                key={idx}
                step={step.step}
                description={step.description}
                number={idx + 1}
              />
            ))}
          </div>
        </div>

        {/* Terms (marketplace only) */}
        {content.termsTitle && content.termsItems && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
            <h3 className="text-sm font-semibold text-destructive">{content.termsTitle}</h3>
            <div className="mt-3 space-y-2">
              {content.termsItems.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}:</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info box */}
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Sponsor page par {state.visit_seconds} sec rukna hai. Wapas aate hi aapka asli time dikhega.
        </div>

        {/* Progress block */}
        <ProgressBlock
          currentVisit={(state.current_visit_index || 0) + 1}
          totalVisits={state.visits}
          secondsDone={currentVisit.seconds_done}
          visitSeconds={state.visit_seconds}
          statusText={statusText || `Visit ${state.current_visit_index + 1} start karo`}
        />

        {/* Push opt-in card */}
        {showPushCard && !allDone && (
          <PushOptInCard
            network={state.push_network}
            onComplete={() => setShowPushCard(false)}
          />
        )}
      </div>

      {/* Sticky button */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background p-4">
        <div className="container mx-auto max-w-2xl">
          <Button
            size="lg"
            className="w-full"
            onClick={handleSponsorTap}
            disabled={
              buttonState === "wait" ||
              !state.smartlink_url ||
              allDone ||
              showPushCard
            }
          >
            {!state.smartlink_url
              ? "Link jaldi aa raha hai"
              : allDone
                ? `PTC complete, +$${state.step_reward.toFixed(2)}`
                : buttonState === "reopen"
                  ? "Dobara kholo"
                  : buttonState === "wait"
                    ? "Wapas aao..."
                    : `Sponsor kholo (${state.current_visit_index + 1}/${state.visits})`}
          </Button>
        </div>
      </div>
    </div>
  );
}
