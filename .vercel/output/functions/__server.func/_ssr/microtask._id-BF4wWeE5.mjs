import { i as __toESM } from "../_runtime.mjs";
import { o as formatMoney } from "./referral-progress-DmJLJmiB.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { C as useNavigate, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { ft as ImagePlus, gt as Globe, lt as Info, n as X, qt as Camera, w as Smartphone } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as VerificationBadge, t as BackLink } from "./Preview-MVZOUW8x.mjs";
import { t as Skeleton } from "./skeleton-D9W9wFsj.mjs";
import { n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { D as Input, E as Label, M as SectionHeading, Ot as Button, Ut as listActiveCampaigns, Zt as recordClick, d as AppShell, nn as submitProofForCampaign, nr as useServerFn, s as Route$17, tr as useAuth } from "./router-sXMnYegW.mjs";
import { t as Textarea } from "./textarea-kko37XEX.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/microtask._id-BF4wWeE5.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function renderTextWithLinks(text) {
	const urlRegex = /(https?:\/\/[^\s]+)/g;
	return text.split(urlRegex).map((part, i) => {
		if (part.match(urlRegex)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
			href: part,
			target: "_blank",
			rel: "noopener noreferrer nofollow",
			className: "text-primary underline hover:text-primary/80",
			children: part
		}, i);
		return part;
	});
}
function MicrotaskDetailPage() {
	const { id } = Route$17.useParams();
	const { session } = useAuth();
	const navigate = useNavigate();
	const fetchCampaigns = useServerFn(listActiveCampaigns);
	const clickFn = useServerFn(recordClick);
	const submitProofFn = useServerFn(submitProofForCampaign);
	const campaigns = useQuery({
		queryKey: ["active-campaigns", session?.user.id],
		queryFn: () => fetchCampaigns({}),
		enabled: Boolean(session)
	});
	const [redirectUrl, setRedirectUrl] = (0, import_react.useState)(null);
	const popupRef = (0, import_react.useRef)(null);
	const [files, setFiles] = (0, import_react.useState)([]);
	const [preview, setPreview] = (0, import_react.useState)(null);
	const [notes, setNotes] = (0, import_react.useState)("");
	const [fieldValues, setFieldValues] = (0, import_react.useState)({});
	const [errorMessage, setErrorMessage] = (0, import_react.useState)(null);
	const fileToBase64 = (file) => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => {
				const base64 = reader.result.split(",")[1];
				resolve(base64);
			};
			reader.onerror = (error) => reject(error);
		});
	};
	const clickMutation = useMutation({
		mutationFn: () => clickFn({ data: {
			campaignId: id,
			userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null
		} }),
		onSuccess: (result) => {
			setRedirectUrl(result.redirectUrl ?? null);
			if (result.redirectUrl) {
				if (popupRef.current && !popupRef.current.closed) popupRef.current.location.href = result.redirectUrl;
				else window.location.href = result.redirectUrl;
				toast.success("Offer opened. Complete it to earn your reward.");
			} else toast.success("Task started! Complete it and your reward will be credited automatically.");
		},
		onError: (err) => {
			popupRef.current?.close();
			popupRef.current = null;
			const msg = err instanceof Error ? err.message : "Something went wrong";
			const detail = msg.match(/detail[=: ]+([a-z_]+)/i)?.[1]?.toLowerCase();
			const description = msg.includes("MKT_NOT_AVAILABLE") ? "This campaign is no longer available." : msg.includes("MKT_NOT_ELIGIBLE") && detail === "country" ? "This campaign is not available in your country." : msg.includes("MKT_NOT_ELIGIBLE") && detail === "device" ? "This campaign does not support your device." : msg.includes("MKT_NOT_ELIGIBLE") && detail === "age" ? "You are not eligible for this campaign's age requirements." : msg.includes("MKT_NOT_ELIGIBLE") && detail === "linked" ? "You are not eligible for this campaign because of an account link." : msg.includes("MKT_NO_SLOTS") ? "This task is full. All slots have been taken." : msg.includes("MKT_ALREADY_DONE") ? "You already completed this task." : "We couldn't start this task. Please try again.";
			toast.error("Couldn't start task", { description });
		}
	});
	const proofMutation = useMutation({
		mutationFn: async () => {
			if (!session?.user.id) throw new Error("Please sign in to submit proof.");
			if (!campaigns.data?.find((campaign) => campaign.id === id)) throw new Error("Task not found.");
			const filesData = await Promise.all(files.map(async (file) => ({
				name: file.name,
				type: file.type,
				base64: await fileToBase64(file)
			})));
			return submitProofFn({ data: {
				campaignId: id,
				files: filesData,
				fieldValues,
				userNote: notes
			} });
		},
		onSuccess: () => {
			toast.success("Proof submitted! We'll review it soon.");
			navigate({ to: "/my-submissions" });
		},
		onError: (err) => {
			const msg = err instanceof Error ? err.message : "Could not submit proof";
			const detail = (msg.match(/DETAIL:\s*(.+?)(?:\n|$)/i) || msg.match(/detail[=: ]+(.+?)(?:\n|$)/i))?.[1]?.trim();
			const description = msg.includes("MKT_NO_SLOTS") ? "This task is full. All slots have been taken." : msg.includes("MKT_ALREADY_DONE") ? "You already completed this task." : msg.includes("MKT_NOT_ELIGIBLE") && detail?.toLowerCase() === "country" ? "This campaign is not available in your country." : msg.includes("MKT_NOT_ELIGIBLE") && detail?.toLowerCase() === "device" ? "This campaign does not support your device." : msg.includes("MKT_NOT_ELIGIBLE") && detail?.toLowerCase() === "age" ? "You are not eligible for this campaign's age requirements." : msg.includes("MKT_NOT_ELIGIBLE") && detail?.toLowerCase() === "linked" ? "You are not eligible because of an account link." : msg.includes("MKT_NOT_AVAILABLE") ? "This campaign is no longer available." : msg.includes("MKT_INVALID_PROOF") && detail ? detail : msg.includes("MKT_INVALID_PROOF") ? msg.replace(/^[A-Z_]+: /, "") : msg;
			setErrorMessage(description);
			toast.error("Couldn't submit proof", { description });
		}
	});
	const c = campaigns.data?.find((campaign) => campaign.id === id);
	if (campaigns.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		subtitle: "Tasks",
		mainClass: "page-fade-in",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BackLink, {
				to: "/task",
				label: "Back to Microtasks"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-3 h-48 rounded-3xl" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-3 h-32 rounded-2xl" })
		]
	});
	if (!c) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		subtitle: "Tasks",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BackLink, {
			to: "/task",
			label: "Back to Microtasks"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-8 text-center text-sm text-muted-foreground",
			children: "That task isn't available."
		})]
	});
	const proof = c.verification === "proof";
	const countryFlag = c.countries.length === 0 ? "🌍" : "🇺🇸";
	const countryLabel = c.countries.length === 0 ? "Worldwide" : c.countries.join(", ");
	const proofMode = c.proofMode || null;
	const proofFields = c.proofFields ?? [];
	const minImages = c.proofMinImages ?? 1;
	const maxImages = c.proofMaxImages ?? 3;
	let derivedMode = proofMode;
	if (!derivedMode && proof) {
		const hasRequiredFields = proofFields.some((f) => f.required);
		if (minImages >= 1 && !hasRequiredFields) derivedMode = "screenshot";
		else if (minImages === 0 && proofFields.length > 0) derivedMode = "text";
		else derivedMode = "both";
	}
	const showImages = proof && derivedMode !== "text";
	const showFields = proof && derivedMode !== "screenshot";
	const handleProofSubmit = (e) => {
		e.preventDefault();
		setErrorMessage(null);
		const hasImages = files.length > 0;
		const hasFieldValues = proofFields.some((field) => fieldValues[field.key]?.trim());
		if (derivedMode === "either") {
			if (!hasImages && !hasFieldValues) {
				setErrorMessage("Please provide either a screenshot or fill in the details below.");
				return;
			}
		} else if (derivedMode === "both") {
			if (files.length < minImages) {
				setErrorMessage(`Please upload at least ${minImages} image${minImages === 1 ? "" : "s"}.`);
				return;
			}
			for (const field of proofFields) if (field.required && !fieldValues[field.key]?.trim()) {
				setErrorMessage(`${field.label} is required.`);
				return;
			}
		} else if (derivedMode === "screenshot") {
			if (files.length < minImages) {
				setErrorMessage(`Please upload at least ${minImages} image${minImages === 1 ? "" : "s"}.`);
				return;
			}
		} else if (derivedMode === "text") {
			for (const field of proofFields) if (field.required && !fieldValues[field.key]?.trim()) {
				setErrorMessage(`${field.label} is required.`);
				return;
			}
		}
		if (files.length > maxImages) {
			setErrorMessage(`Maximum ${maxImages} images allowed.`);
			return;
		}
		for (const field of proofFields) if ((fieldValues[field.key] || "").length > field.maxLen) {
			setErrorMessage(`${field.label} must be ${field.maxLen} characters or less.`);
			return;
		}
		proofMutation.mutate();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		subtitle: "Tasks",
		mainClass: "page-fade-in",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BackLink, {
				to: "/task",
				label: "Back to Microtasks"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "premium-step-in mt-3 rounded-3xl bg-jade-gradient p-5 text-primary-foreground shadow-lift",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VerificationBadge, {
						verification: c.verification,
						size: "md"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-3 text-xl leading-tight",
						children: c.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-amount mt-2 text-3xl leading-none text-gold",
						children: formatMoney(c.reward)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid grid-cols-2 gap-2 text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "inline-flex items-center gap-1.5 rounded-xl bg-primary-foreground/10 px-3 py-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "size-3.5" }),
								" ",
								countryFlag,
								" ",
								countryLabel
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "inline-flex items-center gap-1.5 rounded-xl bg-primary-foreground/10 px-3 py-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { className: "size-3.5" }),
								" ",
								proof ? "Mobile" : "Any device"
							]
						})]
					}),
					c.slotsLeft !== null && c.slotsLeft > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-xs opacity-90",
						children: [
							c.slotsLeft,
							" slot",
							c.slotsLeft === 1 ? "" : "s",
							" left"
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
				variant: "ribbon",
				icon: Info,
				iconSrc: "/icons/icon-document-info.webp",
				title: "About This Task"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "surface-card p-4 text-sm leading-relaxed text-foreground whitespace-pre-line",
				children: renderTextWithLinks(c.description)
			}),
			proof ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
					variant: "ribbon",
					icon: Camera,
					iconSrc: "/icons/icon-cloud-upload.webp",
					title: "Submit Your Proof"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "surface-card space-y-4 p-4",
					onSubmit: handleProofSubmit,
					children: [
						c.proofDescription && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-sm font-semibold",
								children: "What to submit"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-primary whitespace-pre-line",
								children: renderTextWithLinks(c.proofDescription)
							})]
						}),
						derivedMode === "either" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-gold/30 bg-gold/10 p-3 text-sm text-gold-dark",
							children: [
								"Upload a screenshot ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "OR" }),
								" fill the details below. One of them is enough."
							]
						}),
						c.proofExampleUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-xs text-muted-foreground",
								children: "Example of a good proof:"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "overflow-hidden rounded-xl border border-border",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: c.proofExampleUrl,
									alt: "Proof example",
									className: "w-full object-contain bg-background-alt"
								})
							})]
						}),
						showImages && maxImages > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
									htmlFor: "proof-file",
									children: [
										derivedMode === "either" ? "Option 1: Screenshot" : "Screenshot",
										minImages > 1 ? "s" : "",
										" ",
										derivedMode === "either" ? "" : minImages > 0 && `(${minImages}-${maxImages} required)`
									]
								}),
								preview ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative overflow-hidden rounded-2xl border border-border",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: preview,
											alt: "Proof preview",
											className: "max-h-72 w-full object-contain bg-background-alt"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											"aria-label": "Remove screenshot",
											className: "absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-card shadow-soft",
											onClick: () => {
												setPreview(null);
												setFiles([]);
											},
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
										}),
										files.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "absolute bottom-2 right-2 rounded-full bg-card px-2 py-1 text-xs font-semibold",
											children: [
												"+",
												files.length - 1,
												" more"
											]
										})
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									htmlFor: "proof-file",
									"data-testid": "proof-upload",
									className: "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border bg-background-alt px-4 py-8 text-center",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "size-7 text-primary" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-sm font-semibold",
											children: ["Tap to add screenshot", maxImages > 1 ? "s" : ""]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-xs text-muted-foreground",
											children: [
												"PNG, JPG or WebP · up to ",
												maxImages,
												" images, 5 MB each"
											]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									id: "proof-file",
									type: "file",
									accept: "image/jpeg,image/png,image/webp",
									multiple: maxImages > 1,
									className: "sr-only",
									onChange: (e) => {
										const selected = Array.from(e.target.files ?? []);
										const maxSize = 5242880;
										const valid = selected.filter((file) => {
											const validType = [
												"image/jpeg",
												"image/png",
												"image/webp"
											].includes(file.type);
											const validSize = file.size <= maxSize;
											if (!validType) {
												setErrorMessage("Please upload only JPEG, PNG, or WebP images.");
												return false;
											}
											if (!validSize) {
												setErrorMessage(`Each image must be 5 MB or smaller. "${file.name}" is ${(file.size / 1048576).toFixed(1)} MB.`);
												return false;
											}
											return true;
										}).slice(0, maxImages);
										if (valid.length === 0) return;
										if (selected.length > maxImages) setErrorMessage(`Maximum ${maxImages} images allowed.`);
										setFiles(valid);
										setPreview(valid[0] ? URL.createObjectURL(valid[0]) : null);
										if (valid.length > 0) setErrorMessage(null);
									}
								})
							]
						}),
						showFields && proofFields.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [derivedMode === "either" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-sm font-medium",
								children: "Option 2: Fill in the details"
							}), proofFields.map((field) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
										htmlFor: `field-${field.key}`,
										children: [
											field.label,
											" ",
											derivedMode !== "either" && field.required && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-destructive",
												children: "*"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: `field-${field.key}`,
										maxLength: field.maxLen,
										placeholder: field.label,
										value: fieldValues[field.key] || "",
										onChange: (e) => setFieldValues({
											...fieldValues,
											[field.key]: e.target.value
										}),
										required: field.required
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-[11px] text-muted-foreground",
										children: [
											"Max ",
											field.maxLen,
											" characters"
										]
									})
								]
							}, field.key))]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "proof-notes",
								children: "Notes (optional)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								id: "proof-notes",
								rows: 3,
								maxLength: 500,
								placeholder: "Anything the reviewer should know?",
								value: notes,
								onChange: (e) => setNotes(e.target.value)
							})]
						}),
						errorMessage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-destructive",
							children: errorMessage
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							variant: "gold",
							size: "lg",
							className: "w-full",
							disabled: proofMutation.isPending,
							"data-testid": "proof-submit",
							children: proofMutation.isPending ? "Submitting..." : "Submit proof"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-center text-muted-foreground",
							children: "Your reward is credited after approval, usually within 48 hours."
						})
					]
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "jade",
						size: "lg",
						className: "w-full",
						"data-testid": "start-task-btn",
						onClick: () => {
							popupRef.current = c.verification === "auto" ? window.open("about:blank", "_blank") : null;
							clickMutation.mutate();
						},
						disabled: clickMutation.isPending,
						children: clickMutation.isPending ? "Starting..." : "Start Task"
					}),
					redirectUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: redirectUrl,
						target: "_blank",
						rel: "noopener noreferrer",
						className: "mt-2 block text-center text-sm font-semibold text-primary underline",
						children: "Open offer"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-center text-xs text-muted-foreground",
						children: "Your reward is credited automatically after you finish."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-6 text-center text-[11px] text-muted-foreground",
				children: [
					"Have a submission that was rejected?",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/my-submissions",
						className: "font-semibold text-primary",
						children: "See My Submissions"
					})
				]
			})
		]
	});
}
//#endregion
export { MicrotaskDetailPage as component };
