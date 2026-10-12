/**
 * Preview route for the two transitional screens, which are otherwise only
 * visible for a fraction of a second.
 *
 * Toggle between the splash (logo-card corner fix) and the redesigned `/`
 * loading screen. Safe to delete once reviewed.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppLoadingScreen } from "@/components/AppLoadingScreen";
import { SplashScreen } from "@/components/SplashScreen";

export const Route = createFileRoute("/preview-splash")({
  ssr: false,
  component: PreviewSplash,
});

function PreviewSplash() {
  const [view, setView] = useState<"loading" | "splash">("loading");

  return (
    <>
      {view === "splash" ? <SplashScreen loading /> : <AppLoadingScreen />}

      {/* Sits above the splash's z-[100] so it stays reachable. */}
      <div className="fixed inset-x-0 bottom-5 z-[200] flex flex-col items-center gap-2 px-4">
        <button
          type="button"
          onClick={() => setView((v) => (v === "splash" ? "loading" : "splash"))}
          className="rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-lift"
          data-testid="preview-splash-toggle"
        >
          {view === "splash" ? "→ Show loading screen (/)" : "→ Show splash screen"}
        </button>
        <p className="rounded-full bg-card/90 px-3 py-1 text-[11px] text-muted-foreground shadow-soft backdrop-blur">
          Currently viewing:{" "}
          <strong>{view === "splash" ? "SplashScreen" : "AppLoadingScreen"}</strong>
        </p>
      </div>
    </>
  );
}
