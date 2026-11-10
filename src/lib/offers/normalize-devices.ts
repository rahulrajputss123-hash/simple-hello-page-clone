/**
 * Shared device normalization used by all adapters and backfill script.
 * 
 * Rules:
 * - desktop, PC → web
 * - All, empty, "*", or unknown → []
 * - mobile → [android, ios]
 * - Only keep: android, ios, web
 * - Lowercase, deduplicated, sorted
 * 
 * Part 2 B4: Single source of truth for device normalization
 */

export function normalizeDevices(devices: string[]): string[] {
  const normalized = new Set<string>();
  
  for (const d of devices) {
    const lower = d.toLowerCase().trim();
    
    // Skip empty, "all", "*"
    if (!lower || lower === "all" || lower === "*") continue;
    
    // Android
    if (lower === "android" || lower.includes("android")) {
      normalized.add("android");
    }
    // iOS (handle iphone, ipad variants)
    else if (
      lower === "ios" ||
      lower.includes("ios") ||
      lower.includes("iphone") ||
      lower.includes("ipad")
    ) {
      normalized.add("ios");
    }
    // Web (handle desktop and PC variants)
    else if (
      lower === "web" ||
      lower === "desktop" ||
      lower === "pc" ||
      lower.includes("desktop") ||
      lower.includes("pc")
    ) {
      normalized.add("web");
    }
    // Mobile → both android and ios
    else if (lower === "mobile") {
      normalized.add("android");
      normalized.add("ios");
    }
    // Skip any other value - ensures we only store android, ios, web
  }
  
  return Array.from(normalized).sort(); // Sort for consistency
}
