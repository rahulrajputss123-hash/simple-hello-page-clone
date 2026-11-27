/**
 * Push notification network configurations
 * Script URLs are placeholders - to be filled in with actual network scripts
 */

export type PushNetwork = "none" | "propush" | "evadav" | "rollerads";

export const PUSH_NETWORK_SCRIPTS: Record<PushNetwork, string> = {
  none: "",
  propush: "", // TODO: Add ProPush script URL
  evadav: "", // TODO: Add Evadav script URL
  rollerads: "", // TODO: Add RollerAds script URL
};

/**
 * Check if browser supports push notifications
 */
export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | null {
  if (!isPushSupported()) return null;
  return Notification.permission;
}

/**
 * Inject push network script dynamically
 */
export function injectPushScript(network: PushNetwork): Promise<void> {
  return new Promise((resolve, reject) => {
    const scriptSrc = PUSH_NETWORK_SCRIPTS[network];
    
    if (!scriptSrc) {
      resolve(); // No script to inject
      return;
    }

    // Check if script already exists
    if (document.querySelector(`script[src="${scriptSrc}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = scriptSrc;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load push script: ${network}`));
    document.head.appendChild(script);
  });
}
