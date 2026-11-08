import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { processActiveTimePing } from "@/lib/quests.functions";
import { activeTimeTokenStore } from "@/lib/active-time-token-store";

const PING_INTERVAL_MS = 30_000; // 30 seconds
const INACTIVITY_THRESHOLD_MS = 60_000; // 60 seconds
const INVALID_TOKEN_WAIT_MS = 30_000; // 30 seconds
const LOCAL_TICK_INTERVAL_MS = 1_000; // 1 second for UI updates

type ActiveTimeState = {
  questKey: string;
  totalSeconds: number;
  todaySeconds: number;
  targetSeconds: number;
  canClaim: boolean;
  isTracking: boolean;
  isPaused: boolean;
  showStillHerePrompt: boolean;
  error: string | null;
  waitingForResync: boolean;
  lastServerSync: number | null;
  progressPercent: number;
};

type ActiveTimeContextValue = {
  state: ActiveTimeState | null;
  startTracking: (questKey: string) => void;
  stopTracking: () => void;
  confirmStillHere: () => void;
};

const ActiveTimeContext = createContext<ActiveTimeContextValue | null>(null);

export function useActiveTime() {
  const context = useContext(ActiveTimeContext);
  if (!context) {
    throw new Error("useActiveTime must be used within ActiveTimeProvider");
  }
  return context;
}

/**
 * Global Active Time Provider
 * 
 * Mounted once in authenticated layout, survives all navigation.
 * - Fetches initial total_seconds from server on first start
 * - Ticks locally every second for UI display
 * - Syncs with server every 30s via ping
 * - On ping response, overwrites local value with server total_seconds
 * - Token stored in global store + sessionStorage
 */
export function ActiveTimeProvider({ children }: { children: React.ReactNode }) {
  const debug = typeof window !== 'undefined' && window.location.search.includes('debug=1');
  
  const log = (msg: string, data?: any) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
    console.log(`[${timestamp}] [ActiveTimeProvider]`, msg, data || '');
    
    if (debug && typeof window !== 'undefined') {
      const panel = document.getElementById('active-time-debug') || (() => {
        const p = document.createElement('div');
        p.id = 'active-time-debug';
        p.style.cssText = 'position:fixed;top:10px;right:10px;background:black;color:lime;padding:10px;max-height:400px;overflow-y:auto;font-family:monospace;font-size:11px;z-index:99999;max-width:400px;border:2px solid lime;';
        document.body.appendChild(p);
        return p;
      })();
      panel.innerHTML += `<div>[${timestamp}] ${msg} ${JSON.stringify(data || '')}</div>`;
      panel.scrollTop = panel.scrollHeight;
    }
  };

  const [state, setState] = useState<ActiveTimeState | null>(null);
  
  const lastActivityRef = useRef<number>(Date.now());
  const lastStillHereCheckRef = useRef<number>(Date.now());
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const localTickIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
    if (state?.isPaused) {
      log("Resuming from pause");
      setState((prev) => prev ? {
        ...prev,
        isPaused: false,
        showStillHerePrompt: false,
      } : null);
      lastStillHereCheckRef.current = now;
    }

    // Dismiss still-here prompt if showing
    if (state?.showStillHerePrompt) {
      log("Dismissing still-here prompt");
      setState((prev) => prev ? {
        ...prev,
        showStillHerePrompt: false,
      } : null);
      lastStillHereCheckRef.current = now;
    }
  }, [state?.isPaused, state?.showStillHerePrompt]);

  // Send ping to server
  const sendPing = useCallback(async () => {
    if (!state) {
      log("Skipping ping - no state");
      return;
    }

    if (state.waitingForResync) {
      log("Skipping ping - waiting for resync");
      return;
    }

    const now = Date.now();
    const timeSinceActivity = now - lastActivityRef.current;
    const isActive = timeSinceActivity <= INACTIVITY_THRESHOLD_MS;

    const pingToken = activeTimeTokenStore.getToken(state.questKey);

    log("Sending ping", { 
      questKey: state.questKey,
      hasToken: !!pingToken, 
      timeSinceActivity, 
      isActive,
      tokenPreview: pingToken?.slice(0, 8) || 'null',
    });

    try {
      const result = await pingFn({
        data: {
          questKey: state.questKey,
          pingToken,
          isActive,
        },
      });

      log("Ping response", { 
        success: result.success, 
        reason: result.reason, 
        hasNextToken: !!result.nextToken,
        serverTotalSeconds: result.totalSeconds,
        todaySeconds: result.todaySeconds,
        nextTokenPreview: result.nextToken?.slice(0, 8) || 'null',
      });

      // Handle invalid_token
      if (!result.success && result.reason === 'invalid_token') {
        log("Invalid token - waiting 30s before retry");
        setState((prev) => prev ? {
          ...prev,
          waitingForResync: true,
          error: 'invalid_token_wait',
        } : null);
        
        setTimeout(() => {
          log("Resync wait complete");
          setState((prev) => prev ? {
            ...prev,
            waitingForResync: false,
            error: null,
          } : null);
        }, INVALID_TOKEN_WAIT_MS);
        
        return;
      }

      if (result.success && result.nextToken) {
        log("Ping successful - syncing with server", { 
          serverTotal: result.totalSeconds,
          localTotal: state.totalSeconds 
        });
        
        // Store token
        activeTimeTokenStore.setToken(state.questKey, result.nextToken);
        
        // Overwrite local value with server value
        setState((prev) => prev ? {
          ...prev,
          totalSeconds: result.totalSeconds,
          todaySeconds: result.todaySeconds,
          targetSeconds: result.targetSeconds,
          canClaim: result.canClaim,
          progressPercent: Math.min(100, (result.totalSeconds / result.targetSeconds) * 100),
          lastServerSync: now,
          error: null,
          waitingForResync: false,
        } : null);
      } else {
        log("Ping failed", { reason: result.reason });
        setState((prev) => prev ? {
          ...prev,
          error: result.reason || "ping_failed",
        } : null);
      }
    } catch (error) {
      log("Ping error", { error: error instanceof Error ? error.message : String(error) });
      setState((prev) => prev ? {
        ...prev,
        error: error instanceof Error ? error.message : "network_error",
      } : null);
    }
  }, [state, pingFn]);

  // Local tick - increment UI display every second
  const tickLocal = useCallback(() => {
    setState((prev) => {
      if (!prev || prev.isPaused) return prev;
      
      const now = Date.now();
      const timeSinceActivity = now - lastActivityRef.current;
      const isActive = timeSinceActivity <= INACTIVITY_THRESHOLD_MS;
      
      // Only increment if user is active
      if (isActive && prev.totalSeconds < prev.targetSeconds) {
        return {
          ...prev,
          totalSeconds: prev.totalSeconds + 1,
          todaySeconds: prev.todaySeconds + 1,
          progressPercent: Math.min(100, ((prev.totalSeconds + 1) / prev.targetSeconds) * 100),
        };
      }
      
      return prev;
    });
  }, []);

  // Check if we should show "Still here?" prompt
  const checkStillHere = useCallback(() => {
    const now = Date.now();
    const timeSinceLastCheck = now - lastStillHereCheckRef.current;
    const timeSinceActivity = now - lastActivityRef.current;

    if (
      timeSinceLastCheck >= 600_000 && // 10 minutes
      timeSinceActivity >= INACTIVITY_THRESHOLD_MS
    ) {
      setState((prev) => prev ? {
        ...prev,
        showStillHerePrompt: true,
      } : null);
      lastStillHereCheckRef.current = now;

      // Auto-pause after 60s if no response
      setTimeout(() => {
        const timeUntilActivity = Date.now() - lastActivityRef.current;
        if (timeUntilActivity >= INACTIVITY_THRESHOLD_MS) {
          setState((prev) => prev ? {
            ...prev,
            isPaused: true,
            showStillHerePrompt: false,
          } : null);
        }
      }, INACTIVITY_THRESHOLD_MS);
    }
  }, []);

  // Start tracking
  const startTracking = useCallback(async (questKey: string) => {
    log("Starting tracking", { questKey });

    // Check if already tracking this quest
    if (state?.questKey === questKey && state.isTracking) {
      log("Already tracking this quest");
      return;
    }

    // Stop previous tracking if different quest
    if (state && state.questKey !== questKey) {
      log("Stopping previous quest tracking");
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (localTickIntervalRef.current) clearInterval(localTickIntervalRef.current);
      if (stillHereIntervalRef.current) clearInterval(stillHereIntervalRef.current);
    }

    // Initialize state with zeros, will fetch from server immediately
    setState({
      questKey,
      totalSeconds: 0,
      todaySeconds: 0,
      targetSeconds: 7200, // 2 hours default, will update from server
      canClaim: false,
      isTracking: true,
      isPaused: false,
      showStillHerePrompt: false,
      error: null,
      waitingForResync: false,
      lastServerSync: null,
      progressPercent: 0,
    });

    lastActivityRef.current = Date.now();
    lastStillHereCheckRef.current = Date.now();

    // Send first ping immediately to get initial state
    log("Sending first ping to fetch initial state");
    setTimeout(() => sendPing(), 100);

    // Start ping interval (server sync)
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    pingIntervalRef.current = setInterval(() => {
      log("Ping interval tick");
      sendPing();
    }, PING_INTERVAL_MS);

    // Start local tick interval (UI display)
    if (localTickIntervalRef.current) clearInterval(localTickIntervalRef.current);
    localTickIntervalRef.current = setInterval(tickLocal, LOCAL_TICK_INTERVAL_MS);

    // Start still-here check
    if (stillHereIntervalRef.current) clearInterval(stillHereIntervalRef.current);
    stillHereIntervalRef.current = setInterval(checkStillHere, 60_000);

    log("Tracking started", { questKey });
  }, [state, sendPing, tickLocal, checkStillHere]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    log("Stopping tracking");
    
    setState((prev) => prev ? {
      ...prev,
      isTracking: false,
      isPaused: false,
      showStillHerePrompt: false,
    } : null);

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (localTickIntervalRef.current) {
      clearInterval(localTickIntervalRef.current);
      localTickIntervalRef.current = null;
    }

    if (stillHereIntervalRef.current) {
      clearInterval(stillHereIntervalRef.current);
      stillHereIntervalRef.current = null;
    }
  }, []);

  // Confirm still here
  const confirmStillHere = useCallback(() => {
    recordActivity();
  }, [recordActivity]);

  // Set up activity listeners
  useEffect(() => {
    if (!state?.isTracking) return;

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
  }, [state?.isTracking, recordActivity]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (localTickIntervalRef.current) clearInterval(localTickIntervalRef.current);
      if (stillHereIntervalRef.current) clearInterval(stillHereIntervalRef.current);
    };
  }, []);

  const value: ActiveTimeContextValue = {
    state,
    startTracking,
    stopTracking,
    confirmStillHere,
  };

  return (
    <ActiveTimeContext.Provider value={value}>
      {children}
    </ActiveTimeContext.Provider>
  );
}
