import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { RoleProvider } from "@/lib/marketplace/role";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // Read the persisted session first: getUser() alone hits the network and a
    // transient failure (or a not-yet-restored session) bounced signed-in users
    // to /auth, which then sent them back — the redirect loop.
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session?.user) return { user: sessionData.session.user };

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => (
    <RoleProvider>
      <Outlet />
    </RoleProvider>
  ),
});
