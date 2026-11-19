import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { C as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { Ht as ChevronRight, Lt as CirclePlus, d as Upload, n as X, x as Star } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as BackLink } from "./Preview-MVZOUW8x.mjs";
import { n as supabase } from "./client-QOMq7HzS.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { i as campaignTotals, s as init_pricing } from "./advertiser.server-DyvSoHf7.mjs";
import { D as Input, E as Label, Ft as createCampaign, Gt as listCategories, M as SectionHeading, Ot as Button, d as AppShell, nr as useServerFn, rn as useRole } from "./router-sXMnYegW.mjs";
import { t as Textarea } from "./textarea-kko37XEX.mjs";
import { t as Switch } from "./switch-Cn1w-cIH.mjs";
import { t as PostbackSecretModal } from "./PostbackSecretModal-f06SxCE8.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/create-B4TAqOyr.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
init_pricing();
var COUNTRIES = [
	"Worldwide",
	"United States",
	"India",
	"United Kingdom",
	"Canada",
	"Brazil",
	"Germany"
];
var PROOF_TEMPLATES = {
	"app-install": {
		title: "Install an app",
		description: "Users will submit a screenshot and their username",
		instructions: "Install the app, create an account, and upload a screenshot showing you're logged in with your username visible",
		type: "both",
		minImages: 1,
		maxImages: 2,
		fields: [{
			label: "Username",
			required: true,
			maxLen: 80
		}]
	},
	"social-follow": {
		title: "Follow or like on social media",
		description: "Users will submit a screenshot and their profile link",
		instructions: "Follow/like the page and upload a screenshot showing you completed the action. Also provide your profile link",
		type: "both",
		minImages: 1,
		maxImages: 2,
		fields: [{
			label: "Your profile link",
			required: true,
			maxLen: 200
		}]
	},
	survey: {
		title: "Fill a survey or form",
		description: "Users will submit a completion code",
		instructions: "Complete the survey or form and enter the completion code shown at the end",
		type: "text",
		minImages: 0,
		maxImages: 1,
		fields: [{
			label: "Completion code",
			required: true,
			maxLen: 80
		}]
	},
	purchase: {
		title: "Buy or sign up",
		description: "Users will submit a screenshot and order/account ID",
		instructions: "Complete the purchase or sign up, then upload a screenshot of your confirmation and provide your order or account ID",
		type: "both",
		minImages: 1,
		maxImages: 3,
		fields: [{
			label: "Order or account ID",
			required: true,
			maxLen: 100
		}]
	}
};
function CreateCampaignPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { overview, refreshOverview } = useRole();
	const createFn = useServerFn(createCampaign);
	const categoriesFn = useServerFn(listCategories);
	const categories = useQuery({
		queryKey: ["marketplace-categories"],
		queryFn: () => categoriesFn({})
	});
	const [title, setTitle] = (0, import_react.useState)("");
	const [description, setDescription] = (0, import_react.useState)("");
	const [verification, setVerification] = (0, import_react.useState)("proof");
	const [proofMode, setProofMode] = (0, import_react.useState)("screenshot");
	const [proofDescription, setProofDescription] = (0, import_react.useState)("");
	const [proofMinImages, setProofMinImages] = (0, import_react.useState)(1);
	const [proofMaxImages, setProofMaxImages] = (0, import_react.useState)(3);
	const [proofFields, setProofFields] = (0, import_react.useState)([]);
	const [reward, setReward] = (0, import_react.useState)("0.50");
	const [slots, setSlots] = (0, import_react.useState)("50");
	const [country, setCountry] = (0, import_react.useState)("Worldwide");
	const [categoryId, setCategoryId] = (0, import_react.useState)("");
	const [subcategoryId, setSubcategoryId] = (0, import_react.useState)("");
	const [landingUrl, setLandingUrl] = (0, import_react.useState)("");
	const [estimatedMinutes, setEstimatedMinutes] = (0, import_react.useState)("");
	const [showAdvanced, setShowAdvanced] = (0, import_react.useState)(false);
	const [reviewWindow, setReviewWindow] = (0, import_react.useState)(24);
	const [proofExampleFile, setProofExampleFile] = (0, import_react.useState)(null);
	const [proofExampleUrl, setProofExampleUrl] = (0, import_react.useState)("");
	const [startDate, setStartDate] = (0, import_react.useState)("");
	const [startTime, setStartTime] = (0, import_react.useState)("00:00");
	const [endDate, setEndDate] = (0, import_react.useState)("");
	const [endTime, setEndTime] = (0, import_react.useState)("23:59");
	const [devices, setDevices] = (0, import_react.useState)([]);
	const [eligibilityNote, setEligibilityNote] = (0, import_react.useState)("");
	const [dailyLimit, setDailyLimit] = (0, import_react.useState)("");
	const [featured, setFeatured] = (0, import_react.useState)(false);
	const [showTemplates, setShowTemplates] = (0, import_react.useState)(false);
	const [featuredDays, setFeaturedDays] = (0, import_react.useState)("7");
	const [trackingUrl, setTrackingUrl] = (0, import_react.useState)("");
	const [ipAllowlist, setIpAllowlist] = (0, import_react.useState)("");
	const [rulesAccepted, setRulesAccepted] = (0, import_react.useState)(false);
	const [showPostback, setShowPostback] = (0, import_react.useState)(false);
	const [postbackInfo, setPostbackInfo] = (0, import_react.useState)(null);
	const [allDevices, setAllDevices] = (0, import_react.useState)(true);
	const selectedCategory = (0, import_react.useMemo)(() => categories.data?.find((c) => c.id === categoryId), [categories.data, categoryId]);
	const rewardNum = Number(reward) || 0;
	const slotsNum = Number(slots) || 0;
	const platformFeePercent = overview?.settings?.platformFeePercent ?? 5;
	const featuredPricePerDay = overview?.settings?.featuredPricePerDay ?? 2;
	const feesEnabled = overview?.settings?.feesEnabled ?? false;
	const campaignFeeUsd = overview?.settings?.campaignFeeUsd ?? .5;
	const campaignFeeType = overview?.settings?.campaignFeeType ?? "per_campaign";
	const featuredDaysNum = Number(featuredDays) || 0;
	const featuredFee = featured && featuredDaysNum > 0 ? featuredDaysNum * featuredPricePerDay : 0;
	const totals = (0, import_react.useMemo)(() => campaignTotals({
		slots: slotsNum,
		reward: rewardNum,
		feePercent: platformFeePercent,
		feesEnabled,
		feeUsd: campaignFeeUsd,
		feeType: campaignFeeType,
		featuredFee
	}), [
		slotsNum,
		rewardNum,
		platformFeePercent,
		feesEnabled,
		campaignFeeUsd,
		campaignFeeType,
		featuredFee
	]);
	const account = overview?.account;
	const canCreate = account?.status === "active" && account.spendable >= totals.total && slotsNum >= 15 && rulesAccepted;
	const generateFieldKey = (label) => {
		return label.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "_").substring(0, 50);
	};
	const applyTemplate = (templateKey) => {
		const template = PROOF_TEMPLATES[templateKey];
		if (!template) return;
		if (proofDescription.trim().length > 0 || proofFields.length > 0) {
			if (!confirm("This will replace your proof settings. Continue?")) return;
		}
		setProofDescription(template.instructions);
		setProofMode(template.type);
		setProofMinImages(template.minImages);
		setProofMaxImages(template.maxImages);
		setProofFields(template.fields.map((f) => ({
			...f,
			key: generateFieldKey(f.label)
		})));
	};
	const addProofField = () => {
		if (proofFields.length >= 5) {
			toast.error("Maximum 5 fields allowed");
			return;
		}
		setProofFields([...proofFields, {
			key: "",
			label: "",
			required: false,
			maxLen: 80
		}]);
	};
	const updateProofField = (index, updates) => {
		const newFields = [...proofFields];
		newFields[index] = {
			...newFields[index],
			...updates
		};
		if (updates.label !== void 0) newFields[index].key = generateFieldKey(updates.label);
		setProofFields(newFields);
	};
	const removeProofField = (index) => {
		setProofFields(proofFields.filter((_, i) => i !== index));
	};
	const mutation = useMutation({
		mutationFn: async () => {
			let uploadedExampleUrl;
			if (proofExampleFile) {
				const path = `${overview?.account?.userId}/${Date.now()}-${proofExampleFile.name}`;
				const { data: uploadData, error: uploadError } = await supabase.storage.from("campaign-proof-examples").upload(path, proofExampleFile, {
					cacheControl: "3600",
					upsert: false
				});
				if (uploadError) throw new Error(`Failed to upload proof example: ${uploadError.message}`);
				const { data: { publicUrl } } = supabase.storage.from("campaign-proof-examples").getPublicUrl(uploadData.path);
				uploadedExampleUrl = publicUrl;
			}
			const startsAt = startDate && startTime ? (/* @__PURE__ */ new Date(`${startDate}T${startTime}`)).toISOString() : void 0;
			const endsAt = endDate && endTime ? (/* @__PURE__ */ new Date(`${endDate}T${endTime}`)).toISOString() : void 0;
			return createFn({ data: {
				title: title.trim(),
				description: description.trim(),
				verification,
				reward: rewardNum,
				slots: slotsNum,
				countries: country === "Worldwide" ? [] : [{
					"United States": "US",
					India: "IN",
					"United Kingdom": "GB",
					Canada: "CA",
					Brazil: "BR",
					Germany: "DE"
				}[country] ?? country],
				categoryId,
				subcategoryId: subcategoryId || void 0,
				landingUrl: landingUrl.trim(),
				estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : void 0,
				featured,
				featuredDays: featured ? Number(featuredDays) : void 0,
				trackingUrl: verification === "auto" && trackingUrl ? trackingUrl.trim() : void 0,
				ipAllowlist: ipAllowlist ? ipAllowlist.split(",").map((ip) => ip.trim()).filter(Boolean) : void 0,
				proofDescription: verification === "proof" && proofDescription ? proofDescription.trim() : void 0,
				proofMode: verification === "proof" ? proofMode : void 0,
				proofMinImages: verification === "proof" ? proofMinImages : void 0,
				proofMaxImages: verification === "proof" ? proofMaxImages : void 0,
				proofFields: verification === "proof" && proofFields.length > 0 ? proofFields : void 0,
				reviewWindow: verification === "proof" ? reviewWindow : void 0,
				devices: verification === "proof" ? devices.length === 3 ? [] : devices : void 0,
				proofExampleUrl: uploadedExampleUrl || proofExampleUrl || void 0,
				startsAt,
				endsAt,
				eligibilityNote: eligibilityNote.trim() || void 0,
				dailyLimit: dailyLimit ? Number(dailyLimit) : void 0,
				rulesAccepted
			} });
		},
		onSuccess: async (result) => {
			await Promise.all([refreshOverview(), queryClient.invalidateQueries({ queryKey: ["my-campaigns"] })]);
			if (result.postbackUrl && result.postbackSecret) {
				setPostbackInfo({
					url: result.postbackUrl,
					secret: result.postbackSecret
				});
				setShowPostback(true);
			}
			if (result.featuredApplied === false && result.featuredError) toast.warning(`Campaign submitted. Featured placement wasn't applied: ${result.featuredError}`);
			else if (result.featuredApplied === true) toast.success("Campaign submitted for review with featured placement");
			else toast.success("Campaign submitted for review");
			if (!result.postbackUrl) navigate({ to: "/advertiser/campaigns" });
		},
		onError: (err) => {
			const msg = err instanceof Error ? err.message.replace(/^[A-Z_]+: /, "") : "Something went wrong";
			toast.error("Couldn't create campaign", { description: msg });
		}
	});
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
				icon: CirclePlus,
				iconSrc: "/icons/icon-create-campaign-v2.webp",
				title: "Create Campaign",
				subtitle: "Describe the task publishers will complete.",
				className: "mb-2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "surface-card mt-3 space-y-4 p-4",
				"data-testid": "create-campaign-form",
				onSubmit: (e) => {
					e.preventDefault();
					if (!canCreate) {
						if (slotsNum < 15) {
							toast.error("Minimum 15 slots required");
							return;
						}
						if (!rulesAccepted) {
							toast.error("Accept offer rules to continue");
							return;
						}
						toast.error("Add funds first", { description: `You need at least $${totals.total.toFixed(2)} in your Campaign Balance.` });
						return;
					}
					if (!categoryId) {
						toast.error("Select a category");
						return;
					}
					if (!landingUrl.trim()) {
						toast.error("Enter a destination URL");
						return;
					}
					if (verification === "auto" && !trackingUrl.trim()) {
						toast.error("Enter tracking URL for auto verification");
						return;
					}
					if (verification === "auto" && !trackingUrl.includes("{click_id}")) {
						toast.error("Tracking URL must contain {click_id} placeholder");
						return;
					}
					if (startDate && endDate && /* @__PURE__ */ new Date(`${endDate}T${endTime}`) <= /* @__PURE__ */ new Date(`${startDate}T${startTime}`)) {
						toast.error("End date must be after start date");
						return;
					}
					if (dailyLimit && (Number(dailyLimit) < 1 || Number(dailyLimit) > slotsNum)) {
						toast.error(`Daily limit must be between 1 and ${slotsNum}`);
						return;
					}
					if (verification === "proof") {
						if (!proofDescription.trim() || proofDescription.length < 10) {
							toast.error("Proof instructions required (at least 10 characters)");
							return;
						}
						if (devices.length === 0) {
							toast.error("Select at least one device");
							return;
						}
						if (proofMode === "text" && proofFields.length === 0) {
							toast.error("Text proof requires at least one custom field");
							return;
						}
						if (proofMode === "screenshot" && proofMinImages < 1) {
							toast.error("Screenshot proof requires at least 1 image");
							return;
						}
						if (proofMode === "text" && proofMinImages === 0 && proofFields.length === 0) {
							toast.error("Text-only proof requires at least one field");
							return;
						}
						if ((proofMode === "either" || proofMode === "both") && proofMinImages === 0 && proofFields.length === 0) {
							toast.error("You must configure either images or custom fields");
							return;
						}
						const keys = proofFields.map((f) => f.key);
						if (new Set(keys).size !== keys.length) {
							toast.error("Duplicate field labels detected - please use unique labels");
							return;
						}
						for (const field of proofFields) if (!field.label.trim() || field.label.length < 2) {
							toast.error("All field labels must be at least 2 characters");
							return;
						}
					}
					mutation.mutate();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "c-title",
							children: "Campaign title"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "c-title",
							maxLength: 80,
							placeholder: "e.g. Install & open Coin Rush",
							value: title,
							onChange: (e) => setTitle(e.target.value),
							required: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "c-desc",
							children: "Description & steps"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							id: "c-desc",
							rows: 4,
							maxLength: 1e3,
							placeholder: "What should the publisher do, step by step?",
							value: description,
							onChange: (e) => setDescription(e.target.value),
							required: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "c-category",
								children: "Category"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								id: "c-category",
								className: "h-11 w-full rounded-xl border border-border bg-card px-3 text-sm",
								value: categoryId,
								onChange: (e) => {
									setCategoryId(e.target.value);
									setSubcategoryId("");
								},
								required: true,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "Select category"
								}), (categories.data ?? []).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: c.id,
									children: c.name
								}, c.id))]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "c-subcategory",
								children: "Subcategory (optional)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								id: "c-subcategory",
								className: "h-11 w-full rounded-xl border border-border bg-card px-3 text-sm",
								value: subcategoryId,
								onChange: (e) => setSubcategoryId(e.target.value),
								disabled: !selectedCategory,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "None"
								}), (selectedCategory?.subcategories ?? []).map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: s.id,
									children: s.name
								}, s.id))]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "c-landing-url",
								children: "Destination URL"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "c-landing-url",
								type: "url",
								maxLength: 2048,
								placeholder: "https://example.com/campaign-page",
								value: landingUrl,
								onChange: (e) => setLandingUrl(e.target.value),
								required: true
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-muted-foreground",
								children: "Must be an HTTPS URL"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "c-estimated-minutes",
								children: "Estimated time (optional)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "c-estimated-minutes",
								type: "number",
								min: 1,
								max: 1440,
								placeholder: "e.g. 10",
								value: estimatedMinutes,
								onChange: (e) => setEstimatedMinutes(e.target.value)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-muted-foreground",
								children: "How many minutes to complete? (1-1440)"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Verification" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-2 gap-2",
							role: "radiogroup",
							children: [[
								"proof",
								"🟡 Manual Proof",
								"Publishers upload a screenshot you review"
							], [
								"auto",
								"🟢 Auto Verified",
								"Completion is detected automatically"
							]].map(([value, label, hint]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								role: "radio",
								"aria-checked": verification === value,
								"data-testid": `verification-${value}`,
								onClick: () => setVerification(value),
								className: `rounded-2xl border p-3 text-left ${verification === value ? "border-primary bg-primary/10" : "border-border bg-card"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-sm font-semibold",
									children: label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-0.5 block text-[11px] text-muted-foreground",
									children: hint
								})]
							}, value))
						})]
					}),
					verification === "proof" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3 rounded-xl border border-gold/40 bg-gold/10 p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "c-proof-instructions",
										children: "Instructions for proof *"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
										id: "c-proof-instructions",
										rows: 2,
										minLength: 10,
										maxLength: 500,
										placeholder: "e.g. Upload a screenshot showing the app installed and opened with your username visible",
										value: proofDescription,
										onChange: (e) => setProofDescription(e.target.value),
										required: true
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-muted-foreground",
										children: "Tell publishers exactly what proof they need to provide (10-500 chars)"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Proof type" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid grid-cols-2 gap-2",
									children: [
										{
											value: "screenshot",
											label: "Screenshot only",
											desc: "Users must upload screenshots"
										},
										{
											value: "text",
											label: "Text only",
											desc: "Users must fill the details you ask for"
										},
										{
											value: "both",
											label: "Both required",
											desc: "Screenshot AND details"
										},
										{
											value: "either",
											label: "Either one",
											desc: "Screenshot OR details, one is enough"
										}
									].map(({ value, label, desc }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => {
											setProofMode(value);
											if (value === "screenshot") {
												setProofMinImages(1);
												setProofMaxImages(3);
												setProofFields([]);
											} else if (value === "text") {
												setProofMinImages(0);
												setProofMaxImages(1);
												if (proofFields.length === 0) setProofFields([{
													key: "completion_code",
													label: "Completion code",
													required: true,
													maxLen: 80
												}]);
											} else if (value === "both") {
												setProofMinImages(1);
												setProofMaxImages(3);
												if (proofFields.length === 0) setProofFields([{
													key: "username",
													label: "Username",
													required: true,
													maxLen: 80
												}]);
												setProofFields((fields) => fields.map((f) => ({
													...f,
													required: true
												})));
											} else if (value === "either") {
												setProofMinImages(0);
												setProofMaxImages(3);
												if (proofFields.length === 0) setProofFields([{
													key: "details",
													label: "Additional details",
													required: false,
													maxLen: 200
												}]);
												setProofFields((fields) => fields.map((f) => ({
													...f,
													required: false
												})));
											}
										},
										className: `rounded-xl border p-3 text-left ${proofMode === value ? "border-gold-dark bg-gold/20" : "border-border bg-card"}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: `text-sm font-medium ${proofMode === value ? "text-gold-dark" : ""}`,
											children: label
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: `mt-0.5 text-[11px] ${proofMode === value ? "text-gold-dark/80" : "text-muted-foreground"}`,
											children: desc
										})]
									}, value))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setShowTemplates(!showTemplates),
									className: "flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium hover:bg-background-alt",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Need help? Use a ready-made template" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: `size-4 transition-transform ${showTemplates ? "rotate-90" : ""}` })]
								}), showTemplates && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid gap-3 sm:grid-cols-2",
									children: Object.entries(PROOF_TEMPLATES).map(([key, template]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2 rounded-xl border border-border bg-card p-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "font-semibold",
												children: template.title
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground",
												children: template.description
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												type: "button",
												variant: "outline",
												size: "sm",
												className: "w-full",
												onClick: () => applyTemplate(key),
												children: "Use this template"
											})
										]
									}, key))
								})]
							}),
							proofMode !== "text" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "c-proof-min-images",
										children: "Min images"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "c-proof-min-images",
										type: "number",
										min: proofMode === "text" ? 0 : proofMode === "either" ? 0 : 1,
										max: 5,
										value: proofMinImages,
										onChange: (e) => setProofMinImages(Math.max(proofMode === "text" ? 0 : proofMode === "either" ? 0 : 1, Math.min(5, Number(e.target.value) || 1)))
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "c-proof-max-images",
										children: "Max images"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "c-proof-max-images",
										type: "number",
										min: Math.max(1, proofMinImages),
										max: 5,
										value: proofMaxImages,
										onChange: (e) => setProofMaxImages(Math.max(proofMinImages, Math.min(5, Number(e.target.value) || 3)))
									})]
								})]
							}),
							proofMode !== "screenshot" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-xs",
											children: "Custom fields"
										}), proofFields.length < 5 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: "outline",
											size: "sm",
											onClick: addProofField,
											children: "+ Add field"
										})]
									}),
									proofFields.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground",
										children: "At least one field is required for text proof"
									}),
									proofFields.map((field, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "space-y-2 rounded-lg border border-border bg-card p-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-start gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex-1 space-y-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													placeholder: "Field label (e.g. Username, Order ID)",
													value: field.label,
													maxLength: 60,
													onChange: (e) => updateProofField(index, { label: e.target.value }),
													required: true
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid grid-cols-2 gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "number",
														min: 10,
														max: 500,
														placeholder: "Max length",
														value: field.maxLen,
														onChange: (e) => updateProofField(index, { maxLen: Math.max(10, Math.min(500, Number(e.target.value) || 80)) })
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
														className: "flex items-center gap-2 text-xs",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
															type: "checkbox",
															checked: field.required,
															onChange: (e) => updateProofField(index, { required: e.target.checked })
														}), "Required"]
													})]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => removeProofField(index),
												className: "shrink-0 text-destructive hover:text-destructive/80",
												children: "×"
											})]
										})
									}, index))
								]
							})
						]
					}),
					verification === "proof" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "c-review-window",
								children: "Review within *"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								id: "c-review-window",
								className: "h-11 w-full rounded-xl border border-border bg-card px-3 text-sm",
								value: reviewWindow,
								onChange: (e) => setReviewWindow(Number(e.target.value)),
								required: true,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: 6,
										children: "6 hours"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: 12,
										children: "12 hours"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: 24,
										children: "24 hours (recommended)"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: 48,
										children: "48 hours"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: 72,
										children: "72 hours"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: 168,
										children: "7 days"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-muted-foreground",
								children: "If you do not review a submission in this time, it is approved automatically and the earner is paid."
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Devices *" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card p-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm font-medium",
										children: "All devices"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: allDevices,
										onChange: (e) => {
											const checked = e.target.checked;
											setAllDevices(checked);
											if (checked) setDevices([
												"android",
												"ios",
												"desktop"
											]);
										},
										className: "size-4"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid grid-cols-3 gap-2",
									children: [
										"android",
										"ios",
										"desktop"
									].map((device) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: `flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-colors ${devices.includes(device) ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/50"}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: devices.includes(device),
											onChange: (e) => {
												let newDevices;
												if (e.target.checked) newDevices = [...devices, device];
												else newDevices = devices.filter((d) => d !== device);
												setDevices(newDevices);
												setAllDevices(newDevices.length === 3);
											},
											className: "hidden"
										}), device === "android" ? "Android" : device === "ios" ? "iOS" : "Desktop"]
									}, device))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-muted-foreground",
								children: "Select at least one device. If all three are selected, the offer will be available on all devices."
							})
						]
					})] }),
					verification === "proof" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setShowAdvanced(!showAdvanced),
							className: "flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 text-left text-sm font-semibold hover:bg-muted/50",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Advanced settings" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground",
								children: showAdvanced ? "−" : "+"
							})]
						}), showAdvanced && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3 rounded-xl border border-border bg-card p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "c-proof-example",
											children: "Proof example (optional)"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [!proofExampleFile && !proofExampleUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												htmlFor: "c-proof-example",
												className: "flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground hover:border-primary/50 hover:bg-muted/50",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Upload example image (max 2 MB)" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														id: "c-proof-example",
														type: "file",
														accept: "image/jpeg,image/png,image/webp",
														className: "hidden",
														onChange: (e) => {
															const file = e.target.files?.[0];
															if (file) {
																if (file.size > 2097152) {
																	toast.error("Image must be under 2 MB");
																	return;
																}
																setProofExampleFile(file);
															}
														}
													})
												]
											}), proofExampleFile && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between rounded-xl border border-border bg-muted/50 p-3 text-sm",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "truncate",
													children: proofExampleFile.name
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => setProofExampleFile(null),
													className: "text-destructive hover:text-destructive/80",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
												})]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[11px] text-muted-foreground",
											children: "Show publishers an example of what a good proof looks like"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Start & end dates (optional)" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-2 gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "space-y-1",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "date",
													value: startDate,
													onChange: (e) => setStartDate(e.target.value),
													placeholder: "Start date"
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "space-y-1",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "time",
													value: startTime,
													onChange: (e) => setStartTime(e.target.value)
												})
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-2 gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "space-y-1",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "date",
													value: endDate,
													onChange: (e) => setEndDate(e.target.value),
													placeholder: "End date",
													min: startDate || void 0
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "space-y-1",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "time",
													value: endTime,
													onChange: (e) => setEndTime(e.target.value)
												})
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[11px] text-muted-foreground",
											children: "Campaign will automatically complete at end date"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "c-eligibility-note",
											children: "Eligibility note (optional)"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
											id: "c-eligibility-note",
											rows: 2,
											maxLength: 300,
											placeholder: "e.g. Must be a new user, Only for users 18+",
											value: eligibilityNote,
											onChange: (e) => setEligibilityNote(e.target.value)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[11px] text-muted-foreground",
											children: "Additional requirements or restrictions (max 300 chars)"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "c-daily-limit",
											children: "Daily completion limit (optional)"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "c-daily-limit",
											type: "number",
											min: 1,
											max: Number(slots) || 100,
											placeholder: "e.g. 20",
											value: dailyLimit,
											onChange: (e) => setDailyLimit(e.target.value)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-[11px] text-muted-foreground",
											children: [
												"Max completions per rolling 24 hours (between 1 and ",
												slots || "max",
												" slots)"
											]
										})
									]
								})
							]
						})]
					}),
					verification === "auto" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "c-tracking-url",
									children: "Tracking URL *"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "c-tracking-url",
									type: "url",
									maxLength: 2048,
									placeholder: "https://yoursite.com/track?click_id={click_id}",
									value: trackingUrl,
									onChange: (e) => setTrackingUrl(e.target.value),
									required: true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[11px] text-muted-foreground",
									children: [
										"Must be HTTPS and include",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
											className: "rounded bg-muted px-1",
											children: "click_id"
										}),
										" placeholder"
									]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "c-ip-allowlist",
									children: "IP Allowlist (optional)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "c-ip-allowlist",
									placeholder: "192.168.1.1, 10.0.0.1",
									value: ipAllowlist,
									onChange: (e) => setIpAllowlist(e.target.value)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] text-muted-foreground",
									children: "Comma-separated IPs that can send postbacks"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "c-reward",
								children: "Reward per completion"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "c-reward",
								type: "number",
								min: .05,
								step: .05,
								inputMode: "decimal",
								value: reward,
								onChange: (e) => setReward(e.target.value),
								required: true
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "c-slots",
									children: "Number of slots"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex gap-2 mb-2",
									children: [
										15,
										50,
										100,
										500
									].map((preset) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setSlots(preset.toString()),
										className: `flex-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${Number(slots) === preset ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/50"}`,
										children: preset
									}, preset))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "c-slots",
									type: "number",
									min: 15,
									step: 1,
									inputMode: "numeric",
									value: slots,
									onChange: (e) => setSlots(e.target.value),
									required: true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] text-muted-foreground",
									children: "Minimum 15 slots"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl bg-mint/15 px-3 py-2 text-xs text-primary space-y-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Slots × Reward:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: ["$", (slotsNum * rewardNum).toFixed(2)] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"Platform fee (",
									platformFeePercent,
									"%):"
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: ["$", (slotsNum * rewardNum * platformFeePercent / 100).toFixed(2)] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between border-t border-primary/20 pt-1 mt-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Campaign budget:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: ["$", totals.allocation.toFixed(2)] })]
							}),
							totals.campaignFee > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"Campaign fee (",
									campaignFeeType === "per_campaign" ? "one-time" : `${slotsNum} slots`,
									"):"
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: ["$", totals.campaignFee.toFixed(2)] })]
							}),
							totals.featuredFee > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"Featured placement (",
									featuredDaysNum,
									"d):"
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: ["$", totals.featuredFee.toFixed(2)] })]
							}),
							(totals.campaignFee > 0 || totals.featuredFee > 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between border-t border-primary/20 pt-1 mt-1 font-semibold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Total cost:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: ["$", totals.total.toFixed(2)] })]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "c-country",
							children: "Country targeting"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							id: "c-country",
							className: "h-11 w-full rounded-xl border border-border bg-card px-3 text-sm",
							value: country,
							onChange: (e) => setCountry(e.target.value),
							children: COUNTRIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: c }, c))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-gold/40 bg-gold/10 p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "size-4 fill-gold text-gold-dark" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "c-featured",
									children: "Featured placement"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] text-muted-foreground",
									children: "Get more visibility in the marketplace."
								})] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
								id: "c-featured",
								checked: featured,
								onCheckedChange: setFeatured,
								"aria-label": "Enable featured placement"
							})]
						}), featured && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 grid grid-cols-2 items-end gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "c-featured-days",
									children: "Featured days"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "c-featured-days",
									type: "number",
									min: 1,
									max: 30,
									value: featuredDays,
									onChange: (e) => setFeaturedDays(e.target.value)
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "rounded-xl bg-card px-3 py-2 text-xs text-gold-dark",
								children: [
									"+$",
									featuredFee.toFixed(2),
									" placement fee"
								]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3 rounded-xl border border-muted-foreground/20 bg-muted/30 p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-semibold mb-2",
							children: "Offer Rules"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2 text-xs text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium text-foreground mb-1",
								children: "✅ Allowed:"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "App install, signup, website visit, free/paid trial, purchase, lead form, survey, video watch, social actions with proof, app testing." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium text-foreground mb-1",
								children: "❌ Not allowed:"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Requests for card/ID/OTP, crypto wallet connect/seed phrase, adult/illegal/misleading offers, phishing/malware, APKs outside stores, fake reviews, impersonation." })] })]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-start gap-2 cursor-pointer",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: rulesAccepted,
								onChange: (e) => setRulesAccepted(e.target.checked),
								className: "mt-0.5",
								required: true
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted-foreground",
								children: "I have read and agree to follow the offer rules above"
							})]
						})]
					}),
					!canCreate && account && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive",
						children: [
							"Not enough Campaign Balance. You have $",
							account.spendable.toFixed(2),
							", need $",
							totals.total.toFixed(2),
							(totals.campaignFee > 0 || totals.featuredFee > 0) && ` ($${totals.allocation.toFixed(2)} budget${totals.campaignFee > 0 ? ` + $${totals.campaignFee.toFixed(2)} fee` : ""}${totals.featuredFee > 0 ? ` + $${totals.featuredFee.toFixed(2)} featured` : ""})`,
							"."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						variant: "jade",
						size: "lg",
						className: "w-full",
						"data-testid": "create-campaign-submit",
						disabled: mutation.isPending || !canCreate,
						children: mutation.isPending ? "Creating..." : "Create campaign"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-center text-[11px] text-muted-foreground",
						children: "Campaign starts as a draft. You can edit it, then submit for review to go live."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PostbackSecretModal, {
				open: showPostback && postbackInfo !== null,
				onClose: () => {
					setShowPostback(false);
					navigate({ to: "/advertiser/campaigns" });
				},
				postbackUrl: postbackInfo?.url || "",
				postbackSecret: postbackInfo?.secret || ""
			})
		]
	});
}
//#endregion
export { CreateCampaignPage as component };
