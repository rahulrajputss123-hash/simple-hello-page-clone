import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { C as useNavigate, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { C as Sparkles, O as ShieldCheck, X as Megaphone, bt as Flame, en as BadgeCheck, i as Wallet, in as ArrowRight, jt as Coins, ot as LayoutGrid, q as MousePointerClick, y as Target } from "../_libs/lucide-react.mjs";
import { t as safeStorage } from "./client-QOMq7HzS.mjs";
import { t as AVATAR_OPTIONS } from "./premium-BIRn1NQB.mjs";
import { D as Input, E as Label, F as FAQ_ITEMS, L as LANDING_DESCRIPTION, Ot as Button, P as EARN_WAYS, R as SHOWCASE_OFFERS, T as rememberAdvertiserIntent, V as WEB_HOW_IT_WORKS, j as useIsNative, p as BrandMark, tr as useAuth } from "./router-sXMnYegW.mjs";
import { t as SocialLinks } from "./SocialLinks-CoNrBIJy.mjs";
import { n as OffersShowcase, r as TrustSection, t as EarnWaysSection } from "./TrustSection-CKe3jRbO.mjs";
import { n as useAuthForm, t as GoogleIcon } from "./useAuthForm-DbGVV_Sr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-a7Jbq5e6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Brief transitional screen shown on `/` while the session resolves and the
* router decides where to send the user.
*
* Deliberately a continuation of SplashScreen: same jade radial wash, same
* `.splash-halo` glow and same `.splash-dot` loader, so the two screens read as
* one moment rather than two different apps. Pure CSS — no extra JS or assets,
* since this is on the critical path.
*/
function AppLoadingScreen({ message = "Loading your wallet…" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center",
		"data-testid": "app-loading-screen",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			"aria-hidden": true,
			className: "pointer-events-none absolute inset-0",
			style: { background: "radial-gradient(60% 45% at 50% 42%, rgba(34,197,94,0.18) 0%, rgba(15,61,58,0.10) 40%, transparent 75%)" }
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "splash-logo-wrap relative flex flex-col items-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-hidden": true,
						className: "splash-halo absolute -inset-4 -z-10 rounded-[40%] blur-2xl"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandMark, { className: "size-20" })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-6 font-display text-[28px] leading-none tracking-tight text-primary",
					children: "CashGPT"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: message
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 flex items-center gap-2",
					role: "status",
					"aria-label": "Loading",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "splash-dot" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "splash-dot" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "splash-dot" })
					]
				})
			]
		})]
	});
}
var ADVERTISER_ANCHOR_ID = "advertisers";
var BENEFITS = [
	{
		icon: Wallet,
		title: "Pay only for completions",
		text: "Clicks and starts are free. Your Campaign Balance is charged when a member completes your task."
	},
	{
		icon: BadgeCheck,
		title: "Auto-verified or manual proof",
		text: "Let installs, views and surveys verify themselves, or review screenshots for sign-ups and follows."
	},
	{
		icon: ShieldCheck,
		title: "Every campaign is reviewed",
		text: "New campaigns are checked by the CashGPT team, usually within one business day, before going live."
	},
	{
		icon: Sparkles,
		title: "Featured placement",
		text: "Put your campaign at the top of the member feed when you want extra visibility."
	}
];
var STEPS = [
	{
		title: "Add campaign funds",
		text: "Top up your Campaign Balance. Unused funds stay yours for the next campaign."
	},
	{
		title: "Create your task",
		text: "Set the reward, number of slots and how completions are verified."
	},
	{
		title: "Members complete it",
		text: "Track results live, approve proofs and pause any time."
	}
];
/**
* Preview of the advertiser dashboard. Illustrative only — it is labelled as a
* sample so no figure on it reads as a real result.
*/
function CampaignPreview() {
	const filled = 68;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative mx-auto w-full max-w-sm",
		"aria-label": "Sample campaign preview",
		"data-testid": "advertiser-preview",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-sky-500/10 blur-2xl"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card overflow-hidden shadow-lift",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between border-b border-border/70 bg-background-alt px-4 py-2.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-sky-700",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Megaphone, {
							className: "size-3.5",
							"aria-hidden": true
						}), " Campaign"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex items-center gap-1.5 rounded-full bg-mint/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary ring-1 ring-inset ring-mint/25",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "size-1.5 rounded-full bg-primary",
							"aria-hidden": true
						}), " Active"]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-base leading-tight text-foreground",
							children: "Install & open the app"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 text-xs text-muted-foreground",
							children: "Auto-verified · App install"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-end justify-between text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-foreground",
								children: "Slots completed"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-amount text-foreground",
								children: [filled, "%"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1.5 h-2 overflow-hidden rounded-full bg-background-alt",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full rounded-full bg-mint-gradient",
								style: { width: `${filled}%` }
							})
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-3 gap-2 text-center",
							children: [
								{
									label: "Completed",
									value: "340"
								},
								{
									label: "Pending",
									value: "12"
								},
								{
									label: "Slots left",
									value: "160"
								}
							].map((stat) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl bg-background-alt px-2 py-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-amount text-lg leading-none text-foreground",
									children: stat.value
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground",
									children: stat.label
								})]
							}, stat.label))
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-center text-[11px] text-muted-foreground",
				children: "Illustrative preview — not a real campaign."
			})
		]
	});
}
/**
* Landing-page promo for the advertiser side of the marketplace.
*
* Everything claimed here comes from how the advertiser flow already works
* (pay on completion, auto/manual verification, review before launch, featured
* placement, funds stay in balance). Pricing numbers are left out on purpose:
* they are admin-configurable.
*/
function AdvertiserSection({ onStart }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: ADVERTISER_ANCHOR_ID,
		"data-testid": "advertiser-section",
		"aria-labelledby": "advertiser-heading",
		className: "relative isolate scroll-mt-20 overflow-hidden rounded-[1.75rem] border border-border/70 bg-card px-4 py-9 shadow-card sm:px-8 sm:py-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute -right-20 -top-24 -z-10 size-72 rounded-full bg-sky-500/10 blur-3xl"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute -bottom-28 -left-20 -z-10 size-72 rounded-full bg-gold/10 blur-3xl"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-sky-700 ring-1 ring-inset ring-sky-500/25",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Target, {
							className: "size-3.5",
							"aria-hidden": true
						}), " For advertisers"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						id: "advertiser-heading",
						className: "mt-4 font-display text-[1.75rem] leading-[1.12] text-foreground sm:text-[2.4rem]",
						children: [
							"Got an app, offer or brand?",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-gold-dark",
								children: "Get real people to complete it."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base",
						children: "Launch a campaign on CashGPT and our members do the task for you. You only pay when a task is completed — never for clicks or starts."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-6 grid gap-3 sm:grid-cols-2",
						children: BENEFITS.map(({ icon: Icon, title, text }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex gap-3 rounded-2xl border border-border/70 bg-background/60 p-3.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid size-9 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-700",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
									className: "size-4",
									"aria-hidden": true
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-semibold leading-tight text-foreground",
									children: title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs leading-relaxed text-muted-foreground",
									children: text
								})]
							})]
						}, title))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-7 flex flex-col gap-3 sm:flex-row sm:items-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "jade",
							size: "lg",
							className: "px-7",
							onClick: onStart,
							"data-testid": "advertiser-cta",
							children: ["Start advertising", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground sm:max-w-[16rem]",
							children: [
								"Create a free account, then switch to ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Advertise" }),
								" mode in the app."
							]
						})]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CampaignPreview, {})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mt-10 grid gap-3 sm:grid-cols-3",
				"data-testid": "advertiser-steps",
				children: STEPS.map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-start gap-3 rounded-2xl bg-background-alt p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-hidden": true,
						className: "text-amount grid size-8 shrink-0 place-items-center rounded-xl bg-jade-gradient text-sm text-primary-foreground",
						children: index + 1
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "flex items-center gap-1.5 text-sm font-semibold text-foreground",
						children: [step.title, index === 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MousePointerClick, {
							className: "size-3.5 text-sky-700",
							"aria-hidden": true
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-0.5 text-xs leading-relaxed text-muted-foreground",
						children: step.text
					})] })]
				}, step.title))
			})
		]
	});
}
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
function AuthCard({ auth, id = "auth" }) {
	const { mode, busy, googleBusy, disabled } = auth;
	const signup = mode === "signup";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		id,
		className: "surface-card relative overflow-hidden p-4 shadow-lift sm:p-6",
		"data-testid": "landing-auth-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl leading-tight text-foreground sm:text-2xl",
					children: signup ? "Sign up for free" : "Welcome back"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 hidden text-[13px] text-muted-foreground sm:block",
					children: signup ? "Create your account and start earning today." : "Log in to pick up where you left off."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-4 space-y-3",
				"data-testid": `landing-auth-form-${mode}`,
				onSubmit: (event) => void auth.submit(event),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "landing-email",
							children: "Email"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "landing-email",
							name: "email",
							type: "email",
							required: true,
							autoComplete: "email",
							maxLength: 255,
							placeholder: "you@example.com",
							"data-testid": "landing-email-input"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "landing-password",
							children: "Password"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "landing-password",
							name: "password",
							type: "password",
							required: true,
							autoComplete: signup ? "new-password" : "current-password",
							maxLength: 72,
							placeholder: "At least 6 characters",
							"data-testid": "landing-password-input"
						})]
					}),
					signup && auth.hasReferral && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "rounded-xl bg-mint/10 px-3 py-2 text-[11px] font-medium text-primary",
						"data-testid": "landing-referral-applied",
						children: [
							"Referral code ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-bold",
								children: auth.referralCode
							}),
							" applied"
						]
					}),
					signup && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-2.5 pt-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							id: "landing-terms-checkbox",
							checked: auth.termsAccepted,
							onChange: (e) => auth.setTermsAccepted(e.target.checked),
							className: "mt-0.5 h-[18px] w-[18px] min-h-[44px] min-w-[44px] cursor-pointer rounded border-input accent-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:h-4 sm:w-4 sm:min-h-0 sm:min-w-0",
							"data-testid": "landing-terms-checkbox"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							htmlFor: "landing-terms-checkbox",
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
						variant: "gold",
						size: "lg",
						className: "mt-1 w-full",
						disabled: signup ? disabled || !auth.termsAccepted : disabled,
						"data-testid": "landing-auth-submit",
						children: busy ? signup ? "Creating account…" : "Signing in…" : signup ? "Create free account" : "Log in"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "w-full text-xs font-semibold text-primary transition-colors hover:text-primary-soft",
						"data-testid": "landing-auth-toggle",
						onClick: auth.toggleMode,
						children: signup ? "Already have an account? Log in" : "New here? Create a free account"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex items-center gap-3",
				"aria-hidden": true,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-border" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
						children: "or"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-border" })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "button",
				variant: "outline",
				size: "lg",
				className: "mt-3 w-full gap-2.5 bg-card",
				disabled: signup ? disabled || !auth.termsAccepted : disabled,
				"data-testid": "landing-google-btn",
				onClick: () => void auth.signInWithGoogle(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GoogleIcon, {}), googleBusy ? "Redirecting…" : "Continue with Google"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-center text-[11px] leading-relaxed text-muted-foreground",
				children: "Free to join. No card details needed."
			})
		]
	});
}
/** Transparent 3D art sliced from the generated sprite sheets (public/landing/phone). */
var ART = (name) => `/landing/phone/${name}.webp`;
/** Same order as EARN_WAYS: Ads, Shortlinks, Locker, Survey, App Install, Task, Deal, Games. */
var TILE_ART = [
	"cat-ads",
	"cat-shortlinks",
	"cat-locker",
	"cat-survey",
	"cat-install",
	"cat-task",
	"cat-deal",
	"cat-games"
];
var TILES = EARN_WAYS.map((way, index) => ({
	key: way.number,
	src: ART(TILE_ART[index]),
	label: way.title,
	sub: way.subtitle
}));
/** Placeholder handles, paired with the real showcase offers and payouts. */
var TOAST_NAMES = [
	"Aar***",
	"Lea**",
	"Dan***"
];
var CAROUSEL_MS = 2600;
var TOAST_MS = 5200;
var START_BALANCE = 12.4;
function usePrefersReducedMotion() {
	const [reduced, setReduced] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const query = window.matchMedia("(prefers-reduced-motion: reduce)");
		setReduced(query.matches);
		const onChange = () => setReduced(query.matches);
		query.addEventListener("change", onChange);
		return () => query.removeEventListener("change", onChange);
	}, []);
	return reduced;
}
/** Eases a displayed number toward `target` — used for the wallet balance. */
function useTween(target, enabled, ms = 800) {
	const [value, setValue] = (0, import_react.useState)(target);
	const fromRef = (0, import_react.useRef)(target);
	(0, import_react.useEffect)(() => {
		if (!enabled) {
			setValue(target);
			fromRef.current = target;
			return;
		}
		const from = fromRef.current;
		const start = performance.now();
		let frame = 0;
		const tick = (now) => {
			const t = Math.min((now - start) / ms, 1);
			const eased = 1 - Math.pow(1 - t, 3);
			const next = from + (target - from) * eased;
			setValue(next);
			fromRef.current = next;
			if (t < 1) frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	}, [
		target,
		enabled,
		ms
	]);
	return value;
}
function Floater({ src, className, depth, bob, size }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"aria-hidden": true,
		className: `hp-parallax pointer-events-none absolute ${className}`,
		style: { "--depth": `${depth}px` },
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src,
			alt: "",
			width: size,
			height: size,
			loading: "lazy",
			decoding: "async",
			draggable: false,
			className: `hp-anim hp-bob-${bob} drop-shadow-[0_10px_14px_rgba(20,60,55,0.28)]`,
			style: {
				width: size,
				height: size
			}
		})
	});
}
/**
* Animated phone preview of the app.
*
* The phone and everything on its screen is real markup (crisp at any DPI, nothing
* baked into a screenshot); only the glossy 3D icons are images. It is a labelled
* sample, not live data — the figures are illustrative.
*
* Motion is transform/opacity only. It pauses while off-screen and is static when
* the visitor prefers reduced motion. Mouse parallax is desktop-only.
*/
function HeroPhone() {
	const rootRef = (0, import_react.useRef)(null);
	const reduced = usePrefersReducedMotion();
	const [visible, setVisible] = (0, import_react.useState)(false);
	const running = visible && !reduced;
	const [active, setActive] = (0, import_react.useState)(0);
	const [toastIndex, setToastIndex] = (0, import_react.useState)(0);
	const [toastTick, setToastTick] = (0, import_react.useState)(0);
	const [balanceTarget, setBalanceTarget] = (0, import_react.useState)(START_BALANCE);
	const toastIndexRef = (0, import_react.useRef)(0);
	const balanceRef = (0, import_react.useRef)(START_BALANCE);
	balanceRef.current = balanceTarget;
	(0, import_react.useEffect)(() => {
		const node = rootRef.current;
		if (!node) return;
		const observer = new IntersectionObserver((entries) => setVisible(Boolean(entries[0]?.isIntersecting)), { threshold: .15 });
		observer.observe(node);
		return () => observer.disconnect();
	}, []);
	(0, import_react.useEffect)(() => {
		if (!running) return;
		const id = window.setInterval(() => setActive((a) => (a + 1) % TILES.length), CAROUSEL_MS);
		return () => window.clearInterval(id);
	}, [running]);
	(0, import_react.useEffect)(() => {
		if (!running) return;
		const id = window.setInterval(() => {
			const next = (toastIndexRef.current + 1) % SHOWCASE_OFFERS.length;
			toastIndexRef.current = next;
			setToastIndex(next);
			setToastTick((t) => t + 1);
			setBalanceTarget(next === 0 ? START_BALANCE : balanceRef.current + SHOWCASE_OFFERS[next].rewardAmount);
		}, TOAST_MS);
		return () => window.clearInterval(id);
	}, [running]);
	const balance = useTween(balanceTarget, running);
	const toast = SHOWCASE_OFFERS[toastIndex];
	const avatar = (0, import_react.useMemo)(() => AVATAR_OPTIONS[0], []);
	const onPointerMove = (event) => {
		if (reduced || event.pointerType !== "mouse") return;
		const node = rootRef.current;
		if (!node) return;
		const rect = node.getBoundingClientRect();
		const x = ((event.clientX - rect.left) / rect.width - .5) * 2;
		const y = ((event.clientY - rect.top) / rect.height - .5) * 2;
		node.style.setProperty("--mx", x.toFixed(3));
		node.style.setProperty("--my", y.toFixed(3));
	};
	const onPointerLeave = () => {
		rootRef.current?.style.setProperty("--mx", "0");
		rootRef.current?.style.setProperty("--my", "0");
	};
	const activeTile = TILES[active];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: rootRef,
		role: "img",
		"aria-label": "Preview of the CashGPT app: eight ways to earn, daily streaks and a wallet",
		"data-testid": "hero-phone",
		"data-running": running ? "true" : "false",
		onPointerMove,
		onPointerLeave,
		className: "hp-root relative mx-auto w-full max-w-[24rem] select-none py-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl",
				style: { background: "radial-gradient(closest-side, var(--color-mint), transparent)" }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Floater, {
				src: ART("coin"),
				size: 68,
				depth: 22,
				bob: "a",
				className: "right-1 top-4 z-20"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Floater, {
				src: ART("gem-amber"),
				size: 50,
				depth: 30,
				bob: "b",
				className: "left-0 top-24 z-20"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Floater, {
				src: ART("gem-emerald"),
				size: 52,
				depth: 26,
				bob: "c",
				className: "right-0 top-[44%] z-20"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Floater, {
				src: ART("trophy"),
				size: 70,
				depth: 18,
				bob: "b",
				className: "bottom-6 left-0 z-20"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "hp-parallax pointer-events-none absolute bottom-16 right-0 z-20",
				style: { "--depth": "14px" },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card w-[7.25rem] p-2.5 shadow-lift",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[9px] font-bold uppercase tracking-wide text-muted-foreground",
							children: "Earnings"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1.5 flex h-12 items-end gap-1",
							children: [
								38,
								56,
								44,
								72,
								52,
								90
							].map((h, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "hp-anim hp-grow block flex-1 origin-bottom rounded-sm",
								style: {
									height: `${h}%`,
									animationDelay: `${i * 140}ms`,
									background: i === 5 ? "var(--color-gold)" : "var(--color-primary)"
								}
							}, i))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-[9px] text-muted-foreground",
							children: "Sample"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "hp-tilt-wrap mx-auto w-[17rem]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					"aria-hidden": true,
					className: "hp-tilt relative rounded-[2.6rem] bg-[oklch(0.2_0.03_197)] p-[9px] shadow-lift ring-1 ring-black/10",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute -left-[3px] top-24 h-10 w-[3px] rounded-l bg-[oklch(0.28_0.03_197)]" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute -right-[3px] top-32 h-16 w-[3px] rounded-r bg-[oklch(0.28_0.03_197)]" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative h-[34.5rem] overflow-hidden rounded-[2.1rem] bg-background",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute left-1/2 top-2 z-10 h-[1.15rem] w-[4.6rem] -translate-x-1/2 rounded-full bg-[oklch(0.15_0.02_197)]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-3 px-3.5 pt-9",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: avatar.imageUrl,
												alt: "",
												width: 32,
												height: 32,
												loading: "lazy",
												className: "size-8 rounded-full object-cover ring-1 ring-border"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "min-w-0 flex-1 leading-tight",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[9px] text-muted-foreground",
													children: "Hello"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[12px] font-bold text-foreground",
													children: "Earner"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-amount inline-flex items-center gap-1 rounded-full bg-gold-gradient px-2.5 py-1 text-[12px] text-gold-foreground shadow-gold",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
														src: ART("coin"),
														alt: "",
														width: 14,
														height: 14,
														className: "size-3.5"
													}),
													"$",
													balance.toFixed(2)
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "relative h-[2.9rem]",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "hp-anim hp-toast surface-card absolute inset-0 flex items-center gap-2 px-2.5 shadow-soft",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "grid size-7 shrink-0 place-items-center rounded-lg bg-mint/20 text-[11px]",
													children: "✓"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "min-w-0 flex-1 truncate text-[10px] leading-tight text-foreground",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "font-bold",
															children: TOAST_NAMES[toastIndex]
														}),
														" completed",
														" ",
														toast.title
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-amount shrink-0 text-[11px] text-primary",
													children: [
														"+$",
														toast.rewardAmount,
														".00"
													]
												})
											]
										}, toastTick)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative h-[8.6rem] overflow-hidden rounded-2xl bg-background-alt",
										style: { perspective: "560px" },
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											"aria-hidden": true,
											className: "absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/30 blur-2xl"
										}), TILES.map((tile, index) => {
											const n = TILES.length;
											const d = (index - active + n + n / 2) % n - n / 2;
											const abs = Math.abs(d);
											const isActive = d === 0;
											return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: tile.src,
												alt: "",
												width: 76,
												height: 76,
												loading: "lazy",
												decoding: "async",
												draggable: false,
												className: "absolute left-1/2 top-1/2 size-[4.7rem] -ml-[2.35rem] -mt-[2.35rem] transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
												style: {
													transform: `translate3d(${d * 3.9}rem, 0, ${-abs * 40}px) rotateY(${d * -30}deg) scale(${isActive ? 1.18 : .84})`,
													opacity: abs > 2 ? 0 : 1 - abs * .28,
													zIndex: 10 - Math.round(abs),
													filter: isActive ? "drop-shadow(0 8px 10px rgba(20,60,55,0.35))" : "saturate(0.85)"
												}
											}, tile.key);
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-1.5 flex items-center justify-between px-0.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-[11px] font-bold leading-tight text-foreground",
											children: [activeTile.label, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "ml-1 font-medium text-muted-foreground",
												children: ["· ", activeTile.sub]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "flex gap-1",
											children: TILES.map((tile, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-1 rounded-full transition-all duration-500 ${index === active ? "w-3 bg-gold-dark" : "w-1 bg-border"}` }, tile.key))
										})]
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "surface-card flex items-center gap-2.5 p-2.5 shadow-soft",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0 flex-1",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[10px] font-bold uppercase tracking-wide text-foreground",
													children: "Daily streak"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "mt-1.5 h-2 overflow-hidden rounded-full bg-background-alt",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "hp-anim hp-fill h-full origin-left rounded-full bg-mint-gradient" })
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "mt-1 flex justify-between text-[8px] text-muted-foreground",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Day 1" }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Day 3" }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Day 7" })
													]
												})
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: ART("badge-star"),
											alt: "",
											width: 40,
											height: 40,
											loading: "lazy",
											className: "hp-anim hp-pop size-10"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "surface-card p-2.5 shadow-soft",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] font-bold uppercase tracking-wide text-foreground",
											children: "Daily goals"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-1.5 space-y-1.5",
											children: [{
												w: "100%",
												t: "Watch an ad"
											}, {
												w: "60%",
												t: "Finish a survey"
											}].map((goal) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "w-[4.6rem] shrink-0 text-[9px] text-muted-foreground",
													children: goal.t
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "h-1.5 flex-1 overflow-hidden rounded-full bg-background-alt",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "block h-full rounded-full bg-gold-gradient",
														style: { width: goal.w }
													})
												})]
											}, goal.t))
										})]
									})
								]
							})]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-center text-[11px] text-muted-foreground",
				children: "Illustrative preview — not real user data."
			})
		]
	});
}
var POINTS = [
	{
		icon: LayoutGrid,
		title: "Eight ways to earn, one feed",
		text: "Ads, shortlinks, lockers, surveys, app installs, tasks, deals and games — switch between them in a tap."
	},
	{
		icon: Flame,
		title: "Streaks and daily goals",
		text: "Come back each day to keep your streak going and tick off small goals for extra rewards."
	},
	{
		icon: Wallet,
		title: "A wallet you can actually cash out",
		text: "Watch your balance grow and withdraw once you reach $5."
	}
];
/** "See what's inside the app" — the phone preview with three short selling points. */
function AppPreviewSection() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		"data-testid": "app-preview-section",
		"aria-labelledby": "app-preview-heading",
		className: "relative isolate overflow-hidden rounded-[1.75rem] bg-background-alt px-4 py-9 sm:px-8 sm:py-12",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid items-center gap-6 lg:grid-cols-[1fr_1fr] lg:gap-10",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-center lg:text-left",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "inline-flex items-center gap-1.5 rounded-full bg-mint/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary ring-1 ring-inset ring-mint/25",
						children: "Inside the app"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						id: "app-preview-heading",
						className: "mt-3 font-display text-[1.7rem] leading-tight text-foreground sm:text-[2.2rem]",
						children: ["Everything you need to ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-gold-dark",
							children: "earn, in one place"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mx-auto mt-6 max-w-md space-y-4 text-left lg:mx-0",
						children: POINTS.map(({ icon: Icon, title, text }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid size-10 shrink-0 place-items-center rounded-xl bg-jade-gradient text-primary-foreground shadow-soft",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
									className: "size-4.5",
									"aria-hidden": true
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold text-foreground",
								children: title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-0.5 text-sm leading-relaxed text-muted-foreground",
								children: text
							})] })]
						}, title))
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeroPhone, {})]
		})
	});
}
/**
* One-shot "has this scrolled into view yet" flag for scroll-reveal animations.
*
* Attach `ref` to the element and apply the `reveal` / `reveal-in` classes from
* styles.css based on `shown`. The observer disconnects after the first
* intersection, so scrolling back up never replays the animation.
*
* Under `prefers-reduced-motion` it resolves to `true` immediately, which pairs
* with the CSS override that renders `.reveal` at its final position.
*
* @param threshold How much of the element must be visible. Default 0.15.
*/
function useScrollReveal(threshold = .15) {
	const ref = (0, import_react.useRef)(null);
	const [shown, setShown] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (shown) return;
		const node = ref.current;
		if (!node) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			setShown(true);
			return;
		}
		if (typeof IntersectionObserver === "undefined") {
			setShown(true);
			return;
		}
		let responded = false;
		const observer = new IntersectionObserver((entries) => {
			responded = true;
			if (!entries[0]?.isIntersecting) return;
			setShown(true);
			observer.disconnect();
		}, {
			threshold,
			rootMargin: "0px 0px -8% 0px"
		});
		observer.observe(node);
		const fallback = window.setTimeout(() => {
			if (!responded) setShown(true);
		}, 1500);
		return () => {
			window.clearTimeout(fallback);
			observer.disconnect();
		};
	}, [shown, threshold]);
	return {
		ref,
		shown
	};
}
/**
* Wraps content in a one-shot fade + rise as it scrolls into view.
*
* @param stagger Cascades the wrapper's direct children instead of moving the
*   wrapper as one block — use for card grids.
*/
function Reveal({ children, className = "", stagger = false, delayMs = 0 }) {
	const { ref, shown } = useScrollReveal();
	if (stagger) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref,
		className: `reveal-stagger ${shown ? "reveal-in" : ""} ${className}`,
		children
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref,
		style: delayMs ? { transitionDelay: `${delayMs}ms` } : void 0,
		className: `reveal ${shown ? "reveal-in" : ""} ${className}`,
		children
	});
}
/**
* Displays phrases one at a time in a continuous rotation. Each phrase stays
* visible for 2.5s, then transitions out (fade + slide up 8px) while the next
* phrase transitions in (fade + slide from 8px below). Layout is stable: all
* phrases occupy the same space using CSS grid layering.
*
* Pauses when the browser tab is hidden. Respects prefers-reduced-motion by
* showing only the first phrase with no rotation.
*/
function RotatingPhrase({ phrases, className = "" }) {
	const [activeIndex, cyclePhrase] = (0, import_react.useReducer)((i) => (i + 1) % phrases.length, 0);
	const timerRef = (0, import_react.useRef)(null);
	const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	(0, import_react.useEffect)(() => {
		if (prefersReducedMotion || phrases.length <= 1) return;
		const schedule = () => {
			timerRef.current = window.setTimeout(() => {
				cyclePhrase();
				schedule();
			}, 2500);
		};
		const handleVisibilityChange = () => {
			if (document.hidden) {
				if (timerRef.current) clearTimeout(timerRef.current);
			} else schedule();
		};
		schedule();
		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [phrases.length, prefersReducedMotion]);
	if (prefersReducedMotion) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className,
		children: phrases[0]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `inline-grid ${className}`,
		style: {
			gridTemplateColumns: "1fr",
			gridTemplateRows: "1fr"
		},
		"aria-hidden": "true",
		children: phrases.map((phrase, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "col-start-1 row-start-1 transition-all duration-400 ease-out",
			style: {
				opacity: i === activeIndex ? 1 : 0,
				transform: i === activeIndex ? "translateY(0)" : "translateY(8px)",
				visibility: i === activeIndex ? "visible" : "hidden"
			},
			children: phrase
		}, i))
	});
}
var LiveEarningsFeed = (0, import_react.lazy)(() => import("./LiveEarningsFeed-nSUcNTA8.mjs").then((mod) => ({ default: mod.LiveEarningsFeed })));
var AUTH_ANCHOR_ID = "auth";
/** FAQ rich-result markup. Answers are in the DOM regardless, via <details>. */
function faqJsonLd() {
	return JSON.stringify({
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: FAQ_ITEMS.map((item) => ({
			"@type": "Question",
			name: item.question,
			acceptedAnswer: {
				"@type": "Answer",
				text: item.answer
			}
		}))
	});
}
/**
* Public marketing + signup page for cashgpt.in.
*
* Rendered only on the web — `src/routes/index.tsx` keeps the native Capacitor
* shell on its original splash → redirect path. Signup/login is inline in the hero
* rather than on a separate screen, and runs through the same `useAuthForm` hook
* the /auth route uses, so there is one implementation of the Supabase calls.
*/
function WebLanding() {
	const auth = useAuthForm({
		initialMode: "signup",
		collectName: false
	});
	const authSectionRef = (0, import_react.useRef)(null);
	const [authInView, setAuthInView] = (0, import_react.useState)(true);
	const liveEarningsRef = (0, import_react.useRef)(null);
	const [showLiveEarnings, setShowLiveEarnings] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const node = authSectionRef.current;
		if (!node) return;
		const observer = new IntersectionObserver((entries) => setAuthInView(Boolean(entries[0]?.isIntersecting)), { threshold: .01 });
		observer.observe(node);
		return () => observer.disconnect();
	}, []);
	(0, import_react.useEffect)(() => {
		const node = liveEarningsRef.current;
		if (!node) return;
		const observer = new IntersectionObserver((entries) => {
			if (entries[0]?.isIntersecting) setShowLiveEarnings(true);
		}, { rootMargin: "300px" });
		observer.observe(node);
		return () => observer.disconnect();
	}, []);
	/**
	* Header/CTA handler. On desktop the auth card sits in the hero's right column
	* and is already on screen, so the mode switches in place with no scrolling. On
	* narrower screens the form is below the fold, so it smooth-scrolls to it.
	*/
	const goToAuth = (0, import_react.useCallback)((mode) => {
		auth.setMode(mode);
		const node = authSectionRef.current;
		if (!node) return;
		const desktop = window.matchMedia("(min-width: 1024px)").matches;
		const rect = node.getBoundingClientRect();
		const onScreen = rect.top < window.innerHeight * .85 && rect.bottom > 0;
		if (desktop && onScreen) return;
		node.scrollIntoView({
			behavior: "smooth",
			block: "center"
		});
	}, [auth]);
	const startAsAdvertiser = (0, import_react.useCallback)(() => {
		rememberAdvertiserIntent();
		goToAuth("signup");
	}, [goToAuth]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		"data-web-only": true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-40 border-b border-border/70 bg-background/95",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							"aria-label": "CashGPT home",
							className: "shrink-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: "/logo-horizontal-light.webp",
								alt: "CashGPT",
								width: 150,
								height: 36,
								className: "h-8 w-auto select-none sm:h-9",
								draggable: false
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
							className: "hidden items-center gap-1 text-sm font-semibold text-muted-foreground md:flex",
							"aria-label": "Sections",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "#how-it-works",
									className: "rounded-lg px-3 py-2 hover:text-foreground",
									children: "How it works"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: `#${ADVERTISER_ANCHOR_ID}`,
									className: "rounded-lg px-3 py-2 hover:text-foreground",
									"data-testid": "header-advertisers",
									children: "For advertisers"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "#faq",
									className: "rounded-lg px-3 py-2 hover:text-foreground",
									children: "FAQ"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
							className: "flex items-center gap-2",
							"aria-label": "Account",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "sm",
								className: "h-9 px-3",
								onClick: () => goToAuth("signin"),
								"data-testid": "header-login",
								children: "Log in"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "gold",
								size: "sm",
								className: "h-9 px-4",
								onClick: () => goToAuth("signup"),
								"data-testid": "header-signup",
								children: "Sign up"
							})]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "relative isolate overflow-hidden",
				"aria-labelledby": "landing-h1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					"aria-hidden": true,
					className: "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "absolute -left-24 -top-32 size-[28rem] rounded-full opacity-[0.18]",
							style: { background: "radial-gradient(closest-side, var(--color-mint), transparent)" }
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "absolute -right-28 top-10 size-[30rem] rounded-full opacity-[0.16]",
							style: { background: "radial-gradient(closest-side, var(--color-gold), transparent)" }
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coins, { className: "absolute left-[12%] top-[38%] size-8 text-gold opacity-20" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coins, { className: "absolute right-[8%] top-[22%] size-6 text-gold opacity-[0.15]" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coins, { className: "absolute left-[62%] bottom-[12%] size-7 text-gold opacity-[0.12] lg:left-[46%]" })
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto w-full max-w-6xl px-4 pb-10 pt-5 sm:px-6 sm:pb-14 sm:pt-12",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid items-center gap-5 lg:grid-cols-[1.05fr_minmax(350px,400px)] lg:gap-12",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: `#${ADVERTISER_ANCHOR_ID}`,
								"data-testid": "hero-advertiser-pill",
								className: "mb-3 inline-flex items-center gap-1.5 rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold text-sky-700 transition-colors hover:bg-sky-500/15 sm:mb-4 sm:text-xs",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Megaphone, {
										className: "size-3.5",
										"aria-hidden": true
									}),
									"Run a brand or app? Advertise on CashGPT",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
										className: "size-3",
										"aria-hidden": true
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
								id: "landing-h1",
								className: "font-display text-[1.72rem] leading-[1.12] text-foreground sm:text-[2.6rem] lg:text-[3.1rem]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "sr-only",
									children: "Earn real money online by completing tasks, unlocking lockers, claiming deals, visiting shortlinks, watching ads, taking surveys, installing apps and playing games"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									"aria-hidden": "true",
									children: [
										"Earn real money online",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotatingPhrase, {
											phrases: [
												"by completing tasks",
												"by unlocking lockers",
												"by claiming deals",
												"by visiting shortlinks",
												"by watching ads",
												"by taking surveys",
												"by installing apps",
												"by playing games"
											],
											className: "text-gold-dark"
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 max-w-xl text-[13px] leading-snug text-muted-foreground sm:mt-3 sm:text-base sm:leading-relaxed",
								children: "Free offers, surveys and games — cash out from just $5."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "sr-only",
								children: "Featured paid offers"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OffersShowcase, {
								variant: "compact",
								className: "mt-4 sm:mt-7"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
								className: "mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
											className: "size-3.5 text-primary",
											"aria-hidden": true
										}), " Free to join"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, {
											className: "size-3.5 text-primary",
											"aria-hidden": true
										}), " $5 minimum payout"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coins, {
											className: "size-3.5 text-primary",
											"aria-hidden": true
										}), " No card details"]
									})
								]
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							ref: authSectionRef,
							className: "lg:sticky lg:top-24",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthCard, {
								auth,
								id: AUTH_ANCHOR_ID
							})
						})]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto w-full max-w-6xl space-y-16 px-4 pb-16 sm:space-y-20 sm:px-6 sm:pb-20",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
						className: "content-visible-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppPreviewSection, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
						className: "content-visible-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EarnWaysSection, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "content-visible-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HowItWorks, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
						className: "content-visible-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdvertiserSection, { onStart: startAsAdvertiser })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
						className: "content-visible-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrustSection, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "content-visible-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Faq, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						ref: liveEarningsRef,
						className: "content-visible-auto",
						style: { minHeight: "600px" },
						children: showLiveEarnings ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
							fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex min-h-[600px] items-center justify-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-sm text-muted-foreground",
									children: "Loading live earnings..."
								})
							}),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveEarningsFeed, {}) })
						}) : null
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
						className: "content-visible-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FinalCta, {
							onStart: () => goToAuth("signup"),
							onAdvertise: startAsAdvertiser
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"data-testid": "sticky-start-bar",
				"aria-hidden": authInView,
				className: `fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 px-4 py-3 shadow-lift transition-transform duration-300 lg:hidden ${authInView ? "pointer-events-none translate-y-full" : "translate-y-0"}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "gold",
					size: "lg",
					className: "w-full",
					onClick: () => goToAuth("signup"),
					"data-testid": "sticky-start-btn",
					children: "Start earning free"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", {
				type: "application/ld+json",
				dangerouslySetInnerHTML: { __html: faqJsonLd() }
			})
		]
	});
}
function HowItWorks() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "how-it-works",
		"data-testid": "how-it-works",
		"aria-labelledby": "how-it-works-heading",
		className: "scroll-mt-20",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
				id: "how-it-works-heading",
				className: "font-display text-[1.6rem] leading-tight text-foreground sm:text-[2rem]",
				children: ["How it ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-gold-dark",
					children: "works"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mx-auto mt-2 max-w-md text-sm text-muted-foreground",
				children: "Three steps from signup to payout. No invites and no subscriptions."
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
			stagger: true,
			className: "mt-7 grid gap-4 sm:grid-cols-3",
			children: WEB_HOW_IT_WORKS.map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepCard, { step }, step.number))
		})]
	});
}
function StepCard({ step }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "surface-card flex flex-col gap-2 p-5 pt-6",
		"data-testid": `how-it-works-step-${step.number}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				"aria-hidden": true,
				className: "text-amount grid size-11 place-items-center rounded-2xl bg-jade-gradient text-lg text-primary-foreground shadow-lift",
				children: step.number
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mt-1 font-display text-lg leading-tight text-foreground",
				children: step.title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm leading-relaxed text-muted-foreground",
				children: step.description
			})
		]
	});
}
function Faq() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "faq",
		"data-testid": "faq",
		"aria-labelledby": "faq-heading",
		className: "scroll-mt-20",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
				id: "faq-heading",
				className: "font-display text-[1.6rem] leading-tight text-foreground sm:text-[2rem]",
				children: ["Questions, ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-gold-dark",
					children: "answered"
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
			className: "mx-auto mt-6 max-w-2xl space-y-3",
			children: FAQ_ITEMS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
				className: "surface-card group overflow-hidden p-0 [&_summary::-webkit-details-marker]:hidden",
				"data-testid": "faq-item",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", {
					className: "flex cursor-pointer items-center justify-between gap-3 p-4 text-left text-sm font-semibold text-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-sans text-sm font-semibold tracking-normal",
						children: item.question
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-hidden": true,
						className: "grid size-6 shrink-0 place-items-center rounded-full bg-background-alt text-primary transition-transform duration-200 group-open:rotate-45",
						children: "+"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-4 pb-4 text-sm leading-relaxed text-muted-foreground",
					children: item.answer
				})]
			}, item.question))
		})]
	});
}
function FinalCta({ onStart, onAdvertise }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		"data-testid": "final-cta",
		"aria-labelledby": "final-cta-heading",
		className: "relative isolate overflow-hidden rounded-[1.75rem] bg-jade-gradient px-5 py-10 text-center shadow-lift sm:px-10 sm:py-14",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute -left-16 -top-20 size-56 rounded-full opacity-40",
				style: { background: "radial-gradient(closest-side, var(--color-gold), transparent)" }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute -bottom-24 -right-16 size-56 rounded-full opacity-30",
				style: { background: "radial-gradient(closest-side, var(--color-mint), transparent)" }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						id: "final-cta-heading",
						className: "font-display text-[1.9rem] leading-tight text-primary-foreground sm:text-[2.5rem]",
						children: ["Start earning in ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-gold",
							children: "the next five minutes"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mx-auto mt-3 max-w-lg text-sm text-primary-foreground/75 sm:text-base",
						children: "Create a free account, finish a task or two, and withdraw as soon as you reach $5."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "gold",
						size: "lg",
						className: "mt-7 px-8",
						onClick: onStart,
						"data-testid": "final-cta-btn",
						children: ["Create my free account", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-5 text-xs text-primary-foreground/70",
						children: [
							"Promoting an app or brand?",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: onAdvertise,
								"data-testid": "final-cta-advertise",
								className: "font-semibold text-gold underline-offset-2 hover:underline",
								children: "Start advertising"
							})
						]
					})
				]
			})
		]
	});
}
function Footer() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
		className: "border-t border-border/70 bg-background-alt px-4 py-8 pb-24 sm:px-6 lg:pb-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex w-full max-w-6xl flex-col items-center gap-5 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: "/logo-horizontal-light.webp",
					alt: "CashGPT",
					width: 140,
					height: 34,
					loading: "lazy",
					className: "h-7 w-auto select-none",
					draggable: false
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SocialLinks, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
					className: "flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/legal/privacy",
							className: "transition-colors hover:text-foreground",
							children: "Privacy"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/legal/terms",
							className: "transition-colors hover:text-foreground",
							children: "Terms"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/legal/withdrawal-policy",
							className: "transition-colors hover:text-foreground",
							children: "Withdrawal Policy"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/legal/referral-terms",
							className: "transition-colors hover:text-foreground",
							children: "Referral Terms"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: `#${ADVERTISER_ANCHOR_ID}`,
							className: "transition-colors hover:text-foreground",
							children: "Advertise with us"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/app",
							className: "transition-colors hover:text-foreground",
							children: "Get the app"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted-foreground",
					children: [
						"Support:",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "mailto:support@cashgpt.in",
							className: "underline-offset-2 hover:underline",
							children: "support@cashgpt.in"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted-foreground",
					children: [
						"© ",
						(/* @__PURE__ */ new Date()).getFullYear(),
						" CashGPT. All rights reserved."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "sr-only",
					children: LANDING_DESCRIPTION
				})
			]
		})
	});
}
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
	return useIsNative() ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NativeSplash, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WebEntry, {});
}
/** The pre-existing native behaviour, moved verbatim behind the platform check. */
function NativeSplash() {
	const { session, loading, profile, profileLoading } = useAuth();
	const navigate = useNavigate();
	(0, import_react.useEffect)(() => {
		if (loading) return;
		if (!session) {
			navigate({
				to: "/auth",
				replace: true
			});
			return;
		}
		if (profileLoading) return;
		navigate({
			to: profile && !profile.onboarded ? "/onboarding" : "/home",
			replace: true
		});
	}, [
		session,
		loading,
		profile,
		profileLoading,
		navigate
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppLoadingScreen, {});
}
/**
* Reads whether supabase-js has a persisted session without touching AuthProvider.
*
* supabase-js stores its token under `sb-<project-ref>-auth-token`, so the presence
* of that key is a reliable "this visitor is probably signed in" hint that's
* available synchronously — before the async session check resolves. Used only to
* decide whether to paint the landing, never to authorise anything.
*/
function hasPersistedSession() {
	try {
		for (let index = 0; index < window.localStorage.length; index++) {
			const key = window.localStorage.key(index);
			if (key && /^sb-.+-auth-token$/.test(key) && safeStorage.getItem(key)) return true;
		}
		return false;
	} catch {
		return false;
	}
}
function WebEntry() {
	const { session, loading } = useAuth();
	const navigate = useNavigate();
	const [returning, setReturning] = (0, import_react.useState)(false);
	(0, import_react.useLayoutEffect)(() => {
		setReturning(hasPersistedSession());
	}, []);
	(0, import_react.useEffect)(() => {
		if (session) navigate({
			to: "/home",
			replace: true
		});
	}, [session, navigate]);
	if (returning && (loading || session)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen bg-background",
		"data-testid": "web-entry-placeholder",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			role: "status",
			children: "Loading"
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WebLanding, {});
}
//#endregion
export { IndexRoute as component };
