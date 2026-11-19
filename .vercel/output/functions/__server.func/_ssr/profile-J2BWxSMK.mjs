import { i as __toESM } from "../_runtime.mjs";
import { o as formatMoney } from "./referral-progress-DmJLJmiB.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { C as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { D as Shield, Ht as ChevronRight, St as FileText, W as PenLine, at as LifeBuoy, i as Wallet, j as Settings, p as TriangleAlert } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as supabase } from "./client-QOMq7HzS.mjs";
import { i as useQueryClient, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { i as avatarById, t as AVATAR_OPTIONS } from "./premium-BIRn1NQB.mjs";
import { A as Dialog, D as Input, E as Label, Gn as requestAccountDeletion, J as DialogTitle, K as DialogFooter, M as SectionHeading, Ot as Button, W as DialogContent, Yn as signOutEverywhere, d as AppShell, nr as useServerFn, q as DialogHeader, tr as useAuth } from "./router-sXMnYegW.mjs";
import { t as Switch } from "./switch-Cn1w-cIH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile-J2BWxSMK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ProfilePage() {
	const { session, profile, isAdmin } = useAuth();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [deletingAccount, setDeletingAccount] = (0, import_react.useState)(false);
	const deleteAccountFn = useServerFn(requestAccountDeletion);
	const [draft, setDraft] = (0, import_react.useState)({
		name: profile?.name ?? "",
		avatar: profile?.avatar_url ?? "nova",
		gender: profile?.gender ?? "",
		dob: profile?.date_of_birth ?? ""
	});
	const saveProfile = useMutation({
		mutationFn: async () => {
			const { error } = await supabase.from("profiles").update({
				name: draft.name.trim(),
				avatar_url: draft.avatar,
				gender: draft.gender || null,
				date_of_birth: draft.dob || null
			}).eq("id", session.user.id);
			if (error) throw error;
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["profile"] });
			setEditing(false);
			toast.success("Profile updated.");
		},
		onError: () => toast.error("Couldn't update your profile.")
	});
	const savePref = useMutation({
		mutationFn: async (values) => {
			const { error } = await supabase.from("profiles").update(values).eq("id", session.user.id);
			if (error) throw error;
		},
		onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["profile"] }),
		onError: () => toast.error("Couldn't save that setting.")
	});
	const deleteAccount = useMutation({
		mutationFn: async () => {
			return await deleteAccountFn({});
		},
		onSuccess: async (result) => {
			toast.success(result.message);
			await signOutEverywhere(queryClient);
			navigate({
				to: "/auth",
				replace: true
			});
		},
		onError: (error) => {
			if (error.message.includes("PENDING_WITHDRAWAL")) toast.error("Cannot delete account while a withdrawal is pending.");
			else toast.error("Failed to delete account. Please try again or contact support.");
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		subtitle: "Profile",
		mainClass: "page-fade-in",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "surface-card mt-2 flex items-center gap-3 p-4",
				"data-testid": "profile-summary-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl",
						"data-testid": "profile-avatar-preview",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: avatarById(profile?.avatar_url).imageUrl,
							alt: "",
							className: "size-full object-cover",
							decoding: "async"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-lg font-semibold",
								children: profile?.name ?? "CashGPT user"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-xs text-muted-foreground",
								children: profile?.email ?? session?.user.email
							}),
							profile?.referral_code && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 inline-flex items-center gap-1 rounded-full bg-background-alt px-2 py-0.5 text-[11px] font-semibold",
								children: ["Code ", profile.referral_code]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: "outline",
						className: "ml-auto gap-1.5",
						onClick: () => {
							setDraft({
								name: profile?.name ?? "",
								avatar: profile?.avatar_url ?? "nova",
								gender: profile?.gender ?? "",
								dob: profile?.date_of_birth ?? ""
							});
							setEditing(true);
						},
						"data-testid": "profile-edit-button",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, { className: "size-3.5" }), " Edit"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid grid-cols-2 gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "Lifetime earned"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-amount text-lg",
						children: formatMoney(profile?.lifetime_earned)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "Withdrawn"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-amount text-lg",
						children: formatMoney(profile?.lifetime_withdrawn)
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				icon: Settings,
				iconSrc: "/icons/icon-profile.webp",
				title: "Settings"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card divide-y divide-border",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-semibold",
							children: "Push notifications"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "Payout and quest alerts"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: profile?.push_enabled ?? true,
							onCheckedChange: (checked) => savePref.mutate({ push_enabled: checked })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-semibold",
							children: "Language"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "App display language"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "h-10 rounded-xl border border-border bg-card px-3 text-sm",
							value: profile?.language ?? "en",
							onChange: (event) => savePref.mutate({ language: event.target.value }),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "en",
									children: "English"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "hi",
									children: "हिन्दी"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "es",
									children: "Español"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "flex w-full items-center justify-between p-4 text-left",
						onClick: () => navigate({ to: "/wallet" }),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-2 font-semibold",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "size-4 text-primary" }), " Wallet & payouts"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4 text-muted-foreground" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "flex w-full items-center justify-between p-4 text-left",
						"data-testid": "profile-help-support",
						onClick: () => navigate({ to: "/support" }),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-2 font-semibold",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LifeBuoy, { className: "size-4 text-primary" }), " Help & Support"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4 text-muted-foreground" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "flex w-full items-center justify-between p-4 text-left",
						onClick: () => navigate({ to: "/legal/terms" }),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-2 font-semibold",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-4 text-primary" }), " Legal & policies"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4 text-muted-foreground" })]
					}),
					isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "flex w-full items-center justify-between p-4 text-left",
						onClick: () => navigate({ to: "/admin" }),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-2 font-semibold",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "size-4 text-primary" }), " Admin panel"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4 text-muted-foreground" })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "outline",
				className: "mt-4 w-full gap-2",
				onClick: async () => {
					await signOutEverywhere(queryClient);
					navigate({
						to: "/auth",
						replace: true
					});
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: "/icons/icon-logout.webp",
						alt: "",
						"aria-hidden": true,
						className: "size-6 object-contain",
						decoding: "async"
					}),
					" ",
					"Sign out"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "ghost",
				className: "mt-2 w-full gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive",
				onClick: () => setDeletingAccount(true),
				"data-testid": "profile-delete-account-button",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-4" }), " Delete my account"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: editing,
				onOpenChange: setEditing,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-h-[88vh] overflow-y-auto",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Edit profile" }) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Avatar" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-2 grid grid-cols-4 gap-2",
									children: AVATAR_OPTIONS.map((avatar) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setDraft({
											...draft,
											avatar: avatar.id
										}),
										className: `relative aspect-square overflow-hidden rounded-xl ${draft.avatar === avatar.id ? "ring-2 ring-gold ring-offset-2" : ""}`,
										"data-testid": `profile-avatar-${avatar.id}`,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: avatar.imageUrl,
											alt: avatar.name,
											className: "size-full object-cover",
											decoding: "async"
										})
									}, avatar.id))
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "profile-display-name",
										children: "Display name"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "profile-display-name",
										value: draft.name,
										onChange: (event) => setDraft({
											...draft,
											name: event.target.value
										}),
										"data-testid": "profile-display-name-input"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "profile-gender",
											children: "Gender"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											id: "profile-gender",
											value: draft.gender,
											onChange: (event) => setDraft({
												...draft,
												gender: event.target.value
											}),
											className: "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm",
											"data-testid": "profile-gender-input",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "",
													children: "Prefer not to say"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "female",
													children: "Female"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "male",
													children: "Male"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "non_binary",
													children: "Non-binary"
												})
											]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "profile-dob",
											children: "Date of birth"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "profile-dob",
											type: "date",
											value: draft.dob,
											onChange: (event) => setDraft({
												...draft,
												dob: event.target.value
											}),
											"data-testid": "profile-dob-input"
										})]
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							onClick: () => setEditing(false),
							"data-testid": "profile-edit-cancel",
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "jade",
							disabled: saveProfile.isPending || draft.name.trim().length < 2,
							onClick: () => saveProfile.mutate(),
							"data-testid": "profile-edit-save",
							children: saveProfile.isPending ? "Saving…" : "Save profile"
						})] })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: deletingAccount,
				onOpenChange: setDeletingAccount,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-md",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
							className: "flex items-center gap-2 text-destructive",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-5" }), " Delete Account"]
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm",
									children: [
										"This action is ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "permanent" }),
										" and cannot be undone. Once deleted:"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
									className: "list-inside list-disc space-y-1 text-sm text-muted-foreground",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "All personal information will be removed" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "You will lose access to your account" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
											"Any pending wallet balance (",
											formatMoney(Number(profile?.wallet_balance ?? 0) - Number(profile?.held_balance ?? 0)),
											") will be forfeited"
										] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "You cannot restore your account after deletion" })
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted-foreground",
									children: "Note: Transaction history is preserved for compliance and audit purposes."
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
							className: "flex-col gap-2 sm:flex-col",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								onClick: () => setDeletingAccount(false),
								disabled: deleteAccount.isPending,
								className: "w-full",
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "destructive",
								onClick: () => deleteAccount.mutate(),
								disabled: deleteAccount.isPending,
								className: "w-full",
								"data-testid": "profile-delete-account-confirm",
								children: deleteAccount.isPending ? "Deleting..." : "Yes, delete my account"
							})]
						})
					]
				})
			})
		]
	});
}
//#endregion
export { ProfilePage as component };
