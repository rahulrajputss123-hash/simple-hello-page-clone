import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useEffect } from "react";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { EmptyState } from "@/components/States";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDateTime } from "@/lib/coinquest";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — CashGPT" },
      { name: "description", content: "Payout, quest and account updates." },
      { property: "og:title", content: "Notifications — CashGPT" },
      { property: "og:description", content: "Payout, quest and account updates." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const notifications = useQuery({
    queryKey: ["notifications", session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!session || !notifications.data?.some((n) => !n.is_read)) return;
    void supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", session.user.id)
      .eq("is_read", false)
      .then(() => queryClient.invalidateQueries({ queryKey: ["notifications-unread"] }));
  }, [session, notifications.data, queryClient]);

  return (
    <AppShell subtitle="Notifications">
      <SectionHeading size="page" icon={Bell} title="Notifications" />
      {!notifications.data?.length ? (
        <EmptyState
          icon={Bell}
          title="Nothing here yet"
          description="Quest rewards and payout updates will show up here."
        />
      ) : (
        <ul className="space-y-2">
          {notifications.data.map((item) => (
            <li key={item.id} className="surface-card p-3">
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.body}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {formatDateTime(item.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
