import { n as __exportAll } from "../_runtime.mjs";
import { l as __exportAll$1, s as __esmMin, u as __toCommonJS } from "./server-CpGMOUrW.mjs";
import { a as literalType, i as enumType, l as stringType, n as arrayType, o as numberType, r as booleanType, s as objectType } from "../_libs/zod.mjs";
import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
import crypto$2 from "node:crypto";
import { createHmac, timingSafeEqual } from "crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/advertiser.server-DyvSoHf7.js
var advertiser_server_DyvSoHf7_exports = /* @__PURE__ */ __exportAll({
	a: () => MktRpcError,
	c: () => mktRpc,
	i: () => init_pricing,
	l: () => num,
	n: () => init_advertiser_server,
	o: () => init_db_server,
	r: () => campaignTotals,
	s: () => mktDb,
	t: () => advertiser_server_exports
});
/**
* Calls one Phase 1 money function. Exactly one PostgREST request, so the
* function's money-mode flag is scoped to that single statement.
*/
async function mktRpc(name, args) {
	const { data, error } = await mktDb.rpc(name, args);
	if (error) {
		const code = error.message?.match(ERROR_CODE)?.[0] ?? "MKT_RPC_FAILED";
		throw new MktRpcError(code, `${name}: ${error.message}`);
	}
	if (!data || typeof data !== "object" || Array.isArray(data)) throw new MktRpcError("MKT_BAD_RESPONSE", `${name}: unexpected response`);
	return data;
}
async function loadMarketplaceSettings() {
	const { data, error } = await mktDb.from("marketplace_settings").select("deposits_enabled, manual_deposits_enabled, min_deposit_usd, max_deposit_usd, inr_per_usd, platform_fee_percent, promo_ends_at, first_deposit_bonus_percent, referral_bonus_split_percent, featured_price_per_day, fees_enabled, campaign_fee_usd, campaign_fee_type, terms_version").eq("id", true).maybeSingle();
	if (error) throw new Error(`marketplace_settings: ${error.message}`);
	if (!data) throw new Error("marketplace_settings row missing — Phase 1 migration not applied?");
	return data;
}
var mktDb;
var num;
var MktRpcError;
var ERROR_CODE;
var init_db_server = __esmMin((() => {
	init_client_server();
	mktDb = supabaseAdmin;
	num = (v) => {
		const n = typeof v === "string" ? Number(v) : v ?? 0;
		return Number.isFinite(n) ? n : 0;
	};
	MktRpcError = class extends Error {
		code;
		constructor(code, message) {
			super(message);
			this.name = "MktRpcError";
			this.code = code;
		}
	};
	ERROR_CODE = /\bMKT_[A-Z_]+\b/;
}));
/**
* Shared pricing calculation module for marketplace campaigns.
* Used by both server-side preflight checks and client-side UI.
*
* Mirrors SQL functions:
* - mkt__cost: calculates advertiser cost per slot
* - Campaign fee logic from mkt_submit_campaign_with_fee
*/
/**
* Calculate cost per slot (mirrors SQL mkt__cost function).
* Rounds UP to the cent to match database behavior.
*
* @param reward - Publisher reward per completion
* @param feePercent - Platform fee percentage (0-100)
* @returns Cost per slot rounded up to nearest cent
*/
function costPerSlot(reward, feePercent) {
	if (feePercent >= 100) throw new Error("Fee percent must be less than 100");
	return Math.ceil(reward * 100 / (1 - feePercent / 100)) / 100;
}
/**
* Calculate complete campaign cost breakdown.
*
* @param input - Campaign configuration
* @returns Breakdown of all costs
*/
function campaignTotals(input) {
	const { slots, reward, feePercent, feesEnabled, feeUsd, feeType, featuredFee = 0 } = input;
	const allocation = slots * costPerSlot(reward, feePercent);
	let campaignFee = 0;
	if (feesEnabled) {
		if (feeType === "per_campaign") campaignFee = feeUsd;
		else campaignFee = feeUsd * slots;
	}
	const total = allocation + campaignFee + featuredFee;
	return {
		allocation: Math.round(allocation * 100) / 100,
		campaignFee: Math.round(campaignFee * 100) / 100,
		featuredFee: Math.round(featuredFee * 100) / 100,
		total: Math.round(total * 100) / 100
	};
}
/**
* Check if advertiser has sufficient funds for campaign creation.
*
* Preflight rule:
* - Total spendable (deposit + bonus) must cover total cost
* - Deposit alone must cover campaign fee + featured fee (fees can't use bonus)
*
* @param params - Object with spendable, deposit, and totals
* @returns true if funds are sufficient
*/
function hasSufficientFunds(params) {
	const { spendable, deposit, totals } = params;
	const feesOnly = totals.campaignFee + totals.featuredFee;
	return spendable >= totals.total && deposit >= feesOnly;
}
var init_pricing = __esmMin((() => {}));
function keys() {
	const keyId = process.env["RAZORPAY_KEY_ID"];
	const keySecret = process.env["RAZORPAY_KEY_SECRET"];
	const missing = [...!keyId ? ["RAZORPAY_KEY_ID"] : [], ...!keySecret ? ["RAZORPAY_KEY_SECRET"] : []];
	if (missing.length) throw new RazorpayConfigError(missing);
	return {
		keyId,
		keySecret
	};
}
function razorpayKeyId() {
	return keys().keyId;
}
function razorpayConfigured() {
	return Boolean(process.env["RAZORPAY_KEY_ID"] && process.env["RAZORPAY_KEY_SECRET"] && process.env["RAZORPAY_WEBHOOK_SECRET"]);
}
async function rzpFetch(path, init = {}) {
	const { keyId, keySecret } = keys();
	const res = await fetch(`${BASE}${path}`, {
		...init,
		headers: {
			Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
			"Content-Type": "application/json",
			...init.headers ?? {}
		}
	});
	const text = await res.text();
	let body = null;
	try {
		body = text ? JSON.parse(text) : null;
	} catch {
		body = null;
	}
	if (!res.ok) {
		const err = body?.error;
		throw new RazorpayApiError(res.status, err?.code ?? null, err?.description ?? `Razorpay ${path} failed (${res.status})`);
	}
	return body;
}
/** amountMinor: paise for INR, cents for USD. receipt: our deposit id. */
async function createRazorpayOrder(input) {
	return rzpFetch("/orders", {
		method: "POST",
		body: JSON.stringify({
			amount: input.amountMinor,
			currency: input.currency,
			receipt: input.receipt,
			notes: input.notes,
			payment_capture: 1
		})
	});
}
function hmacHex(secret, data) {
	return createHmac("sha256", secret).update(data).digest("hex");
}
function safeEqualHex(a, b) {
	if (!/^[0-9a-f]+$/i.test(a) || !/^[0-9a-f]+$/i.test(b) || a.length !== b.length) return false;
	return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}
/** Checkout success callback: razorpay_signature = HMAC_SHA256(order_id|payment_id, key_secret). */
function verifyCheckoutSignature(input) {
	const { keySecret } = keys();
	return safeEqualHex(hmacHex(keySecret, `${input.orderId}|${input.paymentId}`), input.signature);
}
/** Webhook: X-Razorpay-Signature = HMAC_SHA256(raw body, webhook secret). */
function verifyWebhookSignature(rawBody, signature) {
	const secret = process.env["RAZORPAY_WEBHOOK_SECRET"];
	if (!secret || !signature) return false;
	return safeEqualHex(hmacHex(secret, rawBody), signature.trim());
}
var BASE;
var RazorpayConfigError;
var RazorpayApiError;
var init_razorpay_server = __esmMin((() => {
	BASE = "https://api.razorpay.com/v1";
	RazorpayConfigError = class extends Error {
		constructor(missing) {
			super(`Razorpay is not configured: missing ${missing.join(", ")}`);
			this.name = "RazorpayConfigError";
		}
	};
	RazorpayApiError = class extends Error {
		status;
		code;
		constructor(status, code, message) {
			super(message);
			this.name = "RazorpayApiError";
			this.status = status;
			this.code = code;
		}
	};
}));
/**
* NOWPayments crypto gateway integration.
* Architecture mirrors razorpay.server.ts: deposit creation, webhook crediting only.
* 
* Env vars (server-only):
* - NOWPAYMENTS_API_KEY (required)
* - NOWPAYMENTS_IPN_SECRET (required for webhook verification)
* - NOWPAYMENTS_BASE_URL (optional, defaults to production, set to sandbox for testing)
*/
var nowpayments_server_exports = /* @__PURE__ */ __exportAll$1({
	createNowpaymentsInvoice: () => createNowpaymentsInvoice,
	nowpaymentsApiKey: () => nowpaymentsApiKey,
	nowpaymentsConfigured: () => nowpaymentsConfigured,
	verifyNowpaymentsIpn: () => verifyNowpaymentsIpn
});
/**
* Get NOWPayments base URL (production or sandbox).
*/
function getNowpaymentsBaseUrl() {
	return process.env["NOWPAYMENTS_BASE_URL"] || NOWPAYMENTS_PROD_URL;
}
/**
* Check if NOWPayments is configured (API key present).
*/
function nowpaymentsConfigured() {
	return Boolean(process.env["NOWPAYMENTS_API_KEY"]);
}
/**
* Expose in settings for UI to check.
*/
function nowpaymentsApiKey() {
	return process.env["NOWPAYMENTS_API_KEY"] || null;
}
/**
* Create a NOWPayments invoice for a deposit.
* POST /v1/invoice with x-api-key header.
*/
async function createNowpaymentsInvoice(params) {
	const apiKey = process.env["NOWPAYMENTS_API_KEY"];
	if (!apiKey) throw new Error("NOWPAYMENTS_API_KEY not configured");
	const url = `${getNowpaymentsBaseUrl()}/v1/invoice`;
	const body = {
		price_amount: params.amountUsd,
		price_currency: "usd",
		order_id: params.depositId,
		order_description: `CashGPT Campaign Balance Deposit - $${params.amountUsd}`,
		ipn_callback_url: params.ipnCallbackUrl,
		success_url: params.successUrl,
		cancel_url: params.cancelUrl
	};
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"x-api-key": apiKey,
			"Content-Type": "application/json"
		},
		body: JSON.stringify(body)
	});
	if (!response.ok) {
		const text = await response.text();
		throw new Error(`NOWPayments invoice creation failed: ${response.status} ${text}`);
	}
	const data = await response.json();
	return {
		invoiceId: data.id,
		invoiceUrl: data.invoice_url
	};
}
/**
* Sort object keys recursively for HMAC verification.
* NOWPayments requires alphabetical key sorting.
*/
function sortObjectKeys(obj) {
	if (Array.isArray(obj)) return obj.map(sortObjectKeys);
	if (obj !== null && typeof obj === "object") return Object.keys(obj).sort().reduce((sorted, key) => {
		sorted[key] = sortObjectKeys(obj[key]);
		return sorted;
	}, {});
	return obj;
}
/**
* Verify NOWPayments IPN signature.
* x-nowpayments-sig = HMAC-SHA512(sorted JSON body, IPN_SECRET)
*/
function verifyNowpaymentsIpn(rawBody, signature) {
	const secret = process.env["NOWPAYMENTS_IPN_SECRET"];
	if (!secret) {
		console.error("[nowpayments] NOWPAYMENTS_IPN_SECRET not configured");
		return false;
	}
	if (!signature) return false;
	try {
		const sorted = sortObjectKeys(JSON.parse(rawBody));
		const sortedBody = JSON.stringify(sorted);
		const hmac = crypto$2.createHmac("sha512", secret);
		hmac.update(sortedBody);
		const computed = hmac.digest("hex");
		return crypto$2.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
	} catch (err) {
		console.error("[nowpayments] IPN signature verification error:", err);
		return false;
	}
}
var NOWPAYMENTS_PROD_URL;
var init_nowpayments_server = __esmMin((() => {
	NOWPAYMENTS_PROD_URL = "https://api.nowpayments.io";
}));
/**
* QroPay UPI gateway integration.
* Architecture mirrors razorpay.server.ts: deposit creation, webhook crediting only.
* 
* Env vars (server-only):
* - QROPAY_API_KEY (required, used as "key" parameter)
* - QROPAY_WEBHOOK_SECRET (required for webhook validation)
*/
var qropay_server_exports = /* @__PURE__ */ __exportAll$1({
	createQropayOrder: () => createQropayOrder,
	qropayConfigured: () => qropayConfigured,
	verifyQropayWebhook: () => verifyQropayWebhook
});
/**
* Check if QroPay is configured (API key and webhook secret present).
*/
function qropayConfigured() {
	return Boolean(process.env["QROPAY_API_KEY"] && process.env["QROPAY_WEBHOOK_SECRET"]);
}
/**
* Create a QroPay order for a deposit.
* POST /api/add_order.php
*/
async function createQropayOrder(params) {
	const apiKey = process.env["QROPAY_API_KEY"];
	if (!apiKey) throw new Error("QROPAY_API_KEY not configured");
	const shortOrderId = params.depositId.replace(/-/g, "").substring(12, 32);
	const amountStr = String(Math.ceil(params.amountInr));
	const body = {
		key: apiKey,
		order_id: shortOrderId,
		amount: amountStr,
		purpose: "CashGPT Deposit",
		customer_email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.customerEmail) ? params.customerEmail : "support@cashgpt.in",
		redirect_url: "https://cashgpt.in/advertiser/funds"
	};
	const logBody = {
		...body,
		key: `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
	};
	console.log("[qropay] Sending request to QroPay:", {
		url: QROPAY_API_URL,
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: logBody,
		mapping: {
			shortOrderId,
			fullDepositId: params.depositId,
			originalAmount: params.amountInr,
			roundedAmount: amountStr
		}
	});
	const response = await fetch(QROPAY_API_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body)
	});
	const contentType = response.headers.get("content-type") || "unknown";
	let responseText = "";
	try {
		responseText = await response.text();
	} catch (readErr) {
		responseText = `[Could not read response body: ${readErr}]`;
	}
	if (!response.ok) {
		const truncatedBody = responseText.substring(0, 500);
		const errorMessage = `QroPay ${response.status} (${contentType}): ${truncatedBody || "[empty body]"}`;
		console.error("[qropay] Order creation HTTP error:", {
			status: response.status,
			statusText: response.statusText,
			contentType,
			bodyLength: responseText.length,
			body: truncatedBody || "[empty]",
			requestBody: logBody
		});
		throw new Error(errorMessage);
	}
	let data;
	try {
		data = JSON.parse(responseText);
	} catch (parseErr) {
		const truncatedBody = responseText.substring(0, 500);
		console.error("[qropay] Failed to parse response JSON:", {
			contentType,
			bodyLength: responseText.length,
			body: truncatedBody,
			requestBody: logBody
		});
		throw new Error(`QroPay response not JSON (${contentType}): ${truncatedBody}`);
	}
	if (!data.status || !data.order_id || !data.payment_url) {
		const errorMessage = `QroPay order failed: ${data.msg || "Unknown error"}`;
		console.error("[qropay] Order creation response invalid:", {
			responseStatus: data.status,
			responseMsg: data.msg,
			responseOrderId: data.order_id,
			responsePaymentUrl: data.payment_url,
			requestBody: logBody
		});
		throw new Error(errorMessage);
	}
	console.log("[qropay] Order created successfully:", {
		qropayOrderId: data.order_id,
		shortOrderId,
		fullDepositId: params.depositId,
		paymentUrl: data.payment_url
	});
	return {
		qropayOrderId: String(data.order_id),
		paymentUrl: data.payment_url
	};
}
/**
* Verify QroPay webhook secret.
* Timing-safe comparison of secretKey.
*/
function verifyQropayWebhook(secretKey) {
	const expectedSecret = process.env["QROPAY_WEBHOOK_SECRET"];
	if (!expectedSecret) {
		console.error("[qropay] QROPAY_WEBHOOK_SECRET not configured");
		return false;
	}
	if (!secretKey) return false;
	try {
		return crypto$2.timingSafeEqual(Buffer.from(secretKey), Buffer.from(expectedSecret));
	} catch (err) {
		return false;
	}
}
var QROPAY_API_URL;
var init_qropay_server = __esmMin((() => {
	QROPAY_API_URL = "https://qropay.com/api/add_order.php";
}));
var advertiser_server_exports = /* @__PURE__ */ __exportAll$1({
	DepositError: () => DepositError,
	abandonDepositImpl: () => abandonDepositImpl,
	addCampaignBudgetImpl: () => addCampaignBudgetImpl,
	addCampaignBudgetInput: () => addCampaignBudgetInput,
	becomeAdvertiserImpl: () => becomeAdvertiserImpl,
	becomeAdvertiserInput: () => becomeAdvertiserInput,
	campaignActionImpl: () => campaignActionImpl,
	campaignGroup: () => campaignGroup,
	confirmCheckoutImpl: () => confirmCheckoutImpl,
	createCampaignImpl: () => createCampaignImpl,
	createCampaignInput: () => createCampaignInput,
	createDepositImpl: () => createDepositImpl,
	createNowpaymentsDepositImpl: () => createNowpaymentsDepositImpl,
	createQropayDepositImpl: () => createQropayDepositImpl,
	editCampaignImpl: () => editCampaignImpl,
	editCampaignInput: () => editCampaignInput,
	getAccount: () => getAccount,
	getCampaignForEditImpl: () => getCampaignForEditImpl,
	getCampaignResultsImpl: () => getCampaignResultsImpl,
	getDepositImpl: () => getDepositImpl,
	getOverviewImpl: () => getOverviewImpl,
	humanMktError: () => humanMktError,
	listCampaignsImpl: () => listCampaignsImpl,
	listPendingReviewsImpl: () => listPendingReviewsImpl,
	listTransactionsImpl: () => listTransactionsImpl,
	processRazorpayWebhook: () => processRazorpayWebhook,
	reviewSubmissionImpl: () => reviewSubmissionImpl,
	rotateCampaignSecretImpl: () => rotateCampaignSecretImpl,
	routeWebhookEvent: () => routeWebhookEvent,
	updateAdvertiserProfileImpl: () => updateAdvertiserProfileImpl,
	updateAdvertiserProfileInput: () => updateAdvertiserProfileInput
});
/**
* Gets the canonical site URL for all absolute URLs (payment callbacks, email links, etc.).
* ALWAYS uses SITE_URL env var, never falls back to request headers.
* This ensures preview deployments can't inject their domain into payment providers.
*/
function getSiteUrl() {
	const envUrl = process.env["SITE_URL"];
	if (!envUrl) throw new Error("SITE_URL environment variable is required. Set it to https://cashgpt.in in production.");
	return envUrl.replace(/\/$/, "");
}
function accountView(a) {
	const deposit = num(a.deposit_balance);
	const bonusAvail = num(a.bonus_available);
	return {
		userId: a.user_id,
		displayName: a.display_name,
		contactEmail: a.contact_email,
		websiteUrl: a.website_url,
		status: a.status,
		statusReason: a.status_reason,
		depositBalance: deposit,
		bonusLocked: num(a.bonus_locked),
		bonusAvailable: bonusAvail,
		spendable: Math.round((deposit + bonusAvail) * 100) / 100,
		lifetimeDeposited: num(a.lifetime_deposited),
		lifetimeBonus: num(a.lifetime_bonus),
		lifetimeSpent: num(a.lifetime_spent),
		flaggedForReview: a.flagged_for_review,
		termsVersion: a.terms_version,
		createdAt: a.created_at
	};
}
function settingsView(s) {
	const promoEnds = s.promo_ends_at ? new Date(s.promo_ends_at) : null;
	const { nowpaymentsConfigured } = (init_nowpayments_server(), __toCommonJS(nowpayments_server_exports));
	const { qropayConfigured } = (init_qropay_server(), __toCommonJS(qropay_server_exports));
	return {
		depositsEnabled: s.deposits_enabled,
		minDepositUsd: num(s.min_deposit_usd),
		maxDepositUsd: num(s.max_deposit_usd),
		inrPerUsd: s.inr_per_usd == null ? null : num(s.inr_per_usd),
		platformFeePercent: num(s.platform_fee_percent),
		promoActive: Boolean(promoEnds && promoEnds.getTime() > Date.now()),
		promoEndsAt: s.promo_ends_at,
		firstDepositBonusPercent: num(s.first_deposit_bonus_percent),
		featuredPricePerDay: num(s.featured_price_per_day),
		feesEnabled: s.fees_enabled,
		campaignFeeUsd: num(s.campaign_fee_usd),
		campaignFeeType: s.campaign_fee_type,
		termsVersion: s.terms_version,
		razorpayConfigured: razorpayConfigured(),
		nowpaymentsConfigured: nowpaymentsConfigured(),
		qropayConfigured: qropayConfigured()
	};
}
function campaignGroup(status) {
	switch (status) {
		case "active":
		case "budget_exhausted": return "active";
		case "paused": return "paused";
		case "draft":
		case "pending_review":
		case "rejected": return "draft";
		default: return "completed";
	}
}
function campaignView(c, pendingReviews = 0) {
	return {
		id: c.id,
		title: c.name,
		summary: c.summary,
		status: c.status,
		group: campaignGroup(c.status),
		verification: c.verification_mode === "auto" ? "auto" : "proof",
		reward: num(c.publisher_reward),
		costPerCompletion: c.advertiser_cost == null ? null : num(c.advertiser_cost),
		maxCompletions: c.max_completions,
		completions: c.completions_count,
		budget: num(c.budget_allocated),
		spent: num(c.budget_spent),
		reserved: num(c.budget_reserved),
		remaining: num(c.budget_remaining),
		countries: c.countries ?? [],
		pausedBy: c.paused_by,
		needsReview: c.needs_review,
		reviewNote: c.review_note,
		pendingReviews,
		createdAt: c.created_at
	};
}
function depositView(d) {
	return {
		id: d.id,
		amountUsd: num(d.amount_usd),
		chargeCurrency: d.charge_currency,
		chargeAmount: num(d.charge_amount),
		gateway: d.gateway,
		status: d.status,
		gatewayOrderId: d.gateway_order_id,
		gatewayPaymentId: d.gateway_payment_id,
		failureReason: d.failure_reason,
		creditedAt: d.credited_at,
		createdAt: d.created_at
	};
}
async function getAccount(userId) {
	const { data, error } = await mktDb.from("advertiser_accounts").select("*").eq("user_id", userId).maybeSingle();
	if (error) throw new Error(`advertiser_accounts: ${error.message}`);
	return data ?? null;
}
async function pendingReviewCounts(campaignIds) {
	const out = /* @__PURE__ */ new Map();
	if (!campaignIds.length) return out;
	const { data, error } = await mktDb.from("campaign_submissions").select("campaign_id").in("campaign_id", campaignIds).in("status", ["pending", "appealed"]);
	if (error) throw new Error(`campaign_submissions: ${error.message}`);
	for (const row of data ?? []) out.set(row.campaign_id, (out.get(row.campaign_id) ?? 0) + 1);
	return out;
}
async function postbackLogsForCampaigns(campaignIds) {
	const result = /* @__PURE__ */ new Map();
	if (!campaignIds.length) return result;
	const { data, error } = await mktDb.from("campaign_postback_log").select("campaign_id, received_at, result, click_id, txn_id, http_status").in("campaign_id", campaignIds).order("received_at", { ascending: false });
	if (error) throw new Error(`campaign_postback_log: ${error.message}`);
	for (const row of data ?? []) {
		const logs = result.get(row.campaign_id) ?? [];
		if (logs.length < 20) logs.push({
			receivedAt: row.received_at,
			result: row.result,
			clickId: row.click_id,
			txnId: row.txn_id,
			httpStatus: row.http_status
		});
		result.set(row.campaign_id, logs);
	}
	return result;
}
async function getCampaignResultsImpl(userId, campaignId) {
	const { data: campaign, error } = await mktDb.from("campaigns").select("id,name,verification_mode,countries,publisher_reward,advertiser_cost,status,budget_allocated,budget_spent,budget_remaining,completions_count,max_completions").eq("id", campaignId).eq("advertiser_id", userId).maybeSingle();
	if (error) throw new Error(error.message);
	if (!campaign) return null;
	const [{ data: clicks }, { data: submissions }, { count: credited }, { data: postbacks }] = await Promise.all([
		mktDb.from("campaign_clicks").select("status").eq("campaign_id", campaignId),
		mktDb.from("campaign_submissions").select("status,created_at").eq("campaign_id", campaignId),
		mktDb.from("campaign_conversions").select("id", {
			count: "exact",
			head: true
		}).eq("campaign_id", campaignId).eq("status", "credited"),
		campaign.verification_mode === "auto" ? mktDb.from("campaign_postback_log").select("received_at,result,click_id,txn_id,http_status").eq("campaign_id", campaignId).order("received_at", { ascending: false }).limit(20) : Promise.resolve({
			data: [],
			error: null
		})
	]);
	if (submissions?.error || postbacks?.error) throw new Error(submissions?.error?.message || postbacks?.error?.message);
	const counts = {
		pending: 0,
		approved: 0,
		rejected: 0,
		appealed: 0
	};
	for (const row of submissions ?? []) if (row.status in counts) counts[row.status]++;
	const clickRows = clicks ?? [];
	return {
		...campaign,
		countries: campaign.countries?.length ? campaign.countries.join(", ") : "Worldwide",
		publisher_reward: num(campaign.publisher_reward),
		advertiser_cost: num(campaign.advertiser_cost),
		budget_allocated: num(campaign.budget_allocated),
		budget_spent: num(campaign.budget_spent),
		budget_remaining: num(campaign.budget_remaining),
		funnel: {
			clicks: clickRows.length,
			started: clickRows.filter((r) => ["active", "converted"].includes(r.status)).length,
			completed: (credited ?? 0) + counts.approved
		},
		submissions: counts,
		postbacks: postbacks ?? []
	};
}
/**
* Get campaign data for editing. Returns all editable fields plus read-only values.
* Verifies ownership and returns null if not found or not owned by user.
*/
async function getCampaignForEditImpl(userId, campaignId) {
	const { data: campaign, error } = await mktDb.from("campaigns").select("*").eq("id", campaignId).eq("advertiser_id", userId).maybeSingle();
	if (error) throw new Error(error.message);
	if (!campaign) return null;
	const { data: options } = await mktDb.from("campaign_options").select("*").eq("campaign_id", campaignId).maybeSingle();
	return {
		id: campaign.id,
		name: campaign.name,
		summary: campaign.summary,
		description: campaign.description,
		status: campaign.status,
		verificationMode: campaign.verification_mode,
		steps: campaign.steps,
		rules: campaign.rules,
		proofDescription: campaign.proof_description,
		proofMode: options?.proof_mode || null,
		proofMinImages: campaign.proof_min_images,
		proofMaxImages: campaign.proof_max_images,
		proofFields: campaign.proof_fields || [],
		proofExampleUrl: options?.proof_example_url || null,
		categoryId: campaign.category_id,
		subcategoryId: campaign.subcategory_id,
		landingUrl: campaign.landing_url,
		trackingUrl: campaign.tracking_url,
		countries: campaign.countries || [],
		devices: campaign.devices || [],
		eligibilityNotes: campaign.eligibility_notes,
		estimatedMinutes: campaign.estimated_minutes,
		startsAt: campaign.starts_at,
		endsAt: campaign.ends_at,
		reviewWindowHours: options?.review_window_hours || 24,
		dailyLimit: options?.daily_limit || null,
		publisherReward: num(campaign.publisher_reward),
		advertiserCost: num(campaign.advertiser_cost),
		maxCompletions: campaign.max_completions,
		completionsCount: campaign.completions_count,
		budgetAllocated: num(campaign.budget_allocated),
		budgetSpent: num(campaign.budget_spent),
		budgetRemaining: num(campaign.budget_remaining)
	};
}
async function listCampaignsImpl(userId) {
	const { data, error } = await mktDb.from("campaigns").select(CAMPAIGN_COLS).eq("advertiser_id", userId).neq("status", "archived").order("created_at", { ascending: false });
	if (error) throw new Error(`campaigns: ${error.message}`);
	const rows = data ?? [];
	const pending = await pendingReviewCounts(rows.map((r) => r.id));
	const logs = await postbackLogsForCampaigns(rows.map((r) => r.id));
	return rows.map((r) => ({
		...campaignView(r, pending.get(r.id) ?? 0),
		...r.verification_mode === "auto" ? {
			postbackUrl: `${getSiteUrl()}/api/public/marketplace-postback`,
			postbackLogs: logs.get(r.id) ?? []
		} : {}
	}));
}
async function getOverviewImpl(userId) {
	const [account, settings] = await Promise.all([getAccount(userId), loadMarketplaceSettings()]);
	const { data: referralData } = await mktDb.from("referrals").select("referrer_id").eq("referred_id", userId).maybeSingle();
	const userBonusPercent = Boolean(referralData?.referrer_id) ? num(settings.first_deposit_bonus_percent) - num(settings.referral_bonus_split_percent) : num(settings.first_deposit_bonus_percent);
	const base = {
		account: account ? accountView(account) : null,
		settings: settingsView(settings),
		stats: {
			activeCampaigns: 0,
			completedConversions: 0,
			pendingReviews: 0
		},
		liveCampaigns: [],
		recentDeposits: [],
		userBonusPercent
	};
	if (!account) return base;
	const campaigns = await listCampaignsImpl(userId);
	const [{ data: deposits, error: depErr }] = await Promise.all([mktDb.from("advertiser_deposits").select("*").eq("advertiser_id", userId).order("created_at", { ascending: false }).limit(5)]);
	if (depErr) throw new Error(`advertiser_deposits: ${depErr.message}`);
	const active = campaigns.filter((c) => c.group === "active");
	return {
		...base,
		stats: {
			activeCampaigns: active.length,
			completedConversions: campaigns.reduce((n, c) => n + c.completions, 0),
			pendingReviews: campaigns.reduce((n, c) => n + c.pendingReviews, 0)
		},
		liveCampaigns: active.slice(0, 3),
		recentDeposits: (deposits ?? []).map(depositView)
	};
}
async function listTransactionsImpl(userId, limit = 100) {
	const { data, error } = await mktDb.from("advertiser_ledger").select("id, advertiser_id, kind, bucket, amount, delta, balance_after, campaign_id, reference_type, reference_id, description, created_at").eq("advertiser_id", userId).order("created_at", { ascending: false }).limit(limit);
	if (error) throw new Error(`advertiser_ledger: ${error.message}`);
	const rows = data ?? [];
	const campaignIds = [...new Set(rows.map((r) => r.campaign_id).filter(Boolean))];
	const names = /* @__PURE__ */ new Map();
	if (campaignIds.length) {
		const { data: cs } = await mktDb.from("campaigns").select("id, name").in("id", campaignIds);
		for (const c of cs ?? []) names.set(c.id, c.name);
	}
	return rows.map((r) => ({
		id: r.id,
		kind: r.kind,
		bucket: r.bucket,
		label: LEDGER_LABEL[r.kind] ?? r.kind,
		amount: num(r.delta),
		campaignId: r.campaign_id,
		campaignName: r.campaign_id ? names.get(r.campaign_id) ?? null : null,
		description: r.description,
		createdAt: r.created_at
	}));
}
async function getDepositImpl(userId, depositId) {
	const { data, error } = await mktDb.from("advertiser_deposits").select("*").eq("id", depositId).eq("advertiser_id", userId).maybeSingle();
	if (error) throw new Error(`advertiser_deposits: ${error.message}`);
	return data ? depositView(data) : null;
}
/**
* Creates the advertiser account. A plain INSERT: the Phase 1 guard trigger
* allows it as long as every money column is 0 and status is 'active', which
* the defaults guarantee. Idempotent — an existing account is returned as-is.
*/
async function becomeAdvertiserImpl(userId, input) {
	const existing = await getAccount(userId);
	if (existing) return {
		created: false,
		account: accountView(existing)
	};
	const settings = await loadMarketplaceSettings();
	const { data, error } = await mktDb.from("advertiser_accounts").insert({
		user_id: userId,
		display_name: input.displayName,
		contact_email: input.contactEmail || null,
		website_url: input.websiteUrl || null,
		terms_version: settings.terms_version
	}).select("*").single();
	if (error) {
		if (error.code === "23505") {
			const again = await getAccount(userId);
			if (again) return {
				created: false,
				account: accountView(again)
			};
		}
		throw new Error(`advertiser_accounts insert: ${error.message}`);
	}
	return {
		created: true,
		account: accountView(data)
	};
}
async function updateAdvertiserProfileImpl(userId, input) {
	const { data, error } = await mktDb.from("advertiser_accounts").update({
		display_name: input.displayName,
		contact_email: input.contactEmail || null,
		website_url: input.websiteUrl || null
	}).eq("user_id", userId).select("*").single();
	if (error) throw new Error(`advertiser_accounts update: ${error.message}`);
	return accountView(data);
}
/**
* Step 1 of a deposit. Inserts the `created` row (allowed by the guard), asks
* Razorpay for an order, records the order id and moves the row to `pending`
* (allowed transition). No balance changes here.
*/
async function createDepositImpl(userId, amountUsd) {
	const account = await getAccount(userId);
	if (!account) throw new DepositError("NOT_ADVERTISER", "Activate advertiser mode first.");
	if (account.status !== "active") throw new DepositError("ACCOUNT_" + account.status.toUpperCase(), "Your advertiser account can't deposit right now.");
	const s = await loadMarketplaceSettings();
	if (!s.deposits_enabled) throw new DepositError("DEPOSITS_DISABLED", "Deposits are temporarily unavailable.");
	if (!razorpayConfigured()) throw new DepositError("GATEWAY_NOT_CONFIGURED", "Payments are not configured yet.");
	const { data: userRole } = await mktDb.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
	const minDeposit = Boolean(userRole) ? .1 : num(s.min_deposit_usd);
	const amount = Math.round(amountUsd * 100) / 100;
	if (!(amount >= minDeposit && amount <= num(s.max_deposit_usd))) throw new DepositError("AMOUNT_OUT_OF_RANGE", `Deposit between $${minDeposit.toFixed(2)} and $${num(s.max_deposit_usd).toFixed(2)}.`);
	const inr = s.inr_per_usd == null ? null : num(s.inr_per_usd);
	const currency = inr ? "INR" : "USD";
	const fxRate = inr ?? 1;
	const chargeAmount = Math.round(amount * fxRate * 100) / 100;
	const { data: created, error: insErr } = await mktDb.from("advertiser_deposits").insert({
		advertiser_id: userId,
		amount_usd: amount,
		gateway: "razorpay",
		charge_currency: currency,
		charge_amount: chargeAmount,
		fx_rate: fxRate,
		terms_version: s.terms_version
	}).select("id").single();
	if (insErr) throw new Error(`advertiser_deposits insert: ${insErr.message}`);
	const depositId = created.id;
	let order;
	try {
		order = await createRazorpayOrder({
			amountMinor: toMinor(chargeAmount),
			currency,
			receipt: depositId,
			notes: {
				deposit_id: depositId,
				advertiser_id: userId,
				amount_usd: amount.toFixed(2)
			}
		});
	} catch (err) {
		const gatewayMessage = err instanceof Error ? err.message : String(err);
		const failureReason = `order_create_failed: ${gatewayMessage}`.slice(0, 500);
		console.error("[razorpay] createDepositImpl failed:", {
			depositId,
			userId,
			amountUsd: amount,
			chargeAmount,
			currency,
			error: gatewayMessage
		});
		await mktDb.from("advertiser_deposits").update({
			status: "failed",
			failure_reason: failureReason
		}).eq("id", depositId);
		throw new DepositError("ORDER_FAILED", `Couldn't start the payment: ${gatewayMessage}`);
	}
	const { error: updErr } = await mktDb.from("advertiser_deposits").update({
		gateway_order_id: order.id,
		status: "pending"
	}).eq("id", depositId);
	if (updErr) throw new Error(`advertiser_deposits order update: ${updErr.message}`);
	return {
		depositId,
		orderId: order.id,
		keyId: razorpayKeyId(),
		amountMinor: toMinor(chargeAmount),
		currency,
		amountUsd: amount
	};
}
/**
* Step 2 (browser → server after Checkout reports success). Verifies the
* checkout signature and records the payment id so the UI can show "payment
* received, confirming…". DOES NOT CREDIT. The balance moves only when the
* `payment.captured` webhook arrives (processRazorpayWebhook).
*/
async function confirmCheckoutImpl(userId, input) {
	const { data, error } = await mktDb.from("advertiser_deposits").select("*").eq("id", input.depositId).eq("advertiser_id", userId).maybeSingle();
	if (error) throw new Error(`advertiser_deposits: ${error.message}`);
	const d = data;
	if (!d) throw new DepositError("NOT_FOUND", "Deposit not found.");
	if (d.gateway_order_id !== input.orderId) throw new DepositError("ORDER_MISMATCH", "Order does not match.");
	if (!verifyCheckoutSignature(input)) throw new DepositError("BAD_SIGNATURE", "Payment signature check failed.");
	if (d.status === "succeeded" || d.status === "reversed") return depositView(d);
	if (d.status === "pending" && d.gateway_payment_id !== input.paymentId) {
		const { error: updErr } = await mktDb.from("advertiser_deposits").update({
			gateway_payment_id: input.paymentId,
			last_event: {
				source: "checkout",
				payment_id: input.paymentId,
				at: (/* @__PURE__ */ new Date()).toISOString()
			}
		}).eq("id", d.id).eq("status", "pending");
		if (updErr && !/MKT_FUNCTION_ONLY/.test(updErr.message)) throw new Error(`advertiser_deposits payment update: ${updErr.message}`);
	}
	return await getDepositImpl(userId, d.id) ?? depositView(d);
}
/** Browser gave up / Checkout dismissed. Only created|pending → failed. */
async function abandonDepositImpl(userId, depositId, reason) {
	await mktDb.from("advertiser_deposits").update({
		status: "failed",
		failure_reason: reason.slice(0, 200)
	}).eq("id", depositId).eq("advertiser_id", userId).in("status", ["created", "pending"]);
}
/**
* Create a NOWPayments crypto deposit.
* Always charges in USD (crypto pricing). Returns invoice URL for redirect.
*/
async function createNowpaymentsDepositImpl(userId, amountUsd) {
	const account = await getAccount(userId);
	if (!account) throw new DepositError("NOT_ADVERTISER", "Activate advertiser mode first.");
	if (account.status !== "active") throw new DepositError("ACCOUNT_" + account.status.toUpperCase(), "Your advertiser account can't deposit right now.");
	const s = await loadMarketplaceSettings();
	if (!s.deposits_enabled) throw new DepositError("DEPOSITS_DISABLED", "Deposits are temporarily unavailable.");
	const { nowpaymentsConfigured } = await Promise.resolve().then(() => (init_nowpayments_server(), nowpayments_server_exports));
	if (!nowpaymentsConfigured()) throw new DepositError("GATEWAY_NOT_CONFIGURED", "Crypto payments are not configured yet.");
	const { data: userRole } = await mktDb.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
	const minDeposit = Boolean(userRole) ? .1 : num(s.min_deposit_usd);
	const amount = Math.round(amountUsd * 100) / 100;
	if (!(amount >= minDeposit && amount <= num(s.max_deposit_usd))) throw new DepositError("AMOUNT_OUT_OF_RANGE", `Deposit between $${minDeposit.toFixed(2)} and $${num(s.max_deposit_usd).toFixed(2)}.`);
	const currency = "USD";
	const chargeAmount = amount;
	const { data: created, error: insErr } = await mktDb.from("advertiser_deposits").insert({
		advertiser_id: userId,
		amount_usd: amount,
		gateway: "nowpayments",
		charge_currency: currency,
		charge_amount: chargeAmount,
		fx_rate: 1,
		terms_version: s.terms_version
	}).select("id").single();
	if (insErr) throw new Error(`advertiser_deposits insert: ${insErr.message}`);
	const depositId = created.id;
	let invoice;
	try {
		const { createNowpaymentsInvoice } = await Promise.resolve().then(() => (init_nowpayments_server(), nowpayments_server_exports));
		const siteUrl = getSiteUrl();
		invoice = await createNowpaymentsInvoice({
			depositId,
			amountUsd: amount,
			successUrl: `${siteUrl}/advertiser/funds?deposit=${depositId}`,
			cancelUrl: `${siteUrl}/advertiser/funds?cancelled=${depositId}`,
			ipnCallbackUrl: `${siteUrl}/api/public/nowpayments-ipn`
		});
	} catch (err) {
		const gatewayMessage = err instanceof Error ? err.message : String(err);
		const failureReason = `invoice_create_failed: ${gatewayMessage}`.slice(0, 500);
		console.error("[nowpayments] createNowpaymentsDepositImpl failed:", {
			depositId,
			userId,
			amountUsd: amount,
			error: gatewayMessage
		});
		await mktDb.from("advertiser_deposits").update({
			status: "failed",
			failure_reason: failureReason
		}).eq("id", depositId);
		throw new DepositError("INVOICE_FAILED", `Couldn't create the invoice: ${gatewayMessage}`);
	}
	const { error: updErr } = await mktDb.from("advertiser_deposits").update({
		gateway_order_id: invoice.invoiceId,
		status: "pending"
	}).eq("id", depositId);
	if (updErr) throw new Error(`advertiser_deposits invoice update: ${updErr.message}`);
	return {
		depositId,
		invoiceUrl: invoice.invoiceUrl
	};
}
/**
* QroPay deposit: charge in INR, create QroPay order, redirect to payment_url.
* Always charges in INR (UPI only). Returns payment URL for redirect.
* 
* Extra safety: prevent duplicate pending deposits with same INR amount within expiry window.
*/
async function createQropayDepositImpl(userId, amountUsd) {
	const account = await getAccount(userId);
	if (!account) throw new DepositError("NOT_ADVERTISER", "Activate advertiser mode first.");
	if (account.status !== "active") throw new DepositError("ACCOUNT_" + account.status.toUpperCase(), "Your advertiser account can't deposit right now.");
	const s = await loadMarketplaceSettings();
	if (!s.deposits_enabled) throw new DepositError("DEPOSITS_DISABLED", "Deposits are temporarily unavailable.");
	const { qropayConfigured } = await Promise.resolve().then(() => (init_qropay_server(), qropay_server_exports));
	if (!qropayConfigured()) throw new DepositError("GATEWAY_NOT_CONFIGURED", "QroPay UPI payments are not configured yet.");
	if (!s.inr_per_usd || s.inr_per_usd <= 0) throw new DepositError("FX_RATE_MISSING", "INR exchange rate not configured.");
	const { data: userRole } = await mktDb.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
	const minDeposit = Boolean(userRole) ? .1 : num(s.min_deposit_usd);
	const amount = Math.round(amountUsd * 100) / 100;
	if (!(amount >= minDeposit && amount <= num(s.max_deposit_usd))) throw new DepositError("AMOUNT_OUT_OF_RANGE", `Deposit between $${minDeposit.toFixed(2)} and $${num(s.max_deposit_usd).toFixed(2)}.`);
	const fxRate = num(s.inr_per_usd);
	const chargeAmount = Math.ceil(amount * fxRate);
	const currency = "INR";
	const expiryThreshold = (/* @__PURE__ */ new Date(Date.now() - 18e5)).toISOString();
	const { data: existingPending } = await mktDb.from("advertiser_deposits").select("id").eq("gateway", "qropay").eq("status", "pending").eq("charge_amount", chargeAmount).eq("charge_currency", "INR").gt("created_at", expiryThreshold).maybeSingle();
	if (existingPending) throw new DepositError("DUPLICATE_PENDING", "Please try again in a few minutes or choose a slightly different amount.");
	const { data: created, error: insErr } = await mktDb.from("advertiser_deposits").insert({
		advertiser_id: userId,
		amount_usd: amount,
		gateway: "qropay",
		charge_currency: currency,
		charge_amount: chargeAmount,
		fx_rate: fxRate,
		terms_version: s.terms_version
	}).select("id").single();
	if (insErr) throw new Error(`advertiser_deposits insert: ${insErr.message}`);
	const depositId = created.id;
	let order;
	try {
		const { createQropayOrder } = await Promise.resolve().then(() => (init_qropay_server(), qropay_server_exports));
		const siteUrl = getSiteUrl();
		const { data: profile } = await mktDb.from("profiles").select("email").eq("id", userId).maybeSingle();
		order = await createQropayOrder({
			depositId,
			amountInr: chargeAmount,
			customerEmail: profile?.email || "support@cashgpt.com",
			redirectUrl: `${siteUrl}/advertiser/funds?deposit=${depositId}`
		});
	} catch (err) {
		const gatewayMessage = err instanceof Error ? err.message : String(err);
		const failureReason = `order_create_failed: ${gatewayMessage}`.slice(0, 500);
		console.error("[qropay] createQropayDepositImpl failed:", {
			depositId,
			userId,
			amountUsd: amount,
			amountInr: chargeAmount,
			error: gatewayMessage
		});
		await mktDb.from("advertiser_deposits").update({
			status: "failed",
			failure_reason: failureReason
		}).eq("id", depositId);
		throw new DepositError("ORDER_FAILED", `Couldn't create the payment order: ${gatewayMessage}`);
	}
	const { error: updErr } = await mktDb.from("advertiser_deposits").update({
		gateway_order_id: order.qropayOrderId,
		status: "pending"
	}).eq("id", depositId);
	if (updErr) throw new Error(`advertiser_deposits order update: ${updErr.message}`);
	return {
		depositId,
		paymentUrl: order.paymentUrl
	};
}
async function depositByOrder(orderId) {
	if (!orderId) return null;
	const { data, error } = await mktDb.from("advertiser_deposits").select("*").eq("gateway_order_id", orderId).maybeSingle();
	if (error) throw new Error(`advertiser_deposits by order: ${error.message}`);
	return data ?? null;
}
async function depositByPayment(paymentId) {
	if (!paymentId) return null;
	const { data, error } = await mktDb.from("advertiser_deposits").select("*").eq("gateway_payment_id", paymentId).maybeSingle();
	if (error) throw new Error(`advertiser_deposits by payment: ${error.message}`);
	return data ?? null;
}
/**
* The ONLY code path that credits or reverses advertiser deposits.
*
* - Verifies X-Razorpay-Signature over the raw body (RAZORPAY_WEBHOOK_SECRET).
* - payment.captured / order.paid → mkt_credit_deposit (idempotent: a retry
*   or the second of the two events returns already_credited).
* - payment.failed → pending → failed (guard-allowed transition; ignored if
*   the deposit already succeeded).
* - refund.created / refund.processed, payment.dispute.lost → mkt_reverse_deposit
*   keyed on the refund/dispute id (idempotent).
* - Anything else → acknowledged, no-op. Always answer 200 once the signature
*   verifies so Razorpay stops retrying; a bad signature is a 401.
*/
async function processRazorpayWebhook(rawBody, signature) {
	if (!verifyWebhookSignature(rawBody, signature)) return {
		ok: false,
		event: "?",
		action: "rejected_bad_signature",
		httpStatus: 401
	};
	let evt;
	try {
		evt = JSON.parse(rawBody);
	} catch {
		return {
			ok: false,
			event: "?",
			action: "rejected_bad_json",
			httpStatus: 400
		};
	}
	return {
		...await routeWebhookEvent(evt),
		httpStatus: 200
	};
}
async function routeWebhookEvent(evt) {
	const event = evt.event ?? "";
	const payment = evt.payload?.payment?.entity;
	if (event === "payment.captured" || event === "order.paid") {
		const orderId = payment?.order_id ?? evt.payload?.order?.entity?.id ?? null;
		const d = await depositByOrder(orderId) ?? await depositByPayment(payment?.id);
		if (!d) return {
			ok: true,
			event,
			action: "ignored_unknown_order",
			detail: { orderId }
		};
		if (payment && payment.status !== "captured") return {
			ok: true,
			event,
			action: "ignored_not_captured",
			depositId: d.id,
			detail: payment.status
		};
		const paymentId = payment?.id ?? d.gateway_payment_id;
		if (!paymentId) return {
			ok: true,
			event,
			action: "ignored_no_payment_id",
			depositId: d.id
		};
		if (payment && (payment.amount !== toMinor(num(d.charge_amount)) || payment.currency !== d.charge_currency)) {
			await mktDb.from("advertiser_deposits").update({ last_event: {
				event,
				payment_id: paymentId,
				mismatch: {
					amount: payment.amount,
					currency: payment.currency
				}
			} }).eq("id", d.id);
			console.error("[razorpay-webhook] amount mismatch", {
				depositId: d.id,
				expected: d.charge_amount,
				got: payment.amount
			});
			return {
				ok: true,
				event,
				action: "held_amount_mismatch",
				depositId: d.id
			};
		}
		const result = await mktRpc("mkt_credit_deposit", {
			p_deposit_id: d.id,
			p_gateway_payment_id: paymentId,
			p_event: {
				event,
				payment_id: paymentId,
				created_at: evt.created_at ?? null
			},
			p_confirmed_by: null
		});
		return {
			ok: true,
			event,
			action: result["credited"] ? "credited" : `noop_${String(result["reason"] ?? "")}`,
			depositId: d.id,
			detail: result
		};
	}
	if (event === "payment.failed") {
		const d = await depositByOrder(payment?.order_id);
		if (!d) return {
			ok: true,
			event,
			action: "ignored_unknown_order"
		};
		if (d.status !== "pending" && d.status !== "created") return {
			ok: true,
			event,
			action: "ignored_terminal",
			depositId: d.id
		};
		const { error } = await mktDb.from("advertiser_deposits").update({
			status: "failed",
			gateway_payment_id: payment?.id ?? null,
			failure_reason: [payment?.error_code, payment?.error_description].filter(Boolean).join(": ").slice(0, 500) || "payment_failed",
			last_event: {
				event,
				payment_id: payment?.id ?? null
			}
		}).eq("id", d.id).in("status", ["created", "pending"]);
		if (error) throw new Error(`advertiser_deposits fail update: ${error.message}`);
		return {
			ok: true,
			event,
			action: "marked_failed",
			depositId: d.id
		};
	}
	if (event === "refund.created" || event === "refund.processed" || event === "payment.dispute.lost") {
		const refund = evt.payload?.refund?.entity;
		const dispute = evt.payload?.dispute?.entity;
		const paymentId = refund?.payment_id ?? dispute?.payment_id ?? payment?.id ?? null;
		const d = await depositByPayment(paymentId);
		if (!d) return {
			ok: true,
			event,
			action: "ignored_unknown_payment",
			detail: { paymentId }
		};
		if (!d.credited_at) return {
			ok: true,
			event,
			action: "ignored_never_credited",
			depositId: d.id
		};
		const amountMinor = refund?.amount ?? dispute?.amount ?? toMinor(num(d.charge_amount));
		const amountUsd = Math.min(num(d.amount_usd), minorToUsd(amountMinor, num(d.fx_rate)));
		const key = refund?.id ?? dispute?.id ?? `${event}:${paymentId}`;
		try {
			const result = await mktRpc("mkt_reverse_deposit", {
				p_deposit_id: d.id,
				p_amount: amountUsd,
				p_reversal_key: key,
				p_reason: event,
				p_event: {
					event,
					refund_id: refund?.id ?? null,
					dispute_id: dispute?.id ?? null
				}
			});
			return {
				ok: true,
				event,
				action: result["reversed"] ? "reversed" : `noop_${String(result["reason"] ?? "")}`,
				depositId: d.id,
				detail: result
			};
		} catch (err) {
			if (err instanceof MktRpcError) return {
				ok: false,
				event,
				action: `reverse_failed_${err.code}`,
				depositId: d.id
			};
			throw err;
		}
	}
	return {
		ok: true,
		event,
		action: "ignored_event"
	};
}
/**
* Creates a campaign in draft status, then submits it for review.
* NOTE: mkt_create_campaign() doesn't exist - we INSERT then call mkt_submit_campaign_with_fee()
* CRITICAL: campaigns_guard trigger only allows INSERT of empty draft (advertiser_cost
* and fee_percent must be NULL). Pricing is set by mkt_submit_campaign.
*
* CAMPAIGN FEES: If fees_enabled=true, mkt_submit_campaign_with_fee charges the fee once
* before submitting, using pricing.ts for preflight validation.
*
* FEATURED PLACEMENT: If featured=true, charges the featured fee from advertiser balance
* atomically with campaign creation. Fee is calculated server-side only (never trust client).
*
* SLOTS-FIRST BUDGETING: Budget = slots × reward × (1 + platform_fee_percent/100).
* Server calculates budget; never trust client amounts.
*/
async function createCampaignImpl(userId, input) {
	const account = await getAccount(userId);
	if (!account) throw new DepositError("NOT_ADVERTISER", "Activate advertiser mode first.");
	if (account.status !== "active") throw new DepositError("ACCOUNT_RESTRICTED", "Your advertiser account cannot create campaigns.");
	if (!input.rulesAccepted) throw new DepositError("RULES_NOT_ACCEPTED", "You must accept the offer rules before creating a campaign.");
	if (input.verification === "auto") {
		if (!input.trackingUrl) throw new DepositError("TRACKING_URL_REQUIRED", "Tracking URL is required for auto verification.");
		if (!input.trackingUrl.includes("{click_id}")) throw new DepositError("INVALID_TRACKING_URL", "Tracking URL must contain {click_id} placeholder.");
	}
	const settings = await loadMarketplaceSettings();
	const featuredDays = input.featured && input.featuredDays ? input.featuredDays : 0;
	const featuredFee = featuredDays > 0 ? num(settings.featured_price_per_day) * featuredDays : 0;
	const totals = campaignTotals({
		slots: input.slots,
		reward: input.reward,
		feePercent: num(settings.platform_fee_percent),
		feesEnabled: settings.fees_enabled,
		feeUsd: num(settings.campaign_fee_usd),
		feeType: settings.campaign_fee_type,
		featuredFee
	});
	const spendable = Math.round((num(account.deposit_balance) + num(account.bonus_available)) * 100) / 100;
	if (!hasSufficientFunds({
		spendable,
		deposit: num(account.deposit_balance),
		totals
	})) throw new DepositError("INSUFFICIENT_FUNDS", `Not enough balance. Need $${totals.total.toFixed(2)} (campaign: $${totals.allocation.toFixed(2)}${totals.campaignFee > 0 ? `, fee: $${totals.campaignFee.toFixed(2)}` : ""}${totals.featuredFee > 0 ? `, featured: $${totals.featuredFee.toFixed(2)}` : ""}), have $${spendable.toFixed(2)}.`);
	if (input.subcategoryId) {
		const { data: subcat, error: subcatErr } = await mktDb.from("marketplace_subcategories").select("category_id").eq("id", input.subcategoryId).maybeSingle();
		if (subcatErr) throw new DepositError("INVALID_SUBCATEGORY", "Invalid subcategory.");
		if (!subcat || subcat.category_id !== input.categoryId) throw new DepositError("CATEGORY_MISMATCH", "Subcategory does not belong to the selected category.");
	}
	const maxCompletions = input.slots;
	totals.allocation;
	let postbackSecret;
	if (input.verification === "auto") postbackSecret = Array.from(crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(16))).map((b) => b.toString(16).padStart(2, "0")).join("");
	const campaignInsert = {
		advertiser_id: userId,
		type_key: "custom",
		name: input.title,
		summary: input.description.slice(0, 140),
		description: input.description,
		landing_url: input.landingUrl,
		steps: [{ text: "Complete the task" }],
		verification_mode: input.verification === "auto" ? "auto" : "manual_proof",
		countries: input.countries,
		devices: input.devices || [],
		eligibility_notes: input.eligibilityNote || null,
		starts_at: input.startsAt || null,
		ends_at: input.endsAt || null,
		publisher_reward: input.reward,
		max_completions: maxCompletions,
		proof_description: input.verification === "proof" && input.proofDescription ? input.proofDescription : "Please upload proof of completion",
		proof_min_images: input.verification === "proof" ? input.proofMinImages ?? 0 : 0,
		proof_max_images: input.verification === "proof" ? input.proofMaxImages ?? 3 : 3,
		proof_fields: input.verification === "proof" && input.proofFields ? input.proofFields : [],
		proof_mode: input.verification === "proof" && input.proofMode ? input.proofMode : null,
		category_id: input.categoryId,
		subcategory_id: input.subcategoryId || null,
		estimated_minutes: input.estimatedMinutes || null,
		...input.verification === "auto" ? { tracking_url: input.trackingUrl } : {},
		status: "draft"
	};
	const { data: campaign, error: insertError } = await mktDb.from("campaigns").insert(campaignInsert).select("id, status").single();
	if (insertError) throw new DepositError("CREATE_FAILED", `Failed to create campaign: ${insertError.message}`);
	if (input.verification === "auto" && postbackSecret) {
		const { error: secretError } = await mktDb.from("campaign_secrets").insert({
			campaign_id: campaign.id,
			auth_mode: "token",
			secret: postbackSecret,
			ip_allowlist: input.ipAllowlist || []
		});
		if (secretError) {
			await mktDb.from("campaigns").delete().eq("id", campaign.id);
			throw new DepositError("SECRET_FAILED", `Failed to store postback secret: ${secretError.message}`);
		}
	}
	if (input.verification === "proof" && (input.reviewWindow || input.proofExampleUrl || input.dailyLimit)) {
		const optionsData = { campaign_id: campaign.id };
		if (input.reviewWindow) optionsData.review_window_hours = input.reviewWindow;
		if (input.proofExampleUrl) optionsData.proof_example_url = input.proofExampleUrl;
		if (input.dailyLimit && input.dailyLimit <= maxCompletions) optionsData.daily_limit = input.dailyLimit;
		const { error: optionsError } = await mktDb.from("campaign_options").upsert(optionsData);
		if (optionsError) {
			await mktDb.from("campaigns").delete().eq("id", campaign.id);
			throw new DepositError("OPTIONS_FAILED", `Failed to store campaign options: ${optionsError.message}`);
		}
	}
	try {
		await mktRpc("mkt_submit_campaign_with_fee", {
			p_campaign_id: campaign.id,
			p_actor: userId
		});
	} catch (err) {
		if (err instanceof MktRpcError) throw new DepositError(err.code, humanMktError(err.code));
		throw err;
	}
	let featuredApplied = false;
	let featuredError;
	if (input.featured && input.featuredDays && input.featuredDays > 0) try {
		const featuredDays = Math.min(Math.max(input.featuredDays, 1), 30);
		await mktRpc("mkt_charge_featured", {
			p_campaign_id: campaign.id,
			p_days: featuredDays,
			p_actor: userId
		});
		featuredApplied = true;
	} catch (err) {
		try {
			if (err instanceof MktRpcError) featuredError = humanMktError(err.code);
			else featuredError = "Featured placement failed due to an unexpected error.";
		} catch {
			featuredError = "Featured placement failed.";
		}
	}
	const siteUrl = getSiteUrl();
	return {
		campaignId: campaign.id,
		status: "pending_review",
		...input.featured ? {
			featuredApplied: featuredApplied || void 0,
			featuredError: featuredError || void 0
		} : {},
		...postbackSecret ? {
			postbackUrl: `${siteUrl}/api/public/marketplace-postback?click_id={click_id}&token=${postbackSecret}&txn_id={transaction_id}`,
			postbackSecret
		} : {}
	};
}
async function campaignActionImpl(userId, campaignId, action) {
	try {
		switch (action) {
			case "submit": return await mktRpc("mkt_submit_campaign_with_fee", {
				p_campaign_id: campaignId,
				p_actor: userId
			});
			case "pause":
			case "resume":
			case "complete":
			case "archive": return await mktRpc("mkt_set_campaign_status", {
				p_campaign_id: campaignId,
				p_actor: userId,
				p_actor_role: "advertiser",
				p_target: action === "resume" ? "active" : action === "pause" ? "paused" : action === "complete" ? "completed" : "archived",
				p_reason: null
			});
		}
	} catch (err) {
		if (err instanceof MktRpcError) throw new DepositError(err.code, humanMktError(err.code));
		throw err;
	}
}
function humanMktError(code) {
	switch (code) {
		case "MKT_NOT_OWNER": return "That campaign isn't yours.";
		case "MKT_INVALID_STATUS": return "The campaign isn't in a state that allows this.";
		case "MKT_ADMIN_PAUSED": return "An admin paused this campaign — contact support to resume it.";
		case "MKT_INSUFFICIENT_FUNDS": return "Not enough Campaign Balance. Add funds first.";
		case "MKT_ADVERTISER_RESTRICTED":
		case "MKT_ADVERTISER_SUSPENDED": return "Your advertiser account is restricted. Contact support.";
		case "MKT_DUPLICATE_FEATURED": return "This campaign already has featured placement.";
		case "MKT_INVALID_FEATURED": return "Featured placement requires 1-30 days.";
		case "MKT_NO_ACCOUNT": return "Your advertiser account was not found.";
		case "MKT_DUPLICATE_FEE": return "This campaign fee has already been charged.";
		case "MKT_DAILY_LIMIT": return "Daily completion limit reached for this campaign.";
		default: return "That didn't work. Please try again.";
	}
}
/**
* Rotate postback secret for an auto-verified campaign.
* Only owner can rotate. Returns new secret (shown once).
*/
async function rotateCampaignSecretImpl(userId, campaignId) {
	const { data: campaign, error: campErr } = await mktDb.from("campaigns").select("advertiser_id, verification_mode").eq("id", campaignId).maybeSingle();
	if (campErr || !campaign) throw new DepositError("NOT_FOUND", "Campaign not found.");
	if (campaign.advertiser_id !== userId) throw new DepositError("NOT_OWNER", "That campaign isn't yours.");
	if (campaign.verification_mode !== "auto") throw new DepositError("NOT_AUTO", "Only auto-verified campaigns have postback secrets.");
	const newSecret = Array.from(crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(16))).map((b) => b.toString(16).padStart(2, "0")).join("");
	const { error: updateErr } = await mktDb.from("campaign_secrets").update({ secret: newSecret }).eq("campaign_id", campaignId);
	if (updateErr) throw new DepositError("UPDATE_FAILED", `Failed to rotate secret: ${updateErr.message}`);
	return {
		secret: newSecret,
		url: `${getSiteUrl()}/api/public/marketplace-postback?click_id={click_id}&token=${newSecret}&txn_id={transaction_id}`
	};
}
/**
* Handle campaign slot decrease with validation, refund, and audit logging.
* Must be called within a transaction context.
* 
* Rules:
* 1. New slots cannot go below consumed/reserved (approved submissions + pending reviews + active clicks)
* 2. Refund is processed through mkt__post with idempotency
* 3. Refund follows the funding source distribution from campaign_budget_tranches
* 4. Audit log entry is created
*/
async function handleSlotDecrease(adminId, campaign, newSlots) {
	const campaignId = campaign.id;
	const oldSlots = campaign.max_completions;
	const advertiserId = campaign.advertiser_id;
	const { data: usageData, error: usageErr } = await mktDb.rpc("mkt_campaign_slot_usage", { p_campaign_id: campaignId });
	if (usageErr) throw new DepositError("MKT_USAGE_CHECK_FAILED", `Failed to check slot usage: ${usageErr.message}`);
	const minAllowedSlots = usageData || 0;
	if (newSlots < minAllowedSlots) throw new DepositError("MKT_SLOTS_BELOW_MINIMUM", `Cannot decrease slots below ${minAllowedSlots}. Campaign has ${minAllowedSlots} slots already consumed or reserved (approved submissions, pending reviews, or active clicks).`);
	const totalRefund = (oldSlots - newSlots) * (campaign.publisher_reward * (1 + (campaign.fee_percent || 0) / 100));
	if (totalRefund <= 0) return;
	const { data: tranches, error: tranchesErr } = await mktDb.from("campaign_budget_tranches").select("id, funding, remaining, reserved").eq("campaign_id", campaignId).order("allocated_at");
	if (tranchesErr) throw new DepositError("MKT_TRANCHES_FETCH_FAILED", `Failed to fetch budget tranches: ${tranchesErr.message}`);
	let depositRefund = 0;
	let bonusRefund = 0;
	let remainingToRefund = totalRefund;
	for (const tranche of [...tranches || []].reverse()) {
		if (remainingToRefund <= 0) break;
		const trancheAvailable = tranche.remaining + tranche.reserved;
		const refundFromThisTranche = Math.min(remainingToRefund, trancheAvailable);
		if (tranche.funding === "deposit") depositRefund += refundFromThisTranche;
		else if (tranche.funding === "bonus") bonusRefund += refundFromThisTranche;
		remainingToRefund -= refundFromThisTranche;
		await mktDb.rpc("mkt__budget_move", {
			p_tranche: tranche.id,
			p_from: tranche.remaining >= refundFromThisTranche ? "remaining" : "reserved",
			p_to: "released",
			p_amount: refundFromThisTranche
		});
	}
	const idempotencyKey = `slot-decrease:${campaignId}:${crypto.randomUUID()}`;
	if (depositRefund > 0) await mktDb.rpc("mkt__post", {
		p_advertiser: advertiserId,
		p_kind: "slot_decrease_refund",
		p_bucket: "deposit",
		p_amount: depositRefund,
		p_delta: depositRefund,
		p_key: `${idempotencyKey}:deposit`,
		p_campaign: campaignId,
		p_description: `Refund from decreasing slots from ${oldSlots} to ${newSlots}`
	});
	if (bonusRefund > 0) await mktDb.rpc("mkt__post", {
		p_advertiser: advertiserId,
		p_kind: "slot_decrease_refund",
		p_bucket: "bonus_available",
		p_amount: bonusRefund,
		p_delta: bonusRefund,
		p_key: `${idempotencyKey}:bonus`,
		p_campaign: campaignId,
		p_description: `Refund from decreasing slots from ${oldSlots} to ${newSlots}`
	});
	await mktDb.from("campaign_slot_audit").insert({
		campaign_id: campaignId,
		editor_id: adminId,
		old_slots: oldSlots,
		new_slots: newSlots,
		amount_refunded: depositRefund + bonusRefund,
		min_allowed_slots: minAllowedSlots
	});
}
/**
* Edit an existing campaign. Allows editing content fields for draft/rejected/paused campaigns.
* Slots and reward can only be changed in draft status.
* If resubmit=true and status is draft/rejected, submits for review after editing.
*/
async function editCampaignImpl(userId, input) {
	if (!await getAccount(userId)) throw new DepositError("NOT_ADVERTISER", "Activate advertiser mode first.");
	const { data: campaign, error: fetchErr } = await mktDb.from("campaigns").select("*").eq("id", input.campaignId).single();
	if (fetchErr || !campaign) throw new DepositError("MKT_CAMPAIGN_NOT_FOUND", "Campaign not found.");
	if (campaign.advertiser_id !== userId) throw new DepositError("MKT_NOT_OWNER", "You don't own this campaign.");
	if (![
		"draft",
		"rejected",
		"paused"
	].includes(campaign.status)) throw new DepositError("MKT_WRONG_STATUS", "Campaign can only be edited in draft, rejected, or paused status.");
	const updates = {};
	if (input.title !== void 0) updates.name = input.title;
	if (input.description !== void 0) {
		updates.description = input.description;
		updates.summary = input.description.slice(0, 140);
	}
	if (input.landingUrl !== void 0) updates.landing_url = input.landingUrl;
	if (input.estimatedMinutes !== void 0) updates.estimated_minutes = input.estimatedMinutes;
	if (input.proofDescription !== void 0) updates.proof_description = input.proofDescription;
	if (input.proofMinImages !== void 0) updates.proof_min_images = input.proofMinImages;
	if (input.proofMaxImages !== void 0) updates.proof_max_images = input.proofMaxImages;
	if (input.proofFields !== void 0) updates.proof_fields = input.proofFields;
	if (input.proofMode !== void 0) updates.proof_mode = input.proofMode;
	if (input.trackingUrl !== void 0) updates.tracking_url = input.trackingUrl;
	if (input.ipAllowlist !== void 0) updates.ip_allowlist = input.ipAllowlist;
	if (input.startsAt !== void 0) updates.starts_at = input.startsAt;
	if (input.endsAt !== void 0) updates.ends_at = input.endsAt;
	if (input.devices !== void 0) updates.devices = input.devices;
	if (input.eligibilityNote !== void 0) updates.eligibility_notes = input.eligibilityNote;
	if (campaign.status === "draft") {
		if (input.reward !== void 0) updates.publisher_reward = input.reward;
		if (input.slots !== void 0 && input.slots !== campaign.max_completions) {
			if (input.slots < campaign.max_completions) {
				const { data: hasAdminRole } = await mktDb.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
				if (!hasAdminRole) throw new DepositError("MKT_ADMIN_REQUIRED", "Only administrators can decrease campaign slots.");
				await handleSlotDecrease(userId, campaign, input.slots);
			}
			updates.max_completions = input.slots;
		}
	} else if (input.reward !== void 0 || input.slots !== void 0) throw new DepositError("MKT_WRONG_STATUS", "Reward and slots can only be edited in draft status.");
	if (input.subcategoryId) {
		const categoryId = input.categoryId ?? campaign.category_id;
		const { data: subcat, error: subcatErr } = await mktDb.from("marketplace_subcategories").select("category_id").eq("id", input.subcategoryId).maybeSingle();
		if (subcatErr) throw new DepositError("INVALID_SUBCATEGORY", "Invalid subcategory.");
		if (!subcat || subcat.category_id !== categoryId) throw new DepositError("CATEGORY_MISMATCH", "Subcategory does not belong to the selected category.");
	}
	const optionsUpdates = {};
	let hasOptionsChanges = false;
	if (input.proofExampleUrl !== void 0) {
		optionsUpdates.proof_example_url = input.proofExampleUrl;
		hasOptionsChanges = true;
	}
	if (input.reviewWindow !== void 0) {
		optionsUpdates.review_window_hours = input.reviewWindow;
		hasOptionsChanges = true;
	}
	if (input.dailyLimit !== void 0) {
		optionsUpdates.daily_limit = input.dailyLimit;
		hasOptionsChanges = true;
	}
	if (hasOptionsChanges) {
		optionsUpdates.campaign_id = input.campaignId;
		optionsUpdates.updated_at = (/* @__PURE__ */ new Date()).toISOString();
		const { error: optionsErr } = await mktDb.from("campaign_options").upsert(optionsUpdates, { onConflict: "campaign_id" });
		if (optionsErr) throw new DepositError("UPDATE_FAILED", `Failed to update campaign options: ${optionsErr.message}`);
	}
	if (Object.keys(updates).length > 0) {
		updates.updated_at = (/* @__PURE__ */ new Date()).toISOString();
		const { error: updateErr } = await mktDb.from("campaigns").update(updates).eq("id", input.campaignId);
		if (updateErr) throw new DepositError("UPDATE_FAILED", `Failed to update campaign: ${updateErr.message}`);
	}
	let finalStatus = campaign.status;
	if (input.resubmit && (campaign.status === "draft" || campaign.status === "rejected")) try {
		finalStatus = (await mktRpc("mkt_submit_campaign_with_fee", {
			p_campaign_id: input.campaignId,
			p_actor: userId
		})).status || "pending_review";
	} catch (err) {
		if (err instanceof MktRpcError) throw new DepositError(err.code, humanMktError(err.code));
		throw err;
	}
	return {
		success: true,
		status: finalStatus
	};
}
async function listPendingReviewsImpl(userId) {
	const { data: submissions, error } = await mktDb.from("campaign_submissions").select(`
      id,
      campaign_id,
      user_id,
      proof_paths,
      field_values,
      user_note,
      auto_approve_at,
      created_at,
      campaigns!inner(
        name,
        publisher_reward,
        advertiser_id,
        proof_fields
      )
    `).eq("campaigns.advertiser_id", userId).eq("status", "pending").eq("requires_admin", false).order("auto_approve_at", { ascending: true });
	if (error) throw new Error(error.message);
	const result = [];
	for (const sub of submissions ?? []) {
		const signedUrls = [];
		for (const path of sub.proof_paths ?? []) {
			const { data: urlData } = await supabaseAdmin.storage.from("offer-proofs").createSignedUrl(path, 3600);
			if (urlData?.signedUrl) signedUrls.push(urlData.signedUrl);
		}
		result.push({
			id: sub.id,
			campaignId: sub.campaign_id,
			campaignName: sub.campaigns.name,
			publisherReward: num(sub.campaigns.publisher_reward),
			proofFields: sub.campaigns.proof_fields || [],
			proofUrls: signedUrls,
			fieldValues: sub.field_values || {},
			userNote: sub.user_note,
			autoApproveAt: sub.auto_approve_at,
			createdAt: sub.created_at
		});
	}
	return result;
}
async function reviewSubmissionImpl(userId, submissionId, decision, reason) {
	const { data: submission, error: subErr } = await mktDb.from("campaign_submissions").select(`
      campaign_id,
      publisher_id,
      publisher_reward,
      campaigns!inner(advertiser_id, name)
    `).eq("id", submissionId).maybeSingle();
	if (subErr || !submission) throw new DepositError("NOT_FOUND", "Submission not found.");
	if (submission.campaigns.advertiser_id !== userId) throw new DepositError("NOT_OWNER", "That submission isn't for your campaign.");
	if (decision === "rejected" && (!reason || reason.trim().length < 10)) throw new DepositError("REASON_REQUIRED", "Rejection reason must be at least 10 characters.");
	try {
		await mktRpc("mkt_decide_submission", {
			p_submission_id: submissionId,
			p_actor: userId,
			p_role: "advertiser",
			p_decision: decision,
			p_reason: decision === "rejected" ? reason : null
		});
	} catch (err) {
		if (err instanceof MktRpcError) {
			if (err.code === "MKT_ADMIN_DECISION_REQUIRED") throw new DepositError("ADMIN_REVIEW_REQUIRED", "This submission requires admin review and cannot be decided by the advertiser.");
			else if (err.code === "MKT_INVALID_STATUS") throw new DepositError("ALREADY_DECIDED", "This submission has already been reviewed.");
			throw new DepositError(err.code, humanMktError(err.code));
		}
		throw err;
	}
}
/**
* Add budget (slots) to an existing active or paused campaign.
* Uses mkt_add_budget RPC which allocates budget from advertiser balance
* at current pricing and creates new tranches.
*/
async function addCampaignBudgetImpl(userId, input) {
	try {
		await mktRpc("mkt_add_budget", {
			p_campaign_id: input.campaignId,
			p_actor: userId,
			p_completions: input.additionalSlots
		});
		return { success: true };
	} catch (err) {
		if (err instanceof MktRpcError) throw new DepositError(err.code, humanMktError(err.code));
		throw err;
	}
}
var LEDGER_LABEL;
var CAMPAIGN_COLS;
var becomeAdvertiserInput;
var updateAdvertiserProfileInput;
var DepositError;
var toMinor;
var minorToUsd;
var createCampaignInput;
var editCampaignInput;
var addCampaignBudgetInput;
var init_advertiser_server = __esmMin((() => {
	init_db_server();
	init_pricing();
	init_razorpay_server();
	init_client_server();
	LEDGER_LABEL = {
		deposit: "Campaign Deposit",
		deposit_reversal: "Deposit Reversed",
		first_deposit_bonus: "First Deposit Bonus",
		first_deposit_bonus_reversal: "Bonus Reversed",
		bonus_unlock: "Bonus Unlocked",
		bonus_forfeit: "Bonus Forfeited",
		campaign_allocation: "Campaign Budget",
		campaign_release: "Budget Returned",
		conversion_charge: "Conversion Charge",
		adjustment: "Adjustment",
		earnings_transfer: "Transferred from earnings"
	};
	CAMPAIGN_COLS = "id, advertiser_id, type_key, name, summary, verification_mode, countries, publisher_reward, advertiser_cost, max_completions, completions_count, budget_allocated, budget_remaining, budget_reserved, budget_spent, budget_released, status, paused_by, needs_review, review_note, created_at, activated_at";
	becomeAdvertiserInput = objectType({
		displayName: stringType().trim().min(2).max(60),
		contactEmail: stringType().trim().email().max(254).nullable().optional(),
		websiteUrl: stringType().trim().max(500).regex(/^https?:\/\//, "Must start with http:// or https://").nullable().optional(),
		acceptTerms: literalType(true)
	});
	updateAdvertiserProfileInput = becomeAdvertiserInput.omit({ acceptTerms: true });
	DepositError = class extends Error {
		code;
		constructor(code, message) {
			super(message);
			this.name = "DepositError";
			this.code = code;
		}
	};
	toMinor = (amount) => Math.round(amount * 100);
	minorToUsd = (minor, fxRate) => Math.round(minor / 100 / fxRate * 100) / 100;
	createCampaignInput = objectType({
		title: stringType().trim().min(3).max(80),
		description: stringType().trim().min(10).max(1e3),
		verification: enumType(["auto", "proof"]),
		reward: numberType().positive().min(.05).max(1e3),
		slots: numberType().int().min(15).max(1e5),
		countries: arrayType(stringType().trim().toUpperCase().refine((value) => /^[A-Z]{2}$/.test(value) || [
			"*",
			"ALL",
			"WW"
		].includes(value), "Countries must be ISO-2 codes")).max(20).transform((values) => values.some((value) => [
			"*",
			"ALL",
			"WW"
		].includes(value)) ? [] : values),
		categoryId: stringType().uuid(),
		subcategoryId: stringType().uuid().optional(),
		landingUrl: stringType().trim().url().max(2048).regex(/^https:\/\//, "Must be an HTTPS URL"),
		estimatedMinutes: numberType().int().min(1).max(1440).optional(),
		featured: booleanType().optional(),
		featuredDays: numberType().int().min(1).max(30).optional(),
		trackingUrl: stringType().trim().url().max(2048).regex(/^https:\/\//, "Must be an HTTPS URL").optional(),
		ipAllowlist: arrayType(stringType()).max(50).optional(),
		proofDescription: stringType().trim().min(10).max(500).optional(),
		proofMode: enumType([
			"screenshot",
			"text",
			"both",
			"either"
		]).optional(),
		proofMinImages: numberType().int().min(0).max(5).optional(),
		proofMaxImages: numberType().int().min(1).max(5).optional(),
		proofFields: arrayType(objectType({
			key: stringType().regex(/^[a-z0-9_]+$/, "Field keys must be lowercase a-z, 0-9, and _").max(50),
			label: stringType().trim().min(2).max(60),
			required: booleanType(),
			maxLen: numberType().int().min(10).max(500)
		})).max(5).optional(),
		reviewWindow: numberType().int().min(1).max(720),
		devices: arrayType(enumType([
			"android",
			"ios",
			"desktop"
		])).min(0).max(3),
		proofExampleUrl: stringType().url().optional(),
		startsAt: stringType().datetime().optional(),
		endsAt: stringType().datetime().optional(),
		eligibilityNote: stringType().trim().max(300).optional(),
		dailyLimit: numberType().int().min(1).optional(),
		rulesAccepted: booleanType()
	}).refine((data) => {
		if (data.verification === "proof") {
			if (!data.proofDescription) return false;
			if (!data.reviewWindow) return false;
			if (data.devices === void 0 || data.devices === null) return false;
			const hasImages = (data.proofMinImages ?? 0) >= 1;
			const hasFields = (data.proofFields?.length ?? 0) > 0;
			if (!hasImages && !hasFields) return false;
			if ((data.proofMaxImages ?? 3) < (data.proofMinImages ?? 1)) return false;
			if (data.proofFields && data.proofFields.length > 0) {
				const keys = data.proofFields.map((f) => f.key);
				if (new Set(keys).size !== keys.length) return false;
			}
		}
		if (data.startsAt && data.endsAt && new Date(data.endsAt) <= new Date(data.startsAt)) return false;
		return true;
	}, { message: "Invalid proof configuration: ensure proofDescription is provided, at least one proof method (images or fields), no duplicate field keys, max >= min images, and end date after start date" });
	editCampaignInput = objectType({
		campaignId: stringType().uuid(),
		title: stringType().trim().min(3).max(80).optional(),
		description: stringType().trim().min(10).max(1e3).optional(),
		landingUrl: stringType().trim().url().max(2048).regex(/^https:\/\//, "Must be an HTTPS URL").optional(),
		estimatedMinutes: numberType().int().min(1).max(1440).optional().nullable(),
		proofDescription: stringType().trim().min(10).max(500).optional(),
		proofMode: enumType([
			"screenshot",
			"text",
			"both",
			"either"
		]).optional().nullable(),
		proofMinImages: numberType().int().min(0).max(5).optional(),
		proofMaxImages: numberType().int().min(1).max(5).optional(),
		proofFields: arrayType(objectType({
			key: stringType().regex(/^[a-z0-9_]+$/, "Field keys must be lowercase a-z, 0-9, and _").max(50),
			label: stringType().trim().min(2).max(60),
			required: booleanType(),
			maxLen: numberType().int().min(10).max(500)
		})).max(5).optional(),
		proofExampleUrl: stringType().url().optional().nullable(),
		trackingUrl: stringType().trim().url().max(2048).regex(/^https:\/\//, "Must be an HTTPS URL").optional(),
		ipAllowlist: arrayType(stringType()).max(50).optional().nullable(),
		startsAt: stringType().datetime().optional().nullable(),
		endsAt: stringType().datetime().optional().nullable(),
		devices: arrayType(enumType([
			"android",
			"ios",
			"desktop"
		])).max(3).optional().nullable(),
		eligibilityNote: stringType().trim().max(300).optional().nullable(),
		dailyLimit: numberType().int().min(1).optional().nullable(),
		reviewWindow: numberType().int().min(1).max(720).optional().nullable(),
		categoryId: stringType().uuid().optional(),
		subcategoryId: stringType().uuid().optional().nullable(),
		reward: numberType().positive().min(.05).max(1e3).optional(),
		slots: numberType().int().min(15).max(1e5).optional(),
		resubmit: booleanType().default(false)
	});
	addCampaignBudgetInput = objectType({
		campaignId: stringType().uuid(),
		additionalSlots: numberType().int().min(1).max(1e4)
	});
}));
//#endregion
export { init_advertiser_server as a, mktDb as c, campaignTotals as i, mktRpc as l, advertiser_server_DyvSoHf7_exports as n, init_db_server as o, advertiser_server_exports as r, init_pricing as s, MktRpcError as t, num as u };
