import { i as __toESM } from "../_runtime.mjs";
import { a as formatDateTime, o as formatMoney } from "./referral-progress-DmJLJmiB.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { At as Copy, Bt as CircleCheckBig, Ct as FileImage, Dt as Download, Ft as CircleX, Gt as Check, Ht as ChevronRight, I as RefreshCw, K as Network, Mt as Clock, N as Search, Ot as DollarSign, S as SquarePen, St as FileText, U as Pencil, Ut as ChevronLeft, at as LifeBuoy, d as Upload, dt as Image, g as Trash2, gt as Globe, j as Settings, lt as Info, m as TrendingUp, n as X, nn as ArrowUp, p as TriangleAlert, s as Users, sn as ArrowDown, wt as Eye, z as Plus } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as formatShortDate, i as VerificationBadge } from "./Preview-MVZOUW8x.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as Skeleton } from "./skeleton-D9W9wFsj.mjs";
import { i as createServerFn } from "./server-CpGMOUrW.mjs";
import { t as createSsrRpc } from "./createSsrRpc-Bbq2Yr9O.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Br_KWlRY.mjs";
import { i as enumType, l as stringType, o as numberType, s as objectType } from "../_libs/zod.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { $t as reviewProof, A as Dialog, An as getDashboardSignups, Bn as listStaff, D as Input, Dn as exportUsersCsv, E as Label, En as exportTransactionsCsv, Fn as getUserDetail, G as DialogDescription, H as formatReward, Hn as rejectAdjustmentRequest, In as getUsersWithSameDevice, J as DialogTitle, Jn as setMaintenanceMode, Jt as listPendingCampaigns, K as DialogFooter, Ln as getWithdrawalFraudSignals, Nn as getMaintenanceStatus, O as Checkbox, On as getDashboardActiveUsers, Ot as Button, Pn as getUserAuditLog, Qt as reviewCampaign, Rn as listAdjustmentRequests, S as AlertDialogTitle, Sn as createQuickReply, Tn as exportPayoutsCsv, Un as removeRole, W as DialogContent, Yt as listPendingProofs, _ as AlertDialogCancel, an as adminListAuditLogs, b as AlertDialogFooter, c as getMarketplaceSettings, cn as adminListUsers, d as AppShell, dn as adminRespondTicket, er as updateQuickReply, fn as adminSetFlag, g as AlertDialogAction, gn as assignRole, gt as listSdkProvidersForQuests, h as AlertDialog, hn as approveAdjustmentRequest, ht as listAdminQuests, in as adminAdjustWallet, jn as getDashboardTopOffers, kn as getDashboardRevenuePayout, l as updateMarketplaceSettings, ln as adminListWithdrawals, mn as adminUpdateWithdrawal, nr as useServerFn, on as adminListClaims, pn as adminUpdateOfferClaim, q as DialogHeader, qn as sendBroadcastNotification, rr as cn, sn as adminListTickets, st as deleteQuest, tr as useAuth, un as adminOverview, v as AlertDialogContent, wn as deleteQuickReply, x as AlertDialogHeader, xn as createAdjustmentRequest, xt as saveQuest, y as AlertDialogDescription, zn as listQuickReplies } from "./router-sXMnYegW.mjs";
import { r as SectionTitle, t as EmptyState } from "./States-Cg9ELwgo.mjs";
import { a as listSmartBannerSettings, c as setSmartBannerEnabled, i as listAdminBanners, n as SectionBanner, o as requestBannerUploadUrl, r as deleteBanner, s as saveBanner, t as SMART_BANNER_TEMPLATES } from "./SectionBanner-Cf6xDjCJ.mjs";
import { _ as updateOfferControls, c as listAdminOffers, f as saveManualOffer, g as updateNetworkFeedSettings, h as updateFeedSettings, i as deleteManualOffer, l as listOfferProviders, n as adminRefreshFeed, o as getFeedAutomation, p as syncOfferProvider, r as adminSignProofUrl, t as adminDashboard, u as offerDisplayBadge, v as upsertOfferProvider } from "./offers.functions-CQ4rFVpp.mjs";
import { a as listAdminSdkProviders, c as requestOfferwallLogoUploadUrl, l as saveSdkProvider, o as listSdkConversions, t as deleteSdkProvider, u as updateSdkProviderControls } from "./sdk-offerwall.functions-qLMu5QL8.mjs";
import { i as isCryptoMethod, o as payoutMethodLabel, r as getExplorerUrl } from "./payout-methods-axzHBpbm.mjs";
import { a as TASK_TYPES, i as TASK_LOCK_TYPE_LABELS, n as TASK_FREQUENCY_LABELS, r as TASK_LOCK_TYPES, s as TASK_TYPE_LABELS, t as TASK_FREQUENCIES } from "./types-BeKSJIcg.mjs";
import { t as Textarea } from "./textarea-kko37XEX.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select$1 } from "./select-Dg1urBTx.mjs";
import { t as Switch } from "./switch-Cn1w-cIH.mjs";
import { a as reorderPremiumOnboardingSteps, n as deletePremiumOnboardingStep, r as listAdminPremiumOnboardingSteps, s as savePremiumOnboardingStep } from "./functions-BCv4WNrg.mjs";
import { a as saveAdminTask, i as requestTaskImageUploadUrl, n as listAdminTasks, o as setAdminTaskActive, t as deleteAdminTask } from "./tasks.functions-Dooa45TF.mjs";
import { t as imageCompression } from "../_libs/browser-image-compression.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-D-rLetJ6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var badgeVariants = cva("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", {
	variants: { variant: {
		default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
		secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
		destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
		outline: "text-foreground"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
var COUNTRIES = [
	{
		code: "AF",
		name: "Afghanistan"
	},
	{
		code: "AX",
		name: "Åland Islands"
	},
	{
		code: "AL",
		name: "Albania"
	},
	{
		code: "DZ",
		name: "Algeria"
	},
	{
		code: "AS",
		name: "American Samoa"
	},
	{
		code: "AD",
		name: "Andorra"
	},
	{
		code: "AO",
		name: "Angola"
	},
	{
		code: "AI",
		name: "Anguilla"
	},
	{
		code: "AQ",
		name: "Antarctica"
	},
	{
		code: "AG",
		name: "Antigua & Barbuda"
	},
	{
		code: "AR",
		name: "Argentina"
	},
	{
		code: "AM",
		name: "Armenia"
	},
	{
		code: "AW",
		name: "Aruba"
	},
	{
		code: "AU",
		name: "Australia"
	},
	{
		code: "AT",
		name: "Austria"
	},
	{
		code: "AZ",
		name: "Azerbaijan"
	},
	{
		code: "BS",
		name: "Bahamas"
	},
	{
		code: "BH",
		name: "Bahrain"
	},
	{
		code: "BD",
		name: "Bangladesh"
	},
	{
		code: "BB",
		name: "Barbados"
	},
	{
		code: "BY",
		name: "Belarus"
	},
	{
		code: "BE",
		name: "Belgium"
	},
	{
		code: "BZ",
		name: "Belize"
	},
	{
		code: "BJ",
		name: "Benin"
	},
	{
		code: "BM",
		name: "Bermuda"
	},
	{
		code: "BT",
		name: "Bhutan"
	},
	{
		code: "BO",
		name: "Bolivia"
	},
	{
		code: "BA",
		name: "Bosnia & Herzegovina"
	},
	{
		code: "BW",
		name: "Botswana"
	},
	{
		code: "BV",
		name: "Bouvet Island"
	},
	{
		code: "BR",
		name: "Brazil"
	},
	{
		code: "IO",
		name: "British Indian Ocean Territory"
	},
	{
		code: "VG",
		name: "British Virgin Islands"
	},
	{
		code: "BN",
		name: "Brunei"
	},
	{
		code: "BG",
		name: "Bulgaria"
	},
	{
		code: "BF",
		name: "Burkina Faso"
	},
	{
		code: "BI",
		name: "Burundi"
	},
	{
		code: "KH",
		name: "Cambodia"
	},
	{
		code: "CM",
		name: "Cameroon"
	},
	{
		code: "CA",
		name: "Canada"
	},
	{
		code: "CV",
		name: "Cape Verde"
	},
	{
		code: "BQ",
		name: "Caribbean Netherlands"
	},
	{
		code: "KY",
		name: "Cayman Islands"
	},
	{
		code: "CF",
		name: "Central African Republic"
	},
	{
		code: "TD",
		name: "Chad"
	},
	{
		code: "CL",
		name: "Chile"
	},
	{
		code: "CN",
		name: "China"
	},
	{
		code: "CX",
		name: "Christmas Island"
	},
	{
		code: "CC",
		name: "Cocos (Keeling) Islands"
	},
	{
		code: "CO",
		name: "Colombia"
	},
	{
		code: "KM",
		name: "Comoros"
	},
	{
		code: "CG",
		name: "Congo - Brazzaville"
	},
	{
		code: "CD",
		name: "Congo - Kinshasa"
	},
	{
		code: "CK",
		name: "Cook Islands"
	},
	{
		code: "CR",
		name: "Costa Rica"
	},
	{
		code: "CI",
		name: "Côte d’Ivoire"
	},
	{
		code: "HR",
		name: "Croatia"
	},
	{
		code: "CU",
		name: "Cuba"
	},
	{
		code: "CW",
		name: "Curaçao"
	},
	{
		code: "CY",
		name: "Cyprus"
	},
	{
		code: "CZ",
		name: "Czechia"
	},
	{
		code: "DK",
		name: "Denmark"
	},
	{
		code: "DJ",
		name: "Djibouti"
	},
	{
		code: "DM",
		name: "Dominica"
	},
	{
		code: "DO",
		name: "Dominican Republic"
	},
	{
		code: "EC",
		name: "Ecuador"
	},
	{
		code: "EG",
		name: "Egypt"
	},
	{
		code: "SV",
		name: "El Salvador"
	},
	{
		code: "GQ",
		name: "Equatorial Guinea"
	},
	{
		code: "ER",
		name: "Eritrea"
	},
	{
		code: "EE",
		name: "Estonia"
	},
	{
		code: "SZ",
		name: "Eswatini"
	},
	{
		code: "ET",
		name: "Ethiopia"
	},
	{
		code: "FK",
		name: "Falkland Islands"
	},
	{
		code: "FO",
		name: "Faroe Islands"
	},
	{
		code: "FJ",
		name: "Fiji"
	},
	{
		code: "FI",
		name: "Finland"
	},
	{
		code: "FR",
		name: "France"
	},
	{
		code: "GF",
		name: "French Guiana"
	},
	{
		code: "PF",
		name: "French Polynesia"
	},
	{
		code: "TF",
		name: "French Southern Territories"
	},
	{
		code: "GA",
		name: "Gabon"
	},
	{
		code: "GM",
		name: "Gambia"
	},
	{
		code: "GE",
		name: "Georgia"
	},
	{
		code: "DE",
		name: "Germany"
	},
	{
		code: "GH",
		name: "Ghana"
	},
	{
		code: "GI",
		name: "Gibraltar"
	},
	{
		code: "GR",
		name: "Greece"
	},
	{
		code: "GL",
		name: "Greenland"
	},
	{
		code: "GD",
		name: "Grenada"
	},
	{
		code: "GP",
		name: "Guadeloupe"
	},
	{
		code: "GU",
		name: "Guam"
	},
	{
		code: "GT",
		name: "Guatemala"
	},
	{
		code: "GG",
		name: "Guernsey"
	},
	{
		code: "GN",
		name: "Guinea"
	},
	{
		code: "GW",
		name: "Guinea-Bissau"
	},
	{
		code: "GY",
		name: "Guyana"
	},
	{
		code: "HT",
		name: "Haiti"
	},
	{
		code: "HM",
		name: "Heard & McDonald Islands"
	},
	{
		code: "HN",
		name: "Honduras"
	},
	{
		code: "HK",
		name: "Hong Kong SAR China"
	},
	{
		code: "HU",
		name: "Hungary"
	},
	{
		code: "IS",
		name: "Iceland"
	},
	{
		code: "IN",
		name: "India"
	},
	{
		code: "ID",
		name: "Indonesia"
	},
	{
		code: "IR",
		name: "Iran"
	},
	{
		code: "IQ",
		name: "Iraq"
	},
	{
		code: "IE",
		name: "Ireland"
	},
	{
		code: "IM",
		name: "Isle of Man"
	},
	{
		code: "IL",
		name: "Israel"
	},
	{
		code: "IT",
		name: "Italy"
	},
	{
		code: "JM",
		name: "Jamaica"
	},
	{
		code: "JP",
		name: "Japan"
	},
	{
		code: "JE",
		name: "Jersey"
	},
	{
		code: "JO",
		name: "Jordan"
	},
	{
		code: "KZ",
		name: "Kazakhstan"
	},
	{
		code: "KE",
		name: "Kenya"
	},
	{
		code: "KI",
		name: "Kiribati"
	},
	{
		code: "XK",
		name: "Kosovo"
	},
	{
		code: "KW",
		name: "Kuwait"
	},
	{
		code: "KG",
		name: "Kyrgyzstan"
	},
	{
		code: "LA",
		name: "Laos"
	},
	{
		code: "LV",
		name: "Latvia"
	},
	{
		code: "LB",
		name: "Lebanon"
	},
	{
		code: "LS",
		name: "Lesotho"
	},
	{
		code: "LR",
		name: "Liberia"
	},
	{
		code: "LY",
		name: "Libya"
	},
	{
		code: "LI",
		name: "Liechtenstein"
	},
	{
		code: "LT",
		name: "Lithuania"
	},
	{
		code: "LU",
		name: "Luxembourg"
	},
	{
		code: "MO",
		name: "Macao SAR China"
	},
	{
		code: "MG",
		name: "Madagascar"
	},
	{
		code: "MW",
		name: "Malawi"
	},
	{
		code: "MY",
		name: "Malaysia"
	},
	{
		code: "MV",
		name: "Maldives"
	},
	{
		code: "ML",
		name: "Mali"
	},
	{
		code: "MT",
		name: "Malta"
	},
	{
		code: "MH",
		name: "Marshall Islands"
	},
	{
		code: "MQ",
		name: "Martinique"
	},
	{
		code: "MR",
		name: "Mauritania"
	},
	{
		code: "MU",
		name: "Mauritius"
	},
	{
		code: "YT",
		name: "Mayotte"
	},
	{
		code: "MX",
		name: "Mexico"
	},
	{
		code: "FM",
		name: "Micronesia"
	},
	{
		code: "MD",
		name: "Moldova"
	},
	{
		code: "MC",
		name: "Monaco"
	},
	{
		code: "MN",
		name: "Mongolia"
	},
	{
		code: "ME",
		name: "Montenegro"
	},
	{
		code: "MS",
		name: "Montserrat"
	},
	{
		code: "MA",
		name: "Morocco"
	},
	{
		code: "MZ",
		name: "Mozambique"
	},
	{
		code: "MM",
		name: "Myanmar (Burma)"
	},
	{
		code: "NA",
		name: "Namibia"
	},
	{
		code: "NR",
		name: "Nauru"
	},
	{
		code: "NP",
		name: "Nepal"
	},
	{
		code: "NL",
		name: "Netherlands"
	},
	{
		code: "NC",
		name: "New Caledonia"
	},
	{
		code: "NZ",
		name: "New Zealand"
	},
	{
		code: "NI",
		name: "Nicaragua"
	},
	{
		code: "NE",
		name: "Niger"
	},
	{
		code: "NG",
		name: "Nigeria"
	},
	{
		code: "NU",
		name: "Niue"
	},
	{
		code: "NF",
		name: "Norfolk Island"
	},
	{
		code: "KP",
		name: "North Korea"
	},
	{
		code: "MK",
		name: "North Macedonia"
	},
	{
		code: "MP",
		name: "Northern Mariana Islands"
	},
	{
		code: "NO",
		name: "Norway"
	},
	{
		code: "OM",
		name: "Oman"
	},
	{
		code: "PK",
		name: "Pakistan"
	},
	{
		code: "PW",
		name: "Palau"
	},
	{
		code: "PS",
		name: "Palestinian Territories"
	},
	{
		code: "PA",
		name: "Panama"
	},
	{
		code: "PG",
		name: "Papua New Guinea"
	},
	{
		code: "PY",
		name: "Paraguay"
	},
	{
		code: "PE",
		name: "Peru"
	},
	{
		code: "PH",
		name: "Philippines"
	},
	{
		code: "PN",
		name: "Pitcairn Islands"
	},
	{
		code: "PL",
		name: "Poland"
	},
	{
		code: "PT",
		name: "Portugal"
	},
	{
		code: "PR",
		name: "Puerto Rico"
	},
	{
		code: "QA",
		name: "Qatar"
	},
	{
		code: "RE",
		name: "Réunion"
	},
	{
		code: "RO",
		name: "Romania"
	},
	{
		code: "RU",
		name: "Russia"
	},
	{
		code: "RW",
		name: "Rwanda"
	},
	{
		code: "WS",
		name: "Samoa"
	},
	{
		code: "SM",
		name: "San Marino"
	},
	{
		code: "ST",
		name: "São Tomé & Príncipe"
	},
	{
		code: "SA",
		name: "Saudi Arabia"
	},
	{
		code: "SN",
		name: "Senegal"
	},
	{
		code: "RS",
		name: "Serbia"
	},
	{
		code: "SC",
		name: "Seychelles"
	},
	{
		code: "SL",
		name: "Sierra Leone"
	},
	{
		code: "SG",
		name: "Singapore"
	},
	{
		code: "SX",
		name: "Sint Maarten"
	},
	{
		code: "SK",
		name: "Slovakia"
	},
	{
		code: "SI",
		name: "Slovenia"
	},
	{
		code: "SB",
		name: "Solomon Islands"
	},
	{
		code: "SO",
		name: "Somalia"
	},
	{
		code: "ZA",
		name: "South Africa"
	},
	{
		code: "GS",
		name: "South Georgia & South Sandwich Islands"
	},
	{
		code: "KR",
		name: "South Korea"
	},
	{
		code: "SS",
		name: "South Sudan"
	},
	{
		code: "ES",
		name: "Spain"
	},
	{
		code: "LK",
		name: "Sri Lanka"
	},
	{
		code: "BL",
		name: "St. Barthélemy"
	},
	{
		code: "SH",
		name: "St. Helena"
	},
	{
		code: "KN",
		name: "St. Kitts & Nevis"
	},
	{
		code: "LC",
		name: "St. Lucia"
	},
	{
		code: "MF",
		name: "St. Martin"
	},
	{
		code: "PM",
		name: "St. Pierre & Miquelon"
	},
	{
		code: "VC",
		name: "St. Vincent & Grenadines"
	},
	{
		code: "SD",
		name: "Sudan"
	},
	{
		code: "SR",
		name: "Suriname"
	},
	{
		code: "SJ",
		name: "Svalbard & Jan Mayen"
	},
	{
		code: "SE",
		name: "Sweden"
	},
	{
		code: "CH",
		name: "Switzerland"
	},
	{
		code: "SY",
		name: "Syria"
	},
	{
		code: "TW",
		name: "Taiwan"
	},
	{
		code: "TJ",
		name: "Tajikistan"
	},
	{
		code: "TZ",
		name: "Tanzania"
	},
	{
		code: "TH",
		name: "Thailand"
	},
	{
		code: "TL",
		name: "Timor-Leste"
	},
	{
		code: "TG",
		name: "Togo"
	},
	{
		code: "TK",
		name: "Tokelau"
	},
	{
		code: "TO",
		name: "Tonga"
	},
	{
		code: "TT",
		name: "Trinidad & Tobago"
	},
	{
		code: "TN",
		name: "Tunisia"
	},
	{
		code: "TR",
		name: "Turkey"
	},
	{
		code: "TM",
		name: "Turkmenistan"
	},
	{
		code: "TC",
		name: "Turks & Caicos Islands"
	},
	{
		code: "TV",
		name: "Tuvalu"
	},
	{
		code: "UM",
		name: "U.S. Outlying Islands"
	},
	{
		code: "VI",
		name: "U.S. Virgin Islands"
	},
	{
		code: "UG",
		name: "Uganda"
	},
	{
		code: "UA",
		name: "Ukraine"
	},
	{
		code: "AE",
		name: "United Arab Emirates"
	},
	{
		code: "GB",
		name: "United Kingdom"
	},
	{
		code: "US",
		name: "United States"
	},
	{
		code: "UY",
		name: "Uruguay"
	},
	{
		code: "UZ",
		name: "Uzbekistan"
	},
	{
		code: "VU",
		name: "Vanuatu"
	},
	{
		code: "VA",
		name: "Vatican City"
	},
	{
		code: "VE",
		name: "Venezuela"
	},
	{
		code: "VN",
		name: "Vietnam"
	},
	{
		code: "WF",
		name: "Wallis & Futuna"
	},
	{
		code: "EH",
		name: "Western Sahara"
	},
	{
		code: "YE",
		name: "Yemen"
	},
	{
		code: "ZM",
		name: "Zambia"
	},
	{
		code: "ZW",
		name: "Zimbabwe"
	}
];
/** Uppercased code -> display name, for rendering stored codes. */
var COUNTRY_NAME_BY_CODE = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.name]));
/** Label used everywhere a stored code is shown, e.g. "IN — India". */
function countryLabel(code) {
	const upper = code.toUpperCase();
	const name = COUNTRY_NAME_BY_CODE[upper];
	return name ? `${upper} — ${name}` : upper;
}
/**
* Searchable multi-select for GEO targeting.
*
* The stored value stays an array of ISO 3166-1 alpha-2 codes, so nothing on the
* server or in the feed query changes. An EMPTY array means "all countries" —
* that is the existing contract in src/lib/offers/feed-cache.server.ts, where an
* offer with no countries is shown everywhere.
*
* Rendered inline rather than in a Popover because the offer form lives inside a
* scrollable DialogContent, where a portalled popover fights the dialog for
* focus and scroll.
*/
function CountryMultiSelect({ value, onChange, "data-testid": testId }) {
	const [query, setQuery] = (0, import_react.useState)("");
	const normalized = (0, import_react.useMemo)(() => value.map((c) => c.trim().toUpperCase()).filter(Boolean), [value]);
	const selected = (0, import_react.useMemo)(() => new Set(normalized), [normalized]);
	const allCountries = normalized.length === 0;
	/**
	* Codes already saved that aren't in the ISO list — the field used to be a
	* free-text input, so rows can hold typos or retired codes. They're kept and
	* shown so switching to this picker can't silently drop saved targeting.
	*/
	const unknown = (0, import_react.useMemo)(() => normalized.filter((c) => !COUNTRY_NAME_BY_CODE[c]), [normalized]);
	const filtered = (0, import_react.useMemo)(() => {
		const q = query.trim().toLowerCase();
		if (!q) return COUNTRIES;
		return COUNTRIES.filter((c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
	}, [query]);
	/** Emit in a stable order: ISO list order (by name), then any unknown codes. */
	const emit = (next) => {
		const known = COUNTRIES.filter((c) => next.has(c.code)).map((c) => c.code);
		const extras = [...next].filter((c) => !COUNTRY_NAME_BY_CODE[c]).sort();
		onChange([...known, ...extras]);
	};
	const toggle = (code) => {
		const next = new Set(selected);
		if (next.has(code)) next.delete(code);
		else next.add(code);
		emit(next);
	};
	const remove = (code) => {
		const next = new Set(selected);
		next.delete(code);
		emit(next);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		"data-testid": testId,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => onChange([]),
				"aria-pressed": allCountries,
				"data-testid": "country-select-all",
				className: `flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors ${allCountries ? "border-primary bg-mint/15 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/40"}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "size-4 shrink-0" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex-1",
						children: "All Countries"
					}),
					allCountries ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4 shrink-0" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[11px] font-normal",
						children: "clears the list"
					})
				]
			}),
			allCountries ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-1 text-[11px] text-muted-foreground",
				children: "No GEO restriction — this offer is shown in every country."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-1.5",
				"data-testid": "country-select-chips",
				children: normalized.map((code) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
					variant: "secondary",
					className: "gap-1 py-1 pl-2 pr-1 text-[11px] font-semibold",
					children: [COUNTRY_NAME_BY_CODE[code] ? code : `${code}?`, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => remove(code),
						"aria-label": `Remove ${countryLabel(code)}`,
						"data-testid": `country-chip-remove-${code}`,
						className: "grid size-4 place-items-center rounded-full hover:bg-destructive/15 hover:text-destructive",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3" })
					})]
				}, code))
			}),
			unknown.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "px-1 text-[11px] text-amber-600",
				"data-testid": "country-select-unknown",
				children: [
					"Not valid ISO codes, kept as-is from the old text field:",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-semibold",
						children: unknown.join(", ")
					}),
					". Remove them unless a partner expects those values."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: query,
					onChange: (event) => setQuery(event.target.value),
					placeholder: "Search country or code…",
					"aria-label": "Search countries",
					className: "pl-8",
					"data-testid": "country-select-search"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "max-h-56 overflow-y-auto rounded-xl border border-border bg-card",
				"data-testid": "country-select-list",
				children: filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "px-3 py-4 text-center text-xs text-muted-foreground",
					children: [
						"No country matches “",
						query,
						"”."
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: filtered.map((country) => {
					const checked = selected.has(country.code);
					const id = `country-opt-${country.code}`;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						htmlFor: id,
						className: "flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm hover:bg-background-alt",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
								id,
								checked,
								onCheckedChange: () => toggle(country.code),
								"data-testid": `country-option-${country.code}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "w-7 shrink-0 font-mono text-xs font-semibold text-primary",
								children: country.code
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "min-w-0 flex-1 truncate",
								children: country.name
							})
						]
					}) }, country.code);
				}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between px-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] text-muted-foreground",
					"data-testid": "country-select-count",
					children: allCountries ? "All countries" : `${normalized.length} selected`
				}), !allCountries && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					size: "sm",
					variant: "ghost",
					className: "h-7 text-[11px]",
					onClick: () => onChange([]),
					"data-testid": "country-select-clear",
					children: "Clear all"
				})]
			})
		]
	});
}
/**
* Browser-side image resize and WebP conversion for admin uploads.
* Reduces bandwidth and storage costs by resizing images and converting
* to WebP at specified quality before upload.
*/
async function resizeAndConvertToWebP(file, maxDimension = 1200, quality = .82) {
	try {
		const compressedFile = await imageCompression(file, {
			maxWidthOrHeight: maxDimension,
			useWebWorker: true,
			fileType: "image/webp",
			initialQuality: quality
		});
		const fileName = file.name.replace(/\.[^.]+$/, ".webp");
		return new File([compressedFile], fileName, { type: "image/webp" });
	} catch (error) {
		console.error("WebP conversion failed, trying basic resize:", error);
		return await imageCompression(file, {
			maxWidthOrHeight: maxDimension,
			useWebWorker: true
		});
	}
}
var emptyForm$4 = {
	id: void 0,
	title: "",
	description: "",
	requirements: "",
	notAllowed: "",
	icon: "gift",
	rewardAmount: "0",
	networkPayout: "",
	clickUrl: "",
	countries: [],
	devices: "",
	expiresAt: "",
	isActive: true,
	isFeatured: false,
	sortOrder: "0",
	adminPriority: "0",
	isLimitedDeal: false,
	dealGroupId: "",
	actualCost: "",
	payoutPercentage: "110",
	maxPayoutCap: "",
	displayPrice: "",
	displayPercent: "",
	offerKind: "url_instant",
	payoutMode: "manual",
	postbackSecretRef: "",
	postbackIpAllowlist: "",
	category: "",
	tags: []
};
function OffersManager() {
	const queryClient = useQueryClient();
	const fetchOffers = useServerFn(listAdminOffers);
	const fetchProviders = useServerFn(listOfferProviders);
	const saveOffer = useServerFn(saveManualOffer);
	const removeOffer = useServerFn(deleteManualOffer);
	const setControls = useServerFn(updateOfferControls);
	const [source, setSource] = (0, import_react.useState)("all");
	const [status, setStatus] = (0, import_react.useState)("all");
	const [search, setSearch] = (0, import_react.useState)("");
	const [providerId, setProviderId] = (0, import_react.useState)("");
	const [country, setCountry] = (0, import_react.useState)("");
	const [category, setCategory] = (0, import_react.useState)("");
	const [device, setDevice] = (0, import_react.useState)("");
	const [form, setForm] = (0, import_react.useState)(null);
	const [pendingDelete, setPendingDelete] = (0, import_react.useState)(null);
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const fileRef = (0, import_react.useRef)(null);
	const requestUpload = useServerFn(requestBannerUploadUrl);
	const providers = useQuery({
		queryKey: ["offer-providers"],
		queryFn: () => fetchProviders({})
	});
	const offers = useQuery({
		queryKey: [
			"admin-offers",
			source,
			status,
			search,
			providerId,
			country,
			category,
			device
		],
		queryFn: () => fetchOffers({ data: {
			source,
			status,
			limit: 100,
			...search.trim() ? { search: search.trim() } : {},
			...providerId ? { providerId } : {},
			...country.trim() ? { country: country.trim() } : {},
			...category ? { category } : {},
			...device ? { device } : {}
		} })
	});
	const refresh = () => {
		queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
		queryClient.invalidateQueries({ queryKey: ["offers"] });
	};
	const onError = (error) => toast.error(error.message);
	/**
	* Uploads offer artwork and writes the resulting public URL into the `icon`
	* field. Same flow as the Banners form: signed URL -> PUT -> set the field.
	* The field stays a plain text input, so pasting an external URL or an icon
	* name still works.
	*/
	const handleFile = async (file) => {
		if (!form) return;
		if (file.size > 10485760) {
			toast.error("Image must be under 10 MB.");
			return;
		}
		setUploading(true);
		try {
			toast.info("Resizing and converting to WebP...");
			const optimizedFile = await resizeAndConvertToWebP(file, 1200, .82);
			const { uploadUrl, token, publicUrl } = await requestUpload({ data: {
				filename: optimizedFile.name.slice(0, 120),
				target: "offers"
			} });
			const res = await fetch(uploadUrl, {
				method: "PUT",
				headers: {
					"Content-Type": optimizedFile.type || "application/octet-stream",
					"cache-control": "max-age=31536000",
					...token ? { Authorization: `Bearer ${token}` } : {}
				},
				body: optimizedFile
			});
			if (!res.ok) throw new Error(`Upload failed (${res.status})`);
			setForm({
				...form,
				icon: publicUrl
			});
			toast.success("Image uploaded.");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Upload failed.");
		} finally {
			setUploading(false);
			if (fileRef.current) fileRef.current.value = "";
		}
	};
	const controlsAction = useMutation({
		mutationFn: (input) => setControls({ data: input }),
		onSuccess: () => {
			toast.success("Offer updated.");
			refresh();
		},
		onError
	});
	const saveAction = useMutation({
		mutationFn: (state) => saveOffer({ data: {
			...state.id ? { id: state.id } : {},
			title: state.title.trim(),
			description: state.description.trim(),
			requirements: state.requirements.trim(),
			notAllowed: state.notAllowed.trim(),
			icon: state.icon.trim() || "gift",
			rewardAmount: Number(state.rewardAmount) || 0,
			networkPayout: state.networkPayout ? Number(state.networkPayout) : null,
			clickUrl: state.clickUrl.trim() ? state.clickUrl.trim() : null,
			countries: state.countries,
			devices: state.devices.split(",").map((d) => d.trim()).filter(Boolean),
			expiresAt: state.expiresAt ? new Date(state.expiresAt).toISOString() : null,
			isActive: state.isActive,
			isFeatured: state.isFeatured,
			sortOrder: Number(state.sortOrder) || 0,
			adminPriority: Number(state.adminPriority) || 0,
			isLimitedDeal: state.isLimitedDeal,
			dealGroupId: state.dealGroupId.trim() || null,
			actualCost: state.actualCost.trim() ? Number(state.actualCost) : null,
			payoutPercentage: Number(state.payoutPercentage) || 110,
			maxPayoutCap: state.maxPayoutCap.trim() ? Number(state.maxPayoutCap) : null,
			displayPrice: state.displayPrice.trim() || null,
			displayPercent: state.displayPercent.trim() ? Number(state.displayPercent) : null,
			payoutMode: state.payoutMode,
			postbackSecretRef: state.postbackSecretRef.trim() || null,
			postbackIpAllowlist: state.postbackIpAllowlist.split(",").map((s) => s.trim()).filter(Boolean),
			category: state.category || null,
			tags: state.tags
		} }),
		onSuccess: () => {
			toast.success("Offer saved.");
			setForm(null);
			refresh();
		},
		onError
	});
	const deleteAction = useMutation({
		mutationFn: (id) => removeOffer({ data: { id } }),
		onSuccess: (result) => {
			toast.success(result.deleted ? "Offer deleted." : "Offer had claims — deactivated instead of deleted.");
			setPendingDelete(null);
			refresh();
		},
		onError
	});
	const openEdit = (offer) => {
		const payoutMode = offer.payout_mode ?? "manual";
		let offerKind;
		if (payoutMode === "auto_postback") offerKind = "auto";
		else if (payoutMode === "manual") offerKind = "url_instant";
		else if (payoutMode === "manual_proof") offerKind = offer.click_url?.trim() ? "url_proof" : "task_proof";
		else offerKind = "url_instant";
		setForm({
			id: offer.id,
			title: offer.title,
			description: offer.description ?? "",
			requirements: offer.requirements ?? "",
			notAllowed: offer.not_allowed ?? "",
			icon: offer.icon ?? "gift",
			rewardAmount: String(offer.reward_amount ?? 0),
			networkPayout: offer.network_payout == null ? "" : String(offer.network_payout),
			clickUrl: offer.click_url ?? "",
			countries: offer.countries ?? [],
			devices: (offer.devices ?? []).join(", "),
			expiresAt: offer.expires_at ? offer.expires_at.slice(0, 16) : "",
			isActive: offer.is_active,
			isFeatured: offer.is_featured,
			sortOrder: String(offer.sort_order ?? 0),
			adminPriority: String(offer.admin_priority ?? 0),
			isLimitedDeal: Boolean(offer.is_limited_deal),
			dealGroupId: offer.deal_group_id ?? "",
			actualCost: offer.actual_cost != null ? String(offer.actual_cost) : "",
			payoutPercentage: String(offer.payout_percentage ?? 110),
			displayPrice: offer.display_price ?? "",
			displayPercent: offer.display_percent != null ? String(offer.display_percent) : "",
			maxPayoutCap: offer.max_payout_cap != null ? String(offer.max_payout_cap) : "",
			offerKind,
			payoutMode,
			postbackSecretRef: offer.postback_secret_ref ?? "",
			postbackIpAllowlist: (offer.postback_ip_allowlist ?? []).join(", "),
			category: offer.category ?? "",
			tags: (offer.tags ?? []).filter((t) => [
				"Hot",
				"Trending",
				"Easy",
				"Popular"
			].includes(t))
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [[
					"all",
					"manual",
					"network"
				].map((key) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: source === key ? "jade" : "outline",
					onClick: () => setSource(key),
					className: "capitalize",
					children: key
				}, key)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: "gold",
					className: "ml-auto",
					onClick: () => setForm({ ...emptyForm$4 }),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-4 w-4" }), " New manual offer"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card space-y-2 p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "pl-9",
							placeholder: "Search offer title",
							value: search,
							onChange: (event) => setSearch(event.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							"all",
							"active",
							"inactive",
							"featured",
							"expired"
						].map((key) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: status === key ? "mint" : "outline",
							onClick: () => setStatus(key),
							className: "capitalize",
							children: key
						}, key))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "h-9 flex-1 rounded-xl border border-input bg-background px-2 text-sm",
								value: providerId,
								onChange: (event) => setProviderId(event.target.value),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "All providers"
								}), (providers.data ?? []).map((provider) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: provider.id,
									children: provider.name
								}, provider.id))]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "h-9 rounded-xl border border-input bg-background px-2 text-sm min-w-[140px]",
								value: category,
								onChange: (event) => setCategory(event.target.value),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "",
										children: "All categories"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "App Install",
										children: "App Install"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "Trial",
										children: "Trial"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "Deals",
										children: "Deals"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "Survey",
										children: "Survey"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "Games",
										children: "Games"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "Link Locker",
										children: "Link Locker"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "Shortlink",
										children: "Shortlink"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "h-9 rounded-xl border border-input bg-background px-2 text-sm min-w-[120px]",
								value: device,
								onChange: (event) => setDevice(event.target.value),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "",
										children: "All devices"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "android",
										children: "Android"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "ios",
										children: "iOS"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "web",
										children: "Web"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "h-9 w-28",
								placeholder: "GEO (US)",
								value: country,
								maxLength: 3,
								onChange: (event) => setCountry(event.target.value.toUpperCase())
							})
						]
					})
				]
			}),
			offers.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Loading offers…"
			}) : !offers.data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				icon: Plus,
				title: "No offers match",
				description: "Adjust the filters or create a manual offer."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-2",
				children: offers.data.map((offer) => {
					const isNetwork = offer.source === "network";
					const provider = offer.offer_providers;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "surface-card space-y-2 p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-sm font-semibold",
										children: offer.title
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground",
										children: isNetwork ? `${provider?.name ?? "Network"} · ID ${offer.external_offer_id}` : "Manual offer"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${isNetwork ? "bg-primary/15 text-primary" : "bg-background-alt text-muted-foreground"}`,
									children: offer.source
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									"Reward ",
									formatReward(offer.reward_amount),
									offerDisplayBadge(offer) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										"data-testid": `offer-row-display-badge-${offer.id}`,
										children: [
											" ",
											"· badge “",
											offerDisplayBadge(offer),
											"”"
										]
									}),
									offer.network_payout != null && ` · payout ${formatMoney(offer.network_payout)}`,
									offer.revenue_share != null && ` · share ${Math.round(Number(offer.revenue_share) * 100)}%`
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									offer.category && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
										"Category ",
										offer.category,
										" · "
									] }),
									"GEO ",
									offer.countries?.length ? offer.countries.join(", ") : "Any",
									" · Devices",
									" ",
									offer.devices?.length ? offer.devices.join(", ") : "Any",
									" · Priority",
									" ",
									offer.admin_priority,
									" · Sort ",
									offer.sort_order
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [offer.expires_at ? `Expires ${formatDateTime(offer.expires_at)}` : "No expiry", isNetwork && ` · last synced ${offer.last_seen_at ? formatDateTime(offer.last_seen_at) : "never"}`]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex items-center gap-2 text-xs",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
											checked: offer.is_active,
											onCheckedChange: (value) => controlsAction.mutate({
												id: offer.id,
												isActive: value
											})
										}), "Active"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex items-center gap-2 text-xs",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
											checked: offer.is_featured,
											onCheckedChange: (value) => controlsAction.mutate({
												id: offer.id,
												isFeatured: value
											})
										}), "Featured"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex items-center gap-2 text-xs",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
											checked: offer.push_to_bottom === true,
											onCheckedChange: (value) => controlsAction.mutate({
												id: offer.id,
												pushToBottom: value ? true : null
											})
										}), "Push to Bottom"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										className: "h-8 w-20",
										inputMode: "numeric",
										defaultValue: String(offer.admin_priority),
										onBlur: (event) => {
											const next = Number(event.target.value);
											if (Number.isFinite(next) && next !== offer.admin_priority) controlsAction.mutate({
												id: offer.id,
												adminPriority: Math.round(next)
											});
										},
										"aria-label": "Priority"
									}),
									isNetwork ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										className: "h-8 w-24",
										inputMode: "decimal",
										defaultValue: String(offer.reward_amount),
										onBlur: (event) => {
											const next = Number(event.target.value);
											if (Number.isFinite(next) && next !== Number(offer.reward_amount)) controlsAction.mutate({
												id: offer.id,
												rewardAmount: next
											});
										},
										"aria-label": "User reward override"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										className: "h-8 rounded-lg border border-input bg-background px-2 text-xs",
										"data-testid": `network-offer-payout-mode-${offer.id}`,
										value: offer.payout_mode ?? "manual",
										onChange: (event) => controlsAction.mutate({
											id: offer.id,
											payoutMode: event.target.value
										}),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "manual",
												children: "Manual"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "manual_proof",
												children: "Manual + proof"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "auto_postback",
												children: "Auto postback"
											})
										]
									})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										variant: "outline",
										onClick: () => openEdit(offer),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "mr-1 h-3.5 w-3.5" }), " Edit"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										variant: "outline",
										onClick: () => setPendingDelete(offer),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "mr-1 h-3.5 w-3.5" }), " Delete"]
									})] })
								]
							})
						]
					}, offer.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: Boolean(form),
				onOpenChange: (open) => !open && setForm(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-h-[85vh] overflow-y-auto",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: form?.id ? "Edit manual offer" : "New manual offer" }) }),
						form && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$4, {
									label: "Title",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.title,
										maxLength: 120,
										onChange: (event) => setForm({
											...form,
											title: event.target.value
										})
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$4, {
									label: "Description",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
										rows: 2,
										value: form.description,
										onChange: (event) => setForm({
											...form,
											description: event.target.value
										})
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$4, {
									label: "Task / instructions",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
										rows: 2,
										value: form.requirements,
										onChange: (event) => setForm({
											...form,
											requirements: event.target.value
										})
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$4, {
									label: "What not to do",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
										rows: 3,
										placeholder: "No VPN, no multiple accounts, no fake data, no emulators…",
										"data-testid": "offer-form-not-allowed",
										value: form.notAllowed,
										onChange: (event) => setForm({
											...form,
											notAllowed: event.target.value
										})
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-border bg-card p-3 space-y-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$4, {
										label: "Category (powers the Offers filter)",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											className: "h-9 w-full rounded-xl border border-input bg-background px-2 text-sm",
											"data-testid": "offer-form-category",
											value: form.category,
											onChange: (event) => setForm({
												...form,
												category: event.target.value
											}),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "",
												children: "Uncategorized"
											}), [
												"App Install",
												"Trial",
												"Deals",
												"Survey",
												"Games",
												"Link Locker",
												"Shortlink"
											].map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: c,
												children: c
											}, c))]
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-xs text-muted-foreground",
												children: "Manual tags (leave empty to keep auto-tagging on)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "flex flex-wrap gap-2",
												children: [
													"Hot",
													"Trending",
													"Easy",
													"Popular"
												].map((tag) => {
													const active = form.tags.includes(tag);
													return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														type: "button",
														size: "sm",
														variant: active ? "jade" : "outline",
														"data-testid": `offer-form-tag-${tag.toLowerCase()}`,
														onClick: () => setForm({
															...form,
															tags: active ? form.tags.filter((t) => t !== tag) : [...form.tags, tag]
														}),
														children: tag
													}, tag);
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[11px] text-muted-foreground",
												children: "Once you save any tag choice (including clearing all), this offer's tags become admin-managed and will no longer be auto-computed. The \"Deal\" badge is always driven by the Limited Deal toggle above."
											})
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-gold/40 bg-gold-gradient/5 p-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex items-center gap-2 text-sm font-semibold",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
											checked: form.isLimitedDeal,
											"data-testid": "offer-form-is-limited-deal",
											onCheckedChange: (value) => setForm({
												...form,
												isLimitedDeal: value
											})
										}), "Limited Deal (self-funded cashback)"]
									}), form.isLimitedDeal && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-3 space-y-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$4, {
												label: "Deal group (offers sharing this key lock each other)",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													placeholder: "e.g. hosting-2026",
													"data-testid": "offer-form-deal-group",
													value: form.dealGroupId,
													onChange: (event) => setForm({
														...form,
														dealGroupId: event.target.value
													})
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid grid-cols-3 gap-3",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$4, {
														label: "Actual cost ($)",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															inputMode: "decimal",
															"data-testid": "offer-form-actual-cost",
															value: form.actualCost,
															onChange: (event) => setForm({
																...form,
																actualCost: event.target.value
															})
														})
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$4, {
														label: "Payout %",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															inputMode: "decimal",
															"data-testid": "offer-form-payout-pct",
															value: form.payoutPercentage,
															onChange: (event) => setForm({
																...form,
																payoutPercentage: event.target.value
															})
														})
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$4, {
														label: "Max cap ($)",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															inputMode: "decimal",
															"data-testid": "offer-form-max-cap",
															value: form.maxPayoutCap,
															onChange: (event) => setForm({
																...form,
																maxPayoutCap: event.target.value
															})
														})
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "rounded-lg bg-background-alt px-3 py-2 text-xs",
												"data-testid": "offer-form-effective-payout",
												children: [
													"Effective payout:",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-amount text-gold-dark",
														children: formatMoney(computeEffective(form.actualCost, form.payoutPercentage, form.maxPayoutCap))
													})
												]
											})
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2 rounded-xl border border-border bg-card p-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-xs font-medium",
											children: "Offer type"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "space-y-2",
											children: [
												[
													"auto",
													"Auto-tracked (partner postback)",
													"Click URL required. Conversions tracked automatically via postback."
												],
												[
													"url_proof",
													"URL + proof (user uploads screenshot)",
													"Click URL required. User clicks, completes offer, then uploads proof for review."
												],
												[
													"task_proof",
													"Task without URL (screenshot only)",
													"No Click URL. User completes task and uploads proof directly for review."
												],
												[
													"url_instant",
													"URL, no proof (instant review)",
													"Click URL required. No proof upload. Use for instant-credit offers."
												]
											].map(([kind, label, description]) => {
												const isSelected = form.offerKind === kind;
												return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													className: `w-full rounded-lg border p-3 text-left transition-colors ${isSelected ? "border-jade bg-jade/10" : "border-border bg-background hover:border-jade/50"}`,
													onClick: () => {
														const updates = {
															offerKind: kind,
															payoutMode: kind === "auto" ? "auto_postback" : kind === "url_proof" || kind === "task_proof" ? "manual_proof" : "manual"
														};
														if (kind === "task_proof") updates.clickUrl = "";
														setForm({
															...form,
															...updates
														});
													},
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-start gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: `mt-0.5 h-4 w-4 rounded-full border-2 ${isSelected ? "border-jade bg-jade" : "border-muted-foreground/30"}`,
															children: isSelected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full w-full rounded-full bg-background scale-50" })
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex-1",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "font-medium text-sm",
																children: label
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "text-xs text-muted-foreground mt-0.5",
																children: description
															})]
														})]
													})
												}, kind);
											})
										}),
										form.payoutMode === "auto_postback" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-2 space-y-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$4, {
													label: "Signature secret env var name",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														placeholder: "OFFER_ABC_POSTBACK_SECRET",
														"data-testid": "offer-form-postback-secret-ref",
														value: form.postbackSecretRef,
														onChange: (event) => setForm({
															...form,
															postbackSecretRef: event.target.value
														})
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$4, {
													label: "IP allowlist (comma separated, optional)",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														placeholder: "1.2.3.4, 5.6.7.8",
														"data-testid": "offer-form-postback-ip-allowlist",
														value: form.postbackIpAllowlist,
														onChange: (event) => setForm({
															...form,
															postbackIpAllowlist: event.target.value
														})
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-[11px] text-muted-foreground",
													children: [
														"Postback URL:",
														" ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("code", {
															className: "rounded bg-background-alt px-1",
															children: [
																typeof window !== "undefined" ? window.location.origin : "",
																"/api/public/offer-postback/",
																form.id ?? "{offerId}"
															]
														}),
														" ",
														"· signature = HMAC-SHA256(secret, \"txn:uid:amount\")"
													]
												})
											]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$4, {
									label: "Image URL or icon name",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												value: form.icon,
												placeholder: "https://… or upload, or an icon name",
												onChange: (event) => setForm({
													...form,
													icon: event.target.value
												}),
												"data-testid": "offer-form-image-url"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												ref: fileRef,
												type: "file",
												accept: "image/*",
												className: "hidden",
												onChange: (event) => {
													const file = event.target.files?.[0];
													if (file) handleFile(file);
												},
												"data-testid": "offer-form-image-file"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												type: "button",
												size: "sm",
												variant: "outline",
												disabled: uploading,
												onClick: () => fileRef.current?.click(),
												"data-testid": "offer-form-image-upload",
												children: uploading ? "…" : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" })
											})
										]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$4, {
									label: "Offer payout ($)",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										inputMode: "decimal",
										value: form.networkPayout,
										onChange: (event) => setForm({
											...form,
											networkPayout: event.target.value
										}),
										"data-testid": "offer-form-network-payout"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$4, {
									label: "User reward ($)",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										inputMode: "decimal",
										value: form.rewardAmount,
										"data-testid": "offer-form-reward-amount",
										onChange: (event) => setForm({
											...form,
											rewardAmount: event.target.value
										})
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DisplayBadgeFields, {
									form,
									setForm
								}),
								form.offerKind !== "task_proof" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field$4, {
									label: "Click URL",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										placeholder: "https://…",
										value: form.clickUrl,
										onChange: (event) => setForm({
											...form,
											clickUrl: event.target.value
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-xs text-muted-foreground",
										children: form.offerKind === "url_proof" ? "Required for 'URL + proof' type. User clicks this link before uploading proof." : form.offerKind === "auto" ? "Required for auto-tracked offers. Conversions reported via postback." : "Required. Link user clicks to complete the offer."
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$4, {
									label: "Countries",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CountryMultiSelect, {
										value: form.countries,
										onChange: (countries) => setForm({
											...form,
											countries
										}),
										"data-testid": "offer-form-countries"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$4, {
									label: "Devices (comma separated)",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										placeholder: "android, ios, desktop",
										value: form.devices,
										onChange: (event) => setForm({
											...form,
											devices: event.target.value
										})
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$4, {
										label: "Priority",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											inputMode: "numeric",
											value: form.adminPriority,
											onChange: (event) => setForm({
												...form,
												adminPriority: event.target.value
											})
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$4, {
										label: "Sort order",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											inputMode: "numeric",
											value: form.sortOrder,
											onChange: (event) => setForm({
												...form,
												sortOrder: event.target.value
											})
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$4, {
									label: "Expiry",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "datetime-local",
										value: form.expiresAt,
										onChange: (event) => setForm({
											...form,
											expiresAt: event.target.value
										})
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-6",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex items-center gap-2 text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
											checked: form.isActive,
											onCheckedChange: (value) => setForm({
												...form,
												isActive: value
											})
										}), "Active"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex items-center gap-2 text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
											checked: form.isFeatured,
											onCheckedChange: (value) => setForm({
												...form,
												isFeatured: value
											})
										}), "Featured"]
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							onClick: () => setForm(null),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "jade",
							disabled: !form || form.title.trim().length < 2 || saveAction.isPending,
							onClick: () => {
								if (!form) return;
								if (form.offerKind !== "task_proof" && !form.clickUrl.trim()) {
									toast.error("Click URL is required for this offer type.");
									return;
								}
								saveAction.mutate(form);
							},
							children: saveAction.isPending ? "Saving…" : "Save offer"
						})] })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
				open: Boolean(pendingDelete),
				onOpenChange: (open) => !open && setPendingDelete(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogTitle, { children: [
					"Delete “",
					pendingDelete?.title,
					"”?"
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, { children: "This removes the manual offer. If users already claimed it, the offer is deactivated instead so claim history stays intact." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "Cancel" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
					onClick: () => pendingDelete && deleteAction.mutate(pendingDelete.id),
					children: "Delete"
				})] })] })
			})
		]
	});
}
/**
* Decorative badges shown on the offer card.
*
* DISPLAY ONLY: neither field touches reward_amount, the reward maths or
* crediting. They are rendered verbatim next to (or instead of) the reward
* figure, purely so an offer can advertise something like "$5 · 110%".
*
* Either, both or neither may be filled. With neither, the card falls back to
* the real reward amount.
*/
function DisplayBadgeFields({ form, setForm }) {
	const preview = offerDisplayBadge({
		display_price: form.displayPrice,
		display_percent: form.displayPercent
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3 rounded-xl border border-border bg-card p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-0.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					className: "text-xs text-muted-foreground",
					children: "Card badges (optional)"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] text-muted-foreground",
					children: "Shown on the offer card instead of the reward figure. Cosmetic only — these never change what a user is paid."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$4, {
					label: "Display price",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "$5",
						value: form.displayPrice,
						"data-testid": "offer-form-display-price",
						onChange: (event) => setForm({
							...form,
							displayPrice: event.target.value
						})
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$4, {
					label: "Display percent",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						inputMode: "decimal",
						placeholder: "110",
						value: form.displayPercent,
						"data-testid": "offer-form-display-percent",
						onChange: (event) => setForm({
							...form,
							displayPercent: event.target.value
						})
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "rounded-lg bg-background-alt px-3 py-2 text-xs",
				"data-testid": "offer-form-display-preview",
				children: [
					"Card shows:",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-amount text-gold-dark",
						children: preview ?? formatReward(Number(form.rewardAmount) || 0)
					}),
					preview ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted-foreground",
						children: " (the reward, since no badge is set)"
					})
				]
			})
		]
	});
}
function Field$4({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			className: "text-xs text-muted-foreground",
			children: label
		}), children]
	});
}
/** Client-side preview only — the server enforces the real reward on save/approval. */
function computeEffective(cost, pct, cap) {
	const c = Number(cost);
	const p = Number(pct);
	const k = cap.trim() === "" ? null : Number(cap);
	if (!Number.isFinite(c) || c <= 0) return 0;
	const raw = c * (Number.isFinite(p) ? p : 110) / 100;
	return Math.max(0, Math.round((k != null && Number.isFinite(k) ? Math.min(raw, k) : raw) * 100) / 100);
}
var emptyForm$3 = (order) => ({
	stepKey: `custom_${order}`,
	title: "",
	subtitle: "",
	description: "",
	stepType: "showcase",
	ctaText: "Next →",
	displayOrder: String(order),
	enabled: true,
	accentStyle: "gold",
	position: "bottom",
	illustration: "spark",
	icon: "sparkles"
});
var toForm = (step) => ({
	id: step.id,
	stepKey: step.step_key,
	title: step.title,
	subtitle: step.subtitle,
	description: step.description,
	stepType: step.step_type,
	ctaText: step.cta_text,
	displayOrder: String(step.display_order),
	enabled: step.enabled,
	accentStyle: step.accent_style,
	position: step.position,
	illustration: step.illustration ?? "",
	icon: step.icon ?? ""
});
function PremiumOnboardingManager() {
	const queryClient = useQueryClient();
	const fetchSteps = useServerFn(listAdminPremiumOnboardingSteps);
	const save = useServerFn(savePremiumOnboardingStep);
	const remove = useServerFn(deletePremiumOnboardingStep);
	const reorder = useServerFn(reorderPremiumOnboardingSteps);
	const [form, setForm] = (0, import_react.useState)(null);
	const [preview, setPreview] = (0, import_react.useState)(null);
	const steps = useQuery({
		queryKey: ["admin-premium-onboarding"],
		queryFn: () => fetchSteps({})
	});
	const list = (steps.data ?? []).slice().sort((a, b) => a.display_order - b.display_order);
	const refresh = () => {
		queryClient.invalidateQueries({ queryKey: ["admin-premium-onboarding"] });
		queryClient.invalidateQueries({ queryKey: ["premium-onboarding-steps"] });
	};
	const onError = (error) => toast.error(error.message);
	const saveAction = useMutation({
		mutationFn: (state) => save({ data: {
			...state.id ? { id: state.id } : {},
			stepKey: state.stepKey,
			title: state.title,
			subtitle: state.subtitle,
			description: state.description,
			stepType: state.stepType,
			ctaText: state.ctaText,
			displayOrder: Number(state.displayOrder) || 0,
			enabled: state.enabled,
			accentStyle: state.accentStyle,
			position: state.position,
			illustration: state.illustration || null,
			icon: state.icon || null
		} }),
		onSuccess: () => {
			toast.success("Premium step saved.");
			setForm(null);
			refresh();
		},
		onError
	});
	const deleteAction = useMutation({
		mutationFn: (id) => remove({ data: { id } }),
		onSuccess: () => {
			toast.success("Step deleted.");
			refresh();
		},
		onError
	});
	const reorderAction = useMutation({
		mutationFn: (ids) => reorder({ data: { orderedIds: ids } }),
		onSuccess: refresh,
		onError
	});
	const move = (id, direction) => {
		const index = list.findIndex((step) => step.id === id);
		const next = index + direction;
		if (index < 0 || next < 0 || next >= list.length) return;
		const reordered = list.slice();
		const first = reordered[index];
		const second = reordered[next];
		if (!first || !second) return;
		[reordered[index], reordered[next]] = [second, first];
		reorderAction.mutate(reordered.map((step) => step.id));
	};
	const toggle = (step) => saveAction.mutate(toForm({
		...step,
		enabled: !step.enabled
	}));
	const duplicate = (step) => {
		const duplicated = toForm({
			...step,
			step_key: `${step.step_key}_copy`,
			display_order: list.length + 1
		});
		delete duplicated.id;
		saveAction.mutate(duplicated);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		"data-testid": "premium-onboarding-manager",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-2xl bg-jade-gradient p-4 text-primary-foreground shadow-lift",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] font-bold uppercase tracking-[0.2em] text-gold",
							children: "Premium flow"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mt-1 font-display text-xl",
							children: "Shape the first impression"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 max-w-md text-xs text-primary-foreground/70",
							children: "Manage the nine-step earning introduction without touching the existing Home layout."
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: "gold",
						onClick: () => setForm(emptyForm$3(list.length + 1)),
						"data-testid": "onboarding-add-step-btn",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 size-4" }), " Add step"]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: "Enabled steps appear in the mobile onboarding experience. Static showcase steps never load live earning data."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: "outline",
					onClick: () => setPreview(list.find((step) => step.enabled) ?? null),
					disabled: !list.length,
					"data-testid": "onboarding-preview-btn",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "mr-1 size-4" }), " Preview"]
				})]
			}),
			steps.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Loading premium steps…"
			}) : !list.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				icon: Plus,
				title: "No premium steps yet",
				description: "Create a step or apply the preset flow."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-2",
				"data-testid": "premium-onboarding-steps-list",
				children: list.map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "surface-card space-y-3 p-3",
					"data-testid": `onboarding-step-row-${step.id}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "grid size-7 place-items-center rounded-lg bg-background-alt text-xs font-bold text-primary",
										children: index + 1
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-semibold",
										children: step.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "rounded-full bg-background-alt px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground",
										children: step.step_type
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-muted-foreground",
								children: step.subtitle || step.step_key
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: step.enabled,
							onCheckedChange: () => toggle(step),
							"data-testid": `onboarding-step-toggle-${step.id}`
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "outline",
								disabled: index === 0,
								onClick: () => move(step.id, -1),
								"data-testid": `onboarding-step-up-${step.id}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, { className: "size-3.5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "outline",
								disabled: index === list.length - 1,
								onClick: () => move(step.id, 1),
								"data-testid": `onboarding-step-down-${step.id}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDown, { className: "size-3.5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								variant: "outline",
								onClick: () => setPreview(step),
								"data-testid": `onboarding-step-preview-${step.id}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "mr-1 size-3.5" }), " Preview"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								variant: "outline",
								onClick: () => setForm(toForm(step)),
								"data-testid": `onboarding-step-edit-${step.id}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "mr-1 size-3.5" }), " Edit"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								variant: "outline",
								onClick: () => duplicate(step),
								"data-testid": `onboarding-step-duplicate-${step.id}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "mr-1 size-3.5" }), " Duplicate"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								variant: "outline",
								onClick: () => deleteAction.mutate(step.id),
								"data-testid": `onboarding-step-delete-${step.id}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "mr-1 size-3.5" }), " Delete"]
							})
						]
					})]
				}, step.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: Boolean(form),
				onOpenChange: (open) => !open && setForm(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-h-[88vh] overflow-y-auto",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: form?.id ? "Edit premium step" : "Add premium step" }) }),
						form && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$3, {
									label: "Step key",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.stepKey,
										onChange: (event) => setForm({
											...form,
											stepKey: event.target.value
										}),
										"data-testid": "onboarding-form-step-key"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$3, {
									label: "Title",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.title,
										onChange: (event) => setForm({
											...form,
											title: event.target.value
										}),
										"data-testid": "onboarding-form-title"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$3, {
									label: "Subtitle",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.subtitle,
										onChange: (event) => setForm({
											...form,
											subtitle: event.target.value
										}),
										"data-testid": "onboarding-form-subtitle"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$3, {
									label: "Description",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
										rows: 3,
										value: form.description,
										onChange: (event) => setForm({
											...form,
											description: event.target.value
										}),
										"data-testid": "onboarding-form-description"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$3, {
										label: "Step type",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											value: form.stepType,
											onChange: (event) => setForm({
												...form,
												stepType: event.target.value
											}),
											className: "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm",
											"data-testid": "onboarding-form-step-type",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "welcome",
													children: "Welcome"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "avatar",
													children: "Avatar picker"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "profile",
													children: "Profile form"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "showcase",
													children: "Static showcase"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "celebration",
													children: "Ready banner"
												})
											]
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$3, {
										label: "CTA text",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: form.ctaText,
											onChange: (event) => setForm({
												...form,
												ctaText: event.target.value
											}),
											"data-testid": "onboarding-form-cta"
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$3, {
										label: "Order",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											inputMode: "numeric",
											value: form.displayOrder,
											onChange: (event) => setForm({
												...form,
												displayOrder: event.target.value
											}),
											"data-testid": "onboarding-form-order"
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex items-end gap-2 pb-2 text-sm",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
												checked: form.enabled,
												onCheckedChange: (enabled) => setForm({
													...form,
													enabled
												}),
												"data-testid": "onboarding-form-enabled"
											}),
											" ",
											"Enabled"
										]
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							onClick: () => setForm(null),
							"data-testid": "onboarding-form-cancel",
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "jade",
							disabled: !form?.title.trim() || saveAction.isPending,
							onClick: () => form && saveAction.mutate(form),
							"data-testid": "onboarding-form-save",
							children: saveAction.isPending ? "Saving…" : "Save step"
						})] })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: Boolean(preview),
				onOpenChange: (open) => !open && setPreview(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Step preview" }) }), preview && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "premium-preview-card rounded-3xl bg-[#faf8f5] p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-[10px] font-bold uppercase tracking-[0.2em] text-[#98751f]",
						children: [
							preview.step_type,
							" · ",
							preview.step_key
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 rounded-3xl bg-[#0b2b28] p-6 text-white",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-bold uppercase tracking-[0.18em] text-[#f3d068]",
								children: "CashGPT premium"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mt-3 font-display text-3xl",
								children: preview.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-[#b9d2cb]",
								children: preview.subtitle
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm leading-relaxed text-[#b9d2cb]/80",
								children: preview.description
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-6 inline-flex rounded-xl bg-[#d4af37] px-4 py-2 text-xs font-extrabold text-[#0b2b28]",
								children: preview.cta_text
							})
						]
					})]
				})] })
			})
		]
	});
}
function Field$3({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			className: "text-xs text-muted-foreground",
			children: label
		}), children]
	});
}
/**
* Usable links currently entered on the form.
*
* A link-driven quest with zero links is publishable on purpose: the Active
* toggle is respected either way, and the user-facing start call returns a soft
* "link coming soon" instead of an error. This only trims the values that get
* sent (half-typed rows would fail the step schema) and drives the
* "No links yet" hint.
*/
function linkInfo(state) {
	const filledLockerUrls = state.lockerUrls.map((url) => url.trim()).filter(Boolean);
	const filledShortlinkSteps = state.shortlinkSteps.filter((s) => s.network.trim() && s.url.trim()).map((s) => ({
		network: s.network.trim(),
		url: s.url.trim()
	}));
	const linkDriven = state.questType === "locker" || state.questType === "shortlink";
	const availableLinks = state.questType === "locker" ? filledLockerUrls.length : filledShortlinkSteps.length;
	return {
		filledLockerUrls,
		filledShortlinkSteps,
		availableLinks,
		/** Publishable, but worth flagging so the admin remembers to fill it in. */
		noLinksYet: linkDriven && availableLinks === 0
	};
}
/**
* One-line lock summary for the admin list.
*
* Handles every lock_type explicitly — the previous inline ternary only covered
* 'time' and 'earning', so a 'first_withdrawal' quest rendered "Earn $NaN".
*/
function lockSummary(quest) {
	if (quest.lock_type === "time") return `Until ${new Date(String(quest.unlock_at)).toLocaleDateString()}`;
	if (quest.lock_type === "earning") return `Earn $${Number(quest.required_lifetime_earned ?? 0).toFixed(2)}`;
	if (quest.lock_type === "first_withdrawal") return "Until first withdrawal";
	return "Locked";
}
var emptyForm$2 = () => ({
	key: "",
	label: "",
	icon: "gift",
	questType: "ads",
	adsRequired: "5",
	rewardAmount: "1",
	stepReward: "0",
	stepRewards: "",
	shortlinkSteps: [
		{
			network: "",
			url: ""
		},
		{
			network: "",
			url: ""
		},
		{
			network: "",
			url: ""
		}
	],
	minSecondsPerStep: "15",
	lockerUrls: [""],
	totalDays: "3",
	requiredActiveSeconds: "300",
	streakMode: "consecutive",
	graceDays: "0",
	day1AutoComplete: true,
	repeatable: false,
	defaultTimezone: "Asia/Kolkata",
	isActive: true,
	sortOrder: "0",
	lockType: "none",
	unlockAt: "",
	requiredLifetimeEarned: "",
	appOnly: false,
	networkProviderIds: [],
	requiredCount: "3",
	minQualifyingUsd: "0.01",
	tokenTtlHours: "24",
	rewardHoldHours: "0",
	creditOfferReward: false,
	requiredSurveys: "5",
	allowedNetworks: [
		"cpxresearch",
		"theoremreach",
		"timewall"
	],
	minPayoutUsd: "0.50",
	maxLoi: null,
	feedKind: null,
	stepsCount: "10",
	backupCount: "4",
	feedProviderIds: [],
	minRewardUsd: "0.10",
	minCompletionRate: "50",
	maxPerNetwork: "",
	blockedDomains: "",
	feedTokenTtlHours: "48",
	timedSteps: [{
		reward: "0.01",
		adNetwork: "monetag",
		pushNetwork: "none"
	}],
	timedStepSeconds: "60",
	timedCheckpointSeconds: "10",
	timedMaxFailedTaps: "2",
	targetMinutes: "30",
	dailyCapMinutes: "120",
	graceMinutes: "10"
});
function QuestsManager() {
	const queryClient = useQueryClient();
	const fetchQuests = useServerFn(listAdminQuests);
	const fetchSdkProviders = useServerFn(listSdkProvidersForQuests);
	const save = useServerFn(saveQuest);
	const remove = useServerFn(deleteQuest);
	const [form, setForm] = (0, import_react.useState)(null);
	const [formDirty, setFormDirty] = (0, import_react.useState)(false);
	const [pendingDelete, setPendingDelete] = (0, import_react.useState)(null);
	const quests = useQuery({
		queryKey: ["admin-quests"],
		queryFn: () => fetchQuests({})
	});
	const sdkProviders = useQuery({
		queryKey: ["sdk-providers-for-quests"],
		queryFn: () => fetchSdkProviders({})
	});
	const refresh = () => {
		if (!formDirty) {
			queryClient.invalidateQueries({ queryKey: ["admin-quests"] });
			queryClient.invalidateQueries({ queryKey: ["quests-active"] });
		}
	};
	const onError = (error) => {
		console.error(error);
		toast.error(error.message);
	};
	const saveAction = useMutation({
		mutationFn: (state) => save({ data: {
			...state.id ? { id: state.id } : {},
			key: state.key.trim(),
			label: state.label.trim(),
			icon: state.icon.trim() || "gift",
			questType: state.questType,
			adsRequired: Number(state.adsRequired) || 0,
			rewardAmount: Number(state.rewardAmount) || 0,
			stepReward: Number(state.stepReward) || 0,
			stepRewards: state.stepRewards.trim() ? state.stepRewards.split(",").map((s) => Number(s.trim())).filter((n) => !isNaN(n)) : null,
			...state.questType === "shortlink" ? { shortlinkSteps: linkInfo(state).filledShortlinkSteps } : {},
			minSecondsPerStep: Number(state.minSecondsPerStep) || 15,
			...state.questType === "locker" ? { lockerUrls: linkInfo(state).filledLockerUrls } : {},
			totalDays: Number(state.totalDays) || 3,
			requiredActiveSeconds: Number(state.requiredActiveSeconds) || 300,
			streakMode: state.streakMode,
			graceDays: Number(state.graceDays) || 0,
			day1AutoComplete: state.day1AutoComplete,
			repeatable: state.repeatable,
			defaultTimezone: state.defaultTimezone || "Asia/Kolkata",
			isActive: state.isActive,
			sortOrder: Number(state.sortOrder) || 0,
			lockType: state.lockType,
			unlockAt: state.lockType === "time" && state.unlockAt ? state.unlockAt : null,
			requiredLifetimeEarned: state.lockType === "earning" && state.requiredLifetimeEarned ? Number(state.requiredLifetimeEarned) : null,
			appOnly: state.appOnly,
			...state.questType === "network" ? {
				networkProviderIds: state.networkProviderIds,
				requiredCount: Number(state.requiredCount) || 3,
				minQualifyingUsd: Number(state.minQualifyingUsd) || .01,
				tokenTtlHours: Number(state.tokenTtlHours) || 24,
				rewardHoldHours: Number(state.rewardHoldHours) || 0,
				creditOfferReward: state.creditOfferReward
			} : {},
			...state.questType === "survey" ? {
				requiredSurveys: Number(state.requiredSurveys) || 5,
				allowedNetworks: state.allowedNetworks,
				minPayoutUsd: Number(state.minPayoutUsd) || .5,
				maxLoi: state.maxLoi ? Number(state.maxLoi) : null
			} : {},
			...state.questType === "feed_ptc" || state.questType === "feed_shortlink" || state.questType === "feed_article" ? {
				feedKind: state.questType === "feed_ptc" ? "ptc" : state.questType === "feed_shortlink" ? "shortlink" : "article",
				stepsCount: Number(state.stepsCount) || 10,
				backupCount: Number(state.backupCount) || 4,
				feedProviderIds: state.feedProviderIds,
				minRewardUsd: Number(state.minRewardUsd) || .1,
				minCompletionRate: Number(state.minCompletionRate) || 50,
				maxPerNetwork: state.maxPerNetwork ? Number(state.maxPerNetwork) : null,
				blockedDomains: state.blockedDomains.trim() ? state.blockedDomains.split(",").map((d) => d.trim()).filter(Boolean) : [],
				tokenTtlHours: Number(state.feedTokenTtlHours) || 48,
				creditOfferReward: state.creditOfferReward
			} : {},
			...state.questType === "timed_ptc" ? {
				timedSteps: state.timedSteps.map((s) => ({
					ad_network: s.adNetwork,
					push_network: s.pushNetwork
				})),
				timedStepSeconds: Number(state.timedStepSeconds) || 60,
				timedCheckpointSeconds: Number(state.timedCheckpointSeconds) || 10,
				timedMaxFailedTaps: Number(state.timedMaxFailedTaps) || 2,
				stepRewards: state.timedSteps.map((s) => Number(s.reward) || 0)
			} : {},
			...state.questType === "active_time" ? {
				targetMinutes: Number(state.targetMinutes) || 30,
				dailyCapMinutes: Number(state.dailyCapMinutes) || 120,
				graceMinutes: Number(state.graceMinutes) || 10
			} : {}
		} }),
		onSuccess: () => {
			toast.success("Quest saved.");
			setForm(null);
			setFormDirty(false);
			refresh();
		},
		onError
	});
	const deleteAction = useMutation({
		mutationFn: (id) => remove({ data: { id } }),
		onSuccess: (result) => {
			toast.success(result.deleted ? "Quest deleted." : "Quest had sessions — deactivated instead.");
			setPendingDelete(null);
			refresh();
		},
		onError
	});
	const openEdit = (quest) => setForm({
		id: quest.id,
		key: quest.key,
		label: quest.label,
		icon: quest.icon,
		questType: quest.quest_type,
		adsRequired: String(quest.ads_required ?? 0),
		rewardAmount: String(quest.reward_amount ?? 0),
		stepReward: String(quest.step_reward ?? 0),
		stepRewards: quest.step_rewards?.join(", ") ?? "",
		shortlinkSteps: quest.shortlink_steps?.length ? quest.shortlink_steps.slice(0, 10).map((s) => ({ ...s })) : [{
			network: "",
			url: ""
		}],
		minSecondsPerStep: String(quest.min_seconds_per_step ?? 15),
		lockerUrls: quest.locker_urls?.length ? [...quest.locker_urls].slice(0, 3) : [""],
		totalDays: String(quest.total_days ?? 3),
		requiredActiveSeconds: String(quest.required_active_seconds ?? 300),
		streakMode: quest.streak_mode ?? "consecutive",
		graceDays: String(quest.grace_days ?? 0),
		day1AutoComplete: quest.day1_auto_complete ?? true,
		repeatable: quest.repeatable ?? false,
		defaultTimezone: quest.default_timezone ?? "Asia/Kolkata",
		isActive: quest.is_active,
		sortOrder: String(quest.sort_order ?? 0),
		lockType: quest.lock_type ?? "none",
		unlockAt: String(quest.unlock_at ?? ""),
		requiredLifetimeEarned: String(quest.required_lifetime_earned ?? ""),
		appOnly: Boolean(quest.app_only ?? false),
		networkProviderIds: Array.isArray(quest.network_provider_ids) ? quest.network_provider_ids : [],
		requiredCount: String(quest.required_count ?? 3),
		minQualifyingUsd: String(quest.min_qualifying_usd ?? .01),
		tokenTtlHours: String(quest.token_ttl_hours ?? 24),
		rewardHoldHours: String(quest.reward_hold_hours ?? 0),
		creditOfferReward: Boolean(quest.credit_offer_reward ?? false),
		requiredSurveys: String(quest.required_surveys ?? 5),
		allowedNetworks: Array.isArray(quest.allowed_networks) ? quest.allowed_networks : [
			"cpxresearch",
			"theoremreach",
			"timewall"
		],
		minPayoutUsd: String(quest.min_payout_usd ?? .5),
		maxLoi: quest.max_loi ? String(quest.max_loi) : null,
		feedKind: quest.feed_kind ?? null,
		stepsCount: String(quest.steps_count ?? 10),
		backupCount: String(quest.backup_count ?? 4),
		feedProviderIds: Array.isArray(quest.feed_provider_ids) ? quest.feed_provider_ids : [],
		minRewardUsd: String(quest.min_reward_usd ?? .1),
		minCompletionRate: String(quest.min_completion_rate ?? 50),
		maxPerNetwork: quest.max_per_network ? String(quest.max_per_network) : "",
		blockedDomains: Array.isArray(quest.blocked_domains) ? quest.blocked_domains.join(", ") : "",
		feedTokenTtlHours: String(quest.token_ttl_hours ?? 48),
		timedSteps: Array.isArray(quest.timed_steps) && quest.timed_steps.length > 0 ? quest.timed_steps.map((s, idx) => ({
			reward: String(quest.step_rewards && quest.step_rewards[idx] != null ? quest.step_rewards[idx] : .01),
			adNetwork: s.ad_network || "monetag",
			pushNetwork: s.push_network || "none"
		})) : [{
			reward: "0.01",
			adNetwork: "monetag",
			pushNetwork: "none"
		}],
		timedStepSeconds: String(quest.timed_step_seconds ?? 60),
		timedCheckpointSeconds: String(quest.timed_checkpoint_seconds ?? 10),
		timedMaxFailedTaps: String(quest.timed_max_failed_taps ?? 2),
		targetMinutes: String(quest.target_minutes ?? 30),
		dailyCapMinutes: String(quest.daily_cap_minutes ?? 120),
		graceMinutes: String(quest.grace_minutes ?? 10)
	});
	const { noLinksYet, filledLockerUrls } = form ? linkInfo(form) : {
		noLinksYet: false,
		filledLockerUrls: []
	};
	const canSave = form && form.key.trim().length >= 2 && form.label.trim().length >= 1 && (form.questType === "ads" ? Number(form.adsRequired) > 0 : form.questType === "locker" ? filledLockerUrls.length <= 10 : form.questType === "shortlink" ? form.shortlinkSteps.length <= 10 && form.shortlinkSteps.every((s) => !s.network.trim() && !s.url.trim() || s.network.trim() && s.url.trim()) : form.questType === "checkin" ? Number(form.totalDays) > 0 && Number(form.totalDays) <= 365 : form.questType === "network" ? form.networkProviderIds.length > 0 && Number(form.requiredCount) > 0 && Number(form.requiredCount) <= form.networkProviderIds.length && !form.day1AutoComplete : form.questType === "survey" ? form.allowedNetworks.length > 0 && Number(form.requiredSurveys) > 0 : form.questType === "timed_ptc" ? form.timedSteps.length > 0 && form.timedSteps.every((s) => Number(s.reward) > 0) : form.questType === "active_time" ? Number(form.targetMinutes) > 0 && Number(form.dailyCapMinutes) > 0 && Number(form.graceMinutes) > 0 : form.questType === "feed_ptc" || form.questType === "feed_shortlink" || form.questType === "feed_article" ? form.feedProviderIds.length > 0 && Number(form.stepsCount) > 0 : true);
	const saveValidationReason = !form ? "No quest selected" : form.key.trim().length < 2 ? "Quest key must be at least 2 characters" : form.label.trim().length < 1 ? "Quest label is required" : form.questType === "ads" && Number(form.adsRequired) <= 0 ? "Ads required must be greater than 0" : form.questType === "locker" && filledLockerUrls.length > 10 ? `Cannot have more than 10 locker URLs` : form.questType === "shortlink" && form.shortlinkSteps.length > 10 ? `Cannot have more than 10 shortlink steps` : form.questType === "shortlink" && !form.shortlinkSteps.every((s) => !s.network.trim() && !s.url.trim() || s.network.trim() && s.url.trim()) ? "All shortlink steps must be complete (network + URL) or empty" : form.questType === "checkin" && Number(form.totalDays) <= 0 ? "Check-in quest must have at least 1 day" : form.questType === "checkin" && Number(form.totalDays) > 365 ? "Check-in quest cannot exceed 365 days" : form.questType === "network" && form.networkProviderIds.length === 0 ? "Network quest must have at least one provider selected" : form.questType === "network" && Number(form.requiredCount) <= 0 ? "Network quest must require at least 1 completion" : form.questType === "network" && Number(form.requiredCount) > form.networkProviderIds.length ? "Required completions cannot exceed pool size" : form.questType === "network" && form.day1AutoComplete ? "Network quests cannot have Day-1 auto-complete enabled" : form.questType === "survey" && form.allowedNetworks.length === 0 ? "Survey quest must have at least one network selected" : form.questType === "survey" && Number(form.requiredSurveys) <= 0 ? "Survey quest must require at least 1 survey" : form.questType === "timed_ptc" && form.timedSteps.length === 0 ? "Timed PTC quest must have at least one step" : form.questType === "timed_ptc" && !form.timedSteps.every((s) => Number(s.reward) > 0) ? "All timed PTC steps must have a reward > 0" : form.questType === "active_time" && Number(form.targetMinutes) <= 0 ? "Active time quest must have target minutes > 0" : form.questType === "active_time" && Number(form.dailyCapMinutes) <= 0 ? "Active time quest must have daily cap > 0" : form.questType === "active_time" && Number(form.graceMinutes) <= 0 ? "Active time quest must have grace minutes > 0" : (form.questType === "feed_ptc" || form.questType === "feed_shortlink" || form.questType === "feed_article") && form.feedProviderIds.length === 0 ? "Feed quest must have at least one provider selected" : (form.questType === "feed_ptc" || form.questType === "feed_shortlink" || form.questType === "feed_article") && Number(form.stepsCount) <= 0 ? "Feed quest must have at least 1 step" : "";
	const origin = typeof window !== "undefined" ? window.location.origin : "https://yourapp.com";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Manage the starter quest row shown on the home screen."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: "gold",
					onClick: () => setForm(emptyForm$2()),
					"data-testid": "quest-new-btn",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-4 w-4" }), " New quest"]
				})]
			}),
			quests.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Loading quests…"
			}) : !quests.data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				icon: Plus,
				title: "No quests yet",
				description: "Create a starter quest to get things going."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-2",
				"data-testid": "admin-quests-list",
				children: quests.data.map((quest) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "surface-card space-y-1 p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-sm font-semibold",
									children: quest.label
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: [
										quest.key,
										" · ",
										quest.quest_type,
										quest.quest_type === "ads" ? ` · ${quest.ads_required} ads` : quest.quest_type === "locker" ? ` · ${quest.locker_urls.length} ${quest.locker_urls.length === 1 ? "locker" : "lockers"}` : ` · ${quest.shortlink_steps.length} shortlinks`,
										"· reward ",
										formatReward(quest.reward_amount),
										" · sort ",
										quest.sort_order
									]
								}),
								(quest.quest_type === "locker" || quest.quest_type === "shortlink") && (quest.quest_type === "locker" ? quest.locker_urls.length : quest.shortlink_steps.length) === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
									"data-testid": `quest-no-links-badge-${quest.key}`,
									children: "No links yet"
								}),
								quest.lock_type !== "none" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-amber-600",
									children: ["🔒 ", lockSummary(quest)]
								}),
								quest.app_only && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
									"data-testid": `quest-app-only-badge-${quest.key}`,
									children: "App only"
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${quest.is_active ? "bg-primary/15 text-primary" : "bg-background-alt text-muted-foreground"}`,
							children: quest.is_active ? "Active" : "Inactive"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "outline",
							onClick: () => openEdit(quest),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "mr-1 h-3.5 w-3.5" }), " Edit"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "outline",
							onClick: () => setPendingDelete(quest),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "mr-1 h-3.5 w-3.5" }), " Delete"]
						})]
					})]
				}, quest.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: Boolean(form),
				onOpenChange: (open) => !open && setForm(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
					className: "max-h-[85vh] overflow-y-auto",
					children: form && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: form?.id ? "Edit quest" : "New quest" }) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
										label: "Key (unique)",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: form.key,
											disabled: Boolean(form.id),
											placeholder: "starter_5",
											onChange: (event) => setForm({
												...form,
												key: event.target.value
											})
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
										label: "Label",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: form.label,
											onChange: (event) => setForm({
												...form,
												label: event.target.value
											})
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
										label: "Icon (lucide name or URL)",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: form.icon,
											onChange: (event) => setForm({
												...form,
												icon: event.target.value
											})
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
										label: "Final bonus (on completion) ($)",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											inputMode: "decimal",
											value: form.rewardAmount,
											onChange: (event) => setForm({
												...form,
												rewardAmount: event.target.value
											})
										})
									})]
								}),
								(form.questType === "shortlink" || form.questType === "locker") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2 rounded-lg border border-dashed border-primary/40 bg-background-alt p-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-semibold text-primary",
											children: "💰 Per-step rewards (shortlink & locker only)"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-2 gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
												label: "Reward per step ($)",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													inputMode: "decimal",
													value: form.stepReward,
													placeholder: "0.50",
													onChange: (event) => setForm({
														...form,
														stepReward: event.target.value
													})
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
												label: "Custom reward per step (optional)",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													inputMode: "decimal",
													value: form.stepRewards,
													placeholder: "0.50, 0.75, 1.00",
													onChange: (event) => setForm({
														...form,
														stepRewards: event.target.value
													})
												})
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[11px] text-muted-foreground",
											children: "Custom rewards override the default per-step amount. Enter comma-separated values, one per step. Steps without a custom value use the default."
										}),
										(() => {
											const stepCount = form.questType === "shortlink" ? linkInfo(form).filledShortlinkSteps.length : linkInfo(form).filledLockerUrls.length;
											const baseReward = Number(form.stepReward) || 0;
											const customRewards = form.stepRewards.split(",").map((s) => s.trim()).filter((s) => s !== "").map((s) => Number(s)).filter((n) => !isNaN(n));
											const stepRewards = Array.from({ length: stepCount }, (_, i) => customRewards[i] !== void 0 ? customRewards[i] : baseReward);
											const totalStepRewards = stepRewards.reduce((sum, r) => sum + r, 0);
											const completionBonus = Number(form.rewardAmount) || 0;
											const totalPayout = totalStepRewards + completionBonus;
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "rounded-lg bg-background p-2 text-xs",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-semibold",
													children: "Total payout breakdown:"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
													className: "mt-1 space-y-0.5 text-muted-foreground",
													children: [
														stepRewards.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
															"Step ",
															i + 1,
															": ",
															formatReward(r)
														] }, i)),
														completionBonus > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["Completion bonus: ", formatReward(completionBonus)] }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
															className: "font-semibold text-primary",
															children: ["Total: ", formatReward(totalPayout)]
														})
													]
												})]
											});
										})()
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
									label: "Quest type",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex flex-wrap gap-2",
										children: [
											"ads",
											"shortlink",
											"locker",
											"checkin",
											"network",
											"survey",
											"feed_ptc",
											"feed_shortlink",
											"feed_article",
											"timed_ptc",
											"active_time"
										].map((type) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: form.questType === type ? "jade" : "outline",
											onClick: () => {
												const newForm = {
													...form,
													questType: type
												};
												if (type === "feed_ptc") newForm.feedKind = "ptc";
												else if (type === "feed_shortlink") newForm.feedKind = "shortlink";
												else if (type === "feed_article") newForm.feedKind = "article";
												else newForm.feedKind = null;
												setForm(newForm);
											},
											className: "capitalize",
											children: type === "ads" ? "Ads" : type === "shortlink" ? "Shortlink Chain" : type === "locker" ? "Content Locker" : type === "checkin" ? "Check-in" : type === "network" ? "Network" : type === "survey" ? "Survey" : type === "feed_ptc" ? "Top PTC" : type === "feed_shortlink" ? "Top Shortlinks" : type === "feed_article" ? "Top Articles" : type === "timed_ptc" ? "Timed PTC" : "Active Time"
										}, type))
									})
								}),
								form.questType === "ads" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
									label: "Ads required",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										inputMode: "numeric",
										value: form.adsRequired,
										onChange: (event) => setForm({
											...form,
											adsRequired: event.target.value
										})
									})
								}) : form.questType === "checkin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-muted-foreground",
											children: "Daily check-in quest with streak tracking. Each day = one step."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-2 gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
												label: "Total days",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "number",
													min: "1",
													max: "365",
													value: form.totalDays,
													onChange: (event) => setForm({
														...form,
														totalDays: event.target.value
													})
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
												label: "Active seconds/day (0 = tap-only)",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "number",
													min: "0",
													max: "86400",
													value: form.requiredActiveSeconds,
													placeholder: "300",
													onChange: (event) => setForm({
														...form,
														requiredActiveSeconds: event.target.value
													})
												})
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field$2, {
											label: "Streak mode",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													type: "button",
													size: "sm",
													variant: form.streakMode === "consecutive" ? "jade" : "outline",
													onClick: () => setForm({
														...form,
														streakMode: "consecutive"
													}),
													children: "Consecutive"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													type: "button",
													size: "sm",
													variant: form.streakMode === "total" ? "jade" : "outline",
													onClick: () => setForm({
														...form,
														streakMode: "total"
													}),
													children: "Total (any N days)"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-1 text-xs text-muted-foreground",
												children: form.streakMode === "consecutive" ? "Missing a day resets the streak (with grace period)" : "Any N distinct days complete it, gaps allowed"
											})]
										}),
										form.streakMode === "consecutive" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
											label: "Grace days (before reset)",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "number",
												min: "0",
												max: "30",
												value: form.graceDays,
												onChange: (event) => setForm({
													...form,
													graceDays: event.target.value
												})
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field$2, {
											label: "Default timezone",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
												className: "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
												value: form.defaultTimezone,
												onChange: (event) => setForm({
													...form,
													defaultTimezone: event.target.value
												}),
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("optgroup", {
														label: "South Asia",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																value: "Asia/Kolkata",
																children: "India (Asia/Kolkata) +5:30"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																value: "Asia/Kathmandu",
																children: "Nepal (Asia/Kathmandu) +5:45"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																value: "Asia/Dhaka",
																children: "Bangladesh (Asia/Dhaka) +6:00"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																value: "Asia/Karachi",
																children: "Pakistan (Asia/Karachi) +5:00"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																value: "Asia/Colombo",
																children: "Sri Lanka (Asia/Colombo) +5:30"
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("optgroup", {
														label: "Southeast Asia",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																value: "Asia/Bangkok",
																children: "Thailand (Asia/Bangkok) +7:00"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																value: "Asia/Singapore",
																children: "Singapore +8:00"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																value: "Asia/Manila",
																children: "Philippines (Asia/Manila) +8:00"
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("optgroup", {
														label: "Other",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																value: "UTC",
																children: "UTC"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																value: "America/New_York",
																children: "US Eastern"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																value: "Europe/London",
																children: "UK (Europe/London)"
															})
														]
													})
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-1 text-xs text-muted-foreground",
												children: "Used for users without a timezone set"
											})]
										}),
										(() => {
											const totalDays = Number(form.totalDays) || 0;
											const baseReward = Number(form.stepReward) || 0;
											const customRewards = form.stepRewards.split(",").map((s) => s.trim()).filter((s) => s !== "").map((s) => Number(s)).filter((n) => !isNaN(n));
											const dayRewards = Array.from({ length: totalDays }, (_, i) => customRewards[i] !== void 0 ? customRewards[i] : baseReward);
											const totalStepRewards = dayRewards.reduce((sum, r) => sum + r, 0);
											const completionBonus = Number(form.rewardAmount) || 0;
											const totalPayout = totalStepRewards + completionBonus;
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "rounded-lg bg-background p-2 text-xs",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-semibold",
													children: "Reward breakdown:"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
													className: "mt-1 space-y-0.5 text-muted-foreground",
													children: [
														dayRewards.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
															"Day ",
															i + 1,
															": ",
															formatReward(r)
														] }, i)),
														completionBonus > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["Completion bonus: ", formatReward(completionBonus)] }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
															className: "font-semibold text-primary",
															children: ["Total: ", formatReward(totalPayout)]
														})
													]
												})]
											});
										})(),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												className: "flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: form.day1AutoComplete,
													onChange: (e) => setForm({
														...form,
														day1AutoComplete: e.target.checked
													}),
													className: "size-4 rounded"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-sm",
													children: "Day 1 auto-complete"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground ml-6",
												children: "Automatically complete and pay Day 1 when quest starts"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												className: "flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: form.repeatable,
													onChange: (e) => setForm({
														...form,
														repeatable: e.target.checked
													}),
													className: "size-4 rounded"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-sm",
													children: "Repeatable"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground ml-6",
												children: "Quest can be completed multiple times"
											})]
										})
									]
								}) : form.questType === "locker" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-muted-foreground",
											children: "Lockers are completed in order. The reward is credited only after the last one. 1 to 3 allowed."
										}),
										form.lockerUrls.map((url, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-end gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "min-w-0 flex-1",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
													label: `Locker ${index + 1} URL (AdBlueMedia "Get Link" output URL)`,
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														value: url,
														placeholder: "https://adbluemedia.com/locker/…",
														onChange: (event) => {
															const next = [...form.lockerUrls];
															next[index] = event.target.value;
															setForm({
																...form,
																lockerUrls: next
															});
														},
														"data-testid": `quest-form-locker-url-${index}`
													})
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												type: "button",
												size: "sm",
												variant: "outline",
												disabled: form.lockerUrls.length <= 1,
												onClick: () => setForm({
													...form,
													lockerUrls: form.lockerUrls.filter((_, i) => i !== index)
												}),
												"aria-label": `Remove locker ${index + 1}`,
												"data-testid": `quest-form-locker-remove-${index}`,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
											})]
										}, index)),
										form.lockerUrls.length < 10 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											type: "button",
											size: "sm",
											variant: "outline",
											onClick: () => setForm({
												...form,
												lockerUrls: [...form.lockerUrls, ""]
											}),
											"data-testid": "quest-form-locker-add",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 size-4" }),
												" Add locker (",
												form.lockerUrls.length,
												"/",
												10,
												")"
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-xl border border-dashed border-primary/40 bg-background-alt p-3 text-xs",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-semibold",
													children: "Set this as AdBlueMedia's \"Redirect URL\" (once, in their dashboard):"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "mt-1 break-all font-mono",
													children: [
														origin,
														"/go/locker/return?questKey=",
														form.key || "{key}"
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-2 text-muted-foreground",
													children: "⚠️ AdBlueMedia's Redirect URL is static — it cannot carry a per-session token. Crediting matches the user's most recent started session for this quest key."
												})
											]
										})
									]
								}) : form.questType === "shortlink" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-xs text-muted-foreground",
											children: [
												"Steps are completed in order. ",
												1,
												" to ",
												10,
												" ",
												"allowed."
											]
										}),
										form.shortlinkSteps.map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-end gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid min-w-0 flex-1 grid-cols-2 gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
													label: `Step ${index + 1} network`,
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														value: step.network,
														placeholder: "Network name",
														onChange: (event) => {
															const next = [...form.shortlinkSteps];
															const current = next[index];
															if (!current) return;
															next[index] = {
																...current,
																network: event.target.value
															};
															setForm({
																...form,
																shortlinkSteps: next
															});
														}
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
													label: `Step ${index + 1} shortlink URL`,
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														value: step.url,
														placeholder: "https://…",
														onChange: (event) => {
															const next = [...form.shortlinkSteps];
															const current = next[index];
															if (!current) return;
															next[index] = {
																...current,
																url: event.target.value
															};
															setForm({
																...form,
																shortlinkSteps: next
															});
														}
													})
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												type: "button",
												size: "sm",
												variant: "outline",
												disabled: form.shortlinkSteps.length <= 1,
												onClick: () => setForm({
													...form,
													shortlinkSteps: form.shortlinkSteps.filter((_, i) => i !== index)
												}),
												"aria-label": `Remove step ${index + 1}`,
												"data-testid": `quest-form-shortlink-remove-${index}`,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
											})]
										}, index)),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											type: "button",
											size: "sm",
											variant: "outline",
											disabled: form.shortlinkSteps.length >= 10,
											onClick: () => setForm({
												...form,
												shortlinkSteps: [...form.shortlinkSteps, {
													network: "",
													url: ""
												}]
											}),
											"data-testid": "quest-form-shortlink-add",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 size-4" }),
												" Add step (",
												form.shortlinkSteps.length,
												"/",
												10,
												")"
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-xl border border-dashed border-primary/40 bg-background-alt p-3 text-xs",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-semibold",
												children: "Destinations to configure on each shortener:"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
												className: "mt-1 space-y-0.5 font-mono",
												children: form.shortlinkSteps.map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													"Step ",
													index + 1,
													" → ",
													origin,
													"/go/",
													form.key || "{key}",
													"/",
													index + 1
												] }, index))
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
											label: "Minimum seconds per step",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												inputMode: "numeric",
												value: form.minSecondsPerStep,
												onChange: (event) => setForm({
													...form,
													minSecondsPerStep: event.target.value
												})
											})
										})
									]
								}) : null,
								form.questType === "network" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-muted-foreground",
											children: "Network quest: users complete offers from a pool of SDK providers. Any K providers count toward completion."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field$2, {
											label: "Provider pool (enabled SDK providers)",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-sm text-muted-foreground mb-2",
													children: "Select providers to include in this quest. Users can complete any provider in any order."
												}),
												sdkProviders.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-muted-foreground",
													children: "Loading providers..."
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2",
													children: (sdkProviders.data || []).map((provider) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
														className: "flex items-center gap-2",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
																type: "checkbox",
																checked: form.networkProviderIds.includes(provider.id),
																onChange: (e) => {
																	if (e.target.checked) setForm({
																		...form,
																		networkProviderIds: [...form.networkProviderIds, provider.id]
																	});
																	else setForm({
																		...form,
																		networkProviderIds: form.networkProviderIds.filter((id) => id !== provider.id)
																	});
																},
																className: "size-4 rounded"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-sm",
																children: provider.name
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "text-xs text-muted-foreground",
																children: [
																	"(",
																	provider.slug,
																	")"
																]
															})
														]
													}, provider.id))
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-xs text-muted-foreground mt-1",
													children: [
														"Pool size: ",
														form.networkProviderIds.length,
														" (must be ≥ required count, ≤ 10)"
													]
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-2 gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field$2, {
												label: "Required completions",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "number",
													min: "1",
													max: Math.min(form.networkProviderIds.length || 1, 10),
													value: form.requiredCount,
													onChange: (e) => setForm({
														...form,
														requiredCount: e.target.value
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-xs text-muted-foreground mt-1",
													children: [
														"Must be ≤ pool size (",
														form.networkProviderIds.length || 0,
														")"
													]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field$2, {
												label: "Step reward per provider ($)",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "number",
													min: "0",
													step: "0.01",
													value: form.stepReward,
													placeholder: "0.10",
													onChange: (e) => setForm({
														...form,
														stepReward: e.target.value
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-muted-foreground mt-1",
													children: "Extra reward per completed provider"
												})]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-2 gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field$2, {
												label: "Min qualifying USD",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "number",
													min: "0",
													step: "0.01",
													value: form.minQualifyingUsd,
													onChange: (e) => setForm({
														...form,
														minQualifyingUsd: e.target.value
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-muted-foreground mt-1",
													children: "Filters micro-payouts (default: $0.01)"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field$2, {
												label: "Token TTL (hours)",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "number",
													min: "1",
													max: "168",
													value: form.tokenTtlHours,
													onChange: (e) => setForm({
														...form,
														tokenTtlHours: e.target.value
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-muted-foreground mt-1",
													children: "Quest token expiry (default: 24h)"
												})]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field$2, {
											label: "Reward hold (hours)",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "number",
												min: "0",
												max: "720",
												value: form.rewardHoldHours,
												onChange: (e) => setForm({
													...form,
													rewardHoldHours: e.target.value
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground mt-1",
												children: "Chargeback protection (default: 0)"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field$2, {
											label: "Also credit normal offer reward",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
													checked: form.creditOfferReward,
													onCheckedChange: (checked) => setForm({
														...form,
														creditOfferReward: checked
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-sm",
													children: form.creditOfferReward ? "Enabled" : "Disabled"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground mt-1",
												children: "When enabled, users get BOTH quest progress AND normal wallet reward (with referral bonuses, task events, etc.)"
											})]
										}),
										(() => {
											const requiredCount = Number(form.requiredCount) || 3;
											const stepReward = Number(form.stepReward) || 0;
											const completionBonus = Number(form.rewardAmount) || 0;
											const totalStepRewards = requiredCount * stepReward;
											const totalPayout = totalStepRewards + completionBonus;
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "rounded-lg bg-background p-2 text-xs",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-semibold",
													children: "Payout summary:"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
													className: "mt-1 space-y-0.5 text-muted-foreground",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
															requiredCount,
															" providers × ",
															formatReward(stepReward),
															" = ",
															formatReward(totalStepRewards)
														] }),
														completionBonus > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["Completion bonus: ", formatReward(completionBonus)] }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
															className: "font-semibold text-primary",
															children: ["Total: ", formatReward(totalPayout)]
														})
													]
												})]
											});
										})(),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-xs",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-semibold text-amber-700 dark:text-amber-400",
												children: "⚠️ Network Quest Behavior"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
												className: "mt-2 space-y-1 text-muted-foreground list-disc list-inside",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Users get NO wallet credit for offers completed via quest" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Quest reward is paid ONLY after K networks completed" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Conversions do NOT count toward milestone tasks" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Each provider counts once per session (multiple conversions OK)" })
												]
											})]
										})
									]
								}),
								form.questType === "survey" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-muted-foreground",
											children: "Survey quest: users complete surveys from CPX Research, TheoremReach, and/or Timewall. Each completed survey = one step + step reward. Total = survey earnings (80%) + step rewards + final bonus."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-2 gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field$2, {
												label: "Required surveys",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "number",
													min: "1",
													max: "10",
													value: form.requiredSurveys,
													onChange: (e) => setForm({
														...form,
														requiredSurveys: e.target.value
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-muted-foreground mt-1",
													children: "How many surveys to complete (1-10)"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field$2, {
												label: "Step reward per survey ($)",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "number",
													min: "0",
													step: "0.01",
													value: form.stepReward,
													placeholder: "0.10",
													onChange: (e) => setForm({
														...form,
														stepReward: e.target.value
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-muted-foreground mt-1",
													children: "Extra reward per completed survey"
												})]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field$2, {
											label: "Custom reward per survey (optional)",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												inputMode: "decimal",
												value: form.stepRewards,
												placeholder: "0.10, 0.15, 0.20, 0.25, 0.30",
												onChange: (event) => setForm({
													...form,
													stepRewards: event.target.value
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground mt-1",
												children: "Optional: comma-separated rewards for each survey. Surveys without custom value use the default step reward above."
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field$2, {
											label: "Allowed survey networks",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "space-y-2",
												children: [
													{
														value: "cpxresearch",
														label: "CPX Research"
													},
													{
														value: "theoremreach",
														label: "TheoremReach"
													},
													{
														value: "timewall",
														label: "Timewall"
													}
												].map((network) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
													className: "flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														type: "checkbox",
														checked: form.allowedNetworks.includes(network.value),
														onChange: (e) => {
															setFormDirty(true);
															if (e.target.checked) setForm({
																...form,
																allowedNetworks: [...form.allowedNetworks, network.value]
															});
															else setForm({
																...form,
																allowedNetworks: form.allowedNetworks.filter((n) => n !== network.value)
															});
														},
														className: "size-4 rounded"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-sm",
														children: network.label
													})]
												}, network.value))
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground mt-2",
												children: "Select at least one network (user sees mixed feed from all selected)"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-2 gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field$2, {
												label: "Min payout USD (optional)",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "number",
													min: "0",
													step: "0.10",
													value: form.minPayoutUsd,
													placeholder: "0.50",
													onChange: (e) => setForm({
														...form,
														minPayoutUsd: e.target.value
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-muted-foreground mt-1",
													children: "Filter out low-paying surveys (leave empty for no filter)"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field$2, {
												label: "Max LOI minutes (optional)",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "number",
													min: "1",
													max: "120",
													value: form.maxLoi || "",
													placeholder: "No limit",
													onChange: (e) => setForm({
														...form,
														maxLoi: e.target.value || null
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-muted-foreground mt-1",
													children: "Filter out long surveys (leave empty for no limit)"
												})]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-xl border border-blue-500/40 bg-blue-500/5 p-3 text-xs",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-semibold text-blue-700 dark:text-blue-400",
												children: "ℹ️ Survey Quest Behavior"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
												className: "mt-2 space-y-1 text-muted-foreground list-disc list-inside",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "User sees ONE mixed list from all selected networks" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Each survey completion = normal 80% credit + step reward" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Final bonus paid after all surveys completed" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Same survey cannot count twice in same quest session" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Progress tracked ONLY via verified postbacks (never frontend)" })
												]
											})]
										}),
										(() => {
											const requiredSurveys = Number(form.requiredSurveys) || 5;
											const baseReward = Number(form.stepReward) || 0;
											const customRewards = form.stepRewards.split(",").map((s) => s.trim()).filter((s) => s !== "").map((s) => Number(s)).filter((n) => !isNaN(n));
											const surveyRewards = Array.from({ length: requiredSurveys }, (_, i) => customRewards[i] !== void 0 ? customRewards[i] : baseReward);
											const totalStepRewards = surveyRewards.reduce((sum, r) => sum + r, 0);
											const completionBonus = Number(form.rewardAmount) || 0;
											const totalQuestRewards = totalStepRewards + completionBonus;
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "rounded-lg bg-background p-3 border text-xs",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-semibold",
													children: "Quest reward breakdown:"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
													className: "mt-2 space-y-1 text-muted-foreground",
													children: [
														surveyRewards.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
															"Survey ",
															i + 1,
															" reward: ",
															formatReward(r)
														] }, i)),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
															className: "pt-1 border-t mt-1",
															children: ["Step rewards total: ", formatReward(totalStepRewards)]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["Completion bonus: ", formatReward(completionBonus)] }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
															className: "font-semibold text-primary pt-1 border-t mt-1",
															children: ["Total quest rewards: ", formatReward(totalQuestRewards)]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
															className: "text-[11px] italic mt-2",
															children: "(Plus user keeps 80% of survey payouts from providers)"
														})
													]
												})]
											});
										})()
									]
								}),
								(form.questType === "feed_ptc" || form.questType === "feed_shortlink" || form.questType === "feed_article") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-xs text-muted-foreground",
											children: [
												"Feed quest: users complete top-performing campaigns from selected providers.",
												" ",
												form.feedKind === "ptc" && "PTC (paid-to-click) campaigns with timer verification.",
												form.feedKind === "shortlink" && "Shortlink campaigns with completion rate filtering.",
												form.feedKind === "article" && "Article/content view campaigns."
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-3 gap-3",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
													label: "Steps (main campaigns)",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "number",
														min: "1",
														max: "20",
														value: form.stepsCount,
														onChange: (e) => setForm({
															...form,
															stepsCount: e.target.value
														})
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
													label: "Backup campaigns",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "number",
														min: "0",
														max: "10",
														value: form.backupCount,
														onChange: (e) => setForm({
															...form,
															backupCount: e.target.value
														})
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
													label: "Token TTL (hours)",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "number",
														min: "1",
														max: "168",
														value: form.feedTokenTtlHours,
														onChange: (e) => setForm({
															...form,
															feedTokenTtlHours: e.target.value
														})
													})
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field$2, {
											label: "Provider pool (enabled SDK providers)",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-sm text-muted-foreground mb-2",
													children: "Select providers to fetch campaigns from. Campaigns are fetched and ranked by performance."
												}),
												sdkProviders.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-muted-foreground",
													children: "Loading providers..."
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2",
													children: (sdkProviders.data || []).map((provider) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
														className: "flex items-center gap-2",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
																type: "checkbox",
																checked: form.feedProviderIds.includes(provider.id),
																onChange: (e) => {
																	if (e.target.checked) setForm({
																		...form,
																		feedProviderIds: [...form.feedProviderIds, provider.id]
																	});
																	else setForm({
																		...form,
																		feedProviderIds: form.feedProviderIds.filter((id) => id !== provider.id)
																	});
																},
																className: "size-4 rounded"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-sm",
																children: provider.name
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "text-xs text-muted-foreground",
																children: [
																	"(",
																	provider.slug,
																	")"
																]
															})
														]
													}, provider.id))
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-xs text-muted-foreground mt-1",
													children: [
														form.feedProviderIds.length,
														" provider",
														form.feedProviderIds.length !== 1 ? "s" : "",
														" selected"
													]
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-2 gap-3",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field$2, {
													label: "Min reward (USD)",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "number",
														min: "0",
														step: "0.01",
														value: form.minRewardUsd,
														onChange: (e) => setForm({
															...form,
															minRewardUsd: e.target.value
														})
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-xs text-muted-foreground mt-1",
														children: "Filter campaigns below this payout"
													})]
												}),
												form.feedKind === "shortlink" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field$2, {
													label: "Min completion rate (%)",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "number",
														min: "0",
														max: "100",
														value: form.minCompletionRate,
														onChange: (e) => setForm({
															...form,
															minCompletionRate: e.target.value
														})
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-xs text-muted-foreground mt-1",
														children: "Shortlinks only: filter low-quality chains"
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field$2, {
													label: "Max per network (optional)",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "number",
														min: "1",
														max: "20",
														value: form.maxPerNetwork,
														placeholder: "No limit",
														onChange: (e) => setForm({
															...form,
															maxPerNetwork: e.target.value
														})
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-xs text-muted-foreground mt-1",
														children: "Limit campaigns from one provider"
													})]
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field$2, {
											label: "Blocked domains (optional)",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												value: form.blockedDomains,
												placeholder: "spam.com, badsite.net",
												onChange: (e) => setForm({
													...form,
													blockedDomains: e.target.value
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground mt-1",
												children: "Comma-separated list of domains to exclude from feed"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field$2, {
											label: "Per-step rewards (comma-separated, optional)",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												value: form.stepRewards,
												placeholder: "0.10, 0.15, 0.20, ...",
												onChange: (e) => setForm({
													...form,
													stepRewards: e.target.value
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground mt-1",
												children: "Leave empty for no step rewards. Length should match steps count."
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field$2, {
											label: "Also credit normal offer reward",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
													checked: form.creditOfferReward,
													onCheckedChange: (checked) => setForm({
														...form,
														creditOfferReward: checked
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-sm",
													children: form.creditOfferReward ? "Enabled" : "Disabled"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground mt-1",
												children: "When enabled, users get BOTH quest progress AND normal wallet reward"
											})]
										}),
										(() => {
											const stepsCount = Number(form.stepsCount) || 10;
											const minRewardUsd = Number(form.minRewardUsd) || .1;
											const stepRewardsList = form.stepRewards.trim() ? form.stepRewards.split(",").map((s) => Number(s.trim())).filter((n) => !isNaN(n)) : [];
											const totalStepRewards = stepRewardsList.reduce((sum, r) => sum + r, 0);
											const completionBonus = Number(form.rewardAmount) || 0;
											const totalQuestRewards = totalStepRewards + completionBonus;
											const estimatedNetworkPayout = stepsCount * minRewardUsd;
											const payoutWarning = totalQuestRewards > estimatedNetworkPayout;
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "rounded-lg border p-3 text-xs space-y-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "font-semibold",
														children: "💰 Payout Preview"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "grid grid-cols-2 gap-4",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-muted-foreground",
															children: "Estimated network payout:"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "text-sm",
															children: [
																stepsCount,
																" steps × $",
																minRewardUsd.toFixed(2),
																" ≈",
																" ",
																formatReward(estimatedNetworkPayout)
															]
														})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-muted-foreground",
															children: "Total user payout:"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "text-sm",
															children: [
																stepRewardsList.length > 0 ? `${formatReward(totalStepRewards)} steps + ` : "",
																formatReward(completionBonus),
																" bonus =",
																" ",
																formatReward(totalQuestRewards)
															]
														})] })]
													}),
													payoutWarning && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "rounded bg-amber-500/10 border border-amber-500/40 p-2 mt-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "font-semibold text-amber-700 dark:text-amber-400",
															children: "⚠️ User payout exceeds estimated network revenue"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-muted-foreground mt-1",
															children: "The quest pays users more than the minimum network payout. Make sure your margins are correct."
														})]
													})
												]
											});
										})(),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-xl border border-blue-500/40 bg-blue-500/5 p-3 text-xs",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-semibold text-blue-700 dark:text-blue-400",
												children: "ℹ️ Feed Quest Behavior"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
												className: "mt-2 space-y-1 text-muted-foreground list-disc list-inside",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Feed is rebuilt every session from live provider APIs" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Steps are sequential (user sees 1 campaign at a time)" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Backup campaigns replace failed/unavailable steps" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Campaign ID verification happens via postback" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Step rewards credited immediately, completion bonus at end" })
												]
											})]
										})
									]
								}),
								form.questType === "timed_ptc" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-muted-foreground",
											children: "Timed PTC quest: users complete steps with countdown timer and ad checkpoint verification."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-3 gap-3",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
													label: "Step duration (seconds)",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "number",
														min: "10",
														max: "600",
														value: form.timedStepSeconds,
														onChange: (e) => setForm({
															...form,
															timedStepSeconds: e.target.value
														})
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
													label: "Checkpoint interval (seconds)",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "number",
														min: "5",
														max: "120",
														value: form.timedCheckpointSeconds,
														onChange: (e) => setForm({
															...form,
															timedCheckpointSeconds: e.target.value
														})
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
													label: "Max failed taps",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "number",
														min: "1",
														max: "5",
														value: form.timedMaxFailedTaps,
														onChange: (e) => setForm({
															...form,
															timedMaxFailedTaps: e.target.value
														})
													})
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
											label: "Quest steps (1-10)",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-2",
												children: [form.timedSteps.map((step, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid grid-cols-12 gap-2 items-end",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "col-span-3",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
																className: "text-xs",
																children: [
																	"Step ",
																	idx + 1,
																	" Reward"
																]
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																type: "number",
																min: "0",
																step: "0.01",
																placeholder: "0.01",
																value: step.reward,
																onChange: (e) => {
																	const newSteps = [...form.timedSteps];
																	newSteps[idx] = {
																		...newSteps[idx],
																		reward: e.target.value
																	};
																	setForm({
																		...form,
																		timedSteps: newSteps
																	});
																}
															})]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "col-span-4",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																className: "text-xs",
																children: "Ad Network"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
																className: "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
																value: step.adNetwork,
																onChange: (e) => {
																	const newSteps = [...form.timedSteps];
																	newSteps[idx] = {
																		...newSteps[idx],
																		adNetwork: e.target.value
																	};
																	setForm({
																		...form,
																		timedSteps: newSteps
																	});
																},
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																		value: "monetag",
																		children: "Monetag"
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																		value: "propush",
																		children: "ProPush (stub)"
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																		value: "rollerads",
																		children: "RollerAds (stub)"
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																		value: "evadav",
																		children: "Evadav (stub)"
																	})
																]
															})]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "col-span-4",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																className: "text-xs",
																children: "Push Network"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
																className: "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
																value: step.pushNetwork,
																onChange: (e) => {
																	const newSteps = [...form.timedSteps];
																	newSteps[idx] = {
																		...newSteps[idx],
																		pushNetwork: e.target.value
																	};
																	setForm({
																		...form,
																		timedSteps: newSteps
																	});
																},
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																		value: "none",
																		children: "None"
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																		value: "propush",
																		children: "ProPush"
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																		value: "rollerads",
																		children: "RollerAds"
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
																		value: "evadav",
																		children: "Evadav"
																	})
																]
															})]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "col-span-1",
															children: idx > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																type: "button",
																variant: "ghost",
																size: "sm",
																onClick: () => {
																	const newSteps = form.timedSteps.filter((_, i) => i !== idx);
																	setForm({
																		...form,
																		timedSteps: newSteps
																	});
																},
																children: "×"
															})
														})
													]
												}, idx)), form.timedSteps.length < 10 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													type: "button",
													variant: "outline",
													size: "sm",
													onClick: () => {
														setForm({
															...form,
															timedSteps: [...form.timedSteps, {
																reward: "0.01",
																adNetwork: "monetag",
																pushNetwork: "none"
															}]
														});
													},
													children: "+ Add Step"
												})]
											})
										}),
										(() => {
											const totalStepRewards = form.timedSteps.map((s) => Number(s.reward) || 0).reduce((sum, r) => sum + r, 0);
											const completionBonus = Number(form.rewardAmount) || 0;
											const totalPayout = totalStepRewards + completionBonus;
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "rounded-lg border p-3 text-xs space-y-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-semibold",
													children: "💰 Payout Preview"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid grid-cols-2 gap-4",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-muted-foreground",
														children: "Step rewards:"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-sm",
														children: formatReward(totalStepRewards)
													})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-muted-foreground",
														children: "Total payout:"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-sm",
														children: [
															formatReward(totalStepRewards),
															" steps +",
															" ",
															formatReward(completionBonus),
															" bonus = ",
															formatReward(totalPayout)
														]
													})] })]
												})]
											});
										})(),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-xl border border-blue-500/40 bg-blue-500/5 p-3 text-xs",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-semibold text-blue-700 dark:text-blue-400",
												children: "ℹ️ Timed PTC Quest Behavior"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
												className: "mt-2 space-y-1 text-muted-foreground list-disc list-inside",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Timer pauses when browser tab is hidden" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Checkpoints require ad interaction (blur/visibility change)" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "After max failed taps, timer resumes (no-fill fallback)" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Step rewards credited immediately, completion bonus at end" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Web only — hidden from native app users" })
												]
											})]
										})
									]
								}),
								form.questType === "active_time" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-muted-foreground",
											children: "Active Time quest: server-authoritative time tracking with ping validation, grace periods for offers, and daily caps."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-3 gap-3",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
													label: "Target minutes",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "number",
														min: "1",
														max: "600",
														value: form.targetMinutes,
														onChange: (e) => setForm({
															...form,
															targetMinutes: e.target.value
														})
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
													label: "Daily cap (minutes)",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "number",
														min: "1",
														max: "600",
														value: form.dailyCapMinutes,
														onChange: (e) => setForm({
															...form,
															dailyCapMinutes: e.target.value
														})
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
													label: "Grace minutes per offer",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "number",
														min: "1",
														max: "60",
														value: form.graceMinutes,
														onChange: (e) => setForm({
															...form,
															graceMinutes: e.target.value
														})
													})
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-lg border p-3 text-xs space-y-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-semibold",
													children: "⏱️ Time Tracking Preview"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid grid-cols-2 gap-4",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-muted-foreground",
														children: "Target:"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-sm",
														children: [Number(form.targetMinutes) || 0, " minutes"]
													})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-muted-foreground",
														children: "Daily cap:"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-sm",
														children: [Number(form.dailyCapMinutes) || 0, " minutes"]
													})] })]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-muted-foreground",
													children: "Reward when complete:"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm",
													children: formatReward(Number(form.rewardAmount) || 0)
												})] })
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-xl border border-blue-500/40 bg-blue-500/5 p-3 text-xs",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-semibold text-blue-700 dark:text-blue-400",
												children: "ℹ️ Active Time Quest Behavior"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
												className: "mt-2 space-y-1 text-muted-foreground list-disc list-inside",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Client pings every 30s, server credits min(gap, 35s)" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "One-time tokens prevent replay attacks" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Grace periods: 10min after offer click, max 3/hour" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "24h cooldown per offer before grace reactivates" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Daily cap prevents excessive grinding" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Atomic reward payout via Postgres function" })
												]
											})]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
										label: "Sort order",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											inputMode: "numeric",
											value: form.sortOrder,
											onChange: (event) => setForm({
												...form,
												sortOrder: event.target.value
											})
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												className: "flex items-center gap-2 text-sm",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
													checked: form.isActive,
													"data-testid": "quest-form-is-active",
													onCheckedChange: (value) => setForm({
														...form,
														isActive: value
													})
												}), "Active"]
											}), noLinksYet && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[11px] text-amber-600",
												"data-testid": "quest-form-draft-note",
												children: "No links yet — this quest can go live, but users will see “link coming soon” until you add one."
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												className: "flex items-center gap-2 text-sm",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
													checked: form.appOnly,
													"data-testid": "quest-form-app-only",
													onCheckedChange: (value) => setForm({
														...form,
														appOnly: value
													})
												}), "App only"]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[11px] text-muted-foreground",
												children: "Hide on web, show only in native app"
											})]
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 p-3 dark:border-amber-700 dark:bg-amber-950/20",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-semibold text-amber-700 dark:text-amber-400",
											children: "🔒 Lock condition"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
											label: "Lock type",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "flex flex-wrap gap-2",
												children: [
													["none", "No lock"],
													["time", "Until date"],
													["earning", "Until earned"],
													["first_withdrawal", "Until first withdrawal"]
												].map(([t, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													size: "sm",
													type: "button",
													variant: form.lockType === t ? "jade" : "outline",
													"data-testid": `quest-lock-type-${t}`,
													onClick: () => setForm({
														...form,
														lockType: t,
														unlockAt: "",
														requiredLifetimeEarned: ""
													}),
													children: label
												}, t))
											})
										}),
										form.lockType === "first_withdrawal" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[11px] text-muted-foreground",
											"data-testid": "quest-lock-first-withdrawal-note",
											children: "Unlocks as soon as the user has one approved withdrawal — no extra value needed."
										}),
										form.lockType === "time" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
											label: "Unlock at (UTC date-time)",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "datetime-local",
												value: form.unlockAt ? new Date(form.unlockAt).toISOString().slice(0, 16) : "",
												onChange: (event) => setForm({
													...form,
													unlockAt: event.target.value ? new Date(event.target.value).toISOString() : ""
												})
											})
										}),
										form.lockType === "earning" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
											label: "Required lifetime earned ($)",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												inputMode: "decimal",
												placeholder: "e.g. 5.00",
												value: form.requiredLifetimeEarned,
												onChange: (event) => setForm({
													...form,
													requiredLifetimeEarned: event.target.value
												})
											})
										})
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							onClick: () => setForm(null),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "jade",
							disabled: !canSave || saveAction.isPending,
							onClick: () => form && saveAction.mutate(form),
							"data-testid": "quest-save-btn",
							children: saveAction.isPending ? "Saving…" : "Save quest"
						})] }),
						!canSave && saveValidationReason && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-amber-600 dark:text-amber-400 px-6 pb-3",
							children: ["⚠️ ", saveValidationReason]
						})
					] })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
				open: Boolean(pendingDelete),
				onOpenChange: (open) => !open && setPendingDelete(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogTitle, { children: [
					"Delete “",
					pendingDelete?.label,
					"”?"
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, { children: "If users already have sessions for this quest, it is deactivated instead of deleted so history is preserved." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "Cancel" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
					onClick: () => pendingDelete && deleteAction.mutate(pendingDelete.id),
					children: "Delete"
				})] })] })
			})
		]
	});
}
function Field$2({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			className: "text-xs text-muted-foreground",
			children: label
		}), children]
	});
}
var emptyForm$1 = {
	id: void 0,
	title: "",
	description: "",
	icon: "target",
	imageUrl: "",
	reward: "0",
	taskType: "referral_count",
	target: "1",
	frequency: "one_time",
	windowDays: "",
	startsAt: "",
	endsAt: "",
	sortOrder: "0",
	isActive: true,
	isFeatured: false,
	lockType: "none",
	unlockAt: "",
	earningTarget: "",
	earningProviderId: ""
};
function TasksManager() {
	const queryClient = useQueryClient();
	const fetchTasks = useServerFn(listAdminTasks);
	const saveTask = useServerFn(saveAdminTask);
	const toggleTask = useServerFn(setAdminTaskActive);
	const removeTask = useServerFn(deleteAdminTask);
	const fetchSdkProviders = useServerFn(listAdminSdkProviders);
	const sdkProviders = useQuery({
		queryKey: ["sdk-offerwall-providers-admin"],
		queryFn: () => fetchSdkProviders({}),
		staleTime: 6e4
	});
	const [status, setStatus] = (0, import_react.useState)("all");
	const [typeFilter, setTypeFilter] = (0, import_react.useState)("all");
	const [form, setForm] = (0, import_react.useState)(null);
	const [pendingDelete, setPendingDelete] = (0, import_react.useState)(null);
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const [uploadError, setUploadError] = (0, import_react.useState)(null);
	const fileRef = (0, import_react.useRef)(null);
	const requestUpload = useServerFn(requestTaskImageUploadUrl);
	/** Uploads to the task-assets bucket, then patches the resulting public URL into the form. */
	const handleImageFile = async (file) => {
		if (file.size > 3145728) {
			setUploadError("File must be under 3 MB.");
			return;
		}
		setUploadError(null);
		setUploading(true);
		try {
			toast.info("Resizing and converting to WebP...");
			const optimizedFile = await resizeAndConvertToWebP(file, 400, .82);
			const { uploadUrl, token, publicUrl } = await requestUpload({ data: { filename: optimizedFile.name.slice(0, 120) } });
			const res = await fetch(uploadUrl, {
				method: "PUT",
				headers: {
					"Content-Type": optimizedFile.type || "application/octet-stream",
					"cache-control": "max-age=31536000",
					...token ? { Authorization: `Bearer ${token}` } : {}
				},
				body: optimizedFile
			});
			if (!res.ok) throw new Error(`Upload failed (${res.status})`);
			setForm((current) => current ? {
				...current,
				imageUrl: publicUrl
			} : current);
			toast.success("Image uploaded.");
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Upload failed.";
			setUploadError(msg);
			toast.error(msg);
		} finally {
			setUploading(false);
			if (fileRef.current) fileRef.current.value = "";
		}
	};
	const tasks = useQuery({
		queryKey: [
			"admin-tasks",
			status,
			typeFilter
		],
		queryFn: () => fetchTasks({ data: {
			status,
			taskType: typeFilter
		} })
	});
	const invalidate = () => {
		queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
		queryClient.invalidateQueries({ queryKey: ["tasks"] });
	};
	const save = useMutation({
		mutationFn: (state) => saveTask({ data: {
			...state.id ? { id: state.id } : {},
			title: state.title.trim(),
			description: state.description.trim(),
			icon: state.icon.trim() || "target",
			imageUrl: state.imageUrl.trim() || null,
			reward: Number(state.reward) || 0,
			taskType: state.taskType,
			target: Math.max(1, Number(state.target) || 1),
			frequency: state.frequency,
			windowDays: state.windowDays ? Number(state.windowDays) : null,
			startsAt: state.startsAt ? new Date(state.startsAt).toISOString() : null,
			endsAt: state.endsAt ? new Date(state.endsAt).toISOString() : null,
			sortOrder: Number(state.sortOrder) || 0,
			isActive: state.isActive,
			isFeatured: state.isFeatured,
			lockType: state.lockType,
			unlockAt: state.lockType === "time" && state.unlockAt ? new Date(state.unlockAt).toISOString() : null,
			earningTarget: state.taskType === "offerwall_earning" && state.earningTarget ? Number(state.earningTarget) : null,
			earningProviderId: state.taskType === "offerwall_earning" && state.earningProviderId ? state.earningProviderId : null
		} }),
		onSuccess: () => {
			toast.success("Task saved");
			setForm(null);
			invalidate();
		},
		onError: (error) => toast.error(error.message)
	});
	const toggle = useMutation({
		mutationFn: (vars) => toggleTask({ data: vars }),
		onSuccess: invalidate,
		onError: (error) => toast.error(error.message)
	});
	const del = useMutation({
		mutationFn: (id) => removeTask({ data: { id } }),
		onSuccess: (res) => {
			toast.success(res.deactivatedInstead ? "Task had paid rewards — deactivated instead" : "Task deleted");
			setPendingDelete(null);
			invalidate();
		},
		onError: (error) => toast.error(error.message)
	});
	const rows = tasks.data ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-3 space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					[
						"all",
						"active",
						"inactive"
					].map((key) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: status === key ? "jade" : "outline",
						onClick: () => setStatus(key),
						children: key === "all" ? "All" : key === "active" ? "Active" : "Inactive"
					}, key)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "h-9 rounded-md border border-border bg-background px-2 text-sm",
						value: typeFilter,
						onChange: (event) => setTypeFilter(event.target.value),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "all",
							children: "All types"
						}), TASK_TYPES.map((type) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: type,
							children: TASK_TYPE_LABELS[type]
						}, type))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: "gold",
						onClick: () => setForm({ ...emptyForm$1 }),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-4 w-4" }), " New task"]
					})
				]
			}),
			tasks.isLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Loading…"
			}),
			!tasks.isLoading && rows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				title: "No tasks yet",
				description: "Create your first automated task."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2",
				children: rows.map((task) => {
					const t = task;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "surface-card p-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-semibold",
									children: task.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: [
										TASK_TYPE_LABELS[t.task_type] ?? t.task_type,
										" ·",
										" ",
										TASK_FREQUENCY_LABELS[t.frequency] ?? t.frequency,
										" · target ",
										t.target,
										t.window_days ? ` in ${t.window_days}d` : "",
										" ·",
										" ",
										formatMoney(Number(task.reward)),
										" · order ",
										task.sort_order
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: [
										task.stats.participants,
										" in progress · ",
										task.stats.completed,
										" completed ·",
										" ",
										task.stats.paid,
										" rewarded"
									]
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
										checked: task.is_active,
										onCheckedChange: (value) => toggle.mutate({
											id: task.id,
											isActive: value
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "icon",
										variant: "outline",
										onClick: () => {
											const raw = task;
											setForm({
												id: task.id,
												title: task.title,
												description: task.description ?? "",
												icon: raw.icon ?? "target",
												imageUrl: raw.image_url ?? "",
												reward: String(task.reward),
												taskType: t.task_type,
												target: String(t.target),
												frequency: t.frequency,
												windowDays: t.window_days ? String(t.window_days) : "",
												startsAt: "",
												endsAt: "",
												sortOrder: String(task.sort_order),
												isActive: task.is_active,
												isFeatured: task.is_featured,
												lockType: raw.lock_type ?? "none",
												unlockAt: raw.unlock_at ? String(raw.unlock_at).slice(0, 16) : "",
												earningTarget: raw.earning_target != null ? String(raw.earning_target) : "",
												earningProviderId: raw.earning_provider_id ?? ""
											});
										},
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "icon",
										variant: "outline",
										onClick: () => setPendingDelete(task),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
									})
								]
							})]
						})
					}, task.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: Boolean(form),
				onOpenChange: (open) => !open && setForm(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-h-[85vh] overflow-y-auto",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: form?.id ? "Edit task" : "New task" }) }),
						form && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Title" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.title,
									onChange: (e) => setForm({
										...form,
										title: e.target.value
									})
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Description" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									value: form.description,
									onChange: (e) => setForm({
										...form,
										description: e.target.value
									})
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Icon name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: form.icon,
											onChange: (e) => setForm({
												...form,
												icon: e.target.value
											})
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Image URL" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														value: form.imageUrl,
														placeholder: "https://… or upload",
														onChange: (e) => {
															setUploadError(null);
															setForm({
																...form,
																imageUrl: e.target.value
															});
														}
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														ref: fileRef,
														type: "file",
														accept: "image/png,image/jpeg,image/webp,image/svg+xml",
														className: "hidden",
														onChange: (e) => {
															const f = e.target.files?.[0];
															if (f) handleImageFile(f);
														}
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														type: "button",
														size: "sm",
														variant: "outline",
														className: "shrink-0",
														disabled: uploading,
														onClick: () => fileRef.current?.click(),
														children: uploading ? "…" : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" })
													})
												]
											}),
											uploadError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-1 text-xs text-destructive",
												children: uploadError
											})
										] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Task type" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
											className: "h-9 w-full rounded-md border border-border bg-background px-2 text-sm",
											value: form.taskType,
											onChange: (e) => setForm({
												...form,
												taskType: e.target.value
											}),
											children: TASK_TYPES.map((type) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: type,
												children: TASK_TYPE_LABELS[type]
											}, type))
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Frequency" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
											className: "h-9 w-full rounded-md border border-border bg-background px-2 text-sm",
											value: form.frequency,
											onChange: (e) => setForm({
												...form,
												frequency: e.target.value
											}),
											children: TASK_FREQUENCIES.map((freq) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: freq,
												children: TASK_FREQUENCY_LABELS[freq]
											}, freq))
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Target" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "number",
											value: form.target,
											onChange: (e) => setForm({
												...form,
												target: e.target.value
											})
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Reward ($)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "number",
											step: "0.01",
											value: form.reward,
											onChange: (e) => setForm({
												...form,
												reward: e.target.value
											})
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Window (days)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "number",
											placeholder: "for period targets",
											value: form.windowDays,
											onChange: (e) => setForm({
												...form,
												windowDays: e.target.value
											})
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Sort order" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "number",
											value: form.sortOrder,
											onChange: (e) => setForm({
												...form,
												sortOrder: e.target.value
											})
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Starts at" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "datetime-local",
											value: form.startsAt,
											onChange: (e) => setForm({
												...form,
												startsAt: e.target.value
											})
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Ends at" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "datetime-local",
											value: form.endsAt,
											onChange: (e) => setForm({
												...form,
												endsAt: e.target.value
											})
										})] })
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex items-center gap-2 text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
											checked: form.isActive,
											onCheckedChange: (v) => setForm({
												...form,
												isActive: v
											})
										}), "Active"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex items-center gap-2 text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
											checked: form.isFeatured,
											onCheckedChange: (v) => setForm({
												...form,
												isFeatured: v
											})
										}), "Featured"]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 p-3 dark:border-amber-700 dark:bg-amber-950/20",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-semibold text-amber-700 dark:text-amber-400",
											children: "🔒 Lock condition"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-xs text-muted-foreground",
												children: "Lock type"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "flex flex-wrap gap-2",
												children: TASK_LOCK_TYPES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													size: "sm",
													type: "button",
													variant: form.lockType === t ? "jade" : "outline",
													"data-testid": `task-lock-type-${t}`,
													onClick: () => setForm({
														...form,
														lockType: t,
														unlockAt: ""
													}),
													children: TASK_LOCK_TYPE_LABELS[t]
												}, t))
											})]
										}),
										form.lockType === "time" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-xs text-muted-foreground",
												children: "Unlock at (UTC date-time)"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "datetime-local",
												"data-testid": "task-lock-unlock-at",
												value: form.unlockAt,
												onChange: (e) => setForm({
													...form,
													unlockAt: e.target.value
												})
											})]
										}),
										form.lockType === "first_withdrawal" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[11px] text-muted-foreground",
											"data-testid": "task-lock-first-withdrawal-note",
											children: "Unlocks as soon as the user has one approved withdrawal — no extra value needed."
										})
									]
								}),
								form.taskType === "shortlink" || form.taskType === "content_locker" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: "Progress for this type starts counting once a provider sends completion events."
								}) : null,
								form.taskType === "offerwall_earning" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/50 p-3 dark:border-emerald-700 dark:bg-emerald-950/20",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-semibold text-emerald-700 dark:text-emerald-400",
											children: "SDK Offerwall earning target"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-2 gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Earning target ($)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "number",
												step: "0.01",
												min: "0.01",
												placeholder: "e.g. 10.00",
												value: form.earningTarget,
												onChange: (e) => setForm({
													...form,
													earningTarget: e.target.value
												})
											})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Scope" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
												className: "h-9 w-full rounded-md border border-border bg-background px-2 text-sm",
												value: form.earningProviderId,
												onChange: (e) => setForm({
													...form,
													earningProviderId: e.target.value
												}),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "",
													children: "All SDK offerwalls combined"
												}), (sdkProviders.data ?? []).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: p.id,
													children: p.name
												}, p.id))]
											})] })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-xs text-muted-foreground",
											children: [
												"Task completes when the user earns the target amount from SDK offerwall conversions",
												form.earningProviderId ? " from the selected provider" : " combined",
												". The bonus reward is paid on top of what they already earned from the offerwall."
											]
										})
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							onClick: () => setForm(null),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "jade",
							disabled: save.isPending || !form?.title.trim(),
							onClick: () => form && save.mutate(form),
							children: "Save task"
						})] })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
				open: Boolean(pendingDelete),
				onOpenChange: (open) => !open && setPendingDelete(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "Delete this task?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogDescription, { children: [pendingDelete?.title, " will be removed. Tasks that already paid rewards are deactivated instead so the payout history stays intact."] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "Cancel" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
					onClick: () => pendingDelete && del.mutate(pendingDelete.id),
					disabled: del.isPending,
					children: "Delete"
				})] })] })
			})
		]
	});
}
var SECTIONS = [
	["home", "Home"],
	["offers", "Offers"],
	["tasks", "Tasks"],
	["offerwall", "Offerwall"]
];
var CTA_KINDS = [
	["none", "No CTA"],
	["offers", "Offers page"],
	["tasks", "Tasks page"],
	["offerwall", "Offerwall page"],
	["offer", "Specific offer"],
	["offerwall_provider", "Specific offerwall"],
	["url", "External URL"]
];
var emptyForm = () => ({
	section: "home",
	title: "",
	description: "",
	imageUrl: "",
	ctaLabel: "",
	ctaKind: "none",
	ctaTarget: "",
	priority: "0",
	isActive: true,
	startsAtLocal: "",
	endsAtLocal: ""
});
/** datetime-local (browser local) -> ISO UTC. Empty -> null. */
function localToUtcIso(local) {
	if (!local) return null;
	const d = new Date(local);
	if (Number.isNaN(d.getTime())) return null;
	return d.toISOString();
}
/** ISO UTC -> datetime-local input value (local tz). */
function utcIsoToLocal(iso) {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	const pad = (n) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function BannersManager() {
	const queryClient = useQueryClient();
	const fetchAll = useServerFn(listAdminBanners);
	const save = useServerFn(saveBanner);
	const remove = useServerFn(deleteBanner);
	const requestUpload = useServerFn(requestBannerUploadUrl);
	const fetchSmartSettings = useServerFn(listSmartBannerSettings);
	const toggleSmart = useServerFn(setSmartBannerEnabled);
	const [form, setForm] = (0, import_react.useState)(null);
	const [pendingDelete, setPendingDelete] = (0, import_react.useState)(null);
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const [previewSection, setPreviewSection] = (0, import_react.useState)(null);
	const fileRef = (0, import_react.useRef)(null);
	const banners = useQuery({
		queryKey: ["admin-banners"],
		queryFn: () => fetchAll({})
	});
	const smartSettings = useQuery({
		queryKey: ["smart-banner-settings"],
		queryFn: () => fetchSmartSettings({})
	});
	const refresh = () => {
		queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
		queryClient.invalidateQueries({ queryKey: ["banners"] });
	};
	const onError = (error) => toast.error(error.message);
	const saveAction = useMutation({
		mutationFn: (state) => save({ data: {
			...state.id ? { id: state.id } : {},
			section: state.section,
			title: state.title.trim(),
			description: state.description.trim(),
			imageUrl: state.imageUrl.trim() || null,
			ctaLabel: state.ctaKind === "none" ? null : state.ctaLabel.trim() || null,
			ctaKind: state.ctaKind,
			ctaTarget: state.ctaTarget.trim() || null,
			priority: Number(state.priority) || 0,
			isActive: state.isActive,
			startsAt: localToUtcIso(state.startsAtLocal),
			endsAt: localToUtcIso(state.endsAtLocal)
		} }),
		onSuccess: () => {
			toast.success("Banner saved.");
			setForm(null);
			refresh();
		},
		onError
	});
	const deleteAction = useMutation({
		mutationFn: (id) => remove({ data: { id } }),
		onSuccess: () => {
			toast.success("Banner deleted.");
			setPendingDelete(null);
			refresh();
		},
		onError
	});
	const smartToggle = useMutation({
		mutationFn: (v) => toggleSmart({ data: v }),
		onSuccess: () => {
			toast.success("Smart banner updated.");
			queryClient.invalidateQueries({ queryKey: ["smart-banner-settings"] });
			queryClient.invalidateQueries({ queryKey: ["banners"] });
		},
		onError
	});
	const openEdit = (b) => setForm({
		id: b.id,
		section: b.section,
		title: b.title,
		description: b.description,
		imageUrl: b.image_url ?? "",
		ctaLabel: b.cta_label ?? "",
		ctaKind: b.cta_kind,
		ctaTarget: b.cta_target ?? "",
		priority: String(b.priority),
		isActive: b.is_active,
		startsAtLocal: utcIsoToLocal(b.starts_at),
		endsAtLocal: utcIsoToLocal(b.ends_at)
	});
	const handleFile = async (file) => {
		if (!form) return;
		if (file.size > 10485760) {
			toast.error("Image must be under 10 MB.");
			return;
		}
		setUploading(true);
		try {
			toast.info("Resizing and converting to WebP...");
			const optimizedFile = await resizeAndConvertToWebP(file, 1200, .82);
			const { uploadUrl, token, publicUrl } = await requestUpload({ data: { filename: optimizedFile.name.slice(0, 120) } });
			const res = await fetch(uploadUrl, {
				method: "PUT",
				headers: {
					"Content-Type": optimizedFile.type || "application/octet-stream",
					"cache-control": "max-age=31536000",
					...token ? { Authorization: `Bearer ${token}` } : {}
				},
				body: optimizedFile
			});
			if (!res.ok) throw new Error(`Upload failed (${res.status})`);
			setForm({
				...form,
				imageUrl: publicUrl
			});
			toast.success("Image uploaded.");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Upload failed.");
		} finally {
			setUploading(false);
			if (fileRef.current) fileRef.current.value = "";
		}
	};
	const canSave = form && (form.title.trim().length >= 2 || Boolean(form.imageUrl.trim()));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Custom + scheduled banners. Smart banners are driven live by user data."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: "gold",
					className: "ml-auto",
					onClick: () => setForm(emptyForm()),
					"data-testid": "banner-new-btn",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-4 w-4" }), " New banner"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: SECTIONS.map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: previewSection === key ? "jade" : "outline",
					onClick: () => setPreviewSection(previewSection === key ? null : key),
					children: ["Preview ", label]
				}, key))
			}),
			previewSection && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-dashed border-primary/40 p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-2 text-xs text-muted-foreground",
					children: "Live preview using your own account data:"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBanner, { section: previewSection })]
			}),
			banners.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Loading banners…"
			}) : !banners.data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				icon: Plus,
				title: "No banners yet",
				description: "Create a custom banner to promote something across a section."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-2",
				"data-testid": "admin-banners-list",
				children: banners.data.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "surface-card space-y-1 p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-sm font-semibold",
										children: b.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs text-muted-foreground",
										children: [
											b.section,
											" · priority ",
											b.priority,
											" · cta ",
											b.cta_kind
										]
									}),
									(b.starts_at || b.ends_at) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-[11px] text-muted-foreground",
										children: [
											b.starts_at ? `From ${formatDateTime(b.starts_at)}` : "No start",
											" ·",
											" ",
											b.ends_at ? `Until ${formatDateTime(b.ends_at)}` : "No end"
										]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${b.is_active ? "bg-primary/15 text-primary" : "bg-background-alt text-muted-foreground"}`,
								children: b.is_active ? "Active" : "Inactive"
							})]
						}),
						b.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: b.description
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								variant: "outline",
								onClick: () => openEdit(b),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "mr-1 h-3.5 w-3.5" }), " Edit"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								variant: "outline",
								onClick: () => setPendingDelete(b),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "mr-1 h-3.5 w-3.5" }), " Delete"]
							})]
						})
					]
				}, b.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2 pt-2",
				"data-testid": "admin-smart-banners",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-semibold",
					children: "Smart banners"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: "Auto-generated live from user & app data (no content editing). Switch one off to stop it appearing anywhere."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2",
					"data-testid": "admin-smart-banners-list",
					children: SMART_BANNER_TEMPLATES.map((t) => {
						const setting = smartSettings.data?.find((s) => s.template_key === t.key);
						const enabled = setting ? setting.enabled : true;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "surface-card flex items-center justify-between gap-3 p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-sm font-semibold",
									children: t.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: [
										t.section,
										" · ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono",
											children: t.key
										})
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${enabled ? "bg-primary/15 text-primary" : "bg-background-alt text-muted-foreground"}`,
									children: enabled ? "On" : "Off"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									checked: enabled,
									disabled: smartToggle.isPending,
									onCheckedChange: (v) => smartToggle.mutate({
										templateKey: t.key,
										enabled: v
									}),
									"data-testid": `smart-banner-toggle-${t.key}`
								})]
							})]
						}, t.key);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: Boolean(form),
				onOpenChange: (open) => !open && setForm(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-h-[85vh] overflow-y-auto",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: form?.id ? "Edit banner" : "New banner" }) }),
						form && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
										label: "Section",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
											className: "h-9 w-full rounded-xl border border-input bg-background px-2 text-sm",
											value: form.section,
											onChange: (e) => setForm({
												...form,
												section: e.target.value
											}),
											"data-testid": "banner-form-section",
											children: SECTIONS.map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: key,
												children: label
											}, key))
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
										label: "Priority (higher first)",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											inputMode: "numeric",
											value: form.priority,
											onChange: (e) => setForm({
												...form,
												priority: e.target.value
											}),
											"data-testid": "banner-form-priority"
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field$1, {
									label: "Title",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.title,
										maxLength: 120,
										onChange: (e) => setForm({
											...form,
											title: e.target.value
										}),
										"data-testid": "banner-form-title"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-muted-foreground",
										children: "Optional — leave blank for an image-only banner."
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
									label: "Short description",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
										rows: 2,
										maxLength: 500,
										value: form.description,
										onChange: (e) => setForm({
											...form,
											description: e.target.value
										}),
										"data-testid": "banner-form-description"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field$1, {
									label: "Image / illustration",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												value: form.imageUrl,
												placeholder: "https://… or upload",
												onChange: (e) => setForm({
													...form,
													imageUrl: e.target.value
												}),
												"data-testid": "banner-form-image-url"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												ref: fileRef,
												type: "file",
												accept: "image/*",
												className: "hidden",
												onChange: (e) => {
													const f = e.target.files?.[0];
													if (f) handleFile(f);
												},
												"data-testid": "banner-form-image-file"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												type: "button",
												size: "sm",
												variant: "outline",
												disabled: uploading,
												onClick: () => fileRef.current?.click(),
												children: uploading ? "…" : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" })
											})
										]
									}), form.imageUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: form.imageUrl,
										alt: "Preview",
										className: "mt-2 max-h-32 w-full rounded-xl object-cover",
										decoding: "async"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
										label: "CTA kind",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
											className: "h-9 w-full rounded-xl border border-input bg-background px-2 text-sm",
											value: form.ctaKind,
											onChange: (e) => setForm({
												...form,
												ctaKind: e.target.value
											}),
											"data-testid": "banner-form-cta-kind",
											children: CTA_KINDS.map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: key,
												children: label
											}, key))
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
										label: "CTA label",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: form.ctaLabel,
											disabled: form.ctaKind === "none",
											onChange: (e) => setForm({
												...form,
												ctaLabel: e.target.value
											}),
											placeholder: "Learn more",
											"data-testid": "banner-form-cta-label"
										})
									})]
								}),
								(form.ctaKind === "offer" || form.ctaKind === "offerwall_provider" || form.ctaKind === "url") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
									label: form.ctaKind === "url" ? "URL" : form.ctaKind === "offer" ? "Offer ID (uuid)" : "Offerwall provider ID (uuid)",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.ctaTarget,
										onChange: (e) => setForm({
											...form,
											ctaTarget: e.target.value
										}),
										"data-testid": "banner-form-cta-target"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
										label: "Starts (your local time)",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "datetime-local",
											value: form.startsAtLocal,
											onChange: (e) => setForm({
												...form,
												startsAtLocal: e.target.value
											}),
											"data-testid": "banner-form-starts"
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
										label: "Ends (your local time)",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "datetime-local",
											value: form.endsAtLocal,
											onChange: (e) => setForm({
												...form,
												endsAtLocal: e.target.value
											}),
											"data-testid": "banner-form-ends"
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex items-center gap-2 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
										checked: form.isActive,
										onCheckedChange: (v) => setForm({
											...form,
											isActive: v
										})
									}), "Active"]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							onClick: () => setForm(null),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "jade",
							disabled: !canSave || saveAction.isPending,
							onClick: () => form && saveAction.mutate(form),
							"data-testid": "banner-save-btn",
							children: saveAction.isPending ? "Saving…" : "Save banner"
						})] })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
				open: Boolean(pendingDelete),
				onOpenChange: (open) => !open && setPendingDelete(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogTitle, { children: [
					"Delete \"",
					pendingDelete?.title,
					"\"?"
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, { children: "This removes the banner immediately across the app." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "Cancel" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
					onClick: () => pendingDelete && deleteAction.mutate(pendingDelete.id),
					children: "Delete"
				})] })] })
			})
		]
	});
}
function Field$1({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			className: "text-xs text-muted-foreground",
			children: label
		}), children]
	});
}
/**
* Renders a short-lived signed URL preview for a stored proof file.
* The URL is fetched fresh each mount (300s expiry) and never cached to the DOM.
*/
function ClaimProofPreview({ path }) {
	const sign = useServerFn(adminSignProofUrl);
	const q = useQuery({
		queryKey: ["proof-signed-url", path],
		queryFn: () => sign({ data: { path } }),
		staleTime: 24e4
	});
	if (q.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-2 text-xs text-muted-foreground",
		"data-testid": "claim-proof-loading",
		children: "Loading proof…"
	});
	const url = q.data?.url;
	if (!url) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "mt-2 flex items-center gap-1 text-xs text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileImage, { className: "size-3.5" }), "Proof unavailable"]
	});
	const isPdf = /\.pdf($|\?)/i.test(path);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
		href: url,
		target: "_blank",
		rel: "noopener noreferrer",
		className: "mt-2 block overflow-hidden rounded-xl border border-border bg-background-alt",
		"data-testid": "claim-proof-preview",
		children: isPdf ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 p-3 text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileImage, { className: "size-4 text-primary" }), "Open proof PDF"]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: url,
			alt: "Proof of completion",
			className: "max-h-64 w-full object-contain",
			loading: "lazy",
			decoding: "async"
		})
	});
}
var PLATFORMS = [
	"android",
	"ios",
	"web"
];
var INTEGRATION_TYPES = [
	"placeholder",
	"native_sdk",
	"web_sdk",
	"hybrid",
	"api"
];
var STATUSES = [
	"draft",
	"configured",
	"testing",
	"live",
	"disabled"
];
var ROUNDING = [
	"nearest",
	"floor",
	"ceil"
];
var IDENTITY_MODES = [
	"user_uuid",
	"hashed_uuid",
	"referral_code",
	"custom"
];
var DEDUPE = [
	"transaction_id",
	"transaction_id_and_user",
	"payload_hash"
];
var AUTH_MODES = [
	"none",
	"signature",
	"ip_allowlist",
	"signature_and_ip"
];
var EMPTY = {
	slug: "",
	name: "",
	tagline: "",
	lockType: "none",
	unlockAt: null,
	requiredLifetimeEarned: null,
	logoUrl: "",
	enabled: false,
	displayOrder: 0,
	platforms: ["android"],
	integrationType: "placeholder",
	sdkVersion: "",
	appId: "",
	placementId: "",
	publisherId: "",
	extraConfig: {},
	secretRefs: {},
	currencyName: "coins",
	currencyPerUsd: 100,
	rewardMultiplier: 1,
	minReward: 0,
	maxReward: null,
	roundingMode: "nearest",
	postbackPath: "",
	postbackAuthMode: "none",
	postbackSignatureSecretRef: "",
	postbackIpAllowlist: [],
	transactionIdParam: "transaction_id",
	userIdParam: "sub_id",
	rewardParam: "amount",
	userIdentityMode: "user_uuid",
	userIdentitySaltRef: "",
	dedupeStrategy: "transaction_id",
	dedupeWindowHours: 720,
	status: "draft",
	notes: "",
	metadata: {}
};
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "grid gap-1 text-xs",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted-foreground",
			children: label
		}), children]
	});
}
function Select({ value, options, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
		className: "h-9 rounded-md border border-input bg-background px-2 text-sm",
		value,
		onChange: (event) => onChange(event.target.value),
		children: options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
			value: option,
			children: option
		}, option))
	});
}
function SdkOfferwallManager() {
	const queryClient = useQueryClient();
	const fetchProviders = useServerFn(listAdminSdkProviders);
	const save = useServerFn(saveSdkProvider);
	const setControls = useServerFn(updateSdkProviderControls);
	const remove = useServerFn(deleteSdkProvider);
	const [form, setForm] = (0, import_react.useState)(null);
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const [uploadError, setUploadError] = (0, import_react.useState)(null);
	const fileRef = (0, import_react.useRef)(null);
	const requestUpload = useServerFn(requestOfferwallLogoUploadUrl);
	const handleLogoFile = async (file) => {
		if (!form) return;
		if (file.size > 3145728) {
			setUploadError("File must be under 3 MB.");
			return;
		}
		setUploadError(null);
		setUploading(true);
		try {
			toast.info("Resizing and converting to WebP...");
			const optimizedFile = await resizeAndConvertToWebP(file, 256, .82);
			const { uploadUrl, token, publicUrl } = await requestUpload({ data: { filename: optimizedFile.name.slice(0, 120) } });
			const res = await fetch(uploadUrl, {
				method: "PUT",
				headers: {
					"Content-Type": optimizedFile.type || "application/octet-stream",
					"cache-control": "max-age=31536000",
					...token ? { Authorization: `Bearer ${token}` } : {}
				},
				body: optimizedFile
			});
			if (!res.ok) throw new Error(`Upload failed (${res.status})`);
			patch({ logoUrl: publicUrl });
			toast.success("Logo uploaded.");
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Upload failed.";
			setUploadError(msg);
			toast.error(msg);
		} finally {
			setUploading(false);
			if (fileRef.current) fileRef.current.value = "";
		}
	};
	const providers = useQuery({
		queryKey: ["sdk-offerwall-providers"],
		queryFn: () => fetchProviders({})
	});
	const refresh = () => {
		queryClient.invalidateQueries({ queryKey: ["sdk-offerwall-providers"] });
		queryClient.invalidateQueries({ queryKey: ["sdk-offerwall-public"] });
	};
	const onError = (error) => toast.error(error.message);
	const saveMutation = useMutation({
		mutationFn: (input) => save({ data: input }),
		onSuccess: () => {
			toast.success("SDK provider saved.");
			setForm(null);
			refresh();
		},
		onError
	});
	const controlMutation = useMutation({
		mutationFn: (input) => setControls({ data: input }),
		onSuccess: refresh,
		onError
	});
	const deleteMutation = useMutation({
		mutationFn: (id) => remove({ data: { id } }),
		onSuccess: () => {
			toast.success("SDK provider removed.");
			refresh();
		},
		onError
	});
	const patch = (values) => setForm((current) => current ? {
		...current,
		...values
	} : current);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "grid gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "SDK Offerwalls" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					onClick: () => setForm({ ...EMPTY }),
					children: "New provider"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: "Provider-agnostic SDK offerwall configuration. Separate from the Offer Feed networks. No SDK is integrated yet — enabled providers show as configured slots in the app."
			}),
			form && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card grid gap-3 p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Name",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.name,
									onChange: (e) => patch({ name: e.target.value })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Slug",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.slug,
									onChange: (e) => patch({ slug: e.target.value })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Tagline",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.tagline,
									onChange: (e) => patch({ tagline: e.target.value })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
								label: "Logo URL",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: form.logoUrl ?? "",
											placeholder: "https://… or upload",
											onChange: (e) => {
												setUploadError(null);
												patch({ logoUrl: e.target.value });
											}
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											ref: fileRef,
											type: "file",
											accept: "image/png,image/svg+xml",
											className: "hidden",
											onChange: (e) => {
												const f = e.target.files?.[0];
												if (f) handleLogoFile(f);
											}
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											size: "sm",
											variant: "outline",
											disabled: uploading,
											onClick: () => fileRef.current?.click(),
											children: uploading ? "…" : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" })
										})
									]
								}), uploadError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs text-destructive",
									children: uploadError
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Display order",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									value: form.displayOrder,
									onChange: (e) => patch({ displayOrder: Number(e.target.value) })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Integration type",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
									value: form.integrationType,
									options: INTEGRATION_TYPES,
									onChange: (integrationType) => patch({ integrationType })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Status",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
									value: form.status,
									options: STATUSES,
									onChange: (status) => patch({ status })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "SDK version",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.sdkVersion ?? "",
									onChange: (e) => patch({ sdkVersion: e.target.value })
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-3 text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: form.enabled,
								onChange: (e) => patch({ enabled: e.target.checked })
							}), "Enabled"]
						}), PLATFORMS.map((platform) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: form.platforms.includes(platform),
								onChange: (e) => patch({ platforms: e.target.checked ? [...form.platforms, platform] : form.platforms.filter((p) => p !== platform) })
							}), platform]
						}, platform))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-3 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "App ID",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.appId ?? "",
									onChange: (e) => patch({ appId: e.target.value })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Placement ID",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.placementId ?? "",
									onChange: (e) => patch({ placementId: e.target.value })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Publisher ID",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.publisherId ?? "",
									onChange: (e) => patch({ publisherId: e.target.value })
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-3 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Currency name",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.currencyName,
									onChange: (e) => patch({ currencyName: e.target.value })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Currency per USD",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									value: form.currencyPerUsd,
									onChange: (e) => patch({ currencyPerUsd: Number(e.target.value) })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Reward multiplier",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									step: "0.01",
									value: form.rewardMultiplier,
									onChange: (e) => patch({ rewardMultiplier: Number(e.target.value) })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Min reward",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									step: "0.01",
									value: form.minReward,
									onChange: (e) => patch({ minReward: Number(e.target.value) })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Max reward",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									step: "0.01",
									value: form.maxReward ?? "",
									onChange: (e) => patch({ maxReward: e.target.value === "" ? null : Number(e.target.value) })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Rounding",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
									value: form.roundingMode,
									options: ROUNDING,
									onChange: (roundingMode) => patch({ roundingMode })
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Postback path",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.postbackPath ?? "",
									onChange: (e) => patch({ postbackPath: e.target.value })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Postback auth mode",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
									value: form.postbackAuthMode,
									options: AUTH_MODES,
									onChange: (postbackAuthMode) => patch({ postbackAuthMode })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Signature secret name (reference only)",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.postbackSignatureSecretRef ?? "",
									onChange: (e) => patch({ postbackSignatureSecretRef: e.target.value })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "IP allowlist (comma separated)",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.postbackIpAllowlist.join(","),
									onChange: (e) => patch({ postbackIpAllowlist: e.target.value.split(",").map((ip) => ip.trim()).filter(Boolean) })
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-3 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Transaction ID param",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.transactionIdParam,
									onChange: (e) => patch({ transactionIdParam: e.target.value })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "User ID param",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.userIdParam,
									onChange: (e) => patch({ userIdParam: e.target.value })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Reward param",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.rewardParam,
									onChange: (e) => patch({ rewardParam: e.target.value })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "User identity mode",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
									value: form.userIdentityMode,
									options: IDENTITY_MODES,
									onChange: (userIdentityMode) => patch({ userIdentityMode })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Identity salt secret name",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.userIdentitySaltRef ?? "",
									onChange: (e) => patch({ userIdentitySaltRef: e.target.value })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Dedupe strategy",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
									value: form.dedupeStrategy,
									options: DEDUPE,
									onChange: (dedupeStrategy) => patch({ dedupeStrategy })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Dedupe window (hours)",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									value: form.dedupeWindowHours,
									onChange: (e) => patch({ dedupeWindowHours: Number(e.target.value) })
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Notes",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							rows: 2,
							value: form.notes,
							onChange: (e) => patch({ notes: e.target.value })
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-2 text-xs font-semibold text-amber-700 dark:text-amber-300",
							children: "🔒 Lock condition"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Lock type",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
										value: form.lockType ?? "none",
										options: [
											"none",
											"time",
											"earning"
										],
										onChange: (lockType) => patch({
											lockType,
											unlockAt: null,
											requiredLifetimeEarned: null
										})
									})
								}),
								form.lockType === "time" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Unlock at (UTC)",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "datetime-local",
										value: form.unlockAt ? new Date(form.unlockAt).toISOString().slice(0, 16) : "",
										onChange: (e) => patch({ unlockAt: e.target.value ? new Date(e.target.value).toISOString() : null })
									})
								}),
								form.lockType === "earning" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Required lifetime earned ($)",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "number",
										step: "0.01",
										min: "0",
										placeholder: "e.g. 5.00",
										value: form.requiredLifetimeEarned ?? "",
										onChange: (e) => patch({ requiredLifetimeEarned: e.target.value === "" ? null : Number(e.target.value) })
									})
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							disabled: saveMutation.isPending,
							onClick: () => saveMutation.mutate(form),
							children: "Save provider"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "outline",
							onClick: () => setForm(null),
							children: "Cancel"
						})]
					})
				]
			}),
			providers.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Loading SDK providers…"
			}) : !providers.data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				title: "No SDK providers",
				description: "Add your first SDK offerwall provider."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-2",
				children: providers.data.map((provider) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "surface-card grid gap-2 p-3 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-semibold",
								children: [
									provider.name,
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-xs text-muted-foreground",
										children: [
											"(",
											provider.slug,
											")"
										]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									provider.tagline || "—",
									" · ",
									provider.integration_type,
									" ·",
									" ",
									provider.platforms.join("/"),
									" · order ",
									provider.display_order
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									provider.currency_name,
									" @ ",
									provider.currency_per_usd,
									"/USD · dedupe",
									" ",
									provider.dedupe_strategy,
									" · identity ",
									provider.user_identity_mode,
									" ·",
									" ",
									provider.hasAdapter ? "adapter registered" : "no adapter yet"
								]
							}),
							provider.lock_type !== "none" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-amber-600",
								children: [
									"🔒",
									" ",
									provider.lock_type === "time" ? `Until ${new Date(String(provider.unlock_at)).toLocaleDateString()}` : `Earn $${Number(provider.required_lifetime_earned).toFixed(2)}`
								]
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full bg-muted px-2 py-1 text-xs",
							children: provider.status
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: provider.enabled ? "secondary" : "outline",
								onClick: () => controlMutation.mutate({
									id: provider.id,
									enabled: !provider.enabled
								}),
								children: provider.enabled ? "Enabled" : "Disabled"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "outline",
								onClick: () => setForm({
									id: provider.id,
									slug: provider.slug,
									name: provider.name,
									tagline: provider.tagline,
									logoUrl: provider.logo_url ?? "",
									enabled: provider.enabled,
									displayOrder: provider.display_order,
									platforms: provider.platforms,
									integrationType: provider.integration_type,
									sdkVersion: provider.sdk_version ?? "",
									appId: provider.app_id ?? "",
									placementId: provider.placement_id ?? "",
									publisherId: provider.publisher_id ?? "",
									extraConfig: provider.extra_config,
									secretRefs: provider.secret_refs,
									currencyName: provider.currency_name,
									currencyPerUsd: Number(provider.currency_per_usd),
									rewardMultiplier: Number(provider.reward_multiplier),
									minReward: Number(provider.min_reward),
									maxReward: provider.max_reward == null ? null : Number(provider.max_reward),
									roundingMode: provider.rounding_mode,
									postbackPath: provider.postback_path ?? "",
									postbackAuthMode: provider.postback_auth_mode,
									postbackSignatureSecretRef: provider.postback_signature_secret_ref ?? "",
									postbackIpAllowlist: provider.postback_ip_allowlist,
									transactionIdParam: provider.transaction_id_param,
									userIdParam: provider.user_id_param,
									rewardParam: provider.reward_param,
									userIdentityMode: provider.user_identity_mode,
									userIdentitySaltRef: provider.user_identity_salt_ref ?? "",
									dedupeStrategy: provider.dedupe_strategy,
									dedupeWindowHours: provider.dedupe_window_hours,
									status: provider.status,
									notes: provider.notes,
									metadata: provider.metadata,
									lockType: provider.lock_type ?? "none",
									unlockAt: provider.unlock_at ?? null,
									requiredLifetimeEarned: provider.required_lifetime_earned != null ? Number(provider.required_lifetime_earned) : null
								}),
								children: "Edit"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "outline",
								onClick: () => deleteMutation.mutate(provider.id),
								children: "Delete"
							})
						]
					})]
				}, provider.id))
			})
		]
	});
}
/** Admin-only automation observability + retry API. */
var listAutomationLogs = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	eventType: stringType().trim().max(60).optional(),
	status: enumType([
		"info",
		"success",
		"warning",
		"error"
	]).optional(),
	limit: numberType().int().min(1).max(200).default(50)
}).parse(input ?? {})).handler(createSsrRpc("3496dc372a78d4eb4ce1811294c47da645af755f6da0ad04be131560d5bb05bf"));
var automationStats = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("af6f16c0f33cb0696a7a87808039804596b18d30ad3fd34e91acaa160ed261df"));
var retryConversion = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ conversionId: stringType().uuid() }).parse(input)).handler(createSsrRpc("0bd057af126f88808da8e0ddaee5f4f4a6a129039c5b0b5fb08f4676e811fb6f"));
var statusTone = {
	success: "text-emerald-600",
	error: "text-destructive",
	warning: "text-amber-600",
	info: "text-muted-foreground"
};
function AutomationPanel() {
	const queryClient = useQueryClient();
	const fetchStats = useServerFn(automationStats);
	const fetchLogs = useServerFn(listAutomationLogs);
	const fetchConversions = useServerFn(listSdkConversions);
	const runRetry = useServerFn(retryConversion);
	const [status, setStatus] = (0, import_react.useState)("all");
	const stats = useQuery({
		queryKey: ["automation-stats"],
		queryFn: () => fetchStats({})
	});
	const logs = useQuery({
		queryKey: ["automation-logs", status],
		queryFn: () => fetchLogs({ data: status === "all" ? { limit: 50 } : {
			status,
			limit: 50
		} })
	});
	const conversions = useQuery({
		queryKey: ["automation-conversions"],
		queryFn: () => fetchConversions({ data: { limit: 50 } })
	});
	const retry = useMutation({
		mutationFn: (conversionId) => runRetry({ data: { conversionId } }),
		onSuccess: (result) => {
			if (result.ok) toast.success("Conversion credited.");
			else toast.error(`Retry skipped: ${result.reason}`);
			queryClient.invalidateQueries({ queryKey: ["automation-conversions"] });
			queryClient.invalidateQueries({ queryKey: ["automation-logs"] });
			queryClient.invalidateQueries({ queryKey: ["automation-stats"] });
		},
		onError: (error) => toast.error(error.message)
	});
	const retryable = (conversions.data ?? []).filter((c) => c.status === "pending" || c.status === "rejected");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Automation health" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat$1, {
						label: "Events (24h)",
						value: String(stats.data?.events24h ?? 0)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat$1, {
						label: "Errors (24h)",
						value: String(stats.data?.errors24h ?? 0)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat$1, {
						label: "Credited conversions",
						value: String(stats.data?.creditedConversions ?? 0)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat$1, {
						label: "Duplicates blocked",
						value: String(stats.data?.duplicateConversions ?? 0)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Conversions needing attention" }),
			conversions.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Loading…"
			}) : retryable.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				title: "Nothing to retry",
				description: "All conversions processed cleanly."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2",
				children: retryable.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-xl border border-border bg-card p-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-sm font-medium",
								children: c.provider_transaction_id
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									c.status,
									" · ",
									formatMoney(Number(c.reward_amount)),
									" ·",
									" ",
									formatDateTime(c.received_at)
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "jade",
							disabled: retry.isPending,
							onClick: () => retry.mutate(c.id),
							children: "Retry"
						})]
					})
				}, c.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Automation logs" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					"all",
					"success",
					"warning",
					"error",
					"info"
				].map((key) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: status === key ? "jade" : "outline",
					onClick: () => setStatus(key),
					children: key
				}, key))
			}),
			logs.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Loading…"
			}) : (logs.data ?? []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				title: "No logs yet",
				description: "Automation events will appear here."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2",
				children: (logs.data ?? []).map((log) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-border bg-card p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium",
								children: log.event_type
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `text-xs ${statusTone[log.status] ?? "text-muted-foreground"}`,
								children: log.status
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: log.message
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs text-muted-foreground",
							children: [
								log.source,
								" · ",
								formatDateTime(log.created_at)
							]
						})
					]
				}, log.id))
			})
		]
	});
}
function Stat$1({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-border bg-card p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-lg font-semibold",
			children: value
		})]
	});
}
function OfferFeedAutomationPanel() {
	const queryClient = useQueryClient();
	const fetchAutomation = useServerFn(getFeedAutomation);
	const saveSettings = useServerFn(updateFeedSettings);
	const saveNetwork = useServerFn(updateNetworkFeedSettings);
	const refreshNow = useServerFn(adminRefreshFeed);
	const automation = useQuery({
		queryKey: ["offer-feed-automation"],
		queryFn: () => fetchAutomation({})
	});
	const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["offer-feed-automation"] });
	const [refreshHours, setRefreshHours] = (0, import_react.useState)("5");
	const [defaultCountry, setDefaultCountry] = (0, import_react.useState)("US");
	const [fallback, setFallback] = (0, import_react.useState)("default_country");
	const [featuredSlots, setFeaturedSlots] = (0, import_react.useState)("3");
	(0, import_react.useEffect)(() => {
		const s = automation.data?.settings;
		if (!s) return;
		setRefreshHours(String(s.refreshIntervalHours));
		setDefaultCountry(s.defaultCountry);
		setFallback(s.fallbackBehavior);
		setFeaturedSlots(String(s.featuredSlots));
	}, [automation.data?.settings]);
	const settingsMutation = useMutation({
		mutationFn: () => saveSettings({ data: {
			refreshIntervalHours: Number(refreshHours),
			defaultCountry: defaultCountry.trim().toUpperCase(),
			fallbackBehavior: fallback,
			featuredSlots: Number(featuredSlots)
		} }),
		onSuccess: () => {
			toast.success("Feed automation settings saved.");
			invalidate();
		},
		onError: (e) => toast.error(e.message)
	});
	const networkMutation = useMutation({
		mutationFn: (input) => saveNetwork({ data: input }),
		onSuccess: () => {
			toast.success("Network settings saved.");
			invalidate();
		},
		onError: (e) => toast.error(e.message)
	});
	const refreshMutation = useMutation({
		mutationFn: (providerId) => refreshNow({ data: { providerId } }),
		onSuccess: (r) => {
			toast.success(`Refreshed ${r.provider} (${r.country}): ${r.count} offers cached.`);
			invalidate();
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		"data-testid": "offer-feed-automation-panel",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Global feed settings" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface-card space-y-3 p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "refresh-hours",
							children: "Refresh interval (hours)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "refresh-hours",
							"data-testid": "feed-refresh-interval-input",
							type: "number",
							min: 1,
							max: 168,
							value: refreshHours,
							onChange: (e) => setRefreshHours(e.target.value)
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "default-country",
							children: "Default country"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "default-country",
							"data-testid": "feed-default-country-input",
							maxLength: 2,
							value: defaultCountry,
							onChange: (e) => setDefaultCountry(e.target.value.toUpperCase()),
							placeholder: "US"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "featured-slots",
							children: "Featured slots"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "featured-slots",
							"data-testid": "feed-featured-slots-input",
							type: "number",
							min: 1,
							max: 24,
							value: featuredSlots,
							onChange: (e) => setFeaturedSlots(e.target.value)
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Zero-offer fallback" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select$1, {
							value: fallback,
							onValueChange: (v) => setFallback(v),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								"data-testid": "feed-fallback-select",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "none",
								children: "Show nothing"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "default_country",
								children: "Fall back to default country"
							})] })]
						})] })
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "jade",
					"data-testid": "feed-save-settings-button",
					disabled: settingsMutation.isPending,
					onClick: () => settingsMutation.mutate(),
					children: settingsMutation.isPending ? "Saving…" : "Save settings"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Networks" }),
			automation.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Loading…"
			}) : !automation.data?.providers.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				icon: Globe,
				title: "No networks connected",
				description: "Connect a network under the Networks tab first."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-2",
				children: automation.data.providers.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkRow, {
					provider: p,
					onSave: (input) => networkMutation.mutate(input),
					onRefresh: () => refreshMutation.mutate(p.id),
					saving: networkMutation.isPending,
					refreshing: refreshMutation.isPending && refreshMutation.variables === p.id
				}, p.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Cached country feeds" }),
			!automation.data?.cache.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				title: "No cached feeds yet",
				description: "Feeds populate as users from a country browse, or after a manual refresh / cron run."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-2",
				children: automation.data.cache.map((c) => {
					const providerName = automation.data?.providers.find((p) => p.id === c.providerId)?.name ?? "Network";
					const expired = new Date(c.expiresAt).getTime() <= Date.now();
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "surface-card flex items-center justify-between p-3",
						"data-testid": `feed-cache-row-${c.country}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm font-semibold",
									children: [
										providerName,
										" · ",
										c.country
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: [
										c.offerCount,
										" offers · synced ",
										formatDateTime(c.lastSyncedAt)
									]
								}),
								c.syncError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-destructive",
									children: c.syncError
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `rounded-full px-2.5 py-1 text-[11px] font-semibold ${expired ? "bg-background-alt text-muted-foreground" : "bg-background-alt text-primary"}`,
							children: expired ? "expired" : "fresh"
						})]
					}, `${c.providerId}-${c.country}`);
				})
			})
		]
	});
}
function NetworkRow({ provider, onSave, onRefresh, saving, refreshing }) {
	const [enabled, setEnabled] = (0, import_react.useState)(provider.enabled);
	const [maxOffers, setMaxOffers] = (0, import_react.useState)(String(provider.maxOffers));
	const [weight, setWeight] = (0, import_react.useState)(String(provider.weight));
	(0, import_react.useEffect)(() => {
		setEnabled(provider.enabled);
		setMaxOffers(String(provider.maxOffers));
		setWeight(String(provider.weight));
	}, [
		provider.enabled,
		provider.maxOffers,
		provider.weight
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "surface-card space-y-3 p-3",
		"data-testid": `feed-network-${provider.slug}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-semibold",
					children: provider.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted-foreground",
					children: [
						provider.slug,
						" ·",
						" ",
						provider.hasAdapter ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-1 text-primary",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3" }), " adapter ready"]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-1 text-destructive",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3" }), " no adapter"]
						})
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: `enable-${provider.id}`,
						className: "text-xs",
						children: enabled ? "Enabled" : "Disabled"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
						id: `enable-${provider.id}`,
						"data-testid": `feed-network-enable-${provider.slug}`,
						checked: enabled,
						onCheckedChange: setEnabled
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: `max-${provider.id}`,
					children: "Max offers"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id: `max-${provider.id}`,
					"data-testid": `feed-network-max-${provider.slug}`,
					type: "number",
					min: 1,
					max: 50,
					value: maxOffers,
					onChange: (e) => setMaxOffers(e.target.value)
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: `weight-${provider.id}`,
					children: "Priority weight"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id: `weight-${provider.id}`,
					"data-testid": `feed-network-weight-${provider.slug}`,
					type: "number",
					min: .01,
					step: .1,
					value: weight,
					onChange: (e) => setWeight(e.target.value)
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "jade",
					"data-testid": `feed-network-save-${provider.slug}`,
					disabled: saving,
					onClick: () => onSave({
						providerId: provider.id,
						enabled,
						maxOffers: Number(maxOffers),
						weight: Number(weight)
					}),
					children: "Save"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: "outline",
					"data-testid": `feed-network-refresh-${provider.slug}`,
					disabled: refreshing || !provider.hasAdapter,
					onClick: onRefresh,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: `size-3.5 ${refreshing ? "animate-spin" : ""}` }), refreshing ? "Refreshing…" : "Refresh now"]
				})]
			})
		]
	});
}
/**
* Admin financial overview functions
* Phase 6: Real ledger data for admin dashboard
*/
var getFinancialOverview = createServerFn({ method: "GET" }).handler(createSsrRpc("ee21775ccd9c7dba68ac0e1967f05354f9c8557b2cceebf07c58224bf4b6189e"));
/**
* Admin advertiser management functions
* Phase 6: Real advertiser list and status management
*/
var listAdvertisers = createServerFn({ method: "GET" }).handler(createSsrRpc("ca9c4284fc571e89e956503ff11f192c447eef468ca43107e9cef26ffc86da03"));
/**
* Set advertiser account status (active/restricted/suspended)
* Uses mkt_set_advertiser_status function
*/
var setAdvertiserStatusInput = objectType({
	advertiserId: stringType().uuid(),
	adminId: stringType().uuid(),
	status: enumType([
		"active",
		"restricted",
		"suspended"
	]),
	reason: stringType().min(5)
});
var setAdvertiserStatus = createServerFn({ method: "POST" }).validator(setAdvertiserStatusInput).handler(createSsrRpc("bdb5b904982fc7d03a95a7294877adcd44df7c73c7b6ee4a42df2c791de6694a"));
/**
* Clear advertiser D5 flag
* Uses mkt_clear_advertiser_flag function
*/
var clearAdvertiserFlagInput = objectType({
	advertiserId: stringType().uuid(),
	adminId: stringType().uuid(),
	note: stringType().min(10)
});
createServerFn({ method: "POST" }).validator(clearAdvertiserFlagInput).handler(createSsrRpc("4628f23376d570c6c12510bb75a2b12ea7bba83c9e0c72483f218c31fcca978b"));
function formatTimeRemaining(ms) {
	if (ms <= 0) return "Due now";
	const totalSeconds = Math.floor(ms / 1e3);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	if (minutes > 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
function AutoApprovalCountdown({ autoApproveAt, autoApproveEligible, autoApproveReason }) {
	const [timeRemaining, setTimeRemaining] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!autoApproveAt || !autoApproveEligible) return;
		const updateCountdown = () => {
			const now = Date.now();
			const target = new Date(autoApproveAt).getTime();
			setTimeRemaining(target - now);
		};
		updateCountdown();
		const interval = setInterval(updateCountdown, 1e3);
		return () => clearInterval(interval);
	}, [autoApproveAt, autoApproveEligible]);
	if (!autoApproveEligible && autoApproveReason) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-2 flex items-center gap-1.5 text-xs text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "size-3.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Auto-approval: ", autoApproveReason] })]
	});
	if (!autoApproveAt) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-2 flex items-center gap-1.5 text-xs text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "size-3.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Auto-approval off" })]
	});
	if (timeRemaining !== null) {
		const isOverdue = timeRemaining <= 0;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: `mt-2 flex items-center gap-1.5 text-xs ${isOverdue ? "text-amber-600 dark:text-amber-400 font-medium" : "text-blue-600 dark:text-blue-400"}`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-3.5 shrink-0 animate-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isOverdue ? "Auto-approving..." : `Auto-approves in ${formatTimeRemaining(timeRemaining)}` })]
		});
	}
	return null;
}
/**
* Admin screens for the marketplace (real data from Phase 1 schema). Campaign
* approvals, proof reviews with atomicbudget checks enforced server-side.
*/
function RejectBox({ id, onCancel, onConfirm, isPending }) {
	const [reason, setReason] = (0, import_react.useState)("");
	const valid = reason.trim().length >= 8;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-3 space-y-2 rounded-2xl bg-destructive/5 p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				htmlFor: `reject-${id}`,
				className: "text-xs font-semibold text-destructive",
				children: "Rejection reason (required)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
				id: `reject-${id}`,
				rows: 2,
				maxLength: 500,
				placeholder: "Explain clearly — this is shown to the other party.",
				value: reason,
				onChange: (e) => setReason(e.target.value),
				disabled: isPending
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "outline",
					onClick: onCancel,
					disabled: isPending,
					children: "Cancel"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "destructive",
					className: "flex-1",
					disabled: !valid || isPending,
					"data-testid": `confirm-reject-${id}`,
					onClick: () => onConfirm(reason.trim()),
					children: isPending ? "Rejecting..." : "Confirm rejection"
				})]
			})
		]
	});
}
function ApproveReject({ id, onApprove, onReject, isPending }) {
	const [rejecting, setRejecting] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-3 flex gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			size: "sm",
			variant: "mint",
			className: "flex-1",
			"data-testid": `approve-${id}`,
			onClick: onApprove,
			disabled: isPending,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }), " Approve"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			size: "sm",
			variant: "outline",
			className: "flex-1",
			"data-testid": `reject-${id}`,
			onClick: () => setRejecting(true),
			disabled: isPending,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" }), " Reject"]
		})]
	}), rejecting && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RejectBox, {
		id,
		onCancel: () => setRejecting(false),
		onConfirm: (reason) => {
			setRejecting(false);
			onReject(reason);
		},
		isPending
	})] });
}
function CampaignApprovals() {
	const queryClient = useQueryClient();
	const fetchCampaigns = useServerFn(listPendingCampaigns);
	const reviewFn = useServerFn(reviewCampaign);
	const campaigns = useQuery({
		queryKey: ["admin-pending-campaigns"],
		queryFn: () => fetchCampaigns({})
	});
	const mutation = useMutation({
		mutationFn: (input) => reviewFn({ data: input }),
		onSuccess: (_, vars) => {
			toast.success(vars.decision === "approved" ? "Campaign approved — now live." : "Campaign rejected.");
			queryClient.invalidateQueries({ queryKey: ["admin-pending-campaigns"] });
		},
		onError: (err) => {
			const msg = err instanceof Error ? err.message.replace(/^[A-Z_]+: /, "") : "Something went wrong";
			toast.error("Couldn't review campaign", { description: msg });
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Campaign approvals" }), campaigns.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-3 space-y-3",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-32 rounded-2xl" })
	}) : campaigns.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "surface-card mt-3 p-4 text-sm text-destructive",
		children: "Couldn't load campaigns."
	}) : campaigns.data.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "surface-card mt-3 p-4 text-center text-sm text-muted-foreground",
		children: "No campaigns pending approval."
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "space-y-3",
		"data-testid": "admin-campaign-approvals",
		children: campaigns.data.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "surface-card p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VerificationBadge, { verification: c.verification }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1.5 truncate font-semibold",
								children: c.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									"by ",
									c.advertiserName,
									" · ",
									c.countries.join(", "),
									" · submitted",
									" ",
									formatShortDate(c.submittedAt)
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AutoApprovalCountdown, {
								autoApproveAt: c.autoApproveAt,
								autoApproveEligible: c.autoApproveEligible ?? false,
								autoApproveReason: c.autoApproveReason
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "shrink-0 text-right text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-amount text-sm text-gold-dark",
							children: formatMoney(c.reward)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-muted-foreground",
							children: [
								"of ",
								formatMoney(c.budget),
								" budget"
							]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: c.summary
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ApproveReject, {
					id: c.id,
					onApprove: () => mutation.mutate({
						campaignId: c.id,
						decision: "approved",
						note: "Campaign approved for launch"
					}),
					onReject: (reason) => mutation.mutate({
						campaignId: c.id,
						decision: "rejected",
						note: reason
					}),
					isPending: mutation.isPending && mutation.variables?.campaignId === c.id
				})
			]
		}, c.id))
	})] });
}
function ProofReviews() {
	const queryClient = useQueryClient();
	const fetchProofs = useServerFn(listPendingProofs);
	const reviewFn = useServerFn(reviewProof);
	const proofs = useQuery({
		queryKey: ["admin-pending-proofs"],
		queryFn: () => fetchProofs({})
	});
	const mutation = useMutation({
		mutationFn: (input) => reviewFn({ data: {
			role: "admin",
			...input
		} }),
		onSuccess: (_, vars) => {
			toast.success(vars.decision === "approved" ? "Proof approved — publisher rewarded." : "Proof rejected — publisher notified.");
			queryClient.invalidateQueries({ queryKey: ["admin-pending-proofs"] });
		},
		onError: (err) => {
			const msg = err instanceof Error ? err.message.replace(/^[A-Z_]+: /, "") : "Something went wrong";
			toast.error("Couldn't review proof", { description: msg });
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Proof submissions" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-3 text-xs text-muted-foreground",
			children: "Rejection reasons are shown to the publisher and can be appealed from their My Submissions screen."
		}),
		proofs.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 space-y-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-32 rounded-2xl" })
		}) : proofs.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "surface-card mt-3 p-4 text-sm text-destructive",
			children: "Couldn't load proofs."
		}) : proofs.data.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "surface-card mt-3 p-4 text-center text-sm text-muted-foreground",
			children: "No proofs pending review."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "space-y-3",
			"data-testid": "admin-proof-reviews",
			children: proofs.data.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "surface-card p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-3",
					children: [p.proofPaths && p.proofPaths.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: p.proofPaths[0],
						alt: "Proof screenshot",
						className: "h-28 w-20 shrink-0 rounded-xl border border-border object-cover"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-label": "No screenshot uploaded",
						className: "grid h-28 w-20 shrink-0 place-items-center rounded-xl border border-dashed border-border bg-background-alt text-muted-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "size-6" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate font-semibold",
								children: p.campaignTitle
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									"Publisher ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: p.publisherName }),
									" · ",
									formatShortDate(p.submittedAt),
									" ",
									"· ",
									formatMoney(p.reward)
								]
							}),
							p.appealText && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 rounded-xl bg-primary/10 p-2 text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold",
									children: "Appeal: "
								}), p.appealText]
							}),
							p.userNote && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 rounded-xl bg-background-alt p-2 text-xs",
								children: p.userNote ? `"${p.userNote}"` : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", {
									className: "text-muted-foreground",
									children: "No notes"
								})
							}),
							p.fieldValues && Object.keys(p.fieldValues).length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 rounded-xl border border-border bg-background-alt p-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] font-semibold text-muted-foreground mb-1",
									children: "Submitted details:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-0.5",
									children: Object.entries(p.fieldValues).map(([key, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex gap-2 text-xs",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-muted-foreground",
											children: [key, ":"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium",
											children: String(value)
										})]
									}, key))
								})]
							})
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ApproveReject, {
					id: p.id,
					onApprove: () => mutation.mutate({
						submissionId: p.id,
						decision: "approved",
						reason: null
					}),
					onReject: (reason) => mutation.mutate({
						submissionId: p.id,
						decision: "rejected",
						reason
					}),
					isPending: mutation.isPending && mutation.variables?.submissionId === p.id
				})]
			}, p.id))
		})
	] });
}
function AdvertisersList() {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const fetchAdvertisers = useServerFn(listAdvertisers);
	const setStatus = useServerFn(setAdvertiserStatus);
	const advertisers = useQuery({
		queryKey: ["admin-advertisers"],
		queryFn: () => fetchAdvertisers({})
	});
	const statusMutation = useMutation({
		mutationFn: (input) => setStatus({ data: {
			...input,
			adminId: user?.id ?? ""
		} }),
		onSuccess: (_, vars) => {
			toast.success(`Advertiser ${vars.status === "active" ? "activated" : vars.status}.`);
			queryClient.invalidateQueries({ queryKey: ["admin-advertisers"] });
		},
		onError: (err) => {
			const msg = err instanceof Error ? err.message.replace(/^[A-Z_]+: /, "") : "Something went wrong";
			toast.error("Couldn't update advertiser status", { description: msg });
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Advertisers" }), advertisers.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-3 space-y-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-24 rounded-2xl" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-24 rounded-2xl" })]
	}) : advertisers.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "surface-card mt-3 p-4 text-sm text-destructive",
		children: "Couldn't load advertisers."
	}) : advertisers.data.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "surface-card mt-3 p-4 text-center text-sm text-muted-foreground",
		children: "No advertisers yet."
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "space-y-3",
		children: advertisers.data.map((adv) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "surface-card p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate font-semibold",
									children: adv.display_name
								}), adv.flagged_for_review && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-4 shrink-0 text-destructive" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									adv.contact_email,
									" · ",
									adv.campaign_count,
									" campaigns · joined",
									" ",
									formatShortDate(adv.created_at)
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex gap-4 text-xs",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-muted-foreground",
										children: "Balance"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-mono text-sm font-semibold",
										children: formatMoney(adv.deposit_balance)
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-muted-foreground",
										children: "Deposited"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-mono text-sm font-semibold",
										children: formatMoney(adv.lifetime_deposited)
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-muted-foreground",
										children: "Spent"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-mono text-sm font-semibold",
										children: formatMoney(adv.lifetime_spent)
									})] })
								]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex shrink-0 flex-col items-end gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted-foreground",
								children: "Active"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
								checked: adv.status === "active",
								onCheckedChange: (checked) => {
									if (!user?.id) {
										toast.error("You must be logged in to change status");
										return;
									}
									const newStatus = checked ? "active" : "restricted";
									const reason = checked ? "Access restored by admin" : "Access restricted by admin";
									statusMutation.mutate({
										advertiserId: adv.user_id,
										status: newStatus,
										reason
									});
								},
								disabled: statusMutation.isPending
							})]
						}), adv.status !== "active" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive",
							children: adv.status
						})]
					})]
				}),
				adv.status_reason && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 rounded-xl bg-background-alt p-2 text-xs text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Reason: " }), adv.status_reason]
				}),
				adv.flagged_for_review && adv.flag_reason && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 rounded-xl bg-destructive/10 p-2 text-xs text-destructive",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Flagged: " }), adv.flag_reason]
				})
			]
		}, adv.user_id))
	})] });
}
function FinancialOverview() {
	const fetchOverview = useServerFn(getFinancialOverview);
	const overview = useQuery({
		queryKey: ["admin-financial-overview"],
		queryFn: () => fetchOverview()
	});
	if (overview.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-20 rounded-2xl" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-20 rounded-2xl" })]
	});
	if (overview.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "surface-card p-4 text-sm text-destructive",
		children: ["Couldn't load financial overview.", overview.error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}), String(overview.error)] })]
	});
	const data = overview.data;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Financial Overview" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-2 gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "size-4 text-green-600" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "Total Deposits"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-2xl font-bold",
						children: formatMoney(data.totalDeposits)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "size-4 text-blue-600" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "Campaign Spend"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-2xl font-bold",
						children: formatMoney(data.totalCampaignSpend)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "size-4 text-purple-600" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "Publisher Payouts"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-2xl font-bold",
						children: formatMoney(data.totalPublisherPayouts)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "size-4 text-gold-dark" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "Platform Fee"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-2xl font-bold",
						children: formatMoney(data.platformFeeCollected)
					})]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 grid grid-cols-3 gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "Active Advertisers"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xl font-semibold",
						children: data.activeAdvertisers
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "Active Campaigns"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xl font-semibold",
						children: data.activeCampaigns
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "Pending Reviews"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xl font-semibold",
						children: data.pendingSubmissions
					})]
				})
			]
		})
	] });
}
function MarketplaceSettingsPanel() {
	const queryClient = useQueryClient();
	const fetchSettings = useServerFn(getMarketplaceSettings);
	const updateSettings = useServerFn(updateMarketplaceSettings);
	const settings = useQuery({
		queryKey: ["marketplace-settings"],
		queryFn: () => fetchSettings()
	});
	const [localAutoApproveEnabled, setLocalAutoApproveEnabled] = (0, import_react.useState)(null);
	const [localAutoApproveMinutes, setLocalAutoApproveMinutes] = (0, import_react.useState)(null);
	const [localSkipFirstCampaign, setLocalSkipFirstCampaign] = (0, import_react.useState)(null);
	const [localFeesEnabled, setLocalFeesEnabled] = (0, import_react.useState)(null);
	const [localCampaignFeeUsd, setLocalCampaignFeeUsd] = (0, import_react.useState)(null);
	const [localCampaignFeeType, setLocalCampaignFeeType] = (0, import_react.useState)(null);
	const [localFeaturedPricePerDay, setLocalFeaturedPricePerDay] = (0, import_react.useState)(null);
	const [localDepositsEnabled, setLocalDepositsEnabled] = (0, import_react.useState)(null);
	const [localManualDepositsEnabled, setLocalManualDepositsEnabled] = (0, import_react.useState)(null);
	const [localInrPerUsd, setLocalInrPerUsd] = (0, import_react.useState)(null);
	const mutation = useMutation({
		mutationFn: (updates) => updateSettings({ data: updates }),
		onSuccess: () => {
			toast.success("Settings updated successfully");
			queryClient.invalidateQueries({ queryKey: ["marketplace-settings"] });
			queryClient.invalidateQueries({ queryKey: ["admin-pending-campaigns"] });
			queryClient.invalidateQueries({ queryKey: ["advertiser-overview"] });
			setLocalAutoApproveEnabled(null);
			setLocalAutoApproveMinutes(null);
			setLocalSkipFirstCampaign(null);
			setLocalFeesEnabled(null);
			setLocalCampaignFeeUsd(null);
			setLocalCampaignFeeType(null);
			setLocalFeaturedPricePerDay(null);
			setLocalDepositsEnabled(null);
			setLocalManualDepositsEnabled(null);
		},
		onError: (err) => {
			const msg = err instanceof Error ? err.message : "Failed to update settings";
			toast.error("Update failed", { description: msg });
		}
	});
	if (settings.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SectionTitle, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "size-5" }), "Auto-approval settings"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-32 rounded-2xl" })]
	});
	if (settings.isError || !settings.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SectionTitle, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "size-5" }), "Auto-approval settings"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "surface-card p-4 text-sm text-destructive",
			children: ["Failed to load settings.", settings.error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}), String(settings.error)] })]
		})]
	});
	const autoApproveEnabled = localAutoApproveEnabled ?? settings.data.auto_approve_enabled ?? false;
	const autoApproveMinutes = localAutoApproveMinutes ?? settings.data.auto_approve_after_minutes ?? 10;
	const skipFirstCampaign = localSkipFirstCampaign ?? settings.data.auto_approve_skip_first_campaign ?? true;
	const feesEnabled = localFeesEnabled ?? settings.data.fees_enabled ?? false;
	const campaignFeeUsd = localCampaignFeeUsd ?? settings.data.campaign_fee_usd ?? .5;
	const campaignFeeType = localCampaignFeeType ?? settings.data.campaign_fee_type ?? "per_campaign";
	const featuredPricePerDay = localFeaturedPricePerDay ?? settings.data.featured_price_per_day ?? 2;
	const depositsEnabled = localDepositsEnabled ?? settings.data.deposits_enabled ?? false;
	const manualDepositsEnabled = localManualDepositsEnabled ?? settings.data.manual_deposits_enabled ?? false;
	const inrPerUsd = localInrPerUsd ?? settings.data.inr_per_usd ?? null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SectionTitle, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "size-5" }), "Auto-approval settings"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card space-y-4 p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "auto-approve-enabled",
									className: "text-sm font-semibold",
									children: "Auto-approve pending campaigns"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: "Automatically approve campaigns that wait too long in the review queue"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
								id: "auto-approve-enabled",
								checked: autoApproveEnabled,
								onCheckedChange: (checked) => setLocalAutoApproveEnabled(checked)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "auto-approve-minutes",
									className: "text-sm font-semibold",
									children: "Auto-approve after (minutes)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "auto-approve-minutes",
									type: "number",
									min: 1,
									max: 120,
									value: autoApproveMinutes,
									onChange: (e) => setLocalAutoApproveMinutes(parseInt(e.target.value, 10)),
									className: "w-32"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: "Range: 1-120 minutes. Default: 10 minutes."
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "skip-first-campaign",
									className: "text-sm font-semibold",
									children: "Always review an advertiser's first campaign manually"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: "When enabled, first campaigns are never auto-approved"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
								id: "skip-first-campaign",
								checked: skipFirstCampaign,
								onCheckedChange: (checked) => setLocalSkipFirstCampaign(checked)
							})]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SectionTitle, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DollarSign, { className: "size-5" }), "Campaign fee settings"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card space-y-4 p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "fees-enabled",
									className: "text-sm font-semibold",
									children: "Enable campaign fees"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: "Charge an additional fee when campaigns are submitted"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
								id: "fees-enabled",
								checked: feesEnabled,
								onCheckedChange: (checked) => setLocalFeesEnabled(checked)
							})]
						}),
						feesEnabled && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "campaign-fee-usd",
									className: "text-sm font-semibold",
									children: "Campaign fee (USD)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "campaign-fee-usd",
									type: "number",
									min: 0,
									max: 100,
									step: .01,
									value: campaignFeeUsd,
									onChange: (e) => setLocalCampaignFeeUsd(parseFloat(e.target.value)),
									className: "w-32"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: "Range: $0.00-$100.00. Default: $0.50"
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "campaign-fee-type",
									className: "text-sm font-semibold",
									children: "Fee type"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select$1, {
									value: campaignFeeType,
									onValueChange: (value) => setLocalCampaignFeeType(value),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										id: "campaign-fee-type",
										className: "w-48",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "per_campaign",
										children: "Per campaign"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "per_slot",
										children: "Per slot"
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: "Per campaign: one-time fee. Per slot: fee × number of slots."
								})
							]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2 border-t border-border pt-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "featured-price-per-day",
									className: "text-sm font-semibold",
									children: "Featured placement price per day (USD)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "featured-price-per-day",
									type: "number",
									min: 0,
									max: 1e3,
									step: .01,
									value: featuredPricePerDay,
									onChange: (e) => setLocalFeaturedPricePerDay(parseFloat(e.target.value)),
									className: "w-32"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: "Range: $0.00-$1000.00. Default: $2.00"
								})
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SectionTitle, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DollarSign, { className: "size-5" }), "Deposit gateway settings"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card space-y-4 p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "deposits-enabled",
									className: "text-sm font-semibold",
									children: "Enable all deposits"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: "Master switch for deposit functionality (all gateways)"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
								id: "deposits-enabled",
								checked: depositsEnabled,
								onCheckedChange: (checked) => setLocalDepositsEnabled(checked)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "manual-deposits-enabled",
									className: "text-sm font-semibold",
									children: "Enable manual deposits"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: "Allow admins to manually credit advertiser deposits"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
								id: "manual-deposits-enabled",
								checked: manualDepositsEnabled,
								onCheckedChange: (checked) => setLocalManualDepositsEnabled(checked)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2 border-t border-border pt-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "inr-per-usd",
									className: "text-sm font-semibold",
									children: "INR per USD exchange rate"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "inr-per-usd",
									type: "number",
									min: 0,
									step: .01,
									placeholder: "Leave empty to disable INR",
									value: inrPerUsd ?? "",
									onChange: (e) => {
										const value = e.target.value;
										setLocalInrPerUsd(value === "" ? null : parseFloat(value));
									},
									className: "w-32"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: "When set, enables UPI (QroPay) and INR-based Razorpay. Leave empty to disable."
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "Gateway availability: Razorpay (configured via RAZORPAY_KEY_ID/SECRET), NOWPayments (configured via NOWPAYMENTS_API_KEY/IPN_SECRET). Buttons appear only when the gateway is configured and deposits_enabled is true."
						})
					]
				})]
			}),
			(localAutoApproveEnabled !== null || localAutoApproveMinutes !== null || localSkipFirstCampaign !== null || localFeesEnabled !== null || localCampaignFeeUsd !== null || localCampaignFeeType !== null || localFeaturedPricePerDay !== null || localDepositsEnabled !== null || localManualDepositsEnabled !== null || localInrPerUsd !== null) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2 border-t border-border pt-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "outline",
					onClick: () => {
						setLocalAutoApproveEnabled(null);
						setLocalAutoApproveMinutes(null);
						setLocalSkipFirstCampaign(null);
						setLocalFeesEnabled(null);
						setLocalCampaignFeeUsd(null);
						setLocalCampaignFeeType(null);
						setLocalFeaturedPricePerDay(null);
						setLocalDepositsEnabled(null);
						setLocalManualDepositsEnabled(null);
						setLocalInrPerUsd(null);
					},
					disabled: mutation.isPending,
					children: "Cancel"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "default",
					onClick: () => {
						const updates = {};
						if (localAutoApproveEnabled !== null) updates.auto_approve_enabled = localAutoApproveEnabled;
						if (localAutoApproveMinutes !== null) updates.auto_approve_after_minutes = localAutoApproveMinutes;
						if (localSkipFirstCampaign !== null) updates.auto_approve_skip_first_campaign = localSkipFirstCampaign;
						if (localFeesEnabled !== null) updates.fees_enabled = localFeesEnabled;
						if (localCampaignFeeUsd !== null) updates.campaign_fee_usd = localCampaignFeeUsd;
						if (localCampaignFeeType !== null) updates.campaign_fee_type = localCampaignFeeType;
						if (localFeaturedPricePerDay !== null) updates.featured_price_per_day = localFeaturedPricePerDay;
						if (localDepositsEnabled !== null) updates.deposits_enabled = localDepositsEnabled;
						if (localManualDepositsEnabled !== null) updates.manual_deposits_enabled = localManualDepositsEnabled;
						if (localInrPerUsd !== null) updates.inr_per_usd = localInrPerUsd;
						mutation.mutate(updates);
					},
					disabled: mutation.isPending,
					children: mutation.isPending ? "Saving..." : "Save changes"
				})]
			})
		]
	});
}
/**
* Renders the masked payout snapshot stored on a withdrawal request. The
* snapshot is written masked-safe at request time, so nothing here can reveal a
* full account number, email or wallet address.
*/
function payoutSnapshotLines(snapshot) {
	if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return [];
	const record = snapshot;
	const pick = (key) => {
		const value = record[key];
		return typeof value === "string" && value.trim() ? value.trim() : null;
	};
	return [
		pick("masked"),
		pick("holder_name"),
		pick("bank_name"),
		pick("country_bank_code"),
		pick("country")
	].filter((line) => Boolean(line));
}
function AdminPage() {
	const { isAdmin, roles } = useAuth();
	const queryClient = useQueryClient();
	const overview = useServerFn(adminOverview);
	const updateWithdrawal = useServerFn(adminUpdateWithdrawal);
	const updateClaim = useServerFn(adminUpdateOfferClaim);
	const respondTicket = useServerFn(adminRespondTicket);
	const setFlag = useServerFn(adminSetFlag);
	const adjustWallet = useServerFn(adminAdjustWallet);
	const fetchProviders = useServerFn(listOfferProviders);
	const fetchDashboard = useServerFn(adminDashboard);
	const saveProvider = useServerFn(upsertOfferProvider);
	const runSync = useServerFn(syncOfferProvider);
	const fetchUsers = useServerFn(adminListUsers);
	const fetchWithdrawals = useServerFn(adminListWithdrawals);
	const fetchClaims = useServerFn(adminListClaims);
	const fetchTickets = useServerFn(adminListTickets);
	const createAdjRequest = useServerFn(createAdjustmentRequest);
	const listAdjRequests = useServerFn(listAdjustmentRequests);
	const approveAdjRequest = useServerFn(approveAdjustmentRequest);
	const rejectAdjRequest = useServerFn(rejectAdjustmentRequest);
	const fetchAuditLogs = useServerFn(adminListAuditLogs);
	useServerFn(getWithdrawalFraudSignals);
	const fetchSameDevice = useServerFn(getUsersWithSameDevice);
	const assignRoleFn = useServerFn(assignRole);
	const removeRoleFn = useServerFn(removeRole);
	const listStaffFn = useServerFn(listStaff);
	const fetchQuickReplies = useServerFn(listQuickReplies);
	const createQuickReplyFn = useServerFn(createQuickReply);
	const updateQuickReplyFn = useServerFn(updateQuickReply);
	const deleteQuickReplyFn = useServerFn(deleteQuickReply);
	const fetchDashboardSignups = useServerFn(getDashboardSignups);
	const fetchDashboardActiveUsers = useServerFn(getDashboardActiveUsers);
	const fetchDashboardRevenuePayout = useServerFn(getDashboardRevenuePayout);
	const fetchDashboardTopOffers = useServerFn(getDashboardTopOffers);
	const fetchUserDetail = useServerFn(getUserDetail);
	const fetchUserAuditLog = useServerFn(getUserAuditLog);
	const broadcastNotification = useServerFn(sendBroadcastNotification);
	const toggleMaintenanceMode = useServerFn(setMaintenanceMode);
	const fetchMaintenanceStatus = useServerFn(getMaintenanceStatus);
	const exportUsers = useServerFn(exportUsersCsv);
	const exportTransactions = useServerFn(exportTransactionsCsv);
	const exportPayouts = useServerFn(exportPayoutsCsv);
	const [tab, setTab] = (0, import_react.useState)("dashboard");
	const [dashboardDays, setDashboardDays] = (0, import_react.useState)(30);
	const [selectedUserId, setSelectedUserId] = (0, import_react.useState)(null);
	const [userDetailTab, setUserDetailTab] = (0, import_react.useState)("profile");
	const [showBroadcastDialog, setShowBroadcastDialog] = (0, import_react.useState)(false);
	const [broadcastTitle, setBroadcastTitle] = (0, import_react.useState)("");
	const [broadcastMessage, setBroadcastMessage] = (0, import_react.useState)("");
	const [broadcastActiveOnly, setBroadcastActiveOnly] = (0, import_react.useState)(true);
	const [showMaintenanceDialog, setShowMaintenanceDialog] = (0, import_react.useState)(false);
	const [maintenanceMessage, setMaintenanceMessage] = (0, import_react.useState)("");
	const [section, setSection] = (0, import_react.useState)("operations");
	const [notes, setNotes] = (0, import_react.useState)({});
	/** Admin-entered fulfilment reference, keyed by withdrawal id. */
	const [references, setReferences] = (0, import_react.useState)({});
	/** Transaction hash for crypto withdrawals, keyed by withdrawal id. */
	const [transactionHashes, setTransactionHashes] = (0, import_react.useState)({});
	const [selectedWithdrawals, setSelectedWithdrawals] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const [withdrawalMethodFilter, setWithdrawalMethodFilter] = (0, import_react.useState)("all");
	const [withdrawalMinAmount, setWithdrawalMinAmount] = (0, import_react.useState)("");
	const [withdrawalMaxAmount, setWithdrawalMaxAmount] = (0, import_react.useState)("");
	const [quickReplies, setQuickReplies] = (0, import_react.useState)([]);
	const [editingQuickReply, setEditingQuickReply] = (0, import_react.useState)(null);
	const [showQuickReplyDialog, setShowQuickReplyDialog] = (0, import_react.useState)(false);
	const [newQuickReplyTitle, setNewQuickReplyTitle] = (0, import_react.useState)("");
	const [newQuickReplyContent, setNewQuickReplyContent] = (0, import_react.useState)("");
	const [userSearch, setUserSearch] = (0, import_react.useState)("");
	const [userFlaggedOnly, setUserFlaggedOnly] = (0, import_react.useState)(false);
	const [userSuspiciousOnly, setUserSuspiciousOnly] = (0, import_react.useState)(false);
	const [userPage, setUserPage] = (0, import_react.useState)(1);
	const [withdrawalStatus, setWithdrawalStatus] = (0, import_react.useState)("all");
	const [withdrawalPage, setWithdrawalPage] = (0, import_react.useState)(1);
	const [claimStatus, setClaimStatus] = (0, import_react.useState)("all");
	const [claimPage, setClaimPage] = (0, import_react.useState)(1);
	const [ticketStatus, setTicketStatus] = (0, import_react.useState)("all");
	const [ticketPage, setTicketPage] = (0, import_react.useState)(1);
	const [ticketReplyStatus, setTicketReplyStatus] = (0, import_react.useState)({});
	const [adjustingUser, setAdjustingUser] = (0, import_react.useState)(null);
	const [selectedDeviceId, setSelectedDeviceId] = (0, import_react.useState)(null);
	const [adjustmentRequestsPage, setAdjustmentRequestsPage] = (0, import_react.useState)(1);
	const [auditLogAdmin, setAuditLogAdmin] = (0, import_react.useState)("");
	const [auditLogAction, setAuditLogAction] = (0, import_react.useState)("");
	const [auditLogStartDate, setAuditLogStartDate] = (0, import_react.useState)("");
	const [auditLogEndDate, setAuditLogEndDate] = (0, import_react.useState)("");
	const [auditLogPage, setAuditLogPage] = (0, import_react.useState)(1);
	const [expandedLogIds, setExpandedLogIds] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const [staffEmail, setStaffEmail] = (0, import_react.useState)("");
	const [staffRole, setStaffRole] = (0, import_react.useState)("finance");
	const totals = useQuery({
		queryKey: ["admin-totals"],
		enabled: isAdmin,
		queryFn: () => overview({})
	});
	const users = useQuery({
		queryKey: [
			"admin-users",
			userSearch,
			userFlaggedOnly,
			userSuspiciousOnly,
			userPage
		],
		enabled: isAdmin && tab === "users",
		queryFn: () => fetchUsers({ data: {
			search: userSearch,
			flaggedOnly: userFlaggedOnly,
			suspiciousOnly: userSuspiciousOnly,
			page: userPage
		} })
	});
	const withdrawals = useQuery({
		queryKey: [
			"admin-withdrawals",
			withdrawalStatus,
			withdrawalPage
		],
		enabled: isAdmin && tab === "withdrawals",
		queryFn: () => fetchWithdrawals({ data: {
			status: withdrawalStatus,
			page: withdrawalPage
		} })
	});
	const claims = useQuery({
		queryKey: [
			"admin-claims",
			claimStatus,
			claimPage
		],
		enabled: isAdmin && tab === "claims",
		queryFn: () => fetchClaims({ data: {
			status: claimStatus,
			page: claimPage
		} })
	});
	const tickets = useQuery({
		queryKey: [
			"admin-tickets",
			ticketStatus,
			ticketPage
		],
		enabled: isAdmin && tab === "tickets",
		queryFn: () => fetchTickets({ data: {
			status: ticketStatus === "all" ? void 0 : ticketStatus,
			page: ticketPage
		} })
	});
	const adjustmentRequests = useQuery({
		queryKey: ["adjustment-requests", adjustmentRequestsPage],
		enabled: isAdmin && tab === "withdrawals",
		queryFn: () => listAdjRequests({ data: { page: adjustmentRequestsPage } })
	});
	const auditLogs = useQuery({
		queryKey: [
			"audit-logs",
			auditLogAdmin,
			auditLogAction,
			auditLogStartDate,
			auditLogEndDate,
			auditLogPage
		],
		enabled: isAdmin && tab === "audit",
		queryFn: () => fetchAuditLogs({ data: {
			adminFilter: auditLogAdmin || void 0,
			actionFilter: auditLogAction || void 0,
			startDate: auditLogStartDate || void 0,
			endDate: auditLogEndDate || void 0,
			page: auditLogPage
		} })
	});
	const sameDeviceUsers = useQuery({
		queryKey: ["same-device", selectedDeviceId],
		enabled: isAdmin && selectedDeviceId !== null,
		queryFn: () => fetchSameDevice({ data: { deviceId: selectedDeviceId } })
	});
	const staffList = useQuery({
		queryKey: ["staff-list"],
		enabled: isAdmin && tab === "staff",
		queryFn: () => listStaffFn({})
	});
	const quickRepliesQuery = useQuery({
		queryKey: ["quick-replies"],
		enabled: isAdmin && tab === "tickets",
		queryFn: () => fetchQuickReplies({})
	});
	const dashboardSignups = useQuery({
		queryKey: ["dashboard-signups", dashboardDays],
		enabled: isAdmin && tab === "dashboard",
		queryFn: () => fetchDashboardSignups({ data: { days: dashboardDays } })
	});
	const dashboardActiveUsers = useQuery({
		queryKey: ["dashboard-active-users", dashboardDays],
		enabled: isAdmin && tab === "dashboard",
		queryFn: () => fetchDashboardActiveUsers({ data: { days: dashboardDays } })
	});
	const dashboardRevenuePayout = useQuery({
		queryKey: ["dashboard-revenue-payout", dashboardDays],
		enabled: isAdmin && tab === "dashboard",
		queryFn: () => fetchDashboardRevenuePayout({ data: { days: dashboardDays } })
	});
	const dashboardTopOffers = useQuery({
		queryKey: ["dashboard-top-offers", dashboardDays],
		enabled: isAdmin && tab === "dashboard",
		queryFn: () => fetchDashboardTopOffers({ data: { days: dashboardDays } })
	});
	const userDetail = useQuery({
		queryKey: ["user-detail", selectedUserId],
		enabled: isAdmin && selectedUserId !== null,
		queryFn: () => fetchUserDetail({ data: { userId: selectedUserId } })
	});
	const userDetailAuditLog = useQuery({
		queryKey: ["user-detail-audit", selectedUserId],
		enabled: isAdmin && selectedUserId !== null && userDetailTab === "audit",
		queryFn: () => fetchUserAuditLog({ data: { userId: selectedUserId } })
	});
	const maintenanceStatus = useQuery({
		queryKey: ["maintenance-status"],
		enabled: isAdmin && tab === "dashboard",
		queryFn: () => fetchMaintenanceStatus({})
	});
	const refresh = () => void queryClient.invalidateQueries();
	const onError = (error) => toast.error(error.message);
	const withdrawalAction = useMutation({
		mutationFn: (input) => updateWithdrawal({ data: {
			id: input.id,
			status: input.status,
			note: input.note ?? null,
			referenceId: input.referenceId?.trim() ? input.referenceId.trim() : null,
			transactionHash: input.transactionHash?.trim() ? input.transactionHash.trim() : null
		} }),
		onSuccess: () => {
			toast.success("Withdrawal updated.");
			refresh();
		},
		onError
	});
	const claimAction = useMutation({
		mutationFn: (input) => updateClaim({ data: {
			id: input.id,
			status: input.status,
			note: input.note ?? null
		} }),
		onSuccess: () => {
			toast.success("Offer claim updated.");
			refresh();
		},
		onError
	});
	const ticketAction = useMutation({
		mutationFn: (input) => respondTicket({ data: {
			id: input.id,
			response: input.response,
			status: input.status || "resolved"
		} }),
		onSuccess: () => {
			toast.success("Reply sent.");
			refresh();
		},
		onError
	});
	const flagAction = useMutation({
		mutationFn: (input) => setFlag({ data: input }),
		onSuccess: () => {
			toast.success("User updated.");
			refresh();
		},
		onError
	});
	const adjustAction = useMutation({
		mutationFn: (input) => adjustWallet({ data: input }),
		onSuccess: () => {
			toast.success("Wallet adjusted.");
			refresh();
		},
		onError
	});
	const adjustRequestAction = useMutation({
		mutationFn: (input) => createAdjRequest({ data: input }),
		onSuccess: () => {
			toast.success("Adjustment request created and pending approval.");
			refresh();
		},
		onError
	});
	const approveAdjustmentAction = useMutation({
		mutationFn: (requestId) => approveAdjRequest({ data: { requestId } }),
		onSuccess: () => {
			toast.success("Adjustment request approved and applied.");
			refresh();
		},
		onError
	});
	const rejectAdjustmentAction = useMutation({
		mutationFn: (requestId) => rejectAdjRequest({ data: { requestId } }),
		onSuccess: () => {
			toast.success("Adjustment request rejected.");
			refresh();
		},
		onError
	});
	const assignRoleAction = useMutation({
		mutationFn: (input) => assignRoleFn({ data: input }),
		onSuccess: () => {
			toast.success("Role assigned successfully.");
			setStaffEmail("");
			refresh();
		},
		onError
	});
	const removeRoleAction = useMutation({
		mutationFn: (input) => removeRoleFn({ data: input }),
		onSuccess: () => {
			toast.success("Role removed successfully.");
			refresh();
		},
		onError
	});
	const createQuickReplyAction = useMutation({
		mutationFn: (input) => createQuickReplyFn({ data: input }),
		onSuccess: () => {
			toast.success("Quick reply created.");
			setNewQuickReplyTitle("");
			setNewQuickReplyContent("");
			setShowQuickReplyDialog(false);
			refresh();
		},
		onError
	});
	const updateQuickReplyAction = useMutation({
		mutationFn: (input) => updateQuickReplyFn({ data: input }),
		onSuccess: () => {
			toast.success("Quick reply updated.");
			setEditingQuickReply(null);
			refresh();
		},
		onError
	});
	const deleteQuickReplyAction = useMutation({
		mutationFn: (id) => deleteQuickReplyFn({ data: { id } }),
		onSuccess: () => {
			toast.success("Quick reply deleted.");
			refresh();
		},
		onError
	});
	const broadcastAction = useMutation({
		mutationFn: (data) => broadcastNotification({ data }),
		onSuccess: (result) => {
			if (result.success) {
				toast.success(`Broadcast sent to ${result.sent_count} users`);
				setShowBroadcastDialog(false);
				setBroadcastTitle("");
				setBroadcastMessage("");
				refresh();
			} else toast.error(result.error || "Failed to send broadcast");
		},
		onError
	});
	const maintenanceModeAction = useMutation({
		mutationFn: (data) => toggleMaintenanceMode({ data }),
		onSuccess: (result) => {
			toast.success(`Maintenance mode ${result.enabled ? "enabled" : "disabled"}`);
			setShowMaintenanceDialog(false);
			refresh();
		},
		onError
	});
	const dashboard = useQuery({
		queryKey: ["admin-dashboard"],
		enabled: isAdmin,
		queryFn: () => fetchDashboard({})
	});
	const providers = useQuery({
		queryKey: ["offer-providers"],
		enabled: isAdmin,
		queryFn: () => fetchProviders({})
	});
	const connectAdblue = useMutation({
		mutationFn: () => saveProvider({ data: {
			name: "AdBlueMedia",
			slug: "adbluemedia",
			providerType: "cpa",
			enabled: true,
			syncConfig: { user_id: "788820" },
			defaultRevenueShare: .6
		} }),
		onSuccess: () => {
			toast.success("AdBlueMedia connected.");
			queryClient.invalidateQueries({ queryKey: ["offer-providers"] });
		},
		onError
	});
	const syncAction = useMutation({
		mutationFn: (providerId) => runSync({ data: { providerId } }),
		onSuccess: (result) => {
			toast.success(`Synced ${result.provider}: ${result.upserted} offers imported, ${result.deactivated} deactivated.`);
			refresh();
		},
		onError
	});
	const hasAdminAccess = roles.length > 0 && roles.some((r) => r === "admin" || r === "finance" || r === "support");
	const canSeeTab = (tabKey) => {
		if (roles.includes("admin")) return true;
		if (roles.includes("finance")) return [
			"withdrawals",
			"claims",
			"tickets"
		].includes(tabKey);
		if (roles.includes("support")) return tabKey === "tickets";
		return false;
	};
	const tabSections = {
		operations: [
			["withdrawals", "Payouts"],
			["claims", "Claims"],
			["tickets", "Tickets"],
			["users", "Users"],
			["audit", "Audit Log"],
			["staff", "Staff"]
		],
		content: [
			["offers", "Offers"],
			["quests", "Quests"],
			["tasks", "Tasks"],
			["banners", "Banners"],
			["onboarding", "Onboarding"]
		],
		integrations: [
			["providers", "Networks"],
			["sdk-offerwalls", "SDK Offerwalls"],
			["automation", "Automation"],
			["offer-feed", "Offer Feed"]
		],
		marketplace: [
			["campaigns", "Campaigns ★"],
			["proof-reviews", "Proof Reviews ★"],
			["advertisers", "Advertisers ★"]
		]
	};
	const tabBadges = {
		withdrawals: withdrawals.data?.pendingCount ?? 0,
		claims: claims.data?.pendingCount ?? 0,
		tickets: tickets.data?.openCount ?? 0
	};
	const visibleTabsInSection = tabSections[section].filter(([key]) => canSeeTab(key));
	const visibleSections = [
		"operations",
		"content",
		"integrations",
		"marketplace"
	].filter((sectionKey) => tabSections[sectionKey].some(([tabKey]) => canSeeTab(tabKey)));
	(0, import_react.useEffect)(() => {
		if (!hasAdminAccess) return;
		if (visibleTabsInSection.length > 0 && !canSeeTab(tab)) {
			const firstVisibleTab = visibleTabsInSection[0][0];
			setTab(firstVisibleTab);
		}
		if (!tabSections[section].map(([key]) => key).includes(tab)) {
			for (const [sectionKey, tabs] of Object.entries(tabSections)) if (tabs.some(([key]) => key === tab)) {
				setSection(sectionKey);
				break;
			}
		}
	}, [
		hasAdminAccess,
		tab,
		section,
		visibleTabsInSection,
		canSeeTab,
		tabSections
	]);
	if (!hasAdminAccess) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		subtitle: "Admin",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-8 text-center text-sm text-muted-foreground",
			children: "You don't have access to the admin panel."
		})
	});
	const totalData = totals.data?.totals;
	const note = (id) => notes[id] ?? "";
	const setNote = (id, value) => setNotes((prev) => ({
		...prev,
		[id]: value
	}));
	const reference = (id) => references[id] ?? "";
	const setReference = (id, value) => setReferences((prev) => ({
		...prev,
		[id]: value
	}));
	const transactionHash = (id) => transactionHashes[id] ?? "";
	const setTransactionHash = (id, value) => setTransactionHashes((prev) => ({
		...prev,
		[id]: value
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		subtitle: "Admin",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 text-2xl",
				children: "Admin panel"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid grid-cols-2 gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Users",
						value: String(totalData?.users ?? 0)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Flagged",
						value: String(totalData?.flagged ?? 0)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Wallet liability",
						value: formatMoney(totalData?.liability)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Lifetime paid out",
						value: formatMoney(totalData?.withdrawn)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 flex gap-2 overflow-x-auto pb-1",
				children: visibleSections.map((sectionKey) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: section === sectionKey ? "default" : "outline",
					onClick: () => {
						setSection(sectionKey);
						const firstTab = tabSections[sectionKey].find(([key]) => canSeeTab(key));
						if (firstTab) setTab(firstTab[0]);
					},
					children: sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)
				}, sectionKey))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex gap-2 overflow-x-auto pb-1",
				children: visibleTabsInSection.map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: tab === key ? "jade" : "outline",
					onClick: () => setTab(key),
					"data-testid": key === "onboarding" ? "admin-tab-onboarding" : `admin-tab-${key}`,
					className: "relative",
					children: [label, tabBadges[key] > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "destructive",
						className: "ml-2 px-1.5 py-0 text-[10px]",
						children: tabBadges[key]
					})]
				}, key))
			}),
			tab === "dashboard" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Overview" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "outline",
						onClick: () => setShowBroadcastDialog(true),
						children: "📢 Send Broadcast"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: maintenanceStatus.data?.enabled ? "destructive" : "outline",
						onClick: () => setShowMaintenanceDialog(true),
						children: maintenanceStatus.data?.enabled ? "🔧 Maintenance ON" : "⚙️ Maintenance Mode"
					})]
				}),
				dashboard.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Loading…"
				}) : dashboard.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Total users",
									value: String(dashboard.data.users.total)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Active (30d)",
									value: String(dashboard.data.users.active)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Total earned",
									value: formatMoney(dashboard.data.money.lifetimeEarned)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Total withdrawn",
									value: formatMoney(dashboard.data.money.lifetimeWithdrawn)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Pending payouts",
									value: `${dashboard.data.money.pendingWithdrawalCount} · ${formatMoney(dashboard.data.money.pendingWithdrawalAmount)}`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Wallet liability",
									value: formatMoney(dashboard.data.money.walletLiability)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Offer completions",
									value: String(dashboard.data.offers.completions)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Network revenue",
									value: formatMoney(dashboard.data.money.networkRevenue)
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "surface-card p-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: "Offers"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									dashboard.data.offers.total,
									" total · ",
									dashboard.data.offers.manual,
									" manual ·",
									" ",
									dashboard.data.offers.network,
									" network · ",
									dashboard.data.offers.active,
									" active"
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "surface-card p-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: "Referrals"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									dashboard.data.referrals.total,
									" total · ",
									dashboard.data.referrals.credited,
									" ",
									"credited · ",
									formatMoney(dashboard.data.referrals.paid),
									" paid"
								]
							})]
						}),
						dashboard.data.providers.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "surface-card p-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: "Networks"
							}), dashboard.data.providers.map((provider) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									provider.name,
									" · ",
									provider.enabled ? "enabled" : "disabled",
									" ·",
									" ",
									provider.syncStatus,
									" ·",
									" ",
									provider.lastSyncedAt ? `synced ${formatDateTime(provider.lastSyncedAt)}` : "never synced"
								]
							}, provider.id))]
						})
					]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Analytics" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: dashboardDays === 7 ? "jade" : "outline",
										onClick: () => setDashboardDays(7),
										children: "7 days"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: dashboardDays === 30 ? "jade" : "outline",
										onClick: () => setDashboardDays(30),
										children: "30 days"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: dashboardDays === 90 ? "jade" : "outline",
										onClick: () => setDashboardDays(90),
										children: "90 days"
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 surface-card p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-semibold",
								children: "Daily Signups (Google vs Email)"
							}), dashboardSignups.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs text-muted-foreground",
								children: "Loading..."
							}) : dashboardSignups.data && dashboardSignups.data.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-4 text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "size-3 bg-blue-500 rounded" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Google" })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "size-3 bg-green-500 rounded" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Email" })]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-1",
									children: dashboardSignups.data.map((day) => {
										const total = day.google_signups + day.email_signups;
										const googlePct = total > 0 ? day.google_signups / total * 100 : 0;
										const emailPct = total > 0 ? day.email_signups / total * 100 : 0;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 text-xs",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "w-20 text-muted-foreground",
													children: new Date(day.date).toLocaleDateString("en-US", {
														month: "short",
														day: "numeric"
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex-1 flex h-6 bg-muted/20 rounded overflow-hidden",
													children: [googlePct > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "bg-blue-500 flex items-center justify-center text-[10px] text-white font-medium",
														style: { width: `${googlePct}%` },
														title: `Google: ${day.google_signups}`,
														children: day.google_signups > 0 && day.google_signups
													}), emailPct > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "bg-green-500 flex items-center justify-center text-[10px] text-white font-medium",
														style: { width: `${emailPct}%` },
														title: `Email: ${day.email_signups}`,
														children: day.email_signups > 0 && day.email_signups
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "w-10 text-right font-medium",
													children: total
												})
											]
										}, day.date);
									})
								})]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs text-muted-foreground",
								children: "No signup data available"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 surface-card p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-semibold",
								children: "Active Earners"
							}), dashboardActiveUsers.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs text-muted-foreground",
								children: "Loading..."
							}) : dashboardActiveUsers.data && dashboardActiveUsers.data.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 space-y-1",
								children: (() => {
									const maxDau = Math.max(...dashboardActiveUsers.data.map((d) => d.dau));
									return dashboardActiveUsers.data.map((day) => {
										const widthPct = maxDau > 0 ? day.dau / maxDau * 100 : 0;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 text-xs",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "w-20 text-muted-foreground",
												children: new Date(day.date).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric"
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "flex-1 flex h-6 bg-muted/20 rounded overflow-hidden",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "bg-purple-500 flex items-center justify-center text-[10px] text-white font-medium",
													style: { width: `${widthPct}%` },
													children: day.dau > 0 && day.dau
												})
											})]
										}, day.date);
									});
								})()
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs text-muted-foreground",
								children: "No activity data available"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 surface-card p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-sm font-semibold",
									children: "User Earnings vs Withdrawals"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground mt-1",
									children: "Shows user rewards, not network revenue."
								}),
								dashboardRevenuePayout.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-xs text-muted-foreground",
									children: "Loading..."
								}) : dashboardRevenuePayout.data && dashboardRevenuePayout.data.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex gap-4 text-xs",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "size-3 bg-emerald-500 rounded" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "User earnings" })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "size-3 bg-rose-500 rounded" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Withdrawals" })]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "space-y-1",
										children: (() => {
											const maxValue = Math.max(...dashboardRevenuePayout.data.flatMap((d) => [d.revenue || 0, d.payout || 0]));
											return dashboardRevenuePayout.data.map((day) => {
												const revenuePct = maxValue > 0 ? (day.revenue || 0) / maxValue * 100 : 0;
												const payoutPct = maxValue > 0 ? (day.payout || 0) / maxValue * 100 : 0;
												return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-0.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-2 text-xs",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "w-20 text-muted-foreground",
																children: new Date(day.date).toLocaleDateString("en-US", {
																	month: "short",
																	day: "numeric"
																})
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "flex-1 flex h-4 bg-muted/20 rounded overflow-hidden",
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																	className: "bg-emerald-500",
																	style: { width: `${revenuePct}%` },
																	title: `User earnings: ${formatMoney(day.revenue || 0)}`
																})
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "w-16 text-right text-[10px] text-emerald-600 font-medium",
																children: formatMoney(day.revenue || 0)
															})
														]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-2 text-xs",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-20" }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "flex-1 flex h-4 bg-muted/20 rounded overflow-hidden",
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																	className: "bg-rose-500",
																	style: { width: `${payoutPct}%` },
																	title: `Withdrawals: ${formatMoney(day.payout || 0)}`
																})
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "w-16 text-right text-[10px] text-rose-600 font-medium",
																children: formatMoney(day.payout || 0)
															})
														]
													})]
												}, day.date);
											});
										})()
									})]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-xs text-muted-foreground",
									children: "No revenue/payout data available"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 surface-card p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-semibold",
								children: "Top 10 Offers by Completions"
							}), dashboardTopOffers.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs text-muted-foreground",
								children: "Loading..."
							}) : dashboardTopOffers.data && dashboardTopOffers.data.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 overflow-x-auto",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
									className: "w-full text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "border-b",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "text-left p-2",
												children: "Offer"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "text-right p-2",
												children: "Completions"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "text-right p-2",
												children: "Approval %"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "text-right p-2",
												children: "Total Payout"
											})
										]
									}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: dashboardTopOffers.data.map((offer, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "border-b border-muted/30",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "p-2",
												children: offer.offer_name || "Unknown Offer"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "text-right p-2 font-medium",
												children: offer.completions
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "text-right p-2",
												children: offer.approved > 0 ? `${Math.round(offer.approved / offer.completions * 100)}%` : "0%"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "text-right p-2 font-medium text-emerald-600",
												children: formatMoney(offer.total_payout || 0)
											})
										]
									}, offer.offer_id || idx)) })]
								})
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs text-muted-foreground",
								children: "No offer data available"
							})]
						})
					]
				})
			] }),
			tab === "offers" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Offer management" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OffersManager, {})] }),
			tab === "tasks" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TasksManager, {}),
			tab === "quests" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Starter Quests" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuestsManager, {})] }),
			tab === "banners" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Banners" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BannersManager, {})] }),
			tab === "onboarding" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Premium onboarding" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PremiumOnboardingManager, {})] }),
			tab === "withdrawals" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Withdrawal requests" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: withdrawalStatus === "all" ? "jade" : "outline",
									onClick: () => {
										setWithdrawalStatus("all");
										setWithdrawalPage(1);
									},
									children: "All"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: withdrawalStatus === "pending" ? "jade" : "outline",
									onClick: () => {
										setWithdrawalStatus("pending");
										setWithdrawalPage(1);
									},
									children: "Pending"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: withdrawalStatus === "approved" ? "jade" : "outline",
									onClick: () => {
										setWithdrawalStatus("approved");
										setWithdrawalPage(1);
									},
									children: "Approved"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: withdrawalStatus === "rejected" ? "jade" : "outline",
									onClick: () => {
										setWithdrawalStatus("rejected");
										setWithdrawalPage(1);
									},
									children: "Rejected"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select$1, {
									value: withdrawalMethodFilter,
									onValueChange: setWithdrawalMethodFilter,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										className: "w-[180px]",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "All methods" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "all",
											children: "All methods"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "paypal",
											children: "PayPal"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "binance_pay",
											children: "Binance Pay"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "crypto",
											children: "Crypto"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "bank_transfer",
											children: "Bank Transfer"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "gift_card",
											children: "Gift Card"
										})
									] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									placeholder: "Min amount",
									value: withdrawalMinAmount,
									onChange: (e) => setWithdrawalMinAmount(e.target.value),
									className: "w-[120px]"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									placeholder: "Max amount",
									value: withdrawalMaxAmount,
									onChange: (e) => setWithdrawalMaxAmount(e.target.value),
									className: "w-[120px]"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "outline",
									onClick: () => {
										setWithdrawalMethodFilter("all");
										setWithdrawalMinAmount("");
										setWithdrawalMaxAmount("");
									},
									children: "Clear filters"
								})
							]
						}),
						selectedWithdrawals.size > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 rounded-lg bg-primary/10 p-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-sm font-semibold",
									children: [selectedWithdrawals.size, " selected"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "jade",
									onClick: () => {
										const items = withdrawals.data?.withdrawals.filter((w) => selectedWithdrawals.has(w.id) && w.status === "pending" && !isCryptoMethod(w.method_type) && w.method_type !== "binance_pay") || [];
										if (items.length === 0) {
											toast.error("Selected items require transaction hash or reference");
											return;
										}
										Promise.all(items.map((item) => withdrawalAction.mutateAsync({
											id: item.id,
											status: "approved",
											note: note(item.id),
											referenceId: reference(item.id),
											transactionHash: transactionHash(item.id)
										}))).then(() => {
											setSelectedWithdrawals(/* @__PURE__ */ new Set());
											toast.success(`Approved ${items.length} withdrawals`);
										});
									},
									children: "Bulk Approve"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "outline",
									onClick: () => {
										const items = withdrawals.data?.withdrawals.filter((w) => selectedWithdrawals.has(w.id) && w.status === "pending") || [];
										Promise.all(items.map((item) => withdrawalAction.mutateAsync({
											id: item.id,
											status: "rejected",
											note: note(item.id) || "Bulk rejection"
										}))).then(() => {
											setSelectedWithdrawals(/* @__PURE__ */ new Set());
											toast.success(`Rejected ${items.length} withdrawals`);
										});
									},
									children: "Bulk Reject"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "outline",
									onClick: () => setSelectedWithdrawals(/* @__PURE__ */ new Set()),
									children: "Clear selection"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex gap-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								variant: "outline",
								onClick: async () => {
									try {
										downloadCsv(await exportPayouts({ data: {
											status: withdrawalStatus === "all" ? void 0 : withdrawalStatus,
											days: 90
										} }), `payouts-export-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
										toast.success("Payouts exported");
									} catch (err) {
										toast.error(err.message);
									}
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "mr-1 size-3" }), "Export CSV"]
							})
						})
					]
				}),
				withdrawals.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-muted-foreground",
					children: "Loading…"
				}) : !withdrawals.data?.withdrawals.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: LifeBuoy,
					title: "No withdrawals",
					description: "Requests appear here for manual review."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-2",
					children: withdrawals.data.withdrawals.filter((w) => {
						if (withdrawalMethodFilter !== "all" && w.method_type !== withdrawalMethodFilter) return false;
						if (withdrawalMinAmount && w.amount < Number(withdrawalMinAmount)) return false;
						if (withdrawalMaxAmount && w.amount > Number(withdrawalMaxAmount)) return false;
						return true;
					}).map((request) => {
						const isPending24h = request.status === "pending" && (/* @__PURE__ */ new Date()).getTime() - new Date(request.created_at).getTime() > 864e5;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: `surface-card p-3 ${isPending24h ? "border-2 border-amber-500" : ""}`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [request.status === "pending" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
									checked: selectedWithdrawals.has(request.id),
									onCheckedChange: (checked) => {
										const newSet = new Set(selectedWithdrawals);
										if (checked) newSet.add(request.id);
										else newSet.delete(request.id);
										setSelectedWithdrawals(newSet);
									}
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-amount",
													children: formatMoney(request.amount)
												}), isPending24h && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
													variant: "destructive",
													className: "text-[10px]",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "mr-1 size-3" }), "24h+"]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "rounded-full bg-background-alt px-2.5 py-1 text-[11px] font-semibold capitalize",
												children: request.status
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-xs text-muted-foreground",
											children: [
												request.user?.name || request.user?.email || "Unknown user",
												" ·",
												" ",
												formatDateTime(request.created_at)
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-2 flex flex-wrap items-center gap-1.5 text-xs",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary",
													children: payoutMethodLabel(request.method_type)
												}),
												payoutSnapshotLines(request.payout_details_snapshot).map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "rounded-full bg-background-alt px-2 py-0.5 text-muted-foreground",
													children: line
												}, line)),
												request.hasDuplicateBinancePay && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 font-semibold text-amber-900 dark:text-amber-100",
													children: "⚠️ Duplicate Pay ID"
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FraudSignals, { withdrawalId: request.id }),
										request.status === "pending" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-2 space-y-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													placeholder: "Optional note for the user",
													value: note(request.id),
													onChange: (event) => setNote(request.id, event.target.value),
													maxLength: 300
												}),
												isCryptoMethod(request.method_type) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													placeholder: "Transaction hash (required for crypto) *",
													value: transactionHash(request.id),
													onChange: (event) => setTransactionHash(request.id, event.target.value),
													maxLength: 200,
													required: true,
													"data-testid": `admin-withdrawal-txhash-${request.id}`,
													className: "font-mono text-xs"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-muted-foreground",
													children: "⚠️ Transaction hash is required for crypto withdrawals"
												})] }) : request.method_type === "binance_pay" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													placeholder: "Binance Pay order ID (required) *",
													value: transactionHash(request.id),
													onChange: (event) => setTransactionHash(request.id, event.target.value),
													maxLength: 200,
													required: true,
													"data-testid": `admin-withdrawal-txhash-${request.id}`,
													className: "font-mono text-xs"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-muted-foreground",
													children: "⚠️ Binance Pay order/transaction ID is required"
												})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													placeholder: "Fulfilment reference (payout id / gift-card order)",
													value: reference(request.id),
													onChange: (event) => setReference(request.id, event.target.value),
													maxLength: 200,
													"data-testid": `admin-withdrawal-reference-${request.id}`
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														size: "sm",
														variant: "jade",
														disabled: withdrawalAction.isPending,
														onClick: () => withdrawalAction.mutate({
															id: request.id,
															status: "approved",
															note: note(request.id),
															referenceId: reference(request.id),
															transactionHash: transactionHash(request.id)
														}),
														children: "Approve & pay"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														size: "sm",
														variant: "outline",
														disabled: withdrawalAction.isPending,
														onClick: () => withdrawalAction.mutate({
															id: request.id,
															status: "rejected",
															note: note(request.id)
														}),
														children: "Reject"
													})]
												})
											]
										}),
										request.admin_note && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-2 text-xs text-muted-foreground",
											children: ["Note: ", request.admin_note]
										}),
										request.reference_id && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-1 text-xs text-muted-foreground",
											children: ["Ref: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-mono",
												children: request.reference_id
											})]
										}),
										request.transaction_hash && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-1 text-xs",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-muted-foreground",
													children: "Txid: "
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-mono",
													children: request.transaction_hash
												}),
												getExplorerUrl(request.method_type, request.transaction_hash) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [" · ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
													href: getExplorerUrl(request.method_type, request.transaction_hash),
													target: "_blank",
													rel: "noopener noreferrer",
													className: "text-primary hover:underline",
													children: "View on explorer ↗"
												})] })
											]
										}),
										request.network_fee && Number(request.network_fee) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-1 text-xs text-muted-foreground",
											children: [
												"Network fee: ",
												formatMoney(request.network_fee),
												" (User receives:",
												" ",
												formatMoney(request.amount - Number(request.network_fee)),
												")"
											]
										})
									]
								})]
							})
						}, request.id);
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground",
						children: [
							"Page ",
							withdrawals.data.page,
							" of ",
							withdrawals.data.totalPages,
							" (",
							withdrawals.data.total,
							" total)"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "outline",
							disabled: withdrawalPage === 1,
							onClick: () => setWithdrawalPage((p) => Math.max(1, p - 1)),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" }), " Prev"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "outline",
							disabled: withdrawalPage >= withdrawals.data.totalPages,
							onClick: () => setWithdrawalPage((p) => p + 1),
							children: ["Next ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })]
						})]
					})]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Wallet Adjustment Requests" }), adjustmentRequests.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-sm text-muted-foreground",
						children: "Loading..."
					}) : !adjustmentRequests.data?.requests.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-sm text-muted-foreground",
						children: "No pending adjustment requests."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-2",
						children: adjustmentRequests.data.requests.map((req) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "surface-card p-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-amount",
										children: formatMoney(req.amount)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "rounded-full bg-background-alt px-2.5 py-1 text-[11px] font-semibold capitalize",
										children: req.status
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: [
										"User: ",
										req.user?.name || req.user?.email || "Unknown",
										" · Requested by: ",
										req.requester?.email || "Unknown admin"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-xs text-muted-foreground",
									children: ["Reason: ", req.reason]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: ["Created: ", formatDateTime(req.created_at)]
								}),
								req.status === "pending" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										variant: "jade",
										disabled: approveAdjustmentAction.isPending || rejectAdjustmentAction.isPending,
										onClick: () => approveAdjustmentAction.mutate(req.id),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, { className: "mr-1 size-3" }), "Approve & Apply"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										variant: "outline",
										disabled: approveAdjustmentAction.isPending || rejectAdjustmentAction.isPending,
										onClick: () => rejectAdjustmentAction.mutate(req.id),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "mr-1 size-3" }), "Reject"]
									})]
								}),
								req.status === "approved" && req.approvedBy && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-xs text-muted-foreground",
									children: [
										"✓ Approved by: ",
										req.approvedBy.email,
										" at ",
										formatDateTime(req.approvedAt)
									]
								}),
								req.status === "rejected" && req.approvedBy && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-xs text-muted-foreground",
									children: [
										"✗ Rejected by: ",
										req.approvedBy.email,
										" at ",
										formatDateTime(req.approvedAt)
									]
								})
							]
						}, req.id))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground",
							children: [
								"Page ",
								adjustmentRequests.data.page,
								" of ",
								adjustmentRequests.data.totalPages,
								" (",
								adjustmentRequests.data.total,
								" total)"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								variant: "outline",
								disabled: adjustmentRequestsPage === 1,
								onClick: () => setAdjustmentRequestsPage((p) => Math.max(1, p - 1)),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" }), " Prev"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								variant: "outline",
								disabled: adjustmentRequestsPage >= adjustmentRequests.data.totalPages,
								onClick: () => setAdjustmentRequestsPage((p) => p + 1),
								children: ["Next ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })]
							})]
						})]
					})] })]
				})
			] }),
			tab === "claims" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Offer claims" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: claimStatus === "all" ? "jade" : "outline",
							onClick: () => {
								setClaimStatus("all");
								setClaimPage(1);
							},
							children: "All"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: claimStatus === "pending" ? "jade" : "outline",
							onClick: () => {
								setClaimStatus("pending");
								setClaimPage(1);
							},
							children: "Pending"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: claimStatus === "approved" ? "jade" : "outline",
							onClick: () => {
								setClaimStatus("approved");
								setClaimPage(1);
							},
							children: "Approved"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: claimStatus === "rejected" ? "jade" : "outline",
							onClick: () => {
								setClaimStatus("rejected");
								setClaimPage(1);
							},
							children: "Rejected"
						})
					]
				}),
				claims.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-muted-foreground",
					children: "Loading…"
				}) : !claims.data?.claims.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: LifeBuoy,
					title: "No offer claims",
					description: "User offer submissions land here."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-2",
					children: claims.data.claims.map((claim) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "surface-card p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-semibold",
									children: claim.offers?.title ?? "Offer"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded-full bg-background-alt px-2.5 py-1 text-[11px] font-semibold capitalize",
									children: claim.status
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									claim.user?.name || claim.user?.email || "Unknown",
									" ·",
									" ",
									formatMoney(claim.reward_amount),
									" · ",
									formatDateTime(claim.created_at)
								]
							}),
							claim.proof_url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClaimProofPreview, { path: claim.proof_url }),
							claim.status === "pending" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "jade",
									disabled: claimAction.isPending,
									onClick: () => claimAction.mutate({
										id: claim.id,
										status: "approved"
									}),
									children: "Approve"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "outline",
									disabled: claimAction.isPending,
									onClick: () => claimAction.mutate({
										id: claim.id,
										status: "rejected"
									}),
									children: "Reject"
								})]
							})
						]
					}, claim.id))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground",
						children: [
							"Page ",
							claims.data.page,
							" of ",
							claims.data.totalPages,
							" (",
							claims.data.total,
							" total)"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "outline",
							disabled: claimPage === 1,
							onClick: () => setClaimPage((p) => Math.max(1, p - 1)),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" }), " Prev"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "outline",
							disabled: claimPage >= claims.data.totalPages,
							onClick: () => setClaimPage((p) => p + 1),
							children: ["Next ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })]
						})]
					})]
				})] })
			] }),
			tab === "tickets" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Support tickets" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: ticketStatus === "all" ? "jade" : "outline",
							onClick: () => {
								setTicketStatus("all");
								setTicketPage(1);
							},
							children: "All"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: ticketStatus === "open" ? "jade" : "outline",
							onClick: () => {
								setTicketStatus("open");
								setTicketPage(1);
							},
							children: "Open"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: ticketStatus === "in_progress" ? "jade" : "outline",
							onClick: () => {
								setTicketStatus("in_progress");
								setTicketPage(1);
							},
							children: "In Progress"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: ticketStatus === "resolved" ? "jade" : "outline",
							onClick: () => {
								setTicketStatus("resolved");
								setTicketPage(1);
							},
							children: "Resolved"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 rounded-lg bg-background-alt/50 p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-semibold",
							children: "Quick Replies"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "outline",
							onClick: () => {
								setEditingQuickReply(null);
								setNewQuickReplyTitle("");
								setNewQuickReplyContent("");
								setShowQuickReplyDialog(true);
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 size-3" }), "New"]
						})]
					}), quickRepliesQuery.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs text-muted-foreground",
						children: "Loading quick replies..."
					}) : !quickReplies.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs text-muted-foreground",
						children: "No quick replies yet. Create one to speed up responses."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex flex-wrap gap-1.5",
						children: quickReplies.map((qr) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "group flex items-center gap-1 rounded-full bg-background px-2 py-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs",
									children: qr.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "ghost",
									className: "size-5 p-0 opacity-0 transition-opacity group-hover:opacity-100",
									onClick: () => {
										setEditingQuickReply(qr);
										setNewQuickReplyTitle(qr.title);
										setNewQuickReplyContent(qr.content);
										setShowQuickReplyDialog(true);
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquarePen, { className: "size-3" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "ghost",
									className: "size-5 p-0 opacity-0 transition-opacity group-hover:opacity-100",
									onClick: () => {
										if (confirm(`Delete quick reply "${qr.title}"?`)) deleteQuickReplyAction.mutate(qr.id);
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3" })
								})
							]
						}, qr.id))
					})]
				}),
				tickets.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-muted-foreground",
					children: "Loading…"
				}) : !tickets.data?.tickets.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: LifeBuoy,
					title: "No tickets",
					description: "User messages appear here."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-2",
					children: tickets.data.tickets.map((ticket) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "surface-card p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate font-semibold",
									children: ticket.subject
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded-full bg-background-alt px-2.5 py-1 text-[11px] font-semibold capitalize",
									children: ticket.status
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-xs text-muted-foreground",
								children: [
									ticket.user?.email ?? "Unknown",
									" · ",
									formatDateTime(ticket.created_at)
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm",
								children: ticket.description
							}),
							ticket.admin_response ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 rounded-xl bg-background-alt p-2 text-sm",
								children: ticket.admin_response
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 space-y-2",
								children: [
									quickReplies.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs text-muted-foreground",
											children: "Quick:"
										}), quickReplies.map((qr) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "ghost",
											className: "h-6 px-2 text-[11px]",
											onClick: () => {
												const currentNote = note(ticket.id);
												setNote(ticket.id, currentNote ? `${currentNote}\n\n${qr.content}` : qr.content);
											},
											children: qr.title
										}, qr.id))]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
										rows: 3,
										maxLength: 1e3,
										placeholder: "Write a reply",
										value: note(ticket.id),
										onChange: (event) => setNote(ticket.id, event.target.value)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "min-w-[150px]",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select$1, {
												value: ticketReplyStatus[ticket.id] || "open",
												onValueChange: (value) => setTicketReplyStatus((prev) => ({
													...prev,
													[ticket.id]: value
												})),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
													className: "h-8",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "open",
														children: "Keep Open"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "in_progress",
														children: "Mark In Progress"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "resolved",
														children: "Mark Resolved"
													})
												] })]
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "jade",
											disabled: note(ticket.id).trim().length < 2 || ticketAction.isPending,
											onClick: () => ticketAction.mutate({
												id: ticket.id,
												response: note(ticket.id).trim(),
												status: ticketReplyStatus[ticket.id] || "open"
											}),
											children: "Send & Update Status"
										})]
									})
								]
							})
						]
					}, ticket.id))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground",
						children: [
							"Page ",
							tickets.data.page,
							" of ",
							tickets.data.totalPages,
							" (",
							tickets.data.total,
							" total)"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "outline",
							disabled: ticketPage === 1,
							onClick: () => setTicketPage((p) => Math.max(1, p - 1)),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" }), " Prev"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "outline",
							disabled: ticketPage >= tickets.data.totalPages,
							onClick: () => setTicketPage((p) => p + 1),
							children: ["Next ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })]
						})]
					})]
				})] })
			] }),
			showQuickReplyDialog && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: showQuickReplyDialog,
				onOpenChange: setShowQuickReplyDialog,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: editingQuickReply ? "Edit Quick Reply" : "New Quick Reply" }) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-sm font-semibold",
							children: "Title (short name)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							placeholder: "e.g. 'Thanks', 'Investigating', 'Resolved'",
							value: newQuickReplyTitle,
							onChange: (e) => setNewQuickReplyTitle(e.target.value),
							maxLength: 50
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-sm font-semibold",
								children: "Reply Content"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								placeholder: "The message that will be inserted...",
								value: newQuickReplyContent,
								onChange: (e) => setNewQuickReplyContent(e.target.value),
								rows: 4,
								maxLength: 500
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-xs text-muted-foreground",
								children: [newQuickReplyContent.length, "/500 characters"]
							})
						] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => setShowQuickReplyDialog(false),
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "jade",
						onClick: () => {
							if (editingQuickReply) updateQuickReplyAction.mutate({
								id: editingQuickReply.id,
								title: newQuickReplyTitle.trim(),
								content: newQuickReplyContent.trim()
							});
							else createQuickReplyAction.mutate({
								title: newQuickReplyTitle.trim(),
								content: newQuickReplyContent.trim()
							});
						},
						disabled: newQuickReplyTitle.trim().length < 2 || newQuickReplyContent.trim().length < 5 || createQuickReplyAction.isPending || updateQuickReplyAction.isPending,
						children: editingQuickReply ? "Update" : "Create"
					})] })
				] })
			}),
			tab === "users" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Users" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 space-y-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									placeholder: "Search email, name, referral code, device ID...",
									value: userSearch,
									onChange: (e) => {
										setUserSearch(e.target.value);
										setUserPage(1);
									},
									className: "pl-9"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: userFlaggedOnly ? "destructive" : "outline",
								onClick: () => {
									setUserFlaggedOnly(!userFlaggedOnly);
									if (!userFlaggedOnly) setUserSuspiciousOnly(false);
									setUserPage(1);
								},
								children: userFlaggedOnly ? "Show all" : "Flagged only"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								variant: userSuspiciousOnly ? "amber" : "outline",
								onClick: () => {
									setUserSuspiciousOnly(!userSuspiciousOnly);
									if (!userSuspiciousOnly) setUserFlaggedOnly(false);
									setUserPage(1);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "mr-1 size-3" }), userSuspiciousOnly ? "Show all" : "Suspicious"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								variant: "outline",
								onClick: async () => {
									try {
										downloadCsv(await exportUsers({ data: {
											flaggedOnly: userFlaggedOnly,
											activeOnly: userSuspiciousOnly
										} }), `users-export-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
										toast.success("Users exported");
									} catch (err) {
										toast.error(err.message);
									}
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "mr-1 size-3" }), "Export CSV"]
							})
						]
					})
				}),
				users.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-muted-foreground",
					children: "Loading…"
				}) : !users.data?.users.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: LifeBuoy,
					title: "No users found",
					description: "Try adjusting your search or filters."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-2",
					children: users.data.users.map((user) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "surface-card p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setSelectedUserId(user.id),
									className: "truncate font-semibold text-left hover:underline cursor-pointer",
									children: user.name || user.email || user.id
								}), user.is_flagged && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground",
									children: "Flagged"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									user.email,
									" · ",
									user.referral_code,
									user.device_id && user.device_id !== "" && user.device_id !== "server" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "ml-2 text-[10px]",
										children: [
											"Device: ",
											user.device_id.substring(0, 8),
											"..."
										]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-xs",
								children: [
									"Balance ",
									formatMoney(user.wallet_balance),
									" · Held ",
									formatMoney(user.held_balance),
									" ",
									"· Earned ",
									formatMoney(user.lifetime_earned)
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex flex-wrap gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "outline",
										onClick: () => flagAction.mutate({
											userId: user.id,
											flagged: !user.is_flagged
										}),
										children: user.is_flagged ? "Unflag" : "Flag"
									}),
									user.device_id && user.device_id !== "" && user.device_id !== "server" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										variant: "outline",
										onClick: () => setSelectedDeviceId(user.device_id),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "mr-1 size-3" }), "Same device"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "gold",
										onClick: () => setAdjustingUser({
											id: user.id,
											name: user.name || "",
											email: user.email
										}),
										children: "Adjust wallet"
									})
								]
							})
						]
					}, user.id))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground",
						children: [
							"Page ",
							users.data.page,
							" of ",
							users.data.totalPages,
							" (",
							users.data.total,
							" total)"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "outline",
							disabled: userPage === 1,
							onClick: () => setUserPage((p) => Math.max(1, p - 1)),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" }), " Prev"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "outline",
							disabled: userPage >= users.data.totalPages,
							onClick: () => setUserPage((p) => p + 1),
							children: ["Next ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })]
						})]
					})]
				})] })
			] }),
			tab === "sdk-offerwalls" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SdkOfferwallManager, {}),
			tab === "campaigns" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarketplaceSettingsPanel, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-6" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FinancialOverview, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-6" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CampaignApprovals, {})
			] }),
			tab === "proof-reviews" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProofReviews, {}),
			tab === "advertisers" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdvertisersList, {}),
			tab === "automation" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AutomationPanel, {}),
			tab === "offer-feed" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Offer Feed Automation" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfferFeedAutomationPanel, {})] }),
			tab === "providers" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Offer networks" }),
				providers.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Loading…"
				}) : !providers.data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: Network,
					title: "No networks connected",
					description: "Connect AdBlueMedia to import network offers into Featured Offers."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2",
					children: providers.data.map((provider) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "surface-card p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-semibold",
									children: provider.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded-full bg-background-alt px-2.5 py-1 text-[11px] font-semibold capitalize",
									children: provider.sync_status
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									provider.slug,
									" · ",
									provider.enabled ? "Enabled" : "Disabled",
									" · revenue share",
									" ",
									Math.round(provider.default_revenue_share * 100),
									"% ·",
									" ",
									provider.last_synced_at ? `synced ${formatDateTime(provider.last_synced_at)}` : "never synced"
								]
							}),
							provider.sync_error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-destructive",
								children: provider.sync_error
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 flex gap-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "jade",
									disabled: syncAction.isPending,
									onClick: () => syncAction.mutate(provider.id),
									children: syncAction.isPending && syncAction.variables === provider.id ? "Syncing…" : "Sync now"
								})
							})
						]
					}, provider.id))
				}),
				!providers.data?.some((p) => p.slug === "adbluemedia") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-3",
					variant: "gold",
					disabled: connectAdblue.isPending,
					onClick: () => connectAdblue.mutate(),
					children: connectAdblue.isPending ? "Connecting…" : "Connect AdBlueMedia"
				})
			] }),
			tab === "audit" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Audit Log" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							placeholder: "Filter by admin email...",
							value: auditLogAdmin,
							onChange: (e) => {
								setAuditLogAdmin(e.target.value);
								setAuditLogPage(1);
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							placeholder: "Filter by action (e.g. WALLET_ADJUST, WITHDRAWAL_APPROVE)...",
							value: auditLogAction,
							onChange: (e) => {
								setAuditLogAction(e.target.value);
								setAuditLogPage(1);
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs text-muted-foreground",
								children: "Start Date"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "date",
								value: auditLogStartDate,
								onChange: (e) => {
									setAuditLogStartDate(e.target.value);
									setAuditLogPage(1);
								}
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs text-muted-foreground",
								children: "End Date"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "date",
								value: auditLogEndDate,
								onChange: (e) => {
									setAuditLogEndDate(e.target.value);
									setAuditLogPage(1);
								}
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "outline",
							onClick: async () => {
								try {
									const days = auditLogStartDate && auditLogEndDate ? Math.ceil((new Date(auditLogEndDate).getTime() - new Date(auditLogStartDate).getTime()) / 864e5) : 30;
									downloadCsv(await exportTransactions({ data: {
										userId: void 0,
										days: Math.max(1, days)
									} }), `transactions-export-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
									toast.success("Transactions exported");
								} catch (err) {
									toast.error(err.message);
								}
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "mr-1 size-3" }), "Export Transactions CSV"]
						})
					]
				}),
				auditLogs.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-muted-foreground",
					children: "Loading..."
				}) : !auditLogs.data?.logs.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: FileText,
					title: "No audit logs",
					description: "Admin actions will appear here."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-2",
					children: auditLogs.data.logs.map((log) => {
						const isExpanded = expandedLogIds.has(log.id);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "surface-card p-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between cursor-pointer",
									onClick: () => {
										setExpandedLogIds((prev) => {
											const next = new Set(prev);
											if (isExpanded) next.delete(log.id);
											else next.add(log.id);
											return next;
										});
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-semibold",
										children: log.action
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs text-muted-foreground",
											children: formatDateTime(log.createdAt)
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: `size-4 transition-transform ${isExpanded ? "rotate-90" : ""}` })]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: [
										"By: ",
										log.admin?.email || "Unknown admin",
										log.targetUser && ` · Target: ${log.targetUser.email || log.targetUser.name || "Unknown"}`
									]
								}),
								isExpanded && log.details && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 space-y-2",
									children: [
										log.details.before && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-semibold text-muted-foreground",
											children: "Before:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
											className: "mt-1 overflow-x-auto rounded bg-background-alt p-2 text-xs text-muted-foreground",
											children: JSON.stringify(log.details.before, null, 2)
										})] }),
										log.details.after && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-semibold text-muted-foreground",
											children: "After:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
											className: "mt-1 overflow-x-auto rounded bg-background-alt p-2 text-xs text-muted-foreground",
											children: JSON.stringify(log.details.after, null, 2)
										})] }),
										!log.details.before && !log.details.after && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-semibold text-muted-foreground",
											children: "Details:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
											className: "mt-1 overflow-x-auto rounded bg-background-alt p-2 text-xs text-muted-foreground",
											children: JSON.stringify(log.details, null, 2)
										})] })
									]
								})
							]
						}, log.id);
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground",
						children: [
							"Page ",
							auditLogs.data.page,
							" of ",
							auditLogs.data.totalPages,
							" (",
							auditLogs.data.total,
							" total)"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "outline",
							disabled: auditLogPage === 1,
							onClick: () => setAuditLogPage((p) => Math.max(1, p - 1)),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" }), " Prev"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "outline",
							disabled: auditLogPage >= auditLogs.data.totalPages,
							onClick: () => setAuditLogPage((p) => p + 1),
							children: ["Next ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })]
						})]
					})]
				})] })
			] }),
			tab === "staff" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Staff Management" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 surface-card p-3 space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold",
							children: "Assign Role"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							placeholder: "User email...",
							value: staffEmail,
							onChange: (e) => setStaffEmail(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: staffRole === "admin" ? "jade" : "outline",
									onClick: () => setStaffRole("admin"),
									children: "Admin"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: staffRole === "finance" ? "jade" : "outline",
									onClick: () => setStaffRole("finance"),
									children: "Finance"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: staffRole === "support" ? "jade" : "outline",
									onClick: () => setStaffRole("support"),
									children: "Support"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "jade",
							disabled: !staffEmail.trim() || assignRoleAction.isPending,
							onClick: () => assignRoleAction.mutate({
								email: staffEmail.trim(),
								role: staffRole
							}),
							children: [
								"Assign ",
								staffRole,
								" role"
							]
						})
					]
				}),
				staffList.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-muted-foreground",
					children: "Loading..."
				}) : !staffList.data?.staff.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-muted-foreground",
					children: "No staff members found."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-2",
					children: staffList.data.staff.map((member) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "surface-card p-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold",
								children: member.email
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 flex flex-wrap gap-1",
								children: member.roles.map((roleObj) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary capitalize",
									children: roleObj.role
								}, roleObj.role))
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex gap-2",
								children: member.roles.map((roleObj) => roleObj.role !== "admin" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									variant: "outline",
									disabled: removeRoleAction.isPending,
									onClick: () => removeRoleAction.mutate({
										userId: member.userId,
										role: roleObj.role
									}),
									children: ["Remove ", roleObj.role]
								}, roleObj.role))
							})]
						})
					}, member.userId))
				}) })
			] }),
			adjustingUser && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WalletAdjustDialog, {
				user: adjustingUser,
				onConfirm: (amount, reason) => {
					if (Math.abs(amount) > 100) adjustRequestAction.mutate({
						userId: adjustingUser.id,
						amount,
						reason
					});
					else adjustAction.mutate({
						userId: adjustingUser.id,
						amount,
						reason
					});
					setAdjustingUser(null);
				},
				onCancel: () => setAdjustingUser(null)
			}),
			selectedDeviceId && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: true,
				onOpenChange: () => setSelectedDeviceId(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Users with Same Device" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
						"Device ID: ",
						selectedDeviceId.substring(0, 16),
						"..."
					] })] }),
					sameDeviceUsers.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Loading..."
					}) : !sameDeviceUsers.data?.users.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "No other users found with this device."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-2 max-h-96 overflow-y-auto",
						children: sameDeviceUsers.data.users.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "surface-card p-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold",
								children: u.name || u.email
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									u.email,
									" · Balance: ",
									formatMoney(u.walletBalance),
									" · Earned: ",
									formatMoney(u.lifetimeEarned),
									u.isFlagged && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "ml-2 text-destructive font-bold",
										children: "FLAGGED"
									})
								]
							})]
						}, u.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => setSelectedDeviceId(null),
						children: "Close"
					}) })
				] })
			}),
			selectedUserId && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: true,
				onOpenChange: () => setSelectedUserId(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-3xl max-h-[90vh] overflow-y-auto",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "User Details" }), userDetail.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Loading..." }) : userDetail.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: userDetail.data.profile.name || userDetail.data.profile.email }) : null] }),
						userDetail.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "Loading user details..."
						}) : !userDetail.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "Failed to load user details"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex gap-2 overflow-x-auto border-b pb-2",
									children: [
										["profile", "Profile"],
										["transactions", "Transactions"],
										["claims", "Claims"],
										["referrals", "Referrals"],
										["payouts", "Payout Methods"],
										["devices", "Devices"],
										["audit", "Audit Log"]
									].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: userDetailTab === key ? "jade" : "outline",
										onClick: () => setUserDetailTab(key),
										children: label
									}, key))
								}),
								userDetailTab === "profile" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground",
												children: "Name"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-medium",
												children: userDetail.data.profile.name || "—"
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground",
												children: "Email"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-medium",
												children: userDetail.data.profile.email
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground",
												children: "Referral Code"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-medium",
												children: userDetail.data.profile.referral_code
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground",
												children: "Referred By"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-medium",
												children: userDetail.data.profile.referred_by_code || "—"
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground",
												children: "Wallet Balance"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-medium text-emerald-600",
												children: formatMoney(userDetail.data.profile.wallet_balance)
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground",
												children: "Held Balance"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-medium text-amber-600",
												children: formatMoney(userDetail.data.profile.held_balance)
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground",
												children: "Lifetime Earned"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-medium",
												children: formatMoney(userDetail.data.profile.lifetime_earned)
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground",
												children: "Lifetime Withdrawn"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-medium",
												children: formatMoney(userDetail.data.profile.lifetime_withdrawn)
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground",
												children: "Is Flagged"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-medium",
												children: userDetail.data.profile.is_flagged ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-destructive",
													children: "Yes"
												}) : "No"
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground",
												children: "Created At"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-medium",
												children: formatDateTime(userDetail.data.profile.created_at)
											})] })
										]
									})
								}),
								userDetailTab === "transactions" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-2",
									children: userDetail.data.transactions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: "No transactions"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
										className: "space-y-2 max-h-96 overflow-y-auto",
										children: userDetail.data.transactions.map((tx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "surface-card p-2 text-xs",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-medium",
														children: tx.type
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: `font-bold ${tx.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`,
														children: [tx.amount >= 0 ? "+" : "", formatMoney(tx.amount)]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-muted-foreground mt-1",
													children: tx.description || "—"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-muted-foreground text-[10px] mt-0.5",
													children: formatDateTime(tx.created_at)
												})
											]
										}, tx.id))
									})
								}),
								userDetailTab === "claims" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-2",
									children: userDetail.data.claims.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: "No claims"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
										className: "space-y-2 max-h-96 overflow-y-auto",
										children: userDetail.data.claims.map((claim) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "surface-card p-2 text-xs",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-medium",
														children: claim.offer_title
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
														variant: claim.status === "approved" ? "default" : claim.status === "rejected" ? "destructive" : "outline",
														children: claim.status
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-muted-foreground mt-1",
													children: ["Payout: ", formatMoney(claim.payout)]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-muted-foreground text-[10px] mt-0.5",
													children: formatDateTime(claim.created_at)
												})
											]
										}, claim.id))
									})
								}),
								userDetailTab === "referrals" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-2",
									children: userDetail.data.referrals.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: "No referrals"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
										className: "space-y-2 max-h-96 overflow-y-auto",
										children: userDetail.data.referrals.map((ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "surface-card p-2 text-xs",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-medium",
													children: ref.referred_name || ref.referred_email
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: `font-bold ${ref.is_credited ? "text-emerald-600" : "text-muted-foreground"}`,
													children: ref.is_credited ? `+${formatMoney(ref.bonus_amount)}` : "Pending"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-muted-foreground mt-1",
												children: ["Joined ", formatDateTime(ref.created_at)]
											})]
										}, ref.id))
									})
								}),
								userDetailTab === "payouts" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-2",
									children: userDetail.data.payout_methods.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: "No payout methods"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
										className: "space-y-2 max-h-96 overflow-y-auto",
										children: userDetail.data.payout_methods.map((method) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "surface-card p-2 text-xs",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-medium",
														children: method.method_type
													}), method.is_verified && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
														variant: "default",
														children: "Verified"
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-muted-foreground mt-1 font-mono",
													children: method.masked_identifier
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-muted-foreground text-[10px] mt-0.5",
													children: ["Added ", formatDateTime(method.created_at)]
												})
											]
										}, method.id))
									})
								}),
								userDetailTab === "devices" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-2",
									children: userDetail.data.devices.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: "No devices"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
										className: "space-y-2 max-h-96 overflow-y-auto",
										children: userDetail.data.devices.map((device, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "surface-card p-2 text-xs",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "flex items-center justify-between",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-medium font-mono",
														children: device.device_id
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-muted-foreground mt-1",
													children: [
														device.platform || "Unknown",
														" · ",
														device.app_version || "Unknown version"
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-muted-foreground text-[10px] mt-0.5",
													children: ["Last seen ", formatDateTime(device.last_seen_at)]
												})
											]
										}, device.device_id || idx))
									})
								}),
								userDetailTab === "audit" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-2",
									children: userDetailAuditLog.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: "Loading audit log..."
									}) : !userDetailAuditLog.data || userDetailAuditLog.data.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: "No audit log entries"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
										className: "space-y-2 max-h-96 overflow-y-auto",
										children: userDetailAuditLog.data.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "surface-card p-2 text-xs",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-medium",
														children: entry.action
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-muted-foreground text-[10px]",
														children: formatDateTime(entry.created_at)
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-muted-foreground mt-1",
													children: ["By: ", entry.admin_email]
												}),
												entry.details && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-muted-foreground mt-1 text-[10px] font-mono",
													children: typeof entry.details === "string" ? entry.details : JSON.stringify(entry.details, null, 2)
												})
											]
										}, entry.id))
									})
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							onClick: () => setSelectedUserId(null),
							children: "Close"
						}) })
					]
				})
			}),
			showBroadcastDialog && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: true,
				onOpenChange: () => setShowBroadcastDialog(false),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Send Broadcast Notification" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Send a notification to all users or only those active in the last 30 days. Flagged users are excluded." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-sm font-semibold",
								children: "Title"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								placeholder: "e.g., New Feature Available",
								value: broadcastTitle,
								onChange: (e) => setBroadcastTitle(e.target.value),
								maxLength: 100
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-sm font-semibold",
									children: "Message"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									placeholder: "Write your message...",
									value: broadcastMessage,
									onChange: (e) => setBroadcastMessage(e.target.value),
									rows: 4,
									maxLength: 500
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-xs text-muted-foreground",
									children: [broadcastMessage.length, "/500 characters"]
								})
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
									id: "active-only",
									checked: broadcastActiveOnly,
									onCheckedChange: (checked) => setBroadcastActiveOnly(checked === true)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									htmlFor: "active-only",
									className: "text-sm cursor-pointer",
									children: "Send only to users active in last 30 days"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg bg-amber-500/20 p-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-semibold text-amber-900 dark:text-amber-100",
									children: "⚠️ Rate Limit: 3 broadcasts per hour"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground mt-1",
									children: "Broadcasts are logged in the audit trail."
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => setShowBroadcastDialog(false),
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "jade",
						onClick: () => {
							if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
								toast.error("Title and message are required");
								return;
							}
							broadcastAction.mutate({
								title: broadcastTitle.trim(),
								message: broadcastMessage.trim(),
								activeOnly: broadcastActiveOnly
							});
						},
						disabled: !broadcastTitle.trim() || !broadcastMessage.trim(),
						children: "Send Broadcast"
					})] })
				] })
			}),
			showMaintenanceDialog && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: true,
				onOpenChange: () => setShowMaintenanceDialog(false),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Maintenance Mode" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "When enabled, non-admin users will see a maintenance screen." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg bg-blue-500/20 p-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-semibold",
									children: "Current Status"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground mt-1",
									children: maintenanceStatus.data?.enabled ? "🔧 Maintenance mode is ON" : "✅ App is running normally"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-sm font-semibold",
								children: "Maintenance Message (Optional)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								placeholder: "We are currently performing maintenance...",
								value: maintenanceMessage,
								onChange: (e) => setMaintenanceMessage(e.target.value),
								rows: 3,
								maxLength: 300
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg bg-amber-500/20 p-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-semibold text-amber-900 dark:text-amber-100",
									children: "⚠️ Admins are never blocked"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground mt-1",
									children: "You will still have full access during maintenance mode."
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => setShowMaintenanceDialog(false),
						children: "Cancel"
					}), maintenanceStatus.data?.enabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "jade",
						onClick: () => {
							maintenanceModeAction.mutate({ enabled: false });
						},
						children: "Disable Maintenance Mode"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "destructive",
						onClick: () => {
							maintenanceModeAction.mutate({
								enabled: true,
								message: maintenanceMessage.trim() || void 0
							});
						},
						children: "Enable Maintenance Mode"
					})] })
				] })
			})
		]
	});
}
function downloadCsv(data, filename) {
	if (!data || data.length === 0) {
		toast.error("No data to export");
		return;
	}
	const headers = Object.keys(data[0]);
	const csv = [headers.join(","), ...data.map((row) => headers.map((h) => {
		const val = row[h];
		if (val === null || val === void 0) return "";
		const str = String(val);
		if (str.includes(",") || str.includes("\"") || str.includes("\n")) return `"${str.replace(/"/g, "\"\"")}"`;
		return str;
	}).join(","))].join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "surface-card p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-amount text-lg",
			children: value
		})]
	});
}
function FraudSignals({ withdrawalId }) {
	const fetchSignals = useServerFn(getWithdrawalFraudSignals);
	const signals = useQuery({
		queryKey: ["fraud-signals", withdrawalId],
		queryFn: () => fetchSignals({ data: { withdrawalId } })
	});
	if (signals.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-2 text-xs text-muted-foreground",
		children: "Loading fraud check..."
	});
	if (!signals.data) return null;
	const { riskLevel, accountAgeDays, lifetimeEarned, approvedWithdrawalsCount, isFlagged, deviceDuplicatesCount } = signals.data;
	const riskBadge = {
		high: {
			bg: "bg-red-500/20",
			text: "text-red-900 dark:text-red-100",
			label: "🔴 HIGH RISK"
		},
		medium: {
			bg: "bg-amber-500/20",
			text: "text-amber-900 dark:text-amber-100",
			label: "🟡 MEDIUM"
		},
		low: {
			bg: "bg-green-500/20",
			text: "text-green-900 dark:text-green-100",
			label: "🟢 LOW RISK"
		}
	}[riskLevel];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `mt-2 rounded-lg ${riskBadge.bg} p-2`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: `text-xs font-bold ${riskBadge.text} mb-1`,
			children: riskBadge.label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-xs text-muted-foreground space-y-0.5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					"• Account age: ",
					accountAgeDays,
					" days"
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["• Lifetime earned: ", formatMoney(lifetimeEarned)] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["• Previous approved: ", approvedWithdrawalsCount] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["• Flagged: ", isFlagged ? "Yes" : "No"] }),
				deviceDuplicatesCount > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					"• Shared device: ",
					deviceDuplicatesCount,
					" accounts"
				] })
			]
		})]
	});
}
function WalletAdjustDialog({ user, onConfirm, onCancel }) {
	const [amount, setAmount] = (0, import_react.useState)("");
	const [reason, setReason] = (0, import_react.useState)("");
	const [open, setOpen] = (0, import_react.useState)(true);
	const handleConfirm = () => {
		const numAmount = Number(amount);
		if (!Number.isFinite(numAmount) || numAmount === 0) {
			toast.error("Enter a valid amount");
			return;
		}
		if (reason.trim().length < 5) {
			toast.error("Reason must be at least 5 characters");
			return;
		}
		onConfirm(numAmount, reason.trim());
		setOpen(false);
	};
	const handleCancel = () => {
		setOpen(false);
		onCancel();
	};
	const numAmount = Number(amount);
	const isLargeAdjustment = Math.abs(numAmount) > 100;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: (isOpen) => !isOpen && handleCancel(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Adjust Wallet Balance" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: ["Adjusting wallet for: ", user.name || user.email] })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-sm font-semibold",
						children: "Amount (+ or -)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						step: "0.01",
						placeholder: "e.g. 50 or -25",
						value: amount,
						onChange: (e) => setAmount(e.target.value),
						autoFocus: true
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-sm font-semibold",
							children: "Reason (min 5 characters)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							placeholder: "Explain why this adjustment is needed...",
							value: reason,
							onChange: (e) => setReason(e.target.value),
							rows: 3,
							maxLength: 200
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs text-muted-foreground",
							children: [reason.length, "/200 characters"]
						})
					] }),
					isLargeAdjustment && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg bg-amber-500/20 p-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-semibold text-amber-900 dark:text-amber-100",
							children: [
								"⚠️ Large Adjustment ($",
								Math.abs(numAmount).toFixed(2),
								")"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground mt-1",
							children: "This will create an adjustment request requiring approval from a different admin."
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				onClick: handleCancel,
				children: "Cancel"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "jade",
				onClick: handleConfirm,
				disabled: !numAmount || reason.trim().length < 5,
				children: isLargeAdjustment ? "Create Request" : "Apply Now"
			})] })
		] })
	});
}
//#endregion
export { AdminPage as component };
