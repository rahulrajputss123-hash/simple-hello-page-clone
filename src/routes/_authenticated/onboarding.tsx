import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BrandLogo } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDeviceId } from "@/lib/ads";
import { useAuth } from "@/lib/auth";
import { completeOnboarding } from "@/lib/coinquest.functions";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your account — CashGPT" },
      { name: "description", content: "Add your name and phone to start earning with CashGPT." },
      { property: "og:title", content: "Set up your account — CashGPT" },
      {
        property: "og:description",
        content: "Add your name and phone to start earning with CashGPT.",
      },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const save = useServerFn(completeOnboarding);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (profile?.onboarded) void navigate({ to: "/home", replace: true });
  }, [profile?.onboarded, navigate]);

  const mutation = useMutation({
    mutationFn: async () =>
      save({
        data: {
          name: name.trim(),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
          deviceId: getDeviceId(),
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("You're all set!");
      void navigate({ to: "/home", replace: true });
    },
    onError: () => toast.error("Could not save your details. Try again."),
  });

  return (
    <main className="auth-bg relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 overflow-hidden px-5 py-10">
      <div className="relative flex flex-col items-center gap-3 text-center">
        <div className="splash-logo-wrap relative">
          <span aria-hidden className="splash-halo absolute inset-0 -z-10 rounded-[36%] blur-2xl" />
          <BrandLogo variant="light" className="h-auto w-[200px] drop-shadow-md" />
        </div>
        <h1 className="font-display text-2xl">Almost there</h1>
        <p className="text-sm text-muted-foreground">
          Tell us who you are so we can send your rewards to the right place.
        </p>
      </div>

      <form
        className="surface-card auth-card-in relative space-y-4 p-5 shadow-lift"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim().length < 2) {
            toast.error("Please enter your full name.");
            return;
          }
          mutation.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            placeholder="Aditi Sharma"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input
            id="phone"
            value={phone}
            maxLength={30}
            inputMode="tel"
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 90000 00000"
          />
        </div>
        <Button type="submit" variant="jade" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving…" : "Start earning"}
        </Button>
      </form>
    </main>
  );
}
