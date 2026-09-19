import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Edit3, FileText, Settings, Shield, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { signOutEverywhere, useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/coinquest";
import { AVATAR_OPTIONS, avatarById } from "@/lib/onboarding/premium";

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
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    name: profile?.name ?? "",
    avatar: profile?.avatar_url ?? "nova",
    gender: (profile as { gender?: string } | null)?.gender ?? "",
    dob: (profile as { date_of_birth?: string | null } | null)?.date_of_birth ?? "",
  });

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: draft.name.trim(),
          avatar_url: draft.avatar,
          gender: draft.gender || null,
          date_of_birth: draft.dob || null,
        } as never)
        .eq("id", session!.user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      setEditing(false);
      toast.success("Profile updated.");
    },
    onError: () => toast.error("Couldn't update your profile."),
  });

  const savePref = useMutation({
    mutationFn: async (values: { push_enabled?: boolean; language?: string }) => {
      const { error } = await supabase.from("profiles").update(values).eq("id", session!.user.id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["profile"] }),
    onError: () => toast.error("Couldn't save that setting."),
  });

  return (
    <AppShell subtitle="Profile" mainClass="page-fade-in">
      <section
        className="surface-card mt-2 flex items-center gap-3 p-4"
        data-testid="profile-summary-card"
      >
        <span
          className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl"
          data-testid="profile-avatar-preview"
        >
          <img
            src={avatarById(profile?.avatar_url).imageUrl}
            alt=""
            className="size-full object-cover"
          />
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
        <Button
          size="sm"
          variant="outline"
          className="ml-auto gap-1.5"
          onClick={() => {
            setDraft({
              name: profile?.name ?? "",
              avatar: profile?.avatar_url ?? "nova",
              gender: (profile as { gender?: string } | null)?.gender ?? "",
              dob: (profile as { date_of_birth?: string | null } | null)?.date_of_birth ?? "",
            });
            setEditing(true);
          }}
          data-testid="profile-edit-button"
        >
          <Edit3 className="size-3.5" /> Edit
        </Button>
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

      <SectionHeading
        variant="ribbon"
        icon={Settings}
        iconSrc="/icons/icon-profile.png"
        title="Settings"
      />
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
        <img src="/icons/icon-logout.png" alt="" aria-hidden className="size-6 object-contain" />{" "}
        Sign out
      </Button>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Avatar</Label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    type="button"
                    key={avatar.id}
                    onClick={() => setDraft({ ...draft, avatar: avatar.id })}
                    className={`relative aspect-square overflow-hidden rounded-xl ${draft.avatar === avatar.id ? "ring-2 ring-gold ring-offset-2" : ""}`}
                    data-testid={`profile-avatar-${avatar.id}`}
                  >
                    <img
                      src={avatar.imageUrl}
                      alt={avatar.name}
                      className="size-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-display-name">Display name</Label>
              <Input
                id="profile-display-name"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                data-testid="profile-display-name-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="profile-gender">Gender</Label>
                <select
                  id="profile-gender"
                  value={draft.gender}
                  onChange={(event) => setDraft({ ...draft, gender: event.target.value })}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  data-testid="profile-gender-input"
                >
                  <option value="">Prefer not to say</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="non_binary">Non-binary</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-dob">Date of birth</Label>
                <Input
                  id="profile-dob"
                  type="date"
                  value={draft.dob}
                  onChange={(event) => setDraft({ ...draft, dob: event.target.value })}
                  data-testid="profile-dob-input"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditing(false)}
              data-testid="profile-edit-cancel"
            >
              Cancel
            </Button>
            <Button
              variant="jade"
              disabled={saveProfile.isPending || draft.name.trim().length < 2}
              onClick={() => saveProfile.mutate()}
              data-testid="profile-edit-save"
            >
              {saveProfile.isPending ? "Saving…" : "Save profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
