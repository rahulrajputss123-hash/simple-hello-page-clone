import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CircleCheckBig, Loader2, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { BrandLogo } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

/**
 * Landing page for the email-confirmation link (emailRedirectTo in useAuthForm).
 *
 * Previously the link pointed at "/", where WebEntry paints a blank placeholder
 * while it verifies the session in the background — so a slow or failed
 * verification (in-app browsers with restricted storage, expired links) left the
 * user staring at an empty screen with no way out.
 *
 * FILE NAME: `auth_.confirmed.tsx`, not `auth/confirmed.tsx`. The trailing
 * underscore opts out of nesting under `auth.tsx`, which renders no <Outlet /> —
 * nesting would have rendered the sign-in page here instead of this one.
 *
 * SSR is deliberately left ON so the confirmation markup is in the server
 * response and paints immediately. Session detection then happens on hydration.
 */

/** How long the success state shows before redirecting. */
const REDIRECT_DELAY_MS = 1800;
/** How long to wait for a session before assuming verification failed. */
const VERIFY_TIMEOUT_MS = 9000;

export const Route = createFileRoute("/auth_/confirmed")({
  head: () => ({
    meta: [
      { title: "Email verified — CashGPT" },
      // A one-shot confirmation URL has no business in search results.
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ConfirmedPage,
});

/**
 * Supabase appends `error`/`error_description` to the redirect URL when a link is
 * expired or already used. Reading it lets us show the real reason instead of
 * waiting out the timeout for a generic message.
 */
function readLinkError(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromHash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const fromQuery = new URLSearchParams(window.location.search);
    const description =
      fromHash.get("error_description") ?? fromQuery.get("error_description") ?? null;
    if (description) return description.replace(/\+/g, " ");
    return fromHash.get("error") ?? fromQuery.get("error");
  } catch {
    return null;
  }
}

function ConfirmedPage() {
  // `loading` is intentionally not read — see the note on `failed` below.
  const { session } = useAuth();
  const navigate = useNavigate();

  const [linkError, setLinkError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const goneRef = useRef(false);

  const go = () => {
    if (goneRef.current) return;
    goneRef.current = true;
    // /home handles its own onboarding redirect for brand-new accounts.
    void navigate({ to: "/home", replace: true });
  };

  // An explicit error on the URL is conclusive — don't wait for the timeout.
  useEffect(() => {
    setLinkError(readLinkError());
  }, []);

  // Fallback so this page can never hang indefinitely.
  useEffect(() => {
    if (session) return;
    const timer = setTimeout(() => setTimedOut(true), VERIFY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [session]);

  // Session confirmed: hold the success state briefly, then move on.
  useEffect(() => {
    if (!session) return;
    setRedirecting(true);
    const timer = setTimeout(go, REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  /**
   * Deliberately NOT gated on `loading`. If the auth check itself never settles —
   * the restricted-storage in-app-browser case this page exists for — then still
   * being "loading" after the timeout IS the failure, and gating on it would
   * reintroduce the stuck-forever screen.
   */
  const failed = Boolean(linkError) || (timedOut && !session);

  return (
    <main
      className="auth-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-10"
      data-testid="auth-confirmed-page"
    >
      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="splash-logo-wrap relative">
            <span
              aria-hidden
              className="splash-halo absolute inset-0 -z-10 rounded-[36%] blur-2xl"
            />
            <BrandLogo variant="light" className="h-auto w-[220px] drop-shadow-md" />
          </div>
        </div>

        <div className="surface-card auth-card-in mt-6 space-y-4 p-6 text-center shadow-lift">
          {failed ? (
            <>
              <span
                aria-hidden
                className="mx-auto grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive"
              >
                <TriangleAlert className="size-7" />
              </span>
              <div className="space-y-1">
                <h1 className="font-display text-xl leading-tight" data-testid="confirm-failed">
                  We couldn&apos;t finish signing you in
                </h1>
                <p className="text-sm text-muted-foreground">
                  {linkError
                    ? linkError
                    : "Your email may be confirmed already, but this browser couldn't complete the sign-in. Logging in directly will sort it out."}
                </p>
              </div>
              <Button asChild variant="jade" size="lg" className="w-full">
                <Link to="/auth" data-testid="confirm-try-login">
                  Try logging in
                </Link>
              </Button>
            </>
          ) : (
            <>
              <span
                aria-hidden
                className="mx-auto grid size-14 place-items-center rounded-full bg-mint/15 text-primary"
              >
                <CircleCheckBig className="success-pop size-7" />
              </span>
              <div className="space-y-1">
                {/* Rendered server-side, so this is on screen from the first paint
                    rather than after the session check resolves. */}
                <h1 className="font-display text-2xl leading-tight" data-testid="confirm-success">
                  Email verified!
                </h1>
                <p
                  className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground"
                  role="status"
                  data-testid="confirm-status"
                >
                  {redirecting ? (
                    "Taking you to your dashboard…"
                  ) : (
                    <>
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                      Signing you in…
                    </>
                  )}
                </p>
              </div>
              <Button
                variant="jade"
                size="lg"
                className="w-full"
                onClick={go}
                data-testid="confirm-continue"
              >
                Continue
              </Button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
