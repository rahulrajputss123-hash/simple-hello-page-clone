import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  listOnboardingSteps,
  markOnboardingSeen,
} from "@/lib/onboarding/functions";
import type { OnboardingStepRow } from "@/lib/onboarding/server";

const OVERLAY_PADDING = 8;
const SPOTLIGHT_RADIUS = 16;

type Rect = { top: number; left: number; width: number; height: number };

function readRect(id: string): Rect | null {
  if (typeof document === "undefined") return null;
  const el = document.getElementById(id);
  if (!el) return null;
  const box = el.getBoundingClientRect();
  return {
    top: box.top + window.scrollY - OVERLAY_PADDING,
    left: box.left + window.scrollX - OVERLAY_PADDING,
    width: box.width + OVERLAY_PADDING * 2,
    height: box.height + OVERLAY_PADDING * 2,
  };
}

/**
 * Public tour: auto-runs once per user when profile.onboarded=true AND
 * has_seen_onboarding=false. Called from the home screen so it never fires
 * while the older profile-setup flow is still redirecting users to /onboarding.
 */
export function OnboardingTour() {
  const { session, profile } = useAuth();
  const has_seen = Boolean(
    (profile as { has_seen_onboarding?: boolean } | null)?.has_seen_onboarding,
  );
  const shouldConsider = Boolean(session && profile?.onboarded && !has_seen);
  const fetchSteps = useServerFn(listOnboardingSteps);
  const stepsQuery = useQuery({
    queryKey: ["onboarding-steps"],
    enabled: shouldConsider,
    queryFn: () => fetchSteps({}),
    staleTime: 60_000,
  });
  const queryClient = useQueryClient();
  const markSeen = useServerFn(markOnboardingSeen);
  const finishMutation = useMutation({
    mutationFn: () => markSeen({}),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });

  const steps = stepsQuery.data ?? [];
  const active = shouldConsider && steps.length > 0;

  const handleDone = (fired: () => void) => () => {
    finishMutation.mutate();
    fired();
  };

  if (!active) return null;
  return (
    <TourOverlay
      steps={steps}
      onFinish={handleDone(() => undefined)}
      testidPrefix="tour"
    />
  );
}

/**
 * Preview mode used by the admin "Preview tour" button — pure local state,
 * never touches has_seen_onboarding. Renders the same overlay against the
 * current DOM so admins see exactly what real users would see.
 */
export function OnboardingTourPreview({
  steps,
  onClose,
}: {
  steps: OnboardingStepRow[];
  onClose: () => void;
}) {
  if (!steps.length) return null;
  return <TourOverlay steps={steps} onFinish={onClose} testidPrefix="tour-preview" />;
}

function TourOverlay({
  steps,
  onFinish,
  testidPrefix,
}: {
  steps: OnboardingStepRow[];
  onFinish: () => void;
  testidPrefix: string;
}) {
  const ordered = useMemo(
    () => [...steps].sort((a, b) => a.display_order - b.display_order),
    [steps],
  );
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [ready, setReady] = useState(false);
  const rafRef = useRef<number | null>(null);

  const step = ordered[Math.min(index, ordered.length - 1)];

  // Track the target element's bounding box; recompute on scroll/resize.
  useLayoutEffect(() => {
    if (!step) return;
    const measure = () => {
      const next = readRect(step.target_element_id);
      setRect(next);
      setReady(true);
    };
    let attempts = 0;
    const attemptMeasure = () => {
      const r = readRect(step.target_element_id);
      if (r || attempts > 20) {
        setRect(r);
        setReady(true);
        return;
      }
      attempts += 1;
      rafRef.current = window.requestAnimationFrame(attemptMeasure);
    };
    attemptMeasure();

    // Scroll the target into view for the first frame.
    const el = document.getElementById(step.target_element_id);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });

    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [step]);

  // Prevent background scroll while the tour is up.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  if (!step || !ready) return null;

  const nextLabel = index === ordered.length - 1 ? "Got it" : "Next";
  const handleNext = () => {
    if (index === ordered.length - 1) onFinish();
    else setIndex((i) => i + 1);
  };
  const handleSkip = () => onFinish();

  // Position the tooltip: below the target if there's room, otherwise above.
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 800;
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 400;
  const tooltipWidth = Math.min(320, viewportW - 32);
  let tooltipTop = 16;
  let tooltipLeft = 16;
  if (rect) {
    const belowSpace =
      viewportH - (rect.top - window.scrollY + rect.height) - 20;
    const preferBelow = belowSpace > 200;
    tooltipTop = preferBelow
      ? rect.top + rect.height + 12
      : Math.max(16, rect.top - 12 - 160);
    tooltipLeft = Math.max(
      16,
      Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, viewportW - tooltipWidth - 16),
    );
  }

  return (
    <div
      className="fixed inset-0 z-[200]"
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding tour"
      data-testid={`${testidPrefix}-overlay`}
    >
      {/* Spotlight backdrop: full-screen dim with an SVG mask that punches a
          rounded hole around the current step's target element. */}
      <svg
        className="pointer-events-auto absolute inset-0 h-full w-full"
        onClick={handleNext}
        aria-hidden
      >
        <defs>
          <mask id={`${testidPrefix}-mask`}>
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left - window.scrollX}
                y={rect.top - window.scrollY}
                width={rect.width}
                height={rect.height}
                rx={SPOTLIGHT_RADIUS}
                ry={SPOTLIGHT_RADIUS}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 61, 58, 0.72)"
          mask={`url(#${testidPrefix}-mask)`}
        />
      </svg>

      {/* Ring around the highlighted element for extra emphasis. */}
      {rect && (
        <div
          className="pointer-events-none absolute rounded-2xl ring-2 ring-gold shadow-gold"
          style={{
            top: rect.top - window.scrollY,
            left: rect.left - window.scrollX,
            width: rect.width,
            height: rect.height,
            borderRadius: SPOTLIGHT_RADIUS,
          }}
          data-testid={`${testidPrefix}-spotlight`}
        />
      )}

      <div
        className="surface-card pointer-events-auto absolute space-y-3 p-4 shadow-lift"
        style={{ top: tooltipTop, left: tooltipLeft, width: tooltipWidth }}
        data-testid={`${testidPrefix}-tooltip`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Step {index + 1} of {ordered.length}
            </p>
            <h4 className="mt-0.5 font-display text-base leading-tight">{step.title}</h4>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            aria-label="Skip tour"
            className="text-muted-foreground transition-colors hover:text-foreground"
            data-testid={`${testidPrefix}-close`}
          >
            <X className="size-4" />
          </button>
        </div>
        {step.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
        )}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:underline"
            data-testid={`${testidPrefix}-skip`}
          >
            Skip
          </button>
          <Button
            size="sm"
            variant="jade"
            onClick={handleNext}
            data-testid={`${testidPrefix}-next`}
          >
            {nextLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
