/**
 * Server-side platform detection for offer filtering.
 * 
 * Detects user's device (android/ios/web) from User-Agent header or Capacitor hints.
 * Used to filter offers by compatible devices.
 */

/**
 * Detect user's platform from request context.
 * Returns "android", "ios", or "web".
 * 
 * Detection strategy:
 * 1. Check for Capacitor-Platform header (set by native apps)
 * 2. Parse User-Agent string for mobile OS indicators
 * 3. Default to "web" if no mobile indicators found
 */
export function detectPlatformFromRequest(): "android" | "ios" | "web" {
  // In server context, try to get the request object
  // TanStack Start provides request context via vinxi
  try {
    // Try to access the current request
    const headers = getRequestHeaders();
    
    // Check for Capacitor-Platform header (if native app sets it)
    const capacitorPlatform = headers.get("capacitor-platform") || headers.get("x-capacitor-platform");
    if (capacitorPlatform === "android") return "android";
    if (capacitorPlatform === "ios") return "ios";
    
    // Parse User-Agent
    const userAgent = headers.get("user-agent") || "";
    return detectPlatformFromUserAgent(userAgent);
  } catch {
    // If we can't access headers, default to web
    return "web";
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
 * Get request headers from the current context.
 * Works with Vinxi/TanStack Start server functions.
 */
function getRequestHeaders(): Headers {
  // TanStack Start / Vinxi provides headers through the server function context
  // This is available in createServerFn handlers
  if (typeof globalThis !== "undefined" && "$$requestHeaders" in globalThis) {
    return (globalThis as any).$$requestHeaders;
  }
  
  // Fallback: try to get from AsyncLocalStorage if available
  try {
    const { getEvent } = require("vinxi/http");
    const event = getEvent();
    if (event?.headers) {
      // Convert Node.js IncomingHttpHeaders to Web Headers
      const headers = new Headers();
      Object.entries(event.headers).forEach(([key, value]) => {
        if (value) {
          headers.set(key, Array.isArray(value) ? value[0] : value);
        }
      });
      return headers;
    }
  } catch {
    // vinxi not available or getEvent failed
  }
  
  // Last resort: return empty headers
  return new Headers();
}

/**
 * Filter offers by user's platform.
 * Only returns offers that support the user's device.
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
    
    // Check if user's platform is in the supported devices
    return devices.includes(userPlatform);
  });
}
