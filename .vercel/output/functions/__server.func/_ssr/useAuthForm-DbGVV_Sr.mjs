import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { C as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as supabase, t as safeStorage } from "./client-QOMq7HzS.mjs";
import { l as stringType, s as objectType } from "../_libs/zod.mjs";
import { tr as useAuth } from "./router-sXMnYegW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/useAuthForm-DbGVV_Sr.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Flat multi-colour Google "G". Inline so no icon dependency is needed. */
function GoogleIcon() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 18 18",
		className: "size-[1.15rem] shrink-0",
		"aria-hidden": true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "#4285F4",
				d: "M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62Z"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "#34A853",
				d: "M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H1.96v2.33A8.99 8.99 0 0 0 9 18Z"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "#FBBC05",
				d: "M3.97 10.71a5.41 5.41 0 0 1 0-3.42V4.96H1.96a8.99 8.99 0 0 0 0 8.08l2.01-2.33Z"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "#EA4335",
				d: "M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A8.99 8.99 0 0 0 1.96 4.96l2.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
			})
		]
	});
}
var signinSchema = objectType({
	email: stringType().trim().email("Enter a valid email").max(255),
	password: stringType().min(6, "Use at least 6 characters").max(72)
});
var signupSchema = signinSchema.extend({
	name: stringType().trim().min(2, "Please enter your full name").max(80),
	referralCode: stringType().trim().max(20).optional()
});
/** Signup without a name field, for the compact landing-page form. */
var signupWithoutNameSchema = signinSchema.extend({ referralCode: stringType().trim().max(20).optional() });
function useAuthForm({ initialMode = "signin", collectName = true } = {}) {
	const [mode, setMode] = (0, import_react.useState)(initialMode);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [googleBusy, setGoogleBusy] = (0, import_react.useState)(false);
	const [name, setName] = (0, import_react.useState)("");
	const [referralCode, setReferralCode] = (0, import_react.useState)("");
	const [termsAccepted, setTermsAccepted] = (0, import_react.useState)(false);
	const { session } = useAuth();
	const navigate = useNavigate();
	(0, import_react.useEffect)(() => {
		const ref = new URLSearchParams(window.location.search).get("ref");
		if (ref) {
			const clean = ref.trim().toUpperCase().slice(0, 20);
			safeStorage.setItem("coinquest.ref", clean);
			setReferralCode(clean);
		} else {
			const stored = safeStorage.getItem("coinquest.ref");
			if (stored) setReferralCode(stored);
		}
	}, []);
	(0, import_react.useEffect)(() => {
		if (session) navigate({
			to: "/home",
			replace: true
		});
	}, [session, navigate]);
	const signInWithGoogle = async () => {
		if (mode === "signup" && !termsAccepted) {
			toast.error("Please accept the Terms and Privacy Policy to continue");
			return;
		}
		setGoogleBusy(true);
		try {
			const code = referralCode.trim().toUpperCase();
			if (code) safeStorage.setItem("coinquest.ref", code);
			const { error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: { redirectTo: "https://cashgpt.in" }
			});
			if (error) throw error;
		} catch (error) {
			toast.error(error.message);
			setGoogleBusy(false);
		}
	};
	const submit = async (event) => {
		event.preventDefault();
		if (mode === "signup" && !termsAccepted) {
			toast.error("Please accept the Terms and Privacy Policy to continue");
			return;
		}
		const form = new FormData(event.currentTarget);
		const raw = {
			email: String(form.get("email") ?? ""),
			password: String(form.get("password") ?? ""),
			name: name.trim(),
			referralCode: referralCode.trim().toUpperCase()
		};
		const signupParse = collectName ? signupSchema.safeParse(raw) : signupWithoutNameSchema.safeParse({
			email: raw.email,
			password: raw.password,
			referralCode: raw.referralCode
		});
		const parsed = mode === "signup" ? signupParse : signinSchema.safeParse({
			email: raw.email,
			password: raw.password
		});
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "Check your details.");
			return;
		}
		setBusy(true);
		try {
			if (mode === "signup") {
				const data = parsed.data;
				const { error } = await supabase.auth.signUp({
					email: data.email,
					password: data.password,
					options: { emailRedirectTo: `https://cashgpt.in/auth/confirmed` }
				});
				if (error) throw error;
				if (collectName && data.name) safeStorage.setItem("coinquest.pending_onboarding", JSON.stringify({ name: data.name }));
				if (data.referralCode) safeStorage.setItem("coinquest.ref", data.referralCode);
				toast.success("Check your email to confirm your account.");
			} else {
				const { error } = await supabase.auth.signInWithPassword(parsed.data);
				if (error) throw error;
			}
		} catch (error) {
			toast.error(error.message);
		} finally {
			setBusy(false);
		}
	};
	return {
		mode,
		setMode,
		/** True once a referral code has been captured from ?ref= or localStorage. */
		hasReferral: referralCode.trim().length > 0,
		toggleMode: () => setMode((current) => current === "signup" ? "signin" : "signup"),
		busy,
		googleBusy,
		/** Any in-flight request — use for disabling every control at once. */
		disabled: busy || googleBusy,
		name,
		setName,
		referralCode,
		setReferralCode,
		termsAccepted,
		setTermsAccepted,
		submit,
		signInWithGoogle
	};
}
//#endregion
export { useAuthForm as n, GoogleIcon as t };
