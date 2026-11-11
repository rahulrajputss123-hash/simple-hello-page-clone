/**
 * Server-side platform detection for offer filtering.
 * 
 * Detects user's device (android/ios/web) from User-Agent header or Capacitor hints.
 * Used to filter offers by compatible devices.
 */

/**
 * Detect user's platform from request context.
 * Returns "android", "ios", "web", or null if unknown.
 * 
 * Detection strategy:
 * 1. Check for Capacitor-Platform header (set by native apps)
 * 2. Parse User-Agent string for mobile OS indicators
 * 3. Return null if headers cannot be read (unknown platform)
 */
export async function detectPlatformFromRequest(): Promise<"android" | "ios" | "web" | null> {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    
    if (!request) {
      console.log("[platform] detected=null ua=no request object");
      return null;
    }
    
    // Check for Capacitor-Platform header (if native app sets it)
    const capacitorPlatform = request.headers.get("capacitor-platform") || request.headers.get("x-capacitor-platform");
    if (capacitorPlatform === "android") {
      const ua = (request.headers.get("user-agent") || "").slice(0, 80);
      console.log(`[platform] detected=android ua=${ua}`);
      return "android";
    }
    if (capacitorPlatform === "ios") {
      const ua = (request.headers.get("user-agent") || "").slice(0, 80);
      console.log(`[platform] detected=ios ua=${ua}`);
      return "ios";
    }
    
    // Parse User-Agent
    const userAgent = request.headers.get("user-agent") || "";
    const platform = detectPlatformFromUserAgent(userAgent);
    const ua = userAgent.slice(0, 80);
    console.log(`[platform] detected=${platform} ua=${ua}`);
    return platform;
  } catch (err) {
    // If we can't access headers, return null (unknown)
    console.log(`[platform] detected=null ua=error: ${err instanceof Error ? err.message : "unknown"}`);
    return null;
  }
}

/**
 * Detect platform from User-Agent string.
 * Public for testing.
 */
export function detectPlatformFromUserAgent(userAgent: string): "android" | "ios" | "web" {
  const ua = userAgent.toLowerCase();
  
  // Check for Android
  if (ua.includes("android")) {
    return "android";
  }
  
  // Check for iOS (iPhone, iPad, iPod)
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) {
    return "ios";
  }
  
  // Default to web for desktop browsers and unknown platforms
  return "web";
}

/**
 * Filter offers by user's platform.
 * Only returns offers that support the user's device.
 * 
 * Normalizes device values before filtering (e.g., "All" → []).
 * 
 * @param offers - List of offers to filter
 * @param userPlatform - User's platform (android/ios/web)
 * @returns Filtered list of compatible offers
 */
export function filterOffersByPlatform<T extends { devices?: string[] | null }>(
  offers: T[],
  userPlatform: "android" | "ios" | "web",
): T[] {
  return offers.filter((offer) => {
    const devices = offer.devices;
    
    // If no device info, assume offer works everywhere
    if (!devices || devices.length === 0) {
      return true;
    }
    
    // Normalize "All" (case-insensitive) to empty array (works everywhere)
    const hasAll = devices.some(d => d.toLowerCase() === "all");
    if (hasAll) {
      return true;
    }
    
    // Check if user's platform is in the supported devices
    return devices.includes(userPlatform);
  });
}
