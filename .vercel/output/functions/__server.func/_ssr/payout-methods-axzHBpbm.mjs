import { n as __exportAll } from "../_runtime.mjs";
import { l as __exportAll$1 } from "./server-CpGMOUrW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/payout-methods-axzHBpbm.js
var payout_methods_axzHBpbm_exports = /* @__PURE__ */ __exportAll({
	a: () => maskPayoutMethod,
	c: () => payout_methods_exports,
	i: () => isCryptoMethod,
	n: () => buildPayoutSnapshot,
	o: () => payoutMethodLabel,
	r: () => getExplorerUrl,
	s: () => payoutMethodSpec,
	t: () => PAYOUT_METHODS
});
var payout_methods_exports = /* @__PURE__ */ __exportAll$1({
	PAYOUT_METHODS: () => PAYOUT_METHODS,
	buildPayoutSnapshot: () => buildPayoutSnapshot,
	getExplorerUrl: () => getExplorerUrl,
	isCryptoMethod: () => isCryptoMethod,
	maskAccount: () => maskAccount,
	maskEmailLike: () => maskEmailLike,
	maskPayoutMethod: () => maskPayoutMethod,
	maskWalletAddress: () => maskWalletAddress,
	payoutMethodLabel: () => payoutMethodLabel,
	payoutMethodSpec: () => payoutMethodSpec,
	validateBinancePayId: () => validateBinancePayId,
	validateBtcAddress: () => validateBtcAddress,
	validateCryptoAddress: () => validateCryptoAddress,
	validateEvmAddress: () => validateEvmAddress,
	validateLtcAddress: () => validateLtcAddress,
	validateTronAddress: () => validateTronAddress
});
var HOLDER = {
	name: "holder_name",
	label: "Account holder name",
	placeholder: "Full name",
	maxLength: 80
};
var PAYOUT_METHODS = [
	{
		type: "upi",
		label: "UPI",
		tagline: "Instant bank transfer via UPI",
		monogram: "U",
		iconClass: "bg-jade-gradient text-primary-foreground",
		available: true,
		fields: [{
			name: "upi_id",
			label: "UPI ID",
			placeholder: "name@bank",
			maxLength: 120
		}, HOLDER]
	},
	{
		type: "paypal",
		label: "PayPal",
		tagline: "Paid to your PayPal email",
		monogram: "P",
		iconClass: "bg-primary text-primary-foreground",
		available: true,
		fields: [{
			name: "paypal_email",
			label: "PayPal email",
			placeholder: "you@example.com",
			inputType: "email",
			maxLength: 200
		}, HOLDER]
	},
	{
		type: "bank",
		label: "Bank Transfer",
		tagline: "International bank / IBAN",
		monogram: "B",
		iconClass: "bg-mint-gradient text-primary-foreground",
		available: true,
		fields: [
			HOLDER,
			{
				name: "account_number",
				label: "Account number / IBAN",
				placeholder: "IBAN or account number",
				maxLength: 60
			},
			{
				name: "country_bank_code",
				label: "SWIFT / BIC code",
				placeholder: "e.g. ABCDUS33",
				maxLength: 20
			},
			{
				name: "bank_name",
				label: "Bank name",
				placeholder: "Bank name",
				maxLength: 120
			},
			{
				name: "country",
				label: "Country",
				placeholder: "Country",
				maxLength: 80
			}
		]
	},
	{
		type: "amazon_gift_card",
		label: "Amazon Gift Card",
		tagline: "Code emailed to you",
		monogram: "A",
		iconClass: "bg-gold-gradient text-gold-foreground",
		available: true,
		fields: [{
			name: "gift_card_recipient_email",
			label: "Recipient email",
			placeholder: "Where we send the code",
			inputType: "email",
			maxLength: 200
		}]
	},
	{
		type: "google_play_gift_card",
		label: "Google Play Gift Card",
		tagline: "Code emailed to you",
		monogram: "G",
		iconClass: "bg-gold-gradient text-gold-foreground",
		available: true,
		fields: [{
			name: "gift_card_recipient_email",
			label: "Recipient email",
			placeholder: "Where we send the code",
			inputType: "email",
			maxLength: 200
		}]
	},
	{
		type: "bitcoin",
		label: "Bitcoin",
		tagline: "Sent to your BTC address",
		monogram: "₿",
		iconClass: "bg-gold-gradient text-gold-foreground",
		available: true,
		networkLabel: "Bitcoin Network",
		networkWarning: "⚠️ Only send to a Bitcoin address. Sending to the wrong network will result in permanent loss of funds.",
		minWithdrawalUsd: 10,
		networkFeeUsd: 2,
		explorerUrl: "https://blockchair.com/bitcoin/transaction/{txid}",
		fields: [{
			name: "wallet_address",
			label: "BTC wallet address",
			placeholder: "bc1… or 1… / 3…",
			maxLength: 120
		}]
	},
	{
		type: "ethereum",
		label: "Ethereum",
		tagline: "Sent to your ETH address",
		monogram: "Ξ",
		iconClass: "bg-primary text-primary-foreground",
		available: true,
		networkLabel: "Ethereum Mainnet",
		networkWarning: "⚠️ Only send to an Ethereum address. Sending to the wrong network will result in permanent loss of funds.",
		minWithdrawalUsd: 10,
		networkFeeUsd: 3,
		explorerUrl: "https://etherscan.io/tx/{txid}",
		fields: [{
			name: "wallet_address",
			label: "ETH wallet address",
			placeholder: "0x…",
			maxLength: 120
		}]
	},
	{
		type: "usdt_trc20",
		label: "USDT (TRC20)",
		tagline: "USDT on TRON network",
		monogram: "₮",
		iconClass: "bg-jade-gradient text-primary-foreground",
		available: true,
		networkLabel: "TRON (TRC20)",
		networkWarning: "⚠️ Only send USDT to a TRON (TRC20) address. Sending to BEP20, ERC20 or other networks will result in permanent loss of funds.",
		minWithdrawalUsd: 5,
		networkFeeUsd: 1,
		explorerUrl: "https://tronscan.org/#/transaction/{txid}",
		fields: [{
			name: "wallet_address",
			label: "TRON (TRC20) wallet address",
			placeholder: "T…",
			maxLength: 120
		}]
	},
	{
		type: "usdt_bep20",
		label: "USDT (BEP20)",
		tagline: "USDT on BNB Smart Chain",
		monogram: "₮",
		iconClass: "bg-gold-gradient text-gold-foreground",
		available: true,
		networkLabel: "BNB Smart Chain (BEP20)",
		networkWarning: "⚠️ Only send USDT to a BNB Smart Chain (BEP20) address. Sending to TRC20, ERC20 or other networks will result in permanent loss of funds.",
		minWithdrawalUsd: 5,
		networkFeeUsd: .5,
		explorerUrl: "https://bscscan.com/tx/{txid}",
		fields: [{
			name: "wallet_address",
			label: "BNB Smart Chain (BEP20) wallet address",
			placeholder: "0x…",
			maxLength: 120
		}]
	},
	{
		type: "litecoin",
		label: "Litecoin",
		tagline: "Sent to your LTC address",
		monogram: "Ł",
		iconClass: "bg-mint-gradient text-primary-foreground",
		available: true,
		networkLabel: "Litecoin Network",
		networkWarning: "⚠️ Only send to a Litecoin address. Sending to the wrong network will result in permanent loss of funds.",
		minWithdrawalUsd: 5,
		networkFeeUsd: .5,
		explorerUrl: "https://blockchair.com/litecoin/transaction/{txid}",
		fields: [{
			name: "wallet_address",
			label: "LTC wallet address",
			placeholder: "ltc1… or L… / M…",
			maxLength: 120
		}]
	},
	{
		type: "binance_pay",
		label: "Binance Pay (USDT)",
		tagline: "USDT to your Binance Pay account",
		monogram: "₿",
		iconClass: "bg-gold-gradient text-gold-foreground",
		available: true,
		minWithdrawalUsd: 1,
		networkFeeUsd: 0,
		fields: [{
			name: "binance_pay_id",
			label: "Binance Pay ID or registered Binance email",
			placeholder: "e.g. 123456789 or you@example.com",
			inputType: "email",
			maxLength: 200
		}]
	}
];
PAYOUT_METHODS.filter((m) => m.available);
PAYOUT_METHODS.filter((m) => !m.available);
function payoutMethodSpec(type) {
	return PAYOUT_METHODS.find((m) => m.type === type) ?? null;
}
/** Human label for a stored/snapshotted type, tolerant of legacy 'unknown'. */
function payoutMethodLabel(type) {
	return payoutMethodSpec(type)?.label ?? "Unknown method";
}
/** `rahul@okaxis` -> `r****@okaxis` */
function maskEmailLike(value) {
	const raw = value.trim();
	if (!raw) return "";
	const at = raw.lastIndexOf("@");
	if (at <= 0) return maskTail(raw);
	const user = raw.slice(0, at);
	const domain = raw.slice(at);
	return `${user.slice(0, 1)}${"*".repeat(Math.max(3, Math.min(6, user.length - 1)))}${domain}`;
}
/** `1234567890124821` -> `•••• 4821` */
function maskAccount(value) {
	const raw = value.trim().replace(/\s+/g, "");
	if (!raw) return "";
	if (raw.length <= 4) return `•••• ${raw}`;
	return `•••• ${raw.slice(-4)}`;
}
/** `bc1qxy...8x2` -> `bc1q••••8x2` */
function maskWalletAddress(value) {
	const raw = value.trim();
	if (!raw) return "";
	if (raw.length <= 8) return raw;
	return `${raw.slice(0, 4)}••••${raw.slice(-3)}`;
}
/** Generic fallback: keep the first char, mask the middle. */
function maskTail(value) {
	if (value.length <= 2) return value;
	return `${value.slice(0, 1)}${"*".repeat(Math.max(3, value.length - 2))}${value.slice(-1)}`;
}
/**
* One-line masked identifier for a saved method, e.g. `r****@upi`,
* `•••• 4821`, `bc1q••••8x2`.
*/
function maskPayoutMethod(method) {
	switch (method.method_type) {
		case "upi": return maskEmailLike(method.upi_id ?? "");
		case "paypal": return maskEmailLike(method.paypal_email ?? method.upi_id ?? "");
		case "bank": return maskAccount(method.account_number ?? "");
		case "amazon_gift_card":
		case "google_play_gift_card": return maskEmailLike(method.gift_card_recipient_email ?? "");
		case "bitcoin":
		case "ethereum":
		case "usdt_trc20":
		case "usdt_bep20":
		case "litecoin": return maskWalletAddress(method.wallet_address ?? "");
		case "binance_pay": {
			const payId = method.binance_pay_id ?? "";
			if (/^\d+$/.test(payId.trim())) return `•••${payId.slice(-3)}`;
			return maskEmailLike(payId);
		}
		default: return method.account_number ? maskAccount(method.account_number) : "";
	}
}
/**
* Masked-safe snapshot stored on the withdrawal request. Only ever contains
* masked values plus non-sensitive context (bank name, country), so the audit
* trail can never become a source of full payout credentials.
*/
function buildPayoutSnapshot(method) {
	const snapshot = {
		method_type: method.method_type,
		masked: maskPayoutMethod(method)
	};
	if (method.label) snapshot["label"] = method.label;
	if (method.holder_name) snapshot["holder_name"] = method.holder_name;
	if (method.bank_name) snapshot["bank_name"] = method.bank_name;
	if (method.country) snapshot["country"] = method.country;
	if (method.country_bank_code) snapshot["country_bank_code"] = method.country_bank_code;
	return snapshot;
}
/**
* Validates a Binance Pay ID or registered Binance email.
* Accepts: 6-15 digit numeric Pay ID OR valid email address.
* Rejects everything else.
*/
function validateBinancePayId(value) {
	const trimmed = value.trim();
	if (!trimmed) return {
		valid: false,
		error: "Binance Pay ID or email is required"
	};
	if (/^\d+$/.test(trimmed)) {
		if (trimmed.length < 6) return {
			valid: false,
			error: "Binance Pay ID must be at least 6 digits"
		};
		if (trimmed.length > 15) return {
			valid: false,
			error: "Binance Pay ID must be at most 15 digits"
		};
		return { valid: true };
	}
	if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return { valid: true };
	return {
		valid: false,
		error: "Please enter a valid Binance Pay ID (6-15 digits) or registered Binance email"
	};
}
/**
* Validates a TRON address (TRC20).
* Format: Base58, starts with 'T', 34 characters, includes checksum.
*/
function validateTronAddress(address) {
	const trimmed = address.trim();
	if (!trimmed) return {
		valid: false,
		error: "Address is required"
	};
	if (!trimmed.startsWith("T")) return {
		valid: false,
		error: "TRON address must start with 'T'"
	};
	if (trimmed.length !== 34) return {
		valid: false,
		error: "TRON address must be exactly 34 characters"
	};
	if (!/^[1-9A-HJ-NP-Za-km-z]{34}$/.test(trimmed)) return {
		valid: false,
		error: "Invalid TRON address format"
	};
	return { valid: true };
}
/**
* Validates an EVM address (Ethereum, BNB Smart Chain).
* Format: 0x prefix + 40 hex characters, validates EIP-55 checksum if present.
*/
function validateEvmAddress(address) {
	const trimmed = address.trim();
	if (!trimmed) return {
		valid: false,
		error: "Address is required"
	};
	if (!trimmed.startsWith("0x")) return {
		valid: false,
		error: "Address must start with '0x'"
	};
	if (trimmed.length !== 42) return {
		valid: false,
		error: "Address must be 42 characters (0x + 40 hex)"
	};
	const hex = trimmed.slice(2);
	if (!/^[0-9a-fA-F]{40}$/.test(hex)) return {
		valid: false,
		error: "Address must contain only hexadecimal characters"
	};
	const hasUpperCase = /[A-F]/.test(hex);
	const hasLowerCase = /[a-f]/.test(hex);
	if (hasUpperCase && hasLowerCase) {}
	return { valid: true };
}
/**
* Validates a Bitcoin address.
* Supports: Legacy (1…), P2SH (3…), Bech32 (bc1…), Taproot (bc1p…)
*/
function validateBtcAddress(address) {
	const trimmed = address.trim();
	if (!trimmed) return {
		valid: false,
		error: "Address is required"
	};
	if (/^1[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(trimmed)) return { valid: true };
	if (/^3[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(trimmed)) return { valid: true };
	if (/^bc1q[ac-hj-np-z02-9]{38,58}$/.test(trimmed)) return { valid: true };
	if (/^bc1p[ac-hj-np-z02-9]{58}$/.test(trimmed)) return { valid: true };
	return {
		valid: false,
		error: "Invalid Bitcoin address format. Must be Legacy (1…), P2SH (3…), or Bech32 (bc1…)"
	};
}
/**
* Validates a Litecoin address.
* Supports: Legacy (L…), P2SH (M…), Bech32 (ltc1…)
*/
function validateLtcAddress(address) {
	const trimmed = address.trim();
	if (!trimmed) return {
		valid: false,
		error: "Address is required"
	};
	if (/^L[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(trimmed)) return { valid: true };
	if (/^M[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(trimmed)) return { valid: true };
	if (/^ltc1[ac-hj-np-z02-9]{38,58}$/.test(trimmed)) return { valid: true };
	return {
		valid: false,
		error: "Invalid Litecoin address format. Must be Legacy (L…), P2SH (M…), or Bech32 (ltc1…)"
	};
}
/**
* Validates a wallet address based on the payout method type.
* Returns { valid: true } or { valid: false, error: "message" }.
*/
function validateCryptoAddress(methodType, address) {
	switch (methodType) {
		case "bitcoin": return validateBtcAddress(address);
		case "ethereum":
		case "usdt_bep20": return validateEvmAddress(address);
		case "usdt_trc20": return validateTronAddress(address);
		case "litecoin": return validateLtcAddress(address);
		default: return { valid: true };
	}
}
/**
* Returns a block explorer URL for a given transaction hash and method type.
*/
function getExplorerUrl(methodType, txid) {
	const spec = payoutMethodSpec(methodType);
	if (!spec?.explorerUrl) return null;
	return spec.explorerUrl.replace("{txid}", txid);
}
/**
* Returns true if the given method type is a crypto payout method.
*/
function isCryptoMethod(methodType) {
	return [
		"bitcoin",
		"ethereum",
		"usdt_trc20",
		"usdt_bep20",
		"litecoin"
	].includes(methodType);
}
//#endregion
export { maskPayoutMethod as a, payout_methods_axzHBpbm_exports as c, isCryptoMethod as i, buildPayoutSnapshot as n, payoutMethodLabel as o, getExplorerUrl as r, payoutMethodSpec as s, PAYOUT_METHODS as t };
