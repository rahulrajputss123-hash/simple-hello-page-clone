import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useState } from "react";

import { AppLoadingScreen } from "@/components/AppLoadingScreen";
import { WebLanding } from "@/components/landing/WebLanding";
import { LANDING_DESCRIPTION, LANDING_TITLE } from "@/components/landing/landing-data";
import { useIsNative } from "@/hooks/useIsNative";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: LANDING_TITLE },
      { name: "description", content: LANDING_DESCRIPTION },
      { name: "robots", content: "index,follow" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "CashGPT" },
      { property: "og:title", content: LANDING_TITLE },
      { property: "og:description", content: LANDING_DESCRIPTION },
      { property: "og:url", content: "https://cashgpt.in/" },
      { property: "og:image", content: "https://cashgpt.in/logo-horizontal-light.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: LANDING_TITLE },
      { name: "twitter:description", content: LANDING_DESCRIPTION },
      { name: "twitter:image", content: "https://cashgpt.in/logo-horizontal-light.png" },
    ],
    links: [{ rel: "canonical", href: "https://cashgpt.in/" }],
  }),
  component: IndexRoute,
});

/**
 * Root entry. Two completely separate experiences share this path:
 *
 * - Native (Capacitor shell): the original splash → /auth | /onboarding | /home
 *   redirect, unchanged.
 * - Web (cashgpt.in): the marketing landing with inline signup, no splash.
 *
 * The web branch is what gets server-rendered, so crawlers index real landing
 * markup. `useIsNative` corrects before paint inside the app shell, and the native
 * splash still covers "/" there, so the packaged app shows no landing frame.
 */
function IndexRoute() {
  return useIsNative() ? <NativeSplash /> : <WebEntry />;
}

/** The pre-existing native behaviour, moved verbatim behind the platform check. */
function NativeSplash() {
  const { session, loading, profile, profileLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/auth", replace: true });
      return;
    }
    if (profileLoading) return;
    navigate({ to: profile && !profile.onboarded ? "/onboarding" : "/home", replace: true });
  }, [session, loading, profile, profileLoading, navigate]);

  return <AppLoadingScreen />;
}

/**
 * Reads whether supabase-js has a persisted session without touching AuthProvider.
 *
 * supabase-js stores its token under `sb-<project-ref>-auth-token`, so the presence
 * of that key is a reliable "this visitor is probably signed in" hint that's
 * available synchronously — before the async session check resolves. Used only to
 * decide whether to paint the landing, never to authorise anything.
 */
function hasPersistedSession(): boolean {
  try {
    for (let index = 0; index < window.localStorage.length; index++) {
      const key = window.localStorage.key(index);
      if (key && /^sb-.+-auth-token$/.test(key) && window.localStorage.getItem(key)) return true;
    }
  } catch {
    // Storage can be unavailable (private mode, blocked cookies) — assume logged out.
  }
  return false;
}

function WebEntry() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  // Signed-in visitors should never see the marketing page. Checking the persisted
  // token in a layout effect (before paint) swaps the landing for a neutral
  // placeholder while the real session check finishes, so there's no flash either
  // way: logged-out visitors keep the server-rendered landing untouched.
  const [returning, setReturning] = useState(false);
  useLayoutEffect(() => {
    setReturning(hasPersistedSession());
  }, []);

  useEffect(() => {
    if (session) navigate({ to: "/home", replace: true });
  }, [session, navigate]);

  if (returning && (loading || session)) {
    return (
      <div className="min-h-screen bg-background" data-testid="web-entry-placeholder">
        <span className="sr-only" role="status">
          Loading
        </span>
      </div>
    );
  }

  return <WebLanding />;
}
