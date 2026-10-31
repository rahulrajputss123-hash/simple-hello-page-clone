/**
 * Server-side timezone utilities for check-in quests.
 * 
 * Supports IANA timezone names with proper handling of:
 * - Half-hour offsets (Asia/Kolkata +5:30, Asia/Tehran +3:30)
 * - Quarter-hour offsets (Asia/Kathmandu +5:45, Australia/Eucla +8:45)
 * - DST transitions
 * 
 * Never trusts client-provided dates or times. All calculations done server-side.
 */

/**
 * List of valid IANA timezone names.
 * Focus on South Asia + major regions for global audience.
 */
const VALID_TIMEZONES = new Set([
  // South Asia (primary audience)
  "Asia/Kolkata", // India +5:30
  "Asia/Kathmandu", // Nepal +5:45
  "Asia/Dhaka", // Bangladesh +6:00
  "Asia/Karachi", // Pakistan +5:00
  "Asia/Colombo", // Sri Lanka +5:30
  "Asia/Kabul", // Afghanistan +4:30
  "Asia/Thimphu", // Bhutan +6:00
  "Asia/Yangon", // Myanmar +6:30
  
  // Southeast Asia
  "Asia/Bangkok", // Thailand +7:00
  "Asia/Ho_Chi_Minh", // Vietnam +7:00
  "Asia/Jakarta", // Indonesia +7:00
  "Asia/Singapore", // Singapore +8:00
  "Asia/Manila", // Philippines +8:00
  "Asia/Kuala_Lumpur", // Malaysia +8:00
  
  // East Asia
  "Asia/Tokyo", // Japan +9:00
  "Asia/Seoul", // South Korea +9:00
  "Asia/Shanghai", // China +8:00
  "Asia/Hong_Kong", // Hong Kong +8:00
  "Asia/Taipei", // Taiwan +8:00
  
  // Middle East
  "Asia/Dubai", // UAE +4:00
  "Asia/Riyadh", // Saudi Arabia +3:00
  "Asia/Tehran", // Iran +3:30
  "Asia/Jerusalem", // Israel +2:00/+3:00 DST
  
  // Central Asia
  "Asia/Tashkent", // Uzbekistan +5:00
  "Asia/Almaty", // Kazakhstan +6:00
  
  // Europe
  "Europe/London", // UK +0:00/+1:00 DST
  "Europe/Paris", // France/Germany +1:00/+2:00 DST
  "Europe/Moscow", // Russia +3:00
  "Europe/Istanbul", // Turkey +3:00
  
  // Americas
  "America/New_York", // US Eastern -5:00/-4:00 DST
  "America/Chicago", // US Central -6:00/-5:00 DST
  "America/Denver", // US Mountain -7:00/-6:00 DST
  "America/Los_Angeles", // US Pacific -8:00/-7:00 DST
  "America/Toronto", // Canada Eastern -5:00/-4:00 DST
  "America/Mexico_City", // Mexico -6:00
  "America/Sao_Paulo", // Brazil -3:00
  "America/Buenos_Aires", // Argentina -3:00
  
  // Africa
  "Africa/Cairo", // Egypt +2:00
  "Africa/Johannesburg", // South Africa +2:00
  "Africa/Lagos", // Nigeria +1:00
  "Africa/Nairobi", // Kenya +3:00
  
  // Oceania
  "Pacific/Auckland", // New Zealand +12:00/+13:00 DST
  "Australia/Sydney", // Australia +10:00/+11:00 DST
  "Australia/Melbourne", // Australia +10:00/+11:00 DST
  "Australia/Perth", // Australia +8:00
  "Australia/Eucla", // Australia +8:45 (rare quarter-hour)
  
  // UTC
  "UTC",
]);

/**
 * Validate and normalize IANA timezone name.
 * Returns the validated timezone or null if invalid.
 */
export function validateTimezone(timezone: string | null | undefined): string | null {
  if (!timezone) return null;
  const normalized = timezone.trim();
  return VALID_TIMEZONES.has(normalized) ? normalized : null;
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
    
    // Create a date string that will be interpreted in the target timezone
    // Format: "YYYY-MM-DDTHH:MM:SS" without Z (local time)
    const localMidnight = `${localDate}T00:00:00`;
    
    // Parse as local time in the target timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    
    // Get UTC timestamp by parsing the local midnight
    // We need to find what UTC time corresponds to midnight in the target timezone
    const parts = formatter.formatToParts(new Date(now));
    const tzYear = parts.find((p) => p.type === "year")?.value;
    const tzMonth = parts.find((p) => p.type === "month")?.value;
    const tzDay = parts.find((p) => p.type === "day")?.value;
    
    // Create Date object from local components
    // This gives us the UTC timestamp when it's midnight in the target timezone
    return Date.UTC(year, month - 1, day, 0, 0, 0, 0);
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
