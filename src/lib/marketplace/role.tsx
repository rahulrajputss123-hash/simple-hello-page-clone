import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { useAuth } from "@/lib/auth";
import { getAdvertiserOverview } from "@/lib/marketplace.functions";
import type { AdvertiserOverview } from "@/lib/marketplace/advertiser.server";

/**
 * Publisher ⇄ Advertiser mode.
 *
 * Phase 2: backed by the real advertiser account. `advertiserActivated` is
 * "this user has an advertiser_accounts row"; the selected mode is remembered
 * per device in localStorage. Advertiser mode is only reachable once the
 * account exists — a stale "advertiser" preference falls back to publisher.
 */
export type MarketplaceRole = "publisher" | "advertiser";

const STORAGE_KEY = "cashgpt.marketplace.role";

type RoleValue = {
  role: MarketplaceRole;
  setRole: (role: MarketplaceRole) => void;
  /** True once the user has an advertiser account. */
  advertiserActivated: boolean;
  /** Full dashboard payload (null until loaded or when the marketplace isn't available). */
  overview: AdvertiserOverview | null;
  overviewLoading: boolean;
  /** False when the marketplace schema isn't reachable (Phase 1 not applied / server error). */
  marketplaceAvailable: boolean;
  refreshOverview: () => Promise<void>;
};

const RoleContext = createContext<RoleValue>({
  role: "publisher",
  setRole: () => {},
  advertiserActivated: false,
  overview: null,
  overviewLoading: false,
  marketplaceAvailable: false,
  refreshOverview: async () => {},
});

export const advertiserOverviewKey = (userId: string | undefined) => ["advertiser-overview", userId] as const;

function readStoredRole(): MarketplaceRole {
  if (typeof window === "undefined") return "publisher";
  return window.localStorage.getItem(STORAGE_KEY) === "advertiser" ? "advertiser" : "publisher";
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const fetchOverview = useServerFn(getAdvertiserOverview);
  const [preferred, setPreferred] = useState<MarketplaceRole>("publisher");

  useEffect(() => {
    setPreferred(readStoredRole());
  }, []);

  const overviewQuery = useQuery({
    queryKey: advertiserOverviewKey(userId),
    queryFn: () => fetchOverview(),
    enabled: Boolean(userId),
    staleTime: 15_000,
    retry: 1,
  });

  const overview = overviewQuery.data ?? null;
  const advertiserActivated = Boolean(overview?.account);
  const marketplaceAvailable = !overviewQuery.isError && (overviewQuery.isPending || Boolean(overview));
  const role: MarketplaceRole = preferred === "advertiser" && advertiserActivated ? "advertiser" : "publisher";

  const setRole = useCallback((next: MarketplaceRole) => {
    setPreferred(next);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const refreshOverview = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: advertiserOverviewKey(userId) });
  }, [queryClient, userId]);

  const value = useMemo<RoleValue>(
    () => ({
      role,
      setRole,
      advertiserActivated,
      overview,
      overviewLoading: Boolean(userId) && overviewQuery.isPending,
      marketplaceAvailable,
      refreshOverview,
    }),
    [role, setRole, advertiserActivated, overview, userId, overviewQuery.isPending, marketplaceAvailable, refreshOverview],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  return useContext(RoleContext);
}