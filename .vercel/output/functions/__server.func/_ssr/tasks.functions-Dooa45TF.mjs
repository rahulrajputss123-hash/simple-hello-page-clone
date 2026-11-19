import { i as createServerFn } from "./server-CpGMOUrW.mjs";
import { t as createSsrRpc } from "./createSsrRpc-Bbq2Yr9O.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Br_KWlRY.mjs";
import { i as enumType, l as stringType, o as numberType, r as booleanType, s as objectType } from "../_libs/zod.mjs";
import { a as TASK_TYPES, r as TASK_LOCK_TYPES, t as TASK_FREQUENCIES } from "./types-BeKSJIcg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tasks.functions-Dooa45TF.js
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
var listAdminTasks = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	status: enumType([
		"all",
		"active",
		"inactive"
	]).default("all"),
	taskType: stringType().max(40).default("all")
}).parse(input ?? {})).handler(createSsrRpc("c91c951ce76c21ec2e6eb2eed9dc27fd83cfcf0ab41c3577a3c3dfbd38a01ef9"));
var saveAdminTask = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => taskInput.parse(input)).handler(createSsrRpc("2938aa646e13b524a8024f6fab490fcb3c5e662bad721b55da4a0e7173d4a94f"));
var setAdminTaskActive = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid(),
	isActive: booleanType()
}).parse(input)).handler(createSsrRpc("94cc60bee564ee34f6c461a08365cc9ea57608ea564d851162bbfbb247d8d5c3"));
var deleteAdminTask = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(createSsrRpc("33fe3e85e3e734fbfa02b4e8709fa45c366b966dfb0eb3c7dfd2c4eb20060001"));
/**
* Signed upload URL for admin task images (task-assets bucket).
*
* Mirrors requestOfferwallLogoUploadUrl, except the filename is only length-capped
* here and sanitised server-side — the old strict `^[A-Za-z0-9._-]+$` regex rejected
* ordinary filenames containing spaces or parentheses before they ever reached the
* sanitiser.
*/
var requestTaskImageUploadUrl = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ filename: stringType().trim().min(1).max(120) }).parse(input)).handler(createSsrRpc("d7488d8f2d9585235f7e02cd9eb1961bcbc41feddd5632ef47d629dd8452d8ff"));
/** Refreshes the signed-in user's automated task progress from real activity. */
var refreshMyTasks = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("099357483872b0de9c0cd536938f0b3aefae1cfe68e538c32bdd14ac324500f6"));
//#endregion
export { saveAdminTask as a, requestTaskImageUploadUrl as i, listAdminTasks as n, setAdminTaskActive as o, refreshMyTasks as r, deleteAdminTask as t };
