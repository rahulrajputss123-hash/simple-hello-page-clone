/**
 * Runtime platform detection for the native (Capacitor) shell vs the web build.
 *
 * `@capacitor/core` is deliberately NOT a dependency of this project — only
 * `capacitor.config.ts` exists, for the Android build workflow. Rather than pull
 * the package in just for one boolean, this reads the `Capacitor` object that the
 * native WebView injects onto `window` before the app bundle runs. That global is
 * exactly what `Capacitor.isNativePlatform()` consults, so behaviour matches; if
 * the package is added later, this keeps working unchanged.
 */

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  /** Present on older Capacitor versions that predate `isNativePlatform`. */
  platform?: string;
};

function getCapacitor(): CapacitorGlobal | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
}

/**
 * True only inside the Capacitor native shell (Android/iOS WebView).
 *
 * Always false during SSR and false in every browser, so web-only UI can be
 * rendered behind this check without affecting the packaged app.
 */
export function isNativePlatform(): boolean {
  const capacitor = getCapacitor();
  if (!capacitor) return false;
  if (typeof capacitor.isNativePlatform === "function") {
    try {
      return capacitor.isNativePlatform();
    } catch {
      return false;
    }
  }
  // Fallback for older injected globals.
  return capacitor.platform === "android" || capacitor.platform === "ios";
}

/**
 * True when running as a normal website.
 *
 * Note this is `false` during SSR as well as in the native shell, because the
 * injected global can't be read on the server. Anything that must not flash the
 * wrong UI should gate on a mounted-on-client flag too — see `useIsWeb`.
 */
export function isWebPlatform(): boolean {
  return typeof window !== "undefined" && !isNativePlatform();
}
