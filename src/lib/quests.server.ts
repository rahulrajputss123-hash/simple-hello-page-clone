import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { creditWallet } from "./coinquest.server";

/**
 * Server implementations for the DB-backed Starter Quests + Shortlink Chain quests.
 * The `quests` and extra `quest_sessions` columns are added by
 * supabase/migrations/20261101000000_offer_popup_and_quests.sql.
 *
 * The generated supabase types don't include the new table yet, so we access
 * the client via an untyped alias — safe because runtime schema is authoritative.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as unknown as { from: (t: string) => any };

export type ShortlinkStep = { network: string; url: string };

export type QuestRow = {
  id: string;
  key: string;
  label: string;
  icon: string;
  quest_type: "ads" | "shortlink";
  ads_required: number;
  reward_amount: number;
  shortlink_steps: ShortlinkStep[];
  min_seconds_per_step: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function normalize(row: QuestRow): QuestRow {
  return {
    ...row,
    reward_amount: Number(row.reward_amount ?? 0),
    ads_required: Number(row.ads_required ?? 0),
    shortlink_steps: Array.isArray(row.shortlink_steps) ? row.shortlink_steps : [],
    min_seconds_per_step: Number(row.min_seconds_per_step ?? 15),
    sort_order: Number(row.sort_order ?? 0),
  };
}

export async function listActiveQuestsImpl(): Promise<QuestRow[]> {
  const { data, error } = await db
    .from("quests")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message ?? "Could not load quests.");
  return (data ?? []).map((r: QuestRow) => normalize(r));
}

export async function listAdminQuestsImpl(): Promise<QuestRow[]> {
  const { data, error } = await db
    .from("quests")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message ?? "Could not load quests.");
  return (data ?? []).map((r: QuestRow) => normalize(r));
}

export type QuestFormInput = {
  id?: string;
  key: string;
  label: string;
  icon: string;
  questType: "ads" | "shortlink";
  adsRequired: number;
  rewardAmount: number;
  shortlinkSteps: ShortlinkStep[];
  minSecondsPerStep: number;
  isActive: boolean;
  sortOrder: number;
};

export async function upsertQuestImpl(input: QuestFormInput) {
  if (input.questType === "shortlink" && input.shortlinkSteps.length !== 3) {
    throw new Error("A shortlink quest needs exactly 3 shortlink steps.");
  }
  if (input.questType === "ads" && input.adsRequired < 1) {
    throw new Error("Ads-type quests need at least 1 ad.");
  }

  const row = {
    key: input.key.trim(),
    label: input.label.trim(),
    icon: (input.icon || "gift").trim(),
    quest_type: input.questType,
    ads_required: input.questType === "ads" ? input.adsRequired : 0,
    reward_amount: input.rewardAmount,
    shortlink_steps: input.questType === "shortlink" ? input.shortlinkSteps : [],
    min_seconds_per_step: input.minSecondsPerStep,
    is_active: input.isActive,
    sort_order: input.sortOrder,
  };

  if (input.id) {
    const { data, error } = await db
      .from("quests")
      .update(row)
      .eq("id", input.id)
      .select("id")
      .single();
    if (error) throw new Error(error.message ?? "Could not save quest.");
    return data;
  }
  const { data, error } = await db.from("quests").insert(row).select("id").single();
  if (error) throw new Error(error.message ?? "Could not create quest.");
  return data;
}

export async function deleteQuestImpl(id: string) {
  const quest = await db.from("quests").select("key").eq("id", id).single();
  if (quest.error) throw new Error("Quest not found.");
  const sessions = await db
    .from("quest_sessions")
    .select("id")
    .eq("quest_key", quest.data.key)
    .limit(1);
  if (sessions.data?.length) {
    // Preserve session history — deactivate instead of hard delete.
    const { error } = await db.from("quests").update({ is_active: false }).eq("id", id);
    if (error) throw new Error(error.message ?? "Could not deactivate quest.");
    return { deleted: false, deactivated: true };
  }
  const { error } = await db.from("quests").delete().eq("id", id);
  if (error) throw new Error(error.message ?? "Could not delete quest.");
  return { deleted: true, deactivated: false };
}

/** Server-side helper: find the active-or-startable quest def by key. */
export async function getQuestByKey(key: string): Promise<QuestRow> {
  const { data, error } = await db
    .from("quests")
    .select("*")
    .eq("key", key)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(error.message ?? "Quest lookup failed.");
  if (!data) throw new Error("Unknown quest.");
  return normalize(data as QuestRow);
}

/** Sets current_step + step_issued_at on an already-started shortlink session. */
export async function startShortlinkStepImpl(userId: string, questKey: string, step: number) {
  const quest = await getQuestByKey(questKey);
  if (quest.quest_type !== "shortlink") throw new Error("This quest is not a shortlink quest.");

  const session = await db
    .from("quest_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("quest_key", questKey)
    .eq("status", "started")
    .maybeSingle();
  if (!session.data) throw new Error("Start the quest first.");

  // Allow re-open of an already-issued step (user tapped again), but never skip forward.
  const currentStep = Number(session.data.current_step ?? 0);
  if (step > currentStep + 1) {
    throw new Error("Complete the previous step first.");
  }

  const nextStep = Math.max(currentStep, step);
  await db
    .from("quest_sessions")
    .update({
      current_step: nextStep,
      step_issued_at: new Date().toISOString(),
    })
    .eq("id", session.data.id);

  const url = quest.shortlink_steps[step - 1]?.url ?? null;
  return {
    sessionId: session.data.id as string,
    step: nextStep,
    url,
    minSeconds: quest.min_seconds_per_step,
  };
}

/**
 * Called from the /go/$questKey/$step return page. Validates the time-check,
 * advances current_step, and credits the wallet on the final step.
 */
export async function completeShortlinkStepImpl(
  userId: string,
  questKey: string,
  step: number,
) {
  const quest = await getQuestByKey(questKey);
  if (quest.quest_type !== "shortlink") throw new Error("This quest is not a shortlink quest.");

  const session = await db
    .from("quest_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("quest_key", questKey)
    .eq("status", "started")
    .maybeSingle();
  if (!session.data) throw new Error("No active session for this quest.");

  const currentStep = Number(session.data.current_step ?? 0);
  if (currentStep !== step) {
    throw new Error("Wrong step — go back and start from the app.");
  }
  const issuedAt = session.data.step_issued_at
    ? new Date(session.data.step_issued_at as string).getTime()
    : 0;
  const elapsed = (Date.now() - issuedAt) / 1000;
  if (!issuedAt || elapsed < quest.min_seconds_per_step) {
    throw new Error(
      `Step opened too quickly. Please spend at least ${quest.min_seconds_per_step} seconds on the network's page.`,
    );
  }

  const total = Math.max(1, quest.shortlink_steps.length || 3);
  const isFinal = step >= total;

  if (isFinal) {
    await db
      .from("quest_sessions")
      .update({
        current_step: step,
        step_issued_at: null,
        status: "verified",
        verified_at: new Date().toISOString(),
      })
      .eq("id", session.data.id);
    const reward = Number(quest.reward_amount);
    await creditWallet(userId, reward, "quest", `Shortlink quest — ${quest.label}`);
    await db
      .from("quest_sessions")
      .update({ status: "credited", credited_at: new Date().toISOString() })
      .eq("id", session.data.id);
    await db.from("notifications").insert({
      user_id: userId,
      title: "Quest completed",
      body: `You earned $${reward.toFixed(2)}.`,
      kind: "quest",
    });
    return { completed: true, credited: true, reward, nextStep: null };
  }

  const nextStep = step; // increments to next-issuable step; caller taps "Open" for step+1
  await db
    .from("quest_sessions")
    .update({
      current_step: nextStep,
      step_issued_at: null,
    })
    .eq("id", session.data.id);

  return {
    completed: false,
    credited: false,
    reward: 0,
    nextStep: step + 1,
    nextUrl: quest.shortlink_steps[step]?.url ?? null,
  };
}
