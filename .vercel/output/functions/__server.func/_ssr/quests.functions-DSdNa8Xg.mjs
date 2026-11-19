import { i as createServerFn } from "./server-CpGMOUrW.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Br_KWlRY.mjs";
import { i as enumType, l as stringType, n as arrayType, o as numberType, r as booleanType, s as objectType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-BPtk4SPL.mjs";
import { t as withServerTiming } from "./server-timing-middleware-BDljk4aZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/quests.functions-DSdNa8Xg.js
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
var listActiveQuests_createServerFn_handler = createServerRpc({
	id: "6ec3785b5340a6c4e7e32744d3bbbc719ea3d940d654049ff8a508c117884b30",
	name: "listActiveQuests",
	filename: "src/lib/quests.functions.ts"
}, (opts) => listActiveQuests.__executeServer(opts));
var listActiveQuests = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ isNative: booleanType().optional().default(false) }).parse(input)).handler(listActiveQuests_createServerFn_handler, withServerTiming("listActiveQuests", async ({ data, context }) => {
	const { listActiveQuestsImpl } = await import("./quests.server-C-e2yiq_.mjs");
	return listActiveQuestsImpl(context.userId, data.isNative);
}));
var listAdminQuests_createServerFn_handler = createServerRpc({
	id: "1e5b0cb8d5d4f064fb5d3e63fe837f49245be02d431739537235c3a9c493a24c",
	name: "listAdminQuests",
	filename: "src/lib/quests.functions.ts"
}, (opts) => listAdminQuests.__executeServer(opts));
var listAdminQuests = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(listAdminQuests_createServerFn_handler, withServerTiming("listAdminQuests", async ({ context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { listAdminQuestsImpl } = await import("./quests.server-C-e2yiq_.mjs");
	return listAdminQuestsImpl();
}));
var saveQuest_createServerFn_handler = createServerRpc({
	id: "5c24e8a9841a8e4c3d765536b0d527ee0b3ab7c5771de0cf0a870c2fef46b3bd",
	name: "saveQuest",
	filename: "src/lib/quests.functions.ts"
}, (opts) => saveQuest.__executeServer(opts));
var saveQuest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => questFormSchema.parse(input)).handler(saveQuest_createServerFn_handler, withServerTiming("saveQuest", async ({ data, context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { upsertQuestImpl } = await import("./quests.server-C-e2yiq_.mjs");
	return upsertQuestImpl(data);
}));
var deleteQuest_createServerFn_handler = createServerRpc({
	id: "a03b81ebb9860460017f4301a536a581f9a1cb593796f760b3bb87d6b5a61682",
	name: "deleteQuest",
	filename: "src/lib/quests.functions.ts"
}, (opts) => deleteQuest.__executeServer(opts));
var deleteQuest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(deleteQuest_createServerFn_handler, withServerTiming("deleteQuest", async ({ data, context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { deleteQuestImpl } = await import("./quests.server-C-e2yiq_.mjs");
	return deleteQuestImpl(data.id);
}));
var startShortlinkStep_createServerFn_handler = createServerRpc({
	id: "50369dc8041e0f1633f8e9d111f00f15a04808cbddd3c04b0a29d1780ed9d04a",
	name: "startShortlinkStep",
	filename: "src/lib/quests.functions.ts"
}, (opts) => startShortlinkStep.__executeServer(opts));
var startShortlinkStep = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	questKey: stringType().min(1).max(40),
	step: numberType().int().min(1).max(10),
	isNative: booleanType().optional().default(false)
}).parse(input)).handler(startShortlinkStep_createServerFn_handler, withServerTiming("startShortlinkStep", async ({ data, context }) => {
	const { startShortlinkStepImpl } = await import("./quests.server-C-e2yiq_.mjs");
	return startShortlinkStepImpl(context.userId, data.questKey, data.step, data.isNative);
}));
var completeShortlinkStep_createServerFn_handler = createServerRpc({
	id: "a2e1136a7fe9ee33e8a98e0a2dcbe265af076be4942452cf95d74ae82a984037",
	name: "completeShortlinkStep",
	filename: "src/lib/quests.functions.ts"
}, (opts) => completeShortlinkStep.__executeServer(opts));
var completeShortlinkStep = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	questKey: stringType().min(1).max(40),
	step: numberType().int().min(1).max(10),
	isNative: booleanType().optional().default(false)
}).parse(input)).handler(completeShortlinkStep_createServerFn_handler, withServerTiming("completeShortlinkStep", async ({ data, context }) => {
	const { completeShortlinkStepImpl } = await import("./quests.server-C-e2yiq_.mjs");
	return completeShortlinkStepImpl(context.userId, data.questKey, data.step, data.isNative);
}));
var startTimedPtcStep_createServerFn_handler = createServerRpc({
	id: "88d044370dcbcebbae90178e5043c60096c7b4fecf8ba4e6ab7d032f939f7648",
	name: "startTimedPtcStep",
	filename: "src/lib/quests.functions.ts"
}, (opts) => startTimedPtcStep.__executeServer(opts));
var startTimedPtcStep = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	questKey: stringType().min(1).max(40),
	step: numberType().int().min(1).max(10),
	isNative: booleanType().optional().default(false)
}).parse(input)).handler(startTimedPtcStep_createServerFn_handler, withServerTiming("startTimedPtcStep", async ({ data, context }) => {
	const { startTimedPtcStepImpl } = await import("./timed-ptc.server-DCRSNllZ.mjs");
	return startTimedPtcStepImpl(context.userId, data.questKey, data.step, data.isNative);
}));
var completeTimedPtcStep_createServerFn_handler = createServerRpc({
	id: "7007da75d1dcac471af5a70484867b72815f34fe68f76855ff5774148c895910",
	name: "completeTimedPtcStep",
	filename: "src/lib/quests.functions.ts"
}, (opts) => completeTimedPtcStep.__executeServer(opts));
var completeTimedPtcStep = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	questKey: stringType().min(1).max(40),
	step: numberType().int().min(1).max(10),
	checkpointsDone: numberType().int().min(0).max(100),
	isNative: booleanType().optional().default(false)
}).parse(input)).handler(completeTimedPtcStep_createServerFn_handler, withServerTiming("completeTimedPtcStep", async ({ data, context }) => {
	const { completeTimedPtcStepImpl } = await import("./timed-ptc.server-DCRSNllZ.mjs");
	return completeTimedPtcStepImpl(context.userId, data.questKey, data.step, data.checkpointsDone, data.isNative);
}));
var startLockerQuest_createServerFn_handler = createServerRpc({
	id: "f1035bbae52f7fca5385a916bed488fc71d295d58b1768c47f084be7632141a2",
	name: "startLockerQuest",
	filename: "src/lib/quests.functions.ts"
}, (opts) => startLockerQuest.__executeServer(opts));
var startLockerQuest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	questKey: stringType().min(1).max(40),
	isNative: booleanType().optional().default(false)
}).parse(input)).handler(startLockerQuest_createServerFn_handler, withServerTiming("startLockerQuest", async ({ data, context }) => {
	const { startLockerQuestImpl } = await import("./quests.server-C-e2yiq_.mjs");
	return startLockerQuestImpl(context.userId, data.questKey, data.isNative);
}));
var completeLockerQuest_createServerFn_handler = createServerRpc({
	id: "a19f75bb513a10f83c33b8cc120fca54414d81318ec4991323529a447efefc51",
	name: "completeLockerQuest",
	filename: "src/lib/quests.functions.ts"
}, (opts) => completeLockerQuest.__executeServer(opts));
var completeLockerQuest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	questKey: stringType().min(1).max(40),
	isNative: booleanType().optional().default(false)
}).parse(input)).handler(completeLockerQuest_createServerFn_handler, withServerTiming("completeLockerQuest", async ({ data, context }) => {
	const { completeLockerQuestImpl } = await import("./quests.server-C-e2yiq_.mjs");
	return completeLockerQuestImpl(context.userId, data.questKey, data.isNative);
}));
var ensureCheckinSession_createServerFn_handler = createServerRpc({
	id: "bec3a0b3879f1e1b2d6d399aa4d751a65feb0de2bb943315be8997828a6a5e0e",
	name: "ensureCheckinSession",
	filename: "src/lib/quests.functions.ts"
}, (opts) => ensureCheckinSession.__executeServer(opts));
var ensureCheckinSession = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ questKey: stringType().min(1).max(40) }).parse(input)).handler(ensureCheckinSession_createServerFn_handler, withServerTiming("ensureCheckinSession", async ({ data, context }) => {
	const { ensureCheckinSessionImpl } = await import("./quests.server-C-e2yiq_.mjs");
	return ensureCheckinSessionImpl(context.userId, data.questKey);
}));
var pingActiveTime_createServerFn_handler = createServerRpc({
	id: "cef844c72587d57fc888b189b67ddcd835c7cd19ae967982ddf91ed50c8cb904",
	name: "pingActiveTime",
	filename: "src/lib/quests.functions.ts"
}, (opts) => pingActiveTime.__executeServer(opts));
var pingActiveTime = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ questKey: stringType().min(1).max(40) }).parse(input)).handler(pingActiveTime_createServerFn_handler, withServerTiming("pingActiveTime", async ({ data, context }) => {
	const { pingActiveTimeImpl } = await import("./quests.server-C-e2yiq_.mjs");
	return pingActiveTimeImpl(context.userId, data.questKey);
}));
var checkInToday_createServerFn_handler = createServerRpc({
	id: "705633caa6134c8ce4cd31b45c7bc7ae85165f5bb875f52535eeb6dfbf0e1b34",
	name: "checkInToday",
	filename: "src/lib/quests.functions.ts"
}, (opts) => checkInToday.__executeServer(opts));
var checkInToday = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ questKey: stringType().min(1).max(40) }).parse(input)).handler(checkInToday_createServerFn_handler, withServerTiming("checkInToday", async ({ data, context }) => {
	const { checkInTodayImpl } = await import("./quests.server-C-e2yiq_.mjs");
	return checkInTodayImpl(context.userId, data.questKey);
}));
var updateUserTimezone_createServerFn_handler = createServerRpc({
	id: "fd087eab454d1a70419d9dff8f6cb2a398aafc5701120272724c0b59d62ba6f5",
	name: "updateUserTimezone",
	filename: "src/lib/quests.functions.ts"
}, (opts) => updateUserTimezone.__executeServer(opts));
var updateUserTimezone = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ timezone: stringType().trim().min(1).max(100) }).parse(input)).handler(updateUserTimezone_createServerFn_handler, withServerTiming("updateUserTimezone", async ({ data, context }) => {
	const { updateUserTimezoneImpl } = await import("./quests.server-C-e2yiq_.mjs");
	return updateUserTimezoneImpl(context.userId, data.timezone);
}));
var openQuestNetwork_createServerFn_handler = createServerRpc({
	id: "a31872f9e4147316c165a9d9badc989c93ec627768bde954f52825f0bb25cc68",
	name: "openQuestNetwork",
	filename: "src/lib/quests.functions.ts"
}, (opts) => openQuestNetwork.__executeServer(opts));
var openQuestNetwork = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	questKey: stringType().min(1).max(40),
	providerId: stringType().uuid()
}).parse(input)).handler(openQuestNetwork_createServerFn_handler, withServerTiming("openQuestNetwork", async ({ data, context }) => {
	const { openQuestNetworkImpl } = await import("./quests.server-C-e2yiq_.mjs");
	return openQuestNetworkImpl(context.userId, data.questKey, data.providerId);
}));
var getNetworkQuestProgress_createServerFn_handler = createServerRpc({
	id: "bdd8412a518cb4eba332a3fa82e2bbd5f74c9acfbc7a7a972bc5ec56d2b67b0d",
	name: "getNetworkQuestProgress",
	filename: "src/lib/quests.functions.ts"
}, (opts) => getNetworkQuestProgress.__executeServer(opts));
var getNetworkQuestProgress = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ questKey: stringType().min(1).max(40) }).parse(input)).handler(getNetworkQuestProgress_createServerFn_handler, withServerTiming("getNetworkQuestProgress", async ({ data, context }) => {
	const { getNetworkQuestProgressImpl } = await import("./quests.server-C-e2yiq_.mjs");
	return getNetworkQuestProgressImpl(context.userId, data.questKey);
}));
var startFeedQuest_createServerFn_handler = createServerRpc({
	id: "2c5406b4f29b5fa4985355e5ea844aa88185334de80dfb5049cfdd19867f977e",
	name: "startFeedQuest",
	filename: "src/lib/quests.functions.ts"
}, (opts) => startFeedQuest.__executeServer(opts));
var startFeedQuest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ questKey: stringType() }).parse(input)).handler(startFeedQuest_createServerFn_handler, withServerTiming("startFeedQuest", async ({ context, data: { questKey } }) => {
	try {
		const { getRequest } = await import("./server-MpHFnXW_.mjs");
		const { getActiveQuestByKey, startFeedQuestImpl } = await import("./quests.server-C-e2yiq_.mjs");
		const { supabaseAdmin } = await import("./client.server-gEMheit0.mjs").then((n) => n.t).then((n) => (n.n(), n.t));
		const db = supabaseAdmin;
		const quest = await getActiveQuestByKey(context.userId, questKey);
		if (!quest) throw new Error("Quest not found or not unlocked");
		if (!quest.feed_kind) throw new Error("Not a feed quest");
		const request = getRequest();
		const result = await startFeedQuestImpl(db, context.userId, questKey, quest, request);
		if (!result.success) throw new Error(result.reason === "unavailable" ? "Not enough campaigns available" : "Failed to start quest");
		return { sessionId: result.sessionId };
	} catch (e) {
		console.error("[feed-quest] startFeedQuest FAILED:", e instanceof Error ? e.stack : e);
		throw e;
	}
}));
var openFeedQuestStep_createServerFn_handler = createServerRpc({
	id: "6cf688e24a3ee56a47ab363b5deb2ffc96e531e071e15e6f2455845a6ddd0e30",
	name: "openFeedQuestStep",
	filename: "src/lib/quests.functions.ts"
}, (opts) => openFeedQuestStep.__executeServer(opts));
var openFeedQuestStep = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	questKey: stringType(),
	step: numberType().int().min(1)
}).parse(input)).handler(openFeedQuestStep_createServerFn_handler, withServerTiming("openFeedQuestStep", async ({ context, data: { questKey, step } }) => {
	try {
		const { getRequest } = await import("./server-MpHFnXW_.mjs");
		const { getActiveQuestByKey, openFeedQuestStepImpl } = await import("./quests.server-C-e2yiq_.mjs");
		const { supabaseAdmin } = await import("./client.server-gEMheit0.mjs").then((n) => n.t).then((n) => (n.n(), n.t));
		const db = supabaseAdmin;
		const quest = await getActiveQuestByKey(context.userId, questKey);
		if (!quest) throw new Error("Quest not found or not unlocked");
		if (!quest.feed_kind) throw new Error("Not a feed quest");
		const result = await openFeedQuestStepImpl(db, context.userId, questKey, step, quest, getRequest());
		if (result.error) throw new Error(result.error);
		return { url: result.url };
	} catch (e) {
		console.error("[feed-quest] openFeedQuestStep FAILED:", e instanceof Error ? e.stack : e);
		throw e;
	}
}));
var getFeedQuestProgress_createServerFn_handler = createServerRpc({
	id: "658527fa974b5f8e35f690e417a88b854b678e758ea20ab4c7a3ce76f60355cd",
	name: "getFeedQuestProgress",
	filename: "src/lib/quests.functions.ts"
}, (opts) => getFeedQuestProgress.__executeServer(opts));
var getFeedQuestProgress = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ questKey: stringType() }).parse(input)).handler(getFeedQuestProgress_createServerFn_handler, withServerTiming("getFeedQuestProgress", async ({ context, data: { questKey } }) => {
	const { supabaseAdmin } = await import("./client.server-gEMheit0.mjs").then((n) => n.t).then((n) => (n.n(), n.t));
	const db = supabaseAdmin;
	const { data: session } = await db.from("quest_sessions").select("id, feed_snapshot, status").eq("user_id", context.userId).eq("quest_key", questKey).eq("status", "started").order("started_at", { ascending: false }).maybeSingle();
	if (!session) return {
		steps: [],
		completed: []
	};
	const mainSteps = (session.feed_snapshot || []).filter((s) => !s.backup);
	const { data: completions } = await db.from("quest_network_completions").select("step_index").eq("session_id", session.id).eq("kind", "feed");
	const completedStepIndexes = new Set((completions || []).map((c) => c.step_index));
	return {
		steps: mainSteps.map((s, idx) => ({
			step: idx + 1,
			source: s.source,
			title: s.title,
			rewardUsd: s.rewardUsd,
			completed: completedStepIndexes.has(idx + 1)
		})),
		completed: Array.from(completedStepIndexes)
	};
}));
var fetchSurveyFeed_createServerFn_handler = createServerRpc({
	id: "7dfe5c9c0312a363dd0e8ff6e41f6b4aae35a6c9d51f6a65b6ded779049cd62b",
	name: "fetchSurveyFeed",
	filename: "src/lib/quests.functions.ts"
}, (opts) => fetchSurveyFeed.__executeServer(opts));
var fetchSurveyFeed = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	questKey: stringType().min(1).max(40),
	sessionId: stringType().uuid()
}).parse(input)).handler(fetchSurveyFeed_createServerFn_handler, withServerTiming("fetchSurveyFeed", async ({ data, context }) => {
	const { getRequest } = await import("./server-MpHFnXW_.mjs");
	const { detectIpFromRequest, detectCountryFromRequest } = await import("./geo.server-BPDqDCBk.mjs");
	const { getActiveQuestByKey } = await import("./quests.server-C-e2yiq_.mjs");
	const { fetchSurveyFeed: fetchSurveyFeedImpl } = await import("./survey-feed.server-BLKKtAWa.mjs");
	const quest = await getActiveQuestByKey(context.userId, data.questKey);
	if (!quest) throw new Error("Quest not found or not unlocked");
	if (quest.quest_type !== "survey") throw new Error("Not a survey quest");
	const request = getRequest();
	const ip = detectIpFromRequest();
	const countryCode = detectCountryFromRequest();
	const userAgent = request?.headers?.get("user-agent") || "Mozilla/5.0";
	if (!ip || !countryCode) return {
		surveys: [],
		networks: [{
			network: "system",
			ok: false,
			count: 0,
			reason: `Unable to determine ${!ip ? "IP address" : "country"}. Network targeting requires valid geo data.`
		}]
	};
	return await fetchSurveyFeedImpl({
		userId: context.userId,
		sessionId: data.sessionId,
		ip,
		countryCode,
		userAgent,
		allowedNetworks: quest.allowed_networks,
		minPayoutUsd: quest.min_payout_usd ?? void 0,
		maxLoi: quest.max_loi ?? void 0
	});
}));
var startSurveyQuest_createServerFn_handler = createServerRpc({
	id: "7ccc9b45da74a1471a1818b7ab07c9d3b4abaf5817887ddb4f67e697be59c49b",
	name: "startSurveyQuest",
	filename: "src/lib/quests.functions.ts"
}, (opts) => startSurveyQuest.__executeServer(opts));
var startSurveyQuest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ questKey: stringType().min(1).max(40) }).parse(input)).handler(startSurveyQuest_createServerFn_handler, withServerTiming("startSurveyQuest", async ({ data, context }) => {
	const { getActiveQuestByKey } = await import("./quests.server-C-e2yiq_.mjs");
	const { supabaseAdmin } = await import("./client.server-gEMheit0.mjs").then((n) => n.t).then((n) => (n.n(), n.t));
	const quest = await getActiveQuestByKey(context.userId, data.questKey);
	if (!quest) throw new Error("Quest not found or not unlocked");
	if (quest.quest_type !== "survey") throw new Error("Not a survey quest");
	const db = supabaseAdmin;
	const { data: existingSession } = await db.from("quest_sessions").select("id").eq("user_id", context.userId).eq("quest_key", data.questKey).eq("status", "started").maybeSingle();
	if (existingSession) return { sessionId: existingSession.id };
	const { data: newSession, error } = await db.from("quest_sessions").insert({
		user_id: context.userId,
		quest_key: data.questKey,
		quest_type: "survey",
		status: "started"
	}).select("id").single();
	if (error) throw new Error(`Failed to create survey quest session: ${error.message}`);
	return { sessionId: newSession.id };
}));
var getSurveyQuestProgress_createServerFn_handler = createServerRpc({
	id: "dcf7373c0658abe2988a25d239bc7944cb7c412e0b12701a08df24d92fa1266d",
	name: "getSurveyQuestProgress",
	filename: "src/lib/quests.functions.ts"
}, (opts) => getSurveyQuestProgress.__executeServer(opts));
var getSurveyQuestProgress = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ questKey: stringType().min(1).max(40) }).parse(input)).handler(getSurveyQuestProgress_createServerFn_handler, withServerTiming("getSurveyQuestProgress", async ({ data, context }) => {
	const { getActiveQuestByKey } = await import("./quests.server-C-e2yiq_.mjs");
	const { supabaseAdmin } = await import("./client.server-gEMheit0.mjs").then((n) => n.t).then((n) => (n.n(), n.t));
	const quest = await getActiveQuestByKey(context.userId, data.questKey);
	if (!quest) throw new Error("Quest not found or not unlocked");
	if (quest.quest_type !== "survey") throw new Error("Not a survey quest");
	const db = supabaseAdmin;
	const { data: session } = await db.from("quest_sessions").select("id, status").eq("user_id", context.userId).eq("quest_key", data.questKey).in("status", ["started", "verified"]).order("started_at", { ascending: false }).maybeSingle();
	if (!session) return {
		completed: 0,
		required: quest.required_surveys,
		isComplete: false
	};
	const { data: credits } = await db.from("quest_step_credits").select("step_index").eq("session_id", session.id);
	return {
		completed: (credits || []).length,
		required: quest.required_surveys,
		isComplete: session.status === "verified"
	};
}));
var listSdkProvidersForQuests_createServerFn_handler = createServerRpc({
	id: "63d8fb14ad0c7aedbce0b0328f87b059830d5c6d1ffea83aeda7baef888b176a",
	name: "listSdkProvidersForQuests",
	filename: "src/lib/quests.functions.ts"
}, (opts) => listSdkProvidersForQuests.__executeServer(opts));
var listSdkProvidersForQuests = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(listSdkProvidersForQuests_createServerFn_handler, withServerTiming("listSdkProvidersForQuests", async ({ context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-gEMheit0.mjs").then((n) => n.t).then((n) => (n.n(), n.t));
	const { data, error } = await supabaseAdmin.from("sdk_offerwall_providers").select("id, name, slug, enabled, status").eq("enabled", true).order("name", { ascending: true });
	if (error) throw error;
	return data || [];
}));
var getActiveTimeQuestKey_createServerFn_handler = createServerRpc({
	id: "55d205c4104833b5da1cc369fabe6432aeaf54b61e5ec03777ba6a05481fe8d2",
	name: "getActiveTimeQuestKey",
	filename: "src/lib/quests.functions.ts"
}, (opts) => getActiveTimeQuestKey.__executeServer(opts));
var getActiveTimeQuestKey = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(getActiveTimeQuestKey_createServerFn_handler, withServerTiming("getActiveTimeQuestKey", async ({ context }) => {
	const { supabaseAdmin } = await import("./client.server-gEMheit0.mjs").then((n) => n.t).then((n) => (n.n(), n.t));
	const db = supabaseAdmin;
	const { data: quest } = await db.from("quests").select("key, target_minutes").eq("quest_type", "active_time").eq("is_active", true).order("created_at", { ascending: true }).limit(1).maybeSingle();
	if (!quest) return { questKey: null };
	const { data: progress } = await db.from("quest_active_time_progress").select("total_seconds, credited_at").eq("user_id", context.userId).eq("quest_key", quest.key).maybeSingle();
	if (!progress) return { questKey: quest.key };
	if (!progress.credited_at && progress.total_seconds < quest.target_minutes * 60) return { questKey: quest.key };
	return { questKey: null };
}));
var processActiveTimePing_createServerFn_handler = createServerRpc({
	id: "da0a6ff20dcd5dddf23e892fe8b96b3a0b242fe0e3faa3e505fcd7b0e279a3ab",
	name: "processActiveTimePing",
	filename: "src/lib/quests.functions.ts"
}, (opts) => processActiveTimePing.__executeServer(opts));
var processActiveTimePing = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	questKey: stringType().min(1).max(40),
	pingToken: stringType().nullable(),
	isActive: booleanType().default(true)
}).parse(input)).handler(processActiveTimePing_createServerFn_handler, withServerTiming("processActiveTimePing", async ({ data, context }) => {
	const { processActiveTimePingImpl, claimActiveTimeRewardImpl } = await import("./quests.server-C-e2yiq_.mjs");
	const result = await processActiveTimePingImpl(context.userId, data.questKey, data.pingToken, data.isActive);
	if (result.success && result.canClaim) try {
		if ((await claimActiveTimeRewardImpl(context.userId, data.questKey)).success) return {
			...result,
			autoClaimed: true
		};
	} catch (err) {
		console.error("[active-time] Auto-claim failed:", err);
	}
	return result;
}));
var getQuestActiveTimeProgress_createServerFn_handler = createServerRpc({
	id: "16fba392848896b5beac1cd77afde2cf48211a79c9dc79a450e3e27f88dded40",
	name: "getQuestActiveTimeProgress",
	filename: "src/lib/quests.functions.ts"
}, (opts) => getQuestActiveTimeProgress.__executeServer(opts));
var getQuestActiveTimeProgress = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ questKey: stringType().min(1).max(40) }).parse(input)).handler(getQuestActiveTimeProgress_createServerFn_handler, withServerTiming("getQuestActiveTimeProgress", async ({ data, context }) => {
	const { data: progress, error: progressError } = await supabaseAdmin.from("quest_active_time_progress").select("total_seconds, today_seconds, today_date").eq("user_id", context.userId).eq("quest_key", data.questKey).maybeSingle();
	if (progressError) {
		console.error("[getQuestActiveTimeProgress] DB error:", progressError);
		throw new Error(`Failed to load progress: ${progressError.message}`);
	}
	if (!progress) return null;
	const { data: quest, error: questError } = await supabaseAdmin.from("quests").select("target_minutes").eq("key", data.questKey).maybeSingle();
	if (questError) {
		console.error("[getQuestActiveTimeProgress] Quest lookup error:", questError);
		throw new Error(`Failed to load quest config: ${questError.message}`);
	}
	const targetMinutes = quest?.target_minutes ?? 120;
	return {
		totalSeconds: progress.total_seconds,
		todaySeconds: progress.today_seconds,
		todayDate: progress.today_date,
		targetSeconds: targetMinutes * 60
	};
}));
var startActiveTimeGrace_createServerFn_handler = createServerRpc({
	id: "89667eeeedc6d755c2afe5ebbafa244938c64ba501d89a3ef96d3772eb5ea52f",
	name: "startActiveTimeGrace",
	filename: "src/lib/quests.functions.ts"
}, (opts) => startActiveTimeGrace.__executeServer(opts));
var startActiveTimeGrace = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	questKey: stringType().min(1).max(40),
	offerId: stringType().min(1).max(200)
}).parse(input)).handler(startActiveTimeGrace_createServerFn_handler, withServerTiming("startActiveTimeGrace", async ({ data, context }) => {
	const { startActiveTimeGraceImpl } = await import("./quests.server-C-e2yiq_.mjs");
	return await startActiveTimeGraceImpl(context.userId, data.questKey, data.offerId);
}));
var endActiveTimeGrace_createServerFn_handler = createServerRpc({
	id: "54403fd88ead069bb713c532eb8fca2b0538b59139b03e58be3a6b55f7160ed0",
	name: "endActiveTimeGrace",
	filename: "src/lib/quests.functions.ts"
}, (opts) => endActiveTimeGrace.__executeServer(opts));
var endActiveTimeGrace = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ questKey: stringType().min(1).max(40) }).parse(input)).handler(endActiveTimeGrace_createServerFn_handler, withServerTiming("endActiveTimeGrace", async ({ data, context }) => {
	const { endActiveTimeGraceImpl } = await import("./quests.server-C-e2yiq_.mjs");
	return await endActiveTimeGraceImpl(context.userId, data.questKey);
}));
var claimActiveTimeReward_createServerFn_handler = createServerRpc({
	id: "911f464e6d3f0f9b48a2cba46755d85d612a44875fe7e277ba6312a45844fdee",
	name: "claimActiveTimeReward",
	filename: "src/lib/quests.functions.ts"
}, (opts) => claimActiveTimeReward.__executeServer(opts));
var claimActiveTimeReward = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ questKey: stringType().min(1).max(40) }).parse(input)).handler(claimActiveTimeReward_createServerFn_handler, withServerTiming("claimActiveTimeReward", async ({ data, context }) => {
	const { claimActiveTimeRewardImpl } = await import("./quests.server-C-e2yiq_.mjs");
	return await claimActiveTimeRewardImpl(context.userId, data.questKey);
}));
//#endregion
export { checkInToday_createServerFn_handler, claimActiveTimeReward_createServerFn_handler, completeLockerQuest_createServerFn_handler, completeShortlinkStep_createServerFn_handler, completeTimedPtcStep_createServerFn_handler, deleteQuest_createServerFn_handler, endActiveTimeGrace_createServerFn_handler, ensureCheckinSession_createServerFn_handler, fetchSurveyFeed_createServerFn_handler, getActiveTimeQuestKey_createServerFn_handler, getFeedQuestProgress_createServerFn_handler, getNetworkQuestProgress_createServerFn_handler, getQuestActiveTimeProgress_createServerFn_handler, getSurveyQuestProgress_createServerFn_handler, listActiveQuests_createServerFn_handler, listAdminQuests_createServerFn_handler, listSdkProvidersForQuests_createServerFn_handler, openFeedQuestStep_createServerFn_handler, openQuestNetwork_createServerFn_handler, pingActiveTime_createServerFn_handler, processActiveTimePing_createServerFn_handler, saveQuest_createServerFn_handler, startActiveTimeGrace_createServerFn_handler, startFeedQuest_createServerFn_handler, startLockerQuest_createServerFn_handler, startShortlinkStep_createServerFn_handler, startSurveyQuest_createServerFn_handler, startTimedPtcStep_createServerFn_handler, updateUserTimezone_createServerFn_handler };
