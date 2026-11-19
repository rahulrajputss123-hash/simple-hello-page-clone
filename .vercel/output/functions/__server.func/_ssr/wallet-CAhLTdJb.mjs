import { i as __toESM } from "../_runtime.mjs";
import { a as formatDateTime, o as formatMoney } from "./referral-progress-DmJLJmiB.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { Gt as Check, L as Receipt, O as ShieldCheck, an as ArrowRightLeft, i as Wallet, ln as ArrowDownToLine, z as Plus } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Skeleton } from "./skeleton-D9W9wFsj.mjs";
import { n as supabase } from "./client-QOMq7HzS.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { $n as transferEarningsToAdvertiser, A as Dialog, Cn as createWithdrawal, D as Input, E as Label, G as DialogDescription, H as formatReward, J as DialogTitle, K as DialogFooter, Kn as savePayoutMethod, M as SectionHeading, O as Checkbox, Ot as Button, W as DialogContent, X as useCountUp, Y as DialogTrigger, _n as cancelWithdrawal, d as AppShell, nr as useServerFn, q as DialogHeader, tr as useAuth } from "./router-sXMnYegW.mjs";
import { t as EmptyState } from "./States-Cg9ELwgo.mjs";
import { a as maskPayoutMethod, o as payoutMethodLabel, s as payoutMethodSpec, t as PAYOUT_METHODS } from "./payout-methods-axzHBpbm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/wallet-CAhLTdJb.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Small one-shot particle burst for reward moments (offer claimed, withdrawal
* requested). Purely decorative: it plays once, is not full-screen, and is
* disabled entirely under prefers-reduced-motion.
*
* The parent must be `position: relative` and should mount this with a changing
* `key` (and unmount it after ~900ms) so the animation replays per event.
*/
var PARTICLES = [
	{
		x: "-34px",
		y: "-26px",
		color: "var(--color-gold)"
	},
	{
		x: "-14px",
		y: "-40px",
		color: "var(--color-mint)"
	},
	{
		x: "12px",
		y: "-42px",
		color: "var(--color-gold)"
	},
	{
		x: "34px",
		y: "-24px",
		color: "var(--color-primary)"
	},
	{
		x: "-40px",
		y: "2px",
		color: "var(--color-mint)"
	},
	{
		x: "40px",
		y: "4px",
		color: "var(--color-gold)"
	},
	{
		x: "-24px",
		y: "26px",
		color: "var(--color-primary)"
	},
	{
		x: "22px",
		y: "28px",
		color: "var(--color-mint)"
	}
];
function SuccessBurst({ className = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		"aria-hidden": true,
		className: `pointer-events-none absolute inset-0 z-20 grid place-items-center ${className}`,
		"data-testid": "success-burst",
		children: PARTICLES.map((particle, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "success-burst-dot",
			style: {
				background: particle.color,
				animationDelay: `${index * 14}ms`,
				"--burst-x": particle.x,
				"--burst-y": particle.y
			}
		}, `${particle.x}-${particle.y}`))
	});
}
/** Loose email check for the gift-card / PayPal fields. */
function isEmail(value) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
function MoveToCampBalanceSection({ balance, pending, onSuccess }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [amount, setAmount] = (0, import_react.useState)("");
	const [confirmed, setConfirmed] = (0, import_react.useState)(false);
	const [idempotencyKey] = (0, import_react.useState)(() => crypto.randomUUID());
	const transfer = useServerFn(transferEarningsToAdvertiser);
	const available = balance - pending;
	const requestedAmount = Number(amount) || 0;
	const canTransfer = requestedAmount >= 5 && requestedAmount <= available && confirmed;
	const transferMutation = useMutation({
		mutationFn: () => transfer({ data: {
			amount: requestedAmount,
			idempotencyKey
		} }),
		onSuccess: () => {
			toast.success(`${formatMoney(requestedAmount)} moved to Campaign Balance. You can now use it to fund campaigns.`);
			setOpen(false);
			setAmount("");
			setConfirmed(false);
			onSuccess();
		},
		onError: (error) => {
			if (error.message.includes("advertiser account") || error.message.includes("advertiser onboarding")) toast.error(error.message, {
				action: {
					label: "Start Onboarding",
					onClick: () => {
						window.location.href = "/advertiser/onboarding";
					}
				},
				duration: 1e4
			});
			else toast.error(error.message || "Transfer failed");
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "outline",
				className: "mt-4 w-full gap-2",
				disabled: available < 5,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRightLeft, { className: "size-4" }), "Move to Campaign Balance"]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Move to Campaign Balance" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Transfer earnings to fund your advertiser campaigns. This is one-way and cannot be reversed." })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl bg-muted/50 p-3 space-y-1 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground",
								children: "Available:"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold",
								children: formatMoney(available)
							})]
						}), pending > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground",
								children: "Pending (cannot move):"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatMoney(pending) })]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "transfer-amount",
								children: "Amount to move ($5 minimum)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "transfer-amount",
									type: "number",
									inputMode: "decimal",
									placeholder: "5.00",
									min: "5",
									max: available,
									step: "0.01",
									value: amount,
									onChange: (e) => setAmount(e.target.value),
									disabled: transferMutation.isPending
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "outline",
									onClick: () => setAmount(available.toFixed(2)),
									disabled: available < 5 || transferMutation.isPending,
									children: "Max"
								})]
							}),
							requestedAmount > 0 && requestedAmount < 5 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-destructive",
								children: "Minimum transfer is $5.00"
							}),
							requestedAmount > available && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-destructive",
								children: [
									"Insufficient balance (available: ",
									formatMoney(available),
									")"
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium text-amber-900 dark:text-amber-100",
								children: "⚠️ One-Way Transfer"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-amber-800 dark:text-amber-200",
								children: "Money moved to Campaign Balance can only be used to fund campaigns. It cannot be moved back to your earnings wallet or withdrawn."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
									id: "confirm-one-way",
									checked: confirmed,
									onCheckedChange: (checked) => setConfirmed(checked === true),
									disabled: transferMutation.isPending
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									htmlFor: "confirm-one-way",
									className: "text-xs leading-relaxed text-amber-900 dark:text-amber-100 cursor-pointer",
									children: "I understand this is one-way. Moved money cannot return to my earnings or be withdrawn."
								})]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				onClick: () => setOpen(false),
				disabled: transferMutation.isPending,
				children: "Cancel"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "default",
				onClick: () => transferMutation.mutate(),
				disabled: !canTransfer || transferMutation.isPending,
				children: transferMutation.isPending ? "Moving..." : `Move ${formatMoney(requestedAmount)}`
			})] })
		] })]
	});
}
function WalletPage() {
	const { session, profile } = useAuth();
	const queryClient = useQueryClient();
	const withdraw = useServerFn(createWithdrawal);
	const cancel = useServerFn(cancelWithdrawal);
	const savePayout = useServerFn(savePayoutMethod);
	const [amount, setAmount] = (0, import_react.useState)("");
	const [methodId, setMethodId] = (0, import_react.useState)("");
	const [methodOpen, setMethodOpen] = (0, import_react.useState)(false);
	/** Bumped on a successful withdrawal to replay the one-shot burst. Display-only. */
	const [burstKey, setBurstKey] = (0, import_react.useState)(0);
	const [draftType, setDraftType] = (0, import_react.useState)("upi");
	const [draftLabel, setDraftLabel] = (0, import_react.useState)("");
	const [draftFields, setDraftFields] = (0, import_react.useState)({});
	const balance = Number(profile?.wallet_balance ?? 0);
	const pending = Number(profile?.held_balance ?? 0);
	const lifetime = Number(profile?.lifetime_earned ?? 0);
	const shownBalance = useCountUp(balance);
	(0, import_react.useEffect)(() => {}, []);
	const transactions = useQuery({
		queryKey: ["transactions", session?.user.id],
		enabled: Boolean(session),
		staleTime: 0,
		refetchOnMount: "always",
		queryFn: async () => {
			const { data } = await supabase.from("wallet_transactions").select("*").order("created_at", { ascending: false }).limit(50);
			return data ?? [];
		}
	});
	const methods = useQuery({
		queryKey: ["payout-methods", session?.user.id],
		enabled: Boolean(session),
		staleTime: 0,
		refetchOnMount: "always",
		queryFn: async () => {
			const { data } = await supabase.from("payout_methods").select("*");
			return data ?? [];
		}
	});
	const withdrawals = useQuery({
		queryKey: ["withdrawals", session?.user.id],
		enabled: Boolean(session),
		staleTime: 0,
		refetchOnMount: "always",
		queryFn: async () => {
			const { data } = await supabase.from("withdrawal_requests").select("*").order("created_at", { ascending: false });
			return data ?? [];
		}
	});
	const addMethod = useMutation({
		mutationFn: async (values) => {
			await savePayout({ data: {
				methodType: values.type,
				label: values.label.trim() || payoutMethodLabel(values.type),
				holderName: values.fields["holder_name"]?.trim() || null,
				upiId: values.fields["upi_id"]?.trim() || null,
				paypalEmail: values.fields["paypal_email"]?.trim() || null,
				accountNumber: values.fields["account_number"]?.trim() || null,
				countryBankCode: values.fields["country_bank_code"]?.trim() || null,
				bankName: values.fields["bank_name"]?.trim() || null,
				country: values.fields["country"]?.trim() || null,
				giftCardRecipientEmail: values.fields["gift_card_recipient_email"]?.trim() || null,
				walletAddress: values.fields["wallet_address"]?.trim() || null,
				binancePayId: values.fields["binance_pay_id"]?.trim() || null
			} });
		},
		onSuccess: () => {
			toast.success("Payout method saved.");
			setMethodOpen(false);
			setDraftFields({});
			setDraftLabel("");
			queryClient.invalidateQueries({ queryKey: ["payout-methods"] });
		},
		onError: (error) => toast.error(error.message || "Couldn't save that payout method.")
	});
	const requestWithdrawal = useMutation({
		mutationFn: () => {
			const withdrawAmount = Number(amount);
			return withdraw({ data: {
				amount: withdrawAmount,
				payoutMethodId: methodId
			} });
		},
		onSuccess: () => {
			Number(amount);
			toast.success("Withdrawal requested — we'll review it shortly.");
			setAmount("");
			setBurstKey((key) => key + 1);
			window.setTimeout(() => setBurstKey(0), 900);
			queryClient.invalidateQueries({ queryKey: ["withdrawals", session?.user.id] });
			queryClient.invalidateQueries({ queryKey: ["transactions", session?.user.id] });
			queryClient.invalidateQueries({ queryKey: ["profile"] });
		},
		onError: (error) => toast.error(error.message || "Withdrawal failed.")
	});
	const cancelRequest = useMutation({
		mutationFn: (id) => cancel({ data: { id } }),
		onSuccess: () => {
			toast.success("Request cancelled and funds returned.");
			queryClient.invalidateQueries({ queryKey: ["withdrawals", session?.user.id] });
			queryClient.invalidateQueries({ queryKey: ["transactions", session?.user.id] });
			queryClient.invalidateQueries({ queryKey: ["profile"] });
		},
		onError: (error) => toast.error(error.message || "Couldn't cancel that request.")
	});
	const canWithdraw = Number(amount) >= 5 && Number(amount) <= balance - pending && Boolean(methodId);
	const selectedMethod = methods.data?.find((m) => m.id === methodId);
	const selectedSpec = selectedMethod ? payoutMethodSpec(selectedMethod.method_type) : null;
	const networkFee = selectedSpec?.networkFeeUsd ?? 0;
	const methodMinimum = selectedSpec?.minWithdrawalUsd ?? 5;
	const netAmount = Number(amount) > 0 ? Number(amount) - networkFee : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		subtitle: "Wallet",
		mainClass: "page-fade-in",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "wallet-balance-glow rounded-3xl bg-jade-gradient p-5 text-primary-foreground",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm opacity-80",
						children: "Available balance"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-amount mt-1 text-4xl",
						children: formatMoney(shownBalance)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid grid-cols-2 gap-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl bg-primary-foreground/10 px-3 py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "opacity-75",
								children: "Pending"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-amount",
								children: formatMoney(pending)
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl bg-primary-foreground/10 px-3 py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "opacity-75",
								children: "Lifetime"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-amount",
								children: formatMoney(lifetime)
							})]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoveToCampBalanceSection, {
				balance,
				pending,
				onSuccess: () => {
					queryClient.invalidateQueries({ queryKey: ["profile"] });
					queryClient.invalidateQueries({ queryKey: ["transactions"] });
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card mt-4 flex items-start gap-3 p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "mt-0.5 size-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-semibold",
					children: "Manual payout review"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: "Every withdrawal is reviewed by our team, usually within 48 hours."
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				icon: Wallet,
				iconSrc: "/icons/icon-wallet.webp",
				title: "Withdraw",
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
					open: methodOpen,
					onOpenChange: setMethodOpen,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "outline",
							className: "gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" }), " Method"]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Add payout method" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Where should we send your money?" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "space-y-4",
						onSubmit: (event) => {
							event.preventDefault();
							const spec = payoutMethodSpec(draftType);
							if (!spec?.available) {
								toast.error("Choose an available payout method.");
								return;
							}
							const missing = spec.fields.find((f) => !(draftFields[f.name] ?? "").trim());
							if (missing) {
								toast.error(`${missing.label} is required.`);
								return;
							}
							const emailField = spec.fields.find((f) => f.inputType === "email" && !isEmail(draftFields[f.name] ?? ""));
							if (emailField) {
								toast.error(`Enter a valid ${emailField.label.toLowerCase()}.`);
								return;
							}
							addMethod.mutate({
								type: spec.type,
								label: draftLabel,
								fields: draftFields
							});
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Payout method" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid grid-cols-2 gap-2",
									children: PAYOUT_METHODS.map((spec) => {
										const selected = draftType === spec.type;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											"aria-pressed": selected,
											"aria-disabled": !spec.available,
											"data-testid": `payout-method-${spec.type}`,
											onClick: () => {
												if (!spec.available) {
													toast.info(spec.comingSoonMessage ?? `${spec.label} is coming soon.`);
													return;
												}
												setDraftType(spec.type);
												setDraftFields({});
											},
											className: `relative flex items-start gap-2 rounded-2xl border p-2.5 text-left transition-all ${!spec.available ? "cursor-not-allowed border-border bg-background-alt opacity-70" : selected ? "border-primary bg-primary/5 shadow-soft" : "border-border bg-card hover:border-primary/40"}`,
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													"aria-hidden": true,
													className: `grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${spec.iconClass}`,
													children: spec.monogram
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "min-w-0 flex-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "block truncate text-[13px] font-semibold leading-tight",
														children: spec.label
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "mt-0.5 block text-[10px] leading-tight text-muted-foreground",
														children: spec.tagline
													})]
												}),
												selected && spec.available && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
													className: "absolute right-2 top-2 size-3.5 text-primary",
													"aria-hidden": true
												})
											]
										}, spec.type);
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "label",
									children: "Label"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "label",
									value: draftLabel,
									onChange: (e) => setDraftLabel(e.target.value),
									maxLength: 60,
									placeholder: "e.g. My main account"
								})]
							}),
							(payoutMethodSpec(draftType)?.fields ?? []).map((field) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: `field-${field.name}`,
										children: field.label
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: `field-${field.name}`,
										type: field.inputType ?? "text",
										maxLength: field.maxLength,
										placeholder: field.placeholder,
										value: draftFields[field.name] ?? "",
										onChange: (e) => setDraftFields((current) => ({
											...current,
											[field.name]: e.target.value
										})),
										"data-testid": `payout-field-${field.name}`
									}),
									draftType === "binance_pay" && field.name === "binance_pay_id" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground",
										children: "Sent in USDT to your Binance Pay ID. No network fee. Make sure the ID is correct, payouts cannot be reversed."
									})
								]
							}, field.name)),
							payoutMethodSpec(draftType)?.networkWarning && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-900 dark:text-amber-100",
								children: payoutMethodSpec(draftType)?.networkWarning
							}),
							payoutMethodSpec(draftType)?.networkLabel && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl bg-primary/5 border border-primary/10 p-3 space-y-1 text-xs",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground",
											children: "Network:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold",
											children: payoutMethodSpec(draftType)?.networkLabel
										})]
									}),
									payoutMethodSpec(draftType)?.minWithdrawalUsd && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground",
											children: "Minimum withdrawal:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold",
											children: formatMoney(payoutMethodSpec(draftType).minWithdrawalUsd)
										})]
									}),
									payoutMethodSpec(draftType)?.networkFeeUsd && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground",
											children: "Network fee:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold",
											children: formatMoney(payoutMethodSpec(draftType).networkFeeUsd)
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								variant: "jade",
								disabled: addMethod.isPending,
								"data-testid": "payout-save-method",
								children: "Save method"
							}) })
						]
					})] })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card relative space-y-4 p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
							htmlFor: "amount",
							children: [
								"Amount (min ",
								formatMoney(5),
								")"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "amount",
							inputMode: "decimal",
							value: amount,
							onChange: (event) => setAmount(event.target.value),
							placeholder: "5.00"
						})]
					}),
					(methods.data ?? []).length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Saved payout methods" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "grid gap-2",
							"data-testid": "wallet-saved-methods",
							children: (methods.data ?? []).map((method) => {
								const spec = payoutMethodSpec(method.method_type);
								const selected = methodId === method.id;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setMethodId(method.id),
									"aria-pressed": selected,
									"data-testid": `wallet-saved-method-${method.id}`,
									className: `flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all ${selected ? "border-primary bg-primary/5 shadow-soft" : "border-border bg-card hover:border-primary/40"}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											"aria-hidden": true,
											className: `grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${spec?.iconClass ?? "bg-background-alt text-muted-foreground"}`,
											children: spec?.monogram ?? "?"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "min-w-0 flex-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "block truncate text-sm font-semibold",
												children: method.label || payoutMethodLabel(method.method_type)
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "block truncate text-xs text-muted-foreground",
												children: [
													payoutMethodLabel(method.method_type),
													" ·",
													" ",
													maskPayoutMethod(method) || "No details"
												]
											})]
										}),
										selected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
											className: "size-4 shrink-0 text-primary",
											"aria-hidden": true
										})
									]
								}) }, method.id);
							})
						})]
					}),
					selectedSpec?.networkWarning && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-900 dark:text-amber-100",
						children: selectedSpec.networkWarning
					}),
					networkFee > 0 && Number(amount) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl bg-primary/5 border border-primary/10 p-3 space-y-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Withdrawal amount:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold",
									children: formatMoney(Number(amount))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Network fee:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-semibold text-amber-600 dark:text-amber-400",
									children: ["−", formatMoney(networkFee)]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-sm border-t border-primary/10 pt-1 mt-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold",
									children: "You receive:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-primary",
									children: formatMoney(netAmount)
								})]
							})
						]
					}),
					selectedSpec && methodMinimum > 5 && Number(amount) < methodMinimum && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-amber-600 dark:text-amber-400",
						children: [
							"⚠️ Minimum withdrawal for ",
							selectedSpec.label,
							" is ",
							formatMoney(methodMinimum)
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "gold",
						className: "w-full gap-2",
						disabled: !canWithdraw || requestWithdrawal.isPending || Number(amount) < methodMinimum,
						onClick: () => requestWithdrawal.mutate(),
						"data-testid": "wallet-request-withdrawal",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownToLine, { className: "size-4" }), " Request withdrawal"]
					}),
					!methods.data?.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-center text-xs text-muted-foreground",
						children: "Add a payout method above to withdraw."
					}),
					burstKey > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SuccessBurst, {}, burstKey)
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				icon: ArrowDownToLine,
				iconSrc: "/icons/icon-download-receive.webp",
				title: "Withdrawals"
			}),
			!withdrawals.data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				icon: ArrowDownToLine,
				title: "No withdrawals yet",
				description: `Reach ${formatMoney(5)} to make your first cash-out.`
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-2",
				children: withdrawals.data.map((request) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "surface-card p-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-amount",
								children: formatMoney(request.amount)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: formatDateTime(request.created_at)
							}),
							request.network_fee && Number(request.network_fee) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[11px] text-muted-foreground mt-0.5",
								children: [
									"Network fee: ",
									formatMoney(request.network_fee),
									" · You receive:",
									" ",
									formatMoney(request.amount - Number(request.network_fee))
								]
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full bg-background-alt px-2.5 py-1 text-[11px] font-semibold capitalize",
								children: request.status
							}), request.status === "pending" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "ghost",
								onClick: () => cancelRequest.mutate(request.id),
								children: "Cancel"
							})]
						})]
					})
				}, request.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				icon: Receipt,
				iconSrc: "/icons/icon-wallet-transactions.webp",
				title: "Transactions"
			}),
			transactions.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-24 w-full rounded-2xl" }) : !transactions.data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				icon: Receipt,
				title: "No transactions yet",
				description: "Watch an ad or finish a task to see your first credit here."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "stagger-fade-children space-y-2",
				children: transactions.data.map((tx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "surface-card flex items-center justify-between p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate font-semibold",
							children: tx.description || tx.kind
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: formatDateTime(tx.created_at)
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: Number(tx.amount) >= 0 ? "text-amount text-accent-foreground" : "text-amount text-destructive",
						children: [Number(tx.amount) >= 0 ? "+" : "−", tx.kind === "earned" || tx.kind === "bonus" || tx.kind === "held" ? formatReward(Math.abs(Number(tx.amount))) : formatMoney(Math.abs(Number(tx.amount)))]
					})]
				}, tx.id))
			})
		]
	});
}
//#endregion
export { WalletPage as component };
