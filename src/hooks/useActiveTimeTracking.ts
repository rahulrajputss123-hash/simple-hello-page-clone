import { useEffect, useRef, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { processActiveTimePing } from "@/lib/quests.functions";

const PING_INTERVAL_MS = 30_000; // 30 seconds
const INACTIVITY_THRESHOLD_MS = 60_000; // 60 seconds
const STILL_HERE_INTERVAL_MS = 600_000; // 10 minutes

type TrackerState = {
  isTracking: boolean;
  isPaused: boolean;
  showStillHerePrompt: boolean;
  lastPingAt: number | null;
  pingToken: string | null;
  error: string | null;
};

/**
 * Hook for active time quest tracking.
 * 
 * Behavior:
 * - Pings server every 30s if user was active in last 60s
 * - Detects activity via mouse/keyboard/touch/scroll
 * - Shows "Still here?" prompt every 10min if inactive
 * - Pauses tracking if user doesn't respond to prompt within 60s
 * - Resumes tracking on any activity
 */
export function useActiveTimeTracking(questKey: string | null, initialToken: string | null = null) {
  const [state, setState] = useState<TrackerState>({
    isTracking: false,
    isPaused: false,
    showStillHerePrompt: false,
    lastPingAt: null,
    pingToken: initialToken,
    error: null,
  });

  const lastActivityRef = useRef<number>(Date.now());
  const lastStillHereCheckRef = useRef<number>(Date.now());
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stillHereIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const pingFn = useServerFn(processActiveTimePing);

  // Record user activity
  const recordActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;

    // Resume if paused
    if (state.isPaused) {
      setState((prev) => ({
        ...prev,
        isPaused: false,
        showStillHerePrompt: false,
      }));
      lastStillHereCheckRef.current = now;
    }

    // Dismiss still-here prompt if showing
    if (state.showStillHerePrompt) {
      setState((prev) => ({
        ...prev,
        showStillHerePrompt: false,
      }));
      lastStillHereCheckRef.current = now;
    }
  }, [state.isPaused, state.showStillHerePrompt]);

  // Send ping to server
  const sendPing = useCallback(async () => {
    if (!questKey || !state.pingToken) {
      return;
    }

    const now = Date.now();
    const timeSinceActivity = now - lastActivityRef.current;

    // Skip ping if user inactive for > 60s
    if (timeSinceActivity > INACTIVITY_THRESHOLD_MS) {
      console.log("[active-time] Skipping ping - user inactive");
      return;
    }

    console.log("[active-time] Sending ping for quest:", questKey);

    try {
      const result = await pingFn({
        data: {
          questKey,
          pingToken: state.pingToken,
        },
      });

      if (result.success && result.nextToken) {
        console.log("[active-time] Ping successful, time credited");
        setState((prev) => ({
          ...prev,
          pingToken: result.nextToken,
          lastPingAt: now,
          error: null,
        }));
      } else {
        console.error("[active-time] Ping failed:", result.reason);
        setState((prev) => ({
          ...prev,
          error: result.reason || "ping_failed",
        }));
      }
    } catch (error) {
      console.error("[active-time] Ping error:", error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "network_error",
      }));
    }
  }, [questKey, state.pingToken, pingFn]);

  // Check if we should show "Still here?" prompt
  const checkStillHere = useCallback(() => {
    const now = Date.now();
    const timeSinceLastCheck = now - lastStillHereCheckRef.current;
    const timeSinceActivity = now - lastActivityRef.current;

    // Show prompt if it's been 10+ minutes since last check
    // and user hasn't been active in the last 60 seconds
    if (
      timeSinceLastCheck >= STILL_HERE_INTERVAL_MS &&
      timeSinceActivity >= INACTIVITY_THRESHOLD_MS
    ) {
      setState((prev) => ({
        ...prev,
        showStillHerePrompt: true,
      }));
      lastStillHereCheckRef.current = now;

      // Auto-pause after 60s if no response
      setTimeout(() => {
        const timeUntilActivity = Date.now() - lastActivityRef.current;
        if (timeUntilActivity >= INACTIVITY_THRESHOLD_MS) {
          setState((prev) => ({
            ...prev,
            isPaused: true,
            showStillHerePrompt: false,
          }));
        }
      }, INACTIVITY_THRESHOLD_MS);
    }
  }, []);

  // User confirms they're still here
  const confirmStillHere = useCallback(() => {
    recordActivity();
  }, [recordActivity]);

  // Start tracking
  const startTracking = useCallback(() => {
    if (!questKey) return;

    console.log("[active-time] Starting tracking for quest:", questKey);

    setState((prev) => ({
      ...prev,
      isTracking: true,
      isPaused: false,
    }));

    lastActivityRef.current = Date.now();
    lastStillHereCheckRef.current = Date.now();

    // Start ping interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    pingIntervalRef.current = setInterval(sendPing, PING_INTERVAL_MS);

    // Start still-here check interval
    if (stillHereIntervalRef.current) {
      clearInterval(stillHereIntervalRef.current);
    }
    stillHereIntervalRef.current = setInterval(checkStillHere, 60_000); // Check every minute

    console.log("[active-time] Tracking started, will ping every 30s");
  }, [questKey, sendPing, checkStillHere]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isTracking: false,
      isPaused: false,
      showStillHerePrompt: false,
    }));

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (stillHereIntervalRef.current) {
      clearInterval(stillHereIntervalRef.current);
      stillHereIntervalRef.current = null;
    }
  }, []);

  // Set up activity listeners
  useEffect(() => {
    if (!state.isTracking) return;

    const events = ["mousedown", "keydown", "touchstart", "scroll", "wheel"];
    events.forEach((event) => {
      window.addEventListener(event, recordActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, recordActivity);
      });
    };
  }, [state.isTracking, recordActivity]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (stillHereIntervalRef.current) {
        clearInterval(stillHereIntervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startTracking,
    stopTracking,
    confirmStillHere,
  };
}
