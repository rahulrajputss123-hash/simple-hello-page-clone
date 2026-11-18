/**
 * Client-side analytics tracker
 * 
 * Lightweight event tracking with batching, no-throw guarantee, and privacy-first design.
 * - Batches events in memory, flushes every 5 seconds or when 10 events queued
 * - Uses sendBeacon on visibility change to hidden
 * - Stores anon_id in localStorage (random UUID)
 * - Detects device type only (android, ios, desktop) - no fingerprinting
 * - Captures page path only (no query strings or tokens)
 * - Never includes PII (email, phone, IP, auth tokens)
 */

// Analytics feature flag - set to false to disable all tracking
const ANALYTICS_ENABLED = false;

type EventProperties = Record<string, unknown>;

interface QueuedEvent {
  event_name: string;
  properties: EventProperties;
  page: string;
  device: string;
  timestamp: number;
}

class AnalyticsTracker {
  private queue: QueuedEvent[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private anonId: string | null = null;
  private isInitialized = false;
  private readonly BATCH_SIZE = 10;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds
  private readonly ENDPOINT = "/api/analytics/track";

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize();
    }
  }

  private initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      // Get or create anonymous ID
      this.anonId = this.getOrCreateAnonId();

      // Flush on visibility change to hidden
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          this.flush(true); // use sendBeacon
        }
      });

      // Flush before unload as last resort
      window.addEventListener("beforeunload", () => {
        this.flush(true);
      });
    } catch (err) {
      // Never throw, just log
      console.warn("[analytics] initialization failed:", err);
    }
  }

  private getOrCreateAnonId(): string {
    try {
      const stored = localStorage.getItem("anon_id");
      if (stored) return stored;

      // Generate random UUID v4
      const uuid = crypto.randomUUID();
      localStorage.setItem("anon_id", uuid);
      return uuid;
    } catch {
      // If localStorage fails, generate ephemeral ID
      return crypto.randomUUID();
    }
  }

  private detectDevice(): string {
    try {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes("android")) return "android";
      if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) return "ios";
      return "desktop";
    } catch {
      return "desktop";
    }
  }

  private getCurrentPage(): string {
    try {
      // Get pathname only, strip query strings and hash
      const path = window.location.pathname;
      return path || "/";
    } catch {
      return "/";
    }
  }

  private sanitizeProperties(properties: EventProperties): EventProperties {
    try {
      // Create a shallow copy and remove any potentially sensitive keys
      const sanitized: EventProperties = {};
      const blockedKeys = [
        "email", "phone", "password", "token", "secret", "key",
        "ip", "ipaddress", "ip_address", "authorization", "auth"
      ];

      for (const [key, value] of Object.entries(properties)) {
        const lowerKey = key.toLowerCase();
        
        // Skip blocked keys
        if (blockedKeys.some(blocked => lowerKey.includes(blocked))) {
          continue;
        }

        // Skip if value looks like an email
        if (typeof value === "string" && value.includes("@") && value.includes(".")) {
          continue;
        }

        // Skip if value looks like a phone number (10+ digits)
        if (typeof value === "string" && /\d{10,}/.test(value)) {
          continue;
        }

        sanitized[key] = value;
      }

      return sanitized;
    } catch {
      return {};
    }
  }

  /**
   * Track an event
   * @param eventName - Name of the event (must be in allow-list on server)
   * @param properties - Optional event properties (max 2KB, no PII)
   */
  track(eventName: string, properties: EventProperties = {}): void {
    try {
      if (!eventName || typeof eventName !== "string") {
        console.warn("[analytics] invalid event name:", eventName);
        return;
      }

      const sanitized = this.sanitizeProperties(properties);
      
      const event: QueuedEvent = {
        event_name: eventName,
        properties: sanitized,
        page: this.getCurrentPage(),
        device: this.detectDevice(),
        timestamp: Date.now(),
      };

      this.queue.push(event);

      // Auto-flush if batch size reached
      if (this.queue.length >= this.BATCH_SIZE) {
        this.flush(false);
      } else {
        // Schedule flush if not already scheduled
        this.scheduleFlush();
      }
    } catch (err) {
      // Never throw
      console.warn("[analytics] track failed:", err);
    }
  }

  private scheduleFlush() {
    if (this.flushTimer !== null) return;

    this.flushTimer = setTimeout(() => {
      this.flush(false);
    }, this.FLUSH_INTERVAL);
  }

  private flush(useBeacon: boolean) {
    try {
      if (this.queue.length === 0) return;

      const events = this.queue.splice(0); // Take all queued events
      if (this.flushTimer !== null) {
        clearTimeout(this.flushTimer);
        this.flushTimer = null;
      }

      const payload = {
        anon_id: this.anonId,
        events: events.map(e => ({
          event_name: e.event_name,
          properties: e.properties,
          page: e.page,
          device: e.device,
        })),
      };

      const body = JSON.stringify(payload);

      // Use sendBeacon if requested and available (for page unload)
      if (useBeacon && typeof navigator.sendBeacon === "function") {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(this.ENDPOINT, blob);
        return;
      }

      // Otherwise use fetch with keepalive
      fetch(this.ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(err => {
        // Never throw, just log
        console.warn("[analytics] flush failed:", err);
      });
    } catch (err) {
      console.warn("[analytics] flush error:", err);
    }
  }
}

// Singleton instance
let tracker: AnalyticsTracker | null = null;

/**
 * Track an analytics event
 * @param eventName - Name of the event
 * @param properties - Optional event properties
 */
export function track(eventName: string, properties?: EventProperties): void {
  // Early return if analytics disabled
  if (!ANALYTICS_ENABLED) return;
  
  if (typeof window === "undefined") return; // SSR safety

  if (!tracker) {
    tracker = new AnalyticsTracker();
  }

  tracker.track(eventName, properties);
}
