import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRight, FileText, LogOut, Settings, Shield, Wallet } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { signOutEverywhere, useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/coinquest";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — CashGPT" },
      { name: "description", content: "Manage your CashGPT account, wallet and settings." },
      { property: "og:title", content: "Profile — CashGPT" },
      {
        property: "og:description",
        content: "Manage your CashGPT account, wallet and settings.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { session, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const savePref = useMutation({
    mutationFn: async (values: { push_enabled?: boolean; language?: string }) => {
      const { error } = await supabase.from("profiles").update(values).eq("id", session!.user.id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["profile"] }),
    onError: () => toast.error("Couldn't save that setting."),
  });

  return (
    <AppShell subtitle="Profile">
      <section className="surface-card mt-2 flex items-center gap-3 p-4">
        <span className="grid size-14 place-items-center rounded-2xl bg-jade-gradient font-display text-2xl text-primary-foreground">
          {(profile?.name ?? "C").slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{profile?.name ?? "CashGPT user"}</p>
          <p className="truncate text-xs text-muted-foreground">
            {profile?.email ?? session?.user.email}
          </p>
          {profile?.referral_code && (
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-background-alt px-2 py-0.5 text-[11px] font-semibold">
              Code {profile.referral_code}
            </p>
          )}
        </div>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="surface-card p-3">
          <p className="text-xs text-muted-foreground">Lifetime earned</p>
          <p className="text-amount text-lg">{formatMoney(profile?.lifetime_earned)}</p>
        </div>
        <div className="surface-card p-3">
          <p className="text-xs text-muted-foreground">Withdrawn</p>
          <p className="text-amount text-lg">{formatMoney(profile?.lifetime_withdrawn)}</p>
        </div>
      </div>

      <SectionHeading icon={Settings} title="Settings" />
      <div className="surface-card divide-y divide-border">
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="font-semibold">Push notifications</p>
            <p className="text-xs text-muted-foreground">Payout and quest alerts</p>
          </div>
          <Switch
            checked={profile?.push_enabled ?? true}
            onCheckedChange={(checked) => savePref.mutate({ push_enabled: checked })}
          />
        </div>
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="font-semibold">Language</p>
            <p className="text-xs text-muted-foreground">App display language</p>
          </div>
          <select
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
            value={profile?.language ?? "en"}
            onChange={(event) => savePref.mutate({ language: event.target.value })}
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="es">Español</option>
          </select>
        </div>
        <button
          className="flex w-full items-center justify-between p-4 text-left"
          onClick={() => navigate({ to: "/wallet" })}
        >
          <span className="flex items-center gap-2 font-semibold">
            <Wallet className="size-4 text-primary" /> Wallet & payouts
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
        <button
          className="flex w-full items-center justify-between p-4 text-left"
          onClick={() => navigate({ to: "/legal/terms" })}
        >
          <span className="flex items-center gap-2 font-semibold">
            <FileText className="size-4 text-primary" /> Legal & policies
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
        {isAdmin && (
          <button
            className="flex w-full items-center justify-between p-4 text-left"
            onClick={() => navigate({ to: "/admin" })}
          >
            <span className="flex items-center gap-2 font-semibold">
              <Shield className="size-4 text-primary" /> Admin panel
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        )}
      </div>

      <Button
        variant="outline"
        className="mt-4 w-full gap-2"
        onClick={async () => {
          await signOutEverywhere(queryClient);
          navigate({ to: "/auth", replace: true });
        }}
      >
        <LogOut className="size-4" /> Sign out
      </Button>
    </AppShell>
  );
}
