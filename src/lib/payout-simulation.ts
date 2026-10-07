import { safeStorage } from "@/lib/safe-storage";

/**
 * Simulated "total paid out" figure for the Home payouts strip.
 *
 * UI SIMULATION ONLY. Nothing here reads from or writes to Supabase — no
 * transactions, withdrawals, postbacks or database rows are created. The only
 * state is a small seed in localStorage.
 *
 * Model:
 *   - A random starting total in [$300,000, $400,000] and a random salt are
 *     picked once and persisted, together with the UTC day they were picked.
 *   - Every UTC day gets its own daily change in [$1,000, $1,500], derived
 *     deterministically from the salt + day number, so a given day always shows
 *     the same "+$X today" across reloads.
 *   - total = start + every completed day's change + today's change accrued in
 *     proportion to how much of the UTC day has elapsed.
 *
 * The result grows by roughly one daily change per day and never jumps to an
 * unrelated number on refresh. If storage is unavailable (private mode, blocked
 * storage) a seed is kept in memory instead, so it is stable for the page's life.
 */

const STORAGE_KEY = "cashgpt.payout-sim.v1";
const DAY_MS = 86_400_000;

export const START_MIN = 300_000;
export const START_MAX = 400_000;
export const DAILY_MIN = 1_000;
export const DAILY_MAX = 1_500;
/** Bounds the catch-up loop if a stored seed is very old. */
const MAX_DAYS = 3_650;

type Seed = { start: number; day0: number; salt: number };

let memorySeed: Seed | null = null;

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function utcDay(ms: number): number {
  return Math.floor(ms / DAY_MS);
}

function isValidSeed(value: unknown): value is Seed {
  if (!value || typeof value !== "object") return false;
  const s = value as Partial<Seed>;
  return (
    typeof s.start === "number" &&
    Number.isFinite(s.start) &&
    s.start >= START_MIN &&
    s.start <= START_MAX &&
    typeof s.day0 === "number" &&
    Number.isInteger(s.day0) &&
    typeof s.salt === "number" &&
    Number.isInteger(s.salt)
  );
}

function newSeed(nowMs: number): Seed {
  return {
    start: randInt(START_MIN, START_MAX),
    day0: utcDay(nowMs),
    salt: randInt(1, 2_147_483_646),
  };
}

function loadSeed(nowMs: number): Seed {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      // A seed "from the future" (clock moved back) is treated as corrupt.
      if (isValidSeed(parsed) && parsed.day0 <= utcDay(nowMs)) return parsed;
    }
    const seed = newSeed(nowMs);
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  } catch {
    memorySeed ??= newSeed(nowMs);
    return memorySeed;
  }
}

/**
 * Deterministic daily change for a given day, in [DAILY_MIN, DAILY_MAX].
 * A mulberry32 step over (salt, day) — cheap, stable and well spread.
 */
export function dailyChangeFor(salt: number, day: number): number {
  let t = (salt ^ Math.imul(day, 0x9e3779b1)) >>> 0;
  t = (t + 0x6d2b79f5) >>> 0;
  let r = Math.imul(t ^ (t >>> 15), t | 1);
  r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
  const unit = ((r ^ (r >>> 14)) >>> 0) / 4_294_967_296;
  return DAILY_MIN + Math.floor(unit * (DAILY_MAX - DAILY_MIN + 1));
}

/** Pure computation, split out so it can be checked without a browser. */
export function computePayoutSnapshot(
  seed: Seed,
  nowMs: number,
): { total: number; todayChange: number } {
  const today = utcDay(nowMs);
  const firstDay = Math.max(seed.day0, today - MAX_DAYS);

  let total = seed.start;
  for (let day = firstDay; day < today; day++) total += dailyChangeFor(seed.salt, day);

  const todayChange = dailyChangeFor(seed.salt, today);
  const dayFraction = (nowMs - today * DAY_MS) / DAY_MS;
  total += Math.floor(todayChange * dayFraction);

  return { total, todayChange };
}

/** Current simulated total + today's change. Browser-only (uses localStorage). */
export function simulatedPayoutSnapshot(nowMs: number = Date.now()): {
  total: number;
  todayChange: number;
} {
  return computePayoutSnapshot(loadSeed(nowMs), nowMs);
}
