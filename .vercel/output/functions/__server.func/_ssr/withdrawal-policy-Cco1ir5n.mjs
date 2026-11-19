import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { a as Strong, i as PolicyLayout, n as LI, o as UL, r as P, t as Callout } from "./-policy-layout-DTdazFY-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/withdrawal-policy-Cco1ir5n.js
var import_jsx_runtime = require_jsx_runtime();
var LAST_UPDATED = "January 15, 2026";
var SIBLINGS = [
	{
		href: "/legal/terms",
		label: "Terms of Service"
	},
	{
		href: "/legal/privacy",
		label: "Privacy Policy"
	},
	{
		href: "/legal/referral-terms",
		label: "Referral Terms"
	}
];
var SECTIONS = [
	{
		id: "limits",
		title: "Withdrawal limits &amp; eligibility",
		body: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(UL, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LI, { children: [
				"Minimum withdrawal amounts range from ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Strong, { children: "$5 to $35" }),
				" depending on regional dynamics and geo-location settings."
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LI, { children: "Users must reach the exact minimum threshold visible in their personal app dashboard to unlock the cashout request button." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LI, { children: [
				"Daily maximum withdrawal limit is capped at ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Strong, { children: "$100 per user account" }),
				"."
			] })
		] })
	},
	{
		id: "timelines",
		title: "Processing timelines &amp; status",
		body: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(P, { children: [
				"Standard Payouts are ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Strong, { children: "INSTANTLY" }),
				" processed directly to your account. In cases of high network traffic or server load, processing may take up to",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Strong, { children: "24 hours" }),
				"."
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(P, { children: "Status meanings:" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(UL, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LI, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Strong, { children: "Instant / Processing" }), " — System routing transaction to your account."] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LI, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Strong, { children: "Queued / Pending" }), " — Delayed due to high server traffic (resolves within 24 hours)."] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LI, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Strong, { children: "Completed" }), " — Funds successfully transferred."] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LI, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Strong, { children: "Rejected" }), " — Account flagged for policy violation or invalid wallet / email details."] })
			] })
		] })
	},
	{
		id: "methods",
		title: "Supported payout methods",
		body: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(UL, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LI, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Strong, { children: "PayPal" }), " — Minimum $5 - $35 (depends on region). Account email must match payout email."] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LI, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Strong, { children: "Crypto (USDT / Litecoin)" }), " — Minimum $10 - $35. Network transaction fees may be deducted automatically."] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LI, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Strong, { children: "Gift Cards (Amazon, Google Play)" }), " — Minimum $5 - $25 (subject to regional inventory availability)."] })
		] })
	},
	{
		id: "rejections",
		title: "Payout rejections &amp; disqualifications",
		body: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(UL, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LI, { children: [
				"Payouts will fail or be permanently cancelled if the user's account is detected using",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Strong, { children: "VPN, Proxy, Emulators, or Multiple Accounts" }),
				" on a single device."
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LI, { children: "Incorrect payment details (e.g., wrong PayPal email or invalid crypto address) will result in payment failure, and fees may not be refundable." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LI, { children: [
				"Unclaimed gift card codes expire after ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Strong, { children: "30 days" }),
				" of issuance."
			] })
		] })
	},
	{
		id: "fees",
		title: "Fees",
		body: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Callout, {
				tone: "warn",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(P, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Strong, { children: "Platform fee." }),
					" A ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Strong, { children: "10% platform fee" }),
					" is deducted from each withdrawal / payout. The amount you receive is therefore 90% of your requested payout, before any additional method-specific fees below."
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(P, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Strong, { children: "Instant withdrawal processing fee." }),
				" An additional fee of",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Strong, { children: "[INSTANT WITHDRAWAL FEE]" }),
				" applies for the faster instant-processing option. Choosing the standard timeline instead avoids this specific fee."
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(P, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Strong, { children: "Region and network fees." }), " Additional transaction fees or taxes may apply depending on your region and the specific payout method's network requirements — for example, blockchain gas / miner fees for crypto payouts, or local payment-processor surcharges. These vary by location and payout method and are outside [COMPANY NAME]'s control; they are deducted by the underlying network / processor, not by us."] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(P, { children: [
				"These fees are separate from any personal income taxes you may owe on your earnings — see the \"Taxes on your earnings\" section of the ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Strong, { children: "Terms of Service" }),
				"."
			] })
		] })
	}
];
function WithdrawalPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PolicyLayout, {
		title: "Withdrawal & Payout Policy",
		subtitle: "How and when your CashGPT wallet turns into real money.",
		lastUpdated: LAST_UPDATED,
		sections: SECTIONS,
		siblings: SIBLINGS,
		intro: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: "These rules apply to every payout regardless of the method you choose. Please double-check your payout details — mistakes here are the #1 cause of failed payments." }),
		footer: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: "This is a professional draft, not legal advice. Given real-money payouts across multiple regions, please have this reviewed by a qualified lawyer before public release." })
	});
}
//#endregion
export { WithdrawalPage as component };
