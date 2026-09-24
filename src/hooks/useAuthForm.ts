import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

/**
 * Shared signup/login behaviour, extracted from the /auth route so the web landing
 * page can host the same form inline without a second copy of the Supabase calls.
 *
 * This module owns no new auth rules: the schemas, the referral-code capture, the
 * localStorage keys, the toasts and the post-session redirect are all lifted from
 * `src/routes/auth.tsx` unchanged. `AuthProvider` is untouched.
 */

export type AuthMode = "signin" | "signup";

export const signinSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

export const signupSchema = signinSchema.extend({
  name: z.string().trim().min(2, "Please enter your full name").max(80),
  referralCode: z.string().trim().max(20).optional(),
});

/** Signup without a name field, for the compact landing-page form. */
export const signupWithoutNameSchema = signinSchema.extend({
  referralCode: z.string().trim().max(20).optional(),
});

export type UseAuthFormOptions = {
  /** Which mode the form opens in. /auth opens on signin, the landing on signup. */
  initialMode?: AuthMode;
  /**
   * Whether signup asks for a full name.
   *
   * `true` (the /auth route) stores the name under `coinquest.pending_onboarding`
   * so Home can silently finish onboarding. `false` (the landing's minimal
   * two-field form) skips it, and Home's existing fallback routes the user to
   * /onboarding to enter their name there.
   */
  collectName?: boolean;
};

export function useAuthForm({
  initialMode = "signin",
  collectName = true,
}: UseAuthFormOptions = {}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
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

  const signInWithGoogle = async () => {
    setGoogleBusy(true);
    try {
      // Persist the referral code before leaving the page: the OAuth round-trip
      // returns to this same origin, so localStorage survives and AuthProvider
      // reads it when it creates the profile.
      const code = referralCode.trim().toUpperCase();
      if (code) window.localStorage.setItem("coinquest.ref", code);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
      // On success the browser navigates away; leave the button busy.
    } catch (error) {
      toast.error((error as Error).message);
      setGoogleBusy(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const raw = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      name: name.trim(),
      referralCode: referralCode.trim().toUpperCase(),
    };

    const signupParse = collectName
      ? signupSchema.safeParse(raw)
      : signupWithoutNameSchema.safeParse({
          email: raw.email,
          password: raw.password,
          referralCode: raw.referralCode,
        });
    const parsed =
      mode === "signup"
        ? signupParse
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
        if (collectName && data.name) {
          window.localStorage.setItem(
            "coinquest.pending_onboarding",
            JSON.stringify({ name: data.name }),
          );
        }
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
  };

  return {
    mode,
    setMode,
    /** True once a referral code has been captured from ?ref= or localStorage. */
    hasReferral: referralCode.trim().length > 0,
    toggleMode: () => setMode((current) => (current === "signup" ? "signin" : "signup")),
    busy,
    googleBusy,
    /** Any in-flight request — use for disabling every control at once. */
    disabled: busy || googleBusy,
    name,
    setName,
    referralCode,
    setReferralCode,
    submit,
    signInWithGoogle,
  };
}

/** Everything {@link useAuthForm} exposes — lets a parent own the state and pass it down. */
export type AuthFormApi = ReturnType<typeof useAuthForm>;
