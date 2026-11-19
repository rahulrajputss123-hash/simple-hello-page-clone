import { i as __toESM } from "../_runtime.mjs";
import { i as formatDate, n as deriveReferralProgress, o as formatMoney, r as sumReferralTotals, t as REFERRAL_MILESTONE_COUNT } from "./referral-progress-DmJLJmiB.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { J as isRedirect, T as useRouter, X as redirect, _ as Outlet, b as createRootRouteWithContext, d as Scripts, f as HeadContent, g as createRouter, m as useRouterState, p as useLocation, v as lazyRouteComponent, x as Link, y as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as Slot, v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { A as Share2, At as Copy, C as Sparkles, Gt as Check, I as RefreshCw, Q as Lock, Qt as Bell, St as FileText, Tt as EyeOff, Wt as ChevronDown, X as Megaphone, Yt as CalendarClock, _t as Gift, at as LifeBuoy, i as Wallet, in as ArrowRight, k as ShieldAlert, lt as Info, mt as Headset, n as X, nt as ListChecks, on as ArrowLeft, rt as Link2, s as Users, u as UserCheck } from "../_libs/lucide-react.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { i as createServerFn, l as __exportAll, u as __toCommonJS } from "./server-CpGMOUrW.mjs";
import { t as createSsrRpc } from "./createSsrRpc-Bbq2Yr9O.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Br_KWlRY.mjs";
import { n as supabase, t as safeStorage } from "./client-QOMq7HzS.mjs";
import { i as enumType, l as stringType, n as arrayType, o as numberType, r as booleanType, s as objectType } from "../_libs/zod.mjs";
import { i as useQueryClient, n as useQuery, r as QueryClientProvider, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { a as init_advertiser_server, c as mktDb, o as init_db_server, r as advertiser_server_exports } from "./advertiser.server-DyvSoHf7.mjs";
import { i as avatarById } from "./premium-BIRn1NQB.mjs";
import { a as AlertDialogDescription$1, c as AlertDialogTitle$1, d as DialogContent$1, f as DialogDescription$1, g as DialogTrigger$1, h as DialogTitle$1, i as AlertDialogContent$1, l as Dialog$1, m as DialogPortal$1, n as AlertDialogAction$1, o as AlertDialogOverlay$1, p as DialogOverlay$1, r as AlertDialogCancel$1, s as AlertDialogPortal$1, t as AlertDialog$1, u as DialogClose$1 } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as CheckboxIndicator, t as Checkbox$1 } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { t as Label$1 } from "../_libs/radix-ui__react-label.mjs";
import { t as QRCodeSVG } from "../_libs/qrcode.react.mjs";
import crypto$2 from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/utils-C_uf36nf.js
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/auth-LVYephtQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useServerFn(serverFn) {
	const router = useRouter();
	return import_react.useCallback(async (...args) => {
		try {
			const res = await serverFn(...args);
			if (isRedirect(res)) throw res;
			return res;
		} catch (err) {
			if (isRedirect(err)) {
				err.options._fromLocation = router.stores.location.get();
				return router.navigate(router.resolveRedirect(err).options);
			}
			throw err;
		}
	}, [router, serverFn]);
}
async function playRewardedAd() {
	return {
		completed: false,
		provider: "none"
	};
}
/** Stable-ish device fingerprint used for the one-account-per-device rule. */
function getDeviceId() {
	if (typeof window === "undefined") return "server";
	const KEY = "coinquest.device_id";
	const existing = safeStorage.getItem(KEY);
	if (existing) return existing;
	const seed = [
		navigator.userAgent,
		navigator.language,
		String(screen.width),
		String(screen.height),
		String((/* @__PURE__ */ new Date()).getTimezoneOffset()),
		Math.random().toString(36).slice(2)
	].join("|");
	let hash = 0;
	for (let i = 0; i < seed.length; i += 1) {
		hash = (hash << 5) - hash + seed.charCodeAt(i);
		hash |= 0;
	}
	const id = `dev_${Math.abs(hash).toString(36)}`;
	safeStorage.setItem(KEY, id);
	return id;
}
var ensureProfile = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	name: stringType().trim().max(80).optional(),
	phone: stringType().trim().max(30).optional(),
	referralCode: stringType().trim().max(20).optional(),
	deviceId: stringType().trim().max(64).optional()
}).parse(input ?? {})).handler(createSsrRpc("69736a15d12256af6cb97ecc7e69f563827999cb9801396c73b1fcf6539b35b3"));
var completeOnboarding = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	name: stringType().trim().min(2).max(80),
	phone: stringType().trim().max(30).optional(),
	deviceId: stringType().trim().max(64).optional()
}).parse(input)).handler(createSsrRpc("8abe77de2e342523204df239659f20c6e46730e5b22e4f8069a4c31fc709307b"));
var startQuest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ questKey: stringType().max(40) }).parse(input)).handler(createSsrRpc("9bde25c7ada0ca6363e6ef7b8359777f9e450afbd65431743d10ecc219a65518"));
var reportAdWatched = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	sessionId: stringType().uuid(),
	provider: stringType().optional()
}).parse(input)).handler(createSsrRpc("e2a6f803475a534f9babbd306a69a732e4852d5cded559d31c9fab9b02e38b67"));
var completeTask = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ taskId: stringType().uuid() }).parse(input)).handler(createSsrRpc("04aad9c95604b74d2339128ffc7deeedf2c971cbe46d6226f5b0dca8a2cec3ba"));
var claimOffer = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	offerId: stringType().uuid(),
	proofUrl: stringType().trim().min(1).max(500).optional()
}).parse(input)).handler(createSsrRpc("30fef264186afa0605a3e0521a6582b80911dd9262292afbde94f4a6542204b9"));
/** Start an offer claim (for URL+proof workflow) - creates "started" status */
var startOfferClaim = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ offerId: stringType().uuid() }).parse(input)).handler(createSsrRpc("7237fe6320898543f36acd1719a81135a099cd1b099e17d4824f2d230768f6d8"));
/** Submit proof for a started offer claim - moves from "started" to "pending" */
var submitOfferProof = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	offerId: stringType().uuid(),
	proofPath: stringType().trim().min(1).max(500)
}).parse(input)).handler(createSsrRpc("b4c716a6b34c857be82c5b7e3bbc35c2b67047e80cca7c677b55fb1fee3c04af"));
var createWithdrawal = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	amount: numberType().positive().max(1e5),
	payoutMethodId: stringType().uuid()
}).parse(input)).handler(createSsrRpc("c932e030a490a4df7fe79d171fa31660f55ec5f365794522b8b6eab2a17b8687"));
var savePayoutMethod = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	methodType: stringType(),
	label: stringType().trim().max(200),
	holderName: stringType().trim().max(80).nullable().optional(),
	upiId: stringType().trim().max(120).nullable().optional(),
	paypalEmail: stringType().trim().max(200).nullable().optional(),
	accountNumber: stringType().trim().max(60).nullable().optional(),
	countryBankCode: stringType().trim().max(20).nullable().optional(),
	bankName: stringType().trim().max(120).nullable().optional(),
	country: stringType().trim().max(80).nullable().optional(),
	giftCardRecipientEmail: stringType().trim().max(200).nullable().optional(),
	walletAddress: stringType().trim().max(120).nullable().optional(),
	binancePayId: stringType().trim().max(200).nullable().optional()
}).parse(input)).handler(createSsrRpc("bc11cc1e29f12355d4a0e05b13918ee5a48ff51af2fef07f421a9a2c02cb093f"));
var cancelWithdrawal = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(createSsrRpc("3a02c0ec3a5b150508469413ee78fa7ee96fea7420a85e9fb299a4ce8f85a45f"));
var adminOverview = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("1060e64b0e1b4bdf0639654e5da952eca13175b2e82a67c5953efb70bcb28b59"));
var adminUpdateWithdrawal = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid(),
	status: enumType(["approved", "rejected"]),
	note: stringType().trim().max(300).nullable().optional(),
	referenceId: stringType().trim().max(200).nullable().optional(),
	transactionHash: stringType().trim().max(200).nullable().optional()
}).parse(input)).handler(createSsrRpc("85dd6f6e3122690b52df9700134e9211e877df8ec3abe412ffb787ee37190953"));
var adminUpdateOfferClaim = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid(),
	status: enumType(["approved", "rejected"]),
	note: stringType().trim().max(300).nullable().optional()
}).parse(input)).handler(createSsrRpc("fee09825a3188d8e35ddd5cb58636765d668e7acf6ac8584278fd94abbf41ddd"));
var adminRespondTicket = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid(),
	response: stringType().trim().min(2).max(1e3),
	status: enumType(["open", "resolved"])
}).parse(input)).handler(createSsrRpc("71a1a9072834e563aacbcf4e95af8580575d9c69bf6c5fc41c144a5c56d02809"));
var adminSetFlag = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	userId: stringType().uuid(),
	flagged: booleanType()
}).parse(input)).handler(createSsrRpc("28142979b76ff44b4bae725f95f907133001489270b956994b7f74e0c8ba6e50"));
var adminAdjustWallet = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	userId: stringType().uuid(),
	amount: numberType().min(-1e4).max(1e4),
	reason: stringType().trim().min(5, "Reason must be at least 5 characters").max(200)
}).parse(input)).handler(createSsrRpc("03bb27beccf34db0164432c252207c160452c0880b7ccac2d0e91085681e0aec"));
/** Account deletion (Amazon/Google app store compliance). */
var requestAccountDeletion = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("f4b66bfec0c2609294cb252ab3221c14583c2fe7fde6e61e767660124872b28b"));
var transferEarningsToAdvertiser = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	amount: numberType().min(5, "Minimum transfer is $5.00").max(1e6),
	idempotencyKey: stringType().min(1).max(100)
}).parse(input)).handler(createSsrRpc("1301f5e2ff0e980b8a00500548c051c63330a9822c1e78b659e8c0f37d4bac26"));
var adminListUsers = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	search: stringType().trim().max(200).optional(),
	flaggedOnly: booleanType().optional(),
	suspiciousOnly: booleanType().optional(),
	page: numberType().int().min(1).optional()
}).parse(input ?? {})).handler(createSsrRpc("4754bc9ae6c09ebe68be77e94b59aa5098a72057fbdff48a998dfd8ed6f7cb11"));
var adminListWithdrawals = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	status: enumType([
		"pending",
		"approved",
		"rejected",
		"all"
	]).optional(),
	page: numberType().int().min(1).optional()
}).parse(input ?? {})).handler(createSsrRpc("ff6bd837e51c0fd4314a7cd7aa557eb421fba73a581fa7bc4425699794c88015"));
var adminListClaims = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	status: enumType([
		"pending",
		"approved",
		"rejected",
		"all"
	]).optional(),
	page: numberType().int().min(1).optional()
}).parse(input ?? {})).handler(createSsrRpc("a2735c244711fe24b40a166a97a29fca8fe98fbe689bcc50a988122ac73b028e"));
var adminListTickets = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	status: enumType([
		"open",
		"resolved",
		"all"
	]).optional(),
	page: numberType().int().min(1).optional()
}).parse(input ?? {})).handler(createSsrRpc("da7a7c112406ffa7dad29fc3ceb8da908ca78e9f1d5290cf7a7cba1243b16a4f"));
var createAdjustmentRequest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	userId: stringType().uuid(),
	amount: numberType().refine((val) => Math.abs(val) > 100, "Amount must be > $100"),
	reason: stringType().trim().min(5).max(200)
}).parse(input)).handler(createSsrRpc("47f9d2e7a8567318a3039053b316a3fc4a847200f893519312ff0a4f585ea157"));
var listAdjustmentRequests = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ status: enumType([
	"pending",
	"approved",
	"rejected"
]).optional() }).parse(input ?? {})).handler(createSsrRpc("6d1aa3398c44cc086cc9d9b3024394ce9211635d72a2421085801ef9dc408202"));
var approveAdjustmentRequest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	requestId: stringType().uuid(),
	note: stringType().trim().max(200).optional()
}).parse(input)).handler(createSsrRpc("222961bb2dbc8040282b1b546f7f57b265daec2ba3391d2123176de9466ddc40"));
var rejectAdjustmentRequest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	requestId: stringType().uuid(),
	note: stringType().trim().min(5).max(200)
}).parse(input)).handler(createSsrRpc("e067f32dfd11bb788f8bddd66ef0591eafba5d6179e65d0a7199ed32a17ad2fc"));
var adminListAuditLogs = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	adminFilter: stringType().trim().max(100).optional(),
	actionFilter: stringType().trim().max(100).optional(),
	startDate: stringType().optional(),
	endDate: stringType().optional(),
	page: numberType().int().min(1).optional()
}).parse(input ?? {})).handler(createSsrRpc("57137ee209e75373aa5abd336744eccf473f3c2903828aef0acb327a6640c715"));
var getWithdrawalFraudSignals = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ withdrawalId: stringType().uuid() }).parse(input)).handler(createSsrRpc("ec3a363f41fdad120369bb72cbbe8441edbc002fce885e8911424c09165ef6bf"));
var getUsersWithSameDevice = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ deviceId: stringType().trim().min(1) }).parse(input)).handler(createSsrRpc("6c24b986dd76fd4d7a0e55422413aeb5bdd62422f0410e30f771c537288e6939"));
var assignRole = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	userEmail: stringType().trim().email(),
	role: enumType([
		"admin",
		"finance",
		"support"
	])
}).parse(input)).handler(createSsrRpc("15849f100c883a96dcb4fd37c4eb251b8bcd52d121c815f386dfe0263b32d220"));
var removeRole = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	userId: stringType().uuid(),
	role: enumType([
		"admin",
		"finance",
		"support"
	])
}).parse(input)).handler(createSsrRpc("bfd7ffe86bb196c9e468f50b9e23fedb720c942cd6fca5117e1c675f73a61d02"));
var listStaff = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("7bd36b172431ea04c0ef8cc9cd6fd9b2d166b81c7931314e78a26193b5fc9488"));
var listQuickReplies = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("3040184cae8619f59f1f1d15feab48b60e8f1cc0bc61379a647618a0da8c4011"));
var createQuickReply = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	title: stringType().trim().min(1).max(100),
	content: stringType().trim().min(1).max(2e3)
}).parse(input)).handler(createSsrRpc("279fef0972c37ad2f35187ad7c48164ada2cbca0ee4b541c890ef6dc5164583b"));
var updateQuickReply = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid(),
	title: stringType().trim().min(1).max(100),
	content: stringType().trim().min(1).max(2e3)
}).parse(input)).handler(createSsrRpc("aed052e6142a45a8906a8daaef356763a510908b24a11d98391719ef846f7ce6"));
var deleteQuickReply = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(createSsrRpc("1cd5ee983de5d7fdae35082851de3cf9b6e1f26f74eef3a92f7554e8251a7839"));
var getDashboardSignups = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).validator(objectType({ days: numberType().int().min(1).max(365) })).handler(createSsrRpc("7a0df54040071cd9f8be948b8492ba678a7e89171c887cc6134ba0eecfa8504b"));
var getDashboardActiveUsers = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).validator(objectType({ days: numberType().int().min(1).max(365) })).handler(createSsrRpc("113e0390e2c66bd55e0bdefe8fa79f992fe2654db151956ca61360374a2c6754"));
var getDashboardRevenuePayout = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).validator(objectType({ days: numberType().int().min(1).max(365) })).handler(createSsrRpc("c2511777fe3b0761f08be211dd2f7b07f7c47daaaff3842ab1a37f3eef0a97ed"));
var getDashboardTopOffers = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).validator(objectType({ days: numberType().int().min(1).max(365) })).handler(createSsrRpc("5065cf49b310417358eaba46745296e634b714b04a58937137bae52bb061239f"));
var getUserDetail = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).validator(objectType({ userId: stringType().uuid() })).handler(createSsrRpc("afe747b8a5a771bb295ac07d3972faf4ebd06084c027772b3573176a0c608d28"));
var getUserAuditLog = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).validator(objectType({ userId: stringType().uuid() })).handler(createSsrRpc("0f92a2bbcf4795e87b159b4c672e04ebada3cd5b2a03598808454f1688207c8a"));
var sendBroadcastNotification = createServerFn({ method: "POST" }).validator((data) => data).handler(createSsrRpc("f1979d02e433c0316c3ab77f141bbda44be63e1fae604d1ae4bc285a19a1daa5"));
var setMaintenanceMode = createServerFn({ method: "POST" }).validator((data) => data).handler(createSsrRpc("53705949da61097c1d3afab2d0033998e69f5dee3539b1314c077f0e5b7ea3ed"));
var getMaintenanceStatus = createServerFn({ method: "GET" }).handler(createSsrRpc("b8ea89771a82ddd7394a429936694fda49efbcb4c7350dc96b457ec39bcbd906"));
var checkMaintenanceStatus = createServerFn({ method: "GET" }).handler(createSsrRpc("d660e138cc1fab9a5d286cb11545a9c7eeee3764efbfc6c522f1a4fa5d84f37c"));
var exportUsersCsv = createServerFn({ method: "POST" }).validator((data) => data).handler(createSsrRpc("339ddf6971dd621f9de34f096bdbc0cc607f6f61973c596fc46f9fb09095c3ef"));
var exportTransactionsCsv = createServerFn({ method: "POST" }).validator((data) => data).handler(createSsrRpc("286099256527088e3b90e3a445cac65c94ef3778958574f7a5727494032bf6f2"));
var exportPayoutsCsv = createServerFn({ method: "POST" }).validator((data) => data).handler(createSsrRpc("bac2e645eb646ba78971372360356d2304e5e68b94daab4514885cec0525b995"));
/** Exported so preview routes can mount real screens with a mock session. */
var AuthContext = (0, import_react.createContext)({
	session: null,
	loading: true,
	profile: null,
	profileLoading: false,
	isAdmin: false,
	roles: []
});
function AuthProvider({ children }) {
	const [session, setSession] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const queryClient = useQueryClient();
	(0, import_react.useEffect)(() => {
		const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
			setSession(next);
			setLoading(false);
			if (event === "SIGNED_IN" || event === "USER_UPDATED") {
				queryClient.invalidateQueries({ queryKey: ["profile"] });
				queryClient.invalidateQueries({ queryKey: ["roles"] });
			}
			if (event === "SIGNED_OUT") queryClient.clear();
		});
		supabase.auth.getSession().then(({ data }) => {
			setSession(data.session);
			setLoading(false);
		});
		return () => sub.subscription.unsubscribe();
	}, [queryClient]);
	const userId = session?.user.id;
	const profileQuery = useQuery({
		queryKey: ["profile", userId],
		enabled: Boolean(userId),
		queryFn: async () => {
			const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
			if (data) return data;
			const referralCode = typeof window !== "undefined" ? safeStorage.getItem("coinquest.ref") ?? void 0 : void 0;
			return await ensureProfile({ data: {
				deviceId: getDeviceId(),
				...referralCode ? { referralCode } : {}
			} });
		}
	});
	const rolesList = (useQuery({
		queryKey: ["roles", userId],
		enabled: Boolean(userId),
		queryFn: async () => {
			const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
			return data ?? [];
		}
	}).data ?? []).map((r) => r.role);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthContext.Provider, {
		value: {
			session,
			loading,
			profile: profileQuery.data ?? null,
			profileLoading: profileQuery.isLoading,
			isAdmin: rolesList.includes("admin"),
			roles: rolesList
		},
		children
	});
}
function useAuth() {
	return (0, import_react.useContext)(AuthContext);
}
async function signOutEverywhere(queryClient) {
	await queryClient.cancelQueries();
	queryClient.clear();
	await supabase.auth.signOut();
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/role-cPXyL2yt.js
/**
* Phase 2 — client-callable advertiser functions. Thin: validation here,
* everything else in ./marketplace/advertiser.server.ts (service role).
* Money never moves from these functions; see processRazorpayWebhook.
*/
var getAdvertiserOverview = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("f14148b6495619d8b0910c66ac43f421222e168d6c062c64ca9124b5393a07d8"));
var becomeAdvertiser = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(async (input) => {
	const { becomeAdvertiserInput } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	return becomeAdvertiserInput.parse(input);
}).handler(createSsrRpc("6acb2162c646b7861b223f8493ec4867c241370d406e88d024a30ca88bd3b83d"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(async (input) => {
	const { updateAdvertiserProfileInput } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	return updateAdvertiserProfileInput.parse(input);
}).handler(createSsrRpc("afb5c7f7c366c0c22447041b9d6ae1da8401bd5f41bd3eb54ac20f0e5c987376"));
var createDeposit = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ amountUsd: numberType().positive().max(1e5) }).parse(input)).handler(createSsrRpc("1a02e21e7bd36bfbcf11f6cd3162614e7495dbcd81f34d6d171b7518bc8a3984"));
var createNowpaymentsDeposit = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ amountUsd: numberType().positive().max(1e5) }).parse(input)).handler(createSsrRpc("48e234dd2d46a03b02c59d82cebc1e9cd564d071d6881ec2e55057a78570d0ee"));
var createQropayDeposit = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ amountUsd: numberType().positive().max(1e5) }).parse(input)).handler(createSsrRpc("1fc25f0f0b339dff5de6f9192a64657b2590eb9df858f3c8a25921bb281ad874"));
var confirmCheckout = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	depositId: stringType().uuid(),
	orderId: stringType().min(1).max(64),
	paymentId: stringType().min(1).max(64),
	signature: stringType().regex(/^[0-9a-f]{64}$/i)
}).parse(input)).handler(createSsrRpc("e20ba76032641b7fd35d80c663a7a753e56270de4dd1c0a05afc78620a7b0e3d"));
var abandonDeposit = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	depositId: stringType().uuid(),
	reason: stringType().max(200).default("checkout_dismissed")
}).parse(input)).handler(createSsrRpc("60a33c64429e4ccf43cfbc0372780490bc76026d87f307c0bde0544fd388770e"));
var getDepositStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ depositId: stringType().uuid() }).parse(input)).handler(createSsrRpc("2bd8c3834253865a6e20c2689f8a85aebf7fa15dc3478ce50592825fb8347d00"));
var listAdvertiserTransactions = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("27d3903d900a31b8ccfec3437a2c649c8486041a41dccd03075a8fb1a7af1de3"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("6b5581f49fa670fd0e66b744e3f541f93b3a4e60f3cfa01a0204f00a035f306d"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	auto_approve_enabled: booleanType().optional(),
	auto_approve_after_minutes: numberType().int().min(1).max(120).optional(),
	auto_approve_skip_first_campaign: booleanType().optional()
}).parse(input)).handler(createSsrRpc("01826f8b211b53868aec025999e043064e83dd2eb7f516d285ad5fe51ddbc4ad"));
var listMyCampaigns = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("166351c4b3b261fec66e592322b4c54794b8916e8df80283b90ffc8352782c97"));
var createCampaign = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(async (input) => {
	const { createCampaignInput } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	return createCampaignInput.parse(input);
}).handler(createSsrRpc("bc2d8b04c9d6e79234a498017b6fcc3c3e7beeaf90ba2353692547c777a02974"));
var campaignAction = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	campaignId: stringType().uuid(),
	action: enumType([
		"pause",
		"resume",
		"submit",
		"complete",
		"archive"
	])
}).parse(input)).handler(createSsrRpc("0cb5c6aa2488419445699bd40f9c6d047707da2f33d8e7a07a142a0975091ebf"));
var rotateCampaignSecret = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ campaignId: stringType().uuid() }).parse(input)).handler(createSsrRpc("e0c6b3373ff304f8b645c030077250adb17aaa463c0a35f951c248eff12ce954"));
var editCampaign = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(async (input) => {
	const { editCampaignInput } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	return editCampaignInput.parse(input);
}).handler(createSsrRpc("500bd575c3b142dff59398fa8ecdca6d468dee80ee4fcaa354be4feb6d77dedf"));
var addCampaignBudget = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => {
	const { addCampaignBudgetInput } = (init_advertiser_server(), __toCommonJS(advertiser_server_exports));
	return addCampaignBudgetInput.parse(input);
}).handler(createSsrRpc("f26e349249ab80720c26b8821b87b838031feb2502b3484ba830e8fb84929bdc"));
var getCampaignResults = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ campaignId: stringType().uuid() }).parse(input)).handler(createSsrRpc("e8fd746a783e117d2735202376cba4b14735d9b6765034fc330247df4a9d345c"));
var getCampaignForEdit = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ campaignId: stringType().uuid() }).parse(input)).handler(createSsrRpc("b7f55781ecb2d4e63a4b21861e6203bc42bfee60b7c172c0402607a3d4fba50d"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ campaignId: stringType().uuid() }).parse(input)).handler(createSsrRpc("0198c71f0c8f10b24e7a07f3d23cba83ec7dfea3af097163a6003d4cf4f920d1"));
var listActiveCampaigns = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("735e051af52ed52324b238cc62c4f21519b826d2220d9725128c6d32f5778ca6"));
var listMySubmissions = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("5fbb54b5ef21cab546de76d73ad7e40c06f5f680f52d2820cc179be79ea4c79b"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(async (input) => {
	const { submitProofInput } = await import("./publisher.server-BEIokuuX.mjs");
	return submitProofInput.parse(input);
}).handler(createSsrRpc("fdedc44e313d9482a2a723e1de3b299ad5c73dc0c5be0c938c2a6f6bf04cf404"));
var submitProofForCampaign = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(async (input) => {
	const { submitProofForCampaignInput } = await import("./publisher.server-BEIokuuX.mjs");
	return submitProofForCampaignInput.parse(input);
}).handler(createSsrRpc("adc78d8003df45cd074be3d1720f3b3112c450c3e39d2359e0b0b16bc4e557af"));
var appealSubmission = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(async (input) => {
	const { appealSubmissionInput } = await import("./publisher.server-BEIokuuX.mjs");
	return appealSubmissionInput.parse(input);
}).handler(createSsrRpc("68242992373f656278810b55d6f3201dfed4aab2921196fd991db25853568424"));
var listPendingCampaigns = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("290529a93d217bb18991308c933eb7766fdde3656f3d6c80a7fd4b8274af0ef9"));
var listPendingProofs = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("e13a0617e69af1a7d094a68ecadafaa3ef521b51e81efa71b169be7e00e418ac"));
var reviewCampaign = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	campaignId: stringType().uuid(),
	decision: enumType(["approved", "rejected"]),
	note: stringType().min(5).max(500)
}).parse(input)).handler(createSsrRpc("202bbe3fdb8310b2f765d14762b52cfcd635877c0f13671dc778353719a07d22"));
var reviewProof = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	submissionId: stringType().uuid(),
	role: enumType(["admin", "advertiser"]).default("admin"),
	decision: enumType(["approved", "rejected"]),
	reason: stringType().min(10).max(500).nullable()
}).parse(input)).handler(createSsrRpc("22cde728fbba6955bb956f49399aaf5ecc9036d565ba08f2170d336555ecbd2e"));
var recordClick = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	campaignId: stringType().uuid(),
	userAgent: stringType().max(500).nullable()
}).parse(input)).handler(createSsrRpc("2f36ee3878798c8bc429d86262222cdecb0c58fc1536833f4d7689d1d1263d9a"));
var getPreferredRole = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("0e6ae522803d99c0afa815d1843b1edc6c49f108d79e95537ea494d9d669c8fd"));
var setPreferredRole = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ role: enumType(["publisher", "advertiser"]) }).parse(input)).handler(createSsrRpc("1750371c6a1617af6bdbe567635273cefd8cd0746a4b22b0b2d06bb9962a070e"));
var listCategories = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("b26aa50745b61d721b8b74bdb186ee1b935d33b94926e2a9960892966bfcfb67"));
var listPendingReviews = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("26d11672bf8e3b56a22b9ad6cb6dd09df2df1dbbaa33a4aaccbca62314ee25ef"));
var reviewSubmission = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	submissionId: stringType().uuid(),
	decision: enumType(["approved", "rejected"]),
	reason: stringType().optional()
}).parse(input)).handler(createSsrRpc("515149c9123f00a24401fad9482cfac0f566b8e395f00a903a44b8db233033f3"));
var STORAGE_KEY$1 = "cashgpt.marketplace.role";
var preferredRoleQueryKey = (userId) => ["preferred-role", userId];
var RoleContext = (0, import_react.createContext)({
	role: "publisher",
	setRole: () => {},
	advertiserActivated: false,
	overview: null,
	overviewLoading: false,
	marketplaceAvailable: false,
	refreshOverview: async () => {}
});
var advertiserOverviewKey = (userId) => ["advertiser-overview", userId];
function readStoredRole() {
	if (typeof window === "undefined") return "publisher";
	return safeStorage.getItem(STORAGE_KEY$1) === "advertiser" ? "advertiser" : "publisher";
}
function RoleProvider({ children }) {
	const { session } = useAuth();
	const userId = session?.user.id;
	const queryClient = useQueryClient();
	const fetchOverview = useServerFn(getAdvertiserOverview);
	const fetchPreferredRole = useServerFn(getPreferredRole);
	const savePreferredRole = useServerFn(setPreferredRole);
	const [preferred, setPreferred] = (0, import_react.useState)(readStoredRole);
	const preferredRoleQuery = useQuery({
		queryKey: preferredRoleQueryKey(userId),
		queryFn: () => fetchPreferredRole(),
		enabled: Boolean(userId),
		staleTime: Infinity,
		retry: false
	});
	(0, import_react.useEffect)(() => {
		if (preferredRoleQuery.data?.preferredRole) {
			setPreferred(preferredRoleQuery.data.preferredRole);
			if (typeof window !== "undefined") safeStorage.setItem(STORAGE_KEY$1, preferredRoleQuery.data.preferredRole);
		}
	}, [preferredRoleQuery.data]);
	const overviewQuery = useQuery({
		queryKey: advertiserOverviewKey(userId),
		queryFn: () => fetchOverview(),
		enabled: Boolean(userId),
		staleTime: 15e3,
		retry: 1
	});
	const overview = overviewQuery.data ?? null;
	const advertiserActivated = Boolean(overview?.account);
	const marketplaceAvailable = !overviewQuery.isError && (overviewQuery.isPending || Boolean(overview));
	const role = preferred === "advertiser" && advertiserActivated ? "advertiser" : "publisher";
	const setRole = (0, import_react.useCallback)(async (next) => {
		setPreferred(next);
		if (userId) try {
			await savePreferredRole({ role: next });
		} catch (err) {
			console.error("Failed to persist role preference:", err);
		}
		if (typeof window !== "undefined") safeStorage.setItem(STORAGE_KEY$1, next);
	}, [userId, savePreferredRole]);
	const refreshOverview = (0, import_react.useCallback)(async () => {
		await queryClient.invalidateQueries({ queryKey: advertiserOverviewKey(userId) });
	}, [queryClient, userId]);
	const value = (0, import_react.useMemo)(() => ({
		role,
		setRole,
		advertiserActivated,
		overview,
		overviewLoading: Boolean(userId) && overviewQuery.isPending,
		marketplaceAvailable,
		refreshOverview
	}), [
		role,
		setRole,
		advertiserActivated,
		overview,
		userId,
		overviewQuery.isPending,
		marketplaceAvailable,
		refreshOverview
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleContext.Provider, {
		value,
		children
	});
}
function useRole() {
	return (0, import_react.useContext)(RoleContext);
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/button-B19lZlmV.js
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground shadow-soft hover:bg-primary-soft",
			destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
			outline: "border border-border bg-card text-foreground shadow-soft hover:bg-background-alt",
			secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
			ghost: "hover:bg-background-alt text-foreground",
			link: "text-primary underline-offset-4 hover:underline",
			gold: "bg-gold-gradient text-gold-foreground shadow-gold hover:brightness-105",
			mint: "bg-mint-gradient text-mint-foreground shadow-soft hover:brightness-105",
			jade: "bg-jade-gradient text-primary-foreground shadow-lift hover:brightness-110"
		},
		size: {
			default: "h-11 px-5 py-2",
			sm: "h-9 rounded-lg px-3 text-xs",
			lg: "h-13 rounded-2xl px-8 text-base",
			icon: "h-10 w-10 rounded-full"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/quests.functions-Y2nRa8oB.js
var quests_functions_exports = /* @__PURE__ */ __exportAll({
	completeLockerQuest: () => completeLockerQuest,
	completeShortlinkStep: () => completeShortlinkStep,
	completeTimedPtcStep: () => completeTimedPtcStep,
	deleteQuest: () => deleteQuest,
	ensureCheckinSession: () => ensureCheckinSession,
	fetchSurveyFeed: () => fetchSurveyFeed,
	getActiveTimeQuestKey: () => getActiveTimeQuestKey,
	getNetworkQuestProgress: () => getNetworkQuestProgress,
	getQuestActiveTimeProgress: () => getQuestActiveTimeProgress,
	getSurveyQuestProgress: () => getSurveyQuestProgress,
	listActiveQuests: () => listActiveQuests,
	listAdminQuests: () => listAdminQuests,
	listSdkProvidersForQuests: () => listSdkProvidersForQuests,
	openFeedQuestStep: () => openFeedQuestStep,
	openQuestNetwork: () => openQuestNetwork,
	pingActiveTime: () => pingActiveTime,
	processActiveTimePing: () => processActiveTimePing,
	saveQuest: () => saveQuest,
	startActiveTimeGrace: () => startActiveTimeGrace,
	startFeedQuest: () => startFeedQuest,
	startLockerQuest: () => startLockerQuest,
	startShortlinkStep: () => startShortlinkStep,
	startSurveyQuest: () => startSurveyQuest,
	startTimedPtcStep: () => startTimedPtcStep,
	updateUserTimezone: () => updateUserTimezone
});
var shortlinkStepSchema = objectType({
	network: stringType().trim().min(1).max(60),
	url: stringType().trim().url().max(2e3)
});
var questFormSchema = objectType({
	id: stringType().uuid().optional(),
	key: stringType().trim().min(2).max(40).regex(/^[a-z0-9_-]+$/i, "Key must be alphanumeric / _ / -"),
	label: stringType().trim().min(1).max(60),
	icon: stringType().trim().max(2e3).default("gift"),
	questType: enumType([
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
	]).default("ads"),
	adsRequired: numberType().int().min(0).max(500).default(0),
	rewardAmount: numberType().min(0).max(1e4).default(0),
	stepReward: numberType().min(0).max(1e4).default(0),
	stepRewards: arrayType(numberType().min(0).max(1e4)).optional().nullable(),
	shortlinkSteps: arrayType(shortlinkStepSchema).max(10).optional(),
	minSecondsPerStep: numberType().int().min(1).max(600).default(15),
	lockerUrls: arrayType(stringType().trim().url().max(2e3)).max(10).optional(),
	totalDays: numberType().int().min(1).max(365).default(3),
	requiredActiveSeconds: numberType().int().min(0).max(86400).default(300),
	streakMode: enumType(["consecutive", "total"]).default("consecutive"),
	graceDays: numberType().int().min(0).max(30).default(0),
	day1AutoComplete: booleanType().default(true),
	repeatable: booleanType().default(false),
	defaultTimezone: stringType().trim().min(1).max(100).default("Asia/Kolkata"),
	networkProviderIds: arrayType(stringType().uuid()).max(10).default([]),
	requiredCount: numberType().int().min(1).max(10).default(3),
	minQualifyingUsd: numberType().min(0).max(100).default(.01),
	tokenTtlHours: numberType().int().min(1).max(720).default(24),
	rewardHoldHours: numberType().int().min(0).max(720).default(0),
	requiredSurveys: numberType().int().min(1).max(10).default(5),
	allowedNetworks: arrayType(enumType([
		"cpxresearch",
		"theoremreach",
		"timewall"
	])).min(1).default([
		"cpxresearch",
		"theoremreach",
		"timewall"
	]),
	minPayoutUsd: numberType().min(0).max(100).default(.5),
	maxLoi: numberType().int().min(1).max(120).nullable().optional(),
	feedKind: enumType([
		"ptc",
		"shortlink",
		"article"
	]).nullable().optional(),
	stepsCount: numberType().int().min(1).max(20).default(10),
	backupCount: numberType().int().min(0).max(10).default(4),
	feedProviderIds: arrayType(stringType().uuid()).max(10).default([]),
	minRewardUsd: numberType().min(0).max(100).default(.1),
	minCompletionRate: numberType().int().min(0).max(100).default(50),
	maxPerNetwork: numberType().int().min(1).max(20).nullable().optional(),
	blockedDomains: arrayType(stringType().trim().max(200)).max(100).default([]),
	timedSteps: arrayType(objectType({
		ad_network: stringType().trim().min(1).max(60),
		push_network: stringType().trim().min(1).max(60)
	})).max(10).optional(),
	timedStepSeconds: numberType().int().min(10).max(600).default(60),
	timedCheckpointSeconds: numberType().int().min(5).max(120).default(10),
	timedMaxFailedTaps: numberType().int().min(1).max(5).default(2),
	targetMinutes: numberType().int().min(1).max(600).default(30),
	dailyCapMinutes: numberType().int().min(1).max(600).default(120),
	graceMinutes: numberType().int().min(1).max(60).default(10),
	isActive: booleanType().default(true),
	sortOrder: numberType().int().min(0).max(9999).default(0),
	lockType: enumType([
		"none",
		"time",
		"earning",
		"first_withdrawal"
	]).default("none"),
	unlockAt: stringType().datetime({ offset: true }).nullable().optional(),
	requiredLifetimeEarned: numberType().min(0).max(1e5).nullable().optional(),
	appOnly: booleanType().default(false)
}).refine((data) => {
	if (data.questType === "network") return data.requiredCount <= data.networkProviderIds.length;
	if (data.questType === "survey") return data.allowedNetworks && data.allowedNetworks.length > 0;
	return true;
}, {
	message: "Network quest: required count must be <= pool size. Survey quest: at least one network must be selected.",
	path: ["requiredCount", "allowedNetworks"]
});
/** Public (authenticated): active quests for the starter row + featured page.
*  Passes the requesting userId so lock state is computed per-user server-side.
*  isNative flag filters app-only quests on web (can be spoofed — best effort).
*/
var listActiveQuests = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ isNative: booleanType().optional().default(false) }).parse(input)).handler(createSsrRpc("6ec3785b5340a6c4e7e32744d3bbbc719ea3d940d654049ff8a508c117884b30"));
/** Admin: full list including inactive quests. */
var listAdminQuests = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("1e5b0cb8d5d4f064fb5d3e63fe837f49245be02d431739537235c3a9c493a24c"));
/** Admin: create or update a quest definition. */
var saveQuest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => questFormSchema.parse(input)).handler(createSsrRpc("5c24e8a9841a8e4c3d765536b0d527ee0b3ab7c5771de0cf0a870c2fef46b3bd"));
/** Admin: delete a quest definition (deactivates if it already has sessions). */
var deleteQuest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(createSsrRpc("a03b81ebb9860460017f4301a536a581f9a1cb593796f760b3bb87d6b5a61682"));
/** User: begin a shortlink step — sets current_step + step_issued_at on the active session. */
var startShortlinkStep = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	questKey: stringType().min(1).max(40),
	step: numberType().int().min(1).max(10),
	isNative: booleanType().optional().default(false)
}).parse(input)).handler(createSsrRpc("50369dc8041e0f1633f8e9d111f00f15a04808cbddd3c04b0a29d1780ed9d04a"));
/** User: called by the /go/$key/$step return page. Validates time-check + advances / credits. */
var completeShortlinkStep = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	questKey: stringType().min(1).max(40),
	step: numberType().int().min(1).max(10),
	isNative: booleanType().optional().default(false)
}).parse(input)).handler(createSsrRpc("a2e1136a7fe9ee33e8a98e0a2dcbe265af076be4942452cf95d74ae82a984037"));
/** User: begin a timed PTC step — sets issued_step + step_issued_at on the active session. */
var startTimedPtcStep = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	questKey: stringType().min(1).max(40),
	step: numberType().int().min(1).max(10),
	isNative: booleanType().optional().default(false)
}).parse(input)).handler(createSsrRpc("88d044370dcbcebbae90178e5043c60096c7b4fecf8ba4e6ab7d032f939f7648"));
/** User: complete a timed PTC step. Validates elapsed time, checkpoints, advances / credits. */
var completeTimedPtcStep = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	questKey: stringType().min(1).max(40),
	step: numberType().int().min(1).max(10),
	checkpointsDone: numberType().int().min(0).max(100),
	isNative: booleanType().optional().default(false)
}).parse(input)).handler(createSsrRpc("7007da75d1dcac471af5a70484867b72815f34fe68f76855ff5774148c895910"));
/** User: start a locker quest — creates a session and returns the locker URL to open. */
var startLockerQuest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	questKey: stringType().min(1).max(40),
	isNative: booleanType().optional().default(false)
}).parse(input)).handler(createSsrRpc("f1035bbae52f7fca5385a916bed488fc71d295d58b1768c47f084be7632141a2"));
/**
* User: called by /go/locker/return after AdBlueMedia redirects back.
* Credits the most recent 'started' locker session for the given questKey.
*/
var completeLockerQuest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	questKey: stringType().min(1).max(40),
	isNative: booleanType().optional().default(false)
}).parse(input)).handler(createSsrRpc("a19f75bb513a10f83c33b8cc120fca54414d81318ec4991323529a447efefc51"));
/**
* User: ensure check-in session exists and is valid.
* Idempotent - client should call after loading quests.
* Handles session creation, Day 1 auto-complete, and streak evaluation.
*/
var ensureCheckinSession = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ questKey: stringType().min(1).max(40) }).parse(input)).handler(createSsrRpc("bec3a0b3879f1e1b2d6d399aa4d751a65feb0de2bb943315be8997828a6a5e0e"));
/**
* User: ping active time for check-in quest.
* Called by client every 30s while document is visible and focused.
* Server tracks active seconds and completes day when threshold reached.
*/
var pingActiveTime = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ questKey: stringType().min(1).max(40) }).parse(input)).handler(createSsrRpc("cef844c72587d57fc888b189b67ddcd835c7cd19ae967982ddf91ed50c8cb904"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ questKey: stringType().min(1).max(40) }).parse(input)).handler(createSsrRpc("705633caa6134c8ce4cd31b45c7bc7ae85165f5bb875f52535eeb6dfbf0e1b34"));
/**
* User: update user's timezone (client-detected via Intl API).
* Validates timezone server-side and enforces 7-day change limit.
* Uses service role to write profiles.timezone (not client-writable).
*/
var updateUserTimezone = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ timezone: stringType().trim().min(1).max(100) }).parse(input)).handler(createSsrRpc("fd087eab454d1a70419d9dff8f6cb2a398aafc5701120272724c0b59d62ba6f5"));
/**
* User: open a network quest provider.
* Generates a quest token and returns the offerwall URL.
* Rate-limited per user.
*/
var openQuestNetwork = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	questKey: stringType().min(1).max(40),
	providerId: stringType().uuid()
}).parse(input)).handler(createSsrRpc("a31872f9e4147316c165a9d9badc989c93ec627768bde954f52825f0bb25cc68"));
/**
* User: get network quest progress.
* Returns provider pool with completion status.
*/
var getNetworkQuestProgress = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ questKey: stringType().min(1).max(40) }).parse(input)).handler(createSsrRpc("bdd8412a518cb4eba332a3fa82e2bbd5f74c9acfbc7a7a972bc5ec56d2b67b0d"));
/**
* Start a feed quest: fetch and snapshot campaigns.
*/
var startFeedQuest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ questKey: stringType() }).parse(input)).handler(createSsrRpc("2c5406b4f29b5fa4985355e5ea844aa88185334de80dfb5049cfdd19867f977e"));
/**
* Open a specific feed quest step.
*/
var openFeedQuestStep = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	questKey: stringType(),
	step: numberType().int().min(1)
}).parse(input)).handler(createSsrRpc("6cf688e24a3ee56a47ab363b5deb2ffc96e531e071e15e6f2455845a6ddd0e30"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ questKey: stringType() }).parse(input)).handler(createSsrRpc("658527fa974b5f8e35f690e417a88b854b678e758ea20ab4c7a3ce76f60355cd"));
/**
* User: fetch survey feed for a survey quest.
* Returns mixed list of surveys from allowed networks (CPX, TheoremReach, Timewall).
* Requires Request context for IP and User-Agent headers.
*/
var fetchSurveyFeed = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	questKey: stringType().min(1).max(40),
	sessionId: stringType().uuid()
}).parse(input)).handler(createSsrRpc("7dfe5c9c0312a363dd0e8ff6e41f6b4aae35a6c9d51f6a65b6ded779049cd62b"));
/**
* User: start a survey quest session.
* Creates a new session and returns the session ID.
*/
var startSurveyQuest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ questKey: stringType().min(1).max(40) }).parse(input)).handler(createSsrRpc("7ccc9b45da74a1471a1818b7ab07c9d3b4abaf5817887ddb4f67e697be59c49b"));
/**
* User: get survey quest progress.
* Returns completed survey count and required count.
*/
var getSurveyQuestProgress = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ questKey: stringType().min(1).max(40) }).parse(input)).handler(createSsrRpc("dcf7373c0658abe2988a25d239bc7944cb7c412e0b12701a08df24d92fa1266d"));
/** Admin: list enabled SDK offerwall providers for quest configuration. */
var listSdkProvidersForQuests = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("63d8fb14ad0c7aedbce0b0328f87b059830d5c6d1ffea83aeda7baef888b176a"));
/**
* Get active time quest key if user has one active and started.
*/
var getActiveTimeQuestKey = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("55d205c4104833b5da1cc369fabe6432aeaf54b61e5ec03777ba6a05481fe8d2"));
/**
* Process active time ping - server authoritative time tracking.
* Client sends ping every 30s, server credits min(gap, 35s) with <20s filter.
* Auto-claims reward when target is reached.
*/
var processActiveTimePing = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	questKey: stringType().min(1).max(40),
	pingToken: stringType().nullable(),
	isActive: booleanType().default(true)
}).parse(input)).handler(createSsrRpc("da0a6ff20dcd5dddf23e892fe8b96b3a0b242fe0e3faa3e505fcd7b0e279a3ab"));
/**
* Get quest active time progress - read initial state from DB
*/
var getQuestActiveTimeProgress = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ questKey: stringType().min(1).max(40) }).parse(input)).handler(createSsrRpc("16fba392848896b5beac1cd77afde2cf48211a79c9dc79a450e3e27f88dded40"));
/**
* Start active time grace period - called when user clicks an offer.
* Grace period allows 10min after offer click, max 3/hour, 24h cooldown per offer.
*/
var startActiveTimeGrace = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	questKey: stringType().min(1).max(40),
	offerId: stringType().min(1).max(200)
}).parse(input)).handler(createSsrRpc("89667eeeedc6d755c2afe5ebbafa244938c64ba501d89a3ef96d3772eb5ea52f"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ questKey: stringType().min(1).max(40) }).parse(input)).handler(createSsrRpc("54403fd88ead069bb713c532eb8fca2b0538b59139b03e58be3a6b55f7160ed0"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ questKey: stringType().min(1).max(40) }).parse(input)).handler(createSsrRpc("911f464e6d3f0f9b48a2cba46755d85d612a44875fe7e277ba6312a45844fdee"));
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/useCheckinHeartbeat-DrnWSToa.js
/**
* Hook that sends active time pings every 30 seconds while the user is visible and focused.
* Only runs when enabled=true (quest active, day incomplete).
* Stops automatically when day completes.
*/
function useCheckinHeartbeat({ questKey, enabled, onDayComplete }) {
	const [state, setState] = (0, import_react.useState)({
		activeSeconds: 0,
		requiredSeconds: 0,
		isPinging: false
	});
	const intervalRef = (0, import_react.useRef)(null);
	const isVisibleRef = (0, import_react.useRef)(true);
	const isFocusedRef = (0, import_react.useRef)(true);
	(0, import_react.useEffect)(() => {
		const handleVisibilityChange = () => {
			isVisibleRef.current = document.visibilityState === "visible";
		};
		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
	}, []);
	(0, import_react.useEffect)(() => {
		const handleFocus = () => {
			isFocusedRef.current = true;
		};
		const handleBlur = () => {
			isFocusedRef.current = false;
		};
		window.addEventListener("focus", handleFocus);
		window.addEventListener("blur", handleBlur);
		return () => {
			window.removeEventListener("focus", handleFocus);
			window.removeEventListener("blur", handleBlur);
		};
	}, []);
	const sendPing = async () => {
		if (!isVisibleRef.current || !isFocusedRef.current || !enabled) return;
		setState((prev) => ({
			...prev,
			isPinging: true
		}));
		try {
			const result = await pingActiveTime({ data: { questKey } });
			if (!result.success) {
				console.warn("[Checkin Heartbeat] Ping failed:", result.error);
				setState((prev) => ({
					...prev,
					isPinging: false
				}));
				return;
			}
			const { dayCompleted, activeSeconds, requiredSeconds, stepReward } = result.data;
			setState({
				activeSeconds: activeSeconds ?? 0,
				requiredSeconds: requiredSeconds ?? 0,
				isPinging: false
			});
			if (dayCompleted) {
				onDayComplete?.({ stepReward });
				toast.success(stepReward ? `🎉 Day Complete! You earned ${stepReward} coins! Keep your streak going.` : "🎉 Day Complete! Keep your streak going!");
			}
		} catch (error) {
			console.error("[Checkin Heartbeat] Ping error:", error);
			setState((prev) => ({
				...prev,
				isPinging: false
			}));
		}
	};
	(0, import_react.useEffect)(() => {
		if (enabled) {
			sendPing();
			intervalRef.current = setInterval(sendPing, 3e4);
			return () => {
				if (intervalRef.current) {
					clearInterval(intervalRef.current);
					intervalRef.current = null;
				}
			};
		} else if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, [enabled, questKey]);
	return state;
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/advertiser-onboarding-DXQ7RCMD.js
function getAdvertiserOnboardingContent(overview) {
	const bonusEligible = overview.promoActive && overview.lifetimeDeposited === 0 && overview.userBonusPercent > 0;
	const percent = Math.max(0, overview.userBonusPercent);
	const exampleDeposit = Math.max(0, overview.minDepositUsd);
	const exampleBonus = Math.round(exampleDeposit * (percent / 100) * 100) / 100;
	const endsAt = overview.promoEndsAt && new Date(overview.promoEndsAt).getTime() > Date.now() ? new Intl.DateTimeFormat(void 0, { dateStyle: "medium" }).format(new Date(overview.promoEndsAt)) : null;
	return bonusEligible ? {
		title: "Get More Campaign Credit",
		description: `Your first deposit may qualify for a ${percent}% campaign credit bonus. A ${exampleDeposit.toFixed(2)} deposit could become $${(exampleDeposit + exampleBonus).toFixed(2)} in campaign funds, subject to the live deposit rules. Bonus funds unlock as you spend and are not withdrawable cash.${endsAt ? ` Promotion ends ${endsAt}.` : ""}`,
		bonusEligible: true,
		percent
	} : {
		title: "Build Your Next Campaign",
		description: "Create campaigns, reach CashGPT members, and manage your campaign funds from one advertiser dashboard.",
		bonusEligible: false,
		percent: 0
	};
}
function advertiserOnboardingStorageKey(userId) {
	return `cashgpt.advertiser_onboarding_seen.${userId}`;
}
function advertiserOnboardingActivationKey(userId) {
	return `cashgpt.advertiser_onboarding_activation.${userId}`;
}
function advertiserAccountIsNew(createdAt, now = Date.now()) {
	if (!createdAt) return false;
	const created = new Date(createdAt).getTime();
	return Number.isFinite(created) && created <= now && now - created < 864e5;
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/platform-PZhNC8jy.js
function getCapacitor() {
	if (typeof window === "undefined") return void 0;
	return window.Capacitor;
}
/**
* True only inside the Capacitor native shell (Android/iOS WebView).
*
* Always false during SSR and false in every browser, so web-only UI can be
* rendered behind this check without affecting the packaged app.
*/
function isNativePlatform() {
	const capacitor = getCapacitor();
	if (!capacitor) return false;
	if (typeof capacitor.isNativePlatform === "function") try {
		return capacitor.isNativePlatform();
	} catch {
		return false;
	}
	return capacitor.platform === "android" || capacitor.platform === "ios";
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/dialog-BSMPV7u1.js
/** Tracks which one-shot keys have already animated during this page load. */
var playedKeys = /* @__PURE__ */ new Set();
function prefersReducedMotion() {
	return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
/**
* Animates a number from 0 up to `target` the first time a real value arrives.
*
* Display-only: the returned value is purely for rendering and never feeds back
* into state or requests. Later changes to `target` are reflected immediately
* without re-animating, so a balance update never replays the count-up.
*
* @param target The real value to land on.
* @param options.durationMs Animation length. Default 900ms.
* @param options.onceKey When set, the count-up plays only once per page load
*   for that key — used for the shared header balance so it doesn't replay on
*   every route change.
*/
function useCountUp(target, options = {}) {
	const { durationMs = 900, onceKey } = options;
	const [value, setValue] = (0, import_react.useState)(target);
	const startedRef = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		if (startedRef.current || !Number.isFinite(target) || target <= 0) {
			setValue(target);
			return;
		}
		if (onceKey && playedKeys.has(onceKey)) {
			setValue(target);
			return;
		}
		startedRef.current = true;
		if (onceKey) playedKeys.add(onceKey);
		if (prefersReducedMotion()) {
			setValue(target);
			return;
		}
		let frame = 0;
		const start = performance.now();
		const tick = (now) => {
			const progress = Math.min(1, (now - start) / durationMs);
			const eased = 1 - (1 - progress) ** 3;
			if (progress < 1) {
				setValue(target * eased);
				frame = requestAnimationFrame(tick);
			} else setValue(target);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	}, [
		target,
		durationMs,
		onceKey
	]);
	return value;
}
/**
* Counts up from 0 to `target` once the attached element first scrolls into view.
*
* Display-only, one-shot per page load: if the element already animated once
* and then remounts (e.g., tab switching), shows the final value immediately
* without replaying. The observer disconnects after first intersection so
* scrolling back up never replays. Attach the returned `ref` to the element
* that should trigger the animation.
*
* Unlike {@link useCountUp}, this starts at 0 and is driven by visibility rather
* than by an async value arriving — use it for static marketing/stat figures.
*
* Uses a callback ref to ensure the observer attaches whenever the element mounts,
* even after unmounting and remounting (e.g., tab switches).
*
* @param target The value to land on.
* @param duration Animation length in ms. Default 1400ms.
*/
function useCountUpOnVisible(target, duration = 1400) {
	const [node, setNode] = (0, import_react.useState)(null);
	const [value, setValue] = (0, import_react.useState)(0);
	const startedRef = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		if (!node) return;
		if (startedRef.current) {
			setValue(target);
			return;
		}
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			startedRef.current = true;
			setValue(target);
			return;
		}
		const observer = new IntersectionObserver((entries) => {
			const entry = entries[0];
			if (!entry || !entry.isIntersecting || startedRef.current) return;
			startedRef.current = true;
			observer.disconnect();
			const start = performance.now();
			const tick = (now) => {
				const progress = Math.min(1, (now - start) / duration);
				const eased = 1 - (1 - progress) ** 3;
				setValue(Math.round(target * eased));
				if (progress < 1) requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
		}, { threshold: .4 });
		observer.observe(node);
		return () => observer.disconnect();
	}, [
		node,
		target,
		duration
	]);
	return {
		ref: setNode,
		value
	};
}
var Dialog = Dialog$1;
var DialogTrigger = DialogTrigger$1;
var DialogPortal = DialogPortal$1;
var DialogClose = DialogClose$1;
var DialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
	ref,
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props
}));
DialogOverlay.displayName = DialogOverlay$1.displayName;
var DialogContent = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose$1, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	})]
})] }));
DialogContent.displayName = DialogContent$1.displayName;
var DialogHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className),
	...props
});
DialogHeader.displayName = "DialogHeader";
var DialogFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
DialogFooter.displayName = "DialogFooter";
var DialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
	ref,
	className: cn("text-lg font-semibold leading-none tracking-tight", className),
	...props
}));
DialogTitle.displayName = DialogTitle$1.displayName;
var DialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
DialogDescription.displayName = DialogDescription$1.displayName;
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-sXMnYegW.js
/**
* Format a reward/earning/payout amount for display.
* Always shows exactly 3 decimal places with the currency symbol prefix.
* 
* Examples:
* - 0.175 -> "$0.175"
* - 0.2 -> "$0.200"
* - 2.5 -> "$2.500"
* - 0 -> "$0.000"
* 
* @param amount - The numeric amount to format
* @returns Formatted string with currency symbol and 3 decimals
*/
function formatReward(amount) {
	return `\$${amount.toFixed(3)}`;
}
/**
* Fallback APK served when a store listing is unavailable.
*
* Drop the signed build at `public/cashgpt-latest.apk` (or point this at the
* CDN/GitHub release URL) — nothing else needs to change.
*/
var APK_DOWNLOAD_URL = "/cashgpt-latest.apk";
/**
* The 8 earning methods, in the order they appear in the app.
*
* Each `image` is already a finished tile — the number badge, title and subtitle
* are part of the artwork — so the UI must not draw those a second time.
* `title`/`subtitle` are kept here for alt text.
*
* `crop` values are derived from the measured artwork bounds in each file. The
* 1280x714 uploads carry a wide black border; the 579x580 ones are already tight
* (hence the pass-through 100 / 0 / 0).
*/
var EARN_WAYS = [
	{
		number: "01",
		image: "/landing/earn-icons/01-ads.webp",
		title: "Ads",
		subtitle: "Watch & Earn",
		crop: {
			widthPct: 238.36,
			leftPct: -70.76,
			topPct: -17.32
		}
	},
	{
		number: "02",
		image: "/landing/earn-icons/02-shortlinks.webp",
		title: "Shortlinks",
		subtitle: "Visit & Earn",
		crop: {
			widthPct: 100,
			leftPct: 0,
			topPct: 0
		}
	},
	{
		number: "03",
		image: "/landing/earn-icons/03-locker.webp",
		title: "Locker",
		subtitle: "Unlock & Earn",
		crop: {
			widthPct: 100,
			leftPct: 0,
			topPct: 0
		}
	},
	{
		number: "04",
		image: "/landing/earn-icons/04-survey.webp",
		title: "Survey",
		subtitle: "Share & Earn",
		crop: {
			widthPct: 100,
			leftPct: 0,
			topPct: 0
		}
	},
	{
		number: "05",
		image: "/landing/earn-icons/05-appinstall.webp",
		title: "App Install",
		subtitle: "Install & Earn",
		crop: {
			widthPct: 237.92,
			leftPct: -70.63,
			topPct: -17.29
		}
	},
	{
		number: "06",
		image: "/landing/earn-icons/06-task.webp",
		title: "Task",
		subtitle: "Complete & Earn",
		crop: {
			widthPct: 100,
			leftPct: 0,
			topPct: 0
		}
	},
	{
		number: "07",
		image: "/landing/earn-icons/07-deal.webp",
		title: "Deal offer",
		subtitle: "Claim & Earn",
		crop: {
			widthPct: 238.36,
			leftPct: -70.95,
			topPct: -17.69
		}
	},
	{
		number: "08",
		image: "/landing/earn-icons/08-games.webp",
		title: "Games",
		subtitle: "Play & Earn",
		crop: {
			widthPct: 242.42,
			leftPct: -67.42,
			topPct: -14.96
		}
	}
];
/** Sample payouts shown on the landing page. Static art, not the live offer feed. */
var SHOWCASE_OFFERS = [
	{
		id: "virtual-number",
		image: "/landing/offers/virtual-number.webp",
		title: "Virtual Number",
		description: "Verify a number, get paid",
		payout: "$5",
		rewardAmount: 5,
		crop: {
			widthPct: 123.83,
			leftPct: -12.18,
			topPct: -15.38
		}
	},
	{
		id: "netflix",
		image: "/landing/offers/netflix.webp",
		title: "Netflix Trial",
		description: "Start a free trial, keep the cash",
		payout: "$5",
		rewardAmount: 5,
		crop: {
			widthPct: 100,
			leftPct: 0,
			topPct: -.17
		}
	},
	{
		id: "ai-tool",
		image: "/landing/offers/ai-tool.webp",
		title: "AI Tool Signup",
		description: "Sign up free, earn in minutes",
		payout: "$7",
		rewardAmount: 7,
		crop: {
			widthPct: 125.95,
			leftPct: -13.05,
			topPct: -23.28
		}
	}
];
var HOW_IT_WORKS = [
	{
		number: "1",
		title: "Download",
		description: "Install CashGPT and create your account in under a minute. No fees, ever."
	},
	{
		number: "2",
		title: "Complete Tasks",
		description: "Watch, play, survey or claim offers. Rewards land in your wallet as you go."
	},
	{
		number: "3",
		title: "Cash Out",
		description: "Withdraw to PayPal, crypto or gift cards from just $5. Your money, your way."
	}
];
var TESTIMONIALS = [
	{
		avatarId: "sunny",
		name: "Aarav M.",
		quote: "Cleared my first $12 in about a week, mostly on surveys during my commute. PayPal payout landed the same evening."
	},
	{
		avatarId: "ribbit",
		name: "Leah K.",
		quote: "I was fully expecting the withdrawal to be a hassle. It wasn't — $5 to my UPI, no questions asked."
	},
	{
		avatarId: "byte",
		name: "Daniel O.",
		quote: "The game offers are the ones that stuck for me. Genuinely fun, and the payouts are bigger than I assumed."
	}
];
/**
* Per-store modal copy. Deliberately worded differently for each store so the
* two popups don't read like the same canned message.
*/
var STORE_COPY = {
	play: {
		title: "Play Store listing is under review",
		message: "Our Google Play page is going through a routine review right now, so the install button is paused for a short while. It should be live again within a day or two — thanks for bearing with us. In the meantime you can install the same build directly below."
	},
	appstore: {
		title: "iOS app is almost here",
		message: "The App Store build is still with Apple's review team, so there's nothing to tap through to just yet. We'll flip it on the moment it clears. If you're on Android, the direct download below gets you earning today."
	}
};
var LANDING_TITLE = "CashGPT — Earn Real Money Online With Free Tasks & Offers";
var LANDING_DESCRIPTION = "Earn real cash online with CashGPT. Complete free offers, surveys, games and app installs, then withdraw to PayPal, UPI, crypto or gift cards from just $5. Free to join.";
/**
* How it works on the web, where the first step is signing up rather than
* installing. The app page keeps its own download-first wording in HOW_IT_WORKS.
*/
var WEB_HOW_IT_WORKS = [
	{
		number: "1",
		title: "Sign up",
		description: "Create a free account with your email in under a minute. No fees and no card details, ever."
	},
	{
		number: "2",
		title: "Complete tasks",
		description: "Pick from offers, surveys, games, app installs and more. Every completed task credits your wallet."
	},
	{
		number: "3",
		title: "Withdraw to your wallet",
		description: "Cash out to PayPal, UPI, crypto or gift cards once you reach the $5 minimum. Your balance, your choice."
	}
];
/** Short FAQ covering the questions that actually block signups. */
var FAQ_ITEMS = [
	{
		question: "How do I get paid?",
		answer: "You choose. CashGPT pays out to PayPal, UPI, crypto (USDT or Litecoin) and gift cards. Your balance is held in your in-app wallet until you request a withdrawal."
	},
	{
		question: "How long does a withdrawal take?",
		answer: "Most payouts are processed within 24 hours of your request. Some methods clear sooner; larger amounts can take a little longer if they need a manual review."
	},
	{
		question: "Is CashGPT free to use?",
		answer: "Yes. Creating an account and completing tasks is completely free, and we never take a cut of what you earn. You only ever need to cover the payment provider's own fees, if any apply to your chosen method."
	},
	{
		question: "Is it safe to use?",
		answer: "We never ask for your bank login or card details, and you only share what a given offer needs. Accounts are secured through Supabase authentication, and you can read exactly how your data is handled in our privacy policy."
	},
	{
		question: "Can I advertise my app or offer on CashGPT?",
		answer: "Yes. Create a free account, switch to Advertise mode and set up a campaign. Members complete your task and you are only charged for completed tasks. Each new campaign is reviewed by our team, usually within one business day."
	},
	{
		question: "What is the minimum payout?",
		answer: "$5. Some payout methods can have a higher minimum depending on region, see our Withdrawal Policy."
	}
];
/**
* Reusable main-section heading: a compact light-green icon badge on the left,
* emerald premium title with a subtle brush accent + tasteful sparkle, and an
* optional subtitle / right-aligned action. Left-aligned, mobile-first.
*/
function SectionHeading({ icon: Icon, iconSrc, title, subtitle, action, size = "section", variant = "default", className = "" }) {
	const isPage = size === "page";
	const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
	if (variant === "ribbon") {
		const bubbleSize = isPage ? "size-14" : "size-12";
		const bubbleIconSize = isPage ? "size-[1.6rem]" : "size-[1.35rem]";
		const ribbonTuck = isPage ? "-ml-6" : "-ml-5";
		const ribbonPad = isPage ? "py-2.5 pl-8 pr-6" : "py-2 pl-7 pr-5";
		const ribbonRound = "rounded-full";
		const titleSize = isPage ? "text-[17px]" : "text-[15px]";
		const subtitleIndent = isPage ? "pl-16" : "pl-14";
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			"data-testid": `section-heading-${slug}`,
			className: `${isPage ? "mb-3 mt-2" : "mb-3 mt-6"} ${className}`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-between gap-x-3 gap-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `flex min-w-0 items-center ${action ? "flex-1 basis-[13.5rem]" : ""}`.trim(),
					children: [iconSrc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: iconSrc,
						alt: "",
						"aria-hidden": true,
						"data-testid": `section-heading-${slug}-icon`,
						className: "relative z-20 size-9 shrink-0 rounded-xl object-contain shadow-sm",
						decoding: "async",
						loading: "lazy",
						width: 36,
						height: 36
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-hidden": true,
						"data-testid": `section-heading-${slug}-icon`,
						className: `relative z-20 grid ${bubbleSize} shrink-0 place-items-center rounded-2xl bg-card shadow-soft ring-1 ring-inset ring-mint/35`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
							className: `${bubbleIconSize} text-primary`,
							strokeWidth: 2.25
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `section-ribbon relative z-10 ${ribbonTuck} inline-flex min-w-0 items-center overflow-hidden ${ribbonRound} bg-jade-gradient ${ribbonPad}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: `truncate ${titleSize} uppercase leading-none tracking-[0.03em] text-primary-foreground`,
							style: {
								fontFamily: "var(--font-section)",
								fontWeight: 700
							},
							children: title
						})
					})]
				}), action ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "ms-auto shrink-0",
					children: action
				}) : null]
			}), subtitle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: `mt-2 ${subtitleIndent} text-xs leading-snug text-muted-foreground`,
				children: subtitle
			}) : null]
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": `section-heading-${slug}`,
		className: `flex items-center justify-between gap-3 ${isPage ? "mt-2 mb-3" : "mt-6 mb-3"} ${className}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-w-0 items-center gap-3",
			children: [iconSrc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: iconSrc,
				alt: "",
				"aria-hidden": true,
				"data-testid": `section-heading-${slug}-icon`,
				className: "size-9 shrink-0 rounded-xl object-contain shadow-sm",
				decoding: "async",
				loading: "lazy",
				width: 36,
				height: 36
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				"aria-hidden": true,
				className: `relative grid shrink-0 place-items-center rounded-full bg-mint/15 text-primary shadow-soft ring-1 ring-inset ring-mint/30 ${isPage ? "size-11" : "size-10"}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
					className: isPage ? "size-5" : "size-[1.15rem]",
					strokeWidth: 2.25
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "inline-flex items-center gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "relative inline-block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: `leading-tight text-primary ${isPage ? "text-xl" : "text-lg"}`,
							style: {
								fontFamily: "var(--font-section)",
								fontWeight: 700
							},
							children: title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
							"aria-hidden": true,
							viewBox: "0 0 120 12",
							fill: "none",
							preserveAspectRatio: "none",
							className: "pointer-events-none absolute -bottom-1 left-0 h-2.5 w-full",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
								id: `sh-underline-${slug}`,
								x1: "0",
								y1: "0",
								x2: "1",
								y2: "0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
										offset: "0%",
										stopColor: "var(--mint)"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
										offset: "55%",
										stopColor: "var(--mint)"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
										offset: "100%",
										stopColor: "var(--gold-dark)"
									})
								]
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								d: "M2 8C28 3 62 3 118 6",
								stroke: `url(#sh-underline-${slug})`,
								strokeWidth: "3.5",
								strokeLinecap: "round"
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
						className: "size-4 shrink-0 text-gold-dark drop-shadow-[0_1px_1px_rgba(0,0,0,0.12)]",
						style: { animation: "sh-sparkle 2.4s ease-in-out infinite" },
						"aria-hidden": true
					})]
				}), subtitle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 truncate text-xs text-muted-foreground",
					children: subtitle
				}) : null]
			})]
		}), action ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "shrink-0",
			children: action
		}) : null]
	});
}
var styles_default = "/assets/styles-1kaex3vn.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
	const message = error instanceof Response ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}` : error instanceof Error ? error.message : String(error);
	const stack = error instanceof Error ? error.stack : void 0;
	window.__lovableReportRuntimeError?.({
		message,
		...stack !== void 0 && { stack },
		filename: window.location.pathname
	});
}
/** `useLayoutEffect` warns during SSR, so fall back to `useEffect` on the server. */
var useIsomorphicLayoutEffect = typeof window !== "undefined" ? import_react.useLayoutEffect : import_react.useEffect;
/**
* True inside the Capacitor native shell, false on the web.
*
* Starts `false` so the server render and the first client render agree — the
* Capacitor global is injected into the WebView and can't be read during SSR, and
* assuming "web" is what lets the marketing landing be server-rendered for search
* engines. On native it corrects in a layout effect, which runs before the browser
* paints, so the packaged app never shows a frame of web-only UI.
*/
function useIsNative() {
	const [native, setNative] = (0, import_react.useState)(false);
	useIsomorphicLayoutEffect(() => {
		setNative(isNativePlatform());
	}, []);
	return native;
}
/**
* Analytics hooks for tracking user events
*/
/**
* Track session start on mount
* Fires once per session when the app first loads
*/
function useSessionStart() {
	const hasTracked = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		if (hasTracked.current) return;
		hasTracked.current = true;
	}, []);
}
/**
* Track page views on route changes
* Fires whenever the user navigates to a new page
*/
function usePageViewTracking() {
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const previousPathname = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (previousPathname.current === pathname) return;
		previousPathname.current;
		previousPathname.current = pathname;
	}, [pathname]);
}
/**
* Track app going to background
* Fires when visibility changes to hidden
*/
function useAppBackgroundTracking() {
	(0, import_react.useEffect)(() => {
		const handleVisibilityChange = () => {
			if (document.visibilityState === "hidden");
		};
		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
	}, []);
}
/**
* Global error tracking for client errors
* Tracks unhandled errors and promise rejections
*/
function useClientErrorTracking() {
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	(0, import_react.useEffect)(() => {
		const handleError = (event) => {
			let message = event.message || "Unknown error";
			message = message.replace(/\d+/g, "");
			message = message.replace(/\S+@\S+\.\S+/g, "");
			message = message.replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, "");
			message = message.replace(/[a-zA-Z0-9_-]{20,}/g, "");
			message = message.substring(0, 200);
			message.trim();
		};
		const handleUnhandledRejection = (event) => {
			let message = "Promise rejection";
			if (event.reason instanceof Error) message = event.reason.message;
			else if (typeof event.reason === "string") message = event.reason;
			message = message.replace(/\d+/g, "");
			message = message.replace(/\S+@\S+\.\S+/g, "");
			message = message.replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, "");
			message = message.replace(/[a-zA-Z0-9_-]{20,}/g, "");
			message = message.substring(0, 200);
			message.trim();
		};
		window.addEventListener("error", handleError);
		window.addEventListener("unhandledrejection", handleUnhandledRejection);
		return () => {
			window.removeEventListener("error", handleError);
			window.removeEventListener("unhandledrejection", handleUnhandledRejection);
		};
	}, [pathname]);
}
var ViewedOfferContext = (0, import_react.createContext)({
	viewedOffer: null,
	setViewedOffer: () => {},
	clearViewedOffer: () => {},
	assistantOpenRequested: false,
	requestAssistantOpen: () => {},
	consumeAssistantOpen: () => {}
});
function ViewedOfferProvider({ children }) {
	const [viewedOffer, setOffer] = (0, import_react.useState)(null);
	const [assistantOpenRequested, setAssistantOpenRequested] = (0, import_react.useState)(false);
	const setViewedOffer = (0, import_react.useCallback)((offer) => setOffer(offer), []);
	const clearViewedOffer = (0, import_react.useCallback)(() => setOffer(null), []);
	const requestAssistantOpen = (0, import_react.useCallback)(() => setAssistantOpenRequested(true), []);
	const consumeAssistantOpen = (0, import_react.useCallback)(() => setAssistantOpenRequested(false), []);
	const value = (0, import_react.useMemo)(() => ({
		viewedOffer,
		setViewedOffer,
		clearViewedOffer,
		assistantOpenRequested,
		requestAssistantOpen,
		consumeAssistantOpen
	}), [
		viewedOffer,
		setViewedOffer,
		clearViewedOffer,
		assistantOpenRequested,
		requestAssistantOpen,
		consumeAssistantOpen
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ViewedOfferContext.Provider, {
		value,
		children
	});
}
function useViewedOffer() {
	return (0, import_react.useContext)(ViewedOfferContext);
}
/**
* Bottom tabs. "Task" now opens the Microtasks marketplace; the original
* quest/task system lives unchanged under "Special" (/special). Support moved
* out of the nav — it is reachable from the Home header and the Profile screen.
*/
var TABS = [
	{
		to: "/home",
		label: "Home",
		iconSrc: "/icons/icon-home.webp"
	},
	{
		to: "/offers",
		label: "Offers",
		iconSrc: "/icons/icon-offers.webp"
	},
	{
		to: "/task",
		label: "Task",
		iconSrc: "/icons/icon-your-task.webp"
	},
	{
		to: "/special",
		label: "Special",
		iconSrc: "/icons/icon-starter-quest.webp"
	},
	{
		to: "/refer",
		label: "Refer",
		iconSrc: "/icons/icon-referral.webp"
	}
];
function BottomNav() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		className: "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/97 md:bg-card/95 md:backdrop-blur-md",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mx-auto flex w-full max-w-lg items-stretch justify-between px-2 py-1.5",
			children: TABS.map(({ to, label, iconSrc }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
				className: "flex-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to,
					className: "group flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-muted-foreground transition-colors data-[status=active]:text-primary",
					activeProps: { className: "bg-background-alt" },
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: iconSrc,
						alt: "",
						"aria-hidden": true,
						"data-testid": `bottom-nav-${label.toLowerCase()}-icon`,
						className: "size-9 object-contain transition-transform group-data-[status=active]:scale-110",
						decoding: "async"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[11px] font-semibold",
						children: label
					})]
				})
			}, to))
		})
	});
}
var Checkbox = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox$1, {
	ref,
	className: cn("grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckboxIndicator, {
		className: cn("grid place-content-center text-current"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" })
	})
}));
Checkbox.displayName = Checkbox$1.displayName;
var Input = import_react.forwardRef(({ className, type, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		className: cn("flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props
	});
});
Input.displayName = "Input";
var labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");
var Label = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label$1, {
	ref,
	className: cn(labelVariants(), className),
	...props
}));
Label.displayName = Label$1.displayName;
/**
* "Become an Advertiser" — creates the advertiser account (Phase 1
* advertiser_accounts row) and switches the app into advertiser mode.
*/
function BecomeAdvertiserDialog({ open, onOpenChange }) {
	const { profile, session } = useAuth();
	const { setRole, refreshOverview, overview } = useRole();
	const activate = useServerFn(becomeAdvertiser);
	const [displayName, setDisplayName] = (0, import_react.useState)(profile?.name ?? "");
	const [contactEmail, setContactEmail] = (0, import_react.useState)(session?.user.email ?? "");
	const [websiteUrl, setWebsiteUrl] = (0, import_react.useState)("");
	const [accepted, setAccepted] = (0, import_react.useState)(false);
	const mutation = useMutation({
		mutationFn: () => activate({ data: {
			displayName: displayName.trim(),
			contactEmail: contactEmail.trim() || null,
			websiteUrl: websiteUrl.trim() || null,
			acceptTerms: true
		} }),
		onSuccess: async ({ created }) => {
			await refreshOverview();
			setRole("advertiser");
			onOpenChange(false);
			if (created && session?.user.id) safeStorage.setItem(advertiserOnboardingActivationKey(session.user.id), (/* @__PURE__ */ new Date()).toISOString());
			toast.success(created ? "You're an advertiser now" : "Advertiser mode on", { description: created ? "Add Campaign Funds to launch your first task." : void 0 });
		},
		onError: (err) => {
			toast.error("Couldn't activate advertiser mode", { description: err instanceof Error ? err.message.replace(/^[A-Z_]+: /, "") : void 0 });
		}
	});
	const canSubmit = displayName.trim().length >= 2 && accepted && !mutation.isPending;
	const terms = overview?.settings.termsVersion ?? "v1";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-sm rounded-3xl",
			"data-testid": "become-advertiser-dialog",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-9 place-items-center rounded-xl bg-sky-500/10",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Megaphone, { className: "size-4 text-sky-700" })
				}), "Become an Advertiser"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Create campaigns that CashGPT members complete for you. You only pay when a task is completed." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "space-y-3",
				onSubmit: (e) => {
					e.preventDefault();
					if (canSubmit) mutation.mutate();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "adv-name",
							children: "Brand or business name"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "adv-name",
							value: displayName,
							maxLength: 60,
							onChange: (e) => setDisplayName(e.target.value),
							placeholder: "e.g. Coin Rush Games",
							required: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "adv-email",
							children: "Contact email"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "adv-email",
							type: "email",
							value: contactEmail,
							onChange: (e) => setContactEmail(e.target.value),
							placeholder: "you@company.com"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
							htmlFor: "adv-site",
							children: ["Website ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground",
								children: "(optional)"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "adv-site",
							type: "url",
							value: websiteUrl,
							onChange: (e) => setWebsiteUrl(e.target.value),
							placeholder: "https://"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-start gap-2 rounded-xl bg-background-alt p-3 text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
							checked: accepted,
							onCheckedChange: (v) => setAccepted(v === true),
							"data-testid": "adv-terms",
							className: "mt-0.5"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							"I accept the Advertiser Terms (",
							terms,
							"). Campaign deposits are non-refundable once spent; unused balance stays in my Campaign Balance."
						] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						variant: "jade",
						size: "lg",
						className: "w-full",
						disabled: !canSubmit,
						"data-testid": "adv-activate",
						children: mutation.isPending ? "Activating…" : "Activate advertiser mode"
					}) })
				]
			})]
		})
	});
}
/**
* Set by the landing page's advertiser promo so that, after the visitor's first
* sign-in, the app can open "Become an Advertiser" for them.
*/
var ADVERTISER_INTENT_KEY = "cashgpt.intent";
function rememberAdvertiserIntent() {
	safeStorage.setItem(ADVERTISER_INTENT_KEY, "advertiser");
}
function hasAdvertiserIntent() {
	return safeStorage.getItem(ADVERTISER_INTENT_KEY) === "advertiser";
}
function clearAdvertiserIntent() {
	safeStorage.removeItem(ADVERTISER_INTENT_KEY);
}
/** Segmented mode switcher shown at the top of the Home content. */
function RoleSwitcher() {
	const { role, setRole, advertiserActivated, marketplaceAvailable, overviewLoading } = useRole();
	const [dialogOpen, setDialogOpen] = (0, import_react.useState)(false);
	const isAdvertiser = role === "advertiser";
	(0, import_react.useEffect)(() => {
		if (overviewLoading || !hasAdvertiserIntent()) return;
		if (advertiserActivated) clearAdvertiserIntent();
		else if (marketplaceAvailable) {
			clearAdvertiserIntent();
			setDialogOpen(true);
		}
	}, [
		overviewLoading,
		advertiserActivated,
		marketplaceAvailable
	]);
	const handleAdvertise = () => {
		if (advertiserActivated) setRole("advertiser");
		else if (marketplaceAvailable && !overviewLoading) setDialogOpen(true);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "role-switcher",
		role: "radiogroup",
		"aria-label": "Switch mode",
		className: "relative flex h-10 w-full rounded-full border border-border bg-background-alt p-1 shadow-none",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				"aria-hidden": "true",
				className: `pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full shadow-soft transition-transform duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${isAdvertiser ? "translate-x-full bg-sky-600" : "bg-primary"}`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				role: "radio",
				"aria-checked": !isAdvertiser,
				"data-testid": "role-option-publisher",
				className: `relative z-10 flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold leading-none transition-colors active:scale-[0.99] ${isAdvertiser ? "text-muted-foreground" : "text-primary-foreground"}`,
				onClick: () => setRole("publisher"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, {
					"aria-hidden": "true",
					className: "size-4"
				}), "Earn"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				role: "radio",
				"aria-checked": isAdvertiser,
				"aria-disabled": !advertiserActivated && !marketplaceAvailable,
				"data-testid": "role-option-advertiser",
				disabled: !advertiserActivated && !marketplaceAvailable,
				className: `relative z-10 flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold leading-none transition-colors active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${isAdvertiser ? "text-white" : "text-muted-foreground"}`,
				onClick: handleAdvertise,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Megaphone, {
						"aria-hidden": "true",
						className: "size-4"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Advertise" }),
					!advertiserActivated && !marketplaceAvailable && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] font-medium uppercase tracking-wide",
						children: "Soon"
					})
				]
			})
		]
	}), dialogOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BecomeAdvertiserDialog, {
		open: true,
		onOpenChange: setDialogOpen
	})] });
}
/**
* Global token store for Active Time Quest
* 
* Stores the ping token both in memory (for fast access) and localStorage
* (for persistence across app restarts). This ensures the token chain is maintained
* even when the user closes and reopens the app.
*/
var STORAGE_KEY = "active_time_ping_token";
var ActiveTimeTokenStore = class {
	token = null;
	questKey = null;
	constructor() {
		if (typeof window !== "undefined") try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				this.token = parsed.token;
				this.questKey = parsed.questKey;
			}
		} catch (err) {
			console.error("[token-store] Failed to restore from localStorage:", err);
		}
	}
	/**
	* Get the current token for a quest
	*/
	getToken(questKey) {
		if (this.questKey === questKey) return this.token;
		return null;
	}
	/**
	* Set a new token for a quest
	*/
	setToken(questKey, token) {
		this.questKey = questKey;
		this.token = token;
		if (typeof window !== "undefined") try {
			if (token) localStorage.setItem(STORAGE_KEY, JSON.stringify({
				questKey,
				token
			}));
			else localStorage.removeItem(STORAGE_KEY);
		} catch (err) {
			console.error("[token-store] Failed to save to localStorage:", err);
		}
	}
	/**
	* Clear the token for a quest
	*/
	clearToken(questKey) {
		if (this.questKey === questKey) {
			this.token = null;
			this.questKey = null;
			if (typeof window !== "undefined") try {
				localStorage.removeItem(STORAGE_KEY);
			} catch (err) {
				console.error("[token-store] Failed to remove from localStorage:", err);
			}
		}
	}
};
var activeTimeTokenStore = new ActiveTimeTokenStore();
var PING_INTERVAL_MS = 3e4;
var INACTIVITY_THRESHOLD_MS = 6e4;
var LOCAL_TICK_INTERVAL_MS = 1e3;
var ActiveTimeContext = (0, import_react.createContext)(null);
function useActiveTime() {
	const context = (0, import_react.useContext)(ActiveTimeContext);
	if (!context) return {
		state: null,
		startTracking: () => {},
		stopTracking: () => {},
		confirmStillHere: () => {}
	};
	return context;
}
/**
* Global Active Time Provider
* 
* Mounted once in authenticated layout, survives all navigation.
* - Fetches initial total_seconds from server on first start
* - Ticks locally every second for UI display
* - Syncs with server every 30s via ping
* - On ping response, overwrites local value with server total_seconds
* - Token stored in global store + sessionStorage
*/
function ActiveTimeProvider({ children }) {
	const debug = typeof window !== "undefined" && window.location.search.includes("debug=1");
	const log = (msg, data) => {
		const timestamp = (/* @__PURE__ */ new Date()).toISOString().split("T")[1].slice(0, 12);
		console.log(`[${timestamp}] [ActiveTimeProvider]`, msg, data || "");
		if (debug && typeof window !== "undefined") {
			const panel = document.getElementById("active-time-debug") || (() => {
				const p = document.createElement("div");
				p.id = "active-time-debug";
				p.style.cssText = "position:fixed;top:10px;right:10px;background:black;color:lime;padding:10px;max-height:400px;overflow-y:auto;font-family:monospace;font-size:11px;z-index:99999;max-width:400px;border:2px solid lime;";
				document.body.appendChild(p);
				return p;
			})();
			panel.innerHTML += `<div>[${timestamp}] ${msg} ${JSON.stringify(data || "")}</div>`;
			panel.scrollTop = panel.scrollHeight;
		}
	};
	const [state, setState] = (0, import_react.useState)(null);
	const lastActivityRef = (0, import_react.useRef)(Date.now());
	const lastStillHereCheckRef = (0, import_react.useRef)(Date.now());
	const pingIntervalRef = (0, import_react.useRef)(null);
	const localTickIntervalRef = (0, import_react.useRef)(null);
	const stillHereIntervalRef = (0, import_react.useRef)(null);
	const isPingingRef = (0, import_react.useRef)(false);
	const hasStartedRef = (0, import_react.useRef)(false);
	const questKeyRef = (0, import_react.useRef)(null);
	const sendPingRef = (0, import_react.useRef)(null);
	const pingFn = useServerFn(processActiveTimePing);
	const getProgressFn = useServerFn(getQuestActiveTimeProgress);
	const recordActivity = (0, import_react.useCallback)(() => {
		const now = Date.now();
		const wasInactive = now - lastActivityRef.current > INACTIVITY_THRESHOLD_MS;
		lastActivityRef.current = now;
		if (wasInactive) log("Activity detected after inactivity");
		if (state?.isPaused) {
			log("Resuming from pause");
			setState((prev) => prev ? {
				...prev,
				isPaused: false,
				showStillHerePrompt: false
			} : null);
			lastStillHereCheckRef.current = now;
		}
		if (state?.showStillHerePrompt) {
			log("Dismissing still-here prompt");
			setState((prev) => prev ? {
				...prev,
				showStillHerePrompt: false
			} : null);
			lastStillHereCheckRef.current = now;
		}
	}, [state?.isPaused, state?.showStillHerePrompt]);
	sendPingRef.current = (0, import_react.useCallback)(async () => {
		const currentQuestKey = questKeyRef.current;
		if (!currentQuestKey) {
			log("Skipping ping - no quest key in ref");
			return;
		}
		if (isPingingRef.current) {
			log("Skipping ping - already in flight");
			return;
		}
		const now = Date.now();
		const isActive = now - lastActivityRef.current <= INACTIVITY_THRESHOLD_MS;
		const pingToken = activeTimeTokenStore.getToken(currentQuestKey);
		log("[active-time] ping sent", {
			questKey: currentQuestKey,
			hasToken: !!pingToken,
			tokenPreview: pingToken?.slice(0, 8) || "null",
			isActive
		});
		isPingingRef.current = true;
		try {
			const result = await pingFn({ data: {
				questKey: currentQuestKey,
				pingToken,
				isActive
			} });
			log("[active-time] ping result", {
				success: result.success,
				reason: result.reason,
				total: result.totalSeconds
			});
			if (result.nextToken) try {
				activeTimeTokenStore.setToken(currentQuestKey, result.nextToken);
				log("💾 Stored new token", { preview: result.nextToken.slice(0, 8) });
			} catch (err) {
				log("⚠️ Failed to store token", { error: err });
			}
			if (result.reason !== "quest_not_found") setState((prev) => {
				if (!prev) return null;
				const newState = {
					...prev,
					totalSeconds: result.totalSeconds,
					todaySeconds: result.todaySeconds,
					targetSeconds: result.targetSeconds,
					canClaim: result.canClaim,
					progressPercent: Math.min(100, result.totalSeconds / result.targetSeconds * 100),
					lastServerSync: now
				};
				if (result.success) newState.error = null;
				else if (result.reason === "invalid_token") newState.error = "invalid_token_wait";
				else newState.error = result.reason || "ping_failed";
				return newState;
			});
			else setState((prev) => prev ? {
				...prev,
				error: "quest_not_found"
			} : null);
		} catch (error) {
			log("💥 PING ERROR", { error: error instanceof Error ? error.message : String(error) });
			setState((prev) => prev ? {
				...prev,
				error: error instanceof Error ? error.message : "network_error"
			} : null);
		} finally {
			isPingingRef.current = false;
		}
	}, [pingFn]);
	const tickLocal = (0, import_react.useCallback)(() => {}, []);
	const checkStillHere = (0, import_react.useCallback)(() => {
		const now = Date.now();
		const timeSinceLastCheck = now - lastStillHereCheckRef.current;
		const timeSinceActivity = now - lastActivityRef.current;
		if (timeSinceLastCheck >= 6e5 && timeSinceActivity >= INACTIVITY_THRESHOLD_MS) {
			setState((prev) => prev ? {
				...prev,
				showStillHerePrompt: true
			} : null);
			lastStillHereCheckRef.current = now;
			setTimeout(() => {
				if (Date.now() - lastActivityRef.current >= INACTIVITY_THRESHOLD_MS) setState((prev) => prev ? {
					...prev,
					isPaused: true,
					showStillHerePrompt: false
				} : null);
			}, INACTIVITY_THRESHOLD_MS);
		}
	}, []);
	const startTracking = (0, import_react.useCallback)(async (questKey) => {
		log("🚀 startTracking called", {
			questKey,
			hasStarted: hasStartedRef.current
		});
		if (hasStartedRef.current && questKeyRef.current === questKey) {
			log("⚠️  Already started for this quest - ignoring");
			return;
		}
		if (questKeyRef.current && questKeyRef.current !== questKey) {
			log("Switching quests - stopping previous");
			if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
			if (localTickIntervalRef.current) clearInterval(localTickIntervalRef.current);
			if (stillHereIntervalRef.current) clearInterval(stillHereIntervalRef.current);
			hasStartedRef.current = false;
		}
		hasStartedRef.current = true;
		questKeyRef.current = questKey;
		let initialTotal = 0;
		let initialToday = 0;
		let initialTarget = 7200;
		try {
			log("📖 Reading initial progress from DB");
			const progressResult = await getProgressFn({ data: { questKey } });
			if (progressResult) {
				log("Found existing progress", progressResult);
				initialTotal = progressResult.totalSeconds;
				initialTarget = progressResult.targetSeconds;
				const nowUtc = /* @__PURE__ */ new Date();
				const todayUtc = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate()));
				if ((/* @__PURE__ */ new Date(progressResult.todayDate + "T00:00:00Z")).getTime() === todayUtc.getTime()) {
					initialToday = progressResult.todaySeconds;
					log("Today's date matches - using today_seconds", { initialToday });
				} else {
					initialToday = 0;
					log("Today's date differs - resetting today_seconds to 0");
				}
			} else log("No existing progress found - starting from 0");
		} catch (error) {
			log("⚠️ Failed to read initial progress", { error });
		}
		setState({
			questKey,
			totalSeconds: initialTotal,
			todaySeconds: initialToday,
			targetSeconds: initialTarget,
			canClaim: initialTotal >= initialTarget,
			isTracking: true,
			isPaused: false,
			showStillHerePrompt: false,
			error: null,
			waitingForResync: false,
			lastServerSync: null,
			progressPercent: Math.min(100, initialTotal / initialTarget * 100)
		});
		lastActivityRef.current = Date.now();
		lastStillHereCheckRef.current = Date.now();
		log("⏱️  Scheduling first ping in 100ms");
		setTimeout(() => {
			if (hasStartedRef.current && sendPingRef.current) {
				log("📡 Sending first ping now");
				sendPingRef.current();
			}
		}, 100);
		if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
		pingIntervalRef.current = setInterval(() => {
			if (sendPingRef.current) {
				log("⏰ Interval tick - sending ping");
				sendPingRef.current();
			}
		}, PING_INTERVAL_MS);
		if (localTickIntervalRef.current) clearInterval(localTickIntervalRef.current);
		localTickIntervalRef.current = setInterval(tickLocal, LOCAL_TICK_INTERVAL_MS);
		if (stillHereIntervalRef.current) clearInterval(stillHereIntervalRef.current);
		stillHereIntervalRef.current = setInterval(checkStillHere, 6e4);
		log("✅ Tracking started", {
			questKey,
			initialTotal,
			initialToday,
			initialTarget,
			pingInterval: PING_INTERVAL_MS
		});
	}, [
		tickLocal,
		checkStillHere,
		getProgressFn
	]);
	const stopTracking = (0, import_react.useCallback)(() => {
		log("🛑 Stopping tracking");
		setState((prev) => prev ? {
			...prev,
			isTracking: false,
			isPaused: false,
			showStillHerePrompt: false
		} : null);
		if (pingIntervalRef.current) {
			clearInterval(pingIntervalRef.current);
			pingIntervalRef.current = null;
		}
		if (localTickIntervalRef.current) {
			clearInterval(localTickIntervalRef.current);
			localTickIntervalRef.current = null;
		}
		if (stillHereIntervalRef.current) {
			clearInterval(stillHereIntervalRef.current);
			stillHereIntervalRef.current = null;
		}
		hasStartedRef.current = false;
		isPingingRef.current = false;
	}, []);
	const confirmStillHere = (0, import_react.useCallback)(() => {
		recordActivity();
	}, [recordActivity]);
	(0, import_react.useEffect)(() => {
		if (!state?.isTracking) return;
		log("Setting up activity listeners");
		const events = [
			"mousedown",
			"keydown",
			"touchstart",
			"scroll",
			"wheel"
		];
		const handler = () => {
			recordActivity();
		};
		events.forEach((event) => {
			window.addEventListener(event, handler, { passive: true });
		});
		return () => {
			log("Removing activity listeners");
			events.forEach((event) => {
				window.removeEventListener(event, handler);
			});
		};
	}, [state?.isTracking, recordActivity]);
	(0, import_react.useEffect)(() => {
		return () => {
			if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
			if (localTickIntervalRef.current) clearInterval(localTickIntervalRef.current);
			if (stillHereIntervalRef.current) clearInterval(stillHereIntervalRef.current);
		};
	}, []);
	const value = {
		state,
		startTracking,
		stopTracking,
		confirmStillHere
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActiveTimeContext.Provider, {
		value,
		children
	});
}
var AlertDialog = AlertDialog$1;
var AlertDialogPortal = AlertDialogPortal$1;
var AlertDialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogOverlay$1, {
	className: cn("fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props,
	ref
}));
AlertDialogOverlay.displayName = AlertDialogOverlay$1.displayName;
var AlertDialogContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogContent$1, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props
})] }));
AlertDialogContent.displayName = AlertDialogContent$1.displayName;
var AlertDialogHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-2 text-center sm:text-left", className),
	...props
});
AlertDialogHeader.displayName = "AlertDialogHeader";
var AlertDialogFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
AlertDialogFooter.displayName = "AlertDialogFooter";
var AlertDialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle$1, {
	ref,
	className: cn("text-lg font-semibold", className),
	...props
}));
AlertDialogTitle.displayName = AlertDialogTitle$1.displayName;
var AlertDialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription$1, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
AlertDialogDescription.displayName = AlertDialogDescription$1.displayName;
var AlertDialogAction = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction$1, {
	ref,
	className: cn(buttonVariants(), className),
	...props
}));
AlertDialogAction.displayName = AlertDialogAction$1.displayName;
var AlertDialogCancel = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel$1, {
	ref,
	className: cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className),
	...props
}));
AlertDialogCancel.displayName = AlertDialogCancel$1.displayName;
/**
* Modal that prompts user to confirm they're still actively using the app.
* Shown after 10 minutes of inactivity during active time quest tracking.
* If not confirmed within 60s, tracking pauses automatically.
*/
function ActiveTimeStillHereDialog({ open, onConfirm }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
		open,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "Still there?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, { children: "We haven't detected any activity for a while. Tap the button below to continue counting your active time." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
			onClick: onConfirm,
			children: "Yes, I'm here!"
		}) })] })
	});
}
/**
* Global quest tracking component that mounts tracking hooks for:
* - Active Time quests (pings every 30s while user is active)
* - Check-in quests (pings for daily active time requirement)
* 
* Automatically:
* - Starts tracking when user has an active quest
* - Stops when quest is completed
* - Updates browser timezone on mount
* - Shows "still here?" prompts for active time
* - Shows toast notifications on quest completion
* 
* Mount this component once in the authenticated app layout.
*/
function QuestTracking() {
	const { session } = useAuth();
	const queryClient = useQueryClient();
	const fetchActiveTimeKey = useServerFn(getActiveTimeQuestKey);
	const setTimezone = useServerFn(updateUserTimezone);
	console.log("[QuestTracking] Component mounted - tracking hooks active");
	(0, import_react.useEffect)(() => {
		if (!session) return;
		const detectAndUpdateTimezone = async () => {
			try {
				const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
				if (browserTimezone) {
					console.log("[QuestTracking] Updating user timezone to:", browserTimezone);
					await setTimezone({ data: { timezone: browserTimezone } });
				}
			} catch (err) {
				console.error("[QuestTracking] Failed to detect/update timezone:", err);
			}
		};
		detectAndUpdateTimezone();
	}, [session?.user.id]);
	const activeTimeQuestKey = useQuery({
		queryKey: ["active-time-quest-key", session?.user.id],
		enabled: Boolean(session),
		queryFn: () => fetchActiveTimeKey({ data: {} }),
		staleTime: 3e4,
		refetchInterval: 6e4,
		select: (data) => data.questKey
	});
	(0, import_react.useEffect)(() => {
		if (activeTimeQuestKey.data) console.log("[QuestTracking] Active time quest found for user:", activeTimeQuestKey.data);
	}, [activeTimeQuestKey.data]);
	useQuery({
		queryKey: ["active-time-progress", activeTimeQuestKey.data],
		enabled: Boolean(activeTimeQuestKey.data),
		queryFn: async () => {
			if (!activeTimeQuestKey.data) return null;
			const { data } = await supabase.from("quest_active_time_progress").select("last_ping_token, total_seconds, today_seconds").eq("user_id", session.user.id).eq("quest_key", activeTimeQuestKey.data).maybeSingle();
			console.log("[QuestTracking] Active time progress fetched:", data);
			return data;
		},
		staleTime: 1e4
	});
	const checkinQuests = useQuery({
		queryKey: ["checkin-quests", session?.user.id],
		enabled: Boolean(session),
		queryFn: async () => {
			const { data: sessions } = await supabase.from("quest_sessions").select(`
          quest_key,
          checkin_days:quest_checkin_days!inner(local_date, active_seconds, completed_at)
        `).eq("user_id", session.user.id).eq("quest_type", "checkin").order("started_at", { ascending: false });
			return sessions?.filter((s) => {
				return (s.checkin_days || []).some((d) => !d.completed_at);
			}).map((s) => ({
				questKey: s.quest_key,
				incompleteDay: s.checkin_days.find((d) => !d.completed_at)
			})) || [];
		},
		staleTime: 3e4,
		refetchInterval: 6e4
	});
	const activeTime = useActiveTime();
	(0, import_react.useEffect)(() => {
		if (activeTimeQuestKey.data && !activeTime.state?.isTracking) {
			console.log("[QuestTracking] Starting active time tracking for:", activeTimeQuestKey.data);
			activeTime.startTracking(activeTimeQuestKey.data);
		}
	}, [activeTimeQuestKey.data, activeTime.state?.isTracking]);
	(0, import_react.useEffect)(() => {
		if (activeTime.state?.isTracking) console.log("[QuestTracking] Active time tracking state:", {
			isTracking: activeTime.state.isTracking,
			isPaused: activeTime.state.isPaused,
			showStillHerePrompt: activeTime.state.showStillHerePrompt,
			totalSeconds: activeTime.state.totalSeconds,
			error: activeTime.state.error
		});
	}, [
		activeTime.state?.isTracking,
		activeTime.state?.isPaused,
		activeTime.state?.showStillHerePrompt,
		activeTime.state?.totalSeconds
	]);
	const firstCheckinQuest = checkinQuests.data?.[0];
	const checkinHeartbeat = useCheckinHeartbeat({
		questKey: firstCheckinQuest?.questKey || "",
		enabled: Boolean(firstCheckinQuest),
		onDayComplete: (data) => {
			console.log("[QuestTracking] Check-in day completed:", data);
			toast.success(data.stepReward ? `🎉 Check-in Day Complete! You earned ${data.stepReward} coins!` : "🎉 Check-in Day Complete! Keep your streak going!");
			queryClient.invalidateQueries({ queryKey: ["quest-sessions", session?.user.id] });
			queryClient.invalidateQueries({ queryKey: ["checkin-quests", session?.user.id] });
			queryClient.invalidateQueries({ queryKey: ["profile"] });
		}
	});
	(0, import_react.useEffect)(() => {
		if (firstCheckinQuest) console.log("[QuestTracking] Check-in heartbeat state:", {
			questKey: firstCheckinQuest.questKey,
			activeSeconds: checkinHeartbeat.activeSeconds,
			requiredSeconds: checkinHeartbeat.requiredSeconds,
			isPinging: checkinHeartbeat.isPinging
		});
	}, [
		firstCheckinQuest?.questKey,
		checkinHeartbeat.activeSeconds,
		checkinHeartbeat.requiredSeconds,
		checkinHeartbeat.isPinging
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: activeTime.state?.showStillHerePrompt && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActiveTimeStillHereDialog, {
		open: activeTime.state.showStillHerePrompt,
		onConfirm: activeTime.confirmStillHere
	}) });
}
function BrandMark({ className = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `inline-grid place-items-center overflow-hidden rounded-2xl bg-jade-gradient shadow-lift ${className || "size-10"}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: "/icon-128.webp",
			alt: "CashGPT",
			className: "h-full w-full object-cover",
			loading: "eager",
			decoding: "async"
		})
	});
}
/**
* Horizontal wordmark lockup. Pass variant="light" for light surfaces (cream/white),
* variant="dark" for dark/jade surfaces, or omit (default "auto") to swap via `prefers-color-scheme`.
*/
function BrandLogo({ variant = "auto", className = "" }) {
	if (variant === "light") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: "/logo-horizontal-light.webp",
		alt: "CashGPT — Earn · Complete · Cashout",
		className: `h-auto w-auto select-none ${className}`,
		draggable: false,
		decoding: "async"
	});
	if (variant === "dark") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: "/logo-horizontal-dark.webp",
		alt: "CashGPT — Earn · Complete · Cashout",
		className: `h-auto w-auto select-none ${className}`,
		draggable: false,
		decoding: "async"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("picture", {
		className: `inline-block ${className}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("source", {
			srcSet: "/logo-horizontal-dark.webp",
			media: "(prefers-color-scheme: dark)"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: "/logo-horizontal-light.webp",
			alt: "CashGPT — Earn · Complete · Cashout",
			className: "h-auto w-auto select-none",
			draggable: false,
			decoding: "async"
		})]
	});
}
function AppHeader({ subtitle, home = false }) {
	const { session, profile } = useAuth();
	const location = useLocation();
	const { role, overview } = useRole();
	const showCampaignBalance = location.pathname.startsWith("/advertiser");
	const unread = useQuery({
		queryKey: ["notifications-unread", session?.user.id],
		enabled: Boolean(session),
		queryFn: async () => {
			const { count } = await supabase.from("notifications").select("id", {
				count: "exact",
				head: true
			}).eq("is_read", false);
			return count ?? 0;
		}
	});
	const firstName = (profile?.name ?? "").trim().split(/\s+/)[0] || "there";
	const shownAvailable = useCountUp(Number(profile?.wallet_balance ?? 0) - Number(profile?.held_balance ?? 0), { onceKey: "header-balance" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "sticky top-0 z-30 border-b border-border/70 bg-background/97 md:bg-background/85 md:backdrop-blur-md",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex w-full max-w-lg items-center justify-between gap-2 px-4 py-3 sm:gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/profile",
				"aria-label": "Open profile and settings",
				className: "flex min-w-0 flex-1 items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					"aria-hidden": true,
					"data-testid": "app-header-avatar",
					className: "grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-card shadow-soft ring-1 ring-border",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: avatarById(profile?.avatar_url).imageUrl,
						alt: "",
						className: "size-full object-cover",
						loading: "eager",
						decoding: "async"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "block min-w-0 leading-tight",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-xs text-muted-foreground",
						children: "Hello"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block truncate font-display text-lg leading-tight",
						children: firstName
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex shrink-0 items-center gap-1.5 sm:gap-2",
				children: [
					home && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/support",
						"aria-label": "Help & Support",
						"data-testid": "home-support-icon",
						className: "grid size-9 place-items-center rounded-full border border-border bg-card shadow-soft sm:size-10",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Headset, { className: "size-4 text-primary" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/notifications",
						"aria-label": "Notifications",
						className: "relative grid size-9 place-items-center rounded-full border border-border bg-card shadow-soft sm:size-10",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "size-4 text-primary" }), (unread.data ?? 0) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground",
							children: unread.data
						})]
					}),
					showCampaignBalance ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/advertiser/funds",
						"aria-label": "Campaign balance",
						"data-testid": "campaign-balance-pill",
						className: "flex shrink-0 flex-col rounded-full bg-jade-gradient px-3 py-1.5 text-primary-foreground shadow-lift",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "whitespace-nowrap text-[9px] font-semibold uppercase leading-none tracking-wide opacity-80",
							children: "Campaign Balance"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-amount whitespace-nowrap text-sm leading-none",
							children: formatMoney(overview?.account?.spendable ?? 0)
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						id: "tour-wallet-balance",
						to: "/wallet",
						"aria-label": "Open wallet",
						className: "flex shrink-0 items-center rounded-full bg-gold-gradient px-3 py-2 text-gold-foreground shadow-gold",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-amount whitespace-nowrap text-sm",
							children: formatMoney(shownAvailable)
						})
					})
				]
			})]
		}), home && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto w-full max-w-lg px-4 py-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleSwitcher, {})
		})]
	});
}
function AppShell({ children, subtitle, hideNav = false, home = false, bgClass = "", mainClass = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `min-h-screen bg-background pb-24 ${bgClass}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuestTracking, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, {
				...subtitle ? { subtitle } : {},
				home
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: `mx-auto w-full max-w-lg px-4 py-4 ${mainClass}`,
				children
			}),
			!hideNav && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
/**
* Full-screen splash shown while the initial auth/session check is in-flight.
* Fades out once `loading` becomes false so the first real screen cross-fades in.
*/
function SplashScreen({ loading }) {
	const [visible, setVisible] = (0, import_react.useState)(true);
	const [hidden, setHidden] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!loading) {
			const fadeTimer = setTimeout(() => setVisible(false), 60);
			const unmountTimer = setTimeout(() => setHidden(true), 560);
			return () => {
				clearTimeout(fadeTimer);
				clearTimeout(unmountTimer);
			};
		}
		setVisible(true);
		setHidden(false);
	}, [loading]);
	if (hidden) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"aria-hidden": !loading,
		"data-testid": "splash-screen",
		className: `fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-500 ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			"aria-hidden": true,
			className: "pointer-events-none absolute inset-0",
			style: { background: "radial-gradient(60% 45% at 50% 42%, rgba(34,197,94,0.18) 0%, rgba(15,61,58,0.10) 40%, transparent 75%)" }
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative flex flex-col items-center gap-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "splash-logo-wrap relative",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					"aria-hidden": true,
					className: "splash-halo absolute -inset-5 -z-10 rounded-[40%] blur-2xl"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative overflow-hidden rounded-[20px]",
					style: {
						backgroundColor: "#FEF8EB",
						boxShadow: "0 18px 40px -18px rgba(11,43,40,0.30)"
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandLogo, {
						variant: "light",
						className: "block h-auto w-[220px]"
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "splash-dots flex items-center gap-2",
				"aria-label": "Loading",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "splash-dot" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "splash-dot" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "splash-dot" })
				]
			})]
		})]
	});
}
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
function MaintenanceScreen({ message }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-background",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-4 max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mb-6 flex justify-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-full bg-amber-500/20 p-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
							className: "h-16 w-16 text-amber-600",
							fill: "none",
							viewBox: "0 0 24 24",
							stroke: "currentColor",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								strokeLinecap: "round",
								strokeLinejoin: "round",
								strokeWidth: 2,
								d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							})
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mb-3 text-2xl font-bold",
					children: "We'll be right back!"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-6 text-muted-foreground",
					children: message || "We're currently performing maintenance. Please check back soon."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-lg bg-muted/50 p-4 text-sm",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted-foreground",
						children: "Thank you for your patience. We're working to improve your experience."
					})
				})
			]
		})
	});
}
function MaintenanceCheck({ children }) {
	const { roles } = useAuth();
	const fetchMaintenanceStatus = useServerFn(checkMaintenanceStatus);
	const [maintenanceData, setMaintenanceData] = (0, import_react.useState)({
		enabled: false,
		message: ""
	});
	const isAdmin = roles.includes("admin");
	(0, import_react.useEffect)(() => {
		const checkStatus = async () => {
			try {
				const status = await fetchMaintenanceStatus({});
				setMaintenanceData(status);
			} catch (error) {
				console.error("Failed to check maintenance status:", error);
				setMaintenanceData({
					enabled: false,
					message: ""
				});
			}
		};
		checkStatus();
		const interval = setInterval(checkStatus, 6e4);
		return () => clearInterval(interval);
	}, [fetchMaintenanceStatus]);
	if (maintenanceData.enabled && !isAdmin) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MaintenanceScreen, { message: maintenanceData.message });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
/**
* Load eruda mobile debug console when ?debug=1 is in URL
* Persists across navigation via sessionStorage
*/
function ErudaLoader() {
	(0, import_react.useEffect)(() => {
		if (typeof window === "undefined") return;
		if (!(window.location.search.includes("debug=1") || sessionStorage.getItem("eruda_enabled") === "true")) return;
		sessionStorage.setItem("eruda_enabled", "true");
		if (window.eruda) {
			console.log("[eruda] Already loaded");
			return;
		}
		console.log("[eruda] Loading mobile debug console...");
		const script = document.createElement("script");
		script.src = "https://cdn.jsdelivr.net/npm/eruda@3.4.1/eruda.js";
		script.onload = () => {
			if (window.eruda) {
				window.eruda.init();
				console.log("[eruda] ✅ Mobile debug console loaded! Tap icon to open.");
			}
		};
		script.onerror = () => {
			console.error("[eruda] ❌ Failed to load");
		};
		document.head.appendChild(script);
		return () => {};
	}, []);
	return null;
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl text-primary",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-soft",
						children: "Go home"
					})
				})
			]
		})
	});
}
function isChunkLoadError(error) {
	const message = error.message.toLowerCase();
	return error.name === "ChunkLoadError" || message.includes("failed to fetch dynamically imported module") || message.includes("error loading dynamically imported module") || message.includes("importing a module script failed") || message.includes("unable to preload css");
}
var RELOAD_GUARD_KEY = "chunk-reload-attempted";
function ErrorComponent({ error, reset }) {
	const router = useRouter();
	const routerState = useRouterState();
	(0, import_react.useEffect)(() => {
		console.error("🚨 Root ErrorComponent caught error:", {
			error,
			name: error.name,
			message: error.message,
			stack: error.stack,
			url: window.location.href,
			pathname: routerState.location.pathname,
			route: routerState.matches?.[routerState.matches.length - 1]?.routeId
		});
	}, [error, routerState]);
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
		if (isChunkLoadError(error)) {
			if (!sessionStorage.getItem(RELOAD_GUARD_KEY)) {
				sessionStorage.setItem(RELOAD_GUARD_KEY, "1");
				window.location.reload();
			}
		}
	}, [error]);
	const handleTryAgain = () => {
		if (isChunkLoadError(error)) {
			sessionStorage.removeItem(RELOAD_GUARD_KEY);
			window.location.reload();
		} else {
			router.invalidate();
			reset();
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: handleTryAgain,
						className: "inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-soft",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-background-alt",
						children: "Go home"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
					className: "mt-6 text-left",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
						className: "cursor-pointer text-xs text-muted-foreground hover:text-foreground",
						children: "Technical details"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 space-y-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: "Error:"
								}),
								" ",
								error.name
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "break-words",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium",
										children: "Message:"
									}),
									" ",
									error.message
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "break-words",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium",
										children: "URL:"
									}),
									" ",
									window.location.href
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "break-words",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium",
										children: "Route:"
									}),
									" ",
									routerState.matches?.[routerState.matches.length - 1]?.routeId || "unknown"
								]
							}),
							error.stack && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium",
								children: "Stack:"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
								className: "mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words text-[10px]",
								children: error.stack
							})] })
						]
					})]
				})
			]
		})
	});
}
var Route$57 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
			},
			{
				name: "theme-color",
				content: "#FFF8EC"
			},
			{
				name: "pushsdk",
				content: "a512ff43ba271d73e0f34abc6a217da8"
			},
			{ title: "CashGPT — Earn real rewards for ads & offers" },
			{
				name: "description",
				content: "CashGPT turns rewarded videos, partner offers and daily tasks into real wallet credit you can cash out."
			},
			{
				property: "og:site_name",
				content: "CashGPT"
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Inter:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				type: "image/x-icon"
			},
			{
				rel: "icon",
				href: "/icon-192.png",
				sizes: "192x192",
				type: "image/png"
			},
			{
				rel: "icon",
				href: "/icon-512.png",
				sizes: "512x512",
				type: "image/png"
			},
			{
				rel: "apple-touch-icon",
				href: "/apple-touch-icon.png",
				sizes: "180x180"
			},
			{
				rel: "manifest",
				href: "/manifest.webmanifest"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
/**
* Runs before the body paints, so the native shell never shows a frame of the
* server-rendered web landing.
*
* "/" is server-rendered as the marketing page (search engines need that markup),
* and the platform swap in `useIsNative` can only happen after hydration. This
* marks the document as native the moment the Capacitor global is available, and
* `html[data-native] [data-web-only]` in styles.css hides web-only UI immediately.
*/
var NATIVE_PROBE = `try{var c=window.Capacitor;if(c&&(typeof c.isNativePlatform==="function"?c.isNativePlatform():/^(android|ios)$/.test(c.platform||""))){document.documentElement.setAttribute("data-native","1")}}catch(e){}`;
function RootShell({ children }) {
	(0, import_react.useEffect)(() => {
		const handlePreloadError = (event) => {
			event.preventDefault();
			if (!sessionStorage.getItem(RELOAD_GUARD_KEY)) {
				sessionStorage.setItem(RELOAD_GUARD_KEY, "1");
				window.location.reload();
			}
		};
		window.addEventListener("vite:preloadError", handlePreloadError);
		return () => window.removeEventListener("vite:preloadError", handlePreloadError);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("head", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", { dangerouslySetInnerHTML: { __html: NATIVE_PROBE } })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$57.useRouteContext();
	useSessionStart();
	usePageViewTracking();
	useAppBackgroundTracking();
	useClientErrorTracking();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthProvider, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ViewedOfferProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MaintenanceCheck, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SplashGate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }) }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, { position: "top-center" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErudaLoader, {})
		] })
	});
}
/**
* Public marketing routes that must paint immediately.
*
* These pages have no session to wait on, and putting a splash screen in front of
* a download CTA both delays the first paint and swallows taps until the auth
* check settles. Auth itself is untouched — `AuthProvider` still initialises
* exactly as it does everywhere else; only the splash overlay is skipped.
*/
var SPLASH_FREE_ROUTES = /* @__PURE__ */ new Set(["/app"]);
/**
* Routes that skip the splash on the web but keep it inside the native shell.
*
* "/" is the marketing landing on cashgpt.in and the splash → redirect entry point
* in the packaged app. The web side must paint immediately with no overlay; the
* native side keeps its splash exactly as before.
*/
var WEB_ONLY_SPLASH_FREE_ROUTES = /* @__PURE__ */ new Set(["/"]);
function SplashGate({ children }) {
	const { loading } = useAuth();
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const native = useIsNative();
	if (SPLASH_FREE_ROUTES.has(pathname) || !native && WEB_ONLY_SPLASH_FREE_ROUTES.has(pathname)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SplashScreen, { loading }), children] });
}
var $$splitComponentImporter$42 = () => import("./routes-a7Jbq5e6.mjs");
var Route$56 = createFileRoute("/")({
	head: () => ({
		meta: [
			{ title: LANDING_TITLE },
			{
				name: "description",
				content: LANDING_DESCRIPTION
			},
			{
				name: "robots",
				content: "index,follow"
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				property: "og:site_name",
				content: "CashGPT"
			},
			{
				property: "og:title",
				content: LANDING_TITLE
			},
			{
				property: "og:description",
				content: LANDING_DESCRIPTION
			},
			{
				property: "og:url",
				content: "https://cashgpt.in/"
			},
			{
				property: "og:image",
				content: "https://cashgpt.in/logo-horizontal-light.webp"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			},
			{
				name: "twitter:title",
				content: LANDING_TITLE
			},
			{
				name: "twitter:description",
				content: LANDING_DESCRIPTION
			},
			{
				name: "twitter:image",
				content: "https://cashgpt.in/logo-horizontal-light.webp"
			}
		],
		links: [{
			rel: "canonical",
			href: "https://cashgpt.in/"
		}]
	}),
	component: lazyRouteComponent($$splitComponentImporter$42, "component")
});
/**
* Root entry. Two completely separate experiences share this path:
*
* - Native (Capacitor shell): the original splash → /auth | /onboarding | /home
*   redirect, unchanged.
* - Web (cashgpt.in): the marketing landing with inline signup, no splash.
*
* The web branch is what gets server-rendered, so crawlers index real landing
* markup. `useIsNative` corrects before paint inside the app shell, and the native
* splash still covers "/" there, so the packaged app shows no landing frame.
*/
/** The pre-existing native behaviour, moved verbatim behind the platform check. */
/**
* Reads whether supabase-js has a persisted session without touching AuthProvider.
*
* supabase-js stores its token under `sb-<project-ref>-auth-token`, so the presence
* of that key is a reliable "this visitor is probably signed in" hint that's
* available synchronously — before the async session check resolves. Used only to
* decide whether to paint the landing, never to authorise anything.
*/
var $$splitComponentImporter$41 = () => import("./route-B6pLMyIA.mjs");
var Route$55 = createFileRoute("/_authenticated")({
	ssr: false,
	beforeLoad: async () => {
		const { data: sessionData } = await supabase.auth.getSession();
		if (sessionData.session?.user) return { user: sessionData.session.user };
		const { data, error } = await supabase.auth.getUser();
		if (error || !data.user) throw redirect({ to: "/auth" });
		return { user: data.user };
	},
	component: lazyRouteComponent($$splitComponentImporter$41, "component")
});
var $$splitComponentImporter$40 = () => import("./app-DOqZ53Du.mjs");
var PAGE_TITLE = "Download CashGPT — Get paid for ads, offers & games";
var PAGE_DESCRIPTION = "Install CashGPT and earn real cash 8 different ways — ads, shortlinks, surveys, games and more. Cash out to PayPal, crypto or gift cards from just $5.";
var Route$54 = createFileRoute("/app")({
	head: () => ({ meta: [
		{ title: PAGE_TITLE },
		{
			name: "description",
			content: PAGE_DESCRIPTION
		},
		{
			property: "og:title",
			content: PAGE_TITLE
		},
		{
			property: "og:description",
			content: PAGE_DESCRIPTION
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$40, "component")
});
/** True once the window has scrolled past `offset` px. Drives the sticky mobile bar. */
var $$splitComponentImporter$39 = () => import("./auth-DpvtoQTc.mjs");
var Route$53 = createFileRoute("/auth")({
	head: () => ({ meta: [
		{ title: "Sign in — CashGPT" },
		{
			name: "description",
			content: "Sign in or create your CashGPT account to start earning."
		},
		{
			property: "og:title",
			content: "Sign in — CashGPT"
		},
		{
			property: "og:description",
			content: "Sign in or create your CashGPT account to start earning."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$39, "component")
});
/**
* TEMPORARY preview route for reviewing the Simulated Live Activity strip.
*
* Exists only so the card can be inspected without signing in. It seeds the
* real ["featured-feed","home"] cache key with sample offers so the live
* component behaves exactly as it does on Home.
*
* Development only.
*/
var $$splitComponentImporter$38 = () => import("./preview-live-activity-DO5w_Zja.mjs");
var Route$52 = createFileRoute("/preview-live-activity")({
	ssr: false,
	component: lazyRouteComponent($$splitComponentImporter$38, "component")
});
/**
* Stand-in offers shaped like FeaturedOffer, only for this preview page.
* Spread across payout tiers so the weighted selection is observable, and two
* entries above the $50.00 cap that must NEVER appear in the strip.
*/
/**
* Stand-in active quests, seeding the same ["quests-active"] cache key Home
* fills — the feed's second (and only other) source.
*/
/**
* TEMPORARY preview-only route used to visually verify the QuestCard redesign
* without requiring Supabase auth. Renders the real QuestCard component with
* mock quest data covering all three quest types plus locked/credited states.
* Development only.
*/
var $$splitComponentImporter$37 = () => import("./preview-quest-cards-Bt2M24gl.mjs");
var Route$51 = createFileRoute("/preview-quest-cards")({
	ssr: false,
	component: lazyRouteComponent($$splitComponentImporter$37, "component")
});
/**
* TEMPORARY no-login preview of the REAL Refer & Earn screen.
*
* Mounts the actual ReferPage inside a mock AuthContext and seeds the real
* ["referrals", userId] query cache, so what renders is the production component
* with production logic — not a copy. Development only.
*/
var $$splitComponentImporter$36 = () => import("./preview-refer-DyFZ2f6Z.mjs");
var Route$50 = createFileRoute("/preview-refer")({
	ssr: false,
	component: lazyRouteComponent($$splitComponentImporter$36, "component")
});
/** Mock referrals covering every reward state the screen can render. */
/**
* TEMPORARY no-login preview of the REAL Referral Program Rules page.
* Mounts the production component inside a mock AuthContext (AppShell's header
* needs one). Development only.
*/
var $$splitComponentImporter$35 = () => import("./preview-referral-rules-D2kOcX3l.mjs");
var Route$49 = createFileRoute("/preview-referral-rules")({
	ssr: false,
	component: lazyRouteComponent($$splitComponentImporter$35, "component")
});
/**
* TEMPORARY preview-only route for visually reviewing the ribbon SectionHeading
* rollout without Supabase auth (every real screen is behind /_authenticated).
*
* Renders the real component with the real props from each screen, so what you
* see here is what those screens render. Development only.
*/
var $$splitComponentImporter$34 = () => import("./preview-section-heading-DgxYNbG5.mjs");
var Route$48 = createFileRoute("/preview-section-heading")({
	ssr: false,
	component: lazyRouteComponent($$splitComponentImporter$34, "component")
});
/**
* Preview route for the two transitional screens, which are otherwise only
* visible for a fraction of a second.
*
* Toggle between the splash (logo-card corner fix) and the redesigned `/`
* loading screen. Development only.
*/
var $$splitComponentImporter$33 = () => import("./preview-splash-Ba4oB_8l.mjs");
var Route$47 = createFileRoute("/preview-splash")({
	ssr: false,
	component: lazyRouteComponent($$splitComponentImporter$33, "component")
});
var $$splitComponentImporter$32 = () => import("./admin-D-rLetJ6.mjs");
var Route$46 = createFileRoute("/_authenticated/admin")({
	head: () => ({ meta: [
		{ title: "Admin — CashGPT" },
		{
			name: "description",
			content: "Review withdrawals, offer claims, tickets and users."
		},
		{
			property: "og:title",
			content: "Admin — CashGPT"
		},
		{
			property: "og:description",
			content: "Review withdrawals, offer claims, tickets and users."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$32, "component")
});
var $$splitComponentImporter$31 = () => import("./featured-8tnvOhKi.mjs");
var Route$45 = createFileRoute("/_authenticated/featured")({
	head: () => ({ meta: [
		{ title: "All Offers — CashGPT" },
		{
			name: "description",
			content: "Browse every partner offer and claim your rewards."
		},
		{
			property: "og:title",
			content: "All Offers — CashGPT"
		},
		{
			property: "og:description",
			content: "Browse every partner offer and claim your rewards."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$31, "component")
});
var $$splitComponentImporter$30 = () => import("./home-Aobq8Gh7.mjs").then((n) => n.t);
var Route$44 = createFileRoute("/_authenticated/home")({
	head: () => ({ meta: [
		{ title: "Home — CashGPT" },
		{
			name: "description",
			content: "Your daily quests, featured offers and streak bonus."
		},
		{
			property: "og:title",
			content: "Home — CashGPT"
		},
		{
			property: "og:description",
			content: "Your daily quests, featured offers and streak bonus."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$30, "component")
});
var $$splitComponentImporter$29 = () => import("./my-submissions-GBCQnpBB.mjs");
var Route$43 = createFileRoute("/_authenticated/my-submissions")({
	head: () => ({ meta: [{ title: "My Submissions — CashGPT" }] }),
	component: lazyRouteComponent($$splitComponentImporter$29, "component")
});
var $$splitComponentImporter$28 = () => import("./notifications-cchWPx80.mjs");
var Route$42 = createFileRoute("/_authenticated/notifications")({
	head: () => ({ meta: [
		{ title: "Notifications — CashGPT" },
		{
			name: "description",
			content: "Payout, quest and account updates."
		},
		{
			property: "og:title",
			content: "Notifications — CashGPT"
		},
		{
			property: "og:description",
			content: "Payout, quest and account updates."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$28, "component")
});
var $$splitComponentImporter$27 = () => import("./offers-BVqPjEQs.mjs");
var Route$41 = createFileRoute("/_authenticated/offers")({
	head: () => ({ meta: [
		{ title: "Offers — CashGPT" },
		{
			name: "description",
			content: "Featured partner offers and offerwall networks."
		},
		{
			property: "og:title",
			content: "Offers — CashGPT"
		},
		{
			property: "og:description",
			content: "Featured partner offers and offerwall networks."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$27, "component")
});
var $$splitComponentImporter$26 = () => import("./offerwall-CcuZEaLz.mjs");
var Route$40 = createFileRoute("/_authenticated/offerwall")({
	head: () => ({ meta: [
		{ title: "Offerwall — CashGPT" },
		{
			name: "description",
			content: "All partner offerwall networks available in CashGPT."
		},
		{
			property: "og:title",
			content: "Offerwall — CashGPT"
		},
		{
			property: "og:description",
			content: "All partner offerwall networks available in CashGPT."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$26, "component")
});
var $$splitComponentImporter$25 = () => import("./onboarding-TQ6a-ayc.mjs");
var Route$39 = createFileRoute("/_authenticated/onboarding")({
	head: () => ({ meta: [
		{ title: "Welcome to CashGPT" },
		{
			name: "description",
			content: "Discover the premium CashGPT earning experience."
		},
		{
			property: "og:title",
			content: "Welcome to CashGPT"
		},
		{
			property: "og:description",
			content: "Discover the premium CashGPT earning experience."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$25, "component")
});
var $$splitComponentImporter$24 = () => import("./profile-J2BWxSMK.mjs");
var Route$38 = createFileRoute("/_authenticated/profile")({
	head: () => ({ meta: [
		{ title: "Profile — CashGPT" },
		{
			name: "description",
			content: "Manage your CashGPT account, wallet and settings."
		},
		{
			property: "og:title",
			content: "Profile — CashGPT"
		},
		{
			property: "og:description",
			content: "Manage your CashGPT account, wallet and settings."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$24, "component")
});
/**
* Advertiser referral tracking for Phase 7
* Uses same referral link - tracks when referred users become advertisers
*/
/**
* Get advertiser referral stats for a user
* Checks their referrals table entries to see which referred users:
* 1. Created an advertiser account (advertiser_accounts table)
* 2. Made a credited first deposit (advertiser_deposits with credited_at not null)
*/
var getAdvertiserReferralStatsInput = objectType({ userId: stringType().uuid() });
var getAdvertiserReferralStats = createServerFn({ method: "GET" }).validator(getAdvertiserReferralStatsInput).handler(createSsrRpc("afdd46c7530466a0c353f0987cbdf1db8dc3874d98680aa441278ca95b82d708"));
/**
* Admin marketplace and referral settings management
* Phase 6: Configure marketplace parameters and referral bonuses
*/
var getMarketplaceSettings = createServerFn({ method: "GET" }).handler(createSsrRpc("20c329ab6313b2403b652df70d42fb07efbf492aeabb194e1d893b788153bfca"));
createServerFn({ method: "GET" }).handler(createSsrRpc("6a566336c270fa8566c30bb5363e0d19e303facccfdc67c87fbaf4c246f28f4a"));
/**
* Update marketplace settings
*/
var updateMarketplaceSettingsInput = objectType({
	platform_fee_percent: numberType().min(0).max(90).optional(),
	first_deposit_bonus_percent: numberType().min(0).max(100).optional(),
	referral_bonus_split_percent: numberType().min(0).max(100).optional(),
	referrer_bonus_hold_days: numberType().min(0).max(365).optional(),
	min_publisher_reward: numberType().min(0).optional(),
	auto_approve_after_hours: numberType().min(1).max(720).optional(),
	appeal_window_hours: numberType().min(1).max(720).optional(),
	auto_approve_enabled: booleanType().optional(),
	auto_approve_after_minutes: numberType().int().min(1).max(120).optional(),
	auto_approve_skip_first_campaign: booleanType().optional(),
	fees_enabled: booleanType().optional(),
	campaign_fee_usd: numberType().min(0).max(100).optional(),
	campaign_fee_type: enumType(["per_campaign", "per_slot"]).optional(),
	featured_price_per_day: numberType().min(0).max(1e3).optional(),
	deposits_enabled: booleanType().optional(),
	manual_deposits_enabled: booleanType().optional(),
	inr_per_usd: numberType().min(0).nullable().optional()
});
var updateMarketplaceSettings = createServerFn({ method: "POST" }).validator(updateMarketplaceSettingsInput).handler(createSsrRpc("e234f87cb875bc5a3fc13ed5fa35dd523cfe873d251564970dc93f6d1a6ae497"));
/**
* Update referral settings
*/
var updateReferralSettingsInput = objectType({
	pub_signup_bonus: numberType().min(0).optional(),
	pub_first_earning_bonus: numberType().min(0).optional(),
	pub_first_withdrawal_bonus: numberType().min(0).optional(),
	pub_window_days: numberType().min(1).max(3650).optional()
});
createServerFn({ method: "POST" }).validator(updateReferralSettingsInput).handler(createSsrRpc("865feb8dee62f5ef4fea3d59cd99ca2035c23c3f1554caa0b3ffefbb9203a27e"));
var PUBLISHER_REFERRAL_RULES = [
	`Each referred friend is worth up to ${formatMoney(3)} — one ${formatMoney(1)} milestone for each of the 3 steps above, counted once per friend.`,
	`Milestones unlock referral earnings as pending. Nothing is credited milestone by milestone — pending earnings are not part of your wallet balance and cannot be withdrawn. The full ${formatMoney(3)} is released into your main wallet in one go, only once that friend has completed all 3 milestones.`,
	`All 3 milestones must be completed within 365 days of your friend's signup, or that referral expires and its pending earnings are not released. Self-referrals, duplicate accounts and fraudulent activity void all referral rewards.`
];
var ADVERTISER_REFERRAL_RULES = [
	"Your invite link works for two separate programs: publisher referral and advertiser referral. Advertiser rewards are added on top of publisher rewards.",
	`When a friend you invited becomes an advertiser and makes a deposit of at least ${formatMoney(10)}, you earn 50% of that deposit.`,
	`Example: if your friend deposits $100, you earn ${formatMoney(50)}.`,
	`You can earn up to ${formatMoney(100)} in total per referred advertiser. Deposits beyond that earn no extra bonus.`,
	`The bonus shows as Pending for 7 days after the deposit clears, then it is Credited to your main wallet.`,
	"If a deposit is refunded, reversed or charged back, the related bonus is cancelled, and deducted if it was already credited.",
	"Bonuses are paid only on real, successful deposits, not on promotional or bonus credit.",
	"Self-referrals, duplicate or linked accounts, and fraudulent activity void the bonus.",
	"Program rules may change; changes apply to new deposits only."
];
var formatAdvertiserReferralLine = (publisherBonus) => `Earn ${formatMoney(publisherBonus)} per friend who completes all 3 publisher milestones, plus 50% of an advertiser friend's deposit (up to ${formatMoney(100)}).`;
var Route$37 = createFileRoute("/_authenticated/refer")({
	head: () => ({ meta: [
		{ title: "Refer & earn — CashGPT" },
		{
			name: "description",
			content: `Invite friends, earn up to $100.`
		},
		{
			property: "og:title",
			content: "Refer & earn — CashGPT"
		},
		{
			property: "og:description",
			content: `Invite friends, earn up to $100.`
		}
	] }),
	component: ReferPage
});
var MILESTONES = [
	{
		key: "signup_credited_at",
		emoji: "🎉",
		short: "Signup",
		label: "Friend signs up",
		detail: "Counted when they successfully sign up with your code"
	},
	{
		key: "earning_credited_at",
		emoji: "🎯",
		short: "First earning",
		label: "Friend completes their first Task, Offer or Quest",
		detail: "Any qualifying first earning from a Task, Offer or Quest counts"
	},
	{
		key: "withdrawal_credited_at",
		emoji: "💸",
		short: "First withdrawal",
		label: "Friend completes their first withdrawal",
		detail: "Counted when their first withdrawal is approved — this releases the reward"
	}
];
/** Simplified brand mark, filled currentColor so it tints with the button background. */
function WhatsAppIcon(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 24 24",
		fill: "currentColor",
		"aria-hidden": true,
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.94L2 22l5.3-1.39a9.86 9.86 0 0 0 4.74 1.21h.005c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.12-2.9-6.99A9.82 9.82 0 0 0 12.04 2Zm0 1.67c2.19 0 4.25.85 5.8 2.4a8.2 8.2 0 0 1 2.41 5.83c0 4.55-3.7 8.24-8.25 8.24a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-2.96.78.79-2.88-.2-.3a8.16 8.16 0 0 1-1.26-4.36c0-4.55 3.7-8.24 8.16-8.38Zm-3.2 4.32c-.16 0-.42.06-.6.28-.2.24-.78.76-.78 1.86 0 1.1.8 2.16 1.9 3.4 1.1 1.24 2.6 2.28 3.7 2.7.94.36 1.44.18 1.72-.08.32-.3.9-.98 1.08-1.32.18-.34.02-.6-.14-.76-.16-.16-1.02-.5-1.18-.56-.16-.06-.28-.1-.4.08-.12.18-.46.58-.56.7-.1.12-.2.14-.36.06-.5-.22-1.36-.66-2.06-1.34-.6-.56-1-1.24-1.12-1.44-.12-.2 0-.32.08-.42.08-.1.28-.34.36-.46.08-.12.04-.24 0-.34-.06-.1-.5-1.22-.68-1.62-.14-.32-.28-.28-.4-.28Z" })
	});
}
function TelegramIcon(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 24 24",
		fill: "currentColor",
		"aria-hidden": true,
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M21.7 3.3 2.9 10.9c-1.05.42-1.03 1.02-.2 1.29l4.6 1.43 10.6-6.68c.5-.3.96-.15.58.18L9.8 15.4l-.34 4.65c.38 0 .55-.16.76-.36l2-1.94 4.16 3.08c.76.42 1.3.2 1.5-.7l2.7-12.8c.3-1.13-.42-1.64-1.1-1.03Z" })
	});
}
var REWARD_STATE_STYLE = {
	in_progress: {
		label: "Pending",
		className: "bg-gold/20 text-gold-dark"
	},
	unlocked: {
		label: "Unlocked",
		className: "bg-mint/25 text-primary"
	},
	credited: {
		label: "Credited",
		className: "bg-mint/25 text-primary"
	},
	expired: {
		label: "Expired",
		className: "bg-muted text-muted-foreground"
	}
};
/**
* Privacy-safe friend label. Mirrors the existing approach on this screen, which
* derives a badge from the referral id — a referrer cannot read the friend's
* profile (RLS is self-only) and nothing here loosens that.
*/
function friendLabel(referralId) {
	return `Friend #${String(referralId).replace(/-/g, "").slice(0, 4).toUpperCase()}`;
}
/** Per-referral reward line: how much is locked, and what unlocks it. */
function ReferralRewardLine({ referral }) {
	const progress = deriveReferralProgress(referral);
	const badge = REWARD_STATE_STYLE[progress.state];
	const amount = progress.state === "credited" ? progress.creditedAmount : progress.state === "expired" ? 0 : progress.pendingAmount;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between gap-2",
		"data-testid": `refer-reward-state-${referral.id}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-xs text-muted-foreground",
			children: [
				"Progress",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-semibold text-foreground [font-variant-numeric:tabular-nums]",
					children: [
						progress.completed,
						"/",
						progress.total
					]
				}),
				progress.state === "in_progress" && progress.daysRemaining <= 30 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-destructive",
					children: [
						" · ",
						progress.daysRemaining,
						"d left"
					]
				}) : null
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex items-center gap-1.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-amount text-sm text-foreground",
				children: formatReward(amount)
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: `rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.className}`,
				children: badge.label
			})]
		})]
	});
}
/** Horizontal 3-dot stepper for a single referral's signup → earning → withdrawal progress. */
function MilestoneStepper({ referral }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": `refer-milestone-stepper-${referral.id}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex items-center",
			children: MILESTONES.map((milestone, index) => {
				const done = Boolean(referral[milestone.key]);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-1 items-center last:flex-none",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-hidden": true,
						className: done ? "grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground" : "grid size-7 shrink-0 place-items-center rounded-full border-2 border-border text-muted-foreground",
						children: done ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-border" })
					}), index < MILESTONES.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-0.5 flex-1 ${done ? "bg-primary" : "bg-border"}` })]
				}, milestone.key);
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2 grid grid-cols-3 gap-2 text-center",
			children: MILESTONES.map((milestone) => {
				const done = Boolean(referral[milestone.key]);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: `text-[11px] font-semibold ${done ? "text-primary" : "text-muted-foreground"}`,
					children: milestone.short
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-0.5 text-[10px] leading-tight text-muted-foreground",
					children: milestone.detail
				})] }, milestone.key);
			})
		})]
	});
}
/** Exported so the no-login preview route can render the real screen. */
function ReferPage() {
	const { session, profile } = useAuth();
	const code = profile?.referral_code ?? "";
	const link = typeof window === "undefined" ? "" : `${window.location.origin}/auth?ref=${code}`;
	const fetchAdvertiserStats = useServerFn(getAdvertiserReferralStats);
	const fetchMarketplaceSettings = useServerFn(getMarketplaceSettings);
	const marketplaceSettings = useQuery({
		queryKey: ["marketplace-settings"],
		queryFn: () => fetchMarketplaceSettings()
	});
	const referrals = useQuery({
		queryKey: ["referrals", session?.user.id],
		enabled: Boolean(session),
		queryFn: async () => {
			const { data } = await supabase.from("referrals").select("*").order("created_at", { ascending: false });
			return data ?? [];
		}
	});
	const advertiserStats = useQuery({
		queryKey: ["advertiser-referral-stats", session?.user.id],
		enabled: Boolean(session?.user.id),
		queryFn: () => fetchAdvertiserStats({ data: { userId: session.user.id } })
	});
	const mine = referrals.data?.filter((r) => r.referrer_id === session?.user.id) ?? [];
	const totals = sumReferralTotals(mine);
	const referralEarnings = totals.credited;
	const potentialEarnings = mine.length * 3;
	const shareMessage = "Join me on CashGPT and start earning!";
	const advStats = advertiserStats.data ?? {
		referredAdvertisers: 0,
		totalDeposits: 0,
		rewardsEarned: 0,
		referralPercent: 50
	};
	const settings = marketplaceSettings.data;
	const dynamicAdvertiserRules = settings ? [
		"Your invite link works for two separate programs: publisher referral and advertiser referral. Advertiser rewards are added on top of publisher rewards.",
		`When a friend you invited becomes an advertiser and makes their first deposit, you earn ${settings.referral_bonus_split_percent}% of that deposit.`,
		`Example: if your friend deposits $100, you earn ${formatReward(100 * settings.referral_bonus_split_percent / 100)}.`,
		`The bonus shows as Pending for ${settings.referrer_bonus_hold_days} days after the deposit clears, then it is Credited to your main wallet.`,
		"If a deposit is refunded, reversed or charged back, the related bonus is cancelled, and deducted if it was already credited.",
		"Bonuses are paid only on real, successful deposits, not on promotional or bonus credit.",
		"Self-referrals, duplicate or linked accounts, and fraudulent activity void the bonus.",
		"Program rules may change; changes apply to new deposits only."
	] : ADVERTISER_REFERRAL_RULES;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		subtitle: "Refer",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "refer-page-bg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
					variant: "ribbon",
					size: "page",
					icon: Users,
					iconSrc: "/icons/icon-referral.webp",
					title: "Refer & Earn",
					subtitle: "Invite friends, get rewarded together",
					className: "mb-4"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "premium-step-in rounded-3xl bg-jade-gradient p-5 text-primary-foreground shadow-lift",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							className: "text-xl",
							children: ["Invite friends, earn up to $", 100]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm opacity-80",
							children: formatAdvertiserReferralLine(3)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs opacity-60",
							children: "Join thousands of users earning together."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-5 text-[11px] font-semibold uppercase tracking-widest opacity-70",
							children: "Your code"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-amount mt-1.5 rounded-2xl border border-dashed border-primary-foreground/40 bg-primary-foreground/10 px-4 py-3 text-center text-2xl tracking-[0.3em]",
							children: code || "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "gold",
								className: "flex-1 gap-2",
								"data-testid": "refer-copy-code-btn",
								onClick: async () => {
									await navigator.clipboard.writeText(link);
									toast.success("Invite link copied");
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" }), " Copy Code"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "mint",
								className: "refer-share-glow flex-1 gap-2",
								"data-testid": "refer-share-invite-btn",
								onClick: async () => {
									if (navigator.share) await navigator.share({
										title: "CashGPT",
										url: link
									});
									else {
										await navigator.clipboard.writeText(link);
										toast.success("Invite link copied");
									}
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "size-4" }), " Share Invite"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: `https://wa.me/?text=${encodeURIComponent(`${shareMessage} ${link}`)}`,
									target: "_blank",
									rel: "noopener noreferrer",
									"aria-label": "Share on WhatsApp",
									"data-testid": "refer-share-whatsapp-btn",
									className: "grid size-9 shrink-0 place-items-center rounded-full bg-[#25D366] text-white shadow-soft transition-transform hover:scale-105 active:scale-95",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WhatsAppIcon, { className: "size-4.5" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareMessage)}`,
									target: "_blank",
									rel: "noopener noreferrer",
									"aria-label": "Share on Telegram",
									"data-testid": "refer-share-telegram-btn",
									className: "grid size-9 shrink-0 place-items-center rounded-full bg-[#26A5E4] text-white shadow-soft transition-transform hover:scale-105 active:scale-95",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TelegramIcon, { className: "size-4.5" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs opacity-70",
									children: "Quick share"
								})
							]
						}),
						link ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex items-center gap-3 rounded-2xl bg-primary-foreground/10 p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "shrink-0 rounded-xl bg-white p-1.5",
								"data-testid": "refer-qr-code",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QRCodeSVG, {
									value: link,
									size: 64,
									bgColor: "#ffffff",
									fgColor: "#0f3d3a"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs opacity-80",
								children: "Scan to open your invite link — great for sharing in person."
							})]
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid grid-cols-2 gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "surface-card premium-step-in p-4",
						style: { animationDelay: "80ms" },
						"data-testid": "refer-stat-friends",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid size-9 place-items-center rounded-xl bg-primary/10",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-4 text-primary" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-amount mt-3 text-2xl leading-none",
								children: mine.length
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-muted-foreground",
								children: "Friends Invited"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "surface-card premium-step-in p-4",
						style: { animationDelay: "140ms" },
						"data-testid": "refer-stat-earnings",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid size-9 place-items-center rounded-xl bg-gold/20",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gift, { className: "size-4 text-gold-dark" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-amount mt-3 text-2xl leading-none text-gold-dark",
								children: formatReward(referralEarnings)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-muted-foreground",
								children: "Credited to Wallet"
							}),
							potentialEarnings > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background-alt",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-full rounded-full bg-gold-gradient",
									style: { width: `${Math.min(100, referralEarnings / potentialEarnings * 100)}%` }
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-[10px] text-muted-foreground",
								children: [
									formatReward(referralEarnings),
									" earned of ",
									formatReward(potentialEarnings),
									" ",
									"potential"
								]
							})] })
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
					variant: "ribbon",
					icon: Wallet,
					iconSrc: "/icons/icon-wallet.webp",
					title: "Publisher Referral",
					subtitle: "Rewards when friends earn as publishers"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card p-4",
					"data-testid": "refer-earnings-summary",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl bg-gold/10 p-3",
								"data-testid": "refer-earnings-pending",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gold-dark",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-3" }), " Pending"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-amount mt-1 text-xl leading-none text-gold-dark",
										children: formatReward(totals.pending)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-[10px] leading-tight text-muted-foreground",
										children: "Locked — not in your wallet yet"
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl bg-mint/15 p-3",
								"data-testid": "refer-earnings-credited",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-primary",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3" }), " Credited"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-amount mt-1 text-xl leading-none text-primary",
										children: formatReward(totals.credited)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-[10px] leading-tight text-muted-foreground",
										children: "Released to your main wallet"
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex items-center justify-between border-t border-border pt-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-semibold",
								children: "Total publisher referral earnings"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-amount text-base",
								"data-testid": "refer-earnings-total",
								children: formatReward(totals.total)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "mt-0.5 size-3.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								"Pending referral earnings are ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "not" }),
								" part of your wallet balance and can't be withdrawn yet. The full ",
								formatReward(3),
								" for a friend is released to your main wallet only once that friend completes all 3 milestones."
							] })]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
					variant: "ribbon",
					icon: Megaphone,
					iconSrc: "/icons/icon-advertiser-referral-v2.webp",
					title: "Advertiser Referral",
					subtitle: "Same link — extra rewards when invitees advertise"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card p-4",
					"data-testid": "refer-advertiser-section",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "flex items-start gap-1.5 rounded-xl bg-primary/5 p-3 text-[11px] leading-snug text-primary",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "mt-0.5 size-3.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "One link, both rewards." }),
							" If a friend you invite with the link above becomes an advertiser and makes a deposit, you earn ",
							50,
							"% of it, on top of publisher referral rewards."
						] })]
					}), advertiserStats.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 grid grid-cols-3 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-16 animate-pulse rounded-2xl bg-background-alt" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-16 animate-pulse rounded-2xl bg-background-alt" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-16 animate-pulse rounded-2xl bg-background-alt" })
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 grid grid-cols-3 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl bg-background-alt p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] font-semibold uppercase tracking-wide text-muted-foreground",
									children: "Referred advertisers"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-amount mt-1 text-xl leading-none",
									children: advStats.referredAdvertisers
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl bg-mint/15 p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] font-semibold uppercase tracking-wide text-primary",
									children: "Deposits"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-amount mt-1 text-xl leading-none text-primary",
									children: formatMoney(advStats.totalDeposits)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl bg-gold/10 p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] font-semibold uppercase tracking-wide text-gold-dark",
									children: "Earned"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-amount mt-1 text-xl leading-none text-gold-dark",
									children: formatMoney(advStats.rewardsEarned)
								})]
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
					variant: "ribbon",
					icon: Gift,
					iconSrc: "/icons/icon-how-you-earn.webp",
					title: `How you earn ${formatMoney(3)}`
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "surface-card space-y-1 p-4",
					children: MILESTONES.map((milestone, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "relative flex gap-3 pb-4 last:pb-0",
						children: [
							index < MILESTONES.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								"aria-hidden": true,
								className: "absolute left-5 top-11 h-[calc(100%-2.25rem)] w-px bg-border"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid size-10 shrink-0 place-items-center rounded-xl bg-background-alt text-lg",
								children: milestone.emoji
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1 pt-0.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm font-semibold",
									children: [
										index === 0 ? "" : "+",
										formatMoney(1),
										" — ",
										milestone.label
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-0.5 text-xs text-muted-foreground",
									children: milestone.detail
								})]
							})
						]
					}, milestone.key))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
					variant: "ribbon",
					icon: Users,
					iconSrc: "/icons/icon-your-referrals.webp",
					title: "Your referrals"
				}),
				mine.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex items-center gap-3",
					"data-testid": "refer-friends-row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex -space-x-2",
						children: [mine.slice(0, 5).map((referral, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": true,
							className: "grid size-8 place-items-center rounded-full border-2 border-card bg-jade-gradient text-xs font-bold text-primary-foreground",
							style: { zIndex: mine.length - index },
							children: String(referral.id ?? "?").slice(0, 1).toUpperCase()
						}, referral.id)), mine.length > 5 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							"aria-hidden": true,
							className: "grid size-8 place-items-center rounded-full border-2 border-card bg-background-alt text-[10px] font-bold text-muted-foreground",
							children: ["+", mine.length - 5]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs font-semibold text-muted-foreground",
						"data-testid": "refer-friends-count",
						children: [
							mine.length,
							" friend",
							mine.length === 1 ? "" : "s",
							" joined"
						]
					})]
				}),
				!mine.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card flex flex-col items-center gap-3 px-6 py-10 text-center",
					"data-testid": "refer-empty-state",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": true,
							className: "grid size-14 place-items-center rounded-2xl bg-background-alt",
							style: { animation: "premium-art-float 4s ease-in-out infinite" },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-6 text-muted-foreground" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-base",
							children: "No referrals yet"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "max-w-xs text-sm text-muted-foreground",
							children: "Share your code above — every friend who joins shows up here, along with what you've earned from them."
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2",
					children: mine.map((referral) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "surface-card space-y-3 p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex min-w-0 items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										"aria-hidden": true,
										className: "grid size-8 shrink-0 place-items-center rounded-full bg-jade-gradient text-xs font-bold text-primary-foreground",
										children: String(referral.id).slice(0, 1).toUpperCase()
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "truncate text-sm font-semibold",
											children: friendLabel(referral.id)
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-[11px] text-muted-foreground",
											children: ["Joined ", formatDate(referral.created_at)]
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-amount shrink-0 text-gold-dark",
									children: [
										formatMoney(referral.bonus_amount),
										" / ",
										formatMoney(3)
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MilestoneStepper, { referral }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReferralRewardLine, { referral })
						]
					}, referral.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
					variant: "ribbon",
					icon: FileText,
					iconSrc: "/icons/icon-terms-conditions.webp",
					title: "Terms & conditions"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "surface-card p-3",
					"data-testid": "refer-rules-accordion",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
							open: true,
							className: "group rounded-2xl bg-background-alt p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", {
								className: "flex cursor-pointer list-none items-center justify-between gap-3 font-semibold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Publisher referral" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4 transition-transform group-open:rotate-180" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
								className: "mt-3 list-decimal space-y-2 pl-5 text-xs leading-relaxed text-muted-foreground",
								children: PUBLISHER_REFERRAL_RULES.map((rule) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: rule }, rule))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
							className: "group mt-2 rounded-2xl bg-background-alt p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", {
								className: "flex cursor-pointer list-none items-center justify-between gap-3 font-semibold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Advertiser referral" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4 transition-transform group-open:rotate-180" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
								className: "mt-3 list-decimal space-y-2 pl-5 text-xs leading-relaxed text-muted-foreground",
								children: dynamicAdvertiserRules.map((rule) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: rule }, rule))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/referral-rules",
							className: "mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary",
							"data-testid": "refer-view-rules",
							children: ["Read the full program rules ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3.5" })]
						})
					]
				})
			]
		})
	});
}
/**
* In-app Referral Program Rules.
*
* Every figure comes from the shared constants and REFERRAL_MILESTONE_COUNT, so
* this page, the Refer screen, the pending-earnings display and the server-side
* release logic can never describe different amounts.
*
* The reward model described here is the ONLY one: the three milestones unlock
* earnings as *pending*, nothing is credited per milestone, and the full
* REFERRAL_MAX_BONUS is released to the main wallet once all three are complete.
*/
var Route$36 = createFileRoute("/_authenticated/referral-rules")({
	head: () => ({ meta: [{ title: "Referral program rules — CashGPT" }, {
		name: "description",
		content: `How CashGPT referral rewards work: ${REFERRAL_MILESTONE_COUNT} milestones, then ${formatMoney(3)} released to your wallet.`
	}] }),
	component: ReferralRulesPage
});
/** One numbered rule card: jade number badge, mint icon, concise body. */
function Rule({ index, icon: Icon, title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "surface-card p-4",
		"data-testid": `referral-rule-${index}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2.5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					"aria-hidden": true,
					className: "grid size-7 shrink-0 place-items-center rounded-full bg-jade-gradient text-[12px] font-bold text-primary-foreground shadow-soft",
					children: index
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					"aria-hidden": true,
					className: "grid size-7 shrink-0 place-items-center rounded-full bg-mint/15 text-primary ring-1 ring-inset ring-mint/25",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "min-w-0 flex-1 font-display text-[15px] leading-tight text-primary",
					children: title
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2.5 space-y-2 border-t border-border pt-2.5 text-xs leading-relaxed text-muted-foreground",
			children
		})]
	});
}
/** Compact bullet list — short lines keep the page scannable on a phone. */
function Bullets({ items }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "space-y-1.5",
		children: items.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "flex gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				"aria-hidden": true,
				className: "mt-1.5 size-1 shrink-0 rounded-full bg-mint"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "min-w-0 flex-1",
				children: item
			})]
		}, i))
	});
}
function Amount({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
		className: "text-amount text-gold-dark",
		children
	});
}
/** Exported so the no-login preview route can render the real page. */
function ReferralRulesPage() {
	const full = formatMoney(3);
	const per = formatMoney(1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		subtitle: "Referral rules",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/refer",
				className: "inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-card px-3 py-1.5 text-xs font-semibold text-primary shadow-soft transition-colors hover:bg-primary hover:text-primary-foreground",
				"data-testid": "referral-rules-back",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-3.5" }), "Back to Refer & Earn"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 rounded-3xl bg-jade-gradient p-4 text-primary-foreground shadow-lift",
				"data-testid": "referral-rules-hero",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-lg leading-tight",
					children: "Referral program rules"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1.5 text-xs leading-relaxed opacity-90",
					children: [
						"Invite a friend and earn up to ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: full }),
						" for each one. The",
						" ",
						REFERRAL_MILESTONE_COUNT,
						" milestones build up as ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "pending" }),
						" earnings — the full ",
						full,
						" lands in your main wallet once your friend completes all",
						" ",
						REFERRAL_MILESTONE_COUNT,
						"."
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rule, {
						index: 1,
						icon: Share2,
						title: "How it works",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bullets, { items: [
							"Share your personal referral code or link from the Refer & Earn screen.",
							"Your friend signs up with it and starts using CashGPT.",
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								"As they hit each milestone, your referral earnings grow — up to",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Amount, { children: full }),
								" per friend."
							] })
						] })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Rule, {
						index: 2,
						icon: ListChecks,
						title: `The ${REFERRAL_MILESTONE_COUNT} milestones`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bullets, { items: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Signup" }), " — your friend creates an account with your code."] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "First earning" }), " — they complete their first Task, Offer or Quest."] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "First withdrawal" }), " — their first withdrawal is approved."] })
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							"Each milestone is worth ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Amount, { children: per }),
							" and counts once per friend."
						] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Rule, {
						index: 3,
						icon: Lock,
						title: "When you actually get paid",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "rounded-xl bg-gold/10 p-2.5 text-[11px] leading-relaxed text-gold-dark",
								children: [
									"Milestones unlock earnings as ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "pending" }),
									". Pending earnings are",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "not" }),
									" part of your wallet balance and cannot be withdrawn."
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bullets, { items: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									"Nothing is credited to your wallet milestone by milestone — not even the first",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Amount, { children: per }),
									"."
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									"The full ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Amount, { children: full }),
									" is released to your main wallet in one go, once all",
									" ",
									REFERRAL_MILESTONE_COUNT,
									" milestones are complete."
								] }),
								"Once released, it behaves like any other wallet balance and can be withdrawn."
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								"The Refer & Earn screen shows ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Pending" }),
								" and ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Credited" }),
								" ",
								"separately, so you always know which is which."
							] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rule, {
						index: 4,
						icon: CalendarClock,
						title: "The time limit",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bullets, { items: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								"All ",
								REFERRAL_MILESTONE_COUNT,
								" milestones must be completed within",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [365, " days"] }),
								" of your friend's signup."
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								"If the window closes first, that referral expires and its pending earnings are",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "not" }),
								" released."
							] }),
							"Expired referrals do not affect your other referrals."
						] })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rule, {
						index: 5,
						icon: UserCheck,
						title: "Who is eligible",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bullets, { items: [
							"You and your friend must be two genuinely different, real people.",
							"Your friend must be new to CashGPT — one account per person.",
							"Both accounts must be in good standing when the reward is released."
						] })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Rule, {
						index: 6,
						icon: ShieldAlert,
						title: "Not allowed",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bullets, { items: [
							"Self-referrals, duplicate accounts or accounts you control yourself.",
							"Fake, bot-generated or purchased sign-ups.",
							"Bulk registrations from one device, IP or fingerprint.",
							"VPN, proxy or emulator networks used to disguise referral farming.",
							"Misleading claims or paid “sign up and abandon” traffic."
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Breaking these voids all referral rewards on the accounts involved — including earnings already released — and may lead to suspension." })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Rule, {
						index: 7,
						icon: EyeOff,
						title: "Privacy — what you can and cannot see",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "The referral details we show you are limited to what you are allowed to see about someone who joined with your code. That is:" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bullets, { items: [
								"A masked display name and avatar.",
								"The date they joined.",
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									"Their milestone progress (",
									REFERRAL_MILESTONE_COUNT,
									" steps) and nothing more."
								] })
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "rounded-xl bg-mint/10 p-2.5 text-[11px] leading-relaxed",
								children: [
									"You will ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "never" }),
									" see your friend's account details, wallet balance, transactions, withdrawals, earnings amounts, email, phone number or any other personal information. The same protection applies to your data when someone else refers you."
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rule, {
						index: 8,
						icon: RefreshCw,
						title: "Program changes",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bullets, { items: [
							"CashGPT may update the referral rules when necessary — reward amounts, milestone conditions, time windows, availability or caps.",
							"The program may also be paused or ended.",
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								"The rules ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "currently shown in the app" }),
								" are the ones that apply to your account — always check this page for the latest version."
							] })
						] })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rule, {
						index: 9,
						icon: LifeBuoy,
						title: "Questions",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							"Think a reward was missed, or something looks wrong? Open a support ticket from the",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/support",
								className: "font-semibold text-primary hover:underline",
								children: "Support"
							}),
							" ",
							"tab and our team will check your account."
						] })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-4 text-center text-[11px] leading-relaxed text-muted-foreground",
				children: [
					"For the full legal version, see the",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/legal/referral-terms",
						className: "font-semibold text-primary hover:underline",
						children: "Referral Program Terms"
					}),
					"."
				]
			})
		]
	});
}
var $$splitComponentImporter$23 = () => import("./special-CjvUsyDB.mjs");
/**
* Admin-configurable `tasks.icon` names mapped to lucide components. Curated
* rather than a namespace import so the icon set stays tree-shakeable.
*/
/** Resolves a stored icon name (any casing / spacing) to a lucide component. */
var Route$35 = createFileRoute("/_authenticated/special")({
	head: () => ({ meta: [
		{ title: "Special — CashGPT" },
		{
			name: "description",
			content: "Step-by-step tasks that pay into your CashGPT wallet."
		},
		{
			property: "og:title",
			content: "Special — CashGPT"
		},
		{
			property: "og:description",
			content: "Step-by-step tasks that pay into your CashGPT wallet."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$23, "component")
});
var $$splitComponentImporter$22 = () => import("./support-BnFtLhyw.mjs");
var Route$34 = createFileRoute("/_authenticated/support")({
	head: () => ({ meta: [
		{ title: "Support — CashGPT" },
		{
			name: "description",
			content: "FAQs and support tickets for your CashGPT account."
		},
		{
			property: "og:title",
			content: "Support — CashGPT"
		},
		{
			property: "og:description",
			content: "FAQs and support tickets for your CashGPT account."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$22, "component")
});
var $$splitComponentImporter$21 = () => import("./task-ComiMh6i.mjs");
var Route$33 = createFileRoute("/_authenticated/task")({
	head: () => ({ meta: [{ title: "Microtasks — CashGPT" }, {
		name: "description",
		content: "Short tasks from advertisers that pay into your wallet."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$21, "component")
});
var $$splitComponentImporter$20 = () => import("./wallet-CAhLTdJb.mjs");
var Route$32 = createFileRoute("/_authenticated/wallet")({
	head: () => ({ meta: [
		{ title: "Wallet — CashGPT" },
		{
			name: "description",
			content: "Track your balance, transactions and withdrawals."
		},
		{
			property: "og:title",
			content: "Wallet — CashGPT"
		},
		{
			property: "og:description",
			content: "Track your balance, transactions and withdrawals."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$20, "component")
});
var $$splitComponentImporter$19 = () => import("./auth_.confirmed-DoIrY_9K.mjs");
/**
* Landing page for the email-confirmation link (emailRedirectTo in useAuthForm).
*
* Previously the link pointed at "/", where WebEntry paints a blank placeholder
* while it verifies the session in the background — so a slow or failed
* verification (in-app browsers with restricted storage, expired links) left the
* user staring at an empty screen with no way out.
*
* FILE NAME: `auth_.confirmed.tsx`, not `auth/confirmed.tsx`. The trailing
* underscore opts out of nesting under `auth.tsx`, which renders no <Outlet /> —
* nesting would have rendered the sign-in page here instead of this one.
*
* SSR is deliberately left ON so the confirmation markup is in the server
* response and paints immediately. Session detection then happens on hydration.
*/
/** How long the success state shows before redirecting. */
/** How long to wait for a session before assuming verification failed. */
var Route$31 = createFileRoute("/auth_/confirmed")({
	head: () => ({ meta: [{ title: "Email verified — CashGPT" }, {
		name: "robots",
		content: "noindex,nofollow"
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$19, "component")
});
/**
* Supabase appends `error`/`error_description` to the redirect URL when a link is
* expired or already used. Reading it lets us show the real reason instead of
* waiting out the timeout for a generic message.
*/
var $$splitComponentImporter$18 = () => import("./privacy-D6oCUgrv.mjs");
var Route$30 = createFileRoute("/legal/privacy")({
	head: () => ({ meta: [
		{ title: "Privacy Policy — CashGPT" },
		{
			name: "description",
			content: "How CashGPT collects, uses and shares data — including third-party offer network requirements."
		},
		{
			property: "og:title",
			content: "Privacy Policy — CashGPT"
		},
		{
			property: "og:description",
			content: "Learn what data CashGPT collects and how it is used."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$18, "component")
});
var $$splitComponentImporter$17 = () => import("./referral-terms-Cf8rOf_n.mjs");
var Route$29 = createFileRoute("/legal/referral-terms")({
	head: () => ({ meta: [
		{ title: "Referral Program Terms — CashGPT" },
		{
			name: "description",
			content: "How the CashGPT referral program works, eligibility, fraud rules and reward timing."
		},
		{
			property: "og:title",
			content: "Referral Program Terms — CashGPT"
		},
		{
			property: "og:description",
			content: "Rules of the CashGPT referral program."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$17, "component")
});
var $$splitComponentImporter$16 = () => import("./terms-BxbBYR2p.mjs");
var Route$28 = createFileRoute("/legal/terms")({
	head: () => ({ meta: [
		{ title: "Terms of Service — CashGPT" },
		{
			name: "description",
			content: "CashGPT Terms of Service — eligibility, acceptable use, third-party offers, liability and account rules."
		},
		{
			property: "og:title",
			content: "Terms of Service — CashGPT"
		},
		{
			property: "og:description",
			content: "CashGPT Terms of Service — the rules of using the app."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$16, "component")
});
var $$splitComponentImporter$15 = () => import("./withdrawal-policy-Cco1ir5n.mjs");
var Route$27 = createFileRoute("/legal/withdrawal-policy")({
	head: () => ({ meta: [
		{ title: "Withdrawal & Payout Policy — CashGPT" },
		{
			name: "description",
			content: "CashGPT withdrawal thresholds, processing timelines, payout methods, rejections and fees."
		},
		{
			property: "og:title",
			content: "Withdrawal & Payout Policy — CashGPT"
		},
		{
			property: "og:description",
			content: "How CashGPT payouts work — limits, timelines, methods and fees."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$15, "component")
});
var $$splitComponentImporter$14 = () => import("./analytics-BZ2ynWGq.mjs");
var Route$26 = createFileRoute("/_authenticated/admin/analytics")({ component: lazyRouteComponent($$splitComponentImporter$14, "component") });
var $$splitComponentImporter$13 = () => import("./campaigns-DeNXY3gs.mjs");
var Route$25 = createFileRoute("/_authenticated/advertiser/campaigns")({
	head: () => ({ meta: [{ title: "My Campaigns — CashGPT" }] }),
	component: lazyRouteComponent($$splitComponentImporter$13, "component")
});
var $$splitComponentImporter$12 = () => import("./create-B4TAqOyr.mjs");
var Route$24 = createFileRoute("/_authenticated/advertiser/create")({
	head: () => ({ meta: [{ title: "Create Campaign — CashGPT" }] }),
	component: lazyRouteComponent($$splitComponentImporter$12, "component")
});
var $$splitComponentImporter$11 = () => import("./funds-D6r2OsHA.mjs");
var Route$23 = createFileRoute("/_authenticated/advertiser/funds")({
	head: () => ({ meta: [{ title: "Add Campaign Funds — CashGPT" }] }),
	component: lazyRouteComponent($$splitComponentImporter$11, "component")
});
var $$splitComponentImporter$10 = () => import("./help-BJkXL7Sk.mjs");
var Route$22 = createFileRoute("/_authenticated/advertiser/help")({
	head: () => ({ meta: [{ title: "Advertiser Help — CashGPT" }] }),
	component: lazyRouteComponent($$splitComponentImporter$10, "component")
});
var $$splitComponentImporter$9 = () => import("./referral-DhGaKKjq.mjs");
var Route$21 = createFileRoute("/_authenticated/advertiser/referral")({
	head: () => ({ meta: [{ title: "Advertiser Referral — CashGPT" }] }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./reviews-CRqEuxO_.mjs");
var Route$20 = createFileRoute("/_authenticated/advertiser/reviews")({
	head: () => ({ meta: [{ title: "Review Submissions — CashGPT" }] }),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./transactions-QhHv-jDG.mjs");
var Route$19 = createFileRoute("/_authenticated/advertiser/transactions")({
	head: () => ({ meta: [{ title: "Advertiser Transactions — CashGPT" }] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var Route$18 = createFileRoute("/_authenticated/microtask-proof/$id")({ beforeLoad: ({ params }) => {
	throw redirect({
		to: "/microtask/$id",
		params: { id: params.id }
	});
} });
var $$splitComponentImporter$6 = () => import("./microtask._id-BF4wWeE5.mjs");
var Route$17 = createFileRoute("/_authenticated/microtask/$id")({
	head: () => ({ meta: [{ title: "Task details — CashGPT" }] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitErrorComponentImporter = () => import("./offer._offerId-BdhMTAEG.mjs");
var $$splitComponentImporter$5 = () => import("./offer._offerId-CbKJhIqd.mjs");
var Route$16 = createFileRoute("/_authenticated/offer/$offerId")({
	component: lazyRouteComponent($$splitComponentImporter$5, "component"),
	errorComponent: lazyRouteComponent($$splitErrorComponentImporter, "errorComponent")
});
/**
* Analytics tracking endpoint
* 
* Accepts batched analytics events from the client tracker.
* Validates event names against allow-list, checks properties size,
* and stores events with user context.
* 
* Auth: Optional - accepts both authenticated and anonymous events.
*/
async function handle$10(request) {
	try {
		let payload;
		try {
			payload = await request.json();
		} catch {
			return Response.json({
				ok: false,
				error: "invalid json"
			}, { status: 400 });
		}
		if (!payload || typeof payload !== "object" || !("events" in payload)) return Response.json({
			ok: false,
			error: "missing events array"
		}, { status: 400 });
		let userId = null;
		try {
			const { supabaseServerClient } = await import("./client.server-gEMheit0.mjs").then((n) => n.t).then((n) => (n.n(), n.t));
			const { data: { user } } = await supabaseServerClient.auth.getUser();
			userId = user?.id || null;
		} catch {
			userId = null;
		}
		const { trackEventsImpl } = await import("./track.server-WnRCRIlW.mjs");
		const result = await trackEventsImpl(payload, userId);
		if (result.rejected.length > 0) console.warn("[analytics] rejected events:", result.rejected);
		return Response.json({
			ok: result.ok,
			accepted: result.accepted,
			rejected: result.rejected
		});
	} catch (err) {
		console.error("[analytics] track error:", err);
		return Response.json({
			ok: false,
			error: "internal error"
		}, { status: 500 });
	}
}
var Route$15 = createFileRoute("/api/analytics/track")({ server: { handlers: { POST: async ({ request }) => handle$10(request) } } });
/**
* Daily cleanup job for app_events table.
* 
* Deletes analytics events older than 90 days.
* This route is used when pg_cron is not available in the Supabase instance.
* 
* Schedule: Daily at 2 AM UTC (0 2 * * *)
* Auth: Authorization: Bearer must equal OFFER_FEED_CRON_SECRET (same as offer feed refresh).
*/
/** Constant-time string compare (portable — avoids node:crypto for edge/worker runtimes). */
function safeEqual$1(a, b) {
	if (a.length !== b.length) return false;
	let mismatch = 0;
	for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return mismatch === 0;
}
function isAuthorized$1(request) {
	const secret = process.env["OFFER_FEED_CRON_SECRET"];
	if (!secret) return false;
	const url = new URL(request.url);
	const provided = request.headers.get("x-cron-secret") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? url.searchParams.get("secret");
	if (!provided) return false;
	return safeEqual$1(provided, secret);
}
async function handle$9(request) {
	if (!isAuthorized$1(request)) return Response.json({
		ok: false,
		error: "unauthorized"
	}, { status: 401 });
	try {
		const { supabaseAdmin } = await import("./client.server-gEMheit0.mjs").then((n) => n.t).then((n) => (n.n(), n.t));
		const cutoffDate = /* @__PURE__ */ new Date();
		cutoffDate.setDate(cutoffDate.getDate() - 90);
		const { error, count } = await supabaseAdmin.from("app_events").delete({ count: "exact" }).lt("created_at", cutoffDate.toISOString());
		if (error) {
			console.error("[cleanup-events] delete failed:", error);
			return Response.json({
				ok: false,
				error: "delete failed",
				details: error.message
			}, { status: 500 });
		}
		console.log(`[cleanup-events] deleted ${count ?? 0} events older than 90 days`);
		return Response.json({
			ok: true,
			deletedCount: count ?? 0
		});
	} catch (err) {
		console.error("[cleanup-events] unexpected error:", err);
		return Response.json({
			ok: false,
			error: "unexpected error"
		}, { status: 500 });
	}
}
var Route$14 = createFileRoute("/api/cron/cleanup-events")({ server: { handlers: {
	GET: async ({ request }) => handle$9(request),
	POST: async ({ request }) => handle$9(request)
} } });
/**
* Scheduled background refresh for the offer feed cache.
*
* Not a per-request live fetch — this is meant to be hit by a cron scheduler on an interval.
* It refreshes every enabled network for every country that has been requested at least once
* (present in offer_feed_cache) plus the configured default country.
*
* Triggered once a day by Vercel Cron (schedule 0 3 * * *).
* Auth: Authorization: Bearer must equal OFFER_FEED_CRON_SECRET.
*
* Manual trigger example: /api/cron/refresh-offer-feed?secret=YOUR_SECRET
* The route also accepts the secret via the `x-cron-secret` header or `?secret=` query param.
*/
/** Constant-time string compare (portable — avoids node:crypto for edge/worker runtimes). */
function safeEqual(a, b) {
	if (a.length !== b.length) return false;
	let mismatch = 0;
	for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return mismatch === 0;
}
function isAuthorized(request) {
	const secret = process.env["OFFER_FEED_CRON_SECRET"];
	if (!secret) return false;
	const url = new URL(request.url);
	const provided = request.headers.get("x-cron-secret") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? url.searchParams.get("secret");
	if (!provided) return false;
	return safeEqual(provided, secret);
}
async function handle$8(request) {
	if (!isAuthorized(request)) return Response.json({
		ok: false,
		error: "unauthorized"
	}, { status: 401 });
	const force = new URL(request.url).searchParams.get("force") === "1";
	try {
		const { refreshAllFeedsImpl } = await import("./feed-cache.server-CY3cPWq8.mjs");
		const summary = await refreshAllFeedsImpl(force);
		return Response.json({
			ok: true,
			...summary
		});
	} catch (err) {
		console.error("[offer-feed-cron] refresh failed:", err);
		return Response.json({
			ok: false,
			error: "refresh failed"
		}, { status: 500 });
	}
}
var Route$13 = createFileRoute("/api/cron/refresh-offer-feed")({ server: { handlers: {
	GET: async ({ request }) => handle$8(request),
	POST: async ({ request }) => handle$8(request)
} } });
init_db_server();
/**
* Postback endpoint for auto-verified marketplace campaigns.
* GET /api/public/marketplace-postback?click_id=ABC123&token=SECRET&txn_id=TXN123
*
* Security (enforced):
* - Resolves campaign from click_id
* - Reads campaign_secrets with service client
* - auth_mode 'token': requires ?token=SECRET (compared with crypto.timingSafeEqual)
* - auth_mode 'hmac': requires X-Signature header (HMAC-SHA256 of query string)
* - Enforces ip_allowlist when non-empty
* - Returns 401 with no credit unless verified
* - Never logs or returns the secret
*/
var testRequests = /* @__PURE__ */ new Map();
function logPostback(campaignId, result, clickId, txnId, httpStatus) {
	(async () => {
		try {
			await mktDb.from("campaign_postback_log").insert({
				campaign_id: campaignId,
				result,
				click_id: clickId,
				txn_id: txnId,
				http_status: httpStatus
			});
			const { data: overflow } = await mktDb.from("campaign_postback_log").select("id").eq("campaign_id", campaignId).order("received_at", { ascending: false }).range(200, 1e3);
			const overflowIds = (overflow ?? []).map((row) => row.id);
			if (overflowIds.length) await mktDb.from("campaign_postback_log").delete().in("id", overflowIds);
		} catch (error) {
			console.error("[postback] log write failed", error instanceof Error ? error.message : error);
		}
	})();
}
function clientIp$6(request) {
	const header = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for");
	if (!header) return "unknown";
	return header.split(",")[0]?.trim() ?? "unknown";
}
async function handle$7(request) {
	const url = new URL(request.url);
	const clickId = url.searchParams.get("click_id");
	const txnId = url.searchParams.get("txn_id");
	const isTest = url.searchParams.get("test") === "1";
	const campaignIdParam = url.searchParams.get("campaign_id");
	if (!clickId && !(isTest && campaignIdParam)) return Response.json({
		ok: false,
		error: "click_id required"
	}, { status: 400 });
	if (!isTest && !txnId) return Response.json({
		ok: false,
		error: "txn_id required"
	}, { status: 400 });
	try {
		const { data: click, error: clickErr } = clickId ? await mktDb.from("campaign_clicks").select("campaign_id").eq("click_id", clickId).maybeSingle() : {
			data: campaignIdParam ? { campaign_id: campaignIdParam } : null,
			error: null
		};
		if (clickErr) {
			console.error("[postback] campaign_clicks lookup failed", clickErr.message);
			return Response.json({
				ok: false,
				error: "internal error"
			}, { status: 500 });
		}
		if (!click) return Response.json({
			ok: false,
			error: "unauthorized"
		}, { status: 401 });
		const campaignId = click.campaign_id;
		const logResult = (result, status) => logPostback(campaignId, result, clickId, txnId, status);
		const { data: secrets, error: secretErr } = await mktDb.from("campaign_secrets").select("auth_mode, secret, ip_allowlist").eq("campaign_id", campaignId).maybeSingle();
		if (secretErr) {
			console.error("[postback] campaign_secrets lookup failed", secretErr.message);
			return Response.json({
				ok: false,
				error: "internal error"
			}, { status: 500 });
		}
		if (!secrets) {
			logResult("unauthorized", 401);
			return Response.json({
				ok: false,
				error: "unauthorized"
			}, { status: 401 });
		}
		if (secrets.ip_allowlist && Array.isArray(secrets.ip_allowlist) && secrets.ip_allowlist.length > 0) {
			const sourceIp = clientIp$6(request);
			if (!secrets.ip_allowlist.includes(sourceIp)) {
				logResult("unauthorized", 401);
				return Response.json({
					ok: false,
					error: "unauthorized"
				}, { status: 401 });
			}
		}
		let signatureValid = false;
		if (secrets.auth_mode === "token") {
			const providedToken = url.searchParams.get("token");
			if (!providedToken) {
				logResult("unauthorized", 401);
				return Response.json({
					ok: false,
					error: "unauthorized"
				}, { status: 401 });
			}
			if (providedToken.length !== secrets.secret.length) {
				logResult("unauthorized", 401);
				return Response.json({
					ok: false,
					error: "unauthorized"
				}, { status: 401 });
			}
			try {
				signatureValid = crypto$2.timingSafeEqual(Buffer.from(providedToken), Buffer.from(secrets.secret));
			} catch {
				signatureValid = false;
			}
			if (!signatureValid) {
				logResult("unauthorized", 401);
				return Response.json({
					ok: false,
					error: "unauthorized"
				}, { status: 401 });
			}
		} else if (secrets.auth_mode === "hmac") {
			const signature = request.headers.get("x-signature");
			if (!signature) {
				logResult("unauthorized", 401);
				return Response.json({
					ok: false,
					error: "unauthorized"
				}, { status: 401 });
			}
			const params = {};
			url.searchParams.forEach((value, key) => {
				if (key !== "token") params[key] = value;
			});
			const signatureString = Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join("&");
			const expectedSignature = crypto$2.createHmac("sha256", secrets.secret).update(signatureString).digest("hex");
			try {
				signatureValid = crypto$2.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
			} catch {
				signatureValid = false;
			}
			if (!signatureValid) {
				logResult("unauthorized", 401);
				return Response.json({
					ok: false,
					error: "unauthorized"
				}, { status: 401 });
			}
		} else return Response.json({
			ok: false,
			error: "internal error"
		}, { status: 500 });
		if (isTest) {
			const now = Date.now();
			const recent = (testRequests.get(campaignId) ?? []).filter((time) => now - time < 6e4);
			if (recent.length >= 30) return Response.json({
				ok: false,
				error: "rate limited"
			}, { status: 429 });
			recent.push(now);
			testRequests.set(campaignId, recent);
			logResult("test_ok", 200);
			return Response.json({
				ok: true,
				message: "test_ok"
			}, { status: 200 });
		}
		const { recordConversionImpl } = await import("./conversion.server-CetVWmYa.mjs");
		const sourceIp = clientIp$6(request);
		const eventData = {};
		url.searchParams.forEach((value, key) => {
			if (key !== "token") eventData[key] = value;
		});
		const result = await recordConversionImpl(campaignId, clickId, txnId, sourceIp, eventData, signatureValid);
		if (!result.recorded) {
			logResult(result.reason === "held" ? "held" : "duplicate", 200);
			return Response.json({
				ok: true,
				message: result.reason || "already_credited"
			}, { status: 200 });
		}
		logResult("credited", 200);
		return Response.json({
			ok: true,
			message: result.status === "credited" ? "credited" : result.status,
			conversion_id: result.conversionId
		}, { status: 200 });
	} catch (err) {
		console.error("[postback] error", {
			clickId,
			error: err instanceof Error ? err.message : String(err)
		});
		return Response.json({
			ok: false,
			error: "internal error"
		}, { status: 500 });
	}
}
var Route$12 = createFileRoute("/api/public/marketplace-postback")({ server: { handlers: {
	GET: async ({ request }) => handle$7(request),
	POST: async ({ request }) => handle$7(request)
} } });
/**
* Razorpay webhook receiver — the only place advertiser deposits get credited.
*
* Configure in the Razorpay dashboard: Settings → Webhooks →
*   URL    https://<host>/api/public/razorpay-webhook
*   Secret RAZORPAY_WEBHOOK_SECRET
*   Events payment.captured, order.paid, payment.failed,
*          refund.created, refund.processed, payment.dispute.lost
*
* Signature: X-Razorpay-Signature = HMAC-SHA256(raw body, secret). Verified over
* the untouched body bytes in processRazorpayWebhook; a mismatch is a 401 and
* nothing is touched. Crediting goes through mkt_credit_deposit, which is
* idempotent per deposit — Razorpay retries and the duplicate order.paid /
* payment.captured pair are safe.
*/
async function handle$6(request) {
	const rawBody = await request.text();
	const signature = request.headers.get("x-razorpay-signature");
	const { processRazorpayWebhook } = await import("./advertiser.server-DyvSoHf7.mjs").then((n) => n.n).then((n) => (n.n(), n.t));
	try {
		const { httpStatus, ...result } = await processRazorpayWebhook(rawBody, signature);
		if (!result.ok) console.warn("[razorpay-webhook]", result);
		return Response.json(result, { status: httpStatus });
	} catch (err) {
		console.error("[razorpay-webhook] processing failed:", err);
		return Response.json({
			ok: false,
			action: "error"
		}, { status: 500 });
	}
}
var Route$11 = createFileRoute("/api/public/razorpay-webhook")({ server: { handlers: { POST: async ({ request }) => handle$6(request) } } });
var $$splitComponentImporter$4 = () => import("./edit._id-DTKyuxa7.mjs");
var Route$10 = createFileRoute("/_authenticated/advertiser/edit/$id")({
	head: () => ({ meta: [{ title: "Edit Campaign — CashGPT" }] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./results._id-CzWP99Bw.mjs");
var Route$9 = createFileRoute("/_authenticated/advertiser/results/$id")({
	head: () => ({ meta: [{ title: "Campaign Results — CashGPT" }] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./go._questKey._step-CNEmfOTv.mjs");
/**
* Return page from a shortlink network. Auto-runs completeShortlinkStep on mount.
* If the step is not final, offers a button to open the next shortlink.
* If final, shows a success screen with the credited reward.
*/
var Route$8 = createFileRoute("/_authenticated/go/$questKey/$step")({
	head: () => ({ meta: [{ title: "Quest step — CashGPT" }, {
		name: "description",
		content: "Return page for the CashGPT shortlink chain quests."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./go.locker.return-Cd4698Mw.mjs");
/**
* Return page for Content Locker quests.
*
* AdBlueMedia's static "Redirect URL" must be set (once, in their dashboard) to:
*   https://<your-domain>/go/locker/return?questKey=<your-quest-key>
*
* Because AdBlueMedia does not support per-session macros in the Redirect URL
* field, we identify the session by matching the currently authenticated user's
* most recent 'started' locker session for the given questKey.
* See completeLockerQuestImpl in quests.server.ts for the known limitation
* around concurrent sessions on multiple tabs/devices.
*/
var Route$7 = createFileRoute("/_authenticated/go/locker/return")({
	validateSearch: objectType({ questKey: stringType().min(1).max(40).optional() }),
	head: () => ({ meta: [{ title: "Reward — CashGPT" }, {
		name: "description",
		content: "Content locker quest return page."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./timed-ptc._questKey._step-C9oSq3qQ.mjs");
/**
* Timed PTC step page.
* Shows a countdown timer with periodic checkpoints that require ad interactions.
*/
var Route$6 = createFileRoute("/_authenticated/timed-ptc/$questKey/$step")({
	head: () => ({ meta: [{ title: "Timed PTC Quest — CashGPT" }, {
		name: "description",
		content: "Complete timed PTC quest step with ad checkpoints."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
/**
* Public postback endpoint for AdBlueMedia feed offers.
* 
* AdBlueMedia uses a single global postback URL per account with token-based authentication.
* 
* URL format (configured in AdBlueMedia publisher dashboard):
* https://cashgpt.in/api/public/feed-postback/adbluemedia?token=SECRET&s1={s1}&offer_id={offer_id}&lead_id={lead_id}&payout={payout}&status={status}
* 
* Query parameters:
* - token: Secret token for authentication (must match ADBLUEMEDIA_POSTBACK_TOKEN env var)
* - s1: User UUID (attached to click URL by our system)
* - offer_id: AdBlueMedia's external offer ID
* - lead_id: Unique transaction ID for deduplication
* - payout: Amount in dollars
* - status: "1" = success (credit), "0" = chargeback (log only)
* 
* Security:
* - Constant-time token comparison
* - No secrets logged or returned
* - Idempotent: duplicate lead_id returns 200 OK without double-credit
* 
* Returns:
* - 200 "OK" for success and duplicates
* - 401/403 for invalid token
* - 400 for invalid parameters
*/
function clientIp$5(request) {
	const header = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for");
	if (!header) return null;
	return header.split(",")[0]?.trim() ?? null;
}
async function handle$5(request) {
	const url = new URL(request.url);
	const token = url.searchParams.get("token") ?? "";
	const s1 = url.searchParams.get("s1") ?? "";
	const offer_id = url.searchParams.get("offer_id") ?? "";
	const lead_id = url.searchParams.get("lead_id") ?? "";
	const payout = url.searchParams.get("payout") ?? "";
	const status = url.searchParams.get("status") ?? "";
	const { processAdBlueMediaPostback } = await import("./adbluemedia-postback.server-BjIksC6M.mjs");
	const result = await processAdBlueMediaPostback({
		token,
		s1,
		offer_id,
		lead_id,
		payout,
		status
	}, clientIp$5(request));
	if (!result.ok) {
		if (result.reason === "invalid_token" || result.reason === "token_not_configured") return new Response("Unauthorized", { status: 401 });
		return new Response(result.reason ?? "Bad Request", { status: 400 });
	}
	return new Response("OK", { status: 200 });
}
var Route$5 = createFileRoute("/api/public/feed-postback/adbluemedia")({ server: { handlers: {
	GET: async ({ request }) => handle$5(request),
	POST: async ({ request }) => handle$5(request)
} } });
/**
* Public postback endpoint for GemiAd feed offers.
* 
* GemiAd sends postbacks to this URL with SHA256 signature verification.
* 
* URL format (configured in GemiAd publisher dashboard):
* https://yourdomain.com/api/public/feed-postback/gemiad?userId={userId}&offerId={offerId}&offerName={offerName}&eventId={eventId}&eventName={eventName}&payout={payout}&reward={reward}&txid={txid}&status={status}&ip={ip}&sub1={sub1}&sub2={sub2}&hash={hash}
* 
* Query parameters (all from GemiAd macros):
* - userId: User UUID
* - offerId: GemiAd external offer ID
* - offerName: Offer name (optional, logged only)
* - eventId: Event ID for multi-step offers (optional)
* - eventName: Event name (optional, logged only)
* - payout: Network payout amount in USD (positive=credit, negative=reversal)
* - reward: User reward amount (optional, logged only, NOT used for crediting)
* - txid: Unique transaction ID (deduplication key)
* - status: "completed" | "rejected"
* - ip: User's IP address (optional, logged only)
* - sub1: Optional tracking parameter (logged only)
* - sub2: Optional tracking parameter (logged only)
* - hash: SHA256 signature = sha256(userId + offerId + txid + GEMIAD_FEED_SECRET_KEY)
* 
* Security:
* - SHA256 signature verification (constant-time comparison)
* - Source IP allowlist: 64.226.92.208 (GemiAd postback server)
* - No secrets logged or returned
* - UUID format validation before DB query
* - Idempotent: duplicate (provider_slug='gemiad', external_lead_id=txid) returns 200 OK
* 
* Reversal handling:
* - status="rejected" OR payout < 0: Do not credit, wallet untouched
* - Still returns 200 OK to acknowledge the reversal
* 
* Response requirements:
* - Must respond HTTP 200 with body "Approved" within 5 seconds
* - GemiAd retries up to 3 times on failure, so must be idempotent
* 
* Returns:
* - 200 "Approved" for success, duplicates, and reversals
* - 401 for invalid signature or source IP
* - 400 for invalid parameters or missing user/offer
*/
function clientIp$4(request) {
	const header = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for");
	if (!header) return null;
	return header.split(",")[0]?.trim() ?? null;
}
async function handle$4(request) {
	const url = new URL(request.url);
	const userId = url.searchParams.get("userId") ?? "";
	const offerId = url.searchParams.get("offerId") ?? "";
	const offerName = url.searchParams.get("offerName") ?? void 0;
	const eventId = url.searchParams.get("eventId") ?? void 0;
	const eventName = url.searchParams.get("eventName") ?? void 0;
	const payout = url.searchParams.get("payout") ?? "";
	const reward = url.searchParams.get("reward") ?? void 0;
	const txid = url.searchParams.get("txid") ?? "";
	const status = url.searchParams.get("status") ?? "";
	const ip = url.searchParams.get("ip") ?? void 0;
	const sub1 = url.searchParams.get("sub1") ?? void 0;
	const sub2 = url.searchParams.get("sub2") ?? void 0;
	const hash = url.searchParams.get("hash") ?? "";
	const { processGemiAdPostback } = await import("./gemiad-postback.server-UKyqmdOg.mjs");
	const result = await processGemiAdPostback({
		userId,
		offerId,
		offerName,
		eventId,
		eventName,
		payout,
		reward,
		txid,
		status,
		ip,
		sub1,
		sub2,
		hash
	}, clientIp$4(request));
	if (!result.ok) {
		if (result.reason === "invalid_signature" || result.reason === "invalid_source_ip" || result.reason === "secret_not_configured") return new Response("Unauthorized", { status: 401 });
		return new Response(result.reason ?? "Bad Request", { status: 400 });
	}
	return new Response("Approved", { status: 200 });
}
var Route$4 = createFileRoute("/api/public/feed-postback/gemiad")({ server: { handlers: {
	GET: async ({ request }) => handle$4(request),
	POST: async ({ request }) => handle$4(request)
} } });
/**
* Public postback endpoint for OGAds feed offers.
* 
* OGAds uses a single global postback URL per account with token-based authentication.
* 
* URL format (configured in OGAds publisher dashboard):
* https://cashgpt.in/api/public/feed-postback/ogads?token=SECRET&offer_id={offer_id}&payout={payout}&aff_sub4={aff_sub4}&session_timestamp={session_timestamp}&session_ip={session_ip}
* 
* Query parameters:
* - token: Secret token for authentication (must match OGADS_POSTBACK_TOKEN env var)
* - offer_id: OGAds external offer ID
* - payout: Network payout amount (logged only, NOT used for user credit)
* - aff_sub4: User UUID (attached to click URL by appendAffSub4 in click-url.ts)
* - session_timestamp: Unix timestamp for deduplication
* - session_ip: User's IP address from OGAds session
* 
* Security:
* - Constant-time token comparison
* - No secrets logged or returned
* - UUID format validation before DB query
* - Idempotent: duplicate (provider_slug, external_lead_id) returns 200 OK without double-credit
* 
* Deduplication:
* - OGAds provides no unique lead_id, so we build: aff_sub4:offer_id:session_timestamp
* - Uses existing offer_claims_provider_lead_uniq constraint (migration 20270727000000)
* 
* Returns:
* - 200 "OK" for success and duplicates
* - 401 for invalid token
* - 400 for invalid parameters or missing user/offer
*/
function clientIp$3(request) {
	const header = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for");
	if (!header) return null;
	return header.split(",")[0]?.trim() ?? null;
}
async function handle$3(request) {
	const url = new URL(request.url);
	const token = url.searchParams.get("token") ?? "";
	const offer_id = url.searchParams.get("offer_id") ?? "";
	const payout = url.searchParams.get("payout") ?? "";
	const aff_sub4 = url.searchParams.get("aff_sub4") ?? "";
	const session_timestamp = url.searchParams.get("session_timestamp") ?? "";
	const session_ip = url.searchParams.get("session_ip") ?? void 0;
	const { processOgAdsPostback } = await import("./ogads-postback.server-DVpqijZX.mjs");
	const result = await processOgAdsPostback({
		token,
		offer_id,
		payout,
		aff_sub4,
		session_timestamp,
		session_ip
	}, clientIp$3(request));
	if (!result.ok) {
		if (result.reason === "invalid_token" || result.reason === "token_not_configured") return new Response("Unauthorized", { status: 401 });
		return new Response(result.reason ?? "Bad Request", { status: 400 });
	}
	return new Response("OK", { status: 200 });
}
var Route$3 = createFileRoute("/api/public/feed-postback/ogads")({ server: { handlers: {
	GET: async ({ request }) => handle$3(request),
	POST: async ({ request }) => handle$3(request)
} } });
/**
* Public postback endpoint for Torox feed offers.
* 
* Torox sends postbacks to this URL with MD5 signature verification.
* 
* URL format (configured in Torox publisher dashboard):
* https://yourdomain.com/api/public/feed-postback/torox?id={id}&oid={oid}&amount={amount}&currency_name={currency_name}&user_id={user_id}&payout={payout}&o_name={o_name}&sig={sig}&package_id={package_id}&ip_address={ip_address}&event={event}&subid1={subid1}&subid2={subid2}&subid3={subid3}&click_ts={click_ts}&conversion_ts={conversion_ts}
* 
* Query parameters (all from Torox macros):
* - id: Conversion ID (deduplication key)
* - oid: Offer ID (external_offer_id)
* - amount: Offer amount in USD (optional)
* - currency_name: Currency name (optional, logged only)
* - user_id: User UUID
* - payout: Publisher revenue in USD (positive=credit, negative=reversal)
* - o_name: Offer name (optional, logged only)
* - sig: MD5 signature = md5(oid + "-" + user_id + "-" + TOROX_FEED_TOKEN) (lowercase hex)
* - package_id: Package/app ID (optional, logged only)
* - ip_address: User's IP address (optional, logged only)
* - event: Event name (optional, logged only)
* - subid1: Optional tracking parameter (logged only)
* - subid2: Optional tracking parameter (logged only)
* - subid3: Optional tracking parameter (logged only)
* - click_ts: Click timestamp (optional, logged only)
* - conversion_ts: Conversion timestamp (optional, logged only)
* 
* Security:
* - MD5 signature verification (constant-time comparison)
* - Source IP allowlist: 44.212.211.226 (Torox postback server)
* - No secrets logged or returned
* - UUID format validation before DB query
* - Idempotent: duplicate (provider_slug='torox', external_lead_id=id) returns 200 "1"
* 
* Reversal handling:
* - payout < 0 OR amount < 0: Do not credit, wallet untouched
* - Still returns 200 "1" to acknowledge the reversal
* 
* Response requirements:
* - Must respond HTTP 200 with body "1" for success/duplicate/reversal
* - Must respond HTTP 200 with body "0" for failure
* - Torox retries on non-"1" response, so must be idempotent
* 
* Returns:
* - 200 "1" for success, duplicates, and reversals
* - 200 "0" for invalid signature, source IP, or other errors
*/
function clientIp$2(request) {
	const header = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for");
	if (!header) return null;
	return header.split(",")[0]?.trim() ?? null;
}
async function handle$2(request) {
	const url = new URL(request.url);
	const id = url.searchParams.get("id") ?? "";
	const oid = url.searchParams.get("oid") ?? "";
	const amount = url.searchParams.get("amount") ?? void 0;
	const currency_name = url.searchParams.get("currency_name") ?? void 0;
	const user_id = url.searchParams.get("user_id") ?? "";
	const payout = url.searchParams.get("payout") ?? "";
	const o_name = url.searchParams.get("o_name") ?? void 0;
	const sig = url.searchParams.get("sig") ?? "";
	const package_id = url.searchParams.get("package_id") ?? void 0;
	const ip_address = url.searchParams.get("ip_address") ?? void 0;
	const event = url.searchParams.get("event") ?? void 0;
	const subid1 = url.searchParams.get("subid1") ?? void 0;
	const subid2 = url.searchParams.get("subid2") ?? void 0;
	const subid3 = url.searchParams.get("subid3") ?? void 0;
	const click_ts = url.searchParams.get("click_ts") ?? void 0;
	const conversion_ts = url.searchParams.get("conversion_ts") ?? void 0;
	const { processToroxPostback } = await import("./torox-postback.server-DE8oqI32.mjs");
	if ((await processToroxPostback({
		id,
		oid,
		amount,
		currency_name,
		user_id,
		payout,
		o_name,
		sig,
		package_id,
		ip_address,
		event,
		subid1,
		subid2,
		subid3,
		click_ts,
		conversion_ts
	}, clientIp$2(request))).ok) return new Response("1", { status: 200 });
	return new Response("0", { status: 200 });
}
var Route$2 = createFileRoute("/api/public/feed-postback/torox")({ server: { handlers: {
	GET: async ({ request }) => handle$2(request),
	POST: async ({ request }) => handle$2(request)
} } });
/**
* Public postback endpoint for offers on payout_mode='auto_postback'.
*
* Networks (or a self-hosted locker page) POST/GET to:
*   /api/public/offer-postback/{offerId}?txn=…&uid=…&amount=…&sig=…
*
* Verification (HMAC signature over `txn:uid:amount` using the per-offer
* `postback_secret_ref` env var, plus optional IP allowlist) lives in
* src/lib/offers/postback.server.ts.
*/
function clientIp$1(request) {
	const header = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for");
	if (!header) return null;
	return header.split(",")[0]?.trim() ?? null;
}
function headerMap$1(request) {
	const out = {};
	request.headers.forEach((value, key) => {
		out[key.toLowerCase()] = value;
	});
	return out;
}
async function handle$1(request, offerId) {
	if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(offerId)) return Response.json({
		ok: false,
		status: "rejected",
		reason: "invalid_offer_id"
	}, { status: 400 });
	const url = new URL(request.url);
	const params = {};
	url.searchParams.forEach((value, key) => {
		params[key] = value;
	});
	let rawBody = "";
	if (request.method !== "GET" && request.method !== "HEAD") {
		const contentType = request.headers.get("content-type") ?? "";
		rawBody = await request.text();
		try {
			if (contentType.includes("application/json") && rawBody) {
				const parsed = JSON.parse(rawBody);
				for (const [key, value] of Object.entries(parsed)) if (value !== null && typeof value !== "object") params[key] = String(value);
			} else if (rawBody) new URLSearchParams(rawBody).forEach((value, key) => {
				params[key] = value;
			});
		} catch {}
	}
	const { processOfferPostback } = await import("./postback.server-DhFc9b4F.mjs");
	const result = await processOfferPostback({
		offerId,
		params,
		rawBody,
		headers: headerMap$1(request),
		sourceIp: clientIp$1(request)
	});
	const status = result.ok ? 200 : 400;
	return Response.json(result, { status });
}
var Route$1 = createFileRoute("/api/public/offer-postback/$offerId")({ server: { handlers: {
	GET: async ({ request, params }) => handle$1(request, params.offerId),
	POST: async ({ request, params }) => handle$1(request, params.offerId)
} } });
/**
* Generic SDK offerwall postback endpoint.
* Providers may call it with GET (query string) or POST (form / JSON body).
* Caller verification, dedupe and crediting live in the automation pipeline.
*/
function clientIp(request) {
	const header = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for");
	if (!header) return null;
	return header.split(",")[0]?.trim() ?? null;
}
function headerMap(request) {
	const out = {};
	request.headers.forEach((value, key) => {
		out[key.toLowerCase()] = value;
	});
	return out;
}
async function handle(request, slug) {
	const url = new URL(request.url);
	const params = {};
	url.searchParams.forEach((value, key) => {
		params[key] = value;
	});
	let rawBody = "";
	if (request.method !== "GET" && request.method !== "HEAD") {
		const contentType = request.headers.get("content-type") ?? "";
		if (contentType.includes("multipart/form-data")) try {
			(await request.formData()).forEach((value, key) => {
				if (typeof value === "string") params[key] = value;
			});
		} catch {}
		else {
			rawBody = await request.text();
			try {
				if (contentType.includes("application/json") && rawBody) {
					const parsed = JSON.parse(rawBody);
					for (const [key, value] of Object.entries(parsed)) if (value !== null && typeof value !== "object") params[key] = String(value);
				} else if (rawBody) new URLSearchParams(rawBody).forEach((value, key) => {
					params[key] = value;
				});
			} catch {}
		}
	}
	const { processSdkPostback } = await import("./postback.server-3ysI43zy.mjs");
	const result = await processSdkPostback({
		slug,
		params,
		rawBody,
		headers: headerMap(request),
		sourceIp: clientIp(request)
	});
	const status = result.ok ? 200 : result.status === "rejected" ? 400 : 200;
	if (slug === "adswedmedia") {
		const body = result.status === "duplicate" ? "DUP" : result.ok ? "OK" : "ERROR";
		return new Response(body, {
			status,
			headers: { "Content-Type": "text/plain" }
		});
	}
	if (slug === "bitcotasks" || slug === "revtoo") {
		const okText = result.ok || result.status === "duplicate" || result.reason === "zero_reward" ? "ok" : "error";
		return new Response(okText, {
			status,
			headers: { "Content-Type": "text/plain" }
		});
	}
	if (slug === "torox") {
		const body = result.ok || result.status === "duplicate" ? "1" : "0";
		return new Response(body, {
			status: 200,
			headers: { "Content-Type": "text/plain" }
		});
	}
	return Response.json(result, { status });
}
var Route = createFileRoute("/api/public/offerwall/$slug")({ server: { handlers: {
	GET: async ({ request, params }) => handle(request, params.slug),
	POST: async ({ request, params }) => handle(request, params.slug)
} } });
var IndexRoute = Route$56.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$57
});
var AuthenticatedRouteRoute = Route$55.update({
	id: "/_authenticated",
	getParentRoute: () => Route$57
});
var AppRoute = Route$54.update({
	id: "/app",
	path: "/app",
	getParentRoute: () => Route$57
});
var AuthRoute = Route$53.update({
	id: "/auth",
	path: "/auth",
	getParentRoute: () => Route$57
});
var PreviewLiveActivityRoute = Route$52.update({
	id: "/preview-live-activity",
	path: "/preview-live-activity",
	getParentRoute: () => Route$57
});
var PreviewQuestCardsRoute = Route$51.update({
	id: "/preview-quest-cards",
	path: "/preview-quest-cards",
	getParentRoute: () => Route$57
});
var PreviewReferRoute = Route$50.update({
	id: "/preview-refer",
	path: "/preview-refer",
	getParentRoute: () => Route$57
});
var PreviewReferralRulesRoute = Route$49.update({
	id: "/preview-referral-rules",
	path: "/preview-referral-rules",
	getParentRoute: () => Route$57
});
var PreviewSectionHeadingRoute = Route$48.update({
	id: "/preview-section-heading",
	path: "/preview-section-heading",
	getParentRoute: () => Route$57
});
var PreviewSplashRoute = Route$47.update({
	id: "/preview-splash",
	path: "/preview-splash",
	getParentRoute: () => Route$57
});
var AuthenticatedAdminRoute = Route$46.update({
	id: "/admin",
	path: "/admin",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedFeaturedRoute = Route$45.update({
	id: "/featured",
	path: "/featured",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedHomeRoute = Route$44.update({
	id: "/home",
	path: "/home",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedMySubmissionsRoute = Route$43.update({
	id: "/my-submissions",
	path: "/my-submissions",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedNotificationsRoute = Route$42.update({
	id: "/notifications",
	path: "/notifications",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedOffersRoute = Route$41.update({
	id: "/offers",
	path: "/offers",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedOfferwallRoute = Route$40.update({
	id: "/offerwall",
	path: "/offerwall",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedOnboardingRoute = Route$39.update({
	id: "/onboarding",
	path: "/onboarding",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedProfileRoute = Route$38.update({
	id: "/profile",
	path: "/profile",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedReferRoute = Route$37.update({
	id: "/refer",
	path: "/refer",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedReferralRulesRoute = Route$36.update({
	id: "/referral-rules",
	path: "/referral-rules",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedSpecialRoute = Route$35.update({
	id: "/special",
	path: "/special",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedSupportRoute = Route$34.update({
	id: "/support",
	path: "/support",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedTaskRoute = Route$33.update({
	id: "/task",
	path: "/task",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedWalletRoute = Route$32.update({
	id: "/wallet",
	path: "/wallet",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthConfirmedRoute = Route$31.update({
	id: "/auth_/confirmed",
	path: "/auth/confirmed",
	getParentRoute: () => Route$57
});
var LegalPrivacyRoute = Route$30.update({
	id: "/legal/privacy",
	path: "/legal/privacy",
	getParentRoute: () => Route$57
});
var LegalReferralTermsRoute = Route$29.update({
	id: "/legal/referral-terms",
	path: "/legal/referral-terms",
	getParentRoute: () => Route$57
});
var LegalTermsRoute = Route$28.update({
	id: "/legal/terms",
	path: "/legal/terms",
	getParentRoute: () => Route$57
});
var LegalWithdrawalPolicyRoute = Route$27.update({
	id: "/legal/withdrawal-policy",
	path: "/legal/withdrawal-policy",
	getParentRoute: () => Route$57
});
var AuthenticatedAdminAnalyticsRoute = Route$26.update({
	id: "/analytics",
	path: "/analytics",
	getParentRoute: () => AuthenticatedAdminRoute
});
var AuthenticatedAdvertiserCampaignsRoute = Route$25.update({
	id: "/advertiser/campaigns",
	path: "/advertiser/campaigns",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedAdvertiserCreateRoute = Route$24.update({
	id: "/advertiser/create",
	path: "/advertiser/create",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedAdvertiserFundsRoute = Route$23.update({
	id: "/advertiser/funds",
	path: "/advertiser/funds",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedAdvertiserHelpRoute = Route$22.update({
	id: "/advertiser/help",
	path: "/advertiser/help",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedAdvertiserReferralRoute = Route$21.update({
	id: "/advertiser/referral",
	path: "/advertiser/referral",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedAdvertiserReviewsRoute = Route$20.update({
	id: "/advertiser/reviews",
	path: "/advertiser/reviews",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedAdvertiserTransactionsRoute = Route$19.update({
	id: "/advertiser/transactions",
	path: "/advertiser/transactions",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedMicrotaskProofIdRoute = Route$18.update({
	id: "/microtask-proof/$id",
	path: "/microtask-proof/$id",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedMicrotaskIdRoute = Route$17.update({
	id: "/microtask/$id",
	path: "/microtask/$id",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedOfferOfferIdRoute = Route$16.update({
	id: "/offer/$offerId",
	path: "/offer/$offerId",
	getParentRoute: () => AuthenticatedRouteRoute
});
var ApiAnalyticsTrackRoute = Route$15.update({
	id: "/api/analytics/track",
	path: "/api/analytics/track",
	getParentRoute: () => Route$57
});
var ApiCronCleanupEventsRoute = Route$14.update({
	id: "/api/cron/cleanup-events",
	path: "/api/cron/cleanup-events",
	getParentRoute: () => Route$57
});
var ApiCronRefreshOfferFeedRoute = Route$13.update({
	id: "/api/cron/refresh-offer-feed",
	path: "/api/cron/refresh-offer-feed",
	getParentRoute: () => Route$57
});
var ApiPublicMarketplacePostbackRoute = Route$12.update({
	id: "/api/public/marketplace-postback",
	path: "/api/public/marketplace-postback",
	getParentRoute: () => Route$57
});
var ApiPublicRazorpayWebhookRoute = Route$11.update({
	id: "/api/public/razorpay-webhook",
	path: "/api/public/razorpay-webhook",
	getParentRoute: () => Route$57
});
var AuthenticatedAdvertiserEditIdRoute = Route$10.update({
	id: "/advertiser/edit/$id",
	path: "/advertiser/edit/$id",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedAdvertiserResultsIdRoute = Route$9.update({
	id: "/advertiser/results/$id",
	path: "/advertiser/results/$id",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedGoQuestKeyStepRoute = Route$8.update({
	id: "/go/$questKey/$step",
	path: "/go/$questKey/$step",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedGoLockerReturnRoute = Route$7.update({
	id: "/go/locker/return",
	path: "/go/locker/return",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedTimedPtcQuestKeyStepRoute = Route$6.update({
	id: "/timed-ptc/$questKey/$step",
	path: "/timed-ptc/$questKey/$step",
	getParentRoute: () => AuthenticatedRouteRoute
});
var ApiPublicFeedPostbackAdbluemediaRoute = Route$5.update({
	id: "/api/public/feed-postback/adbluemedia",
	path: "/api/public/feed-postback/adbluemedia",
	getParentRoute: () => Route$57
});
var ApiPublicFeedPostbackGemiadRoute = Route$4.update({
	id: "/api/public/feed-postback/gemiad",
	path: "/api/public/feed-postback/gemiad",
	getParentRoute: () => Route$57
});
var ApiPublicFeedPostbackOgadsRoute = Route$3.update({
	id: "/api/public/feed-postback/ogads",
	path: "/api/public/feed-postback/ogads",
	getParentRoute: () => Route$57
});
var ApiPublicFeedPostbackToroxRoute = Route$2.update({
	id: "/api/public/feed-postback/torox",
	path: "/api/public/feed-postback/torox",
	getParentRoute: () => Route$57
});
var ApiPublicOfferPostbackOfferIdRoute = Route$1.update({
	id: "/api/public/offer-postback/$offerId",
	path: "/api/public/offer-postback/$offerId",
	getParentRoute: () => Route$57
});
var ApiPublicOfferwallSlugRoute = Route.update({
	id: "/api/public/offerwall/$slug",
	path: "/api/public/offerwall/$slug",
	getParentRoute: () => Route$57
});
var AuthenticatedAdminRouteChildren = { AuthenticatedAdminAnalyticsRoute };
var AuthenticatedRouteRouteChildren = {
	AuthenticatedAdminRoute: AuthenticatedAdminRoute._addFileChildren(AuthenticatedAdminRouteChildren),
	AuthenticatedFeaturedRoute,
	AuthenticatedHomeRoute,
	AuthenticatedMySubmissionsRoute,
	AuthenticatedNotificationsRoute,
	AuthenticatedOffersRoute,
	AuthenticatedOfferwallRoute,
	AuthenticatedOnboardingRoute,
	AuthenticatedProfileRoute,
	AuthenticatedReferRoute,
	AuthenticatedReferralRulesRoute,
	AuthenticatedSpecialRoute,
	AuthenticatedSupportRoute,
	AuthenticatedTaskRoute,
	AuthenticatedWalletRoute,
	AuthenticatedAdvertiserCampaignsRoute,
	AuthenticatedAdvertiserCreateRoute,
	AuthenticatedAdvertiserFundsRoute,
	AuthenticatedAdvertiserHelpRoute,
	AuthenticatedAdvertiserReferralRoute,
	AuthenticatedAdvertiserReviewsRoute,
	AuthenticatedAdvertiserTransactionsRoute,
	AuthenticatedMicrotaskProofIdRoute,
	AuthenticatedMicrotaskIdRoute,
	AuthenticatedOfferOfferIdRoute,
	AuthenticatedAdvertiserEditIdRoute,
	AuthenticatedAdvertiserResultsIdRoute,
	AuthenticatedGoQuestKeyStepRoute,
	AuthenticatedGoLockerReturnRoute,
	AuthenticatedTimedPtcQuestKeyStepRoute
};
var rootRouteChildren = {
	IndexRoute,
	AuthenticatedRouteRoute: AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren),
	AppRoute,
	AuthRoute,
	PreviewLiveActivityRoute,
	PreviewQuestCardsRoute,
	PreviewReferRoute,
	PreviewReferralRulesRoute,
	PreviewSectionHeadingRoute,
	PreviewSplashRoute,
	AuthConfirmedRoute,
	LegalPrivacyRoute,
	LegalReferralTermsRoute,
	LegalTermsRoute,
	LegalWithdrawalPolicyRoute,
	ApiAnalyticsTrackRoute,
	ApiCronCleanupEventsRoute,
	ApiCronRefreshOfferFeedRoute,
	ApiPublicMarketplacePostbackRoute,
	ApiPublicRazorpayWebhookRoute,
	ApiPublicFeedPostbackAdbluemediaRoute,
	ApiPublicFeedPostbackGemiadRoute,
	ApiPublicFeedPostbackOgadsRoute,
	ApiPublicFeedPostbackToroxRoute,
	ApiPublicOfferPostbackOfferIdRoute,
	ApiPublicOfferwallSlugRoute
};
var routeTree = Route$57._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
var getRouter = () => {
	const queryClient = new QueryClient({ defaultOptions: { queries: {
		staleTime: 3e4,
		refetchOnWindowFocus: true,
		retry: 1
	} } });
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0,
		defaultPreload: "intent"
	});
};
//#endregion
export { advertiserAccountIsNew as $, transferEarningsToAdvertiser as $n, reviewProof as $t, Dialog as A, getDashboardSignups as An, abandonDeposit as At, TESTIMONIALS as B, listStaff as Bn, getCampaignForEdit as Bt, ActiveTimeProvider as C, createWithdrawal as Cn, startLockerQuest as Ct, Input as D, exportUsersCsv as Dn, updateUserTimezone as Dt, Label as E, exportTransactionsCsv as En, startTimedPtcStep as Et, FAQ_ITEMS as F, getUserDetail as Fn, createCampaign as Ft, DialogDescription as G, requestAccountDeletion as Gn, listCategories as Gt, formatReward as H, rejectAdjustmentRequest as Hn, getDepositStatus as Ht, HOW_IT_WORKS as I, getUsersWithSameDevice as In, createDeposit as It, DialogTitle as J, setMaintenanceMode as Jn, listPendingCampaigns as Jt, DialogFooter as K, savePayoutMethod as Kn, listMyCampaigns as Kt, LANDING_DESCRIPTION as L, getWithdrawalFraudSignals as Ln, createNowpaymentsDeposit as Lt, SectionHeading as M, getDeviceId as Mn, appealSubmission as Mt, APK_DOWNLOAD_URL as N, getMaintenanceStatus as Nn, campaignAction as Nt, Checkbox as O, getDashboardActiveUsers as On, Button as Ot, EARN_WAYS as P, getUserAuditLog as Pn, confirmCheckout as Pt, isNativePlatform as Q, submitOfferProof as Qn, reviewCampaign as Qt, SHOWCASE_OFFERS as R, listAdjustmentRequests as Rn, createQropayDeposit as Rt, AlertDialogTitle as S, createQuickReply as Sn, startActiveTimeGrace as St, rememberAdvertiserIntent as T, exportPayoutsCsv as Tn, startSurveyQuest as Tt, DialogClose as U, removeRole as Un, listActiveCampaigns as Ut, WEB_HOW_IT_WORKS as V, playRewardedAd as Vn, getCampaignResults as Vt, DialogContent as W, reportAdWatched as Wn, listAdvertiserTransactions as Wt, useCountUp as X, startOfferClaim as Xn, listPendingReviews as Xt, DialogTrigger as Y, signOutEverywhere as Yn, listPendingProofs as Yt, useCountUpOnVisible as Z, startQuest as Zn, recordClick as Zt, AlertDialogCancel as _, cancelWithdrawal as _n, openQuestNetwork as _t, Route$10 as a, adminListAuditLogs as an, completeShortlinkStep as at, AlertDialogFooter as b, completeTask as bn, quests_functions_exports as bt, getMarketplaceSettings as c, adminListUsers as cn, ensureCheckinSession as ct, AppShell as d, adminRespondTicket as dn, getNetworkQuestProgress as dt, reviewSubmission as en, updateQuickReply as er, advertiserOnboardingActivationKey as et, BrandLogo as f, adminSetFlag as fn, getQuestActiveTimeProgress as ft, AlertDialogAction as g, assignRole as gn, listSdkProvidersForQuests as gt, AlertDialog as h, approveAdjustmentRequest as hn, listAdminQuests as ht, Route$9 as i, adminAdjustWallet as in, completeLockerQuest as it, useIsNative as j, getDashboardTopOffers as jn, addCampaignBudget as jt, useViewedOffer as k, getDashboardRevenuePayout as kn, RoleProvider as kt, updateMarketplaceSettings as l, adminListWithdrawals as ln, fetchSurveyFeed as lt, ActiveTimeStillHereDialog as m, adminUpdateWithdrawal as mn, listActiveQuests as mt, Route$6 as n, submitProofForCampaign as nn, useServerFn as nr, getAdvertiserOnboardingContent as nt, Route$16 as o, adminListClaims as on, completeTimedPtcStep as ot, BrandMark as p, adminUpdateOfferClaim as pn, getSurveyQuestProgress as pt, DialogHeader as q, sendBroadcastNotification as qn, listMySubmissions as qt, Route$8 as r, useRole as rn, cn as rr, useCheckinHeartbeat as rt, Route$17 as s, adminListTickets as sn, deleteQuest as st, router_exports as t, rotateCampaignSecret as tn, useAuth as tr, advertiserOnboardingStorageKey as tt, getAdvertiserReferralStats as u, adminOverview as un, getActiveTimeQuestKey as ut, AlertDialogContent as v, claimOffer as vn, pingActiveTime as vt, useActiveTime as w, deleteQuickReply as wn, startShortlinkStep as wt, AlertDialogHeader as x, createAdjustmentRequest as xn, saveQuest as xt, AlertDialogDescription as y, completeOnboarding as yn, processActiveTimePing as yt, STORE_COPY as z, listQuickReplies as zn, editCampaign as zt };
