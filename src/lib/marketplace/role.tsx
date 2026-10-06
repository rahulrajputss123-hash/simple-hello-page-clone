import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { useAuth } from "@/lib/auth";
import { getAdvertiserOverview, getPreferredRole, setPreferredRole } from "@/lib/marketplace.functions";
import type { AdvertiserOverview } from "@/lib/marketplace/advertiser.server";
import { safeStorage } from "@/lib/safe-storage";

/**
 * Publisher ⇄ Advertiser mode.
 *
 * Phase 2+7: backed by the real advertiser account. `advertiserActivated` is
 * "this user has an advertiser_accounts row"; the selected mode is persisted
 * to the database (profiles.preferred_role) and remembered per device in
 * localStorage as fallback. Advertiser mode is only reachable once the
 * account exists — a stale "advertiser" preference falls back to publisher.
 */
export type MarketplaceRole = "publisher" | "advertiser";

const STORAGE_KEY = "cashgpt.marketplace.role";

const preferredRoleQueryKey = (userId: string | undefined) => ["preferred-role", userId] as const;

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
  return safeStorage.getItem(STORAGE_KEY) === "advertiser" ? "advertiser" : "publisher";
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const fetchOverview = useServerFn(getAdvertiserOverview);
  const fetchPreferredRole = useServerFn(getPreferredRole);
  const savePreferredRole = useServerFn(setPreferredRole);
  const [preferred, setPreferred] = useState<MarketplaceRole>(readStoredRole);

  // Load preferred role from database on mount
  const preferredRoleQuery = useQuery({
    queryKey: preferredRoleQueryKey(userId),
    queryFn: () => fetchPreferredRole(),
    enabled: Boolean(userId),
    staleTime: Infinity, // Only load once per session
    retry: false,
  });

  // Sync database preference into state once loaded
  useEffect(() => {
    if (preferredRoleQuery.data?.preferredRole) {
      setPreferred(preferredRoleQuery.data.preferredRole);
      // Also sync to localStorage for offline fallback
      if (typeof window !== "undefined") {
        safeStorage.setItem(STORAGE_KEY, preferredRoleQuery.data.preferredRole);
      }
    }
  }, [preferredRoleQuery.data]);

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

  const setRole = useCallback(
    async (next: MarketplaceRole) => {
      setPreferred(next);
      // Persist to database
      if (userId) {
        try {
          await savePreferredRole({ role: next });
        } catch (err) {
          console.error("Failed to persist role preference:", err);
        }
      }
      // Also persist to localStorage as fallback
      if (typeof window !== "undefined") {
        safeStorage.setItem(STORAGE_KEY, next);
      }
    },
    [userId, savePreferredRole],
  );

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