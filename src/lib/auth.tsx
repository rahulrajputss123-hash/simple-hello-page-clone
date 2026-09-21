import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { getDeviceId } from "@/lib/ads";
import { ensureProfile } from "@/lib/coinquest.functions";

export type Profile = Tables<"profiles">;

type AuthValue = {
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  profileLoading: boolean;
  isAdmin: boolean;
};

/** Exported so preview routes can mount real screens with a mock session. */
export const AuthContext = createContext<AuthValue>({
  session: null,
  loading: true,
  profile: null,
  profileLoading: false,
  isAdmin: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      setLoading(false);
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        queryClient.invalidateQueries();
      }
      if (event === "SIGNED_OUT") queryClient.clear();
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  const userId = session?.user.id;

  const profileQuery = useQuery({
    queryKey: ["profile", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId!).maybeSingle();
      if (data) return data;
      // First sign-in: create the profile row (wallet, referral code, device id).
      const referralCode =
        typeof window !== "undefined"
          ? (window.localStorage.getItem("coinquest.ref") ?? undefined)
          : undefined;
      return (await ensureProfile({
        data: { deviceId: getDeviceId(), ...(referralCode ? { referralCode } : {}) },
      })) as Profile;
    },
  });

  const rolesQuery = useQuery({
    queryKey: ["roles", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId!);
      return data ?? [];
    },
  });

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        profile: profileQuery.data ?? null,
        profileLoading: profileQuery.isLoading,
        isAdmin: (rolesQuery.data ?? []).some((r) => r.role === "admin"),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export async function signOutEverywhere(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.cancelQueries();
  queryClient.clear();
  await supabase.auth.signOut();
}
