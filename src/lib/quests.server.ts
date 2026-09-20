import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { creditWallet } from "./coinquest.server";
import { computeLockState, assertNotLocked, type LockState } from "./lock-state";

/**
 * Server implementations for the DB-backed Starter Quests + Shortlink Chain quests.
 * Lock columns added by 20261210000000_quest_offerwall_locks.sql.
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
  quest_type: "ads" | "shortlink" | "locker";
  ads_required: number;
  reward_amount: number;
  shortlink_steps: ShortlinkStep[];
  min_seconds_per_step: number;
  /**
   * Ordered content-locker URLs (1-3), completed sequentially. The reward is
   * credited only after the last one. Supersedes the deprecated `locker_url`
   * column, which is intentionally not exposed here.
   */
  locker_urls: string[];
  is_active: boolean;
  sort_order: number;
  lock_type: "none" | "time" | "earning";
  unlock_at: string | null;
  required_lifetime_earned: number | null;
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
    locker_urls: Array.isArray(row.locker_urls)
      ? row.locker_urls.map((url) => String(url).trim()).filter(Boolean)
      : [],
    sort_order: Number(row.sort_order ?? 0),
    lock_type: (row.lock_type ?? "none") as QuestRow["lock_type"],
    unlock_at: row.unlock_at ?? null,
    required_lifetime_earned:
      row.required_lifetime_earned != null ? Number(row.required_lifetime_earned) : null,
  };
}

async function fetchLifetimeEarned(userId: string): Promise<number> {
  const { data } = await db
    .from("profiles")
    .select("lifetime_earned")
    .eq("id", userId)
    .maybeSingle();
  return Number(data?.lifetime_earned ?? 0);
}

/**
 * Active quests for the starter row.
 * When userId is provided, each quest is annotated with is_locked + unlock_reason
 * computed server-side in UTC. Locked quests are INCLUDED so the client can render
 * a locked state instead of hiding them.
 */
export async function listActiveQuestsImpl(userId?: string): Promise<(QuestRow & LockState)[]> {
  const { data, error } = await db
    .from("quests")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message ?? "Could not load quests.");

  const rows: QuestRow[] = (data ?? []).map((r: QuestRow) => normalize(r));
  const lifetimeEarned = userId ? await fetchLifetimeEarned(userId) : 0;

  return rows.map((quest) => {
    const lockState = userId
      ? computeLockState(
          quest.lock_type,
          quest.unlock_at,
          quest.required_lifetime_earned,
          lifetimeEarned,
        )
      : { is_locked: false, unlock_reason: null };
    return { ...quest, ...lockState };
  });
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
  id?: string | undefined;
  key: string;
  label: string;
  icon: string;
  questType: "ads" | "shortlink" | "locker";
  adsRequired: number;
  rewardAmount: number;
  shortlinkSteps: ShortlinkStep[];
  minSecondsPerStep: number;
  /** 1-3 ordered locker URLs. Only meaningful when questType === "locker". */
  lockerUrls?: string[] | undefined;
  isActive: boolean;
  sortOrder: number;
  lockType: "none" | "time" | "earning";
  unlockAt?: string | null | undefined;
  requiredLifetimeEarned?: number | null | undefined;
};

export async function upsertQuestImpl(input: QuestFormInput) {
  if (input.questType === "shortlink" && input.shortlinkSteps.length !== 3) {
    throw new Error("A shortlink quest needs exactly 3 shortlink steps.");
  }
  if (input.questType === "ads" && input.adsRequired < 1) {
    throw new Error("Ads-type quests need at least 1 ad.");
  }
  // Lower bound lives here rather than in a DB CHECK — see the migration note.
  if (input.questType === "locker") {
    const urls = (input.lockerUrls ?? []).map((url) => url.trim()).filter(Boolean);
    if (urls.length < 1 || urls.length > 3) {
      throw new Error("A locker quest needs between 1 and 3 locker URLs.");
    }
    if (urls.some((url) => !/^https?:\/\/.+/.test(url))) {
      throw new Error("Every locker URL must be valid (must start with http:// or https://).");
    }
  }
  if (input.lockType === "time" && !input.unlockAt) {
    throw new Error("A time-locked quest requires an unlock date.");
  }
  if (
    input.lockType === "earning" &&
    (input.requiredLifetimeEarned == null || input.requiredLifetimeEarned <= 0)
  ) {
    throw new Error("An earning-locked quest requires a positive required amount.");
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
    locker_urls:
      input.questType === "locker"
        ? (input.lockerUrls ?? []).map((url) => url.trim()).filter(Boolean)
        : [],
    is_active: input.isActive,
    sort_order: input.sortOrder,
    lock_type: input.lockType,
    unlock_at: input.lockType === "time" ? input.unlockAt : null,
    required_lifetime_earned: input.lockType === "earning" ? input.requiredLifetimeEarned : null,
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
    const { error } = await db.from("quests").update({ is_active: false }).eq("id", id);
    if (error) throw new Error(error.message ?? "Could not deactivate quest.");
    return { deleted: false, deactivated: true };
  }
  const { error } = await db.from("quests").delete().eq("id", id);
  if (error) throw new Error(error.message ?? "Could not delete quest.");
  return { deleted: true, deactivated: false };
}

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

/**
 * Server-side lock enforcement.
 * Fetches the user's current lifetime_earned and throws if the quest is locked.
 * Call this before allowing any quest progress or crediting any reward.
 */
export async function assertQuestNotLocked(userId: string, quest: QuestRow): Promise<void> {
  if (quest.lock_type === "none") return;
  const lifetimeEarned = await fetchLifetimeEarned(userId);
  const state = computeLockState(
    quest.lock_type,
    quest.unlock_at,
    quest.required_lifetime_earned,
    lifetimeEarned,
  );
  assertNotLocked(state, quest.label);
}

/**
 * Start a locker quest for a user.
 *
 * DESIGN NOTE — "most recent started session" fallback:
 * AdBlueMedia's locker builder has a single static "Redirect URL" field with no
 * per-session macro support. We therefore cannot embed a unique token in the
 * redirect URL at launch time. Instead, completeLockerQuestImpl credits the
 * user's most recent 'started' locker session for the given quest_key.
 * session_token is generated and stored here for future use if AdBlueMedia
 * ever adds a {click_id} or similar macro.
 *
 * Returns the NEXT locker URL the client should open — quest.locker_urls at the
 * session's current_step, mirroring how startShortlinkStepImpl serves one step
 * at a time. The admin configures AdBlueMedia's own "Redirect URL" field once
 * in their dashboard to point to /go/locker/return?questKey=<key>; that single
 * static URL serves every locker in the chain.
 *
 * `step` is 1-based and `total` is the number of lockers, so the UI can render
 * "Locker 1 of 3".
 */
export async function startLockerQuestImpl(userId: string, questKey: string) {
  const quest = await getQuestByKey(questKey);
  if (quest.quest_type !== "locker") throw new Error("This quest is not a locker quest.");
  const urls = quest.locker_urls;
  if (!urls.length) throw new Error("This locker quest has no URL configured.");
  await assertQuestNotLocked(userId, quest);

  // Idempotent: return the existing in-progress session rather than creating a duplicate.
  const existing = await db
    .from("quest_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("quest_key", questKey)
    .in("status", ["started", "verified"])
    // quest_sessions has no created_at column — ordering by it made PostgREST
    // return 42703, which maybeSingle() turned into data:null, so this branch
    // never fired and a duplicate session was created on every start.
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing.data) {
    // Resume where the chain left off. Clamped so a session whose quest later
    // had lockers removed still points at a URL that exists.
    const index = Math.min(Math.max(0, Number(existing.data.current_step ?? 0)), urls.length - 1);
    return {
      sessionId: existing.data.id as string,
      lockerUrl: urls[index]!,
      step: index + 1,
      total: urls.length,
    };
  }

  const sessionToken = crypto.randomUUID();
  const created = await db
    .from("quest_sessions")
    .insert({
      user_id: userId,
      quest_key: quest.key,
      ads_required: 0,
      reward_amount: quest.reward_amount,
      quest_type: "locker",
      current_step: 0,
      session_token: sessionToken,
    } as never)
    .select("id")
    .single();
  if (created.error) throw new Error("Could not start this locker quest.");

  // New session: current_step = 0, so the first locker in the chain.
  return { sessionId: created.data.id as string, lockerUrl: urls[0]!, step: 1, total: urls.length };
}

/**
 * Credit the user's most recent 'started' locker session for questKey.
 *
 * Called by the /go/locker/return route after AdBlueMedia redirects the user
 * back. Because AdBlueMedia's redirect URL is static (no per-session token
 * macro), we match on (userId, questKey, status='started') ordered by
 * started_at DESC — i.e. the most recently started session wins.
 *
 * ⚠️  KNOWN LIMITATION: if the same user has two browser tabs or devices
 * simultaneously running the same locker quest, the OLDER session will never
 * be credited — only the most recent one is matched. This is an inherent
 * consequence of the static-redirect design. See reply notes for details.
 */
export async function completeLockerQuestImpl(userId: string, questKey: string) {
  const quest = await getQuestByKey(questKey);
  if (quest.quest_type !== "locker") throw new Error("This quest is not a locker quest.");
  await assertQuestNotLocked(userId, quest);

  const session = await db
    .from("quest_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("quest_key", questKey)
    .eq("status", "started")
    // See the note in startLockerQuestImpl: the column is started_at, not
    // created_at. Ordering by a non-existent column made this lookup always
    // return null, so locker quests could never be credited at all.
    // The matching STRATEGY is unchanged: most recent 'started' session for
    // (user, questKey), no per-session token.
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!session.data)
    throw new Error("No active locker session found. Please start the quest again.");

  // Each return hit completes one locker in the chain.
  const total = Math.max(1, quest.locker_urls.length);
  const completedCount = Number(session.data.current_step ?? 0) + 1;

  // --- More lockers left: advance and hand back the next URL -----------------
  if (completedCount < total) {
    await db
      .from("quest_sessions")
      .update({ current_step: completedCount, step_issued_at: new Date().toISOString() })
      .eq("id", session.data.id);

    return {
      completed: false,
      credited: false,
      reward: 0,
      // Lockers finished so far, and the 1-based index of the one opening next.
      step: completedCount,
      total,
      nextStep: completedCount + 1,
      nextUrl: quest.locker_urls[completedCount] ?? null,
    };
  }

  // --- Final locker: unchanged crediting behaviour ---------------------------
  // Mark verified.
  await db
    .from("quest_sessions")
    .update({
      current_step: completedCount,
      step_issued_at: null,
      status: "verified",
      verified_at: new Date().toISOString(),
    })
    .eq("id", session.data.id);

  const reward = Number(quest.reward_amount);
  await creditWallet(userId, reward, "quest", `Content locker — ${quest.label}`);

  // Mark credited.
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

  return {
    completed: true,
    credited: true,
    reward,
    step: total,
    total,
    nextStep: null,
    nextUrl: null,
  };
}

export async function startShortlinkStepImpl(userId: string, questKey: string, step: number) {
  const quest = await getQuestByKey(questKey);
  if (quest.quest_type !== "shortlink") throw new Error("This quest is not a shortlink quest.");
  await assertQuestNotLocked(userId, quest);

  const session = await db
    .from("quest_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("quest_key", questKey)
    .eq("status", "started")
    .maybeSingle();
  if (!session.data) throw new Error("Start the quest first.");

  const currentStep = Number(session.data.current_step ?? 0);
  if (step > currentStep + 1) throw new Error("Complete the previous step first.");

  const nextStep = Math.max(currentStep, step);
  await db
    .from("quest_sessions")
    .update({ current_step: nextStep, step_issued_at: new Date().toISOString() })
    .eq("id", session.data.id);

  const url = quest.shortlink_steps[step - 1]?.url ?? null;
  return {
    sessionId: session.data.id as string,
    step: nextStep,
    url,
    minSeconds: quest.min_seconds_per_step,
  };
}

export async function completeShortlinkStepImpl(userId: string, questKey: string, step: number) {
  const quest = await getQuestByKey(questKey);
  if (quest.quest_type !== "shortlink") throw new Error("This quest is not a shortlink quest.");
  await assertQuestNotLocked(userId, quest);

  const session = await db
    .from("quest_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("quest_key", questKey)
    .eq("status", "started")
    .maybeSingle();
  if (!session.data) throw new Error("No active session for this quest.");

  const currentStep = Number(session.data.current_step ?? 0);
  if (currentStep !== step) throw new Error("Wrong step — go back and start from the app.");

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

  await db
    .from("quest_sessions")
    .update({ current_step: step, step_issued_at: null })
    .eq("id", session.data.id);

  return {
    completed: false,
    credited: false,
    reward: 0,
    nextStep: step + 1,
    nextUrl: quest.shortlink_steps[step]?.url ?? null,
  };
}
