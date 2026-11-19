import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { C as useNavigate, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { Bt as CircleCheckBig, et as LoaderCircle, p as TriangleAlert } from "../_libs/lucide-react.mjs";
import { Ot as Button, f as BrandLogo, tr as useAuth } from "./router-sXMnYegW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth_.confirmed-DoIrY_9K.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
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
var REDIRECT_DELAY_MS = 3e3;
/** How long to wait for a session before assuming verification failed. */
var VERIFY_TIMEOUT_MS = 1e4;
/**
* Supabase appends `error`/`error_description` to the redirect URL when a link is
* expired or already used. Reading it lets us show the real reason instead of
* waiting out the timeout for a generic message.
*/
function readLinkError() {
	if (typeof window === "undefined") return null;
	try {
		const fromHash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
		const fromQuery = new URLSearchParams(window.location.search);
		const description = fromHash.get("error_description") ?? fromQuery.get("error_description") ?? null;
		if (description) return description.replace(/\+/g, " ");
		return fromHash.get("error") ?? fromQuery.get("error");
	} catch {
		return null;
	}
}
function ConfirmedPage() {
	const { session } = useAuth();
	const navigate = useNavigate();
	const [linkError, setLinkError] = (0, import_react.useState)(null);
	const [timedOut, setTimedOut] = (0, import_react.useState)(false);
	const [redirecting, setRedirecting] = (0, import_react.useState)(false);
	const goneRef = (0, import_react.useRef)(false);
	const go = () => {
		if (goneRef.current) return;
		goneRef.current = true;
		navigate({
			to: "/home",
			replace: true
		});
	};
	(0, import_react.useEffect)(() => {
		setLinkError(readLinkError());
	}, []);
	(0, import_react.useEffect)(() => {
		if (session) return;
		const timer = setTimeout(() => setTimedOut(true), VERIFY_TIMEOUT_MS);
		return () => clearTimeout(timer);
	}, [session]);
	(0, import_react.useEffect)(() => {
		if (!session) return;
		setRedirecting(true);
		const timer = setTimeout(go, REDIRECT_DELAY_MS);
		return () => clearTimeout(timer);
	}, [session]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "auth-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-10",
		"data-testid": "auth-confirmed-page",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative w-full max-w-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col items-center gap-4 text-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "splash-logo-wrap relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-hidden": true,
						className: "splash-halo absolute inset-0 -z-10 rounded-[36%] blur-2xl"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandLogo, {
						variant: "light",
						className: "h-auto w-[220px] drop-shadow-md"
					})]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "surface-card auth-card-in mt-6 space-y-4 p-6 text-center shadow-lift",
				children: Boolean(linkError) || timedOut && !session ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-hidden": true,
						className: "mx-auto grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-7" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-xl leading-tight",
							"data-testid": "confirm-failed",
							children: "Your email is verified"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: linkError ? linkError : "Please log in to continue."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "jade",
						size: "lg",
						className: "w-full",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/auth",
							"data-testid": "confirm-try-login",
							children: "Log in"
						})
					})
				] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-hidden": true,
						className: "mx-auto grid size-14 place-items-center rounded-full bg-mint/15 text-primary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, { className: "success-pop size-7" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-2xl leading-tight",
							"data-testid": "confirm-success",
							children: "Email verified!"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "Your account is ready. Start earning with CashGPT."
						})]
					}),
					session ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "jade",
						size: "lg",
						className: "w-full",
						onClick: go,
						"data-testid": "confirm-continue",
						children: "Continue"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "inline-flex items-center justify-center gap-1.5 pt-2 text-sm text-muted-foreground",
						role: "status",
						"data-testid": "confirm-status",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
							className: "size-3.5 animate-spin",
							"aria-hidden": true
						}), "Signing you in…"]
					})
				] })
			})]
		})
	});
}
//#endregion
export { ConfirmedPage as component };
