import { useEffect, useState } from "react";

import { BrandLogo } from "@/components/AppShell";

/**
 * Full-screen splash shown while the initial auth/session check is in-flight.
 * Fades out once `loading` becomes false so the first real screen cross-fades in.
 */
export function SplashScreen({ loading }: { loading: boolean }) {
  const [visible, setVisible] = useState(true);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!loading) {
      // Kick off the exit fade, then fully unmount after the transition.
      const fadeTimer = setTimeout(() => setVisible(false), 60);
      const unmountTimer = setTimeout(() => setHidden(true), 560);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(unmountTimer);
      };
    }
    setVisible(true);
    setHidden(false);
    return undefined;
  }, [loading]);

  if (hidden) return null;

  return (
    <div
      aria-hidden={!loading}
      data-testid="splash-screen"
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-500 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {/* Soft radial jade glow behind the logo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 45% at 50% 42%, rgba(34,197,94,0.18) 0%, rgba(15,61,58,0.10) 40%, transparent 75%)",
        }}
      />

      <div className="relative flex flex-col items-center gap-6">
        <div className="splash-logo-wrap relative">
          <span
            aria-hidden
            className="splash-halo absolute inset-0 -z-10 rounded-[36%] blur-2xl"
          />
          <BrandLogo variant="light" className="h-auto w-[220px] drop-shadow-lg" />
        </div>

        <div className="splash-dots flex items-center gap-2" aria-label="Loading">
          <span className="splash-dot" />
          <span className="splash-dot" />
          <span className="splash-dot" />
        </div>
      </div>
    </div>
  );
}
