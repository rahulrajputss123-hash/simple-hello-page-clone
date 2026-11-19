import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { C as useNavigate, T as useRouter, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { Et as ExternalLink, Y as MessageCircle, _t as Gift, d as Upload, lt as Info, n as X, nt as ListChecks, on as ArrowLeft, p as TriangleAlert, rn as ArrowUpRight } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Skeleton } from "./skeleton-D9W9wFsj.mjs";
import { i as createServerFn } from "./server-CpGMOUrW.mjs";
import { t as createSsrRpc } from "./createSsrRpc-Bbq2Yr9O.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Br_KWlRY.mjs";
import { l as stringType, s as objectType } from "../_libs/zod.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { H as formatReward, Ot as Button, Qn as submitOfferProof, St as startActiveTimeGrace, Xn as startOfferClaim, d as AppShell, k as useViewedOffer, nr as useServerFn, o as Route$16, tr as useAuth, vn as claimOffer } from "./router-sXMnYegW.mjs";
import { t as EmptyState } from "./States-Cg9ELwgo.mjs";
import { d as requestProofUploadUrl, m as trackOfferClick, s as getOfferById, u as offerDisplayBadge } from "./offers.functions-CQ4rFVpp.mjs";
import { t as REVTOO_USER_ID_PLACEHOLDER } from "./constants-r2wn2lLZ.mjs";
import { t as ErrorBoundary } from "./ErrorBoundary-_LI25I0d.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/offer._offerId-CbKJhIqd.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Torox per-user click URL generation.
* 
* Torox click URLs MUST be generated at click time per user and cannot be
* cached or reused. This server function:
* 1. Loads the offer from DB and verifies it's a Torox offer
* 2. Takes userId from authenticated session (never from client input)
* 3. Determines user's country from profile or falls back to feed default
* 4. Calls Torox click API with fresh credentials
* 5. Returns the validated tracking URL
*/
var getToroxClickUrlSchema = objectType({ offerId: stringType().uuid() });
var getToroxClickUrl = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => getToroxClickUrlSchema.parse(input)).handler(createSsrRpc("facbb8b312f11359eaeee6faa073c46f1c8b656b24082f024e37e4ccb8e90fd6"));
/**
* Client-side per-user tracking for offer click URLs.
*
* OGAds (`ogads`) click links are cached and shared across all users, so they
* don't carry a per-user subid. We append the internal user id as `aff_sub4`
* at click time.
*
* Affike (`affike`) returns no direct click URL at all — the redirect is built
* fresh per user from the offer's external id + user id (NOT by appending a
* param to an existing URL).
*
* AdswedMedia (`adswedmedia`) and Revtoo (`revtoo`) embed a literal placeholder
* string in every cached offer URL. We replace it with the real user id here
* via simple substring substitution.
*
* AdBlueMedia (`adbluemedia`) uses a global postback URL with s1 as the user
* identifier. We replace or append s1=userId in the click URL so postbacks
* can credit the correct user.
*
* Torox (`torox`) click URLs must be generated per-user at click time via the
* Torox Partner API. The cached offer stores a sentinel `torox://campaign/{id}`.
* This is handled by getToroxClickUrl server function in useOfferActions, NOT here.
*
* Other providers' URLs are returned unchanged.
*/
function appendAffSub4(url, providerSlug, userId, externalOfferId) {
	if (userId?.startsWith("q_")) {
		console.error(`[click-url] Quest token blocked in normal offer click: ${userId.slice(0, 10)}...`);
		return null;
	}
	if (providerSlug === "torox") {
		if (url?.startsWith("torox://campaign/")) return null;
		return url ?? null;
	}
	if (providerSlug === "affike") {
		if (!userId || !externalOfferId) return null;
		return `https://affike.com/track/click?offer_id=${encodeURIComponent(externalOfferId)}&click_id=${encodeURIComponent(userId)}`;
	}
	if (providerSlug === "adbluemedia") {
		if (!url) return null;
		if (!userId) return url;
		try {
			const parsed = new URL(url);
			parsed.searchParams.set("s1", userId);
			return parsed.toString();
		} catch {
			return `${url}${url.includes("?") ? "&" : "?"}s1=${encodeURIComponent(userId)}`;
		}
	}
	if (providerSlug === "adswedmedia") {
		if (!url) return null;
		if (!userId) return url;
		return url.split("USER_ID_HERE").join(userId);
	}
	if (providerSlug === "revtoo") {
		if (!url) return null;
		if (!userId) return url;
		return url.split(REVTOO_USER_ID_PLACEHOLDER).join(userId);
	}
	if (!url) return null;
	if (providerSlug !== "ogads" || !userId) return url;
	try {
		const parsed = new URL(url);
		parsed.searchParams.set("aff_sub4", userId);
		return parsed.toString();
	} catch {
		return `${url}${url.includes("?") ? "&" : "?"}aff_sub4=${encodeURIComponent(userId)}`;
	}
}
function useOfferActions(onSuccess, activeTimeQuestKey) {
	const queryClient = useQueryClient();
	const { session } = useAuth();
	const claim = useServerFn(claimOffer);
	const startClaim = useServerFn(startOfferClaim);
	const submitProof = useServerFn(submitOfferProof);
	const trackClick = useServerFn(trackOfferClick);
	const getToroxUrl = useServerFn(getToroxClickUrl);
	const startGrace = useServerFn(startActiveTimeGrace);
	const startMutation = useMutation({
		mutationFn: async (offer) => {
			const result = await startClaim({ data: { offerId: offer.id } });
			offer.id, offer.provider_slug, offer.payout_mode;
			if (activeTimeQuestKey) startGrace({ data: {
				questKey: activeTimeQuestKey,
				offerId: offer.id
			} }).catch((err) => {
				console.warn("[active-time] Failed to start grace period:", err);
			});
			return {
				result,
				offer
			};
		},
		onSuccess: async ({ offer }) => {
			if (offer.provider_slug === "torox" && offer.click_url?.startsWith("torox://campaign/")) {
				const blankTab = window.open("about:blank", "_blank", "noopener,noreferrer");
				try {
					trackClick({ data: { offerId: offer.id } }).catch(() => {});
					const { clickUrl } = await getToroxUrl({ data: { offerId: offer.id } });
					if (blankTab && clickUrl) blankTab.location.href = clickUrl;
					else {
						blankTab?.close();
						throw new Error("Could not generate tracking link.");
					}
				} catch (err) {
					blankTab?.close();
					toast.error(err instanceof Error ? err.message : "Could not open offer link.");
				}
			} else if (offer.click_url) {
				trackClick({ data: { offerId: offer.id } }).catch(() => {});
				const clickUrl = appendAffSub4(offer.click_url, offer.provider_slug, session?.user.id, offer.external_offer_id);
				if (clickUrl) window.open(clickUrl, "_blank", "noopener,noreferrer");
			}
			toast.success("Complete the offer, then come back here and upload your proof.");
			await queryClient.invalidateQueries({ queryKey: ["offer-claims"] });
			await queryClient.invalidateQueries({ queryKey: ["featured-feed"] });
			await queryClient.invalidateQueries({ queryKey: ["offer", offer.id] });
			onSuccess?.(offer.id, "start");
		},
		onError: (err) => toast.error(err.message || "Could not start offer. Try again.")
	});
	const submitProofMutation = useMutation({
		mutationFn: async (input) => {
			input.offerId;
			return submitProof({ data: input });
		},
		onSuccess: async (_result, input) => {
			input.offerId;
			toast.success("Submitted for review. We'll notify you once it's approved.");
			await queryClient.invalidateQueries({ queryKey: ["offer-claims"] });
			await queryClient.invalidateQueries({ queryKey: ["profile"] });
			await queryClient.invalidateQueries({ queryKey: ["featured-feed"] });
			await queryClient.invalidateQueries({ queryKey: ["offer", input.offerId] });
			onSuccess?.(input.offerId, "submit");
		},
		onError: (err) => {
			err.message.toLowerCase().includes("file") ? err.message.toLowerCase().includes("large") || err.message.toLowerCase().includes("type") || err.message.toLowerCase().includes("format") : err.message.toLowerCase().includes("network") || err.message.toLowerCase().includes("fetch");
			toast.error(err.message || "Could not submit proof. Try again.");
		}
	});
	const claimMutation = useMutation({
		mutationFn: async (input) => {
			if (input.hasClickUrl) input.offerId, input.provider_slug;
			if (input.hasClickUrl) {
				trackClick({ data: { offerId: input.offerId } }).catch(() => {});
				if (activeTimeQuestKey) startGrace({ data: {
					questKey: activeTimeQuestKey,
					offerId: input.offerId
				} }).catch((err) => {
					console.warn("[active-time] Failed to start grace period:", err);
				});
			}
			if (input.provider_slug === "torox" && input.clickUrl?.startsWith("torox://campaign/")) {
				const blankTab = window.open("about:blank", "_blank");
				if (!blankTab) {
					toast.error("Please allow pop-ups for this site to open the offer.");
					throw new Error("Pop-up blocked");
				}
				try {
					const { clickUrl } = await getToroxUrl({ data: { offerId: input.offerId } });
					if (!clickUrl) {
						blankTab.close();
						const errorMsg = "Could not generate tracking link.";
						toast.error(errorMsg);
						throw new Error(errorMsg);
					}
					blankTab.location.href = clickUrl;
					return {
						success: true,
						skipClaim: true
					};
				} catch (err) {
					blankTab.close();
					const errorMessage = err instanceof Error ? err.message : "Could not open offer link.";
					toast.error(errorMessage);
					console.error("[Torox] Failed to generate tracking link:", err);
					throw err;
				}
			} else if (input.clickUrl) {
				const clickUrl = appendAffSub4(input.clickUrl, input.provider_slug, session?.user.id, input.external_offer_id);
				if (clickUrl) window.open(clickUrl, "_blank", "noopener,noreferrer");
			}
			return claim({ data: {
				offerId: input.offerId,
				...input.proofUrl ? { proofUrl: input.proofUrl } : {}
			} });
		},
		onSuccess: async (result, input) => {
			if (result && typeof result === "object" && "skipClaim" in result && result.skipClaim) {
				await queryClient.invalidateQueries({ queryKey: ["offer-claims"] });
				await queryClient.invalidateQueries({ queryKey: ["featured-feed"] });
				await queryClient.invalidateQueries({ queryKey: ["offer", input.offerId] });
				onSuccess?.(input.offerId, "claim");
				return;
			}
			if (!input.hasClickUrl) toast.success("Submitted for review. We'll notify you once it's approved.");
			await queryClient.invalidateQueries({ queryKey: ["offer-claims"] });
			await queryClient.invalidateQueries({ queryKey: ["profile"] });
			await queryClient.invalidateQueries({ queryKey: ["featured-feed"] });
			await queryClient.invalidateQueries({ queryKey: ["offer", input.offerId] });
			onSuccess?.(input.offerId, "claim");
		},
		onError: (err) => toast.error(err.message || "Could not submit that claim. Try again.")
	});
	return {
		startClaim: startMutation,
		submitProof: submitProofMutation,
		claimOffer: claimMutation,
		isSubmitting: startMutation.isPending || submitProofMutation.isPending || claimMutation.isPending
	};
}
/**
* Offer details view supporting 3 types:
* 1. AUTO (auto_postback + URL): open URL, auto-credited
* 2. URL + PROOF (manual_proof + URL): start -> open URL -> upload proof -> submit
* 3. TASK WITHOUT URL (manual_proof, no URL): upload proof -> submit
*/
var DEFAULT_NOT_ALLOWED = "No VPN, no multiple accounts, no fake data, no emulators. Violations forfeit rewards and may lead to account bans.";
var MAX_PROOF_BYTES = 5242880;
/**
* Format step reward: 2 decimals normally, 3 decimals if under $0.01
*/
function formatStepReward(usd) {
	if (usd < .01) return `$${usd.toFixed(3)}`;
	return `$${usd.toFixed(2)}`;
}
/**
* Split a long step text into multiple numbered parts if it contains patterns like:
* "1. ... 2. ..." or "... → ..."
* Returns array of split parts, or original single item if no split pattern found.
*/
function splitStepText(label) {
	const parts = label.replace(/([a-z]),\s*(\d+\.)/gi, "$1. $2").split(/(?=\d+\.\s)|→/).map((s) => s.trim()).filter(Boolean);
	if (parts.length <= 1) return [label];
	return parts;
}
/**
* Normalize device for display: treat "desktop" as "web", capitalize first letter
*/
function displayDevice(device) {
	const normalized = device.toLowerCase() === "desktop" ? "web" : device.toLowerCase();
	return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
/**
* Get platform icon SVG for a device label
*/
function getPlatformIcon(device) {
	const lower = device.toLowerCase();
	if (lower === "android") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		className: "inline size-4 mr-1",
		viewBox: "0 0 24 24",
		fill: "currentColor",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24a11.5 11.5 0 0 0-8.94 0L5.65 5.67c-.19-.28-.54-.37-.83-.22-.3.16-.42.54-.26.85l1.84 3.18C4.3 11.36 2.84 14.4 3 17.5h18c.16-3.1-1.3-6.14-3.4-8.02M7.5 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2m9 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2" })
	});
	if (lower === "ios") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		className: "inline size-4 mr-1",
		viewBox: "0 0 24 24",
		fill: "currentColor",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01M12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25" })
	});
	if (lower === "web") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		className: "inline size-4 mr-1",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "12",
				cy: "12",
				r: "10"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M2 12h20" })
		]
	});
	return null;
}
function OfferDetailsView({ offer }) {
	const [brokenImages, setBrokenImages] = (0, import_react.useState)({});
	const [showAllSteps, setShowAllSteps] = (0, import_react.useState)(false);
	const showImage = Boolean(offer?.image_url) && !brokenImages[offer?.id ?? ""];
	const notAllowed = (offer?.not_allowed ?? "").trim() || DEFAULT_NOT_ALLOWED;
	const hasClickUrl = Boolean(offer?.click_url?.trim());
	const autoPostback = offer?.payout_mode === "auto_postback";
	const manualProof = offer?.payout_mode === "manual_proof";
	offer?.payout_mode;
	const isType2 = manualProof && hasClickUrl;
	const isType3 = manualProof && !hasClickUrl;
	const claimStatus = offer?.claim_status;
	const hasStarted = claimStatus === "started";
	const isPending = claimStatus === "pending";
	const isApproved = claimStatus === "approved";
	const isRejected = claimStatus === "rejected";
	const steps = offer?.steps ?? [];
	const hasSteps = steps.length > 0;
	const expandedSteps = hasSteps && steps.length === 1 ? splitStepText(steps[0].label).map((label, i) => ({
		label,
		usd: i === 0 ? steps[0].usd : 0
	})) : steps;
	const MAX_VISIBLE_STEPS = 8;
	const hasMoreSteps = expandedSteps.length > MAX_VISIBLE_STEPS;
	const visibleSteps = hasMoreSteps && !showAllSteps ? expandedSteps.slice(0, MAX_VISIBLE_STEPS) : expandedSteps;
	const devices = offer?.devices ?? [];
	const deviceLabels = devices.length === 0 ? ["All devices"] : devices.map(displayDevice);
	const showProofSection = isType2 && hasStarted || isType3 || offer?.is_limited_deal && !autoPostback;
	const [proofPath, setProofPath] = (0, import_react.useState)(null);
	const [proofName, setProofName] = (0, import_react.useState)(null);
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const inputRef = (0, import_react.useRef)(null);
	const requestUpload = useServerFn(requestProofUploadUrl);
	const trackClick = useServerFn(trackOfferClick);
	const navigate = useNavigate();
	const { setViewedOffer, requestAssistantOpen } = useViewedOffer();
	const { startClaim, submitProof, claimOffer, isSubmitting } = useOfferActions();
	(0, import_react.useEffect)(() => {
		if (offer) setViewedOffer({
			id: offer.id,
			title: offer.title
		});
	}, [offer, setViewedOffer]);
	(0, import_react.useEffect)(() => {
		if (offer && offer.claim_status && offer.claim_status !== "started") offer.id, offer.claim_status;
	}, [offer]);
	(0, import_react.useEffect)(() => {
		if (offer && showProofSection && !isPending && !isApproved) offer.id, offer.payout_mode;
	}, [
		offer,
		showProofSection,
		isPending,
		isApproved
	]);
	const reset = () => {
		setProofPath(null);
		setProofName(null);
		setUploading(false);
		if (inputRef.current) inputRef.current.value = "";
	};
	const handleFile = async (file) => {
		if (!offer) return;
		if (file.size > MAX_PROOF_BYTES) {
			toast.error("File must be under 5 MB.");
			return;
		}
		setUploading(true);
		try {
			const { path, uploadUrl, token } = await requestUpload({ data: {
				offerId: offer.id,
				filename: file.name.slice(0, 120)
			} });
			const putUrl = uploadUrl || `${path}?token=${encodeURIComponent(token)}`;
			const res = await fetch(putUrl, {
				method: "PUT",
				headers: {
					"Content-Type": file.type || "application/octet-stream",
					"cache-control": "max-age=31536000",
					...token ? {
						"x-upsert": "false",
						Authorization: `Bearer ${token}`
					} : {}
				},
				body: file
			});
			if (!res.ok) throw new Error(`Upload failed (${res.status})`);
			setProofPath(path);
			setProofName(file.name);
			toast.success("Proof uploaded.");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Upload failed.");
		} finally {
			setUploading(false);
		}
	};
	const handlePrimaryAction = () => {
		if (!offer) return;
		if (autoPostback) {
			if (offer.provider_slug === "torox" && offer.click_url?.startsWith("torox://campaign/")) claimOffer.mutate({
				offerId: offer.id,
				proofUrl: null,
				hasClickUrl,
				clickUrl: offer.click_url,
				provider_slug: offer.provider_slug,
				external_offer_id: offer.external_offer_id
			});
			else if (offer.click_url) {
				trackClick({ data: { offerId: offer.id } }).catch(() => {});
				window.open(offer.click_url, "_blank", "noopener,noreferrer");
			}
			return;
		}
		if (isType2 && !hasStarted && !isPending && !isApproved) {
			const actionData = {
				id: offer.id,
				click_url: offer.click_url,
				provider_slug: offer.provider_slug,
				external_offer_id: offer.external_offer_id,
				payout_mode: offer.payout_mode
			};
			startClaim.mutate(actionData);
			return;
		}
		if (isType2 && hasStarted && proofPath) {
			submitProof.mutate({
				offerId: offer.id,
				proofPath
			});
			return;
		}
		if (isType3 && proofPath) {
			submitProof.mutate({
				offerId: offer.id,
				proofPath
			});
			return;
		}
		claimOffer.mutate({
			offerId: offer.id,
			proofUrl: proofPath,
			hasClickUrl,
			clickUrl: offer.click_url,
			provider_slug: offer.provider_slug,
			external_offer_id: offer.external_offer_id
		});
	};
	const handleOpenOffer = () => {
		if (offer?.click_url) window.open(offer.click_url, "_blank", "noopener,noreferrer");
	};
	const canSubmitProof = Boolean(proofPath);
	const buttonDisabled = isSubmitting || !offer || showProofSection && !canSubmitProof || (autoPostback ? false : isPending) || isApproved;
	let buttonText = "I Understand, Continue";
	if (isSubmitting) buttonText = isType2 && hasStarted ? "Submitting…" : isType3 ? "Submitting…" : "Opening…";
	else if (autoPostback) buttonText = "Open Offer";
	else if (isType2 && hasStarted) buttonText = "Submit proof";
	else if (isType3) buttonText = "Submit for review";
	else if (isPending) buttonText = "Pending review";
	else if (isApproved) buttonText = "Approved";
	const showStatusBadge = hasStarted || isPending && !autoPostback || isApproved || isRejected;
	const statusText = hasStarted ? "In progress" : isPending ? "Pending review" : isApproved ? "Approved" : "Rejected";
	const statusColor = hasStarted ? "bg-primary/10 text-primary border-primary/30" : isPending ? "bg-amber-500/10 text-amber-600 border-amber-500/30" : isApproved ? "bg-jade/10 text-jade-dark border-jade/30" : "bg-destructive/10 text-destructive border-destructive/30";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col pb-28",
		"data-testid": "offer-details-page",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-background-alt",
					children: showImage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: offer.image_url,
						alt: "",
						"aria-hidden": true,
						loading: "lazy",
						decoding: "async",
						onError: () => setBrokenImages((b) => ({
							...b,
							[offer.id]: true
						})),
						className: "size-full object-cover",
						"data-testid": "offer-details-image"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gift, {
						className: "size-7 text-primary",
						"data-testid": "offer-details-icon"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-lg font-bold",
							"data-testid": "offer-details-title",
							children: offer?.title ?? "Offer"
						}),
						offer && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-amount text-base text-gold-dark",
							"data-testid": "offer-details-amount",
							children: offerDisplayBadge(offer) ?? formatReward(offer.reward_amount)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1.5 flex flex-wrap items-center gap-1.5",
							children: [
								offer?.provider_name && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary",
									"data-testid": "offer-details-provider",
									children: offer.provider_name
								}),
								offer?.category && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent-foreground",
									"data-testid": "offer-details-category",
									children: offer.category
								}),
								deviceLabels.map((device) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded-full border border-border bg-background-alt px-2 py-0.5 text-[10px] font-medium text-muted-foreground",
									"data-testid": "offer-details-device",
									children: device
								}, device))
							]
						}),
						offer?.is_limited_deal && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"data-testid": "offer-details-deal-badge",
							className: "mt-1.5 inline-flex items-center gap-1 rounded-full bg-gold-gradient px-2 py-0.5 text-[10px] font-bold uppercase text-gold-foreground shadow-gold",
							children: "Limited deal · one-time only"
						}),
						offer?.difficulty && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"data-testid": "offer-details-difficulty",
							className: "mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary",
							children: offer.difficulty
						}),
						showStatusBadge && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `mt-2 inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusColor}`,
							children: statusText
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [
					isPending && !autoPostback && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-primary",
						children: "We're reviewing your proof. You'll be notified once it's approved."
					}),
					isRejected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-xl border border-destructive/30 bg-destructive/5 p-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold text-destructive",
							children: "Claim rejected"
						}), offer?.claim_reject_reason && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-destructive/80",
							children: offer.claim_reject_reason
						})]
					}),
					offer?.description && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
							children: "About this offer"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm leading-relaxed",
							"data-testid": "offer-details-description",
							children: offer.description
						})]
					}),
					(offer?.provider_name || offer?.category || deviceLabels.length > 0 || offer?.difficulty) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-2 rounded-xl border border-border bg-background-alt p-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "mr-1 inline size-3.5" }), "Offer Details"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5 text-sm",
							children: [
								offer?.provider_name && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Network:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold",
										children: offer.provider_name
									})]
								}),
								offer?.category && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Category:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold",
										children: offer.category
									})]
								}),
								deviceLabels.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Devices:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold flex items-center gap-2",
										children: deviceLabels.map((device, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center",
											children: [
												i > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "mr-2",
													children: ","
												}),
												getPlatformIcon(device),
												device
											]
										}, device))
									})]
								}),
								offer?.difficulty && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Level:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold",
										children: offer.difficulty
									})]
								})
							]
						})]
					}),
					offer?.requirements && !hasSteps && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListChecks, { className: "mr-1 inline size-3.5" }), "How to complete"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "whitespace-pre-line text-sm leading-relaxed",
							"data-testid": "offer-details-requirements",
							children: offer.requirements
						})]
					}),
					hasSteps && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListChecks, { className: "mr-1 inline size-3.5" }), "How to complete"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-1.5",
								"data-testid": "offer-details-steps",
								children: visibleSteps.map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-2.5 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start gap-2.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary",
											children: index + 1
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "leading-relaxed",
											children: step.label
										})]
									}), step.usd > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "shrink-0 rounded-full bg-gold-gradient px-2 py-0.5 text-[11px] font-bold text-gold-foreground shadow-sm",
										children: formatStepReward(step.usd)
									})]
								}, index))
							}),
							hasMoreSteps && !showAllSteps && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setShowAllSteps(true),
								className: "w-full rounded-lg border border-primary/25 bg-primary/5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10",
								"data-testid": "offer-show-all-steps",
								children: [
									"Show all ",
									expandedSteps.length,
									" steps"
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-1 rounded-xl border border-destructive/30 bg-destructive/5 p-3",
						"data-testid": "offer-details-warning",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-destructive",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-3.5" }), "What NOT to do"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "whitespace-pre-line text-sm leading-relaxed text-destructive",
							children: notAllowed
						})]
					}),
					isType2 && hasStarted && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: handleOpenOffer,
						className: "flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/25 bg-primary/5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3.5" }), "Open offer again"]
					}),
					showProofSection && !isPending && !isApproved && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-primary",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-3.5" }), "Proof required"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									"Upload a screenshot (max 5 MB).",
									" ",
									!canSubmitProof && "Upload a screenshot to enable submit."
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: inputRef,
								type: "file",
								accept: "image/*,application/pdf",
								className: "hidden",
								"data-testid": "offer-proof-file-input",
								onChange: (e) => {
									const file = e.target.files?.[0];
									if (file) handleFile(file);
								}
							}),
							proofPath ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-2 text-xs",
								"data-testid": "offer-proof-uploaded",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "truncate",
									children: proofName
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "text-muted-foreground hover:text-destructive",
									onClick: reset,
									"aria-label": "Remove proof",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" })
								})]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								variant: "outline",
								size: "sm",
								className: "w-full",
								disabled: uploading,
								"data-testid": "offer-proof-upload-btn",
								onClick: () => inputRef.current?.click(),
								children: [uploading ? "Uploading…" : "Choose file", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "ml-1 size-3.5" })]
							})
						]
					}),
					autoPostback && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-primary",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "size-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Complete the offer on the partner page — your wallet will be credited automatically when the network confirms it. No manual submission needed." })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => {
							requestAssistantOpen();
							navigate({ to: "/support" });
						},
						"data-testid": "offer-details-ask-assistant",
						className: "flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/25 bg-primary/5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "size-3.5" }), "Ask the assistant about this offer"]
					}),
					(isPending || isApproved || isRejected) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/offers",
						className: "flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/25 bg-primary/5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10",
						children: "Back to offers"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-x-0 bottom-0 border-t bg-background p-4",
				style: { paddingBottom: "max(1rem, env(safe-area-inset-bottom))" },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto max-w-lg",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "jade",
						onClick: handlePrimaryAction,
						disabled: buttonDisabled,
						"data-testid": "offer-details-continue",
						className: "w-full",
						children: [buttonText, !isType3 && !hasStarted && !isPending && !isApproved && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "ml-1 size-3.5" })]
					})
				})
			})
		]
	});
}
function OfferDetailsPage() {
	const { offerId } = Route$16.useParams();
	const queryClient = useQueryClient();
	const router = useRouter();
	const navigate = useNavigate();
	const fetchOffer = useServerFn(getOfferById);
	const cachedOffer = queryClient.getQueriesData({ queryKey: ["featured-feed"] }).flatMap(([_key, data]) => data?.offers ?? []).find((o) => o.id === offerId);
	const { data: offer, isLoading, isError, error, isFetching, fetchStatus, isPlaceholderData, status, dataUpdatedAt } = useQuery({
		queryKey: ["offer", offerId],
		queryFn: () => fetchOffer({ data: { offerId } }),
		staleTime: 0,
		refetchOnMount: "always",
		placeholderData: cachedOffer
	});
	const handleBack = () => {
		if (router.history.length > 1) router.history.back();
		else navigate({ to: "/offers" });
	};
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		hideNav: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: handleBack,
				className: "inline-flex items-center gap-1.5 text-sm font-semibold text-primary",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), "Back"]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "size-16 rounded-xl" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-6 w-3/4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-1/4" })]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-24 w-full" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-32 w-full" })
			]
		})]
	});
	if (isError || !offer) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		hideNav: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: handleBack,
					className: "inline-flex items-center gap-1.5 text-sm font-semibold text-primary",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), "Back"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				icon: ArrowLeft,
				title: "Offer not available",
				description: "This offer may have been removed or is no longer active."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/offers",
					className: "mx-auto block w-fit rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90",
					children: "Back to offers"
				})
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorBoundary, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		hideNav: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: handleBack,
				className: "inline-flex items-center gap-1.5 text-sm font-semibold text-primary",
				"data-testid": "offer-details-back",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), "Back"]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfferDetailsView, { offer })]
	}) });
}
//#endregion
export { OfferDetailsPage as component };
