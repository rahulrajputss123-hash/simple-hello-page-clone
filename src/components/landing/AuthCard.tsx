import { GoogleIcon } from "@/components/GoogleIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthFormApi } from "@/hooks/useAuthForm";

/**
 * Inline signup/login card for the web landing hero.
 *
 * Deliberately minimal — Google, email, password, one button and a small mode
 * toggle — so the submit button stays above the fold on a 390x800 screen. The
 * parent owns the {@link AuthFormApi} instance so the sticky header can switch
 * modes without this component remounting.
 *
 * Signup here skips the full-name field (`collectName: false`); Home's existing
 * fallback sends new accounts through /onboarding to enter their name.
 *
 * No social-proof figures are shown here: the only numbers on this page are ones
 * the app can actually back up.
 */
export function AuthCard({ auth, id = "auth" }: { auth: AuthFormApi; id?: string }) {
  const { mode, busy, googleBusy, disabled } = auth;
  const signup = mode === "signup";

  return (
    <div
      id={id}
      className="surface-card relative overflow-hidden p-4 shadow-lift sm:p-6"
      data-testid="landing-auth-card"
    >
      <div className="text-center">
        <h2 className="font-display text-xl leading-tight text-foreground sm:text-2xl">
          {signup ? "Sign up for free" : "Welcome back"}
        </h2>
        {/* Hidden on the smallest screens purely to keep the submit button above
            the fold; the heading already carries the message. */}
        <p className="mt-1 hidden text-[13px] text-muted-foreground sm:block">
          {signup
            ? "Create your account and start earning today."
            : "Log in to pick up where you left off."}
        </p>
      </div>

      {/* Email first, Google second: it keeps the submit button above the fold on a
          390x800 screen, which is the whole point of this compact card. */}
      <form
        className="mt-4 space-y-3"
        data-testid={`landing-auth-form-${mode}`}
        onSubmit={(event) => void auth.submit(event)}
      >
        <div className="space-y-1.5">
          <Label htmlFor="landing-email">Email</Label>
          <Input
            id="landing-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={255}
            placeholder="you@example.com"
            data-testid="landing-email-input"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="landing-password">Password</Label>
          <Input
            id="landing-password"
            name="password"
            type="password"
            required
            autoComplete={signup ? "new-password" : "current-password"}
            maxLength={72}
            placeholder="At least 8 characters"
            data-testid="landing-password-input"
          />
        </div>

        {/* A code from an invite link is applied silently — no extra field to fill. */}
        {signup && auth.hasReferral && (
          <p
            className="rounded-xl bg-mint/10 px-3 py-2 text-[11px] font-medium text-primary"
            data-testid="landing-referral-applied"
          >
            Referral code <span className="font-bold">{auth.referralCode}</span> applied
          </p>
        )}

        <Button
          type="submit"
          variant="gold"
          size="lg"
          className="shimmer-sweep mt-1 w-full"
          disabled={disabled}
          data-testid="landing-auth-submit"
        >
          {busy
            ? signup
              ? "Creating account…"
              : "Signing in…"
            : signup
              ? "Create free account"
              : "Log in"}
        </Button>

        <button
          type="button"
          className="w-full text-xs font-semibold text-primary transition-colors hover:text-primary-soft"
          data-testid="landing-auth-toggle"
          onClick={auth.toggleMode}
        >
          {signup ? "Already have an account? Log in" : "New here? Create a free account"}
        </button>
      </form>

      <div className="mt-3 flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-border" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          or
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="mt-3 w-full gap-2.5 bg-card"
        disabled={disabled}
        data-testid="landing-google-btn"
        onClick={() => void auth.signInWithGoogle()}
      >
        <GoogleIcon />
        {googleBusy ? "Redirecting…" : "Continue with Google"}
      </Button>

      <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
        Free to join. No card details needed.
      </p>
    </div>
  );
}
