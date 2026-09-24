import { createFileRoute } from "@tanstack/react-router";

import { BrandLogo } from "@/components/AppShell";
import { GoogleIcon } from "@/components/GoogleIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthForm } from "@/hooks/useAuthForm";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — CashGPT" },
      { name: "description", content: "Sign in or create your CashGPT account to start earning." },
      { property: "og:title", content: "Sign in — CashGPT" },
      {
        property: "og:description",
        content: "Sign in or create your CashGPT account to start earning.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  // All Supabase calls, validation and redirects live in the shared hook, which the
  // web landing page reuses. Behaviour here is unchanged from before the extraction.
  const auth = useAuthForm({ initialMode: "signin", collectName: true });
  const { mode, busy, googleBusy, disabled } = auth;

  return (
    <main
      className="auth-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-10"
      data-testid="auth-page"
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
          <div className="space-y-1">
            <h1 className="font-display text-2xl leading-tight">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Watch, complete, cash out — real rewards in your wallet.
            </p>
          </div>
        </div>

        {/* OAuth first, then an "or" divider, then the email/password form. */}
        <div className="surface-card auth-card-in mt-6 space-y-3 p-5 shadow-lift">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full gap-2.5 bg-card"
            disabled={disabled}
            data-testid="auth-google-btn"
            onClick={() => void auth.signInWithGoogle()}
          >
            <GoogleIcon />
            {googleBusy ? "Redirecting…" : "Continue with Google"}
          </Button>

          <div className="flex items-center gap-3 pt-1" aria-hidden>
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              or
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>
        </div>

        <form
          key={mode}
          className="surface-card auth-card-in mt-3 space-y-3 p-5 shadow-lift"
          data-testid={`auth-form-${mode}`}
          onSubmit={(event) => void auth.submit(event)}
        >
          {mode === "signup" && (
            <div className="auth-fade-slide space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                name="name"
                autoComplete="name"
                maxLength={80}
                placeholder="Aditi Sharma"
                data-testid="auth-name-input"
                value={auth.name}
                onChange={(e) => auth.setName(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={255}
              placeholder="you@example.com"
              data-testid="auth-email-input"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              maxLength={72}
              placeholder="At least 8 characters"
              data-testid="auth-password-input"
            />
          </div>

          {mode === "signup" && (
            <div className="auth-fade-slide space-y-1.5">
              <Label htmlFor="referralCode">
                Referral code <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="referralCode"
                name="referralCode"
                maxLength={20}
                placeholder="Friend's code"
                data-testid="auth-referral-input"
                value={auth.referralCode}
                onChange={(e) => auth.setReferralCode(e.target.value.toUpperCase())}
                autoCapitalize="characters"
              />
            </div>
          )}

          <Button
            type="submit"
            variant="jade"
            size="lg"
            className="mt-1 w-full shadow-lift"
            disabled={disabled}
            data-testid="auth-submit-btn"
          >
            {busy
              ? mode === "signup"
                ? "Creating account…"
                : "Signing in…"
              : mode === "signup"
                ? "Create account"
                : "Sign in"}
          </Button>

          <button
            type="button"
            className="w-full pt-1 text-xs font-semibold text-primary transition-colors hover:text-primary-soft"
            data-testid="auth-mode-toggle"
            onClick={auth.toggleMode}
          >
            {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          By continuing you agree to our terms & privacy policy.
        </p>
      </div>
    </main>
  );
}
