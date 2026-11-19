import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.server-BmiGhqNJ.js
init_client_server();
async function listAdminTasksImpl(filters) {
	let query = supabaseAdmin.from("tasks").select("*").order("sort_order").order("created_at");
	if (filters.status === "active") query = query.eq("is_active", true);
	if (filters.status === "inactive") query = query.eq("is_active", false);
	if (filters.taskType && filters.taskType !== "all") query = query.eq("task_type", filters.taskType);
	const tasks = await query;
	if (tasks.error) throw new Error("Could not load tasks.");
	const stats = await supabaseAdmin.from("user_tasks").select("task_id, status, reward_status");
	const byTask = /* @__PURE__ */ new Map();
	for (const row of stats.data ?? []) {
		const entry = byTask.get(row.task_id) ?? {
			participants: 0,
			completed: 0,
			paid: 0
		};
		entry.participants += 1;
		if (row.status === "completed") entry.completed += 1;
		if (row.reward_status === "paid") entry.paid += 1;
		byTask.set(row.task_id, entry);
	}
	return (tasks.data ?? []).map((task) => ({
		...task,
		stats: byTask.get(task.id) ?? {
			participants: 0,
			completed: 0,
			paid: 0
		}
	}));
}
async function upsertAdminTaskImpl(input) {
	const lockType = input.lockType ?? "none";
	if (lockType === "time" && !input.unlockAt) throw new Error("A time-locked task requires an unlock date.");
	const row = {
		title: input.title,
		description: input.description,
		icon: input.icon,
		image_url: input.imageUrl ?? null,
		reward: input.reward,
		task_type: input.taskType,
		target: input.target,
		steps_total: Math.max(1, input.target),
		frequency: input.frequency,
		window_days: input.windowDays ?? null,
		starts_at: input.startsAt || null,
		ends_at: input.endsAt || null,
		sort_order: input.sortOrder,
		is_active: input.isActive,
		is_featured: input.isFeatured,
		earning_target: input.taskType === "offerwall_earning" ? input.earningTarget ?? null : null,
		earning_provider_id: input.taskType === "offerwall_earning" ? input.earningProviderId ?? null : null,
		lock_type: lockType,
		unlock_at: lockType === "time" ? input.unlockAt || null : null
	};
	const result = input.id ? await supabaseAdmin.from("tasks").update(row).eq("id", input.id).select("*").single() : await supabaseAdmin.from("tasks").insert(row).select("*").single();
	if (result.error) throw new Error(result.error.message);
	return result.data;
}
async function setAdminTaskActiveImpl(id, isActive) {
	if ((await supabaseAdmin.from("tasks").update({ is_active: isActive }).eq("id", id)).error) throw new Error("Could not update that task.");
	return { ok: true };
}
async function deleteAdminTaskImpl(id) {
	if (((await supabaseAdmin.from("user_tasks").select("id", {
		count: "exact",
		head: true
	}).eq("task_id", id).eq("reward_status", "paid")).count ?? 0) > 0) {
		await supabaseAdmin.from("tasks").update({ is_active: false }).eq("id", id);
		return {
			ok: true,
			deactivatedInstead: true
		};
	}
	if ((await supabaseAdmin.from("tasks").delete().eq("id", id)).error) throw new Error("Could not delete that task.");
	return {
		ok: true,
		deactivatedInstead: false
	};
}
/** Signed upload URL to the public task-assets bucket for admin task images.
*  Identical logic to requestOfferwallLogoUploadUrlImpl — only the bucket name differs.
*  The filename is sanitised here rather than rejected, so real-world names
*  (spaces, parentheses, unicode) upload cleanly instead of failing validation.
*/
async function requestTaskImageUploadUrlImpl(userId, filename) {
	const safe = filename.replace(/[^A-Za-z0-9._-]/g, "_");
	const path = `${userId}/${Date.now()}-${safe}`;
	const { data, error } = await supabaseAdmin.storage.from("task-assets").createSignedUploadUrl(path);
	if (error || !data) throw new Error(error?.message ?? "Could not create upload URL.");
	const publicUrl = supabaseAdmin.storage.from("task-assets").getPublicUrl(path).data.publicUrl;
	return {
		path,
		uploadUrl: data.signedUrl ?? data["signed_url"] ?? "",
		token: data.token ?? "",
		publicUrl
	};
}
//#endregion
export { deleteAdminTaskImpl, listAdminTasksImpl, requestTaskImageUploadUrlImpl, setAdminTaskActiveImpl, upsertAdminTaskImpl };
