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
 * 
 * DEBUG LOGGING: All events logged to console and visible in ?debug=1 panel
 */
export function useActiveTimeTracking(questKey: string | null, initialToken: string | null = null) {
  const debug = typeof window !== 'undefined' && window.location.search.includes('debug=1');
  
  const log = (msg: string, data?: any) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
    console.log(`[${timestamp}] [active-time]`, msg, data || '');
    
    if (debug && typeof window !== 'undefined') {
      const panel = document.getElementById('active-time-debug') || (() => {
        const p = document.createElement('div');
        p.id = 'active-time-debug';
        p.style.cssText = 'position:fixed;top:10px;right:10px;background:black;color:lime;padding:10px;max-height:400px;overflow-y:auto;font-family:monospace;font-size:11px;z-index:99999;max-width:400px;';
        document.body.appendChild(p);
        return p;
      })();
      panel.innerHTML += `<div>[${timestamp}] ${msg} ${JSON.stringify(data || '')}</div>`;
      panel.scrollTop = panel.scrollHeight;
    }
  };
  
  log('Hook mounted', { questKey, hasInitialToken: !!initialToken });
  
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
    const wasInactive = now - lastActivityRef.current > INACTIVITY_THRESHOLD_MS;
    lastActivityRef.current = now;

    if (wasInactive) {
      log("Activity detected after inactivity");
    }

    // Resume if paused
    if (state.isPaused) {
      log("Resuming from pause");
      setState((prev) => ({
        ...prev,
        isPaused: false,
        showStillHerePrompt: false,
      }));
      lastStillHereCheckRef.current = now;
    }

    // Dismiss still-here prompt if showing
    if (state.showStillHerePrompt) {
      log("Dismissing still-here prompt");
      setState((prev) => ({
        ...prev,
        showStillHerePrompt: false,
      }));
      lastStillHereCheckRef.current = now;
    }
  }, [state.isPaused, state.showStillHerePrompt]);

  // Send ping to server
  const sendPing = useCallback(async () => {
    if (!questKey) {
      log("Skipping ping - no questKey");
      return;
    }

    const now = Date.now();
    const timeSinceActivity = now - lastActivityRef.current;

    // Skip ping if user inactive for > 60s
    if (timeSinceActivity > INACTIVITY_THRESHOLD_MS) {
      log("Skipping ping - user inactive", { timeSinceActivity });
      return;
    }

    // For first ping (no token yet), server will create progress row and return token
    const pingToken = state.pingToken || "00000000-0000-0000-0000-000000000000"; // Dummy UUID for first ping

    log("Sending ping", { questKey, hasToken: !!state.pingToken, timeSinceActivity });

    try {
      const result = await pingFn({
        data: {
          questKey,
          pingToken,
        },
      });

      log("Ping response", { 
        success: result.success, 
        reason: result.reason, 
        hasNextToken: !!result.nextToken,
        totalSeconds: result.totalSeconds,
        todaySeconds: result.todaySeconds,
      });

      if (result.success && result.nextToken) {
        log("Ping successful, time credited");
        setState((prev) => ({
          ...prev,
          pingToken: result.nextToken,
          lastPingAt: now,
          error: null,
        }));
      } else {
        log("Ping failed", { reason: result.reason });
        setState((prev) => ({
          ...prev,
          error: result.reason || "ping_failed",
        }));
      }
    } catch (error) {
      log("Ping error", { error: error instanceof Error ? error.message : String(error) });
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
    if (!questKey) {
      log("Cannot start - no questKey");
      return;
    }

    log("Starting tracking", { questKey });

    setState((prev) => ({
      ...prev,
      isTracking: true,
      isPaused: false,
    }));

    lastActivityRef.current = Date.now();
    lastStillHereCheckRef.current = Date.now();

    // Send first ping immediately to create progress row
    log("Sending first ping immediately");
    void sendPing();

    // Start ping interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    pingIntervalRef.current = setInterval(() => {
      log("Interval tick - checking if should ping");
      sendPing();
    }, PING_INTERVAL_MS);

    // Start still-here check interval
    if (stillHereIntervalRef.current) {
      clearInterval(stillHereIntervalRef.current);
    }
    stillHereIntervalRef.current = setInterval(checkStillHere, 60_000); // Check every minute

    log("Tracking started", { pingIntervalMs: PING_INTERVAL_MS });
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

    log("Setting up activity listeners");

    const events = ["mousedown", "keydown", "touchstart", "scroll", "wheel"];
    
    const handler = () => {
      recordActivity();
    };
    
    events.forEach((event) => {
      window.addEventListener(event, handler, { passive: true });
    });

    return () => {
      log("Removing activity listeners");
      events.forEach((event) => {
        window.removeEventListener(event, handler);
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
