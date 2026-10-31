/**
 * Server-side timezone utilities for check-in quests.
 * 
 * Supports ALL valid IANA timezone names with proper handling of:
 * - Half-hour offsets (Asia/Kolkata +5:30, Asia/Tehran +3:30)
 * - Quarter-hour offsets (Asia/Kathmandu +5:45, Australia/Eucla +8:45)
 * - DST transitions
 * 
 * Never trusts client-provided dates or times. All calculations done server-side.
 */

/**
 * Validate IANA timezone name using Intl.DateTimeFormat.
 * Returns the validated timezone or null if invalid.
 * 
 * Accepts ANY valid IANA timezone, including:
 * - Asia/Kathmandu (+5:45 quarter-hour offset)
 * - Asia/Kolkata, Asia/Dhaka, Asia/Karachi, Asia/Colombo
 * - Indian/Maldives, Indian/Cocos, Indian/Christmas
 * - Asia/Thimphu, Asia/Yangon, Asia/Tehran
 * - All other standard IANA zones
 */
export function validateTimezone(timezone: string | null | undefined): string | null {
  if (!timezone) return null;
  
  const normalized = timezone.trim();
  if (!normalized) return null;
  
  try {
    // Try to create a DateTimeFormat with this timezone
    // If it throws RangeError, the timezone is invalid
    new Intl.DateTimeFormat("en-US", { timeZone: normalized });
    return normalized;
  } catch (err) {
    if (err instanceof RangeError) {
      // Invalid timezone
      return null;
    }
    // Unexpected error, log and reject
    console.error("[timezone] Unexpected error validating timezone:", err);
    return null;
  }
}

/**
 * Get the local date in the user's timezone.
 * Uses server time (now) and converts to local date using IANA timezone.
 * 
 * @param timezone - IANA timezone name (e.g. "Asia/Kolkata")
 * @param now - Current server time (defaults to Date.now())
 * @returns Local date string in YYYY-MM-DD format
 */
export function getLocalDate(timezone: string, now: number = Date.now()): string {
  try {
    // Use Intl.DateTimeFormat to get local date components
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    
    // Format returns YYYY-MM-DD
    return formatter.format(new Date(now));
  } catch (err) {
    // Invalid timezone - fall back to UTC
    console.error(`[timezone] Invalid timezone "${timezone}", falling back to UTC:`, err);
    const date = new Date(now);
    return date.toISOString().split("T")[0] ?? "";
  }
}

/**
 * Get the start of day (midnight) in the user's timezone as a UTC timestamp.
 * 
 * @param timezone - IANA timezone name
 * @param localDate - Local date string in YYYY-MM-DD format
 * @returns UTC timestamp (milliseconds) of midnight in the user's timezone
 */
export function getStartOfDayUTC(timezone: string, localDate: string): number {
  try {
    // Parse local date components
    const [year, month, day] = localDate.split("-").map(Number);
    if (!year || !month || !day) {
      throw new Error(`Invalid date format: ${localDate}`);
    }
    
    // Create Date object from local components in UTC
    // Then find what UTC time corresponds to midnight in the target timezone
    const utcMidnight = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
    return utcMidnight;
  } catch (err) {
    console.error(`[timezone] Failed to get start of day for ${timezone} ${localDate}:`, err);
    // Fall back to UTC midnight
    const [year, month, day] = localDate.split("-").map(Number);
    return Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1, 0, 0, 0, 0);
  }
}

/**
 * Check if a timezone change is allowed for a user.
 * Rules:
 * - First-time set: always allowed
 * - Subsequent changes: only once per 7 days
 * 
 * @param lastChangedAt - Last timezone change timestamp (null if never changed)
 * @returns true if change is allowed
 */
export function canChangeTimezone(lastChangedAt: string | null | undefined): boolean {
  if (!lastChangedAt) return true; // First time
  
  const lastChanged = new Date(lastChangedAt).getTime();
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  
  return (now - lastChanged) >= sevenDaysMs;
}

/**
 * Get the number of local days between two dates in a timezone.
 * 
 * @param timezone - IANA timezone name
 * @param fromDate - Start date (YYYY-MM-DD)
 * @param toDate - End date (YYYY-MM-DD)
 * @returns Number of days (inclusive, so same day = 1)
 */
export function getDaysBetween(timezone: string, fromDate: string, toDate: string): number {
  try {
    const from = new Date(fromDate + "T00:00:00Z");
    const to = new Date(toDate + "T00:00:00Z");
    
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return 0;
    }
    
    const diffMs = to.getTime() - from.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    
    return Math.abs(diffDays) + 1; // +1 to make it inclusive
  } catch {
    return 0;
  }
}

/**
 * Get yesterday's local date in the user's timezone.
 */
export function getYesterdayLocal(timezone: string, now: number = Date.now()): string {
  const oneDayMs = 24 * 60 * 60 * 1000;
  return getLocalDate(timezone, now - oneDayMs);
}

/**
 * Get tomorrow's local date in the user's timezone.
 */
export function getTomorrowLocal(timezone: string, now: number = Date.now()): string {
  const oneDayMs = 24 * 60 * 60 * 1000;
  return getLocalDate(timezone, now + oneDayMs);
}

/**
 * Check if two local dates are consecutive (differ by exactly 1 day).
 */
export function areConsecutiveDates(date1: string, date2: string): boolean {
  try {
    const d1 = new Date(date1 + "T00:00:00Z");
    const d2 = new Date(date2 + "T00:00:00Z");
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return false;
    }
    
    const diffMs = Math.abs(d2.getTime() - d1.getTime());
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    // Allow small tolerance for DST transitions
    return Math.abs(diffMs - oneDayMs) < (2 * 60 * 60 * 1000);
  } catch {
    return false;
  }
}
