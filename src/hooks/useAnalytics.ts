/**
 * Analytics hooks for tracking user events
 */

import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { track } from "@/lib/analytics/track";

/**
 * Track session start on mount
 * Fires once per session when the app first loads
 */
export function useSessionStart() {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;

    // Track session start
    track("session_start");
  }, []);
}

/**
 * Track page views on route changes
 * Fires whenever the user navigates to a new page
 */
export function usePageViewTracking() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const previousPathname = useRef<string | null>(null);

  useEffect(() => {
    // Skip if same page (shouldn't happen but defensive)
    if (previousPathname.current === pathname) return;

    // Track page view
    track("page_view", {
      from: previousPathname.current || undefined,
    });

    previousPathname.current = pathname;
  }, [pathname]);
}

/**
 * Track app going to background
 * Fires when visibility changes to hidden
 */
export function useAppBackgroundTracking() {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        track("app_background");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);
}

/**
 * Global error tracking for client errors
 * Tracks unhandled errors and promise rejections
 */
export function useClientErrorTracking() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Sanitize error message - remove tokens, emails, numbers
      let message = event.message || "Unknown error";
      
      // Strip numbers (could be IDs, tokens, phone numbers)
      message = message.replace(/\d+/g, "");
      
      // Strip emails
      message = message.replace(/\S+@\S+\.\S+/g, "");
      
      // Strip UUIDs and tokens
      message = message.replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, "");
      message = message.replace(/[a-zA-Z0-9_-]{20,}/g, "");
      
      // Truncate to 200 chars
      message = message.substring(0, 200);

      track("client_error", {
        route: pathname,
        message: message.trim() || "error",
        source: "error_event",
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      let message = "Promise rejection";
      
      if (event.reason instanceof Error) {
        message = event.reason.message;
      } else if (typeof event.reason === "string") {
        message = event.reason;
      }

      // Sanitize message
      message = message.replace(/\d+/g, "");
      message = message.replace(/\S+@\S+\.\S+/g, "");
      message = message.replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, "");
      message = message.replace(/[a-zA-Z0-9_-]{20,}/g, "");
      message = message.substring(0, 200);

      track("client_error", {
        route: pathname,
        message: message.trim() || "promise_error",
        source: "unhandled_rejection",
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, [pathname]);
}
