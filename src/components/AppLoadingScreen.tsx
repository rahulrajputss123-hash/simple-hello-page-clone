import { BrandMark } from "@/components/AppShell";

/**
 * Brief transitional screen shown on `/` while the session resolves and the
 * router decides where to send the user.
 *
 * Deliberately a continuation of SplashScreen: same jade radial wash, same
 * `.splash-halo` glow and same `.splash-dot` loader, so the two screens read as
 * one moment rather than two different apps. Pure CSS — no extra JS or assets,
 * since this is on the critical path.
 */
export function AppLoadingScreen({ message = "Loading your wallet…" }: { message?: string }) {
  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center"
      data-testid="app-loading-screen"
    >
      {/* Same wash as the splash so the handover is seamless. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 45% at 50% 42%, rgba(34,197,94,0.18) 0%, rgba(15,61,58,0.10) 40%, transparent 75%)",
        }}
      />

      <div className="splash-logo-wrap relative flex flex-col items-center">
        <div className="relative">
          <span
            aria-hidden
            className="splash-halo absolute -inset-4 -z-10 rounded-[40%] blur-2xl"
          />
          <BrandMark className="size-20" />
        </div>

        <h1 className="mt-6 font-display text-[28px] leading-none tracking-tight text-primary">
          CashGPT
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>

        <div className="mt-8 flex items-center gap-2" role="status" aria-label="Loading">
          <span className="splash-dot" />
          <span className="splash-dot" />
          <span className="splash-dot" />
        </div>
      </div>
    </main>
  );
}
