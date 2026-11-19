import { i as createServerFn } from "./server-CpGMOUrW.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Br_KWlRY.mjs";
import { i as enumType, l as stringType, o as numberType, r as booleanType, s as objectType } from "../_libs/zod.mjs";
import { a as TASK_TYPES, r as TASK_LOCK_TYPES, t as TASK_FREQUENCIES } from "./types-BeKSJIcg.mjs";
import { t as createServerRpc } from "./createServerRpc-BPtk4SPL.mjs";
import { t as withServerTiming } from "./server-timing-middleware-BDljk4aZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tasks.functions-5faH8Qm6.js
var taskInput = objectType({
	id: stringType().uuid().optional(),
	title: stringType().trim().min(2).max(120),
	description: stringType().trim().max(500).default(""),
	icon: stringType().trim().max(40).default("target"),
	imageUrl: stringType().trim().max(500).nullable().optional(),
	reward: numberType().min(0).max(1e4),
	taskType: enumType(TASK_TYPES),
	target: numberType().int().min(1).max(1e5),
	frequency: enumType(TASK_FREQUENCIES),
	windowDays: numberType().int().min(1).max(365).nullable().optional(),
	startsAt: stringType().nullable().optional(),
	endsAt: stringType().nullable().optional(),
	sortOrder: numberType().int().min(-1e3).max(1e3).default(0),
	isActive: booleanType().default(true),
	isFeatured: booleanType().default(false),
	earningTarget: numberType().min(.01).max(1e5).nullable().optional(),
	earningProviderId: stringType().uuid().nullable().optional(),
	lockType: enumType(TASK_LOCK_TYPES).default("none"),
	unlockAt: stringType().nullable().optional()
});
var listAdminTasks_createServerFn_handler = createServerRpc({
	id: "c91c951ce76c21ec2e6eb2eed9dc27fd83cfcf0ab41c3577a3c3dfbd38a01ef9",
	name: "listAdminTasks",
	filename: "src/lib/tasks.functions.ts"
}, (opts) => listAdminTasks.__executeServer(opts));
var listAdminTasks = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	status: enumType([
		"all",
		"active",
		"inactive"
	]).default("all"),
	taskType: stringType().max(40).default("all")
}).parse(input ?? {})).handler(listAdminTasks_createServerFn_handler, withServerTiming("listAdminTasks", async ({ data, context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { listAdminTasksImpl } = await import("./admin.server-BmiGhqNJ.mjs");
	return listAdminTasksImpl(data);
}));
var saveAdminTask_createServerFn_handler = createServerRpc({
	id: "2938aa646e13b524a8024f6fab490fcb3c5e662bad721b55da4a0e7173d4a94f",
	name: "saveAdminTask",
	filename: "src/lib/tasks.functions.ts"
}, (opts) => saveAdminTask.__executeServer(opts));
var saveAdminTask = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => taskInput.parse(input)).handler(saveAdminTask_createServerFn_handler, withServerTiming("saveAdminTask", async ({ data, context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { upsertAdminTaskImpl } = await import("./admin.server-BmiGhqNJ.mjs");
	return upsertAdminTaskImpl(data);
}));
var setAdminTaskActive_createServerFn_handler = createServerRpc({
	id: "94cc60bee564ee34f6c461a08365cc9ea57608ea564d851162bbfbb247d8d5c3",
	name: "setAdminTaskActive",
	filename: "src/lib/tasks.functions.ts"
}, (opts) => setAdminTaskActive.__executeServer(opts));
var setAdminTaskActive = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid(),
	isActive: booleanType()
}).parse(input)).handler(setAdminTaskActive_createServerFn_handler, withServerTiming("setAdminTaskActive", async ({ data, context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { setAdminTaskActiveImpl } = await import("./admin.server-BmiGhqNJ.mjs");
	return setAdminTaskActiveImpl(data.id, data.isActive);
}));
var deleteAdminTask_createServerFn_handler = createServerRpc({
	id: "33fe3e85e3e734fbfa02b4e8709fa45c366b966dfb0eb3c7dfd2c4eb20060001",
	name: "deleteAdminTask",
	filename: "src/lib/tasks.functions.ts"
}, (opts) => deleteAdminTask.__executeServer(opts));
var deleteAdminTask = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(deleteAdminTask_createServerFn_handler, withServerTiming("deleteAdminTask", async ({ data, context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { deleteAdminTaskImpl } = await import("./admin.server-BmiGhqNJ.mjs");
	return deleteAdminTaskImpl(data.id);
}));
var requestTaskImageUploadUrl_createServerFn_handler = createServerRpc({
	id: "d7488d8f2d9585235f7e02cd9eb1961bcbc41feddd5632ef47d629dd8452d8ff",
	name: "requestTaskImageUploadUrl",
	filename: "src/lib/tasks.functions.ts"
}, (opts) => requestTaskImageUploadUrl.__executeServer(opts));
var requestTaskImageUploadUrl = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ filename: stringType().trim().min(1).max(120) }).parse(input)).handler(requestTaskImageUploadUrl_createServerFn_handler, withServerTiming("requestTaskImageUploadUrl", async ({ data, context }) => {
	const { assertAdmin } = await import("./coinquest.server-CBcexWIA.mjs").then((n) => n.t).then((n) => n.t);
	await assertAdmin(context.supabase, context.userId);
	const { requestTaskImageUploadUrlImpl } = await import("./admin.server-BmiGhqNJ.mjs");
	return requestTaskImageUploadUrlImpl(context.userId, data.filename);
}));
var refreshMyTasks_createServerFn_handler = createServerRpc({
	id: "099357483872b0de9c0cd536938f0b3aefae1cfe68e538c32bdd14ac324500f6",
	name: "refreshMyTasks",
	filename: "src/lib/tasks.functions.ts"
}, (opts) => refreshMyTasks.__executeServer(opts));
var refreshMyTasks = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(refreshMyTasks_createServerFn_handler, withServerTiming("refreshMyTasks", async ({ context }) => {
	const { syncUserTasks } = await import("./engine.server-C6tIpR1m.mjs");
	return syncUserTasks(context.userId);
}));
//#endregion
export { deleteAdminTask_createServerFn_handler, listAdminTasks_createServerFn_handler, refreshMyTasks_createServerFn_handler, requestTaskImageUploadUrl_createServerFn_handler, saveAdminTask_createServerFn_handler, setAdminTaskActive_createServerFn_handler };
