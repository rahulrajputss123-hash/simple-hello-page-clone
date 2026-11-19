import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
import { assertQuestNotLocked, assertQuestPlatform, creditStepReward, finishQuestSession, getQuestByKey } from "./quests.server-C-e2yiq_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/timed-ptc.server-DCRSNllZ.js
init_client_server();
var db = supabaseAdmin;
async function startTimedPtcStepImpl(userId, questKey, step, isNative) {
	if (isNative) throw new Error("Timed PTC quests are only available on web.");
	const quest = await getQuestByKey(questKey);
	if (quest.quest_type !== "timed_ptc") throw new Error("This quest is not a timed PTC quest.");
	assertQuestPlatform(quest, isNative);
	if (!quest.timed_steps || !quest.timed_steps.length) return { unavailable: true };
	await assertQuestNotLocked(userId, quest);
	const session = await db.from("quest_sessions").select("*").eq("user_id", userId).eq("quest_key", questKey).eq("status", "started").maybeSingle();
	if (!session.data) throw new Error("Start the quest first.");
	const currentStep = Number(session.data.current_step ?? 0);
	const issuedStep = Number(session.data.issued_step ?? 0);
	if (step !== currentStep + 1 && step !== issuedStep) throw new Error("Complete the previous step first.");
	await db.from("quest_sessions").update({
		issued_step: step,
		step_issued_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", session.data.id);
	const stepConfig = quest.timed_steps[step - 1] ?? null;
	const adNetwork = stepConfig?.ad_network ?? null;
	const pushNetwork = stepConfig?.push_network ?? null;
	return {
		sessionId: session.data.id,
		step,
		adNetwork,
		pushNetwork,
		timedStepSeconds: quest.timed_step_seconds ?? 60,
		timedCheckpointSeconds: quest.timed_checkpoint_seconds ?? 10,
		timedMaxFailedTaps: quest.timed_max_failed_taps ?? 2
	};
}
async function completeTimedPtcStepImpl(userId, questKey, step, checkpointsDone, isNative) {
	if (isNative) throw new Error("Timed PTC quests are only available on web.");
	const quest = await getQuestByKey(questKey);
	if (quest.quest_type !== "timed_ptc") throw new Error("This quest is not a timed PTC quest.");
	assertQuestPlatform(quest, isNative);
	await assertQuestNotLocked(userId, quest);
	const session = await db.from("quest_sessions").select("*").eq("user_id", userId).eq("quest_key", questKey).in("status", ["started", "verified"]).order("started_at", { ascending: false }).limit(1).maybeSingle();
	if (!session.data) throw new Error("No active session for this quest.");
	if (session.data.status === "verified") {
		const reward = Number(quest.reward_amount);
		await finishQuestSession(userId, session.data.id, reward, `Timed PTC quest — ${quest.label}`);
		const total = Math.max(1, quest.timed_steps?.length ?? 1);
		return {
			completed: true,
			credited: true,
			reward,
			nextStep: null,
			nextAdNetwork: null,
			nextPushNetwork: null,
			step: total,
			total
		};
	}
	const currentStep = Number(session.data.current_step ?? 0);
	if (Number(session.data.issued_step ?? 0) !== step) throw new Error("This step was not opened. Please start from the app.");
	if (step !== currentStep + 1) throw new Error("Wrong step — go back and start from the app.");
	const issuedAt = session.data.step_issued_at ? new Date(session.data.step_issued_at).getTime() : 0;
	const elapsed = (Date.now() - issuedAt) / 1e3;
	const timedStepSeconds = quest.timed_step_seconds ?? 60;
	const timedCheckpointSeconds = quest.timed_checkpoint_seconds ?? 10;
	if (!issuedAt || elapsed < timedStepSeconds) throw new Error(`Step opened too quickly. Please spend at least ${timedStepSeconds} seconds on this step.`);
	const requiredCheckpoints = Math.floor(timedStepSeconds / timedCheckpointSeconds) - 1;
	if (checkpointsDone < requiredCheckpoints) throw new Error(`Not enough checkpoints completed. Required: ${requiredCheckpoints}, completed: ${checkpointsDone}.`);
	const total = Math.max(1, quest.timed_steps?.length ?? 1);
	const isFinal = step >= total;
	const stepReward = quest.step_rewards && quest.step_rewards[step - 1] != null ? quest.step_rewards[step - 1] : quest.step_reward;
	const stepRewardCredited = await creditStepReward(userId, session.data.id, questKey, quest.label, step, stepReward);
	await db.from("task_events").insert({
		user_id: userId,
		category: "quest",
		event_key: `timed_ptc_step_${questKey}_${step}`,
		metadata: {
			quest_session_id: session.data.id,
			quest_key: questKey,
			step,
			checkpoints_done: checkpointsDone
		}
	});
	if (isFinal) {
		await db.from("quest_sessions").update({
			current_step: step,
			issued_step: 0,
			step_issued_at: null,
			status: "verified",
			verified_at: (/* @__PURE__ */ new Date()).toISOString()
		}).eq("id", session.data.id).eq("status", "started");
		const reward = Number(quest.reward_amount);
		await finishQuestSession(userId, session.data.id, reward, `Timed PTC quest — ${quest.label}`);
		return {
			completed: true,
			credited: true,
			reward,
			nextStep: null,
			nextAdNetwork: null,
			nextPushNetwork: null,
			step,
			total
		};
	}
	await db.from("quest_sessions").update({
		current_step: step,
		issued_step: 0,
		step_issued_at: null
	}).eq("id", session.data.id);
	const nextStep = step + 1;
	const nextStepConfig = quest.timed_steps?.[nextStep - 1] ?? null;
	const nextAdNetwork = nextStepConfig?.ad_network ?? null;
	const nextPushNetwork = nextStepConfig?.push_network ?? null;
	return {
		completed: false,
		credited: stepRewardCredited,
		reward: stepRewardCredited ? stepReward : 0,
		nextStep,
		nextAdNetwork,
		nextPushNetwork,
		step,
		total
	};
}
//#endregion
export { completeTimedPtcStepImpl, startTimedPtcStepImpl };
