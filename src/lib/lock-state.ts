/**
 * Pure lock-state helpers — no server imports, safe to use on both client and server.
 *
 * Design:
 *  - computeLockState() is the single source of truth for whether an item is locked.
 *  - All time comparisons use UTC (Date objects are always UTC internally).
 *  - assertNotLocked() is the server-side enforcement helper; it throws a user-readable
 *    Error so callers can propagate it directly to the client.
 */

export type LockReason =
  | { type: "time"; unlocksAt: string }
  | { type: "earning"; required: number; current: number }
  /** Locked until the user has had at least one withdrawal approved. */
  | { type: "first_withdrawal" };

export type LockState = {
  is_locked: boolean;
  unlock_reason: LockReason | null;
};

/**
 * Compute whether an item is locked for a given user.
 *
 * @param lockType              'none' | 'time' | 'earning' | 'first_withdrawal'
 * @param unlockAt              ISO-8601 UTC string (used when lockType === 'time')
 * @param requiredLifetimeEarned  USD amount (used when lockType === 'earning')
 * @param lifetimeEarned        User's current lifetime_earned from profiles table
 * @param lifetimeWithdrawn     User's current lifetime_withdrawn from profiles table.
 *                              Only read when lockType === 'first_withdrawal'; it is
 *                              incremented exactly once per approved withdrawal, so
 *                              `> 0` is the same signal the referral milestone uses.
 * @param nowIso                Override "now" for testing; defaults to new Date()
 */
export function computeLockState(
  lockType: string,
  unlockAt: string | null,
  requiredLifetimeEarned: number | null,
  lifetimeEarned: number,
  lifetimeWithdrawn = 0,
  nowIso?: string,
): LockState {
  const now = nowIso ? new Date(nowIso) : new Date();

  if (lockType === "first_withdrawal" && Number(lifetimeWithdrawn) <= 0) {
    return { is_locked: true, unlock_reason: { type: "first_withdrawal" } };
  }

  if (lockType === "time" && unlockAt) {
    const unlockDate = new Date(unlockAt);
    if (now < unlockDate) {
      return {
        is_locked: true,
        unlock_reason: { type: "time", unlocksAt: unlockAt },
      };
    }
  }

  if (lockType === "earning" && requiredLifetimeEarned != null) {
    if (lifetimeEarned < requiredLifetimeEarned) {
      return {
        is_locked: true,
        unlock_reason: {
          type: "earning",
          required: requiredLifetimeEarned,
          current: lifetimeEarned,
        },
      };
    }
  }

  return { is_locked: false, unlock_reason: null };
}

/**
 * Server-side enforcement: throws a user-readable Error if the item is locked.
 * Call this before allowing any progress or crediting any reward.
 */
export function assertNotLocked(lockState: LockState, label: string): void {
  if (!lockState.is_locked) return;
  const r = lockState.unlock_reason;
  if (r?.type === "time") {
    throw new Error(`"${label}" is locked until ${new Date(r.unlocksAt).toUTCString()}.`);
  }
  if (r?.type === "earning") {
    const needed = (r.required - r.current).toFixed(2);
    throw new Error(
      `"${label}" requires $${r.required.toFixed(2)} lifetime earned. You need $${needed} more.`,
    );
  }
  if (r?.type === "first_withdrawal") {
    throw new Error(`"${label}" unlocks after your first withdrawal is approved.`);
  }
  throw new Error(`"${label}" is currently locked.`);
}

/**
 * Client helper: format a time-lock reason into a human-readable countdown.
 * e.g. "Unlocks in 2h 15m" or "Unlocks in 3d 4h"
 */
export function formatTimeLockReason(unlocksAt: string): string {
  const ms = new Date(unlocksAt).getTime() - Date.now();
  if (ms <= 0) return "Unlocking…";
  const totalMinutes = Math.ceil(ms / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `Unlocks in ${days}d ${hours}h`;
  if (hours > 0) return `Unlocks in ${hours}h ${minutes}m`;
  return `Unlocks in ${minutes}m`;
}

/**
 * Client helper: format an earning-lock reason.
 * e.g. "Earn $3.50 more to unlock"
 */
export function formatEarningLockReason(required: number, current: number): string {
  const needed = Math.max(0, required - current);
  return `Earn $${needed.toFixed(2)} more to unlock`;
}

/** Client helper: label for a first-withdrawal lock. */
export function formatFirstWithdrawalLockReason(): string {
  return "Unlocks after your first withdrawal";
}

/**
 * Client helper: turn any lock reason into a short label.
 * Keeps the Quest card and the Task list wording identical.
 */
export function formatLockReason(reason: LockReason | null): string {
  if (!reason) return "Locked";
  if (reason.type === "time") return formatTimeLockReason(reason.unlocksAt);
  if (reason.type === "earning") return formatEarningLockReason(reason.required, reason.current);
  if (reason.type === "first_withdrawal") return formatFirstWithdrawalLockReason();
  return "Locked";
}
