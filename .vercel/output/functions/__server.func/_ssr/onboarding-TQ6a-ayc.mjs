import { i as __toESM } from "../_runtime.mjs";
import { o as formatMoney } from "./referral-progress-DmJLJmiB.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { C as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { $ as LockKeyhole, A as Share2, At as Copy, B as Play, C as Sparkles, Gt as Check, Nt as ClipboardCopy, _t as Gift, a as WalletCards, f as Trophy, in as ArrowRight, on as ArrowLeft, qt as Camera, rt as Link2, st as Layers, w as Smartphone, x as Star, yt as Gamepad2, zt as CircleCheck } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { i as avatarById, n as DEFAULT_PREMIUM_STEPS, r as ONBOARDING_ARTWORK, t as AVATAR_OPTIONS } from "./premium-BIRn1NQB.mjs";
import { D as Input, E as Label, Ot as Button, nr as useServerFn, p as BrandMark, tr as useAuth } from "./router-sXMnYegW.mjs";
import { i as listPremiumOnboardingSteps, t as completePremiumOnboarding } from "./functions-BCv4WNrg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/onboarding-TQ6a-ayc.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FEATURE_NUMBER = {
	features_offers: 1,
	quest: 2,
	watch_earn: 3,
	offerwall: 4,
	refer_earn: 5
};
function PremiumOnboarding() {
	const { profile, session } = useAuth();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const fetchSteps = useServerFn(listPremiumOnboardingSteps);
	const finish = useServerFn(completePremiumOnboarding);
	const preview = typeof window !== "undefined" && window.location.search.includes("preview=1");
	const [index, setIndex] = (0, import_react.useState)(0);
	const [profileDraft, setProfileDraft] = (0, import_react.useState)({
		name: profile?.name ?? "",
		avatarId: profile?.avatar_url ?? "nova",
		gender: profile?.gender ?? "",
		dateOfBirth: profile?.date_of_birth ?? ""
	});
	const stepsQuery = useQuery({
		queryKey: ["premium-onboarding-steps"],
		queryFn: () => fetchSteps({}),
		staleTime: 3e5
	});
	const steps = (0, import_react.useMemo)(() => (stepsQuery.data?.length ? stepsQuery.data : DEFAULT_PREMIUM_STEPS).filter((step) => step.enabled), [stepsQuery.data]);
	const current = steps[Math.min(index, Math.max(steps.length - 1, 0))] ?? DEFAULT_PREMIUM_STEPS[0];
	const isWelcome = current.step_key === "welcome";
	const isAvatar = current.step_key === "choose_avatar";
	const isProfile = current.step_key === "profile";
	const isReady = current.step_key === "youre_ready";
	const featureNumber = FEATURE_NUMBER[current.step_key];
	const isFeature = typeof featureNumber === "number";
	const isFirst = index === 0;
	const isLast = index === steps.length - 1;
	const referralCode = profile?.referral_code ?? "cashgpt";
	const referralUrl = typeof window === "undefined" ? `cashgpt.app/r/${referralCode}` : `${window.location.origin}/auth?ref=${referralCode}`;
	(0, import_react.useEffect)(() => {
		setProfileDraft((previous) => ({
			...previous,
			name: previous.name || profile?.name || "",
			avatarId: profile?.avatar_url || previous.avatarId,
			gender: previous.gender || (profile?.gender ?? ""),
			dateOfBirth: previous.dateOfBirth || profile?.date_of_birth || ""
		}));
	}, [profile]);
	(0, import_react.useEffect)(() => {
		if (profile?.onboarded && !preview) navigate({
			to: "/home",
			replace: true
		});
	}, [
		profile?.onboarded,
		preview,
		navigate
	]);
	const complete = useMutation({
		mutationFn: () => finish({ data: {
			name: profileDraft.name.trim(),
			avatarId: profileDraft.avatarId,
			...profileDraft.gender ? { gender: profileDraft.gender } : {},
			...profileDraft.dateOfBirth ? { dateOfBirth: profileDraft.dateOfBirth } : {}
		} }),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["profile"] });
			toast.success("Your CashGPT profile is ready.");
			if (!preview) navigate({
				to: "/home",
				replace: true
			});
		},
		onError: () => toast.error("Could not save your profile. Please try again.")
	});
	const next = () => {
		if (isProfile && profileDraft.name.trim().length < 2) {
			toast.error("Please add your display name first.");
			return;
		}
		if (isAvatar && !profileDraft.avatarId) {
			toast.error("Choose an avatar to continue.");
			return;
		}
		if (isLast) {
			if (preview) {
				toast.success("Preview complete — no profile changes were saved.");
				setIndex(0);
			} else complete.mutate();
			return;
		}
		setIndex((value) => Math.min(value + 1, steps.length - 1));
	};
	const back = () => setIndex((value) => Math.max(0, value - 1));
	const goHome = () => void navigate({ to: "/home" });
	const copyReferral = async () => {
		await navigator.clipboard.writeText(referralUrl);
		toast.success("Referral link copied.");
	};
	const shareReferral = async () => {
		if (navigator.share) {
			await navigator.share({
				title: "Join me on CashGPT",
				text: "Earn rewards with me on CashGPT.",
				url: referralUrl
			});
			return;
		}
		await copyReferral();
	};
	const dotIndex = isFeature ? featureNumber - 1 : isReady ? 4 : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "premium-shell min-h-screen overflow-hidden bg-[#efeade]",
		"data-testid": "premium-onboarding-page",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "premium-frame relative mx-auto flex h-[100dvh] min-h-[700px] w-full max-w-md flex-col overflow-hidden bg-[#faf7ef] shadow-2xl sm:my-5 sm:h-[min(880px,calc(100vh-2.5rem))] sm:min-h-0 sm:rounded-[2rem] sm:border sm:border-[#d4af37]/30",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: `pointer-events-none absolute inset-x-0 top-0 z-30 flex h-16 items-center justify-between px-5 ${isWelcome || isFeature || isReady || isProfile ? "text-white" : "text-[#0b2b28]"}`,
					children: [isWelcome ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-auto flex items-center gap-2.5",
						"data-testid": "onboarding-brand-lockup",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandMark, { className: "size-9 rounded-xl ring-1 ring-white/25" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-display text-lg",
							children: "CashGPT"
						})]
					}) : isFeature ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-display text-sm",
						"data-testid": "premium-feature-counter",
						children: [featureNumber, " / 5"]
					}) : !isReady ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: back,
						disabled: isFirst,
						className: "pointer-events-auto grid size-10 place-items-center rounded-full bg-black/10 backdrop-blur-sm disabled:opacity-0",
						"aria-label": "Go back",
						"data-testid": "premium-back-button",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-5" })
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}), isFeature ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: next,
						className: "pointer-events-auto rounded-full px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white",
						"data-testid": `premium-skip-${current.step_key}`,
						children: "Skip"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-h-0 flex-1 overflow-y-auto pb-[118px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
					children: [
						isWelcome && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "min-h-full bg-[radial-gradient(circle_at_50%_22%,#165c50_0%,#0b2b28_48%,#061f1d_100%)] px-5 pb-10 pt-16 text-center text-white",
							"data-testid": "onboarding-welcome-view",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IllustrationPanel, {
									src: ONBOARDING_ARTWORK["welcome"],
									alt: "Gift box overflowing with reward coins",
									className: "mx-auto h-[48vh] min-h-[330px] max-h-[430px] w-full",
									testId: "onboarding-artwork-welcome"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgressDots, {
									current: dotIndex,
									dark: true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
									className: "mt-5 text-4xl font-extrabold leading-none tracking-[-0.04em]",
									"data-testid": "premium-step-title",
									children: ["Welcome to ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[#f4cf56]",
										children: "CashGPT"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-lg font-extrabold text-white",
									"data-testid": "premium-step-subtitle",
									children: "4 ways to earn. One app."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mx-auto mt-3 max-w-xs text-sm leading-relaxed text-[#b9d5ce]",
									"data-testid": "premium-step-description",
									children: "Complete offers, unlock quests, watch ads, and refer friends to earn real rewards."
								})
							]
						}),
						isAvatar && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "px-5 pb-8 pt-20 text-center",
							"data-testid": "onboarding-avatar-view",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#a37d1d]",
									children: "Make it yours"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "mt-2 text-3xl font-extrabold tracking-[-0.035em] text-[#0b2b28]",
									"data-testid": "premium-step-title",
									children: "Choose Your Avatar"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-sm text-[#667a74]",
									"data-testid": "premium-step-subtitle",
									children: "Pick a friendly character for your profile"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-7 grid grid-cols-3 gap-x-3 gap-y-5",
									"data-testid": "premium-avatar-grid",
									children: AVATAR_OPTIONS.map((avatar) => {
										const selected = profileDraft.avatarId === avatar.id;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => setProfileDraft((previous) => ({
												...previous,
												avatarId: avatar.id
											})),
											className: "group relative flex flex-col items-center gap-1.5",
											"data-testid": `premium-avatar-${avatar.id}`,
											"aria-pressed": selected,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: `relative block aspect-square w-full max-w-[100px] overflow-hidden rounded-full bg-gradient-to-br ${avatar.tone} shadow-[0_10px_22px_rgba(11,43,40,.12)] ring-offset-4 ring-offset-[#faf7ef] transition-[transform,box-shadow] duration-200 group-hover:-translate-y-1 ${selected ? "ring-3 ring-[#18a878] shadow-[0_12px_26px_rgba(24,168,120,.24)]" : "ring-1 ring-[#d8dfd9]"}`,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
													src: avatar.imageUrl,
													alt: `${avatar.name} avatar`,
													className: "size-full object-cover",
													decoding: "async"
												}), selected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "absolute right-0.5 top-0.5 grid size-6 place-items-center rounded-full border-2 border-white bg-[#18a878] text-white",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
														className: "size-3.5",
														strokeWidth: 3
													})
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: `text-[11px] font-bold ${selected ? "text-[#0b725e]" : "text-[#657a74]"}`,
												children: avatar.name
											})]
										}, avatar.id);
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgressDots, { current: dotIndex })
							]
						}),
						isProfile && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "pb-8",
							"data-testid": "onboarding-profile-view",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "relative flex h-[225px] items-end justify-center overflow-hidden rounded-b-[52%_18%] bg-[radial-gradient(circle_at_50%_25%,#176052_0%,#0b2b28_62%,#061f1d_100%)] pb-7",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: avatarById(profileDraft.avatarId).imageUrl,
										alt: "Selected profile avatar",
										className: "size-28 rounded-full border-4 border-[#f4cf56] object-cover shadow-[0_18px_38px_rgba(0,0,0,.3)]",
										"data-testid": "premium-profile-avatar-preview",
										decoding: "async"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setIndex(Math.max(0, steps.findIndex((step) => step.step_key === "choose_avatar"))),
										className: "absolute bottom-0 right-0 grid size-9 place-items-center rounded-full border-2 border-white bg-[#0f7d68] text-white shadow-lg",
										"aria-label": "Edit avatar",
										"data-testid": "premium-profile-avatar-edit",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "size-4" })
									})]
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "-mt-1 px-5 pt-5 text-center",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
										className: "text-3xl font-extrabold tracking-[-0.035em] text-[#0b2b28]",
										"data-testid": "premium-step-title",
										children: "Complete Your Profile"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-sm text-[#667a74]",
										"data-testid": "premium-step-subtitle",
										children: "Help us personalize your experience"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-5 space-y-3 text-left",
										"data-testid": "premium-profile-form",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileField, {
												label: "Name",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													value: profileDraft.name,
													maxLength: 80,
													onChange: (event) => setProfileDraft((previous) => ({
														...previous,
														name: event.target.value
													})),
													placeholder: "Your name",
													className: "h-12 rounded-2xl border-[#d8dfd9] bg-white px-4 shadow-none",
													"data-testid": "premium-profile-name-input"
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileField, {
												label: "Email",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													value: session?.user.email ?? "",
													readOnly: true,
													className: "h-12 rounded-2xl border-[#d8dfd9] bg-[#f2f1eb] px-4 text-[#71817c] shadow-none",
													"data-testid": "premium-profile-email-input"
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileField, {
												label: "Gender",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
													value: profileDraft.gender,
													onChange: (event) => setProfileDraft((previous) => ({
														...previous,
														gender: event.target.value
													})),
													className: "h-12 w-full rounded-2xl border border-[#d8dfd9] bg-white px-4 text-sm text-[#274943] outline-none focus:border-[#178c73] focus:ring-2 focus:ring-[#178c73]/15",
													"data-testid": "premium-profile-gender-input",
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
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
															value: "prefer_not_to_say",
															children: "Prefer not to say"
														})
													]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileField, {
												label: "Date of Birth",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "date",
													value: profileDraft.dateOfBirth,
													onChange: (event) => setProfileDraft((previous) => ({
														...previous,
														dateOfBirth: event.target.value
													})),
													className: "h-12 rounded-2xl border-[#d8dfd9] bg-white px-4 shadow-none",
													"data-testid": "premium-profile-dob-input"
												})
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgressDots, { current: dotIndex })
								]
							})]
						}),
						isFeature && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "min-h-full",
							"data-testid": `onboarding-feature-${current.step_key}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IllustrationPanel, {
								src: ONBOARDING_ARTWORK[current.step_key],
								alt: `${current.title} illustration`,
								className: "h-[49vh] min-h-[350px] max-h-[440px] w-full rounded-none",
								testId: `onboarding-artwork-${current.step_key}`
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative -mt-8 min-h-[360px] rounded-t-[2rem] bg-[#faf7ef] px-5 pb-8 pt-5 text-center shadow-[0_-12px_30px_rgba(3,32,29,.16)]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgressDots, { current: dotIndex }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
										className: "mt-4 text-3xl font-extrabold tracking-[-0.035em] text-[#0b2b28]",
										"data-testid": "premium-step-title",
										children: current.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#667a74]",
										"data-testid": "premium-step-subtitle",
										children: current.description
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeaturePreview, {
										stepKey: current.step_key,
										referralUrl,
										onCopy: copyReferral,
										onShare: shareReferral
									})
								]
							})]
						}),
						isReady && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "min-h-full",
							"data-testid": "onboarding-ready-view",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IllustrationPanel, {
								src: ONBOARDING_ARTWORK["youre_ready"],
								alt: "CashGPT celebration",
								className: "h-[48vh] min-h-[340px] max-h-[430px] w-full rounded-none",
								testId: "onboarding-artwork-youre-ready"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative -mt-9 min-h-[390px] rounded-t-[2rem] bg-[#faf7ef] px-5 pb-8 pt-6 text-center shadow-[0_-12px_30px_rgba(3,32,29,.16)]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgressDots, { current: dotIndex }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
										className: "mt-4 text-4xl font-extrabold tracking-[-0.04em] text-[#0b2b28]",
										"data-testid": "premium-step-title",
										children: "You're Ready!"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mx-auto mt-2 max-w-xs text-sm text-[#667a74]",
										"data-testid": "premium-step-subtitle",
										children: "Now you know how to earn. Complete your first task to get started."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mx-auto mt-6 flex max-w-sm items-center gap-4 rounded-3xl border border-[#e8cb68] bg-[linear-gradient(135deg,#fff7cf,#ffed9b)] p-4 text-left shadow-[0_14px_32px_rgba(212,175,55,.18)]",
										"data-testid": "premium-ready-card",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "grid size-14 place-items-center rounded-2xl bg-[#0b2b28] text-[#f4cf56]",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WalletCards, { className: "size-7" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block text-[10px] font-bold uppercase tracking-[0.16em] text-[#81671f]",
											children: "Your current balance"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "mt-1 block font-display text-3xl text-[#0b2b28]",
											"data-testid": "premium-wallet-balance",
											children: formatMoney(profile?.wallet_balance ?? 0)
										})] })]
									})
								]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
					className: `absolute inset-x-0 bottom-0 z-40 px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 ${isWelcome ? "bg-gradient-to-t from-[#061f1d] via-[#061f1d] to-transparent" : "border-t border-[#e8e3d8] bg-[#faf7ef]/95 backdrop-blur-md"}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							onClick: next,
							disabled: complete.isPending,
							className: `h-13 w-full rounded-full border-0 text-base font-extrabold ${isWelcome || isReady || current.accent_style === "gold" ? "bg-[linear-gradient(180deg,#ffe478,#d4af37)] !text-[#0b2b28] shadow-[0_12px_28px_rgba(212,175,55,.3)] hover:brightness-105" : "bg-[linear-gradient(180deg,#13826d,#07584c)] !text-white shadow-[0_12px_28px_rgba(7,88,76,.24)] hover:brightness-110"}`,
							"data-testid": `premium-cta-${current.step_key}`,
							children: [complete.isPending ? "Saving…" : current.cta_text.replace(" →", ""), !complete.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
						}),
						isWelcome && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: goHome,
							className: "mt-2 w-full py-1 text-xs font-semibold text-white/70 hover:text-white",
							"data-testid": "premium-skip-for-now",
							children: "Skip for now"
						}),
						isReady && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: goHome,
							className: "mt-2 w-full py-1 text-xs font-bold text-[#0b5b4d] hover:text-[#0b2b28]",
							"data-testid": "premium-explore-app",
							children: "Explore App"
						}),
						preview && !isWelcome && !isReady && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-center text-[8px] font-bold uppercase tracking-[0.16em] text-[#9c8a5a]",
							children: "Preview mode"
						})
					]
				})
			]
		})
	});
}
function IllustrationPanel({ src, alt, className, testId }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `premium-illustration-panel relative overflow-hidden bg-[#0b2b28] ${className}`,
		"data-testid": testId,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src,
				alt,
				className: "size-full object-cover",
				decoding: "async"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "premium-panel-glint premium-panel-glint-one",
				"aria-hidden": true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "premium-panel-glint premium-panel-glint-two",
				"aria-hidden": true
			})
		]
	});
}
function ProgressDots({ current, dark = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex items-center justify-center gap-2",
		"data-testid": "premium-onboarding-stepper",
		children: [
			0,
			1,
			2,
			3,
			4
		].map((dot) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `rounded-full transition-[width,background-color,box-shadow] duration-300 ${dot === current ? "h-2 w-6 bg-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,.45)]" : `size-2 ${dark ? "bg-white/35" : "bg-[#cdd6d1]"}`}`,
			"data-testid": `premium-feature-dot-${dot + 1}`
		}, dot))
	});
}
function ProfileField({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			className: "ml-1 text-[11px] font-bold text-[#42615a]",
			children: label
		}), children]
	});
}
function FeaturePreview({ stepKey, referralUrl, onCopy, onShare }) {
	if (stepKey === "features_offers") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto mt-5 flex max-w-sm items-center gap-3 rounded-2xl border border-[#dfe5dd] bg-white p-3 text-left shadow-[0_10px_24px_rgba(11,43,40,.08)]",
		"data-testid": "premium-offer-preview",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid size-11 shrink-0 place-items-center rounded-xl bg-[#0e6f5e] text-[#f4cf56]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gift, { className: "size-5" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block text-xs font-extrabold text-[#173f38]",
					children: "Deal Offers"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mt-1 block text-[10px] leading-snug text-[#71817c]",
					children: "Grab limited-time deals and promotional offers with high rewards."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "rounded-full bg-[#f25d4b] px-2 py-1 text-[8px] font-extrabold uppercase text-white",
				children: "Hot"
			})
		]
	});
	if (stepKey === "quest") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mx-auto mt-5 max-w-sm divide-y divide-[#e3e8e2] overflow-hidden rounded-2xl border border-[#dfe5dd] bg-white text-left shadow-[0_10px_24px_rgba(11,43,40,.08)]",
		"data-testid": "premium-quest-types",
		children: [
			{
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockKeyhole, {}),
				label: "Locker",
				note: "Complete offers & unlock"
			},
			{
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, {}),
				label: "Shortlink",
				note: "Visit & earn"
			},
			{
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {}),
				label: "Special Quest",
				note: "Bonus rewards"
			}
		].map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3 p-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid size-9 place-items-center rounded-full bg-[#0e6f5e] text-[#f4cf56] [&_svg]:size-4",
				children: row.icon
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block text-xs font-extrabold text-[#173f38]",
				children: row.label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mt-0.5 block text-[10px] text-[#71817c]",
				children: row.note
			})] })]
		}, row.label))
	});
	if (stepKey === "watch_earn") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto mt-5 flex max-w-sm items-center gap-3 rounded-2xl border border-[#dfe5dd] bg-white p-3 text-left shadow-[0_10px_24px_rgba(11,43,40,.08)]",
		"data-testid": "premium-watch-preview",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "grid size-11 place-items-center rounded-full bg-[#0e6f5e] text-white",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-5 fill-current" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-xs font-extrabold text-[#173f38]",
			children: "Watch Ads"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mt-1 block text-[10px] text-[#71817c]",
			children: "Complete ad goals and earn rewards."
		})] })]
	});
	if (stepKey === "offerwall") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mx-auto mt-5 grid max-w-sm grid-cols-2 gap-2 rounded-2xl border border-[#dfe5dd] bg-white p-3 text-left shadow-[0_10px_24px_rgba(11,43,40,.08)]",
		"data-testid": "premium-offerwall-checklist",
		children: [
			{
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, {}),
				label: "Apps"
			},
			{
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardCopy, {}),
				label: "Surveys"
			},
			{
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gamepad2, {}),
				label: "Games"
			},
			{
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {}),
				label: "And more…"
			}
		].map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 rounded-xl bg-[#f1f7f3] px-3 py-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-4 text-[#0e7d66]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs font-bold text-[#274943]",
				children: row.label
			})]
		}, row.label))
	});
	if (stepKey === "refer_earn") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto mt-5 max-w-sm rounded-2xl border border-[#dfe5dd] bg-white p-3 text-left shadow-[0_10px_24px_rgba(11,43,40,.08)]",
		"data-testid": "premium-referral-box",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[10px] font-bold uppercase tracking-[0.13em] text-[#71817c]",
				children: "Your referral link"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 truncate rounded-xl bg-[#edf4ef] px-3 py-2.5 text-xs font-semibold text-[#31544d]",
				"data-testid": "premium-referral-url",
				children: referralUrl
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "button",
					size: "sm",
					variant: "jade",
					onClick: onCopy,
					className: "rounded-full",
					"data-testid": "premium-copy-referral",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5" }), " Copy"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "button",
					size: "sm",
					variant: "outline",
					onClick: onShare,
					className: "rounded-full",
					"data-testid": "premium-share-referral",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "size-3.5" }), " Share"]
				})]
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-5 flex justify-center gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "size-5 text-[#0e7d66]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trophy, { className: "size-5 text-[#d4af37]" })]
	});
}
function OnboardingPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PremiumOnboarding, {});
}
//#endregion
export { OnboardingPage as component };
