import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { D as Input, E as Label, Ot as Button, c as getMarketplaceSettings, f as BrandLogo, nr as useServerFn } from "./router-sXMnYegW.mjs";
import { n as useAuthForm, t as GoogleIcon } from "./useAuthForm-DbGVV_Sr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-DpvtoQTc.js
var import_jsx_runtime = require_jsx_runtime();
function AuthPage() {
	const auth = useAuthForm({
		initialMode: "signin",
		collectName: true
	});
	const { mode, busy, googleBusy, disabled } = auth;
	const fetchMarketplaceSettings = useServerFn(getMarketplaceSettings);
	const marketplaceSettings = useQuery({
		queryKey: ["marketplace-settings"],
		queryFn: () => fetchMarketplaceSettings()
	});
	const hasReferralCode = Boolean(auth.referralCode);
	const bonusPercent = marketplaceSettings.data?.first_deposit_bonus_percent ?? 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "auth-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-10",
		"data-testid": "auth-page",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative w-full max-w-sm",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-center gap-4 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "splash-logo-wrap relative",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": true,
							className: "splash-halo absolute inset-0 -z-10 rounded-[36%] blur-2xl"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandLogo, {
							variant: "light",
							className: "h-auto w-[220px] drop-shadow-md"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display text-2xl leading-tight",
								children: mode === "signup" ? "Create your account" : "Welcome back"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: "Watch, complete, cash out — real rewards in your wallet."
							}),
							hasReferralCode && mode === "signup" && bonusPercent > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary",
								children: [
									"🎉 You were invited — ",
									bonusPercent,
									"% bonus on your first deposit"
								]
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card auth-card-in mt-6 space-y-3 p-5 shadow-lift",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						variant: "outline",
						size: "lg",
						className: "w-full gap-2.5 bg-card",
						disabled: mode === "signup" ? disabled || !auth.termsAccepted : disabled,
						"data-testid": "auth-google-btn",
						onClick: () => void auth.signInWithGoogle(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GoogleIcon, {}), googleBusy ? "Redirecting…" : "Continue with Google"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 pt-1",
						"aria-hidden": true,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-border" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
								children: "or"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-border" })
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "surface-card auth-card-in mt-3 space-y-3 p-5 shadow-lift",
					"data-testid": `auth-form-${mode}`,
					onSubmit: (event) => void auth.submit(event),
					children: [
						mode === "signup" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "auth-fade-slide space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "name",
								children: "Full name"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "name",
								name: "name",
								autoComplete: "name",
								maxLength: 80,
								placeholder: "Aditi Sharma",
								"data-testid": "auth-name-input",
								value: auth.name,
								onChange: (e) => auth.setName(e.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "email",
								children: "Email"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "email",
								name: "email",
								type: "email",
								autoComplete: "email",
								maxLength: 255,
								placeholder: "you@example.com",
								"data-testid": "auth-email-input"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "password",
								children: "Password"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "password",
								name: "password",
								type: "password",
								autoComplete: mode === "signup" ? "new-password" : "current-password",
								maxLength: 72,
								placeholder: "At least 6 characters",
								"data-testid": "auth-password-input"
							})]
						}),
						mode === "signup" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "auth-fade-slide space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
								htmlFor: "referralCode",
								children: ["Referral code ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "(optional)"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "referralCode",
								name: "referralCode",
								maxLength: 20,
								placeholder: "Friend's code",
								"data-testid": "auth-referral-input",
								value: auth.referralCode,
								onChange: (e) => auth.setReferralCode(e.target.value.toUpperCase()),
								autoCapitalize: "characters"
							})]
						}),
						mode === "signup" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "auth-fade-slide flex items-start gap-2.5 pt-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								id: "terms-checkbox",
								checked: auth.termsAccepted,
								onChange: (e) => auth.setTermsAccepted(e.target.checked),
								className: "mt-0.5 h-[18px] w-[18px] min-h-[44px] min-w-[44px] cursor-pointer rounded border-input accent-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:h-4 sm:w-4 sm:min-h-0 sm:min-w-0",
								"data-testid": "auth-terms-checkbox"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								htmlFor: "terms-checkbox",
								className: "cursor-pointer select-none text-xs leading-relaxed text-muted-foreground",
								children: [
									"I agree to the",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										href: "/legal/terms",
										target: "_blank",
										rel: "noopener noreferrer",
										className: "font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary",
										children: "Terms of Service"
									}),
									" ",
									"and",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										href: "/legal/privacy",
										target: "_blank",
										rel: "noopener noreferrer",
										className: "font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary",
										children: "Privacy Policy"
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							variant: "jade",
							size: "lg",
							className: "mt-1 w-full shadow-lift",
							disabled: mode === "signup" ? disabled || !auth.termsAccepted : disabled,
							"data-testid": "auth-submit-btn",
							children: busy ? mode === "signup" ? "Creating account…" : "Signing in…" : mode === "signup" ? "Create account" : "Sign in"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "w-full pt-1 text-xs font-semibold text-primary transition-colors hover:text-primary-soft",
							"data-testid": "auth-mode-toggle",
							onClick: auth.toggleMode,
							children: mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"
						})
					]
				}, mode),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-center text-[11px] text-muted-foreground",
					children: mode === "signin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						"By continuing you agree to our",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "/legal/terms",
							target: "_blank",
							rel: "noopener noreferrer",
							className: "font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary",
							children: "Terms of Service"
						}),
						" ",
						"and",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "/legal/privacy",
							target: "_blank",
							rel: "noopener noreferrer",
							className: "font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary",
							children: "Privacy Policy"
						})
					] }) : null
				})
			]
		})
	});
}
//#endregion
export { AuthPage as component };
