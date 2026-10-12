import { Link } from "@tanstack/react-router";
import { Bell, Wallet } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useCountUp } from "@/hooks/useCountUp";
import { formatMoney } from "@/lib/coinquest";
import { avatarById } from "@/lib/onboarding/premium";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BottomNav } from "./BottomNav";
import { RoleSwitcher } from "./marketplace/RoleSwitcher";
import { useRole } from "@/lib/marketplace/role";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-grid place-items-center overflow-hidden rounded-2xl bg-jade-gradient shadow-lift ${className || "size-10"}`}
    >
      <img
        src="/icon-512.png"
        alt="CashGPT"
        className="h-full w-full object-cover"
        loading="eager"
        decoding="async"
      />
    </span>
  );
}

/**
 * Horizontal wordmark lockup. Pass variant="light" for light surfaces (cream/white),
 * variant="dark" for dark/jade surfaces, or omit (default "auto") to swap via `prefers-color-scheme`.
 */
export function BrandLogo({
  variant = "auto",
  className = "",
}: {
  variant?: "light" | "dark" | "auto";
  className?: string;
}) {
  if (variant === "light") {
    return (
      <img
        src="/logo-horizontal-light.png"
        alt="CashGPT — Earn · Complete · Cashout"
        className={`h-auto w-auto select-none ${className}`}
        draggable={false}
        decoding="async"
      />
    );
  }
  if (variant === "dark") {
    return (
      <img
        src="/logo-horizontal-dark.png"
        alt="CashGPT — Earn · Complete · Cashout"
        className={`h-auto w-auto select-none ${className}`}
        draggable={false}
        decoding="async"
      />
    );
  }
  return (
    <picture className={`inline-block ${className}`}>
      <source srcSet="/logo-horizontal-dark.png" media="(prefers-color-scheme: dark)" />
      <img
        src="/logo-horizontal-light.png"
        alt="CashGPT — Earn · Complete · Cashout"
        className="h-auto w-auto select-none"
        draggable={false}
        decoding="async"
      />
    </picture>
  );
}

export function AppHeader({ subtitle, home = false }: { subtitle?: string; home?: boolean }) {
  const { session, profile } = useAuth();
  // Marketplace: only the Home header shows the role chip, and only
  // advertiser mode swaps the wallet pill for the Campaign Balance.
  const { role, overview } = useRole();
  const advertiserMode = home && role === "advertiser";
  const unread = useQuery({
    queryKey: ["notifications-unread", session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);
      return count ?? 0;
    },
  });

  const firstName = (profile?.name ?? "").trim().split(/\s+/)[0] || "there";
  void subtitle;

  const available = Number(profile?.wallet_balance ?? 0) - Number(profile?.held_balance ?? 0);
  // Display-only count-up, once per page load so it doesn't replay on every route change.
  const shownAvailable = useCountUp(available, { onceKey: "header-balance" });

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/97 md:bg-background/85 md:backdrop-blur-md">
      <div className="mx-auto flex min-h-16 w-full max-w-lg items-center justify-between gap-2 px-4 py-3 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link to="/profile" aria-label="Open profile and settings" className="shrink-0">
            <span
              aria-hidden
              data-testid="app-header-avatar"
              className="grid size-10 place-items-center overflow-hidden rounded-full bg-card shadow-soft ring-1 ring-border"
            >
              <img
                src={avatarById(profile?.avatar_url).imageUrl}
                alt=""
                className="size-full object-cover"
                loading="eager"
                decoding="async"
              />
            </span>
          </Link>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="text-xs text-muted-foreground">Hello</span>
            <span className="truncate font-display text-lg leading-tight">{firstName}</span>
            {home && <RoleSwitcher />}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="relative grid size-9 place-items-center rounded-full border border-border bg-card shadow-soft sm:size-10"
          >
            <Bell className="size-4 text-primary" />
            {(unread.data ?? 0) > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unread.data}
              </span>
            )}
          </Link>
          {advertiserMode ? (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              to={"/advertiser/funds" as any}
              aria-label="Campaign balance"
              data-testid="campaign-balance-pill"
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-jade-gradient px-3 py-2 text-primary-foreground shadow-lift"
            >
              <Wallet aria-hidden />
              <span className="text-amount text-sm">
                {formatMoney(overview?.account?.spendable ?? 0)}
              </span>
            </Link>
          ) : (
            <Link
              id="tour-wallet-balance"
              to="/wallet"
              aria-label="Campaign balance"
              data-testid="campaign-balance-pill"
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-gold-gradient px-3 py-2 text-gold-foreground shadow-gold"
            >
              <Wallet aria-hidden />
              <span className="text-amount text-sm">{formatMoney(shownAvailable)}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function AppShell({
  children,
  subtitle,
  hideNav = false,
  home = false,
  bgClass = "",
  mainClass = "",
}: {
  children: React.ReactNode;
  subtitle?: string;
  hideNav?: boolean;
  /** Home screen header: role switcher chip. */
  home?: boolean;
  /**
   * Optional per-screen background treatment on the shell root (e.g. the Home
   * hero wash). Purely decorative — layout and spacing are unchanged.
   */
  bgClass?: string;
  /** Optional per-screen entrance class on <main> (e.g. a page fade-in). */
  mainClass?: string;
}) {
  return (
    <div className={`min-h-screen bg-background pb-24 ${bgClass}`}>
      <AppHeader {...(subtitle ? { subtitle } : {})} home={home} />
      <main className={`mx-auto w-full max-w-lg px-4 py-4 ${mainClass}`}>{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
