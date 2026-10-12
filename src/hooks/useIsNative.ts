import { useEffect, useLayoutEffect, useState } from "react";

import { isNativePlatform } from "@/lib/platform";

/** `useLayoutEffect` warns during SSR, so fall back to `useEffect` on the server. */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * True inside the Capacitor native shell, false on the web.
 *
 * Starts `false` so the server render and the first client render agree — the
 * Capacitor global is injected into the WebView and can't be read during SSR, and
 * assuming "web" is what lets the marketing landing be server-rendered for search
 * engines. On native it corrects in a layout effect, which runs before the browser
 * paints, so the packaged app never shows a frame of web-only UI.
 */
export function useIsNative(): boolean {
  const [native, setNative] = useState(false);

  useIsomorphicLayoutEffect(() => {
    setNative(isNativePlatform());
  }, []);

  return native;
}
