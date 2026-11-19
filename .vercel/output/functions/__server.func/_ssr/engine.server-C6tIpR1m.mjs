import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
import { n as computeLockState, t as assertNotLocked } from "./lock-state-BmOk6qOC.mjs";
import { r as creditWallet } from "./coinquest.server-CBcexWIA.mjs";
import { c as periodKey, l as periodStart, o as TASK_TYPE_EVENT } from "./types-BeKSJIcg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/engine.server-C6tIpR1m.js
init_client_server();
/**
* Lock state for a task. Tasks have no 'earning' lock, so lifetime_earned is
* passed as 0 — it is never read for the 'time' or 'first_withdrawal' branches.
*/
function computeTaskLockState(task, lifetimeWithdrawn, nowIso) {
	return computeLockState(task.lock_type ?? "none", task.unlock_at, null, 0, lifetimeWithdrawn, nowIso);
}
async function fetchLifetimeWithdrawn(userId) {
	const { data } = await supabaseAdmin.from("profiles").select("lifetime_withdrawn").eq("id", userId).maybeSingle();
	return Number(data?.lifetime_withdrawn ?? 0);
}
/**
* Server-side lock enforcement for tasks — the task counterpart of
* assertQuestNotLocked. Call before recording progress or crediting a reward.
*/
async function assertTaskNotLocked(userId, task) {
	const lockType = task.lock_type ?? "none";
	if (lockType === "none") return;
	const lifetimeWithdrawn = await fetchLifetimeWithdrawn(userId);
	const state = computeTaskLockState({
		lock_type: lockType,
		unlock_at: task.unlock_at ?? null
	}, lifetimeWithdrawn);
	assertNotLocked(state, task.title);
}
/**
* Appends a real activity event. Duplicate (user, type, key) tuples are ignored,
* which is what keeps reward crediting exactly-once when a webhook or callback
* is replayed.
*/
async function recordTaskEvent(input) {
	const insert = await supabaseAdmin.from("task_events").upsert({
		user_id: input.userId,
		event_type: input.eventType,
		event_key: input.eventKey,
		quantity: input.quantity ?? 1,
		metadata: input.metadata ?? {},
		...input.occurredAt ? { occurred_at: input.occurredAt } : {},
		...input.providerId ? { provider_id: input.providerId } : {}
	}, {
		onConflict: "user_id,event_type,event_key",
		ignoreDuplicates: true
	}).select("id");
	await syncUserTasks(input.userId, input.eventType);
	return { recorded: Boolean(insert.data?.length) };
}
async function countProgress(userId, task, from) {
	const eventType = TASK_TYPE_EVENT[task.task_type];
	if (!eventType) return 0;
	if (eventType === "referral") return (await supabaseAdmin.from("referrals").select("id", {
		count: "exact",
		head: true
	}).eq("referrer_id", userId).gte("created_at", from.toISOString())).count ?? 0;
	if (eventType === "offerwall_earning") {
		let q = supabaseAdmin.from("task_events").select("quantity").eq("user_id", userId).eq("event_type", "offerwall_earning").gte("occurred_at", from.toISOString());
		if (task.earning_provider_id) q = q.eq("provider_id", task.earning_provider_id);
		return ((await q).data ?? []).reduce((sum, row) => sum + Number(row.quantity), 0);
	}
	return ((await supabaseAdmin.from("task_events").select("quantity").eq("user_id", userId).eq("event_type", eventType).gte("occurred_at", from.toISOString())).data ?? []).reduce((sum, row) => sum + Number(row.quantity), 0);
}
/** Recomputes automated task progress for one user and pays finished tasks once. */
async function syncUserTasks(userId, eventType) {
	const now = /* @__PURE__ */ new Date();
	const tasks = await supabaseAdmin.from("tasks").select("*").eq("is_active", true).neq("task_type", "manual");
	if (tasks.error || !tasks.data) return { updated: 0 };
	const lifetimeWithdrawn = tasks.data.some((t) => (t.lock_type ?? "none") !== "none") ? await fetchLifetimeWithdrawn(userId) : 0;
	let updated = 0;
	for (const raw of tasks.data) {
		if (eventType && TASK_TYPE_EVENT[raw.task_type] !== eventType) continue;
		if (raw.starts_at && new Date(raw.starts_at) > now) continue;
		if (raw.ends_at && new Date(raw.ends_at) < now) continue;
		if (computeTaskLockState(raw, lifetimeWithdrawn, now.toISOString()).is_locked) continue;
		const key = periodKey(raw.frequency, now);
		const target = raw.task_type === "offerwall_earning" && raw.earning_target != null ? Number(raw.earning_target) : Math.max(1, Number(raw.target || raw.steps_total || 1));
		const progress = Math.min(await countProgress(userId, raw, periodStart(raw, now)), target);
		const completed = progress >= target;
		const existing = await supabaseAdmin.from("user_tasks").select("id, reward_status, progress").eq("user_id", userId).eq("task_id", raw.id).eq("period_key", key).maybeSingle();
		let userTaskId = existing.data?.id ?? null;
		let rewardStatus = existing.data?.reward_status ?? "pending";
		if (!existing.data) {
			const inserted = await supabaseAdmin.from("user_tasks").insert({
				user_id: userId,
				task_id: raw.id,
				period_key: key,
				progress,
				target,
				status: completed ? "completed" : "active",
				completed_at: completed ? now.toISOString() : null
			}).select("id, reward_status").maybeSingle();
			userTaskId = inserted.data?.id ?? null;
			rewardStatus = inserted.data?.reward_status ?? "pending";
		} else await supabaseAdmin.from("user_tasks").update({
			progress,
			target,
			status: completed ? "completed" : "active",
			completed_at: completed ? now.toISOString() : null
		}).eq("id", existing.data.id);
		updated += 1;
		if (!completed) continue;
		if (rewardStatus === "paid" || !userTaskId) continue;
		const reward = Number(raw.reward);
		if (reward > 0) {
			let credit;
			try {
				credit = await creditWallet(userId, reward, "task", raw.title, "earned", userTaskId);
			} catch (error) {
				console.error("[tasks] reward credit failed; will retry on next sync", {
					userId,
					taskId: raw.id,
					error
				});
				continue;
			}
			if (!credit.duplicate) await supabaseAdmin.from("notifications").insert({
				user_id: userId,
				title: "Task completed",
				body: `${raw.title} — $${reward.toFixed(2)} added to your wallet.`,
				kind: "task"
			});
		}
		await supabaseAdmin.from("user_tasks").update({
			reward_status: "paid",
			rewarded_at: now.toISOString()
		}).eq("id", userTaskId).eq("reward_status", "pending");
	}
	return { updated };
}
//#endregion
export { assertTaskNotLocked, recordTaskEvent, syncUserTasks };
