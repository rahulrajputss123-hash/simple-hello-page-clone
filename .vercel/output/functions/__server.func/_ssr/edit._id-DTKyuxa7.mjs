import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { C as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { S as SquarePen, et as LoaderCircle, n as X } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as BackLink } from "./Preview-MVZOUW8x.mjs";
import { t as Skeleton } from "./skeleton-D9W9wFsj.mjs";
import { n as supabase } from "./client-QOMq7HzS.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { Bt as getCampaignForEdit, D as Input, E as Label, Gt as listCategories, M as SectionHeading, Ot as Button, a as Route$10, d as AppShell, nr as useServerFn, rn as useRole, zt as editCampaign } from "./router-sXMnYegW.mjs";
import { t as Textarea } from "./textarea-kko37XEX.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/edit._id-DTKyuxa7.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function EditCampaignPage() {
	const { id } = Route$10.useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { overview, refreshOverview } = useRole();
	const editFn = useServerFn(editCampaign);
	const getCampaign = useServerFn(getCampaignForEdit);
	const categoriesFn = useServerFn(listCategories);
	const campaign = useQuery({
		queryKey: ["campaign-edit", id],
		queryFn: () => getCampaign({ data: { campaignId: id } })
	});
	const categories = useQuery({
		queryKey: ["marketplace-categories"],
		queryFn: () => categoriesFn({})
	});
	const [title, setTitle] = (0, import_react.useState)("");
	const [description, setDescription] = (0, import_react.useState)("");
	const [proofDescription, setProofDescription] = (0, import_react.useState)("");
	const [proofMode, setProofMode] = (0, import_react.useState)(null);
	const [proofMinImages, setProofMinImages] = (0, import_react.useState)(1);
	const [proofMaxImages, setProofMaxImages] = (0, import_react.useState)(3);
	const [proofFields, setProofFields] = (0, import_react.useState)([]);
	const [reward, setReward] = (0, import_react.useState)("0.50");
	const [slots, setSlots] = (0, import_react.useState)("50");
	const [categoryId, setCategoryId] = (0, import_react.useState)("");
	const [subcategoryId, setSubcategoryId] = (0, import_react.useState)("");
	const [landingUrl, setLandingUrl] = (0, import_react.useState)("");
	const [estimatedMinutes, setEstimatedMinutes] = (0, import_react.useState)("");
	const [proofExampleUrl, setProofExampleUrl] = (0, import_react.useState)("");
	const [trackingUrl, setTrackingUrl] = (0, import_react.useState)("");
	const [eligibilityNote, setEligibilityNote] = (0, import_react.useState)("");
	const [dailyLimit, setDailyLimit] = (0, import_react.useState)("");
	const [reviewWindow, setReviewWindow] = (0, import_react.useState)(24);
	const [devices, setDevices] = (0, import_react.useState)([]);
	const [allDevices, setAllDevices] = (0, import_react.useState)(false);
	const [resubmit, setResubmit] = (0, import_react.useState)(false);
	const [isAdmin, setIsAdmin] = (0, import_react.useState)(false);
	const [minSlots, setMinSlots] = (0, import_react.useState)(15);
	const isDraft = campaign.data?.status === "draft";
	const isRejected = campaign.data?.status === "rejected";
	const isPaused = campaign.data?.status === "paused";
	const canEdit = isDraft || isRejected || isPaused;
	(0, import_react.useEffect)(() => {
		if (campaign.data) {
			const c = campaign.data;
			setTitle(c.name || "");
			setDescription(c.description || "");
			setProofDescription(c.proofDescription || "");
			setProofMinImages(c.proofMinImages || 1);
			setProofMaxImages(c.proofMaxImages || 3);
			setProofFields(c.proofFields || []);
			if (c.proofMode) setProofMode(c.proofMode);
			else {
				const minImg = c.proofMinImages || 1;
				const hasFields = (c.proofFields || []).length > 0;
				const hasRequiredFields = (c.proofFields || []).some((f) => f.required);
				if (minImg >= 1 && !hasRequiredFields) setProofMode("screenshot");
				else if (minImg === 0 && hasFields) setProofMode("text");
				else if (minImg >= 1 && hasRequiredFields) setProofMode("both");
				else setProofMode("screenshot");
			}
			setReward(c.publisherReward?.toString() || "0.50");
			setSlots(c.maxCompletions?.toString() || "50");
			setCategoryId(c.categoryId || "");
			setSubcategoryId(c.subcategoryId || "");
			setLandingUrl(c.landingUrl || "");
			setEstimatedMinutes(c.estimatedMinutes?.toString() || "");
			setProofExampleUrl(c.proofExampleUrl || "");
			setTrackingUrl(c.trackingUrl || "");
			setEligibilityNote(c.eligibilityNotes || "");
			setDailyLimit(c.dailyLimit?.toString() || "");
			setReviewWindow(c.reviewWindowHours || 24);
			const campaignDevices = c.devices || [];
			if (campaignDevices.length === 0) {
				setDevices([
					"android",
					"ios",
					"desktop"
				]);
				setAllDevices(true);
			} else {
				setDevices(campaignDevices);
				setAllDevices(campaignDevices.length === 3);
			}
		}
	}, [campaign.data]);
	(0, import_react.useEffect)(() => {
		async function checkAdminAndMinSlots() {
			if (!overview?.account?.userId || !campaign.data) return;
			const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", overview.account.userId).eq("role", "admin").maybeSingle();
			setIsAdmin(!!roleData);
			const { data: minSlotsData } = await supabase.rpc("mkt_campaign_slot_usage", { p_campaign_id: campaign.data.id });
			setMinSlots(Math.max(15, minSlotsData || 15));
		}
		checkAdminAndMinSlots();
	}, [campaign.data, overview?.account?.userId]);
	const selectedCategory = (0, import_react.useMemo)(() => categories.data?.find((c) => c.id === categoryId), [categories.data, categoryId]);
	const generateFieldKey = (label) => {
		return label.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "_").substring(0, 50);
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
			const updates = { campaignId: id };
			const normalize = (val) => val === null || val === void 0 || val === "" ? null : val;
			const changed = (newVal, oldVal) => normalize(newVal) !== normalize(oldVal);
			if (changed(title, campaign.data?.name)) updates.title = title.trim();
			if (changed(description, campaign.data?.description)) updates.description = description.trim();
			if (changed(landingUrl, campaign.data?.landingUrl)) updates.landingUrl = landingUrl.trim();
			const estMin = estimatedMinutes ? Number(estimatedMinutes) : null;
			if (changed(estMin, campaign.data?.estimatedMinutes)) updates.estimatedMinutes = estMin;
			if (changed(proofDescription, campaign.data?.proofDescription)) updates.proofDescription = proofDescription.trim();
			if (proofMode !== campaign.data?.proofMode) updates.proofMode = proofMode;
			if (proofMinImages !== campaign.data?.proofMinImages) updates.proofMinImages = proofMinImages;
			if (proofMaxImages !== campaign.data?.proofMaxImages) updates.proofMaxImages = proofMaxImages;
			if (JSON.stringify(proofFields) !== JSON.stringify(campaign.data?.proofFields || [])) updates.proofFields = proofFields;
			if (changed(proofExampleUrl, campaign.data?.proofExampleUrl)) updates.proofExampleUrl = proofExampleUrl || null;
			if (changed(trackingUrl, campaign.data?.trackingUrl)) updates.trackingUrl = trackingUrl.trim() || null;
			if (changed(eligibilityNote, campaign.data?.eligibilityNotes)) updates.eligibilityNote = eligibilityNote.trim() || null;
			const dayLim = dailyLimit ? Number(dailyLimit) : null;
			if (changed(dayLim, campaign.data?.dailyLimit)) updates.dailyLimit = dayLim;
			if (reviewWindow !== campaign.data?.reviewWindowHours) updates.reviewWindow = reviewWindow;
			const campaignDevices = campaign.data?.devices || [];
			const normalizedCampaignDevices = campaignDevices.length === 0 ? [
				"android",
				"ios",
				"desktop"
			] : campaignDevices;
			const normalizedCurrentDevices = devices.length === 3 ? [] : devices;
			const normalizedOriginalDevices = normalizedCampaignDevices.length === 3 ? [] : normalizedCampaignDevices;
			if (JSON.stringify(normalizedCurrentDevices.sort()) !== JSON.stringify(normalizedOriginalDevices.sort())) updates.devices = normalizedCurrentDevices;
			if (isDraft) {
				const rewardNum = Number(reward);
				const slotsNum = Number(slots);
				if (rewardNum !== campaign.data?.publisherReward) updates.reward = rewardNum;
				if (slotsNum !== campaign.data?.maxCompletions) updates.slots = slotsNum;
			}
			updates.resubmit = resubmit;
			return editFn({ data: updates });
		},
		onSuccess: async () => {
			await Promise.all([
				refreshOverview(),
				queryClient.invalidateQueries({ queryKey: ["my-campaigns"] }),
				queryClient.invalidateQueries({ queryKey: ["campaign-edit", id] })
			]);
			toast.success(resubmit ? "Campaign updated and submitted for review" : "Campaign updated");
			navigate({ to: "/advertiser/campaigns" });
		},
		onError: (err) => {
			const msg = err instanceof Error ? err.message.replace(/^[A-Z_]+: /, "") : "Something went wrong";
			toast.error("Couldn't update campaign", { description: msg });
		}
	});
	if (campaign.isPending || categories.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		subtitle: "Advertiser",
		mainClass: "page-fade-in",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BackLink, {
				to: "/advertiser/campaigns",
				label: "Back to campaigns"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				size: "page",
				icon: SquarePen,
				iconSrc: "/icons/icon-create-campaign-v2.webp",
				title: "Edit Campaign",
				subtitle: "Loading...",
				className: "mb-2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card mt-3 space-y-4 p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-12 w-full" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-32 w-full" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-12 w-full" })
				]
			})
		]
	});
	if (campaign.isError || !campaign.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		subtitle: "Advertiser",
		mainClass: "page-fade-in",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BackLink, {
			to: "/advertiser/campaigns",
			label: "Back to campaigns"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "surface-card mt-3 p-4 text-center text-destructive",
			children: "Campaign not found or you don't have permission to edit it."
		})]
	});
	if (!canEdit) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		subtitle: "Advertiser",
		mainClass: "page-fade-in",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BackLink, {
			to: "/advertiser/campaigns",
			label: "Back to campaigns"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "surface-card mt-3 p-4 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-semibold",
					children: "Cannot edit this campaign"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "Only draft, rejected, or paused campaigns can be edited."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm",
					children: ["Status: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-medium",
						children: campaign.data.status
					})]
				})
			]
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		subtitle: "Advertiser",
		mainClass: "page-fade-in",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BackLink, {
				to: "/advertiser/campaigns",
				label: "Back to campaigns"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				size: "page",
				icon: SquarePen,
				iconSrc: "/icons/icon-create-campaign-v2.webp",
				title: "Edit Campaign",
				subtitle: isDraft ? "Edit any field, including slots and reward." : isRejected ? "Make changes and resubmit for review." : "Edit content fields only. Pause to edit slots/reward requires draft status.",
				className: "mb-2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "surface-card mt-3 space-y-4 p-4",
				onSubmit: (e) => {
					e.preventDefault();
					if (!landingUrl.trim()) {
						toast.error("Enter a destination URL");
						return;
					}
					if (campaign.data?.verificationMode === "auto" && !trackingUrl.trim()) {
						toast.error("Enter tracking URL for auto verification");
						return;
					}
					if (campaign.data?.verificationMode === "proof") {
						if (!proofDescription.trim() || proofDescription.length < 10) {
							toast.error("Proof instructions required (at least 10 characters)");
							return;
						}
						if (devices.length === 0) {
							toast.error("Select at least one device");
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
								children: "Category (read-only)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex h-11 items-center rounded-xl border border-border bg-muted px-3 text-sm text-muted-foreground",
								children: selectedCategory?.name || "—"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "c-subcategory",
								children: "Subcategory (read-only)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex h-11 items-center rounded-xl border border-border bg-muted px-3 text-sm text-muted-foreground",
								children: subcategoryId ? selectedCategory?.subcategories?.find((s) => s.id === subcategoryId)?.name || "—" : "None"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "c-landing-url",
							children: "Destination URL"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "c-landing-url",
							type: "url",
							maxLength: 2048,
							placeholder: "https://example.com/campaign-page",
							value: landingUrl,
							onChange: (e) => setLandingUrl(e.target.value),
							required: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "c-estimated-minutes",
							children: "Estimated time (optional)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "c-estimated-minutes",
							type: "number",
							min: 1,
							max: 1440,
							placeholder: "e.g. 10",
							value: estimatedMinutes,
							onChange: (e) => setEstimatedMinutes(e.target.value)
						})]
					}),
					isDraft && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3 rounded-xl border border-gold/40 bg-gold/10 p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold text-gold-dark",
							children: "⚠️ Slots and reward can only be edited in draft status"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "c-reward",
									children: "Reward per completion ($)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "c-reward",
									type: "number",
									step: "0.01",
									min: .05,
									max: 1e3,
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
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "c-slots",
										type: "number",
										min: isAdmin ? minSlots : campaign.data.maxCompletions,
										max: 1e5,
										value: slots,
										onChange: (e) => setSlots(e.target.value),
										required: true
									}),
									isAdmin && minSlots > 15 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-[11px] text-muted-foreground",
										children: [
											"Minimum ",
											minSlots,
											" slots (campaign has ",
											minSlots,
											" already consumed or reserved)"
										]
									}),
									!isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-muted-foreground",
										children: "You can only increase slots. Admins can decrease their own campaigns."
									})
								]
							})]
						})]
					}),
					!isDraft && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-border bg-muted/30 p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted-foreground",
							children: [
								"Reward: ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-medium",
									children: ["$", campaign.data.publisherReward]
								}),
								" • Slots: ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: campaign.data.maxCompletions
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs text-muted-foreground",
							children: [
								"Slots and reward cannot be changed in ",
								campaign.data.status,
								" status."
							]
						})]
					}),
					campaign.data?.verificationMode === "proof" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3 rounded-xl border border-gold/40 bg-gold/10 p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "c-proof-instructions",
									children: "Instructions for proof *"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									id: "c-proof-instructions",
									rows: 2,
									minLength: 10,
									maxLength: 500,
									placeholder: "e.g. Upload a screenshot showing the app installed",
									value: proofDescription,
									onChange: (e) => setProofDescription(e.target.value),
									required: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "c-proof-min-images",
										children: "Min images"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "c-proof-min-images",
										type: "number",
										min: 0,
										max: 5,
										value: proofMinImages,
										onChange: (e) => setProofMinImages(Number(e.target.value))
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
										onChange: (e) => setProofMaxImages(Number(e.target.value))
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
								}), proofFields.map((field, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
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
													onChange: (e) => updateProofField(index, { maxLen: Number(e.target.value) })
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
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
										})]
									})
								}, index))]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "c-review-window",
										children: "Review within *"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										id: "c-review-window",
										className: "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm",
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
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
							})
						]
					}),
					(isDraft || isRejected) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							id: "resubmit",
							checked: resubmit,
							onChange: (e) => setResubmit(e.target.checked),
							className: "size-4"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "resubmit",
							className: "text-sm",
							children: "Submit for review after saving changes"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							onClick: () => navigate({ to: "/advertiser/campaigns" }),
							disabled: mutation.isPending,
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "submit",
							variant: "jade",
							className: "flex-1",
							disabled: mutation.isPending,
							children: [mutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : null, resubmit ? "Save & Submit" : "Save Changes"]
						})]
					})
				]
			})
		]
	});
}
//#endregion
export { EditCampaignPage as component };
