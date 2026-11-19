import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
import { t as logAutomation } from "./logs.server-DbNT75_y.mjs";
import { i as payReferralMilestone, n as creditSdkConversionRpc } from "./coinquest.server-CBcexWIA.mjs";
import { t as convertSdkCurrency } from "./types-D8DUDHOE.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/retry.server-BcC6lDrz.js
init_client_server();
/**
* Re-processes a conversion that failed to credit (e.g. transient wallet error).
* Never re-credits an already credited conversion.
*/
async function retryConversionImpl(conversionId) {
	const { data: conversion, error } = await supabaseAdmin.from("sdk_offerwall_conversions").select("*").eq("id", conversionId).maybeSingle();
	if (error) throw error;
	if (!conversion) throw new Error("Conversion not found");
	if (conversion.status === "credited") return {
		ok: false,
		status: "credited",
		reason: "already_credited"
	};
	if (conversion.status === "duplicate") return {
		ok: false,
		status: "duplicate",
		reason: "duplicate"
	};
	if (!conversion.user_id) return {
		ok: false,
		status: "rejected",
		reason: "user_not_found"
	};
	const provider = (await supabaseAdmin.from("sdk_offerwall_providers").select("*").eq("id", conversion.provider_id).maybeSingle()).data;
	if (!provider) return {
		ok: false,
		status: "rejected",
		reason: "unknown_provider"
	};
	const reward = convertSdkCurrency(provider, Number(conversion.currency_amount) || 0);
	if (reward <= 0) return {
		ok: false,
		status: "rejected",
		reason: "zero_reward"
	};
	let credit;
	try {
		credit = await creditSdkConversionRpc({
			conversionId: conversion.id,
			reward,
			description: `${provider.name} offerwall reward (retry)`,
			allowRetry: true
		});
	} catch (err) {
		await logAutomation({
			eventType: "wallet_credit",
			status: "error",
			source: provider.slug,
			providerId: provider.id,
			userId: conversion.user_id,
			referenceId: conversion.id,
			message: err instanceof Error ? err.message : "Retry wallet credit failed"
		});
		return {
			ok: false,
			status: "rejected",
			reason: "wallet_credit_failed"
		};
	}
	if (!credit.credited) {
		if (credit.reason === "already_credited") return {
			ok: false,
			status: "credited",
			reason: "already_credited"
		};
		if (credit.reason === "duplicate") return {
			ok: false,
			status: "duplicate",
			reason: "duplicate"
		};
		return {
			ok: false,
			status: "rejected",
			reason: credit.reason ?? "not_creditable"
		};
	}
	await logAutomation({
		eventType: "wallet_credit",
		status: "success",
		source: provider.slug,
		providerId: provider.id,
		userId: conversion.user_id,
		referenceId: conversion.id,
		message: `Retry credited $${credit.reward.toFixed(2)} from ${provider.name}`,
		context: { reward: credit.reward }
	});
	try {
		await payReferralMilestone(conversion.user_id, "earning", "Referral: friend's first earning");
	} catch {}
	return {
		ok: true,
		status: "credited",
		reward: credit.reward
	};
}
//#endregion
export { retryConversionImpl };
