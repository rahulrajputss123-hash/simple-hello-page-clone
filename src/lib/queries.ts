import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const offersQuery = (featuredOnly: boolean) => ({
  queryKey: ["offers", featuredOnly],
  queryFn: async () => {
    let q = supabase
      .from("offers")
      .select("*")
      .eq("is_active", true)
      .order("admin_priority", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });
    if (featuredOnly) q = q.eq("is_featured", true);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },
});

export const tasksQuery = () => ({
  queryKey: ["tasks"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw error;
    return data;
  },
});

export const userTasksQuery = (userId?: string) => ({
  queryKey: ["user-tasks", userId],
  enabled: Boolean(userId),
  queryFn: async () => {
    const { data, error } = await supabase.from("user_tasks").select("*");
    if (error) throw error;
    return data;
  },
});

export const offerClaimsQuery = () => ({
  queryKey: ["offer-claims"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("offer_claims")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const useOffers = (featuredOnly: boolean) => useQuery(offersQuery(featuredOnly));
export const useOfferClaims = () => useQuery(offerClaimsQuery());
