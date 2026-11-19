import { i as __toESM } from "../_runtime.mjs";
import { o as formatMoney } from "./referral-progress-DmJLJmiB.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { T as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { Ft as CircleX, Ht as ChevronRight, Mt as Clock, Q as Lock, R as QrCode, et as LoaderCircle, i as Wallet, kt as CreditCard, zt as CircleCheck } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as formatShortDate, t as BackLink } from "./Preview-MVZOUW8x.mjs";
import { n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { At as abandonDeposit, D as Input, E as Label, Ht as getDepositStatus, It as createDeposit, Lt as createNowpaymentsDeposit, M as SectionHeading, Pt as confirmCheckout, Rt as createQropayDeposit, d as AppShell, nr as useServerFn, rn as useRole, tr as useAuth } from "./router-sXMnYegW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/funds-D6r2OsHA.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
var loading = null;
function loadRazorpayCheckout() {
	if (typeof window === "undefined") return Promise.reject(/* @__PURE__ */ new Error("Checkout only runs in the browser"));
	if (window.Razorpay) return Promise.resolve();
	if (loading) return loading;
	loading = new Promise((resolve, reject) => {
		const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
		const script = existing ?? document.createElement("script");
		const done = () => window.Razorpay ? resolve() : reject(/* @__PURE__ */ new Error("Razorpay failed to initialise"));
		script.addEventListener("load", done, { once: true });
		script.addEventListener("error", () => {
			loading = null;
			reject(/* @__PURE__ */ new Error("Couldn't load the payment form. Check your connection and try again."));
		}, { once: true });
		if (!existing) {
			script.src = SCRIPT_SRC;
			script.async = true;
			document.head.appendChild(script);
		}
	});
	return loading;
}
function openRazorpayCheckout(options) {
	if (!window.Razorpay) throw new Error("Razorpay checkout not loaded");
	const instance = new window.Razorpay(options);
	instance.open();
	return instance;
}
var PRESETS = [
	10,
	25,
	50,
	100
];
function friendlyError(err) {
	return (err instanceof Error ? err.message : String(err)).replace(/^[A-Z_]+: /, "");
}
function FundsPage() {
	const { session, profile, isAdmin } = useAuth();
	const { overview, refreshOverview, advertiserActivated, overviewLoading } = useRole();
	const settings = overview?.settings;
	const account = overview?.account;
	useRouter();
	const create = useServerFn(createDeposit);
	const createCrypto = useServerFn(createNowpaymentsDeposit);
	const createQropay = useServerFn(createQropayDeposit);
	const confirm = useServerFn(confirmCheckout);
	const abandon = useServerFn(abandonDeposit);
	const status = useServerFn(getDepositStatus);
	const [amount, setAmount] = (0, import_react.useState)("50");
	const [stage, setStage] = (0, import_react.useState)({ kind: "idle" });
	const pollTimer = (0, import_react.useRef)(null);
	const pollStarted = (0, import_react.useRef)(0);
	const recent = useQuery({
		queryKey: [
			"advertiser-deposits-recent",
			session?.user.id,
			overview?.recentDeposits.length
		],
		queryFn: async () => overview?.recentDeposits ?? [],
		enabled: Boolean(overview)
	});
	(0, import_react.useEffect)(() => {
		const depositId = new URLSearchParams(window.location.search).get("deposit");
		if (depositId && stage.kind === "idle") setStage({
			kind: "confirming",
			depositId,
			amountUsd: Number(amount) || 0
		});
	}, [amount, stage.kind]);
	(0, import_react.useEffect)(() => {
		if (stage.kind !== "confirming") return;
		pollStarted.current = Date.now();
		let cancelled = false;
		const tick = async () => {
			if (cancelled) return;
			try {
				const d = await status({ data: { depositId: stage.depositId } });
				if (d?.status === "succeeded") {
					await refreshOverview();
					setStage({
						kind: "succeeded",
						amountUsd: d.amountUsd
					});
					toast.success(`${formatMoney(d.amountUsd)} added to your Campaign Balance`);
					return;
				}
				if (d?.status === "failed" || d?.status === "reversed") {
					setStage({
						kind: "failed",
						reason: d.failureReason ?? "The payment didn't go through."
					});
					return;
				}
			} catch {}
			const delay = Date.now() - pollStarted.current < 3e4 ? 2e3 : 5e3;
			if (Date.now() - pollStarted.current < 18e4) pollTimer.current = setTimeout(tick, delay);
		};
		tick();
		return () => {
			cancelled = true;
			if (pollTimer.current) clearTimeout(pollTimer.current);
		};
	}, [
		stage,
		status,
		refreshOverview
	]);
	const deposit = useMutation({
		mutationFn: async (amountUsd) => {
			setStage({ kind: "creating" });
			await loadRazorpayCheckout();
			const order = await create({ data: { amountUsd } });
			setStage({
				kind: "checkout",
				depositId: order.depositId
			});
			return order;
		},
		onSuccess: (order) => {
			openRazorpayCheckout({
				key: order.keyId,
				amount: order.amountMinor,
				currency: order.currency,
				name: "CashGPT",
				description: `Campaign deposit ${formatMoney(order.amountUsd)}`,
				order_id: order.orderId,
				prefill: {
					name: profile?.name ?? void 0,
					email: session?.user.email ?? void 0
				},
				notes: { deposit_id: order.depositId },
				theme: { color: "#0f7a4f" },
				retry: { enabled: false },
				handler: (resp) => {
					setStage({
						kind: "confirming",
						depositId: order.depositId,
						amountUsd: order.amountUsd
					});
					confirm({ data: {
						depositId: order.depositId,
						orderId: resp.razorpay_order_id,
						paymentId: resp.razorpay_payment_id,
						signature: resp.razorpay_signature
					} }).catch((err) => {
						toast.error("Couldn't verify the payment response", { description: friendlyError(err) });
					});
				},
				modal: { ondismiss: () => {
					setStage((s) => {
						if (s.kind !== "checkout") return s;
						abandon({ data: {
							depositId: order.depositId,
							reason: "checkout_dismissed"
						} });
						return { kind: "idle" };
					});
				} }
			}).on("payment.failed", (resp) => {
				setStage({
					kind: "failed",
					reason: resp.error?.description ?? "Payment failed"
				});
			});
		},
		onError: (err) => {
			setStage({ kind: "idle" });
			toast.error("Couldn't start the deposit", { description: friendlyError(err) });
		}
	});
	const depositCrypto = useMutation({
		mutationFn: async (amountUsd) => {
			setStage({ kind: "creating" });
			const result = await createCrypto({ data: { amountUsd } });
			setStage({
				kind: "crypto_redirect",
				depositId: result.depositId
			});
			return result;
		},
		onSuccess: (result) => {
			window.location.href = result.invoiceUrl;
		},
		onError: (err) => {
			setStage({ kind: "idle" });
			toast.error("Couldn't start the crypto deposit", { description: friendlyError(err) });
		}
	});
	const depositQropay = useMutation({
		mutationFn: async (amountUsd) => {
			setStage({ kind: "creating" });
			const result = await createQropay({ data: { amountUsd } });
			setStage({
				kind: "upi_redirect",
				depositId: result.depositId
			});
			return result;
		},
		onSuccess: (result) => {
			window.location.href = result.paymentUrl;
		},
		onError: (err) => {
			setStage({ kind: "idle" });
			toast.error("Couldn't start the UPI deposit", { description: friendlyError(err) });
		}
	});
	const n = Number(amount) || 0;
	const min = isAdmin ? .1 : settings?.minDepositUsd ?? 10;
	const max = settings?.maxDepositUsd ?? 1e3;
	const inRange = n >= min && n <= max;
	const hasInrRate = settings?.inrPerUsd != null && settings.inrPerUsd > 0;
	const razorpayUsable = settings?.depositsEnabled && settings?.razorpayConfigured && hasInrRate;
	const nowpaymentsUsable = settings?.depositsEnabled && settings?.nowpaymentsConfigured;
	const qropayUsable = settings?.depositsEnabled && settings?.qropayConfigured && hasInrRate;
	const anyGatewayUsable = razorpayUsable || nowpaymentsUsable || qropayUsable;
	const genericDisabledReason = !advertiserActivated ? "Activate advertiser mode first." : account && account.status !== "active" ? `Your account is ${account.status}.` : settings && !settings.depositsEnabled ? "Deposits are temporarily unavailable." : !anyGatewayUsable ? "No payment gateways are configured." : null;
	const razorpayDisabledReason = genericDisabledReason || !razorpayUsable ? genericDisabledReason || "Razorpay is not configured." : null;
	const cryptoDisabledReason = genericDisabledReason || !nowpaymentsUsable ? genericDisabledReason || "Crypto payments aren't configured yet." : null;
	const qropayDisabledReason = genericDisabledReason || !qropayUsable ? genericDisabledReason || "QroPay UPI is not configured." : null;
	const busy = stage.kind === "creating" || stage.kind === "checkout" || stage.kind === "crypto_redirect" || stage.kind === "upi_redirect" || stage.kind === "confirming";
	const isLikelyIndia = (() => {
		try {
			const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
			const lang = navigator.language;
			return tz === "Asia/Kolkata" || tz === "Asia/Calcutta" || lang.startsWith("en-IN") || lang.startsWith("hi");
		} catch {
			return false;
		}
	})();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		subtitle: "Advertiser",
		mainClass: "page-fade-in",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BackLink, {
				to: "/home",
				label: "Back to dashboard"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				size: "page",
				icon: Wallet,
				iconSrc: "/icons/icon-wallet.webp",
				title: "Add Campaign Funds",
				subtitle: "Top up the balance your campaigns spend from.",
				className: "mb-2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card mt-3 flex items-center justify-between p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "Available Campaign Balance"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-amount text-2xl",
						"data-testid": "funds-balance",
						children: overviewLoading ? "…" : formatMoney(account?.spendable ?? 0)
					}),
					account && account.bonusLocked > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-[11px] text-muted-foreground",
						children: [
							"+ ",
							formatMoney(account.bonusLocked),
							" bonus unlocks as you spend"
						]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-11 place-items-center rounded-xl bg-primary/10",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "size-5 text-primary" })
				})]
			}),
			stage.kind === "confirming" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card mt-3 flex items-center gap-3 p-4",
				"data-testid": "deposit-confirming",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-5 shrink-0 animate-spin text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-semibold",
						children: "Payment received — confirming with Razorpay"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground",
						children: [formatMoney(stage.amountUsd), " will appear in your balance as soon as the gateway confirms it (usually seconds). You can leave this page."]
					})]
				})]
			}),
			stage.kind === "succeeded" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex items-center gap-3 rounded-2xl bg-mint/15 p-4",
				"data-testid": "deposit-success",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-5 shrink-0 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm font-semibold text-primary",
					children: [formatMoney(stage.amountUsd), " added to your Campaign Balance."]
				})]
			}),
			stage.kind === "failed" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex items-center gap-3 rounded-2xl bg-destructive/10 p-4",
				"data-testid": "deposit-failed",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "size-5 shrink-0 text-destructive" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-semibold text-destructive",
						children: "Payment didn't go through"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground",
						children: [stage.reason, " You haven't been charged."]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "surface-card mt-3 space-y-4 p-4",
				onSubmit: (e) => {
					e.preventDefault();
					if (razorpayDisabledReason || !inRange || busy) return;
					deposit.mutate(Math.round(n * 100) / 100);
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "fund-amount",
								children: "Amount (USD)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "fund-amount",
								type: "number",
								min,
								max,
								step: 1,
								inputMode: "decimal",
								value: amount,
								disabled: busy,
								onChange: (e) => setAmount(e.target.value)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[11px] text-muted-foreground",
								children: [
									"Min ",
									formatMoney(min),
									" · Max ",
									formatMoney(max),
									settings?.inrPerUsd ? ` · Charged in INR at ₹${settings.inrPerUsd.toFixed(2)}/$ (${n > 0 ? `≈ ₹${(n * settings.inrPerUsd).toFixed(0)}` : ""})` : ""
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-4 gap-2",
						children: PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							disabled: busy,
							onClick: () => setAmount(String(p)),
							className: `rounded-xl border px-2 py-2 text-sm font-semibold ${amount === String(p) ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"}`,
							children: ["$", p]
						}, p))
					}),
					settings?.promoActive && account && account.lifetimeDeposited === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "rounded-xl bg-gold/10 p-3 text-xs font-semibold text-gold-dark",
						children: [
							"🎁 Launch offer: your first deposit gets a",
							" ",
							overview?.userBonusPercent ?? settings.firstDepositBonusPercent,
							"% bonus that unlocks as you spend."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-muted-foreground",
						children: "Campaign Funds are spent only when a publisher completes your task. Unused funds stay in your Campaign Balance."
					}),
					genericDisabledReason && !anyGatewayUsable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold text-destructive",
						children: genericDisabledReason
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-semibold text-foreground",
							children: "Choose payment method"
						}), (() => {
							const inrAmount = settings?.inrPerUsd ? (n * settings.inrPerUsd).toFixed(0) : "0";
							let methods = [
								{
									id: "crypto",
									title: `Pay ${formatMoney(n)} with Crypto`,
									subtitle: "USDT · BTC · ETH · 200+ coins",
									badge: "Worldwide",
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative flex h-10 w-10 items-center justify-center",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "absolute left-0 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-[#26A17B]",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
													className: "h-4 w-4",
													viewBox: "0 0 24 24",
													fill: "white",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.72-2.84 0-2.27-1.72-2.96-3.65-3.35z" })
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "absolute left-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-[#F7931A]",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
													className: "h-4 w-4",
													viewBox: "0 0 24 24",
													fill: "white",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.065-.565-.13-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z" })
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "absolute left-4 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#627EEA]",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
													className: "h-4 w-4",
													viewBox: "0 0 24 24",
													fill: "white",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" })
												})
											})
										]
									}),
									usable: nowpaymentsUsable,
									disabledReason: cryptoDisabledReason,
									loading: stage.kind === "crypto_redirect",
									loadingText: "Redirecting to invoice…",
									onClick: () => depositCrypto.mutate(Math.round(n * 100) / 100),
									primary: true
								},
								{
									id: "upi",
									title: `Pay ≈ ₹${inrAmount} with UPI`,
									subtitle: "India only · GPay, PhonePe, Paytm",
									badge: "🇮🇳 India",
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, { className: "h-5 w-5 text-primary" })
									}),
									usable: qropayUsable,
									disabledReason: qropayDisabledReason,
									loading: stage.kind === "upi_redirect",
									loadingText: "Redirecting…",
									onClick: () => depositQropay.mutate(Math.round(n * 100) / 100),
									recommended: isLikelyIndia
								},
								{
									id: "razorpay",
									title: `Pay ${formatMoney(n)} with Card / Netbanking`,
									subtitle: "Cards · Netbanking · Wallets",
									badge: void 0,
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "h-5 w-5 text-primary" })
									}),
									usable: razorpayUsable,
									disabledReason: razorpayDisabledReason,
									loading: stage.kind === "creating" || stage.kind === "checkout",
									loadingText: stage.kind === "creating" ? "Preparing payment…" : "Complete payment in the Razorpay window",
									onClick: () => {},
									testId: "add-funds-submit",
									formSubmit: true
								}
							];
							if (isLikelyIndia && methods.length >= 2) {
								const [crypto, upi, ...rest] = methods;
								methods = [
									upi,
									crypto,
									...rest
								];
							}
							return methods.map((method) => {
								const isDisabled = Boolean(method.disabledReason) || !inRange || busy && !method.loading;
								const isPrimary = method.primary && !isLikelyIndia;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: method.formSubmit ? "submit" : "button",
									disabled: isDisabled,
									onClick: method.formSubmit ? void 0 : method.onClick,
									"data-testid": method.testId,
									className: `group relative w-full min-h-[64px] rounded-2xl p-4 text-left transition-all active:scale-[0.98] ${isPrimary ? "bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/20" : "border-2 border-border bg-card shadow-sm hover:shadow-md"} ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "shrink-0",
												children: method.icon
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "min-w-0 flex-1",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-2",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: `font-semibold leading-tight ${isPrimary ? "text-white" : "text-foreground"}`,
																children: method.loading ? method.loadingText : method.title
															}),
															method.recommended && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "rounded-full bg-gold/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gold-dark",
																children: "Recommended"
															}),
															method.badge && !method.recommended && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: `rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${isPrimary ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`,
																children: method.badge
															})
														]
													}),
													!method.loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: `mt-0.5 text-xs leading-tight ${isPrimary ? "text-white/80" : "text-muted-foreground"}`,
														children: method.subtitle
													}),
													method.disabledReason && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "mt-1 text-xs text-destructive",
														children: method.disabledReason
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "shrink-0",
												children: method.loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: `h-5 w-5 animate-spin ${isPrimary ? "text-white" : "text-primary"}` }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: `h-5 w-5 ${isPrimary ? "text-white/60" : "text-muted-foreground"}` })
											})
										]
									})
								}, method.id);
							});
						})()]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-3 w-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							"Secure payments · Powered by",
							" ",
							[nowpaymentsUsable && "NOWPayments", qropayUsable && "QroPay"].filter(Boolean).join(" & ")
						] })]
					})] })
				]
			}),
			(recent.data?.length ?? 0) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				icon: Clock,
				iconSrc: "/icons/icon-deposit-refund.webp",
				title: "Recent deposits"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "surface-card divide-y divide-border",
				"data-testid": "recent-deposits",
				children: recent.data.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center justify-between p-3.5 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-semibold",
						children: formatMoney(d.amountUsd)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground",
						children: [formatShortDate(d.createdAt), d.chargeCurrency !== "USD" ? ` · ${d.chargeCurrency} ${d.chargeAmount.toFixed(2)}` : ""]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${d.status === "succeeded" ? "bg-mint/20 text-primary" : d.status === "pending" ? "bg-gold/15 text-gold-dark" : "bg-background-alt text-muted-foreground"}`,
						children: d.status === "succeeded" ? "Credited" : d.status
					})]
				}, d.id))
			})] })
		]
	});
}
//#endregion
export { FundsPage as component };
