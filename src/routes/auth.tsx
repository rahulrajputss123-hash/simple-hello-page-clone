import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { BrandLogo } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — CashGPT" },
      { name: "description", content: "Sign in or create your CashGPT account to start earning." },
      { property: "og:title", content: "Sign in — CashGPT" },
      { property: "og:description", content: "Sign in or create your CashGPT account to start earning." },
    ],
  }),
  component: AuthPage,
});

const signinSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

const signupSchema = signinSchema.extend({
  name: z.string().trim().min(2, "Please enter your full name").max(80),
  referralCode: z.string().trim().max(20).optional(),
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const { session } = useAuth();
  const navigate = useNavigate();

  // Capture ?ref=CODE from an invite link so the profile is attributed on first sign-in.
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) {
      const clean = ref.trim().toUpperCase().slice(0, 20);
      window.localStorage.setItem("coinquest.ref", clean);
      setReferralCode(clean);
    } else {
      const stored = window.localStorage.getItem("coinquest.ref");
      if (stored) setReferralCode(stored);
    }
  }, []);

  useEffect(() => {
    if (session) navigate({ to: "/home", replace: true });
  }, [session, navigate]);

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

        <form
          key={mode}
          className="surface-card auth-card-in mt-6 space-y-3 p-5 shadow-lift"
          data-testid={`auth-form-${mode}`}
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const raw = {
              email: String(form.get("email") ?? ""),
              password: String(form.get("password") ?? ""),
              name: name.trim(),
              referralCode: referralCode.trim().toUpperCase(),
            };
            const parsed =
              mode === "signup"
                ? signupSchema.safeParse(raw)
                : signinSchema.safeParse({ email: raw.email, password: raw.password });
            if (!parsed.success) {
              toast.error(parsed.error.issues[0]?.message ?? "Check your details.");
              return;
            }
            setBusy(true);
            try {
              if (mode === "signup") {
                const data = parsed.data as z.infer<typeof signupSchema>;
                const { error } = await supabase.auth.signUp({
                  email: data.email,
                  password: data.password,
                  options: { emailRedirectTo: window.location.origin },
                });
                if (error) throw error;
                // Persist the signup-only fields so the authenticated home page can
                // silently call completeOnboarding once the profile row exists.
                window.localStorage.setItem(
                  "coinquest.pending_onboarding",
                  JSON.stringify({ name: data.name }),
                );
                if (data.referralCode) {
                  window.localStorage.setItem("coinquest.ref", data.referralCode);
                }
                toast.success("Check your email to confirm your account.");
              } else {
                const { error } = await supabase.auth.signInWithPassword(
                  parsed.data as z.infer<typeof signinSchema>,
                );
                if (error) throw error;
              }
            } catch (error) {
              toast.error((error as Error).message);
            } finally {
              setBusy(false);
            }
          }}
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
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                autoCapitalize="characters"
              />
            </div>
          )}

          <Button
            type="submit"
            variant="jade"
            size="lg"
            className="mt-1 w-full shadow-lift"
            disabled={busy}
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
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
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
